import prisma from "@/lib/db";
import { requireCustomerSession, createSession, sessionCookie } from "@/lib/auth";
import bcrypt from "bcrypt";
import { checkLoginLimit, passwordProblem, recordLoginFailure, verifyPasswordConstantTime } from "@/lib/rate-limit";
import { logError } from "@/lib/safe-log";

export async function PUT(req) {
  const auth = await requireCustomerSession(req);
  if (!auth.ok) return auth.response;
  const { session } = auth;

  try {
    const body = await req.json().catch(() => null);
    const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = body?.newPassword;
    if (!currentPassword || !newPassword)
      return Response.json({ error: "Bitte beide Felder ausfüllen" }, { status: 400 });
    const problem = passwordProblem(newPassword);
    if (problem) return Response.json({ error: problem }, { status: 400 });

    const limited = checkLoginLimit(req, "account-password", String(session.userId));
    if (limited) return limited;

    const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true, password: true } });
    if (!user) return Response.json({ error: "User nicht gefunden" }, { status: 404 });

    if (!(await verifyPasswordConstantTime(currentPassword, user.password))) {
      recordLoginFailure("account-password", String(session.userId));
      return Response.json({ error: "Altes Passwort ist falsch" }, { status: 401 });
    }

    const hash = await bcrypt.hash(newPassword, 12);
    const updated = await prisma.user.update({
      where: { id: session.userId },
      data: { password: hash, passwordChangedAt: new Date(), sessionVersion: { increment: 1 } },
      select: { id: true, email: true, sessionVersion: true },
    });

    const token = await createSession(updated);
    return Response.json({ ok: true }, { headers: { "Set-Cookie": sessionCookie(token), "Cache-Control": "no-store" } });
  } catch (e) {
    logError("PUT /api/account/password failed:", e);
    return Response.json({ error: "Passwort-Update fehlgeschlagen" }, { status: 500 });
  }
}
