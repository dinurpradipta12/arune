export type TeamRole = 'owner' | 'editor' | 'viewer';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  avatarId?: string;
  avatarUrl?: string;
  avatarColor?: string;
  joinedAt: string;
  isCurrentUser?: boolean;
}

export interface TeamBrandKit {
  publicationName: string;
  authorOrHandle: string;
  issueLabel: string;
  footerNote: string;
  logoUrl?: string;
  showSlideNumbers: boolean;
  showFooterBar: boolean;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  headingFont: string;
  bodyFont: string;
  brandColors: string[];
}

export const DEFAULT_TEAM_BRAND_KIT: TeamBrandKit = {
  publicationName: 'Creative Editorial Studio',
  authorOrHandle: '@dinurpradiptaa',
  issueLabel: 'VOL. 01',
  footerNote: 'arune.studio • swipe to read',
  showSlideNumbers: true,
  showFooterBar: true,
  primaryColor: '#1E3A8A',
  accentColor: '#3B82F6',
  backgroundColor: '#FFFFFF',
  textColor: '#0F172A',
  headingFont: 'Plus Jakarta Sans',
  bodyFont: 'Plus Jakarta Sans',
  brandColors: ['#1E3A8A', '#3B82F6', '#10B981', '#F59E0B', '#0F172A'],
};

export interface TeamWorkspace {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  avatarColor: string;
  iconUrl?: string;
  members: TeamMember[];
  brandKit?: TeamBrandKit;
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
