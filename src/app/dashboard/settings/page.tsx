"use client";

import { useState } from "react";
import { Copy, Check, RefreshCw, Eye, EyeOff, Save } from "lucide-react";
import PageHeader from "@/platform/components/PageHeader";
import Panel from "@/platform/components/Panel";

const TABS = ["Workspace", "Profile", "API Keys", "Notifications", "Danger zone"] as const;
type Tab = (typeof TABS)[number];

const MOCK_API_KEYS = [
  { id: "key-1", name: "Production API key", key: "urlify_live_a8f2b3d1e4c7f9a2b3d1e4c7f9a2b3d1", created: "Feb 1, 2026", lastUsed: "2h ago" },
  { id: "key-2", name: "Development API key", key: "urlify_test_c7f9a2b3d1e4c7f9a2b3d1e4c7f9a2b3", created: "Jan 15, 2026", lastUsed: "4 days ago" },
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 40,
  padding: "0 12px",
  border: "1px solid var(--border)",
  background: "var(--sky-100)",
  fontFamily: "var(--font-body)",
  fontSize: 13,
  color: "var(--ink)",
  outline: "none",
};

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Workspace");
  const [copied, setCopied] = useState<string | null>(null);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});

  const handleCopy = (val: string) => {
    navigator.clipboard.writeText(val).catch(() => {});
    setCopied(val);
    setTimeout(() => setCopied(null), 1500);
  };

  const toggleShow = (id: string) =>
    setShowKey((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <PageHeader
        title="Settings"
        description="Manage workspace, profile, API keys, and notifications."
        breadcrumb="Workspace"
      />

      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--border)",
          marginBottom: 24,
          gap: 0,
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              height: 38,
              padding: "0 16px",
              fontSize: 12,
              fontWeight: 700,
              background: "none",
              border: "none",
              borderBottom: activeTab === tab ? "2px solid var(--ocean-500)" : "2px solid transparent",
              color: activeTab === tab ? "var(--ocean-600)" : "var(--text-muted)",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              marginBottom: -1,
              transition: "color 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Workspace tab */}
      {activeTab === "Workspace" && (
        <Panel title="Workspace settings">
          <div style={{ maxWidth: 520 }}>
            <Field label="Workspace name">
              <input
                defaultValue="Acme Inc."
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--ocean-500)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              />
            </Field>
            <Field label="Workspace slug" hint="Used in your default short links: your-slug.url.ify">
              <input
                defaultValue="acme"
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--ocean-500)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              />
            </Field>
            <Field label="Default domain">
              <select
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                <option>acme.ly</option>
                <option>go.acme.com</option>
              </select>
            </Field>
            <Field label="Timezone">
              <select
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                <option>UTC+0 — Coordinated Universal Time</option>
                <option>UTC-5 — Eastern Time</option>
                <option>UTC-8 — Pacific Time</option>
                <option>UTC+1 — Central European Time</option>
                <option>UTC+5:30 — India Standard Time</option>
              </select>
            </Field>
            <button
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                height: 40,
                padding: "0 20px",
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
              <Save size={13} />
              Save changes
            </button>
          </div>
        </Panel>
      )}

      {/* Profile tab */}
      {activeTab === "Profile" && (
        <Panel title="Profile settings">
          <div style={{ maxWidth: 520 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  background: "var(--ocean-800)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#fff",
                  flexShrink: 0,
                }}
              >
                JD
              </div>
              <div>
                <button
                  style={{
                    height: 32,
                    padding: "0 14px",
                    background: "var(--sky-100)",
                    border: "1px solid var(--border)",
                    fontFamily: "var(--font-body)",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    marginRight: 8,
                  }}
                >
                  Upload photo
                </button>
                <button
                  style={{
                    height: 32,
                    padding: "0 14px",
                    background: "transparent",
                    border: "1px solid var(--border)",
                    fontFamily: "var(--font-body)",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    cursor: "pointer",
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 4 }}>
              {[
                { label: "First name", value: "Jane" },
                { label: "Last name", value: "Doe" },
              ].map((f) => (
                <Field key={f.label} label={f.label}>
                  <input
                    defaultValue={f.value}
                    style={inputStyle}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--ocean-500)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                  />
                </Field>
              ))}
            </div>
            <Field label="Email address">
              <input
                type="email"
                defaultValue="jane@acme.com"
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--ocean-500)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              />
            </Field>
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 12 }}>
                Change password
              </div>
              {["Current password", "New password", "Confirm new password"].map((label) => (
                <Field key={label} label={label}>
                  <input
                    type="password"
                    placeholder="••••••••"
                    style={inputStyle}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--ocean-500)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                  />
                </Field>
              ))}
            </div>
            <button
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                height: 40,
                padding: "0 20px",
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
              <Save size={13} />
              Save profile
            </button>
          </div>
        </Panel>
      )}

      {/* API Keys tab */}
      {activeTab === "API Keys" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel
            title="API Keys"
            subtitle="Use these keys to authenticate requests to the url.ify API"
            noPad
            action={
              <button
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  height: 30,
                  padding: "0 12px",
                  background: "var(--ocean-500)",
                  color: "#fff",
                  border: "none",
                  fontFamily: "var(--font-body)",
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                Generate key
              </button>
            }
          >
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--sky-100)", borderBottom: "1px solid var(--border)" }}>
                  {["Name", "Key", "Created", "Last used", "Actions"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 20px",
                        textAlign: "left",
                        fontWeight: 700,
                        fontSize: 10,
                        color: "var(--text-muted)",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_API_KEYS.map((k) => {
                  const isShown = showKey[k.id];
                  const displayKey = isShown
                    ? k.key
                    : `${k.key.slice(0, 10)}${"•".repeat(24)}${k.key.slice(-4)}`;
                  return (
                    <tr key={k.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "14px 20px", fontWeight: 700, color: "var(--ink)" }}>{k.name}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 11,
                            color: "var(--text-muted)",
                            background: "var(--sky-100)",
                            border: "1px solid var(--border)",
                            padding: "3px 8px",
                          }}
                        >
                          {displayKey}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px", color: "var(--text-muted)", fontSize: 12 }}>{k.created}</td>
                      <td style={{ padding: "14px 20px", color: "var(--text-muted)", fontSize: 12 }}>{k.lastUsed}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <button
                            onClick={() => toggleShow(k.id)}
                            style={{
                              background: "none",
                              border: "1px solid var(--border)",
                              color: "var(--text-muted)",
                              width: 28,
                              height: 28,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                            }}
                            title={isShown ? "Hide" : "Reveal"}
                          >
                            {isShown ? <EyeOff size={11} /> : <Eye size={11} />}
                          </button>
                          <button
                            onClick={() => handleCopy(k.key)}
                            style={{
                              background: "none",
                              border: "1px solid var(--border)",
                              color: copied === k.key ? "var(--sage)" : "var(--text-muted)",
                              width: 28,
                              height: 28,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                            }}
                            title="Copy"
                          >
                            {copied === k.key ? <Check size={11} /> : <Copy size={11} />}
                          </button>
                          <button
                            style={{
                              background: "none",
                              border: "1px solid var(--border)",
                              color: "var(--text-muted)",
                              width: 28,
                              height: 28,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                            }}
                            title="Regenerate"
                          >
                            <RefreshCw size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Panel>

          <Panel title="API documentation">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)", marginBottom: 4 }}>
                  url.ify REST API
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  Full REST API with JSON responses. Auth via Bearer token in the Authorization header.
                </div>
              </div>
              <button
                style={{
                  height: 34,
                  padding: "0 16px",
                  background: "var(--ocean-50)",
                  border: "1px solid var(--ocean-200)",
                  color: "var(--ocean-700)",
                  fontFamily: "var(--font-body)",
                  fontWeight: 700,
                  fontSize: 11,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                View docs →
              </button>
            </div>
          </Panel>
        </div>
      )}

      {/* Notifications tab */}
      {activeTab === "Notifications" && (
        <Panel title="Notification preferences">
          <div style={{ maxWidth: 520 }}>
            {[
              { label: "Daily click summary", desc: "Receive a daily digest of link performance." },
              { label: "New team member joined", desc: "Alert when someone accepts your workspace invite." },
              { label: "Domain verification status", desc: "Get notified when a domain is verified or fails." },
              { label: "Trial expiry reminder", desc: "Reminder 3 days before your trial ends." },
              { label: "Usage limit warnings", desc: "Notify when you reach 80% of plan limits." },
              { label: "Weekly report", desc: "Weekly summary of workspace performance." },
            ].map((n, i) => (
              <div
                key={n.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 0",
                  borderBottom: "1px solid var(--border)",
                  gap: 16,
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", marginBottom: 2 }}>{n.label}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{n.desc}</div>
                </div>
                <ToggleSwitch defaultOn={i < 3} />
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Danger zone */}
      {activeTab === "Danger zone" && (
        <Panel title="Danger zone">
          <div style={{ maxWidth: 520, display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              {
                title: "Export workspace data",
                desc: "Download all links, analytics, and settings as a JSON file.",
                btnLabel: "Export data",
                btnStyle: { background: "var(--sky-100)", border: "1px solid var(--border)", color: "var(--text-secondary)" },
              },
              {
                title: "Delete all links",
                desc: "Permanently delete all short links in this workspace. This cannot be undone.",
                btnLabel: "Delete all links",
                btnStyle: { background: "#FEF2F2", border: "1px solid #FECACA", color: "var(--coral)" },
              },
              {
                title: "Delete workspace",
                desc: "Permanently delete this workspace and all associated data. This action is irreversible.",
                btnLabel: "Delete workspace",
                btnStyle: { background: "var(--coral)", border: "none", color: "#fff" },
              },
            ].map((item) => (
              <div
                key={item.title}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 16,
                  border: "1px solid var(--border)",
                  gap: 20,
                  background: "var(--sky-50)",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", marginBottom: 3 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{item.desc}</div>
                </div>
                <button
                  style={{
                    height: 34,
                    padding: "0 14px",
                    fontFamily: "var(--font-body)",
                    fontWeight: 700,
                    fontSize: 11,
                    letterSpacing: "0.04em",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    ...item.btnStyle,
                  }}
                >
                  {item.btnLabel}
                </button>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}

function ToggleSwitch({ defaultOn }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn ?? false);
  return (
    <div
      onClick={() => setOn((v) => !v)}
      style={{
        width: 40,
        height: 22,
        background: on ? "var(--ocean-500)" : "var(--sky-300)",
        position: "relative",
        cursor: "pointer",
        transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 3,
          left: on ? 20 : 3,
          width: 16,
          height: 16,
          background: "#fff",
          transition: "left 0.2s",
        }}
      />
    </div>
  );
}
