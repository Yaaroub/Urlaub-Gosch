import prisma from "@/lib/db";
import { createSession, sessionCookie } from "@/lib/auth";
import {
  checkLoginLimit,
  normalizeEmail,
  recordLoginFailure,
  recordLoginSuccess,
  verifyPasswordConstantTime,
} from "@/lib/rate-limit";
import { logError } from "@/lib/safe-log";

const INVALID = "Ungültige Zugangsdaten";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => null);
    const email = normalizeEmail(body?.email);
    const password = typeof body?.password === "string" ? body.password : "";
    if (!email || !password || email.length > 254 || password.length > 1024) {
      return Response.json({ error: "Email & Passwort erforderlich" }, { status: 400 });
    }

    const limited = checkLoginLimit(req, "customer", email);
    if (limited) return limited;

    // Case-insensitive so older accounts registered with capital letters still work.
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      orderBy: { id: "asc" },
      select: { id: true, email: true, password: true, role: true, isActive: true, sessionVersion: true },
    });

    // Customer login is for customer accounts only; staff use /admin/login.
    const candidate = user && user.isActive && user.role === "USER" ? user : null;
    const ok = await verifyPasswordConstantTime(password, candidate?.password);
    if (!candidate || !ok) {
      recordLoginFailure("customer", email);
      return Response.json({ error: INVALID }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }
    recordLoginSuccess("customer", email);

    const token = await createSession(candidate);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Set-Cookie": sessionCookie(token), "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch (e) {
    logError("POST /api/auth/login failed:", e);
    return Response.json({ error: "Login fehlgeschlagen" }, { status: 500 });
  }
}
