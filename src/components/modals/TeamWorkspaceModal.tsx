import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  FolderOpen,
  Plus,
  Trash2,
  Check,
  Share2,
  Clock,
  Briefcase,
  X,
  Crown,
  Edit3,
  Eye,
} from 'lucide-react';
import {
  getTeams,
  getActiveTeamId,
  setActiveTeamId,
  createTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
  updateMemberRole,
  removeTeamMember,
  getTeamProjects,
  saveTeamProject,
  deleteTeamProject,
  getCurrentUserProfile,
  saveCurrentUserProfile,
  type UserProfile,
} from '../../services/teamWorkspaceService';
import type { TeamWorkspace, TeamRole, TeamProjectRecord } from '../../types/team';
import { useStudioStore } from '../../store/useStudioStore';

interface TeamWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TeamWorkspaceModal: React.FC<TeamWorkspaceModalProps> = ({ isOpen, onClose }) => {
  const {
    projectId,
    projectTitle,
    aspectRatio,
    activeThemeId,
    branding,
    scriptText,
    slides,
    loadProjectSnapshot,
    setActiveView,
  } = useStudioStore();

  const [teams, setTeams] = useState<TeamWorkspace[]>([]);
  const [activeTeamId, setCurrentActiveTeamId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'members' | 'projects' | 'settings'>('members');

  // Form states for adding member
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<TeamRole>('editor');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  // Form states for creating new team
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');

  // Team projects list
  const [teamProjects, setTeamProjects] = useState<TeamProjectRecord[]>([]);

  // User profile
  const [userProfile, setUserProfile] = useState<UserProfile>(getCurrentUserProfile());
  const [profileSaved, setProfileSaved] = useState(false);

  // Load teams and projects on open
  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen]);

  const refreshData = () => {
    const loadedTeams = getTeams();
    setTeams(loadedTeams);
    const activeId = getActiveTeamId() || loadedTeams[0]?.id || null;
    setCurrentActiveTeamId(activeId);
    if (activeId) {
      setTeamProjects(getTeamProjects(activeId));
    }
    setUserProfile(getCurrentUserProfile());
  };

  if (!isOpen) return null;

  const currentTeam = teams.find((t) => t.id === activeTeamId) || teams[0];

  const handleSelectTeam = (teamId: string) => {
    setActiveTeamId(teamId);
    setCurrentActiveTeamId(teamId);
    setTeamProjects(getTeamProjects(teamId));
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
      setInviteError('Harap isi nama dan email anggota.');
      return;
    }

    const res = addTeamMember(currentTeam.id, {
      name: newMemberName,
      email: newMemberEmail,
      role: newMemberRole,
    });

    if (!res) {
      setInviteError('Email ini sudah terdaftar di tim.');
      return;
    }

    setInviteSuccess(`Anggota ${newMemberName} (${newMemberRole}) berhasil ditambahkan ke tim!`);
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
    if (confirm(`Yakin ingin menghapus ${memberName} dari tim ${currentTeam.name}?`)) {
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
    alert(`Project "${projectTitle}" berhasil dibagikan ke ruang tim ${currentTeam.name}! Rekan kerja dapat langsung membukanya.`);
  };

  const handleLoadTeamProject = (record: TeamProjectRecord) => {
    try {
      const parsed = JSON.parse(record.projectJson);
      loadProjectSnapshot(parsed);
      setActiveView('editor');
      onClose();
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

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    saveCurrentUserProfile(userProfile);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
    refreshData();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100">
        
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-100 tracking-tight">Team Workspace & Kolaborasi</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-900/40 text-blue-300 border border-blue-800/60">
                  Fase 1: Shared Workspace
                </span>
              </div>
              <p className="text-xs text-zinc-400">Kelola ruang kerja tim, peran anggota (Owner/Editor/Viewer), dan proyek bersama.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Team Selector & Action Bar */}
        <div className="px-6 py-3 border-b border-zinc-800/70 bg-zinc-900/30 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto max-w-full py-1">
            <span className="text-xs text-zinc-400 font-medium shrink-0 flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-blue-400" />
              Pilih Tim:
            </span>
            {teams.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleSelectTeam(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shrink-0 border ${
                  activeTeamId === t.id
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                    : 'bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: t.avatarColor || '#3B82F6' }}
                />
                <span>{t.name}</span>
                <span className="text-[10px] opacity-75 px-1 rounded bg-black/20">
                  {t.members.length}
                </span>
              </button>
            ))}

            <button
              type="button"
              onClick={() => setIsCreatingTeam(!isCreatingTeam)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-950/40 border border-blue-900/60 hover:bg-blue-900/30 transition-all flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tim Baru</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShareCurrentProjectToTeam}
              title="Bagikan project yang sedang terbuka di canvas ke tim ini"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Bagikan Project Ini ke Tim</span>
            </button>
          </div>
        </div>

        {/* Modal Inline Create Team Drawer */}
        {isCreatingTeam && (
          <form
            onSubmit={handleCreateTeam}
            className="px-6 py-3.5 border-b border-zinc-800/80 bg-zinc-900/50 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 animate-slide-down"
          >
            <input
              type="text"
              placeholder="Nama Tim / Brand / Agensi..."
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              autoFocus
            />
            <input
              type="text"
              placeholder="Deskripsi singkat (opsional)..."
              value={newTeamDesc}
              onChange={(e) => setNewTeamDesc(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Simpan Tim
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingTeam(false)}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
            </div>
          </form>
        )}

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-zinc-800/80 bg-zinc-950 flex items-center gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'members'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Anggota Tim ({currentTeam?.members.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('projects')}
            className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'projects'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>Proyek Tim ({teamProjects.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Identitas Saya & Pengaturan</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: MEMBERS */}
          {activeTab === 'members' && (
            <div className="space-y-6">
              {/* Invite Form */}
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-3">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-blue-400" />
                  <h3 className="text-xs font-bold text-zinc-200 tracking-wide">Undang / Tambahkan Rekan Tim</h3>
                </div>

                <form onSubmit={handleInviteMember} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      placeholder="Nama Lengkap / Panggilan"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="sm:col-span-5">
                    <input
                      type="email"
                      placeholder="Email rekan (cth: tim@agensi.com)"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="sm:col-span-3 flex items-center gap-2">
                    <select
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value as TeamRole)}
                      className="flex-1 px-2.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="editor">Editor (Bisa Edit)</option>
                      <option value="viewer">Viewer (Reviewer)</option>
                      <option value="owner">Co-Owner</option>
                    </select>
                    <button
                      type="submit"
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition-colors"
                    >
                      Tambahkan
                    </button>
                  </div>
                </form>

                {inviteError && (
                  <p className="text-[11px] text-rose-400">{inviteError}</p>
                )}
                {inviteSuccess && (
                  <p className="text-[11px] text-emerald-400">{inviteSuccess}</p>
                )}
              </div>

              {/* Members List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
                  <span>Daftar Anggota Tim ({currentTeam?.members.length || 0})</span>
                  <span>Hak Akses / Peran</span>
                </div>

                <div className="divide-y divide-zinc-800/80 rounded-xl border border-zinc-800 bg-zinc-900/20 overflow-hidden">
                  {currentTeam?.members.map((member) => (
                    <div
                      key={member.id}
                      className="p-3.5 flex items-center justify-between gap-4 hover:bg-zinc-900/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs"
                          style={{ backgroundColor: member.avatarColor || '#3B82F6' }}
                        >
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-zinc-100 truncate">{member.name}</span>
                            {member.isCurrentUser && (
                              <span className="text-[9.5px] px-1.5 py-0.2 rounded-full bg-blue-900/40 text-blue-300 font-mono">
                                Anda
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-zinc-400 truncate block">{member.email}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        {member.role === 'owner' ? (
                          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-950/40 border border-amber-800/60 text-amber-300 flex items-center gap-1">
                            <Crown className="w-3 h-3 text-amber-400" />
                            <span>Owner</span>
                          </span>
                        ) : (
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member.id, e.target.value as TeamRole)}
                            aria-label={`Ubah peran untuk ${member.name}`}
                            className="px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-950 border border-zinc-800 text-zinc-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                          >
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                            <option value="owner">Jadikan Owner</option>
                          </select>
                        )}

                        {!member.isCurrentUser && member.role !== 'owner' && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(member.id, member.name)}
                            title="Hapus dari tim"
                            className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Roles explanation info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-zinc-400">
                <div className="p-3 rounded-lg bg-zinc-900/30 border border-zinc-800/60 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-400">
                    <Crown className="w-3.5 h-3.5" />
                    <span>Owner</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Kontrol penuh atas tim, hak mengundang & menghapus anggota, serta mengatur seluruh project tim.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-zinc-900/30 border border-zinc-800/60 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-blue-400">
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editor</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Bisa membuka, mendesain, mengedit slide, dan menyimpan pembaharuan ke project bersama tim.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-zinc-900/30 border border-zinc-800/60 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Viewer</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Hanya melihat pratinjau carousel dan mengekspor HD tanpa mengubah komposisi template tim.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROJECTS */}
          {activeTab === 'projects' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-zinc-200 tracking-wide">
                    Daftar Proyek Bersama di {currentTeam?.name}
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Seluruh anggota tim dapat membuka dan melanjutkan pengeditan carousel ini.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleShareCurrentProjectToTeam}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Simpan Proyek Aktif</span>
                </button>
              </div>

              {teamProjects.length === 0 ? (
                <div className="p-10 rounded-xl border border-dashed border-zinc-800 text-center space-y-3">
                  <FolderOpen className="w-8 h-8 text-zinc-600 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-zinc-300">Belum ada proyek tim yang disimpan</p>
                    <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                      Klik tombol "Simpan Proyek Aktif" untuk membagikan carousel yang saat ini sedang Anda buka di kanvas ke seluruh anggota tim.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleShareCurrentProjectToTeam}
                    className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Bagikan Project Ini Sekarang</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {teamProjects.map((proj) => (
                    <div
                      key={proj.id}
                      className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-zinc-100 truncate">{proj.title}</h4>
                          <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono bg-zinc-800 text-zinc-400 shrink-0">
                            {proj.aspectRatio}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10.5px] text-zinc-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-zinc-500" />
                            <span>{new Date(proj.lastEditedAt).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                          </span>
                          <span>•</span>
                          <span>{proj.slideCount} Slide</span>
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          Diedit oleh: <strong className="text-zinc-200">{proj.lastEditedBy}</strong>
                        </p>
                      </div>

                      <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleLoadTeamProject(proj)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Buka & Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteTeamProject(proj.id, proj.title)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
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

          {/* TAB 3: SETTINGS & USER PROFILE */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* My Profile */}
              <form onSubmit={handleSaveProfile} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <h3 className="text-xs font-bold text-zinc-200">Identitas Anda Saat Berkolaborasi</h3>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Nama ini akan terlihat oleh rekan kerja di riwayat edit dan status lock proyek bersama.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Nama Tampilan</label>
                    <input
                      type="text"
                      value={userProfile.name}
                      onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                      className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Email Anda</label>
                    <input
                      type="email"
                      value={userProfile.email}
                      onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                      className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  {profileSaved ? (
                    <span className="text-xs text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Profil berhasil diperbarui
                    </span>
                  ) : <span />}

                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Simpan Profil
                  </button>
                </div>
              </form>

              {/* Current Team Settings */}
              {currentTeam && (
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-3">
                  <h3 className="text-xs font-bold text-zinc-200">Pengaturan Tim: {currentTeam.name}</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-1">Ubah Nama Tim</label>
                      <input
                        type="text"
                        value={currentTeam.name}
                        onChange={(e) => {
                          updateTeam(currentTeam.id, { name: e.target.value });
                          refreshData();
                        }}
                        className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-1">Deskripsi Tim</label>
                      <input
                        type="text"
                        value={currentTeam.description || ''}
                        onChange={(e) => {
                          updateTeam(currentTeam.id, { description: e.target.value });
                          refreshData();
                        }}
                        className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-zinc-500">
                      Dibuat pada: {new Date(currentTeam.createdAt).toLocaleDateString('id-ID')}
                    </span>
                    {teams.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Yakin ingin menghapus tim "${currentTeam.name}" beserta datanya?`)) {
                            deleteTeam(currentTeam.id);
                            refreshData();
                          }
                        }}
                        className="text-xs text-rose-400 hover:text-rose-300 font-medium cursor-pointer"
                      >
                        Hapus Tim Ini
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between text-xs text-zinc-400">
          <span>Tim Aktif: <strong className="text-zinc-200">{currentTeam?.name}</strong></span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium cursor-pointer transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
