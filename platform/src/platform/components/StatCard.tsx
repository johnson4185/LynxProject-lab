import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import React from "react";

type StatCardProps = {
  label: string;
  value: string | number;
  note?: string;
  trend?: number; // positive = up, negative = down, undefined = none
  icon?: React.ReactNode;
  accent?: boolean;
  compact?: boolean;
  micro?: boolean;
};

export default function StatCard({ label, value, note, trend, icon, accent, compact = false, micro = false }: StatCardProps) {
  const trendUp = trend !== undefined && trend > 0;
  const trendDown = trend !== undefined && trend < 0;
  const isCompact = compact || micro;

  return (
    <div
      style={{
        background: accent ? "var(--ocean-500)" : "var(--cloud)",
        border: `1px solid ${accent ? "var(--ocean-500)" : "var(--border)"}`,
        borderLeft: `${isCompact ? 2 : 3}px solid ${accent ? "var(--ocean-200)" : "var(--ocean-400)"}`,
        padding: micro ? "6px 10px" : compact ? "9px 12px" : "18px 20px",
        minHeight: micro ? 68 : compact ? 88 : undefined,
        boxShadow: "var(--shadow-xs)",
        transition: "box-shadow 0.18s, transform 0.18s",
        cursor: "default",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.boxShadow = "var(--shadow-md)";
        el.style.transform = isCompact ? "translateY(-1px)" : "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.boxShadow = "var(--shadow-xs)";
        el.style.transform = "translateY(0)";
      }}
    >
      {/* Icon */}
      {icon && (
        <div
          style={{
            position: "absolute",
            top: micro ? 6 : compact ? 8 : 16,
            right: micro ? 6 : compact ? 8 : 16,
            color: accent ? "rgba(255,255,255,0.4)" : "var(--ocean-200)",
          }}
        >
          {icon}
        </div>
      )}

      <div
        style={{
          fontSize: micro ? 9 : compact ? 10 : 12,
          fontWeight: 700,
          letterSpacing: "0.09em",
          textTransform: "uppercase",
          color: accent ? "rgba(255,255,255,0.65)" : "var(--text-muted)",
          marginBottom: micro ? 3 : compact ? 6 : 8,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: micro ? 20 : compact ? 24 : 32,
          fontWeight: 800,
          lineHeight: 1,
          color: accent ? "#fff" : "var(--ink)",
          letterSpacing: "-0.02em",
          fontFamily: "var(--font-display)",
        }}
      >
        {value}
      </div>

      {(note || trend !== undefined) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginTop: micro ? 4 : compact ? 6 : 8,
          }}
        >
          {trend !== undefined && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 2,
                fontSize: micro ? 10 : compact ? 11 : 12,
                fontWeight: 700,
                color: trendUp
                  ? "#16a34a"
                  : trendDown
                  ? "var(--coral)"
                  : "var(--text-muted)",
              }}
            >
              {trendUp ? (
                <TrendingUp size={micro ? 9 : compact ? 10 : 11} />
              ) : trendDown ? (
                <TrendingDown size={micro ? 9 : compact ? 10 : 11} />
              ) : (
                <Minus size={micro ? 9 : compact ? 10 : 11} />
              )}
              {Math.abs(trend)}%
            </span>
          )}
          {note && (
            <span
              style={{
                fontSize: micro ? 10 : compact ? 11 : 12,
                color: accent ? "rgba(255,255,255,0.5)" : "var(--text-muted)",
              }}
            >
              {note}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
