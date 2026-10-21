import type { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { getCurrentAuthUser, subscribeToAuthChanges } from './authService';
import { getRandomAvatarPreset } from '../constants/avatarPresets';
import type { CanvasComment, CanvasElement } from '../types/studio';

export interface RemotePeer {
  sessionId?: string;
  userId: string;
  name: string;
  avatarId: string;
  avatarColor: string;
  activeSlideIndex: number;
  selectedElementId: string | null;
  cursorXPercent: number; // 0 - 100, -1 if hidden/out of canvas
  cursorYPercent: number; // 0 - 100, -1 if hidden/out of canvas
  lastActive: number;
  onlineAt: string;
}

export interface MultiplayerState {
  isConnected: boolean;
  roomId: string;
  peers: RemotePeer[];
  activeUsersCount: number;
}

export interface RemoteElementUpdatePayload {
  sessionId?: string;
  userId: string;
  slideIndex: number;
  elementId: string;
  updates: Partial<CanvasElement>;
  timestamp: number;
}

export interface CanvasStateSyncPayload {
  sessionId?: string;
  userId: string;
  senderName: string;
  projectId?: string;
  projectTitle: string;
  aspectRatio: string;
  activeThemeId: string;
  themeOverride?: any;
  branding: any;
  scriptText: string;
  slides: any[];
  activeSlideIndex: number;
  timestamp: number;
}

const GUEST_STORAGE_KEY = 'arune_collab_guest_v1';

function getOrCreateGuestIdentity(): { id: string; name: string; avatarId: string; avatarColor: string } {
  try {
    const raw = sessionStorage.getItem(GUEST_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }

  const preset = getRandomAvatarPreset();
  const guestNum = Math.floor(100 + Math.random() * 900);
  const guest = {
    id: `guest_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`,
    name: `Desainer Tamu #${guestNum}`,
    avatarId: preset.id,
    avatarColor: preset.bgColor,
  };

  try {
    sessionStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(guest));
  } catch {
    // ignore
  }
  return guest;
}

class MultiplayerService {
  private currentRoomId = 'project_default';
  private channel: RealtimeChannel | null = null;
  private localBroadcastBus: BroadcastChannel | null = null;
  private peersMap = new Map<string, RemotePeer>();
  private listeners: Array<(state: MultiplayerState) => void> = [];
  private cursorRafId: number | null = null;
  private elementUpdateListeners: Array<(event: RemoteElementUpdatePayload) => void> = [];
  private canvasStateListeners: Array<(event: CanvasStateSyncPayload) => void> = [];
  private canvasStateRequestListeners: Array<(requestorUserId: string) => void> = [];
  private commentsListeners: Array<(comments: CanvasComment[]) => void> = [];

  private isConnected = false;
  private mySessionId = `sess_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
  private myUserId = '';
  private myName = '';
  private myAvatarId = 'avatar-sage';
  private myAvatarColor = '#5E887E';
  private mySlideIndex = 0;
  private mySelectedElementId: string | null = null;

  private lastCursorSendTime = 0;
  private throttleIntervalMs = 16; // ~60 fps realtime cursor tracking
  private cleanupTimer: any = null;
  private heartbeatTimer: any = null;
  private reconnectTimer: any = null;
  private lastCanvasBroadcastTime = 0;
  private pendingCanvasBroadcastTimer: any = null;
  private lastElementUpdateTimes = new Map<string, number>();
  private pendingElementUpdateTimers = new Map<string, any>();

  constructor() {
    this.refreshUserIdentity();

    // Listen for auth changes (e.g. login, logout, avatar change)
    subscribeToAuthChanges(() => {
      this.refreshUserIdentity();
      this.updatePresence();
    });

    // Cleanup peers that have been offline/disconnected for > 2 minutes
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      let changed = false;
      this.peersMap.forEach((peer, peerId) => {
        // Only remove peer completely if completely silent for > 2 minutes
        if (now - peer.lastActive > 120000) {
          this.peersMap.delete(peerId);
          changed = true;
        }
      });
      if (changed) {
        this.notifyState();
      }
    }, 15000);

    // Periodic heartbeat every 10s to keep presence alive across tabs & clients
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.updatePresence();
      }
    }, 10000);
  }

  private refreshUserIdentity() {
    const authUser = getCurrentAuthUser();
    if (authUser) {
      this.myUserId = authUser.id;
      this.myName = authUser.name || 'Member Tim';
      this.myAvatarId = authUser.avatarId || 'avatar-sage';
      this.myAvatarColor = authUser.avatarColor || '#5E887E';
    } else {
      const guest = getOrCreateGuestIdentity();
      this.myUserId = guest.id;
      this.myName = guest.name;
      this.myAvatarId = guest.avatarId;
      this.myAvatarColor = guest.avatarColor;
    }
  }

  public getMyIdentity() {
    return {
      userId: this.myUserId,
      name: this.myName,
      avatarId: this.myAvatarId,
      avatarColor: this.myAvatarColor,
    };
  }

  public connectToRoom(roomId: string = 'project_default', forceReconnect = false) {
    if (!forceReconnect && this.currentRoomId === roomId && this.channel && this.isConnected) {
      return;
    }

    this.disconnect();
    this.currentRoomId = roomId;
    this.peersMap.clear();

    // 1. Initialize local Inter-Tab BroadcastChannel
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.localBroadcastBus = new BroadcastChannel(`arune_collab_bus_${roomId}`);
        this.localBroadcastBus.onmessage = (event) => {
          this.handleIncomingMessage(event.data);
        };
      }
    } catch (e) {
      console.warn('Local BroadcastChannel not supported:', e);
    }

    // 2. Initialize Supabase Realtime Channel
    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      const channelName = `collab_room_${roomId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
      this.channel = client.channel(channelName, {
        config: {
          presence: { key: this.mySessionId },
          broadcast: { ack: false, self: false },
        },
      });

      // Handle Presence Sync & Join/Leave
      this.channel
        .on('presence', { event: 'sync' }, () => {
          const presenceState = this.channel?.presenceState() || {};
          this.syncPresenceState(presenceState);
        })
        .on('presence', { event: 'join' }, ({ newPresences }) => {
          newPresences.forEach((p: any) => {
            const peerKey = p.sessionId || p.userId;
            if (peerKey && p.sessionId !== this.mySessionId) {
              this.upsertPeer(peerKey, {
                sessionId: p.sessionId,
                userId: p.userId,
                name: p.name || 'Member',
                avatarId: p.avatarId || 'avatar-sage',
                avatarColor: p.avatarColor || '#5E887E',
                activeSlideIndex: p.activeSlideIndex ?? 0,
                selectedElementId: p.selectedElementId ?? null,
                onlineAt: p.onlineAt || new Date().toISOString(),
                lastActive: Date.now(),
              });
            }
          });
          this.notifyState();
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }) => {
          leftPresences.forEach((p: any) => {
            const peerKey = p.sessionId || p.userId;
            if (peerKey && p.sessionId !== this.mySessionId) {
              this.peersMap.delete(peerKey);
            }
          });
          this.notifyState();
        })
        .on('broadcast', { event: 'cursor_move' }, ({ payload }) => {
          this.handleCursorMove(payload);
        })
        .on('broadcast', { event: 'cursor_leave' }, ({ payload }) => {
          this.handleCursorLeave(payload);
        })
        .on('broadcast', { event: 'selection_change' }, ({ payload }) => {
          this.handleSelectionChange(payload);
        })
        .on('broadcast', { event: 'element_update' }, ({ payload }) => {
          this.handleElementUpdate(payload);
        })
        .on('broadcast', { event: 'canvas_state_request' }, ({ payload }) => {
          this.handleCanvasStateRequest(payload);
        })
        .on('broadcast', { event: 'canvas_state_sync' }, ({ payload }) => {
          this.handleCanvasStateSync(payload);
        })
        .on('broadcast', { event: 'comments_sync' }, ({ payload }) => {
          this.handleCommentsSync(payload);
        })
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            this.isConnected = true;
            if (this.reconnectTimer) {
              clearTimeout(this.reconnectTimer);
              this.reconnectTimer = null;
            }
            this.updatePresence();
            this.notifyState();
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn(`Supabase Realtime channel ${status}:`, err);
            this.isConnected = false;
            this.notifyState();
            this.scheduleReconnect();
          }
        });
    } else {
      // Local fallback active
      this.isConnected = true;
      this.notifyState();
    }

    // Broadcast our join to local bus
    this.broadcastToLocalBus({
      type: 'presence_join',
      payload: {
        sessionId: this.mySessionId,
        userId: this.myUserId,
        name: this.myName,
        avatarId: this.myAvatarId,
        avatarColor: this.myAvatarColor,
        activeSlideIndex: this.mySlideIndex,
        selectedElementId: this.mySelectedElementId,
        onlineAt: new Date().toISOString(),
      },
    });
  }

  public disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.channel) {
      try {
        this.channel.unsubscribe();
      } catch {
        // ignore
      }
      this.channel = null;
    }
    if (this.localBroadcastBus) {
      try {
        this.broadcastToLocalBus({
          type: 'presence_leave',
          payload: { userId: this.myUserId },
        });
        this.localBroadcastBus.close();
      } catch {
        // ignore
      }
      this.localBroadcastBus = null;
    }
    this.isConnected = false;
    this.peersMap.clear();
    this.notifyState();
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      if (!this.isConnected && this.currentRoomId) {
        this.connectToRoom(this.currentRoomId, true);
      }
    }, 1500);
  }

  public updatePresence(slideIndex?: number, selectedElementId?: string | null) {
    if (typeof slideIndex === 'number') this.mySlideIndex = slideIndex;
    if (selectedElementId !== undefined) this.mySelectedElementId = selectedElementId;

    const payload = {
      sessionId: this.mySessionId,
      userId: this.myUserId,
      name: this.myName,
      avatarId: this.myAvatarId,
      avatarColor: this.myAvatarColor,
      activeSlideIndex: this.mySlideIndex,
      selectedElementId: this.mySelectedElementId,
      onlineAt: new Date().toISOString(),
    };

    if (this.channel && this.isConnected) {
      try {
        this.channel.track(payload);
      } catch (err) {
        console.warn('Failed to track presence in Supabase:', err);
      }
    }

    this.broadcastToLocalBus({
      type: 'presence_sync',
      payload,
    });
  }

  public sendCursorPosition(xPercent: number, yPercent: number, slideIndex: number) {
    const now = performance.now();
    if (now - this.lastCursorSendTime < this.throttleIntervalMs) {
      return;
    }
    this.lastCursorSendTime = now;
    this.mySlideIndex = slideIndex;

    const payload = {
      sessionId: this.mySessionId,
      userId: this.myUserId,
      name: this.myName,
      avatarId: this.myAvatarId,
      avatarColor: this.myAvatarColor,
      slideIndex,
      xPercent: Math.round(xPercent * 100) / 100,
      yPercent: Math.round(yPercent * 100) / 100,
      timestamp: Date.now(),
    };

    if (this.channel && this.isConnected) {
      this.channel.send({
        type: 'broadcast',
        event: 'cursor_move',
        payload,
      });
    }

    this.broadcastToLocalBus({
      type: 'cursor_move',
      payload,
    });
  }

  public sendCursorLeave() {
    const payload = {
      sessionId: this.mySessionId,
      userId: this.myUserId,
    };
    if (this.channel && this.isConnected) {
      this.channel.send({
        type: 'broadcast',
        event: 'cursor_leave',
        payload,
      });
    }
    this.broadcastToLocalBus({
      type: 'cursor_leave',
      payload,
    });
  }

  public sendElementSelection(selectedElementId: string | null, slideIndex: number) {
    this.mySelectedElementId = selectedElementId;
    this.mySlideIndex = slideIndex;

    const payload = {
      sessionId: this.mySessionId,
      userId: this.myUserId,
      slideIndex,
      selectedElementId,
    };

    if (this.channel && this.isConnected) {
      this.channel.send({
        type: 'broadcast',
        event: 'selection_change',
        payload,
      });
    }
    this.broadcastToLocalBus({
      type: 'selection_change',
      payload,
    });
    this.updatePresence(slideIndex, selectedElementId);
  }

  public sendElementUpdate(slideIndex: number, elementId: string, updates: Partial<CanvasElement>) {
    const payload: RemoteElementUpdatePayload = {
      sessionId: this.mySessionId,
      userId: this.myUserId,
      slideIndex,
      elementId,
      updates,
      timestamp: Date.now(),
    };

    // Always send instantly to local tabs via BroadcastChannel (zero delay)
    this.broadcastToLocalBus({
      type: 'element_update',
      payload,
    });

    // Throttle per element over Supabase Realtime to 30ms, with trailing timer to ensure final drop position is sent
    const now = performance.now();
    const lastTime = this.lastElementUpdateTimes.get(elementId) || 0;
    const timeSinceLast = now - lastTime;

    const existingTimer = this.pendingElementUpdateTimers.get(elementId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.pendingElementUpdateTimers.delete(elementId);
    }

    if (timeSinceLast >= 30) {
      this.lastElementUpdateTimes.set(elementId, now);
      if (this.channel && this.isConnected) {
        try {
          this.channel.send({
            type: 'broadcast',
            event: 'element_update',
            payload,
          });
        } catch (err) {
          console.warn('Failed to send element_update via Supabase:', err);
        }
      }
    } else {
      const timer = setTimeout(() => {
        this.pendingElementUpdateTimers.delete(elementId);
        this.lastElementUpdateTimes.set(elementId, performance.now());
        if (this.channel && this.isConnected) {
          try {
            this.channel.send({
              type: 'broadcast',
              event: 'element_update',
              payload,
            });
          } catch (err) {
            console.warn('Failed to send trailing element_update via Supabase:', err);
          }
        }
      }, 30 - timeSinceLast);
      this.pendingElementUpdateTimers.set(elementId, timer);
    }
  }

  private handleCursorMove(payload: any) {
    if (!payload || payload.sessionId === this.mySessionId) return;
    const peerKey = payload.sessionId || payload.userId;

    this.upsertPeer(peerKey, {
      sessionId: payload.sessionId,
      userId: payload.userId,
      name: payload.name,
      avatarId: payload.avatarId,
      avatarColor: payload.avatarColor,
      activeSlideIndex: payload.slideIndex,
      cursorXPercent: payload.xPercent,
      cursorYPercent: payload.yPercent,
      lastActive: Date.now(),
    });

    // Schedule 60fps instant UI update via requestAnimationFrame
    if (!this.cursorRafId && typeof window !== 'undefined') {
      this.cursorRafId = window.requestAnimationFrame(() => {
        this.cursorRafId = null;
        this.notifyState();
      });
    }
  }

  private handleCursorLeave(payload: any) {
    if (!payload || payload.sessionId === this.mySessionId) return;
    const peerKey = payload.sessionId || payload.userId;
    const peer = this.peersMap.get(peerKey);
    if (peer) {
      peer.cursorXPercent = -1;
      peer.cursorYPercent = -1;
      this.notifyState();
    }
  }

  private handleSelectionChange(payload: any) {
    if (!payload || payload.sessionId === this.mySessionId) return;
    const peerKey = payload.sessionId || payload.userId;
    this.upsertPeer(peerKey, {
      sessionId: payload.sessionId,
      userId: payload.userId,
      selectedElementId: payload.selectedElementId,
      activeSlideIndex: payload.slideIndex,
      lastActive: Date.now(),
    });
    this.notifyState();
  }

  private handleElementUpdate(payload: RemoteElementUpdatePayload) {
    if (!payload || payload.sessionId === this.mySessionId) return;
    this.elementUpdateListeners.forEach((fn) => {
      try {
        fn(payload);
      } catch (err) {
        console.error('Error in element update listener:', err);
      }
    });
  }

  private handleCanvasStateRequest(payload: any) {
    if (!payload || payload.sessionId === this.mySessionId) return;
    this.canvasStateRequestListeners.forEach((fn) => {
      try {
        fn(payload.userId);
      } catch (err) {
        console.error('Error in canvas state request listener:', err);
      }
    });
  }

  private handleCanvasStateSync(payload: CanvasStateSyncPayload) {
    if (!payload || payload.sessionId === this.mySessionId) return;
    this.canvasStateListeners.forEach((fn) => {
      try {
        fn(payload);
      } catch (err) {
        console.error('Error in canvas state sync listener:', err);
      }
    });
  }

  private handleCommentsSync(payload: any) {
    if (!payload || payload.sessionId === this.mySessionId || !Array.isArray(payload.comments)) return;
    this.commentsListeners.forEach((fn) => {
      try {
        fn(payload.comments);
      } catch (err) {
        console.error('Error in comments sync listener:', err);
      }
    });
  }

  private broadcastToLocalBus(msg: { type: string; payload: any }) {
    if (!this.localBroadcastBus) return;
    try {
      this.localBroadcastBus.postMessage(msg);
    } catch {
      // ignore
    }
  }

  private handleIncomingMessage(msg: any) {
    if (!msg || !msg.type || !msg.payload) return;
    const { type, payload } = msg;
    if (payload.sessionId === this.mySessionId) return;

    switch (type) {
      case 'cursor_move':
        this.handleCursorMove(payload);
        break;
      case 'cursor_leave':
        this.handleCursorLeave(payload);
        break;
      case 'selection_change':
        this.handleSelectionChange(payload);
        break;
      case 'element_update':
        this.handleElementUpdate(payload);
        break;
      case 'canvas_state_request':
        this.handleCanvasStateRequest(payload);
        break;
      case 'canvas_state_sync':
        this.handleCanvasStateSync(payload);
        break;
      case 'comments_sync':
        this.handleCommentsSync(payload);
        break;
      case 'presence_join': {
        const peerKey = payload.sessionId || payload.userId;
        this.upsertPeer(peerKey, {
          sessionId: payload.sessionId,
          userId: payload.userId,
          name: payload.name,
          avatarId: payload.avatarId,
          avatarColor: payload.avatarColor,
          activeSlideIndex: payload.activeSlideIndex ?? 0,
          selectedElementId: payload.selectedElementId ?? null,
          onlineAt: payload.onlineAt || new Date().toISOString(),
          lastActive: Date.now(),
        });
        this.notifyState();

        // Immediately respond with our presence so the newcomer knows about us instantly
        this.broadcastToLocalBus({
          type: 'presence_sync',
          payload: {
            sessionId: this.mySessionId,
            userId: this.myUserId,
            name: this.myName,
            avatarId: this.myAvatarId,
            avatarColor: this.myAvatarColor,
            activeSlideIndex: this.mySlideIndex,
            selectedElementId: this.mySelectedElementId,
            onlineAt: new Date().toISOString(),
          },
        });
        break;
      }

      case 'presence_sync': {
        const peerKey = payload.sessionId || payload.userId;
        this.upsertPeer(peerKey, {
          sessionId: payload.sessionId,
          userId: payload.userId,
          name: payload.name,
          avatarId: payload.avatarId,
          avatarColor: payload.avatarColor,
          activeSlideIndex: payload.activeSlideIndex ?? 0,
          selectedElementId: payload.selectedElementId ?? null,
          onlineAt: payload.onlineAt || new Date().toISOString(),
          lastActive: Date.now(),
        });
        this.notifyState();
        break;
      }
      case 'presence_leave': {
        const peerKey = payload.sessionId || payload.userId;
        this.peersMap.delete(peerKey);
        this.notifyState();
        break;
      }
    }
  }

  private syncPresenceState(presenceState: Record<string, any[]>) {
    const presentSessionIds = new Set<string>();

    Object.values(presenceState).forEach((presences) => {
      presences.forEach((p) => {
        const peerKey = p.sessionId || p.userId;
        if (peerKey && p.sessionId !== this.mySessionId) {
          presentSessionIds.add(peerKey);
          this.upsertPeer(peerKey, {
            sessionId: p.sessionId,
            userId: p.userId,
            name: p.name || 'Member',
            avatarId: p.avatarId || 'avatar-sage',
            avatarColor: p.avatarColor || '#5E887E',
            activeSlideIndex: p.activeSlideIndex ?? 0,
            selectedElementId: p.selectedElementId ?? null,
            onlineAt: p.onlineAt || new Date().toISOString(),
            lastActive: Date.now(),
          });
        }
      });
    });

    // Remove peers who are no longer present
    let changed = false;
    this.peersMap.forEach((_, key) => {
      if (!presentSessionIds.has(key)) {
        this.peersMap.delete(key);
        changed = true;
      }
    });

    if (changed || presentSessionIds.size > 0) {
      this.notifyState();
    }
  }

  private upsertPeer(peerKey: string, partial: Partial<RemotePeer>) {
    const existing = this.peersMap.get(peerKey);
    if (existing) {
      Object.assign(existing, partial);
    } else {
      this.peersMap.set(peerKey, {
        sessionId: partial.sessionId || peerKey,
        userId: partial.userId || peerKey,
        name: partial.name || 'Member',
        avatarId: partial.avatarId || 'avatar-sage',
        avatarColor: partial.avatarColor || '#5E887E',
        activeSlideIndex: partial.activeSlideIndex ?? 0,
        selectedElementId: partial.selectedElementId ?? null,
        cursorXPercent: partial.cursorXPercent ?? -1,
        cursorYPercent: partial.cursorYPercent ?? -1,
        lastActive: partial.lastActive || Date.now(),
        onlineAt: partial.onlineAt || new Date().toISOString(),
      });
    }
  }

  private notifyState() {
    const peers = Array.from(this.peersMap.values());
    const state: MultiplayerState = {
      isConnected: this.isConnected,
      roomId: this.currentRoomId,
      peers,
      activeUsersCount: peers.length + 1, // Peers + local user
    };

    this.listeners.forEach((fn) => {
      try {
        fn(state);
      } catch (e) {
        console.warn('Error in multiplayer state listener:', e);
      }
    });
  }

  public subscribeToState(callback: (state: MultiplayerState) => void): () => void {
    this.listeners.push(callback);
    callback({
      isConnected: this.isConnected,
      roomId: this.currentRoomId,
      peers: Array.from(this.peersMap.values()),
      activeUsersCount: this.peersMap.size + 1,
    });
    return () => {
      const idx = this.listeners.indexOf(callback);
      if (idx !== -1) this.listeners.splice(idx, 1);
    };
  }

  public onRemoteElementUpdate(callback: (event: RemoteElementUpdatePayload) => void): () => void {
    this.elementUpdateListeners.push(callback);
    return () => {
      const idx = this.elementUpdateListeners.indexOf(callback);
      if (idx !== -1) this.elementUpdateListeners.splice(idx, 1);
    };
  }

  public sendCanvasStateRequest() {
    const payload = {
      sessionId: this.mySessionId,
      userId: this.myUserId,
      timestamp: Date.now(),
    };
    if (this.channel && this.isConnected) {
      try {
        this.channel.send({
          type: 'broadcast',
          event: 'canvas_state_request',
          payload,
        });
      } catch (err) {
        console.warn('Failed to send canvas_state_request via Supabase:', err);
      }
    }
    this.broadcastToLocalBus({
      type: 'canvas_state_request',
      payload,
    });
  }

  public broadcastCanvasState(snapshot: Omit<CanvasStateSyncPayload, 'userId' | 'senderName' | 'timestamp'>) {
    const payload: CanvasStateSyncPayload = {
      ...snapshot,
      sessionId: this.mySessionId,
      userId: this.myUserId,
      senderName: this.myName,
      timestamp: Date.now(),
    };

    // Always send instantly to local tabs via BroadcastChannel (zero delay)
    this.broadcastToLocalBus({
      type: 'canvas_state_sync',
      payload,
    });

    // Send over Supabase WebSocket with trailing timer so final canvas state is NEVER dropped
    const now = performance.now();
    const timeSinceLast = now - this.lastCanvasBroadcastTime;

    if (this.pendingCanvasBroadcastTimer) {
      clearTimeout(this.pendingCanvasBroadcastTimer);
      this.pendingCanvasBroadcastTimer = null;
    }

    if (timeSinceLast >= 200) {
      this.lastCanvasBroadcastTime = now;
      if (this.channel && this.isConnected) {
        try {
          this.channel.send({
            type: 'broadcast',
            event: 'canvas_state_sync',
            payload,
          });
        } catch (err) {
          console.warn('Failed to broadcast canvas_state_sync via Supabase:', err);
        }
      }
    } else {
      // Schedule trailing broadcast so final update is ALWAYS delivered
      this.pendingCanvasBroadcastTimer = setTimeout(() => {
        this.pendingCanvasBroadcastTimer = null;
        this.lastCanvasBroadcastTime = performance.now();
        if (this.channel && this.isConnected) {
          try {
            this.channel.send({
              type: 'broadcast',
              event: 'canvas_state_sync',
              payload,
            });
          } catch (err) {
            console.warn('Failed to broadcast trailing canvas_state_sync via Supabase:', err);
          }
        }
      }, 200 - timeSinceLast);
    }
  }

  public onRemoteCanvasState(callback: (payload: CanvasStateSyncPayload) => void): () => void {
    this.canvasStateListeners.push(callback);
    return () => {
      const idx = this.canvasStateListeners.indexOf(callback);
      if (idx !== -1) this.canvasStateListeners.splice(idx, 1);
    };
  }

  public onCanvasStateRequest(callback: (requestorUserId: string) => void): () => void {
    this.canvasStateRequestListeners.push(callback);
    return () => {
      const idx = this.canvasStateRequestListeners.indexOf(callback);
      if (idx !== -1) this.canvasStateRequestListeners.splice(idx, 1);
    };
  }

  public broadcastComments(comments: CanvasComment[]) {
    const payload = {
      userId: this.myUserId,
      comments,
      timestamp: Date.now(),
    };

    this.broadcastToLocalBus({
      type: 'comments_sync',
      payload,
    });

    if (this.channel && this.isConnected) {
      try {
        this.channel.send({
          type: 'broadcast',
          event: 'comments_sync',
          payload,
        });
      } catch (err) {
        console.warn('Failed to broadcast comments_sync via Supabase:', err);
      }
    }
  }

  public onRemoteComments(callback: (comments: CanvasComment[]) => void): () => void {
    this.commentsListeners.push(callback);
    return () => {
      const idx = this.commentsListeners.indexOf(callback);
      if (idx !== -1) this.commentsListeners.splice(idx, 1);
    };
  }
}

export const multiplayerService = new MultiplayerService();
