"use client";

import Link from "next/link";
import { Bell, Search, ChevronDown, Clock, Building2, Headphones } from "lucide-react";
import type { Workspace } from "../types/workspace";

type TopbarProps = {
  workspaceName: string;
  userName: string;
  workspacePlan: Workspace["plan"];
  trialDaysLeft: number | null;
};

export default function Topbar({
  workspaceName,
  userName,
  workspacePlan,
  trialDaysLeft,
}: TopbarProps) {
  const showTrial = workspacePlan === "free" && trialDaysLeft !== null;
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header
      style={{
        height: 56,
        background: "var(--cloud)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        position: "sticky",
        top: 0,
        zIndex: 99,
        gap: 16,
      }}
    >
      {/* Left: workspace switcher */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--sky-100)",
            border: "1px solid var(--border)",
            padding: "6px 12px",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 700,
            color: "var(--ink)",
            fontFamily: "var(--font-body)",
          }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              background: "var(--ocean-500)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 9,
              fontWeight: 800,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            {workspaceName.slice(0, 2).toUpperCase()}
          </div>
          <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {workspaceName}
          </span>
          <ChevronDown size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
        </button>
      </div>

      {/* Center: search */}
      <div
        style={{
          flex: 1,
          maxWidth: 420,
          position: "relative",
        }}
      >
        <Search
          size={14}
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-muted)",
            pointerEvents: "none",
          }}
        />
        <input
          placeholder="Search links, campaigns, domains…"
          style={{
            width: "100%",
            height: 34,
            paddingLeft: 34,
            paddingRight: 12,
            background: "var(--sky-100)",
            border: "1px solid var(--border)",
            borderRadius: 0,
            fontFamily: "var(--font-body)",
            fontSize: 13,
            color: "var(--ink)",
            outline: "none",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--ocean-500)";
            e.currentTarget.style.boxShadow = "0 0 0 2px rgba(39,114,160,0.12)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
      </div>

      {/* Right: plan badge + actions + user */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {showTrial ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#FFF7ED",
              border: "1px solid #FCD34D",
              padding: "4px 10px",
              fontSize: 13,
              fontWeight: 700,
              color: "#92400E",
            }}
          >
            <Clock size={12} />
            {trialDaysLeft}d left
          </div>
        ) : workspacePlan === "enterprise" ? (
          <Link
            href="/dashboard/billing"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              background: "#0E2D47",
              border: "1px solid rgba(39,114,160,0.4)",
              padding: "4px 12px 4px 8px",
              textDecoration: "none",
            }}
          >
            <Building2 size={12} color="var(--ocean-300)" />
            <span style={{ fontSize: 11, fontWeight: 800, color: "var(--ocean-300)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Enterprise
            </span>
          </Link>
        ) : (
          <div
            style={{
              background: "var(--ocean-50)",
              border: "1px solid var(--ocean-200)",
              padding: "4px 10px",
              fontSize: 12,
              fontWeight: 700,
              color: "var(--ocean-700)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {workspacePlan}
          </div>
        )}

        {workspacePlan === "enterprise" && (
          <button
            title="Contact your dedicated CSM"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              height: 34,
              padding: "0 12px",
              background: "var(--sky-100)",
              border: "1px solid var(--border)",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--ocean-700)",
              fontFamily: "var(--font-body)",
            }}
          >
            <Headphones size={13} />
            CSM
          </button>
        )}

        <button
          style={{
            width: 34,
            height: 34,
            background: "var(--sky-100)",
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--text-secondary)",
            position: "relative",
          }}
          aria-label="Notifications"
        >
          <Bell size={15} />
          <div
            style={{
              position: "absolute",
              top: 6,
              right: 7,
              width: 6,
              height: 6,
              background: "var(--coral)",
              borderRadius: "50%",
              border: "1.5px solid var(--cloud)",
            }}
          />
        </button>

        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "none",
            border: "1px solid var(--border)",
            padding: "0 10px",
            height: 34,
            cursor: "pointer",
            fontFamily: "var(--font-body)",
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              background: "var(--ocean-800)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              fontWeight: 800,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
            {userName.split(" ")[0]}
          </span>
          <ChevronDown size={12} style={{ color: "var(--text-muted)" }} />
        </button>
      </div>
    </header>
  );
}
