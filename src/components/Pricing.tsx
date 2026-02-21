"use client";
import { useState } from "react";
import Link from "next/link";
import Reveal from "./Reveal";
import { Check, X, ArrowRight, Zap } from "lucide-react";

const LINE = "rgba(39,114,160,0.15)";
type BillingCycle = "monthly" | "annual";

const PLANS = [
  {
    name: "BASIC",
    monthlyPrice: 12,
    annualPrice: 11,
    monthlyPeriod: "per month",
    annualPeriod: "per month billed annually",
    desc: "For individuals and small teams that need reliable branded links and analytics.",
    features: [
      "10,000 links / month",
      "Analytics (30 days)",
      "1 custom domain",
      "QR code export",
      "url.ify domain + redirects",
    ],
    missing: ["Team workspace", "API access", "SSO / SAML"],
    cta: "Subscribe",
    href: "/api/mock-auth?mode=trial&next=%2Fdashboard",
    featured: false,
    badge: null,
  },
  {
    name: "PRO",
    monthlyPrice: 24,
    annualPrice: 22,
    monthlyPeriod: "per seat / month",
    annualPeriod: "per seat / month billed annually",
    desc: "For growing teams who need full analytics and custom branding.",
    features: [
      "Unlimited links",
      "Advanced analytics (90 days)",
      "5 custom domains",
      "Dynamic QR codes",
      "Team workspace (10 seats)",
      "Full API + webhooks",
      "Priority support",
    ],
    missing: ["SSO / SAML"],
    cta: "Subscribe",
    href: "/api/mock-auth?mode=trial&next=%2Fdashboard",
    featured: true,
    badge: "Most Popular",
  },
  {
    name: "ENTERPRISE",
    monthlyPrice: 59,
    annualPrice: 55,
    monthlyPeriod: "per month",
    annualPeriod: "per month billed annually",
    desc: "For large organisations with advanced security and compliance needs.",
    features: [
      "Unlimited everything",
      "Full analytics suite",
      "Unlimited domains",
      "Custom QR branding",
      "Unlimited seats",
      "Dedicated API SLA",
      "SSO / SAML",
      "Dedicated CSM + SLA",
    ],
    missing: [],
    cta: "Subscribe",
    href: "/auth?next=%2Fdashboard",
    featured: false,
    badge: null,
  },
];

export default function Pricing() {
  const [billing, setBilling] = useState<BillingCycle>("monthly");

  return (
    <section
      id="pricing"
      style={{
        background: "#ffffff",
        borderTop: `1px solid ${LINE}`,
        padding: "88px 48px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <Reveal>
          <div style={{ marginBottom: 48 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginBottom: 22,
              }}
            >
              <div style={{ flex: 1, height: 1, background: LINE }} />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.22em",
                  color: "var(--ocean-400)",
                  whiteSpace: "nowrap",
                }}
              >
                Pricing
              </span>
              <div style={{ flex: 1, height: 1, background: LINE }} />
            </div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 900,
                textTransform: "uppercase",
                fontSize: "clamp(44px,6vw,80px)",
                lineHeight: 0.92,
                letterSpacing: "-0.01em",
                color: "var(--ink)",
                marginBottom: 14,
              }}
            >
              SIMPLE PRICING.
              <br />
              <span style={{ color: "var(--ocean-400)" }}>ZERO SURPRISES.</span>
            </h2>
            <p
              style={{
                fontSize: 16,
                fontWeight: 500,
                color: "var(--text-secondary)",
                maxWidth: 500,
                lineHeight: 1.7,
              }}
            >
              Choose the plan that fits your team today and upgrade anytime as
              you scale.
            </p>

            <div
              style={{
                marginTop: 18,
                display: "flex",
                alignItems: "center",
                gap: 0,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  border: `1px solid ${LINE}`,
                  background: "var(--sky-100)",
                  padding: 3,
                  gap: 3,
                }}
              >
                <button
                  type="button"
                  onClick={() => setBilling("monthly")}
                  style={{
                    width: 104,
                    height: 32,
                    padding: 0,
                    border: "none",
                    background:
                      billing === "monthly" ? "var(--ocean-500)" : "transparent",
                    color:
                      billing === "monthly" ? "#ffffff" : "var(--text-secondary)",
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBilling("annual")}
                  style={{
                    width: 104,
                    height: 32,
                    padding: 0,
                    border: "none",
                    background:
                      billing === "annual" ? "var(--ocean-500)" : "transparent",
                    color:
                      billing === "annual" ? "#ffffff" : "var(--text-secondary)",
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                  }}
                >
                  Annual
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      padding: "4px 7px",
                      background: "rgba(255,255,255,0.92)",
                      color: "var(--ocean-700)",
                      border: "1px solid rgba(12,45,72,0.18)",
                      position: "absolute",
                      right: -10,
                      top: -11,
                      lineHeight: 1,
                      pointerEvents: "none",
                    }}
                  >
                    7% OFF
                  </span>
                </button>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              border: `1px solid ${LINE}`,
            }}
          >
            {PLANS.map((plan, i) => {
              const displayPrice =
                billing === "annual" ? plan.annualPrice : plan.monthlyPrice;
              const displayPeriod =
                billing === "annual" ? plan.annualPeriod : plan.monthlyPeriod;
              return (
                <div
                  key={plan.name}
                  className={plan.featured ? "pro-top-border" : ""}
                  style={{
                    padding: "40px 32px",
                    borderRight:
                      i < PLANS.length - 1 ? `1px solid ${LINE}` : undefined,
                    borderTop: plan.featured
                      ? "none"
                      : `2px solid ${LINE}`,
                    background: plan.featured
                      ? "linear-gradient(180deg, var(--sky-100) 0%, #ffffff 60%)"
                      : "#ffffff",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    transition:
                      "background 0.28s, transform 0.28s var(--ease-spring), box-shadow 0.28s",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    if (!plan.featured)
                      el.style.background = "rgba(39,114,160,0.03)";
                    el.style.transform = "translateY(-4px)";
                    el.style.boxShadow = "0 18px 36px rgba(39,114,160,0.14)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    if (!plan.featured) el.style.background = "#ffffff";
                    else
                      el.style.background =
                        "linear-gradient(180deg, var(--sky-100) 0%, #ffffff 60%)";
                    el.style.transform = "translateY(0)";
                    el.style.boxShadow = "none";
                  }}
                >
                {/* Badge */}
                {plan.badge && (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      height: 24,
                      padding: "0 10px",
                      background: "var(--ocean-500)",
                      color: "#fff",
                      fontSize: 9,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.15em",
                      marginBottom: 16,
                      alignSelf: "flex-start",
                    }}
                  >
                    <Zap size={9} fill="currentColor" />
                    {plan.badge}
                  </div>
                )}

                {/* Plan name */}
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 30,
                    letterSpacing: "0.04em",
                    fontWeight: 900,
                    color: "var(--ink)",
                    marginBottom: 6,
                    textTransform: "uppercase",
                  }}
                >
                  {plan.name}
                </div>

                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                    marginBottom: 28,
                    lineHeight: 1.6,
                  }}
                >
                  {plan.desc}
                </p>

                {/* Price */}
                <div
                  style={{
                    marginBottom: 28,
                    paddingBottom: 28,
                    borderBottom: `1px solid ${LINE}`,
                  }}
                >
                  {displayPrice !== null ? (
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: 4,
                          lineHeight: 1,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 20,
                            color: "var(--text-muted)",
                            paddingBottom: 6,
                            fontWeight: 600,
                          }}
                        >
                          $
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-display)",
                            fontSize: 68,
                            fontWeight: 900,
                            letterSpacing: "-0.03em",
                            color: "var(--ink)",
                          }}
                        >
                          {displayPrice}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          color: "var(--text-muted)",
                          marginTop: 6,
                        }}
                      >
                          {displayPeriod}
                        </div>
                    </div>
                  ) : (
                    <div>
                      <div
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: 42,
                          fontWeight: 900,
                          letterSpacing: "-0.02em",
                          color: "var(--ink)",
                          lineHeight: 1,
                        }}
                      >
                        Custom
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          color: "var(--text-muted)",
                          marginTop: 6,
                        }}
                      >
                        pricing
                      </div>
                    </div>
                  )}
                </div>

                {/* Features list */}
                <ul
                  style={{
                    listStyle: "none",
                    display: "flex",
                    flexDirection: "column",
                    gap: 11,
                    marginBottom: 28,
                    flex: 1,
                  }}
                >
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        fontSize: 13.5,
                        fontWeight: 600,
                        color: "var(--text-secondary)",
                        lineHeight: 1.4,
                      }}
                    >
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          background: "rgba(39,114,160,0.1)",
                          border: "1px solid rgba(39,114,160,0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Check size={11} style={{ color: "var(--ocean-500)" }} />
                      </span>
                      {f}
                    </li>
                  ))}
                  {plan.missing.map((f) => (
                    <li
                      key={f}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        fontSize: 13.5,
                        fontWeight: 500,
                        color: "var(--text-muted)",
                        opacity: 0.55,
                      }}
                    >
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          background: "transparent",
                          border: `1px solid ${LINE}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <X size={10} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href={plan.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    width: "100%",
                    height: 50,
                    background: plan.featured ? "var(--ocean-500)" : "none",
                    border: plan.featured
                      ? "1.5px solid rgba(255,255,255,0.52)"
                      : `1.5px solid ${LINE}`,
                    outline: plan.featured
                      ? "none"
                      : "1px solid rgba(39,114,160,0.34)",
                    outlineOffset: plan.featured ? "0" : "-1px",
                    color: plan.featured ? "white" : "var(--text-secondary)",
                    fontFamily: "var(--font-body)",
                    fontSize: 12,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    textDecoration: "none",
                    transition: "all 0.22s",
                    boxShadow: plan.featured
                      ? "0 10px 24px rgba(39,114,160,0.25)"
                      : "none",
                    position: "relative",
                    overflow: "visible",
                  }}
                  onMouseEnter={(e) => {
                    if (plan.featured) {
                      (e.currentTarget as HTMLElement).style.background =
                        "var(--ocean-600)";
                      (e.currentTarget as HTMLElement).style.transform =
                        "translateY(-2px)";
                      (e.currentTarget as HTMLElement).style.boxShadow =
                        "0 16px 32px rgba(39,114,160,0.3)";
                    } else {
                      (e.currentTarget as HTMLElement).style.borderColor =
                        "var(--ocean-400)";
                      (e.currentTarget as HTMLElement).style.outlineColor =
                        "rgba(39,114,160,0.58)";
                      (e.currentTarget as HTMLElement).style.color =
                        "var(--ocean-600)";
                      (e.currentTarget as HTMLElement).style.background =
                        "rgba(39,114,160,0.04)";
                      (e.currentTarget as HTMLElement).style.transform =
                        "translateY(-1px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (plan.featured) {
                      (e.currentTarget as HTMLElement).style.background =
                        "var(--ocean-500)";
                      (e.currentTarget as HTMLElement).style.transform =
                        "translateY(0)";
                      (e.currentTarget as HTMLElement).style.boxShadow =
                        "0 10px 24px rgba(39,114,160,0.25)";
                    } else {
                      (e.currentTarget as HTMLElement).style.borderColor = LINE;
                      (e.currentTarget as HTMLElement).style.outlineColor =
                        "rgba(39,114,160,0.34)";
                      (e.currentTarget as HTMLElement).style.color =
                        "var(--text-secondary)";
                      (e.currentTarget as HTMLElement).style.background =
                        "none";
                      (e.currentTarget as HTMLElement).style.transform =
                        "translateY(0)";
                    }
                  }}
                >
                  {plan.cta}{" "}
                  <ArrowRight size={13} />
                </Link>
                </div>
              );
            })}
          </div>
        </Reveal>

        {/* Footer bar */}
        <Reveal delay={0.15}>
          <div
            style={{
              border: `1px solid ${LINE}`,
              borderTop: "none",
              padding: "18px 28px",
              background: "var(--sky-100)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "var(--text-muted)",
              }}
            >
              All plans include a 7-day free trial. Cancel anytime before billing starts.
            </span>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              {["Cancel anytime", "SOC 2 Certified", "GDPR Compliant"].map(
                (b) => (
                  <span
                    key={b}
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <span
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: "50%",
                        background: "var(--ocean-400)",
                        display: "inline-block",
                        flexShrink: 0,
                      }}
                    />
                    {b}
                  </span>
                )
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
