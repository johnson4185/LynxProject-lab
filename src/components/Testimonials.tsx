"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const LINE = "rgba(39,114,160,0.16)";

const TESTIMONIALS = [
  {
    quote:
      "We went from 3 different link tools to just one. The analytics alone saved us hours every week.",
    name: "Johnson Varghese",
    role: "Head of Growth",
    company: "TechCorp",
    initials: "JV",
  },
  {
    quote:
      "Custom domains changed how our audience sees us. Every link now reinforces the brand.",
    name: "Jaison Joseph",
    role: "Marketing Director",
    company: "ScaleUp",
    initials: "JJ",
  },
  {
    quote:
      "Set up in 5 minutes. The HubSpot integration made campaign tracking effortless from day one.",
    name: "Joshua KJ",
    role: "CTO",
    company: "Launchpad Studio",
    initials: "JK",
  },
  {
    quote:
      "Our paid social team now sees clean attribution by campaign without exporting spreadsheets.",
    name: "Maya Fernandez",
    role: "Performance Lead",
    company: "Nexa Commerce",
    initials: "MF",
  },
  {
    quote:
      "The QR workflows helped our offline events generate measurable traffic in real time.",
    name: "Rohit Menon",
    role: "Demand Gen Manager",
    company: "Flowbit",
    initials: "RM",
  },
  {
    quote:
      "Governance controls and team workspaces made enterprise rollout surprisingly smooth.",
    name: "Elena Park",
    role: "Director of Digital",
    company: "Astera Health",
    initials: "EP",
  },
];

const Stars = ({ highlight }: { highlight: boolean }) => (
  <div style={{ display: "flex", gap: 3, marginBottom: 20 }}>
    {[...Array(5)].map((_, i) => (
      <svg
        key={i}
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill={highlight ? "var(--ocean-700)" : "var(--ocean-300)"}
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ))}
  </div>
);

export default function Testimonials() {
  const railRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(1);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const first = rail.firstElementChild as HTMLElement | null;
    if (!first) return;
    rail.scrollLeft = first.offsetWidth;
  }, []);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const timer = window.setInterval(() => {
      const firstCard = el.firstElementChild as HTMLElement | null;
      if (!firstCard) return;
      const amount = firstCard.offsetWidth;
      const maxScroll = el.scrollWidth - el.clientWidth;
      const next = el.scrollLeft + amount;
      if (next >= maxScroll - 4) {
        el.scrollTo({ left: 0, behavior: "smooth" });
        setActiveIndex(0);
        return;
      }
      el.scrollBy({ left: amount, behavior: "smooth" });
    }, 4000);
    return () => window.clearInterval(timer);
  }, []);

  const handleScroll = () => {
    const el = railRef.current;
    if (!el) return;
    const firstCard = el.firstElementChild as HTMLElement | null;
    if (!firstCard) return;
    const cardWidth = firstCard.offsetWidth;
    const centered =
      (el.scrollLeft + el.clientWidth / 2 - cardWidth / 2) / cardWidth;
    const idx = Math.max(
      0,
      Math.min(TESTIMONIALS.length - 1, Math.round(centered))
    );
    if (idx !== activeIndex) setActiveIndex(idx);
  };

  const handleNext = () => {
    const el = railRef.current;
    if (!el) return;
    const firstCard = el.firstElementChild as HTMLElement | null;
    if (!firstCard) return;
    const amount = firstCard.offsetWidth;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const next = el.scrollLeft + amount;
    if (next >= maxScroll - 4) {
      el.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  const handlePrev = () => {
    const el = railRef.current;
    if (!el) return;
    const firstCard = el.firstElementChild as HTMLElement | null;
    if (!firstCard) return;
    const amount = firstCard.offsetWidth;
    const next = el.scrollLeft - amount;
    if (next <= 0) {
      const maxScroll = el.scrollWidth - el.clientWidth;
      el.scrollTo({ left: maxScroll, behavior: "smooth" });
      return;
    }
    el.scrollBy({ left: -amount, behavior: "smooth" });
  };

  return (
    <section
      style={{
        padding: "20px 0 24px",
        overflow: "hidden",
        background: "var(--background)",
        borderTop: `1px solid ${LINE}`,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "0 48px 20px",
          maxWidth: 1248,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            gap: 14,
            marginBottom: 16,
          }}
        >
          <div style={{ height: 1, background: LINE }} />
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--ocean-500)",
            }}
          >
            Customer Stories
          </span>
          <div style={{ height: 1, background: LINE }} />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(40px, 5.2vw, 76px)",
              lineHeight: 0.94,
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              color: "var(--ocean-900)",
              fontWeight: 900,
            }}
          >
            Teams That
            <br />
            <span style={{ color: "var(--ocean-400)" }}>Love</span> URL.IFY
          </h2>

          {/* Nav buttons */}
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous story"
              style={{
                width: 44,
                height: 44,
                border: `1.5px solid ${LINE}`,
                background: "#fff",
                color: "var(--ocean-500)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "var(--ocean-500)";
                (e.currentTarget as HTMLElement).style.color = "#fff";
                (e.currentTarget as HTMLElement).style.borderColor =
                  "var(--ocean-500)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#fff";
                (e.currentTarget as HTMLElement).style.color =
                  "var(--ocean-500)";
                (e.currentTarget as HTMLElement).style.borderColor = LINE;
              }}
            >
              <ChevronLeft size={18} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next story"
              style={{
                width: 44,
                height: 44,
                border: `1.5px solid ${LINE}`,
                background: "#fff",
                color: "var(--ocean-500)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "var(--ocean-500)";
                (e.currentTarget as HTMLElement).style.color = "#fff";
                (e.currentTarget as HTMLElement).style.borderColor =
                  "var(--ocean-500)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#fff";
                (e.currentTarget as HTMLElement).style.color =
                  "var(--ocean-500)";
                (e.currentTarget as HTMLElement).style.borderColor = LINE;
              }}
            >
              <ChevronRight size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Carousel rail */}
      <div
        ref={railRef}
        className="scrollbar-hide"
        onScroll={handleScroll}
        style={{
          display: "flex",
          overflowX: "auto",
          scrollBehavior: "smooth",
          scrollSnapType: "x mandatory",
          borderTop: `1px solid ${LINE}`,
          borderBottom: `1px solid ${LINE}`,
        }}
      >
        {TESTIMONIALS.map((t, i) => {
          const highlight = i === activeIndex;
          return (
            <article
              key={t.name}
              style={{
                minWidth: "clamp(540px, 60vw, 840px)",
                flexShrink: 0,
                scrollSnapAlign: "center",
                padding: "32px 36px 36px",
                borderRight:
                  i < TESTIMONIALS.length - 1 ? `1px solid ${LINE}` : undefined,
                background: highlight
                  ? "linear-gradient(135deg, var(--ocean-100) 0%, var(--ocean-200) 100%)"
                  : "#ffffff",
                position: "relative",
                overflow: "hidden",
                transition: "background 0.32s ease",
              }}
            >
              {/* Decorative large quote mark */}
              <span
                className="quote-mark"
                style={{
                  position: "absolute",
                  top: 16,
                  right: 24,
                  opacity: highlight ? 0.18 : 0.09,
                  transition: "opacity 0.32s",
                  lineHeight: 0.7,
                  color: "var(--ocean-500)",
                }}
              >
                &ldquo;
              </span>

              <Stars highlight={highlight} />

              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(17px, 1.5vw, 22px)",
                  lineHeight: 1.3,
                  letterSpacing: "-0.005em",
                  textTransform: "uppercase",
                  color: "var(--ocean-900)",
                  marginBottom: 24,
                  maxWidth: 600,
                  fontWeight: 800,
                  fontStyle: "italic",
                }}
              >
                &ldquo;{t.quote}&rdquo;
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* Square avatar */}
                <div
                  style={{
                    width: 42,
                    height: 42,
                    background: highlight
                      ? "var(--ocean-700)"
                      : "var(--ocean-500)",
                    color: "#ffffff",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 15,
                    fontFamily: "var(--font-display)",
                    flexShrink: 0,
                    transition: "background 0.32s",
                  }}
                >
                  {t.initials}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: "var(--ocean-900)",
                      lineHeight: 1.1,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {t.name}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      lineHeight: 1.4,
                      marginTop: 2,
                    }}
                  >
                    {t.role}{" "}
                    <span
                      style={{
                        opacity: 0.5,
                        margin: "0 4px",
                      }}
                    >
                      ·
                    </span>{" "}
                    <span
                      style={{
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        fontSize: 10,
                      }}
                    >
                      {t.company}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Dot pagination */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 6,
          paddingTop: 20,
        }}
      >
        {TESTIMONIALS.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              const el = railRef.current;
              if (!el) return;
              const firstCard = el.firstElementChild as HTMLElement | null;
              if (!firstCard) return;
              el.scrollTo({
                left: i * firstCard.offsetWidth,
                behavior: "smooth",
              });
              setActiveIndex(i);
            }}
            style={{
              width: i === activeIndex ? 24 : 6,
              height: 6,
              background:
                i === activeIndex ? "var(--ocean-500)" : "var(--sky-400)",
              border: "none",
              cursor: "pointer",
              transition: "all 0.3s var(--ease-spring)",
              padding: 0,
            }}
          />
        ))}
      </div>
    </section>
  );
}
