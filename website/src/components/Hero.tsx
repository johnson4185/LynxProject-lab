"use client";

import { ArrowRight, Play, TrendingUp, Globe, Zap } from "lucide-react";
import Link from "next/link";
import Reveal from "./Reveal";
import ShortenLinkCard from "./ShortenLinkCard";

const LINE = "rgba(39,114,160,0.15)";

export default function Hero() {
  return (
    <section
      style={{
        minHeight: "100vh",
        padding: "96px 48px 72px",
        background: "var(--background)",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      {/* Dot grid background */}
      <div
        className="dot-grid"
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.65,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Radial glow top-right */}
      <div
        style={{
          position: "absolute",
          top: -120,
          right: "15%",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(39,114,160,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Radial glow bottom-left */}
      <div
        style={{
          position: "absolute",
          bottom: -80,
          left: "5%",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(39,114,160,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Vertical rule right */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: "22%",
          bottom: 0,
          width: 1,
          background: LINE,
          zIndex: 0,
        }}
      />

      {/* Vertical rule left accent */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "8%",
          bottom: 0,
          width: 1,
          background: LINE,
          zIndex: 0,
          opacity: 0.5,
        }}
      />

      {/* Registration corner marks */}
      <div className="reg-corner tl" />
      <div className="reg-corner br" />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: 1360,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div
          className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_580px]"
          style={{ gap: 64, alignItems: "center" }}
        >
          {/* Left Copy */}
          <div style={{ maxWidth: 760 }}>
            {/* Eyebrow */}
            <Reveal delay={0}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 22,
                }}
              >
                <span
                  style={{
                    width: 46,
                    height: 2,
                    background: "var(--ocean-400)",
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--ocean-600)",
                  }}
                >
                  Trusted by 42,000+ teams worldwide
                </span>
              </div>
            </Reveal>

            {/* Mega headline */}
            <Reveal delay={0.08}>
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 900,
                  fontSize: "clamp(52px, 8vw, 120px)",
                  lineHeight: 0.86,
                  letterSpacing: "-0.028em",
                  textTransform: "uppercase",
                  marginBottom: 28,
                }}
              >
                <span
                  style={{
                    color: "var(--ocean-700)",
                    display: "block",
                  }}
                >
                  EVERY LINK
                </span>
                <span
                  style={{
                    display: "block",
                    color: "var(--ocean-400)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  TELLS A
                </span>
                <span
                  style={{
                    display: "block",
                    color: "transparent",
                    WebkitTextStroke: "2.5px var(--ocean-500)",
                    letterSpacing: "-0.014em",
                    lineHeight: 0.92,
                    fontWeight: 900,
                  }}
                >
                  STORY
                </span>
              </h1>
            </Reveal>

            {/* Description */}
            <Reveal delay={0.16}>
              <p
                style={{
                  fontSize: 17,
                  fontWeight: 500,
                  lineHeight: 1.75,
                  color: "var(--text-secondary)",
                  maxWidth: 540,
                  marginBottom: 32,
                  letterSpacing: "0.005em",
                }}
              >
                Turn every URL into a performance channel — not just a
                redirect. Brand it, launch it, and watch every click reveal
                intent in real time. Built for teams who optimise by signal,
                not guesswork.
              </p>
            </Reveal>

            {/* CTAs */}
            <Reveal delay={0.22}>
              <div
                style={{
                  display: "flex",
                  gap: 14,
                  alignItems: "center",
                  marginBottom: 36,
                  flexWrap: "wrap",
                }}
              >
                <Link
                  href="/api/mock-auth?mode=trial&next=%2Fdashboard"
                  style={{
                    height: 54,
                    padding: "0 36px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    background: "var(--ocean-500)",
                    color: "white",
                    textDecoration: "none",
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    clipPath:
                      "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
                    transition: "background 0.2s, transform 0.2s, box-shadow 0.2s",
                    boxShadow: "0 8px 24px rgba(39,114,160,0.3)",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      "var(--ocean-400)";
                    (e.currentTarget as HTMLElement).style.transform =
                      "translateY(-2px) scale(1.01)";
                    (e.currentTarget as HTMLElement).style.boxShadow =
                      "0 14px 32px rgba(39,114,160,0.38)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      "var(--ocean-500)";
                    (e.currentTarget as HTMLElement).style.transform =
                      "translateY(0) scale(1)";
                    (e.currentTarget as HTMLElement).style.boxShadow =
                      "0 8px 24px rgba(39,114,160,0.3)";
                  }}
                >
                  Start 7-Day Trial{" "}
                  <ArrowRight size={16} style={{ flexShrink: 0 }} />
                </Link>

                <button
                  style={{
                    height: 54,
                    padding: "0 28px",
                    background: "none",
                    color: "var(--ocean-700)",
                    border: "1.5px solid var(--border)",
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor =
                      "var(--ocean-400)";
                    (e.currentTarget as HTMLElement).style.background =
                      "rgba(39,114,160,0.06)";
                    (e.currentTarget as HTMLElement).style.transform =
                      "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor =
                      "var(--border)";
                    (e.currentTarget as HTMLElement).style.background = "none";
                    (e.currentTarget as HTMLElement).style.transform =
                      "translateY(0)";
                  }}
                >
                  <Play size={14} fill="currentColor" /> Watch Demo
                </button>
              </div>
            </Reveal>

            {/* Trust row */}
            <Reveal delay={0.3}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0,
                  flexWrap: "wrap",
                  paddingTop: 24,
                  borderTop: `1px solid ${LINE}`,
                }}
              >
                {[
                  {
                    icon: <TrendingUp size={12} />,
                    text: "1.2B links shortened",
                    blink: true,
                  },
                  {
                    icon: <Zap size={12} />,
                    text: "99.99% uptime",
                    blink: false,
                  },
                  {
                    icon: <Globe size={12} />,
                    text: "SOC 2 Certified",
                    blink: false,
                  },
                ].map((t, i) => (
                  <div
                    key={t.text}
                    style={{ display: "flex", alignItems: "center" }}
                  >
                    {i > 0 && (
                      <div
                        style={{
                          width: 1,
                          height: 24,
                          background: LINE,
                          margin: "0 22px",
                        }}
                      />
                    )}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--text-muted)",
                        letterSpacing: "0.04em",
                      }}
                    >
                      <span
                        style={{
                          color: "var(--ocean-400)",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {t.icon}
                      </span>
                      {t.text}
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Right ShortenLinkCard */}
          <div className="hidden lg:block">
            <Reveal delay={0.15} direction="scale">
              <div style={{ position: "relative" }}>
                {/* Live badge */}
                <div
                  style={{
                    position: "absolute",
                    top: -13,
                    right: 16,
                    zIndex: 10,
                    background: "var(--ocean-500)",
                    color: "white",
                    height: 26,
                    padding: "0 10px",
                    fontSize: 9,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    boxShadow: "0 4px 14px rgba(39,114,160,0.3)",
                  }}
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: "white",
                      animation: "blink 1.5s ease-in-out infinite",
                    }}
                  />
                  Live Platform
                </div>

                {/* Glow ring around card */}
                <div
                  style={{
                    position: "absolute",
                    inset: -2,
                    background: "transparent",
                    border: "1px solid rgba(39,114,160,0.15)",
                    pointerEvents: "none",
                  }}
                />

                <ShortenLinkCard />
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="hidden lg:flex"
        style={{
          position: "absolute",
          bottom: 28,
          left: "50%",
          transform: "translateX(-50%)",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          zIndex: 2,
        }}
      >
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.16em",
            color: "var(--text-muted)",
          }}
        >
          SCROLL
        </span>
        <div
          style={{
            width: 1,
            height: 36,
            background: "linear-gradient(180deg, var(--ocean-400), transparent)",
            animation: "scrollPulse 2.4s ease-in-out infinite",
          }}
        />
      </div>
    </section>
  );
}
