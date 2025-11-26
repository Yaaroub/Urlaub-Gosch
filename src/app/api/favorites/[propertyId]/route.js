// src/app/api/favorites/[propertyId]/route.js
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function DELETE(req, ctx) {
  try {
    const session = await getSession(req);
    const userId = session?.userId || session?.user?.id;
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ⬇️ params ist async – erst awaiten!
    const { propertyId } = await ctx.params;
    const pid = Number.parseInt(propertyId, 10);
    if (!Number.isFinite(pid) || pid <= 0) {
      return Response.json({ error: "propertyId ungültig" }, { status: 400 });
    }

    await prisma.favorite.deleteMany({
      where: { userId, propertyId: pid },
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/favorites/[propertyId] failed:", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
