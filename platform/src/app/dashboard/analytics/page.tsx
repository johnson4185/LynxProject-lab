"use client";

import { useMemo, useState, useEffect } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import {
  MousePointerClick, TrendingUp, Globe,
  Monitor, Smartphone, Tablet, Clock, Zap, Users, Download,
  Link2, BarChart2, Mail, ChevronDown,
  Activity, TrendingDown, ArrowUpRight, Award, AlertCircle,
} from "lucide-react";
import PageHeader from "@/platform/components/PageHeader";
import Panel from "@/platform/components/Panel";
import Modal from "@/platform/components/Modal";
import { api } from "@/platform/lib/api";
import {
  TOOLTIP_STYLE, TICK_STYLE, LEGEND_STYLE, DEVICE_COLORS, GEO_COLORS,
} from "@/platform/constants/chart";

interface TimeSeriesPointDto {
  timestamp: string;
  count: number;
}

const STATIC_DEVICES = [
  { name: "Desktop", value: 60 },
  { name: "Mobile",  value: 32 },
  { name: "Tablet",  value: 8  },
];
const STATIC_GEOS = [
  { name: "US", value: 420 }, { name: "GB", value: 185 },
  { name: "DE", value: 97  }, { name: "CA", value: 74  },
  { name: "AU", value: 48  }, { name: "FR", value: 36  },
  { name: "IN", value: 28  },
];

/* ─── Constants ─────────────────────────────────────────────────────────── */
const RANGES = ["7d", "30d", "90d"] as const;
type Range = (typeof RANGES)[number];
const RANGE_DAYS: Record<Range, number> = { "7d": 7, "30d": 30, "90d": 90 };

const TABS = [
  { id: "period",  label: "Overview",  Icon: BarChart2 },
  { id: "link",    label: "By Link",   Icon: Link2 },
  { id: "channel", label: "Audience",  Icon: Globe },
  { id: "utm",     label: "Campaigns", Icon: Activity },
] as const;
type Tab = (typeof TABS)[number]["id"];

const DEVICE_ICONS: Record<string, React.ReactNode> = {
  Desktop: <Monitor size={13} />,
  Mobile:  <Smartphone size={13} />,
  Tablet:  <Tablet size={13} />,
};

/* ─── Mock data ─────────────────────────────────────────────────────────── */
const HOURLY_DATA = [
  { h: "00", v: 28 }, { h: "01", v: 15 }, { h: "02", v: 8 },
  { h: "03", v: 6 },  { h: "04", v: 12 }, { h: "05", v: 22 },
  { h: "06", v: 65 }, { h: "07", v: 142 },{ h: "08", v: 238 },
  { h: "09", v: 389 },{ h: "10", v: 452 },{ h: "11", v: 487 },
  { h: "12", v: 412 },{ h: "13", v: 395 },{ h: "14", v: 468 },
  { h: "15", v: 511 },{ h: "16", v: 443 },{ h: "17", v: 356 },
  { h: "18", v: 298 },{ h: "19", v: 245 },{ h: "20", v: 189 },
  { h: "21", v: 134 },{ h: "22", v: 89 }, { h: "23", v: 52 },
];
const MAX_HOURLY = Math.max(...HOURLY_DATA.map((d) => d.v));

const DOW_LABELS  = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SLOT_LABELS = ["12a", "4a", "8a", "12p", "4p", "8p"];
const DOW_HEATMAP: number[][] = [
  [12, 8,  180, 420, 310, 95],
  [18, 10, 220, 510, 380, 140],
  [22, 12, 260, 490, 400, 120],
  [15, 9,  200, 430, 350, 110],
  [20, 11, 240, 480, 395, 180],
  [9,  6,  80,  240, 280, 220],
  [7,  4,  60,  190, 250, 195],
];
const DOW_MAX = Math.max(...DOW_HEATMAP.flat());

const FUNNEL = [
  { label: "Impressions",    value: 12450, pct: 100,  color: "var(--ocean-300)" },
  { label: "Link Clicks",    value: 4248,  pct: 34.1, color: "var(--ocean-400)" },
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

const BROWSERS = [
  { name: "Chrome",           value: 1840, pct: 52, color: "var(--ocean-500)" },
  { name: "Safari",           value: 710,  pct: 20, color: "var(--ocean-400)" },
  { name: "Firefox",          value: 425,  pct: 12, color: "var(--ocean-300)" },
  { name: "Edge",             value: 284,  pct: 8,  color: "#5A9DC8" },
  { name: "Samsung Internet", value: 142,  pct: 4,  color: "#9AB7CE" },
  { name: "Other",            value: 141,  pct: 4,  color: "#C3D9E8" },
];

const OS_DATA = [
  { name: "Windows", value: 1240, pct: 35, color: "var(--ocean-500)" },
  { name: "macOS",   value: 850,  pct: 24, color: "var(--ocean-400)" },
  { name: "Android", value: 780,  pct: 22, color: "var(--ocean-300)" },
  { name: "iOS",     value: 530,  pct: 15, color: "#5A9DC8" },
  { name: "Linux",   value: 106,  pct: 3,  color: "#9AB7CE" },
  { name: "Other",   value: 36,   pct: 1,  color: "#C3D9E8" },
];

const REFERRERS_TABLE = [
  { domain: "twitter.com",     clicks: 980,  pct: 27.5, bounce: 42, avgTime: "1:24" },
  { domain: "linkedin.com",    clicks: 640,  pct: 18.0, bounce: 31, avgTime: "2:10" },
  { domain: "direct / none",   clicks: 530,  pct: 14.9, bounce: 28, avgTime: "2:45" },
  { domain: "google.com",      clicks: 450,  pct: 12.6, bounce: 56, avgTime: "0:48" },
  { domain: "producthunt.com", clicks: 390,  pct: 11.0, bounce: 22, avgTime: "3:12" },
  { domain: "github.com",      clicks: 210,  pct: 5.9,  bounce: 18, avgTime: "3:56" },
  { domain: "reddit.com",      clicks: 185,  pct: 5.2,  bounce: 61, avgTime: "0:38" },
  { domain: "ycombinator.com", clicks: 75,   pct: 2.1,  bounce: 15, avgTime: "4:22" },
  { domain: "other",           clicks: 102,  pct: 2.8,  bounce: 49, avgTime: "1:05" },
];

/* Campaign clicks over time — last 14 days, top 4 campaigns */
const CAMPAIGN_TIMELINE = [
  { date: "Feb 11", spring: 142, ph:  92, twitter:  68, linkedin:  42 },
  { date: "Feb 12", spring: 188, ph: 118, twitter:  82, linkedin:  55 },
  { date: "Feb 13", spring: 164, ph: 105, twitter:  74, linkedin:  48 },
  { date: "Feb 14", spring: 220, ph: 145, twitter:  95, linkedin:  62 },
  { date: "Feb 15", spring: 196, ph: 132, twitter:  89, linkedin:  58 },
  { date: "Feb 16", spring: 108, ph:  72, twitter:  48, linkedin:  32 },
  { date: "Feb 17", spring: 124, ph:  85, twitter:  56, linkedin:  38 },
  { date: "Feb 18", spring: 245, ph: 158, twitter: 112, linkedin:  72 },
  { date: "Feb 19", spring: 218, ph: 142, twitter:  98, linkedin:  65 },
  { date: "Feb 20", spring: 192, ph: 128, twitter:  88, linkedin:  60 },
  { date: "Feb 21", spring: 265, ph: 172, twitter: 124, linkedin:  78 },
  { date: "Feb 22", spring: 238, ph: 155, twitter: 108, linkedin:  70 },
  { date: "Feb 23", spring: 284, ph: 188, twitter: 138, linkedin:  85 },
  { date: "Feb 24", spring: 312, ph: 205, twitter: 156, linkedin:  92 },
];

const UTM_CAMPAIGNS = [
  { name: "spring-launch-2026",  source: "email",    medium: "newsletter", clicks: 1840, ctr: 6.2,  conversions: 186, revenue: "$3,720" },
  { name: "product-hunt",        source: "ph",       medium: "referral",   clicks: 1240, ctr: 9.8,  conversions: 98,  revenue: "$1,960" },
  { name: "twitter-promo",       source: "twitter",  medium: "social",     clicks: 920,  ctr: 3.4,  conversions: 45,  revenue: "$900"   },
  { name: "linkedin-b2b",        source: "linkedin", medium: "social",     clicks: 640,  ctr: 4.7,  conversions: 62,  revenue: "$2,480" },
  { name: "google-ads-q1",       source: "google",   medium: "cpc",        clicks: 580,  ctr: 2.8,  conversions: 38,  revenue: "$1,900" },
  { name: "retargeting-warmup",  source: "google",   medium: "display",    clicks: 310,  ctr: 1.2,  conversions: 14,  revenue: "$560"   },
  { name: "partner-collab",      source: "partner",  medium: "referral",   clicks: 180,  ctr: 7.1,  conversions: 22,  revenue: "$880"   },
];

/* ─── Component ─────────────────────────────────────────────────────────── */
export default function AnalyticsPage() {
  const [range, setRange]                   = useState<Range>("30d");
  const [tab, setTab]                       = useState<Tab>("period");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [utmSort, setUtmSort]               = useState<keyof typeof UTM_CAMPAIGNS[0]>("clicks");

  const [rawTimeseries, setRawTimeseries] = useState<Array<{ date: string; clicks: number }>>([]);
  const [trafficSummary, setTrafficSummary] = useState<{ totalRequests: number; uniqueIps: number } | null>(null);
  const [analyticsLinks, setAnalyticsLinks] = useState<Array<{ id: string; shortUrl: string; destination: string; slug: string; qrCodeUrl?: string; stats: { clicks: number; ctr: number; referrers: Record<string, number>; geo: Record<string, number> } }>>([]);

  useEffect(() => {
    const lastHours = RANGE_DAYS[range] * 24;
    api
      .get<TimeSeriesPointDto[]>(
        `/api/v1/analytics/traffic/timeseries?lastHours=${lastHours}&interval=day`
      )
      .then((res) => {
        const mapped = res.map((pt) => ({
          date: (() => { const d = new Date(pt.timestamp); return isNaN(d.getTime()) ? String(pt.timestamp) : d.toISOString().slice(0, 10); })(),
          clicks: pt.count,
        }));
        setRawTimeseries(mapped);
      })
      .catch(console.error);

    api
      .get<{ totalRequests: number; uniqueIps: number }>(`/api/v1/analytics/traffic/summary?lastHours=${lastHours}`)
      .then((res) => setTrafficSummary(res))
      .catch(console.error);
  }, [range]);

  // Load links once for the By Link tab
  useEffect(() => {
    api
      .get<{ total: number; items: Array<{ shortCode: string; clickCount: number; status: string }> }>(
        "/api/admin/v1/links?pageSize=200"
      )
      .then((res) => {
        const mapped = res.items
          .sort((a, b) => b.clickCount - a.clickCount)
          .map((item) => ({
            id: item.shortCode,
            shortUrl: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5055"}/r/${item.shortCode}`,
            destination: "—",
            slug: item.shortCode,
            qrCodeUrl: undefined,
            stats: { clicks: item.clickCount, ctr: 0, referrers: {}, geo: {} },
          }));
        setAnalyticsLinks(mapped);
      })
      .catch(console.error);
  }, []);

  const devices           = STATIC_DEVICES;
  const totalDeviceClicks = devices.reduce((s, d) => s + d.value, 0);
  const geos              = STATIC_GEOS;

  const timeline = useMemo(() => rawTimeseries.slice(-RANGE_DAYS[range]), [rawTimeseries, range]);

  const areaData = useMemo(
    () => timeline.map((d, i) => ({ ...d, prev: Math.round(d.clicks * (0.65 + i * 0.04)) })),
    [timeline],
  );

  const sortedUtm = useMemo(
    () => [...UTM_CAMPAIGNS].sort((a, b) => {
      const av = typeof a[utmSort] === "string" ? parseFloat((a[utmSort] as string).replace(/[^0-9.]/g, "")) : (a[utmSort] as number);
      const bv = typeof b[utmSort] === "string" ? parseFloat((b[utmSort] as string).replace(/[^0-9.]/g, "")) : (b[utmSort] as number);
      return bv - av;
    }),
    [utmSort],
  );

  const exportCSV = () => {
    const rows = [
      ["Date", "Clicks", "Prev Period"],
      ...areaData.map((d) => [d.date, String(d.clicks), String(d.prev)]),
    ];
    const csv  = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `analytics-${range}.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <PageHeader
        title="Analytics"
        description="Full-suite analytics — traffic, audience, channels, and campaign performance."
        breadcrumb="Platform"
        action={
          <div style={{ display: "flex", gap: 6 }}>
            {/* Range picker */}
            <div style={{ display: "flex", border: "1px solid var(--border)" }}>
              {RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  style={{
                    height: 38, padding: "0 16px", fontSize: 12, fontWeight: 700,
                    background: range === r ? "var(--ocean-500)" : "var(--cloud)",
                    color: range === r ? "#fff" : "var(--text-muted)",
                    border: "none", borderRight: r !== "90d" ? "1px solid var(--border)" : "none",
                    cursor: "pointer", fontFamily: "var(--font-body)",
                    letterSpacing: "0.06em", textTransform: "uppercase",
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowScheduleModal(true)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                height: 38, padding: "0 14px",
                background: "var(--cloud)", border: "1px solid var(--border)",
                color: "var(--text-secondary)", fontSize: 12, fontWeight: 700,
                cursor: "pointer", fontFamily: "var(--font-body)",
              }}
            >
              <Mail size={13} /> Schedule Report
            </button>
            <button
              onClick={exportCSV}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                background: "var(--ocean-500)", color: "#fff",
                padding: "0 18px", height: 38, fontWeight: 700, fontSize: 12,
                letterSpacing: "0.07em", textTransform: "uppercase",
                border: "none", cursor: "pointer", fontFamily: "var(--font-body)",
              }}
            >
              <Download size={14} /> Export CSV
            </button>
          </div>
        }
      />

      {/* Tab nav */}
      <div style={{ display: "flex", marginBottom: 20, borderBottom: "1px solid var(--border)" }}>
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
              marginBottom: -1, letterSpacing: "0.01em", textTransform: "uppercase",
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* KPI cards — always visible */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Total Clicks",      value: trafficSummary?.totalRequests?.toLocaleString() ?? "—", change: "+8.4%",  up: true,  icon: <MousePointerClick size={18} />, sub: "vs prev period" },
          { label: "Unique Visitors",   value: trafficSummary?.uniqueIps?.toLocaleString() ?? "—",   change: "+5.2%",  up: true,  icon: <Users size={18} />,             sub: "vs prev period" },
          { label: "Avg. CTR",          value: "—",                                                                 change: "-2.1%",  up: false, icon: <TrendingUp size={18} />,        sub: "vs prev period" },
          { label: "Engagement Score",  value: "72 / 100",                                    change: "+6pts",  up: true,  icon: <Zap size={18} />,               sub: "out of 100" },
          { label: "Avg. Session Time", value: "1m 58s",                                      change: "+14s",   up: true,  icon: <Clock size={18} />,             sub: "vs prev period" },
        ].map((k) => (
          <div
            key={k.label}
            style={{
              background: "var(--cloud)", border: "1px solid var(--border)",
              borderTop: "3px solid var(--ocean-400)",
              padding: "16px 18px", boxShadow: "var(--shadow-xs)", position: "relative", overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", top: 14, right: 14, color: "var(--ocean-200)" }}>{k.icon}</div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--ink)", fontFamily: "var(--font-display)", letterSpacing: "-0.02em", lineHeight: 1 }}>{k.value}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: k.up ? "#16a34a" : "var(--coral)" }}>{k.change}</span>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{k.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ═══════════════════ OVERVIEW TAB ═══════════════════════════════════ */}
      {tab === "period" && (
        <>
          <Panel
            title="Click Trend"
            subtitle="Daily clicks vs. previous period"
            action={
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
                  <div style={{ width: 10, height: 2, background: "var(--ocean-500)" }} /> This period
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
                  <div style={{ width: 10, height: 2, background: "#9AB7CE", borderTop: "2px dashed" }} /> Prev period
                </div>
              </div>
            }
          >
            <div style={{ width: "100%", height: 270 }}>
              <ResponsiveContainer>
                <AreaChart data={areaData} margin={{ top: 6, right: 4, bottom: 0, left: -10 }}>
                  <defs>
                    <linearGradient id="clickGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#2772A0" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#2772A0" stopOpacity={0}    />
                    </linearGradient>
                    <linearGradient id="prevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#9AB7CE" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#9AB7CE" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--sky-200)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={TICK_STYLE} tickFormatter={(v) => v.slice(5)} axisLine={false} tickLine={false} />
                  <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "rgba(255,255,255,0.6)" }} />
                  <Area type="monotone" dataKey="prev"   stroke="#9AB7CE"         strokeWidth={1.5} strokeDasharray="4 3" fill="url(#prevGrad)"  dot={false} name="Prev period" />
                  <Area type="monotone" dataKey="clicks" stroke="var(--ocean-500)" strokeWidth={2.5}                     fill="url(#clickGrad)" dot={{ fill: "var(--ocean-500)", r: 3.5, strokeWidth: 0 }} activeDot={{ r: 5 }} name="Clicks" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <Panel
              title="Hourly Activity"
              subtitle="Avg. clicks per hour of day"
              action={<div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}><Clock size={13} /> Peak: 15:00 — 511 clicks</div>}
            >
              <div style={{ overflowX: "auto" }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 120, minWidth: 460, paddingBottom: 24 }}>
                  {HOURLY_DATA.map((d) => {
                    const h = (d.v / MAX_HOURLY) * 100;
                    const isPeak = d.v >= MAX_HOURLY * 0.8;
                    return (
                      <div key={d.h} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }} title={`${d.h}:00 — ${d.v} clicks`}>
                        <div style={{ width: "100%", height: `${h}%`, background: isPeak ? "var(--ocean-500)" : "var(--ocean-200)", minHeight: 2 }} />
                        <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{d.h}</div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
                    <div style={{ width: 10, height: 10, background: "var(--ocean-500)" }} /> Peak (≥80%)
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
                    <div style={{ width: 10, height: 10, background: "var(--ocean-200)" }} /> Normal
                  </div>
                </div>
              </div>
            </Panel>

            <Panel title="Day-of-Week Heatmap" subtitle="Click intensity by day and time slot">
              <div style={{ overflowX: "auto" }}>
                <div style={{ display: "grid", gridTemplateColumns: "48px repeat(6, 1fr)", gap: 3, marginBottom: 4 }}>
                  <div />
                  {SLOT_LABELS.map((s) => (
                    <div key={s} style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "center", fontFamily: "var(--font-mono)", fontWeight: 700 }}>{s}</div>
                  ))}
                </div>
                {DOW_LABELS.map((day, di) => (
                  <div key={day} style={{ display: "grid", gridTemplateColumns: "48px repeat(6, 1fr)", gap: 3, marginBottom: 3 }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, display: "flex", alignItems: "center" }}>{day}</div>
                    {DOW_HEATMAP[di].map((val, si) => {
                      const intensity = val / DOW_MAX;
                      const bg = intensity > 0.7 ? "var(--ocean-600)"
                               : intensity > 0.5 ? "var(--ocean-500)"
                               : intensity > 0.3 ? "var(--ocean-400)"
                               : intensity > 0.15 ? "var(--ocean-300)"
                               : intensity > 0.05 ? "var(--ocean-200)"
                               : "var(--sky-200)";
                      return (
                        <div key={si} title={`${day} ${SLOT_LABELS[si]} — ${val} clicks`} style={{ height: 28, background: bg, cursor: "default" }} />
                      );
                    })}
                  </div>
                ))}
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8 }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Less</span>
                  {["var(--sky-200)", "var(--ocean-200)", "var(--ocean-300)", "var(--ocean-400)", "var(--ocean-500)", "var(--ocean-600)"].map((c) => (
                    <div key={c} style={{ width: 14, height: 14, background: c }} />
                  ))}
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>More</span>
                </div>
              </div>
            </Panel>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12, marginBottom: 12 }}>
            <Panel title="Conversion Funnel" subtitle="From impressions to conversions">
              <div style={{ display: "grid", gap: 14 }}>
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

          {/* Performance Insights ────────────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 12 }}>
            {[
              {
                icon: <Award size={16} color="var(--ocean-500)" />,
                label: "Top Link",
                value: "acme.ly/pricing",
                sub: "2,840 clicks · +24% vs prev",
                accent: "var(--ocean-500)",
                mono: true,
              },
              {
                icon: <TrendingUp size={16} color="#16a34a" />,
                label: "Fastest Mover",
                value: "+38%",
                sub: "acme.ly/launch · 1,240 clicks",
                accent: "#16a34a",
                mono: false,
              },
              {
                icon: <TrendingDown size={16} color="var(--coral)" />,
                label: "Needs Attention",
                value: "acme.ly/blog",
                sub: "CTR 1.2% · below 3.4% avg",
                accent: "var(--coral)",
                mono: true,
              },
              {
                icon: <AlertCircle size={16} color="#92400E" />,
                label: "Highest Bounce",
                value: "reddit.com",
                sub: "61% bounce · consider A/B test",
                accent: "#92400E",
                mono: false,
              },
            ].map((ins) => (
              <div
                key={ins.label}
                style={{
                  background: "var(--cloud)", border: "1px solid var(--border)",
                  borderLeft: `3px solid ${ins.accent}`,
                  padding: "14px 16px", boxShadow: "var(--shadow-xs)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                  {ins.icon}
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>{ins.label}</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)", fontFamily: ins.mono ? "var(--font-mono)" : "var(--font-body)", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {ins.value}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4 }}>{ins.sub}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ═══════════════════ BY LINK TAB ════════════════════════════════════ */}
      {tab === "link" && (
        <>
          {/* Link health summary */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
            {[
              { label: "Above average CTR",  count: 5, sub: "CTR > 3.4% baseline", color: "#16a34a", bg: "#F0FDF4", border: "#BBF7D0", icon: <ArrowUpRight size={14} /> },
              { label: "At average CTR",     count: 3, sub: "Within ±0.5% of avg", color: "var(--ocean-500)", bg: "var(--ocean-50)", border: "var(--ocean-100)", icon: <TrendingUp size={14} /> },
              { label: "Below average CTR",  count: 2, sub: "Needs review or A/B", color: "var(--coral)", bg: "#FFF5F5", border: "#FECACA", icon: <TrendingDown size={14} /> },
            ].map((s) => (
              <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 36, height: 36, background: s.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#fff" }}>
                  {s.icon}
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: s.color, letterSpacing: "-0.02em", lineHeight: 1 }}>{s.count}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", marginTop: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.sub}</div>
                </div>
              </div>
            ))}
          </div>

          <Panel title="Link Performance" subtitle="Clicks, CTR, referrer and geo per link" noPad>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--sky-100)", borderBottom: "1px solid var(--border)" }}>
                    {["Short URL", "Destination", "Clicks", "CTR", "Top Referrer", "Top Country", "QR"].map((h) => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: h === "Clicks" || h === "CTR" ? "right" : "left", fontWeight: 700, fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.07em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {analyticsLinks.map((link) => {
                    const topRef = Object.entries(link.stats.referrers).sort((a, b) => b[1] - a[1])[0];
                    const topGeo = Object.entries(link.stats.geo).sort((a, b) => b[1] - a[1])[0];
                    return (
                      <tr
                        key={link.id}
                        style={{ borderBottom: "1px solid var(--border)" }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--sky-50)")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                      >
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ fontWeight: 700, color: "var(--ocean-600)", fontFamily: "var(--font-mono)", fontSize: 13 }}>{link.shortUrl}</span>
                        </td>
                        <td style={{ padding: "12px 16px", maxWidth: 180 }}>
                          <span style={{ fontSize: 13, color: "var(--text-muted)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{link.destination}</span>
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
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: link.qrCodeUrl ? "var(--sage)" : "var(--text-muted)" }}>
                            {link.qrCodeUrl ? "✓" : "—"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title="Clicks Per Link" subtitle="Visual comparison" noPad>
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={analyticsLinks.map((l) => ({ name: l.slug, clicks: l.stats.clicks, ctr: l.stats.ctr }))} margin={{ top: 12, right: 24, bottom: 0, left: -10 }} barGap={4}>
                  <CartesianGrid stroke="var(--sky-200)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ ...TICK_STYLE, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left"  tick={TICK_STYLE} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={TICK_STYLE} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={LEGEND_STYLE} />
                  <Bar yAxisId="left"  dataKey="clicks" fill="var(--ocean-500)" barSize={22} name="Clicks" />
                  <Bar yAxisId="right" dataKey="ctr"    fill="var(--ocean-200)" barSize={22} name="CTR (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </>
      )}

      {/* ═══════════════════ AUDIENCE TAB ═══════════════════════════════════ */}
      {tab === "channel" && (
        <>
          <Panel title="Traffic Sources" subtitle="Referrer domains with bounce rate and session time" noPad>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--sky-100)", borderBottom: "1px solid var(--border)" }}>
                    {["Source", "Clicks", "% Traffic", "Bounce Rate", "Avg. Time on Page"].map((h) => (
                      <th key={h} style={{ padding: "11px 18px", textAlign: h === "Clicks" || h === "% Traffic" || h === "Bounce Rate" ? "right" : "left", fontWeight: 700, fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.07em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {REFERRERS_TABLE.map((r, i) => (
                    <tr
                      key={r.domain}
                      style={{ borderBottom: "1px solid var(--border)" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--sky-50)")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                    >
                      <td style={{ padding: "12px 18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 6, height: 6, background: GEO_COLORS[Math.min(i, GEO_COLORS.length - 1)], flexShrink: 0 }} />
                          <span style={{ fontWeight: 600, color: "var(--text-secondary)", fontSize: 13 }}>{r.domain}</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 18px", textAlign: "right", fontWeight: 700, color: "var(--ink)", fontSize: 14 }}>{r.clicks.toLocaleString()}</td>
                      <td style={{ padding: "12px 18px", textAlign: "right", fontSize: 13, color: "var(--text-secondary)" }}>{r.pct}%</td>
                      <td style={{ padding: "12px 18px", textAlign: "right" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: r.bounce > 50 ? "var(--coral)" : r.bounce > 35 ? "#92400E" : "var(--sage)" }}>
                          {r.bounce}%
                        </span>
                      </td>
                      <td style={{ padding: "12px 18px", fontSize: 13, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{r.avgTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <Panel title="Device Breakdown" subtitle="Click distribution by device type">
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
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
                <div style={{ flex: 1, display: "grid", gap: 12 }}>
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

            <Panel title="Browser Breakdown" subtitle="Clicks by browser">
              <div style={{ display: "grid", gap: 10 }}>
                {BROWSERS.map((b) => (
                  <div key={b.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                      <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600, display: "flex", alignItems: "center", gap: 7 }}>
                        <div style={{ width: 8, height: 8, background: b.color }} />
                        {b.name}
                      </span>
                      <div style={{ display: "flex", gap: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{b.value.toLocaleString()}</span>
                        <span style={{ fontSize: 12, color: "var(--text-muted)", width: 32, textAlign: "right" }}>{b.pct}%</span>
                      </div>
                    </div>
                    <div style={{ height: 5, background: "var(--sky-200)" }}>
                      <div style={{ width: `${b.pct}%`, height: "100%", background: b.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 12, marginTop: 12 }}>
            <Panel title="Operating System" subtitle="Clicks by OS">
              <div style={{ display: "grid", gap: 10 }}>
                {OS_DATA.map((o) => (
                  <div key={o.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                      <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600, display: "flex", alignItems: "center", gap: 7 }}>
                        <div style={{ width: 8, height: 8, background: o.color }} />
                        {o.name}
                      </span>
                      <div style={{ display: "flex", gap: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{o.value.toLocaleString()}</span>
                        <span style={{ fontSize: 12, color: "var(--text-muted)", width: 32, textAlign: "right" }}>{o.pct}%</span>
                      </div>
                    </div>
                    <div style={{ height: 5, background: "var(--sky-200)" }}>
                      <div style={{ width: `${o.pct}%`, height: "100%", background: o.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Geographic Distribution" subtitle="Top countries by click volume">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                {geos.slice(0, 10).map((geo, i) => {
                  const pct = Math.round((geo.value / geos[0].value) * 100);
                  return (
                    <div key={geo.name}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5, alignItems: "center" }}>
                        <span style={{ fontWeight: 600, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 6, height: 6, background: GEO_COLORS[Math.min(i, GEO_COLORS.length - 1)] }} />
                          {geo.name}
                        </span>
                        <span style={{ fontWeight: 800, color: "var(--ink)" }}>{geo.value.toLocaleString()}</span>
                      </div>
                      <div style={{ height: 5, background: "var(--sky-200)" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: GEO_COLORS[Math.min(i, GEO_COLORS.length - 1)] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          </div>
        </>
      )}

      {/* ═══════════════════ CAMPAIGNS / UTM TAB ════════════════════════════ */}
      {tab === "utm" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
            {[
              { label: "Active Campaigns",     value: "7",       change: "+2",     up: true  },
              { label: "Total Campaign Clicks", value: "5,710",   change: "+18.3%", up: true  },
              { label: "Campaign Conversions",  value: "465",     change: "+12%",   up: true  },
              { label: "Total Revenue",         value: "$12,400", change: "+9.4%",  up: true  },
            ].map((k) => (
              <div key={k.label} style={{ background: "var(--cloud)", border: "1px solid var(--border)", borderTop: "3px solid var(--ocean-400)", padding: "16px 18px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>{k.label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em" }}>{k.value}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: k.up ? "#16a34a" : "var(--coral)", marginTop: 6 }}>{k.change} vs prev period</div>
              </div>
            ))}
          </div>

          {/* Campaign clicks over time */}
          <Panel title="Campaign Clicks Over Time" subtitle="Daily clicks per top campaign · last 14 days">
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <AreaChart data={CAMPAIGN_TIMELINE} margin={{ top: 6, right: 4, bottom: 0, left: -10 }}>
                  <defs>
                    {[
                      { id: "gSpring",   color: "#2772A0" },
                      { id: "gPh",       color: "#3D9BDD" },
                      { id: "gTwitter",  color: "#6DBAE8" },
                      { id: "gLinkedin", color: "#9ACFF0" },
                    ].map((g) => (
                      <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={g.color} stopOpacity={0.18} />
                        <stop offset="95%" stopColor={g.color} stopOpacity={0}    />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid stroke="var(--sky-200)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={TICK_STYLE} axisLine={false} tickLine={false} interval={1} />
                  <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={LEGEND_STYLE} />
                  <Area type="monotone" dataKey="spring"   stroke="#2772A0" strokeWidth={2}   fill="url(#gSpring)"   dot={false} name="spring-launch" />
                  <Area type="monotone" dataKey="ph"       stroke="#3D9BDD" strokeWidth={1.5} fill="url(#gPh)"       dot={false} name="product-hunt" />
                  <Area type="monotone" dataKey="twitter"  stroke="#6DBAE8" strokeWidth={1.5} fill="url(#gTwitter)"  dot={false} name="twitter-promo" />
                  <Area type="monotone" dataKey="linkedin" stroke="#9ACFF0" strokeWidth={1.5} fill="url(#gLinkedin)" dot={false} name="linkedin-b2b" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel
            title="UTM Campaign Performance"
            subtitle="Click to sort by any column"
            noPad
            action={
              <button style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 32, padding: "0 14px", background: "var(--sky-100)", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>
                <Download size={12} /> Export
              </button>
            }
          >
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--sky-100)", borderBottom: "1px solid var(--border)" }}>
                    {[
                      { key: "name",        label: "Campaign"    },
                      { key: "source",      label: "Source"      },
                      { key: "medium",      label: "Medium"      },
                      { key: "clicks",      label: "Clicks"      },
                      { key: "ctr",         label: "CTR"         },
                      { key: "conversions", label: "Conversions" },
                      { key: "revenue",     label: "Revenue"     },
                    ].map((col) => (
                      <th
                        key={col.key}
                        onClick={() => setUtmSort(col.key as keyof typeof UTM_CAMPAIGNS[0])}
                        style={{
                          padding: "11px 16px",
                          textAlign: ["clicks", "ctr", "conversions", "revenue"].includes(col.key) ? "right" : "left",
                          fontWeight: 700, fontSize: 11,
                          color: utmSort === col.key ? "var(--ocean-500)" : "var(--text-muted)",
                          letterSpacing: "0.07em", textTransform: "uppercase",
                          cursor: "pointer", userSelect: "none", whiteSpace: "nowrap",
                        }}
                      >
                        {col.label}
                        {utmSort === col.key && <ChevronDown size={11} style={{ marginLeft: 4, verticalAlign: "middle" }} />}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedUtm.map((c) => (
                    <tr
                      key={c.name}
                      style={{ borderBottom: "1px solid var(--border)" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--sky-50)")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                    >
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: "var(--ocean-600)" }}>{c.name}</span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ display: "inline-block", background: "var(--sky-100)", border: "1px solid var(--border)", fontSize: 11, fontWeight: 700, padding: "2px 7px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          {c.source}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--text-secondary)" }}>{c.medium}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>{c.clicks.toLocaleString()}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <span style={{ background: "var(--ocean-50)", color: "var(--ocean-700)", fontWeight: 700, fontSize: 12, padding: "3px 8px", border: "1px solid var(--ocean-100)" }}>
                          {c.ctr}%
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: "var(--ink)" }}>{c.conversions}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 800, color: "var(--sage)", fontSize: 14 }}>{c.revenue}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: "var(--sky-100)", borderTop: "2px solid var(--border)" }}>
                    <td colSpan={3} style={{ padding: "10px 16px", fontWeight: 700, fontSize: 12, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Total</td>
                    <td style={{ padding: "10px 16px", textAlign: "right", fontWeight: 800, fontSize: 14, color: "var(--ink)" }}>{sortedUtm.reduce((s, c) => s + c.clicks, 0).toLocaleString()}</td>
                    <td />
                    <td style={{ padding: "10px 16px", textAlign: "right", fontWeight: 800, fontSize: 14, color: "var(--ink)" }}>{sortedUtm.reduce((s, c) => s + c.conversions, 0)}</td>
                    <td style={{ padding: "10px 16px", textAlign: "right", fontWeight: 800, fontSize: 14, color: "var(--sage)" }}>$12,400</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Panel>

          <Panel title="Revenue by Channel" subtitle="Campaign revenue contribution per source">
            <div style={{ width: "100%", height: 240 }}>
              <ResponsiveContainer>
                <BarChart
                  data={[
                    { channel: "email",    revenue: 3720 },
                    { channel: "referral", revenue: 2840 },
                    { channel: "social",   revenue: 3380 },
                    { channel: "cpc",      revenue: 1900 },
                    { channel: "display",  revenue: 560  },
                  ]}
                  margin={{ top: 4, right: 20, bottom: 0, left: 0 }}
                >
                  <CartesianGrid stroke="var(--sky-200)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="channel" tick={TICK_STYLE} axisLine={false} tickLine={false} />
                  <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`$${Number(v ?? 0).toLocaleString()}`, "Revenue"]} />
                  <Bar dataKey="revenue" fill="var(--ocean-500)" barSize={36} name="Revenue ($)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </>
      )}

      {/* ── Schedule Report modal ─────────────────────────────────────────── */}
      <Modal open={showScheduleModal} onClose={() => setShowScheduleModal(false)} title="Schedule Email Report" width={420}>
        {[
          { label: "Report name",      placeholder: "Weekly Analytics Summary" },
          { label: "Send to (emails)", placeholder: "jane@acme.com, ari@acme.com" },
        ].map((f) => (
          <div key={f.label} style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.07em" }}>{f.label}</label>
            <input
              type="text"
              placeholder={f.placeholder}
              style={{ width: "100%", height: 38, padding: "0 12px", border: "1px solid var(--border)", background: "var(--sky-100)", fontSize: 13, fontFamily: "var(--font-body)", color: "var(--ink)", outline: "none", boxSizing: "border-box" }}
            />
          </div>
        ))}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.07em" }}>Frequency</label>
          <select defaultValue="weekly" style={{ width: "100%", height: 38, padding: "0 12px", border: "1px solid var(--border)", background: "var(--sky-100)", fontSize: 13, fontFamily: "var(--font-body)", color: "var(--ink)", outline: "none" }}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly (Monday)</option>
            <option value="monthly">Monthly (1st)</option>
          </select>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button
            onClick={() => setShowScheduleModal(false)}
            style={{ height: 38, padding: "0 16px", background: "transparent", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}
          >
            Cancel
          </button>
          <button
            onClick={() => setShowScheduleModal(false)}
            style={{ height: 38, padding: "0 18px", background: "var(--ocean-500)", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)", letterSpacing: "0.05em" }}
          >
            Schedule Report
          </button>
        </div>
      </Modal>
    </div>
  );
}
