import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

// Protects the admin UI and the appointments API. Runs on the edge; verifySession
// uses jose (Web Crypto), which is edge-compatible.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);

  const isLoginPage = pathname === "/admin/login";
  const isAuthApi = pathname === "/api/admin/login" || pathname === "/api/admin/logout";

  // API: everything except the auth endpoints requires a valid session.
  if (pathname.startsWith("/api/") && !isAuthApi) {
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Admin pages: redirect to login when unauthenticated (except the login page itself).
  if (pathname.startsWith("/admin") && !isLoginPage) {
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Already logged in and visiting the login page → send to dashboard.
  if (isLoginPage && session) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
