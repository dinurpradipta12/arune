import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  Folder,
  FolderPlus,
  Search,
  X,
} from 'lucide-react';
import {
  type ProjectFolder,
  FOLDER_COLORS,
  getFolderColorTheme,
  getProjectFolders,
  createProjectFolder,
  setProjectFolderMemberships,
  getFoldersForProject,
} from '../../services/projectFolderService';
import { useStudioStore } from '../../store/useStudioStore';

interface MoveToFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    id: string;
    name: string;
  };
  onSuccess?: (assignedFolders: ProjectFolder[]) => void;
}

export function MoveToFolderModal({
  isOpen,
  onClose,
  project,
  onSuccess,
}: MoveToFolderModalProps) {
  const { workspaceDarkMode } = useStudioStore();
  const [folders, setFolders] = useState<ProjectFolder[]>([]);
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Inline "Create New Folder" state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('blue');

  useEffect(() => {
    if (isOpen && project.id) {
      const allFolders = getProjectFolders();
      setFolders(allFolders);

      const currentAssigned = getFoldersForProject(project.id);
      setSelectedFolderIds(currentAssigned.map((f) => f.id));
      setShowCreateForm(false);
      setNewFolderName('');
      setSearchQuery('');
    }
  }, [isOpen, project.id]);

  if (!isOpen) return null;

  const handleToggleFolder = (folderId: string) => {
    setSelectedFolderIds((prev) =>
      prev.includes(folderId)
        ? prev.filter((id) => id !== folderId)
        : [...prev, folderId]
    );
  };

  const handleQuickCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    const created = createProjectFolder({
      name: newFolderName.trim(),
      color: newFolderColor,
    });

    const updatedFolders = getProjectFolders();
    setFolders(updatedFolders);
    setSelectedFolderIds((prev) => [...prev, created.id]);
    setNewFolderName('');
    setShowCreateForm(false);
  };

  const handleSave = () => {
    setProjectFolderMemberships(project.id, selectedFolderIds);
    const updatedFolders = getFoldersForProject(project.id);
    onSuccess?.(updatedFolders);
    onClose();
  };

  const filteredFolders = folders.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full max-w-md my-auto rounded-3xl border shadow-2xl flex flex-col max-h-[85vh] overflow-hidden transition-all ${
          workspaceDarkMode
            ? 'bg-zinc-900 border-zinc-800 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Folder className="w-4 h-4 fill-current/20" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold truncate">Kelola Folder Proyek</h3>
              <p className="text-[11px] text-zinc-400 truncate max-w-[280px]">
                {project.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Actions Bar */}
        <div className="px-5 py-3 border-b border-zinc-800/60 flex items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari folder..."
              className={`w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs outline-none ${
                workspaceDarkMode
                  ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500 focus:border-blue-500'
                  : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400 focus:border-blue-500'
              }`}
            />
          </div>

          <button
            type="button"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shrink-0 ${
              showCreateForm
                ? 'bg-zinc-800 border-zinc-700 text-white'
                : 'border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400'
            }`}
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>+ Folder</span>
          </button>
        </div>

        {/* Inline Create Folder Form */}
        {showCreateForm && (
          <form
            onSubmit={handleQuickCreateFolder}
            className="p-4 bg-zinc-950/60 border-b border-zinc-800/80 space-y-3 shrink-0 animate-in slide-in-from-top-2 duration-150"
          >
            <div className="text-[11px] font-bold text-zinc-300">
              Buat Folder Baru Cepat
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Nama folder (misal: Klien XYZ)..."
                className={`flex-1 px-3 py-1.5 rounded-xl border text-xs outline-none ${
                  workspaceDarkMode
                    ? 'bg-zinc-900 border-zinc-700 text-white focus:border-blue-500'
                    : 'bg-white border-slate-300 text-slate-800 focus:border-blue-500'
                }`}
                autoFocus
              />
              <button
                type="submit"
                disabled={!newFolderName.trim()}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold cursor-pointer shadow-xs shrink-0"
              >
                Buat
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-zinc-400 mr-1">Warna:</span>
              {FOLDER_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setNewFolderColor(c.id)}
                  className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                    newFolderColor === c.id
                      ? 'ring-2 ring-white scale-110'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                >
                  {newFolderColor === c.id && (
                    <Check className="w-3 h-3 text-white stroke-[3]" />
                  )}
                </button>
              ))}
            </div>
          </form>
        )}

        {/* Folder List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredFolders.map((folder) => {
            const isChecked = selectedFolderIds.includes(folder.id);
            const colorTheme = getFolderColorTheme(folder.color);

            return (
              <div
                key={folder.id}
                onClick={() => handleToggleFolder(folder.id)}
                className={`p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                  isChecked
                    ? `${colorTheme.bg} ${colorTheme.border} ring-1 ring-blue-500/30`
                    : workspaceDarkMode
                    ? 'border-zinc-800/80 bg-zinc-950/40 hover:bg-zinc-800/50'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${colorTheme.bg} ${colorTheme.border} ${colorTheme.text}`}
                  >
                    <Folder className="w-4 h-4 fill-current/20" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-zinc-200 truncate">
                      {folder.name}
                    </div>
                    <div className="text-[11px] text-zinc-400 truncate">
                      {folder.projectIds.length} proyek tersimpan
                    </div>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                    isChecked
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'border-zinc-700 bg-zinc-800/60 text-transparent'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </div>
            );
          })}

          {filteredFolders.length === 0 && (
            <div className="text-center py-10 text-zinc-500 text-xs">
              {searchQuery
                ? `Tidak ada folder yang cocok dengan "${searchQuery}"`
                : 'Belum ada folder yang dibuat.'}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-950/40">
          <span className="text-xs text-zinc-400 font-medium">
            {selectedFolderIds.length} folder dipilih
          </span>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              Simpan ke Folder
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}
