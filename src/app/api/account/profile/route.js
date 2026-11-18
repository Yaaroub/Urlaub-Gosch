import prisma from "@/lib/db";
import { requireCustomerSession, createSession, sessionCookie } from "@/lib/auth";
import {
  checkLoginLimit,
  isValidEmail,
  normalizeEmail,
  recordLoginFailure,
  verifyPasswordConstantTime,
} from "@/lib/rate-limit";
import { logError } from "@/lib/safe-log";

export async function PUT(req) {
  const auth = await requireCustomerSession(req);
  if (!auth.ok) return auth.response;
  const { session } = auth;

  try {
    const body = await req.json().catch(() => null);
    const email = normalizeEmail(body?.email);
    const name = typeof body?.name === "string" ? body.name.trim().slice(0, 100) : null;
    const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";

    if (!isValidEmail(email)) {
      return Response.json({ error: "Bitte eine gültige E-Mail-Adresse angeben." }, { status: 400 });
    }

    const current = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, password: true },
    });
    if (!current) return Response.json({ error: "User nicht gefunden" }, { status: 404 });

    const emailChanges = normalizeEmail(current.email) !== email;
    let sessionVersionBump = {};

    if (emailChanges) {
      // Changing the login e-mail is an account-takeover vector: require the password.
      if (!currentPassword) {
        return Response.json(
          { error: "Zum Ändern der E-Mail bitte das aktuelle Passwort eingeben." },
          { status: 400 }
        );
      }
      const limited = checkLoginLimit(req, "account-profile", String(session.userId));
      if (limited) return limited;
      if (!(await verifyPasswordConstantTime(currentPassword, current.password))) {
        recordLoginFailure("account-profile", String(session.userId));
        return Response.json({ error: "Passwort falsch" }, { status: 401 });
      }

      const existing = await prisma.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" }, NOT: { id: session.userId } },
        select: { id: true },
      });
      if (existing) return Response.json({ error: "E-Mail bereits vergeben" }, { status: 409 });

      // Sign out other devices after an e-mail change.
      sessionVersionBump = { sessionVersion: { increment: 1 } };
    }

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: { name: name || null, ...(emailChanges ? { email } : {}), ...sessionVersionBump },
      select: { id: true, email: true, name: true, sessionVersion: true },
    });

    const token = await createSession(user);
    return new Response(JSON.stringify({ ok: true, user: { id: user.id, email: user.email, name: user.name } }), {
      status: 200,
      headers: { "Set-Cookie": sessionCookie(token), "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch (e) {
    if (e?.code === "P2002") return Response.json({ error: "E-Mail bereits vergeben" }, { status: 409 });
    logError("PUT /api/account/profile failed:", e);
    return Response.json({ error: "Profil-Update fehlgeschlagen" }, { status: 500 });
  }
}
