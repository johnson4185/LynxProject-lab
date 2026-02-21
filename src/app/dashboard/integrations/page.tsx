"use client";

import { useState } from "react";
import { Check, X, Plus, ExternalLink, Zap, Bell, BarChart2, Users, Database } from "lucide-react";
import PageHeader from "@/platform/components/PageHeader";
import { dashboardData } from "@/platform/lib/dashboardData";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Notifications: <Bell size={18} />,
  Automation: <Zap size={18} />,
  CRM: <Users size={18} />,
  Analytics: <BarChart2 size={18} />,
};

const CATEGORY_COLORS: Record<string, string> = {
  Notifications: "var(--coral)",
  Automation: "var(--amber)",
  CRM: "var(--sage)",
  Analytics: "var(--ocean-500)",
};

const categories = Array.from(new Set(dashboardData.integrations.map((i) => i.category)));

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState(dashboardData.integrations);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = activeCategory
    ? integrations.filter((i) => i.category === activeCategory)
    : integrations;

  const connectedCount = integrations.filter((i) => i.connected).length;

  const toggle = (id: string) => {
    setIntegrations((prev) =>
      prev.map((i) => (i.id === id ? { ...i, connected: !i.connected } : i))
    );
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <PageHeader
        title="Integrations"
        description="Connect url.ify with your favorite tools to automate workflows and sync data."
        breadcrumb="Workspace"
      />

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Available", value: integrations.length },
          { label: "Connected", value: connectedCount },
          { label: "Categories", value: categories.length },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "var(--cloud)",
              border: "1px solid var(--border)",
              borderLeft: "3px solid var(--ocean-400)",
              padding: "16px 20px",
              boxShadow: "var(--shadow-xs)",
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 4 }}>
              {s.label}
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "var(--ink)", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Category filters */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setActiveCategory(null)}
          style={{
            height: 32,
            padding: "0 14px",
            fontSize: 11,
            fontWeight: 700,
            background: activeCategory === null ? "var(--ocean-500)" : "var(--cloud)",
            color: activeCategory === null ? "#fff" : "var(--text-muted)",
            border: "1px solid var(--border)",
            cursor: "pointer",
            fontFamily: "var(--font-body)",
          }}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
            style={{
              height: 32,
              padding: "0 14px",
              fontSize: 11,
              fontWeight: 700,
              background: activeCategory === cat ? "var(--ocean-500)" : "var(--cloud)",
              color: activeCategory === cat ? "#fff" : "var(--text-muted)",
              border: "1px solid var(--border)",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Integration cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
        {filtered.map((integration) => {
          const catColor = CATEGORY_COLORS[integration.category] ?? "var(--ocean-500)";
          const catIcon = CATEGORY_ICONS[integration.category] ?? <Database size={18} />;
          return (
            <div
              key={integration.id}
              style={{
                background: "var(--cloud)",
                border: `1px solid ${integration.connected ? "var(--ocean-300)" : "var(--border)"}`,
                borderTop: `3px solid ${integration.connected ? catColor : "var(--border)"}`,
                boxShadow: integration.connected ? "var(--shadow-sm)" : "var(--shadow-xs)",
                padding: 20,
                transition: "all 0.18s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      background: integration.connected ? catColor + "18" : "var(--sky-100)",
                      border: `1.5px solid ${integration.connected ? catColor + "44" : "var(--border)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: integration.connected ? catColor : "var(--text-muted)",
                      flexShrink: 0,
                    }}
                  >
                    {catIcon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: "var(--ink)", letterSpacing: "-0.01em" }}>
                      {integration.name}
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.07em",
                        textTransform: "uppercase",
                        color: catColor,
                      }}
                    >
                      {integration.category}
                    </span>
                  </div>
                </div>

                {integration.connected && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      background: "#F0FDF4",
                      color: "#166534",
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "3px 8px",
                      border: "1px solid #BBF7D0",
                    }}
                  >
                    <Check size={9} />
                    Connected
                  </span>
                )}
              </div>

              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.6 }}>
                {integration.description}
              </p>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => toggle(integration.id)}
                  style={{
                    flex: 1,
                    height: 34,
                    background: integration.connected ? "#FEF2F2" : "var(--ocean-500)",
                    color: integration.connected ? "var(--coral)" : "#fff",
                    border: `1px solid ${integration.connected ? "#FECACA" : "var(--ocean-500)"}`,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    fontFamily: "var(--font-body)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5,
                  }}
                >
                  {integration.connected ? (
                    <>
                      <X size={11} />
                      Disconnect
                    </>
                  ) : (
                    <>
                      <Plus size={11} />
                      Connect
                    </>
                  )}
                </button>
                <button
                  style={{
                    width: 34,
                    height: 34,
                    background: "var(--sky-100)",
                    border: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                  }}
                  title="Learn more"
                >
                  <ExternalLink size={12} />
                </button>
              </div>
            </div>
          );
        })}

        {/* More coming */}
        <div
          style={{
            background: "var(--sky-100)",
            border: "2px dashed var(--border)",
            padding: 20,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            minHeight: 160,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              background: "var(--sky-200)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Plus size={18} style={{ color: "var(--text-muted)" }} />
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}>More coming soon</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
              Suggest an integration
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
