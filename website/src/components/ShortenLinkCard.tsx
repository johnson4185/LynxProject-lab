"use client";

import { useState, useRef, useCallback } from "react";
import {
  Link2,
  QrCode,
  Send,
  Globe,
  Pencil,
  Copy,
  Check,
  ExternalLink,
  Share2,
  Download,
  Lock,
  ChevronDown,
  Sparkles,
  Loader2,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

type Tab = "shorten" | "qr";

type DomainOption = { value: string; label: string; locked?: boolean };
const DOMAIN_OPTIONS: DomainOption[] = [
  { value: "urlify.com", label: "urlify.com" },
  { value: "custom-domain", label: "Custom domain (Paid)", locked: true },
];

const CARD_PADDING = 28;
const SECTION_GAP = 22;
const LABEL_GAP = 8;
const INPUT_HEIGHT = 48;

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: 14,
  fontWeight: 600,
  color: "var(--ink)",
  display: "flex",
  alignItems: "center",
  gap: LABEL_GAP,
  marginBottom: 8,
};

const inputBaseStyle: React.CSSProperties = {
  width: "100%",
  height: INPUT_HEIGHT,
  padding: "0 16px",
  background: "var(--cloud)",
  border: "1.5px solid var(--border)",
  fontSize: 15,
  color: "var(--ink)",
  fontFamily: "var(--font-body)",
  boxSizing: "border-box",
};

const primaryButtonStyle: React.CSSProperties = {
  width: "100%",
  height: 54,
  background: "var(--ocean-500)",
  color: "white",
  border: "none",
  fontFamily: "var(--font-body)",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

export default function ShortenLinkCard() {
  const [tab, setTab] = useState<Tab>("shorten");
  const [longUrl, setLongUrl] = useState("");
  const [domain, setDomain] = useState(DOMAIN_OPTIONS[0].label);
  const [alias, setAlias] = useState("");
  const [shortened, setShortened] = useState(false);
  const [shortUrl, setShortUrl] = useState("");
  const [destUrl, setDestUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [qrGenerated, setQrGenerated] = useState(false);
  const [domainOpen, setDomainOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const qrCanvasRef = useRef<HTMLDivElement>(null);

  const shortenUrl = useCallback(async (url: string): Promise<string> => {
    const res = await fetch(
      `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`
    );
    if (!res.ok) throw new Error("Shorten failed");
    return res.text();
  }, []);

  const handleShorten = async () => {
    const url = longUrl.trim();
    if (!url) return;
    setError("");
    setLoading(true);
    try {
      const short = await shortenUrl(url);
      setShortUrl(short);
      setDestUrl(url);
      setShortened(true);
    } catch {
      setError("Using demo link (API unavailable).");
      setShortUrl(
        `https://tinyurl.com/demo-${Date.now().toString(36)}`
      );
      setDestUrl(url);
      setShortened(true);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQr = async () => {
    const url = longUrl.trim();
    if (!url) return;
    setError("");
    setLoading(true);
    try {
      const short = await shortenUrl(url);
      setShortUrl(short);
      setDestUrl(url);
      setQrGenerated(true);
    } catch {
      setError("Using demo link (API unavailable).");
      setShortUrl(
        `https://tinyurl.com/demo-${Date.now().toString(36)}`
      );
      setDestUrl(url);
      setQrGenerated(true);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = useCallback((text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  const visitUrl = (url: string) => {
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const shareUrl = (url: string) => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ url, title: "Short link" }).catch(() => {});
    } else {
      copyToClipboard(url);
    }
  };

  const downloadQrPng = () => {
    const canvas = qrCanvasRef.current?.querySelector("canvas");
    if (!canvas || !shortUrl) return;
    const a = document.createElement("a");
    a.download = "qrcode.png";
    a.href = canvas.toDataURL("image/png");
    a.click();
  };

  const downloadQrSvg = async () => {
    if (!shortUrl) return;
    try {
      const qr = await import("qrcode");
      const svg = await qr.toString(shortUrl, { type: "svg", margin: 2 });
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const a = document.createElement("a");
      a.download = "qrcode.svg";
      a.href = URL.createObjectURL(blob);
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      downloadQrPng();
    }
  };

  const displayShortUrl = shortUrl || "";
  const displayDestUrl = destUrl || "";

  return (
    <div
      style={{
        background: "var(--cloud)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-xl)",
        overflow: "hidden",
        width: "100%",
        maxWidth: 620,
        marginLeft: "auto",
      }}
    >
      {/* Tabs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          borderBottom: "1px solid var(--border)",
          background: "var(--sky-50)",
        }}
      >
        <button
          type="button"
          onClick={() => setTab("shorten")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "16px 20px",
            border: "none",
            background: tab === "shorten" ? "var(--cloud)" : "transparent",
            color: tab === "shorten" ? "var(--ink)" : "var(--ink-mid)",
            fontFamily: "var(--font-body)",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            borderBottom:
              tab === "shorten"
                ? "2px solid var(--ocean-500)"
                : "2px solid transparent",
            transition: "background 0.2s, color 0.2s",
          }}
        >
          <Link2 size={16} />
          Shorten a Link
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("qr");
            setQrGenerated(false);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "16px 20px",
            border: "none",
            background: tab === "qr" ? "var(--cloud)" : "transparent",
            color: tab === "qr" ? "var(--ink)" : "var(--ink-mid)",
            fontFamily: "var(--font-body)",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            borderBottom:
              tab === "qr"
                ? "2px solid var(--ocean-500)"
                : "2px solid transparent",
            transition: "background 0.2s, color 0.2s",
          }}
        >
          <QrCode size={16} />
          Generate QR Code
        </button>
      </div>

      <div style={{ padding: CARD_PADDING }}>
        {error && (
          <div
            style={{
              marginBottom: SECTION_GAP,
              padding: "10px 12px",
              background: "rgba(232, 97, 78, 0.1)",
              border: "1px solid var(--coral)",
              fontSize: 13,
              color: "var(--coral)",
            }}
          >
            {error}
          </div>
        )}

        {tab === "shorten" && (
          <>
            {!shortened ? (
              <>
                <div style={{ marginBottom: SECTION_GAP }}>
                  <label style={labelStyle}>
                    <Send size={14} style={{ color: "var(--ink-soft)" }} />
                    Destination link *
                  </label>
                  <input
                    type="url"
                    value={longUrl}
                    onChange={(e) => {
                      setLongUrl(e.target.value);
                      setError("");
                    }}
                    placeholder="https://example.com/page"
                    style={{ ...inputBaseStyle, marginBottom: 0 }}
                    disabled={loading}
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 16px 1fr",
                    gap: 14,
                    alignItems: "end",
                    marginBottom: SECTION_GAP,
                  }}
                >
                  <div style={{ position: "relative", minWidth: 0 }}>
                    <label style={labelStyle}>
                      <Globe size={14} style={{ color: "var(--ink-soft)" }} />
                      Domain
                    </label>
                    <button
                      type="button"
                      onClick={() => setDomainOpen(!domainOpen)}
                      disabled={loading}
                      style={{
                        ...inputBaseStyle,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {domain}
                      </span>
                      <ChevronDown
                        size={16}
                        style={{
                          color: "var(--ink-soft)",
                          flexShrink: 0,
                          marginLeft: 8,
                        }}
                      />
                    </button>
                    {domainOpen && (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          marginTop: 4,
                          background: "var(--cloud)",
                          border: "1px solid var(--border)",
                          boxShadow: "var(--shadow-md)",
                          zIndex: 10,
                        }}
                      >
                        {DOMAIN_OPTIONS.map((d) => (
                          <button
                            key={d.value}
                            type="button"
                            onClick={() => {
                              if (d.locked) return;
                              setDomain(d.label);
                              setDomainOpen(false);
                            }}
                            style={{
                              width: "100%",
                              padding: "12px 14px",
                              border: "none",
                              background: d.locked ? "rgba(39,114,160,0.06)" : "none",
                              fontFamily: "var(--font-body)",
                              fontSize: 14,
                              color: d.locked ? "var(--ink-soft)" : "var(--ink)",
                              textAlign: "left",
                              cursor: d.locked ? "not-allowed" : "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <span>{d.label}</span>
                            {d.locked ? <Lock size={14} /> : null}
                          </button>
                        ))}
                        <div
                          style={{
                            width: "100%",
                            padding: "10px 14px",
                            borderTop: "1px solid var(--border)",
                            fontFamily: "var(--font-body)",
                            fontSize: 12,
                            color: "var(--ink-soft)",
                          }}
                        >
                          Custom domain is available on paid plans
                        </div>
                      </div>
                    )}
                  </div>
                  <span
                    style={{
                      paddingBottom: 11,
                      color: "var(--ink-soft)",
                      fontSize: 18,
                      alignSelf: "end",
                    }}
                  >
                    /
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <label style={labelStyle}>
                      <Pencil
                        size={14}
                        style={{ color: "var(--ink-soft)" }}
                      />
                      Custom slug (optional)
                    </label>
                    <input
                      type="text"
                      value={alias}
                      onChange={(e) => setAlias(e.target.value)}
                      placeholder="my-link"
                      style={inputBaseStyle}
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleShorten}
                  disabled={loading}
                  style={primaryButtonStyle}
                >
                  {loading ? (
                    <Loader2
                      size={18}
                      style={{ animation: "spin 0.8s linear infinite" }}
                    />
                  ) : null}
                  {loading ? "Shortening..." : "Shorten Link"}
                </button>
              </>
            ) : (
              <>
                <div style={{ marginBottom: SECTION_GAP }}>
                  <label style={labelStyle}>
                    <Sparkles
                      size={14}
                      style={{ color: "var(--ink-soft)" }}
                    />
                    Your short link
                  </label>
                  <div
                    style={{
                      ...inputBaseStyle,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      borderColor: "var(--ocean-500)",
                    }}
                  >
                    <span
                      style={{
                        flex: 1,
                        minWidth: 0,
                        color: "var(--ocean-600)",
                        fontFamily: "var(--font-mono)",
                        fontSize: 13,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {displayShortUrl}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(displayShortUrl)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--ink-mid)",
                        padding: 4,
                        flexShrink: 0,
                      }}
                    >
                      {copied ? (
                        <Check size={18} />
                      ) : (
                        <Copy size={18} />
                      )}
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    marginBottom: SECTION_GAP,
                  }}
                >
                  {[
                    {
                      label: "Visit URL",
                      icon: ExternalLink,
                      onClick: () => visitUrl(displayShortUrl),
                    },
                    {
                      label: "QR",
                      icon: QrCode,
                      onClick: () => setTab("qr"),
                    },
                    {
                      label: "Share",
                      icon: Share2,
                      onClick: () => shareUrl(displayShortUrl),
                    },
                    {
                      label: "Copy",
                      icon: Copy,
                      onClick: () => copyToClipboard(displayShortUrl),
                    },
                  ].map(({ label, icon: Icon, onClick }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={onClick}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "10px 14px",
                        background: "var(--ocean-600)",
                        color: "white",
                        border: "none",
                        fontFamily: "var(--font-body)",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      <Icon size={14} />
                      {label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShortened(false);
                    setLongUrl("");
                    setShortUrl("");
                    setDestUrl("");
                  }}
                  style={primaryButtonStyle}
                >
                  Shorten Another Link
                </button>
              </>
            )}
          </>
        )}

        {tab === "qr" && (
          <>
            {!qrGenerated ? (
              <>
                <div style={{ marginBottom: SECTION_GAP }}>
                  <label style={labelStyle}>
                    <Send size={14} style={{ color: "var(--ink-soft)" }} />
                    Link to turn into QR *
                  </label>
                  <input
                    type="url"
                    value={longUrl}
                    onChange={(e) => {
                      setLongUrl(e.target.value);
                      setError("");
                    }}
                    placeholder="https://example.com/page"
                    style={{ ...inputBaseStyle, marginBottom: 0 }}
                    disabled={loading}
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 16px 1fr",
                    gap: 14,
                    alignItems: "end",
                    marginBottom: SECTION_GAP,
                  }}
                >
                  <div style={{ position: "relative", minWidth: 0 }}>
                    <label style={labelStyle}>
                      <Globe size={14} style={{ color: "var(--ink-soft)" }} />
                      Domain
                    </label>
                    <button
                      type="button"
                      onClick={() => setDomainOpen(!domainOpen)}
                      disabled={loading}
                      style={{
                        ...inputBaseStyle,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {domain}
                      </span>
                      <ChevronDown
                        size={16}
                        style={{
                          color: "var(--ink-soft)",
                          flexShrink: 0,
                          marginLeft: 8,
                        }}
                      />
                    </button>
                    {domainOpen && (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          marginTop: 4,
                          background: "var(--cloud)",
                          border: "1px solid var(--border)",
                          boxShadow: "var(--shadow-md)",
                          zIndex: 10,
                        }}
                      >
                        {DOMAIN_OPTIONS.map((d) => (
                          <button
                            key={d.value}
                            type="button"
                            onClick={() => {
                              if (d.locked) return;
                              setDomain(d.label);
                              setDomainOpen(false);
                            }}
                            style={{
                              width: "100%",
                              padding: "12px 14px",
                              border: "none",
                              background: d.locked ? "rgba(39,114,160,0.06)" : "none",
                              fontFamily: "var(--font-body)",
                              fontSize: 14,
                              color: d.locked ? "var(--ink-soft)" : "var(--ink)",
                              textAlign: "left",
                              cursor: d.locked ? "not-allowed" : "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <span>{d.label}</span>
                            {d.locked ? <Lock size={14} /> : null}
                          </button>
                        ))}
                        <div
                          style={{
                            width: "100%",
                            padding: "10px 14px",
                            borderTop: "1px solid var(--border)",
                            fontFamily: "var(--font-body)",
                            fontSize: 12,
                            color: "var(--ink-soft)",
                          }}
                        >
                          Custom domain is available on paid plans
                        </div>
                      </div>
                    )}
                  </div>
                  <span
                    style={{
                      paddingBottom: 11,
                      color: "var(--ink-soft)",
                      fontSize: 18,
                      alignSelf: "end",
                    }}
                  >
                    /
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <label style={labelStyle}>
                      <Pencil
                        size={14}
                        style={{ color: "var(--ink-soft)" }}
                      />
                      Custom slug (optional)
                    </label>
                    <input
                      type="text"
                      value={alias}
                      onChange={(e) => setAlias(e.target.value)}
                      placeholder="my-link"
                      style={inputBaseStyle}
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateQr}
                  disabled={loading}
                  style={primaryButtonStyle}
                >
                  {loading ? (
                    <Loader2
                      size={18}
                      style={{ animation: "spin 0.8s linear infinite" }}
                    />
                  ) : null}
                  {loading ? "Generating..." : "Generate QR Code"}
                </button>
              </>
            ) : (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr",
                    gap: SECTION_GAP,
                    alignItems: "start",
                    marginBottom: SECTION_GAP,
                  }}
                >
                  <div
                    ref={qrCanvasRef}
                    style={{
                      width: 128,
                      height: 128,
                      background: "var(--cloud)",
                      border: "1px solid var(--border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 8,
                      boxSizing: "border-box",
                    }}
                  >
                    {displayShortUrl ? (
                      <QRCodeCanvas
                        value={displayShortUrl}
                        size={112}
                        level="M"
                        includeMargin={false}
                        style={{ width: 112, height: 112 }}
                      />
                    ) : null}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                      minWidth: 0,
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "var(--ink)",
                        margin: 0,
                      }}
                    >
                      Download your QR code
                    </p>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <button
                        type="button"
                        onClick={downloadQrSvg}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          padding: "10px 14px",
                          background: "var(--ocean-500)",
                          color: "white",
                          border: "none",
                          fontFamily: "var(--font-body)",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        <Download size={16} />
                        Download SVG
                      </button>
                      <button
                        type="button"
                        onClick={downloadQrPng}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          padding: "10px 14px",
                          background: "var(--ocean-500)",
                          color: "white",
                          border: "none",
                          fontFamily: "var(--font-body)",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        <Download size={16} />
                        Download PNG
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: SECTION_GAP }}>
                  <label style={labelStyle}>
                    <Send size={14} style={{ color: "var(--ink-soft)" }} />
                    Target URL
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={displayDestUrl}
                    style={{
                      ...inputBaseStyle,
                      color: "var(--ink-soft)",
                      cursor: "default",
                    }}
                  />
                </div>
                <div style={{ marginBottom: SECTION_GAP }}>
                  <label style={labelStyle}>
                    <Sparkles
                      size={14}
                      style={{ color: "var(--ink-soft)" }}
                    />
                    Short link
                  </label>
                  <div
                    style={{
                      ...inputBaseStyle,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      borderColor: "var(--ocean-500)",
                    }}
                  >
                    <span
                      style={{
                        flex: 1,
                        minWidth: 0,
                        color: "var(--ocean-600)",
                        fontFamily: "var(--font-mono)",
                        fontSize: 13,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {displayShortUrl}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(displayShortUrl)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--ink-mid)",
                        padding: 4,
                        flexShrink: 0,
                      }}
                    >
                      {copied ? (
                        <Check size={18} />
                      ) : (
                        <Copy size={18} />
                      )}
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setQrGenerated(false);
                    setLongUrl("");
                    setShortUrl("");
                    setDestUrl("");
                  }}
                  style={primaryButtonStyle}
                >
                  Generate Another
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
