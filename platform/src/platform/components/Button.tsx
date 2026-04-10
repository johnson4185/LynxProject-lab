"use client";

import React from "react";
import Link from "next/link";

type ButtonVariant = "primary" | "ghost" | "danger" | "outline";
type ButtonSize    = "sm" | "md" | "lg";

interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

interface ButtonAsButton extends ButtonBaseProps {
  href?: undefined;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit" | "reset";
}

interface ButtonAsLink extends ButtonBaseProps {
  href: string;
  onClick?: undefined;
  type?: undefined;
}

type ButtonProps = ButtonAsButton | ButtonAsLink;

const HEIGHT: Record<ButtonSize, number> = { sm: 30, md: 38, lg: 44 };
const FONT:   Record<ButtonSize, number> = { sm: 11, md: 12, lg: 13 };
const PAD:    Record<ButtonSize, string> = { sm: "0 12px", md: "0 18px", lg: "0 24px" };

function getStyles(
  variant: ButtonVariant,
  size: ButtonSize,
  disabled: boolean,
  fullWidth: boolean,
): React.CSSProperties {
  const h = HEIGHT[size];
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    height: h,
    padding: PAD[size],
    fontSize: FONT[size],
    fontWeight: 700,
    fontFamily: "var(--font-body)",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    textDecoration: "none",
    border: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    transition: "background 0.13s, border-color 0.13s",
    whiteSpace: "nowrap",
    flexShrink: 0,
    width: fullWidth ? "100%" : undefined,
  };

  const variants: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      background: "var(--ocean-500)",
      color: "#fff",
    },
    ghost: {
      background: "var(--cloud)",
      color: "var(--text-secondary)",
      border: "1px solid var(--border)",
    },
    danger: {
      background: "var(--coral)",
      color: "#fff",
    },
    outline: {
      background: "transparent",
      color: "var(--text-secondary)",
      border: "1px solid var(--border)",
    },
  };

  return { ...base, ...variants[variant] };
}

export default function Button({
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  disabled = false,
  fullWidth = false,
  style,
  children,
  ...rest
}: ButtonProps) {
  const computed = getStyles(variant, size, disabled, fullWidth);
  const merged   = { ...computed, ...style };

  if ("href" in rest && rest.href) {
    return (
      <Link href={rest.href} style={merged}>
        {icon}
        {children}
        {iconRight}
      </Link>
    );
  }

  const { onClick, type = "button" } = rest as ButtonAsButton;
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={merged}>
      {icon}
      {children}
      {iconRight}
    </button>
  );
}
