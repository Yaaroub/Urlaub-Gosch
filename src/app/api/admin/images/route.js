import prisma from "@/lib/db";

export async function GET(req) {
  try {
    const pid = Number(new URL(req.url).searchParams.get("propertyId"));
    if (!pid) return Response.json([]);
    const items = await prisma.propertyImage.findMany({
      where: { propertyId: pid },
      orderBy: [{ sort: "asc" }, { id: "asc" }],
    });
    return Response.json(items);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Fehler beim Laden" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const pid = Number(body.propertyId);
    if (!pid) return Response.json({ error: "propertyId fehlt" }, { status: 400 });

    // entweder einzelnes Bild {url, alt} oder bulk: images:[{url,alt}]
    const images = Array.isArray(body.images)
      ? body.images
      : body.url
      ? [{ url: body.url, alt: body.alt || null }]
      : [];

    if (images.length === 0) return Response.json({ error: "Keine Bilder" }, { status: 400 });

    const max = await prisma.propertyImage.aggregate({
      where: { propertyId: pid },
      _max: { sort: true },
    });
    let start = (max._max.sort ?? 0) + 1;

    const data = images.map((img, i) => ({
      propertyId: pid,
      url: img.url,
      alt: img.alt || null,
      sort: start + i,
    }));

    await prisma.propertyImage.createMany({ data });

    const fresh = await prisma.propertyImage.findMany({
      where: { propertyId: pid },
      orderBy: [{ sort: "asc" }, { id: "asc" }],
    });
    return Response.json(fresh, { status: 201 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Interner Fehler beim Anlegen" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const id = Number(body.id);
    if (!id) return Response.json({ error: "id fehlt" }, { status: 400 });
    const upd = await prisma.propertyImage.update({
      where: { id },
      data: {
        alt: body.alt ?? undefined,
        sort: typeof body.sort === "number" ? body.sort : undefined,
      },
    });
    return Response.json(upd);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Update fehlgeschlagen" }, { status: 500 });
  }
}
