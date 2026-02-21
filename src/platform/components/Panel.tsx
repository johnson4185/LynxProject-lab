import React from "react";

type PanelProps = {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  noPad?: boolean;
};

export default function Panel({ title, subtitle, action, children, noPad }: PanelProps) {
  return (
    <section
      style={{
        background: "var(--cloud)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-xs)",
        overflow: "hidden",
      }}
    >
      {(title || action) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 20px",
            borderBottom: "1px solid var(--border)",
            gap: 12,
          }}
        >
          <div>
            {title && (
              <h2
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--ink)",
                  letterSpacing: "-0.01em",
                }}
              >
                {title}
              </h2>
            )}
            {subtitle && (
              <p style={{ color: "var(--text-muted)", marginTop: 2, fontSize: 13 }}>
                {subtitle}
              </p>
            )}
          </div>
          {action && <div style={{ flexShrink: 0 }}>{action}</div>}
        </div>
      )}
      <div style={noPad ? undefined : { padding: 20 }}>{children}</div>
    </section>
  );
}
