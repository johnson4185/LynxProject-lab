"use client";

import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import type { Workspace } from "../types/workspace";

type PlatformLayoutProps = {
  children: React.ReactNode;
  workspaceName: string;
  userName: string;
  workspacePlan: Workspace["plan"];
  trialDaysLeft: number | null;
};

export default function PlatformLayout({
  children,
  workspaceName,
  userName,
  workspacePlan,
  trialDaysLeft,
}: PlatformLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="platform-shell" style={{ display: "flex", minHeight: "100vh", background: "var(--background)" }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div
        style={{
          marginLeft: collapsed ? 60 : 224,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          transition: "margin-left 0.22s cubic-bezier(0.25,0.46,0.45,0.94)",
        }}
      >
        <Topbar
          workspaceName={workspaceName}
          userName={userName}
          workspacePlan={workspacePlan}
          trialDaysLeft={trialDaysLeft}
        />
        <main className="platform-content-root" style={{ flex: 1, minWidth: 0 }}>
          <div className="platform-page-frame">{children}</div>
        </main>
      </div>
    </div>
  );
}
