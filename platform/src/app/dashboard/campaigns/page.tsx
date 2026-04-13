"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  Plus, MoreHorizontal, Archive, RotateCcw, Pencil, Trash2, Copy,
  Megaphone, MousePointerClick, DollarSign, Target, Calendar,
  Search, ChevronDown, Play, ArrowLeft, ExternalLink, Link2,
  TrendingUp, ChevronRight,
} from "lucide-react";
import PageHeader from "@/platform/components/PageHeader";
import Panel from "@/platform/components/Panel";
import Modal from "@/platform/components/Modal";
import { api } from "@/platform/lib/api";
import Badge from "@/platform/components/Badge";
import StatCard from "@/platform/components/StatCard";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TOOLTIP_STYLE, TICK_STYLE } from "@/platform/constants/chart";

/* ─── Types ──────────────────────────────────────────────────────────────── */
export type CampaignStatus = "Active" | "Paused" | "Archived";

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: CampaignStatus;
  startDate?: string;
  endDate?: string;
  dailyClickLimit?: number;
  totalClickLimit?: number;
  budgetAmount?: number;
  currency: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  clicks: number;
  links: number;
  ctr: number;
  createdAt: string;
}

interface CampaignLink {
  id: string;
  shortUrl: string;
  destination: string;
  clicks: number;
  ctr: number;
  tags: string[];
  createdAt: string;
}

interface ExistingCampaignLink extends CampaignLink {
  campaignIds: string[];
  campaignNames: string[];
}

/* ─── Mock campaigns ─────────────────────────────────────────────────────── */
const INITIAL: Campaign[] = [
  {
    id: "c1", name: "Ramadan Promo 2026",
    description: "Seasonal marketing campaign for Ramadan offers",
    status: "Active", startDate: "2026-03-01", endDate: "2026-03-31",
    dailyClickLimit: 1000, totalClickLimit: 20000, budgetAmount: 5000, currency: "SAR",
    utmSource: "facebook", utmMedium: "paid", utmCampaign: "ramadan_2026",
    clicks: 1240, links: 4, ctr: 11.2, createdAt: "2026-02-14",
  },
  {
    id: "c2", name: "Spring Launch",
    description: "Product launch across all paid channels",
    status: "Active", startDate: "2026-03-15", endDate: "2026-04-15",
    dailyClickLimit: 500, totalClickLimit: 10000, budgetAmount: 2000, currency: "USD",
    utmSource: "google", utmMedium: "cpc", utmCampaign: "spring_launch_2026",
    clicks: 820, links: 3, ctr: 8.6, createdAt: "2026-03-01",
  },
  {
    id: "c3", name: "Webinar Series Q1",
    description: "Lead generation for Q1 webinars",
    status: "Paused", startDate: "2026-01-15", endDate: "2026-06-30",
    dailyClickLimit: 200, totalClickLimit: 5000, budgetAmount: 800, currency: "USD",
    utmSource: "linkedin", utmMedium: "email", utmCampaign: "webinar_q1_2026",
    clicks: 510, links: 1, ctr: 7.2, createdAt: "2026-01-10",
  },
  {
    id: "c4", name: "Dev Rel 2026",
    description: "Developer relations and documentation outreach",
    status: "Active", startDate: "2026-01-01", endDate: "2026-12-31",
    dailyClickLimit: 300, totalClickLimit: 8000, budgetAmount: 1200, currency: "USD",
    utmSource: "github", utmMedium: "organic", utmCampaign: "devrel_2026",
    clicks: 670, links: 2, ctr: 9.4, createdAt: "2026-01-01",
  },
  {
    id: "c5", name: "Sales Enablement Q4",
    description: "End of year sales team resource campaign",
    status: "Archived", startDate: "2025-10-01", endDate: "2025-12-31",
    budgetAmount: 1500, currency: "USD",
    utmSource: "direct", utmMedium: "none", utmCampaign: "sales_q4_2025",
    clicks: 420, links: 2, ctr: 6.7, createdAt: "2025-10-01",
  },
  {
    id: "c6", name: "Retargeting Push",
    description: "Retargeting warm leads on paid social",
    status: "Paused", dailyClickLimit: 400, totalClickLimit: 12000,
    budgetAmount: 3000, currency: "USD",
    utmSource: "meta", utmMedium: "retargeting", utmCampaign: "retarget_q2_2026",
    clicks: 430, links: 2, ctr: 6.1, createdAt: "2026-04-01",
  },
];

/* ─── Mock links per campaign
   In production: GET /api/admin/campaigns/:id/analytics/summary?topLinks=10
────────────────────────────────────────────────────────────────────────────── */
const CAMPAIGN_LINKS: Record<string, CampaignLink[]> = {
  c1: [
    { id: "l1", shortUrl: "acme.ly/ramadan-home",    destination: "https://acme.com/ramadan",         clicks: 480, ctr: 12.4, tags: ["campaign", "ramadan"], createdAt: "2026-03-01" },
    { id: "l2", shortUrl: "acme.ly/ramadan-offer",   destination: "https://acme.com/ramadan/offer",   clicks: 360, ctr: 11.8, tags: ["campaign", "offer"],   createdAt: "2026-03-02" },
    { id: "l3", shortUrl: "acme.ly/ramadan-product", destination: "https://acme.com/ramadan/product", clicks: 240, ctr: 10.1, tags: ["product"],              createdAt: "2026-03-05" },
    { id: "l4", shortUrl: "acme.ly/ramadan-signup",  destination: "https://acme.com/ramadan/signup",  clicks: 160, ctr: 10.5, tags: ["lead-gen"],             createdAt: "2026-03-08" },
  ],
  c2: [
    { id: "l5", shortUrl: "acme.ly/launch",   destination: "https://acme.com/launch",   clicks: 1240, ctr: 11.2, tags: ["campaign", "product"], createdAt: "2026-02-14" },
    { id: "l6", shortUrl: "acme.ly/pricing",  destination: "https://acme.com/pricing",  clicks:  820, ctr:  8.6, tags: ["website", "conversion"], createdAt: "2026-02-13" },
    { id: "l7", shortUrl: "acme.ly/features", destination: "https://acme.com/features", clicks:  430, ctr:  7.9, tags: ["website"],               createdAt: "2026-03-16" },
  ],
  c3: [
    { id: "l8", shortUrl: "acme.ly/webinar",  destination: "https://acme.com/webinar/register", clicks: 510, ctr: 7.2, tags: ["events", "lead-gen"], createdAt: "2026-02-12" },
  ],
  c4: [
    { id: "l9",  shortUrl: "acme.ly/docs-api", destination: "https://acme.com/docs/api", clicks: 670, ctr: 9.4, tags: ["docs", "developer"], createdAt: "2026-02-11" },
    { id: "l10", shortUrl: "acme.ly/sdk",      destination: "https://acme.com/sdk",      clicks: 310, ctr: 8.1, tags: ["developer", "sdk"],  createdAt: "2026-01-20" },
  ],
  c5: [
    { id: "l11", shortUrl: "go.acme.com/case-study",  destination: "https://acme.com/case-studies/retail", clicks: 420, ctr: 6.7, tags: ["sales", "content"], createdAt: "2026-02-10" },
    { id: "l12", shortUrl: "go.acme.com/deck",        destination: "https://acme.com/sales/deck",          clicks: 180, ctr: 5.9, tags: ["sales"],             createdAt: "2025-10-05" },
  ],
  c6: [
    { id: "l13", shortUrl: "acme.ly/pricing",  destination: "https://acme.com/pricing",  clicks: 430, ctr: 8.6, tags: ["retargeting"], createdAt: "2026-04-01" },
    { id: "l14", shortUrl: "acme.ly/checkout", destination: "https://acme.com/checkout", clicks: 290, ctr: 6.4, tags: ["retargeting", "conversion"], createdAt: "2026-04-02" },
  ],
};

/* ─── Status styling ─────────────────────────────────────────────────────── */
const STATUS_BADGE: Record<CampaignStatus, "success" | "warning" | "muted"> = {
  Active: "success", Paused: "warning", Archived: "muted",
};
const STATUS_BAR: Record<CampaignStatus, string> = {
  Active: "var(--ocean-500)", Paused: "#F59E0B", Archived: "var(--sky-200)",
};
const CURRENCIES = ["USD", "SAR", "EUR", "GBP", "AED"];

/* ─── Backend DTO types ──────────────────────────────────────────────────── */
interface CampaignDto {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  startDateUtc?: string | null;
  endDateUtc?: string | null;
  dailyClickLimit?: number | null;
  totalClickLimit?: number | null;
  budgetAmount?: number | null;
  currency?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  totalClicks?: number | null;
  linkCount?: number | null;
  createdAtUtc: string;
}

interface CampaignCreateResponse {
  id: string;
  name: string;
  status: string;
  createdAtUtc: string;
}

interface CampaignAnalyticsSummary {
  totalClicks?: number;
  topLinks?: Record<string, number>;
}

function mapStatusFromBackend(s: string): CampaignStatus {
  if (s === "Active") return "Active";
  if (s === "Archived") return "Archived";
  return "Paused"; // Draft, Paused, Closed → Paused
}

function mapStatusToBackend(s: CampaignStatus): string {
  return s; // Active → Active, Paused → Paused, Archived → Archived
}

function mapCampaignDto(dto: CampaignDto): Campaign {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description ?? undefined,
    status: mapStatusFromBackend(dto.status),
    startDate: dto.startDateUtc?.slice(0, 10),
    endDate: dto.endDateUtc?.slice(0, 10),
    dailyClickLimit: dto.dailyClickLimit ?? undefined,
    totalClickLimit: dto.totalClickLimit ?? undefined,
    budgetAmount: dto.budgetAmount ?? undefined,
    currency: dto.currency ?? "USD",
    utmSource: dto.utmSource ?? undefined,
    utmMedium: dto.utmMedium ?? undefined,
    utmCampaign: dto.utmCampaign ?? undefined,
    clicks: dto.totalClicks ?? 0,
    links: dto.linkCount ?? 0,
    ctr: 0,
    createdAt: dto.createdAtUtc.slice(0, 10),
  };
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const fmt = (n: number) => n.toLocaleString();
const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

function withRealtimeCampaignMetrics(campaign: Campaign, links: CampaignLink[]): Campaign {
  const clicks = links.reduce((sum, item) => sum + item.clicks, 0);
  const avgCtr = links.length > 0 ? Number((links.reduce((sum, item) => sum + item.ctr, 0) / links.length).toFixed(1)) : 0;
  return { ...campaign, clicks, links: links.length, ctr: avgCtr };
}

type FormState = {
  name: string; description: string; status: CampaignStatus;
  startDate: string; endDate: string;
  dailyClickLimit: number | undefined; totalClickLimit: number | undefined;
  budgetAmount: number | undefined; currency: string;
  utmSource: string; utmMedium: string; utmCampaign: string;
};
const blankForm = (): FormState => {
  const today = new Date().toISOString().slice(0, 10);
  const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return {
    name: "", description: "", status: "Active",
    startDate: today, endDate: in30,
    dailyClickLimit: undefined, totalClickLimit: undefined,
    budgetAmount: undefined, currency: "USD",
    utmSource: "", utmMedium: "", utmCampaign: "",
  };
};
const campaignToForm = (c: Campaign): FormState => ({
  name: c.name, description: c.description ?? "", status: c.status,
  startDate: c.startDate ?? "", endDate: c.endDate ?? "",
  dailyClickLimit: c.dailyClickLimit, totalClickLimit: c.totalClickLimit,
  budgetAmount: c.budgetAmount, currency: c.currency,
  utmSource: c.utmSource ?? "", utmMedium: c.utmMedium ?? "", utmCampaign: c.utmCampaign ?? "",
});

/* ─── Shared input styles ────────────────────────────────────────────────── */
const inputSx: React.CSSProperties = {
  width: "100%", height: 32, padding: "0 8px",
  border: "1px solid var(--border)", background: "var(--sky-100)",
  fontFamily: "var(--font-body)", fontSize: 12, color: "var(--ink)", outline: "none",
};
const selectSx: React.CSSProperties = { ...inputSx, cursor: "pointer" };
const textareaSx: React.CSSProperties = { ...inputSx, height: 56, padding: "6px 8px", resize: "vertical" as const };

function iFocus(e: React.FocusEvent<HTMLElement>) { (e.target as HTMLElement).style.borderColor = "var(--ocean-500)"; }
function iBlur(e: React.FocusEvent<HTMLElement>) { (e.target as HTMLElement).style.borderColor = "var(--border)"; }

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 3 }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2, margin: 0 }}>{hint}</p>}
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", paddingTop: 8, paddingBottom: 6, borderTop: "1px solid var(--border)", marginTop: 2 }}>
      {label}
    </div>
  );
}

/* ─── Campaign form ──────────────────────────────────────────────────────── */
function CampaignFormBody({ form, setForm, showStatus = false }: {
  form: FormState;
  setForm: (fn: (f: FormState) => FormState) => void;
  showStatus?: boolean;
}) {
  const UTM_SOURCES = [
    { value: "", label: "None" },
    { value: "facebook", label: "Facebook" },
    { value: "google", label: "Google" },
    { value: "linkedin", label: "LinkedIn" },
    { value: "twitter", label: "Twitter/X" },
    { value: "github", label: "GitHub" },
    { value: "direct", label: "Direct" },
    { value: "email", label: "Email" },
  ];

  const UTM_MEDIUMS = [
    { value: "", label: "None" },
    { value: "paid", label: "Paid" },
    { value: "organic", label: "Organic" },
    { value: "email", label: "Email" },
    { value: "social", label: "Social" },
    { value: "cpc", label: "CPC" },
    { value: "referral", label: "Referral" },
    { value: "retargeting", label: "Retargeting" },
    { value: "none", label: "None" },
  ];

  return (
    <>
      <Field label="Campaign name *">
        <input style={inputSx} value={form.name} placeholder="e.g. Ramadan Promo 2026"
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          onFocus={iFocus} onBlur={iBlur} />
      </Field>
      <Field label="Description">
        <textarea style={textareaSx} value={form.description} placeholder="Describe this campaign…"
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          onFocus={iFocus} onBlur={iBlur} />
      </Field>
      {showStatus && (
        <Field label="Status">
          <select style={selectSx} value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as CampaignStatus }))}
            onFocus={iFocus} onBlur={iBlur}>
            <option value="Active">Active</option>
            <option value="Paused">Paused</option>
          </select>
        </Field>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <Field label="Start date">
          <input type="date" style={inputSx} value={form.startDate}
            onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
            onFocus={iFocus} onBlur={iBlur} />
        </Field>
        <Field label="End date">
          <input type="date" style={inputSx} value={form.endDate}
            onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
            onFocus={iFocus} onBlur={iBlur} />
        </Field>
      </div>

      <SectionDivider label="Budget & Click Limits" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <Field label="Budget amount">
          <input type="number" style={inputSx} value={form.budgetAmount ?? ""} placeholder="5000" min={0}
            onChange={(e) => setForm((f) => ({ ...f, budgetAmount: e.target.value ? Number(e.target.value) : undefined }))}
            onFocus={iFocus} onBlur={iBlur} />
        </Field>
        <Field label="Currency">
          <select style={selectSx} value={form.currency}
            onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
            onFocus={iFocus} onBlur={iBlur}>
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <Field label="Daily click limit" hint="Leave blank = unlimited">
          <input type="number" style={inputSx} value={form.dailyClickLimit ?? ""} placeholder="1000" min={0}
            onChange={(e) => setForm((f) => ({ ...f, dailyClickLimit: e.target.value ? Number(e.target.value) : undefined }))}
            onFocus={iFocus} onBlur={iBlur} />
        </Field>
        <Field label="Total click limit" hint="Leave blank = unlimited">
          <input type="number" style={inputSx} value={form.totalClickLimit ?? ""} placeholder="20000" min={0}
            onChange={(e) => setForm((f) => ({ ...f, totalClickLimit: e.target.value ? Number(e.target.value) : undefined }))}
            onFocus={iFocus} onBlur={iBlur} />
        </Field>
      </div>

      <SectionDivider label="UTM Parameters" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <Field label="utm_source">
          <select style={selectSx} value={form.utmSource}
            onChange={(e) => setForm((f) => ({ ...f, utmSource: e.target.value }))}
            onFocus={iFocus} onBlur={iBlur}>
            {UTM_SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </Field>
        <Field label="utm_medium">
          <select style={selectSx} value={form.utmMedium}
            onChange={(e) => setForm((f) => ({ ...f, utmMedium: e.target.value }))}
            onFocus={iFocus} onBlur={iBlur}>
            {UTM_MEDIUMS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </Field>
      </div>
      <Field label="utm_campaign">
        <input style={inputSx} value={form.utmCampaign} placeholder="ramadan_2026"
          onChange={(e) => setForm((f) => ({ ...f, utmCampaign: e.target.value }))}
          onFocus={iFocus} onBlur={iBlur} />
      </Field>
    </>
  );
}

function SaveBtn({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      flex: 1, height: 30, background: disabled ? "var(--sky-200)" : "var(--ocean-500)",
      color: disabled ? "var(--text-muted)" : "#fff", border: "none",
      fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 11,
      letterSpacing: "0.06em", textTransform: "uppercase",
      cursor: disabled ? "not-allowed" : "pointer",
    }}>{label}</button>
  );
}
function CancelBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      height: 30, padding: "0 12px", background: "transparent",
      border: "1px solid var(--border)", color: "var(--text-muted)",
      fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 11, cursor: "pointer",
    }}>Cancel</button>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   CAMPAIGN DETAIL VIEW
   GET /api/admin/campaigns/:id  +  GET /api/admin/campaigns/:id/analytics/summary
══════════════════════════════════════════════════════════════════════════ */
function CampaignDetail({
  campaign,
  links,
  existingLinks,
  onAddLink,
  onAttachExistingLink,
  onRemoveLink,
  onBack,
  onEdit,
}: {
  campaign: Campaign;
  links: CampaignLink[];
  existingLinks: ExistingCampaignLink[];
  onAddLink: (campaignId: string, input: { shortUrl: string; destination: string; tags: string[] }) => void;
  onAttachExistingLink: (campaignId: string, link: ExistingCampaignLink) => void;
  onRemoveLink: (campaignId: string, linkId: string) => void;
  onBack: () => void;
  onEdit: (c: Campaign) => void;
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "analytics" | "links">("overview");
  const [showAddLinkOptions, setShowAddLinkOptions] = useState(false);
  const [showCreateLinkModal, setShowCreateLinkModal] = useState(false);
  const [showExistingLinkModal, setShowExistingLinkModal] = useState(false);

  useEffect(() => {
    setActiveTab("overview");
    setShowAddLinkOptions(false);
    setShowCreateLinkModal(false);
    setShowExistingLinkModal(false);
  }, [campaign.id]);

  const totalLinkClicks = links.reduce((s, l) => s + l.clicks, 0);
  const avgLinkCtr = links.length > 0 ? Number((links.reduce((s, l) => s + l.ctr, 0) / links.length).toFixed(1)) : 0;
  const topLink = links.slice().sort((a, b) => b.clicks - a.clicks)[0];
  const campaignDays = campaign.startDate && campaign.endDate
    ? Math.max(1, Math.ceil((new Date(campaign.endDate).getTime() - new Date(campaign.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1)
    : null;
  const avgDailyClicks = campaignDays ? Number((campaign.clicks / campaignDays).toFixed(1)) : null;
  const dailyLimitUsage = campaign.dailyClickLimit && avgDailyClicks !== null
    ? Math.min(100, Number(((avgDailyClicks / campaign.dailyClickLimit) * 100).toFixed(1)))
    : null;
  const totalLimitUsage = campaign.totalClickLimit
    ? Math.min(100, Number(((campaign.clicks / campaign.totalClickLimit) * 100).toFixed(1)))
    : null;

  const perLinkPerformance = useMemo(() => {
    if (links.length === 0) return [] as Array<CampaignLink & { clickShare: number; quality: "High" | "Medium" | "Low" }>;
    return links
      .map((link) => {
        const clickShare = totalLinkClicks > 0 ? Number(((link.clicks / totalLinkClicks) * 100).toFixed(1)) : 0;
        const quality: "High" | "Medium" | "Low" = link.ctr >= 10 ? "High" : link.ctr >= 6 ? "Medium" : "Low";
        return { ...link, clickShare, quality };
      })
      .sort((a, b) => b.clicks - a.clicks);
  }, [links, totalLinkClicks]);

  const tagPerformance = useMemo(() => {
    const buckets = new Map<string, { clicks: number; links: number }>();
    links.forEach((link) => {
      if (link.tags.length === 0) {
        const existing = buckets.get("untagged") ?? { clicks: 0, links: 0 };
        existing.clicks += link.clicks;
        existing.links += 1;
        buckets.set("untagged", existing);
        return;
      }
      link.tags.forEach((tag) => {
        const key = tag.toLowerCase();
        const existing = buckets.get(key) ?? { clicks: 0, links: 0 };
        existing.clicks += link.clicks;
        existing.links += 1;
        buckets.set(key, existing);
      });
    });
    return Array.from(buckets.entries())
      .map(([tag, value]) => ({
        tag,
        clicks: value.clicks,
        links: value.links,
        share: totalLinkClicks > 0 ? Number(((value.clicks / totalLinkClicks) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 6);
  }, [links, totalLinkClicks]);

  return (
    <div>
      {/* ── Back + header ──────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <button onClick={onBack} style={{
          display: "flex", alignItems: "center", gap: 6, height: 34, padding: "0 12px",
          background: "var(--sky-100)", border: "1px solid var(--border)",
          color: "var(--text-secondary)", fontSize: 12, fontWeight: 700,
          cursor: "pointer", fontFamily: "var(--font-body)",
        }}>
          <ArrowLeft size={13} /> All campaigns
        </button>
        <span style={{ color: "var(--text-muted)" }}>/</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{campaign.name}</span>
        <Badge variant={STATUS_BADGE[campaign.status]} style={{ marginLeft: 4 }}>{campaign.status}</Badge>
        <button onClick={() => onEdit(campaign)} style={{
          marginLeft: "auto", display: "flex", alignItems: "center", gap: 6,
          height: 34, padding: "0 14px", background: "var(--ocean-500)", border: "none",
          color: "#fff", fontSize: 12, fontWeight: 700,
          cursor: "pointer", fontFamily: "var(--font-body)",
        }}>
          <Pencil size={12} /> Edit campaign
        </button>
      </div>

      <div style={{ border: "1px solid var(--border)", background: "var(--cloud)", padding: 14, marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, borderBottom: "1px solid var(--border)", paddingBottom: 10, marginBottom: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 4 }}>
              Campaign Summary
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)", lineHeight: 1.2, marginBottom: 4 }}>
              {campaign.name}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", maxWidth: 680, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {campaign.description || "No description provided."}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <Badge variant={STATUS_BADGE[campaign.status]}>{campaign.status}</Badge>
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Created {fmtDate(campaign.createdAt)}</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 8 }}>
          {[
            { label: "Budget", value: campaign.budgetAmount ? `${campaign.currency} ${fmt(campaign.budgetAmount)}` : "—" },
            { label: "Date range", value: `${fmtDate(campaign.startDate)} - ${fmtDate(campaign.endDate)}` },
            { label: "Daily limit", value: campaign.dailyClickLimit ? fmt(campaign.dailyClickLimit) : "Unlimited" },
            { label: "Total limit", value: campaign.totalClickLimit ? fmt(campaign.totalClickLimit) : "Unlimited" },
            { label: "UTM campaign", value: campaign.utmCampaign || "—" },
            { label: "Pace", value: avgDailyClicks !== null ? `${fmt(avgDailyClicks)}/day` : "—" },
          ].map((item) => (
            <div key={item.label} style={{ background: "var(--sky-100)", border: "1px solid var(--border)", padding: "8px 9px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 3 }}>
                {item.label}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: 14 }}>
        {[
          { id: "overview", label: "Overview" },
          { id: "analytics", label: "Analytics" },
          { id: "links", label: "Links" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as "overview" | "analytics" | "links")}
            style={{
              height: 32,
              border: "none",
              borderBottom: activeTab === tab.id ? "2px solid var(--ocean-500)" : "2px solid transparent",
              background: activeTab === tab.id ? "var(--sky-100)" : "transparent",
              color: activeTab === tab.id ? "var(--ink)" : "var(--text-muted)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "0 12px",
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          <Panel title="Campaign details">
            <div style={{ display: "grid", gap: 10, fontSize: 13 }}>
              {[
                { label: "Campaign name", value: campaign.name },
                { label: "Description",   value: campaign.description || "—" },
                { label: "Start date",    value: fmtDate(campaign.startDate) },
                { label: "End date",      value: fmtDate(campaign.endDate) },
                { label: "Daily limit",   value: campaign.dailyClickLimit ? `${fmt(campaign.dailyClickLimit)} clicks/day` : "Unlimited" },
                { label: "Total limit",   value: campaign.totalClickLimit ? `${fmt(campaign.totalClickLimit)} clicks` : "Unlimited" },
              ].map((r) => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>{r.label}</span>
                  <span style={{ color: "var(--ink)", fontWeight: 700, textAlign: "right", maxWidth: "60%" }}>{r.value}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="UTM parameters">
            <div style={{ display: "grid", gap: 10, fontSize: 13 }}>
              {[
                { label: "utm_source",   value: campaign.utmSource   || "—" },
                { label: "utm_medium",   value: campaign.utmMedium   || "—" },
                { label: "utm_campaign", value: campaign.utmCampaign || "—" },
              ].map((r) => (
                <div key={r.label} style={{ padding: "10px 12px", background: "var(--sky-100)", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 4 }}>{r.label}</div>
                  <code style={{ fontSize: 13, fontFamily: "var(--font-mono)", color: r.value === "—" ? "var(--text-muted)" : "var(--ocean-700)", fontWeight: 700 }}>{r.value}</code>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Budget & status configuration">
            <div style={{ display: "grid", gap: 10, fontSize: 13 }}>
              {[
                { label: "Status", value: campaign.status },
                { label: "Budget amount", value: campaign.budgetAmount ? `${campaign.currency} ${fmt(campaign.budgetAmount)}` : "—" },
                { label: "Currency", value: campaign.currency },
                { label: "Created", value: fmtDate(campaign.createdAt) },
              ].map((r) => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>{r.label}</span>
                  <span style={{ color: "var(--ink)", fontWeight: 700, textAlign: "right", maxWidth: "60%" }}>{r.value}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Goal coverage">
            <div style={{ display: "grid", gap: 10, fontSize: 13 }}>
              <div style={{ padding: "10px 12px", border: "1px solid var(--border)", background: "var(--sky-100)" }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 4 }}>Daily pace</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "var(--ink)", fontWeight: 700 }}>{avgDailyClicks !== null ? `${fmt(avgDailyClicks)} clicks/day` : "Not enough date range"}</span>
                  <span style={{ color: "var(--ocean-700)", fontWeight: 700 }}>{dailyLimitUsage !== null ? `${dailyLimitUsage}% of daily limit` : "—"}</span>
                </div>
              </div>

              <div style={{ padding: "10px 12px", border: "1px solid var(--border)", background: "var(--sky-100)" }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 4 }}>Total limit usage</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "var(--ink)", fontWeight: 700 }}>{campaign.totalClickLimit ? `${fmt(campaign.clicks)} / ${fmt(campaign.totalClickLimit)} clicks` : "Unlimited"}</span>
                  <span style={{ color: "var(--ocean-700)", fontWeight: 700 }}>{totalLimitUsage !== null ? `${totalLimitUsage}% used` : "—"}</span>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      )}

      {activeTab === "analytics" && (
        <div style={{ display: "grid", gap: 12, marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            <StatCard micro label="Campaign clicks" value={fmt(campaign.clicks)} icon={<MousePointerClick size={16} />} />
            <StatCard micro label="Links in campaign" value={links.length} icon={<Link2 size={16} />} />
            <StatCard micro label="Avg link CTR" value={`${avgLinkCtr}%`} icon={<TrendingUp size={16} />} />
            <StatCard micro label="Top link" value={topLink ? topLink.shortUrl : "—"} icon={<ExternalLink size={16} />} />
          </div>

          <Panel title="Per-link click analytics" subtitle="Real-time based on links currently assigned to this campaign">
            {links.length === 0 ? (
              <div style={{ padding: "24px 8px", color: "var(--text-muted)", fontSize: 13, textAlign: "center" }}>
                No links available for analytics yet.
              </div>
            ) : (
              <div style={{ height: 210 }}>
                <ResponsiveContainer>
                  <BarChart data={links} margin={{ top: 8, right: 4, bottom: 0, left: -12 }}>
                    <XAxis dataKey="shortUrl" tick={TICK_STYLE} axisLine={false} tickLine={false} />
                    <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar dataKey="clicks" fill="var(--ocean-500)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Panel>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 12 }}>
            <Panel title="Per-link performance" subtitle="Click share + CTR quality grading">
              {perLinkPerformance.length === 0 ? (
                <div style={{ padding: "20px 8px", color: "var(--text-muted)", fontSize: 13, textAlign: "center" }}>
                  No performance data yet.
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--sky-100)" }}>
                      {["Link", "Clicks", "CTR", "Share", "Quality"].map((h) => (
                        <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {perLinkPerformance.map((item, idx) => (
                      <tr key={`${item.id}-${idx}`} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "8px 10px", fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-mono)" }}>{item.shortUrl}</td>
                        <td style={{ padding: "8px 10px", fontWeight: 700 }}>{fmt(item.clicks)}</td>
                        <td style={{ padding: "8px 10px", color: "var(--ocean-700)", fontWeight: 700 }}>{item.ctr}%</td>
                        <td style={{ padding: "8px 10px", color: "var(--text-secondary)", fontWeight: 700 }}>{item.clickShare}%</td>
                        <td style={{ padding: "8px 10px" }}>
                          <Badge variant={item.quality === "High" ? "success" : item.quality === "Medium" ? "warning" : "muted"}>{item.quality}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Panel>

            <Panel title="Tag-level distribution" subtitle="Top tags by click share">
              {tagPerformance.length === 0 ? (
                <div style={{ padding: "20px 8px", color: "var(--text-muted)", fontSize: 13, textAlign: "center" }}>
                  No tag data yet.
                </div>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {tagPerformance.map((tag) => (
                    <div key={tag.tag} style={{ padding: "8px 10px", border: "1px solid var(--border)", background: "var(--sky-100)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ink)", textTransform: "capitalize" }}>{tag.tag}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ocean-700)" }}>{tag.share}%</span>
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{fmt(tag.clicks)} clicks across {tag.links} links</div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>
        </div>
      )}

      {activeTab === "links" && (
        <Panel
          title={`Links in this campaign`}
          subtitle={`${links.length} link${links.length !== 1 ? "s" : ""} · ${fmt(totalLinkClicks)} total clicks`}
          noPad
        >
          <div style={{ borderBottom: "1px solid var(--border)", padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>Manage link assignments in real-time</span>
            <button
              onClick={() => setShowAddLinkOptions((prev) => !prev)}
              style={{
                height: 30,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "0 10px",
                border: "none",
                background: "var(--ocean-500)",
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <Plus size={12} /> Add link
            </button>
          </div>

          {showAddLinkOptions && (
            <div style={{ borderBottom: "1px solid var(--border)", padding: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, background: "var(--sky-100)" }}>
              <button
                onClick={() => {
                  setShowCreateLinkModal(true);
                  setShowAddLinkOptions(false);
                }}
                style={{ height: 32, border: "1px solid var(--ocean-200)", background: "#fff", color: "var(--ocean-700)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
              >
                New link
              </button>
              <button
                onClick={() => {
                  setShowExistingLinkModal(true);
                  setShowAddLinkOptions(false);
                }}
                style={{ height: 32, border: "1px solid var(--ocean-200)", background: "#fff", color: "var(--ocean-700)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
              >
                Existing link
              </button>
            </div>
          )}

          {links.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
              No links assigned to this campaign yet.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--sky-100)", borderBottom: "1px solid var(--border)" }}>
                  {["Short URL", "Destination", "Tags", "Clicks", "CTR", "Created", "Action"].map((h) => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {links.map((link, i) => (
                  <tr key={link.id}
                    style={{ borderBottom: i < links.length - 1 ? "1px solid var(--border)" : "none" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--sky-50, var(--sky-100))")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <div style={{ width: 26, height: 26, background: "var(--ocean-50)", border: "1px solid var(--ocean-100)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Link2 size={11} color="var(--ocean-600)" />
                        </div>
                        <span style={{ fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-mono)", fontSize: 12 }}>{link.shortUrl}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", maxWidth: 260 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{link.destination}</span>
                        <a href={link.destination} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-muted)", flexShrink: 0 }}>
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {link.tags.map((t) => (
                          <Badge key={t} variant="muted">{t}</Badge>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                      <span style={{ fontWeight: 800, color: "var(--ink)", fontFamily: "var(--font-display)", fontSize: 15 }}>{fmt(link.clicks)}</span>
                    </td>
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                      <span style={{ fontWeight: 700, color: "var(--ocean-600)" }}>{link.ctr}%</span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                      {fmtDate(link.createdAt)}
                    </td>
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                      <button
                        onClick={() => onRemoveLink(campaign.id, link.id)}
                        style={{ height: 28, border: "1px solid #FECACA", background: "#FEF2F2", color: "#B91C1C", padding: "0 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                      >
                        Remove link
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      )}

      {showCreateLinkModal && (
        <CampaignLinkCreateModal
          campaignName={campaign.name}
          campaignId={campaign.id}
          onClose={() => setShowCreateLinkModal(false)}
          onCreate={(input) => {
            onAddLink(campaign.id, input);
            setShowCreateLinkModal(false);
          }}
        />
      )}

      {showExistingLinkModal && (
        <CampaignExistingLinkModal
          currentCampaignId={campaign.id}
          campaignName={campaign.name}
          currentCampaignLinks={links}
          existingLinks={existingLinks}
          onClose={() => setShowExistingLinkModal(false)}
          onAttach={(link) => {
            onAttachExistingLink(campaign.id, link);
            setShowExistingLinkModal(false);
          }}
        />
      )}
    </div>
  );
}

function CampaignLinkCreateModal({
  campaignName,
  campaignId,
  onClose,
  onCreate,
}: {
  campaignName: string;
  campaignId: string;
  onClose: () => void;
  onCreate: (input: { shortUrl: string; destination: string; tags: string[] }) => void;
}) {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5055";
  const SHORT_DOMAIN = process.env.NEXT_PUBLIC_SHORT_DOMAIN ?? "url.ify";

  const [destination, setDestination] = useState("https://");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [expiryDays, setExpiryDays] = useState("30");
  const [oneTimeUse, setOneTimeUse] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ shortUrl: string; redirectUrl: string } | null>(null);

  const sx: React.CSSProperties = {
    width: "100%", height: 32, border: "1px solid var(--border)",
    background: "var(--sky-100)", padding: "0 8px",
    fontFamily: "var(--font-body)", fontSize: 12, color: "var(--ink)", outline: "none",
  };
  const lx: React.CSSProperties = {
    display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
    textTransform: "uppercase" as const, color: "var(--text-secondary)", marginBottom: 3,
  };

  if (created) {
    return (
      <Modal open={true} onClose={onClose} title="Link created" width={480}>
        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ background: "#ECFDF3", border: "1px solid #A7F3D0", padding: "12px 14px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 700, color: "#047857", fontSize: 13 }}>✓ Link created and assigned to <em>{campaignName}</em></span>
          </div>
          <div>
            <span style={lx}>Short URL</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6, height: 32, border: "1px solid var(--border)", background: "var(--sky-100)", padding: "0 8px" }}>
              <span style={{ flex: 1, fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700 }}>{created.shortUrl}</span>
              <a href={created.redirectUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-muted)", display: "flex" }}>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, paddingTop: 4, borderTop: "1px solid var(--border)" }}>
            <button onClick={() => { setCreated(null); setDestination("https://"); setTitle(""); setTags(""); setExpiryDays("30"); setOneTimeUse(false); }}
              style={{ flex: 1, height: 32, border: "1px solid var(--ocean-300)", background: "transparent", color: "var(--ocean-600)", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "var(--font-body)" }}>
              Add another
            </button>
            <button onClick={onClose}
              style={{ flex: 1, height: 32, border: "none", background: "var(--ocean-500)", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "var(--font-body)" }}>
              Done
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={true} onClose={onClose} title={`New link → ${campaignName}`} width={520}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const dest = destination.trim();
          if (!dest || dest === "https://") { setError("Destination URL is required."); return; }
          setError(null);
          setSubmitting(true);
          const expiryMinutes = expiryDays ? Math.max(1, Number(expiryDays)) * 24 * 60 : 43200;
          const parsedTags = tags.split(",").map((t) => t.trim()).filter(Boolean);
          api
            .post<{ shortCode: string; shortUrl: string }>("/api/v1/short-links", {
              finalUrl: dest, expiryMinutes, oneTimeUse,
            })
            .then((res) => {
              const shortCode = res.shortCode;
              const redirectUrl = res.shortUrl || `${API_BASE}/r/${shortCode}`;
              const displayUrl = `${SHORT_DOMAIN}/${shortCode}`;
              // Set title, tags, and campaign via update
              api.put(`/api/admin/v1/links/${shortCode}`, {
                title: title.trim() || undefined,
                tags: parsedTags.length > 0 ? parsedTags : undefined,
                campaignId: campaignId || undefined,
              }).catch(console.error);
              onCreate({ shortUrl: displayUrl, destination: dest, tags: parsedTags });
              setCreated({ shortUrl: displayUrl, redirectUrl });
            })
            .catch((err: Error) => setError(err.message))
            .finally(() => setSubmitting(false));
        }}
        style={{ display: "grid", gap: 12 }}
      >
        {error && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C", padding: "8px 12px", fontSize: 12, fontWeight: 600 }}>
            {error}
          </div>
        )}

        <div>
          <span style={lx}>Campaign</span>
          <div style={{ height: 32, border: "1px solid var(--border)", background: "var(--sky-200)", display: "flex", alignItems: "center", padding: "0 8px", fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>
            {campaignName}
          </div>
        </div>

        <label style={{ display: "grid", gap: 3 }}>
          <span style={lx}>Destination URL <span style={{ color: "#B91C1C" }}>*</span></span>
          <input value={destination} onChange={(e) => setDestination(e.target.value)}
            onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--ocean-500)"; }}
            onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--border)"; }}
            style={sx} required placeholder="https://your-destination.com/page" autoFocus />
        </label>

        <label style={{ display: "grid", gap: 3 }}>
          <span style={lx}>Title <span style={{ color: "var(--text-muted)", fontWeight: 400, textTransform: "none" as const }}>(optional)</span></span>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--ocean-500)"; }}
            onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--border)"; }}
            style={sx} placeholder="e.g. Campaign homepage" />
        </label>

        <label style={{ display: "grid", gap: 3 }}>
          <span style={lx}>Tags <span style={{ color: "var(--text-muted)", fontWeight: 400, textTransform: "none" as const }}>(comma separated)</span></span>
          <input value={tags} onChange={(e) => setTags(e.target.value)}
            onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--ocean-500)"; }}
            onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--border)"; }}
            style={sx} placeholder="campaign, product" />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label style={{ display: "grid", gap: 3 }}>
            <span style={lx}>Expiry <span style={{ color: "var(--text-muted)", fontWeight: 400, textTransform: "none" as const }}>(days)</span></span>
            <input type="number" min={1} max={365} value={expiryDays} onChange={(e) => setExpiryDays(e.target.value)}
              onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--ocean-500)"; }}
              onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--border)"; }}
              style={sx} placeholder="30" />
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <span style={lx}>One-time use</span>
            <div style={{ display: "flex", alignItems: "center", height: 32, gap: 8 }}>
              <button type="button" onClick={() => setOneTimeUse((v) => !v)}
                style={{ width: 40, height: 22, background: oneTimeUse ? "var(--ocean-500)" : "#E5E7EB", border: `1px solid ${oneTimeUse ? "var(--ocean-600)" : "#D1D5DB"}`, borderRadius: 2, cursor: "pointer", position: "relative", flexShrink: 0 }}>
                <div style={{ position: "absolute", width: 16, height: 16, background: "white", border: `1px solid ${oneTimeUse ? "var(--ocean-400)" : "#D1D5DB"}`, top: 2, left: oneTimeUse ? 20 : 2, transition: "left 0.15s" }} />
              </button>
              <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>Expires after first click</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
          <button type="button" onClick={onClose}
            style={{ height: 32, padding: "0 14px", border: "1px solid var(--border)", background: "var(--sky-100)", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "var(--font-body)" }}>
            Cancel
          </button>
          <button type="submit" disabled={submitting}
            style={{ height: 32, padding: "0 18px", border: "none", background: submitting ? "var(--ocean-300)" : "var(--ocean-500)", color: "#fff", fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", fontSize: 12, fontFamily: "var(--font-body)" }}>
            {submitting ? "Creating…" : "Create link"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function CampaignExistingLinkModal({
  currentCampaignId,
  campaignName,
  currentCampaignLinks,
  existingLinks,
  onClose,
  onAttach,
}: {
  currentCampaignId: string;
  campaignName: string;
  currentCampaignLinks: CampaignLink[];
  existingLinks: ExistingCampaignLink[];
  onClose: () => void;
  onAttach: (link: ExistingCampaignLink) => void;
}) {
  const [query, setQuery] = useState("");
  const [pendingMoveKey, setPendingMoveKey] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const assignedSet = useMemo(
    () => new Set(currentCampaignLinks.map((l) => `${l.shortUrl}|${l.destination}`)),
    [currentCampaignLinks]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return existingLinks
      .filter((link) => {
        if (assignedSet.has(`${link.shortUrl}|${link.destination}`)) return false;
        if (!q) return true;
        return (
          link.shortUrl.toLowerCase().includes(q) ||
          link.destination.toLowerCase().includes(q) ||
          link.tags.some((tag) => tag.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => b.clicks - a.clicks);
  }, [existingLinks, assignedSet, query]);

  return (
    <Modal open={true} onClose={onClose} title={`Add existing link to ${campaignName}`} width={980}>
      <div style={{ display: "grid", gap: 10 }}>
        {warningMessage && (
          <div style={{ border: "1px solid #FECACA", background: "#FEF2F2", color: "#B91C1C", fontSize: 12, fontWeight: 600, padding: "8px 10px" }}>
            {warningMessage}
          </div>
        )}

        <div style={{ position: "relative" }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search short URL, destination, or tags"
            style={{ ...inputSx, paddingLeft: 30 }}
            onFocus={iFocus}
            onBlur={iBlur}
          />
        </div>

        <div style={{ maxHeight: 460, overflow: "auto", border: "1px solid var(--border)", background: "var(--cloud)" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "24px 12px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
              No matching unassigned links found.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "var(--sky-100)", borderBottom: "1px solid var(--border)" }}>
                  {[
                    "Short URL",
                    "Destination",
                    "Campaigns",
                    "Tags",
                    "Clicks",
                    "CTR",
                    "Action",
                  ].map((h) => (
                    <th key={h} style={{ padding: "9px 10px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((link, idx) => (
                  <tr key={`${link.id}-${idx}`} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "10px", fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-mono)" }}>{link.shortUrl}</td>
                    <td style={{ padding: "10px", color: "var(--text-secondary)", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{link.destination}</td>
                    <td style={{ padding: "10px", color: "var(--text-secondary)", maxWidth: 180 }}>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {link.campaignNames.map((name) => (
                          <Badge key={name} variant="mono">{name}</Badge>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: "10px" }}>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {link.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="muted">{tag}</Badge>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: "10px", fontWeight: 700 }}>{fmt(link.clicks)}</td>
                    <td style={{ padding: "10px", color: "var(--ocean-600)", fontWeight: 700 }}>{link.ctr}%</td>
                    <td style={{ padding: "10px", whiteSpace: "nowrap", width: 130 }}>
                      <button
                        onClick={() => {
                          const key = `${link.shortUrl}|${link.destination}`;
                          const assignedElsewhere = link.campaignIds.some((id) => id !== currentCampaignId);

                          if (assignedElsewhere && pendingMoveKey !== key) {
                            setPendingMoveKey(key);
                            setWarningMessage(`This link is already assigned to ${link.campaignNames.join(", ")}. Adding it here will automatically remove it from the existing campaign.`);
                            return;
                          }

                          setPendingMoveKey(null);
                          setWarningMessage(null);
                          onAttach(link);
                        }}
                        style={{
                          height: 28,
                          minWidth: 110,
                          border: "none",
                          background: "var(--ocean-500)",
                          color: "#fff",
                          padding: "0 10px",
                          fontSize: 11,
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                          cursor: "pointer",
                        }}
                      >
                        {pendingMoveKey === `${link.shortUrl}|${link.destination}` ? "Confirm move" : "Add"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 4 }}>
          <button
            onClick={onClose}
            style={{ height: 30, padding: "0 10px", border: "1px solid var(--border)", background: "var(--sky-100)", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   PAGE COMPONENT
══════════════════════════════════════════════════════════════════════════ */
export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignLinksMap, setCampaignLinksMap] = useState<Record<string, CampaignLink[]>>({});
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | CampaignStatus>("all");
  const [budgetRange, setBudgetRange] = useState<"all" | "lt1000" | "1000to3000" | "3000to5000" | "gt5000">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "clicks" | "ctr" | "name">("newest");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(6);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [viewCampaign, setViewCampaign] = useState<Campaign | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  /* Modal state */
  const [showCreate, setShowCreate] = useState(false);
  const [createdCampaign, setCreatedCampaign] = useState<Campaign | null>(null);
  const [editTarget, setEditTarget] = useState<Campaign | null>(null);
  const [cloneTarget, setCloneTarget] = useState<Campaign | null>(null);
  const [statusTarget, setStatusTarget] = useState<Campaign | null>(null);

  /* Form state */
  const [form, setForm] = useState<FormState>(blankForm());
  const [cloneForm, setCloneForm] = useState({ newName: "", startDate: "", endDate: "" });
  const [newStatus, setNewStatus] = useState<CampaignStatus>("Active");
  const [statusReason, setStatusReason] = useState("");

  /* Close action menu on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* Load campaigns from backend */
  useEffect(() => {
    let cancelled = false;
    setLoadingCampaigns(true);
    api
      .get<{ total: number; items: CampaignDto[] }>("/api/admin/v1/campaigns?pageSize=100")
      .then((res) => {
        if (!cancelled) setCampaigns(res.items.map(mapCampaignDto));
      })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoadingCampaigns(false); });
    return () => { cancelled = true; };
  }, []);

  /* Load campaign links when opening detail view */
  useEffect(() => {
    if (!viewCampaign) return;
    const id = viewCampaign.id;
    api
      .get<CampaignAnalyticsSummary>(
        `/api/admin/v1/campaigns/${id}/analytics/summary?lastHours=720&topLinks=20`
      )
      .then((res) => {
        if (!res.topLinks) return;
        const links: CampaignLink[] = Object.entries(res.topLinks).map(([shortCode, clicks]) => ({
          id: shortCode,
          shortUrl: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5055"}/r/${shortCode}`,
          destination: "—",
          clicks: Number(clicks),
          ctr: 0,
          tags: [],
          createdAt: "—",
        }));
        setCampaignLinksMap((prev) => ({ ...prev, [id]: links }));
      })
      .catch(console.error);
  }, [viewCampaign?.id]);

  /* Filtered list (search + advanced filters + sorting) */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    const next = campaigns.filter((c) => {
      const matchesSearch =
        q.length === 0 ||
        c.name.toLowerCase().includes(q) ||
        (c.description ?? "").toLowerCase().includes(q) ||
        (c.utmCampaign ?? "").toLowerCase().includes(q) ||
        (c.utmSource ?? "").toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      const campaignBudget = c.budgetAmount ?? 0;
      const matchesBudgetRange =
        budgetRange === "all" ||
        (budgetRange === "lt1000" && campaignBudget < 1000) ||
        (budgetRange === "1000to3000" && campaignBudget >= 1000 && campaignBudget <= 3000) ||
        (budgetRange === "3000to5000" && campaignBudget > 3000 && campaignBudget <= 5000) ||
        (budgetRange === "gt5000" && campaignBudget > 5000);
      return matchesSearch && matchesStatus && matchesBudgetRange;
    });

    next.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "clicks") return b.clicks - a.clicks;
      if (sortBy === "ctr") return b.ctr - a.ctr;
      if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return next;
  }, [campaigns, search, statusFilter, budgetRange, sortBy]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, budgetRange, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedCampaigns = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  const existingLinksPool = useMemo(() => {
    const byId = new Map(campaigns.map((c) => [c.id, c.name]));
    const unique = new Map<string, ExistingCampaignLink>();

    Object.entries(campaignLinksMap).forEach(([campaignId, links]) => {
      const campaignName = byId.get(campaignId) ?? campaignId;
      links.forEach((link) => {
        const key = `${link.shortUrl}|${link.destination}`;
        const found = unique.get(key);

        if (!found) {
          unique.set(key, {
            ...link,
            campaignIds: [campaignId],
            campaignNames: [campaignName],
          });
          return;
        }

        if (!found.campaignIds.includes(campaignId)) {
          found.campaignIds.push(campaignId);
          found.campaignNames.push(campaignName);
        }
      });
    });

    return Array.from(unique.values());
  }, [campaignLinksMap, campaigns]);

  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const totalBudget = campaigns.reduce((s, c) => s + (c.budgetAmount ?? 0), 0);
  const activeCount = campaigns.filter((c) => c.status === "Active").length;
  const chartData = campaigns.filter((c) => c.status !== "Archived");

  /* ── Handlers ───────────────────────────────────────────────────────── */
  function openCreate() { setForm(blankForm()); setShowCreate(true); }

  function openEdit(c: Campaign) {
    setForm(campaignToForm(c));
    setEditTarget(c);
    setOpenMenu(null);
    // if editing from detail view, keep detail open after save
  }

  function openClone(c: Campaign) {
    setCloneTarget(c);
    setCloneForm({ newName: `${c.name} (Copy)`, startDate: c.startDate ?? "", endDate: c.endDate ?? "" });
    setOpenMenu(null);
  }

  function openStatusChange(c: Campaign) { setStatusTarget(c); setNewStatus(c.status); setOpenMenu(null); }

  function handleCreate() {
    const payload = {
      name: form.name, description: form.description,
      status: mapStatusToBackend(form.status),
      startDateUtc: form.startDate || undefined, endDateUtc: form.endDate || undefined,
      dailyClickLimit: form.dailyClickLimit || undefined,
      totalClickLimit: form.totalClickLimit || undefined,
      budgetAmount: form.budgetAmount || undefined, currency: form.currency,
      utmSource: form.utmSource || undefined, utmMedium: form.utmMedium || undefined,
      utmCampaign: form.utmCampaign || undefined,
    };
    api
      .post<CampaignCreateResponse>("/api/admin/v1/campaigns", payload)
      .then((res) => {
        const next: Campaign = {
          ...form, id: res.id,
          clicks: 0, links: 0, ctr: 0,
          createdAt: res.createdAtUtc?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
        };
        setCampaigns((prev) => [next, ...prev]);
        setCreatedCampaign(next);
      })
      .catch((err: Error) => alert(`Failed to create campaign: ${err.message}`));
  }

  function handleEdit() {
    if (!editTarget) return;
    const updated = { ...editTarget, ...form };
    setCampaigns((prev) => prev.map((c) => c.id === editTarget.id ? updated : c));
    if (viewCampaign?.id === editTarget.id) setViewCampaign(updated);
    setEditTarget(null);
    api
      .put(`/api/admin/v1/campaigns/${editTarget.id}`, {
        name: form.name, description: form.description,
        startDateUtc: form.startDate || undefined, endDateUtc: form.endDate || undefined,
        dailyClickLimit: form.dailyClickLimit || undefined,
        totalClickLimit: form.totalClickLimit || undefined,
        budgetAmount: form.budgetAmount || undefined, currency: form.currency,
        utmSource: form.utmSource || undefined, utmMedium: form.utmMedium || undefined,
        utmCampaign: form.utmCampaign || undefined,
      })
      .catch(console.error);
  }

  function handleClone() {
    if (!cloneTarget) return;
    const cloned: Campaign = {
      ...cloneTarget, id: `c${Date.now()}`,
      name: cloneForm.newName || `${cloneTarget.name} (Copy)`,
      startDate: cloneForm.startDate || cloneTarget.startDate,
      endDate: cloneForm.endDate || cloneTarget.endDate,
      status: "Paused", clicks: 0, links: 0, ctr: 0,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setCampaigns((prev) => [cloned, ...prev]);
    setCloneTarget(null);
    api
      .post<CampaignCreateResponse>(`/api/admin/v1/campaigns/${cloneTarget.id}/clone`, {
        newName: cloneForm.newName || `${cloneTarget.name} (Copy)`,
        startDateUtc: cloneForm.startDate || undefined,
        endDateUtc: cloneForm.endDate || undefined,
      })
      .then((res) => {
        // Update the local clone with the real ID from backend
        setCampaigns((prev) => prev.map((c) =>
          c.id === cloned.id ? { ...c, id: res.id } : c
        ));
      })
      .catch(console.error);
  }

  function handleStatusChange() {
    if (!statusTarget) return;
    const updated = { ...statusTarget, status: newStatus };
    setCampaigns((prev) => prev.map((c) => c.id === statusTarget.id ? updated : c));
    if (viewCampaign?.id === statusTarget.id) setViewCampaign(updated);
    setStatusTarget(null);
    setStatusReason("");
    api
      .post(`/api/admin/v1/campaigns/${statusTarget.id}/status`, {
        status: mapStatusToBackend(newStatus), reason: statusReason || undefined,
      })
      .catch(console.error);
  }

  function handleArchive(id: string) {
    setCampaigns((p) => p.map((c) => c.id === id ? { ...c, status: "Archived" as const } : c));
    if (viewCampaign?.id === id) setViewCampaign((v) => v ? { ...v, status: "Archived" } : v);
    setOpenMenu(null);
    api.post(`/api/admin/v1/campaigns/${id}/archive`, {}).catch(console.error);
  }
  function handleRestore(id: string) {
    setCampaigns((p) => p.map((c) => c.id === id ? { ...c, status: "Paused" as const } : c));
    if (viewCampaign?.id === id) setViewCampaign((v) => v ? { ...v, status: "Paused" } : v);
    setOpenMenu(null);
    api.post(`/api/admin/v1/campaigns/${id}/restore`, {}).catch(console.error);
  }
  function handleDelete(id: string) {
    setCampaigns((p) => p.filter((c) => c.id !== id));
    if (viewCampaign?.id === id) setViewCampaign(null);
    setOpenMenu(null);
  }

  function addLinkToCampaign(campaignId: string, input: { shortUrl: string; destination: string; tags: string[] }) {
    setCampaignLinksMap((prev) => {
      const current = prev[campaignId] ?? [];
      const newLink: CampaignLink = {
        id: `l-${Date.now()}`,
        shortUrl: input.shortUrl,
        destination: input.destination,
        tags: input.tags,
        clicks: 0,
        ctr: 0,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      const nextLinks = [...current, newLink];

      setCampaigns((existing) =>
        existing.map((c) => (c.id === campaignId ? withRealtimeCampaignMetrics(c, nextLinks) : c))
      );
      setViewCampaign((currentView) => {
        if (!currentView || currentView.id !== campaignId) return currentView;
        return withRealtimeCampaignMetrics(currentView, nextLinks);
      });

      return { ...prev, [campaignId]: nextLinks };
    });
  }

  function attachExistingLinkToCampaign(campaignId: string, link: ExistingCampaignLink) {
    setCampaignLinksMap((prev) => {
      const { campaignIds: _campaignIds, campaignNames: _campaignNames, ...baseLink } = link;
      const nextMap: Record<string, CampaignLink[]> = {};

      Object.entries(prev).forEach(([id, links]) => {
        if (id === campaignId) {
          nextMap[id] = links;
          return;
        }
        nextMap[id] = links.filter((item) => !(item.shortUrl === baseLink.shortUrl && item.destination === baseLink.destination));
      });

      const current = nextMap[campaignId] ?? [];
      const exists = current.some((item) => item.shortUrl === baseLink.shortUrl && item.destination === baseLink.destination);
      nextMap[campaignId] = exists ? current : [...current, { ...baseLink }];

      setCampaigns((existing) => existing.map((c) => withRealtimeCampaignMetrics(c, nextMap[c.id] ?? [])));
      setViewCampaign((currentView) => {
        if (!currentView) return currentView;
        return withRealtimeCampaignMetrics(currentView, nextMap[currentView.id] ?? []);
      });

      return nextMap;
    });
  }

  function removeLinkFromCampaign(campaignId: string, linkId: string) {
    setCampaignLinksMap((prev) => {
      const current = prev[campaignId] ?? [];
      const nextLinks = current.filter((l) => l.id !== linkId);

      setCampaigns((existing) =>
        existing.map((c) => (c.id === campaignId ? withRealtimeCampaignMetrics(c, nextLinks) : c))
      );
      setViewCampaign((currentView) => {
        if (!currentView || currentView.id !== campaignId) return currentView;
        return withRealtimeCampaignMetrics(currentView, nextLinks);
      });

      return { ...prev, [campaignId]: nextLinks };
    });
  }

  /* ── Render: detail view ─────────────────────────────────────────────── */
  if (viewCampaign) {
    return (
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <CampaignDetail
          campaign={viewCampaign}
          links={campaignLinksMap[viewCampaign.id] ?? []}
          existingLinks={existingLinksPool}
          onAddLink={addLinkToCampaign}
          onAttachExistingLink={attachExistingLinkToCampaign}
          onRemoveLink={removeLinkFromCampaign}
          onBack={() => setViewCampaign(null)}
          onEdit={openEdit}
        />
        {/* Edit modal still works from detail view */}
        <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title={`Edit: ${editTarget?.name ?? ""}`} width={520}>
          <CampaignFormBody form={form} setForm={setForm} showStatus />
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <SaveBtn label="Save changes" onClick={handleEdit} disabled={!form.name.trim()} />
            <CancelBtn onClick={() => setEditTarget(null)} />
          </div>
        </Modal>
      </div>
    );
  }

  /* ── Render: list view ───────────────────────────────────────────────── */
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <PageHeader
        title="Campaigns"
        description="Group links into campaigns, set budgets, enforce click limits, and track performance."
        breadcrumb="Platform"
        action={
          <button onClick={openCreate} style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            background: "var(--ocean-500)", color: "#fff", border: "none",
            padding: "0 18px", height: 38, fontWeight: 700, fontSize: 12,
            letterSpacing: "0.06em", textTransform: "uppercase",
            cursor: "pointer", fontFamily: "var(--font-body)",
          }}>
            <Plus size={14} /> New campaign
          </button>
        }
      />

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total campaigns", value: campaigns.length,       icon: <Megaphone size={18} /> },
          { label: "Active",          value: activeCount,             icon: <Play size={18} /> },
          { label: "Total clicks",    value: fmt(totalClicks),        icon: <MousePointerClick size={18} /> },
          { label: "Total budget",    value: `$${fmt(totalBudget)}`,  icon: <DollarSign size={18} /> },
        ].map((s) => (
          <StatCard key={s.label} micro label={s.label} value={s.value} icon={s.icon} />
        ))}
      </div>

      {/* ── Chart ──────────────────────────────────────────────────────── */}
      {chartData.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <Panel title="Click performance" subtitle="Clicks by active & paused campaigns">
            <div style={{ height: 200 }}>
              <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                  <XAxis dataKey="name" tick={TICK_STYLE} axisLine={false} tickLine={false} />
                  <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="clicks" fill="var(--ocean-500)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      )}

      {/* ── Filters ────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 12, border: "1px solid var(--border)", background: "var(--cloud)", padding: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr repeat(3, minmax(120px, 1fr))", gap: 8 }}>
          <div style={{ position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
            <input
              placeholder="Search campaigns…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...inputSx, paddingLeft: 32, height: 34 }}
              onFocus={iFocus}
              onBlur={iBlur}
            />
          </div>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "all" | CampaignStatus)} style={{ ...selectSx, height: 34 }}>
            <option value="all">All status</option>
            <option value="Active">Active</option>
            <option value="Paused">Paused</option>
            <option value="Archived">Archived</option>
          </select>

          <select value={budgetRange} onChange={(e) => setBudgetRange(e.target.value as "all" | "lt1000" | "1000to3000" | "3000to5000" | "gt5000")} style={{ ...selectSx, height: 34 }}>
            <option value="all">All budgets</option>
            <option value="lt1000">Under 1000 USD</option>
            <option value="1000to3000">1000 to 3000 USD</option>
            <option value="3000to5000">3000 to 5000 USD</option>
            <option value="gt5000">Above 5000 USD</option>
          </select>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as "newest" | "oldest" | "clicks" | "ctr" | "name")} style={{ ...selectSx, height: 34 }}>
            <option value="newest">Sort: Newest</option>
            <option value="oldest">Sort: Oldest</option>
            <option value="clicks">Sort: Clicks</option>
            <option value="ctr">Sort: CTR</option>
            <option value="name">Sort: Name</option>
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>
            Showing {filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1} to {Math.min(safePage * pageSize, filtered.length)} of {filtered.length} campaigns
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => { setSearch(""); setStatusFilter("all"); setBudgetRange("all"); setSortBy("newest"); }}
              style={{ height: 30, border: "1px solid var(--border)", background: "var(--sky-100)", color: "var(--text-secondary)", padding: "0 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* ── Campaign cards ─────────────────────────────────────────────── */}
      <div
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 10 }}
        ref={menuRef}
      >
        {pagedCampaigns.map((campaign) => (
          <div key={campaign.id} style={{
            background: "var(--cloud)",
            border: "1px solid var(--border)",
            borderTop: `3px solid ${STATUS_BAR[campaign.status]}`,
            boxShadow: "var(--shadow-xs)",
            opacity: campaign.status === "Archived" ? 0.75 : 1,
            display: "flex", flexDirection: "column",
          }}>
            {/* Clickable body → detail view */}
            <div
              onClick={() => setViewCampaign(campaign)}
              style={{ padding: 14, cursor: "pointer", flex: 1 }}
            >
              {/* Header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.01em" }}>
                      {campaign.name}
                    </span>
                    <Badge variant={STATUS_BADGE[campaign.status]}>{campaign.status}</Badge>
                  </div>
                  {campaign.description && (
                    <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {campaign.description}
                    </p>
                  )}
                </div>
                <ChevronRight size={14} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 2 }} />
              </div>

              {/* Stats row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 5, marginBottom: 8 }}>
                {[
                  { label: "Clicks", value: fmt(campaign.clicks) },
                  { label: "Links",  value: campaign.links },
                  { label: "CTR",    value: `${campaign.ctr}%` },
                ].map((s) => (
                  <div key={s.label} style={{ background: "var(--sky-100)", padding: "6px 8px" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 2 }}>{s.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)", fontFamily: "var(--font-display)" }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Meta */}
              <div style={{ display: "grid", gap: 4, fontSize: 11 }}>
                {(campaign.startDate || campaign.endDate) && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-secondary)" }}>
                    <Calendar size={11} style={{ flexShrink: 0, color: "var(--text-muted)" }} />
                    {fmtDate(campaign.startDate)} – {fmtDate(campaign.endDate)}
                  </div>
                )}
                {campaign.budgetAmount !== undefined && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-secondary)" }}>
                    <DollarSign size={11} style={{ flexShrink: 0, color: "var(--text-muted)" }} />
                    {campaign.currency} {fmt(campaign.budgetAmount)} budget
                  </div>
                )}
                {(campaign.dailyClickLimit || campaign.totalClickLimit) && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-secondary)" }}>
                    <Target size={11} style={{ flexShrink: 0, color: "var(--text-muted)" }} />
                    {[
                      campaign.dailyClickLimit && `${fmt(campaign.dailyClickLimit)}/day`,
                      campaign.totalClickLimit && `${fmt(campaign.totalClickLimit)} total`,
                    ].filter(Boolean).join(" · ")}
                  </div>
                )}
                {(campaign.utmSource || campaign.utmMedium || campaign.utmCampaign) && (
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 2 }}>
                    {campaign.utmSource   && <Badge variant="mono">{campaign.utmSource}</Badge>}
                    {campaign.utmMedium   && <Badge variant="mono">{campaign.utmMedium}</Badge>}
                    {campaign.utmCampaign && <Badge variant="mono">{campaign.utmCampaign}</Badge>}
                  </div>
                )}
              </div>
            </div>

            {/* ── Action menu footer ────────────────────────────────────── */}
            <div style={{ borderTop: "1px solid var(--border)", padding: "6px 10px", display: "flex", justifyContent: "flex-end" }}>
              <div style={{ position: "relative" }}>
                <button
                  onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === campaign.id ? null : campaign.id); }}
                  style={{ background: "none", border: "1px solid var(--border)", width: 30, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-muted)" }}
                >
                  <MoreHorizontal size={14} />
                </button>

                {openMenu === campaign.id && (
                  <div style={{ position: "absolute", right: 0, bottom: 34, background: "var(--cloud)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)", zIndex: 50, minWidth: 175 }}>
                    {[
                      { label: "View details",   icon: <ChevronRight size={13} />, action: () => { setViewCampaign(campaign); setOpenMenu(null); } },
                      { label: "Edit",           icon: <Pencil size={13} />,       action: () => openEdit(campaign) },
                      { label: "Change status",  icon: <ChevronDown size={13} />,  action: () => openStatusChange(campaign) },
                      { label: "Clone",          icon: <Copy size={13} />,         action: () => openClone(campaign) },
                      campaign.status === "Archived"
                        ? { label: "Restore", icon: <RotateCcw size={13} />, action: () => handleRestore(campaign.id), color: "#16a34a" }
                        : { label: "Archive", icon: <Archive size={13} />,   action: () => handleArchive(campaign.id) },
                      { label: "Delete", icon: <Trash2 size={13} />, action: () => handleDelete(campaign.id), color: "#ef4444" },
                    ].map((item, i, arr) => (
                      <button key={i} onClick={item.action} style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 9,
                        padding: "9px 14px", background: "none", border: "none",
                        borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none",
                        fontSize: 13, color: item.color ?? "var(--ink)",
                        cursor: "pointer", fontFamily: "var(--font-body)", textAlign: "left",
                      }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--sky-100)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                      >
                        {item.icon} {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

      </div>

      {filtered.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>
            Page {safePage} of {totalPages}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              style={{ height: 30, border: "1px solid var(--border)", background: "var(--sky-100)", color: "var(--text-secondary)", padding: "0 10px", fontSize: 11, fontWeight: 700, cursor: safePage <= 1 ? "not-allowed" : "pointer", opacity: safePage <= 1 ? 0.5 : 1 }}
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              style={{ height: 30, border: "1px solid var(--border)", background: "var(--sky-100)", color: "var(--text-secondary)", padding: "0 10px", fontSize: 11, fontWeight: 700, cursor: safePage >= totalPages ? "not-allowed" : "pointer", opacity: safePage >= totalPages ? 0.5 : 1 }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {loadingCampaigns && campaigns.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)", fontSize: 14 }}>
          Loading campaigns…
        </div>
      )}

      {!loadingCampaigns && filtered.length === 0 && campaigns.length > 0 && (
        <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)", fontSize: 14 }}>
          No campaigns match the current filters.
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────────────────── */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); setCreatedCampaign(null); }} title={createdCampaign ? "Campaign created" : "Create campaign"} width={640}>
        {createdCampaign ? (
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ background: "#ECFDF3", border: "1px solid #A7F3D0", padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontWeight: 700, color: "#047857", fontSize: 13 }}>✓ Campaign <em>{createdCampaign.name}</em> created successfully</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {([
                ["Name", createdCampaign.name],
                ["Status", createdCampaign.status],
                ["Start date", fmtDate(createdCampaign.startDate)],
                ["End date", fmtDate(createdCampaign.endDate)],
                ["Currency", createdCampaign.currency],
                ["Budget", createdCampaign.budgetAmount ? `${createdCampaign.budgetAmount.toLocaleString()} ${createdCampaign.currency}` : "—"],
              ] as [string, string][]).map(([label, value]) => (
                <div key={label} style={{ borderLeft: "2px solid var(--ocean-200)", paddingLeft: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>{value || "—"}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, paddingTop: 4, borderTop: "1px solid var(--border)" }}>
              <button
                onClick={() => { setCreatedCampaign(null); setForm(blankForm()); }}
                style={{ flex: 1, height: 32, border: "1px solid var(--ocean-300)", background: "transparent", color: "var(--ocean-600)", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "var(--font-body)" }}
              >
                Create another
              </button>
              <button
                onClick={() => { setShowCreate(false); setCreatedCampaign(null); }}
                style={{ flex: 1, height: 32, border: "none", background: "var(--ocean-500)", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "var(--font-body)" }}
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            <CampaignFormBody form={form} setForm={setForm} />
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <SaveBtn label="Create campaign" onClick={handleCreate} disabled={!form.name.trim()} />
              <CancelBtn onClick={() => setShowCreate(false)} />
            </div>
          </>
        )}
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title={`Edit: ${editTarget?.name ?? ""}`} width={520}>
        <CampaignFormBody form={form} setForm={setForm} showStatus />
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <SaveBtn label="Save changes" onClick={handleEdit} disabled={!form.name.trim()} />
          <CancelBtn onClick={() => setEditTarget(null)} />
        </div>
      </Modal>

      <Modal open={!!cloneTarget} onClose={() => setCloneTarget(null)} title={`Clone: ${cloneTarget?.name ?? ""}`} width={420}>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 0, marginBottom: 16 }}>
          Creates a copy in <strong>Paused</strong> status with zero stats.
        </p>
        <Field label="New campaign name">
          <input style={inputSx} value={cloneForm.newName}
            onChange={(e) => setCloneForm((f) => ({ ...f, newName: e.target.value }))}
            onFocus={iFocus} onBlur={iBlur} />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="New start date">
            <input type="date" style={inputSx} value={cloneForm.startDate}
              onChange={(e) => setCloneForm((f) => ({ ...f, startDate: e.target.value }))}
              onFocus={iFocus} onBlur={iBlur} />
          </Field>
          <Field label="New end date">
            <input type="date" style={inputSx} value={cloneForm.endDate}
              onChange={(e) => setCloneForm((f) => ({ ...f, endDate: e.target.value }))}
              onFocus={iFocus} onBlur={iBlur} />
          </Field>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <SaveBtn label="Clone campaign" onClick={handleClone} />
          <CancelBtn onClick={() => setCloneTarget(null)} />
        </div>
      </Modal>

      <Modal open={!!statusTarget} onClose={() => setStatusTarget(null)} title="Change campaign status" width={380}>
        <Field label="New status">
          <select style={selectSx} value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as CampaignStatus)}
            onFocus={iFocus} onBlur={iBlur}>
            <option value="Active">Active</option>
            <option value="Paused">Paused</option>
            <option value="Archived">Archived</option>
          </select>
        </Field>
        <Field label="Reason" hint="Sent in the POST body as 'reason'. Recorded in audit log.">
          <input style={inputSx} value={statusReason} placeholder="e.g. Budget exhausted"
            onChange={(e) => setStatusReason(e.target.value)}
            onFocus={iFocus} onBlur={iBlur} />
        </Field>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <SaveBtn label="Apply" onClick={handleStatusChange} />
          <CancelBtn onClick={() => { setStatusTarget(null); setStatusReason(""); }} />
        </div>
      </Modal>
    </div>
  );
}
