import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function unauthorized() {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Admin", charset="UTF-8"' },
  });
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Nur Admin-Bereich schützen
  const protectedPaths = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (!protectedPaths) return NextResponse.next();

  const header = req.headers.get("authorization");
  if (!header || !header.startsWith("Basic ")) return unauthorized();

  const creds = Buffer.from(header.split(" ")[1], "base64").toString("utf8");
  const [user, pass] = creds.split(":");

  if (user !== process.env.ADMIN_USER || pass !== process.env.ADMIN_PASS) {
    return unauthorized();
  }

  return NextResponse.next();
}

// Welche Routen abfangen?
export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
