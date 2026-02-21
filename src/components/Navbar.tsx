"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ArrowRight, Menu, X } from "lucide-react";

const NAV = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Enterprise", href: "#enterprise" },
  { label: "Docs", href: "#docs" },
];

const LINE = "rgba(255,255,255,0.3)";
const CHROME_BG = "#1D5A82";

function NavLink({ label, href }: { label: string; href: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={href}
      style={{
        position: "relative", height: 68, padding: "0 20px",
        display: "inline-flex", alignItems: "center",
        fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase",
        color: hovered ? "var(--ocean-100)" : "#ffffff",
        background: hovered ? "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%)" : "transparent",
        border: hovered ? "1px solid rgba(255,255,255,0.24)" : "1px solid transparent",
        borderRadius: 0,
        textDecoration: "none",
        transition: "color 0.2s, background 0.2s, border-color 0.2s",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {label}
      <span style={{
        position: "absolute", bottom: 0,
        left: hovered ? 20 : "50%", right: hovered ? 20 : "50%",
        height: 2, background: "var(--ocean-100)",
        transition: "left 0.26s cubic-bezier(0.16,1,0.3,1), right 0.26s cubic-bezier(0.16,1,0.3,1)",
        opacity: hovered ? 1 : 0,
      }} />
    </a>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
      background: CHROME_BG,
      borderBottom: `1px solid ${LINE}`,
      boxShadow: scrolled ? "0 0 0 rgba(0,0,0,0)" : "0 0 0 rgba(0,0,0,0)",
      transition: "background 0.3s",
    }}>
      <div style={{
        maxWidth: 1300, margin: "0 auto", padding: "0 48px", height: 68,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>

        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", flexShrink: 0 }}>
          <div style={{
            width: 32, height: 32,
            border: "1px solid rgba(255,255,255,0.38)",
            background: "rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M9.4 14.6 7.2 16.8a3.1 3.1 0 1 1-4.4-4.4l2.2-2.2a3.1 3.1 0 0 1 4.4 0" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14.6 9.4 16.8 7.2a3.1 3.1 0 1 1 4.4 4.4L19 13.8a3.1 3.1 0 0 1-4.4 0" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="m8.5 15.5 7-7" stroke="rgba(255,255,255,0.85)" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="18.8" cy="5.2" r="1.2" fill="var(--ocean-200)" />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 2 }}>
            <span style={{ fontFamily: "var(--font-nativera)", fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1, color: "#ffffff" }}>
              url<span style={{ color: "var(--ocean-200)" }}>.ify</span>
            </span>
          </div>
        </Link>

        {/* Nav */}
        <nav className="hidden lg:flex" style={{ alignItems: "center", flex: 1, justifyContent: "center" }}>
          {NAV.map(n => <NavLink key={n.label} label={n.label} href={n.href} />)}
        </nav>

        {/* CTAs */}
        <div className="hidden lg:flex" style={{ gap: 16, alignItems: "center", flexShrink: 0 }}>
          <a href="/auth?next=%2Fdashboard" style={{
            height: 40, padding: "0 22px", display: "inline-flex", alignItems: "center",
            background: "none", border: `1px solid ${LINE}`, color: "#ffffff",
            fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 800,
            textTransform: "uppercase", letterSpacing: "0.08em", textDecoration: "none",
            transition: "all 0.18s",
            boxShadow: "0 1px 0 rgba(255,255,255,0.1), inset 0 0 0 1px rgba(255,255,255,0.03)",
          }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.color = "#ffffff";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.78)";
              (e.currentTarget as HTMLElement).style.background = "linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.06) 100%)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 12px rgba(7,27,44,0.16), inset 0 0 0 1px rgba(255,255,255,0.1)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.color = "#ffffff";
              (e.currentTarget as HTMLElement).style.borderColor = LINE;
              (e.currentTarget as HTMLElement).style.background = "none";
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 0 rgba(255,255,255,0.1), inset 0 0 0 1px rgba(255,255,255,0.03)";
            }}
          >
            Sign In
          </a>
          <a href="/api/mock-auth?mode=trial&next=%2Fdashboard" style={{
            height: 40, minWidth: 150, padding: "0 28px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
            background: "var(--sky-100)", color: "var(--ocean-600)",
            border: "1px solid rgba(244,248,252,0.95)",
            outline: "1px solid rgba(39,114,160,0.32)",
            outlineOffset: "-1px",
            fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 800,
            textTransform: "uppercase", letterSpacing: "0.08em", textDecoration: "none",
            transition: "all 0.2s",
            boxShadow: "0 1px 0 rgba(255,255,255,0.08)",
            position: "relative",
            overflow: "visible",
          }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = "var(--background)";
              (e.currentTarget as HTMLElement).style.borderColor = "var(--ocean-300)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 26px rgba(7,27,44,0.26), 0 0 0 1px rgba(91,156,206,0.42), 0 0 18px rgba(91,156,206,0.45), inset 0 0 14px rgba(91,156,206,0.28)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "var(--sky-100)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(244,248,252,0.95)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 0 rgba(255,255,255,0.08)";
            }}
          >
            Get Started <ArrowRight size={12} />
          </a>
        </div>

        {/* Mobile toggle */}
        <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu"
          style={{ background: "none", border: "none", cursor: "pointer", color: "#ffffff", padding: 6 }}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      <div style={{
        overflow: "hidden", maxHeight: open ? "400px" : "0",
        transition: "max-height 0.32s cubic-bezier(0.16,1,0.3,1)",
        background: CHROME_BG, borderTop: open ? `1px solid ${LINE}` : "none",
      }}>
        <div style={{ padding: "12px 32px 24px" }}>
          {NAV.map(n => (
            <a key={n.label} href={n.href} onClick={() => setOpen(false)} style={{
              display: "block", padding: "13px 0", fontSize: 11, fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.9)", borderBottom: `1px solid ${LINE}`, textDecoration: "none",
            }}>
              {n.label}
            </a>
          ))}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
            <a href="/auth?next=%2Fdashboard" style={{
              display: "flex", justifyContent: "center", alignItems: "center", height: 42,
              border: `1px solid ${LINE}`, color: "rgba(255,255,255,0.9)",
              fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", textDecoration: "none",
            }}>Sign In</a>
            <a href="/api/mock-auth?mode=trial&next=%2Fdashboard" style={{
              display: "flex", justifyContent: "center", alignItems: "center", gap: 6, height: 42,
              background: "var(--sky-100)", color: "var(--ocean-600)",
              border: "1px solid rgba(244,248,252,0.95)",
              outline: "1px solid rgba(39,114,160,0.32)",
              outlineOffset: "-1px",
              fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", textDecoration: "none",
              position: "relative", overflow: "visible",
            }}>
              Get Started <ArrowRight size={12} />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}



