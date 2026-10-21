import type { TeamWorkspace, TeamMember, TeamProjectRecord, TeamRole } from '../types/team';

const STORAGE_KEY_TEAMS = 'arune_team_workspaces_v1';
const STORAGE_KEY_ACTIVE_TEAM = 'arune_active_team_id_v1';
const STORAGE_KEY_TEAM_PROJECTS = 'arune_team_projects_v1';
const STORAGE_KEY_USER_PROFILE = 'arune_user_profile_v1';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
}

const DEFAULT_AVATAR_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
];

export function getRandomAvatarColor(): string {
  return DEFAULT_AVATAR_COLORS[Math.floor(Math.random() * DEFAULT_AVATAR_COLORS.length)];
}

export function getCurrentUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER_PROFILE);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }

  const defaultProfile: UserProfile = {
    id: 'user_owner_me',
    name: 'Dinur Pradipta',
    email: 'dinur@arune.studio',
    avatarColor: '#2563EB',
  };
  saveCurrentUserProfile(defaultProfile);
  return defaultProfile;
}

export function saveCurrentUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY_USER_PROFILE, JSON.stringify(profile));
  } catch {
    // ignore
  }
}

export function getInitialTeams(): TeamWorkspace[] {
  const me = getCurrentUserProfile();
  return [
    {
      id: 'team_default_creative',
      name: 'Creative Studio Team',
      description: 'Ruang kerja bersama untuk tim desain dan konten editorial.',
      ownerId: me.id,
      avatarColor: '#4F46E5',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      members: [
        {
          id: me.id,
          name: me.name,
          email: me.email,
          role: 'owner',
          avatarColor: me.avatarColor,
          joinedAt: new Date().toISOString(),
          isCurrentUser: true,
        },
        {
          id: 'member_copywriter_1',
          name: 'Sarah Copywriter',
          email: 'sarah@arune.studio',
          role: 'editor',
          avatarColor: '#10B981',
          joinedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
        {
          id: 'member_reviewer_1',
          name: 'Alex Lead Content',
          email: 'alex@arune.studio',
          role: 'viewer',
          avatarColor: '#F59E0B',
          joinedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        },
      ],
    },
  ];
}

export function getTeams(): TeamWorkspace[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TEAMS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }

  const initial = getInitialTeams();
  saveTeams(initial);
  return initial;
}

export function saveTeams(teams: TeamWorkspace[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_TEAMS, JSON.stringify(teams));
  } catch {
    // ignore
  }
}

export function getActiveTeamId(): string | null {
  try {
    const id = localStorage.getItem(STORAGE_KEY_ACTIVE_TEAM);
    if (id) return id;
  } catch {
    // ignore
  }
  const teams = getTeams();
  const first = teams[0]?.id || null;
  if (first) setActiveTeamId(first);
  return first;
}

export function setActiveTeamId(teamId: string | null): void {
  try {
    if (teamId) {
      localStorage.setItem(STORAGE_KEY_ACTIVE_TEAM, teamId);
    } else {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_TEAM);
    }
  } catch {
    // ignore
  }
}

export function createTeam(name: string, description?: string): TeamWorkspace {
  const me = getCurrentUserProfile();
  const newTeam: TeamWorkspace = {
    id: `team_${Date.now()}`,
    name: name.trim() || 'Tim Baru',
    description: description?.trim() || '',
    ownerId: me.id,
    avatarColor: getRandomAvatarColor(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    members: [
      {
        id: me.id,
        name: me.name,
        email: me.email,
        role: 'owner',
        avatarColor: me.avatarColor,
        joinedAt: new Date().toISOString(),
        isCurrentUser: true,
      },
    ],
  };

  const teams = getTeams();
  teams.push(newTeam);
  saveTeams(teams);
  setActiveTeamId(newTeam.id);
  return newTeam;
}

export function updateTeam(teamId: string, partial: Partial<TeamWorkspace>): TeamWorkspace | null {
  const teams = getTeams();
  const index = teams.findIndex((t) => t.id === teamId);
  if (index === -1) return null;

  teams[index] = {
    ...teams[index],
    ...partial,
    updatedAt: new Date().toISOString(),
  };
  saveTeams(teams);
  return teams[index];
}

export function deleteTeam(teamId: string): void {
  const teams = getTeams().filter((t) => t.id !== teamId);
  saveTeams(teams);
  const currentActive = getActiveTeamId();
  if (currentActive === teamId) {
    setActiveTeamId(teams[0]?.id || null);
  }
}

export function addTeamMember(
  teamId: string,
  memberData: { name: string; email: string; role: TeamRole }
): TeamMember | null {
  const teams = getTeams();
  const team = teams.find((t) => t.id === teamId);
  if (!team) return null;

  // Check if email already exists
  const exists = team.members.find((m) => m.email.toLowerCase() === memberData.email.toLowerCase());
  if (exists) return null;

  const newMember: TeamMember = {
    id: `member_${Date.now()}`,
    name: memberData.name.trim(),
    email: memberData.email.trim(),
    role: memberData.role,
    avatarColor: getRandomAvatarColor(),
    joinedAt: new Date().toISOString(),
  };

  team.members.push(newMember);
  team.updatedAt = new Date().toISOString();
  saveTeams(teams);
  return newMember;
}

export function updateMemberRole(teamId: string, memberId: string, newRole: TeamRole): boolean {
  const teams = getTeams();
  const team = teams.find((t) => t.id === teamId);
  if (!team) return false;

  const member = team.members.find((m) => m.id === memberId);
  if (!member) return false;

  // Owner cannot be changed directly if they are the primary owner
  if (member.id === team.ownerId && newRole !== 'owner') {
    return false;
  }

  member.role = newRole;
  team.updatedAt = new Date().toISOString();
  saveTeams(teams);
  return true;
}

export function removeTeamMember(teamId: string, memberId: string): boolean {
  const teams = getTeams();
  const team = teams.find((t) => t.id === teamId);
  if (!team) return false;

  // Cannot remove owner
  if (memberId === team.ownerId) return false;

  team.members = team.members.filter((m) => m.id !== memberId);
  team.updatedAt = new Date().toISOString();
  saveTeams(teams);
  return true;
}

// ==========================================
// TEAM PROJECTS MANAGEMENT
// ==========================================

export function getTeamProjects(teamId: string): TeamProjectRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TEAM_PROJECTS);
    if (raw) {
      const all: TeamProjectRecord[] = JSON.parse(raw);
      return all.filter((p) => p.teamId === teamId);
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveTeamProject(
  teamId: string,
  project: {
    id: string;
    title: string;
    aspectRatio: string;
    slideCount: number;
    projectJson: string;
  }
): TeamProjectRecord {
  const me = getCurrentUserProfile();
  const allProjects = getAllStoredTeamProjects();
  const index = allProjects.findIndex((p) => p.id === project.id && p.teamId === teamId);

  const now = new Date().toISOString();
  const record: TeamProjectRecord = {
    id: project.id,
    teamId,
    title: project.title,
    aspectRatio: project.aspectRatio,
    slideCount: project.slideCount,
    lastEditedBy: me.name,
    lastEditedAt: now,
    projectJson: project.projectJson,
    isLocked: false,
  };

  if (index >= 0) {
    allProjects[index] = {
      ...allProjects[index],
      ...record,
    };
  } else {
    allProjects.unshift(record);
  }

  saveAllStoredTeamProjects(allProjects);
  return record;
}

export function deleteTeamProject(teamId: string, projectId: string): void {
  const allProjects = getAllStoredTeamProjects().filter(
    (p) => !(p.id === projectId && p.teamId === teamId)
  );
  saveAllStoredTeamProjects(allProjects);
}

export function setProjectLock(
  teamId: string,
  projectId: string,
  isLocked: boolean
): void {
  const me = getCurrentUserProfile();
  const allProjects = getAllStoredTeamProjects();
  const record = allProjects.find((p) => p.id === projectId && p.teamId === teamId);
  if (record) {
    record.isLocked = isLocked;
    record.lockedBy = isLocked ? me.name : undefined;
    record.lockedAt = isLocked ? new Date().toISOString() : undefined;
    saveAllStoredTeamProjects(allProjects);
  }
}

function getAllStoredTeamProjects(): TeamProjectRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TEAM_PROJECTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

function saveAllStoredTeamProjects(records: TeamProjectRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_TEAM_PROJECTS, JSON.stringify(records));
  } catch {
    // ignore
  }
}
