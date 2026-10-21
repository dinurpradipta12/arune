import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  FolderOpen,
  FolderPlus,
  Plus,
  Trash2,
  Check,
  Share2,
  Clock,
  Briefcase,
  Crown,
  Edit3,
  Eye,
  Home,
  Sliders,
  Search,
  Sun,
  Moon,
  Shield,
  Palette,
  Type,
  Sparkles,
  Download,
} from 'lucide-react';
import {
  getTeams,
  getActiveTeamId,
  setActiveTeamId,
  createTeam,
  addTeamMember,
  updateMemberRole,
  removeTeamMember,
  getTeamProjects,
  saveTeamProject,
  deleteTeamProject,
  getCurrentUserProfile,
  saveCurrentUserProfile,
  getTeamBrandKit,
  updateTeamBrandKit,
  type UserProfile,
} from '../../services/teamWorkspaceService';
import type { TeamWorkspace, TeamRole, TeamProjectRecord, TeamBrandKit } from '../../types/team';
import { DEFAULT_TEAM_BRAND_KIT } from '../../types/team';
import { useStudioStore } from '../../store/useStudioStore';
import { isElectronMac } from '../../utils/platform';

const AVAILABLE_HEADING_FONTS = [
  'Plus Jakarta Sans',
  'Cormorant Garamond',
  'Playfair Display',
  'Syne',
  'Cinzel',
  'Montserrat',
  'Instrument Serif',
  'Bebas Neue',
  'Inter',
];

const AVAILABLE_BODY_FONTS = [
  'Plus Jakarta Sans',
  'Inter',
  'Cormorant Garamond',
  'Playfair Display',
  'Roboto',
  'Lato',
];

export const TeamWorkspacePage: React.FC = () => {
  const {
    projectId,
    projectTitle,
    aspectRatio,
    activeThemeId,
    branding,
    updateBranding,
    updateThemeColors,
    scriptText,
    slides,
    loadProjectSnapshot,
    setActiveView,
    workspaceDarkMode,
    setWorkspaceDarkMode,
    openBlankDocumentTab,
    getActiveTheme,
  } = useStudioStore();

  const isDark = workspaceDarkMode;

  const [teams, setTeams] = useState<TeamWorkspace[]>([]);
  const [activeTeamId, setCurrentActiveTeamId] = useState<string | null>(null);

  // Tab inside folder: 'projects' or 'brand-kit'
  const [folderTab, setFolderTab] = useState<'projects' | 'brand-kit'>('projects');

  // Form states for adding member
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<TeamRole>('editor');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  // Form states for creating new team folder
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');

  // Team projects list & search
  const [teamProjects, setTeamProjects] = useState<TeamProjectRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Brand Kit State
  const [brandKit, setBrandKit] = useState<TeamBrandKit>({ ...DEFAULT_TEAM_BRAND_KIT });
  const [brandKitSaved, setBrandKitSaved] = useState(false);
  const [brandKitAppliedToast, setBrandKitAppliedToast] = useState<string | null>(null);

  // User profile
  const [userProfile, setUserProfile] = useState<UserProfile>(getCurrentUserProfile());
  const [profileSaved, setProfileSaved] = useState(false);

  // Load initial data
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    const loadedTeams = getTeams();
    setTeams(loadedTeams);
    const activeId = getActiveTeamId() || loadedTeams[0]?.id || null;
    setCurrentActiveTeamId(activeId);
    if (activeId) {
      setTeamProjects(getTeamProjects(activeId));
      setBrandKit(getTeamBrandKit(activeId));
    }
    setUserProfile(getCurrentUserProfile());
  };

  const currentTeam = teams.find((t) => t.id === activeTeamId) || teams[0];

  const handleSelectTeam = (teamId: string) => {
    setActiveTeamId(teamId);
    setCurrentActiveTeamId(teamId);
    setTeamProjects(getTeamProjects(teamId));
    setBrandKit(getTeamBrandKit(teamId));
    setInviteError(null);
    setInviteSuccess(null);
  };

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    const created = createTeam(newTeamName, newTeamDesc);
    setNewTeamName('');
    setNewTeamDesc('');
    setIsCreatingTeam(false);
    refreshData();
    handleSelectTeam(created.id);
  };

  const handleInviteMember = (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    setInviteSuccess(null);

    if (!currentTeam) return;
    if (!newMemberName.trim() || !newMemberEmail.trim()) {
      setInviteError('Harap isi nama dan email rekan kerja.');
      return;
    }

    const res = addTeamMember(currentTeam.id, {
      name: newMemberName,
      email: newMemberEmail,
      role: newMemberRole,
    });

    if (!res) {
      setInviteError('Email ini sudah terdaftar di tim ini.');
      return;
    }

    setInviteSuccess(`Anggota ${newMemberName} berhasil ditambahkan!`);
    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberRole('editor');
    refreshData();
  };

  const handleRoleChange = (memberId: string, role: TeamRole) => {
    if (!currentTeam) return;
    updateMemberRole(currentTeam.id, memberId, role);
    refreshData();
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    if (!currentTeam) return;
    if (confirm(`Yakin ingin menghapus ${memberName} dari folder tim ${currentTeam.name}?`)) {
      removeTeamMember(currentTeam.id, memberId);
      refreshData();
    }
  };

  const handleShareCurrentProjectToTeam = () => {
    if (!currentTeam) return;
    const snapshot = {
      projectTitle: projectTitle || 'Untitled Carousel Project',
      aspectRatio,
      activeThemeId,
      branding,
      scriptText,
      slides,
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };
    const json = JSON.stringify(snapshot);

    saveTeamProject(currentTeam.id, {
      id: projectId || `proj_${Date.now()}`,
      title: projectTitle || 'Untitled Carousel Project',
      aspectRatio,
      slideCount: slides.length,
      projectJson: json,
    });

    setTeamProjects(getTeamProjects(currentTeam.id));
    alert(`Project "${projectTitle}" berhasil disimpan ke folder tim ${currentTeam.name}!`);
  };

  const handleLoadTeamProject = (record: TeamProjectRecord) => {
    try {
      const parsed = JSON.parse(record.projectJson);
      loadProjectSnapshot(parsed);
      setActiveView('editor');
    } catch {
      alert('Gagal memuat snapshot project tim.');
    }
  };

  const handleDeleteTeamProject = (recordId: string, title: string) => {
    if (!currentTeam) return;
    if (confirm(`Hapus project tim "${title}"?`)) {
      deleteTeamProject(currentTeam.id, recordId);
      setTeamProjects(getTeamProjects(currentTeam.id));
    }
  };

  const handleCreateNewBlankProjectInTeam = () => {
    openBlankDocumentTab('4:5');
    setActiveView('editor');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    saveCurrentUserProfile(userProfile);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
    refreshData();
  };

  // Brand Kit Handlers
  const handleUpdateBrandKitField = (partial: Partial<TeamBrandKit>) => {
    if (!currentTeam) return;
    const updated = updateTeamBrandKit(currentTeam.id, partial);
    if (updated) {
      setBrandKit(updated);
      setBrandKitSaved(true);
      setTimeout(() => setBrandKitSaved(false), 2000);
    }
  };

  const handleApplyBrandKitToCurrentProject = () => {
    if (!currentTeam) return;
    updateBranding({
      publicationName: brandKit.publicationName,
      authorOrHandle: brandKit.authorOrHandle,
      issueLabel: brandKit.issueLabel,
      footerNote: brandKit.footerNote,
      showSlideNumbers: brandKit.showSlideNumbers,
      showFooterBar: brandKit.showFooterBar,
    });
    updateThemeColors({
      accent: brandKit.accentColor,
      background: brandKit.backgroundColor,
      textPrimary: brandKit.textColor,
      headingFont: brandKit.headingFont,
      bodyFont: brandKit.bodyFont,
    });
    setBrandKitAppliedToast(`Brand Kit tim "${currentTeam.name}" berhasil diterapkan ke proyek aktif di kanvas!`);
    setTimeout(() => setBrandKitAppliedToast(null), 4000);
  };

  const handleImportBrandKitFromCanvas = () => {
    if (!currentTeam) return;
    const theme = getActiveTheme();
    const imported: Partial<TeamBrandKit> = {
      publicationName: branding.publicationName || brandKit.publicationName,
      authorOrHandle: branding.authorOrHandle || brandKit.authorOrHandle,
      issueLabel: branding.issueLabel || brandKit.issueLabel,
      footerNote: branding.footerNote || brandKit.footerNote,
      showSlideNumbers: branding.showSlideNumbers,
      showFooterBar: branding.showFooterBar,
      primaryColor: theme.accent || brandKit.primaryColor,
      accentColor: theme.accent || brandKit.accentColor,
      backgroundColor: theme.background || brandKit.backgroundColor,
      textColor: theme.textPrimary || brandKit.textColor,
      headingFont: theme.headingFont || brandKit.headingFont,
      bodyFont: theme.bodyFont || brandKit.bodyFont,
    };
    handleUpdateBrandKitField(imported);
    alert(`Branding dari kanvas aktif berhasil diimpor sebagai Brand Kit resmi tim "${currentTeam.name}"!`);
  };

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return teamProjects;
    return teamProjects.filter((p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.lastEditedBy.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [teamProjects, searchQuery]);

  return (
    <div
      className={`h-screen w-screen flex flex-col overflow-hidden select-none transition-colors duration-200 ${
        isDark
          ? 'studio-theme-dark bg-[#071322] text-slate-100'
          : 'studio-theme-light bg-[#F8FAFC] text-slate-900'
      }`}
    >
      
      {/* ========================================================
          TOP NAVBAR
         ======================================================== */}
      <header
        className={`h-14 border-b flex items-center justify-between px-4 sm:px-6 z-30 shrink-0 mac-drag-region ${
          isDark
            ? 'bg-[#0A1A2F]/90 border-zinc-800'
            : 'bg-white border-slate-200 shadow-xs'
        } ${isElectronMac() ? 'pl-20' : ''}`}
      >
        <div className="flex items-center gap-3 mac-no-drag">
          <button
            type="button"
            onClick={() => setActiveView('gallery')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer shadow-xs ${
              isDark
                ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-slate-200 hover:text-blue-400'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-blue-600'
            }`}
          >
            <Home className="w-3.5 h-3.5 text-blue-600" />
            <span>Home</span>
          </button>

          <span className={isDark ? 'text-zinc-700' : 'text-slate-300'}>|</span>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h1 className={`text-sm font-bold tracking-tight flex items-center gap-2 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                Team Workspace & Brand Kit
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  isDark
                    ? 'bg-blue-900/60 text-blue-300 border-blue-800/80'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  Fase 2: Shared Brand Kit
                </span>
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mac-no-drag">
          <button
            type="button"
            onClick={() => setActiveView('editor')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer shadow-xs flex items-center gap-1.5 ${
              isDark
                ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-slate-200 hover:text-blue-400'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-blue-600'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Buka Studio Editor</span>
          </button>

          <button
            type="button"
            onClick={() => setWorkspaceDarkMode(!workspaceDarkMode)}
            title="Toggle Dark / Light Mode"
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              isDark
                ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            {workspaceDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ========================================================
          MAIN TWO-COLUMN WORKSPACE BODY
         ======================================================== */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        
        {/* ========================================================
            LEFT & CENTER COLUMN: TEAM FOLDERS, PROJECTS & BRAND KIT
           ======================================================== */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          
          {/* TOAST NOTIFICATION */}
          {brandKitAppliedToast && (
            <div className="p-3.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs flex items-center justify-between shadow-lg animate-fade-in">
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>{brandKitAppliedToast}</span>
              </span>
              <button
                type="button"
                onClick={() => setActiveView('editor')}
                className="px-2.5 py-1 bg-white text-emerald-800 rounded-md font-bold text-[11px] hover:bg-emerald-50 cursor-pointer shadow-xs"
              >
                Buka Editor →
              </button>
            </div>
          )}

          {/* 1. TEAM FOLDERS SELECTOR STRIP */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-xs uppercase tracking-wider font-bold ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Folder Tiap Team ({teams.length})
                </h2>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Pilih folder tim untuk mengelola proyek bersama dan Brand Kit resmi tim.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCreatingTeam(!isCreatingTeam)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>+ Buat Folder Tim</span>
              </button>
            </div>

            {/* Create Team Inline Drawer */}
            {isCreatingTeam && (
              <form
                onSubmit={handleCreateTeam}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row items-stretch sm:items-center gap-3 animate-slide-down ${
                  isDark
                    ? 'border-blue-900/60 bg-blue-950/30'
                    : 'border-blue-200 bg-blue-50/70'
                }`}
              >
                <input
                  type="text"
                  placeholder="Nama Folder Tim (cth: Creative Agency, Klien XYZ)..."
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark
                      ? 'bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500'
                      : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                  autoFocus
                />
                <input
                  type="text"
                  placeholder="Deskripsi singkat (opsional)..."
                  value={newTeamDesc}
                  onChange={(e) => setNewTeamDesc(e.target.value)}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark
                      ? 'bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500'
                      : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                  >
                    Simpan Folder
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingTeam(false)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      isDark
                        ? 'bg-zinc-800 hover:bg-zinc-700 text-slate-300'
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                    }`}
                  >
                    Batal
                  </button>
                </div>
              </form>
            )}

            {/* Folder Cards Horizontal Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {teams.map((t) => {
                const isActive = t.id === activeTeamId;
                const pCount = getTeamProjects(t.id).length;
                return (
                  <div
                    key={t.id}
                    onClick={() => handleSelectTeam(t.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                      isActive
                        ? isDark
                          ? 'border-blue-500 bg-blue-950/30 ring-2 ring-blue-500/30 shadow-sm'
                          : 'border-blue-500 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-sm'
                        : isDark
                          ? 'border-zinc-800 bg-[#0A1A2F]/70 hover:border-zinc-700 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs"
                          style={{ backgroundColor: t.avatarColor || '#3B82F6' }}
                        >
                          <FolderOpen className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h3 className={`text-xs font-bold truncate ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`}>
                            {t.name}
                          </h3>
                          <p className={`text-[11px] truncate ${
                            isDark ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                            {t.description || 'Tidak ada deskripsi'}
                          </p>
                        </div>
                      </div>

                      {isActive && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white shrink-0">
                          Aktif
                        </span>
                      )}
                    </div>

                    <div className={`pt-2 border-t flex items-center justify-between text-[11px] ${
                      isDark ? 'border-zinc-800 text-slate-400' : 'border-slate-100 text-slate-500'
                    }`}>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{t.members.length} Anggota</span>
                      </span>
                      <span className={`font-semibold ${
                        isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        {pCount} Proyek
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. ACTIVE TEAM HEADER & TAB SWITCHER (PROJECTS vs BRAND KIT) */}
          {currentTeam && (
            <div className={`p-5 rounded-2xl border shadow-sm space-y-4 ${
              isDark
                ? 'bg-[#0A1A2F]/90 border-zinc-800'
                : 'bg-white border-slate-200'
            }`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: currentTeam.avatarColor || '#3B82F6' }}
                    />
                    <h2 className={`text-base font-bold ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      Folder: {currentTeam.name}
                    </h2>
                  </div>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {currentTeam.description || 'Ruang kerja proyek bersama dan Brand Kit resmi untuk tim ini.'}
                  </p>
                </div>

                {/* Sub-Tab Switcher: Projects vs Brand Kit */}
                <div className={`flex items-center gap-1 p-1 rounded-xl border ${
                  isDark
                    ? 'bg-zinc-900 border-zinc-800'
                    : 'bg-slate-100 border-slate-200'
                }`}>
                  <button
                    type="button"
                    onClick={() => setFolderTab('projects')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      folderTab === 'projects'
                        ? isDark
                          ? 'bg-zinc-800 text-blue-400 shadow-xs'
                          : 'bg-white text-blue-600 shadow-xs border border-slate-200/60'
                        : isDark
                          ? 'text-slate-400 hover:text-white'
                          : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span>Proyek ({filteredProjects.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFolderTab('brand-kit')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      folderTab === 'brand-kit'
                        ? isDark
                          ? 'bg-zinc-800 text-blue-400 shadow-xs'
                          : 'bg-white text-blue-600 shadow-xs border border-slate-200/60'
                        : isDark
                          ? 'text-slate-400 hover:text-white'
                          : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Palette className="w-3.5 h-3.5 text-blue-600" />
                    <span>Brand Kit Tim</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              VIEW 1: PROYEK CAROUSEL GRID
             ======================================================== */}
          {folderTab === 'projects' && (
            <div className="space-y-4">
              {/* Action & Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className={`w-4 h-4 absolute left-3 top-2.5 pointer-events-none ${
                    isDark ? 'text-zinc-500' : 'text-slate-400'
                  }`} />
                  <input
                    type="text"
                    placeholder="Cari proyek carousel berdasarkan judul atau nama editor..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-9 pr-4 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark
                        ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500'
                        : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 shadow-xs'
                    }`}
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleShareCurrentProjectToTeam}
                    title="Simpan carousel yang saat ini aktif di canvas ke folder ini"
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Bagikan Project Aktif ke Tim</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCreateNewBlankProjectInTeam}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Buat Proyek Baru</span>
                  </button>
                </div>
              </div>

              {/* Projects Grid Cards */}
              {filteredProjects.length === 0 ? (
                <div className={`p-12 rounded-2xl border-2 border-dashed text-center space-y-4 ${
                  isDark
                    ? 'border-zinc-800 bg-[#0A1A2F]/30'
                    : 'border-slate-200 bg-white/70'
                }`}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
                    isDark
                      ? 'bg-blue-950/40 text-blue-400'
                      : 'bg-blue-50 text-blue-600'
                  }`}>
                    <FolderOpen className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className={`text-sm font-bold ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      Belum ada proyek di folder ini
                    </h3>
                    <p className={`text-xs max-w-md mx-auto ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      Bagikan proyek carousel yang sedang Anda kerjakan di kanvas, atau buat proyek baru untuk mulai berkolaborasi dengan rekan setim.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleShareCurrentProjectToTeam}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Bagikan Project Aktif Sekarang</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateNewBlankProjectInTeam}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Buat Dokumen Baru</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProjects.map((proj) => (
                    <div
                      key={proj.id}
                      className={`rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                        isDark
                          ? 'border-zinc-800 bg-[#0A1A2F]/90 hover:border-blue-500'
                          : 'border-slate-200 bg-white hover:border-blue-400'
                      }`}
                    >
                      <div className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`text-xs font-bold line-clamp-1 ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`}>
                            {proj.title}
                          </h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                            isDark
                              ? 'bg-zinc-800 text-zinc-300'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {proj.aspectRatio}
                          </span>
                        </div>

                        <div className={`flex items-center gap-2 text-[11px] ${
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              {new Date(proj.lastEditedAt).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </span>
                          <span>•</span>
                          <span>{proj.slideCount} Slide</span>
                        </div>

                        <div className={`p-2.5 rounded-lg border text-[11.5px] ${
                          isDark
                            ? 'bg-zinc-900/60 border-zinc-800 text-slate-300'
                            : 'bg-slate-50 border-slate-100 text-slate-600'
                        }`}>
                          <span>Terakhir diedit oleh: </span>
                          <strong className={isDark ? 'text-white' : 'text-slate-900'}>
                            {proj.lastEditedBy}
                          </strong>
                        </div>
                      </div>

                      <div className={`p-3 border-t flex items-center justify-between gap-2 ${
                        isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-slate-50 border-slate-100'
                      }`}>
                        <button
                          type="button"
                          onClick={() => handleLoadTeamProject(proj)}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Buka & Edit di Studio</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteTeamProject(proj.id, proj.title)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isDark
                              ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-950/30'
                              : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                          }`}
                          title="Hapus proyek tim"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              VIEW 2: BRAND KIT & STYLE GUIDE TIM (TAHAP 2)
             ======================================================== */}
          {folderTab === 'brand-kit' && (
            <div className="space-y-6">
              
              {/* Brand Kit Quick Action Header */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isDark
                  ? 'bg-blue-950/20 border-blue-900/40'
                  : 'bg-blue-50/60 border-blue-200'
              }`}>
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className={`text-xs font-bold flex items-center gap-2 ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      <span>Brand Kit Resmi: {currentTeam.name}</span>
                      {brandKitSaved && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 animate-fade-in">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Perubahan Tersimpan</span>
                        </span>
                      )}
                    </h3>
                    <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Semua anggota tim dapat menggunakan identitas brand, warna, dan font ini dengan 1 klik.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleImportBrandKitFromCanvas}
                    title="Ambil branding dan warna dari kanvas yang sedang aktif"
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-xs flex items-center gap-1.5 ${
                      isDark
                        ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-slate-200'
                        : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    <span>Ambil dari Kanvas Aktif</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleApplyBrandKitToCurrentProject}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Terapkan ke Editor Saat Ini</span>
                  </button>
                </div>
              </div>

              {/* 3 Brand Kit Cards Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                
                {/* CARD 1: IDENTITAS & WATERMARK PUBLIKASI */}
                <div className={`p-5 rounded-2xl border space-y-4 ${
                  isDark
                    ? 'bg-[#0A1A2F]/80 border-zinc-800'
                    : 'bg-white border-slate-200 shadow-xs'
                }`}>
                  <div className={`flex items-center gap-2 pb-2 border-b ${
                    isDark ? 'border-zinc-800' : 'border-slate-100'
                  }`}>
                    <Shield className="w-4 h-4 text-blue-600" />
                    <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Identitas & Watermark
                    </h4>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className={`text-[11px] font-medium block mb-1 ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        Nama Publikasi / Masthead
                      </label>
                      <input
                        type="text"
                        value={brandKit.publicationName}
                        onChange={(e) => handleUpdateBrandKitField({ publicationName: e.target.value })}
                        className={`w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                          isDark
                            ? 'bg-zinc-900 border-zinc-700 text-white'
                            : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`text-[11px] font-medium block mb-1 ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        Handle Penulis / Akun Sosial
                      </label>
                      <input
                        type="text"
                        value={brandKit.authorOrHandle}
                        onChange={(e) => handleUpdateBrandKitField({ authorOrHandle: e.target.value })}
                        className={`w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                          isDark
                            ? 'bg-zinc-900 border-zinc-700 text-white'
                            : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`text-[11px] font-medium block mb-1 ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        Label Edisi / Volume
                      </label>
                      <input
                        type="text"
                        value={brandKit.issueLabel}
                        onChange={(e) => handleUpdateBrandKitField({ issueLabel: e.target.value })}
                        className={`w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                          isDark
                            ? 'bg-zinc-900 border-zinc-700 text-white'
                            : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`text-[11px] font-medium block mb-1 ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        Catatan Kaki (Footer Note)
                      </label>
                      <input
                        type="text"
                        value={brandKit.footerNote}
                        onChange={(e) => handleUpdateBrandKitField({ footerNote: e.target.value })}
                        className={`w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                          isDark
                            ? 'bg-zinc-900 border-zinc-700 text-white'
                            : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>

                    <div className={`pt-2 border-t space-y-2 ${
                      isDark ? 'border-zinc-800' : 'border-slate-100'
                    }`}>
                      <label className="flex items-center gap-2 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={brandKit.showSlideNumbers}
                          onChange={(e) => handleUpdateBrandKitField({ showSlideNumbers: e.target.checked })}
                          className="rounded text-blue-600"
                        />
                        <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                          Tampilkan Nomor Slide (01/06)
                        </span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={brandKit.showFooterBar}
                          onChange={(e) => handleUpdateBrandKitField({ showFooterBar: e.target.checked })}
                          className="rounded text-blue-600"
                        />
                        <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                          Tampilkan Footer Bar Editorial
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* CARD 2: PALET WARNA KHAS BRAND TIM */}
                <div className={`p-5 rounded-2xl border space-y-4 ${
                  isDark
                    ? 'bg-[#0A1A2F]/80 border-zinc-800'
                    : 'bg-white border-slate-200 shadow-xs'
                }`}>
                  <div className={`flex items-center gap-2 pb-2 border-b ${
                    isDark ? 'border-zinc-800' : 'border-slate-100'
                  }`}>
                    <Palette className="w-4 h-4 text-blue-600" />
                    <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Palet Warna Resmi Brand
                    </h4>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className={`text-[11px] font-medium block mb-1 ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        Warna Utama Brand (Primary)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={brandKit.primaryColor}
                          onChange={(e) => handleUpdateBrandKitField({ primaryColor: e.target.value })}
                          className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                        />
                        <input
                          type="text"
                          value={brandKit.primaryColor}
                          onChange={(e) => handleUpdateBrandKitField({ primaryColor: e.target.value })}
                          className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-mono uppercase border focus:outline-none ${
                            isDark
                              ? 'bg-zinc-900 border-zinc-700 text-white'
                              : 'bg-slate-50 border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`text-[11px] font-medium block mb-1 ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        Warna Aksen / Sorotan (Accent)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={brandKit.accentColor}
                          onChange={(e) => handleUpdateBrandKitField({ accentColor: e.target.value })}
                          className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                        />
                        <input
                          type="text"
                          value={brandKit.accentColor}
                          onChange={(e) => handleUpdateBrandKitField({ accentColor: e.target.value })}
                          className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-mono uppercase border focus:outline-none ${
                            isDark
                              ? 'bg-zinc-900 border-zinc-700 text-white'
                            : 'bg-slate-50 border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`text-[11px] font-medium block mb-1 ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        Latar Belakang Kanvas (Background)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={brandKit.backgroundColor}
                          onChange={(e) => handleUpdateBrandKitField({ backgroundColor: e.target.value })}
                          className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                        />
                        <input
                          type="text"
                          value={brandKit.backgroundColor}
                          onChange={(e) => handleUpdateBrandKitField({ backgroundColor: e.target.value })}
                          className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-mono uppercase border focus:outline-none ${
                            isDark
                              ? 'bg-zinc-900 border-zinc-700 text-white'
                              : 'bg-slate-50 border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`text-[11px] font-medium block mb-1 ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        Warna Teks Utama (Text Color)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={brandKit.textColor}
                          onChange={(e) => handleUpdateBrandKitField({ textColor: e.target.value })}
                          className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                        />
                        <input
                          type="text"
                          value={brandKit.textColor}
                          onChange={(e) => handleUpdateBrandKitField({ textColor: e.target.value })}
                          className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-mono uppercase border focus:outline-none ${
                            isDark
                              ? 'bg-zinc-900 border-zinc-700 text-white'
                              : 'bg-slate-50 border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Brand Swatches */}
                    <div className={`pt-2 border-t space-y-1.5 ${
                      isDark ? 'border-zinc-800' : 'border-slate-100'
                    }`}>
                      <label className={`text-[10.5px] uppercase font-bold tracking-wider block ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        5 Swatch Warna Khas Tim
                      </label>
                      <div className="flex items-center gap-2">
                        {brandKit.brandColors.map((color, idx) => (
                          <div key={idx} className="relative group">
                            <input
                              type="color"
                              value={color}
                              onChange={(e) => {
                                const copy = [...brandKit.brandColors];
                                copy[idx] = e.target.value;
                                handleUpdateBrandKitField({ brandColors: copy });
                              }}
                              className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0 shadow-xs"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* CARD 3: TIPOGRAFI & LIVE PREVIEW */}
                <div className={`p-5 rounded-2xl border space-y-4 ${
                  isDark
                    ? 'bg-[#0A1A2F]/80 border-zinc-800'
                    : 'bg-white border-slate-200 shadow-xs'
                }`}>
                  <div className={`flex items-center gap-2 pb-2 border-b ${
                    isDark ? 'border-zinc-800' : 'border-slate-100'
                  }`}>
                    <Type className="w-4 h-4 text-blue-600" />
                    <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Tipografi & Pratinjau
                    </h4>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className={`text-[11px] font-medium block mb-1 ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        Font Judul Utama (Heading Font)
                      </label>
                      <select
                        value={brandKit.headingFont}
                        onChange={(e) => handleUpdateBrandKitField({ headingFont: e.target.value })}
                        className={`w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer ${
                          isDark
                            ? 'bg-zinc-900 border-zinc-700 text-white'
                            : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      >
                        {AVAILABLE_HEADING_FONTS.map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={`text-[11px] font-medium block mb-1 ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        Font Isi / Paragraf (Body Font)
                      </label>
                      <select
                        value={brandKit.bodyFont}
                        onChange={(e) => handleUpdateBrandKitField({ bodyFont: e.target.value })}
                        className={`w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer ${
                          isDark
                            ? 'bg-zinc-900 border-zinc-700 text-white'
                            : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      >
                        {AVAILABLE_BODY_FONTS.map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>

                    {/* LIVE MINI PREVIEW CARD */}
                    <div className={`pt-2 border-t space-y-1.5 ${
                      isDark ? 'border-zinc-800' : 'border-slate-100'
                    }`}>
                      <label className={`text-[10.5px] uppercase font-bold tracking-wider block ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        Pratinjau Live Carousel Slide
                      </label>

                      <div
                        className="rounded-xl p-3 border shadow-sm aspect-4/5 flex flex-col justify-between transition-all"
                        style={{
                          backgroundColor: brandKit.backgroundColor,
                          color: brandKit.textColor,
                          borderColor: brandKit.primaryColor + '40',
                        }}
                      >
                        {/* Header bar */}
                        <div className="flex items-center justify-between text-[9px] font-bold pb-1 border-b" style={{ borderColor: brandKit.primaryColor + '20' }}>
                          <span>{brandKit.publicationName || 'PUBLICATION'}</span>
                          <span>{brandKit.issueLabel || 'VOL. 01'}</span>
                        </div>

                        {/* Middle Content */}
                        <div className="py-2 space-y-1">
                          <h5
                            className="text-sm font-bold leading-tight"
                            style={{ fontFamily: brandKit.headingFont, color: brandKit.primaryColor }}
                          >
                            Judul Carousel Tim
                          </h5>
                          <p
                            className="text-[10px] leading-relaxed opacity-85"
                            style={{ fontFamily: brandKit.bodyFont }}
                          >
                            Ini adalah pratinjau tipografi dan warna khas brand tim Anda.
                          </p>
                        </div>

                        {/* Footer bar */}
                        {brandKit.showFooterBar && (
                          <div className="flex items-center justify-between text-[8.5px] pt-1 border-t" style={{ borderColor: brandKit.primaryColor + '20' }}>
                            <span className="font-semibold" style={{ color: brandKit.accentColor }}>
                              {brandKit.authorOrHandle}
                            </span>
                            {brandKit.showSlideNumbers && <span className="opacity-75">01/06</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

        </main>

        {/* ========================================================
            RIGHT COLUMN: DEDICATED MEMBER LIST & PERMISSIONS
           ======================================================== */}
        <aside className={`w-80 lg:w-96 border-l flex flex-col shrink-0 select-none overflow-y-auto ${
          isDark
            ? 'bg-[#0A1A2F]/95 border-zinc-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900 shadow-xs'
        }`}>
          
          {/* Header Member Panel */}
          <div className={`p-4 border-b flex items-center justify-between ${
            isDark
              ? 'bg-zinc-900/50 border-zinc-800'
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className={`text-xs font-bold ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  Anggota Tim ({currentTeam?.members.length || 0})
                </h3>
                <p className={`text-[10.5px] ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Folder: {currentTeam?.name}
                </p>
              </div>
            </div>

            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
              isDark
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
              Akses Tim
            </span>
          </div>

          <div className="p-4 space-y-6">
            
            {/* 1. FORM INVITE MEMBER */}
            <div className={`p-3.5 rounded-xl border space-y-3 ${
              isDark
                ? 'bg-zinc-900/40 border-zinc-800'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className={`flex items-center gap-1.5 text-xs font-bold ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                <UserPlus className="w-4 h-4 text-blue-600" />
                <span>Undang / Tambah Rekan Kerja</span>
              </div>

              <form onSubmit={handleInviteMember} className="space-y-2.5">
                <div>
                  <input
                    type="text"
                    placeholder="Nama Rekan / Panggilan..."
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className={`w-full px-3 py-1.5 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      isDark
                        ? 'bg-zinc-950 border-zinc-700 text-white placeholder-zinc-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>

                <div>
                  <input
                    type="email"
                    placeholder="Email rekan (cth: tim@agensi.com)..."
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className={`w-full px-3 py-1.5 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      isDark
                        ? 'bg-zinc-950 border-zinc-700 text-white placeholder-zinc-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as TeamRole)}
                    className={`flex-1 px-2.5 py-1.5 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer ${
                      isDark
                        ? 'bg-zinc-950 border-zinc-700 text-slate-200'
                        : 'bg-white border-slate-300 text-slate-800'
                    }`}
                  >
                    <option value="editor">Editor (Bisa Edit)</option>
                    <option value="viewer">Viewer (Reviewer)</option>
                    <option value="owner">Co-Owner</option>
                  </select>

                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition-colors shadow-xs"
                  >
                    Tambah
                  </button>
                </div>

                {inviteError && (
                  <p className="text-[11px] text-rose-600 font-medium">{inviteError}</p>
                )}
                {inviteSuccess && (
                  <p className="text-[11px] text-emerald-600 font-medium">{inviteSuccess}</p>
                )}
              </form>
            </div>

            {/* 2. DAFTAR MEMBER LIST */}
            <div className="space-y-2.5">
              <div className={`flex items-center justify-between text-xs px-1 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                <span className="font-bold uppercase tracking-wider text-[10.5px]">Daftar Member</span>
                <span className="text-[10.5px]">Peran</span>
              </div>

              <div className={`divide-y rounded-xl border overflow-hidden shadow-xs ${
                isDark
                  ? 'divide-zinc-800 border-zinc-800 bg-zinc-900/30'
                  : 'divide-slate-100 border-slate-200 bg-white'
              }`}>
                {currentTeam?.members.map((member) => (
                  <div
                    key={member.id}
                    className={`p-3 flex items-center justify-between gap-3 transition-colors ${
                      isDark ? 'hover:bg-zinc-900/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: member.avatarColor || '#3B82F6' }}
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-bold truncate ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`}>
                            {member.name}
                          </span>
                          {member.isCurrentUser && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 font-semibold font-mono">
                              Anda
                            </span>
                          )}
                        </div>
                        <span className={`text-[10.5px] truncate block ${
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          {member.email}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {member.role === 'owner' ? (
                        <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                          <Crown className="w-3 h-3 text-amber-600" />
                          <span>Owner</span>
                        </span>
                      ) : (
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value as TeamRole)}
                          className={`px-2 py-1 rounded text-xs font-medium border focus:outline-none focus:border-blue-500 cursor-pointer ${
                            isDark
                              ? 'bg-zinc-950 border-zinc-800 text-slate-300'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <option value="editor">Editor</option>
                          <option value="viewer">Viewer</option>
                          <option value="owner">Owner</option>
                        </select>
                      )}

                      {!member.isCurrentUser && member.role !== 'owner' && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member.id, member.name)}
                          title="Hapus dari tim"
                          className={`p-1 rounded transition-colors cursor-pointer ${
                            isDark
                              ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-950/30'
                              : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. ROLES GUIDE */}
            <div className={`p-3.5 rounded-xl border space-y-2 text-xs ${
              isDark
                ? 'bg-zinc-900/20 border-zinc-800'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <span className={`font-bold uppercase tracking-wider text-[10px] block ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Tingkat Hak Akses
              </span>
              
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-start gap-1.5 text-amber-700">
                  <Crown className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <div>
                    <strong>Owner</strong>: Kontrol penuh folder, anggota tim, dan seluruh project.
                  </div>
                </div>

                <div className="flex items-start gap-1.5 text-blue-700">
                  <Edit3 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <div>
                    <strong>Editor</strong>: Bisa membuka kanvas, mengedit slide, dan menyimpan perubahan.
                  </div>
                </div>

                <div className="flex items-start gap-1.5 text-emerald-700">
                  <Eye className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <div>
                    <strong>Viewer</strong>: Hanya melihat pratinjau carousel dan ekspor HD tanpa mengubah desain.
                  </div>
                </div>
              </div>
            </div>

            {/* 4. IDENTITAS SAYA */}
            <form onSubmit={handleSaveProfile} className={`p-3.5 rounded-xl border space-y-2.5 ${
              isDark
                ? 'bg-zinc-900/40 border-zinc-800'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className={`flex items-center gap-1.5 text-xs font-bold ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                <Shield className="w-4 h-4 text-blue-600" />
                <span>Identitas Kolaborator Anda</span>
              </div>
              <p className={`text-[10.5px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Nama ini akan tercatat di riwayat edit saat Anda membagikan carousel ke tim.
              </p>

              <div>
                <label className={`text-[10.5px] block mb-1 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Nama Tampilan
                </label>
                <input
                  type="text"
                  value={userProfile.name}
                  onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                  className={`w-full px-2.5 py-1.5 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    isDark
                      ? 'bg-zinc-950 border-zinc-700 text-white'
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`text-[10.5px] block mb-1 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Email Anda
                </label>
                <input
                  type="email"
                  value={userProfile.email}
                  onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                  className={`w-full px-2.5 py-1.5 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    isDark
                      ? 'bg-zinc-950 border-zinc-700 text-white'
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="pt-1 flex items-center justify-between">
                {profileSaved ? (
                  <span className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
                    <Check className="w-3.5 h-3.5" /> Tersimpan
                  </span>
                ) : <span />}

                <button
                  type="submit"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-xs ${
                    isDark
                      ? 'bg-zinc-800 hover:bg-zinc-700 text-white'
                      : 'bg-slate-800 hover:bg-slate-900 text-white'
                  }`}
                >
                  Simpan Profil
                </button>
              </div>
            </form>

          </div>
        </aside>

      </div>
    </div>
  );
};
