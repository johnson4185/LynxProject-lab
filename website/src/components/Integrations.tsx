"use client";
import Reveal from "./Reveal";

const LINE = "rgba(39,114,160,0.15)";

const INTEGRATIONS = [
  { name: "HubSpot", category: "CRM", key: "hubspot", color: "#FF7A59" },
  { name: "Slack", category: "Comms", key: "slack", color: "#4A154B" },
  { name: "Zapier", category: "Automation", key: "zapier", color: "#FF4A00" },
  {
    name: "Salesforce",
    category: "CRM",
    key: "salesforce",
    color: "#00A1E0",
  },
  {
    name: "Google Analytics",
    category: "Analytics",
    key: "ga",
    color: "#E37400",
  },
  { name: "Notion", category: "Workspace", key: "notion", color: "#111111" },
];


function BrandGlyph({ brand, color }: { brand: string; color: string }) {
  if (brand === "hubspot") {
    return (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="3.5" fill={color} />
        <circle cx="19" cy="5" r="2.2" fill={color} />
        <circle cx="5" cy="16.5" r="2.2" fill={color} />
        <path
          d="M14.7 9.7 17.3 7.1M9.2 13.9 6.8 15.7M12 8.5V4.5"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (brand === "slack") {
    return (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="10.5" y="2.5" width="3" height="8" rx="1.5" fill={color} />
        <rect x="10.5" y="13.5" width="3" height="8" rx="1.5" fill={color} />
        <rect x="2.5" y="10.5" width="8" height="3" rx="1.5" fill={color} />
        <rect x="13.5" y="10.5" width="8" height="3" rx="1.5" fill={color} />
      </svg>
    );
  }
  if (brand === "zapier") {
    return (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (brand === "salesforce") {
    return (
      <svg width="32" height="28" viewBox="0 0 26 24" fill="none" aria-hidden="true">
        <path
          d="M7 17c-2.8 0-5-2.2-5-5 0-2.4 1.8-4.5 4.2-4.9A5.5 5.5 0 0 1 16.7 6a4.8 4.8 0 0 1 6.6 4.4c0 2.7-2.2 4.8-4.9 4.8H7z"
          fill={color}
        />
      </svg>
    );
  }
  if (brand === "ga") {
    return (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="4" y="12" width="4" height="8" rx="2" fill={color} />
        <rect x="10" y="8" width="4" height="12" rx="2" fill={color} opacity="0.82" />
        <rect x="16" y="4" width="4" height="16" rx="2" fill={color} opacity="0.64" />
      </svg>
    );
  }
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="3" width="16" height="18" rx="2" stroke={color} strokeWidth="2" />
      <path
        d="M8 8h8M8 12h8M8 16h5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Integrations() {
  return (
    <section
      id="integrations"
      style={{
        background: "#ffffff",
        borderTop: `1px solid ${LINE}`,
        padding: "88px 48px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <Reveal>
          <div style={{ marginBottom: 44 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginBottom: 22,
              }}
            >
              <div style={{ flex: 1, height: 1, background: LINE }} />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.22em",
                  color: "var(--ocean-400)",
                  whiteSpace: "nowrap",
                }}
              >
                Integrations
              </span>
              <div style={{ flex: 1, height: 1, background: LINE }} />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                flexWrap: "wrap",
                gap: 20,
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  fontSize: "clamp(36px,5vw,64px)",
                  lineHeight: 0.92,
                  letterSpacing: "-0.01em",
                  color: "var(--ink)",
                }}
              >
                CONNECTS WITH YOUR
                <br />
                <span style={{ color: "var(--ocean-400)" }}>ENTIRE STACK</span>
              </h2>
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  maxWidth: 340,
                  lineHeight: 1.7,
                  marginBottom: 4,
                }}
              >
                Plug into your existing workflow in minutes. Native integrations
                with the tools your team already uses.
              </p>
            </div>
          </div>
        </Reveal>

        {/* Primary integrations row */}
        <Reveal delay={0.08}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6,1fr)",
              border: `1px solid ${LINE}`,
            }}
          >
            {INTEGRATIONS.map((ig, i) => (
              <div
                key={ig.name}
                style={{
                  padding: "36px 16px 28px",
                  borderRight:
                    i < INTEGRATIONS.length - 1 ? `1px solid ${LINE}` : undefined,
                  textAlign: "center",
                  transition:
                    "background 0.22s, transform 0.25s var(--ease-spring), box-shadow 0.22s",
                  cursor: "default",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = `rgba(${ig.color === "#111111" ? "0,0,0" : ig.color.replace("#", "").match(/.{2}/g)?.map(v => parseInt(v, 16)).join(",") ?? "39,114,160"}, 0.06)`;
                  el.style.transform = "translateY(-4px)";
                  el.style.boxShadow = "0 12px 28px rgba(7,27,44,0.1)";
                  const name = el.querySelector(".integ-name") as HTMLElement;
                  if (name) name.style.color = "var(--ink)";
                  const iconBox = el.querySelector(".integ-icon-box") as HTMLElement;
                  if (iconBox) iconBox.style.borderColor = "rgba(39,114,160,0.3)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "transparent";
                  el.style.transform = "translateY(0)";
                  el.style.boxShadow = "none";
                  const name = el.querySelector(".integ-name") as HTMLElement;
                  if (name) name.style.color = "var(--text-secondary)";
                  const iconBox = el.querySelector(".integ-icon-box") as HTMLElement;
                  if (iconBox) iconBox.style.borderColor = LINE;
                }}
              >
                <div
                  className="integ-icon-box"
                  style={{
                    width: 64,
                    height: 64,
                    margin: "0 auto 14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: `1px solid ${LINE}`,
                    background: "#fff",
                    transition: "border-color 0.2s",
                  }}
                >
                  <BrandGlyph brand={ig.key} color={ig.color} />
                </div>
                <div
                  className="integ-name"
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "var(--text-secondary)",
                    transition: "color 0.2s",
                    marginBottom: 6,
                  }}
                >
                  {ig.name}
                </div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "var(--ocean-500)",
                    background: "rgba(39,114,160,0.07)",
                    border: "1px solid rgba(39,114,160,0.12)",
                    padding: "2px 7px",
                  }}
                >
                  {ig.category}
                </div>
              </div>
            ))}
          </div>
        </Reveal>

      </div>
    </section>
  );
}
