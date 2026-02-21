export interface Link {
  id: string;
  shortUrl: string;
  destination: string;
  slug: string;
  domain: string;
  createdAt: string;
  createdBy: string;
  workspaceId: string;
  tags?: string[];
  folderId?: string;
  utm?: Record<string, string>;
  expiresAt?: string;
  passwordProtected?: boolean;
  qrCodeUrl?: string;
  archived?: boolean;
  stats: {
    clicks: number;
    ctr: number;
    timeline: Array<{ date: string; clicks: number }>;
    referrers: Record<string, number>;
    devices: Record<string, number>;
    geo: Record<string, number>;
    campaigns?: Record<string, number>;
  };
}
