"use client";

import { useMemo, useState } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import {
  ArrowUpRight, MousePointerClick, TrendingUp, Globe,
  Monitor, Smartphone, Tablet, Clock, Zap, Users, Download,
  Link2, BarChart2,
} from "lucide-react";
import PageHeader from "@/platform/components/PageHeader";
import Panel from "@/platform/components/Panel";
import { dashboardData } from "@/platform/lib/dashboardData";

const RANGES = ["7d", "30d", "90d"] as const;
type Range = (typeof RANGES)[number];
const RANGE_DAYS: Record<Range, number> = { "7d": 7, "30d": 30, "90d": 90 };

const TABS = [
  { id: "period",  label: "By Period",  Icon: BarChart2 },
  { id: "link",    label: "By Link",    Icon: Link2 },
  { id: "channel", label: "By Channel", Icon: Globe },
] as const;
type Tab = (typeof TABS)[number]["id"];

const GEO_COLORS    = ["var(--ocean-500)", "var(--ocean-400)", "var(--ocean-300)", "var(--ocean-200)", "#9AB7CE"];
const DEVICE_COLORS = ["var(--ocean-500)", "var(--ocean-300)", "var(--ocean-700)"];
const DEVICE_ICONS: Record<string, React.ReactNode> = {
  Desktop: <Monitor size={13} />,
  Mobile:  <Smartphone size={13} />,
  Tablet:  <Tablet size={13} />,
};

const HOURLY_DATA = [
  { h: "00", v: 28 },  { h: "01", v: 15 },  { h: "02", v: 8 },
  { h: "03", v: 6 },   { h: "04", v: 12 },  { h: "05", v: 22 },
  { h: "06", v: 65 },  { h: "07", v: 142 }, { h: "08", v: 238 },
  { h: "09", v: 389 }, { h: "10", v: 452 }, { h: "11", v: 487 },
  { h: "12", v: 412 }, { h: "13", v: 395 }, { h: "14", v: 468 },
  { h: "15", v: 511 }, { h: "16", v: 443 }, { h: "17", v: 356 },
  { h: "18", v: 298 }, { h: "19", v: 245 }, { h: "20", v: 189 },
  { h: "21", v: 134 }, { h: "22", v: 89 },  { h: "23", v: 52 },
];
const MAX_HOURLY = Math.max(...HOURLY_DATA.map((d) => d.v));

const FUNNEL = [
  { label: "Impressions",    value: 12450, pct: 100,  color: "var(--ocean-300)" },
  { label: "Link Clicks",    value: 4248,  pct: 34,   color: "var(--ocean-400)" },
  { label: "Engaged (>10s)", value: 1890,  pct: 15.2, color: "var(--ocean-500)" },
  { label: "Conversions",    value: 423,   pct: 3.4,  color: "var(--ocean-700)" },
];

const ENGAGEMENT_DATA = [
  { date: "Mon", score: 62, bounce: 38 },
  { date: "Tue", score: 68, bounce: 32 },
  { date: "Wed", score: 74, bounce: 26 },
  { date: "Thu", score: 71, bounce: 29 },
  { date: "Fri", score: 80, bounce: 20 },
  { date: "Sat", score: 75, bounce: 25 },
  { date: "Sun", score: 69, bounce: 31 },
];

const TOOLTIP_STYLE = { background: "#071B2C", border: "none", color: "#fff", fontSize: 13, fontFamily: "var(--font-body)", borderRadius: 0 };
const LEGEND_STYLE  = { fontSize: 12, paddingTop: 8, fontFamily: "var(--font-body)", color: "var(--text-muted)" };
const TICK_STYLE    = { fontSize: 12, fill: "var(--text-muted)", fontFamily: "var(--font-body)" };
const BTN_PRIMARY: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 7,
  background: "var(--ocean-500)", color: "#fff",
  padding: "0 18px", height: 38, fontWeight: 700, fontSize: 12,
  letterSpacing: "0.07em", textTransform: "uppercase",
  border: "none", cursor: "pointer", fontFamily: "var(--font-body)",
};

export default function AnalyticsPage() {
  const [range, setRange] = useState<Range>("7d");
  const [tab,   setTab]   = useState<Tab>("period");

  const devices = dashboardData.devices;
  const totalDeviceClicks = devices.reduce((s, d) => s + d.value, 0);
  const geos = dashboardData.geos;
  const refs = dashboardData.referrers;

  const timeline = useMemo(() => {
    return dashboardData.clicksTimeline.slice(-RANGE_DAYS[range]);
  }, [range]);

  const areaData = useMemo(() =>
    timeline.map((d, i) => ({ ...d, prev: Math.round(d.clicks * (0.65 + i * 0.04)) })),
    [timeline]
  );

  const exportCSV = () => {
    const rows: string[][] = [
      ["Date", "Clicks", "Prev Period"],
      ...areaData.map((d) => [d.date, String(d.clicks), String(d.prev)]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `analytics-${range}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <PageHeader
        title="Analytics"
        description="Deep insights into your link performance, audience, and engagement trends."
        breadcrumb="Platform"
        action={
          <div style={{ display: "flex", gap: 6 }}>
            {/* Range toggles */}
            <div style={{ display: "flex", gap: 0, border: "1px solid var(--border)" }}>
              {RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  style={{
                    height: 38, padding: "0 16px", fontSize: 12, fontWeight: 700,
                    background: range === r ? "var(--ocean-500)" : "var(--cloud)",
                    color: range === r ? "#fff" : "var(--text-muted)",
                    border: "none", borderRight: r !== "90d" ? "1px solid var(--border)" : "none",
                    cursor: "pointer", fontFamily: "var(--font-body)", letterSpacing: "0.06em", textTransform: "uppercase",
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
            {/* Export */}
            <button onClick={exportCSV} style={BTN_PRIMARY} title="Export to CSV">
              <Download size={14} />
              Export
            </button>
          </div>
        }
      />

      {/* Tab nav */}
      <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: "1px solid var(--border)" }}>
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 20px", fontSize: 13, fontWeight: 700,
              color: tab === id ? "var(--ocean-500)" : "var(--text-muted)",
              background: "none", border: "none",
              borderBottom: tab === id ? "2px solid var(--ocean-500)" : "2px solid transparent",
              cursor: "pointer", fontFamily: "var(--font-body)",
              marginBottom: -1, letterSpacing: "0.01em",
              textTransform: "uppercase",
            }}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* KPI cards — always visible */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Clicks",      value: dashboardData.totals.clicks.toLocaleString(), change: "+8%",   up: true,  icon: <MousePointerClick size={20} />, sub: "vs prev period" },
          { label: "Unique Visitors",   value: "2,180",                                       change: "+5%",   up: true,  icon: <Users size={20} />,             sub: "vs prev period" },
          { label: "Avg. CTR",          value: `${dashboardData.totals.avgCtr}%`,             change: "-2%",   up: false, icon: <TrendingUp size={20} />,        sub: "vs prev period" },
          { label: "Engagement Score",  value: "72",                                           change: "+6pts", up: true,  icon: <Zap size={20} />,               sub: "out of 100" },
        ].map((k) => (
          <div
            key={k.label}
            style={{ background: "var(--cloud)", border: "1px solid var(--border)", borderLeft: "3px solid var(--ocean-400)", padding: "20px 22px", boxShadow: "var(--shadow-xs)", position: "relative", overflow: "hidden" }}
          >
            <div style={{ position: "absolute", top: 18, right: 18, color: "var(--ocean-200)" }}>{k.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10 }}>{k.label}</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: "var(--ink)", fontFamily: "var(--font-display)", letterSpacing: "-0.03em", lineHeight: 1 }}>{k.value}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: k.up ? "#16a34a" : "var(--coral)" }}>{k.change}</span>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{k.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── BY PERIOD TAB ── */}
      {tab === "period" && (
        <>
          {/* Click trend */}
          <Panel
            title="Click Trend"
            subtitle="Daily clicks vs. previous period"
            action={
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
                  <div style={{ width: 10, height: 2, background: "var(--ocean-500)" }} /> This period
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
                  <div style={{ width: 10, height: 2, background: "#9AB7CE" }} /> Prev period
                </div>
              </div>
            }
          >
            <div style={{ width: "100%", height: 270 }}>
              <ResponsiveContainer>
                <AreaChart data={areaData} margin={{ top: 6, right: 4, bottom: 0, left: -10 }}>
                  <defs>
                    <linearGradient id="clickGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#2772A0" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2772A0" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="prevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#9AB7CE" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#9AB7CE" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--sky-200)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={TICK_STYLE} tickFormatter={(v) => v.slice(5)} axisLine={false} tickLine={false} />
                  <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "rgba(255,255,255,0.6)" }} />
                  <Area type="monotone" dataKey="prev"   stroke="#9AB7CE"         strokeWidth={1.5} strokeDasharray="4 3" fill="url(#prevGrad)"  dot={false}                                                   name="Prev period" />
                  <Area type="monotone" dataKey="clicks" stroke="var(--ocean-500)" strokeWidth={2.5}                      fill="url(#clickGrad)" dot={{ fill: "var(--ocean-500)", r: 3.5, strokeWidth: 0 }} activeDot={{ r: 5 }} name="Clicks" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          {/* Hourly activity */}
          <Panel
            title="Hourly Activity"
            subtitle="Average clicks per hour of day — peak hours highlighted"
            action={
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
                <Clock size={13} />
                Peak: 15:00 — 511 clicks
              </div>
            }
          >
            <div style={{ overflowX: "auto" }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 130, minWidth: 600, paddingBottom: 28, position: "relative" }}>
                {HOURLY_DATA.map((d) => {
                  const h = (d.v / MAX_HOURLY) * 100;
                  const isPeak = d.v >= MAX_HOURLY * 0.8;
                  return (
                    <div key={d.h} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }} title={`${d.h}:00 — ${d.v} clicks`}>
                      <div style={{ width: "100%", height: `${h}%`, background: isPeak ? "var(--ocean-500)" : "var(--ocean-200)", minHeight: 2, transition: "height 0.3s ease" }} />
                      <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{d.h}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 20, marginTop: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
                  <div style={{ width: 10, height: 10, background: "var(--ocean-500)" }} /> Peak hours (≥ 80%)
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
                  <div style={{ width: 10, height: 10, background: "var(--ocean-200)" }} /> Normal hours
                </div>
              </div>
            </div>
          </Panel>

          {/* Funnel + Engagement */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12, marginBottom: 12 }}>
            <Panel title="Conversion Funnel" subtitle="From impressions to conversions">
              <div style={{ display: "grid", gap: 12 }}>
                {FUNNEL.map((step, i) => (
                  <div key={step.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 24, height: 24, background: step.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                          {i + 1}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>{step.label}</span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>{step.value.toLocaleString()}</span>
                        <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 6 }}>{step.pct}%</span>
                      </div>
                    </div>
                    <div style={{ height: 9, background: "var(--sky-200)" }}>
                      <div style={{ width: `${step.pct}%`, height: "100%", background: step.color }} />
                    </div>
                    {i < FUNNEL.length - 1 && (
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 5, paddingLeft: 34 }}>
                        ↓ {Math.round((FUNNEL[i + 1].value / step.value) * 100)}% continued
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Engagement vs. Bounce Rate" subtitle="Daily scores (%)">
              <div style={{ width: "100%", height: 250 }}>
                <ResponsiveContainer>
                  <BarChart data={ENGAGEMENT_DATA} margin={{ top: 4, right: 4, bottom: 0, left: -10 }} barGap={3}>
                    <CartesianGrid stroke="var(--sky-200)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={TICK_STYLE} axisLine={false} tickLine={false} />
                    <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend wrapperStyle={LEGEND_STYLE} />
                    <Bar dataKey="score"  name="Engagement %" fill="var(--ocean-500)" barSize={18} />
                    <Bar dataKey="bounce" name="Bounce %"      fill="var(--ocean-200)" barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>
        </>
      )}

      {/* ── BY LINK TAB ── */}
      {tab === "link" && (
        <>
          <Panel title="Link Performance" subtitle="Clicks, CTR, and top referrer per link" noPad>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--sky-100)", borderBottom: "1px solid var(--border)" }}>
                    {["Short URL", "Destination", "Clicks", "CTR", "Top Referrer", "Top Country"].map((h) => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: h === "Clicks" || h === "CTR" ? "right" : "left", fontWeight: 700, fontSize: 12, color: "var(--text-muted)", letterSpacing: "0.07em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...dashboardData.links].sort((a, b) => b.stats.clicks - a.stats.clicks).map((link) => {
                    const topRef = Object.entries(link.stats.referrers).sort((a, b) => b[1] - a[1])[0];
                    const topGeo = Object.entries(link.stats.geo).sort((a, b) => b[1] - a[1])[0];
                    return (
                      <tr
                        key={link.id}
                        style={{ borderBottom: "1px solid var(--border)", transition: "background 0.12s" }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--sky-50)")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                      >
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ fontWeight: 700, color: "var(--ocean-600)", fontFamily: "var(--font-mono)", fontSize: 13 }}>{link.shortUrl}</span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ fontSize: 13, color: "var(--text-muted)", display: "block", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{link.destination}</span>
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>
                          {link.stats.clicks.toLocaleString()}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          <span style={{ background: "var(--ocean-50)", color: "var(--ocean-700)", fontWeight: 700, fontSize: 12, padding: "3px 8px", border: "1px solid var(--ocean-100)" }}>
                            {link.stats.ctr}%
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--text-secondary)" }}>{topRef?.[0] ?? "—"}</td>
                        <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--text-secondary)" }}>{topGeo?.[0] ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title="Clicks & CTR Per Link" subtitle="Visual comparison across all links" noPad>
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={dashboardData.links.map((l) => ({ name: l.slug, clicks: l.stats.clicks, ctr: l.stats.ctr }))} margin={{ top: 12, right: 24, bottom: 0, left: -10 }} barGap={4}>
                  <CartesianGrid stroke="var(--sky-200)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ ...TICK_STYLE, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left"  tick={TICK_STYLE} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={TICK_STYLE} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={LEGEND_STYLE} />
                  <Bar yAxisId="left"  dataKey="clicks" fill="var(--ocean-500)" barSize={20} name="Clicks" />
                  <Bar yAxisId="right" dataKey="ctr"    fill="var(--ocean-200)" barSize={20} name="CTR (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </>
      )}

      {/* ── BY CHANNEL TAB ── */}
      {tab === "channel" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <Panel title="Top Referrers" subtitle="Traffic sources by click volume">
              <div style={{ width: "100%", height: 250 }}>
                <ResponsiveContainer>
                  <BarChart data={refs.slice(0, 6)} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 60 }}>
                    <XAxis type="number" tick={TICK_STYLE} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ ...TICK_STYLE, fontSize: 13 }} axisLine={false} tickLine={false} width={60} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar dataKey="value" name="Clicks" barSize={14}>
                      {refs.slice(0, 6).map((_, i) => (
                        <Cell key={i} fill={i === 0 ? "var(--ocean-500)" : i === 1 ? "var(--ocean-400)" : "var(--ocean-300)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title="Device Breakdown" subtitle="Click distribution by device type">
              <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                <div style={{ width: 160, height: 160, flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={devices} cx="50%" cy="50%" innerRadius={48} outerRadius={74} paddingAngle={2} dataKey="value" startAngle={90} endAngle={-270}>
                        {devices.map((_, i) => <Cell key={i} fill={DEVICE_COLORS[i % DEVICE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ flex: 1, display: "grid", gap: 14 }}>
                  {devices.map((d, i) => (
                    <div key={d.name}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "var(--text-secondary)" }}>
                          <div style={{ width: 8, height: 8, background: DEVICE_COLORS[i % DEVICE_COLORS.length] }} />
                          {DEVICE_ICONS[d.name]}
                          {d.name}
                        </span>
                        <span style={{ fontWeight: 800, fontSize: 14, color: "var(--ink)" }}>
                          {Math.round((d.value / totalDeviceClicks) * 100)}%
                        </span>
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

          <Panel title="Geographic Distribution" subtitle="Top 10 countries by click volume">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
              {geos.slice(0, 10).map((geo, i) => {
                const pct = Math.round((geo.value / geos[0].value) * 100);
                return (
                  <div key={geo.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6, alignItems: "center" }}>
                      <span style={{ fontWeight: 700, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
                        <Globe size={12} style={{ color: GEO_COLORS[Math.min(i, GEO_COLORS.length - 1)] }} />
                        {geo.name}
                      </span>
                      <span style={{ fontWeight: 800, color: "var(--ink)" }}>{geo.value.toLocaleString()}</span>
                    </div>
                    <div style={{ height: 6, background: "var(--sky-200)" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: GEO_COLORS[Math.min(i, GEO_COLORS.length - 1)] }} />
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{pct}% of top</div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}
