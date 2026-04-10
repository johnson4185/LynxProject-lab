"use client";
import Reveal from "./Reveal";
import { UserPlus, Link, Share2, TrendingUp } from "lucide-react";

const LINE = "rgba(39,114,160,0.15)";

const STEPS = [
  {
    n: "01",
    icon: <UserPlus size={22} />,
    title: "CREATE ACCOUNT",
    desc: "Sign up free in 30 seconds. Your 7-day trial starts immediately — full access to every feature from day one.",
    detail: "No credit card required",
  },
  {
    n: "02",
    icon: <Link size={22} />,
    title: "PASTE YOUR URL",
    desc: "Drop in any long link. Add a custom alias, pick a branded domain, configure UTM tracking in seconds.",
    detail: "Supports 50+ URL formats",
  },
  {
    n: "03",
    icon: <Share2 size={22} />,
    title: "SHARE EVERYWHERE",
    desc: "Copy your link, download a QR code, or push directly to Slack, HubSpot, Salesforce or 50+ integrations.",
    detail: "One-click to all channels",
  },
  {
    n: "04",
    icon: <TrendingUp size={22} />,
    title: "TRACK & SCALE",
    desc: "Watch live analytics update in real time. Know exactly what works. Double down with total confidence.",
    detail: "Real-time, no delay",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      style={{
        background: "linear-gradient(180deg, var(--sky-100) 0%, #ffffff 100%)",
        borderTop: `1px solid ${LINE}`,
        borderBottom: `1px solid ${LINE}`,
        padding: "88px 48px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <Reveal>
          <div style={{ marginBottom: 52 }}>
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
                How It Works
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
              }}
            >
              LIVE IN
              <br />
              <span style={{ color: "var(--ocean-400)" }}>60 SECONDS</span>
            </h2>
          </div>
        </Reveal>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            border: `1px solid ${LINE}`,
            position: "relative",
          }}
        >
          {/* Gradient connecting line */}
          <div
            className="hidden lg:block"
            style={{
              position: "absolute",
              top: 52,
              left: "12%",
              right: "12%",
              height: 1,
              background: `linear-gradient(90deg, transparent, var(--ocean-300), var(--ocean-300), transparent)`,
              opacity: 0.35,
              pointerEvents: "none",
              zIndex: 0,
            }}
          />

          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.1}>
              <div
                style={{
                  padding: "36px 26px 32px",
                  borderRight:
                    i < STEPS.length - 1 ? `1px solid ${LINE}` : undefined,
                  position: "relative",
                  zIndex: 1,
                  transition:
                    "background 0.28s, box-shadow 0.28s",
                  cursor: "default",
                  minHeight: 280,
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "rgba(39,114,160,0.04)";
                  el.style.boxShadow = "inset 0 0 0 1px rgba(39,114,160,0.18)";
                  const num = el.querySelector(".step-n") as HTMLElement;
                  if (num) num.style.color = "var(--ocean-300)";
                  const iconBox = el.querySelector(
                    ".step-icon"
                  ) as HTMLElement;
                  if (iconBox) {
                    iconBox.style.background = "var(--ocean-500)";
                    iconBox.style.borderColor = "var(--ocean-500)";
                    iconBox.style.color = "#fff";
                    iconBox.style.transform = "scale(1.1)";
                    iconBox.style.boxShadow = "3px 3px 0 rgba(7,27,44,0.2)";
                  }
                  const bar = el.querySelector(".step-bar") as HTMLElement;
                  if (bar) bar.style.transform = "scaleX(1)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "transparent";
                  el.style.boxShadow = "none";
                  const num = el.querySelector(".step-n") as HTMLElement;
                  if (num) num.style.color = "rgba(39,114,160,0.18)";
                  const iconBox = el.querySelector(
                    ".step-icon"
                  ) as HTMLElement;
                  if (iconBox) {
                    iconBox.style.background = "var(--sky-100)";
                    iconBox.style.borderColor = LINE;
                    iconBox.style.color = "var(--ocean-500)";
                    iconBox.style.transform = "scale(1)";
                    iconBox.style.boxShadow = "none";
                  }
                  const bar = el.querySelector(".step-bar") as HTMLElement;
                  if (bar) bar.style.transform = "scaleX(0)";
                }}
              >
                {/* Bottom sweep bar */}
                <div
                  className="step-bar"
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background:
                      "linear-gradient(90deg,var(--ocean-500),var(--ocean-200))",
                    transform: "scaleX(0)",
                    transformOrigin: "left",
                    transition: "transform 0.38s var(--ease-spring)",
                  }}
                />

                {/* Step number */}
                <span
                  className="step-n"
                  style={{
                    display: "block",
                    fontFamily: "var(--font-display)",
                    fontSize: 48,
                    lineHeight: 1,
                    fontWeight: 900,
                    color: "rgba(39,114,160,0.18)",
                    marginBottom: 18,
                    transition: "color 0.28s",
                  }}
                >
                  {s.n}
                </span>

                {/* Icon box */}
                <div
                  className="step-icon"
                  style={{
                    width: 48,
                    height: 48,
                    border: `1px solid ${LINE}`,
                    background: "var(--sky-100)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--ocean-500)",
                    marginBottom: 20,
                    transition: "all 0.28s var(--ease-spring)",
                    flexShrink: 0,
                  }}
                >
                  {s.icon}
                </div>

                {/* Title */}
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 18,
                    letterSpacing: "0.03em",
                    fontWeight: 900,
                    color: "var(--ink)",
                    marginBottom: 10,
                    textTransform: "uppercase",
                    lineHeight: 1.15,
                  }}
                >
                  {s.title}
                </div>

                {/* Desc */}
                <p
                  style={{
                    fontSize: 13.5,
                    fontWeight: 500,
                    lineHeight: 1.7,
                    color: "var(--text-muted)",
                    marginBottom: 16,
                  }}
                >
                  {s.desc}
                </p>

                {/* Detail chip */}
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "var(--ocean-500)",
                    background: "rgba(39,114,160,0.06)",
                    border: "1px solid rgba(39,114,160,0.12)",
                    padding: "3px 8px",
                    display: "inline-block",
                  }}
                >
                  {s.detail}
                </span>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Bottom CTA */}
        <Reveal delay={0.2}>
          <div
            style={{
              border: `1px solid ${LINE}`,
              borderTop: "none",
              padding: "20px 28px",
              background: "var(--sky-100)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "var(--text-muted)",
              }}
            >
              Ready to get started? No credit card, no commitment.
            </span>
            <a
              href="/api/mock-auth?mode=trial&next=%2Fdashboard"
              style={{
                height: 40,
                padding: "0 22px",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "var(--ocean-500)",
                color: "white",
                textDecoration: "none",
                fontSize: 11,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                transition: "background 0.2s, transform 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "var(--ocean-600)";
                (e.currentTarget as HTMLElement).style.transform =
                  "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "var(--ocean-500)";
                (e.currentTarget as HTMLElement).style.transform =
                  "translateY(0)";
              }}
            >
              Start for free →
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
