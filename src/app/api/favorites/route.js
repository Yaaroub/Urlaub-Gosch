// src/app/api/favorites/route.js
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";

// Wichtig: dynamisch deklarieren wegen Sessions/Cookies
export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/favorites -> { ids: number[] }
export async function GET(req) {
  try {
    const session = await getSession(req);
    if (!session?.userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await prisma.favorite.findMany({
      where: { userId: session.userId },
      select: { propertyId: true },
    });

    return Response.json({ ids: rows.map((r) => r.propertyId) });
  } catch (err) {
    console.error("GET /favorites failed:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/favorites { propertyId }
export async function POST(req) {
  try {
    const session = await getSession(req);
    if (!session?.userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const pid = Number.parseInt(body?.propertyId, 10);
    if (!Number.isFinite(pid) || pid <= 0) {
      return Response.json({ error: "propertyId fehlt oder ungültig" }, { status: 400 });
    }

    await prisma.favorite.upsert({
      where: {
        userId_propertyId: {
          userId: session.userId,
          propertyId: pid,
        },
      },
      update: {},
      create: {
        userId: session.userId,
        propertyId: pid,
      },
    });

    return Response.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("POST /favorites failed:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
