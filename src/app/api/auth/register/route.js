import prisma from "@/lib/db";
import bcrypt from "bcrypt";
import { createSession, sessionCookie } from "@/lib/auth";
import { clientIp, hit, isValidEmail, normalizeEmail, passwordProblem, retryAfterSeconds } from "@/lib/rate-limit";

const REGISTER_WINDOW_MS = 60 * 60 * 1000;
const REGISTER_MAX_PER_IP = 5;

export async function POST(req) {
  try {
    const ipKey = `register:ip:${clientIp(req)}`;
    if (hit(ipKey, REGISTER_WINDOW_MS) > REGISTER_MAX_PER_IP) {
      return Response.json(
        { error: "Zu viele Registrierungen. Bitte später erneut versuchen." },
        { status: 429, headers: { "Retry-After": String(retryAfterSeconds(ipKey)) } }
      );
    }

    const body = await req.json().catch(() => null);
    const email = normalizeEmail(body?.email);
    const password = body?.password;
    const name = typeof body?.name === "string" ? body.name.trim().slice(0, 100) : "";

    if (!isValidEmail(email)) {
      return Response.json({ error: "Bitte eine gültige E-Mail-Adresse angeben." }, { status: 400 });
    }
    const problem = passwordProblem(password);
    if (problem) return Response.json({ error: problem }, { status: 400 });

    const exists = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true },
    });
    if (exists) return Response.json({ error: "Email bereits registriert" }, { status: 409 });

    const hash = await bcrypt.hash(password, 12);
    // Role is never taken from the request: new accounts are always customers (schema default USER).
    const user = await prisma.user.create({
      data: { email, name: name || null, password: hash },
      select: { id: true, email: true, sessionVersion: true },
    });

    const token = await createSession(user);
    return new Response(JSON.stringify({ ok: true }), {
      status: 201,
      headers: { "Set-Cookie": sessionCookie(token), "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch (e) {
    if (e?.code === "P2002") return Response.json({ error: "Email bereits registriert" }, { status: 409 });
    console.error("POST /api/auth/register failed:", e);
    return Response.json({ error: "Register fehlgeschlagen" }, { status: 500 });
  }
}
