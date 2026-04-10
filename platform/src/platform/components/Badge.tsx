"use client";

import React from "react";

type BadgeVariant =
  | "default"
  | "ocean"
  | "success"
  | "warning"
  | "danger"
  | "muted"
  | "mono";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const VARIANTS: Record<BadgeVariant, React.CSSProperties> = {
  default: {
    background: "var(--ocean-50)",
    color: "var(--ocean-700)",
    border: "1px solid var(--ocean-100)",
  },
  ocean: {
    background: "var(--ocean-500)",
    color: "#fff",
    border: "none",
  },
  success: {
    background: "#F0FDF4",
    color: "#166534",
    border: "1px solid #BBF7D0",
  },
  warning: {
    background: "#FFFBEB",
    color: "#92400E",
    border: "1px solid #FCD34D",
  },
  danger: {
    background: "#FFF1F2",
    color: "#9F1239",
    border: "1px solid #FECDD3",
  },
  muted: {
    background: "var(--sky-100)",
    color: "var(--text-secondary)",
    border: "1px solid var(--border)",
  },
  mono: {
    background: "var(--sky-100)",
    color: "var(--ocean-600)",
    border: "1px solid var(--border)",
    fontFamily: "var(--font-mono)",
  },
};

export default function Badge({ variant = "default", children, style }: BadgeProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontSize: 11,
        fontWeight: 700,
        padding: "2px 7px",
        letterSpacing: "0.05em",
        whiteSpace: "nowrap",
        ...VARIANTS[variant],
        ...style,
      }}
    >
      {children}
    </span>
  );
}
