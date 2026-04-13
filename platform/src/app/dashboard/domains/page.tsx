"use client";

import { useState, useEffect } from "react";
import { Plus, X, Globe, CheckCircle, Clock, AlertCircle, Copy, Check, ExternalLink, Trash2 } from "lucide-react";
import PageHeader from "@/platform/components/PageHeader";
import Panel from "@/platform/components/Panel";
import StatCard from "@/platform/components/StatCard";
import { api } from "@/platform/lib/api";

const STATUS_STYLES: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
  Verified: { bg: "#F0FDF4", color: "#166534", icon: <CheckCircle size={12} /> },
  Pending: { bg: "#FFFBEB", color: "#92400E", icon: <Clock size={12} /> },
  Failed: { bg: "#FEF2F2", color: "#991B1B", icon: <AlertCircle size={12} /> },
};

const DNS_RECORDS = [
  { type: "CNAME", host: "www", value: "cname.url.ify.io", ttl: "3600" },
  { type: "TXT", host: "@", value: "urlify-verify=abc123def456", ttl: "3600" },
];

interface DomainDto {
  id: string;
  domainName: string;
  isVerified: boolean;
  verificationStatus?: string;
  sslStatus?: string;
  createdAtUtc?: string;
}

interface DomainRecord {
  id: string;
  host: string;
  status: "Verified" | "Pending" | "Failed";
  ssl: string;
}

function mapDto(d: DomainDto): DomainRecord {
  const status: DomainRecord["status"] = d.isVerified
    ? "Verified"
    : (d.verificationStatus === "Failed" ? "Failed" : "Pending");
  const ssl = d.isVerified ? "Active" : "Pending";
  return { id: d.id, host: d.domainName, status, ssl };
}

export default function DomainsPage() {
  const [domains, setDomains] = useState<DomainRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [domainInput, setDomainInput] = useState("");
  const [adding, setAdding] = useState(false);

  const [showDns, setShowDns] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get<{ total: number; page: number; pageSize: number; items: DomainDto[] }>(
        "/api/v1/tenant/domains?pageSize=100"
      )
      .then((res) => {
        if (!cancelled) setDomains(res.items.map(mapDto));
      })
      .catch((err: Error) => {
        if (!cancelled) setApiError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleCopy = (val: string) => {
    navigator.clipboard.writeText(val).catch(() => {});
    setCopied(val);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleAddDomain = () => {
    const host = domainInput.trim();
    if (!host) return;
    setAdding(true);
    api
      .post<DomainDto>("/api/v1/tenant/domains", { domainName: host })
      .then((res) => {
        setDomains((prev) => [...prev, mapDto(res)]);
        setDomainInput("");
        setShowAdd(false);
      })
      .catch((err: Error) => alert(`Failed to add domain: ${err.message}`))
      .finally(() => setAdding(false));
  };

  const handleDelete = (id: string) => {
    setDomains((prev) => prev.filter((d) => d.id !== id));
    api.delete(`/api/v1/tenant/domains/${id}`).catch(console.error);
  };

  const handleVerify = (id: string) => {
    api
      .post(`/api/v1/tenant/domains/${id}/verify`, {})
      .then(() => {
        setDomains((prev) =>
          prev.map((d) => (d.id === id ? { ...d, status: "Verified", ssl: "Active" } : d))
        );
      })
      .catch(console.error);
    setShowDns(null);
  };

  const verified = domains.filter((d) => d.status === "Verified").length;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <PageHeader
        title="Custom Domains"
        description="Use your own branded domain for all short links. Connect, verify, and manage."
        breadcrumb="Platform"
        action={
          <button
            onClick={() => setShowAdd(true)}
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
            Add domain
          </button>
        }
      />

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total domains", value: domains.length },
          { label: "Verified", value: verified },
          { label: "Pending verification", value: domains.filter((d) => d.status === "Pending").length },
        ].map((s) => (
          <StatCard key={s.label} micro label={s.label} value={s.value} />
        ))}
      </div>

      {/* Domain table */}
      <Panel title="Your domains" subtitle="Manage branded short-link domains" noPad>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--sky-100)", borderBottom: "1px solid var(--border)" }}>
              {["Domain", "Status", "SSL", "Actions"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "10px 20px",
                    textAlign: "left",
                    fontWeight: 700,
                    fontSize: 10,
                    color: "var(--text-muted)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} style={{ padding: "56px 20px", textAlign: "center", color: "var(--text-muted)" }}>
                  Loading domains…
                </td>
              </tr>
            ) : apiError ? (
              <tr>
                <td colSpan={4} style={{ padding: "56px 20px", textAlign: "center", color: "#B91C1C" }}>
                  {apiError}
                </td>
              </tr>
            ) : domains.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: "56px 20px", textAlign: "center", color: "var(--text-muted)" }}>
                  No custom domains yet. Click "Add domain" to get started.
                </td>
              </tr>
            ) : (
              domains.map((domain) => {
                const statusStyle = STATUS_STYLES[domain.status] ?? STATUS_STYLES.Pending;
                return (
                  <tr
                    key={domain.id}
                    style={{ borderBottom: "1px solid var(--border)" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--sky-50)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                  >
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            background: "var(--ocean-50)",
                            border: "1px solid var(--ocean-100)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Globe size={13} style={{ color: "var(--ocean-500)" }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-mono)", fontSize: 13 }}>
                            {domain.host}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>https://{domain.host}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          background: statusStyle.bg,
                          color: statusStyle.color,
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 9px",
                          border: `1px solid ${statusStyle.color}33`,
                        }}
                      >
                        {statusStyle.icon}
                        {domain.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          background: domain.ssl === "Active" ? "#F0FDF4" : "#FFFBEB",
                          color: domain.ssl === "Active" ? "#166534" : "#92400E",
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 9px",
                          border: `1px solid ${domain.ssl === "Active" ? "#BBF7D0" : "#FCD34D"}`,
                        }}
                      >
                        {domain.ssl}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {domain.status === "Pending" && (
                          <button
                            onClick={() => setShowDns(domain.id)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              height: 28,
                              padding: "0 10px",
                              fontSize: 10,
                              fontWeight: 700,
                              background: "#FFFBEB",
                              border: "1px solid #FCD34D",
                              color: "#92400E",
                              cursor: "pointer",
                              fontFamily: "var(--font-body)",
                            }}
                          >
                            View DNS
                          </button>
                        )}
                        <button
                          onClick={() => window.open(`https://${domain.host}`, "_blank")}
                          style={{
                            background: "none",
                            border: "1px solid var(--border)",
                            color: "var(--text-muted)",
                            width: 28,
                            height: 28,
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
                          onClick={() => handleDelete(domain.id)}
                          style={{
                            background: "none",
                            border: "1px solid var(--border)",
                            color: "var(--coral)",
                            width: 28,
                            height: 28,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                          }}
                          title="Delete"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Panel>

      {/* DNS modal */}
      {showDns && (
        <>
          <div style={{ position: "fixed", inset: 0, background: "rgba(7,27,44,0.45)", zIndex: 200 }} onClick={() => setShowDns(null)} />
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              width: 560,
              background: "var(--cloud)",
              border: "1px solid var(--border)",
              zIndex: 201,
              boxShadow: "var(--shadow-xl)",
            }}
          >
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)" }}>DNS setup — {domains.find((d) => d.id === showDns)?.host}</h2>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Add these records to your DNS provider, then click Verify.</p>
              </div>
              <button onClick={() => setShowDns(null)} style={{ background: "none", border: "1px solid var(--border)", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <X size={14} />
              </button>
            </div>
            <div style={{ padding: 24 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Type", "Host", "Value", "TTL", ""].map((h) => (
                      <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DNS_RECORDS.map((r) => (
                    <tr key={r.type} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "10px 10px" }}>
                        <span style={{ background: "var(--ocean-50)", color: "var(--ocean-700)", fontWeight: 700, fontSize: 10, padding: "2px 6px", border: "1px solid var(--ocean-100)" }}>
                          {r.type}
                        </span>
                      </td>
                      <td style={{ padding: "10px 10px", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink)" }}>{r.host}</td>
                      <td style={{ padding: "10px 10px", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.value}
                      </td>
                      <td style={{ padding: "10px 10px", color: "var(--text-muted)" }}>{r.ttl}</td>
                      <td style={{ padding: "10px 10px" }}>
                        <button
                          onClick={() => handleCopy(r.value)}
                          style={{ background: "none", border: "1px solid var(--border)", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: copied === r.value ? "var(--sage)" : "var(--text-muted)" }}
                        >
                          {copied === r.value ? <Check size={10} /> : <Copy size={10} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button
                  onClick={() => handleVerify(showDns)}
                  style={{ flex: 1, height: 40, background: "var(--ocean-500)", color: "#fff", border: "none", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer" }}
                >
                  Verify domain
                </button>
                <button onClick={() => setShowDns(null)} style={{ height: 40, padding: "0 18px", background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add domain modal */}
      {showAdd && (
        <>
          <div style={{ position: "fixed", inset: 0, background: "rgba(7,27,44,0.45)", zIndex: 200 }} onClick={() => setShowAdd(false)} />
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              width: 460,
              background: "var(--cloud)",
              border: "1px solid var(--border)",
              zIndex: 201,
              boxShadow: "var(--shadow-xl)",
            }}
          >
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)" }}>Add custom domain</h2>
              <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "1px solid var(--border)", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <X size={14} />
              </button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 5 }}>
                  Domain name *
                </label>
                <input
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  placeholder="links.yourcompany.com"
                  style={{ width: "100%", height: 40, padding: "0 12px", border: "1px solid var(--border)", background: "var(--sky-100)", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink)", outline: "none", boxSizing: "border-box" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--ocean-500)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddDomain(); }}
                />
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 5 }}>Enter a subdomain you control, e.g. links.acme.com</p>
              </div>
              <div style={{ background: "var(--sky-100)", border: "1px solid var(--border)", borderLeft: "3px solid var(--ocean-400)", padding: "12px 14px", marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ocean-700)", marginBottom: 4 }}>What happens next?</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  After adding the domain, we will provide DNS records to add to your provider. Verification usually takes 5–60 minutes.
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={handleAddDomain}
                  disabled={adding}
                  style={{ flex: 1, height: 40, background: "var(--ocean-500)", color: "#fff", border: "none", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", cursor: adding ? "not-allowed" : "pointer", opacity: adding ? 0.7 : 1 }}
                >
                  {adding ? "Adding…" : "Add domain"}
                </button>
                <button onClick={() => setShowAdd(false)} style={{ height: 40, padding: "0 18px", background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
