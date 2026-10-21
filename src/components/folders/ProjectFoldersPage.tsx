import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Clock,
  Copy,
  Edit2,
  Folder,
  FolderPlus,
  LayoutGrid,
  LayoutList,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
  FolderOpen,
  Layers,
} from 'lucide-react';
import {
  type ProjectFolder,
  FOLDER_COLORS,
  getFolderColorTheme,
  getProjectFolders,
  saveProjectFolders,
  createProjectFolder,
  updateProjectFolder,
  deleteProjectFolder,
  addProjectsToFolder,
  removeProjectFromFolder,
  syncProjectFoldersFromCloud,
} from '../../services/projectFolderService';
import {
  listTemplates,
  upsertTemplate,
} from '../../services/supabaseTemplates';
import type { CloudTemplateRecord } from '../../types/studio';
import { ASPECT_RATIOS, THEME_PALETTES } from '../../constants/themesAndPresets';
import { SlideStage } from '../canvas/SlideStage';
import { useStudioStore } from '../../store/useStudioStore';

export function ProjectFoldersPage() {
  const {
    workspaceDarkMode,
    setActiveView,
    loadProjectSnapshot,
    openDocuments,
    saveCurrentProjectToVault,
    settings,
  } = useStudioStore();

  const [folders, setFolders] = useState<ProjectFolder[]>(() => getProjectFolders());
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [savedProjects, setSavedProjects] = useState<CloudTemplateRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('blue');

  const [editingFolder, setEditingFolder] = useState<ProjectFolder | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editColor, setEditColor] = useState('blue');

  const [deletingFolder, setDeletingFolder] = useState<ProjectFolder | null>(null);

  // Add projects to folder modal
  const [isAddProjectsModalOpen, setIsAddProjectsModalOpen] = useState(false);
  const [selectedProjectIdsForFolder, setSelectedProjectIdsForFolder] = useState<string[]>([]);
  const [projectSearchInModal, setProjectSearchInModal] = useState('');

  // Active folder object if one is selected
  const activeFolder = useMemo(() => {
    if (!selectedFolderId) return null;
    return folders.find((f) => f.id === selectedFolderId) || null;
  }, [folders, selectedFolderId]);

  // Load saved projects on mount & sync folders
  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [resTemplates, syncedFolders] = await Promise.all([
        listTemplates(),
        syncProjectFoldersFromCloud(),
      ]);
      setSavedProjects(resTemplates.templates);
      setFolders(syncedFolders);
    } catch (err) {
      console.warn('Failed to refresh folder data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refreshData();
  }, []);

  // Filtered folders for overview
  const filteredFolders = useMemo(() => {
    if (!searchQuery.trim()) return folders;
    const q = searchQuery.toLowerCase();
    return folders.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q)
    );
  }, [folders, searchQuery]);

  // Projects belonging to active folder
  const projectsInActiveFolder = useMemo(() => {
    if (!activeFolder) return [];
    const idSet = new Set(activeFolder.projectIds);
    const list = savedProjects.filter((p) => idSet.has(p.id));

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }, [activeFolder, savedProjects, searchQuery]);

  // Projects not in any folder (Uncategorized)
  const uncategorizedProjects = useMemo(() => {
    const allAssignedIds = new Set<string>();
    folders.forEach((f) => f.projectIds.forEach((id) => allAssignedIds.add(id)));
    return savedProjects.filter((p) => !allAssignedIds.has(p.id));
  }, [folders, savedProjects]);

  // Open saved project in studio editor
  const handleOpenProject = async (record: CloudTemplateRecord) => {
    if (settings.autoSaveLocalCache && openDocuments.length > 0) {
      await saveCurrentProjectToVault();
    }
    loadProjectSnapshot(
      {
        id: record.id,
        projectTitle: record.name,
        aspectRatio: record.aspectRatio,
        activeThemeId: record.themeId,
        branding: record.branding,
        scriptText: record.scriptText,
        slides: record.slides,
      },
      settings.defaultOpenInNewTab
    );
    setActiveView('editor');
  };

  // Duplicate project
  const handleDuplicateProject = async (record: CloudTemplateRecord) => {
    const newId = `${record.id}-copy-${Date.now().toString(36).slice(-4)}`;
    const copyRecord: Omit<CloudTemplateRecord, 'updatedAt' | 'source'> = {
      id: newId,
      name: `${record.name} (Salinan)`,
      description: record.description,
      aspectRatio: record.aspectRatio,
      themeId: record.themeId,
      branding: record.branding,
      scriptText: record.scriptText,
      slides: record.slides,
    };
    await upsertTemplate(copyRecord);
    if (activeFolder) {
      addProjectsToFolder(activeFolder.id, [newId]);
    }
    await refreshData();
  };

  // Handle Create Folder
  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    const created = createProjectFolder({
      name: newFolderName.trim(),
      description: newFolderDesc.trim(),
      color: newFolderColor,
    });

    setFolders(getProjectFolders());
    setNewFolderName('');
    setNewFolderDesc('');
    setNewFolderColor('blue');
    setIsCreateModalOpen(false);

    // Optionally auto-open the newly created folder
    setSelectedFolderId(created.id);
  };

  // Handle Edit Folder Submit
  const handleUpdateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFolder || !editName.trim()) return;

    updateProjectFolder(editingFolder.id, {
      name: editName.trim(),
      description: editDesc.trim(),
      color: editColor,
    });

    setFolders(getProjectFolders());
    setEditingFolder(null);
  };

  // Handle Delete Folder Submit
  const handleDeleteFolderConfirm = () => {
    if (!deletingFolder) return;
    deleteProjectFolder(deletingFolder.id);
    setFolders(getProjectFolders());
    if (selectedFolderId === deletingFolder.id) {
      setSelectedFolderId(null);
    }
    setDeletingFolder(null);
  };

  // Open Add Projects Modal for active folder
  const handleOpenAddProjectsModal = () => {
    if (!activeFolder) return;
    setSelectedProjectIdsForFolder([...activeFolder.projectIds]);
    setProjectSearchInModal('');
    setIsAddProjectsModalOpen(true);
  };

  // Save selected projects to active folder
  const handleSaveProjectsToFolder = () => {
    if (!activeFolder) return;
    const current = getProjectFolders();
    const target = current.find((f) => f.id === activeFolder.id);
    if (target) {
      target.projectIds = selectedProjectIdsForFolder;
      target.updatedAt = new Date().toISOString();
      saveProjectFolders(current);
      setFolders([...current]);
    }
    setIsAddProjectsModalOpen(false);
  };

  // Quick remove project from current active folder
  const handleRemoveProjectFromActiveFolder = (projectId: string) => {
    if (!activeFolder) return;
    removeProjectFromFolder(activeFolder.id, projectId);
    setFolders(getProjectFolders());
  };

  return (
    <div
      className={`flex-1 flex flex-col h-full w-full overflow-hidden select-none transition-colors ${
        workspaceDarkMode
          ? 'bg-[#0A1A2F] text-zinc-100'
          : 'bg-[#F1F5F4] text-[#2F3E46]'
      }`}
    >
      {/* TOP HEADER NAVIGATION BAR */}
      <header
        className={`shrink-0 border-b px-6 py-3.5 flex items-center justify-between gap-4 backdrop-blur-md transition-colors ${
          workspaceDarkMode
            ? 'border-zinc-800/80 bg-zinc-950/40'
            : 'border-slate-200/90 bg-white/70'
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Back Button */}
          <button
            type="button"
            onClick={() => {
              if (selectedFolderId) {
                setSelectedFolderId(null);
                setSearchQuery('');
              } else {
                setActiveView('gallery');
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
              workspaceDarkMode
                ? 'border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 hover:text-white'
                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{selectedFolderId ? 'Semua Folder' : 'Kembali ke Home'}</span>
          </button>

          {/* Breadcrumb Navigation */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-zinc-400">
            <button
              type="button"
              onClick={() => setActiveView('gallery')}
              className="hover:text-blue-500 transition-colors"
            >
              Home
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
            <button
              type="button"
              onClick={() => {
                setSelectedFolderId(null);
                setSearchQuery('');
              }}
              className={`transition-colors ${
                selectedFolderId ? 'hover:text-blue-500 text-zinc-400' : 'text-blue-400 font-semibold'
              }`}
            >
              Folder Proyek
            </button>
            {activeFolder && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
                <span className="text-zinc-200 font-semibold truncate max-w-[200px]">
                  {activeFolder.name}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-3">
          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeFolder ? 'Cari proyek di folder...' : 'Cari folder proyek...'}
              className={`w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs outline-none transition-all ${
                workspaceDarkMode
                  ? 'bg-zinc-900/80 border-zinc-800 text-white placeholder-zinc-500 focus:border-blue-500'
                  : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-400'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={refreshData}
            disabled={isLoading}
            className={`p-2 rounded-xl border text-zinc-400 hover:text-white transition-all cursor-pointer ${
              workspaceDarkMode
                ? 'border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800'
                : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
            title="Muat Ulang"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-500' : ''}`} />
          </button>

          {!selectedFolderId && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs cursor-pointer shadow-md transition-all shrink-0"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Buat Folder Baru</span>
            </button>
          )}

          {activeFolder && (
            <button
              type="button"
              onClick={handleOpenAddProjectsModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs cursor-pointer shadow-md transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Masukkan Proyek</span>
            </button>
          )}
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* VIEW 1: ALL FOLDERS OVERVIEW */}
        {!activeFolder && (
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* Hero / Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800/40">
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5">
                  <Folder className="w-6 h-6 text-amber-400" />
                  <span>Kumpulan Folder Proyek</span>
                </h1>
                <p className="text-xs text-zinc-400 mt-1">
                  Kelola dan kelompokkan desain carousel Anda berdasarkan klien, topik, atau kampanye promosi.
                </p>
              </div>

              {/* Quick Stats Badges */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs px-3 py-1 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                  {folders.length} Folder
                </span>
                <span className="text-xs px-3 py-1 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                  {savedProjects.length} Total Proyek
                </span>
                {uncategorizedProjects.length > 0 && (
                  <span className="text-xs px-3 py-1 rounded-xl bg-zinc-800 text-zinc-400 border border-zinc-700 font-medium">
                    {uncategorizedProjects.length} Belum di Folder
                  </span>
                )}
              </div>
            </div>

            {/* Folders Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* New Folder Quick Card */}
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className={`p-5 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center gap-3 transition-all cursor-pointer group min-h-[160px] ${
                  workspaceDarkMode
                    ? 'border-zinc-800 hover:border-blue-500/60 bg-zinc-950/20 hover:bg-blue-500/5'
                    : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xs">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-200 group-hover:text-blue-400 transition-colors">
                    + Tambah Folder Baru
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    Buat ruang kategori baru
                  </div>
                </div>
              </button>

              {/* Folders List */}
              {filteredFolders.map((folder) => {
                const colorTheme = getFolderColorTheme(folder.color);
                const projectCount = folder.projectIds.length;

                return (
                  <div
                    key={folder.id}
                    onClick={() => {
                      setSelectedFolderId(folder.id);
                      setSearchQuery('');
                    }}
                    className={`group relative p-5 rounded-2xl border flex flex-col justify-between transition-all shadow-sm hover:shadow-md hover:scale-[1.01] cursor-pointer ${
                      workspaceDarkMode
                        ? 'bg-zinc-900/70 hover:bg-zinc-900 border-zinc-800/80 hover:border-zinc-700'
                        : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
                    }`}
                  >
                    <div>
                      {/* Folder Top Row: Icon + Menu */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div
                          className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-105 ${colorTheme.bg} ${colorTheme.border} ${colorTheme.text}`}
                        >
                          <Folder className="w-5 h-5 fill-current/20" />
                        </div>

                        {/* Folder Options Dropdown / Actions */}
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 opacity-80 group-hover:opacity-100"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setEditingFolder(folder);
                              setEditName(folder.name);
                              setEditDesc(folder.description);
                              setEditColor(folder.color);
                            }}
                            title="Edit Folder"
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingFolder(folder)}
                            title="Hapus Folder"
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Folder Name & Description */}
                      <h3 className="text-sm font-bold text-zinc-100 group-hover:text-blue-400 transition-colors truncate">
                        {folder.name}
                      </h3>
                      <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 min-h-[28px]">
                        {folder.description || 'Tidak ada deskripsi'}
                      </p>
                    </div>

                    {/* Bottom Metadata: Count & Arrow */}
                    <div className="mt-4 pt-3 border-t border-zinc-800/50 flex items-center justify-between text-[11px]">
                      <span className="font-mono text-zinc-400 flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${colorTheme.badge}`} />
                        <span>{projectCount} Proyek</span>
                      </span>

                      <span className="text-zinc-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all flex items-center gap-1 font-medium text-xs">
                        <span>Buka</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Empty State */}
            {filteredFolders.length === 0 && (
              <div className="text-center py-16 px-4 border border-dashed rounded-3xl border-zinc-800 bg-zinc-950/20">
                <Folder className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-zinc-300">Folder tidak ditemukan</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                  {searchQuery ? `Tidak ada folder yang cocok dengan pencarian "${searchQuery}"` : 'Belum ada folder yang dibuat. Mulai kelompokkan proyek Anda sekarang.'}
                </p>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>Buat Folder Sekarang</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: FOLDER DETAIL VIEW (Inside Selected Folder) */}
        {activeFolder && (
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* Folder Header Banner */}
            {(() => {
              const theme = getFolderColorTheme(activeFolder.color);
              return (
                <div
                  className={`p-6 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                    workspaceDarkMode
                      ? 'bg-zinc-900/60 border-zinc-800'
                      : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 ${theme.bg} ${theme.border} ${theme.text}`}
                    >
                      <Folder className="w-7 h-7 fill-current/20" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-100">
                          {activeFolder.name}
                        </h1>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${theme.bg} ${theme.text} border ${theme.border}`}>
                          {theme.label}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1 max-w-xl">
                        {activeFolder.description || 'Kelompokkan proyek dalam folder ini agar alur kerja Anda lebih rapi dan terorganisir.'}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-zinc-500">
                        <span>{projectsInActiveFolder.length} Proyek di folder ini</span>
                        <span>•</span>
                        <span>Dibuat: {new Date(activeFolder.createdAt).toLocaleDateString('id-ID')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Folder Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingFolder(activeFolder);
                        setEditName(activeFolder.name);
                        setEditDesc(activeFolder.description);
                        setEditColor(activeFolder.color);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                        workspaceDarkMode
                          ? 'border-zinc-800 bg-zinc-800/70 hover:bg-zinc-800 text-zinc-300'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Folder</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeletingFolder(activeFolder)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenAddProjectsModal}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs cursor-pointer shadow-md transition-all ml-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Masukkan Proyek</span>
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Toolbar: Layout switcher and counter */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-300">
                  Daftar Proyek di Folder Ini
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-semibold">
                  {projectsInActiveFolder.length}
                </span>
              </div>

              <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900/60 p-0.5">
                <button
                  type="button"
                  onClick={() => setViewLayout('grid')}
                  className={`p-1 rounded cursor-pointer ${
                    viewLayout === 'grid'
                      ? 'bg-blue-600 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewLayout('list')}
                  className={`p-1 rounded cursor-pointer ${
                    viewLayout === 'list'
                      ? 'bg-blue-600 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="List View"
                >
                  <LayoutList className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Empty Projects State */}
            {projectsInActiveFolder.length === 0 ? (
              <div className="text-center py-20 px-4 border border-dashed rounded-3xl border-zinc-800 bg-zinc-950/20">
                <FolderOpen className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-zinc-200">
                  Belum ada proyek di dalam folder ini
                </h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                  Pilih proyek dari daftar proyek tersimpan Anda untuk dikelompokkan ke dalam folder "{activeFolder.name}".
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddProjectsModal}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs cursor-pointer shadow-md transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Pilih &amp; Masukkan Proyek</span>
                </button>
              </div>
            ) : viewLayout === 'list' ? (
              /* LIST VIEW */
              <div className="space-y-2">
                {projectsInActiveFolder.map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => handleOpenProject(proj)}
                    className={`group p-3.5 rounded-2xl border flex items-center justify-between gap-4 cursor-pointer transition-all ${
                      workspaceDarkMode
                        ? 'bg-zinc-900/70 hover:bg-zinc-900 border-zinc-800 hover:border-blue-500/50'
                        : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold truncate group-hover:text-blue-400 transition-colors">
                          {proj.name}
                        </div>
                        <div className="text-[11px] text-zinc-400 truncate">
                          {proj.description || `${proj.slides.length} slides • Rasio ${proj.aspectRatio}`}
                        </div>
                      </div>
                    </div>

                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-2 shrink-0"
                    >
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-semibold">
                        {proj.aspectRatio} • {proj.slides.length} slides
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenProject(proj)}
                        className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs cursor-pointer shadow-xs"
                      >
                        Buka
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicateProject(proj)}
                        title="Duplikat Proyek"
                        className={`p-1.5 rounded-lg border cursor-pointer transition-colors ${
                          workspaceDarkMode
                            ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveProjectFromActiveFolder(proj.id)}
                        title="Keluarkan dari folder ini"
                        className="p-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* GRID VIEW */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {projectsInActiveFolder.map((proj) => {
                  const projTheme =
                    THEME_PALETTES.find((t) => t.id === proj.themeId) ||
                    THEME_PALETTES[0];
                  const dim =
                    ASPECT_RATIOS[proj.aspectRatio] || ASPECT_RATIOS['4:5'];
                  const previewScale =
                    proj.aspectRatio === '9:16' ? 0.20 : 0.26;
                  const firstSlide = proj.slides?.[0];

                  return (
                    <div
                      key={proj.id}
                      onClick={() => handleOpenProject(proj)}
                      className={`group rounded-2xl border overflow-hidden flex flex-col justify-between transition-all shadow-sm hover:shadow-md hover:scale-[1.01] cursor-pointer ${
                        workspaceDarkMode
                          ? 'bg-zinc-900/80 hover:bg-zinc-900 border-zinc-800 hover:border-blue-500/50'
                          : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-blue-400'
                      }`}
                    >
                      {/* Visual Thumbnail */}
                      <div
                        className={`p-4 flex items-center justify-center border-b min-h-[200px] relative ${
                          workspaceDarkMode
                            ? 'bg-zinc-950/80 border-zinc-800/80'
                            : 'bg-slate-100/70 border-slate-200'
                        }`}
                      >
                        {firstSlide ? (
                          <div
                            className="relative overflow-hidden rounded-md shadow-md ring-1 ring-white/10 group-hover:scale-[1.02] transition-transform"
                            style={{
                              width: `${Math.round(dim.stageWidth * previewScale)}px`,
                              height: `${Math.round(dim.stageHeight * previewScale)}px`,
                            }}
                          >
                            <div className="pointer-events-none">
                              <SlideStage
                                slide={firstSlide}
                                slideIndex={0}
                                totalSlides={proj.slides.length}
                                aspectRatio={proj.aspectRatio}
                                theme={projTheme}
                                branding={proj.branding}
                                scale={previewScale}
                                interactive={false}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="w-16 h-20 rounded bg-zinc-800/40 flex items-center justify-center text-zinc-500">
                            <Layers className="w-6 h-6" />
                          </div>
                        )}

                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white border border-white/10 uppercase">
                            {proj.aspectRatio}
                          </span>
                        </div>
                      </div>

                      {/* Card Info & Actions */}
                      <div className="p-4 flex flex-col gap-2.5">
                        <div>
                          <h4 className="text-xs font-bold text-zinc-100 group-hover:text-blue-400 transition-colors truncate">
                            {proj.name}
                          </h4>
                          <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                            {proj.description || `${proj.slides.length} slides • ${proj.aspectRatio}`}
                          </p>
                        </div>

                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="pt-2 border-t border-zinc-800/60 flex items-center justify-between"
                        >
                          <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(proj.updatedAt).toLocaleDateString('id-ID')}</span>
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleDuplicateProject(proj)}
                              title="Duplikat Proyek"
                              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveProjectFromActiveFolder(proj.id)}
                              title="Keluarkan dari folder ini"
                              className="p-1 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenProject(proj)}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs cursor-pointer transition-all shadow-xs"
                            >
                              Buka
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL 1: CREATE NEW FOLDER */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div
            className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl transition-all ${
              workspaceDarkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold">Buat Folder Proyek Baru</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Nama Folder <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Contoh: Klien Arka Media, Promo Ramadhan, Tips Tech"
                  className={`w-full px-3.5 py-2 rounded-xl border text-xs outline-none ${
                    workspaceDarkMode
                      ? 'bg-zinc-950 border-zinc-800 text-white focus:border-blue-500'
                      : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-blue-500'
                  }`}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Deskripsi Folder (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={newFolderDesc}
                  onChange={(e) => setNewFolderDesc(e.target.value)}
                  placeholder="Catatan mengenai isi proyek atau target kampanye di folder ini..."
                  className={`w-full px-3.5 py-2 rounded-xl border text-xs outline-none resize-none ${
                    workspaceDarkMode
                      ? 'bg-zinc-950 border-zinc-800 text-white focus:border-blue-500'
                      : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-blue-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">
                  Warna Folder
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {FOLDER_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setNewFolderColor(c.id)}
                      className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                        newFolderColor === c.id
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.label}
                    >
                      {newFolderColor === c.id && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!newFolderName.trim()}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md"
                >
                  Simpan Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT FOLDER */}
      {editingFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div
            className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl transition-all ${
              workspaceDarkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold">Edit Folder Proyek</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingFolder(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateFolder} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Nama Folder <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl border text-xs outline-none ${
                    workspaceDarkMode
                      ? 'bg-zinc-950 border-zinc-800 text-white focus:border-blue-500'
                      : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-blue-500'
                  }`}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Deskripsi Folder
                </label>
                <textarea
                  rows={2}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl border text-xs outline-none resize-none ${
                    workspaceDarkMode
                      ? 'bg-zinc-950 border-zinc-800 text-white focus:border-blue-500'
                      : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-blue-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">
                  Warna Folder
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {FOLDER_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setEditColor(c.id)}
                      className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                        editColor === c.id
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.label}
                    >
                      {editColor === c.id && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingFolder(null)}
                  className="px-4 py-2 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!editName.trim()}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md"
                >
                  Perbarui Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE FOLDER CONFIRMATION */}
      {deletingFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div
            className={`w-full max-w-sm rounded-3xl border p-6 shadow-2xl transition-all ${
              workspaceDarkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-3">
              <Trash2 className="w-5 h-5" />
            </div>

            <h3 className="text-sm font-bold text-zinc-100">
              Hapus Folder "{deletingFolder.name}"?
            </h3>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              Folder akan dihapus, tetapi <strong>proyek-proyek di dalamnya tetap aman</strong> dan tidak akan terhapus dari proyek tersimpan Anda.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingFolder(null)}
                className="px-4 py-2 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteFolderConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md"
              >
                Ya, Hapus Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: ADD / MANAGE PROJECTS IN FOLDER */}
      {isAddProjectsModalOpen && activeFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div
            className={`w-full max-w-2xl max-h-[85vh] rounded-3xl border flex flex-col shadow-2xl overflow-hidden transition-all ${
              workspaceDarkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Folder className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Masukkan Proyek ke "{activeFolder.name}"</h3>
                  <p className="text-[11px] text-zinc-400">
                    Centang proyek yang ingin Anda kelompokkan ke folder ini
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddProjectsModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="px-5 py-3 border-b border-zinc-800/60 flex items-center justify-between gap-3 shrink-0">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={projectSearchInModal}
                  onChange={(e) => setProjectSearchInModal(e.target.value)}
                  placeholder="Cari dari daftar proyek tersimpan..."
                  className={`w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs outline-none ${
                    workspaceDarkMode
                      ? 'bg-zinc-950 border-zinc-800 text-white focus:border-blue-500'
                      : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-blue-500'
                  }`}
                />
              </div>

              {/* Quick Select All / Deselect All */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const allIds = savedProjects.map((p) => p.id);
                    setSelectedProjectIdsForFolder(allIds);
                  }}
                  className="text-[11px] text-blue-400 hover:underline font-semibold"
                >
                  Pilih Semua
                </button>
                <span className="text-zinc-600">•</span>
                <button
                  type="button"
                  onClick={() => setSelectedProjectIdsForFolder([])}
                  className="text-[11px] text-zinc-400 hover:underline"
                >
                  Batal Pilih
                </button>
              </div>
            </div>

            {/* Modal Projects List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-2">
              {savedProjects
                .filter((p) => {
                  if (!projectSearchInModal.trim()) return true;
                  const q = projectSearchInModal.toLowerCase();
                  return (
                    p.name.toLowerCase().includes(q) ||
                    p.description.toLowerCase().includes(q)
                  );
                })
                .map((proj) => {
                  const isChecked = selectedProjectIdsForFolder.includes(proj.id);

                  return (
                    <div
                      key={proj.id}
                      onClick={() => {
                        setSelectedProjectIdsForFolder((prev) =>
                          isChecked
                            ? prev.filter((id) => id !== proj.id)
                            : [...prev, proj.id]
                        );
                      }}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        isChecked
                          ? 'border-blue-500/60 bg-blue-500/10'
                          : workspaceDarkMode
                          ? 'border-zinc-800/80 bg-zinc-950/40 hover:bg-zinc-800/40'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                            isChecked
                              ? 'bg-blue-600 border-blue-500 text-white'
                              : 'border-zinc-700 bg-zinc-800/60 text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>

                        <div className="min-w-0">
                          <div className="text-xs font-bold text-zinc-200 truncate">
                            {proj.name}
                          </div>
                          <div className="text-[11px] text-zinc-400 truncate">
                            {proj.slides.length} slides • Rasio {proj.aspectRatio}
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 shrink-0 uppercase">
                        {proj.aspectRatio}
                      </span>
                    </div>
                  );
                })}

              {savedProjects.length === 0 && (
                <div className="text-center py-12 text-zinc-500 text-xs">
                  Belum ada proyek tersimpan di akun Anda.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-950/40">
              <span className="text-xs text-zinc-400 font-medium">
                {selectedProjectIdsForFolder.length} proyek terpilih
              </span>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddProjectsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveProjectsToFolder}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all"
                >
                  Simpan ke Folder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
