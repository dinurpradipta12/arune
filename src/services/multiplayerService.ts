import type { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { getCurrentAuthUser, subscribeToAuthChanges } from './authService';
import { getRandomAvatarPreset } from '../constants/avatarPresets';
import type { CanvasElement } from '../types/studio';

export interface RemotePeer {
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
  userId: string;
  slideIndex: number;
  elementId: string;
  updates: Partial<CanvasElement>;
  timestamp: number;
}

const GUEST_STORAGE_KEY = 'arune_collab_guest_v1';

function getOrCreateGuestIdentity(): { id: string; name: string; avatarId: string; avatarColor: string } {
  try {
    const raw = sessionStorage.getItem(GUEST_STORAGE_KEY) || localStorage.getItem(GUEST_STORAGE_KEY);
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
  private elementUpdateListeners: Array<(event: RemoteElementUpdatePayload) => void> = [];

  private isConnected = false;
  private myUserId = '';
  private myName = '';
  private myAvatarId = 'avatar-sage';
  private myAvatarColor = '#5E887E';
  private mySlideIndex = 0;
  private mySelectedElementId: string | null = null;

  private lastCursorSendTime = 0;
  private throttleIntervalMs = 35; // ~28 fps for silky smooth cursor tracking
  private cleanupTimer: any = null;

  constructor() {
    this.refreshUserIdentity();

    // Listen for auth changes (e.g. login, logout, avatar change)
    subscribeToAuthChanges(() => {
      this.refreshUserIdentity();
      this.updatePresence();
    });

    // Start stale cursor cleanup timer (fade out after 3.5s of no movement)
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      let changed = false;
      this.peersMap.forEach((peer) => {
        if (peer.cursorXPercent >= 0 && now - peer.lastActive > 3500) {
          peer.cursorXPercent = -1;
          peer.cursorYPercent = -1;
          changed = true;
        }
      });
      if (changed) {
        this.notifyState();
      }
    }, 1500);
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

  public connectToRoom(roomId: string = 'project_default') {
    if (this.currentRoomId === roomId && this.channel) {
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
          presence: { key: this.myUserId },
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
            if (p.userId && p.userId !== this.myUserId) {
              this.upsertPeer(p.userId, {
                name: p.name || 'Member',
                avatarId: p.avatarId || 'avatar-sage',
                avatarColor: p.avatarColor || '#5E887E',
                activeSlideIndex: p.activeSlideIndex ?? 0,
                selectedElementId: p.selectedElementId ?? null,
                onlineAt: p.onlineAt || new Date().toISOString(),
              });
            }
          });
          this.notifyState();
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }) => {
          leftPresences.forEach((p: any) => {
            if (p.userId && p.userId !== this.myUserId) {
              this.peersMap.delete(p.userId);
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
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            this.isConnected = true;
            this.updatePresence();
            this.notifyState();
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            this.isConnected = false;
            this.notifyState();
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
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
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

  public updatePresence(slideIndex?: number, selectedElementId?: string | null) {
    if (typeof slideIndex === 'number') this.mySlideIndex = slideIndex;
    if (selectedElementId !== undefined) this.mySelectedElementId = selectedElementId;

    const payload = {
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
    const payload = { userId: this.myUserId };
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
      userId: this.myUserId,
      slideIndex,
      elementId,
      updates,
      timestamp: Date.now(),
    };

    if (this.channel && this.isConnected) {
      this.channel.send({
        type: 'broadcast',
        event: 'element_update',
        payload,
      });
    }
    this.broadcastToLocalBus({
      type: 'element_update',
      payload,
    });
  }

  private handleCursorMove(payload: any) {
    if (!payload || payload.userId === this.myUserId) return;

    this.upsertPeer(payload.userId, {
      name: payload.name,
      avatarId: payload.avatarId,
      avatarColor: payload.avatarColor,
      activeSlideIndex: payload.slideIndex,
      cursorXPercent: payload.xPercent,
      cursorYPercent: payload.yPercent,
      lastActive: Date.now(),
    });
    this.notifyState();
  }

  private handleCursorLeave(payload: any) {
    if (!payload || payload.userId === this.myUserId) return;
    const peer = this.peersMap.get(payload.userId);
    if (peer) {
      peer.cursorXPercent = -1;
      peer.cursorYPercent = -1;
      this.notifyState();
    }
  }

  private handleSelectionChange(payload: any) {
    if (!payload || payload.userId === this.myUserId) return;
    this.upsertPeer(payload.userId, {
      selectedElementId: payload.selectedElementId,
      activeSlideIndex: payload.slideIndex,
      lastActive: Date.now(),
    });
    this.notifyState();
  }

  private handleElementUpdate(payload: RemoteElementUpdatePayload) {
    if (!payload || payload.userId === this.myUserId) return;
    this.elementUpdateListeners.forEach((fn) => {
      try {
        fn(payload);
      } catch (err) {
        console.error('Error in element update listener:', err);
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
    if (payload.userId === this.myUserId) return;

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
      case 'presence_join':
      case 'presence_sync':
        this.upsertPeer(payload.userId, {
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
      case 'presence_leave':
        this.peersMap.delete(payload.userId);
        this.notifyState();
        break;
    }
  }

  private syncPresenceState(presenceState: Record<string, any[]>) {
    const presentUserIds = new Set<string>();

    Object.values(presenceState).forEach((presences) => {
      presences.forEach((p) => {
        if (p.userId && p.userId !== this.myUserId) {
          presentUserIds.add(p.userId);
          this.upsertPeer(p.userId, {
            name: p.name || 'Member',
            avatarId: p.avatarId || 'avatar-sage',
            avatarColor: p.avatarColor || '#5E887E',
            activeSlideIndex: p.activeSlideIndex ?? 0,
            selectedElementId: p.selectedElementId ?? null,
            onlineAt: p.onlineAt || new Date().toISOString(),
          });
        }
      });
    });

    // Remove peers who are no longer present
    this.peersMap.forEach((_, id) => {
      if (!presentUserIds.has(id)) {
        this.peersMap.delete(id);
      }
    });

    this.notifyState();
  }

  private upsertPeer(userId: string, partial: Partial<RemotePeer>) {
    const existing = this.peersMap.get(userId);
    if (existing) {
      Object.assign(existing, partial);
    } else {
      this.peersMap.set(userId, {
        userId,
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
}

export const multiplayerService = new MultiplayerService();
