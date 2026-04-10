"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Link2, Megaphone, QrCode, Globe, BarChart2,
  Users, Puzzle, Settings, CreditCard, ChevronLeft,
  Zap, Building2, HelpCircle, ChevronRight as ChevronRt,
  Activity, ShieldCheck,
} from "lucide-react";

type NavItem = { label: string; href: string; icon: React.ElementType; badge: string | null };
type NavSection = { label: string; items: NavItem[] };

/* ─── Nav structure ─────────────────────────────────────────────────────── */
const NAV_SECTIONS: NavSection[] = [
  {
    label: "Main",
    items: [
      { label: "Overview",   href: "/dashboard",            icon: LayoutDashboard, badge: null },
      { label: "Links",      href: "/dashboard/links",      icon: Link2,           badge: null },
      { label: "Campaigns",  href: "/dashboard/campaigns",  icon: Megaphone,       badge: null },
      { label: "QR Codes",   href: "/dashboard/qrcodes",    icon: QrCode,          badge: null },
      { label: "Domains",    href: "/dashboard/domains",    icon: Globe,           badge: null },
      { label: "Analytics",  href: "/dashboard/analytics",  icon: BarChart2,       badge: null },
      { label: "HMAC Links", href: "/dashboard/hmac",        icon: ShieldCheck,     badge: null },
    ],
  },
  {
    label: "Workspace",
    items: [
      { label: "Team",         href: "/dashboard/team",         icon: Users,     badge: null },
      { label: "Integrations", href: "/dashboard/integrations", icon: Puzzle,    badge: null },
      { label: "Usage",        href: "/dashboard/usage",        icon: Activity,  badge: null },
      { label: "Settings",     href: "/dashboard/settings",     icon: Settings,  badge: null },
      { label: "Billing",      href: "/dashboard/billing",      icon: CreditCard, badge: null },
    ],
  },
];

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

/* ─── Colour helper for badge ───────────────────────────────────────────── */
function badgeStyle(badge: string | null) {
  if (!badge) return null;
  const isAlert = badge.endsWith("!");
  return {
    background: isAlert ? "var(--coral)" : "var(--ocean-400)",
    color: "#fff",
    fontSize: 9,
    fontWeight: 800,
    padding: "1px 5px",
    letterSpacing: "0.04em",
    minWidth: 16,
    textAlign: "center" as const,
    flexShrink: 0,
  };
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const linkStyle = (active: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: collapsed ? "9px 0" : "8px 16px 8px 18px",
    justifyContent: collapsed ? "center" : "flex-start",
    background: active ? "rgba(39,114,160,0.30)" : "transparent",
    borderLeft: !collapsed ? (active ? "2px solid var(--ocean-300)" : "2px solid transparent") : "none",
    color: active ? "#fff" : "rgba(255,255,255,0.55)",
    fontSize: 13,
    fontWeight: active ? 700 : 400,
    letterSpacing: "0.01em",
    transition: "all 0.13s ease",
    textDecoration: "none",
    whiteSpace: "nowrap",
    position: "relative",
  });

  return (
    <aside
      style={{
        position: "fixed",
        left: 0, top: 0, bottom: 0,
        width: collapsed ? 60 : 224,
        background: "#0E2D47",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.22s cubic-bezier(0.25,0.46,0.45,0.94)",
        zIndex: 100,
        overflow: "hidden",
      }}
    >
      {/* ── Logo row ──────────────────────────────────────────────────────── */}
      <div
        style={{
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          padding: collapsed ? "0" : "0 14px 0 18px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          flexShrink: 0,
        }}
      >
        {collapsed ? (
          <button onClick={onToggle} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 30, height: 30, background: "var(--ocean-500)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={16} color="#fff" strokeWidth={2.5} />
            </div>
          </button>
        ) : (
          <>
            <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
              <div style={{ width: 30, height: 30, background: "var(--ocean-500)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Zap size={16} color="#fff" strokeWidth={2.5} />
              </div>
              <span style={{ fontFamily: "var(--font-nativera)", fontWeight: 700, fontSize: 18, color: "#fff", letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
                url.ify
              </span>
            </Link>
            <button
              onClick={onToggle}
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", cursor: "pointer", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              aria-label="Collapse sidebar"
            >
              <ChevronLeft size={13} />
            </button>
          </>
        )}
      </div>

      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <nav
        style={{
          flex: 1,
          padding: "8px 0",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          overflowX: "hidden",
          scrollbarWidth: "none",
        }}
      >
        {NAV_SECTIONS.map((section, si) => (
          <div key={section.label} style={{ marginBottom: 4 }}>
            {/* Section label */}
            {!collapsed && (
              <div style={{ padding: si === 0 ? "6px 18px 4px" : "10px 18px 4px", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
                {section.label}
              </div>
            )}
            {collapsed && si > 0 && (
              <div style={{ margin: "6px 10px", height: 1, background: "rgba(255,255,255,0.07)" }} />
            )}

            {section.items.map(({ label, href, icon: Icon, badge }) => {
              const active = isActive(href);
              const bs = badgeStyle(badge);
              return (
                <Link
                  key={href}
                  href={href}
                  style={linkStyle(active)}
                  title={collapsed ? label : undefined}
                  onMouseEnter={(e) => {
                    if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                  }}
                  onMouseLeave={(e) => {
                    if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  <Icon size={16} strokeWidth={active ? 2.2 : 1.7} style={{ flexShrink: 0, color: active ? "#fff" : "rgba(255,255,255,0.5)" }} />
                  {!collapsed && (
                    <>
                      <span style={{ flex: 1 }}>{label}</span>
                      {bs && <span style={bs}>{badge!.replace("!", "")}</span>}
                    </>
                  )}
                  {collapsed && bs && (
                    <div style={{ position: "absolute", top: 6, right: 6, width: 6, height: 6, background: bs.background, borderRadius: "50%" }} />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Bottom: plan badge + help + notifications ──────────────────────── */}
      {!collapsed && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "10px 12px", flexShrink: 0 }}>
          {/* Enterprise badge */}
          <Link
            href="/dashboard/billing"
            style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "rgba(39,114,160,0.18)",
              border: "1px solid rgba(39,114,160,0.3)",
              padding: "10px 12px",
              textDecoration: "none",
              marginBottom: 8,
            }}
          >
            <div style={{ width: 28, height: 28, background: "var(--ocean-600)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Building2 size={14} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "var(--ocean-300)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Enterprise</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 1 }}>Unlimited · All features</div>
            </div>
            <ChevronRt size={12} color="rgba(255,255,255,0.3)" />
          </Link>

          {/* Help */}
          <button
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 7, padding: "7px 10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.45)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-body)" }}
          >
            <HelpCircle size={13} /> Help & support
          </button>
        </div>
      )}

      {/* Collapsed bottom */}
      {collapsed && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "10px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <Link href="/dashboard/billing" title="Enterprise plan" style={{ width: 32, height: 32, background: "var(--ocean-600)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
            <Building2 size={15} color="#fff" />
          </Link>
          <button title="Help" style={{ width: 32, height: 32, background: "rgba(255,255,255,0.04)", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <HelpCircle size={14} />
          </button>
        </div>
      )}
    </aside>
  );
}
