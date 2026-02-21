const ITEMS = [
  { text: "Smart Link Shortening", dot: "diamond" },
  { text: "Real-Time Analytics", dot: "dot" },
  { text: "Custom Branded Domains", dot: "diamond" },
  { text: "Dynamic QR Codes", dot: "dot" },
  { text: "Team Workspaces", dot: "diamond" },
  { text: "Full REST API", dot: "dot" },
  { text: "UTM Builder", dot: "diamond" },
  { text: "42,000+ Teams", dot: "dot" },
  { text: "99.99% Uptime SLA", dot: "diamond" },
  { text: "Link Rotators", dot: "dot" },
  { text: "Geotargeting", dot: "diamond" },
  { text: "A/B Testing", dot: "dot" },
  { text: "SOC 2 Certified", dot: "diamond" },
];

function Diamond() {
  return (
    <svg
      width="8"
      height="8"
      viewBox="0 0 8 8"
      fill="none"
      style={{ flexShrink: 0 }}
    >
      <rect
        x="4"
        y="0.5"
        width="5"
        height="5"
        rx="0"
        transform="rotate(45 4 0.5)"
        fill="rgba(255,255,255,0.4)"
      />
    </svg>
  );
}

function Dot() {
  return (
    <span
      style={{
        width: 4,
        height: 4,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.35)",
        display: "inline-block",
        flexShrink: 0,
      }}
    />
  );
}

export default function Ticker() {
  return (
    <div
      style={{
        background: "linear-gradient(90deg, var(--ocean-800) 0%, var(--ocean-700) 50%, var(--ocean-800) 100%)",
        overflow: "hidden",
        padding: "11px 0",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          display: "flex",
          width: "max-content",
          animation: "ticker 42s linear infinite",
        }}
      >
        {[...ITEMS, ...ITEMS].map((item, i) => (
          <div
            key={`${item.text}-${i}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              padding: "0 28px",
              whiteSpace: "nowrap",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.78)",
            }}
          >
            {item.text}
            {item.dot === "diamond" ? <Diamond /> : <Dot />}
          </div>
        ))}
      </div>
    </div>
  );
}
