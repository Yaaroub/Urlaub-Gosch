import { createSession, getCurrentSessionAndUser, isStaffRole, sessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Renews the short-lived staff token while the admin is active.
 * Called by AdminIdleTimeout; the absolute 12-hour limit is kept via authTime.
 */
export async function POST(req) {
  const current = await getCurrentSessionAndUser(req);
  if (!current || !isStaffRole(current.user.role)) {
    return Response.json({ error: "Nicht angemeldet." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const token = await createSession(current.user, { authTime: current.session.authTime });
  return Response.json(
    { ok: true, sessionTimeoutMinutes: current.user.sessionTimeoutMinutes },
    { headers: { "Set-Cookie": sessionCookie(token), "Cache-Control": "no-store" } }
  );
}
