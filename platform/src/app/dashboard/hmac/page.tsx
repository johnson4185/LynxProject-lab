"use client";

import { useState, useRef } from "react";
import {
  ShieldCheck, Plus, Copy, Check, ExternalLink, Clock,
  AlertTriangle, RefreshCw, Eye, EyeOff, Trash2, Lock,
  Key, X,
} from "lucide-react";
import PageHeader from "@/platform/components/PageHeader";
import Panel from "@/platform/components/Panel";
import Modal from "@/platform/components/Modal";
import Badge from "@/platform/components/Badge";
import StatCard from "@/platform/components/StatCard";

/* ─── Types (matching backend exactly) ──────────────────────────────────────
   POST /api/v1/hmac/generate  →  body: { finalUrl, expiryMinutes, oneTimeUse }
   GET  /api/hmac/go?token=…   →  follows the signed link
────────────────────────────────────────────────────────────────────────────── */
interface HmacToken {
  id: string;
  label: string;            // user-facing name (not sent to backend)
  finalUrl: string;         // POST body: finalUrl
  expiryMinutes: number;    // POST body: expiryMinutes
  oneTimeUse: boolean;      // POST body: oneTimeUse
  token: string;            // returned by backend → embedded in /api/hmac/go?token=…
  createdAt: string;        // ISO 8601
  expiresAt: string;        // computed: createdAt + expiryMinutes
  used: boolean;            // true after one-time link is followed
  revoked: boolean;
}

/* ─── Mock data — replace with real tokens from backend ─────────────────── */
const now = Date.now();
const INITIAL_TOKENS: HmacToken[] = [
  {
    id: "t1", label: "DCF landing page — one-time",
    finalUrl: "https://dcf.sa", expiryMinutes: 60, oneTimeUse: true,
    token: "eyJ0aWQiOiJtaW5kaXZyYSIsImtpZCI6ImtpZC0yMDI2LTAyIiwianRpIjoiMDAzN2EwMTAwMWRjNDUyMmFlMWQ2ZjY4OWU2ZjdlMWMiLCJleHAiOjE3NzEwNjIyMjgsInVybCI6Imh0dHBzOi8vZGNmLnNhIiwib3R1Ijp0cnVlfQ.WkotMF1N3-HTeXzskhQGtETocc3oa8gJZcLTcVCkLNI",
    createdAt: new Date(now - 10 * 60 * 1000).toISOString(),
    expiresAt: new Date(now + 50 * 60 * 1000).toISOString(),
    used: false, revoked: false,
  },
  {
    id: "t2", label: "Google redirect — 10 min",
    finalUrl: "https://google.com", expiryMinutes: 10, oneTimeUse: false,
    token: "eyJ0aWQiOiJtaW5kaXZyYSIsImtpZCI6ImtpZC0yMDI2LTAyIiwianRpIjoiYWJjMTIzIiwiZXhwIjoxNzcxMDYyMjI4LCJ1cmwiOiJodHRwczovL2dvb2dsZS5jb20iLCJvdHUiOmZhbHNlfQ.FAKE_SIG_002",
    createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(now - 1 * 60 * 60 * 1000).toISOString(), // expired
    used: false, revoked: false,
  },
  {
    id: "t3", label: "Example — one-time used",
    finalUrl: "https://example.com", expiryMinutes: 30, oneTimeUse: true,
    token: "eyJ0aWQiOiJtaW5kaXZyYSIsImtpZCI6ImtpZC0yMDI2LTAyIiwianRpIjoiZGVmNDU2IiwiZXhwIjoxNzcxMDYyMjI4LCJ1cmwiOiJodHRwczovL2V4YW1wbGUuY29tIiwib3R1Ijp0cnVlfQ.FAKE_SIG_003",
    createdAt: new Date(now - 45 * 60 * 1000).toISOString(),
    expiresAt: new Date(now + 15 * 60 * 1000).toISOString(),
    used: true, revoked: false,
  },
];

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const HMAC_BASE = "http://localhost:5055/api/hmac/go?token=";

function getStatus(t: HmacToken): "active" | "used" | "expired" | "revoked" {
  if (t.revoked) return "revoked";
  if (t.used) return "used";
  if (new Date(t.expiresAt).getTime() < Date.now()) return "expired";
  return "active";
}

function statusBadge(s: ReturnType<typeof getStatus>) {
  const map: Record<string, "success" | "muted" | "warning" | "danger"> = {
    active: "success", used: "muted", expired: "warning", revoked: "danger",
  };
  return <Badge variant={map[s]}>{s.charAt(0).toUpperCase() + s.slice(1)}</Badge>;
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function minutesLabel(m: number) {
  if (m < 60) return `${m} min`;
  if (m < 1440) return `${m / 60} hr`;
  return `${Math.round(m / 1440)} day${Math.round(m / 1440) > 1 ? "s" : ""}`;
}

const inputSx: React.CSSProperties = {
  width: "100%", height: 38, padding: "0 12px",
  border: "1px solid var(--border)", background: "var(--sky-100)",
  fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink)", outline: "none",
};
function iFocus(e: React.FocusEvent<HTMLElement>) { (e.target as HTMLElement).style.borderColor = "var(--ocean-500)"; }
function iBlur(e: React.FocusEvent<HTMLElement>) { (e.target as HTMLElement).style.borderColor = "var(--border)"; }

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 5 }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3, margin: 0 }}>{hint}</p>}
    </div>
  );
}

/* ─── Token row ──────────────────────────────────────────────────────────── */
function TokenRow({
  token, onCopy, onRevoke, onDelete, copied,
}: {
  token: HmacToken;
  onCopy: (text: string, id: string) => void;
  onRevoke: (id: string) => void;
  onDelete: (id: string) => void;
  copied: string | null;
}) {
  const [showToken, setShowToken] = useState(false);
  const status = getStatus(token);
  const fullUrl = `${HMAC_BASE}${token.token}`;
  const isActive = status === "active";

  return (
    <div style={{
      border: "1px solid var(--border)",
      borderLeft: `3px solid ${status === "active" ? "var(--ocean-400)" : status === "revoked" ? "#f87171" : "var(--sky-200)"}`,
      background: "var(--cloud)",
      padding: "16px 18px",
      opacity: isActive ? 1 : 0.75,
    }}>
      {/* Row 1: label + badges + actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)", flex: 1 }}>{token.label || "Untitled token"}</span>
        {statusBadge(status)}
        {token.oneTimeUse && <Badge variant="default"><Lock size={9} style={{ marginRight: 3 }} />One-time</Badge>}
        <Badge variant="muted">{minutesLabel(token.expiryMinutes)} expiry</Badge>
      </div>

      {/* Row 2: destination URL */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <ExternalLink size={12} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: "var(--text-secondary)", wordBreak: "break-all" }}>{token.finalUrl}</span>
      </div>

      {/* Row 3: token display */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        background: "var(--sky-100)", border: "1px solid var(--border)",
        padding: "6px 10px", marginBottom: 10,
      }}>
        <Key size={12} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
        <code style={{
          fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--ocean-700)",
          flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {showToken ? token.token : `${token.token.slice(0, 40)}…`}
        </code>
        <button onClick={() => setShowToken((v) => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
          {showToken ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
      </div>

      {/* Row 4: meta + action buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-muted)" }}>
          <Clock size={11} /> Created {fmtTime(token.createdAt)}
        </div>
        <div style={{ fontSize: 11, color: status === "expired" || status === "revoked" ? "#f87171" : "var(--text-muted)" }}>
          Expires {fmtTime(token.expiresAt)}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {/* Copy go-link */}
          <button
            onClick={() => onCopy(fullUrl, token.id)}
            title="Copy redirect URL"
            style={{ display: "flex", alignItems: "center", gap: 5, height: 30, padding: "0 10px", background: isActive ? "var(--ocean-50)" : "var(--sky-100)", border: "1px solid var(--border)", color: isActive ? "var(--ocean-700)" : "var(--text-muted)", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}
          >
            {copied === token.id ? <Check size={12} /> : <Copy size={12} />}
            {copied === token.id ? "Copied" : "Copy URL"}
          </button>

          {/* Copy raw token */}
          <button
            onClick={() => onCopy(token.token, `raw_${token.id}`)}
            title="Copy raw token"
            style={{ display: "flex", alignItems: "center", gap: 5, height: 30, padding: "0 10px", background: "var(--sky-100)", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}
          >
            {copied === `raw_${token.id}` ? <Check size={12} /> : <Key size={12} />}
            Token
          </button>

          {/* Revoke */}
          {isActive && (
            <button onClick={() => onRevoke(token.id)} title="Revoke token"
              style={{ display: "flex", alignItems: "center", gap: 5, height: 30, padding: "0 10px", background: "var(--sky-100)", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}
            >
              <X size={12} /> Revoke
            </button>
          )}

          {/* Delete */}
          <button onClick={() => onDelete(token.id)} title="Delete"
            style={{ display: "flex", alignItems: "center", height: 30, padding: "0 8px", background: "none", border: "1px solid var(--border)", color: "#f87171", cursor: "pointer" }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   PAGE COMPONENT
══════════════════════════════════════════════════════════════════════════ */
export default function HmacPage() {
  const [tokens, setTokens] = useState<HmacToken[]>(INITIAL_TOKENS);
  const [showCreate, setShowCreate] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Form */
  const [form, setForm] = useState({
    label: "",
    finalUrl: "",
    expiryMinutes: 60,
    oneTimeUse: false,
  });

  const EXPIRY_PRESETS = [
    { label: "5 min",  value: 5 },
    { label: "10 min", value: 10 },
    { label: "30 min", value: 30 },
    { label: "1 hr",   value: 60 },
    { label: "24 hr",  value: 1440 },
    { label: "Custom", value: -1 },
  ];
  const [expiryPreset, setExpiryPreset] = useState(60);
  const [customExpiry, setCustomExpiry] = useState("");

  function resolveExpiry() {
    return expiryPreset === -1 ? (parseInt(customExpiry, 10) || 60) : expiryPreset;
  }

  /* Stats */
  const active   = tokens.filter((t) => getStatus(t) === "active").length;
  const oneTime  = tokens.filter((t) => t.oneTimeUse).length;
  const expired  = tokens.filter((t) => getStatus(t) === "expired" || getStatus(t) === "revoked").length;

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(id);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(null), 2000);
  }

  function handleRevoke(id: string) {
    setTokens((prev) => prev.map((t) => t.id === id ? { ...t, revoked: true } : t));
  }

  function handleDelete(id: string) {
    setTokens((prev) => prev.filter((t) => t.id !== id));
  }

  function handleGenerate() {
    const minutes = resolveExpiry();
    const now = new Date();
    const payload = {
      tid: "mindivra",
      kid: "kid-2026-04",
      jti: Math.random().toString(36).slice(2),
      exp: Math.floor(now.getTime() / 1000) + minutes * 60,
      url: form.finalUrl,
      otu: form.oneTimeUse,
    };
    const fakeToken = `${btoa(JSON.stringify(payload)).replace(/=/g, "")}.PREVIEW_SIGNATURE`;

    const newToken: HmacToken = {
      id: `t${Date.now()}`,
      label: form.label || form.finalUrl,
      finalUrl: form.finalUrl,
      expiryMinutes: minutes,
      oneTimeUse: form.oneTimeUse,
      token: fakeToken,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + minutes * 60 * 1000).toISOString(),
      used: false,
      revoked: false,
    };
    setTokens((prev) => [newToken, ...prev]);
    setShowCreate(false);
    setForm({ label: "", finalUrl: "", expiryMinutes: 60, oneTimeUse: false });
    setExpiryPreset(60);
    setCustomExpiry("");
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <PageHeader
        title="HMAC Secure Links"
        description="Generate cryptographically signed, expiring redirect tokens. Supports one-time use and key rotation."
        breadcrumb="Platform"
        action={
          <button onClick={() => setShowCreate(true)} style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            background: "var(--ocean-500)", color: "#fff", border: "none",
            padding: "0 18px", height: 38, fontWeight: 700, fontSize: 12,
            letterSpacing: "0.06em", textTransform: "uppercase",
            cursor: "pointer", fontFamily: "var(--font-body)",
          }}>
            <Plus size={14} /> Generate token
          </button>
        }
      />

      {/* ── How it works ──────────────────────────────────────────────── */}
      <div style={{
        display: "flex", gap: 10, alignItems: "flex-start",
        background: "var(--ocean-50)", border: "1px solid var(--ocean-200)",
        borderLeft: "3px solid var(--ocean-500)", padding: "14px 16px",
        marginBottom: 20, fontSize: 13, color: "var(--ocean-800)",
      }}>
        <ShieldCheck size={16} style={{ color: "var(--ocean-500)", flexShrink: 0, marginTop: 1 }} />
        <div>
          <strong>How HMAC secure links work:</strong> The backend signs a JWT payload containing your destination URL,
          expiry, tenant ID, and one-time-use flag using HMAC-SHA256.
          The signed token is embedded in <code style={{ fontSize: 11 }}>/api/hmac/go?token=…</code>.
          The backend verifies the signature and enforces expiry and OTU rules on every redirect.
          Rotating the signing key (kid) instantly invalidates all previously issued tokens for that key.
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total tokens",      value: tokens.length, icon: <Key size={18} /> },
          { label: "Active",            value: active,        icon: <ShieldCheck size={18} /> },
          { label: "One-time use",      value: oneTime,       icon: <Lock size={18} /> },
          { label: "Expired / revoked", value: expired,       icon: <AlertTriangle size={18} /> },
        ].map((s) => (
          <StatCard key={s.label} micro label={s.label} value={s.value} icon={s.icon} />
        ))}
      </div>

      {/* ── Backend API reference ─────────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
      <Panel title="Backend API" subtitle="Endpoints used by this page">
        <div style={{ display: "grid", gap: 8 }}>
          {[
            { method: "POST", path: "/api/v1/hmac/generate", body: '{ "finalUrl", "expiryMinutes", "oneTimeUse" }', note: "Generate signed token" },
            { method: "GET",  path: "/api/hmac/go?token=…",  body: "—", note: "Follow / validate token → redirect to finalUrl" },
            { method: "POST", path: "/api/v1/links/:code/revoke", body: "—", note: "Revoke a token before expiry" },
          ].map((r) => (
            <div key={r.path} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "var(--sky-100)", border: "1px solid var(--border)", fontSize: 12 }}>
              <span style={{
                fontSize: 10, fontWeight: 800, padding: "2px 7px", letterSpacing: "0.07em",
                background: r.method === "POST" ? "var(--ocean-500)" : "#16a34a", color: "#fff",
                flexShrink: 0,
              }}>{r.method}</span>
              <code style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ocean-700)", flex: 1 }}>{r.path}</code>
              <span style={{ color: "var(--text-muted)", fontSize: 11, flexShrink: 0 }}>{r.note}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 14, padding: "10px 14px", background: "var(--sky-100)", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 6 }}>
            Token payload structure (JWT claims)
          </div>
          <pre style={{ margin: 0, fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--ocean-700)", lineHeight: 1.7 }}>{`{
  "tid": "mindivra",        // tenant ID
  "kid": "kid-2026-02",    // signing key ID (for rotation)
  "jti": "uuid-v4",        // unique token ID
  "exp": 1771062228,       // Unix timestamp expiry
  "url": "https://...",    // finalUrl
  "otu": true              // oneTimeUse flag
}`}</pre>
        </div>
      </Panel>
      </div>

      {/* ── Token list ────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 8, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>
        {tokens.length} token{tokens.length !== 1 ? "s" : ""}
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        {tokens.map((t) => (
          <TokenRow key={t.id} token={t} onCopy={handleCopy} onRevoke={handleRevoke} onDelete={handleDelete} copied={copied} />
        ))}
        {tokens.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)", fontSize: 14, border: "2px dashed var(--border)" }}>
            No tokens yet. Generate your first secure link above.
          </div>
        )}
      </div>

      {/* ── Generate modal ────────────────────────────────────────────── */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Generate HMAC secure token" width={500}>
        <div style={{ marginBottom: 16, padding: "10px 12px", background: "var(--sky-100)", border: "1px solid var(--border)", fontSize: 12, color: "var(--text-secondary)", display: "flex", gap: 8 }}>
          <ShieldCheck size={14} style={{ color: "var(--ocean-500)", flexShrink: 0, marginTop: 1 }} />
          Maps to <code style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>POST /api/v1/hmac/generate</code> with header <code style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>X-Tenant-Id</code>
        </div>

        <Field label="Label (internal only)">
          <input style={inputSx} value={form.label} placeholder="e.g. DCF landing page — invite"
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            onFocus={iFocus} onBlur={iBlur} />
        </Field>

        <Field label="Destination URL *">
          <input style={inputSx} value={form.finalUrl} placeholder="https://example.com/landing"
            onChange={(e) => setForm((f) => ({ ...f, finalUrl: e.target.value }))}
            onFocus={iFocus} onBlur={iBlur} />
        </Field>

        <Field label="Expiry">
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: expiryPreset === -1 ? 8 : 0 }}>
            {EXPIRY_PRESETS.map((p) => (
              <button key={p.value} onClick={() => setExpiryPreset(p.value)} style={{
                height: 32, padding: "0 12px", fontSize: 12, fontWeight: 700,
                background: expiryPreset === p.value ? "var(--ocean-500)" : "var(--sky-100)",
                color: expiryPreset === p.value ? "#fff" : "var(--text-secondary)",
                border: `1px solid ${expiryPreset === p.value ? "var(--ocean-500)" : "var(--border)"}`,
                cursor: "pointer", fontFamily: "var(--font-body)",
              }}>{p.label}</button>
            ))}
          </div>
          {expiryPreset === -1 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
              <input type="number" min={1} style={{ ...inputSx, width: 100 }} value={customExpiry}
                placeholder="60" onChange={(e) => setCustomExpiry(e.target.value)}
                onFocus={iFocus} onBlur={iBlur} />
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>minutes</span>
            </div>
          )}
        </Field>

        <Field label="One-time use" hint="After the first successful redirect, the token is permanently invalidated. Sent as oneTimeUse in POST body.">
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <div
              onClick={() => setForm((f) => ({ ...f, oneTimeUse: !f.oneTimeUse }))}
              style={{
                width: 40, height: 22, background: form.oneTimeUse ? "var(--ocean-500)" : "var(--sky-200)",
                position: "relative", cursor: "pointer", transition: "background 0.18s", flexShrink: 0,
              }}
            >
              <div style={{
                position: "absolute", top: 3, left: form.oneTimeUse ? 21 : 3,
                width: 16, height: 16, background: "#fff",
                transition: "left 0.18s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }} />
            </div>
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              {form.oneTimeUse ? "Enabled — single use only" : "Disabled — reusable until expiry"}
            </span>
          </label>
        </Field>

        {/* Preview */}
        {form.finalUrl && (
          <div style={{ marginTop: 4, marginBottom: 16, padding: "10px 12px", background: "var(--sky-100)", border: "1px solid var(--border)", fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--ocean-700)" }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 4, fontFamily: "var(--font-body)" }}>POST body preview</div>
            {`{ "finalUrl": "${form.finalUrl}", "expiryMinutes": ${resolveExpiry()}, "oneTimeUse": ${form.oneTimeUse} }`}
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleGenerate} disabled={!form.finalUrl.trim()} style={{
            flex: 1, height: 40,
            background: form.finalUrl.trim() ? "var(--ocean-500)" : "var(--sky-200)",
            color: form.finalUrl.trim() ? "#fff" : "var(--text-muted)",
            border: "none", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 12,
            letterSpacing: "0.06em", textTransform: "uppercase",
            cursor: form.finalUrl.trim() ? "pointer" : "not-allowed",
          }}>
            <ShieldCheck size={13} style={{ marginRight: 6, verticalAlign: "middle" }} />
            Generate token
          </button>
          <button onClick={() => setShowCreate(false)} style={{
            height: 40, padding: "0 18px", background: "transparent",
            border: "1px solid var(--border)", color: "var(--text-muted)",
            fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12, cursor: "pointer",
          }}>Cancel</button>
        </div>
      </Modal>
    </div>
  );
}
