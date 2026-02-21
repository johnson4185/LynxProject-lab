import { NextRequest, NextResponse } from "next/server";

const VALID_MODES = new Set(["signed-out", "trial", "paid", "expired"]);

export async function GET(request: NextRequest) {
  const modeParam = request.nextUrl.searchParams.get("mode") ?? "signed-out";
  const next = request.nextUrl.searchParams.get("next") ?? "/";
  const safeNext = next.startsWith("/") ? next : "/";
  const mode = VALID_MODES.has(modeParam) ? modeParam : "signed-out";

  const response = NextResponse.redirect(new URL(safeNext, request.url));
  response.cookies.set("sniply_session", mode, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return response;
}
