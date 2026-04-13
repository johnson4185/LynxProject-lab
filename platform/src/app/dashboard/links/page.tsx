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
import { api } from "@/platform/lib/api";

type StatusFilter = "all" | "active" | "revoked" | "expired";
type DrawerTab = "metadata" | "analytics";
type DrawerMetaSubTab = "overview" | "qr";

type LinkRecord = {
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
  stats: {
    clicks: number;
    ctr: number;
    timeline: Array<{ date: string; clicks: number }>;
    referrers: Record<string, number>;
    devices: Record<string, number>;
    geo: Record<string, number>;
    campaigns?: Record<string, number>;
  };
};

interface LinkListItemDto {
  shortCode: string;
  status: string;
  title?: string | null;
  campaignId?: string | null;
  clickCount: number;
  createdAtUtc: string;
  expiryUtc: string;
  isActive: boolean;
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
    expiresAt: item.expiryUtc,
    isRevoked: item.status === "revoked",
    revokedAt: item.revokedAtUtc ?? undefined,
    title: item.title ?? undefined,
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
  const [links, setLinks] = useState<LinkRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
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
    let cancelled = false;
    setLoading(true);
    setApiError(null);
    api
      .get<{ total: number; page: number; pageSize: number; items: LinkListItemDto[] }>(
        "/api/admin/v1/links?pageSize=200"
      )
      .then((res) => {
        if (!cancelled) setLinks(res.items.map(mapDto));
      })
      .catch((err: Error) => {
        if (!cancelled) setApiError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
    if (ids.length === 1) {
      api.post(`/api/admin/v1/links/${ids[0]}/revoke`).catch(console.error);
    } else {
      api.post("/api/admin/v1/links/bulk/revoke", { shortCodes: ids }).catch(console.error);
    }
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
    ids.forEach((id) =>
      api.post(`/api/admin/v1/links/${id}/activate`).catch(console.error)
    );
  };

  const reactivateLink = (id: string) => {
    setLinks((previous) => previous.map((link) => (link.id === id ? { ...link, isRevoked: false, revokedAt: undefined } : link)));
    api.post(`/api/admin/v1/links/${id}/activate`).catch(console.error);
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
            {loading ? (
              <tr>
                <td colSpan={9} style={{ padding: "56px 16px", textAlign: "center", color: "var(--text-muted)" }}>
                  Loading links…
                </td>
              </tr>
            ) : apiError ? (
              <tr>
                <td colSpan={9} style={{ padding: "56px 16px", textAlign: "center", color: "#B91C1C" }}>
                  {apiError}
                </td>
              </tr>
            ) : filtered.length === 0 ? (
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
                          onClick={() => copyShortUrl(link.redirectUrl)}
                          title="Copy"
                          style={iconBtnStyle(copied === link.redirectUrl ? "var(--sage)" : "var(--text-muted)")}
                        >
                          {copied === link.redirectUrl ? <Check size={12} /> : <Copy size={12} />}
                        </button>

                        <Link
                          href={`/dashboard/links/${link.id}`}
                          title="Open details"
                          style={{ ...iconBtnStyle("var(--text-muted)"), textDecoration: "none" }}
                        >
                          <Eye size={12} />
                        </Link>

                        <a href={link.redirectUrl} target="_blank" rel="noopener noreferrer" title="Open short link" style={{ ...iconBtnStyle("var(--text-muted)"), textDecoration: "none" }}>
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
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [expiryDays, setExpiryDays] = useState("30");
  const [oneTimeUse, setOneTimeUse] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ shortUrl: string; redirectUrl: string; destination: string } | null>(null);

  const sx: React.CSSProperties = {
    width: "100%", height: 32, border: "1px solid var(--border)",
    background: "var(--sky-100)", padding: "0 8px",
    fontFamily: "var(--font-body)", fontSize: 12, color: "var(--ink)", outline: "none",
  };
  const lx: React.CSSProperties = {
    display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
    textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 3,
  };

  function resetForm() {
    setDestination("https://");
    setTitle("");
    setTags("");
    setExpiryDays("30");
    setOneTimeUse(false);
    setError(null);
    setCreated(null);
  }

  /* ── Success screen ── */
  if (created) {
    return (
      <Modal open={true} onClose={onClose} title="Link created" width={520}>
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ background: "#ECFDF3", border: "1px solid #A7F3D0", padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <Check size={18} color="#047857" />
            <span style={{ fontWeight: 700, color: "#047857", fontSize: 13 }}>Link created successfully</span>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <div>
              <span style={lx}>Short URL</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6, height: 32, border: "1px solid var(--border)", background: "var(--sky-100)", padding: "0 8px" }}>
                <span style={{ flex: 1, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink)", fontWeight: 700 }}>{created.shortUrl}</span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(created.redirectUrl).catch(() => {})}
                  style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", color: "var(--text-muted)" }}
                  title="Copy redirect URL"
                >
                  <Copy size={12} />
                </button>
                <a href={created.redirectUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
            <div>
              <span style={lx}>Destination</span>
              <div style={{ height: 32, border: "1px solid var(--border)", background: "var(--sky-100)", padding: "0 8px", display: "flex", alignItems: "center", overflow: "hidden" }}>
                <span style={{ fontSize: 12, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{created.destination}</span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, paddingTop: 4, borderTop: "1px solid var(--border)" }}>
            <button
              type="button"
              onClick={resetForm}
              style={{ flex: 1, height: 32, border: "1px solid var(--ocean-300)", background: "transparent", color: "var(--ocean-600)", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "var(--font-body)" }}
            >
              Create another
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, height: 32, border: "none", background: "var(--ocean-500)", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "var(--font-body)" }}
            >
              Done
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  /* ── Create form ── */
  return (
    <Modal open={true} onClose={onClose} title="Create link" width={580}>
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
              // Fire-and-forget: set title + tags via update
              if (title.trim() || parsedTags.length > 0) {
                api.put(`/api/admin/v1/links/${shortCode}`, {
                  title: title.trim() || undefined,
                  tags: parsedTags.length > 0 ? parsedTags : undefined,
                }).catch(console.error);
              }
              const newLink: LinkRecord = {
                id: shortCode,
                shortUrl: displayUrl,
                redirectUrl,
                destination: dest,
                slug: shortCode,
                domain: SHORT_DOMAIN,
                createdAt: new Date().toISOString(),
                createdBy: "",
                workspaceId: "",
                tags: parsedTags,
                title: title.trim() || undefined,
                expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString(),
                stats: { clicks: 0, ctr: 0, timeline: [], referrers: {}, devices: {}, geo: {}, campaigns: {} },
              };
              onCreate(newLink);
              setCreated({ shortUrl: displayUrl, redirectUrl, destination: dest });
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

        <label style={{ display: "grid", gap: 3 }}>
          <span style={lx}>Destination URL <span style={{ color: "#B91C1C" }}>*</span></span>
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--ocean-500)"; }}
            onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--border)"; }}
            style={sx}
            required
            placeholder="https://your-destination.com/page"
            autoFocus
          />
        </label>

        <label style={{ display: "grid", gap: 3 }}>
          <span style={lx}>Title <span style={{ color: "var(--text-muted)", fontWeight: 400, textTransform: "none" }}>(optional)</span></span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--ocean-500)"; }}
            onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--border)"; }}
            style={sx}
            placeholder="e.g. Summer sale landing page"
          />
        </label>

        <label style={{ display: "grid", gap: 3 }}>
          <span style={lx}>Tags <span style={{ color: "var(--text-muted)", fontWeight: 400, textTransform: "none" }}>(comma separated)</span></span>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--ocean-500)"; }}
            onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--border)"; }}
            style={sx}
            placeholder="campaign, product, launch"
          />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label style={{ display: "grid", gap: 3 }}>
            <span style={lx}>Expiry <span style={{ color: "var(--text-muted)", fontWeight: 400, textTransform: "none" }}>(days)</span></span>
            <input
              type="number"
              min={1}
              max={365}
              value={expiryDays}
              onChange={(e) => setExpiryDays(e.target.value)}
              onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--ocean-500)"; }}
              onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--border)"; }}
              style={sx}
              placeholder="30"
            />
          </label>

          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <span style={lx}>One-time use</span>
            <div style={{ display: "flex", alignItems: "center", height: 32, gap: 10 }}>
              <button
                type="button"
                onClick={() => setOneTimeUse((v) => !v)}
                style={{
                  width: 40, height: 22,
                  background: oneTimeUse ? "var(--ocean-500)" : "#E5E7EB",
                  border: `1px solid ${oneTimeUse ? "var(--ocean-600)" : "#D1D5DB"}`,
                  borderRadius: 2, cursor: "pointer", position: "relative",
                  flexShrink: 0,
                }}
              >
                <div style={{
                  position: "absolute", width: 16, height: 16, background: "white",
                  border: `1px solid ${oneTimeUse ? "var(--ocean-400)" : "#D1D5DB"}`,
                  top: 2, left: oneTimeUse ? 20 : 2, transition: "left 0.15s",
                }} />
              </button>
              <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>Link expires after first click</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
          <button
            type="button"
            onClick={onClose}
            style={{ height: 32, padding: "0 14px", border: "1px solid var(--border)", background: "var(--sky-100)", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "var(--font-body)" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            style={{ height: 32, padding: "0 18px", border: "none", background: submitting ? "var(--ocean-300)" : "var(--ocean-500)", color: "#fff", fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", fontSize: 12, fontFamily: "var(--font-body)" }}
          >
            {submitting ? "Creating…" : "Create link"}
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
  const [extendMinutes, setExtendMinutes] = useState(1440);
  const [extendLoading, setExtendLoading] = useState(false);
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
    const updatedTags = form.tags
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const updated: LinkRecord = {
      ...link,
      destination: form.destination.trim() || link.destination,
      domain: form.domain.trim() || link.domain,
      slug: form.slug.trim() || link.slug,
      tags: updatedTags,
      createdAt: form.createdDate ? new Date(form.createdDate).toISOString() : link.createdAt,
      expiresAt: form.expiryDate ? new Date(form.expiryDate).toISOString() : undefined,
      stats: {
        ...link.stats,
        campaigns: { [campaignKey]: link.stats.clicks },
      },
    };
    onUpdate(updated);
    setIsEditing(false);
    api
      .put(`/api/admin/v1/links/${link.id}`, { tags: updatedTags })
      .catch(console.error);
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

        {status === "active" && (
          <div style={{ borderTop: "1px solid var(--border)", padding: "10px 16px", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>Extend expiry</span>
            <select
              value={extendMinutes}
              onChange={(e) => setExtendMinutes(Number(e.target.value))}
              style={{ flex: 1, height: 30, border: "1px solid var(--border)", background: "var(--sky-100)", color: "var(--text-secondary)", fontSize: 12, fontFamily: "var(--font-body)", padding: "0 6px" }}
            >
              <option value={60}>+ 1 hour</option>
              <option value={360}>+ 6 hours</option>
              <option value={1440}>+ 1 day</option>
              <option value={10080}>+ 7 days</option>
              <option value={43200}>+ 30 days</option>
            </select>
            <button
              disabled={extendLoading}
              onClick={() => {
                setExtendLoading(true);
                api
                  .post<{ shortCode: string; newExpiryUtc: string }>(
                    `/api/admin/v1/links/${link.id}/extend-expiry`,
                    { minutes: extendMinutes }
                  )
                  .then((res) => {
                    onUpdate({ ...link, expiresAt: res.newExpiryUtc });
                  })
                  .catch(console.error)
                  .finally(() => setExtendLoading(false));
              }}
              style={{ height: 30, border: "none", background: "var(--ocean-500)", color: "#fff", padding: "0 12px", fontSize: 11, fontWeight: 700, cursor: extendLoading ? "not-allowed" : "pointer", opacity: extendLoading ? 0.6 : 1, whiteSpace: "nowrap" }}
            >
              {extendLoading ? "…" : "Extend"}
            </button>
          </div>
        )}
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
