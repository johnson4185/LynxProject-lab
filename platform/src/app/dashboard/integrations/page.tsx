"use client";

import { useState } from "react";
import { Check, X, Plus, ExternalLink, Zap, Bell, BarChart2, Users, Database, Save } from "lucide-react";
import PageHeader from "@/platform/components/PageHeader";
import Panel from "@/platform/components/Panel";
import StatCard from "@/platform/components/StatCard";
import { dashboardData } from "@/platform/lib/dashboardData";

/* ─── Tracking pixel definitions ─────────────────────────────────────────── */
type PixelConfig = {
  id: string;
  name: string;
  abbr: string;
  color: string;
  description: string;
  label: string;
  placeholder: string;
  helpText: string;
  enabled: boolean;
  value: string;
};

const INITIAL_PIXELS: PixelConfig[] = [
  {
    id: "ga4",    name: "Google Analytics 4",   abbr: "GA4", color: "#F57C00",
    description: "Fire GA4 pageview events on every redirect for conversion tracking and funnel analysis.",
    label: "Measurement ID",  placeholder: "G-XXXXXXXXXX",
    helpText: "Found in GA4 → Admin → Data Streams",
    enabled: false, value: "",
  },
  {
    id: "gtm",    name: "Google Tag Manager",   abbr: "GTM", color: "#4285F4",
    description: "Push dataLayer events through your GTM container on every link redirect.",
    label: "Container ID",    placeholder: "GTM-XXXXXX",
    helpText: "Found in GTM → Admin → Container Settings",
    enabled: true,  value: "GTM-NXYZ1A2",
  },
  {
    id: "plausible", name: "Plausible Analytics", abbr: "PL", color: "#5850EC",
    description: "Privacy-friendly, GDPR-compliant analytics with no cookies or personal data collection.",
    label: "Site domain",     placeholder: "your-domain.com",
    helpText: "The domain registered in your Plausible account",
    enabled: false, value: "",
  },
  {
    id: "fathom", name: "Fathom Analytics",     abbr: "FA", color: "#1D4ED8",
    description: "Simple, GDPR-compliant analytics with customizable goal and conversion tracking.",
    label: "Site ID",         placeholder: "ABCDEFGH",
    helpText: "8-character ID from Fathom → Site Settings",
    enabled: false, value: "",
  },
  {
    id: "segment", name: "Segment",              abbr: "SG", color: "#52BD95",
    description: "Send link click events to Segment for routing to CDPs, data warehouses, and downstream tools.",
    label: "Write Key",       placeholder: "your-write-key",
    helpText: "Found in Segment → Sources → JavaScript",
    enabled: false, value: "",
  },
  {
    id: "mixpanel", name: "Mixpanel",             abbr: "MX", color: "#7856FF",
    description: "Track detailed link engagement events in Mixpanel for product analytics and user journey analysis.",
    label: "Project Token",   placeholder: "your-project-token",
    helpText: "Found in Mixpanel → Project Settings",
    enabled: false, value: "",
  },
];

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
  const [pixels, setPixels] = useState<PixelConfig[]>(INITIAL_PIXELS);
  const [savedPixelId, setSavedPixelId] = useState<string | null>(null);

  const updatePixel = (id: string, field: keyof PixelConfig, value: string | boolean) => {
    setPixels((prev) => prev.map((p) => p.id === id ? { ...p, [field]: value } : p));
  };

  const savePixel = (id: string) => {
    setSavedPixelId(id);
    setTimeout(() => setSavedPixelId(null), 2000);
  };

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
          <StatCard key={s.label} micro label={s.label} value={s.value} />
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

      {/* ── Tracking Pixels & Analytics ────────────────────────────────── */}
      <div style={{ marginTop: 32 }}>
        <div style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em" }}>
            Tracking Pixels & Analytics
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.6 }}>
            Attach analytics providers to fire on every link redirect. Track conversions, attribute traffic, and pipe data downstream — all without changing your links.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
          {pixels.map((pixel) => {
            const isSaved = savedPixelId === pixel.id;
            return (
              <div
                key={pixel.id}
                style={{
                  background: "var(--cloud)",
                  border: `1px solid ${pixel.enabled ? "var(--ocean-300)" : "var(--border)"}`,
                  borderTop: `3px solid ${pixel.enabled ? pixel.color : "var(--border)"}`,
                  padding: 20,
                  transition: "border-color 0.18s",
                }}
              >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, display: "flex", alignItems: "center",
                      justifyContent: "center", fontWeight: 900, fontSize: 12,
                      color: "#fff", letterSpacing: "0.02em", flexShrink: 0,
                      background: pixel.enabled ? pixel.color : "#94A3B8",
                      transition: "background 0.2s",
                    }}>
                      {pixel.abbr}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14, color: "var(--ink)" }}>{pixel.name}</div>
                      {pixel.enabled && pixel.value && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
                          color: pixel.color,
                        }}>
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Toggle */}
                  <div
                    onClick={() => updatePixel(pixel.id, "enabled", !pixel.enabled)}
                    style={{
                      width: 40, height: 22, background: pixel.enabled ? pixel.color : "var(--sky-300)",
                      position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0,
                    }}
                  >
                    <div style={{
                      position: "absolute", top: 3,
                      left: pixel.enabled ? 20 : 3,
                      width: 16, height: 16,
                      background: "#fff", transition: "left 0.2s",
                    }} />
                  </div>
                </div>

                <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 14, lineHeight: 1.6 }}>
                  {pixel.description}
                </p>

                {/* Input */}
                <div style={{ marginBottom: 12 }}>
                  <label style={{
                    display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.09em",
                    textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 5,
                  }}>
                    {pixel.label}
                  </label>
                  <input
                    value={pixel.value}
                    onChange={(e) => updatePixel(pixel.id, "value", e.target.value)}
                    placeholder={pixel.placeholder}
                    style={{
                      width: "100%", height: 36, padding: "0 10px",
                      border: "1px solid var(--border)", background: "var(--sky-100)",
                      fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink)",
                      outline: "none", boxSizing: "border-box",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--ocean-500)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                  />
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>
                    {pixel.helpText}
                  </div>
                </div>

                {/* Save button */}
                <button
                  onClick={() => savePixel(pixel.id)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    height: 32, padding: "0 14px",
                    background: isSaved ? "#F0FDF4" : "var(--sky-100)",
                    border: `1px solid ${isSaved ? "#BBF7D0" : "var(--border)"}`,
                    color: isSaved ? "#166534" : "var(--text-secondary)",
                    fontSize: 11, fontWeight: 700, cursor: "pointer",
                    fontFamily: "var(--font-body)", transition: "all 0.2s",
                  }}
                >
                  {isSaved ? <Check size={11} /> : <Save size={11} />}
                  {isSaved ? "Saved!" : "Save"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
