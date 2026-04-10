"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Check, Download, Zap, TrendingUp, Building2, ArrowUpRight,
  CreditCard, AlertCircle, Users, Globe, BarChart2,
  ChevronDown, Star, Phone, FileText, Shield,
} from "lucide-react";
import PageHeader from "@/platform/components/PageHeader";
import Panel from "@/platform/components/Panel";
import Modal from "@/platform/components/Modal";
import { dashboardData } from "@/platform/lib/dashboardData";

/* ─── Plan definitions ─────────────────────────────────────────────────── */
const PLANS = [
  {
    id: "basic",
    name: "Basic",
    price: 12,
    priceSuffix: "/ month",
    description: "Everything you need to get started with branded short links.",
    badge: null,
    features: [
      { text: "10,000 short links / month", included: true },
      { text: "Analytics — 30-day retention", included: true },
      { text: "1 custom domain", included: true },
      { text: "QR code export (static)", included: true },
      { text: "url.ify subdomain", included: true },
      { text: "Team workspace", included: false },
      { text: "API & webhooks", included: false },
      { text: "SSO / SAML", included: false },
      { text: "Priority support", included: false },
    ],
    cta: "Downgrade to Basic",
    current: false,
    featured: false,
    Icon: Zap,
  },
  {
    id: "pro",
    name: "Pro",
    price: 24,
    priceSuffix: "/ seat / month",
    description: "Advanced analytics, team collaboration, and full API access.",
    badge: "Popular",
    features: [
      { text: "Unlimited short links", included: true },
      { text: "Advanced analytics — 90-day retention", included: true },
      { text: "5 custom domains", included: true },
      { text: "Dynamic QR codes", included: true },
      { text: "Team workspace (10 seats)", included: true },
      { text: "Full API + webhooks", included: true },
      { text: "Priority support", included: true },
      { text: "SSO / SAML", included: true },
      { text: "Dedicated CSM", included: false },
    ],
    cta: "Downgrade to Pro",
    current: false,
    featured: true,
    Icon: TrendingUp,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 59,
    priceSuffix: "/ month",
    description: "Unlimited scale, custom branding, dedicated infrastructure and SLA.",
    badge: null,
    features: [
      { text: "Unlimited everything", included: true },
      { text: "Full analytics suite (unlimited retention)", included: true },
      { text: "Unlimited custom domains", included: true },
      { text: "Custom QR branding", included: true },
      { text: "Unlimited seats", included: true },
      { text: "Dedicated API SLA", included: true },
      { text: "SSO / SAML", included: true },
      { text: "Dedicated CSM + SLA", included: true },
      { text: "Custom contract & billing", included: true },
    ],
    cta: "Current plan",
    current: true,
    featured: false,
    Icon: Building2,
  },
];

const INVOICES = [
  { id: "INV-2026-003", date: "2026-02-01", amount: 59, plan: "Enterprise", status: "Paid" },
  { id: "INV-2026-002", date: "2026-01-01", amount: 59, plan: "Enterprise", status: "Paid" },
  { id: "INV-2026-001", date: "2025-12-01", amount: 59, plan: "Enterprise", status: "Paid" },
  { id: "INV-2025-012", date: "2025-11-01", amount: 59, plan: "Enterprise", status: "Paid" },
  { id: "INV-2025-011", date: "2025-10-01", amount: 59, plan: "Enterprise", status: "Paid" },
];

const COMPARE_ROWS = [
  { category: "Links",     feature: "Short links / month",          basic: "10,000",        pro: "Unlimited",          enterprise: "Unlimited" },
  { category: "Links",     feature: "Link expiry & scheduling",     basic: "—",             pro: "✓",                  enterprise: "✓" },
  { category: "Links",     feature: "Password-protected links",     basic: "—",             pro: "✓",                  enterprise: "✓" },
  { category: "Analytics", feature: "Data retention",               basic: "30 days",       pro: "90 days",            enterprise: "Unlimited" },
  { category: "Analytics", feature: "Geographic breakdown",         basic: "Country",       pro: "Country + City",     enterprise: "Country + City + ISP" },
  { category: "Analytics", feature: "Device & browser analytics",   basic: "Basic",         pro: "Advanced",           enterprise: "Full" },
  { category: "Analytics", feature: "UTM & campaign tracking",      basic: "—",             pro: "✓",                  enterprise: "✓" },
  { category: "Analytics", feature: "Scheduled email reports",      basic: "—",             pro: "✓",                  enterprise: "✓" },
  { category: "Domains",   feature: "Custom domains",               basic: "1",             pro: "5",                  enterprise: "Unlimited" },
  { category: "QR Codes",  feature: "QR code generation",           basic: "Static only",   pro: "Dynamic",            enterprise: "Custom branding" },
  { category: "Team",      feature: "Team seats",                   basic: "1",             pro: "10",                 enterprise: "Unlimited" },
  { category: "Team",      feature: "Role-based access control",    basic: "—",             pro: "✓",                  enterprise: "✓" },
  { category: "API",       feature: "API access",                   basic: "—",             pro: "✓",                  enterprise: "✓" },
  { category: "API",       feature: "Webhooks",                     basic: "—",             pro: "✓",                  enterprise: "✓" },
  { category: "API",       feature: "API rate limit",               basic: "—",             pro: "1,000 req/min",      enterprise: "Dedicated SLA" },
  { category: "Security",  feature: "SSO / SAML",                   basic: "—",             pro: "✓",                  enterprise: "✓" },
  { category: "Security",  feature: "Audit logs",                   basic: "—",             pro: "30 days",            enterprise: "Unlimited" },
  { category: "Support",   feature: "Support tier",                 basic: "Community",     pro: "Priority email",     enterprise: "Dedicated CSM + SLA" },
];

function groupByCategory(rows: typeof COMPARE_ROWS) {
  const map = new Map<string, typeof COMPARE_ROWS>();
  for (const row of rows) {
    if (!map.has(row.category)) map.set(row.category, []);
    map.get(row.category)!.push(row);
  }
  return Array.from(map.entries()).map(([category, rows]) => ({ category, rows }));
}

export default function BillingPage() {
  const [showCompare, setShowCompare]               = useState(false);
  const [showCancelModal, setShowCancelModal]       = useState(false);
  const [showDowngradeModal, setShowDowngradeModal] = useState<string | null>(null);

  const sections = groupByCategory(COMPARE_ROWS);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <PageHeader
        title="Billing & Subscription"
        description="Manage your Enterprise plan, usage, and payment details."
        breadcrumb="Workspace"
      />

      {/* ── Current plan summary ─────────────────────────────────────────── */}
      <div
        style={{
          background: "var(--cloud)",
          border: "1px solid var(--border)",
          borderLeft: "4px solid var(--ocean-500)",
          padding: "20px 24px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
          flexWrap: "wrap",
          boxShadow: "var(--shadow-xs)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 44, height: 44, background: "var(--ocean-500)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Building2 size={20} color="#fff" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>Current plan</span>
              <span style={{ background: "var(--ocean-500)", color: "#fff", fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", padding: "2px 8px" }}>
                Enterprise
              </span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em" }}>
              $59 / month · Annual billing
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 3 }}>
              Renews March 1, 2026 · Custom contract
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              height: 36, padding: "0 14px",
              background: "var(--sky-100)", border: "1px solid var(--border)",
              color: "var(--text-secondary)", fontSize: 12, fontWeight: 700,
              cursor: "pointer", fontFamily: "var(--font-body)",
            }}
          >
            <CreditCard size={13} /> Update payment
          </button>
          <a
            href="mailto:csm@url.ify"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              height: 36, padding: "0 16px",
              background: "var(--ocean-500)", border: "none",
              color: "#fff", fontSize: 12, fontWeight: 700,
              letterSpacing: "0.06em", textTransform: "uppercase",
              textDecoration: "none",
            }}
          >
            <Phone size={13} /> Contact CSM
          </a>
        </div>
      </div>

      {/* ── Dedicated CSM ─────────────────────────────────────────────────── */}
      <div
        style={{
          background: "var(--cloud)", border: "1px solid var(--border)",
          borderLeft: "3px solid var(--ocean-300)",
          padding: "14px 20px", marginBottom: 20,
          display: "flex", alignItems: "center", gap: 16,
          boxShadow: "var(--shadow-xs)",
        }}
      >
        <div style={{ width: 40, height: 40, background: "var(--ocean-500)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>SR</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>Sarah Reynolds — Your Dedicated Customer Success Manager</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>sarah.reynolds@url.ify · Available Mon–Fri, 9am–6pm ET</div>
        </div>
        <a
          href="mailto:sarah.reynolds@url.ify"
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            height: 34, padding: "0 14px",
            background: "var(--ocean-50)", border: "1px solid var(--ocean-200)",
            color: "var(--ocean-700)", fontSize: 12, fontWeight: 700,
            textDecoration: "none",
          }}
        >
          <ArrowUpRight size={12} /> Email CSM
        </a>
      </div>

      {/* ── Usage meters ──────────────────────────────────────────────────── */}
      <Panel
        title="Usage this billing cycle"
        subtitle="Resets March 1, 2026 · Enterprise plan — unlimited across all categories"
        action={
          <Link href="/dashboard/analytics" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "var(--ocean-500)", textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            View analytics <ArrowUpRight size={12} />
          </Link>
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24 }}>
          {[
            { label: "Short links",    used: dashboardData.totals.links,                   icon: <Zap size={13} /> },
            { label: "Clicks tracked", used: dashboardData.totals.clicks.toLocaleString(), icon: <BarChart2 size={13} /> },
            { label: "Custom domains", used: dashboardData.domains.length,                 icon: <Globe size={13} /> },
            { label: "Team seats",     used: dashboardData.team.length,                    icon: <Users size={13} /> },
          ].map((u) => (
            <div key={u.label}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <span style={{ color: "var(--ocean-500)" }}>{u.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)" }}>{u.label}</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 26, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em" }}>{u.used}</span>
                <span style={{ background: "var(--ocean-50)", color: "var(--ocean-600)", border: "1px solid var(--ocean-100)", fontSize: 10, fontWeight: 800, padding: "2px 8px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Unlimited
                </span>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* ── Plan comparison ───────────────────────────────────────────────── */}
      <div style={{ margin: "32px 0 16px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ocean-500)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 16, height: 2, background: "var(--ocean-500)", display: "inline-block" }} />
            Plan options
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em" }}>
            You&apos;re on the highest tier
          </h2>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 12 }}>
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            style={{
              background: "var(--cloud)",
              border: plan.current ? "2px solid var(--ocean-500)" : "1px solid var(--border)",
              borderTop: `3px solid ${plan.current ? "var(--ocean-500)" : plan.featured ? "var(--ocean-400)" : "var(--border)"}`,
              padding: 24,
              position: "relative",
              boxShadow: plan.current ? "var(--shadow-md)" : "var(--shadow-xs)",
            }}
          >
            {plan.current && (
              <div style={{ position: "absolute", top: -1, right: 16, background: "var(--ocean-500)", color: "#fff", fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", padding: "3px 8px" }}>
                Your plan
              </div>
            )}
            {plan.badge && !plan.current && (
              <div style={{ position: "absolute", top: -1, right: 16, background: "var(--ocean-200)", color: "var(--ocean-800)", fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", padding: "3px 8px" }}>
                {plan.badge}
              </div>
            )}

            <div style={{ width: 38, height: 38, background: plan.current ? "var(--ocean-50)" : "var(--sky-100)", border: `1px solid ${plan.current ? "var(--ocean-200)" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center", color: plan.current ? "var(--ocean-500)" : "var(--text-muted)", marginBottom: 16 }}>
              <plan.Icon size={18} />
            </div>

            <div style={{ fontSize: 17, fontWeight: 800, color: "var(--ink)", marginBottom: 4 }}>{plan.name}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
              <span style={{ fontSize: 36, fontWeight: 900, color: "var(--ink)", fontFamily: "var(--font-display)", letterSpacing: "-0.04em" }}>
                ${plan.price}
              </span>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{plan.priceSuffix}</span>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 18, lineHeight: 1.6 }}>
              {plan.description}
            </p>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, marginBottom: 20 }}>
              {plan.features.slice(0, 6).map((f) => (
                <div key={f.text} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 9, fontSize: 12, color: f.included ? "var(--text-secondary)" : "var(--sky-300)" }}>
                  <Check size={12} style={{ color: f.included ? "var(--sage)" : "transparent", flexShrink: 0, marginTop: 1 }} />
                  {f.text}
                </div>
              ))}
            </div>

            {plan.current ? (
              <button style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: 40, background: "var(--ocean-50)", border: "1px solid var(--ocean-200)", color: "var(--ocean-700)", fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", cursor: "default", fontFamily: "var(--font-body)" }}>
                <Star size={12} style={{ marginRight: 6 }} /> Your Current Plan
              </button>
            ) : (
              <button
                onClick={() => setShowDowngradeModal(plan.name)}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: 40, background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", cursor: "pointer", fontFamily: "var(--font-body)" }}
              >
                {plan.cta}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Feature comparison toggle */}
      <button
        onClick={() => setShowCompare((v) => !v)}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "var(--ocean-600)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)", marginBottom: showCompare ? 0 : 28, padding: "8px 0" }}
      >
        <ChevronDown size={14} style={{ transform: showCompare ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
        {showCompare ? "Hide" : "Show"} full feature comparison
      </button>

      {showCompare && (
        <div style={{ marginBottom: 28 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, background: "var(--cloud)", border: "1px solid var(--border)" }}>
            <thead>
              <tr style={{ background: "var(--sky-100)" }}>
                <th style={{ padding: "12px 20px", textAlign: "left", fontWeight: 700, fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>Feature</th>
                {["Basic", "Pro", "Enterprise"].map((h) => (
                  <th key={h} style={{ padding: "12px 20px", textAlign: "center", fontWeight: 700, fontSize: 11, color: h === "Enterprise" ? "var(--ocean-500)" : "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: "1px solid var(--border)", width: 160 }}>
                    {h} {h === "Enterprise" && "✓"}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sections.map((section) => (
                <React.Fragment key={section.category}>
                  <tr style={{ background: "var(--sky-100)" }}>
                    <td colSpan={4} style={{ padding: "8px 20px", fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ocean-600)", borderBottom: "1px solid var(--border)" }}>
                      {section.category}
                    </td>
                  </tr>
                  {section.rows.map((row) => (
                    <tr key={row.feature} style={{ borderBottom: "1px solid var(--border)" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--sky-50)")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                    >
                      <td style={{ padding: "11px 20px", color: "var(--text-secondary)", fontWeight: 500 }}>{row.feature}</td>
                      {[row.basic, row.pro, row.enterprise].map((val, i) => (
                        <td key={i} style={{ padding: "11px 20px", textAlign: "center", fontWeight: val === "✓" ? 700 : 400, color: val === "✓" ? (i === 2 ? "var(--sage)" : "var(--ocean-500)") : val === "—" ? "var(--text-muted)" : i === 2 ? "var(--ocean-600)" : "var(--text-secondary)", background: i === 2 ? "rgba(39,114,160,0.03)" : "transparent" }}>
                          {val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Payment method ────────────────────────────────────────────────── */}
      <Panel title="Payment method" action={
        <button style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 32, padding: "0 14px", background: "var(--sky-100)", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>
          Update card
        </button>
      }>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 30, background: "var(--sky-200)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CreditCard size={18} color="var(--text-muted)" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>Visa ending in 4242</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Expires 09 / 2028</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <div style={{ background: "#F0FDF4", color: "#166534", border: "1px solid #BBF7D0", fontSize: 11, fontWeight: 700, padding: "2px 8px" }}>Default</div>
            <div style={{ background: "var(--ocean-50)", color: "var(--ocean-700)", border: "1px solid var(--ocean-100)", fontSize: 11, fontWeight: 700, padding: "2px 8px" }}>Annual billing</div>
          </div>
        </div>
      </Panel>

      {/* ── Billing history ────────────────────────────────────────────────── */}
      <div style={{ marginTop: 24 }}>
        <Panel title="Billing history" subtitle="Download invoices as PDF"
          action={
            <button style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 32, padding: "0 14px", background: "var(--sky-100)", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>
              <Download size={12} /> Export all
            </button>
          }
          noPad
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--sky-100)", borderBottom: "1px solid var(--border)" }}>
                {["Invoice", "Date", "Plan", "Amount", "Status", ""].map((h) => (
                  <th key={h} style={{ padding: "10px 20px", textAlign: h === "Amount" ? "right" : "left", fontWeight: 700, fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {INVOICES.map((inv) => (
                <tr
                  key={inv.id}
                  style={{ borderBottom: "1px solid var(--border)" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--sky-50)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                >
                  <td style={{ padding: "14px 20px", fontWeight: 700, color: "var(--ocean-600)", fontFamily: "var(--font-mono)", fontSize: 12 }}>{inv.id}</td>
                  <td style={{ padding: "14px 20px", color: "var(--text-muted)" }}>
                    {new Date(inv.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </td>
                  <td style={{ padding: "14px 20px", fontSize: 12 }}>
                    <span style={{ background: "var(--ocean-50)", color: "var(--ocean-700)", fontSize: 11, fontWeight: 700, padding: "2px 8px", border: "1px solid var(--ocean-100)" }}>{inv.plan}</span>
                  </td>
                  <td style={{ padding: "14px 20px", textAlign: "right", fontWeight: 700, color: "var(--ink)" }}>${inv.amount.toFixed(2)}</td>
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#F0FDF4", color: "#166534", fontSize: 11, fontWeight: 700, padding: "3px 9px", border: "1px solid #BBF7D0" }}>
                      <Check size={10} />{inv.status}
                    </span>
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <button style={{ display: "flex", alignItems: "center", gap: 4, height: 28, padding: "0 10px", background: "var(--sky-100)", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>
                      <FileText size={11} /> PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      {/* ── Cancel subscription ────────────────────────────────────────────── */}
      <div style={{ marginTop: 24, padding: "16px 20px", background: "var(--cloud)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>Cancel subscription</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Enterprise cancellations are processed by your CSM per your contract terms.</div>
        </div>
        <button
          onClick={() => setShowCancelModal(true)}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 36, padding: "0 16px", background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)", flexShrink: 0 }}
        >
          <Shield size={13} /> Cancel subscription
        </button>
      </div>

      {/* ── Downgrade modal ───────────────────────────────────────────────── */}
      <Modal open={!!showDowngradeModal} onClose={() => setShowDowngradeModal(null)} title={`Downgrade to ${showDowngradeModal}?`} width={460}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <AlertCircle size={16} color="var(--coral)" />
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>This will result in significant feature loss.</span>
        </div>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 12 }}>
          Downgrading from <strong>Enterprise</strong> to <strong>{showDowngradeModal}</strong> will remove dedicated CSM access, custom API SLA, unlimited data retention, and custom QR branding. We recommend contacting your CSM before making this change.
        </p>
        <div style={{ background: "#FFFBEB", border: "1px solid #FCD34D", borderLeft: "3px solid #F59E0B", padding: "10px 14px", marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: "#92400E", lineHeight: 1.5 }}>
            Enterprise cancellations require CSM involvement. Please reach out to discuss your options before proceeding.
          </p>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={() => setShowDowngradeModal(null)} style={{ height: 38, padding: "0 18px", background: "var(--ocean-500)", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>
            Keep Enterprise
          </button>
          <button onClick={() => setShowDowngradeModal(null)} style={{ height: 38, padding: "0 18px", background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>
            Contact CSM
          </button>
        </div>
      </Modal>

      {/* ── Cancel modal ─────────────────────────────────────────────────── */}
      <Modal open={showCancelModal} onClose={() => setShowCancelModal(false)} title="Cancel Enterprise subscription" width={440}>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 20 }}>
          Enterprise cancellations must be processed by your dedicated CSM per the terms of your contract. Please reach out to discuss your options.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={() => setShowCancelModal(false)} style={{ height: 38, padding: "0 18px", background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>
            Cancel
          </button>
          <a href="mailto:sarah.reynolds@url.ify" style={{ display: "inline-flex", alignItems: "center", height: 38, padding: "0 18px", background: "var(--ocean-500)", color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
            Email CSM
          </a>
        </div>
      </Modal>
    </div>
  );
}
