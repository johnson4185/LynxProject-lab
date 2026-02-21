export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  members: string[];
  plan: 'free' | 'growth' | 'enterprise';
  trialEndsAt?: string;
  createdAt: string;
  branding?: {
    logoUrl?: string;
    color?: string;
  };
}
