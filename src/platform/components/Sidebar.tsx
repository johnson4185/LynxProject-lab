"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Link2,
  Megaphone,
  QrCode,
  Globe,
  BarChart2,
  Users,
  Puzzle,
  Settings,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";

const NAV = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Links", href: "/dashboard/links", icon: Link2 },
  { label: "Campaigns", href: "/dashboard/campaigns", icon: Megaphone },
  { label: "QR Codes", href: "/dashboard/qrcodes", icon: QrCode },
  { label: "Domains", href: "/dashboard/domains", icon: Globe },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart2 },
];

const SECONDARY = [
  { label: "Team", href: "/dashboard/team", icon: Users },
  { label: "Integrations", href: "/dashboard/integrations", icon: Puzzle },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
  { label: "Billing", href: "/dashboard/billing", icon: CreditCard },
];

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        width: collapsed ? 64 : 220,
        background: "#144466",
        borderRight: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.22s cubic-bezier(0.25,0.46,0.45,0.94)",
        zIndex: 100,
        overflow: "hidden",
      }}
    >
      {/* Logo row */}
      <div
        style={{
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          padding: collapsed ? "0" : "0 16px 0 20px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          flexShrink: 0,
        }}
      >
        {!collapsed && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                background: "var(--ocean-500)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Zap size={15} color="#fff" strokeWidth={2.5} />
            </div>
            <span
              style={{
                fontFamily: "var(--font-nativera)",
                fontWeight: 700,
                fontSize: 17,
                color: "#fff",
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
              }}
            >
              url.ify
            </span>
          </div>
        )}
        {collapsed && (
          <div
            style={{
              width: 28,
              height: 28,
              background: "var(--ocean-500)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Zap size={15} color="#fff" strokeWidth={2.5} />
          </div>
        )}
        {!collapsed && (
          <button
            onClick={onToggle}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "none",
              color: "rgba(255,255,255,0.55)",
              cursor: "pointer",
              width: 24,
              height: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
            aria-label="Collapse sidebar"
          >
            <ChevronLeft size={14} />
          </button>
        )}
      </div>

      {/* Collapsed expand button */}
      {collapsed && (
        <button
          onClick={onToggle}
          style={{
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.4)",
            cursor: "pointer",
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 4,
            flexShrink: 0,
          }}
          aria-label="Expand sidebar"
        >
          <ChevronRight size={14} />
        </button>
      )}

      {/* Primary nav */}
      <nav
        style={{
          flex: 1,
          padding: "12px 0",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {!collapsed && (
          <div
            style={{
              padding: "0 20px 6px",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.3)",
            }}
          >
            Main
          </div>
        )}
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: collapsed ? "10px 0" : "9px 20px",
                justifyContent: collapsed ? "center" : "flex-start",
                background: active ? "rgba(39,114,160,0.35)" : "transparent",
                borderLeft: active && !collapsed ? "3px solid var(--ocean-300)" : collapsed ? "none" : "3px solid transparent",
                color: active ? "#fff" : "rgba(255,255,255,0.6)",
                fontSize: 14,
                fontWeight: active ? 700 : 500,
                letterSpacing: "0.01em",
                transition: "all 0.15s ease",
                textDecoration: "none",
                whiteSpace: "nowrap",
                position: "relative",
              }}
              title={collapsed ? label : undefined}
            >
              <Icon size={17} strokeWidth={active ? 2.5 : 1.8} style={{ flexShrink: 0 }} />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}

        <div style={{ margin: "10px 0", borderTop: "1px solid rgba(255,255,255,0.08)" }} />

        {!collapsed && (
          <div
            style={{
              padding: "0 20px 6px",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.3)",
            }}
          >
            Workspace
          </div>
        )}

        {SECONDARY.map(({ label, href, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: collapsed ? "10px 0" : "9px 20px",
                justifyContent: collapsed ? "center" : "flex-start",
                background: active ? "rgba(39,114,160,0.35)" : "transparent",
                borderLeft: active && !collapsed ? "3px solid var(--ocean-300)" : collapsed ? "none" : "3px solid transparent",
                color: active ? "#fff" : "rgba(255,255,255,0.6)",
                fontSize: 14,
                fontWeight: active ? 700 : 500,
                letterSpacing: "0.01em",
                transition: "all 0.15s ease",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
              title={collapsed ? label : undefined}
            >
              <Icon size={17} strokeWidth={active ? 2.5 : 1.8} style={{ flexShrink: 0 }} />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom plan badge */}
      {!collapsed && (
        <div
          style={{
            padding: "12px 16px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              background: "rgba(39,114,160,0.22)",
              border: "1px solid rgba(39,114,160,0.35)",
              padding: "10px 12px",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.55)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>
              Growth Plan
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
              4,248 / 10,000 clicks
            </div>
            <div
              style={{
                height: 3,
                background: "rgba(255,255,255,0.12)",
                marginTop: 6,
              }}
            >
              <div style={{ width: "42%", height: "100%", background: "var(--ocean-400)" }} />
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
