"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BarChart2,
  Check,
  Copy,
  ExternalLink,
  FileText,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react";
import PageHeader from "@/platform/components/PageHeader";
import { api } from "@/platform/lib/api";

type DetailTab = "details" | "analytics" | "qr";

interface LinkRecord {
  id: string;
  shortUrl: string;    // display label, e.g. url.ify/Zt6hRrwx
  redirectUrl: string; // real working URL, e.g. http://localhost:5055/r/Zt6hRrwx
  destination: string;
  slug: string;
  domain: string;
  createdAt: string;
  createdBy: string;
  workspaceId: string;
  tags?: string[];
  expiresAt?: string;
  qrCodeUrl?: string;
  utm?: Record<string, string>;
  isRevoked?: boolean;
  revokedAt?: string;
  campaignAssigned?: boolean;
  trackingPixels?: string[];
  geoRuleEnabled?: boolean;
  geoCountry?: string;
  geoRedirectUrl?: string;
  stats: {
    clicks: number;
    ctr: number;
    timeline: Array<{ date: string; clicks: number }>;
    referrers: Record<string, number>;
    devices: Record<string, number>;
    geo: Record<string, number>;
    campaigns: Record<string, number>;
  };
}

interface LinkListItemDto {
  shortCode: string;
  status: string;
  title?: string | null;
  clickCount: number;
  createdAtUtc: string;
  expiryUtc?: string | null;
  revokedAtUtc?: string | null;
  tags?: string[] | null;
  finalUrl?: string | null;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5055";
const SHORT_DOMAIN = process.env.NEXT_PUBLIC_SHORT_DOMAIN ?? "url.ify";

function mapDto(item: LinkListItemDto): LinkRecord {
  return {
    id: item.shortCode,
    shortUrl: `${SHORT_DOMAIN}/${item.shortCode}`,
    redirectUrl: `${API_BASE}/r/${item.shortCode}`,
    destination: item.finalUrl ?? "—",
    slug: item.shortCode,
    domain: SHORT_DOMAIN,
    createdAt: item.createdAtUtc,
    createdBy: "",
    workspaceId: "",
    tags: item.tags ?? [],
    expiresAt: item.expiryUtc ?? undefined,
    isRevoked: item.status === "revoked",
    revokedAt: item.revokedAtUtc ?? undefined,
    stats: {
      clicks: item.clickCount,
      ctr: 0,
      timeline: [],
      referrers: {},
      devices: {},
      geo: {},
      campaigns: {},
    },
  };
}

function getStatus(link: LinkRecord): "active" | "revoked" | "expired" {
  if (link.isRevoked) return "revoked";
  if (link.expiresAt && new Date(link.expiresAt).getTime() < Date.now()) return "expired";
  return "active";
}

function statusStyle(status: "active" | "revoked" | "expired"): React.CSSProperties {
  if (status === "active") return { background: "#ECFDF3", border: "1px solid #A7F3D0", color: "#047857" };
  if (status === "revoked") return { background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C" };
  return { background: "#FFF7ED", border: "1px solid #FED7AA", color: "#9A3412" };
}

export default function LinkDetailsPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") ?? "details";
  const normalizedInitialTab: DetailTab = tabParam === "overview" ? "details" : (tabParam === "analytics" || tabParam === "qr" || tabParam === "details" ? tabParam : "details");
  const [activeTab, setActiveTab] = useState<DetailTab>(normalizedInitialTab);
  const [isEditing, setIsEditing] = useState(false);
  const [isQrEditing, setIsQrEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  const [link, setLink] = useState<LinkRecord | null>(null);
  const [loadingLink, setLoadingLink] = useState(true);

  useEffect(() => {
    api
      .get<LinkListItemDto>(`/api/admin/v1/links/${params.id}`)
      .then((res) => setLink(mapDto(res)))
      .catch(() => setLink(null))
      .finally(() => setLoadingLink(false));
  }, [params.id]);

  const [editDestination, setEditDestination] = useState(link?.destination ?? "");
  const [editDomain, setEditDomain] = useState(link?.domain ?? "");
  const [editSlug, setEditSlug] = useState(link?.slug ?? "");
  const [editCampaign, setEditCampaign] = useState(Object.keys(link?.stats.campaigns ?? {})[0] ?? "Unassigned");
  const [editTags, setEditTags] = useState((link?.tags ?? []).join(", "));
  const [editCreatedAt, setEditCreatedAt] = useState(link?.createdAt ? link.createdAt.slice(0, 10) : "");
  const [editExpiresAt, setEditExpiresAt] = useState(link?.expiresAt ? link.expiresAt.slice(0, 10) : "");
  const [editUtmSource, setEditUtmSource] = useState(link?.utm?.source ?? "");
  const [editUtmMedium, setEditUtmMedium] = useState(link?.utm?.medium ?? "");
  const [editTrackingPixels, setEditTrackingPixels] = useState((link?.trackingPixels ?? []).join(", "));
  const [editCampaignAssigned, setEditCampaignAssigned] = useState(link?.campaignAssigned ?? ((Object.keys(link?.stats.campaigns ?? {})[0] ?? "Unassigned") !== "Unassigned"));
  const [editGeoEnabled, setEditGeoEnabled] = useState(link?.geoRuleEnabled ?? false);
  const [editGeoCountry, setEditGeoCountry] = useState(link?.geoCountry ?? "");
  const [editGeoRedirectUrl, setEditGeoRedirectUrl] = useState(link?.geoRedirectUrl ?? "");
  const [qrDraft, setQrDraft] = useState(link?.qrCodeUrl ?? "");

  useEffect(() => {
    if (!link) return;
    setEditDestination(link.destination);
    setEditDomain(link.domain);
    setEditSlug(link.slug);
    setEditCampaign(Object.keys(link.stats.campaigns ?? {})[0] ?? "Unassigned");
    setEditTags((link.tags ?? []).join(", "));
    setEditCreatedAt(link.createdAt ? link.createdAt.slice(0, 10) : "");
    setEditExpiresAt(link.expiresAt ? link.expiresAt.slice(0, 10) : "");
    setEditUtmSource(link.utm?.source ?? "");
    setEditUtmMedium(link.utm?.medium ?? "");
    setEditTrackingPixels((link.trackingPixels ?? []).join(", "));
    setEditCampaignAssigned(link.campaignAssigned ?? ((Object.keys(link.stats.campaigns ?? {})[0] ?? "Unassigned") !== "Unassigned"));
    setEditGeoEnabled(link.geoRuleEnabled ?? false);
    setEditGeoCountry(link.geoCountry ?? "");
    setEditGeoRedirectUrl(link.geoRedirectUrl ?? "");
    setQrDraft(link.qrCodeUrl ?? "");
    setIsQrEditing(false);
  }, [link]);

  const topReferrer = useMemo(() => {
    if (!link) return null;
    return Object.entries(link.stats.referrers).sort((a, b) => b[1] - a[1])[0] ?? null;
  }, [link]);

  const topGeo = useMemo(() => {
    if (!link) return null;
    return Object.entries(link.stats.geo).sort((a, b) => b[1] - a[1])[0] ?? null;
  }, [link]);

  const assignedCampaignName = useMemo(() => {
    if (!link) return "";
    const key = Object.keys(link.stats.campaigns ?? {})[0] ?? "Unassigned";
    const assigned = link.campaignAssigned ?? (key !== "Unassigned");
    return assigned ? key : "";
  }, [link]);

  const referrerRows = useMemo(() => (link ? Object.entries(link.stats.referrers).sort((a, b) => b[1] - a[1]) : []), [link]);
  const deviceRows = useMemo(() => (link ? Object.entries(link.stats.devices).sort((a, b) => b[1] - a[1]) : []), [link]);
  const geoRows = useMemo(() => (link ? Object.entries(link.stats.geo).sort((a, b) => b[1] - a[1]) : []), [link]);
  const campaignRows = useMemo(() => (link ? Object.entries(link.stats.campaigns ?? {}).sort((a, b) => b[1] - a[1]) : []), [link]);

  if (loadingLink) {
    return (
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "48px 0", textAlign: "center", color: "var(--text-muted)" }}>
        Loading link…
      </div>
    );
  }

  if (!link) {
    return (
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <PageHeader title="Link not found" description="This link may have been deleted or never existed." breadcrumb="Platform" />
        <Link href="/dashboard/links" style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none", color: "var(--ocean-600)", fontWeight: 700 }}>
          <ArrowLeft size={14} />
          Back to links
        </Link>
      </div>
    );
  }

  const status = getStatus(link);

  return (
    <div style={{ maxWidth: 1120, margin: "0 auto" }}>
      <PageHeader
        title="Link details"
        description="Inspect metadata, monitor analytics trends, and run lifecycle actions from one place."
        breadcrumb="Platform"
        action={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link href="/dashboard/links" style={{ height: 36, display: "inline-flex", alignItems: "center", gap: 6, padding: "0 12px", border: "1px solid var(--border)", background: "var(--sky-100)", color: "var(--text-secondary)", textDecoration: "none", fontWeight: 700, fontSize: 12 }}>
              <ArrowLeft size={13} />
              Back
            </Link>
            <a href={link.destination !== "—" ? link.destination : `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5055"}/r/${link.id}`} target="_blank" rel="noopener noreferrer" style={{ height: 36, display: "inline-flex", alignItems: "center", gap: 6, padding: "0 12px", border: "1px solid var(--border)", background: "var(--sky-100)", color: "var(--text-secondary)", textDecoration: "none", fontWeight: 700, fontSize: 12 }}>
              <ExternalLink size={13} />
              Open link
            </a>
          </div>
        }
      />

      <section style={{ border: "1px solid var(--border)", background: "var(--cloud)", padding: 12, marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ ...statusStyle(status), fontSize: 10, fontWeight: 700, textTransform: "capitalize", padding: "2px 7px" }}>{status}</span>
            </div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em" }}>{link.shortUrl}</h2>
            <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: 13 }}>{link.destination}</p>
            <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: 12 }}>
              Expiry: {link.expiresAt ? new Date(link.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "No expiry"}
            </p>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button
              onClick={() => {
                navigator.clipboard.writeText(link.redirectUrl).catch(() => {});
                setCopied(true);
                setTimeout(() => setCopied(false), 1200);
              }}
              style={actionBtnStyle(copied ? "var(--sage)" : "var(--text-secondary)")}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "Copied" : "Copy"}
            </button>

            {status === "revoked" ? (
              <button
                onClick={() => setLink((prev) => (prev ? { ...prev, isRevoked: false, revokedAt: undefined } : prev))}
                style={actionBtnStyle("#047857", "#ECFDF3", "#A7F3D0")}
              >
                <RefreshCw size={12} />
                Reactivate
              </button>
            ) : (
              <button
                onClick={() => setLink((prev) => (prev ? { ...prev, isRevoked: true, revokedAt: new Date().toISOString() } : prev))}
                style={actionBtnStyle("#B91C1C", "#FEF2F2", "#FECACA")}
              >
                <Trash2 size={12} />
                Revoke
              </button>
            )}

          </div>
        </div>
      </section>

      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: 14 }}>
        <TabButton active={activeTab === "details"} label="Details" icon={<FileText size={12} />} onClick={() => setActiveTab("details")} />
        <TabButton active={activeTab === "analytics"} label="Analytics" icon={<BarChart2 size={12} />} onClick={() => setActiveTab("analytics")} />
        <TabButton active={activeTab === "qr"} label="QR Code" icon={<ExternalLink size={12} />} onClick={() => setActiveTab("qr")} />
      </div>

      {activeTab === "details" && (
        <section style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>All link details</h3>
            <button
              onClick={() => setIsEditing((previous) => !previous)}
              style={{
                height: 30,
                border: "1px solid var(--border)",
                background: "var(--sky-100)",
                color: "var(--text-secondary)",
                padding: "0 10px",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {isEditing ? "Close edit" : "Edit details"}
            </button>
          </div>

          {!isEditing && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
              <InfoCard label="Link ID" value={link.id} mono />
              <InfoCard label="Short URL" value={link.shortUrl} mono />
              <InfoCard label="Destination" value={link.destination} />
              <InfoCard label="Active date" value={new Date(link.createdAt).toLocaleString()} />
              <InfoCard label="Domain" value={link.domain} />
              <InfoCard label="Slug" value={link.slug} mono />
              <InfoCard label="Campaign assigned" value={assignedCampaignName ? "Yes" : "No"} />
              {assignedCampaignName && <InfoCard label="Campaign" value={assignedCampaignName} />}
              <InfoCard label="Tags" value={(link.tags ?? []).join(", ") || "-"} />
              <InfoCard label="UTM source" value={link.utm?.source || "-"} />
              <InfoCard label="UTM medium" value={link.utm?.medium || "-"} />
              <InfoCard label="Tracking pixels" value={(link.trackingPixels ?? []).join(", ") || "-"} />
              <InfoCard label="Geo redirect enabled" value={link.geoRuleEnabled ? "Yes" : "No"} />
              <InfoCard label="Geo country" value={link.geoCountry || "-"} />
              <InfoCard label="Geo redirect URL" value={link.geoRedirectUrl || "-"} />
              <InfoCard label="Expiry date" value={link.expiresAt ? new Date(link.expiresAt).toLocaleString() : "No expiry"} />
              <InfoCard label="QR URL" value={link.qrCodeUrl || "Not generated"} mono />
              <InfoCard label="Created by" value={link.createdBy || "-"} />
              <InfoCard label="Workspace" value={link.workspaceId || "-"} />
              <InfoCard label="Revoked at" value={link.revokedAt ? new Date(link.revokedAt).toLocaleString() : "-"} />
            </div>
          )}

          {isEditing && (
            <section style={{ border: "1px solid var(--border)", background: "var(--cloud)", padding: 16 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "var(--ink)", marginBottom: 12 }}>Edit link details</h3>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  setLink((prev) => {
                    if (!prev) return prev;
                    const normalizedDomain = editDomain.trim() || prev.domain;
                    const normalizedSlug = editSlug.trim() || prev.slug;
                    const campaignName = editCampaign.trim() || "Unassigned";
                    return {
                      ...prev,
                      shortUrl: `${normalizedDomain}/${normalizedSlug}`,
                      destination: editDestination,
                      domain: normalizedDomain,
                      slug: normalizedSlug,
                      tags: editTags.split(",").map((item) => item.trim()).filter(Boolean),
                      campaignAssigned: editCampaignAssigned,
                      utm: {
                        ...(editUtmSource.trim() ? { source: editUtmSource.trim() } : {}),
                        ...(editUtmMedium.trim() ? { medium: editUtmMedium.trim() } : {}),
                      },
                      trackingPixels: editTrackingPixels.split(",").map((item) => item.trim()).filter(Boolean),
                      geoRuleEnabled: editGeoEnabled,
                      geoCountry: editGeoEnabled ? editGeoCountry.trim() : undefined,
                      geoRedirectUrl: editGeoEnabled ? editGeoRedirectUrl.trim() : undefined,
                      createdAt: editCreatedAt ? `${editCreatedAt}T00:00:00.000Z` : prev.createdAt,
                      expiresAt: editExpiresAt ? `${editExpiresAt}T23:59:59.000Z` : undefined,
                      qrCodeUrl: qrDraft.trim() || undefined,
                      stats: {
                        ...prev.stats,
                        campaigns: editCampaignAssigned ? { [campaignName]: prev.stats.clicks } : { Unassigned: prev.stats.clicks },
                      },
                    };
                  });
                  setIsEditing(false);
                }}
                style={{ display: "grid", gap: 12 }}
              >
                <label style={{ display: "grid", gap: 4 }}>
                  <span style={labelStyle}>Destination URL</span>
                  <input value={editDestination} onChange={(event) => setEditDestination(event.target.value)} style={inputStyle} required />
                </label>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <label style={{ display: "grid", gap: 4 }}>
                    <span style={labelStyle}>Domain</span>
                    <input value={editDomain} onChange={(event) => setEditDomain(event.target.value)} style={inputStyle} required />
                  </label>
                  <label style={{ display: "grid", gap: 4 }}>
                    <span style={labelStyle}>Slug</span>
                    <input value={editSlug} onChange={(event) => setEditSlug(event.target.value)} style={inputStyle} required />
                  </label>
                </div>

                <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={editCampaignAssigned}
                    onChange={(event) => setEditCampaignAssigned(event.target.checked)}
                  />
                  <span style={labelStyle}>Assigned to campaign</span>
                </label>

                {editCampaignAssigned && (
                  <label style={{ display: "grid", gap: 4 }}>
                    <span style={labelStyle}>Campaign</span>
                    <input value={editCampaign} onChange={(event) => setEditCampaign(event.target.value)} style={inputStyle} />
                  </label>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <label style={{ display: "grid", gap: 4 }}>
                    <span style={labelStyle}>UTM source</span>
                    <input value={editUtmSource} onChange={(event) => setEditUtmSource(event.target.value)} style={inputStyle} />
                  </label>
                  <label style={{ display: "grid", gap: 4 }}>
                    <span style={labelStyle}>UTM medium</span>
                    <input value={editUtmMedium} onChange={(event) => setEditUtmMedium(event.target.value)} style={inputStyle} />
                  </label>
                </div>

                <label style={{ display: "grid", gap: 4 }}>
                  <span style={labelStyle}>Tracking pixels</span>
                  <input value={editTrackingPixels} onChange={(event) => setEditTrackingPixels(event.target.value)} style={inputStyle} placeholder="Meta Pixel, Google Ads" />
                </label>

                <label style={{ display: "grid", gap: 4 }}>
                  <span style={labelStyle}>QR target URL</span>
                  <input value={qrDraft} onChange={(event) => setQrDraft(event.target.value)} style={inputStyle} placeholder="https://..." />
                </label>

                <label style={{ display: "grid", gap: 4 }}>
                  <span style={labelStyle}>Tags</span>
                  <input value={editTags} onChange={(event) => setEditTags(event.target.value)} style={inputStyle} />
                </label>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <label style={{ display: "grid", gap: 4 }}>
                    <span style={labelStyle}>Active date</span>
                    <input type="date" value={editCreatedAt} onChange={(event) => setEditCreatedAt(event.target.value)} style={inputStyle} />
                  </label>

                  <label style={{ display: "grid", gap: 4 }}>
                    <span style={labelStyle}>Expires at</span>
                    <input type="date" value={editExpiresAt} onChange={(event) => setEditExpiresAt(event.target.value)} style={inputStyle} />
                  </label>
                </div>

                <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={editGeoEnabled}
                    onChange={(event) => setEditGeoEnabled(event.target.checked)}
                  />
                  <span style={labelStyle}>Geo redirect enabled</span>
                </label>

                {editGeoEnabled && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <label style={{ display: "grid", gap: 4 }}>
                      <span style={labelStyle}>Geo country</span>
                      <input value={editGeoCountry} onChange={(event) => setEditGeoCountry(event.target.value)} style={inputStyle} />
                    </label>
                    <label style={{ display: "grid", gap: 4 }}>
                      <span style={labelStyle}>Geo redirect URL</span>
                      <input value={editGeoRedirectUrl} onChange={(event) => setEditGeoRedirectUrl(event.target.value)} style={inputStyle} placeholder="https://..." />
                    </label>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                  <button type="button" onClick={() => setIsEditing(false)} style={actionBtnStyle("var(--text-secondary)")}>
                    Cancel
                  </button>
                  <button type="submit" style={actionBtnStyle("#fff", "var(--ocean-500)", "var(--ocean-500)")}>
                    <Save size={12} />
                    Save changes
                  </button>
                </div>
              </form>
            </section>
          )}
        </section>
      )}

      {activeTab === "analytics" && (
        <section style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10 }}>
            <MiniCard label="Clicks" value={link.stats.clicks.toLocaleString()} />
            <MiniCard label="CTR" value={`${link.stats.ctr}%`} />
            <MiniCard label="Top referrer" value={topReferrer ? `${topReferrer[0]} (${topReferrer[1]})` : "-"} />
            <MiniCard label="Top geo" value={topGeo ? `${topGeo[0]} (${topGeo[1]})` : "-"} />
          </div>

          <div style={{ border: "1px solid var(--border)", background: "var(--cloud)", padding: 14 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "var(--ink)", marginBottom: 10 }}>Timeline (7 days)</h3>
            <div style={{ display: "grid", gap: 8 }}>
              {link.stats.timeline.map((point) => {
                const maxValue = Math.max(1, ...link.stats.timeline.map((item) => item.clicks));
                const width = Math.round((point.clicks / maxValue) * 100);
                return (
                  <div key={point.date} style={{ display: "grid", gridTemplateColumns: "78px 1fr 50px", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{point.date.slice(5)}</span>
                    <div style={{ border: "1px solid var(--border)", background: "var(--sky-100)", height: 9 }}>
                      <div style={{ width: `${Math.max(8, width)}%`, height: "100%", background: "var(--ocean-500)" }} />
                    </div>
                    <span style={{ textAlign: "right", fontSize: 12, fontWeight: 700 }}>{point.clicks}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
            <BreakdownCard title="Referrers" rows={referrerRows} />
            <BreakdownCard title="Devices" rows={deviceRows} />
            <BreakdownCard title="Geography" rows={geoRows} />
            <BreakdownCard title="Campaign split" rows={campaignRows} />
          </div>
        </section>
      )}

      {activeTab === "qr" && (
        <section style={{ display: "grid", gap: 12, maxWidth: 620 }}>
          <InfoCard label="QR status" value={link.qrCodeUrl ? "Available" : "Not generated"} />
          {link.qrCodeUrl ? (
            <div style={{ display: "grid", gap: 10, maxWidth: 420 }}>
              <div style={{ border: "1px solid var(--border)", background: "#fff", width: 190, height: 190, display: "grid", placeItems: "center" }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=176x176&data=${encodeURIComponent(link.qrCodeUrl)}`}
                  alt="QR code"
                  width={176}
                  height={176}
                />
              </div>
              <InfoCard label="QR URL" value={link.qrCodeUrl} mono />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {isQrEditing ? (
                  <>
                    <label style={{ display: "grid", gap: 4, width: "100%" }}>
                      <span style={labelStyle}>Edit QR target URL</span>
                      <input value={qrDraft} onChange={(event) => setQrDraft(event.target.value)} style={inputStyle} />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const next = qrDraft.trim();
                        if (!next) return;
                        setLink((prev) => (prev ? { ...prev, qrCodeUrl: next } : prev));
                        setIsQrEditing(false);
                      }}
                      style={actionBtnStyle("#fff", "var(--ocean-500)", "var(--ocean-500)")}
                    >
                      Save QR changes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQrDraft(link.qrCodeUrl ?? "");
                        setIsQrEditing(false);
                      }}
                      style={actionBtnStyle("var(--text-secondary)")}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsQrEditing(true)}
                    style={actionBtnStyle("var(--text-secondary)")}
                  >
                    Edit QR code
                  </button>
                )}
                <a
                  href={link.qrCodeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    height: 34,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    padding: "0 12px",
                    border: "1px solid var(--border)",
                    background: "var(--sky-100)",
                    color: "var(--text-secondary)",
                    textDecoration: "none",
                    fontWeight: 700,
                    fontSize: 12,
                    width: "fit-content",
                  }}
                >
                  <ExternalLink size={12} />
                  Open QR link
                </a>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 8, maxWidth: 360 }}>
              <div style={{ border: "1px dashed var(--border)", background: "var(--sky-100)", padding: 12, fontSize: 12, color: "var(--text-muted)" }}>
                QR code is not generated for this link.
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = `https://${link.domain}/qr/${link.slug}`;
                  setQrDraft(next);
                  setLink((prev) => (prev ? { ...prev, qrCodeUrl: next } : prev));
                  setIsQrEditing(false);
                }}
                style={actionBtnStyle("#fff", "var(--ocean-500)", "var(--ocean-500)")}
              >
                Create QR code
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function TabButton({ active, label, icon, onClick }: { active: boolean; label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        height: 34,
        border: "none",
        borderBottom: active ? "2px solid var(--ocean-500)" : "2px solid transparent",
        background: active ? "var(--sky-100)" : "transparent",
        color: active ? "var(--ink)" : "var(--text-muted)",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.07em",
        textTransform: "uppercase",
        padding: "0 14px",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        cursor: "pointer",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function InfoCard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ border: "1px solid var(--border)", background: "var(--cloud)", padding: "12px 14px" }}>
      <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: mono ? "var(--font-mono)" : "var(--font-body)" }}>{value}</div>
    </div>
  );
}

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: "1px solid var(--border)", background: "var(--cloud)", padding: "10px 12px" }}>
      <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 800 }}>{value}</div>
    </div>
  );
}

function BreakdownCard({ title, rows }: { title: string; rows: Array<[string, number]> }) {
  return (
    <div style={{ border: "1px solid var(--border)", background: "var(--cloud)", padding: "10px 12px" }}>
      <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{title}</div>
      {rows.length === 0 ? (
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>No data</div>
      ) : (
        <div style={{ display: "grid", gap: 6 }}>
          {rows.slice(0, 6).map(([name, value]) => (
            <div key={name} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <span style={{ fontSize: 12, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>{value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function actionBtnStyle(
  color: string,
  background = "var(--sky-100)",
  borderColor = "var(--border)"
): React.CSSProperties {
  return {
    height: 34,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "0 12px",
    border: `1px solid ${borderColor}`,
    background,
    color,
    textDecoration: "none",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  };
}

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--text-muted)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 36,
  border: "1px solid var(--border)",
  background: "var(--sky-100)",
  color: "var(--text-secondary)",
  fontFamily: "var(--font-body)",
  fontSize: 13,
  padding: "0 10px",
};
