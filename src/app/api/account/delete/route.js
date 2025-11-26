import prisma from "@/lib/db";
import { getSession, clearSessionCookie } from "@/lib/auth";
import bcrypt from "bcrypt";

export async function POST(req) {
  const session = await getSession(req);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { confirmText, password } = await req.json();

    // Entweder Sicherheitswort oder Passwort verlangen (entscheide frei)
    if (!password && confirmText !== "DELETE ME") {
      return Response.json({ error: "Bestätigung erforderlich (Passwort oder 'DELETE ME')" }, { status: 400 });
    }

    if (password) {
      const user = await prisma.user.findUnique({ where: { id: session.userId } });
      if (!user) return Response.json({ error: "User nicht gefunden" }, { status: 404 });
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return Response.json({ error: "Passwort falsch" }, { status: 401 });
    }

    // Reihenfolge: abh. Daten löschen (Favorites), dann User
    await prisma.favorite.deleteMany({ where: { userId: session.userId } });
    await prisma.user.delete({ where: { id: session.userId } });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Set-Cookie": clearSessionCookie(), "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Konto löschen fehlgeschlagen" }, { status: 500 });
  }
}
