import { mockWorkspace } from "../mock/mockWorkspace";
import type { SessionMode } from "./auth";
import { getTrialEndsAt } from "./auth";
import type { Workspace } from "../types/workspace";

export function getCurrentWorkspace(mode: SessionMode): Workspace | null {
  if (mode === "signed-out") return null;
  return {
    ...mockWorkspace,
    plan: mode === "paid" ? "growth" : "free",
    trialEndsAt: getTrialEndsAt(mode),
  };
}
