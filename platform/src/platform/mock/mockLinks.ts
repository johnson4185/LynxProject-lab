import { Link } from "../types/link";

export const mockLinks: Link[] = [
  {
    id: "link-1",
    shortUrl: "url.ify/example",
    destination: "https://example.com",
    slug: "example",
    domain: "url.ify",
    createdAt: "2026-01-01T00:00:00.000Z",
    createdBy: "",
    workspaceId: "",
    tags: [],
    stats: {
      clicks: 0,
      ctr: 0,
      timeline: [],
      referrers: {},
      devices: {},
      geo: {},
    },
  },
];
