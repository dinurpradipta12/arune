export type TeamRole = 'owner' | 'editor' | 'viewer';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  avatarUrl?: string;
  avatarColor?: string;
  joinedAt: string;
  isCurrentUser?: boolean;
}

export interface TeamWorkspace {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  avatarColor: string;
  members: TeamMember[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamProjectRecord {
  id: string;
  teamId: string;
  title: string;
  aspectRatio: string;
  slideCount: number;
  lastEditedBy: string;
  lastEditedAt: string;
  isLocked?: boolean;
  lockedBy?: string;
  lockedAt?: string;
  thumbnailSvg?: string;
  projectJson: string; // Serialized project snapshot
}
