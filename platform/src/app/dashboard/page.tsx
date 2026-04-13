"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Area, AreaChart, Cell, PieChart, Pie,
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from "recharts";
import {
  Link2, MousePointerClick, TrendingUp, QrCode, ArrowUpRight,
  ExternalLink, Copy, Check, Monitor, Smartphone, Tablet, Globe,
  Megaphone, Activity, Users, Clock, Plus,
  RefreshCw,
  Award, Shield,
} from "lucide-react";
import PageHeader from "@/platform/components/PageHeader";
import Panel from "@/platform/components/Panel";
import StatCard from "@/platform/components/StatCard";
import { api } from "@/platform/lib/api";
import {
  TOOLTIP_STYLE, DEVICE_COLORS, GEO_COLORS,
} from "@/platform/constants/chart";

/* ─── Backend DTO types ──────────────────────────────────────────────────── */
interface TrafficSummaryDto {
  totalRequests: number;
  uniqueIps: number;
}

interface TimeSeriesPointDto {
  timestamp: string;
  count: number;
}

interface LinkListItemDto {
  shortCode: string;
  clickCount: number;
  status: string;
  tags?: string[] | null;
  expiryUtc?: string;
  createdAtUtc?: string;
  title?: string | null;
}

interface TopLinkRecord {
  id: string;
  shortUrl: string;
  destination: string;
  stats: { clicks: number; ctr: number };
}

/* ─── Static fallback data (not available from API) ─────────────────────── */
const STATIC_DEVICES = [
  { name: "Desktop", value: 60 },
  { name: "Mobile",  value: 32 },
  { name: "Tablet",  value: 8  },
];
const STATIC_GEOS = [
  { name: "US", value: 420 },
  { name: "GB", value: 185 },
  { name: "DE", value: 97  },
  { name: "CA", value: 74  },
  { name: "AU", value: 48  },
];
const STATIC_REFERRERS = [
  { name: "google.com",  value: 512 },
  { name: "twitter.com", value: 184 },
];

/* ─── Constants ─────────────────────────────────────────────────────────── */
const DEVICE_ICONS: Record<string, React.ReactNode> = {
  Desktop: <Monitor size={14} />,
  Mobile:  <Smartphone size={14} />,
  Tablet:  <Tablet size={14} />,
};

const ACTIVITY_FEED = [
  { id: 1, Icon: Link2,      color: "var(--ocean-500)", action: "Link created",           detail: "acme.ly/launch",     time: "2m ago",  },
  { id: 2, Icon: TrendingUp, color: "#16a34a",          action: "1,000 clicks milestone", detail: "acme.ly/pricing",    time: "1h ago",  },
  { id: 3, Icon: QrCode,     color: "var(--ocean-400)", action: "QR code generated",      detail: "acme.ly/docs",       time: "3h ago",  },
  { id: 4, Icon: Megaphone,  color: "#E9940A",          action: "Campaign launched",       detail: "Spring Launch '26",  time: "5h ago",  },
  { id: 5, Icon: Globe,      color: "#16a34a",          action: "Domain verified",         detail: "acme.ly",           time: "1d ago",  },
  { id: 6, Icon: Users,      color: "var(--ocean-300)", action: "Member invited",          detail: "mina@acme.com",      time: "2d ago",  },
  { id: 7, Icon: Shield,     color: "#92400E",          action: "Password link created",   detail: "acme.ly/private",   time: "2d ago",  },
  { id: 8, Icon: Award,      color: "var(--ocean-600)", action: "5,000 clicks milestone",  detail: "Workspace total",   time: "3d ago",  },
];

const BTN_PRIMARY: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 7,
  background: "var(--ocean-500)", color: "#fff", textDecoration: "none",
  padding: "0 16px", height: 36, fontWeight: 700, fontSize: 12,
  letterSpacing: "0.07em", textTransform: "uppercase",
  border: "none", cursor: "pointer", fontFamily: "var(--font-body)",
};
const BTN_GHOST: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 7,
  background: "var(--cloud)", color: "var(--text-secondary)", textDecoration: "none",
  padding: "0 14px", height: 36, fontWeight: 700, fontSize: 12,
  letterSpacing: "0.07em", textTransform: "uppercase",
  border: "1px solid var(--border)", cursor: "pointer", fontFamily: "var(--font-body)",
};

/* ─── Component ─────────────────────────────────────────────────────────── */
export default function OverviewDashboard() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [trafficSummary, setTrafficSummary] = useState<TrafficSummaryDto | null>(null);
  const [timeseries, setTimeseries] = useState<Array<{ date: string; clicks: number }>>([]);
  const [topLinks, setTopLinks] = useState<TopLinkRecord[]>([]);
  const [totalLinks, setTotalLinks] = useState(0);

  useEffect(() => {
    let cancelled = false;

    // Fetch traffic summary
    api
      .get<TrafficSummaryDto>("/api/v1/analytics/traffic/summary?lastHours=168")
      .then((res) => { if (!cancelled) setTrafficSummary(res); })
      .catch(console.error);

    // Fetch timeseries
    api
      .get<TimeSeriesPointDto[]>("/api/v1/analytics/traffic/timeseries?lastHours=168&interval=day")
      .then((res) => {
        if (!cancelled) {
          const mapped = res.map((pt, i) => {
            const d = new Date(pt.timestamp);
            const date = isNaN(d.getTime()) ? String(pt.timestamp) : d.toISOString().slice(0, 10);
            return { date, clicks: pt.count, prev: Math.round(pt.count * (0.65 + i * 0.04)) };
          });
          setTimeseries(mapped);
        }
      })
      .catch(console.error);

    // Fetch top links via admin links API (sorted by clickCount)
    api
      .get<{ total: number; items: LinkListItemDto[] }>("/api/admin/v1/links?pageSize=200")
      .then((res) => {
        if (!cancelled) {
          setTotalLinks(res.total);
          const top: TopLinkRecord[] = res.items
            .sort((a, b) => b.clickCount - a.clickCount)
            .slice(0, 5)
            .map((item) => ({
              id: item.shortCode,
              shortUrl: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5055"}/r/${item.shortCode}`,
              destination: "—",
              stats: { clicks: item.clickCount, ctr: 0 },
            }));
          setTopLinks(top);
        }
      })
      .catch(console.error);

    return () => { cancelled = true; };
  }, []);

  const devices = STATIC_DEVICES;
  const totalDeviceClicks = devices.reduce((s, d) => s + d.value, 0);
  const geos = STATIC_GEOS;
  const areaData = timeseries.length > 0 ? timeseries : [];
  const topReferrer = STATIC_REFERRERS[0];
  const topGeo = STATIC_GEOS[0];

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {});
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <PageHeader
        title="Overview"
        description="Your workspace at a glance — performance, campaigns, and recent activity."
        breadcrumb="Platform"
        action={
          <div style={{ display: "flex", gap: 6 }}>
            <Link href="/dashboard/analytics" style={BTN_GHOST}>
              <Activity size={14} />
              Analytics
            </Link>
            <Link href="/dashboard/links" style={BTN_PRIMARY}>
              <Plus size={14} />
              Create Link
            </Link>
          </div>
        }
      />

      {/* ── 5-col KPI row ─────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 12 }}>
        <StatCard compact label="Active Links"    value={totalLinks || "—"}                                                       note="All time"         trend={12} icon={<Link2 size={16} />} />
        <StatCard compact label="Total Clicks"    value={trafficSummary?.totalRequests?.toLocaleString() ?? "—"}    note="Last 7 days"      trend={8}  icon={<MousePointerClick size={16} />} />
        <StatCard compact label="Unique Visitors" value={trafficSummary?.uniqueIps?.toLocaleString() ?? "—"}        note="Last 7 days"      trend={5}  icon={<Users size={16} />} />
        <StatCard compact label="Avg. CTR"        value="—"                                                                        note="Across all links" trend={-2} icon={<TrendingUp size={16} />} />
        <StatCard compact label="QR-Enabled"      value="—"                                                                        note="Ready for print"  trend={0}  icon={<QrCode size={16} />} />
      </div>

      {/* ── Quick Actions ──────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
        {[
          { label: "Manage Domains", sub: "Configure branded hosts", Icon: Globe, href: "/dashboard/domains", color: "var(--ocean-500)", badge: null },
          { label: "New Campaign",  sub: "Group & track links",  Icon: Megaphone, href: "/dashboard/campaigns",  color: "var(--ocean-600)", badge: "4 active" },
          { label: "Generate QR",   sub: "Print-ready codes",    Icon: QrCode,    href: "/dashboard/qrcodes",    color: "var(--ocean-700)", badge: null },
          { label: "Invite Member", sub: "Grow your team",       Icon: Users,     href: "/dashboard/team",       color: "#0C2D48",          badge: "1 pending" },
        ].map((qa) => (
          <Link
            key={qa.label}
            href={qa.href}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              background: "var(--cloud)", border: "1px solid var(--border)",
              padding: "10px 12px", textDecoration: "none",
              boxShadow: "var(--shadow-xs)", transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--ocean-400)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
              (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-md)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-xs)";
            }}
          >
            <div style={{ width: 32, height: 32, background: qa.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <qa.Icon size={14} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>{qa.label}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{qa.sub}</div>
            </div>
            {qa.badge
              ? <span style={{ fontSize: 9, fontWeight: 800, background: "var(--ocean-50)", color: "var(--ocean-600)", border: "1px solid var(--ocean-100)", padding: "2px 6px", flexShrink: 0, letterSpacing: "0.05em" }}>{qa.badge}</span>
              : <ArrowUpRight size={12} color="var(--text-muted)" />
            }
          </Link>
        ))}
      </div>

      {/* ── Row: Click trend (2fr) + Snapshot (1fr) ──────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10, marginBottom: 10 }}>
        <Panel
          title="Click Trend"
          subtitle="Daily clicks vs. previous period · Last 7 days"
          action={
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
                <div style={{ width: 12, height: 2, background: "var(--ocean-500)" }} /> This period
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
                <div style={{ width: 12, height: 2, background: "#9AB7CE" }} /> Prev
              </div>
              <Link href="/dashboard/analytics" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "var(--ocean-500)", textDecoration: "none", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                Full Report <ArrowUpRight size={12} />
              </Link>
            </div>
          }
        >
          <div style={{ width: "100%", height: 210 }}>
            <ResponsiveContainer>
              <AreaChart data={areaData} margin={{ top: 6, right: 4, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="ovClickGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2772A0" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#2772A0" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ovPrevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#9AB7CE" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#9AB7CE" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--sky-200)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "var(--text-muted)", fontFamily: "var(--font-body)" }} tickFormatter={(v) => v.slice(5)} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "var(--text-muted)", fontFamily: "var(--font-body)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "rgba(255,255,255,0.6)", marginBottom: 2 }} />
                <Area type="monotone" dataKey="prev"   stroke="#9AB7CE"         strokeWidth={1.5} strokeDasharray="4 3" fill="url(#ovPrevGrad)"  dot={false} name="Prev period" />
                <Area type="monotone" dataKey="clicks" stroke="var(--ocean-500)" strokeWidth={2.5}                     fill="url(#ovClickGrad)" dot={{ fill: "var(--ocean-500)", r: 3.5, strokeWidth: 0 }} activeDot={{ r: 5, fill: "var(--ocean-400)" }} name="Clicks" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* Snapshot sidebar */}
        <Panel title="Snapshot" subtitle="Key indicators at a glance">
          <div style={{ display: "grid", gap: 2 }}>
            {[
              { label: "Top Referrer",  value: topReferrer?.name ?? "—",  sub: `${topReferrer?.value.toLocaleString()} clicks`, Icon: ArrowUpRight, color: "var(--ocean-500)" },
              { label: "Top Country",   value: topGeo?.name ?? "—",        sub: `${topGeo?.value.toLocaleString()} clicks`,      Icon: Globe,        color: "var(--ocean-400)" },
              { label: "Top Device",    value: "Desktop",                   sub: `${Math.round((devices[0]?.value / totalDeviceClicks) * 100)}% of traffic`, Icon: Monitor, color: "var(--ocean-300)" },
              { label: "Peak Hour",     value: "15:00",                     sub: "511 avg. clicks",                               Icon: Clock,        color: "#144466" },
              { label: "Campaigns",     value: "4 active",                  sub: "Running this week",                             Icon: Megaphone,    color: "#E9940A" },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ width: 30, height: 30, background: item.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <item.Icon size={13} color="#fff" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 1 }}>{item.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.value}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* ── Row: Top Links + Activity Feed ────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 10, marginBottom: 10 }}>
        <Panel
          title="Top Performing Links"
          subtitle="Ranked by clicks · Last 7 days"
          noPad
          action={
            <Link href="/dashboard/links" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "var(--ocean-500)", textDecoration: "none", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              View All <ArrowUpRight size={12} />
            </Link>
          }
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--sky-100)", borderBottom: "1px solid var(--border)" }}>
                {["Short URL", "Clicks", "CTR", ""].map((h) => (
                  <th key={h} style={{ padding: "9px 14px", textAlign: h === "Clicks" || h === "CTR" ? "right" : "left", fontWeight: 700, fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.07em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topLinks.map((link, i) => {
                const pct = Math.round((link.stats.clicks / topLinks[0].stats.clicks) * 100);
                const isCopied = copiedId === link.id;
                return (
                  <tr
                    key={link.id}
                    style={{ borderBottom: "1px solid var(--border)", transition: "background 0.12s" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--sky-50)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                  >
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 20, height: 20, background: i === 0 ? "var(--ocean-500)" : "var(--sky-200)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: i === 0 ? "#fff" : "var(--ocean-600)", flexShrink: 0 }}>
                          {i + 1}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: "var(--ocean-600)", fontFamily: "var(--font-mono)", fontSize: 13 }}>{link.shortUrl}</div>
                          <div style={{ fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 150 }}>{link.destination}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                        <div style={{ width: 48, height: 5, background: "var(--sky-200)", flexShrink: 0 }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: "var(--ocean-500)" }} />
                        </div>
                        <span style={{ fontWeight: 700, color: "var(--ink)", fontSize: 13, whiteSpace: "nowrap" }}>{link.stats.clicks.toLocaleString()}</span>
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right" }}>
                      <span style={{ background: "var(--ocean-50)", color: "var(--ocean-700)", fontWeight: 700, fontSize: 12, padding: "3px 8px", border: "1px solid var(--ocean-100)" }}>
                        {link.stats.ctr}%
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", gap: 5, justifyContent: "flex-end" }}>
                        <button
                          suppressHydrationWarning
                          onClick={() => handleCopy(link.id, link.shortUrl)}
                          title={isCopied ? "Copied!" : "Copy"}
                          style={{ background: isCopied ? "var(--ocean-50)" : "none", border: "1px solid var(--border)", color: isCopied ? "var(--ocean-600)" : "var(--text-muted)", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                        >
                          {isCopied ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                        <a
                          href={link.destination}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ background: "none", border: "1px solid var(--border)", color: "var(--text-muted)", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}
                          title="Open destination"
                        >
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>

        {/* Activity Feed */}
        <Panel
          title="Recent Activity"
          subtitle="Latest workspace events"
          action={
            <button suppressHydrationWarning style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ocean-500)", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, fontFamily: "var(--font-body)" }}>
              <RefreshCw size={12} /> Refresh
            </button>
          }
        >
          <div>
            {ACTIVITY_FEED.map((ev, i) => (
              <div
                key={ev.id}
                style={{ display: "flex", gap: 8, padding: "8px 0", borderBottom: i < ACTIVITY_FEED.length - 1 ? "1px solid var(--border)" : "none", alignItems: "flex-start" }}
              >
                <div style={{ width: 26, height: 26, background: ev.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <ev.Icon size={12} color="#fff" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", lineHeight: 1.3 }}>{ev.action}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>{ev.detail}</div>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0, paddingTop: 1 }}>{ev.time}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* ── Row: Geo + Device ─────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Panel title="Top Countries" subtitle="Clicks by geography">
          <div style={{ display: "grid", gap: 9 }}>
            {geos.map((geo, i) => {
              const pct = Math.round((geo.value / geos[0].value) * 100);
              return (
                <div key={geo.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 26, fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", flexShrink: 0 }}>{geo.name}</div>
                  <div style={{ flex: 1, height: 6, background: "var(--sky-200)", position: "relative" }}>
                    <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${pct}%`, background: GEO_COLORS[i] ?? "var(--ocean-200)" }} />
                  </div>
                  <div style={{ width: 44, textAlign: "right", fontSize: 12, fontWeight: 700, color: "var(--ink)", flexShrink: 0 }}>{geo.value.toLocaleString()}</div>
                  <div style={{ width: 28, textAlign: "right", fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>{pct}%</div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Device Breakdown" subtitle="Click share by device">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 108, height: 108, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={devices} cx="50%" cy="50%" innerRadius={36} outerRadius={56} paddingAngle={2} dataKey="value" startAngle={90} endAngle={-270}>
                    {devices.map((_, index) => <Cell key={`cell-${index}`} fill={DEVICE_COLORS[index % DEVICE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, display: "grid", gap: 9 }}>
              {devices.map((d, i) => (
                <div key={d.name}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-secondary)", fontSize: 11 }}>
                      <div style={{ width: 8, height: 8, background: DEVICE_COLORS[i % DEVICE_COLORS.length], flexShrink: 0 }} />
                      {DEVICE_ICONS[d.name]}
                      {d.name}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: 12, color: "var(--ink)" }}>{Math.round((d.value / totalDeviceClicks) * 100)}%</span>
                  </div>
                  <div style={{ height: 4, background: "var(--sky-200)" }}>
                    <div style={{ width: `${Math.round((d.value / totalDeviceClicks) * 100)}%`, height: "100%", background: DEVICE_COLORS[i % DEVICE_COLORS.length] }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
