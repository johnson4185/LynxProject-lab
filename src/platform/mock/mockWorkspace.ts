import { Workspace } from '../types/workspace';

export const mockWorkspace: Workspace = {
  id: 'ws-1',
  name: 'Acme Inc.',
  ownerId: 'user-1',
  members: ['user-1'],
  plan: 'growth',
  trialEndsAt: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000).toISOString(),
  createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  branding: {
    logoUrl: '',
    color: '#1e90ff',
  },
};
