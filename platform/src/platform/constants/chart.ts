/* ─── Shared chart style constants ──────────────────────────────────────────
   Import these in any page that uses Recharts to avoid repeating them.
───────────────────────────────────────────────────────────────────────────── */

export const TOOLTIP_STYLE = {
  background: "var(--ocean-900)",
  border: "none",
  color: "#fff",
  fontSize: 13,
  fontFamily: "var(--font-body)",
  borderRadius: 0,
} as const;

export const TICK_STYLE = {
  fontSize: 12,
  fill: "var(--text-muted)",
  fontFamily: "var(--font-body)",
} as const;

export const LEGEND_STYLE = {
  fontSize: 12,
  paddingTop: 8,
  fontFamily: "var(--font-body)",
  color: "var(--text-muted)",
} as const;

export const DEVICE_COLORS = [
  "var(--ocean-500)",
  "var(--ocean-300)",
  "var(--ocean-700)",
] as const;

export const GEO_COLORS = [
  "var(--ocean-500)",
  "var(--ocean-400)",
  "var(--ocean-300)",
  "var(--ocean-200)",
  "#9AB7CE",
  "#C3D9E8",
  "#D6E8F3",
] as const;

export const GRID_STROKE = "var(--sky-200)";
export const GRID_DASH   = "3 3";
