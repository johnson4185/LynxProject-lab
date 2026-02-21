"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  Cell,
  PieChart,
  Pie,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  Link2, MousePointerClick, TrendingUp, QrCode, ArrowUpRight,
  ExternalLink, Copy, Check, Monitor, Smartphone, Tablet, Globe,
  Megaphone, Activity, Users, Clock, Zap, Star, Plus,
} from "lucide-react";
import PageHeader from "@/platform/components/PageHeader";
import Panel from "@/platform/components/Panel";
import StatCard from "@/platform/components/StatCard";
import { dashboardData } from "@/platform/lib/dashboardData";

const DEVICE_COLORS = ["var(--ocean-500)", "var(--ocean-300)", "var(--ocean-700)"];
const GEO_COLORS = ["var(--ocean-500)", "var(--ocean-400)", "var(--ocean-300)", "var(--ocean-200)", "#9AB7CE"];
const DEVICE_ICONS: Record<string, React.ReactNode> = {
  Desktop: <Monitor size={14} />,
  Mobile: <Smartphone size={14} />,
  Tablet: <Tablet size={14} />,
};

const ACTIVITY_FEED = [
  { id: 1, Icon: Link2,           color: "var(--ocean-500)", action: "Link created",             detail: "acme.ly/launch",      time: "2m ago" },
  { id: 2, Icon: TrendingUp,      color: "#16a34a",          action: "1,000 clicks milestone",   detail: "acme.ly/pricing",     time: "1h ago" },
  { id: 3, Icon: QrCode,          color: "var(--ocean-400)", action: "QR code generated",        detail: "acme.ly/docs",        time: "3h ago" },
  { id: 4, Icon: Megaphone,       color: "#E9940A",          action: "Campaign launched",         detail: "Spring Launch '26",   time: "5h ago" },
  { id: 5, Icon: Globe,           color: "#16a34a",          action: "Domain verified",           detail: "acme.ly",            time: "1d ago" },
  { id: 6, Icon: Users,           color: "var(--ocean-300)", action: "Member invited",            detail: "mina@acme.com",       time: "2d ago" },
];

const BTN_PRIMARY: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 7,
  background: "var(--ocean-500)", color: "#fff", textDecoration: "none",
  padding: "0 20px", height: 40, fontWeight: 700, fontSize: 12,
  letterSpacing: "0.07em", textTransform: "uppercase",
  border: "none", cursor: "pointer", fontFamily: "var(--font-body)",
};
const BTN_GHOST: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 7,
  background: "var(--cloud)", color: "var(--text-secondary)", textDecoration: "none",
  padding: "0 16px", height: 40, fontWeight: 700, fontSize: 12,
  letterSpacing: "0.07em", textTransform: "uppercase",
  border: "1px solid var(--border)", cursor: "pointer", fontFamily: "var(--font-body)",
};

export default function OverviewDashboard() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const topLinks = [...dashboardData.links].sort((a, b) => b.stats.clicks - a.stats.clicks).slice(0, 5);
  const devices = dashboardData.devices;
  const totalDeviceClicks = devices.reduce((s, d) => s + d.value, 0);
  const geos = dashboardData.geos.slice(0, 5);
  const areaData = dashboardData.clicksTimeline.map((d, i) => ({
    ...d,
    prev: Math.round(d.clicks * (0.65 + i * 0.04)),
  }));
  const topReferrer = dashboardData.referrers[0];
  const topGeo = dashboardData.geos[0];

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {
      // fallback silent fail
    });
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <PageHeader
        title="Overview"
        description="Your workspace at a glance — performance, campaigns, and recent activity."
        breadcrumb="Platform"
        action={
          <div style={{ display: "flex", gap: 8 }}>
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

      {/* 5-col KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 16 }}>
        <StatCard label="Active Links"    value={dashboardData.totals.links}                    note="All time"          trend={12} icon={<Link2 size={20} />} />
        <StatCard label="Total Clicks"    value={dashboardData.totals.clicks.toLocaleString()}   note="Last 7 days"       trend={8}  icon={<MousePointerClick size={20} />} />
        <StatCard label="Unique Visitors" value="2,180"                                           note="Last 7 days"       trend={5}  icon={<Users size={20} />} />
        <StatCard label="Avg. CTR"        value={`${dashboardData.totals.avgCtr}%`}               note="Across all links"  trend={-2} icon={<TrendingUp size={20} />} />
        <StatCard label="QR-Enabled"      value={dashboardData.totals.withQr}                    note="Ready for print"   trend={0}  icon={<QrCode size={20} />} />
      </div>

      {/* Quick Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
        {[
          { label: "Create Link",    sub: "Shorten any URL",     Icon: Link2,     href: "/dashboard/links",       color: "var(--ocean-500)" },
          { label: "New Campaign",   sub: "Group & track links",  Icon: Megaphone, href: "/dashboard/campaigns",   color: "var(--ocean-600)" },
          { label: "Generate QR",    sub: "Print-ready codes",    Icon: QrCode,    href: "/dashboard/qrcodes",     color: "var(--ocean-700)" },
          { label: "Invite Member",  sub: "Grow your team",       Icon: Users,     href: "/dashboard/team",        color: "#0C2D48" },
        ].map((qa) => (
          <Link
            key={qa.label}
            href={qa.href}
            style={{
              display: "flex", alignItems: "center", gap: 14,
              background: "var(--cloud)", border: "1px solid var(--border)",
              padding: "16px 20px", textDecoration: "none",
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
            <div style={{ width: 40, height: 40, background: qa.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <qa.Icon size={17} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{qa.label}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>{qa.sub}</div>
            </div>
            <ArrowUpRight size={14} color="var(--text-muted)" />
          </Link>
        ))}
      </div>

      {/* Row: Click trend (2fr) + Snapshot (1fr) */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginBottom: 12 }}>
        <Panel
          title="Click Trend"
          subtitle="Daily clicks vs. previous period · Last 7 days"
          action={
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
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
          <div style={{ width: "100%", height: 240 }}>
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
                <Tooltip contentStyle={{ background: "#071B2C", border: "none", color: "#fff", fontSize: 13, fontFamily: "var(--font-body)", borderRadius: 0 }} labelStyle={{ color: "rgba(255,255,255,0.6)", marginBottom: 2 }} />
                <Area type="monotone" dataKey="prev" stroke="#9AB7CE" strokeWidth={1.5} strokeDasharray="4 3" fill="url(#ovPrevGrad)" dot={false} name="Prev period" />
                <Area type="monotone" dataKey="clicks" stroke="var(--ocean-500)" strokeWidth={2.5} fill="url(#ovClickGrad)" dot={{ fill: "var(--ocean-500)", r: 3.5, strokeWidth: 0 }} activeDot={{ r: 5, fill: "var(--ocean-400)" }} name="Clicks" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* Snapshot sidebar */}
        <Panel title="Snapshot" subtitle="Key indicators at a glance">
          <div style={{ display: "grid", gap: 2 }}>
            {[
              { label: "Top Referrer",  value: topReferrer?.name ?? "—",  sub: `${topReferrer?.value.toLocaleString()} clicks`, Icon: ArrowUpRight, color: "var(--ocean-500)" },
              { label: "Top Country",   value: topGeo?.name ?? "—",        sub: `${topGeo?.value.toLocaleString()} clicks`,       Icon: Globe,        color: "var(--ocean-400)" },
              { label: "Top Device",    value: "Desktop",                   sub: `${Math.round((devices[0]?.value / totalDeviceClicks) * 100)}% of traffic`, Icon: Monitor, color: "var(--ocean-300)" },
              { label: "Peak Hour",     value: "15:00",                     sub: "511 avg. clicks",                                Icon: Clock,        color: "#144466" },
              { label: "Campaigns",     value: "4 active",                  sub: "Running this week",                              Icon: Megaphone,    color: "#E9940A" },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ width: 34, height: 34, background: item.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <item.Icon size={15} color="#fff" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 1 }}>{item.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.value}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Row: Top links (3fr) + Activity feed (2fr) */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 12, marginBottom: 12 }}>
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
                  <th key={h} style={{ padding: "12px 16px", textAlign: h === "Clicks" || h === "CTR" ? "right" : "left", fontWeight: 700, fontSize: 12, color: "var(--text-muted)", letterSpacing: "0.07em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
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
                    <td style={{ padding: "13px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 22, height: 22, background: i === 0 ? "var(--ocean-500)" : "var(--sky-200)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: i === 0 ? "#fff" : "var(--ocean-600)", flexShrink: 0 }}>
                          {i + 1}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: "var(--ocean-600)", fontFamily: "var(--font-mono)", fontSize: 13 }}>{link.shortUrl}</div>
                          <div style={{ fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>{link.destination}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "13px 16px", textAlign: "right" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                        <div style={{ width: 56, height: 5, background: "var(--sky-200)", flexShrink: 0 }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: "var(--ocean-500)" }} />
                        </div>
                        <span style={{ fontWeight: 700, color: "var(--ink)", fontSize: 14, whiteSpace: "nowrap" }}>{link.stats.clicks.toLocaleString()}</span>
                      </div>
                    </td>
                    <td style={{ padding: "13px 16px", textAlign: "right" }}>
                      <span style={{ background: "var(--ocean-50)", color: "var(--ocean-700)", fontWeight: 700, fontSize: 12, padding: "3px 8px", border: "1px solid var(--ocean-100)" }}>
                        {link.stats.ctr}%
                      </span>
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <div style={{ display: "flex", gap: 5, justifyContent: "flex-end" }}>
                        <button
                          onClick={() => handleCopy(link.id, link.shortUrl)}
                          title={isCopied ? "Copied!" : "Copy short URL"}
                          style={{ background: isCopied ? "var(--ocean-50)" : "none", border: "1px solid var(--border)", color: isCopied ? "var(--ocean-600)" : "var(--text-muted)", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s" }}
                        >
                          {isCopied ? <Check size={13} /> : <Copy size={13} />}
                        </button>
                        <a
                          href={link.destination}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ background: "none", border: "1px solid var(--border)", color: "var(--text-muted)", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center" }}
                          title="Open destination"
                        >
                          <ExternalLink size={13} />
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
        <Panel title="Recent Activity" subtitle="Latest workspace events">
          <div>
            {ACTIVITY_FEED.map((ev, i) => (
              <div
                key={ev.id}
                style={{ display: "flex", gap: 12, padding: "11px 0", borderBottom: i < ACTIVITY_FEED.length - 1 ? "1px solid var(--border)" : "none", alignItems: "flex-start" }}
              >
                <div style={{ width: 32, height: 32, background: ev.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <ev.Icon size={14} color="#fff" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", lineHeight: 1.3 }}>{ev.action}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>{ev.detail}</div>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", flexShrink: 0, paddingTop: 1 }}>{ev.time}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Row: Geo + Device */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <Panel title="Top Countries" subtitle="Clicks by geography">
          <div style={{ display: "grid", gap: 12 }}>
            {geos.map((geo, i) => {
              const pct = Math.round((geo.value / geos[0].value) * 100);
              return (
                <div key={geo.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 30, fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", flexShrink: 0 }}>{geo.name}</div>
                  <div style={{ flex: 1, height: 7, background: "var(--sky-200)", position: "relative" }}>
                    <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${pct}%`, background: GEO_COLORS[i] ?? "var(--ocean-200)" }} />
                  </div>
                  <div style={{ width: 52, textAlign: "right", fontSize: 13, fontWeight: 700, color: "var(--ink)", flexShrink: 0 }}>{geo.value.toLocaleString()}</div>
                  <div style={{ width: 34, textAlign: "right", fontSize: 12, color: "var(--text-muted)", flexShrink: 0 }}>{pct}%</div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Device Breakdown" subtitle="Click share by device type">
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ width: 150, height: 150, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={devices} cx="50%" cy="50%" innerRadius={44} outerRadius={68} paddingAngle={2} dataKey="value" startAngle={90} endAngle={-270}>
                    {devices.map((_, index) => <Cell key={`cell-${index}`} fill={DEVICE_COLORS[index % DEVICE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#071B2C", border: "none", color: "#fff", fontSize: 13, borderRadius: 0 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, display: "grid", gap: 13 }}>
              {devices.map((d, i) => (
                <div key={d.name}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 7, color: "var(--text-secondary)", fontSize: 13 }}>
                      <div style={{ width: 10, height: 10, background: DEVICE_COLORS[i % DEVICE_COLORS.length], flexShrink: 0 }} />
                      {DEVICE_ICONS[d.name]}
                      {d.name}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>{Math.round((d.value / totalDeviceClicks) * 100)}%</span>
                  </div>
                  <div style={{ height: 5, background: "var(--sky-200)" }}>
                    <div style={{ width: `${Math.round((d.value / totalDeviceClicks) * 100)}%`, height: "100%", background: DEVICE_COLORS[i % DEVICE_COLORS.length] }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      {/* Plan usage banner */}
      <div style={{ background: "var(--cloud)", border: "1px solid var(--border)", padding: "20px 24px", display: "flex", alignItems: "center", gap: 24, boxShadow: "var(--shadow-xs)" }}>
        <div style={{ width: 38, height: 38, background: "var(--ocean-500)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Zap size={17} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>Growth Plan · Monthly clicks</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-secondary)" }}>4,248 / 10,000</span>
          </div>
          <div style={{ height: 8, background: "var(--sky-200)" }}>
            <div style={{ width: "42%", height: "100%", background: "var(--ocean-500)" }} />
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 5 }}>42% used · 5,752 clicks remaining this month</div>
        </div>
        <Link href="/dashboard/billing" style={BTN_PRIMARY}>
          <Star size={14} />
          Upgrade Plan
        </Link>
      </div>
    </div>
  );
}
