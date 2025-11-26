import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

// DELETE /api/admin/lastminute/:id
export async function DELETE(_req, { params }) {
  try {
    const id = Number(params.id);
    if (!id) return Response.json({ error: "id fehlt" }, { status: 400 });

    // propertyId merken, damit wir danach die frische Liste zurückgeben können
    const existing = await prisma.lastMinuteOffer.findUnique({ where: { id }, select: { propertyId: true } });
    if (!existing) return Response.json({ error: "Nicht gefunden" }, { status: 404 });

    await prisma.lastMinuteOffer.delete({ where: { id } });

    const fresh = await prisma.lastMinuteOffer.findMany({
      where: { propertyId: existing.propertyId },
      orderBy: [{ startDate: "asc" }, { id: "asc" }],
    });
    return Response.json(fresh);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Löschen fehlgeschlagen" }, { status: 500 });
  }
}
