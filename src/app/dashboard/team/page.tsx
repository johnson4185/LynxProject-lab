"use client";

import { useState } from "react";
import { Plus, X, Trash2, MoreHorizontal, Shield, User, Eye } from "lucide-react";
import PageHeader from "@/platform/components/PageHeader";
import Panel from "@/platform/components/Panel";
import { dashboardData } from "@/platform/lib/dashboardData";

const ROLE_STYLES: Record<string, { bg: string; color: string }> = {
  Owner: { bg: "var(--ocean-50)", color: "var(--ocean-700)" },
  Admin: { bg: "#F0FDF4", color: "#166534" },
  Member: { bg: "var(--sky-100)", color: "var(--text-secondary)" },
  Viewer: { bg: "var(--sky-200)", color: "var(--text-muted)" },
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  Owner: <Shield size={11} />,
  Admin: <Shield size={11} />,
  Member: <User size={11} />,
  Viewer: <Eye size={11} />,
};

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  Active: { bg: "#F0FDF4", color: "#166534" },
  Invited: { bg: "#FFFBEB", color: "#92400E" },
};

export default function TeamPage() {
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Member");

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <PageHeader
        title="Team & Workspace"
        description="Invite members, assign roles, and manage your team's access."
        breadcrumb="Workspace"
        action={
          <button
            onClick={() => setShowInvite(true)}
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
            Invite member
          </button>
        }
      />

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total members", value: dashboardData.team.length },
          { label: "Active", value: dashboardData.team.filter((m) => m.status === "Active").length },
          { label: "Invited", value: dashboardData.team.filter((m) => m.status === "Invited").length },
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>
        {/* Members table */}
        <Panel title="Members" subtitle={`${dashboardData.team.length} workspace members`} noPad>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--sky-100)", borderBottom: "1px solid var(--border)" }}>
                {["Member", "Role", "Status", "Last active", "Actions"].map((h) => (
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
              {dashboardData.team.map((member) => {
                const roleStyle = ROLE_STYLES[member.role] ?? ROLE_STYLES.Member;
                const statusStyle = STATUS_STYLES[member.status] ?? STATUS_STYLES.Active;
                const initials = member.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase();
                return (
                  <tr
                    key={member.id}
                    style={{ borderBottom: "1px solid var(--border)" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--sky-50)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                  >
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            background: "var(--ocean-800)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            fontWeight: 800,
                            color: "#fff",
                            flexShrink: 0,
                          }}
                        >
                          {initials}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: "var(--ink)", fontSize: 13 }}>{member.name}</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          background: roleStyle.bg,
                          color: roleStyle.color,
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 9px",
                          border: `1px solid ${roleStyle.color}33`,
                        }}
                      >
                        {ROLE_ICONS[member.role]}
                        {member.role}
                      </span>
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
                        {member.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px", color: "var(--text-muted)", fontSize: 12 }}>
                      {member.lastActive}
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {member.role !== "Owner" && (
                          <>
                            <button
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
                              title="More"
                            >
                              <MoreHorizontal size={11} />
                            </button>
                            <button
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
                              title="Remove"
                            >
                              <Trash2 size={11} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>

        {/* Roles guide */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Panel title="Role permissions">
            <div style={{ display: "grid", gap: 10 }}>
              {[
                { role: "Owner", desc: "Full access. Manages billing, domains, and all settings." },
                { role: "Admin", desc: "Can manage links, campaigns, team, and most settings." },
                { role: "Member", desc: "Can create and manage their own links and campaigns." },
                { role: "Viewer", desc: "Read-only access to all workspace data and analytics." },
              ].map((r) => {
                const style = ROLE_STYLES[r.role];
                return (
                  <div
                    key={r.role}
                    style={{
                      display: "flex",
                      gap: 10,
                      padding: "10px 0",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        background: style.bg,
                        color: style.color,
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 7px",
                        border: `1px solid ${style.color}33`,
                        flexShrink: 0,
                        height: 20,
                        marginTop: 1,
                      }}
                    >
                      {ROLE_ICONS[r.role]}
                      {r.role}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{r.desc}</span>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title="Seat usage">
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
                <span style={{ color: "var(--text-muted)" }}>Members used</span>
                <strong style={{ color: "var(--ink)" }}>
                  {dashboardData.team.length} / 10
                </strong>
              </div>
              <div style={{ height: 6, background: "var(--sky-200)" }}>
                <div
                  style={{
                    width: `${(dashboardData.team.length / 10) * 100}%`,
                    height: "100%",
                    background: "var(--ocean-500)",
                  }}
                />
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
                7 seats remaining on Growth plan
              </div>
            </div>
          </Panel>
        </div>
      </div>

      {/* Invite modal */}
      {showInvite && (
        <>
          <div style={{ position: "fixed", inset: 0, background: "rgba(7,27,44,0.45)", zIndex: 200 }} onClick={() => setShowInvite(false)} />
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              width: 440,
              background: "var(--cloud)",
              border: "1px solid var(--border)",
              zIndex: 201,
              boxShadow: "var(--shadow-xl)",
            }}
          >
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)" }}>Invite team member</h2>
              <button onClick={() => setShowInvite(false)} style={{ background: "none", border: "1px solid var(--border)", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <X size={14} />
              </button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 5 }}>
                  Email address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  style={{ width: "100%", height: 40, padding: "0 12px", border: "1px solid var(--border)", background: "var(--sky-100)", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink)", outline: "none" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--ocean-500)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 5 }}>
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{ width: "100%", height: 40, padding: "0 12px", border: "1px solid var(--border)", background: "var(--sky-100)", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink)", outline: "none" }}
                >
                  {["Admin", "Member", "Viewer"].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setShowInvite(false)}
                  style={{ flex: 1, height: 40, background: "var(--ocean-500)", color: "#fff", border: "none", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer" }}
                >
                  Send invite
                </button>
                <button
                  onClick={() => setShowInvite(false)}
                  style={{ height: 40, padding: "0 18px", background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12, cursor: "pointer" }}
                >
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
