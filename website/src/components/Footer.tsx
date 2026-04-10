"use client";
import Link from "next/link";

const YEAR = new Date().getFullYear();
const CHROME_BG = "var(--ocean-900)";
const LINE = "rgba(255,255,255,0.12)";

const COLS = [
  { title: "Product", links: ["Features", "Pricing", "API Docs", "Changelog"] },
  { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
  { title: "Legal", links: ["Privacy", "Terms", "Security", "Status"] },
];

function SocialIcon({ brand }: { brand: "x" | "linkedin" | "github" | "youtube" }) {
  if (brand === "x") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 4h4.2l3.7 5.2L16.6 4H20l-6.4 7.5L20 20h-4.2l-4-5.6L7 20H3.6l6.7-7.9L4 4z" fill="currentColor" />
      </svg>
    );
  }
  if (brand === "linkedin") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6.9 8.3H3.7V20h3.2V8.3zM5.3 3A2.1 2.1 0 1 0 5.3 7.2 2.1 2.1 0 0 0 5.3 3zM20.3 13.3c0-3.5-1.9-5.2-4.4-5.2-2 0-2.9 1.1-3.4 1.9v-1.6H9.3V20h3.2v-5.8c0-1.5.3-2.9 2.1-2.9 1.8 0 1.8 1.7 1.8 3v5.7h3.2v-6.7z" fill="currentColor" />
      </svg>
    );
  }
  if (brand === "github") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 .8A11.2 11.2 0 0 0 .8 12a11.2 11.2 0 0 0 7.7 10.6c.6.1.8-.3.8-.6v-2.2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.2-1.6-1.2-1.6-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 .1.9 2.6 3.3 1.9a2.4 2.4 0 0 1 .7-1.5c-2.6-.3-5.2-1.3-5.2-5.7 0-1.3.5-2.3 1.1-3.1 0-.3-.5-1.4.1-3 0 0 1-.3 3.2 1.1a10.7 10.7 0 0 1 5.8 0c2.2-1.5 3.2-1.1 3.2-1.1.6 1.6.2 2.7.1 3 .7.8 1.1 1.8 1.1 3.1 0 4.4-2.7 5.3-5.3 5.6.4.4.8 1 .8 2.1V22c0 .3.2.7.8.6A11.2 11.2 0 0 0 23.2 12 11.2 11.2 0 0 0 12 .8z" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M23 8.2c0-1.8-.2-3.1-.7-4.1a3.2 3.2 0 0 0-1.4-1.4C19.9 2.2 18.6 2 16.8 2H7.2c-1.8 0-3.1.2-4.1.7A3.2 3.2 0 0 0 1.7 4C1.2 5 1 6.3 1 8.1v7.8c0 1.8.2 3.1.7 4.1.3.6.8 1.1 1.4 1.4 1 .5 2.3.7 4.1.7h9.6c1.8 0 3.1-.2 4.1-.7.6-.3 1.1-.8 1.4-1.4.5-1 .7-2.3.7-4.1V8.2zM9.6 16.5V7.5l7.8 4.5-7.8 4.5z" fill="currentColor" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer style={{ background: CHROME_BG, borderTop: "1px solid rgba(255,255,255,0.08)" }}>

      {/* Newsletter bar */}
      <div style={{ borderBottom: `1px solid ${LINE}` }}>
        <div
          className="container"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "28px 24px",
            flexWrap: "wrap",
            gap: 20,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.16em",
                color: "rgba(255,255,255,0.5)",
                marginBottom: 4,
              }}
            >
              Stay in the loop
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#ffffff",
                letterSpacing: "-0.01em",
              }}
            >
              Link intelligence, straight to your inbox.
            </div>
          </div>
          <form
            onSubmit={(e) => e.preventDefault()}
            style={{ display: "flex", gap: 0, flexShrink: 0 }}
          >
            <input
              type="email"
              placeholder="your@company.com"
              style={{
                height: 42,
                padding: "0 16px",
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.18)",
                borderRight: "none",
                color: "#ffffff",
                fontFamily: "var(--font-body)",
                fontSize: 13,
                outline: "none",
                width: 240,
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => {
                (e.currentTarget as HTMLInputElement).style.borderColor =
                  "rgba(146,190,224,0.5)";
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLInputElement).style.borderColor =
                  "rgba(255,255,255,0.18)";
              }}
            />
            <button
              type="submit"
              style={{
                height: 42,
                padding: "0 20px",
                background: "var(--ocean-500)",
                color: "#fff",
                border: "none",
                fontFamily: "var(--font-body)",
                fontSize: 11,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                cursor: "pointer",
                transition: "background 0.2s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "var(--ocean-400)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "var(--ocean-500)";
              }}
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* Main footer grid */}
      <div className="container" style={{ padding: "40px 24px 28px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            gap: 40,
            marginBottom: 36,
          }}
          className="flex flex-col gap-10 md:grid"
        >
          {/* Brand column */}
          <div>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                textDecoration: "none",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  flexShrink: 0,
                  border: "1px solid rgba(255,255,255,0.28)",
                  background: "rgba(255,255,255,0.07)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M9.4 14.6 7.2 16.8a3.1 3.1 0 1 1-4.4-4.4l2.2-2.2a3.1 3.1 0 0 1 4.4 0"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M14.6 9.4 16.8 7.2a3.1 3.1 0 1 1 4.4 4.4L19 13.8a3.1 3.1 0 0 1-4.4 0"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="m8.5 15.5 7-7"
                    stroke="rgba(255,255,255,0.75)"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <circle cx="18.8" cy="5.2" r="1.2" fill="var(--ocean-200)" />
                </svg>
              </div>
              <span
                style={{
                  fontFamily: "var(--font-nativera)",
                  fontSize: 24,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                }}
              >
                <span style={{ color: "#ffffff" }}>url</span>
                <span style={{ color: "var(--ocean-300)" }}>.ify</span>
              </span>
            </Link>

            <p
              style={{
                fontSize: 14,
                lineHeight: 1.75,
                color: "rgba(255,255,255,0.58)",
                maxWidth: 280,
                marginBottom: 20,
              }}
            >
              Build, share, and measure links with a clean platform designed for
              growing teams who care about every click.
            </p>

            {/* Social icons */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {(["x", "linkedin", "github", "youtube"] as const).map((brand) => (
                <a
                  key={brand}
                  href="#"
                  aria-label={brand}
                  style={{
                    width: 36,
                    height: 36,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.16)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(255,255,255,0.7)",
                    textDecoration: "none",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = "rgba(146,190,224,0.2)";
                    el.style.borderColor = "rgba(146,190,224,0.45)";
                    el.style.color = "#ffffff";
                    el.style.transform = "translateY(-2px)";
                    el.style.boxShadow = "0 6px 16px rgba(7,27,44,0.3)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = "rgba(255,255,255,0.06)";
                    el.style.borderColor = "rgba(255,255,255,0.16)";
                    el.style.color = "rgba(255,255,255,0.7)";
                    el.style.transform = "translateY(0)";
                    el.style.boxShadow = "none";
                  }}
                >
                  <SocialIcon brand={brand} />
                </a>
              ))}
            </div>

            {/* G2 rating chip */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#E37400">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.72)",
                  letterSpacing: "0.04em",
                }}
              >
                4.9 / 5 on G2
              </span>
            </div>
          </div>

          {/* Link columns */}
          {COLS.map((col) => (
            <div key={col.title}>
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.4)",
                  marginBottom: 16,
                }}
              >
                {col.title}
              </div>
              <ul
                style={{
                  listStyle: "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 13,
                        fontWeight: 500,
                        color: "rgba(255,255,255,0.62)",
                        textDecoration: "none",
                        transition: "color 0.15s",
                        letterSpacing: "0.01em",
                      }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLElement).style.color =
                          "#ffffff")
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLElement).style.color =
                          "rgba(255,255,255,0.62)")
                      }
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{ height: 1, background: LINE, marginBottom: 20 }} />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <span
            style={{ fontSize: 12, color: "rgba(255,255,255,0.36)" }}
          >
            © {YEAR} url.ify, Inc. All rights reserved.
          </span>
          <div style={{ display: "flex", gap: 20 }}>
            {["Privacy", "Terms", "Cookies"].map((item) => (
              <a
                key={item}
                href="#"
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "rgba(255,255,255,0.3)",
                  textDecoration: "none",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.color =
                    "rgba(255,255,255,0.7)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.color =
                    "rgba(255,255,255,0.3)")
                }
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
