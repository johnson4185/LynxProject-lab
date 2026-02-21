"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Search,
  Filter,
  Copy,
  ExternalLink,
  Trash2,
  QrCode,
  BarChart2,
  Link2,
  X,
  Check,
  Tag,
  Lock,
  MoreHorizontal,
} from "lucide-react";
import PageHeader from "@/platform/components/PageHeader";
import { dashboardData } from "@/platform/lib/dashboardData";

type SortKey = "clicks" | "ctr" | "createdAt";

export default function LinksPage() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("clicks");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Gather all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    dashboardData.links.forEach((l) => (l.tags ?? []).forEach((t) => tags.add(t)));
    return Array.from(tags);
  }, []);

  const filtered = useMemo(() => {
    let list = [...dashboardData.links];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (l) =>
          l.shortUrl.toLowerCase().includes(q) ||
          l.destination.toLowerCase().includes(q) ||
          (l.tags ?? []).some((t) => t.includes(q))
      );
    }
    if (filterTag) {
      list = list.filter((l) => (l.tags ?? []).includes(filterTag));
    }
    list.sort((a, b) => {
      if (sortBy === "clicks") return b.stats.clicks - a.stats.clicks;
      if (sortBy === "ctr") return b.stats.ctr - a.stats.ctr;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return list;
  }, [search, sortBy, filterTag]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((l) => l.id)));
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(url);
    if (copyTimerRef.current) {
      clearTimeout(copyTimerRef.current);
    }
    copyTimerRef.current = setTimeout(() => setCopied(null), 1500);
  };

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
      <PageHeader
        title="Links"
        description="Create, manage, and track all your short links in one place."
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

      {/* Summary stats row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 10,
          marginBottom: 20,
        }}
      >
        {[
          { label: "Total links", value: dashboardData.links.length },
          { label: "Total clicks", value: dashboardData.totals.clicks.toLocaleString() },
          { label: "Avg. CTR", value: `${dashboardData.totals.avgCtr}%` },
          { label: "With QR", value: dashboardData.totals.withQr },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "var(--cloud)",
              border: "1px solid var(--border)",
              borderLeft: "3px solid var(--ocean-400)",
              padding: "14px 16px",
              boxShadow: "var(--shadow-xs)",
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 4 }}>
              {s.label}
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "var(--ink)", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div
        style={{
          background: "var(--cloud)",
          border: "1px solid var(--border)",
          borderBottom: "none",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 200, maxWidth: 360 }}>
          <Search
            size={13}
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
              pointerEvents: "none",
            }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search links, destinations, tags…"
            style={{
              width: "100%",
              height: 34,
              paddingLeft: 30,
              paddingRight: 10,
              border: "1px solid var(--border)",
              background: "var(--sky-100)",
              fontFamily: "var(--font-body)",
              fontSize: 13,
              color: "var(--ink)",
              outline: "none",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--ocean-500)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          />
        </div>

        {/* Sort */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Sort:</span>
          {(["clicks", "ctr", "createdAt"] as SortKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setSortBy(k)}
              style={{
                height: 30,
                padding: "0 10px",
                fontSize: 11,
                fontWeight: 700,
                background: sortBy === k ? "var(--ocean-500)" : "var(--sky-100)",
                color: sortBy === k ? "#fff" : "var(--text-muted)",
                border: "1px solid var(--border)",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
                textTransform: "capitalize",
              }}
            >
              {k === "createdAt" ? "Date" : k === "ctr" ? "CTR" : "Clicks"}
            </button>
          ))}
        </div>

        {/* Filter by tag */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowFilterMenu((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              height: 30,
              padding: "0 10px",
              fontSize: 11,
              fontWeight: 700,
              background: filterTag ? "var(--ocean-50)" : "var(--sky-100)",
              color: filterTag ? "var(--ocean-700)" : "var(--text-muted)",
              border: `1px solid ${filterTag ? "var(--ocean-300)" : "var(--border)"}`,
              cursor: "pointer",
              fontFamily: "var(--font-body)",
            }}
          >
            <Filter size={11} />
            {filterTag ?? "Filter"}
            {filterTag && (
              <span
                onClick={(e) => { e.stopPropagation(); setFilterTag(null); }}
                style={{ marginLeft: 2, display: "flex", alignItems: "center" }}
              >
                <X size={10} />
              </span>
            )}
          </button>
          {showFilterMenu && (
            <div
              style={{
                position: "absolute",
                top: 34,
                left: 0,
                background: "var(--cloud)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-md)",
                zIndex: 50,
                minWidth: 140,
              }}
            >
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => { setFilterTag(tag === filterTag ? null : tag); setShowFilterMenu(false); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: 12,
                    fontWeight: 600,
                    background: filterTag === tag ? "var(--ocean-50)" : "transparent",
                    color: filterTag === tag ? "var(--ocean-700)" : "var(--text-secondary)",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  <Tag size={10} />
                  {tag}
                  {filterTag === tag && <Check size={10} style={{ marginLeft: "auto" }} />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
          {filtered.length} link{filtered.length !== 1 ? "s" : ""}
          {selected.size > 0 && (
            <span style={{ color: "var(--ocean-600)", fontWeight: 700, marginLeft: 8 }}>
              · {selected.size} selected
            </span>
          )}
        </div>

        {selected.size > 0 && (
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              height: 30,
              padding: "0 10px",
              fontSize: 11,
              fontWeight: 700,
              background: "#FEF2F2",
              color: "var(--coral)",
              border: "1px solid #FECACA",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
            }}
          >
            <Trash2 size={11} />
            Delete {selected.size}
          </button>
        )}
      </div>

      {/* Table */}
      <div
        style={{
          background: "var(--cloud)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-xs)",
          overflowX: "auto",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--sky-100)", borderBottom: "1px solid var(--border)" }}>
              <th style={{ padding: "10px 16px", width: 40 }}>
                <input
                  type="checkbox"
                  checked={selected.size === filtered.length && filtered.length > 0}
                  onChange={toggleAll}
                  style={{ cursor: "pointer", accentColor: "var(--ocean-500)" }}
                />
              </th>
              <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 700, fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                Short link
              </th>
              <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 700, fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Destination
              </th>
              <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 700, fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Tags
              </th>
              <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: 700, fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Clicks
              </th>
              <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: 700, fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                CTR
              </th>
              <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 700, fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                Created
              </th>
              <th style={{ padding: "10px 16px", textAlign: "center", fontWeight: 700, fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    padding: "60px 20px",
                    textAlign: "center",
                    color: "var(--text-muted)",
                    fontSize: 14,
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <Link2 size={32} style={{ opacity: 0.25 }} />
                    <span>No links found</span>
                    <button
                      onClick={() => setShowCreate(true)}
                      style={{
                        marginTop: 4,
                        background: "var(--ocean-500)",
                        color: "#fff",
                        border: "none",
                        padding: "8px 18px",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      Create your first link
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((link) => (
                <tr
                  key={link.id}
                  className={!selected.has(link.id) ? "dashboard-row-hover" : undefined}
                  style={{
                    borderBottom: "1px solid var(--border)",
                    background: selected.has(link.id) ? "var(--ocean-50)" : "transparent",
                    transition: "background 0.1s",
                  }}
                >
                  <td style={{ padding: "12px 16px" }}>
                    <input
                      type="checkbox"
                      checked={selected.has(link.id)}
                      onChange={() => toggleSelect(link.id)}
                      style={{ cursor: "pointer", accentColor: "var(--ocean-500)" }}
                    />
                  </td>
                  <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {link.passwordProtected && (
                        <Lock size={11} style={{ color: "var(--amber)", flexShrink: 0 }} />
                      )}
                      <span style={{ fontWeight: 700, color: "var(--ocean-600)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
                        {link.shortUrl}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", maxWidth: 260 }}>
                    <span style={{ color: "var(--text-muted)", fontSize: 12, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {link.destination}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {(link.tags ?? []).map((tag) => (
                        <span
                          key={tag}
                          style={{
                            background: "var(--sky-100)",
                            border: "1px solid var(--border)",
                            color: "var(--text-muted)",
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "1px 6px",
                            letterSpacing: "0.04em",
                            textTransform: "uppercase",
                            cursor: "pointer",
                          }}
                          onClick={() => setFilterTag(tag)}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: "var(--ink)" }}>
                    {link.stats.clicks.toLocaleString()}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <span
                      style={{
                        background: "var(--ocean-50)",
                        color: "var(--ocean-700)",
                        fontWeight: 700,
                        fontSize: 11,
                        padding: "2px 7px",
                        border: "1px solid var(--ocean-100)",
                      }}
                    >
                      {link.stats.ctr}%
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--text-muted)", fontSize: 12, whiteSpace: "nowrap" }}>
                    {new Date(link.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                      <button
                        onClick={() => handleCopy(link.shortUrl)}
                        style={{
                          background: "none",
                          border: "1px solid var(--border)",
                          color: copied === link.shortUrl ? "var(--sage)" : "var(--text-muted)",
                          width: 26,
                          height: 26,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                        title="Copy"
                      >
                        {copied === link.shortUrl ? <Check size={11} /> : <Copy size={11} />}
                      </button>
                      <button
                        style={{
                          background: "none",
                          border: "1px solid var(--border)",
                          color: "var(--text-muted)",
                          width: 26,
                          height: 26,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                        title="Open"
                      >
                        <ExternalLink size={11} />
                      </button>
                      <button
                        style={{
                          background: "none",
                          border: "1px solid var(--border)",
                          color: "var(--text-muted)",
                          width: 26,
                          height: 26,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                        title="Analytics"
                      >
                        <BarChart2 size={11} />
                      </button>
                      <button
                        style={{
                          background: "none",
                          border: "1px solid var(--border)",
                          color: "var(--text-muted)",
                          width: 26,
                          height: 26,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                        title="More"
                      >
                        <MoreHorizontal size={11} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Link slide-in panel */}
      {showCreate && (
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(7,27,44,0.45)",
              zIndex: 200,
            }}
            onClick={() => setShowCreate(false)}
          />
          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: 440,
              background: "var(--cloud)",
              borderLeft: "1px solid var(--border)",
              zIndex: 201,
              display: "flex",
              flexDirection: "column",
              boxShadow: "var(--shadow-xl)",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em" }}>
                  Create short link
                </h2>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                  All fields except destination are optional
                </p>
              </div>
              <button
                onClick={() => setShowCreate(false)}
                style={{
                  background: "none",
                  border: "1px solid var(--border)",
                  width: 30,
                  height: 30,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Form */}
            <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
              <CreateLinkForm onClose={() => setShowCreate(false)} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label
        style={{
          display: "block",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--text-secondary)",
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      {children}
      {hint && (
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{hint}</p>
      )}
    </div>
  );
}

function CreateLinkForm({ onClose }: { onClose: () => void }) {
  const [url, setUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [domain, setDomain] = useState("acme.ly");
  const [tags, setTags] = useState("");
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [enableQr, setEnableQr] = useState(false);
  const [passwordProtect, setPasswordProtect] = useState(false);
  const [expiry, setExpiry] = useState("");

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: 38,
    padding: "0 12px",
    border: "1px solid var(--border)",
    background: "var(--sky-100)",
    fontFamily: "var(--font-body)",
    fontSize: 13,
    color: "var(--ink)",
    outline: "none",
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <Field label="Destination URL *">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://your-website.com/page"
          style={inputStyle}
          required
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--ocean-500)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
        />
      </Field>

      <Field label="Custom slug" hint="Leave blank to auto-generate">
        <div style={{ display: "flex" }}>
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            style={{
              ...inputStyle,
              width: "auto",
              flexShrink: 0,
              background: "var(--sky-200)",
              borderRight: "none",
              fontSize: 12,
              color: "var(--text-secondary)",
              paddingRight: 28,
              cursor: "pointer",
            }}
          >
            <option value="acme.ly">acme.ly /</option>
            <option value="go.acme.com">go.acme.com /</option>
          </select>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="my-slug"
            style={{ ...inputStyle, flex: 1 }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--ocean-500)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          />
        </div>
      </Field>

      <Field label="Tags" hint="Comma-separated, e.g. campaign, social">
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="campaign, social, launch"
          style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--ocean-500)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
        />
      </Field>

      {/* UTM section */}
      <div
        style={{
          borderTop: "1px solid var(--border)",
          paddingTop: 16,
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 12 }}>
          UTM Parameters
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { label: "Source", val: utmSource, set: setUtmSource, ph: "newsletter" },
            { label: "Medium", val: utmMedium, set: setUtmMedium, ph: "email" },
            { label: "Campaign", val: utmCampaign, set: setUtmCampaign, ph: "spring-launch" },
          ].map((f) => (
            <div key={f.label}>
              <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
                {f.label}
              </label>
              <input
                value={f.val}
                onChange={(e) => f.set(e.target.value)}
                placeholder={f.ph}
                style={{ ...inputStyle, height: 34, fontSize: 12 }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--ocean-500)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Options */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 12 }}>
          Options
        </div>
        {[
          { label: "Generate QR code", val: enableQr, set: setEnableQr, icon: <QrCode size={13} /> },
          { label: "Password protect", val: passwordProtect, set: setPasswordProtect, icon: <Lock size={13} /> },
        ].map((opt) => (
          <label
            key={opt.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 10,
              cursor: "pointer",
              fontSize: 13,
              color: "var(--text-secondary)",
              fontWeight: 500,
            }}
          >
            <div
              onClick={() => opt.set((v: boolean) => !v)}
              style={{
                width: 36,
                height: 20,
                background: opt.val ? "var(--ocean-500)" : "var(--sky-300)",
                position: "relative",
                cursor: "pointer",
                transition: "background 0.2s",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 2,
                  left: opt.val ? 18 : 2,
                  width: 16,
                  height: 16,
                  background: "#fff",
                  transition: "left 0.2s",
                }}
              />
            </div>
            {opt.icon}
            {opt.label}
          </label>
        ))}

        <div style={{ marginTop: 4 }}>
          <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
            Expiry date
          </label>
          <input
            type="date"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            style={{ ...inputStyle, height: 34, fontSize: 12 }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--ocean-500)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          />
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10 }}>
        <button
          type="submit"
          style={{
            flex: 1,
            height: 42,
            background: "var(--ocean-500)",
            color: "#fff",
            border: "none",
            fontFamily: "var(--font-body)",
            fontWeight: 700,
            fontSize: 12,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Create link
        </button>
        <button
          type="button"
          onClick={onClose}
          style={{
            height: 42,
            padding: "0 18px",
            background: "transparent",
            color: "var(--text-muted)",
            border: "1px solid var(--border)",
            fontFamily: "var(--font-body)",
            fontWeight: 600,
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
