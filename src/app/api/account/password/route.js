import prisma from "@/lib/db";
import { getVerifiedSession, createSession, sessionCookie } from "@/lib/auth";
import bcrypt from "bcrypt";

export async function PUT(req) {
  const session = await getVerifiedSession(req);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword)
      return Response.json({ error: "Bitte beide Felder ausfüllen" }, { status: 400 });
    if (newPassword.length < 8)
      return Response.json({ error: "Neues Passwort zu kurz (min. 8 Zeichen)" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) return Response.json({ error: "User nicht gefunden" }, { status: 404 });

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return Response.json({ error: "Altes Passwort ist falsch" }, { status: 401 });

    const hash = await bcrypt.hash(newPassword, 12);
    const updated = await prisma.user.update({ where: { id: session.userId }, data: { password: hash, sessionVersion: { increment: 1 } } });

    const token = await createSession(updated);
    return Response.json({ ok: true }, { headers: { "Set-Cookie": sessionCookie(token) } });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Passwort-Update fehlgeschlagen" }, { status: 500 });
  }
}
