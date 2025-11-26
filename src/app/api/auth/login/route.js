import prisma from "@/lib/db";
import bcrypt from "bcrypt";
import { createSession, sessionCookie } from "@/lib/auth";

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return Response.json({ error: "Email & Passwort erforderlich" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return Response.json({ error: "Ungültige Zugangsdaten" }, { status: 401 });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return Response.json({ error: "Ungültige Zugangsdaten" }, { status: 401 });

    const token = await createSession(user);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Set-Cookie": sessionCookie(token), "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Login fehlgeschlagen" }, { status: 500 });
  }
}
