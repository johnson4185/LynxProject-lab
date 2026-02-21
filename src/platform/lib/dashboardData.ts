import { mockLinks } from "../mock/mockLinks";

type ClickPoint = { date: string; clicks: number };

function aggregateTimeline(points: ClickPoint[]): ClickPoint[] {
  const map = new Map<string, number>();
  for (const point of points) {
    map.set(point.date, (map.get(point.date) ?? 0) + point.clicks);
  }
  return Array.from(map.entries())
    .map(([date, clicks]) => ({ date, clicks }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function aggregateRecord(records: Record<string, number>[]): Array<{ name: string; value: number }> {
  const map = new Map<string, number>();
  for (const record of records) {
    for (const [name, value] of Object.entries(record)) {
      map.set(name, (map.get(name) ?? 0) + value);
    }
  }
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export const dashboardData = {
  links: mockLinks,
  totals: {
    links: mockLinks.length,
    clicks: mockLinks.reduce((sum, link) => sum + link.stats.clicks, 0),
    avgCtr: Number((mockLinks.reduce((sum, link) => sum + link.stats.ctr, 0) / mockLinks.length).toFixed(1)),
    withQr: mockLinks.filter((link) => link.qrCodeUrl).length,
  },
  clicksTimeline: aggregateTimeline(mockLinks.flatMap((link) => link.stats.timeline)),
  devices: aggregateRecord(mockLinks.map((link) => link.stats.devices)),
  referrers: aggregateRecord(mockLinks.map((link) => link.stats.referrers)),
  geos: aggregateRecord(mockLinks.map((link) => link.stats.geo)),
  campaigns: aggregateRecord(mockLinks.map((link) => link.stats.campaigns ?? {})),
  domains: [
    { host: "acme.ly", status: "Verified", links: 4, ssl: "Active", clicks: 3240 },
    { host: "go.acme.com", status: "Verified", links: 1, ssl: "Active", clicks: 420 },
    { host: "events.acme.com", status: "Pending", links: 0, ssl: "Provisioning", clicks: 0 },
  ],
  team: [
    { id: "u1", name: "Jane Doe", email: "jane@acme.com", role: "Owner", status: "Active", lastActive: "2m ago" },
    { id: "u2", name: "Ari Patel", email: "ari@acme.com", role: "Admin", status: "Active", lastActive: "14m ago" },
    { id: "u3", name: "Mina Lopez", email: "mina@acme.com", role: "Member", status: "Invited", lastActive: "-" },
  ],
  integrations: [
    { id: "i1", name: "Slack", category: "Notifications", connected: true, description: "Share link alerts and daily reports." },
    { id: "i2", name: "Zapier", category: "Automation", connected: true, description: "Trigger automations when links are created." },
    { id: "i3", name: "HubSpot", category: "CRM", connected: false, description: "Sync campaign traffic and leads." },
    { id: "i4", name: "Google Analytics 4", category: "Analytics", connected: false, description: "Map short-link sessions to GA4 events." },
    { id: "i5", name: "Salesforce", category: "CRM", connected: false, description: "Attribute revenue to campaigns." },
  ],
  invoices: [
    { id: "INV-2026-001", date: "2026-01-01", amount: 29, status: "Paid" },
    { id: "INV-2026-002", date: "2026-02-01", amount: 29, status: "Paid" },
  ],
};
