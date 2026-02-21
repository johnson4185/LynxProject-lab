"use client";
import Reveal from "./Reveal";
import { BarChart3, Globe, Link2, PlugZap, QrCode, Users, ArrowRight } from "lucide-react";

const LINE = "rgba(39,114,160,0.15)";

const ACCENT_COLORS = [
  "var(--ocean-500)",
  "var(--ocean-400)",
  "var(--ocean-600)",
  "var(--ocean-300)",
  "var(--ocean-500)",
  "var(--ocean-700)",
];

const FEATURES = [
  {
    num: "01",
    icon: <Link2 size={20} />,
    title: "SMART SHORTENING",
    desc: "Create clean, branded links in seconds. Custom aliases, bulk import, and full API access out of the box.",
  },
  {
    num: "02",
    icon: <BarChart3 size={20} />,
    title: "LIVE ANALYTICS",
    desc: "Real-time dashboards showing clicks, geography, devices, and referrers as they happen, every second.",
  },
  {
    num: "03",
    icon: <Globe size={20} />,
    title: "CUSTOM DOMAINS",
    desc: "Brand every link with your own domain. go.yourcompany.com builds trust and recognition with every share.",
  },
  {
    num: "04",
    icon: <QrCode size={20} />,
    title: "QR GENERATION",
    desc: "Auto-generate print-ready QR codes for any link. SVG, PNG export with your brand colours baked in.",
  },
  {
    num: "05",
    icon: <Users size={20} />,
    title: "TEAM WORKSPACE",
    desc: "Shared libraries, campaign folders, role-based access, and a full audit trail for your whole team.",
  },
  {
    num: "06",
    icon: <PlugZap size={20} />,
    title: "INTEGRATIONS & API",
    desc: "Connect HubSpot, Slack, Zapier, Salesforce and 50+ tools. Build custom flows with our RESTful API.",
  },
];

/* Analytics mock panel */
function AnalyticsMock() {
  const bars = [30, 48, 38, 62, 74, 65, 82, 100, 88, 95, 78, 85];
  return (
    <div
      style={{
        width: "100%",
        background: "var(--sky-100)",
        border: `1px solid ${LINE}`,
        padding: 24,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.15em",
          color: "var(--ocean-400)",
          marginBottom: 8,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>Click Volume — Feb 2026</span>
        <span
          style={{
            color: "var(--sage)",
            fontSize: 9,
            background: "rgba(61,158,114,0.1)",
            border: "1px solid rgba(61,158,114,0.2)",
            padding: "2px 7px",
          }}
        >
          +18% MoM
        </span>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 4,
          height: 100,
          marginBottom: 14,
        }}
      >
        {bars.map((h, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${h}%`,
              background:
                h >= 95
                  ? "var(--ocean-200)"
                  : h >= 75
                  ? "var(--ocean-400)"
                  : h >= 55
                  ? "var(--ocean-600)"
                  : "rgba(39,114,160,0.22)",
              transition: "opacity 0.18s, transform 0.18s",
              cursor: "pointer",
              transformOrigin: "bottom",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = "0.65";
              (e.currentTarget as HTMLElement).style.transform = "scaleY(1.05)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = "1";
              (e.currentTarget as HTMLElement).style.transform = "scaleY(1)";
            }}
          />
        ))}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 9,
          fontWeight: 600,
          color: "var(--text-muted)",
          fontFamily: "var(--font-mono)",
          marginBottom: 14,
        }}
      >
        <span>Feb 1</span>
        <span>Feb 7</span>
        <span>Feb 14</span>
        <span>Feb 20</span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 8,
        }}
      >
        {[
          ["84.2K", "Today", "var(--ocean-400)"],
          ["7.4%", "CTR", "var(--sage)"],
          ["18%", "Growth", "var(--amber)"],
        ].map(([v, l, c]) => (
          <div
            key={l}
            style={{
              background: "var(--background)",
              border: `1px solid ${LINE}`,
              padding: "10px 12px",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 20,
                color: c,
                fontWeight: 900,
                lineHeight: 1,
              }}
            >
              {v}
            </div>
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "var(--text-muted)",
                marginTop: 4,
              }}
            >
              {l}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Link list mock panel */
function LinksMock() {
  const rows = [
    { url: "url.ify/launch-feb", w: "100%", n: "84.2K" },
    { url: "url.ify/q1-report", w: "62%", n: "52.4K" },
    { url: "go.brand.co/brand-kit", w: "38%", n: "31.8K" },
    { url: "url.ify/podcast-ep", w: "23%", n: "18.9K" },
    { url: "url.ify/newsletter", w: "17%", n: "14.2K" },
  ];
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 5,
      }}
    >
      {rows.map((r, idx) => (
        <div
          key={r.url}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: idx === 0 ? "rgba(39,114,160,0.06)" : "var(--sky-100)",
            border: `1px solid ${idx === 0 ? "rgba(39,114,160,0.2)" : LINE}`,
            padding: "12px 16px",
            transition: "border-color 0.2s",
            cursor: "default",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.borderColor =
              "var(--ocean-500)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.borderColor =
              idx === 0 ? "rgba(39,114,160,0.2)" : LINE)
          }
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: idx === 0 ? "var(--ocean-400)" : "var(--sky-400)",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              flex: 1,
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              fontWeight: 600,
              color: idx === 0 ? "var(--ocean-500)" : "var(--ocean-300)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {r.url}
          </span>
          <div
            style={{
              width: 70,
              height: 2,
              background: "var(--background)",
              flexShrink: 0,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: r.w,
                background:
                  "linear-gradient(90deg,var(--ocean-500),var(--ocean-200))",
              }}
            />
          </div>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              fontWeight: 700,
              color: "var(--text-secondary)",
              whiteSpace: "nowrap",
            }}
          >
            {r.n}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function Features() {
  return (
    <section
      id="features"
      style={{
        background: "var(--sky-50)",
        borderTop: `1px solid ${LINE}`,
        padding: "88px 48px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Section header */}
        <Reveal>
          <div style={{ marginBottom: 48 }}>
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
                Platform Features
              </span>
              <div style={{ flex: 1, height: 1, background: LINE }} />
            </div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 900,
                textTransform: "uppercase",
                fontSize: "clamp(44px,6vw,80px)",
                lineHeight: 0.92,
                letterSpacing: "-0.01em",
                color: "var(--ink)",
                marginBottom: 18,
              }}
            >
              BUILT FOR TEAMS
              <br />
              WHO{" "}
              <span style={{ color: "var(--ocean-400)" }}>MEASURE</span>
              <br />
              EVERYTHING
            </h2>
            <p
              style={{
                fontSize: 16,
                fontWeight: 500,
                color: "var(--text-secondary)",
                maxWidth: 540,
                lineHeight: 1.7,
              }}
            >
              From one link to one billion — every feature you need to track,
              optimise, and scale your URL strategy.
            </p>
          </div>
        </Reveal>

        {/* 6 feature cards grid */}
        <Reveal delay={0.1}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 1,
              background: LINE,
              border: `1px solid ${LINE}`,
              marginBottom: 16,
            }}
          >
            {FEATURES.map((f, idx) => (
              <div
                key={f.num}
                style={{
                  background: "#ffffff",
                  padding: "36px 30px",
                  position: "relative",
                  overflow: "hidden",
                  transition:
                    "background 0.25s, transform 0.28s var(--ease-spring), box-shadow 0.25s",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "var(--sky-100)";
                  el.style.transform = "translateY(-4px)";
                  el.style.boxShadow = "0 16px 32px rgba(39,114,160,0.12)";
                  const bar = el.querySelector(".feat-bar") as HTMLElement;
                  if (bar) bar.style.transform = "scaleX(1)";
                  const ghost = el.querySelector(".feat-ghost") as HTMLElement;
                  if (ghost) ghost.style.color = "rgba(39,114,160,0.25)";
                  const icon = el.querySelector(".feat-icon") as HTMLElement;
                  if (icon) {
                    icon.style.background = ACCENT_COLORS[idx];
                    icon.style.borderColor = ACCENT_COLORS[idx];
                    icon.style.color = "#fff";
                    icon.style.transform = "scale(1.08)";
                    icon.style.boxShadow = "3px 3px 0 rgba(7,27,44,0.18)";
                  }
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "#ffffff";
                  el.style.transform = "translateY(0)";
                  el.style.boxShadow = "none";
                  const bar = el.querySelector(".feat-bar") as HTMLElement;
                  if (bar) bar.style.transform = "scaleX(0)";
                  const ghost = el.querySelector(".feat-ghost") as HTMLElement;
                  if (ghost) ghost.style.color = "rgba(39,114,160,0.08)";
                  const icon = el.querySelector(".feat-icon") as HTMLElement;
                  if (icon) {
                    icon.style.background = "var(--sky-100)";
                    icon.style.borderColor = LINE;
                    icon.style.color = "var(--ocean-500)";
                    icon.style.transform = "scale(1)";
                    icon.style.boxShadow = "none";
                  }
                }}
              >
                {/* Hover bottom bar */}
                <div
                  className="feat-bar"
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: `linear-gradient(90deg, ${ACCENT_COLORS[idx]}, transparent)`,
                    transform: "scaleX(0)",
                    transformOrigin: "left",
                    transition: "transform 0.38s var(--ease-spring)",
                  }}
                />
                {/* Ghost number */}
                <div
                  className="feat-ghost"
                  style={{
                    position: "absolute",
                    top: 18,
                    right: 18,
                    fontFamily: "var(--font-display)",
                    fontSize: 72,
                    lineHeight: 1,
                    fontWeight: 900,
                    color: "rgba(39,114,160,0.08)",
                    transition: "color 0.28s",
                    userSelect: "none",
                    pointerEvents: "none",
                  }}
                >
                  {f.num}
                </div>

                {/* Icon box */}
                <div
                  className="feat-icon"
                  style={{
                    width: 46,
                    height: 46,
                    marginBottom: 22,
                    border: `1px solid ${LINE}`,
                    background: "var(--sky-100)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--ocean-500)",
                    transition:
                      "all 0.28s var(--ease-spring)",
                    flexShrink: 0,
                  }}
                >
                  {f.icon}
                </div>

                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 20,
                    letterSpacing: "0.02em",
                    color: "var(--ink)",
                    marginBottom: 10,
                    lineHeight: 1.1,
                    fontWeight: 900,
                    textTransform: "uppercase",
                  }}
                >
                  {f.title}
                </div>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    lineHeight: 1.7,
                    color: "var(--text-secondary)",
                    marginBottom: 20,
                  }}
                >
                  {f.desc}
                </p>
                <a
                  href="#"
                  className="arrow-link"
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.gap = "14px";
                    (e.currentTarget as HTMLElement).style.color =
                      "var(--ocean-600)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.gap = "8px";
                    (e.currentTarget as HTMLElement).style.color =
                      "var(--ocean-400)";
                  }}
                >
                  Learn more <ArrowRight size={11} />
                </a>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Alternating deep-dive 1: Analytics */}
        <Reveal delay={0.05}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 0,
              border: `1px solid ${LINE}`,
              marginBottom: 16,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "56px 44px",
                borderRight: `1px solid ${LINE}`,
                background: "var(--sky-100)",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  color: "var(--ocean-400)",
                  marginBottom: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span
                  style={{
                    width: 20,
                    height: 1,
                    background: "var(--ocean-400)",
                    display: "inline-block",
                  }}
                />
                Deep Analytics
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  fontSize: "clamp(30px,3.8vw,50px)",
                  lineHeight: 0.95,
                  letterSpacing: "-0.01em",
                  color: "var(--ink)",
                  marginBottom: 18,
                }}
              >
                KNOW WHAT&apos;S WORKING.
                <br />
                DOWN TO THE CLICK.
              </h3>
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  lineHeight: 1.75,
                  color: "var(--text-secondary)",
                  marginBottom: 28,
                }}
              >
                Stop guessing which campaigns move the needle. url.ify gives
                you a live, unified view of every link — from first impression
                to final conversion.
              </p>
              <ul
                style={{
                  listStyle: "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  marginBottom: 32,
                }}
              >
                {[
                  "Click heatmaps by device, OS, and browser",
                  "UTM parameter builder built right in",
                  "Geographic breakdown across 190+ countries",
                  "Exportable reports — CSV, PDF, or API",
                ].map((item) => (
                  <li
                    key={item}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                      lineHeight: 1.5,
                    }}
                  >
                    <span
                      style={{
                        color: "var(--ocean-400)",
                        fontWeight: 800,
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      →
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href="#"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  height: 44,
                  padding: "0 24px",
                  border: `1px solid var(--ocean-500)`,
                  color: "var(--ocean-500)",
                  background: "none",
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  textDecoration: "none",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "var(--ocean-500)";
                  (e.currentTarget as HTMLElement).style.color = "white";
                  (e.currentTarget as HTMLElement).style.transform =
                    "translateY(-1px)";
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 6px 18px rgba(39,114,160,0.22)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "none";
                  (e.currentTarget as HTMLElement).style.color =
                    "var(--ocean-500)";
                  (e.currentTarget as HTMLElement).style.transform =
                    "translateY(0)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                Explore analytics <ArrowRight size={13} />
              </a>
            </div>
            <div
              style={{
                padding: 36,
                background: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AnalyticsMock />
            </div>
          </div>
        </Reveal>

        {/* Alternating deep-dive 2: Team */}
        <Reveal delay={0.05}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 0,
              border: `1px solid ${LINE}`,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: 36,
                background: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <LinksMock />
            </div>
            <div
              style={{
                padding: "56px 44px",
                borderLeft: `1px solid ${LINE}`,
                background: "var(--sky-100)",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  color: "var(--ocean-400)",
                  marginBottom: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span
                  style={{
                    width: 20,
                    height: 1,
                    background: "var(--ocean-400)",
                    display: "inline-block",
                  }}
                />
                Team Collaboration
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  fontSize: "clamp(30px,3.8vw,50px)",
                  lineHeight: 0.95,
                  letterSpacing: "-0.01em",
                  color: "var(--ink)",
                  marginBottom: 18,
                }}
              >
                ONE TEAM.
                <br />
                ONE LINK LIBRARY.
              </h3>
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  lineHeight: 1.75,
                  color: "var(--text-secondary)",
                  marginBottom: 28,
                }}
              >
                Marketing, sales, support — everyone works from a single source
                of truth. No duplicates, no broken links, no confusion.
              </p>
              <ul
                style={{
                  listStyle: "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  marginBottom: 32,
                }}
              >
                {[
                  "Unlimited members on Enterprise plan",
                  "Role-based access: Admin, Editor, Viewer",
                  "Shared campaign folders and tags",
                  "Complete activity audit log",
                ].map((item) => (
                  <li
                    key={item}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                      lineHeight: 1.5,
                    }}
                  >
                    <span
                      style={{
                        color: "var(--ocean-400)",
                        fontWeight: 800,
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      →
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href="#"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  height: 44,
                  padding: "0 24px",
                  border: `1px solid var(--ocean-500)`,
                  color: "var(--ocean-500)",
                  background: "none",
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  textDecoration: "none",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "var(--ocean-500)";
                  (e.currentTarget as HTMLElement).style.color = "white";
                  (e.currentTarget as HTMLElement).style.transform =
                    "translateY(-1px)";
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 6px 18px rgba(39,114,160,0.22)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "none";
                  (e.currentTarget as HTMLElement).style.color =
                    "var(--ocean-500)";
                  (e.currentTarget as HTMLElement).style.transform =
                    "translateY(0)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                See team features <ArrowRight size={13} />
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
