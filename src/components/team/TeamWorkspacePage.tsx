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
  Loader2,
  CheckCircle2,
  AlertTriangle,
  CloudUpload,
  X,
  ChevronDown,
  LayoutGrid,
  LayoutList,
  Upload,
} from 'lucide-react';
import {
  getTeams,
  getActiveTeamId,
  setActiveTeamId,
  createTeamCloud,
  updateTeamCloud,
  deleteTeamCloud,
  uploadTeamIcon,
  addTeamMemberCloud,
  updateMemberRole,
  removeTeamMember,
  getTeamProjects,
  saveTeamProjectCloud,
  deleteTeamProject,
  getCurrentUserProfile,
  saveCurrentUserProfile,
  getTeamBrandKit,
  updateTeamBrandKit,
  syncTeamsFromCloud,
  syncProjectsFromCloud,
  ensureUuid,
  deduplicateTeamMembers,
  type UserProfile,
} from '../../services/teamWorkspaceService';
import { getSupabaseClient, isSupabaseConfigured } from '../../services/supabaseClient';
import type { TeamWorkspace, TeamRole, TeamProjectRecord, TeamBrandKit } from '../../types/team';
import { DEFAULT_TEAM_BRAND_KIT } from '../../types/team';
import { useStudioStore } from '../../store/useStudioStore';
import { isElectronMac } from '../../utils/platform';
import { UserAuthButton } from '../common/UserAuthButton';
import {
  ASPECT_RATIOS,
  THEME_PALETTES,
} from '../../constants/themesAndPresets';
import type { AspectRatioKey, CloudTemplateRecord, Slide } from '../../types/studio';
import { SlideStage } from '../canvas/SlideStage';
import { listTemplates } from '../../services/supabaseTemplates';

interface ShareableProjectCandidate {
  id: string;
  title: string;
  aspectRatio: AspectRatioKey;
  slideCount: number;
  slides: Slide[];
  themeId: string;
  branding?: any;
  scriptText?: string;
  source: 'open-tab' | 'saved-cloud';
  isActiveOnCanvas?: boolean;
}

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

const TEAM_AVATAR_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#E11D48', // Rose
  '#5E887E', // Sage
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
    openDocuments,
    activeDocumentId,
  } = useStudioStore();

  const isDark = workspaceDarkMode;

  const [teams, setTeams] = useState<TeamWorkspace[]>([]);
  const [activeTeamId, setCurrentActiveTeamId] = useState<string | null>(null);

  // Main Workspace Tab: 'projects' | 'brand-kit' | 'members'
  const [activeTab, setActiveTab] = useState<'projects' | 'brand-kit' | 'members'>('projects');

  // Team Switcher & Modals State
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);

  // Share Project Selection Modal State
  const [isShareProjectModalOpen, setIsShareProjectModalOpen] = useState(false);
  const [shareModalTab, setShareModalTab] = useState<'open-tabs' | 'saved-projects'>('open-tabs');
  const [shareSearchQuery, setShareSearchQuery] = useState('');
  const [selectedProjectIdsToShare, setSelectedProjectIdsToShare] = useState<string[]>([]);
  const [savedCloudProjects, setSavedCloudProjects] = useState<CloudTemplateRecord[]>([]);
  const [isLoadingSavedProjects, setIsLoadingSavedProjects] = useState(false);
  const [isSharingProject, setIsSharingProject] = useState(false);

  // Projects Filtering & Layout View
  const [selectedRatioFilter, setSelectedRatioFilter] = useState<'All' | '4:5' | '9:16' | '1:1'>('All');
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');

  // Form states for adding member
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<TeamRole>('editor');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  // Form states for creating new team folder
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  const [newTeamIconUrl, setNewTeamIconUrl] = useState<string | null>(null);
  const [newTeamAvatarColor, setNewTeamAvatarColor] = useState<string>('#3B82F6');
  const [isUploadingNewTeamIcon, setIsUploadingNewTeamIcon] = useState(false);

  // Edit Team Modal States
  const [isEditTeamModalOpen, setIsEditTeamModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamWorkspace | null>(null);
  const [editTeamName, setEditTeamName] = useState('');
  const [editTeamDesc, setEditTeamDesc] = useState('');
  const [editTeamIconUrl, setEditTeamIconUrl] = useState<string | null>(null);
  const [editTeamAvatarColor, setEditTeamAvatarColor] = useState<string>('#3B82F6');
  const [isUploadingEditTeamIcon, setIsUploadingEditTeamIcon] = useState(false);
  const [isSavingEditTeam, setIsSavingEditTeam] = useState(false);

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
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  // Custom App Modal State (replaces native alert/confirm)
  const [dialogModal, setDialogModal] = useState<{
    isOpen: boolean;
    type: 'success' | 'confirm-delete' | 'error' | 'info';
    title: string;
    message: React.ReactNode;
    primaryButtonText: string;
    secondaryButtonText?: string;
    onPrimary: () => void;
    onSecondary?: () => void;
  } | null>(null);

  // Load initial data and sync with Supabase Cloud
  useEffect(() => {
    refreshData();

    // Subscribe to realtime changes so teammates see updates instantly
    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      const channel = client
        .channel('arune_team_workspace_live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'team_projects' }, () => {
          refreshData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, () => {
          refreshData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
          refreshData();
        })
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    }
  }, []);

  const refreshData = async () => {
    // 1. Immediate local cache display
    const loadedTeams = getTeams();
    setTeams(loadedTeams);
    const activeId = getActiveTeamId() || loadedTeams[0]?.id || null;
    setCurrentActiveTeamId(activeId);
    if (activeId) {
      setTeamProjects(getTeamProjects(activeId));
      setBrandKit(getTeamBrandKit(activeId));
    }
    setUserProfile(getCurrentUserProfile());

    // 2. Sync with Supabase Cloud
    setIsSyncingCloud(true);
    try {
      const cloudTeams = await syncTeamsFromCloud();
      setTeams(cloudTeams);
      const effectiveActiveId = getActiveTeamId() || cloudTeams[0]?.id || null;
      setCurrentActiveTeamId(effectiveActiveId);
      if (effectiveActiveId) {
        const cloudProjects = await syncProjectsFromCloud(effectiveActiveId);
        setTeamProjects(cloudProjects);
        setBrandKit(getTeamBrandKit(effectiveActiveId));
      }
    } catch (e) {
      console.warn('Cloud team sync finished:', e);
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const currentTeam = teams.find((t) => t.id === activeTeamId) || teams[0];

  const teamMembers = useMemo(() => {
    if (!currentTeam?.members) return [];
    return deduplicateTeamMembers(currentTeam.members, currentTeam.ownerId);
  }, [currentTeam?.members, currentTeam?.ownerId]);

  const handleSelectTeam = async (teamId: string) => {
    setActiveTeamId(teamId);
    setCurrentActiveTeamId(teamId);
    setTeamProjects(getTeamProjects(teamId));
    setBrandKit(getTeamBrandKit(teamId));
    setInviteError(null);
    setInviteSuccess(null);

    const cloudProjects = await syncProjectsFromCloud(teamId);
    setTeamProjects(cloudProjects);
  };

  const handleOpenCreateTeamModal = () => {
    setNewTeamName('');
    setNewTeamDesc('');
    setNewTeamIconUrl(null);
    setNewTeamAvatarColor('#3B82F6');
    setIsCreateTeamModalOpen(true);
  };

  const handleUploadNewTeamIcon = async (file: File) => {
    setIsUploadingNewTeamIcon(true);
    try {
      const url = await uploadTeamIcon('temp_team_' + Date.now(), file);
      setNewTeamIconUrl(url);
    } catch (err) {
      console.warn('Upload icon error:', err);
    } finally {
      setIsUploadingNewTeamIcon(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    const created = await createTeamCloud(
      newTeamName,
      newTeamDesc,
      newTeamIconUrl || undefined,
      newTeamAvatarColor
    );
    setNewTeamName('');
    setNewTeamDesc('');
    setNewTeamIconUrl(null);
    setIsCreateTeamModalOpen(false);
    await refreshData();
    handleSelectTeam(created.id);
  };

  const handleOpenEditTeamModal = (team: TeamWorkspace) => {
    setEditingTeam(team);
    setEditTeamName(team.name);
    setEditTeamDesc(team.description || '');
    setEditTeamIconUrl(team.iconUrl || null);
    setEditTeamAvatarColor(team.avatarColor || '#3B82F6');
    setIsTeamDropdownOpen(false);
    setIsEditTeamModalOpen(true);
  };

  const handleUploadEditTeamIcon = async (file: File) => {
    if (!editingTeam) return;
    setIsUploadingEditTeamIcon(true);
    try {
      const url = await uploadTeamIcon(editingTeam.id, file);
      setEditTeamIconUrl(url);
    } catch (err) {
      console.warn('Upload edit icon error:', err);
    } finally {
      setIsUploadingEditTeamIcon(false);
    }
  };

  const handleSaveEditTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam || !editTeamName.trim()) return;
    setIsSavingEditTeam(true);
    try {
      await updateTeamCloud(editingTeam.id, {
        name: editTeamName.trim(),
        description: editTeamDesc.trim(),
        avatarColor: editTeamAvatarColor,
        iconUrl: editTeamIconUrl || undefined,
      });
      await refreshData();
      setIsEditTeamModalOpen(false);
      setDialogModal({
        isOpen: true,
        type: 'success',
        title: 'Ruang Kerja Tim Diperbarui',
        message: (
          <span>
            Pengaturan untuk tim <strong className="text-slate-900 dark:text-white font-semibold">"{editTeamName}"</strong> berhasil disimpan dan disinkronkan ke Supabase Cloud.
          </span>
        ),
        primaryButtonText: 'Selesai',
        onPrimary: () => setDialogModal(null),
      });
    } catch (err: any) {
      console.error('Failed to update team:', err);
    } finally {
      setIsSavingEditTeam(false);
    }
  };

  const handleDeleteTeamFromEditModal = () => {
    if (!editingTeam) return;
    setDialogModal({
      isOpen: true,
      type: 'confirm-delete',
      title: 'Hapus Ruang Kerja Tim?',
      message: (
        <span>
          Apakah Anda yakin ingin menghapus folder tim <strong className="text-red-500 font-semibold">"{editingTeam.name}"</strong>? Seluruh data proyek bersama dan brand kit di dalam tim ini akan dihapus secara permanen.
        </span>
      ),
      primaryButtonText: 'Ya, Hapus Tim',
      secondaryButtonText: 'Batal',
      onPrimary: async () => {
        await deleteTeamCloud(editingTeam.id);
        setIsEditTeamModalOpen(false);
        await refreshData();
        setDialogModal(null);
      },
      onSecondary: () => setDialogModal(null),
    });
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    setInviteSuccess(null);

    if (!currentTeam) return;
    if (!newMemberName.trim() || !newMemberEmail.trim()) {
      setInviteError('Harap isi nama dan email rekan kerja.');
      return;
    }

    setIsInviting(true);
    const validTeamId = ensureUuid(currentTeam.id);
    const res = await addTeamMemberCloud(validTeamId, {
      name: newMemberName,
      email: newMemberEmail,
      role: newMemberRole,
    });
    setIsInviting(false);

    if (!res.success) {
      setInviteError(res.error || 'Gagal menambahkan anggota.');
      return;
    }

    setInviteSuccess(`Anggota ${newMemberName} (${newMemberEmail}) berhasil ditambahkan ke tim!`);
    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberRole('editor');
    await refreshData();
    setTimeout(() => {
      setIsInviteModalOpen(false);
      setInviteSuccess(null);
    }, 1500);
  };

  const handleRoleChange = (memberId: string, role: TeamRole) => {
    if (!currentTeam) return;
    updateMemberRole(currentTeam.id, memberId, role);
    refreshData();
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    if (!currentTeam) return;
    setDialogModal({
      isOpen: true,
      type: 'confirm-delete',
      title: 'Hapus Anggota Tim?',
      message: (
        <span>
          Apakah Anda yakin ingin menghapus <strong className="text-slate-900 dark:text-white font-semibold">"{memberName}"</strong> dari tim <strong className="text-slate-900 dark:text-white font-semibold">"{currentTeam.name}"</strong>? Anggota ini tidak akan lagi memiliki akses ke proyek tim.
        </span>
      ),
      primaryButtonText: 'Ya, Hapus Anggota',
      secondaryButtonText: 'Batal',
      onPrimary: () => {
        removeTeamMember(currentTeam.id, memberId);
        refreshData();
        setDialogModal(null);
      },
      onSecondary: () => setDialogModal(null),
    });
  };

  const openTabsCandidates: ShareableProjectCandidate[] = useMemo(() => {
    if (!openDocuments || openDocuments.length === 0) {
      return [
        {
          id: projectId || 'current-active-doc',
          title: projectTitle?.trim() || 'Untitled Carousel Project',
          aspectRatio: (aspectRatio as AspectRatioKey) || '4:5',
          slideCount: slides.length || 1,
          slides: slides || [],
          themeId: activeThemeId || 'editorial-dark',
          branding,
          scriptText,
          source: 'open-tab',
          isActiveOnCanvas: true,
        },
      ];
    }

    return openDocuments.map((doc) => {
      const isActive = doc.id === activeDocumentId;
      return {
        id: doc.id,
        title: (isActive ? projectTitle : doc.projectTitle)?.trim() || 'Untitled Carousel Project',
        aspectRatio: (isActive ? aspectRatio : doc.aspectRatio) || '4:5',
        slideCount: (isActive ? slides.length : doc.slides?.length) || 1,
        slides: isActive ? slides : doc.slides || [],
        themeId: isActive ? activeThemeId : doc.activeThemeId,
        branding: isActive ? branding : doc.branding,
        scriptText: isActive ? scriptText : doc.scriptText,
        source: 'open-tab',
        isActiveOnCanvas: isActive,
      };
    });
  }, [openDocuments, activeDocumentId, projectId, projectTitle, aspectRatio, slides, activeThemeId, branding, scriptText]);

  const savedProjectsCandidates: ShareableProjectCandidate[] = useMemo(() => {
    return savedCloudProjects.map((rec) => ({
      id: rec.id,
      title: rec.name?.trim() || 'Untitled Saved Project',
      aspectRatio: (rec.aspectRatio as AspectRatioKey) || '4:5',
      slideCount: rec.slides?.length || 1,
      slides: rec.slides || [],
      themeId: rec.themeId || 'editorial-dark',
      branding: rec.branding,
      scriptText: rec.scriptText,
      source: 'saved-cloud',
      isActiveOnCanvas: false,
    }));
  }, [savedCloudProjects]);

  const loadSavedTemplatesForShare = async () => {
    if (savedCloudProjects.length > 0) return;
    setIsLoadingSavedProjects(true);
    try {
      const res = await listTemplates();
      if (res?.templates) {
        setSavedCloudProjects(res.templates);
      }
    } catch (e) {
      console.warn('Failed to load saved templates for share modal:', e);
    } finally {
      setIsLoadingSavedProjects(false);
    }
  };

  const handleOpenShareModal = () => {
    const defaultActiveId = activeDocumentId || projectId || 'current-active-doc';
    setSelectedProjectIdsToShare([defaultActiveId]);
    setShareSearchQuery('');
    setShareModalTab('open-tabs');
    setIsShareProjectModalOpen(true);
    void loadSavedTemplatesForShare();
  };

  const toggleProjectSelection = (id: string) => {
    setSelectedProjectIdsToShare((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const currentCandidates = shareModalTab === 'open-tabs' ? openTabsCandidates : savedProjectsCandidates;

  const filteredShareCandidates = useMemo(() => {
    if (!shareSearchQuery.trim()) return currentCandidates;
    const q = shareSearchQuery.toLowerCase();
    return currentCandidates.filter((c) => c.title.toLowerCase().includes(q));
  }, [currentCandidates, shareSearchQuery]);

  const handleConfirmShareProjects = async () => {
    if (!currentTeam || selectedProjectIdsToShare.length === 0) return;
    setIsSharingProject(true);

    try {
      const allCandidates = [...openTabsCandidates, ...savedProjectsCandidates];
      const selectedItems = allCandidates.filter((c) => selectedProjectIdsToShare.includes(c.id));

      for (const item of selectedItems) {
        const snapshot = {
          projectTitle: item.title,
          aspectRatio: item.aspectRatio,
          activeThemeId: item.themeId,
          branding: item.branding || DEFAULT_TEAM_BRAND_KIT,
          scriptText: item.scriptText || '',
          slides: item.slides,
          exportedAt: new Date().toISOString(),
          version: '1.0.0',
        };
        const json = JSON.stringify(snapshot);

        await saveTeamProjectCloud(currentTeam.id, {
          id: item.id.startsWith('current-') ? crypto.randomUUID() : ensureUuid(item.id),
          title: item.title,
          aspectRatio: item.aspectRatio,
          slideCount: item.slideCount,
          projectJson: json,
        });
      }

      const updatedProjects = await syncProjectsFromCloud(currentTeam.id);
      setTeamProjects(updatedProjects);
      setIsShareProjectModalOpen(false);

      setDialogModal({
        isOpen: true,
        type: 'success',
        title: 'Proyek Berhasil Dibagikan ke Tim',
        message: (
          <span>
            {selectedItems.length} proyek yang Anda pilih berhasil disimpan ke folder tim{' '}
            <strong className="text-slate-900 dark:text-white font-semibold">"{currentTeam.name}"</strong> dan tersinkronkan otomatis.
          </span>
        ),
        primaryButtonText: 'Tutup & Lanjutkan',
        onPrimary: () => setDialogModal(null),
      });
    } catch (err: any) {
      console.error('Failed to share projects to team:', err);
    } finally {
      setIsSharingProject(false);
    }
  };

  const handleLoadTeamProject = (record: TeamProjectRecord) => {
    try {
      const parsed = JSON.parse(record.projectJson);
      loadProjectSnapshot(
        {
          ...parsed,
          id: record.id,
        },
        false
      );
      setActiveView('editor');
    } catch {
      setDialogModal({
        isOpen: true,
        type: 'error',
        title: 'Gagal Memuat Proyek',
        message: 'Format data snapshot proyek tim tidak valid atau rusak.',
        primaryButtonText: 'Tutup',
        onPrimary: () => setDialogModal(null),
      });
    }
  };

  const handleDeleteTeamProject = (recordId: string, title: string) => {
    if (!currentTeam) return;
    const projectNameToDelete = title || 'Untitled';
    setDialogModal({
      isOpen: true,
      type: 'confirm-delete',
      title: 'Hapus Proyek Tim?',
      message: (
        <span>
          Apakah Anda yakin ingin menghapus proyek <strong className="text-red-600 dark:text-red-400 font-semibold">"{projectNameToDelete}"</strong>? Tindakan ini tidak dapat dibatalkan.
        </span>
      ),
      primaryButtonText: 'Ya, Hapus Proyek',
      secondaryButtonText: 'Batal',
      onPrimary: () => {
        deleteTeamProject(currentTeam.id, recordId);
        setTeamProjects(getTeamProjects(currentTeam.id));
        setDialogModal(null);
      },
      onSecondary: () => setDialogModal(null),
    });
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
    setDialogModal({
      isOpen: true,
      type: 'success',
      title: 'Brand Kit Berhasil Diimpor',
      message: (
        <span>
          Branding dari kanvas aktif berhasil diimpor dan ditetapkan sebagai <strong className="text-emerald-700 dark:text-emerald-300 font-semibold">Brand Kit resmi</strong> untuk tim <strong className="text-slate-900 dark:text-white font-semibold">"{currentTeam.name}"</strong>.
        </span>
      ),
      primaryButtonText: 'Selesai',
      onPrimary: () => setDialogModal(null),
    });
  };

  const formatRelativeTime = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Baru saja';
      if (diffMins < 60) return `${diffMins}m lalu`;
      if (diffHours < 24) return `${diffHours}j lalu`;
      if (diffDays < 7) return `${diffDays}h lalu`;
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  const filteredProjects = useMemo(() => {
    let list = teamProjects;
    if (selectedRatioFilter !== 'All') {
      list = list.filter((p) => p.aspectRatio === selectedRatioFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.lastEditedBy.toLowerCase().includes(q)
      );
    }
    return list;
  }, [teamProjects, selectedRatioFilter, searchQuery]);

  return (
    <div
      className={`h-screen w-screen flex flex-col overflow-hidden select-none transition-colors duration-200 ${
        isDark
          ? 'studio-theme-dark bg-[#071322] text-slate-100'
          : 'studio-theme-light bg-[#F8FAFC] text-[#0F172A]'
      }`}
    >
      {/* ========================================================
          1. TOP NAVBAR (Modern SaaS Team Header)
         ======================================================== */}
      <header
        className={`h-14 border-b flex items-center justify-between px-4 sm:px-6 z-30 shrink-0 mac-drag-region ${
          isDark
            ? 'bg-[#0A1A2F]/95 border-zinc-800/80 backdrop-blur-md'
            : 'bg-white/95 border-slate-200/90 backdrop-blur-md shadow-2xs'
        } ${isElectronMac() ? 'pl-20' : ''}`}
      >
        {/* Left: Home & Team Selector Dropdown */}
        <div className="flex items-center gap-3 mac-no-drag">
          <button
            type="button"
            onClick={() => setActiveView('gallery')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-xs ${
              isDark
                ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-slate-200 hover:text-blue-400'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
            }`}
          >
            <Home className="w-3.5 h-3.5 text-blue-500" />
            <span>Home</span>
          </button>

          <span className={isDark ? 'text-zinc-700' : 'text-slate-300'}>/</span>

          {/* Team Switcher Dropdown & Quick Edit */}
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsTeamDropdownOpen(!isTeamDropdownOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  isDark
                    ? 'bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800 text-white'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-2xs'
                }`}
              >
                {currentTeam?.iconUrl ? (
                  <img
                    src={currentTeam.iconUrl}
                    alt={currentTeam.name}
                    className="w-5 h-5 rounded-md object-cover shadow-xs shrink-0 border border-zinc-700/40"
                  />
                ) : (
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-bold shadow-xs shrink-0"
                    style={{ backgroundColor: currentTeam?.avatarColor || '#3B82F6' }}
                  >
                    {currentTeam?.name?.charAt(0).toUpperCase() || 'T'}
                  </div>
                )}
                <span className="max-w-[150px] truncate">{currentTeam?.name || 'Pilih Tim'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>

              {isTeamDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsTeamDropdownOpen(false)}
                  />
                  <div
                    className={`absolute left-0 top-full mt-1.5 w-76 rounded-2xl border shadow-xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150 ${
                      isDark
                        ? 'bg-zinc-900 border-zinc-800 text-white'
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Ruang Kerja Tim ({teams.length})
                    </div>
                    <div className="max-h-56 overflow-y-auto space-y-1 scroller-dark">
                      {teams.map((t) => {
                        const isActive = t.id === activeTeamId;
                        const pCount = getTeamProjects(t.id).length;
                        return (
                          <div
                            key={t.id}
                            onClick={() => {
                              handleSelectTeam(t.id);
                              setIsTeamDropdownOpen(false);
                            }}
                            className={`w-full group/team flex items-center justify-between p-2 rounded-xl text-xs transition-colors cursor-pointer ${
                              isActive
                                ? isDark
                                  ? 'bg-blue-600/20 text-blue-400 font-semibold'
                                  : 'bg-blue-50 text-blue-600 font-semibold'
                                : isDark
                                ? 'hover:bg-zinc-800 text-zinc-300'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {t.iconUrl ? (
                                <img
                                  src={t.iconUrl}
                                  alt={t.name}
                                  className="w-6 h-6 rounded-lg object-cover shrink-0 shadow-2xs border border-zinc-700/50"
                                />
                              ) : (
                                <div
                                  className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-2xs"
                                  style={{ backgroundColor: t.avatarColor || '#3B82F6' }}
                                >
                                  {t.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="text-left min-w-0">
                                <div className="truncate font-medium">{t.name}</div>
                                <div className="text-[10px] text-zinc-400">
                                  {deduplicateTeamMembers(t.members || [], t.ownerId).length} anggota • {pCount} proyek
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditTeamModal(t);
                                }}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-500 hover:bg-blue-500/10 transition-colors cursor-pointer"
                                title="Edit Pengaturan & Icon Tim"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              {isActive && <Check className="w-4 h-4 text-blue-500 shrink-0" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-1 border-t border-zinc-200/50 dark:border-zinc-800 mt-1 space-y-0.5">
                      {currentTeam && (
                        <button
                          type="button"
                          onClick={() => handleOpenEditTeamModal(currentTeam)}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                            isDark
                              ? 'hover:bg-zinc-800 text-zinc-300'
                              : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <Sliders className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Edit Tim: {currentTeam.name}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setIsTeamDropdownOpen(false);
                          handleOpenCreateTeamModal();
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-blue-500 hover:bg-blue-500/10 cursor-pointer transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Buat Ruang Kerja Baru</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Direct Edit Button next to team switcher in header */}
            {currentTeam && (
              <button
                type="button"
                onClick={() => handleOpenEditTeamModal(currentTeam)}
                className={`p-1.5 rounded-xl border text-zinc-400 hover:text-blue-500 transition-colors cursor-pointer ${
                  isDark
                    ? 'border-zinc-800 hover:bg-zinc-800'
                    : 'border-slate-200 hover:bg-slate-100 shadow-2xs'
                }`}
                title="Edit Nama & Icon Tim Ini"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {isSyncingCloud && (
            <span className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-500 font-semibold animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Cloud Sync</span>
            </span>
          )}
        </div>

        {/* Center: Navigation Tabs (Proyek Tim / Brand Kit / Anggota) */}
        <div className="hidden md:flex items-center gap-1 p-1 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-100/70 dark:bg-zinc-900/70 mac-no-drag">
          <button
            type="button"
            onClick={() => setActiveTab('projects')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'projects'
                ? isDark
                  ? 'bg-zinc-800 text-blue-400 shadow-xs'
                  : 'bg-white text-blue-600 shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Proyek Tim</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-blue-500/10 text-blue-500">
              {teamProjects.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('brand-kit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'brand-kit'
                ? isDark
                  ? 'bg-zinc-800 text-purple-400 shadow-xs'
                  : 'bg-white text-purple-600 shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Brand Kit Tim</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'members'
                ? isDark
                  ? 'bg-zinc-800 text-emerald-400 shadow-xs'
                  : 'bg-white text-emerald-600 shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Anggota & Akses</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-500">
              {teamMembers.length}
            </span>
          </button>
        </div>

        {/* Right Tools & Profile */}
        <div className="flex items-center gap-2 mac-no-drag">
          <button
            type="button"
            onClick={() => setIsInviteModalOpen(true)}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
              isDark
                ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-200'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-2xs'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-blue-500" />
            <span>Undang Anggota</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('editor')}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-xs flex items-center gap-1.5 ${
              isDark
                ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-slate-200 hover:text-blue-400'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-2xs'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-blue-500" />
            <span className="hidden sm:inline">Studio Editor</span>
          </button>

          <button
            type="button"
            onClick={() => setWorkspaceDarkMode(!workspaceDarkMode)}
            title="Toggle Dark / Light Mode"
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isDark
                ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs'
            }`}
          >
            {workspaceDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          <UserAuthButton darkMode={isDark} />
        </div>
      </header>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center justify-around p-2 border-b border-zinc-200/50 dark:border-zinc-800/80 bg-zinc-100/50 dark:bg-zinc-900/50 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('projects')}
          className={`px-3 py-1 rounded-lg ${activeTab === 'projects' ? 'bg-blue-600 text-white' : 'text-zinc-400'}`}
        >
          Proyek ({teamProjects.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('brand-kit')}
          className={`px-3 py-1 rounded-lg ${activeTab === 'brand-kit' ? 'bg-purple-600 text-white' : 'text-zinc-400'}`}
        >
          Brand Kit
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('members')}
          className={`px-3 py-1 rounded-lg ${activeTab === 'members' ? 'bg-emerald-600 text-white' : 'text-zinc-400'}`}
        >
          Anggota ({teamMembers.length})
        </button>
      </div>

      {/* ========================================================
          2. MAIN CONTENT AREA (Tabs Routed)
         ======================================================== */}
      <div className="flex-1 overflow-y-auto scroller-dark p-4 sm:p-6 lg:p-8">
        <div className="max-w-[1600px] mx-auto space-y-6">

          {/* TOAST NOTIFICATION */}
          {brandKitAppliedToast && (
            <div className="p-3.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs flex items-center justify-between shadow-lg animate-in fade-in">
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

          {/* ========================================================
              TAB 1: PROYEK TIM (Rich Visual Gallery)
             ======================================================== */}
          {activeTab === 'projects' && (
            <div className="space-y-6">
              {/* Toolbar: Search, Aspect Ratio Filters, View Toggle, Actions */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                {/* Search & Ratio Filters */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-2xl">
                  {/* Search input */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Cari proyek carousel di folder tim..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                        isDark
                          ? 'bg-zinc-900/90 border border-zinc-800 text-zinc-100 placeholder:text-zinc-500'
                          : 'bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 shadow-2xs'
                      }`}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 p-0.5 rounded cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Ratio Filter Pills */}
                  <div className={`flex items-center gap-1 p-1 rounded-xl border shrink-0 ${
                    isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-100 border-slate-200'
                  }`}>
                    {(['All', '4:5', '9:16', '1:1'] as const).map((ratio) => (
                      <button
                        key={ratio}
                        type="button"
                        onClick={() => setSelectedRatioFilter(ratio)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          selectedRatioFilter === ratio
                            ? isDark
                              ? 'bg-zinc-800 text-blue-400 shadow-xs'
                              : 'bg-white text-blue-600 shadow-xs'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {ratio === 'All' ? 'Semua' : ratio}
                      </button>
                    ))}
                  </div>

                  {/* Grid / List Layout Switcher */}
                  <div className={`hidden sm:flex items-center gap-1 p-1 rounded-xl border shrink-0 ${
                    isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-100 border-slate-200'
                  }`}>
                    <button
                      type="button"
                      onClick={() => setViewLayout('grid')}
                      title="Tampilan Grid"
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        viewLayout === 'grid'
                          ? isDark
                            ? 'bg-zinc-800 text-blue-400'
                            : 'bg-white text-blue-600 shadow-2xs'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewLayout('list')}
                      title="Tampilan List"
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        viewLayout === 'list'
                          ? isDark
                            ? 'bg-zinc-800 text-blue-400'
                            : 'bg-white text-blue-600 shadow-2xs'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <LayoutList className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleOpenShareModal}
                    title="Pilih proyek yang akan dibagikan ke folder ini"
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                      isDark
                        ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-emerald-400'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-emerald-700 shadow-2xs'
                    }`}
                  >
                    <Share2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Bagikan Project ke Tim</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCreateNewBlankProjectInTeam}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md transition-all hover:scale-102 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Buat Proyek Baru</span>
                  </button>
                </div>
              </div>

              {/* Projects Grid / List Area */}
              {filteredProjects.length === 0 ? (
                <div
                  className={`py-16 px-6 rounded-3xl border-2 border-dashed text-center space-y-4 ${
                    isDark
                      ? 'border-zinc-800/80 bg-[#0A1A2F]/40'
                      : 'border-slate-200 bg-white shadow-xs'
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto shadow-sm">
                    <FolderOpen className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold">
                      {searchQuery ? 'Tidak ada proyek yang cocok' : 'Belum ada proyek di folder ini'}
                    </h3>
                    <p className="text-xs text-zinc-400 max-w-md mx-auto">
                      {searchQuery
                        ? `Tidak ditemukan proyek tim dengan kata kunci "${searchQuery}". Coba kata kunci lain.`
                        : 'Bagikan proyek carousel yang sedang Anda kerjakan di kanvas atau buat proyek baru untuk mulai berkolaborasi.'}
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleOpenShareModal}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Bagikan Proyek ke Tim</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateNewBlankProjectInTeam}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Buat Proyek Baru</span>
                    </button>
                  </div>
                </div>
              ) : viewLayout === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                  {filteredProjects.map((proj) => {
                    let parsed: any = null;
                    try {
                      parsed = JSON.parse(proj.projectJson);
                    } catch {}

                    const ratioKey = (proj.aspectRatio as AspectRatioKey) || '4:5';
                    const ratioConfig = ASPECT_RATIOS[ratioKey] || ASPECT_RATIOS['4:5'];
                    const firstSlide = parsed?.slides?.[0];
                    const theme =
                      THEME_PALETTES.find((t) => t.id === parsed?.activeThemeId) ||
                      THEME_PALETTES[0];
                    const branding = parsed?.branding || DEFAULT_TEAM_BRAND_KIT;
                    const previewScale = ratioKey === '9:16' ? 0.22 : 0.24;

                    return (
                      <div
                        key={proj.id}
                        onClick={() => handleLoadTeamProject(proj)}
                        className={`group rounded-2xl border transition-all cursor-pointer flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-lg hover:-translate-y-0.5 ${
                          isDark
                            ? 'border-zinc-800 bg-[#0A1A2F]/80 hover:border-blue-500/70 hover:bg-[#0A1A2F]'
                            : 'border-slate-200 bg-white hover:border-blue-400'
                        }`}
                      >
                        {/* Visual Cover Preview Header */}
                        <div className="relative w-full h-48 bg-zinc-950 flex items-center justify-center overflow-hidden border-b border-zinc-200/50 dark:border-zinc-800/80">
                          {firstSlide ? (
                            <div
                              style={{
                                width: `${Math.round(ratioConfig.stageWidth * previewScale)}px`,
                                height: `${Math.round(ratioConfig.stageHeight * previewScale)}px`,
                              }}
                              className="relative overflow-hidden rounded shadow-lg pointer-events-none transform transition-transform group-hover:scale-105"
                            >
                              <SlideStage
                                slide={firstSlide}
                                slideIndex={0}
                                totalSlides={parsed?.slides?.length || proj.slideCount}
                                aspectRatio={ratioKey}
                                theme={theme}
                                branding={branding}
                                scale={previewScale}
                                interactive={false}
                              />
                            </div>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-zinc-800/60 to-zinc-950">
                              <FolderOpen className="w-8 h-8 text-zinc-500 mb-2 opacity-50" />
                              <span className="text-[11px] text-zinc-400 font-medium">
                                Pratinjau Slide
                              </span>
                            </div>
                          )}

                          {/* Hover Action Overlay */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-2xs">
                            <span className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md">
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Buka di Studio</span>
                            </span>
                          </div>

                          {/* Top Badges */}
                          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white border border-white/10 uppercase">
                              {proj.aspectRatio}
                            </span>
                          </div>
                          <div className="absolute top-2.5 right-2.5">
                            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-zinc-200 border border-white/10">
                              {proj.slideCount} Slide
                            </span>
                          </div>
                        </div>

                        {/* Card Info Details */}
                        <div className="p-4 space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <h4
                              className={`text-xs font-bold line-clamp-1 group-hover:text-blue-500 transition-colors ${
                                isDark ? 'text-white' : 'text-slate-800'
                              }`}
                            >
                              {proj.title}
                            </h4>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTeamProject(proj.id, proj.title);
                              }}
                              className="p-1 rounded text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
                              title="Hapus proyek tim"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-800/60">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <div className="w-4 h-4 rounded-full bg-blue-600/30 text-blue-500 flex items-center justify-center font-bold text-[9px] shrink-0">
                                {proj.lastEditedBy
                                  ? proj.lastEditedBy.charAt(0).toUpperCase()
                                  : 'M'}
                              </div>
                              <span className="truncate">{proj.lastEditedBy || 'Member'}</span>
                            </div>
                            <span className="shrink-0 text-[10px] text-zinc-500">
                              {formatRelativeTime(proj.lastEditedAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* List View */
                <div className="space-y-2.5">
                  {filteredProjects.map((proj) => (
                    <div
                      key={proj.id}
                      onClick={() => handleLoadTeamProject(proj)}
                      className={`group p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-all cursor-pointer ${
                        isDark
                          ? 'border-zinc-800 bg-[#0A1A2F]/80 hover:border-blue-500/70 hover:bg-zinc-900'
                          : 'border-slate-200 bg-white hover:border-blue-400 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-500/20">
                          <FolderOpen className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">
                              {proj.aspectRatio}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-medium">
                              {proj.slideCount} Slide
                            </span>
                          </div>
                          <h4
                            className={`text-xs font-bold truncate group-hover:text-blue-500 transition-colors ${
                              isDark ? 'text-white' : 'text-slate-800'
                            }`}
                          >
                            {proj.title}
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right text-[11px] text-zinc-400 hidden sm:block">
                          <div>
                            Oleh <strong className={isDark ? 'text-zinc-200' : 'text-zinc-700'}>{proj.lastEditedBy}</strong>
                          </div>
                          <div className="text-[10px] text-zinc-500">
                            {formatRelativeTime(proj.lastEditedAt)}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleLoadTeamProject(proj)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Buka</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTeamProject(proj.id, proj.title);
                          }}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Hapus proyek tim"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              VIEW 2: BRAND KIT & STYLE GUIDE TIM
             ======================================================== */}
          {activeTab === 'brand-kit' && (
            <div className="space-y-6">
              
              {/* Brand Kit Quick Action Header */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isDark
                  ? 'bg-blue-950/20 border-blue-900/40'
                  : 'bg-[#F0F6F4] border-[#DFE6E4]'
              }`}>
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-5 h-5 text-[#5E887E]" />
                  <div>
                    <h3 className={`text-xs font-bold flex items-center gap-2 ${
                      isDark ? 'text-white' : 'text-[#2F3E46]'
                    }`}>
                      <span>Brand Kit Resmi: {currentTeam.name}</span>
                      {brandKitSaved && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#E3EDE9] text-[#2F3E46] border border-[#5E887E]/30 flex items-center gap-1 animate-fade-in">
                          <Check className="w-3 h-3 text-[#5E887E]" />
                          <span>Perubahan Tersimpan</span>
                        </span>
                      )}
                    </h3>
                    <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-[#8E9F9B]'}`}>
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
                        : 'bg-white hover:bg-[#F7FAF9] border-[#DFE6E4] text-[#2F3E46] hover:text-[#5E887E]'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5 text-[#5E887E]" />
                    <span>Ambil dari Kanvas Aktif</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleApplyBrandKitToCurrentProject}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                      isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#2F3E46] hover:bg-[#5E887E]'
                    }`}
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
                    : 'bg-white border-[#DFE6E4] shadow-xs'
                }`}>
                  <div className={`flex items-center gap-2 pb-2 border-b ${
                    isDark ? 'border-zinc-800' : 'border-[#DFE6E4]'
                  }`}>
                    <Shield className="w-4 h-4 text-[#5E887E]" />
                    <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#2F3E46]'}`}>
                      Identitas & Watermark
                    </h4>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className={`text-[11px] font-medium block mb-1 ${
                        isDark ? 'text-slate-400' : 'text-[#556B65]'
                      }`}>
                        Nama Publikasi / Masthead
                      </label>
                      <input
                        type="text"
                        value={brandKit.publicationName}
                        onChange={(e) => handleUpdateBrandKitField({ publicationName: e.target.value })}
                        className={`w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none focus:ring-1 focus:ring-[#5E887E] ${
                          isDark
                            ? 'bg-zinc-900 border-zinc-700 text-white'
                            : 'bg-[#F7FAF9] border-[#DFE6E4] text-[#2F3E46]'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`text-[11px] font-medium block mb-1 ${
                        isDark ? 'text-slate-400' : 'text-[#556B65]'
                      }`}>
                        Handle Penulis / Akun Sosial
                      </label>
                      <input
                        type="text"
                        value={brandKit.authorOrHandle}
                        onChange={(e) => handleUpdateBrandKitField({ authorOrHandle: e.target.value })}
                        className={`w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none focus:ring-1 focus:ring-[#5E887E] ${
                          isDark
                            ? 'bg-zinc-900 border-zinc-700 text-white'
                            : 'bg-[#F7FAF9] border-[#DFE6E4] text-[#2F3E46]'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`text-[11px] font-medium block mb-1 ${
                        isDark ? 'text-slate-400' : 'text-[#556B65]'
                      }`}>
                        Label Edisi / Volume
                      </label>
                      <input
                        type="text"
                        value={brandKit.issueLabel}
                        onChange={(e) => handleUpdateBrandKitField({ issueLabel: e.target.value })}
                        className={`w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none focus:ring-1 focus:ring-[#5E887E] ${
                          isDark
                            ? 'bg-zinc-900 border-zinc-700 text-white'
                            : 'bg-[#F7FAF9] border-[#DFE6E4] text-[#2F3E46]'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`text-[11px] font-medium block mb-1 ${
                        isDark ? 'text-slate-400' : 'text-[#556B65]'
                      }`}>
                        Catatan Kaki (Footer Note)
                      </label>
                      <input
                        type="text"
                        value={brandKit.footerNote}
                        onChange={(e) => handleUpdateBrandKitField({ footerNote: e.target.value })}
                        className={`w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none focus:ring-1 focus:ring-[#5E887E] ${
                          isDark
                            ? 'bg-zinc-900 border-zinc-700 text-white'
                            : 'bg-[#F7FAF9] border-[#DFE6E4] text-[#2F3E46]'
                        }`}
                      />
                    </div>

                    <div className={`pt-2 border-t space-y-2 ${
                      isDark ? 'border-zinc-800' : 'border-[#DFE6E4]'
                    }`}>
                      <label className="flex items-center gap-2 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={brandKit.showSlideNumbers}
                          onChange={(e) => handleUpdateBrandKitField({ showSlideNumbers: e.target.checked })}
                          className="rounded text-[#5E887E]"
                        />
                        <span className={isDark ? 'text-slate-300' : 'text-[#2F3E46]'}>
                          Tampilkan Nomor Slide (01/06)
                        </span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={brandKit.showFooterBar}
                          onChange={(e) => handleUpdateBrandKitField({ showFooterBar: e.target.checked })}
                          className="rounded text-[#5E887E]"
                        />
                        <span className={isDark ? 'text-slate-300' : 'text-[#2F3E46]'}>
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
                    : 'bg-white border-[#DFE6E4] shadow-xs'
                }`}>
                  <div className={`flex items-center gap-2 pb-2 border-b ${
                    isDark ? 'border-zinc-800' : 'border-[#DFE6E4]'
                  }`}>
                    <Palette className="w-4 h-4 text-[#5E887E]" />
                    <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#2F3E46]'}`}>
                      Palet Warna Resmi Brand
                    </h4>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className={`text-[11px] font-medium block mb-1 ${
                        isDark ? 'text-slate-400' : 'text-[#556B65]'
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
                              : 'bg-[#F7FAF9] border-[#DFE6E4] text-[#2F3E46]'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`text-[11px] font-medium block mb-1 ${
                        isDark ? 'text-slate-400' : 'text-[#556B65]'
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
                              : 'bg-[#F7FAF9] border-[#DFE6E4] text-[#2F3E46]'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`text-[11px] font-medium block mb-1 ${
                        isDark ? 'text-slate-400' : 'text-[#556B65]'
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
                              : 'bg-[#F7FAF9] border-[#DFE6E4] text-[#2F3E46]'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`text-[11px] font-medium block mb-1 ${
                        isDark ? 'text-slate-400' : 'text-[#556B65]'
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
                              : 'bg-[#F7FAF9] border-[#DFE6E4] text-[#2F3E46]'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Brand Swatches */}
                    <div className={`pt-2 border-t space-y-1.5 ${
                      isDark ? 'border-zinc-800' : 'border-[#DFE6E4]'
                    }`}>
                      <label className={`text-[10.5px] uppercase font-bold tracking-wider block ${
                        isDark ? 'text-slate-400' : 'text-[#8E9F9B]'
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
                    : 'bg-white border-[#DFE6E4] shadow-xs'
                }`}>
                  <div className={`flex items-center gap-2 pb-2 border-b ${
                    isDark ? 'border-zinc-800' : 'border-[#DFE6E4]'
                  }`}>
                    <Type className="w-4 h-4 text-[#5E887E]" />
                    <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#2F3E46]'}`}>
                      Tipografi & Pratinjau
                    </h4>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className={`text-[11px] font-medium block mb-1 ${
                        isDark ? 'text-slate-400' : 'text-[#556B65]'
                      }`}>
                        Font Judul Utama (Heading Font)
                      </label>
                      <select
                        value={brandKit.headingFont}
                        onChange={(e) => handleUpdateBrandKitField({ headingFont: e.target.value })}
                        className={`w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none focus:ring-1 focus:ring-[#5E887E] cursor-pointer ${
                          isDark
                            ? 'bg-zinc-900 border-zinc-700 text-white'
                            : 'bg-[#F7FAF9] border-[#DFE6E4] text-[#2F3E46]'
                        }`}
                      >
                        {AVAILABLE_HEADING_FONTS.map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={`text-[11px] font-medium block mb-1 ${
                        isDark ? 'text-slate-400' : 'text-[#556B65]'
                      }`}>
                        Font Isi / Paragraf (Body Font)
                      </label>
                      <select
                        value={brandKit.bodyFont}
                        onChange={(e) => handleUpdateBrandKitField({ bodyFont: e.target.value })}
                        className={`w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none focus:ring-1 focus:ring-[#5E887E] cursor-pointer ${
                          isDark
                            ? 'bg-zinc-900 border-zinc-700 text-white'
                            : 'bg-[#F7FAF9] border-[#DFE6E4] text-[#2F3E46]'
                        }`}
                      >
                        {AVAILABLE_BODY_FONTS.map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>

                    {/* LIVE MINI PREVIEW CARD */}
                    <div className={`pt-2 border-t space-y-1.5 ${
                      isDark ? 'border-zinc-800' : 'border-[#DFE6E4]'
                    }`}>
                      <label className={`text-[10.5px] uppercase font-bold tracking-wider block ${
                        isDark ? 'text-slate-400' : 'text-[#8E9F9B]'
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

          {/* ========================================================
              VIEW 3: ANGGOTA TIM & HAK AKSES
             ======================================================== */}
          {activeTab === 'members' && (
            <div className="max-w-5xl mx-auto space-y-6">
              {/* Header Banner */}
              <div
                className={`p-6 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isDark
                    ? 'bg-[#0A1A2F]/90 border-zinc-800'
                    : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <span>Anggota Ruang Kerja</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-500/10 text-blue-500">
                      {teamMembers.length} Member
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Folder: <strong className={isDark ? 'text-zinc-200' : 'text-zinc-700'}>{currentTeam?.name}</strong> • Kelola izin akses kolaborator proyek bersama tim.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm transition-all hover:scale-102"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Undang Anggota Baru</span>
                </button>
              </div>

              {/* Members List Table / Cards */}
              <div
                className={`rounded-2xl border overflow-hidden ${
                  isDark
                    ? 'border-zinc-800 bg-[#0A1A2F]/90 divide-y divide-zinc-800'
                    : 'border-slate-200 bg-white divide-y divide-slate-100 shadow-xs'
                }`}
              >
                {teamMembers.map((member) => (
                  <div
                    key={member.id || member.email}
                    className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: member.avatarColor || '#3B82F6' }}
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
                            {member.name}
                          </span>
                          {member.isCurrentUser && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20 font-mono">
                              Anda
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-zinc-400 truncate block">
                          {member.email}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-end">
                      {member.role === 'owner' ? (
                        <span className="px-3 py-1 rounded-lg text-xs font-bold border border-amber-500/30 bg-amber-500/10 text-amber-500 flex items-center gap-1.5">
                          <Crown className="w-3.5 h-3.5" />
                          <span>Owner</span>
                        </span>
                      ) : (
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value as TeamRole)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer ${
                            isDark
                              ? 'bg-zinc-900 border-zinc-700 text-zinc-200'
                              : 'bg-slate-50 border-slate-200 text-slate-800'
                          }`}
                        >
                          <option value="editor">Editor (Bisa Edit)</option>
                          <option value="viewer">Viewer (Hanya Lihat)</option>
                          <option value="owner">Owner</option>
                        </select>
                      )}

                      {!member.isCurrentUser && member.role !== 'owner' && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member.id, member.name)}
                          className="p-2 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Hapus dari tim"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Roles Guide & Identity Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Roles Guide */}
                <div
                  className={`p-5 rounded-2xl border space-y-3 ${
                    isDark ? 'bg-[#0A1A2F]/90 border-zinc-800' : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  <span className="font-bold text-xs uppercase tracking-wider text-zinc-400 block">
                    Panduan Tingkat Hak Akses
                  </span>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                        <Crown className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <strong className="text-amber-500">Owner:</strong> Kontrol penuh ruang kerja, pengelolaan anggota, brand kit, dan penghapusan proyek tim.
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                        <Edit3 className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <strong className="text-blue-500">Editor:</strong> Dapat membuka kanvas, mengedit slide, mendesain, dan membagikan revisi ke folder tim.
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                        <Eye className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <strong className="text-emerald-500">Viewer:</strong> Hanya dapat meninjau pratinjau carousel dan mengunduh ekspor HD tanpa mengubah kanvas.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Identity Form */}
                <form
                  onSubmit={handleSaveProfile}
                  className={`p-5 rounded-2xl border space-y-3.5 ${
                    isDark ? 'bg-[#0A1A2F]/90 border-zinc-800' : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-500" />
                    <span className="font-bold text-xs">Identitas Kolaborator Anda</span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Nama dan email ini akan tercatat di riwayat edit saat Anda menyimpan carousel tim.
                  </p>

                  <div className="space-y-2">
                    <div>
                      <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                        Nama Tampilan
                      </label>
                      <input
                        type="text"
                        value={userProfile.name}
                        onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                        className={`w-full px-3 py-1.5 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                          isDark
                            ? 'bg-zinc-900 border-zinc-700 text-white'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                        Email Anda
                      </label>
                      <input
                        type="email"
                        value={userProfile.email}
                        onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                        className={`w-full px-3 py-1.5 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                          isDark
                            ? 'bg-zinc-900 border-zinc-700 text-white'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between">
                    {profileSaved ? (
                      <span className="text-xs text-emerald-500 flex items-center gap-1 font-semibold">
                        <Check className="w-3.5 h-3.5" /> Tersimpan!
                      </span>
                    ) : <span />}

                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer transition-colors shadow-sm"
                    >
                      Simpan Profil
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ========================================================
          3. INVITE MEMBER MODAL
         ======================================================== */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border transition-all animate-in zoom-in-95 duration-150 ${
              isDark
                ? 'bg-[#0A1A2F] border-zinc-800 text-slate-100'
                : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200/50 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Undang Rekan Kerja</h3>
                  <p className="text-[11px] text-zinc-400">Folder: {currentTeam?.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsInviteModalOpen(false);
                  setInviteError(null);
                  setInviteSuccess(null);
                }}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInviteMember} className="mt-4 space-y-3.5">
              <div>
                <label className="text-[11px] font-bold block mb-1 text-zinc-400">
                  Nama Rekan Kerja
                </label>
                <input
                  type="text"
                  placeholder="Nama Lengkap / Panggilan..."
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                    isDark
                      ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[11px] font-bold block mb-1 text-zinc-400">
                  Alamat Email
                </label>
                <input
                  type="email"
                  placeholder="tim@agensi.com..."
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                    isDark
                      ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              <div>
                <label className="text-[11px] font-bold block mb-1 text-zinc-400">
                  Peran & Hak Akses
                </label>
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value as TeamRole)}
                  className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer ${
                    isDark
                      ? 'bg-zinc-900 border-zinc-700 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <option value="editor">Editor (Bisa membuat dan mengedit slide)</option>
                  <option value="viewer">Viewer (Hanya melihat dan ekspor HD)</option>
                  <option value="owner">Co-Owner (Kontrol penuh tim)</option>
                </select>
              </div>

              {inviteError && (
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
                  {inviteError}
                </div>
              )}
              {inviteSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs">
                  {inviteSuccess}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-medium cursor-pointer ${
                    isDark ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isInviting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-60"
                >
                  {isInviting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isInviting ? 'Mengirim...' : 'Kirim Undangan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          4. CREATE TEAM WORKSPACE MODAL
         ======================================================== */}
      {isCreateTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border transition-all animate-in zoom-in-95 duration-150 ${
              isDark
                ? 'bg-[#0A1A2F] border-zinc-800 text-slate-100'
                : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200/50 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Buat Ruang Kerja Tim Baru</h3>
                  <p className="text-[11px] text-zinc-400">Kelola proyek bersama dan Brand Kit resmi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateTeamModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                await handleCreateTeam(e);
                setIsCreateTeamModalOpen(false);
              }}
              className="mt-4 space-y-3.5"
            >
              {/* Team Icon & Avatar Color Picker */}
              <div>
                <label className="text-[11px] font-bold block mb-1.5 text-zinc-400">
                  Logo / Icon Tim & Warna (Opsional)
                </label>
                <div className="flex items-center gap-4 p-3 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50">
                  {/* Icon Preview */}
                  <div className="relative group shrink-0">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-white text-xl overflow-hidden shadow-xs border border-zinc-700/40 relative"
                      style={{ backgroundColor: newTeamAvatarColor }}
                    >
                      {newTeamIconUrl ? (
                        <img
                          src={newTeamIconUrl}
                          alt="Icon Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{newTeamName ? newTeamName.charAt(0).toUpperCase() : 'T'}</span>
                      )}
                      {isUploadingNewTeamIcon && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 text-white animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions & Color Swatches */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors bg-white hover:bg-slate-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 flex items-center gap-1.5 shadow-2xs">
                        <Upload className="w-3.5 h-3.5 text-blue-500" />
                        <span>{newTeamIconUrl ? 'Ganti Logo' : 'Unggah Logo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) void handleUploadNewTeamIcon(file);
                            e.target.value = '';
                          }}
                        />
                      </label>

                      {newTeamIconUrl && (
                        <button
                          type="button"
                          onClick={() => setNewTeamIconUrl(null)}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-red-500 hover:bg-red-500/10 cursor-pointer transition-colors"
                        >
                          Hapus
                        </button>
                      )}
                    </div>

                    {/* Color Swatches */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {TEAM_AVATAR_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewTeamAvatarColor(c)}
                          className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                            newTeamAvatarColor === c ? 'scale-125 ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-zinc-900' : 'hover:scale-110'
                          }`}
                          style={{ backgroundColor: c }}
                          title={c}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold block mb-1 text-zinc-400">
                  Nama Ruang Kerja / Tim
                </label>
                <input
                  type="text"
                  placeholder="Cth: Creative Agency, Klien XYZ, Marketing..."
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                    isDark
                      ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold block mb-1 text-zinc-400">
                  Deskripsi Singkat (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Ruang kerja untuk desain carousel..."
                  value={newTeamDesc}
                  onChange={(e) => setNewTeamDesc(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                    isDark
                      ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateTeamModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-medium cursor-pointer ${
                    isDark ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer transition-colors shadow-sm"
                >
                  Buat Ruang Kerja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: EDIT RUANG KERJA TIM
         ======================================================== */}
      {isEditTeamModalOpen && editingTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className={`w-full max-w-md rounded-2xl p-6 border shadow-2xl transition-all transform animate-in zoom-in-95 duration-150 ${
              isDark ? 'bg-[#0A1A2F] border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200/50 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Edit Ruang Kerja Tim</h3>
                  <p className="text-[11px] text-zinc-400">Ubah nama, deskripsi, logo icon, dan warna tim</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditTeamModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTeam} className="mt-4 space-y-4">
              {/* Logo / Icon Tim & Avatar Color */}
              <div>
                <label className="text-[11px] font-bold block mb-1.5 text-zinc-400">
                  Logo / Icon Tim & Warna
                </label>
                <div className="flex items-center gap-4 p-3 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-white text-xl overflow-hidden shadow-xs border border-zinc-700/40 shrink-0 relative"
                    style={{ backgroundColor: editTeamAvatarColor }}
                  >
                    {editTeamIconUrl ? (
                      <img
                        src={editTeamIconUrl}
                        alt="Icon Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{editTeamName ? editTeamName.charAt(0).toUpperCase() : 'T'}</span>
                    )}
                    {isUploadingEditTeamIcon && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors bg-white hover:bg-slate-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 flex items-center gap-1.5 shadow-2xs">
                        <Upload className="w-3.5 h-3.5 text-blue-500" />
                        <span>{editTeamIconUrl ? 'Ganti Logo' : 'Unggah Logo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) void handleUploadEditTeamIcon(file);
                            e.target.value = '';
                          }}
                        />
                      </label>

                      {editTeamIconUrl && (
                        <button
                          type="button"
                          onClick={() => setEditTeamIconUrl(null)}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-red-500 hover:bg-red-500/10 cursor-pointer transition-colors"
                        >
                          Hapus
                        </button>
                      )}
                    </div>

                    {/* Color Swatches */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {TEAM_AVATAR_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setEditTeamAvatarColor(c)}
                          className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                            editTeamAvatarColor === c ? 'scale-125 ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-zinc-900' : 'hover:scale-110'
                          }`}
                          style={{ backgroundColor: c }}
                          title={c}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold block mb-1 text-zinc-400">
                  Nama Ruang Kerja / Tim
                </label>
                <input
                  type="text"
                  placeholder="Nama tim..."
                  value={editTeamName}
                  onChange={(e) => setEditTeamName(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                    isDark
                      ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold block mb-1 text-zinc-400">
                  Deskripsi Singkat (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Deskripsi ruang kerja tim..."
                  value={editTeamDesc}
                  onChange={(e) => setEditTeamDesc(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                    isDark
                      ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              <div className="pt-3 border-t border-zinc-200/50 dark:border-zinc-800 flex items-center justify-between gap-2">
                {/* Delete button */}
                <button
                  type="button"
                  onClick={handleDeleteTeamFromEditModal}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-500/10 cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Tim</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditTeamModalOpen(false)}
                    className={`px-4 py-2 rounded-xl text-xs font-medium cursor-pointer ${
                      isDark ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingEditTeam || !editTeamName.trim()}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold cursor-pointer transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    {isSavingEditTeam ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <span>Simpan Perubahan</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: PILIH PROYEK UNTUK DIBAGIKAN KE TIM
         ======================================================== */}
      {isShareProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className={`w-full max-w-2xl max-h-[88vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden transition-all transform animate-in zoom-in-95 duration-150 ${
              isDark
                ? 'bg-[#0A1A2F] border-zinc-800 text-slate-100'
                : 'bg-white border-slate-200 text-[#2F3E46]'
            }`}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-zinc-200/50 dark:border-zinc-800/80 flex items-start justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Pilih Proyek untuk Dibagikan ke Tim</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Folder Tujuan: <strong className={isDark ? 'text-zinc-200' : 'text-zinc-700'}>{currentTeam?.name}</strong> • Pilih proyek yang ingin Anda masukkan.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsShareProjectModalOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs & Search Toolbar */}
            <div className="p-4 sm:px-6 border-b border-zinc-200/50 dark:border-zinc-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
              {/* Tab Pills */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 self-start">
                <button
                  type="button"
                  onClick={() => setShareModalTab('open-tabs')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    shareModalTab === 'open-tabs'
                      ? isDark
                        ? 'bg-zinc-800 text-emerald-400 shadow-xs'
                        : 'bg-white text-emerald-700 shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span>Tab Terbuka di Studio</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-500">
                    {openTabsCandidates.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setShareModalTab('saved-projects')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    shareModalTab === 'saved-projects'
                      ? isDark
                        ? 'bg-zinc-800 text-blue-400 shadow-xs'
                        : 'bg-white text-blue-600 shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span>Proyek Tersimpan</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-blue-500/10 text-blue-500">
                    {savedProjectsCandidates.length}
                  </span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Cari judul proyek..."
                  value={shareSearchQuery}
                  onChange={(e) => setShareSearchQuery(e.target.value)}
                  className={`w-full pl-8.5 pr-3 py-1.5 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    isDark
                      ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500'
                      : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                  }`}
                />
              </div>
            </div>

            {/* Candidate Projects List (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 scroller-dark">
              {isLoadingSavedProjects && shareModalTab === 'saved-projects' ? (
                <div className="py-12 text-center text-zinc-400 flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                  <span className="text-xs">Memuat katalog proyek tersimpan...</span>
                </div>
              ) : filteredShareCandidates.length === 0 ? (
                <div className="py-12 text-center text-zinc-400 space-y-2">
                  <FolderOpen className="w-8 h-8 mx-auto text-zinc-500" />
                  <p className="text-xs">
                    {shareSearchQuery
                      ? 'Tidak ada proyek yang sesuai dengan kata kunci pencarian.'
                      : shareModalTab === 'open-tabs'
                      ? 'Tidak ada proyek aktif yang terbuka di editor.'
                      : 'Belum ada proyek yang tersimpan di akun Anda.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredShareCandidates.map((candidate) => {
                    const isSelected = selectedProjectIdsToShare.includes(candidate.id);
                    const alreadyInTeam = teamProjects.some(
                      (tp) => tp.title.toLowerCase() === candidate.title.toLowerCase() || tp.id === candidate.id
                    );
                    const ratioKey = candidate.aspectRatio || '4:5';
                    const ratioConfig = ASPECT_RATIOS[ratioKey] || ASPECT_RATIOS['4:5'];
                    const firstSlide = candidate.slides?.[0];
                    const theme =
                      THEME_PALETTES.find((t) => t.id === candidate.themeId) ||
                      THEME_PALETTES[0];
                    const previewScale = ratioKey === '9:16' ? 0.08 : 0.09;

                    return (
                      <div
                        key={candidate.id}
                        onClick={() => toggleProjectSelection(candidate.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? isDark
                              ? 'border-emerald-500/60 bg-emerald-950/20 shadow-xs'
                              : 'border-emerald-500 bg-emerald-50/60 shadow-xs'
                            : isDark
                            ? 'border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800/40 hover:border-zinc-700'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Checkbox button */}
                          <div
                            className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : isDark
                                ? 'border-zinc-700 bg-zinc-800/80'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>

                          {/* Mini Thumbnail Cover Preview */}
                          <div
                            className="w-14 h-16 rounded-xl overflow-hidden shrink-0 border border-zinc-700/40 bg-zinc-950 flex items-center justify-center shadow-2xs relative"
                          >
                            {firstSlide ? (
                              <div
                                style={{
                                  width: `${Math.round(ratioConfig.stageWidth * previewScale)}px`,
                                  height: `${Math.round(ratioConfig.stageHeight * previewScale)}px`,
                                }}
                                className="relative overflow-hidden rounded shadow-sm pointer-events-none select-none shrink-0"
                              >
                                <SlideStage
                                  slide={firstSlide}
                                  slideIndex={0}
                                  totalSlides={candidate.slideCount}
                                  aspectRatio={ratioKey}
                                  theme={theme}
                                  branding={candidate.branding || DEFAULT_TEAM_BRAND_KIT}
                                  scale={previewScale}
                                  interactive={false}
                                />
                              </div>
                            ) : (
                              <FolderOpen className="w-5 h-5 text-zinc-500" />
                            )}
                          </div>

                          {/* Project Info */}
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-xs sm:text-sm font-bold truncate">
                                {candidate.title}
                              </h4>
                              {candidate.isActiveOnCanvas && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                  Sedang Aktif di Kanvas
                                </span>
                              )}
                              {alreadyInTeam && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                                  Sudah di Folder Tim
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                              <span className="font-mono font-semibold">{ratioKey}</span>
                              <span>•</span>
                              <span>{candidate.slideCount} Slide</span>
                              <span>•</span>
                              <span className="truncate">{theme.name}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status Check indicator */}
                        <div className="shrink-0 text-right">
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                              isSelected
                                ? 'text-emerald-500 bg-emerald-500/10'
                                : 'text-zinc-400'
                            }`}
                          >
                            {isSelected ? 'Dipilih' : 'Pilih'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-zinc-200/50 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <p className="text-[11px] text-zinc-400 text-center sm:text-left">
                {selectedProjectIdsToShare.length === 0
                  ? 'Pilih minimal 1 proyek yang ingin dibagikan ke folder tim ini.'
                  : `Hanya ${selectedProjectIdsToShare.length} proyek yang dipilih di atas yang akan disalin ke folder tim.`}
              </p>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsShareProjectModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                    isDark ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={handleConfirmShareProjects}
                  disabled={selectedProjectIdsToShare.length === 0 || isSharingProject}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm transition-all hover:scale-102"
                >
                  {isSharingProject ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan ke Tim...</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      <span>
                        Bagikan {selectedProjectIdsToShare.length > 0 ? `(${selectedProjectIdsToShare.length})` : ''} Proyek
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Dialog Modal (Replaces browser alert/confirm) */}
      {dialogModal && dialogModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border transition-all transform scale-100 animate-in zoom-in-95 duration-150 ${
              isDark
                ? 'bg-[#0A1A2F] border-zinc-800 text-slate-100'
                : 'bg-white border-[#DFE6E4] text-[#2F3E46]'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                  dialogModal.type === 'success'
                    ? isDark
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                      : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    : dialogModal.type === 'confirm-delete' || dialogModal.type === 'error'
                    ? isDark
                      ? 'bg-red-950/80 text-red-400 border border-red-800/60'
                      : 'bg-red-50 text-red-600 border border-red-200'
                    : isDark
                    ? 'bg-blue-950/80 text-blue-400 border border-blue-800/60'
                    : 'bg-blue-50 text-blue-600 border border-blue-200'
                }`}
              >
                {dialogModal.type === 'success' && <CheckCircle2 className="w-6 h-6" />}
                {(dialogModal.type === 'confirm-delete' || dialogModal.type === 'error') && (
                  <AlertTriangle className="w-6 h-6" />
                )}
                {dialogModal.type === 'info' && <CloudUpload className="w-6 h-6" />}
              </div>

              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center justify-between gap-2">
                  <h3
                    className={`text-base font-bold leading-tight ${
                      isDark ? 'text-white' : 'text-[#2F3E46]'
                    }`}
                  >
                    {dialogModal.title}
                  </h3>
                  <button
                    onClick={() => {
                      if (dialogModal.onSecondary) dialogModal.onSecondary();
                      else setDialogModal(null);
                    }}
                    className={`p-1 rounded-lg transition-colors cursor-pointer ${
                      isDark
                        ? 'hover:bg-zinc-800 text-slate-400 hover:text-white'
                        : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div
                  className={`mt-2 text-xs leading-relaxed ${
                    isDark ? 'text-slate-300' : 'text-[#556B65]'
                  }`}
                >
                  {dialogModal.message}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5 pt-2">
              {dialogModal.secondaryButtonText && (
                <button
                  type="button"
                  onClick={() => {
                    if (dialogModal.onSecondary) dialogModal.onSecondary();
                    else setDialogModal(null);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors border ${
                    isDark
                      ? 'border-zinc-700 hover:bg-zinc-800 text-slate-300'
                      : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {dialogModal.secondaryButtonText}
                </button>
              )}

              <button
                type="button"
                onClick={dialogModal.onPrimary}
                className={`px-5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-sm ${
                  dialogModal.type === 'confirm-delete'
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20'
                    : isDark
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
                    : 'bg-[#5E887E] hover:bg-[#4E7269] text-white shadow-[#5E887E]/25'
                }`}
              >
                {dialogModal.primaryButtonText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
