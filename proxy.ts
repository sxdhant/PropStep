import { NextResponse, type NextRequest } from "next/server";
import { readToken, SESSION_COOKIE } from "@/lib/auth";

/** Gate /admin pages and /api/admin routes behind a valid session cookie (role checks happen in handlers). */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin/login" || pathname === "/admin/login/" || pathname.startsWith("/api/admin/auth/login")) return NextResponse.next();

  const session = await readToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ ok: false, error: "Unauthorised" }, { status: 401 });
    return NextResponse.redirect(new URL("/admin/login/", req.url));
  }
  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
