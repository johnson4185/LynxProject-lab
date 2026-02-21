import { User } from '../types/user';

export const mockUser: User = {
  id: 'user-1',
  name: 'Jane Doe',
  email: 'jane@acme.com',
  avatarUrl: '',
  role: 'owner',
  workspaceId: 'ws-1',
  trialEndsAt: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000).toISOString(),
  usage: {
    links: 12,
    clicks: 2340,
    campaigns: 2,
  },
};
