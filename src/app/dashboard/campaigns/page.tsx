"use client";

import { useState } from "react";
import { Plus, X, Megaphone, MousePointerClick, TrendingUp, Link2, ArrowUpRight, MoreHorizontal } from "lucide-react";
import PageHeader from "@/platform/components/PageHeader";
import Panel from "@/platform/components/Panel";
import { dashboardData } from "@/platform/lib/dashboardData";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// Build campaign data from mock links
const buildCampaigns = () => {
  const map = new Map<string, { name: string; clicks: number; links: number; ctr: number }>();
  dashboardData.links.forEach((link) => {
    Object.entries(link.stats.campaigns ?? {}).forEach(([name, clicks]) => {
      if (!map.has(name)) {
        map.set(name, { name, clicks: 0, links: 0, ctr: 0 });
      }
      const c = map.get(name)!;
      c.clicks += clicks;
      c.links += 1;
      c.ctr = Number(((c.ctr + link.stats.ctr) / 2).toFixed(1));
    });
  });
  return Array.from(map.values()).sort((a, b) => b.clicks - a.clicks);
};

const CAMPAIGNS = buildCampaigns();
const CAMPAIGN_COLORS = ["var(--ocean-500)", "var(--ocean-400)", "var(--ocean-300)", "var(--ocean-200)", "#9AB7CE"];

export default function CampaignsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  const totalClicks = CAMPAIGNS.reduce((s, c) => s + c.clicks, 0);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <PageHeader
        title="Campaigns"
        description="Group links into campaigns and measure their collective performance."
        breadcrumb="Platform"
        action={
          <button
            onClick={() => setShowCreate(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              background: "var(--ocean-500)",
              color: "#fff",
              border: "none",
              padding: "0 18px",
              height: 38,
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
            }}
          >
            <Plus size={14} />
            New campaign
          </button>
        }
      />

      {/* Overview stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {[
          { label: "Total campaigns", value: CAMPAIGNS.length, icon: <Megaphone size={20} /> },
          { label: "Total clicks", value: totalClicks.toLocaleString(), icon: <MousePointerClick size={20} /> },
          {
            label: "Avg. CTR",
            value: `${(CAMPAIGNS.reduce((s, c) => s + c.ctr, 0) / Math.max(CAMPAIGNS.length, 1)).toFixed(1)}%`,
            icon: <TrendingUp size={20} />,
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "var(--cloud)",
              border: "1px solid var(--border)",
              borderLeft: "3px solid var(--ocean-400)",
              padding: "18px 20px",
              boxShadow: "var(--shadow-xs)",
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div style={{ color: "var(--ocean-300)", flexShrink: 0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 4 }}>
                {s.label}
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "var(--ink)", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
                {s.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart + list */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginBottom: 12 }}>
        <Panel title="Campaign performance" subtitle="Clicks by campaign">
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={CAMPAIGNS} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "var(--text-muted)", fontFamily: "var(--font-body)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--text-muted)", fontFamily: "var(--font-body)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--ocean-900)",
                    border: "none",
                    color: "#fff",
                    fontSize: 12,
                    fontFamily: "var(--font-body)",
                    borderRadius: 0,
                  }}
                />
                <Bar dataKey="clicks" fill="var(--ocean-500)" radius={[0, 0, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Campaign split" subtitle="Share of total clicks">
          <div style={{ display: "grid", gap: 10 }}>
            {CAMPAIGNS.map((c, i) => {
              const pct = Math.round((c.clicks / totalClicks) * 100);
              return (
                <div key={c.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4, alignItems: "center" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 8, height: 8, background: CAMPAIGN_COLORS[i % CAMPAIGN_COLORS.length] }} />
                      <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{c.name}</span>
                    </span>
                    <strong style={{ color: "var(--ink)" }}>{pct}%</strong>
                  </div>
                  <div style={{ height: 4, background: "var(--sky-200)" }}>
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: CAMPAIGN_COLORS[i % CAMPAIGN_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* Campaign cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
        {CAMPAIGNS.map((campaign, i) => (
          <div
            key={campaign.name}
            style={{
              background: "var(--cloud)",
              border: `1px solid ${active === campaign.name ? "var(--ocean-400)" : "var(--border)"}`,
              borderTop: `3px solid ${CAMPAIGN_COLORS[i % CAMPAIGN_COLORS.length]}`,
              boxShadow: active === campaign.name ? "var(--shadow-md)" : "var(--shadow-xs)",
              padding: 20,
              cursor: "pointer",
              transition: "all 0.18s ease",
            }}
            onClick={() => setActive(active === campaign.name ? null : campaign.name)}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em" }}>
                  {campaign.name}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                  {campaign.links} link{campaign.links !== 1 ? "s" : ""}
                </div>
              </div>
              <button
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal size={16} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 3 }}>
                  Clicks
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--ink)", fontFamily: "var(--font-display)" }}>
                  {campaign.clicks.toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 3 }}>
                  Avg. CTR
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--ocean-600)", fontFamily: "var(--font-display)" }}>
                  {campaign.ctr}%
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ marginTop: 14, height: 3, background: "var(--sky-200)" }}>
              <div
                style={{
                  width: `${Math.round((campaign.clicks / CAMPAIGNS[0].clicks) * 100)}%`,
                  height: "100%",
                  background: CAMPAIGN_COLORS[i % CAMPAIGN_COLORS.length],
                }}
              />
            </div>

            {active === campaign.name && (
              <div
                style={{
                  marginTop: 14,
                  paddingTop: 14,
                  borderTop: "1px solid var(--border)",
                  display: "flex",
                  gap: 8,
                }}
              >
                <button
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5,
                    height: 30,
                    fontSize: 11,
                    fontWeight: 700,
                    background: "var(--ocean-50)",
                    color: "var(--ocean-700)",
                    border: "1px solid var(--ocean-200)",
                    cursor: "pointer",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  <Link2 size={10} /> View links
                </button>
                <button
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5,
                    height: 30,
                    fontSize: 11,
                    fontWeight: 700,
                    background: "var(--ocean-500)",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  <ArrowUpRight size={10} /> Analytics
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Add new card */}
        <div
          onClick={() => setShowCreate(true)}
          style={{
            background: "var(--sky-100)",
            border: "2px dashed var(--border)",
            padding: 20,
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            minHeight: 140,
            transition: "border-color 0.15s, background 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--ocean-400)";
            (e.currentTarget as HTMLElement).style.background = "var(--ocean-50)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
            (e.currentTarget as HTMLElement).style.background = "var(--sky-100)";
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              background: "var(--ocean-500)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Plus size={18} color="#fff" />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}>
            New campaign
          </span>
        </div>
      </div>

      {/* Create campaign modal */}
      {showCreate && (
        <>
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(7,27,44,0.45)", zIndex: 200 }}
            onClick={() => setShowCreate(false)}
          />
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 440,
              background: "var(--cloud)",
              border: "1px solid var(--border)",
              zIndex: 201,
              boxShadow: "var(--shadow-xl)",
            }}
          >
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)" }}>Create campaign</h2>
              <button onClick={() => setShowCreate(false)} style={{ background: "none", border: "1px solid var(--border)", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <X size={14} />
              </button>
            </div>
            <div style={{ padding: 24 }}>
              {[
                { label: "Campaign name *", placeholder: "Spring Launch 2026", type: "text" },
                { label: "Description", placeholder: "Describe this campaign…", type: "text" },
                { label: "Start date", placeholder: "", type: "date" },
                { label: "End date", placeholder: "", type: "date" },
              ].map((f) => (
                <div key={f.label} style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 5 }}>
                    {f.label}
                  </label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    style={{
                      width: "100%",
                      height: 38,
                      padding: "0 12px",
                      border: "1px solid var(--border)",
                      background: "var(--sky-100)",
                      fontFamily: "var(--font-body)",
                      fontSize: 13,
                      color: "var(--ink)",
                      outline: "none",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--ocean-500)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                  />
                </div>
              ))}
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button
                  onClick={() => setShowCreate(false)}
                  style={{
                    flex: 1,
                    height: 40,
                    background: "var(--ocean-500)",
                    color: "#fff",
                    border: "none",
                    fontFamily: "var(--font-body)",
                    fontWeight: 700,
                    fontSize: 12,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  Create campaign
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  style={{
                    height: 40,
                    padding: "0 18px",
                    background: "transparent",
                    border: "1px solid var(--border)",
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-body)",
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
