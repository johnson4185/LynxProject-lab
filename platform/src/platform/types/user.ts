export type Role = 'owner' | 'admin' | 'member' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: Role;
  workspaceId: string;
  trialEndsAt?: string;
  usage: {
    links: number;
    clicks: number;
    campaigns: number;
  };
}
