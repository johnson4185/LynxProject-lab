"use client";

import { useState } from "react";
import { Plus, Download, Copy, X, Search, QrCode, Check } from "lucide-react";
import PageHeader from "@/platform/components/PageHeader";
import { dashboardData } from "@/platform/lib/dashboardData";
import { QRCodeSVG } from "qrcode.react";

const QR_LINKS = dashboardData.links.filter((l) => l.qrCodeUrl);

export default function QRCodesPage() {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = QR_LINKS.filter(
    (l) =>
      !search ||
      l.shortUrl.toLowerCase().includes(search.toLowerCase()) ||
      l.destination.toLowerCase().includes(search.toLowerCase())
  );

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(url);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <PageHeader
        title="QR Codes"
        description="Generate, customize, and download QR codes for all your short links."
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
            Generate QR
          </button>
        }
      />

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "QR-enabled links", value: QR_LINKS.length },
          { label: "Total scans", value: QR_LINKS.reduce((s, l) => s + l.stats.clicks, 0).toLocaleString() },
          {
            label: "Avg. CTR",
            value: `${(QR_LINKS.reduce((s, l) => s + l.stats.ctr, 0) / Math.max(QR_LINKS.length, 1)).toFixed(1)}%`,
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "var(--cloud)",
              border: "1px solid var(--border)",
              borderLeft: "3px solid var(--ocean-400)",
              padding: "16px 20px",
              boxShadow: "var(--shadow-xs)",
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 4 }}>
              {s.label}
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "var(--ink)", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
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
        }}
      >
        <div style={{ position: "relative", flex: 1, maxWidth: 340 }}>
          <Search
            size={13}
            style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search QR codes…"
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
        <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: "auto" }}>
          {filtered.length} QR code{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Grid */}
      <div
        style={{
          background: "var(--cloud)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-xs)",
          padding: 20,
        }}
      >
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
            <QrCode size={36} style={{ opacity: 0.2, margin: "0 auto 12px" }} />
            <div>No QR codes found</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 16 }}>
            {filtered.map((link) => {
              const key = `https://${link.shortUrl}`;
              return (
                <div
                  key={link.id}
                  style={{
                    border: `1px solid ${selected === link.id ? "var(--ocean-400)" : "var(--border)"}`,
                    background: selected === link.id ? "var(--ocean-50)" : "var(--sky-50)",
                    padding: 14,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onClick={() => setSelected(selected === link.id ? null : link.id)}
                >
                  <div
                    style={{
                      background: "#fff",
                      border: "1px solid var(--border)",
                      padding: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 12,
                      aspectRatio: "1",
                    }}
                  >
                    <QRCodeSVG value={key} size={130} fgColor="#071B2C" bgColor="#ffffff" level="M" />
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "var(--ocean-600)",
                      marginBottom: 3,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {link.shortUrl}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      marginBottom: 10,
                    }}
                  >
                    {link.destination}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCopy(key); }}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                        height: 28,
                        fontSize: 10,
                        fontWeight: 700,
                        background: "var(--sky-100)",
                        border: "1px solid var(--border)",
                        color: copied === key ? "var(--sage)" : "var(--text-muted)",
                        cursor: "pointer",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {copied === key ? <Check size={10} /> : <Copy size={10} />}
                      Copy
                    </button>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                        height: 28,
                        fontSize: 10,
                        fontWeight: 700,
                        background: "var(--ocean-500)",
                        border: "none",
                        color: "#fff",
                        cursor: "pointer",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      <Download size={10} />
                      Save
                    </button>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      marginTop: 10,
                      paddingTop: 10,
                      borderTop: "1px solid var(--border)",
                    }}
                  >
                    <div style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>
                        {link.stats.clicks.toLocaleString()}
                      </div>
                      <div style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        Scans
                      </div>
                    </div>
                    <div style={{ width: 1, background: "var(--border)" }} />
                    <div style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ocean-600)" }}>
                        {link.stats.ctr}%
                      </div>
                      <div style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        CTR
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Generate modal */}
      {showCreate && (
        <>
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(7,27,44,0.45)", zIndex: 200 }}
            onClick={() => setShowCreate(false)}
          />
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              width: 500,
              background: "var(--cloud)",
              border: "1px solid var(--border)",
              zIndex: 201,
              boxShadow: "var(--shadow-xl)",
            }}
          >
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)" }}>Generate QR code</h2>
              <button
                onClick={() => setShowCreate(false)}
                style={{ background: "none", border: "1px solid var(--border)", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <X size={14} />
              </button>
            </div>
            <div style={{ padding: 24, display: "flex", gap: 24 }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { label: "Select link", isSelect: true },
                  { label: "Foreground color", isColor: true, def: "#071B2C" },
                  { label: "Background color", isColor: true, def: "#ffffff" },
                  { label: "Error correction", isSelect2: true },
                ].map((f) => (
                  <div key={f.label}>
                    <label
                      style={{
                        display: "block",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "var(--text-secondary)",
                        marginBottom: 5,
                      }}
                    >
                      {f.label}
                    </label>
                    {f.isColor ? (
                      <input
                        type="color"
                        defaultValue={f.def}
                        style={{ width: "100%", height: 38, border: "1px solid var(--border)", cursor: "pointer", background: "var(--sky-100)", padding: 4 }}
                      />
                    ) : (
                      <select
                        style={{
                          width: "100%",
                          height: 38,
                          padding: "0 12px",
                          border: "1px solid var(--border)",
                          background: "var(--sky-100)",
                          fontFamily: "var(--font-body)",
                          fontSize: 13,
                          color: "var(--ink)",
                          outline: "none",
                        }}
                      >
                        {f.isSelect2
                          ? ["M — Medium (15%)", "L — Low (7%)", "Q — Quartile (25%)", "H — High (30%)"].map((o) => (
                              <option key={o}>{o}</option>
                            ))
                          : QR_LINKS.map((l) => <option key={l.id}>{l.shortUrl}</option>)}
                      </select>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <div style={{ background: "#fff", border: "1px solid var(--border)", padding: 10 }}>
                  <QRCodeSVG value="https://acme.ly/preview" size={120} fgColor="#071B2C" bgColor="#ffffff" level="M" />
                </div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Preview
                </div>
              </div>
            </div>
            <div style={{ padding: "0 24px 24px", display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowCreate(false)}
                style={{
                  flex: 1,
                  height: 40,
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
                Download SVG
              </button>
              <button
                onClick={() => setShowCreate(false)}
                style={{
                  height: 40,
                  padding: "0 18px",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-body)",
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
