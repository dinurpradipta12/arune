import React, { useState, useEffect } from 'react';
import {
  History,
  X,
  RotateCcw,
  Plus,
  Trash2,
  Edit2,
  Check,
  Calendar,
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
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} menit lalu`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} jam lalu`;
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

export const VersionHistoryModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
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

  useEffect(() => {
    if (activeModal === 'version-history') {
      const list = getProjectVersionSnapshots(currentProjectId);
      setSnapshots(list);
      if (list.length > 0) {
        setSelectedSnapshotId(list[0].id);
      }
      setPreviewSlideIdx(0);
    }
  }, [activeModal, currentProjectId]);

  if (activeModal !== 'version-history') return null;

  const selectedSnapshot = snapshots.find((s) => s.id === selectedSnapshotId) || snapshots[0];
  const theme = getActiveTheme();

  const handleCreateNewSnapshot = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const created = createMilestoneSnapshotFromCurrentStore(newVersionName);
    if (created) {
      const updated = getProjectVersionSnapshots(currentProjectId);
      setSnapshots(updated);
      setSelectedSnapshotId(created.id);
      setIsCreatingNew(false);
      setNewVersionName('');
    }
  };

  const handleSaveRename = (snapshotId: string) => {
    if (!editingName.trim()) return;
    const ok = renameProjectVersionSnapshot(currentProjectId, snapshotId, editingName);
    if (ok) {
      setSnapshots(getProjectVersionSnapshots(currentProjectId));
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
    setActiveModal(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-5xl h-[85vh] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Top Header */}
        <div className="px-5 py-3.5 border-b border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-blue-500/20 text-blue-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <span>Riwayat Versi Tim (Version History)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                  {snapshots.length} revisi tersimpan
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">
                Timeline revisi otomatis dan milestone proyek untuk kembalikan desain kapan saja
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCreatingNew(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Simpan Versi Baru Sekarang</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Tutup (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Create New Snapshot Inline Bar */}
        {isCreatingNew && (
          <form
            onSubmit={handleCreateNewSnapshot}
            className="px-5 py-2.5 bg-blue-950/40 border-b border-blue-900/40 flex items-center gap-3 shrink-0 animate-in slide-in-from-top-1"
          >
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
            <input
              type="text"
              autoFocus
              value={newVersionName}
              onChange={(e) => setNewVersionName(e.target.value)}
              placeholder="Beri nama milestone (misal: Draft Masuk Allisha, Pitch Deck Final V1)..."
              className="flex-1 bg-zinc-900 border border-zinc-700 text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer"
            >
              Simpan Milestone
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingNew(false)}
              className="px-2 py-1.5 text-xs text-zinc-400 hover:text-white cursor-pointer"
            >
              Batal
            </button>
          </form>
        )}

        {/* Modal Main Content: Split View (Timeline List on Left, Preview on Right) */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left Panel: Snapshot Timeline List */}
          <div className="w-80 border-r border-zinc-800/80 bg-zinc-950/50 flex flex-col shrink-0">
            <div className="p-3 border-b border-zinc-800/60 text-xs font-medium text-zinc-400 flex items-center justify-between">
              <span>Timeline Revisi</span>
              <span className="text-[10px] text-zinc-500">Terbaru di atas</span>
            </div>

            <div className="flex-1 overflow-y-auto scroller-dark p-2 space-y-1.5">
              {snapshots.length === 0 ? (
                <div className="p-6 text-center text-xs text-zinc-500">
                  Belum ada snapshot tersimpan. Klik "Simpan Versi Baru Sekarang" untuk membuat revisi pertama.
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
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative group ${
                        isSelected
                          ? 'bg-blue-950/30 border-blue-800/60 shadow-sm'
                          : 'bg-zinc-900/50 border-zinc-800/60 hover:bg-zinc-900 hover:border-zinc-700'
                      }`}
                    >
                      {/* Name and Rename / Delete buttons */}
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
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-400">
                              <span>{formatRelativeTime(snap.createdAt)}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <span
                                  className="w-2 h-2 rounded-full inline-block"
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

                      <div className="mt-2 flex items-center gap-2 text-[9.5px] text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3" />
                          {snap.slideCount} slide
                        </span>
                        <span>•</span>
                        <span>{snap.aspectRatio}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel: Snapshot Detail & Stage Preview */}
          <div className="flex-1 flex flex-col bg-zinc-950 overflow-hidden">
            {selectedSnapshot ? (
              <>
                {/* Snapshot Meta Header Bar */}
                <div className="px-6 py-3 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-900/30">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                      <span>{selectedSnapshot.versionName}</span>
                      <span className="text-xs font-normal text-zinc-400">
                        ({selectedSnapshot.projectTitle})
                      </span>
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(selectedSnapshot.createdAt).toLocaleString('id-ID')}
                      </span>
                      <span>•</span>
                      <span>Oleh {selectedSnapshot.authorName}</span>
                      <span>•</span>
                      <span>{selectedSnapshot.slides.length} slide ({selectedSnapshot.aspectRatio})</span>
                    </div>
                  </div>

                  {/* Restore Action Button */}
                  <button
                    type="button"
                    onClick={() => setShowConfirmRestore(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Kembalikan Versi Ini</span>
                  </button>
                </div>

                {/* Preview Canvas Stage */}
                <div className="flex-1 flex items-center justify-center p-6 overflow-hidden bg-zinc-950">
                  {(() => {
                    const dim = ASPECT_RATIOS[selectedSnapshot.aspectRatio] || ASPECT_RATIOS['4:5'];
                    const currentSlide = selectedSnapshot.slides[previewSlideIdx] || selectedSnapshot.slides[0];
                    // Calculate preview scale to fit container comfortably
                    const maxPreviewW = 380;
                    const previewScale = maxPreviewW / dim.stageWidth;
                    const previewW = Math.round(dim.stageWidth * previewScale);
                    const previewH = Math.round(dim.stageHeight * previewScale);

                    return (
                      <div
                        className="relative shadow-2xl rounded-sm overflow-hidden ring-1 ring-zinc-800"
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

                {/* Slide Thumbnail Navigation Strip at Bottom */}
                <div className="h-16 border-t border-zinc-800/80 bg-zinc-950 px-4 flex items-center gap-2 overflow-x-auto scroller-dark shrink-0">
                  {selectedSnapshot.slides.map((s, idx) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setPreviewSlideIdx(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all shrink-0 ${
                        idx === previewSlideIdx
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      Slide {idx + 1}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-zinc-500 text-xs">
                Pilih snapshot di sebelah kiri untuk melihat preview.
              </div>
            )}
          </div>
        </div>

        {/* Confirmation Modal to Restore Snapshot */}
        {showConfirmRestore && selectedSnapshot && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Kembalikan Revisi Ini?</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Kanvas aktif Anda dan seluruh anggota tim di room kolaborasi akan di-rollback ke snapshot "{selectedSnapshot.versionName}".
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-300 space-y-1">
                <p>• Versi: <strong>{selectedSnapshot.versionName}</strong></p>
                <p>• Jumlah slide: <strong>{selectedSnapshot.slides.length} slide</strong></p>
                <p>• Dibuat oleh: <strong>{selectedSnapshot.authorName}</strong> ({formatRelativeTime(selectedSnapshot.createdAt)})</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmRestore(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteRestore}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-md"
                >
                  Ya, Kembalikan Versi Ini
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
