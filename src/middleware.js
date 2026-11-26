import { NextResponse } from "next/server";

/**
 * Second line of defence for the admin API.
 *
 * Every /api/admin route still checks the session itself (that is the real
 * check). This middleware only rejects requests early that carry no session
 * cookie at all, so a forgotten check in a future route cannot expose data
 * to anonymous visitors.
 *
 * Not affected: public routes such as /api/ical/..., /api/bookings,
 * /api/properties, /api/booking-request and /api/contact.
 */

const PUBLIC_ADMIN_PATHS = new Set(["/api/admin/login"]);

export function middleware(request) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_ADMIN_PATHS.has(pathname.replace(/\/+$/, ""))) return NextResponse.next();

  if (!request.cookies.get("session")?.value) {
    return NextResponse.json(
      { error: "Nicht angemeldet." },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/admin/:path*"],
};
