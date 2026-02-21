import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isAuthenticated(mode: string | undefined): boolean {
  return mode === "trial" || mode === "paid" || mode === "expired";
}

function hasPlatformAccess(mode: string | undefined): boolean {
  return mode === "trial" || mode === "paid";
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  const mode = request.cookies.get("sniply_session")?.value;

  if (!isAuthenticated(mode)) {
    const authUrl = new URL("/auth", request.url);
    authUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(authUrl);
  }

  if (pathname.startsWith("/dashboard/billing")) {
    return NextResponse.next();
  }

  if (!hasPlatformAccess(mode)) {
    return NextResponse.redirect(new URL("/dashboard/billing", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
