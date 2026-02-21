import { mockUser } from "../mock/mockUser";
import type { User } from "../types/user";

export type SessionMode = "signed-out" | "trial" | "paid" | "expired";

export function resolveSessionMode(rawCookieValue?: string): SessionMode {
  if (rawCookieValue === "trial") return "trial";
  if (rawCookieValue === "paid") return "paid";
  if (rawCookieValue === "expired") return "expired";
  return "signed-out";
}

export function isAuthenticated(mode: SessionMode): boolean {
  return mode !== "signed-out";
}

export function getTrialEndsAt(mode: SessionMode, now = Date.now()): string | undefined {
  const dayMs = 24 * 60 * 60 * 1000;
  if (mode === "trial") return new Date(now + 13 * dayMs).toISOString();
  if (mode === "expired") return new Date(now - 2 * dayMs).toISOString();
  return undefined;
}

export function getCurrentUser(mode: SessionMode): User | null {
  if (!isAuthenticated(mode)) return null;
  return {
    ...mockUser,
    trialEndsAt: getTrialEndsAt(mode),
  };
}
