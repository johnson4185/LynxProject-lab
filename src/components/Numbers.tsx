"use client";
import { useEffect, useRef, useState } from "react";
import Reveal from "./Reveal";
import { BarChart2, Users, Activity, Star } from "lucide-react";

const LINE = "rgba(39,114,160,0.15)";

const STATS = [
  {
    value: 1.2,
    suffix: "B+",
    label: "Links Shortened",
    sub: "per year across platform",
    idx: "01",
    icon: <BarChart2 size={15} />,
    trend: "+24% vs last year",
    accent: "var(--ocean-500)",
  },
  {
    value: 42,
    suffix: "K+",
    label: "Active Teams",
    sub: "from startups to Fortune 500",
    idx: "02",
    icon: <Users size={15} />,
    trend: "+8K this quarter",
    accent: "var(--ocean-400)",
  },
  {
    value: 99.99,
    suffix: "%",
    label: "Uptime SLA",
    sub: "guaranteed reliability",
    idx: "03",
    icon: <Activity size={15} />,
    trend: "Zero incidents in 2025",
    accent: "var(--sage)",
  },
  {
    value: 4.9,
    suffix: "/5",
    label: "G2 Rating",
    sub: "from 3,200+ verified reviews",
    idx: "04",
    icon: <Star size={15} />,
    trend: "#1 in Link Management",
    accent: "var(--amber)",
  },
];

function CountUp({ target, suffix }: { target: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start: number | null = null;
          const duration = 1800;
          const tick = (ts: number) => {
            if (!start) start = ts;
            const progress = Math.min((ts - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(+(eased * target).toFixed(target < 10 ? 2 : 0));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          obs.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

export default function Numbers() {
  return (
    <section
      style={{
        background: "linear-gradient(180deg, #ffffff 0%, var(--sky-100) 100%)",
        borderTop: `1px solid ${LINE}`,
        borderBottom: `1px solid ${LINE}`,
        padding: "72px 48px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Section header */}
        <Reveal>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 36,
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
              By the numbers
            </span>
            <div style={{ flex: 1, height: 1, background: LINE }} />
          </div>
        </Reveal>

        <Reveal>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              border: `1px solid ${LINE}`,
            }}
          >
            {STATS.map((s, i) => (
              <div
                key={s.label}
                style={{
                  padding: "36px 28px 32px",
                  borderRight:
                    i < STATS.length - 1 ? `1px solid ${LINE}` : undefined,
                  position: "relative",
                  overflow: "hidden",
                  transition: "background 0.3s, box-shadow 0.3s",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "rgba(39,114,160,0.05)";
                  el.style.boxShadow = "inset 0 0 0 1px rgba(39,114,160,0.16)";
                  const bar = el.querySelector(".stat-top") as HTMLElement;
                  if (bar) bar.style.transform = "scaleX(1)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "transparent";
                  el.style.boxShadow = "none";
                  const bar = el.querySelector(".stat-top") as HTMLElement;
                  if (bar) bar.style.transform = "scaleX(0)";
                }}
              >
                {/* Top accent sweep bar */}
                <div
                  className="stat-top"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: `linear-gradient(90deg, ${s.accent}, transparent)`,
                    transform: "scaleX(0)",
                    transformOrigin: "left",
                    transition: "transform 0.45s var(--ease-spring)",
                  }}
                />

                {/* Ghost index */}
                <div
                  style={{
                    position: "absolute",
                    bottom: -14,
                    right: 6,
                    fontFamily: "var(--font-display)",
                    fontSize: 96,
                    lineHeight: 1,
                    color: "rgba(39,114,160,0.04)",
                    fontWeight: 900,
                    pointerEvents: "none",
                    userSelect: "none",
                  }}
                >
                  {s.idx}
                </div>

                {/* Icon + label row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 18,
                  }}
                >
                  <span style={{ color: s.accent, display: "flex", alignItems: "center" }}>
                    {s.icon}
                  </span>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.15em",
                      color: "var(--ocean-400)",
                    }}
                  >
                    {s.label}
                  </div>
                </div>

                {/* Main value */}
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(38px, 4.5vw, 60px)",
                    fontWeight: 900,
                    letterSpacing: "-0.02em",
                    color: "var(--ink)",
                    lineHeight: 1,
                    marginBottom: 8,
                  }}
                >
                  <CountUp target={s.value} suffix={s.suffix} />
                </div>

                {/* Sub label */}
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--text-muted)",
                    marginBottom: 16,
                    letterSpacing: "0.02em",
                    lineHeight: 1.5,
                  }}
                >
                  {s.sub}
                </div>

                {/* Trend chip */}
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--ocean-600)",
                    background: "rgba(39,114,160,0.07)",
                    border: "1px solid rgba(39,114,160,0.12)",
                    padding: "3px 8px",
                  }}
                >
                  <span
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      background: s.accent,
                      display: "inline-block",
                      flexShrink: 0,
                    }}
                  />
                  {s.trend}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
