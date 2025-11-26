import prisma from "@/lib/db";

export async function DELETE(req, { params }) {
  try {
    const id = Number(params.id);
    if (!id) return Response.json({ error: "id fehlt" }, { status: 400 });
    await prisma.propertyImage.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Löschen fehlgeschlagen" }, { status: 500 });
  }
}

export async function GET(req, { params }) {
  try {
    const id = Number(params.id);
    if (!id) return Response.json({ error: "id fehlt" }, { status: 400 });
    const it = await prisma.propertyImage.findUnique({ where: { id } });
    if (!it) return Response.json({ error: "Nicht gefunden" }, { status: 404 });
    return Response.json(it);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Fehler" }, { status: 500 });
  }
}
