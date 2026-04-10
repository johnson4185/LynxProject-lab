import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import PlatformLayout from "@/platform/components/PlatformLayout";
import { getCurrentUser, isAuthenticated, resolveSessionMode } from "@/platform/lib/auth";
import { getCurrentWorkspace } from "@/platform/lib/workspace";
import { getDaysUntil, isTrialActive, isPaidPlan } from "@/platform/lib/access";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionMode = resolveSessionMode(cookieStore.get("sniply_session")?.value);

  if (!isAuthenticated(sessionMode)) {
    redirect("/auth?next=%2Fdashboard");
  }

  const user = getCurrentUser(sessionMode);
  const workspace = getCurrentWorkspace(sessionMode);

  if (!user || !workspace) {
    redirect("/auth?next=%2Fdashboard");
  }

  const trialDaysLeft = !isPaidPlan(workspace.plan) && isTrialActive(workspace.trialEndsAt)
    ? getDaysUntil(workspace.trialEndsAt!)
    : null;

  return (
    <PlatformLayout
      workspaceName={workspace.name}
      userName={user.name}
      workspacePlan={workspace.plan}
      trialDaysLeft={trialDaysLeft}
    >
      {children}
    </PlatformLayout>
  );
}
