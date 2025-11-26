import prisma from "@/lib/db";
import bcrypt from "bcrypt";
import { createSession, sessionCookie } from "@/lib/auth";

export async function POST(req) {
  try {
    const { email, password, name } = await req.json();
    if (!email || !password) return Response.json({ error: "Email & Passwort erforderlich" }, { status: 400 });

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return Response.json({ error: "Email bereits registriert" }, { status: 409 });

    const hash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { email, name: name || null, password: hash } });

    const token = await createSession(user);
    return new Response(JSON.stringify({ ok: true }), {
      status: 201,
      headers: { "Set-Cookie": sessionCookie(token), "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Register fehlgeschlagen" }, { status: 500 });
  }
}
