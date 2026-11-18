import prisma from "@/lib/db";
import { requireCustomerSession, clearSessionCookie } from "@/lib/auth";
import { checkLoginLimit, recordLoginFailure, verifyPasswordConstantTime } from "@/lib/rate-limit";
import { logError } from "@/lib/safe-log";

export async function POST(req) {
  const auth = await requireCustomerSession(req);
  if (!auth.ok) return auth.response;
  const { session } = auth;

  try {
    const body = await req.json().catch(() => null);
    const password = typeof body?.password === "string" ? body.password : "";

    // Deleting an account is irreversible: always require the current password.
    if (!password) {
      return Response.json({ error: "Bitte zur Bestätigung das Passwort eingeben." }, { status: 400 });
    }

    const limited = checkLoginLimit(req, "account-delete", String(session.userId));
    if (limited) return limited;

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, password: true, role: true },
    });
    if (!user || user.role !== "USER") return Response.json({ error: "User nicht gefunden" }, { status: 404 });

    if (!(await verifyPasswordConstantTime(password, user.password))) {
      recordLoginFailure("account-delete", String(session.userId));
      return Response.json({ error: "Passwort falsch" }, { status: 401 });
    }

    // Favorites are removed by onDelete: Cascade; deleteMany kept for clarity in one transaction.
    await prisma.$transaction([
      prisma.favorite.deleteMany({ where: { userId: user.id } }),
      prisma.user.delete({ where: { id: user.id } }),
    ]);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Set-Cookie": clearSessionCookie(), "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch (e) {
    logError("POST /api/account/delete failed:", e);
    return Response.json({ error: "Konto löschen fehlgeschlagen" }, { status: 500 });
  }
}
