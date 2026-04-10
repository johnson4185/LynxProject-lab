"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart2,
  Check,
  Copy,
  ExternalLink,
  Eye,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import PageHeader from "@/platform/components/PageHeader";
import Modal from "@/platform/components/Modal";
import StatCard from "@/platform/components/StatCard";
import { dashboardData } from "@/platform/lib/dashboardData";
import type { Link as LinkEntity } from "@/platform/types/link";

type StatusFilter = "all" | "active" | "revoked" | "expired";
type DrawerTab = "metadata" | "analytics";
type DrawerMetaSubTab = "overview" | "qr";

type LinkRecord = LinkEntity & {
  isRevoked?: boolean;
  revokedAt?: string;
  title?: string;
  campaignAssigned?: boolean;
  trackingPixels?: string[];
  geoRuleEnabled?: boolean;
  geoCountry?: string;
  geoRedirectUrl?: string;
  qrSize?: number;
  qrMargin?: number;
  qrDark?: string;
  qrLight?: string;
};

function getCampaignName(link: LinkRecord): string {
  const campaignKeys = Object.keys(link.stats.campaigns ?? {});
  return campaignKeys[0] ?? "Unassigned";
}

function getLinkStatus(link: LinkRecord): Exclude<StatusFilter, "all"> {
  if (link.isRevoked) {
    return "revoked";
  }
  if (link.expiresAt && new Date(link.expiresAt).getTime() < Date.now()) {
    return "expired";
  }
  return "active";
}

function badgeStyle(status: Exclude<StatusFilter, "all">): React.CSSProperties {
  if (status === "active") {
    return {
      background: "#ECFDF3",
      border: "1px solid #A7F3D0",
      color: "#047857",
    };
  }
  if (status === "revoked") {
    return {
      background: "#FEF2F2",
      border: "1px solid #FECACA",
      color: "#B91C1C",
    };
  }
  return {
    background: "#FFF7ED",
    border: "1px solid #FED7AA",
    color: "#9A3412",
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function LinksPage() {
  const [links, setLinks] = useState<LinkRecord[]>(() => dashboardData.links.map((link) => ({ ...link })));
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [campaignFilter, setCampaignFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [drawerLinkId, setDrawerLinkId] = useState<string | null>(null);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>("metadata");
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const campaigns = useMemo(() => {
    const values = new Set<string>();
    links.forEach((link) => values.add(getCampaignName(link)));
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [links]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    const list = links.filter((link) => {
      const status = getLinkStatus(link);
      const campaign = getCampaignName(link);
      const createdAt = new Date(link.createdAt).getTime();

      const matchesSearch =
        q.length === 0 ||
        link.shortUrl.toLowerCase().includes(q) ||
        link.destination.toLowerCase().includes(q) ||
        link.slug.toLowerCase().includes(q) ||
        (link.tags ?? []).some((tag) => tag.toLowerCase().includes(q));

      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const matchesCampaign = campaignFilter === "all" || campaign === campaignFilter;
      const matchesFromDate = fromDate.length === 0 || createdAt >= new Date(fromDate).getTime();
      const matchesToDate = toDate.length === 0 || createdAt <= new Date(toDate).getTime() + 86_399_999;

      return matchesSearch && matchesStatus && matchesCampaign && matchesFromDate && matchesToDate;
    });

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return list;
  }, [links, search, statusFilter, campaignFilter, fromDate, toDate]);

  const activeCount = useMemo(() => links.filter((link) => getLinkStatus(link) === "active").length, [links]);
  const revokedCount = useMemo(() => links.filter((link) => getLinkStatus(link) === "revoked").length, [links]);
  const totalClicks = useMemo(() => links.reduce((sum, link) => sum + link.stats.clicks, 0), [links]);
  const avgCtr = useMemo(() => {
    if (links.length === 0) return 0;
    const value = links.reduce((sum, link) => sum + link.stats.ctr, 0) / links.length;
    return Number(value.toFixed(1));
  }, [links]);

  const selectedLinks = useMemo(() => filtered.filter((link) => selected.has(link.id)), [filtered, selected]);
  const selectedDrawerLink = useMemo(() => links.find((link) => link.id === drawerLinkId) ?? null, [links, drawerLinkId]);

  const clearCopyTimer = () => {
    if (copyTimerRef.current) {
      clearTimeout(copyTimerRef.current);
      copyTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearCopyTimer();
  }, []);

  const toggleSelect = (id: string) => {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAllVisible = () => {
    if (filtered.length > 0 && selected.size === filtered.length) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(filtered.map((link) => link.id)));
  };

  const copyShortUrl = (shortUrl: string) => {
    navigator.clipboard.writeText(shortUrl).catch(() => {});
    setCopied(shortUrl);
    clearCopyTimer();
    copyTimerRef.current = setTimeout(() => setCopied(null), 1400);
  };

  const revokeLinks = (ids: string[]) => {
    if (ids.length === 0) return;
    setLinks((previous) =>
      previous.map((link) =>
        ids.includes(link.id)
          ? { ...link, isRevoked: true, revokedAt: new Date().toISOString() }
          : link
      )
    );
    setSelected((previous) => {
      const next = new Set(previous);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  };

  const reactivateLinks = (ids: string[]) => {
    if (ids.length === 0) return;
    setLinks((previous) =>
      previous.map((link) =>
        ids.includes(link.id)
          ? { ...link, isRevoked: false, revokedAt: undefined }
          : link
      )
    );
    setSelected((previous) => {
      const next = new Set(previous);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  };

  const reactivateLink = (id: string) => {
    setLinks((previous) => previous.map((link) => (link.id === id ? { ...link, isRevoked: false, revokedAt: undefined } : link)));
  };

  const exportSelectedCSV = () => {
    if (selectedLinks.length === 0) return;

    const rows = [
      ["Short URL", "Destination", "Status", "Campaign", "Tags", "Clicks", "CTR", "Created"],
      ...selectedLinks.map((link) => [
        link.shortUrl,
        link.destination,
        getLinkStatus(link),
        getCampaignName(link),
        (link.tags ?? []).join(";"),
        link.stats.clicks.toString(),
        `${link.stats.ctr}%`,
        link.createdAt,
      ]),
    ];

    const csv = rows.map((row) => row.map((value) => `"${value}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `links-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setCampaignFilter("all");
    setFromDate("");
    setToDate("");
  };

  return (
    <div style={{ maxWidth: 1260, margin: "0 auto", position: "relative" }}>
      <PageHeader
        title="Links"
        description="Advanced link management with deep filtering, bulk actions, and analytics-first operations."
        breadcrumb="Platform"
        action={
          <button
            onClick={() => setShowCreate(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              background: "var(--ocean-500)",
              color: "#fff",
              border: "none",
              padding: "0 18px",
              height: 38,
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
            }}
          >
            <Plus size={14} />
            New link
          </button>
        }
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(180px, 1fr))",
          gap: 10,
          marginBottom: 18,
        }}
      >
        <StatCard micro label="Active links" value={activeCount.toString()} />
        <StatCard micro label="Revoked links" value={revokedCount.toString()} />
        <StatCard micro label="Total clicks" value={totalClicks.toLocaleString()} />
        <StatCard micro label="Average CTR" value={`${avgCtr}%`} />
      </div>

      <div
        style={{
          background: "var(--cloud)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-xs)",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(320px, 1fr) repeat(4, minmax(130px, 150px))",
            gap: 8,
            padding: 12,
            borderBottom: "1px solid var(--border)",
            alignItems: "end",
          }}
        >
          <div style={{ position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: 10, color: "var(--text-muted)" }} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search short URL, destination, slug, tag..."
              style={{
                width: "100%",
                height: 34,
                padding: "0 10px 0 30px",
                border: "1px solid var(--border)",
                background: "var(--sky-100)",
                fontFamily: "var(--font-body)",
                fontSize: 12,
                color: "var(--ink)",
                outline: "none",
              }}
            />
          </div>

          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as StatusFilter)}
            options={[
              { value: "all", label: "All statuses" },
              { value: "active", label: "Active" },
              { value: "revoked", label: "Revoked" },
              { value: "expired", label: "Expired" },
            ]}
          />

          <FilterSelect
            label="Campaign"
            value={campaignFilter}
            onChange={setCampaignFilter}
            options={[{ value: "all", label: "All campaigns" }, ...campaigns.map((name) => ({ value: name, label: name }))]}
          />

          <DateFilter label="From" value={fromDate} onChange={setFromDate} />
          <DateFilter label="To" value={toDate} onChange={setToDate} />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 12 }}>
            <Filter size={12} />
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            {(statusFilter !== "all" || campaignFilter !== "all" || fromDate || toDate || search) && (
              <button
                onClick={resetFilters}
                style={{
                  marginLeft: 6,
                  border: "1px solid var(--border)",
                  background: "var(--sky-100)",
                  color: "var(--text-secondary)",
                  height: 24,
                  padding: "0 8px",
                  fontSize: 11,
                  cursor: "pointer",
                }}
              >
                Reset filters
              </button>
            )}
          </div>

          {selected.size > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ocean-600)" }}>{selected.size} selected</span>
              <button
                onClick={() => reactivateLinks(Array.from(selected))}
                style={{
                  height: 28,
                  border: "1px solid #A7F3D0",
                  background: "#ECFDF3",
                  color: "#047857",
                  padding: "0 10px",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Bulk activate
              </button>
              <button
                onClick={() => revokeLinks(Array.from(selected))}
                style={{
                  height: 28,
                  border: "1px solid #FECACA",
                  background: "#FEF2F2",
                  color: "#B91C1C",
                  padding: "0 10px",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Bulk revoke
              </button>
              <button
                onClick={exportSelectedCSV}
                style={{
                  height: 28,
                  border: "1px solid var(--border)",
                  background: "var(--sky-100)",
                  color: "var(--text-secondary)",
                  padding: "0 10px",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Export selected
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ background: "var(--cloud)", border: "1px solid var(--border)", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--sky-100)", borderBottom: "1px solid var(--border)" }}>
              <th style={{ padding: "10px 14px", width: 40 }}>
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selected.size === filtered.length}
                  onChange={toggleAllVisible}
                  style={{ cursor: "pointer", accentColor: "var(--ocean-500)" }}
                />
              </th>
              <th style={thStyle}>Short link</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Campaign</th>
              <th style={thStyle}>Destination</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Clicks</th>
              <th style={{ ...thStyle, textAlign: "right" }}>CTR</th>
              <th style={thStyle}>Created</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: "56px 16px", textAlign: "center", color: "var(--text-muted)" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <AlertTriangle size={28} style={{ opacity: 0.4 }} />
                    No links match your current filters.
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((link) => {
                const status = getLinkStatus(link);
                const campaignName = getCampaignName(link);
                return (
                  <tr key={link.id} style={{ borderBottom: "1px solid var(--border)", background: selected.has(link.id) ? "var(--ocean-50)" : "transparent" }}>
                    <td style={{ padding: "12px 14px" }}>
                      <input
                        type="checkbox"
                        checked={selected.has(link.id)}
                        onChange={() => toggleSelect(link.id)}
                        style={{ cursor: "pointer", accentColor: "var(--ocean-500)" }}
                      />
                    </td>

                    <td style={{ padding: "12px 14px", minWidth: 180 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <Link href={`/dashboard/links/${link.id}`} style={{ color: "var(--ocean-600)", fontWeight: 700, fontFamily: "var(--font-mono)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                          {link.shortUrl}
                          <ArrowUpRight size={11} />
                        </Link>
                      </div>
                    </td>

                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ ...badgeStyle(status), padding: "2px 8px", fontSize: 11, fontWeight: 700, textTransform: "capitalize" }}>{status}</span>
                    </td>

                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>{campaignName}</span>
                    </td>

                    <td style={{ padding: "12px 14px", maxWidth: 300 }}>
                      <span style={{ color: "var(--text-muted)", fontSize: 12, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {link.destination}
                      </span>
                    </td>

                    <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 700 }}>{link.stats.clicks.toLocaleString()}</td>
                    <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 700 }}>{link.stats.ctr}%</td>
                    <td style={{ padding: "12px 14px", color: "var(--text-muted)", fontSize: 12 }}>{formatDate(link.createdAt)}</td>

                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", justifyContent: "center", gap: 5 }}>
                        <button
                          onClick={() => copyShortUrl(link.shortUrl)}
                          title="Copy"
                          style={iconBtnStyle(copied === link.shortUrl ? "var(--sage)" : "var(--text-muted)")}
                        >
                          {copied === link.shortUrl ? <Check size={12} /> : <Copy size={12} />}
                        </button>

                        <Link
                          href={`/dashboard/links/${link.id}`}
                          title="Open details"
                          style={{ ...iconBtnStyle("var(--text-muted)"), textDecoration: "none" }}
                        >
                          <Eye size={12} />
                        </Link>

                        <a href={`https://${link.shortUrl}`} target="_blank" rel="noopener noreferrer" title="Open short link" style={{ ...iconBtnStyle("var(--text-muted)"), textDecoration: "none" }}>
                          <ExternalLink size={12} />
                        </a>

                        {status === "revoked" ? (
                          <button onClick={() => reactivateLink(link.id)} title="Reactivate" style={iconBtnStyle("var(--sage)")}>
                            <RefreshCw size={12} />
                          </button>
                        ) : (
                          <button onClick={() => revokeLinks([link.id])} title="Revoke" style={iconBtnStyle("var(--coral)")}>
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <SimpleCreateModal
          onClose={() => setShowCreate(false)}
          onCreate={(record) => {
            setLinks((previous) => [{ ...record }, ...previous]);
            setShowCreate(false);
          }}
        />
      )}

      {selectedDrawerLink && (
        <LinkDetailsDrawer
          link={selectedDrawerLink}
          tab={drawerTab}
          onTabChange={setDrawerTab}
          onUpdate={(updated) => {
            setLinks((previous) => previous.map((item) => (item.id === updated.id ? updated : item)));
          }}
          onClose={() => setDrawerLinkId(null)}
          onRevoke={() => revokeLinks([selectedDrawerLink.id])}
          onReactivate={() => reactivateLink(selectedDrawerLink.id)}
        />
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{
          height: 34,
          minWidth: 120,
          border: "1px solid var(--border)",
          background: "var(--sky-100)",
          color: "var(--text-secondary)",
          fontSize: 12,
          fontFamily: "var(--font-body)",
          padding: "0 10px",
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function DateFilter({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>{label}</span>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{
          height: 34,
          border: "1px solid var(--border)",
          background: "var(--sky-100)",
          color: "var(--text-secondary)",
          fontSize: 12,
          fontFamily: "var(--font-body)",
          padding: "0 10px",
        }}
      />
    </label>
  );
}

function SimpleCreateModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (link: LinkRecord) => void;
}) {
  const [destination, setDestination] = useState("https://");
  const [domain, setDomain] = useState("acme.ly");
  const [slug, setSlug] = useState("");
  const [tags, setTags] = useState("");
  const [assignCampaign, setAssignCampaign] = useState(false);
  const [campaign, setCampaign] = useState("summer-sale");
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [selectedPixels, setSelectedPixels] = useState<Set<string>>(new Set());
  const [geoEnabled, setGeoEnabled] = useState(true);
  const [geoCountry, setGeoCountry] = useState("United States");
  const [geoRedirect, setGeoRedirect] = useState("");
  const [enableQr, setEnableQr] = useState(false);
  const [expiryDays, setExpiryDays] = useState("");

  const DOMAINS = ["acme.ly", "go.acme.com"];

  const UTM_SOURCES = [
    { value: "", label: "None" },
    { value: "newsletter", label: "Newsletter" },
    { value: "twitter", label: "Twitter/X" },
    { value: "linkedin", label: "LinkedIn" },
    { value: "google", label: "Google" },
    { value: "facebook", label: "Facebook" },
    { value: "direct", label: "Direct" },
  ];

  const UTM_MEDIUMS = [
    { value: "", label: "None" },
    { value: "email", label: "Email" },
    { value: "social", label: "Social" },
    { value: "paid", label: "Paid" },
    { value: "organic", label: "Organic" },
    { value: "cpc", label: "CPC" },
    { value: "referral", label: "Referral" },
  ];

  const CAMPAIGNS = [
    { value: "summer-sale", label: "Summer Sale" },
    { value: "product-launch", label: "Product Launch" },
    { value: "retargeting", label: "Retargeting" },
    { value: "seasonal", label: "Seasonal" },
  ];

  const GEO_COUNTRIES = ["United States", "United Kingdom", "Germany", "France", "Canada", "Australia", "India", "Brazil"];

  const PIXEL_OPTIONS = [
    { id: "meta", label: "Meta Pixel" },
    { id: "google", label: "Google Ads" },
    { id: "linkedin", label: "LinkedIn Insight" },
    { id: "twitter", label: "X/Twitter Pixel" },
  ];

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: 32,
    border: "1px solid var(--border)",
    background: "var(--sky-100)",
    padding: "0 8px",
    fontFamily: "var(--font-body)",
    fontSize: 12,
    color: "var(--ink)",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--text-secondary)",
    marginBottom: 3,
  };

  return (
    <Modal open={true} onClose={onClose} title="Create link" width={640}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const normalizedSlug = slug.trim().length > 0 ? slug.trim() : `link-${Date.now()}`;
          const shortUrl = `${domain}/${normalizedSlug}`;
          const newLink: LinkRecord = {
            id: `link-${Date.now()}`,
            shortUrl,
            destination,
            slug: normalizedSlug,
            domain,
            createdAt: new Date().toISOString(),
            createdBy: "user-1",
            workspaceId: "ws-1",
            campaignAssigned: assignCampaign,
            tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
            utm: {
              ...(utmSource ? { source: utmSource } : {}),
              ...(utmMedium ? { medium: utmMedium } : {}),
            },
            trackingPixels: Array.from(selectedPixels),
            geoRuleEnabled: geoEnabled,
            geoCountry: geoEnabled ? geoCountry : undefined,
            geoRedirectUrl: geoEnabled ? geoRedirect : undefined,
            expiresAt: expiryDays ? new Date(Date.now() + Number(expiryDays) * 24 * 60 * 60 * 1000).toISOString() : undefined,
            qrCodeUrl: enableQr ? `https://${domain}/qr/${normalizedSlug}` : undefined,
            stats: {
              clicks: 0,
              ctr: 0,
              timeline: [],
              referrers: {},
              devices: {},
              geo: {},
              campaigns: { [assignCampaign ? campaign : "Unassigned"]: 0 },
            },
          };
          onCreate(newLink);
        }}
        style={{ display: "grid", gap: 10 }}
      >
        <label style={{ display: "grid", gap: 3 }}>
          <span style={labelStyle}>Destination URL *</span>
          <input value={destination} onChange={(event) => setDestination(event.target.value)} style={inputStyle} required />
        </label>

        <div style={{ display: "grid", gap: 3 }}>
          <span style={labelStyle}>Domain</span>
          <div style={{ display: "flex", gap: 4 }}>
            <select value={domain} onChange={(event) => setDomain(event.target.value)} style={{ ...inputStyle, width: 130 }}>
              {DOMAINS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <input value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="slug" style={{ ...inputStyle, flex: 1 }} />
          </div>
        </div>

        <label style={{ display: "grid", gap: 3 }}>
          <span style={labelStyle}>Tags</span>
          <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="tag1, tag2, tag3" style={inputStyle} />
        </label>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={labelStyle}>Campaign</span>
            <button
              type="button"
              onClick={() => setAssignCampaign(!assignCampaign)}
              style={{
                width: 38,
                height: 20,
                background: assignCampaign ? "var(--ocean-500)" : "#E5E7EB",
                border: `1px solid ${assignCampaign ? "var(--ocean-600)" : "#D1D5DB"}`,
                borderRadius: 2,
                cursor: "pointer",
                position: "relative",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  width: 16,
                  height: 16,
                  background: "white",
                  borderRadius: 0,
                  border: `1px solid ${assignCampaign ? "var(--ocean-600)" : "#D1D5DB"}`,
                  left: assignCampaign ? 18 : 1,
                  transition: "left 0.2s ease",
                }}
              />
            </button>
          </div>

          {assignCampaign && (
            <div>
              <select value={campaign} onChange={(event) => setCampaign(event.target.value)} style={inputStyle}>
                {CAMPAIGNS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8 }}>
          <span style={labelStyle}>UTM Parameters</span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
            <select value={utmSource} onChange={(event) => setUtmSource(event.target.value)} style={inputStyle}>
              {UTM_SOURCES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <select value={utmMedium} onChange={(event) => setUtmMedium(event.target.value)} style={inputStyle}>
              {UTM_MEDIUMS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8 }}>
          <span style={{ ...labelStyle, marginBottom: 4 }}>Tracking Pixels</span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
            {PIXEL_OPTIONS.map((pixel) => {
              const active = selectedPixels.has(pixel.id);
              return (
                <button
                  key={pixel.id}
                  type="button"
                  onClick={() => {
                    setSelectedPixels((previous) => {
                      const next = new Set(previous);
                      if (next.has(pixel.id)) next.delete(pixel.id);
                      else next.add(pixel.id);
                      return next;
                    });
                  }}
                  style={{
                    height: 28,
                    border: `1px solid ${active ? "var(--ocean-400)" : "var(--border)"}`,
                    background: active ? "var(--ocean-50)" : "var(--sky-100)",
                    color: active ? "var(--ocean-700)" : "var(--text-secondary)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    textAlign: "left",
                    padding: "0 8px",
                  }}
                >
                  {pixel.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8, display: "grid", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={labelStyle}>Geo redirect rule</span>
            <button
              type="button"
              onClick={() => setGeoEnabled(!geoEnabled)}
              style={{
                width: 38,
                height: 20,
                background: geoEnabled ? "var(--ocean-500)" : "#E5E7EB",
                border: `1px solid ${geoEnabled ? "var(--ocean-600)" : "#D1D5DB"}`,
                borderRadius: 2,
                cursor: "pointer",
                position: "relative",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  width: 16,
                  height: 16,
                  background: "white",
                  borderRadius: 0,
                  border: `1px solid ${geoEnabled ? "var(--ocean-600)" : "#D1D5DB"}`,
                  left: geoEnabled ? 18 : 1,
                  transition: "left 0.2s ease",
                }}
              />
            </button>
          </div>

          {geoEnabled && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
              <select value={geoCountry} onChange={(event) => setGeoCountry(event.target.value)} style={inputStyle}>
                {GEO_COUNTRIES.map((country) => <option key={country} value={country}>{country}</option>)}
              </select>
              <input value={geoRedirect} onChange={(event) => setGeoRedirect(event.target.value)} placeholder="Redirect URL" style={inputStyle} />
            </div>
          )}
        </div>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={labelStyle}>Auto-generate QR code</span>
            <button
              type="button"
              onClick={() => setEnableQr(!enableQr)}
              style={{
                width: 38,
                height: 20,
                background: enableQr ? "var(--ocean-500)" : "#E5E7EB",
                border: `1px solid ${enableQr ? "var(--ocean-600)" : "#D1D5DB"}`,
                borderRadius: 2,
                cursor: "pointer",
                position: "relative",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  width: 16,
                  height: 16,
                  background: "white",
                  borderRadius: 0,
                  border: `1px solid ${enableQr ? "var(--ocean-600)" : "#D1D5DB"}`,
                  left: enableQr ? 18 : 1,
                  transition: "left 0.2s ease",
                }}
              />
            </button>
          </div>
        </div>

        <div style={{ marginTop: 8 }}>
          <label style={{ display: "grid", gap: 3 }}>
            <span style={labelStyle}>Expiry (days)</span>
            <input value={expiryDays} onChange={(event) => setExpiryDays(event.target.value)} type="number" placeholder="30" style={inputStyle} />
          </label>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 12, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
          <button type="button" onClick={onClose} style={{ height: 30, padding: "0 10px", border: "1px solid var(--border)", background: "var(--sky-100)", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            Cancel
          </button>
          <button type="submit" style={{ height: 30, padding: "0 10px", border: "none", background: "var(--ocean-500)", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>
            Create link
          </button>
        </div>
      </form>
    </Modal>
  );
}

function LinkDetailsDrawer({
  link,
  tab,
  onTabChange,
  onUpdate,
  onClose,
  onRevoke,
  onReactivate,
}: {
  link: LinkRecord;
  tab: DrawerTab;
  onTabChange: (tab: DrawerTab) => void;
  onUpdate: (link: LinkRecord) => void;
  onClose: () => void;
  onRevoke: () => void;
  onReactivate: () => void;
}) {
  const status = getLinkStatus(link);
  const [metaSubTab, setMetaSubTab] = useState<DrawerMetaSubTab>("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    destination: link.destination,
    domain: link.domain,
    slug: link.slug,
    tags: (link.tags ?? []).join(", "),
    campaign: getCampaignName(link),
    createdDate: link.createdAt.slice(0, 10),
    expiryDate: link.expiresAt ? link.expiresAt.slice(0, 10) : "",
  });
  const [qrDraft, setQrDraft] = useState(link.qrCodeUrl ?? "");
  const [isQrEditing, setIsQrEditing] = useState(false);
  const [qrOptions, setQrOptions] = useState({
    size: link.qrSize ?? 156,
    margin: link.qrMargin ?? 1,
    dark: link.qrDark ?? "000000",
    light: link.qrLight ?? "ffffff",
  });

  useEffect(() => {
    setForm({
      destination: link.destination,
      domain: link.domain,
      slug: link.slug,
      tags: (link.tags ?? []).join(", "),
      campaign: getCampaignName(link),
      createdDate: link.createdAt.slice(0, 10),
      expiryDate: link.expiresAt ? link.expiresAt.slice(0, 10) : "",
    });
    setQrDraft(link.qrCodeUrl ?? "");
    setQrOptions({
      size: link.qrSize ?? 156,
      margin: link.qrMargin ?? 1,
      dark: link.qrDark ?? "000000",
      light: link.qrLight ?? "ffffff",
    });
    setIsEditing(false);
    setIsQrEditing(false);
    setMetaSubTab("overview");
  }, [link]);

  const totalTimelineClicks = link.stats.timeline.reduce((sum, point) => sum + point.clicks, 0);

  const topReferrer = Object.entries(link.stats.referrers).sort((a, b) => b[1] - a[1])[0];
  const topGeo = Object.entries(link.stats.geo).sort((a, b) => b[1] - a[1])[0];
  const deviceEntries = Object.entries(link.stats.devices).sort((a, b) => b[1] - a[1]);
  const referrerEntries = Object.entries(link.stats.referrers).sort((a, b) => b[1] - a[1]);
  const geoEntries = Object.entries(link.stats.geo).sort((a, b) => b[1] - a[1]);
  const campaignEntries = Object.entries(link.stats.campaigns ?? {}).sort((a, b) => b[1] - a[1]);
  const qrPreviewData = (isQrEditing ? qrDraft : (link.qrCodeUrl ?? "")).trim();
  const qrPreviewUrl = qrPreviewData
    ? `https://api.qrserver.com/v1/create-qr-code/?size=${Math.max(96, Math.min(512, qrOptions.size))}x${Math.max(96, Math.min(512, qrOptions.size))}&data=${encodeURIComponent(qrPreviewData)}&qzone=${Math.max(0, Math.min(8, qrOptions.margin))}&color=${qrOptions.dark}&bgcolor=${qrOptions.light}`
    : "";

  const handleSaveEdit = () => {
    const campaignKey = form.campaign.trim() || "Unassigned";
    const updated: LinkRecord = {
      ...link,
      destination: form.destination.trim() || link.destination,
      domain: form.domain.trim() || link.domain,
      slug: form.slug.trim() || link.slug,
      tags: form.tags
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      createdAt: form.createdDate ? new Date(form.createdDate).toISOString() : link.createdAt,
      expiresAt: form.expiryDate ? new Date(form.expiryDate).toISOString() : undefined,
      stats: {
        ...link.stats,
        campaigns: { [campaignKey]: link.stats.clicks },
      },
    };
    onUpdate(updated);
    setIsEditing(false);
  };

  return (
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(7,27,44,0.45)", zIndex: 220 }} onClick={onClose} />
      <aside style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: 500, background: "var(--cloud)", borderLeft: "1px solid var(--border)", zIndex: 221, display: "flex", flexDirection: "column", boxShadow: "var(--shadow-xl)" }}>
        <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
              <span style={{ ...badgeStyle(status), fontSize: 10, padding: "2px 7px", fontWeight: 700, textTransform: "capitalize" }}>{status}</span>
            </div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "var(--ink)" }}>{link.shortUrl}</h3>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-muted)", maxWidth: 360, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {link.destination}
            </p>
          </div>
          <button onClick={onClose} style={{ border: "1px solid var(--border)", background: "none", width: 30, height: 30, cursor: "pointer", color: "var(--text-muted)" }}>
            <X size={13} />
          </button>
        </div>

        <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
          <DrawerTabButton active={tab === "metadata"} label="Metadata" onClick={() => onTabChange("metadata")} />
          <DrawerTabButton active={tab === "analytics"} label="Analytics" onClick={() => onTabChange("analytics")} />
        </div>

        <div style={{ padding: 16, overflowY: "auto", flex: 1 }}>
          {tab === "metadata" ? (
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <DrawerSubTabButton active={metaSubTab === "overview"} label="Overview" onClick={() => setMetaSubTab("overview")} />
                  <DrawerSubTabButton active={metaSubTab === "qr"} label="QR code" onClick={() => setMetaSubTab("qr")} />
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing((previous) => !previous)}
                  style={{
                    height: 28,
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

              {metaSubTab === "overview" && !isEditing && (
                <div style={{ display: "grid", gap: 12 }}>
                  <MetaRow label="Link ID" value={link.id} mono />
                  <MetaRow label="Domain" value={link.domain} />
                  <MetaRow label="Slug" value={link.slug} mono />
                  <MetaRow label="Active date" value={formatDate(link.createdAt)} />
                  <MetaRow label="Expiry date" value={link.expiresAt ? formatDate(link.expiresAt) : "No expiry"} />
                  <MetaRow label="Campaign" value={getCampaignName(link)} />
                  <MetaRow label="Tags" value={(link.tags ?? []).join(", ") || "-"} />
                </div>
              )}

              {metaSubTab === "overview" && isEditing && (
                <div style={{ border: "1px solid var(--border)", background: "var(--sky-100)", padding: 10, display: "grid", gap: 8 }}>
                  <DrawerField label="Destination URL">
                    <input value={form.destination} onChange={(event) => setForm((previous) => ({ ...previous, destination: event.target.value }))} style={drawerInputStyle} />
                  </DrawerField>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <DrawerField label="Domain">
                      <input value={form.domain} onChange={(event) => setForm((previous) => ({ ...previous, domain: event.target.value }))} style={drawerInputStyle} />
                    </DrawerField>
                    <DrawerField label="Slug">
                      <input value={form.slug} onChange={(event) => setForm((previous) => ({ ...previous, slug: event.target.value }))} style={drawerInputStyle} />
                    </DrawerField>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <DrawerField label="Active date">
                      <input type="date" value={form.createdDate} onChange={(event) => setForm((previous) => ({ ...previous, createdDate: event.target.value }))} style={drawerInputStyle} />
                    </DrawerField>
                    <DrawerField label="Expiry date">
                      <input type="date" value={form.expiryDate} onChange={(event) => setForm((previous) => ({ ...previous, expiryDate: event.target.value }))} style={drawerInputStyle} />
                    </DrawerField>
                  </div>
                  <DrawerField label="Campaign">
                    <input value={form.campaign} onChange={(event) => setForm((previous) => ({ ...previous, campaign: event.target.value }))} style={drawerInputStyle} />
                  </DrawerField>
                  <DrawerField label="Tags">
                    <input value={form.tags} onChange={(event) => setForm((previous) => ({ ...previous, tags: event.target.value }))} placeholder="tag1, tag2" style={drawerInputStyle} />
                  </DrawerField>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, paddingTop: 4 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setForm({
                          destination: link.destination,
                          domain: link.domain,
                          slug: link.slug,
                          tags: (link.tags ?? []).join(", "),
                          campaign: getCampaignName(link),
                          createdDate: link.createdAt.slice(0, 10),
                          expiryDate: link.expiresAt ? link.expiresAt.slice(0, 10) : "",
                        });
                        setIsEditing(false);
                      }}
                      style={{
                        height: 28,
                        border: "1px solid var(--border)",
                        background: "var(--cloud)",
                        color: "var(--text-secondary)",
                        padding: "0 10px",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      style={{
                        height: 28,
                        border: "none",
                        background: "var(--ocean-500)",
                        color: "#fff",
                        padding: "0 10px",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Save changes
                    </button>
                  </div>
                </div>
              )}

              {metaSubTab === "qr" && (
                <div style={{ display: "grid", gap: 10 }}>
                  <MetaRow label="QR status" value={link.qrCodeUrl ? "Generated" : "Not generated"} />
                  {link.qrCodeUrl ? (
                    <div style={{ display: "grid", gap: 10, maxWidth: 320 }}>
                      <div style={{ border: "1px solid var(--border)", background: "#fff", width: 170, height: 170, display: "grid", placeItems: "center" }}>
                        {qrPreviewUrl ? (
                          <img
                            src={qrPreviewUrl}
                            alt="QR code"
                            width={156}
                            height={156}
                          />
                        ) : (
                          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>No preview</span>
                        )}
                      </div>
                      <MetaRow label="QR URL" value={link.qrCodeUrl} mono />
                      {!isQrEditing ? (
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <button
                            type="button"
                            onClick={() => setIsQrEditing(true)}
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
                            Edit QR code
                          </button>
                          <a
                            href={link.qrCodeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              height: 30,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "1px solid var(--border)",
                              color: "var(--text-secondary)",
                              fontSize: 11,
                              fontWeight: 700,
                              textDecoration: "none",
                              background: "var(--sky-100)",
                              padding: "0 10px",
                            }}
                          >
                            Open QR link
                          </a>
                        </div>
                      ) : (
                        <>
                          <DrawerField label="Edit QR target URL">
                            <input value={qrDraft} onChange={(event) => setQrDraft(event.target.value)} style={drawerInputStyle} />
                          </DrawerField>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                            <DrawerField label="Size (px)">
                              <input
                                type="number"
                                min={96}
                                max={512}
                                value={qrOptions.size}
                                onChange={(event) => setQrOptions((previous) => ({ ...previous, size: Number(event.target.value) || 156 }))}
                                style={drawerInputStyle}
                              />
                            </DrawerField>
                            <DrawerField label="Quiet zone">
                              <input
                                type="number"
                                min={0}
                                max={8}
                                value={qrOptions.margin}
                                onChange={(event) => setQrOptions((previous) => ({ ...previous, margin: Number(event.target.value) || 0 }))}
                                style={drawerInputStyle}
                              />
                            </DrawerField>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                            <DrawerField label="Dark color">
                              <input
                                value={`#${qrOptions.dark}`}
                                onChange={(event) => {
                                  const normalized = event.target.value.replace("#", "").toLowerCase();
                                  if (/^[0-9a-f]{0,6}$/.test(normalized)) {
                                    setQrOptions((previous) => ({ ...previous, dark: normalized.padEnd(6, "0") }));
                                  }
                                }}
                                style={drawerInputStyle}
                              />
                            </DrawerField>
                            <DrawerField label="Light color">
                              <input
                                value={`#${qrOptions.light}`}
                                onChange={(event) => {
                                  const normalized = event.target.value.replace("#", "").toLowerCase();
                                  if (/^[0-9a-f]{0,6}$/.test(normalized)) {
                                    setQrOptions((previous) => ({ ...previous, light: normalized.padEnd(6, "f") }));
                                  }
                                }}
                                style={drawerInputStyle}
                              />
                            </DrawerField>
                          </div>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            <button
                              type="button"
                              onClick={() => {
                                const next = qrDraft.trim();
                                if (!next) return;
                                onUpdate({
                                  ...link,
                                  qrCodeUrl: next,
                                  qrSize: Math.max(96, Math.min(512, qrOptions.size)),
                                  qrMargin: Math.max(0, Math.min(8, qrOptions.margin)),
                                  qrDark: qrOptions.dark,
                                  qrLight: qrOptions.light,
                                });
                                setIsQrEditing(false);
                              }}
                              style={{
                                height: 30,
                                border: "none",
                                background: "var(--ocean-500)",
                                color: "#fff",
                                padding: "0 10px",
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              Update QR
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setQrDraft(link.qrCodeUrl ?? "");
                                setQrOptions({
                                  size: link.qrSize ?? 156,
                                  margin: link.qrMargin ?? 1,
                                  dark: link.qrDark ?? "000000",
                                  light: link.qrLight ?? "ffffff",
                                });
                                setIsQrEditing(false);
                              }}
                              style={{
                                height: 30,
                                border: "1px solid var(--border)",
                                background: "var(--cloud)",
                                color: "var(--text-secondary)",
                                padding: "0 10px",
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: 8, maxWidth: 280 }}>
                      <div style={{ border: "1px dashed var(--border)", background: "var(--sky-100)", padding: 12, fontSize: 12, color: "var(--text-muted)" }}>
                        This link does not have a QR code generated yet.
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const next = `https://${link.domain}/qr/${link.slug}`;
                          setQrDraft(next);
                          onUpdate({
                            ...link,
                            qrCodeUrl: next,
                            qrSize: qrOptions.size,
                            qrMargin: qrOptions.margin,
                            qrDark: qrOptions.dark,
                            qrLight: qrOptions.light,
                          });
                          setIsQrEditing(true);
                        }}
                        style={{
                          height: 30,
                          border: "none",
                          background: "var(--ocean-500)",
                          color: "#fff",
                          padding: "0 10px",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Create QR code
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
                <MiniStat label="Clicks" value={link.stats.clicks.toLocaleString()} />
                <MiniStat label="CTR" value={`${link.stats.ctr}%`} />
                <MiniStat label="7d clicks" value={totalTimelineClicks.toLocaleString()} />
              </div>

              <div style={{ border: "1px solid var(--border)", background: "var(--sky-100)", padding: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 8 }}>Timeline (7 days)</div>
                <div style={{ display: "grid", gap: 6 }}>
                  {link.stats.timeline.map((point) => {
                    const width = Math.max(8, Math.round((point.clicks / Math.max(1, link.stats.clicks)) * 100));
                    return (
                      <div key={point.date} style={{ display: "grid", gridTemplateColumns: "74px 1fr 42px", gap: 8, alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{point.date.slice(5)}</span>
                        <div style={{ height: 8, background: "var(--sky-200)", border: "1px solid var(--border)" }}>
                          <div style={{ width: `${width}%`, height: "100%", background: "var(--ocean-500)" }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textAlign: "right" }}>{point.clicks}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ border: "1px solid var(--border)", padding: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>Highlights</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", display: "grid", gap: 4 }}>
                  <span>Top referrer: {topReferrer ? `${topReferrer[0]} (${topReferrer[1]})` : "-"}</span>
                  <span>Top geo: {topGeo ? `${topGeo[0]} (${topGeo[1]})` : "-"}</span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <AnalyticsBreakdownCard
                  title="Referrers"
                  items={referrerEntries.map(([name, value]) => ({ name, value }))}
                />
                <AnalyticsBreakdownCard
                  title="Devices"
                  items={deviceEntries.map(([name, value]) => ({ name, value }))}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <AnalyticsBreakdownCard
                  title="Geography"
                  items={geoEntries.map(([name, value]) => ({ name, value }))}
                />
                <AnalyticsBreakdownCard
                  title="Campaign split"
                  items={campaignEntries.map(([name, value]) => ({ name, value }))}
                />
              </div>
            </div>
          )}
        </div>

        <div style={{ borderTop: "1px solid var(--border)", padding: "12px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <Link href={`/dashboard/links/${link.id}`} style={{ height: 34, display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: 12, fontWeight: 700, textDecoration: "none", background: "var(--sky-100)" }}>
            Open full details
          </Link>
          {status === "revoked" ? (
            <button onClick={onReactivate} style={{ height: 34, border: "1px solid #A7F3D0", background: "#ECFDF3", color: "#047857", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              Reactivate
            </button>
          ) : (
            <button onClick={onRevoke} style={{ height: 34, border: "1px solid #FECACA", background: "#FEF2F2", color: "#B91C1C", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              Revoke link
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

function DrawerTabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        height: 34,
        border: "none",
        borderBottom: active ? "2px solid var(--ocean-500)" : "2px solid transparent",
        background: active ? "var(--sky-100)" : "transparent",
        color: active ? "var(--ink)" : "var(--text-muted)",
        fontSize: 11,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function DrawerSubTabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        height: 28,
        border: `1px solid ${active ? "var(--ocean-400)" : "var(--border)"}`,
        background: active ? "var(--ocean-50)" : "var(--cloud)",
        color: active ? "var(--ocean-700)" : "var(--text-secondary)",
        padding: "0 10px",
        fontSize: 11,
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function DrawerField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 3 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
      {children}
    </label>
  );
}

function AnalyticsBreakdownCard({ title, items }: { title: string; items: Array<{ name: string; value: number }> }) {
  return (
    <div style={{ border: "1px solid var(--border)", background: "var(--sky-100)", padding: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>{title}</div>
      {items.length === 0 ? (
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>No data</div>
      ) : (
        <div style={{ display: "grid", gap: 5 }}>
          {items.slice(0, 6).map((item) => (
            <div key={item.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <span style={{ fontSize: 12, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>{item.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const drawerInputStyle: React.CSSProperties = {
  width: "100%",
  height: 30,
  border: "1px solid var(--border)",
  background: "var(--cloud)",
  color: "var(--text-secondary)",
  fontSize: 12,
  fontFamily: "var(--font-body)",
  padding: "0 8px",
  outline: "none",
};

function MetaRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ border: "1px solid var(--border)", padding: "10px 12px", background: "var(--sky-100)" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: mono ? "var(--font-mono)" : "var(--font-body)" }}>{value}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: "1px solid var(--border)", background: "var(--sky-100)", padding: "8px 10px" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>{value}</div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: "10px 14px",
  textAlign: "left",
  fontWeight: 700,
  fontSize: 10,
  color: "var(--text-muted)",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};

const fieldLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--text-muted)",
};

function iconBtnStyle(color: string): React.CSSProperties {
  return {
    background: "none",
    border: "1px solid var(--border)",
    color,
    width: 28,
    height: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  };
}
