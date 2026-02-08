// src/app/api/admin/images/reorder/route.js
import prisma from "@/lib/db";

export async function PUT(req) {
  try {
    const body = await req.json();
    const propertyId = Number(body?.propertyId);
    const order = Array.isArray(body?.order) ? body.order : [];

    if (!propertyId) return Response.json({ error: "propertyId fehlt" }, { status: 400 });
    if (!order.length) return Response.json({ error: "order fehlt" }, { status: 400 });

    await prisma.$transaction(
      order.map((o) =>
        prisma.propertyImage.update({
          where: { id: Number(o.id) },
          data: { sort: Number(o.sort) },
        })
      )
    );

    const images = await prisma.propertyImage.findMany({
      where: { propertyId },
      orderBy: { sort: "asc" },
    });

    return Response.json({ ok: true, images });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Reorder fehlgeschlagen" }, { status: 500 });
  }
}
