"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Copy, Check, RefreshCw, Eye, EyeOff, Save, Plus, Trash2,
  Key, AlertTriangle, X, Clock, Code2, Play, RotateCcw,
  ChevronDown, ChevronUp, Shield, ShieldCheck, Globe,
  Smartphone, Monitor, Search, Download,
  Link2, Megaphone, Settings as SettingsIcon,
  Webhook, Users as UsersIcon,
} from "lucide-react";
import PageHeader from "@/platform/components/PageHeader";
import Panel from "@/platform/components/Panel";
import Modal from "@/platform/components/Modal";
import { api } from "@/platform/lib/api";

/* ─── Tabs ───────────────────────────────────────────────────────────────── */
const TABS = [
  "Workspace", "Profile", "API Keys", "Webhooks",
  "Audit Log", "Security", "Notifications", "Danger zone",
] as const;
type Tab = (typeof TABS)[number];

/* ─── Shared input style ─────────────────────────────────────────────────── */
const inputStyle: React.CSSProperties = {
  width: "100%", height: 40, padding: "0 12px",
  border: "1px solid var(--border)", background: "var(--sky-100)",
  fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink)", outline: "none",
};

function focusInput(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = "var(--ocean-500)";
}
function blurInput(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = "var(--border)";
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

function SaveBtn({ label = "Save changes" }: { label?: string }) {
  return (
    <button style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 40, padding: "0 20px", background: "var(--ocean-500)", color: "#fff", border: "none", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer" }}>
      <Save size={13} />
      {label}
    </button>
  );
}

/* ─── API Keys data ──────────────────────────────────────────────────────── */
const INITIAL_KEYS = [
  { id: "k1", name: "Production API",       key: "urlify_live_sk_4xNpQ8mVKzR2hTbYdCjWnAeGfL3sXuoI", created: "2025-11-15", lastUsed: "2m ago",  permissions: ["read","write","delete"], status: "active" as const,   requests: 24180 },
  { id: "k2", name: "Staging Integration",  key: "urlify_test_sk_7rBuOdVmPzK1gYwQeCsXnAfHj5tIlNkM", created: "2026-01-02", lastUsed: "3h ago",  permissions: ["read","write"],         status: "active" as const,   requests: 1840  },
  { id: "k3", name: "Analytics Read-Only",  key: "urlify_live_sk_2mLqRwCkNdVpHsXeGfJzAyTuBo9Ij4Yb", created: "2026-02-01", lastUsed: "1d ago",  permissions: ["read"],                 status: "active" as const,   requests: 5620  },
  { id: "k4", name: "Old CI Key",           key: "urlify_live_sk_9kDpMnRzQbXeVwHsJyFtCuGaLo3Ij7Bc", created: "2025-08-10", lastUsed: "45d ago", permissions: ["read","write"],         status: "revoked" as const,  requests: 0     },
];
const PERM_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  read:   { bg: "#F0FDF4",        color: "#166534",           border: "#BBF7D0" },
  write:  { bg: "var(--ocean-50)",color: "var(--ocean-700)",  border: "var(--ocean-200)" },
  delete: { bg: "#FFF1F2",        color: "#9F1239",           border: "#FECDD3" },
};

/* ─── Backend DTO types ──────────────────────────────────────────────────── */
interface ApiKeyDto {
  keyId: string;
  name?: string | null;
  keyPrefix?: string | null;
  createdAtUtc?: string | null;
  lastUsedAtUtc?: string | null;
  permissions?: string[] | null;
  isRevoked?: boolean;
  requestCount?: number;
}
interface ApiKeyCreateResponse {
  keyId: string;
  apiKey: string;
  name?: string | null;
  permissions?: string[] | null;
  createdAtUtc?: string | null;
}
interface ApiKeyRecord {
  id: string;
  name: string;
  key: string;
  created: string;
  lastUsed: string;
  permissions: string[];
  status: "active" | "revoked";
  requests: number;
}

interface WebhookDto {
  id: string;
  url: string;
  events?: string[] | null;
  isActive?: boolean;
  secret?: string | null;
}
interface HookRecord {
  id: string;
  name: string;
  url: string;
  events: string[];
  status: "active" | "failing";
  secret: string;
  lastDelivery: string;
  successRate: number;
  deliveries: number;
}

function mapApiKey(dto: ApiKeyDto): ApiKeyRecord {
  return {
    id: dto.keyId,
    name: dto.name ?? "API Key",
    key: dto.keyPrefix ? `${dto.keyPrefix}${"*".repeat(24)}` : "****",
    created: dto.createdAtUtc?.slice(0, 10) ?? "—",
    lastUsed: dto.lastUsedAtUtc ? new Date(dto.lastUsedAtUtc).toLocaleDateString() : "Never",
    permissions: dto.permissions ?? ["read"],
    status: dto.isRevoked ? "revoked" : "active",
    requests: dto.requestCount ?? 0,
  };
}

function mapWebhook(dto: WebhookDto): HookRecord {
  return {
    id: dto.id,
    name: dto.url,
    url: dto.url,
    events: dto.events ?? [],
    status: "active" as const,
    secret: dto.secret ?? "—",
    lastDelivery: "—",
    successRate: 100,
    deliveries: 0,
  };
}

/* ─── Webhooks data ──────────────────────────────────────────────────────── */
const EVENT_TYPES = [
  "link.created","link.updated","link.deleted","link.clicked","link.milestone",
  "campaign.created","campaign.updated","qrcode.scanned","domain.verified",
  "team.member_invited","team.member_joined",
];
const INITIAL_HOOKS = [
  { id:"wh1", name:"Slack Alerts",        url:"https://hooks.slack.com/services/T0XXXX/B0XXXX/abcdef",  events:["link.created","link.milestone","domain.verified"], status:"active" as const,  secret:"whsec_abc123", lastDelivery:"2m ago",  successRate:99.2, deliveries:1840  },
  { id:"wh2", name:"Analytics Pipeline",  url:"https://api.myapp.com/webhooks/urlify",                   events:["link.clicked","qrcode.scanned"],                   status:"active" as const,  secret:"whsec_xyz789", lastDelivery:"30s ago", successRate:97.8, deliveries:48200 },
  { id:"wh3", name:"CRM Integration",     url:"https://crm.acme.com/api/hooks/inbound",                  events:["link.created","campaign.created","team.member_joined"],status:"failing" as const, secret:"whsec_def456", lastDelivery:"5m ago",  successRate:61.4, deliveries:320   },
];
const DELIVERY_LOG = [
  { id:"d1", hook:"Slack Alerts",       event:"link.created",   status:200, time:"2m ago",  duration:"124ms"  },
  { id:"d2", hook:"Analytics Pipeline", event:"link.clicked",   status:200, time:"30s ago", duration:"89ms"   },
  { id:"d3", hook:"CRM Integration",    event:"link.created",   status:503, time:"5m ago",  duration:"3001ms" },
  { id:"d4", hook:"Slack Alerts",       event:"link.milestone", status:200, time:"1h ago",  duration:"110ms"  },
  { id:"d5", hook:"Analytics Pipeline", event:"qrcode.scanned", status:200, time:"2h ago",  duration:"95ms"   },
  { id:"d6", hook:"CRM Integration",    event:"link.created",   status:500, time:"3h ago",  duration:"2801ms" },
  { id:"d7", hook:"Slack Alerts",       event:"domain.verified",status:200, time:"1d ago",  duration:"132ms"  },
];

/* ─── Audit log data ─────────────────────────────────────────────────────── */
const ALL_ENTRIES = [
  { id:"e1",  user:"Jane Doe",  email:"jane@acme.com",  action:"link.created",          resource:"acme.ly/launch",         ip:"104.28.12.45",  location:"New York, US",  time:"2026-02-24 10:14:22", category:"Links",    severity:"info"     },
  { id:"e2",  user:"Ari Patel", email:"ari@acme.com",   action:"link.deleted",          resource:"acme.ly/old-promo",       ip:"198.51.100.12", location:"London, UK",    time:"2026-02-24 10:08:41", category:"Links",    severity:"warning"  },
  { id:"e3",  user:"Jane Doe",  email:"jane@acme.com",  action:"api_key.created",       resource:"Production API",          ip:"104.28.12.45",  location:"New York, US",  time:"2026-02-24 09:55:10", category:"Security", severity:"info"     },
  { id:"e4",  user:"Jane Doe",  email:"jane@acme.com",  action:"domain.added",          resource:"events.acme.com",         ip:"104.28.12.45",  location:"New York, US",  time:"2026-02-24 09:30:00", category:"Domains",  severity:"info"     },
  { id:"e5",  user:"Ari Patel", email:"ari@acme.com",   action:"team.member_invited",   resource:"mina@acme.com",           ip:"198.51.100.12", location:"London, UK",    time:"2026-02-23 18:20:05", category:"Team",     severity:"info"     },
  { id:"e6",  user:"Jane Doe",  email:"jane@acme.com",  action:"settings.updated",      resource:"Workspace settings",      ip:"104.28.12.45",  location:"New York, US",  time:"2026-02-23 16:42:30", category:"Settings", severity:"info"     },
  { id:"e7",  user:"Jane Doe",  email:"jane@acme.com",  action:"campaign.created",      resource:"Spring Launch 2026",      ip:"104.28.12.45",  location:"New York, US",  time:"2026-02-23 15:10:18", category:"Campaigns",severity:"info"     },
  { id:"e8",  user:"Ari Patel", email:"ari@acme.com",   action:"api_key.revoked",       resource:"Old CI Key",              ip:"198.51.100.12", location:"London, UK",    time:"2026-02-23 14:05:00", category:"Security", severity:"warning"  },
  { id:"e9",  user:"Jane Doe",  email:"jane@acme.com",  action:"webhook.created",       resource:"Slack Alerts",            ip:"104.28.12.45",  location:"New York, US",  time:"2026-02-22 11:30:00", category:"Developer",severity:"info"     },
  { id:"e10", user:"Ari Patel", email:"ari@acme.com",   action:"link.updated",          resource:"acme.ly/pricing",         ip:"198.51.100.12", location:"London, UK",    time:"2026-02-22 10:12:55", category:"Links",    severity:"info"     },
  { id:"e11", user:"Jane Doe",  email:"jane@acme.com",  action:"billing.plan_changed",  resource:"Enterprise plan",         ip:"104.28.12.45",  location:"New York, US",  time:"2026-02-21 09:00:00", category:"Billing",  severity:"critical" },
  { id:"e12", user:"Ari Patel", email:"ari@acme.com",   action:"login.success",         resource:"Web session",             ip:"198.51.100.12", location:"London, UK",    time:"2026-02-20 08:30:00", category:"Security", severity:"info"     },
  { id:"e13", user:"Unknown",   email:"unknown",         action:"login.failed",          resource:"Web session",             ip:"91.102.22.14",  location:"Tbilisi, GE",   time:"2026-02-19 22:14:09", category:"Security", severity:"critical" },
  { id:"e14", user:"Jane Doe",  email:"jane@acme.com",  action:"qrcode.bulk_downloaded",resource:"3 QR codes",              ip:"104.28.12.45",  location:"New York, US",  time:"2026-02-18 14:22:11", category:"QR Codes", severity:"info"     },
];
const AUDIT_CATEGORIES = ["All","Links","Campaigns","Domains","Security","Team","Settings","Billing","Developer","QR Codes"];
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Links:    <Link2 size={12} />,
  Campaigns:<Megaphone size={12} />,
  Domains:  <Globe size={12} />,
  Security: <Shield size={12} />,
  Team:     <UsersIcon size={12} />,
  Settings: <SettingsIcon size={12} />,
  Developer:<Webhook size={12} />,
};
const SEV_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  info:    { bg: "var(--ocean-50)", color: "var(--ocean-700)", border: "var(--ocean-100)" },
  warning: { bg: "#FFFBEB",         color: "#92400E",           border: "#FCD34D" },
  critical:{ bg: "#FFF1F2",         color: "#9F1239",           border: "#FECDD3" },
};

/* ─── Security data ──────────────────────────────────────────────────────── */
const INITIAL_SESSIONS = [
  { id:"s1", device:"Chrome on macOS",       location:"New York, US",  ip:"104.28.12.45",  lastActive:"Active now", current:true,  DevIcon:Monitor     },
  { id:"s2", device:"Safari on iPhone 15",   location:"New York, US",  ip:"104.28.12.55",  lastActive:"2h ago",     current:false, DevIcon:Smartphone  },
  { id:"s3", device:"Chrome on Windows 11",  location:"London, UK",    ip:"198.51.100.12", lastActive:"1d ago",     current:false, DevIcon:Monitor     },
  { id:"s4", device:"Firefox on Ubuntu 22",  location:"Berlin, DE",    ip:"203.0.113.40",  lastActive:"3d ago",     current:false, DevIcon:Monitor     },
];
const SECURITY_EVENTS = [
  { action:"Login success",        detail:"Chrome on macOS — New York, US",  time:"Active now",  ok:true  },
  { action:"Password changed",     detail:"via web dashboard",                time:"7 days ago",  ok:true  },
  { action:"API key created",      detail:"Production API key created",        time:"10 days ago", ok:true  },
  { action:"Login from new city",  detail:"London, UK — Chrome on Windows",   time:"14 days ago", ok:false },
  { action:"Failed login",         detail:"91.102.22.14 — Tbilisi, GE",       time:"15 days ago", ok:false },
  { action:"SSO configured",       detail:"SAML 2.0 provider set up",         time:"1 month ago", ok:true  },
];

/* ─── Toggle switch ──────────────────────────────────────────────────────── */
function ToggleSwitch({ defaultOn }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn ?? false);
  return (
    <div onClick={() => setOn((v) => !v)} style={{ width:40, height:22, background: on ? "var(--ocean-500)" : "var(--sky-300)", position:"relative", cursor:"pointer", transition:"background 0.2s", flexShrink:0 }}>
      <div style={{ position:"absolute", top:3, left: on ? 20 : 3, width:16, height:16, background:"#fff", transition:"left 0.2s" }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════════════════ */
const TAB_PARAM_MAP: Record<string, Tab> = {
  "api-keys":      "API Keys",
  "webhooks":      "Webhooks",
  "audit-log":     "Audit Log",
  "security":      "Security",
  "notifications": "Notifications",
  "danger-zone":   "Danger zone",
  "profile":       "Profile",
  "workspace":     "Workspace",
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Workspace");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const param = new URLSearchParams(window.location.search).get("tab");
    if (param && TAB_PARAM_MAP[param]) {
      setActiveTab(TAB_PARAM_MAP[param]);
    }
  }, []);

  /* Load API Keys from backend */
  useEffect(() => {
    api
      .get<{ total: number; items: ApiKeyDto[] }>("/api/admin/v1/tenant/api-keys?pageSize=100")
      .then((res) => setApiKeys(res.items.map(mapApiKey)))
      .catch(console.error);
  }, []);

  /* Load Webhooks from backend */
  useEffect(() => {
    api
      .get<HookRecord[]>("/api/v1/tenant/webhooks")
      .then((res) => setHooks(res.map((dto) => mapWebhook(dto as unknown as WebhookDto))))
      .catch(console.error);
  }, []);

  /* API Keys state */
  const [apiKeys, setApiKeys]           = useState<ApiKeyRecord[]>(INITIAL_KEYS);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showKey, setShowKey]           = useState<string | null>(null);
  const [copied, setCopied]             = useState<string | null>(null);
  const [newKeyName, setNewKeyName]     = useState("");
  const [newPerms, setNewPerms]         = useState<string[]>(["read"]);
  const [revokeKeyId, setRevokeKeyId]   = useState<string | null>(null);
  const [createdKey, setCreatedKey]     = useState<string | null>(null);

  /* Webhooks state */
  const [hooks, setHooks]                 = useState<HookRecord[]>(INITIAL_HOOKS);
  const [showHookModal, setShowHookModal] = useState(false);
  const [hookForm, setHookForm]           = useState({ name:"", url:"", events:[] as string[] });
  const [deleteHookId, setDeleteHookId]   = useState<string | null>(null);
  const [testingId, setTestingId]         = useState<string | null>(null);
  const [testedId, setTestedId]           = useState<string | null>(null);
  const [expandedLog, setExpandedLog]     = useState(false);

  /* Audit log state */
  const [auditSearch, setAuditSearch]       = useState("");
  const [auditCategory, setAuditCategory]   = useState("All");
  const [auditSeverity, setAuditSeverity]   = useState("All");

  /* Security state */
  const [sessions, setSessions]               = useState(INITIAL_SESSIONS);
  const [mfaEnabled, setMfaEnabled]           = useState(true);
  const [ssoEnabled, setSsoEnabled]           = useState(true);
  const [ipRestriction, setIpRestriction]     = useState(false);
  const [showIpModal, setShowIpModal]         = useState(false);
  const [ipInput, setIpInput]                 = useState("");
  const [allowedIps, setAllowedIps]           = useState(["104.28.12.0/24"]);
  const [revokeSessionId, setRevokeSessionId] = useState<string | null>(null);

  /* ── Helpers ── */
  const handleCopy = (val: string, id: string) => {
    navigator.clipboard.writeText(val).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 1800);
  };

  const handleCreateKey = () => {
    if (!newKeyName.trim()) return;
    api
      .post<ApiKeyCreateResponse>("/api/admin/v1/tenant/api-keys", { name: newKeyName.trim(), permissions: newPerms })
      .then((res) => {
        const newRecord: ApiKeyRecord = {
          id: res.keyId,
          name: res.name ?? newKeyName.trim(),
          key: res.apiKey,
          created: res.createdAtUtc?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
          lastUsed: "Never",
          permissions: res.permissions ?? newPerms,
          status: "active" as const,
          requests: 0,
        };
        setApiKeys((prev) => [newRecord, ...prev]);
        setCreatedKey(res.apiKey);
        setNewKeyName(""); setNewPerms(["read"]); setShowKeyModal(false);
      })
      .catch((err: Error) => alert(`Failed to create key: ${err.message}`));
  };
  const handleRevokeKey = (id: string) => {
    setApiKeys((prev) => prev.map((k) => k.id === id ? { ...k, status:"revoked" as const, requests:0 } : k));
    setRevokeKeyId(null);
    api.post(`/api/admin/v1/tenant/api-keys/${id}/revoke`, {}).catch(console.error);
  };

  const handleCreateHook = () => {
    if (!hookForm.url.trim() || hookForm.events.length === 0) return;
    api
      .post<WebhookDto>("/api/v1/tenant/webhooks", { url: hookForm.url.trim(), events: hookForm.events })
      .then((res) => {
        setHooks((prev) => [mapWebhook(res), ...prev]);
        setHookForm({ name:"", url:"", events:[] }); setShowHookModal(false);
      })
      .catch((err: Error) => alert(`Failed to create webhook: ${err.message}`));
  };
  const handleDeleteHook = (id: string) => {
    setHooks((prev) => prev.filter((h) => h.id !== id));
    setDeleteHookId(null);
    api.delete(`/api/v1/tenant/webhooks/${id}`).catch(console.error);
  };
  const handleTestHook    = (id: string) => {
    setTestingId(id);
    setTimeout(() => { setTestingId(null); setTestedId(id); setTimeout(() => setTestedId(null), 3000); }, 1200);
  };
  const hookStatusColor = (s: string) =>
    s === "active"  ? { bg:"#F0FDF4", color:"#166534", border:"#BBF7D0" }
    : s === "failing" ? { bg:"#FFF1F2", color:"#9F1239", border:"#FECDD3" }
    : { bg:"var(--sky-100)", color:"var(--text-muted)", border:"var(--border)" };

  const filteredAudit = useMemo(() => ALL_ENTRIES.filter((e) => {
    const matchCat    = auditCategory === "All" || e.category === auditCategory;
    const matchSev    = auditSeverity === "All" || e.severity === auditSeverity.toLowerCase();
    const matchSearch = !auditSearch || [e.user,e.action,e.resource,e.ip,e.location].some((f) => f.toLowerCase().includes(auditSearch.toLowerCase()));
    return matchCat && matchSev && matchSearch;
  }), [auditSearch, auditCategory, auditSeverity]);

  const exportAuditCSV = () => {
    const rows = [["Time","User","Email","Action","Resource","IP","Location","Severity"], ...filteredAudit.map((e) => [e.time,e.user,e.email,e.action,e.resource,e.ip,e.location,e.severity])];
    const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type:"text/csv" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href=url; a.download="audit-log.csv"; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const secScore   = (() => { let s=20; if(mfaEnabled) s+=35; if(ssoEnabled) s+=25; if(ipRestriction) s+=20; return s; })();
  const scoreColor = secScore >= 80 ? "var(--sage)" : secScore >= 60 ? "#F59E0B" : "var(--coral)";

  const activeApiKeys  = apiKeys.filter((k) => k.status === "active");
  const revokedApiKeys = apiKeys.filter((k) => k.status === "revoked");

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <PageHeader
        title="Settings"
        description="Workspace configuration, security, developer tools, and account preferences."
        breadcrumb="Workspace"
      />

      {/* ── Tab bar ──────────────────────────────────────────────────────── */}
      <div style={{ display:"flex", borderBottom:"1px solid var(--border)", marginBottom:24, gap:0, overflowX:"auto", scrollbarWidth:"none" }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              height:38, padding:"0 16px", fontSize:12, fontWeight:700,
              background:"none", border:"none",
              borderBottom: activeTab === tab ? "2px solid var(--ocean-500)" : "2px solid transparent",
              color: activeTab === tab ? "var(--ocean-600)" : "var(--text-muted)",
              cursor:"pointer", fontFamily:"var(--font-body)", marginBottom:-1,
              whiteSpace:"nowrap",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ════════════ WORKSPACE ════════════════════════════════════════════ */}
      {activeTab === "Workspace" && (
        <Panel title="Workspace settings">
          <div style={{ maxWidth: 520 }}>
            <Field label="Workspace name"><input defaultValue="Acme Inc." style={inputStyle} onFocus={focusInput} onBlur={blurInput} /></Field>
            <Field label="Workspace slug" hint="Used in your default short links: your-slug.url.ify"><input defaultValue="acme" style={inputStyle} onFocus={focusInput} onBlur={blurInput} /></Field>
            <Field label="Default domain">
              <select style={{ ...inputStyle, cursor:"pointer" }}><option>acme.ly</option><option>go.acme.com</option></select>
            </Field>
            <Field label="Timezone">
              <select style={{ ...inputStyle, cursor:"pointer" }}>
                <option>UTC+0 — Coordinated Universal Time</option>
                <option>UTC-5 — Eastern Time</option>
                <option>UTC-8 — Pacific Time</option>
                <option>UTC+1 — Central European Time</option>
                <option>UTC+5:30 — India Standard Time</option>
              </select>
            </Field>
            <SaveBtn />
          </div>
        </Panel>
      )}

      {/* ════════════ PROFILE ══════════════════════════════════════════════ */}
      {activeTab === "Profile" && (
        <Panel title="Profile settings">
          <div style={{ maxWidth: 520 }}>
            <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:24 }}>
              <div style={{ width:64, height:64, background:"var(--ocean-800)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:800, color:"#fff", flexShrink:0 }}>JD</div>
              <div>
                <button style={{ height:32, padding:"0 14px", background:"var(--sky-100)", border:"1px solid var(--border)", fontFamily:"var(--font-body)", fontSize:12, fontWeight:600, color:"var(--text-secondary)", cursor:"pointer", marginRight:8 }}>Upload photo</button>
                <button style={{ height:32, padding:"0 14px", background:"transparent", border:"1px solid var(--border)", fontFamily:"var(--font-body)", fontSize:12, fontWeight:600, color:"var(--text-muted)", cursor:"pointer" }}>Remove</button>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:4 }}>
              {[{label:"First name",value:"Jane"},{label:"Last name",value:"Doe"}].map((f) => (
                <Field key={f.label} label={f.label}><input defaultValue={f.value} style={inputStyle} onFocus={focusInput} onBlur={blurInput} /></Field>
              ))}
            </div>
            <Field label="Email address"><input type="email" defaultValue="jane@acme.com" style={inputStyle} onFocus={focusInput} onBlur={blurInput} /></Field>
            <div style={{ borderTop:"1px solid var(--border)", paddingTop:20, marginBottom:20 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"var(--text-secondary)", marginBottom:12 }}>Change password</div>
              {["Current password","New password","Confirm new password"].map((label) => (
                <Field key={label} label={label}><input type="password" placeholder="••••••••" style={inputStyle} onFocus={focusInput} onBlur={blurInput} /></Field>
              ))}
            </div>
            <SaveBtn label="Save profile" />
          </div>
        </Panel>
      )}

      {/* ════════════ API KEYS ═════════════════════════════════════════════ */}
      {activeTab === "API Keys" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:12 }}>
            {[
              { label:"Active keys",         value:activeApiKeys.length,                                   icon:<Key size={18} /> },
              { label:"Total API requests",  value:apiKeys.reduce((s,k)=>s+k.requests,0).toLocaleString(), icon:<Code2 size={18} /> },
              { label:"Rate limit",          value:"Unlimited",                                             icon:<RefreshCw size={18} /> },
              { label:"Revoked keys",        value:revokedApiKeys.length,                                   icon:<AlertTriangle size={18} /> },
            ].map((s) => (
              <div key={s.label} style={{ background:"var(--cloud)", border:"1px solid var(--border)", borderTop:"3px solid var(--ocean-400)", padding:"16px 18px" }}>
                <div style={{ color:"var(--ocean-300)", marginBottom:8 }}>{s.icon}</div>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--text-muted)", marginBottom:6 }}>{s.label}</div>
                <div style={{ fontSize:22, fontWeight:800, color:"var(--ink)", letterSpacing:"-0.02em" }}>{s.value}</div>
              </div>
            ))}
          </div>

          {createdKey && (
            <div style={{ background:"#F0FDF4", border:"1px solid #BBF7D0", borderLeft:"3px solid var(--sage)", padding:"14px 18px", display:"flex", alignItems:"center", gap:14 }}>
              <Check size={16} color="var(--sage)" />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#166534", marginBottom:4 }}>API key created — copy it now, you won&apos;t see it again</div>
                <code style={{ fontFamily:"var(--font-mono)", fontSize:13, color:"#166534", wordBreak:"break-all" }}>{createdKey}</code>
              </div>
              <button onClick={() => handleCopy(createdKey, "new")} style={{ display:"flex", alignItems:"center", gap:5, height:32, padding:"0 12px", background:"var(--sage)", border:"none", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"var(--font-body)", flexShrink:0 }}>
                {copied === "new" ? <Check size={12} /> : <Copy size={12} />} {copied === "new" ? "Copied!" : "Copy"}
              </button>
              <button onClick={() => setCreatedKey(null)} style={{ background:"none", border:"none", cursor:"pointer", color:"#166534" }}><X size={16} /></button>
            </div>
          )}

          <Panel title="Active API Keys" subtitle={`${activeApiKeys.length} key${activeApiKeys.length!==1?"s":""} with API access`} noPad
            action={<button onClick={() => setShowKeyModal(true)} style={{ display:"inline-flex", alignItems:"center", gap:5, height:30, padding:"0 12px", background:"var(--ocean-500)", color:"#fff", border:"none", fontFamily:"var(--font-body)", fontWeight:700, fontSize:11, letterSpacing:"0.06em", textTransform:"uppercase", cursor:"pointer" }}><Plus size={12} /> Create key</button>}
          >
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr style={{ background:"var(--sky-100)", borderBottom:"1px solid var(--border)" }}>
                  {["Name","Key","Permissions","Last used","Requests",""].map((h) => (
                    <th key={h} style={{ padding:"11px 18px", textAlign:"left", fontWeight:700, fontSize:11, color:"var(--text-muted)", letterSpacing:"0.09em", textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeApiKeys.map((k) => {
                  const masked  = `${k.key.slice(0,16)}${"•".repeat(20)}${k.key.slice(-4)}`;
                  const visible = showKey === k.id;
                  return (
                    <tr key={k.id} style={{ borderBottom:"1px solid var(--border)" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--sky-50)")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                    >
                      <td style={{ padding:"14px 18px" }}>
                        <div style={{ fontWeight:700, color:"var(--ink)" }}>{k.name}</div>
                        <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:2 }}>Created {k.created}</div>
                      </td>
                      <td style={{ padding:"14px 18px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <code style={{ fontFamily:"var(--font-mono)", fontSize:12, color:"var(--ocean-600)", wordBreak:"break-all", maxWidth:220 }}>{visible ? k.key : masked}</code>
                          <button onClick={() => setShowKey(visible ? null : k.id)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)", flexShrink:0 }}>{visible ? <EyeOff size={13}/> : <Eye size={13}/>}</button>
                          <button onClick={() => handleCopy(k.key, k.id)} style={{ background:"none", border:"none", cursor:"pointer", color: copied===k.id ? "var(--sage)" : "var(--text-muted)", flexShrink:0 }}>{copied===k.id ? <Check size={13}/> : <Copy size={13}/>}</button>
                        </div>
                      </td>
                      <td style={{ padding:"14px 18px" }}>
                        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                          {k.permissions.map((p) => { const c=PERM_COLORS[p]; return (<span key={p} style={{ background:c.bg, color:c.color, border:`1px solid ${c.border}`, fontSize:10, fontWeight:700, padding:"2px 6px", textTransform:"uppercase", letterSpacing:"0.06em" }}>{p}</span>); })}
                        </div>
                      </td>
                      <td style={{ padding:"14px 18px", color:"var(--text-muted)", fontSize:12 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:5 }}><Clock size={11}/> {k.lastUsed}</div>
                      </td>
                      <td style={{ padding:"14px 18px", fontWeight:700, color:"var(--ink)" }}>{k.requests.toLocaleString()}</td>
                      <td style={{ padding:"14px 18px" }}>
                        <button onClick={() => setRevokeKeyId(k.id)} style={{ display:"flex", alignItems:"center", gap:5, height:28, padding:"0 10px", background:"transparent", border:"1px solid var(--border)", color:"var(--coral)", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"var(--font-body)" }}><Trash2 size={11}/> Revoke</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Panel>

          {revokedApiKeys.length > 0 && (
            <Panel title="Revoked Keys" subtitle="These keys no longer have API access" noPad>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <tbody>
                  {revokedApiKeys.map((k) => (
                    <tr key={k.id} style={{ borderBottom:"1px solid var(--border)", opacity:0.6 }}>
                      <td style={{ padding:"12px 18px", fontWeight:600, color:"var(--text-muted)" }}>{k.name}</td>
                      <td style={{ padding:"12px 18px" }}><code style={{ fontFamily:"var(--font-mono)", fontSize:12, color:"var(--text-muted)" }}>{k.key.slice(0,20)}•••</code></td>
                      <td style={{ padding:"12px 18px" }}><span style={{ background:"var(--sky-100)", color:"var(--text-muted)", border:"1px solid var(--border)", fontSize:10, fontWeight:700, padding:"2px 7px", textTransform:"uppercase" }}>Revoked</span></td>
                      <td style={{ padding:"12px 18px", color:"var(--text-muted)", fontSize:12 }}>Created {k.created}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          )}

          <Panel title="API Reference">
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:12 }}>
              {[{title:"REST API Docs",sub:"Full endpoint reference",icon:"📄"},{title:"SDKs & Libraries",sub:"Node.js, Python, Go, PHP",icon:"📦"},{title:"Webhook Events",sub:"Real-time event notifications",icon:"🔔"}].map((item) => (
                <button key={item.title} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", background:"var(--sky-100)", border:"1px solid var(--border)", cursor:"pointer", fontFamily:"var(--font-body)", textAlign:"left" }}>
                  <span style={{ fontSize:20, flexShrink:0 }}>{item.icon}</span>
                  <div><div style={{ fontSize:13, fontWeight:700, color:"var(--ink)" }}>{item.title}</div><div style={{ fontSize:12, color:"var(--text-muted)", marginTop:2 }}>{item.sub}</div></div>
                </button>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {/* ════════════ WEBHOOKS ═════════════════════════════════════════════ */}
      {activeTab === "Webhooks" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:12 }}>
            {[
              { label:"Active webhooks",   value:hooks.filter((h)=>h.status==="active").length },
              { label:"Total deliveries",  value:hooks.reduce((s,h)=>s+h.deliveries,0).toLocaleString() },
              { label:"Avg. success rate", value:`${(hooks.filter(h=>h.status!=="failing").reduce((s,h)=>s+h.successRate,0)/Math.max(hooks.filter(h=>h.status!=="failing").length,1)).toFixed(1)}%` },
              { label:"Failing endpoints", value:hooks.filter((h)=>h.status==="failing").length },
            ].map((s) => (
              <div key={s.label} style={{ background:"var(--cloud)", border:"1px solid var(--border)", borderTop:"3px solid var(--ocean-400)", padding:"16px 18px" }}>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--text-muted)", marginBottom:8 }}>{s.label}</div>
                <div style={{ fontSize:24, fontWeight:800, color:"var(--ink)", letterSpacing:"-0.02em" }}>{s.value}</div>
              </div>
            ))}
          </div>

          <Panel title="Configured Webhooks" noPad
            action={<div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:12, color:"var(--text-muted)" }}>{hooks.length} endpoint{hooks.length!==1?"s":""}</span>
              <button onClick={() => setShowHookModal(true)} style={{ display:"inline-flex", alignItems:"center", gap:5, height:28, padding:"0 10px", background:"var(--ocean-500)", color:"#fff", border:"none", fontFamily:"var(--font-body)", fontWeight:700, fontSize:11, letterSpacing:"0.06em", textTransform:"uppercase", cursor:"pointer" }}><Plus size={12}/> Add</button>
            </div>}
          >
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr style={{ background:"var(--sky-100)", borderBottom:"1px solid var(--border)" }}>
                  {["Endpoint","Events","Status","Deliveries","Success Rate","Last delivery",""].map((h) => (
                    <th key={h} style={{ padding:"11px 16px", textAlign:"left", fontWeight:700, fontSize:11, color:"var(--text-muted)", letterSpacing:"0.09em", textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hooks.map((hook) => {
                  const sc = hookStatusColor(hook.status);
                  return (
                    <tr key={hook.id} style={{ borderBottom:"1px solid var(--border)" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--sky-50)")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                    >
                      <td style={{ padding:"14px 16px", maxWidth:220 }}>
                        <div style={{ fontWeight:700, color:"var(--ink)" }}>{hook.name}</div>
                        <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{hook.url}</div>
                      </td>
                      <td style={{ padding:"14px 16px" }}>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:3 }}>
                          {hook.events.slice(0,2).map((ev) => (<span key={ev} style={{ background:"var(--sky-100)", color:"var(--text-secondary)", border:"1px solid var(--border)", fontSize:10, fontWeight:600, padding:"1px 5px", fontFamily:"var(--font-mono)" }}>{ev}</span>))}
                          {hook.events.length > 2 && <span style={{ fontSize:11, color:"var(--text-muted)" }}>+{hook.events.length-2}</span>}
                        </div>
                      </td>
                      <td style={{ padding:"14px 16px" }}><span style={{ background:sc.bg, color:sc.color, border:`1px solid ${sc.border}`, fontSize:11, fontWeight:700, padding:"3px 8px", textTransform:"capitalize" }}>{hook.status}</span></td>
                      <td style={{ padding:"14px 16px", fontWeight:700, color:"var(--ink)" }}>{hook.deliveries.toLocaleString()}</td>
                      <td style={{ padding:"14px 16px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ width:48, height:5, background:"var(--sky-200)" }}><div style={{ width:`${hook.successRate}%`, height:"100%", background: hook.successRate>90 ? "var(--sage)" : hook.successRate>70 ? "#F59E0B" : "var(--coral)" }}/></div>
                          <span style={{ fontSize:12, fontWeight:700, color: hook.successRate>90 ? "var(--sage)" : hook.successRate>70 ? "#92400E" : "var(--coral)" }}>{hook.successRate}%</span>
                        </div>
                      </td>
                      <td style={{ padding:"14px 16px", fontSize:12, color:"var(--text-muted)" }}><div style={{ display:"flex", alignItems:"center", gap:4 }}><Clock size={11}/> {hook.lastDelivery}</div></td>
                      <td style={{ padding:"14px 16px" }}>
                        <div style={{ display:"flex", gap:6 }}>
                          <button onClick={() => handleTestHook(hook.id)} style={{ display:"flex", alignItems:"center", gap:4, height:28, padding:"0 10px", background:"var(--sky-100)", border:"1px solid var(--border)", color: testedId===hook.id ? "var(--sage)" : "var(--text-muted)", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"var(--font-body)" }}>
                            {testingId===hook.id ? <RotateCcw size={11}/> : testedId===hook.id ? <Check size={11}/> : <Play size={11}/>}
                            {testingId===hook.id ? "Testing…" : testedId===hook.id ? "Sent!" : "Test"}
                          </button>
                          <button onClick={() => setDeleteHookId(hook.id)} style={{ display:"flex", alignItems:"center", height:28, padding:"0 8px", background:"transparent", border:"1px solid var(--border)", color:"var(--coral)", cursor:"pointer" }}><Trash2 size={11}/></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Panel>

          <Panel title="Delivery Log" subtitle="Recent webhook delivery attempts" noPad
            action={<button onClick={() => setExpandedLog((v)=>!v)} style={{ display:"flex", alignItems:"center", gap:5, background:"none", border:"none", color:"var(--ocean-600)", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"var(--font-body)" }}>
              {expandedLog ? <ChevronUp size={13}/> : <ChevronDown size={13}/>} {expandedLog ? "Show less" : "Show all"}
            </button>}
          >
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr style={{ background:"var(--sky-100)", borderBottom:"1px solid var(--border)" }}>
                  {["Webhook","Event","Status","Duration","Time"].map((h) => (<th key={h} style={{ padding:"10px 16px", textAlign:"left", fontWeight:700, fontSize:11, color:"var(--text-muted)", letterSpacing:"0.09em", textTransform:"uppercase" }}>{h}</th>))}
                </tr>
              </thead>
              <tbody>
                {(expandedLog ? DELIVERY_LOG : DELIVERY_LOG.slice(0,4)).map((d) => (
                  <tr key={d.id} style={{ borderBottom:"1px solid var(--border)" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--sky-50)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                  >
                    <td style={{ padding:"12px 16px", fontWeight:600, color:"var(--text-secondary)" }}>{d.hook}</td>
                    <td style={{ padding:"12px 16px" }}><code style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--ocean-600)", background:"var(--ocean-50)", padding:"2px 6px", border:"1px solid var(--ocean-100)" }}>{d.event}</code></td>
                    <td style={{ padding:"12px 16px" }}><span style={{ fontWeight:700, fontSize:12, color: d.status===200 ? "var(--sage)" : "var(--coral)", fontFamily:"var(--font-mono)" }}>{d.status}</span></td>
                    <td style={{ padding:"12px 16px", fontFamily:"var(--font-mono)", fontSize:12, color: Number(d.duration.replace("ms",""))>1000 ? "var(--coral)" : "var(--text-muted)" }}>{d.duration}</td>
                    <td style={{ padding:"12px 16px", fontSize:12, color:"var(--text-muted)" }}>{d.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
      )}

      {/* ════════════ AUDIT LOG ════════════════════════════════════════════ */}
      {activeTab === "Audit Log" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:12 }}>
            {[
              { label:"Total events",    value:ALL_ENTRIES.length,                                             color:"var(--ocean-400)" },
              { label:"Security events", value:ALL_ENTRIES.filter((e)=>e.category==="Security").length,        color:"var(--ocean-500)" },
              { label:"Critical alerts", value:ALL_ENTRIES.filter((e)=>e.severity==="critical").length,        color:"var(--coral)" },
              { label:"Active users",    value:new Set(ALL_ENTRIES.map((e)=>e.email)).size,                    color:"var(--ocean-300)" },
            ].map((s) => (
              <div key={s.label} style={{ background:"var(--cloud)", border:"1px solid var(--border)", borderTop:`3px solid ${s.color}`, padding:"16px 18px" }}>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--text-muted)", marginBottom:8 }}>{s.label}</div>
                <div style={{ fontSize:26, fontWeight:800, color:"var(--ink)", letterSpacing:"-0.02em" }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ background:"var(--cloud)", border:"1px solid var(--border)", borderBottom:"none", padding:"12px 16px", display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
            <div style={{ position:"relative", flex:1, maxWidth:300 }}>
              <Search size={13} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"var(--text-muted)", pointerEvents:"none" }}/>
              <input value={auditSearch} onChange={(e)=>setAuditSearch(e.target.value)} placeholder="Search events, users, IPs…" style={{ width:"100%", height:34, paddingLeft:30, paddingRight:10, border:"1px solid var(--border)", background:"var(--sky-100)", fontSize:13, fontFamily:"var(--font-body)", color:"var(--ink)", outline:"none" }}/>
            </div>
            <div style={{ display:"flex", border:"1px solid var(--border)", background:"var(--sky-100)" }}>
              {["All","info","warning","critical"].map((s) => (<button key={s} onClick={()=>setAuditSeverity(s)} style={{ height:34, padding:"0 12px", background: auditSeverity===s ? "var(--ocean-500)" : "transparent", border:"none", color: auditSeverity===s ? "#fff" : "var(--text-muted)", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"var(--font-body)", textTransform:"capitalize", borderRight: s!=="critical" ? "1px solid var(--border)" : "none" }}>{s}</button>))}
            </div>
            <select value={auditCategory} onChange={(e)=>setAuditCategory(e.target.value)} style={{ height:34, padding:"0 10px", border:"1px solid var(--border)", background:"var(--sky-100)", fontSize:13, fontFamily:"var(--font-body)", color:"var(--ink)", outline:"none" }}>
              {AUDIT_CATEGORIES.map((c)=><option key={c}>{c}</option>)}
            </select>
            <button onClick={exportAuditCSV} style={{ display:"inline-flex", alignItems:"center", gap:5, height:34, padding:"0 12px", background:"var(--cloud)", border:"1px solid var(--border)", color:"var(--text-secondary)", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"var(--font-body)", marginLeft:"auto" }}><Download size={12}/> Export CSV</button>
            <span style={{ fontSize:12, color:"var(--text-muted)" }}>{filteredAudit.length} of {ALL_ENTRIES.length}</span>
          </div>

          <Panel noPad>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr style={{ background:"var(--sky-100)", borderBottom:"1px solid var(--border)" }}>
                  {["Time","User","Action","Resource","Category","Severity","IP / Location"].map((h) => (<th key={h} style={{ padding:"11px 16px", textAlign:"left", fontWeight:700, fontSize:11, color:"var(--text-muted)", letterSpacing:"0.09em", textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>))}
                </tr>
              </thead>
              <tbody>
                {filteredAudit.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding:"40px 16px", textAlign:"center", color:"var(--text-muted)" }}>No events match your filters.</td></tr>
                ) : filteredAudit.map((e) => {
                  const sc = SEV_COLORS[e.severity];
                  return (
                    <tr key={e.id} style={{ borderBottom:"1px solid var(--border)" }}
                      onMouseEnter={(el) => ((el.currentTarget as HTMLElement).style.background = "var(--sky-50)")}
                      onMouseLeave={(el) => ((el.currentTarget as HTMLElement).style.background = "transparent")}
                    >
                      <td style={{ padding:"12px 16px", fontFamily:"var(--font-mono)", fontSize:11, color:"var(--text-muted)", whiteSpace:"nowrap" }}>{e.time}</td>
                      <td style={{ padding:"12px 16px" }}><div style={{ fontWeight:700, color:"var(--ink)", fontSize:12 }}>{e.user}</div><div style={{ fontSize:11, color:"var(--text-muted)" }}>{e.email}</div></td>
                      <td style={{ padding:"12px 16px" }}><code style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--ocean-600)", background:"var(--ocean-50)", padding:"2px 6px", border:"1px solid var(--ocean-100)" }}>{e.action}</code></td>
                      <td style={{ padding:"12px 16px", color:"var(--text-secondary)", fontSize:12, maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{e.resource}</td>
                      <td style={{ padding:"12px 16px" }}><div style={{ display:"flex", alignItems:"center", gap:5, color:"var(--text-secondary)", fontSize:12 }}>{CATEGORY_ICONS[e.category]}{e.category}</div></td>
                      <td style={{ padding:"12px 16px" }}><span style={{ background:sc.bg, color:sc.color, border:`1px solid ${sc.border}`, fontSize:10, fontWeight:700, padding:"2px 7px", textTransform:"capitalize" }}>{e.severity}</span></td>
                      <td style={{ padding:"12px 16px" }}><div style={{ fontSize:12, fontFamily:"var(--font-mono)", color:"var(--text-muted)" }}>{e.ip}</div><div style={{ fontSize:11, color:"var(--text-muted)" }}>{e.location}</div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Panel>
        </div>
      )}

      {/* ════════════ SECURITY ═════════════════════════════════════════════ */}
      {activeTab === "Security" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ background:"var(--cloud)", border:"1px solid var(--border)", borderLeft:`4px solid ${scoreColor}`, padding:"20px 24px", display:"flex", alignItems:"center", gap:24, boxShadow:"var(--shadow-xs)" }}>
            <div style={{ textAlign:"center", flexShrink:0 }}>
              <div style={{ fontSize:48, fontWeight:900, color:scoreColor, letterSpacing:"-0.04em", lineHeight:1 }}>{secScore}</div>
              <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--text-muted)", marginTop:4 }}>Score / 100</div>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:16, fontWeight:800, color:"var(--ink)", marginBottom:8 }}>
                {secScore>=80 ? "Excellent security posture" : secScore>=60 ? "Good — consider enabling more features" : "Action required — account at risk"}
              </div>
              <div style={{ height:10, background:"var(--sky-200)", marginBottom:8 }}><div style={{ width:`${secScore}%`, height:"100%", background:scoreColor, transition:"width 0.4s ease" }}/></div>
              <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
                {[{label:"MFA",done:mfaEnabled,pts:35},{label:"SSO/SAML",done:ssoEnabled,pts:25},{label:"IP Allowlist",done:ipRestriction,pts:20},{label:"Audit + HTTPS",done:true,pts:20}].map((item) => (
                  <div key={item.label} style={{ display:"flex", alignItems:"center", gap:5, fontSize:12 }}>
                    {item.done ? <Check size={12} color="var(--sage)"/> : <X size={12} color="var(--coral)"/>}
                    <span style={{ color: item.done ? "var(--sage)" : "var(--coral)", fontWeight:700 }}>{item.label}</span>
                    <span style={{ color:"var(--text-muted)" }}>(+{item.pts}pts)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Panel title="Multi-Factor Authentication" subtitle="Require MFA for all workspace members">
              <div style={{ display:"flex", alignItems:"flex-start", gap:14 }}>
                <div style={{ width:40, height:40, background: mfaEnabled ? "var(--ocean-50)" : "var(--sky-100)", border:`1px solid ${mfaEnabled ? "var(--ocean-200)" : "var(--border)"}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Key size={18} color={mfaEnabled ? "var(--ocean-600)" : "var(--text-muted)"}/></div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:"var(--ink)" }}>{mfaEnabled ? "MFA enabled" : "MFA disabled"}</span>
                    <button onClick={() => setMfaEnabled((v)=>!v)} style={{ height:32, padding:"0 14px", background: mfaEnabled ? "transparent" : "var(--ocean-500)", border:`1px solid ${mfaEnabled ? "var(--border)" : "none"}`, color: mfaEnabled ? "var(--text-muted)" : "#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"var(--font-body)" }}>{mfaEnabled ? "Disable" : "Enable"}</button>
                  </div>
                  <p style={{ fontSize:12, color:"var(--text-muted)", lineHeight:1.6 }}>{mfaEnabled ? "All members are required to use an authenticator app or hardware key." : "Enable MFA to protect your workspace from unauthorized access."}</p>
                  {mfaEnabled && <div style={{ marginTop:10, display:"flex", gap:6 }}>{["TOTP","Hardware keys","SMS backup"].map((m) => (<span key={m} style={{ fontSize:11, background:"var(--sky-100)", border:"1px solid var(--border)", padding:"2px 7px", color:"var(--text-secondary)", fontWeight:600 }}>{m}</span>))}</div>}
                </div>
              </div>
            </Panel>

            <Panel title="SSO / SAML 2.0" subtitle="Single sign-on via your identity provider">
              <div style={{ display:"flex", alignItems:"flex-start", gap:14 }}>
                <div style={{ width:40, height:40, background: ssoEnabled ? "var(--ocean-50)" : "var(--sky-100)", border:`1px solid ${ssoEnabled ? "var(--ocean-200)" : "var(--border)"}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><ShieldCheck size={18} color={ssoEnabled ? "var(--ocean-600)" : "var(--text-muted)"}/></div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:"var(--ink)" }}>{ssoEnabled ? "Okta SAML 2.0 — Connected" : "No SSO provider configured"}</span>
                    <button onClick={() => setSsoEnabled((v)=>!v)} style={{ height:32, padding:"0 14px", background: ssoEnabled ? "transparent" : "var(--ocean-500)", border:`1px solid ${ssoEnabled ? "var(--border)" : "none"}`, color: ssoEnabled ? "var(--text-muted)" : "#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"var(--font-body)" }}>{ssoEnabled ? "Disconnect" : "Configure"}</button>
                  </div>
                  <p style={{ fontSize:12, color:"var(--text-muted)", lineHeight:1.6 }}>{ssoEnabled ? "Members must sign in via Okta. Direct password login is disabled." : "Configure SAML 2.0 to let members sign in using your identity provider."}</p>
                </div>
              </div>
            </Panel>

            <Panel title="IP Allowlist" subtitle="Restrict dashboard access by IP address">
              <div style={{ display:"flex", alignItems:"flex-start", gap:14 }}>
                <div style={{ width:40, height:40, background: ipRestriction ? "var(--ocean-50)" : "var(--sky-100)", border:`1px solid ${ipRestriction ? "var(--ocean-200)" : "var(--border)"}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Globe size={18} color={ipRestriction ? "var(--ocean-600)" : "var(--text-muted)"}/></div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:"var(--ink)" }}>{ipRestriction ? `${allowedIps.length} IP range${allowedIps.length!==1?"s":""} allowed` : "No IP restrictions"}</span>
                    <button onClick={() => ipRestriction ? setIpRestriction(false) : setShowIpModal(true)} style={{ height:32, padding:"0 14px", background: ipRestriction ? "transparent" : "var(--ocean-500)", border:`1px solid ${ipRestriction ? "var(--border)" : "none"}`, color: ipRestriction ? "var(--text-muted)" : "#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"var(--font-body)" }}>{ipRestriction ? "Disable" : "Enable"}</button>
                  </div>
                  {ipRestriction && <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:8 }}>{allowedIps.map((ip) => (<span key={ip} style={{ display:"flex", alignItems:"center", gap:5, background:"var(--ocean-50)", border:"1px solid var(--ocean-100)", color:"var(--ocean-700)", fontSize:11, fontWeight:600, padding:"2px 8px", fontFamily:"var(--font-mono)" }}>{ip}<button onClick={() => setAllowedIps((p)=>p.filter((i)=>i!==ip))} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--ocean-500)", lineHeight:1, fontSize:14 }}>×</button></span>))}</div>}
                  <p style={{ fontSize:12, color:"var(--text-muted)", lineHeight:1.6 }}>{ipRestriction ? "Only connections from listed IP ranges can access the dashboard." : "Restrict dashboard access to specific IP addresses or ranges."}</p>
                </div>
              </div>
            </Panel>

            <Panel title="Password Policy" subtitle="Enterprise password requirements">
              <div style={{ display:"grid", gap:10 }}>
                {[{label:"Minimum length",value:"12 characters"},{label:"Require uppercase",value:"At least 1"},{label:"Require numbers & symbols",value:"At least 1 each"},{label:"Password expiry",value:"90 days"},{label:"Prevent reuse",value:"Last 5 passwords"}].map((rule) => (
                  <div key={rule.label} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid var(--border)" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}><Check size={13} color="var(--sage)"/><span style={{ fontSize:13, color:"var(--text-secondary)" }}>{rule.label}</span></div>
                    <span style={{ fontSize:12, fontWeight:700, color:"var(--ink)" }}>{rule.value}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <Panel title="Active Sessions" subtitle={`${sessions.length} active session${sessions.length!==1?"s":""}`} noPad
            action={<button onClick={() => setSessions((p)=>p.filter((s)=>s.current))} style={{ display:"inline-flex", alignItems:"center", gap:5, height:32, padding:"0 14px", background:"transparent", border:"1px solid var(--border)", color:"var(--coral)", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"var(--font-body)" }}>Revoke all other sessions</button>}
          >
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id} style={{ borderBottom:"1px solid var(--border)" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--sky-50)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                  >
                    <td style={{ padding:"14px 20px", width:40 }}><s.DevIcon size={18} color="var(--text-muted)"/></td>
                    <td style={{ padding:"14px 16px" }}>
                      <div style={{ fontWeight:700, color:"var(--ink)", display:"flex", alignItems:"center", gap:8 }}>
                        {s.device}
                        {s.current && <span style={{ fontSize:10, fontWeight:800, background:"var(--ocean-50)", color:"var(--ocean-600)", border:"1px solid var(--ocean-100)", padding:"1px 6px" }}>This device</span>}
                      </div>
                      <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:2 }}>{s.location} · {s.ip}</div>
                    </td>
                    <td style={{ padding:"14px 16px", fontSize:12, color: s.lastActive==="Active now" ? "var(--sage)" : "var(--text-muted)", fontWeight: s.lastActive==="Active now" ? 700 : 400 }}>{s.lastActive}</td>
                    <td style={{ padding:"14px 20px", textAlign:"right" }}>
                      {!s.current && <button onClick={() => setRevokeSessionId(s.id)} style={{ height:28, padding:"0 12px", background:"transparent", border:"1px solid var(--border)", color:"var(--coral)", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"var(--font-body)" }}>Revoke</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          <Panel title="Recent Security Events" subtitle="Last 30 days">
            {SECURITY_EVENTS.map((ev, i) => (
              <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"11px 0", borderBottom: i<SECURITY_EVENTS.length-1 ? "1px solid var(--border)" : "none" }}>
                <div style={{ width:28, height:28, background: ev.ok ? "#F0FDF4" : "#FFF1F2", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  {ev.ok ? <Check size={13} color="var(--sage)"/> : <AlertTriangle size={13} color="var(--coral)"/>}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)" }}>{ev.action}</div>
                  <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:2 }}>{ev.detail}</div>
                </div>
                <div style={{ fontSize:12, color:"var(--text-muted)", flexShrink:0 }}>{ev.time}</div>
              </div>
            ))}
          </Panel>
        </div>
      )}

      {/* ════════════ NOTIFICATIONS ════════════════════════════════════════ */}
      {activeTab === "Notifications" && (
        <Panel title="Notification preferences">
          <div style={{ maxWidth: 520 }}>
            {[
              { label:"Daily click summary",        desc:"Receive a daily digest of link performance.",           on:true  },
              { label:"New team member joined",     desc:"Alert when someone accepts your workspace invite.",     on:true  },
              { label:"Domain verification status", desc:"Get notified when a domain is verified or fails.",      on:true  },
              { label:"Trial expiry reminder",      desc:"Reminder 3 days before your trial ends.",              on:false },
              { label:"Usage limit warnings",       desc:"Notify when you reach 80% of plan limits.",            on:false },
              { label:"Weekly report",              desc:"Weekly summary of workspace performance.",              on:false },
            ].map((n) => (
              <div key={n.label} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 0", borderBottom:"1px solid var(--border)", gap:16 }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)", marginBottom:2 }}>{n.label}</div>
                  <div style={{ fontSize:12, color:"var(--text-muted)" }}>{n.desc}</div>
                </div>
                <ToggleSwitch defaultOn={n.on}/>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* ════════════ DANGER ZONE ══════════════════════════════════════════ */}
      {activeTab === "Danger zone" && (
        <Panel title="Danger zone">
          <div style={{ maxWidth:520, display:"flex", flexDirection:"column", gap:16 }}>
            {[
              { title:"Export workspace data",  desc:"Download all links, analytics, and settings as a JSON file.",                            btnLabel:"Export data",      btnStyle:{ background:"var(--sky-100)", border:"1px solid var(--border)", color:"var(--text-secondary)" } },
              { title:"Delete all links",       desc:"Permanently delete all short links in this workspace. This cannot be undone.",            btnLabel:"Delete all links", btnStyle:{ background:"#FEF2F2", border:"1px solid #FECACA", color:"var(--coral)" } },
              { title:"Delete workspace",       desc:"Permanently delete this workspace and all associated data. This action is irreversible.", btnLabel:"Delete workspace", btnStyle:{ background:"var(--coral)", border:"none", color:"#fff" } },
            ].map((item) => (
              <div key={item.title} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:16, border:"1px solid var(--border)", gap:20, background:"var(--sky-50)" }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)", marginBottom:3 }}>{item.title}</div>
                  <div style={{ fontSize:12, color:"var(--text-muted)" }}>{item.desc}</div>
                </div>
                <button style={{ height:34, padding:"0 14px", fontFamily:"var(--font-body)", fontWeight:700, fontSize:11, letterSpacing:"0.04em", cursor:"pointer", whiteSpace:"nowrap", flexShrink:0, ...item.btnStyle }}>{item.btnLabel}</button>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          MODALS
      ════════════════════════════════════════════════════════════════════ */}

      <Modal open={showKeyModal} onClose={() => setShowKeyModal(false)} title="Create API Key" width={480}>
        <div style={{ marginBottom:16 }}>
          <label style={{ display:"block", fontSize:12, fontWeight:700, color:"var(--text-secondary)", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.07em" }}>Key name *</label>
          <input value={newKeyName} onChange={(e)=>setNewKeyName(e.target.value)} placeholder="e.g. Production API, CI/CD Pipeline…" style={{ width:"100%", height:38, padding:"0 12px", border:"1px solid var(--border)", background:"var(--sky-100)", fontSize:13, fontFamily:"var(--font-body)", color:"var(--ink)", outline:"none", boxSizing:"border-box" }} onFocus={focusInput} onBlur={blurInput}/>
        </div>
        <div style={{ marginBottom:20 }}>
          <label style={{ display:"block", fontSize:12, fontWeight:700, color:"var(--text-secondary)", marginBottom:10, textTransform:"uppercase", letterSpacing:"0.07em" }}>Permissions</label>
          <div style={{ display:"flex", gap:8 }}>
            {["read","write","delete"].map((perm) => { const c=PERM_COLORS[perm]; const active=newPerms.includes(perm); return (<button key={perm} onClick={() => setNewPerms((prev)=>active?prev.filter((p)=>p!==perm):[...prev,perm])} style={{ height:34, padding:"0 14px", background:active?c.bg:"var(--sky-100)", border:`1px solid ${active?c.border:"var(--border)"}`, color:active?c.color:"var(--text-muted)", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"var(--font-body)", textTransform:"capitalize" }}>{perm}</button>); })}
          </div>
        </div>
        <div style={{ background:"#FFFBEB", border:"1px solid #FCD34D", padding:"10px 14px", marginBottom:20 }}>
          <p style={{ fontSize:12, color:"#92400E" }}>The key will only be shown once. Store it securely immediately after creation.</p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={handleCreateKey} disabled={!newKeyName.trim()||newPerms.length===0} style={{ flex:1, height:40, background:newKeyName.trim()?"var(--ocean-500)":"var(--sky-200)", border:"none", color:newKeyName.trim()?"#fff":"var(--text-muted)", fontSize:13, fontWeight:700, cursor:newKeyName.trim()?"pointer":"not-allowed", fontFamily:"var(--font-body)" }}>Create Key</button>
          <button onClick={() => setShowKeyModal(false)} style={{ height:40, padding:"0 18px", background:"transparent", border:"1px solid var(--border)", color:"var(--text-muted)", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"var(--font-body)" }}>Cancel</button>
        </div>
      </Modal>

      <Modal open={!!revokeKeyId} onClose={() => setRevokeKeyId(null)} title="Revoke API key?" width={400}>
        <p style={{ fontSize:13, color:"var(--text-secondary)", lineHeight:1.6, marginBottom:20 }}>This key will be permanently revoked. Any applications using it will immediately lose API access.</p>
        <div style={{ display:"flex", justifyContent:"flex-end", gap:10 }}>
          <button onClick={() => setRevokeKeyId(null)} style={{ height:36, padding:"0 16px", background:"transparent", border:"1px solid var(--border)", color:"var(--text-muted)", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"var(--font-body)" }}>Cancel</button>
          <button onClick={() => revokeKeyId&&handleRevokeKey(revokeKeyId)} style={{ height:36, padding:"0 16px", background:"var(--coral)", border:"none", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"var(--font-body)" }}>Revoke key</button>
        </div>
      </Modal>

      <Modal open={showHookModal} onClose={() => setShowHookModal(false)} title="Add Webhook Endpoint" width={560}>
        {[{label:"Endpoint name *",key:"name",placeholder:"e.g. Slack Alerts"},{label:"URL *",key:"url",placeholder:"https://your-server.com/webhooks/urlify"}].map((f) => (
          <div key={f.key} style={{ marginBottom:16 }}>
            <label style={{ display:"block", fontSize:12, fontWeight:700, color:"var(--text-secondary)", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.07em" }}>{f.label}</label>
            <input value={hookForm[f.key as keyof typeof hookForm] as string} onChange={(e)=>setHookForm((p)=>({...p,[f.key]:e.target.value}))} placeholder={f.placeholder} style={{ width:"100%", height:38, padding:"0 12px", border:"1px solid var(--border)", background:"var(--sky-100)", fontSize:13, fontFamily:"var(--font-body)", color:"var(--ink)", outline:"none", boxSizing:"border-box" }} onFocus={focusInput} onBlur={blurInput}/>
          </div>
        ))}
        <div style={{ marginBottom:20 }}>
          <label style={{ display:"block", fontSize:12, fontWeight:700, color:"var(--text-secondary)", marginBottom:10, textTransform:"uppercase", letterSpacing:"0.07em" }}>Subscribe to events *</label>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
            {EVENT_TYPES.map((ev) => { const checked=hookForm.events.includes(ev); return (<label key={ev} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 10px", border:`1px solid ${checked?"var(--ocean-300)":"var(--border)"}`, background:checked?"var(--ocean-50)":"var(--sky-100)", cursor:"pointer" }}><input type="checkbox" checked={checked} onChange={() => setHookForm((p)=>({...p,events:checked?p.events.filter((e)=>e!==ev):[...p.events,ev]}))} style={{ accentColor:"var(--ocean-500)" }}/><code style={{ fontFamily:"var(--font-mono)", fontSize:11, color:checked?"var(--ocean-700)":"var(--text-secondary)" }}>{ev}</code></label>); })}
          </div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={handleCreateHook} disabled={!hookForm.name||!hookForm.url||hookForm.events.length===0} style={{ flex:1, height:40, background:hookForm.name&&hookForm.url&&hookForm.events.length>0?"var(--ocean-500)":"var(--sky-200)", border:"none", color:hookForm.name&&hookForm.url&&hookForm.events.length>0?"#fff":"var(--text-muted)", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"var(--font-body)" }}>Add Webhook</button>
          <button onClick={() => setShowHookModal(false)} style={{ height:40, padding:"0 18px", background:"transparent", border:"1px solid var(--border)", color:"var(--text-muted)", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"var(--font-body)" }}>Cancel</button>
        </div>
      </Modal>

      <Modal open={!!deleteHookId} onClose={() => setDeleteHookId(null)} title="Delete webhook?" width={400}>
        <p style={{ fontSize:13, color:"var(--text-secondary)", lineHeight:1.6, marginBottom:20 }}>This endpoint will be permanently removed. No more events will be sent to it.</p>
        <div style={{ display:"flex", justifyContent:"flex-end", gap:10 }}>
          <button onClick={() => setDeleteHookId(null)} style={{ height:36, padding:"0 16px", background:"transparent", border:"1px solid var(--border)", color:"var(--text-muted)", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"var(--font-body)" }}>Cancel</button>
          <button onClick={() => deleteHookId&&handleDeleteHook(deleteHookId)} style={{ height:36, padding:"0 16px", background:"var(--coral)", border:"none", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"var(--font-body)" }}>Delete</button>
        </div>
      </Modal>

      <Modal open={!!revokeSessionId} onClose={() => setRevokeSessionId(null)} title="Revoke session?" width={400}>
        <p style={{ fontSize:13, color:"var(--text-secondary)", lineHeight:1.6, marginBottom:20 }}>This will immediately sign out that device. The user will need to sign in again.</p>
        <div style={{ display:"flex", justifyContent:"flex-end", gap:10 }}>
          <button onClick={() => setRevokeSessionId(null)} style={{ height:36, padding:"0 16px", background:"transparent", border:"1px solid var(--border)", color:"var(--text-muted)", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"var(--font-body)" }}>Cancel</button>
          <button onClick={() => { if(revokeSessionId){setSessions((p)=>p.filter((s)=>s.id!==revokeSessionId));setRevokeSessionId(null);} }} style={{ height:36, padding:"0 16px", background:"var(--coral)", border:"none", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"var(--font-body)" }}>Revoke</button>
        </div>
      </Modal>

      <Modal open={showIpModal} onClose={() => setShowIpModal(false)} title="Configure IP Allowlist" width={440}>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:12, fontWeight:700, color:"var(--text-secondary)", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.07em" }}>Add IP / CIDR range</label>
          <div style={{ display:"flex", gap:8 }}>
            <input value={ipInput} onChange={(e)=>setIpInput(e.target.value)} placeholder="e.g. 192.168.1.0/24" onKeyDown={(e)=>{if(e.key==="Enter"&&ipInput.trim()){setAllowedIps((p)=>[...p,ipInput.trim()]);setIpInput("");}}} style={{ flex:1, height:38, padding:"0 12px", border:"1px solid var(--border)", background:"var(--sky-100)", fontSize:13, fontFamily:"var(--font-mono)", color:"var(--ink)", outline:"none" }}/>
            <button onClick={() => {if(ipInput.trim()){setAllowedIps((p)=>[...p,ipInput.trim()]);setIpInput("");}}} style={{ height:38, padding:"0 14px", background:"var(--ocean-500)", border:"none", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"var(--font-body)" }}>Add</button>
          </div>
        </div>
        <div style={{ marginBottom:20 }}>
          {allowedIps.map((ip) => (<div key={ip} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"7px 10px", background:"var(--sky-100)", border:"1px solid var(--border)", marginBottom:5, fontFamily:"var(--font-mono)", fontSize:13, color:"var(--ocean-600)" }}>{ip}<button onClick={() => setAllowedIps((p)=>p.filter((i)=>i!==ip))} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--coral)", fontSize:16 }}>×</button></div>))}
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={() => {setIpRestriction(true);setShowIpModal(false);}} style={{ flex:1, height:40, background:"var(--ocean-500)", border:"none", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"var(--font-body)" }}>Enable & Save</button>
          <button onClick={() => setShowIpModal(false)} style={{ height:40, padding:"0 16px", background:"transparent", border:"1px solid var(--border)", color:"var(--text-muted)", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"var(--font-body)" }}>Cancel</button>
        </div>
      </Modal>
    </div>
  );
}
