"use client";
import { ArrowRight, Shield, Zap, Star } from "lucide-react";
import Reveal from "./Reveal";

export default function FinalCTA() {
  return (
    <section
      style={{
        padding: "100px 48px",
        textAlign: "center",
        background: "var(--ocean-700)",
        position: "relative",
        overflow: "hidden",
        borderTop: `1px solid rgba(255,255,255,0.08)`,
      }}
    >
      {/* Dot grid overlay */}
      <div
        className="dot-grid-faint"
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.35,
          pointerEvents: "none",
        }}
      />

      {/* Radial glow center */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse 80% 70% at 50% 50%, rgba(7,27,44,0.4) 0%, transparent 65%)",
        }}
      />

      {/* Registration corner marks (white) */}
      <div
        style={{
          position: "absolute",
          top: 24,
          left: 24,
          width: 28,
          height: 28,
          pointerEvents: "none",
          opacity: 0.2,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 2,
            height: "100%",
            background: "#fff",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: 2,
            background: "#fff",
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          top: 24,
          right: 24,
          width: 28,
          height: 28,
          pointerEvents: "none",
          opacity: 0.2,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 2,
            height: "100%",
            background: "#fff",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "100%",
            height: 2,
            background: "#fff",
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 24,
          left: 24,
          width: 28,
          height: 28,
          pointerEvents: "none",
          opacity: 0.2,
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: 2,
            height: "100%",
            background: "#fff",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: 2,
            background: "#fff",
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 24,
          right: 24,
          width: 28,
          height: 28,
          pointerEvents: "none",
          opacity: 0.2,
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: 2,
            height: "100%",
            background: "#fff",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: "100%",
            height: 2,
            background: "#fff",
          }}
        />
      </div>

      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Section label */}
        <Reveal>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 22,
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 40,
                height: 1,
                background: "rgba(255,255,255,0.2)",
              }}
            />
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.22em",
                color: "var(--ocean-200)",
              }}
            >
              Get Started
            </span>
            <div
              style={{
                width: 40,
                height: 1,
                background: "rgba(255,255,255,0.2)",
              }}
            />
          </div>
        </Reveal>

        {/* Headline */}
        <Reveal delay={0.06}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 900,
              textTransform: "uppercase",
              fontSize: "clamp(52px,9vw,120px)",
              lineHeight: 0.88,
              letterSpacing: "-0.02em",
              color: "#ffffff",
              marginBottom: 20,
            }}
          >
            <span
              style={{
                display: "block",
                color: "transparent",
                WebkitTextStroke: "1.5px rgba(255,255,255,0.22)",
                opacity: 0.8,
              }}
            >
              STOP
            </span>
            <span style={{ display: "block" }}>GUESSING.</span>
            <span
              style={{ display: "block", color: "var(--ocean-200)" }}
            >
              START KNOWING.
            </span>
          </h2>
        </Reveal>

        {/* Description */}
        <Reveal delay={0.12}>
          <p
            style={{
              fontSize: 18,
              color: "rgba(255,255,255,0.72)",
              lineHeight: 1.75,
              maxWidth: 500,
              margin: "0 auto 36px",
              fontWeight: 500,
            }}
          >
            Join 68,000+ teams who trust url.ify to power their link
            intelligence. 7-day free trial. Scales to billions.
          </p>
        </Reveal>

        {/* CTAs */}
        <Reveal delay={0.18}>
          <div
            style={{
              display: "flex",
              gap: 14,
              justifyContent: "center",
              flexWrap: "wrap",
              marginBottom: 44,
            }}
          >
            <a
              href="/api/mock-auth?mode=trial&next=%2Fdashboard"
              style={{
                height: 58,
                padding: "0 48px",
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                background: "var(--sky-100)",
                color: "var(--ocean-700)",
                textDecoration: "none",
                fontFamily: "var(--font-body)",
                fontSize: 13,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                clipPath:
                  "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))",
                transition: "background 0.22s, transform 0.22s, box-shadow 0.22s",
                boxShadow: "0 12px 30px rgba(7,27,44,0.35)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#ffffff";
                (e.currentTarget as HTMLElement).style.transform =
                  "translateY(-2px) scale(1.01)";
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 18px 40px rgba(7,27,44,0.45)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "var(--sky-100)";
                (e.currentTarget as HTMLElement).style.transform =
                  "translateY(0) scale(1)";
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 12px 30px rgba(7,27,44,0.35)";
              }}
            >
              Get Started Free <ArrowRight size={16} />
            </a>

            <button
              style={{
                height: 58,
                padding: "0 36px",
                background: "none",
                color: "rgba(255,255,255,0.82)",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
                fontSize: 13,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                border: "1.5px solid rgba(255,255,255,0.22)",
                transition: "all 0.22s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor =
                  "rgba(255,255,255,0.55)";
                (e.currentTarget as HTMLElement).style.color = "#ffffff";
                (e.currentTarget as HTMLElement).style.background =
                  "rgba(255,255,255,0.06)";
                (e.currentTarget as HTMLElement).style.transform =
                  "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor =
                  "rgba(255,255,255,0.22)";
                (e.currentTarget as HTMLElement).style.color =
                  "rgba(255,255,255,0.82)";
                (e.currentTarget as HTMLElement).style.background = "none";
                (e.currentTarget as HTMLElement).style.transform =
                  "translateY(0)";
              }}
            >
              Schedule a Demo
            </button>
          </div>
        </Reveal>

        {/* Divider */}
        <Reveal delay={0.2}>
          <div
            style={{
              width: 60,
              height: 1,
              background: "rgba(255,255,255,0.16)",
              margin: "0 auto 32px",
            }}
          />
        </Reveal>

        {/* Trust badges */}
        <Reveal delay={0.24}>
          <div
            style={{
              display: "flex",
              gap: 36,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {[
              { Icon: Shield, text: "SOC 2 Type II" },
              { Icon: Zap, text: "99.99% Uptime" },
              { Icon: Star, text: "4.9 on G2" },
            ].map(({ Icon, text }) => (
              <div
                key={text}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.55)",
                  letterSpacing: "0.04em",
                }}
              >
                <Icon size={13} style={{ color: "var(--ocean-300)" }} />
                {text}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
