"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import {
  Activity, Globe, Users, Key, QrCode, Link2, TrendingUp, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import Link from "next/link";
import PageHeader from "@/platform/components/PageHeader";
import Panel from "@/platform/components/Panel";

/* ─── Metric definitions ─────────────────────────────────────────────────── */
const METRICS = [
  { key: "links",   label: "Short links",       sublabel: "Created this month",       used: 2840,  limit: null, icon: Link2,     delta: +18 },
  { key: "clicks",  label: "Clicks tracked",    sublabel: "This billing period",       used: 84320, limit: null, icon: Activity,  delta: +24 },
  { key: "domains", label: "Custom domains",    sublabel: "Active",                    used: 3,     limit: null, icon: Globe,     delta: 0   },
  { key: "seats",   label: "Team seats",        sublabel: "Active members",            used: 6,     limit: null, icon: Users,     delta: +1  },
  { key: "api",     label: "API requests",      sublabel: "This billing period",       used: 31640, limit: null, icon: Key,       delta: +12 },
  { key: "qr",      label: "QR codes",          sublabel: "Total generated",           used: 28,    limit: null, icon: QrCode,    delta: +3  },
];

/* ─── Monthly trend ──────────────────────────────────────────────────────── */
const MONTHLY_TREND = [
  { month: "Sep", links: 1240,  clicks: 38400,  api: 12000 },
  { month: "Oct", links: 1680,  clicks: 52100,  api: 18200 },
  { month: "Nov", links: 2100,  clicks: 63400,  api: 21400 },
  { month: "Dec", links: 2460,  clicks: 71200,  api: 25800 },
  { month: "Jan", links: 2720,  clicks: 79100,  api: 28400 },
  { month: "Feb", links: 2840,  clicks: 84320,  api: 31640 },
];


const TOOLTIP_STYLE = {
  contentStyle: {
    background: "var(--cloud)", border: "1px solid var(--border)",
    fontSize: 12, fontFamily: "var(--font-body)", borderRadius: 0,
  },
};
const TICK_STYLE = {
  style: { fontSize: 11, fill: "var(--text-muted)", fontFamily: "var(--font-body)" },
};

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════════════════ */
export default function UsagePage() {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <PageHeader
        title="Usage"
        description="Monitor your workspace usage and plan limits in real time."
        breadcrumb="Workspace"
        action={
          <Link
            href="/dashboard/billing"
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              background: "var(--ocean-500)", color: "#fff", border: "none",
              padding: "0 18px", height: 38, fontWeight: 700, fontSize: 12,
              letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer",
              fontFamily: "var(--font-body)", textDecoration: "none",
            }}
          >
            <TrendingUp size={14} />
            Manage plan
          </Link>
        }
      />

      {/* ── Current plan banner ─────────────────────────────────────────── */}
      <div style={{
        background: "var(--cloud)", border: "1px solid var(--border)",
        borderLeft: "4px solid var(--ocean-500)", padding: "16px 22px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 20, boxShadow: "var(--shadow-xs)",
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 4 }}>
            Current plan
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em" }}>
            Enterprise
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            Unlimited links · Unlimited clicks · Unlimited seats · All features included
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4 }}>Billing period</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>Feb 1 – Feb 28, 2026</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Renews Mar 1, 2026</div>
        </div>
      </div>

      {/* ── Usage metric cards ──────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {METRICS.map(({ key, label, sublabel, used, limit, icon: Icon, delta }) => {
          const pct = limit !== null ? Math.min(100, (used / (limit as number)) * 100) : null;
          const barColor = pct === null
            ? "var(--ocean-400)"
            : pct > 80 ? "var(--coral)" : pct > 60 ? "#F59E0B" : "var(--sage)";
          const deltaPositive = delta >= 0;

          return (
            <div
              key={key}
              style={{
                background: "var(--cloud)", border: "1px solid var(--border)",
                padding: "18px 20px", boxShadow: "var(--shadow-xs)",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, background: "var(--ocean-50)",
                    border: "1px solid var(--ocean-100)", display: "flex",
                    alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <Icon size={16} color="var(--ocean-500)" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                      {label}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>{sublabel}</div>
                  </div>
                </div>
                {delta !== 0 && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 2, fontSize: 11, fontWeight: 700,
                    color: deltaPositive ? "var(--sage)" : "var(--coral)", flexShrink: 0,
                  }}>
                    {deltaPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {deltaPositive ? "+" : ""}{delta}%
                  </div>
                )}
              </div>

              <div style={{ fontSize: 30, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.03em", marginBottom: 8 }}>
                {used.toLocaleString()}
              </div>

              {pct !== null ? (
                <>
                  <div style={{ height: 4, background: "var(--sky-200)", marginBottom: 5 }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: barColor, transition: "width 0.5s ease" }} />
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {used.toLocaleString()} / {(limit as unknown as number).toLocaleString()} — {pct.toFixed(0)}% used
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 11, color: "var(--sage)", fontWeight: 700 }}>
                  Unlimited — Enterprise plan
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Monthly usage trend chart ────────────────────────────────────── */}
      <Panel title="Usage Trend" subtitle="Last 6 months — links created, clicks tracked, and API requests">
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MONTHLY_TREND} barGap={2} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={TICK_STYLE} tickLine={false} axisLine={false} />
              <YAxis
                yAxisId="clicks"
                orientation="right"
                tick={TICK_STYLE}
                tickLine={false}
                axisLine={false}
                width={55}
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`}
              />
              <YAxis
                yAxisId="links"
                tick={TICK_STYLE}
                tickLine={false}
                axisLine={false}
                width={50}
              />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(v: unknown, name: string | undefined) => [
                  (v as number).toLocaleString(),
                  name === "clicks" ? "Clicks" : name === "links" ? "Links" : "API Calls",
                ]}
              />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-body)", paddingTop: 12 }} />
              <Bar yAxisId="clicks" dataKey="clicks" name="Clicks" fill="var(--ocean-200)" />
              <Bar yAxisId="links"  dataKey="links"  name="Links"  fill="var(--ocean-500)" />
              <Bar yAxisId="links"  dataKey="api"    name="API Calls" fill="var(--ocean-800)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      {/* ── Plan comparison CTA ──────────────────────────────────────────── */}
      <div style={{
        marginTop: 16,
        background: "var(--cloud)", border: "1px solid var(--border)",
        borderLeft: "4px solid var(--ocean-400)",
        padding: "18px 24px", display: "flex",
        alignItems: "center", justifyContent: "space-between",
        boxShadow: "var(--shadow-xs)",
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", marginBottom: 3 }}>
            Full plan comparison
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            See a complete breakdown of features across Basic, Pro, and Enterprise plans.
          </div>
        </div>
        <Link
          href="/dashboard/billing"
          style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            background: "var(--ocean-500)", color: "#fff", border: "none",
            padding: "0 18px", height: 38, fontWeight: 700, fontSize: 12,
            letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer",
            fontFamily: "var(--font-body)", textDecoration: "none", flexShrink: 0,
          }}
        >
          <TrendingUp size={14} />
          View plans
        </Link>
      </div>
    </div>
  );
}
