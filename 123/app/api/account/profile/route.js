import prisma from "@/lib/db";
import { getSession, createSession, sessionCookie } from "@/lib/auth";

export async function PUT(req) {
  const session = await getSession(req);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { name, email } = await req.json();
    if (!email) return Response.json({ error: "E-Mail erforderlich" }, { status: 400 });

    // Email-Kollision prüfen (wenn sich E-Mail ändert)
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== session.userId) {
      return Response.json({ error: "E-Mail bereits vergeben" }, { status: 409 });
    }

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: { name: name ?? null, email },
      select: { id: true, email: true, name: true },
    });

    // neue Session mit aktualisierter email
    const token = await createSession(user);
    return new Response(JSON.stringify({ ok: true, user }), {
      status: 200,
      headers: {
        "Set-Cookie": sessionCookie(token),
        "Content-Type": "application/json",
      },
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Profil-Update fehlgeschlagen" }, { status: 500 });
  }
}
