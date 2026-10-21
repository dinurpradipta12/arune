import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Check,
  Trash2,
  Send,
  X,
} from 'lucide-react';
import { useStudioStore } from '../../store/useStudioStore';
import { multiplayerService } from '../../services/multiplayerService';
import { getAvatarPresetById } from '../../constants/avatarPresets';
import type { AspectRatioKey } from '../../types/studio';

interface CanvasCommentsLayerProps {
  activeSlideIndex: number;
  aspectRatio: AspectRatioKey;
}

function formatRelativeTime(dateString: string): string {
  try {
    const now = Date.now();
    const created = new Date(dateString).getTime();
    const diffSec = Math.floor((now - created) / 1000);

    if (diffSec < 60) return 'Baru saja';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m lalu`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}j lalu`;
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return 'Baru saja';
  }
}

export const CanvasCommentsLayer: React.FC<CanvasCommentsLayerProps> = ({
  activeSlideIndex,
}) => {
  const {
    comments,
    activeCommentId,
    setActiveCommentId,
    isCommentMode,
    setCommentMode,
    showResolvedComments,
    addComment,
    addCommentReply,
    toggleResolveComment,
    deleteComment,
    workspaceDarkMode,
  } = useStudioStore();

  const [newCommentCoords, setNewCommentCoords] = useState<{ xPct: number; yPct: number } | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const cardRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const myIdentity = multiplayerService.getMyIdentity();

  // Focus textarea when new comment is placed
  useEffect(() => {
    if (newCommentCoords) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [newCommentCoords]);

  // Press ESC to close open comment or exit comment mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (newCommentCoords) {
          setNewCommentCoords(null);
          setNewCommentText('');
        } else if (activeCommentId) {
          setActiveCommentId(null);
        } else if (isCommentMode) {
          setCommentMode(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [newCommentCoords, activeCommentId, isCommentMode, setActiveCommentId, setCommentMode]);

  // Filter comments for active slide
  const slideComments = comments.filter((c) => {
    if (c.slideIndex !== activeSlideIndex) return false;
    if (!showResolvedComments && c.isResolved) return false;
    return true;
  });

  const activeComment = comments.find((c) => c.id === activeCommentId);

  const handleStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCommentMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const xPct = Math.max(4, Math.min(96, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(4, Math.min(96, ((e.clientY - rect.top) / rect.height) * 100));

    setNewCommentCoords({ xPct, yPct });
    setActiveCommentId(null);
  };

  const handleSubmitNewComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newCommentCoords || !newCommentText.trim()) return;

    addComment({
      slideIndex: activeSlideIndex,
      xPercent: Math.round(newCommentCoords.xPct * 10) / 10,
      yPercent: Math.round(newCommentCoords.yPct * 10) / 10,
      authorId: myIdentity.userId,
      authorName: myIdentity.name,
      authorAvatarId: myIdentity.avatarId,
      authorAvatarColor: myIdentity.avatarColor,
      text: newCommentText.trim(),
    });

    setNewCommentCoords(null);
    setNewCommentText('');
    setCommentMode(false);
  };

  const handleSubmitReply = (commentId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim()) return;

    addCommentReply(commentId, {
      authorId: myIdentity.userId,
      authorName: myIdentity.name,
      authorAvatarId: myIdentity.avatarId,
      authorAvatarColor: myIdentity.avatarColor,
      text: replyText.trim(),
    });

    setReplyText('');
  };

  return (
    <div
      onClick={handleStageClick}
      className={`absolute inset-0 z-30 select-none transition-colors ${
        isCommentMode
          ? 'pointer-events-auto cursor-crosshair bg-blue-500/5'
          : 'pointer-events-none'
      }`}
    >
      {/* 1. Comment Mode Active Banner Top Right */}
      {isCommentMode && (
        <div className="absolute top-2.5 right-2.5 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600 text-white text-xs font-semibold shadow-lg animate-in fade-in slide-in-from-top-2 pointer-events-auto">
          <MessageSquare className="w-3.5 h-3.5 animate-pulse" />
          <span>Klik kanvas untuk sematkan catatan</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCommentMode(false);
              setNewCommentCoords(null);
            }}
            className="p-0.5 rounded-full hover:bg-blue-700 cursor-pointer ml-1"
            title="Keluar dari Mode Komentar (Esc)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Render Existing Comment Pins */}
      {slideComments.map((comment, idx) => {
        const isSelected = comment.id === activeCommentId;
        const preset = getAvatarPresetById(comment.authorAvatarId);

        return (
          <div
            key={comment.id}
            style={{
              left: `${comment.xPercent}%`,
              top: `${comment.yPercent}%`,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-35 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                setActiveCommentId(isSelected ? null : comment.id);
                setNewCommentCoords(null);
              }}
              title={`${comment.authorName}: ${comment.text.slice(0, 30)}...`}
              className={`group flex items-center gap-1.5 p-1 rounded-full shadow-lg transition-all transform cursor-pointer ${
                isSelected
                  ? 'scale-110 ring-2 ring-blue-500 ring-offset-2 bg-blue-600 text-white ' +
                    (workspaceDarkMode ? 'ring-offset-zinc-900' : 'ring-offset-white')
                  : comment.isResolved
                  ? 'bg-emerald-600/90 text-white opacity-60 hover:opacity-100 hover:scale-105'
                  : workspaceDarkMode
                  ? 'bg-zinc-900/95 hover:bg-blue-600 text-white hover:scale-105 ring-1 ring-white/20'
                  : 'bg-white hover:bg-blue-600 text-slate-800 hover:text-white hover:scale-105 ring-1 ring-slate-300 shadow-md'
              }`}
            >
              {comment.isResolved ? (
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              ) : (
                <img
                  src={preset.svgDataUri}
                  alt={comment.authorName}
                  className="w-5 h-5 rounded-full object-cover shrink-0 ring-1 ring-white/30"
                />
              )}

              <span className="text-[10px] font-bold pr-1 font-mono">
                {idx + 1}
              </span>

              {comment.replies && comment.replies.length > 0 && (
                <span className="text-[9px] px-1 py-0.2 rounded-full bg-white/20 font-bold">
                  +{comment.replies.length}
                </span>
              )}
            </button>
          </div>
        );
      })}

      {/* 3. New Comment Input Popover (When clicking in comment mode) */}
      {newCommentCoords && (
        <div
          ref={cardRef}
          style={{
            left: `${newCommentCoords.xPct}%`,
            top: `${newCommentCoords.yPct}%`,
          }}
          onClick={(e) => e.stopPropagation()}
          className={`absolute z-50 -translate-x-1/2 translate-y-2 w-72 p-3 rounded-2xl shadow-2xl border backdrop-blur-md pointer-events-auto animate-in zoom-in-95 duration-150 ${
            workspaceDarkMode
              ? 'bg-[#0A1A2F]/98 border-zinc-800 text-slate-100 shadow-black/60'
              : 'bg-white border-slate-200 text-slate-800 shadow-xl shadow-slate-300/40'
          }`}
        >
          <div className={`flex items-center justify-between pb-2 mb-2 border-b ${
            workspaceDarkMode ? 'border-zinc-800/80 text-slate-100' : 'border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span className="text-xs font-bold">Catatan / Komentar Baru</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setNewCommentCoords(null);
                setNewCommentText('');
              }}
              className={`p-1 rounded-lg transition-colors cursor-pointer ${
                workspaceDarkMode
                  ? 'hover:bg-zinc-800 text-slate-400 hover:text-white'
                  : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
              }`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <form onSubmit={handleSubmitNewComment} className="space-y-2">
            <textarea
              ref={textareaRef}
              rows={3}
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Tulis feedback atau catatan tim di sini... (Enter untuk kirim)"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitNewComment();
                }
              }}
              className={`w-full p-2 text-xs rounded-xl border resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
                workspaceDarkMode
                  ? 'bg-zinc-950 border-zinc-700 text-white placeholder-zinc-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white'
              }`}
            />

            <div className="flex items-center justify-between pt-1">
              <span className={`text-[10px] ${workspaceDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>
                Shift+Enter: baris baru
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setNewCommentCoords(null);
                    setNewCommentText('');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    workspaceDarkMode
                      ? 'text-slate-400 hover:bg-zinc-800'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!newCommentText.trim()}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 cursor-pointer shadow-xs transition-colors"
                >
                  <span>Kirim</span>
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* 4. Active Selected Comment Thread Card */}
      {activeComment && (
        <div
          style={{
            left: `${Math.min(75, Math.max(25, activeComment.xPercent))}%`,
            top: `${Math.min(75, Math.max(20, activeComment.yPercent))}%`,
          }}
          onClick={(e) => e.stopPropagation()}
          className={`absolute z-50 -translate-x-1/2 translate-y-3 w-80 max-h-[380px] flex flex-col p-3 rounded-2xl shadow-2xl border backdrop-blur-md pointer-events-auto animate-in zoom-in-95 duration-150 ${
            workspaceDarkMode
              ? 'bg-[#0A1A2F]/98 border-zinc-800 text-slate-100 shadow-black/60'
              : 'bg-white border-slate-200 text-slate-800 shadow-xl shadow-slate-300/40'
          }`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between pb-2 border-b shrink-0 ${
            workspaceDarkMode ? 'border-zinc-800/80 text-slate-100' : 'border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleResolveComment(activeComment.id)}
                title={activeComment.isResolved ? 'Buka kembali catatan' : 'Tandai catatan selesai'}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold cursor-pointer transition-colors ${
                  activeComment.isResolved
                    ? workspaceDarkMode
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : workspaceDarkMode
                    ? 'bg-zinc-900 hover:bg-emerald-950/50 text-slate-300'
                    : 'bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700'
                }`}
              >
                <Check className="w-3 h-3 stroke-[3]" />
                <span>{activeComment.isResolved ? 'Selesai' : 'Selesaikan'}</span>
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => deleteComment(activeComment.id)}
                title="Hapus Catatan"
                className={`p-1 rounded-lg transition-colors cursor-pointer ${
                  workspaceDarkMode
                    ? 'text-slate-400 hover:text-red-400 hover:bg-red-950/30'
                    : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setActiveCommentId(null)}
                className={`p-1 rounded-lg transition-colors cursor-pointer ${
                  workspaceDarkMode
                    ? 'hover:bg-zinc-800 text-slate-400 hover:text-white'
                    : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
                }`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Comment & Replies Scroll Area */}
          <div className="flex-1 overflow-y-auto py-2.5 space-y-3 scroller pr-1">
            {/* Root comment */}
            <div className="flex items-start gap-2.5">
              <img
                src={getAvatarPresetById(activeComment.authorAvatarId).svgDataUri}
                alt={activeComment.authorName}
                className="w-6 h-6 rounded-full object-cover ring-1 ring-blue-500/50 shrink-0 mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className={`text-xs font-bold truncate ${workspaceDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {activeComment.authorName}
                  </span>
                  <span className={`text-[10px] shrink-0 ${workspaceDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                    {formatRelativeTime(activeComment.createdAt)}
                  </span>
                </div>
                <p className={`text-xs mt-1 whitespace-pre-wrap leading-relaxed ${
                  workspaceDarkMode ? 'text-slate-200' : 'text-slate-700'
                }`}>
                  {activeComment.text}
                </p>
              </div>
            </div>

            {/* Thread Replies */}
            {activeComment.replies && activeComment.replies.length > 0 && (
              <div className={`pl-6 space-y-2.5 border-l-2 ml-3 ${
                workspaceDarkMode ? 'border-zinc-800/80' : 'border-slate-200'
              }`}>
                {activeComment.replies.map((reply) => (
                  <div key={reply.id} className="flex items-start gap-2">
                    <img
                      src={getAvatarPresetById(reply.authorAvatarId).svgDataUri}
                      alt={reply.authorName}
                      className="w-5 h-5 rounded-full object-cover shrink-0 mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-[11px] font-semibold truncate ${
                          workspaceDarkMode ? 'text-slate-200' : 'text-slate-800'
                        }`}>
                          {reply.authorName}
                        </span>
                        <span className={`text-[9.5px] shrink-0 ${
                          workspaceDarkMode ? 'text-zinc-500' : 'text-slate-400'
                        }`}>
                          {formatRelativeTime(reply.createdAt)}
                        </span>
                      </div>
                      <p className={`text-[11.5px] mt-0.5 whitespace-pre-wrap ${
                        workspaceDarkMode ? 'text-slate-300' : 'text-slate-600'
                      }`}>
                        {reply.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reply Form Footer */}
          <form
            onSubmit={(e) => handleSubmitReply(activeComment.id, e)}
            className={`pt-2 border-t flex items-center gap-1.5 shrink-0 ${
              workspaceDarkMode ? 'border-zinc-800/80' : 'border-slate-200'
            }`}
          >
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Tulis balasan..."
              className={`flex-1 px-2.5 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
                workspaceDarkMode
                  ? 'bg-zinc-950 border-zinc-700 text-white placeholder-zinc-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white'
              }`}
            />
            <button
              type="submit"
              disabled={!replyText.trim()}
              className="p-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 cursor-pointer shadow-xs transition-colors shrink-0"
              title="Kirim Balasan"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
