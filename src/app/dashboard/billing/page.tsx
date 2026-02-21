"use client";

import Link from "next/link";
import { Check, Download, Zap, TrendingUp, Building2, ArrowUpRight } from "lucide-react";
import PageHeader from "@/platform/components/PageHeader";
import Panel from "@/platform/components/Panel";
import { dashboardData } from "@/platform/lib/dashboardData";

const PLANS = [
  {
    name: "Starter",
    price: 0,
    period: "forever",
    description: "For individuals getting started with link management.",
    features: [
      "1,000 short links",
      "10K clicks / month",
      "Basic analytics (7 days)",
      "1 custom domain",
      "No team seats",
      "Community support",
    ],
    cta: "Current plan",
    ctaHref: null,
    current: false,
    featured: false,
    icon: <Zap size={18} />,
  },
  {
    name: "Growth",
    price: 29,
    period: "/ month",
    description: "For teams that need analytics, custom domains, and collaboration.",
    features: [
      "Unlimited short links",
      "100K clicks / month",
      "Advanced analytics (90 days)",
      "5 custom domains",
      "10 team seats",
      "QR code generator",
      "Priority support",
      "API access",
    ],
    cta: "Upgrade to paid",
    ctaHref: "/api/mock-auth?mode=paid&next=%2Fdashboard",
    current: true,
    featured: true,
    icon: <TrendingUp size={18} />,
  },
  {
    name: "Enterprise",
    price: null,
    period: "custom",
    description: "For large organizations with advanced security and compliance needs.",
    features: [
      "Unlimited everything",
      "Unlimited clicks",
      "Custom data retention",
      "Unlimited domains",
      "Unlimited seats",
      "SSO / SAML",
      "Dedicated support",
      "SLA guarantee",
    ],
    cta: "Contact sales",
    ctaHref: null,
    current: false,
    featured: false,
    icon: <Building2 size={18} />,
  },
];

export default function BillingPage() {
  const usagePct = Math.round((dashboardData.totals.clicks / 100000) * 100);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <PageHeader
        title="Billing & Subscription"
        description="Manage your plan, usage, and invoices."
        breadcrumb="Workspace"
      />

      {/* Current plan summary */}
      <div
        style={{
          background: "var(--cloud)",
          border: "1px solid var(--border)",
          borderLeft: "4px solid var(--ocean-500)",
          padding: "20px 24px",
          marginBottom: 24,
          boxShadow: "var(--shadow-xs)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ocean-500)", marginBottom: 4 }}>
            Current plan
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em" }}>
            Growth — $29 / month
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 3 }}>
            Renews February 28, 2026 · Next invoice: $29.00
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link
            href="/api/mock-auth?mode=trial&next=%2Fdashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: 36,
              padding: "0 16px",
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
              fontSize: 12,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Restart trial
          </Link>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: 36,
              padding: "0 16px",
              background: "var(--ocean-50)",
              border: "1px solid var(--ocean-200)",
              color: "var(--ocean-700)",
              fontSize: 12,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            ← Back to site
          </Link>
        </div>
      </div>

      {/* Usage */}
      <Panel title="Usage this billing cycle" subtitle="Resets February 28, 2026" action={
        <Link href="/dashboard/analytics" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "var(--ocean-500)", textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          View analytics <ArrowUpRight size={11} />
        </Link>
      }>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
          {[
            { label: "Short links", used: dashboardData.totals.links, limit: "Unlimited", pct: null },
            { label: "Clicks", used: dashboardData.totals.clicks.toLocaleString(), limit: "100,000", pct: usagePct },
            { label: "Custom domains", used: dashboardData.domains.length, limit: 5, pct: Math.round((dashboardData.domains.length / 5) * 100) },
            { label: "Team seats", used: dashboardData.team.length, limit: 10, pct: Math.round((dashboardData.team.length / 10) * 100) },
          ].map((u) => (
            <div key={u.label}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                <span style={{ fontWeight: 700, color: "var(--text-secondary)" }}>{u.label}</span>
                <span style={{ color: "var(--text-muted)" }}>
                  {u.used} / {u.limit}
                </span>
              </div>
              {u.pct !== null ? (
                <>
                  <div style={{ height: 6, background: "var(--sky-200)" }}>
                    <div
                      style={{
                        width: `${Math.min(u.pct, 100)}%`,
                        height: "100%",
                        background: u.pct > 80 ? "var(--coral)" : "var(--ocean-500)",
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 10, color: u.pct > 80 ? "var(--coral)" : "var(--text-muted)", marginTop: 4, fontWeight: 600 }}>
                    {u.pct}% used
                  </div>
                </>
              ) : (
                <div style={{ height: 6, background: "var(--ocean-100)" }} />
              )}
            </div>
          ))}
        </div>
      </Panel>

      {/* Plan comparison */}
      <div style={{ margin: "28px 0 16px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ocean-500)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 16, height: 2, background: "var(--ocean-500)", display: "inline-block" }} />
          Plans
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em" }}>
          Choose the right plan for your team
        </h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 28 }}>
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            style={{
              background: plan.featured ? "var(--ocean-900)" : "var(--cloud)",
              border: plan.current ? "2px solid var(--ocean-400)" : "1px solid var(--border)",
              borderTop: `3px solid ${plan.featured ? "var(--ocean-400)" : "var(--border)"}`,
              padding: 24,
              position: "relative",
              boxShadow: plan.featured ? "var(--shadow-lg)" : "var(--shadow-xs)",
            }}
          >
            {plan.current && (
              <div
                style={{
                  position: "absolute",
                  top: -1,
                  right: 16,
                  background: "var(--ocean-500)",
                  color: "#fff",
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  padding: "3px 8px",
                }}
              >
                Current
              </div>
            )}

            <div
              style={{
                width: 36,
                height: 36,
                background: plan.featured ? "rgba(255,255,255,0.1)" : "var(--ocean-50)",
                border: `1px solid ${plan.featured ? "rgba(255,255,255,0.15)" : "var(--ocean-100)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: plan.featured ? "var(--ocean-200)" : "var(--ocean-500)",
                marginBottom: 14,
              }}
            >
              {plan.icon}
            </div>

            <div style={{ fontSize: 16, fontWeight: 800, color: plan.featured ? "#fff" : "var(--ink)", marginBottom: 4 }}>
              {plan.name}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
              {plan.price !== null ? (
                <>
                  <span style={{ fontSize: 32, fontWeight: 900, color: plan.featured ? "#fff" : "var(--ink)", fontFamily: "var(--font-display)", letterSpacing: "-0.04em" }}>
                    ${plan.price}
                  </span>
                  <span style={{ fontSize: 13, color: plan.featured ? "rgba(255,255,255,0.5)" : "var(--text-muted)" }}>
                    {plan.period}
                  </span>
                </>
              ) : (
                <span style={{ fontSize: 22, fontWeight: 800, color: plan.featured ? "#fff" : "var(--ink)" }}>
                  Custom pricing
                </span>
              )}
            </div>
            <p style={{ fontSize: 12, color: plan.featured ? "rgba(255,255,255,0.55)" : "var(--text-muted)", marginBottom: 18, lineHeight: 1.6 }}>
              {plan.description}
            </p>

            <div style={{ borderTop: `1px solid ${plan.featured ? "rgba(255,255,255,0.1)" : "var(--border)"}`, paddingTop: 16, marginBottom: 20 }}>
              {plan.features.map((f) => (
                <div
                  key={f}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 9,
                    fontSize: 12,
                    color: plan.featured ? "rgba(255,255,255,0.75)" : "var(--text-secondary)",
                  }}
                >
                  <Check size={12} style={{ color: plan.featured ? "var(--ocean-300)" : "var(--sage)", flexShrink: 0 }} />
                  {f}
                </div>
              ))}
            </div>

            {plan.ctaHref ? (
              <Link
                href={plan.ctaHref}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  height: 40,
                  background: plan.featured ? "var(--ocean-500)" : "transparent",
                  border: plan.featured ? "none" : "1px solid var(--border)",
                  color: plan.featured ? "#fff" : "var(--text-secondary)",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                }}
              >
                {plan.cta}
              </Link>
            ) : (
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  height: 40,
                  background: "transparent",
                  border: `1px solid ${plan.featured ? "rgba(255,255,255,0.15)" : "var(--border)"}`,
                  color: plan.featured ? "rgba(255,255,255,0.5)" : "var(--text-muted)",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  cursor: plan.name === "Enterprise" ? "pointer" : "default",
                  fontFamily: "var(--font-body)",
                }}
              >
                {plan.cta}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Invoice table */}
      <Panel title="Billing history" subtitle="Download past invoices" noPad>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--sky-100)", borderBottom: "1px solid var(--border)" }}>
              {["Invoice", "Date", "Amount", "Status", ""].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "10px 20px",
                    textAlign: h === "Amount" ? "right" : "left",
                    fontWeight: 700,
                    fontSize: 10,
                    color: "var(--text-muted)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dashboardData.invoices.map((inv) => (
              <tr
                key={inv.id}
                style={{ borderBottom: "1px solid var(--border)" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--sky-50)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
              >
                <td style={{ padding: "14px 20px", fontWeight: 700, color: "var(--ocean-600)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
                  {inv.id}
                </td>
                <td style={{ padding: "14px 20px", color: "var(--text-muted)" }}>
                  {new Date(inv.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </td>
                <td style={{ padding: "14px 20px", textAlign: "right", fontWeight: 700, color: "var(--ink)" }}>
                  ${inv.amount.toFixed(2)}
                </td>
                <td style={{ padding: "14px 20px" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      background: inv.status === "Paid" ? "#F0FDF4" : "#FFFBEB",
                      color: inv.status === "Paid" ? "#166534" : "#92400E",
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "3px 9px",
                      border: `1px solid ${inv.status === "Paid" ? "#BBF7D0" : "#FCD34D"}`,
                    }}
                  >
                    {inv.status === "Paid" && <Check size={10} />}
                    {inv.status}
                  </span>
                </td>
                <td style={{ padding: "14px 20px" }}>
                  <button
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      height: 28,
                      padding: "0 10px",
                      background: "var(--sky-100)",
                      border: "1px solid var(--border)",
                      color: "var(--text-muted)",
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    <Download size={10} />
                    PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
