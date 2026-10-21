import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  Plus,
  Trash2,
  Edit2,
  Check,
  Layers,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { useStudioStore } from '../../store/useStudioStore';
import {
  getProjectVersionSnapshots,
  renameProjectVersionSnapshot,
  deleteProjectVersionSnapshot,
  createMilestoneSnapshotFromCurrentStore,
} from '../../services/versionHistoryService';
import type { ProjectVersionSnapshot } from '../../types/studio';
import { ASPECT_RATIOS } from '../../constants/themesAndPresets';
import { SlideStage } from '../canvas/SlideStage';

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
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Baru saja';
  }
}

export const TeamHistoryPanel: React.FC = () => {
  const {
    projectId,
    restoreVersionSnapshot,
    getActiveTheme,
  } = useStudioStore();

  const [snapshots, setSnapshots] = useState<ProjectVersionSnapshot[]>([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  const [previewSlideIdx, setPreviewSlideIdx] = useState(0);

  // New snapshot creation form state
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newVersionName, setNewVersionName] = useState('');

  // Renaming state
  const [editingSnapshotId, setEditingSnapshotId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Confirm restore modal state
  const [showConfirmRestore, setShowConfirmRestore] = useState(false);

  const currentProjectId = projectId || 'default_project';

  const loadSnapshots = () => {
    const list = getProjectVersionSnapshots(currentProjectId);
    setSnapshots(list);
    if (list.length > 0 && !selectedSnapshotId) {
      setSelectedSnapshotId(list[0].id);
    }
  };

  useEffect(() => {
    loadSnapshots();
  }, [currentProjectId]);

  const selectedSnapshot = snapshots.find((s) => s.id === selectedSnapshotId) || snapshots[0];
  const theme = getActiveTheme();

  const handleCreateNewSnapshot = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const created = createMilestoneSnapshotFromCurrentStore(newVersionName);
    if (created) {
      loadSnapshots();
      setSelectedSnapshotId(created.id);
      setIsCreatingNew(false);
      setNewVersionName('');
    }
  };

  const handleSaveRename = (snapshotId: string) => {
    if (!editingName.trim()) return;
    const ok = renameProjectVersionSnapshot(currentProjectId, snapshotId, editingName);
    if (ok) {
      loadSnapshots();
    }
    setEditingSnapshotId(null);
  };

  const handleDeleteSnapshot = (snapshotId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteProjectVersionSnapshot(currentProjectId, snapshotId);
    const updated = getProjectVersionSnapshots(currentProjectId);
    setSnapshots(updated);
    if (selectedSnapshotId === snapshotId) {
      setSelectedSnapshotId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const handleExecuteRestore = () => {
    if (!selectedSnapshot) return;
    restoreVersionSnapshot(selectedSnapshot);
    setShowConfirmRestore(false);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden select-none">
      {/* Top Action Bar */}
      <div className="p-3 border-b border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between gap-2 shrink-0">
        <div>
          <span className="text-xs font-semibold text-zinc-200 block">Riwayat Versi Tim</span>
          <span className="text-[10px] text-zinc-400">
            {snapshots.length} revisi tersimpan
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsCreatingNew(!isCreatingNew)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Simpan Versi</span>
        </button>
      </div>

      {/* Inline Create Version Form */}
      {isCreatingNew && (
        <form
          onSubmit={handleCreateNewSnapshot}
          className="p-2.5 bg-blue-950/40 border-b border-blue-900/40 space-y-2 shrink-0 animate-in slide-in-from-top-1"
        >
          <div className="flex items-center gap-1.5 text-xs text-blue-300 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Simpan Milestone Baru</span>
          </div>
          <input
            type="text"
            autoFocus
            value={newVersionName}
            onChange={(e) => setNewVersionName(e.target.value)}
            placeholder="Nama revisi (misal: Draft Masuk Allisha)..."
            className="w-full bg-zinc-900 border border-zinc-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setIsCreatingNew(false)}
              className="px-2 py-1 text-xs text-zinc-400 hover:text-white cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer"
            >
              Simpan
            </button>
          </div>
        </form>
      )}

      {/* Snapshot Timeline List */}
      <div className="flex-1 overflow-y-auto scroller-dark p-2.5 space-y-2">
        {snapshots.length === 0 ? (
          <div className="p-6 text-center text-xs text-zinc-500 leading-relaxed">
            Belum ada snapshot revisi. Setiap kali project disimpan atau tombol "Simpan Versi" ditekan, riwayat otomatis tercatat di sini.
          </div>
        ) : (
          snapshots.map((snap, idx) => {
            const isSelected = snap.id === selectedSnapshotId;
            const isEditing = snap.id === editingSnapshotId;

            return (
              <div
                key={snap.id}
                onClick={() => {
                  setSelectedSnapshotId(snap.id);
                  setPreviewSlideIdx(0);
                }}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative group ${
                  isSelected
                    ? 'bg-blue-950/40 border-blue-800/80 shadow-xs'
                    : 'bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700'
                }`}
              >
                {/* Header: Name and Controls */}
                <div className="flex items-start justify-between gap-1.5">
                  {isEditing ? (
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="text"
                        autoFocus
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="w-full text-xs bg-zinc-950 border border-blue-500 rounded px-1.5 py-0.5 text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveRename(snap.id)}
                        className="p-1 rounded bg-blue-600 text-white cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-zinc-200 truncate">
                          {snap.versionName}
                        </span>
                        {idx === 0 && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-400 font-medium shrink-0">
                            Terbaru
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-zinc-400">
                        <span>{formatRelativeTime(snap.createdAt)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 truncate">
                          <span
                            className="w-2 h-2 rounded-full inline-block shrink-0"
                            style={{ backgroundColor: snap.authorAvatarColor || '#5E887E' }}
                          />
                          {snap.authorName}
                        </span>
                      </div>
                    </div>
                  )}

                  {!isEditing && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSnapshotId(snap.id);
                          setEditingName(snap.versionName);
                        }}
                        className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
                        title="Ganti Nama Versi"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSnapshot(snap.id, e)}
                        className="p-1 rounded hover:bg-red-950/40 text-zinc-400 hover:text-red-400 cursor-pointer"
                        title="Hapus Snapshot Ini"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-1.5 flex items-center justify-between text-[9.5px] text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    {snap.slideCount} slide ({snap.aspectRatio})
                  </span>

                  {isSelected && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowConfirmRestore(true);
                      }}
                      className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>Kembalikan</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Selected Snapshot Mini Preview Stage & Restore Bar at Bottom */}
      {selectedSnapshot && (
        <div className="p-3 border-t border-zinc-800/80 bg-zinc-950 flex flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span className="truncate font-medium text-zinc-200">
              Preview: {selectedSnapshot.versionName}
            </span>
            <span className="text-[10px] font-mono">
              Slide {previewSlideIdx + 1}/{selectedSnapshot.slides.length}
            </span>
          </div>

          {/* Mini Preview Stage */}
          <div className="flex justify-center bg-zinc-900/60 p-2 rounded-xl border border-zinc-800/80">
            {(() => {
              const dim = ASPECT_RATIOS[selectedSnapshot.aspectRatio] || ASPECT_RATIOS['4:5'];
              const currentSlide = selectedSnapshot.slides[previewSlideIdx] || selectedSnapshot.slides[0];
              const previewW = 160;
              const previewScale = previewW / dim.stageWidth;
              const previewH = Math.round(dim.stageHeight * previewScale);

              return (
                <div
                  className="relative rounded-xs overflow-hidden shadow-lg ring-1 ring-zinc-700"
                  style={{ width: `${previewW}px`, height: `${previewH}px` }}
                >
                  <SlideStage
                    slide={currentSlide}
                    slideIndex={previewSlideIdx}
                    totalSlides={selectedSnapshot.slides.length}
                    aspectRatio={selectedSnapshot.aspectRatio}
                    theme={theme}
                    branding={selectedSnapshot.branding}
                    scale={previewScale}
                    interactive={false}
                  />
                </div>
              );
            })()}
          </div>

          {/* Mini Slide Nav Pills */}
          <div className="flex items-center gap-1 overflow-x-auto scroller-dark py-1">
            {selectedSnapshot.slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPreviewSlideIdx(idx)}
                className={`px-2 py-0.5 rounded text-[9.5px] cursor-pointer transition-colors shrink-0 ${
                  idx === previewSlideIdx
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                #{idx + 1}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowConfirmRestore(true)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer transition-colors shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Kembalikan Versi Ini</span>
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmRestore && selectedSnapshot && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-2xl space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Kembalikan Revisi Ini?</h4>
                <p className="text-[11px] text-zinc-400">
                  Kanvas akan di-rollback ke versi "{selectedSnapshot.versionName}".
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-300 space-y-0.5">
              <p>• Versi: <strong>{selectedSnapshot.versionName}</strong></p>
              <p>• Dibuat: <strong>{selectedSnapshot.authorName}</strong> ({formatRelativeTime(selectedSnapshot.createdAt)})</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmRestore(false)}
                className="px-3 py-1 rounded-lg text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteRestore}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-sm"
              >
                Ya, Rollback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
