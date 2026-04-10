import type { Workspace } from "../types/workspace";

export function isPaidPlan(plan: Workspace["plan"]): boolean {
  return plan === "growth" || plan === "enterprise";
}

export function isTrialActive(trialEndsAt?: string): boolean {
  if (!trialEndsAt) return false;
  return new Date(trialEndsAt).getTime() > Date.now();
}

export function getDaysUntil(isoDate: string): number {
  const msDiff = new Date(isoDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(msDiff / (24 * 60 * 60 * 1000)));
}

export function hasPlatformAccess(workspace: Pick<Workspace, "plan" | "trialEndsAt">): boolean {
  return isPaidPlan(workspace.plan) || isTrialActive(workspace.trialEndsAt);
}
