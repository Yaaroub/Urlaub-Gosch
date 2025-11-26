import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

function toDate(d) {
  if (!d) return null;
  const x = new Date(d);
  return isNaN(+x) ? null : x;
}

// GET /api/admin/lastminute?propertyId=123
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const pid = Number(url.searchParams.get("propertyId"));
    if (!pid) return Response.json([], { status: 200 });

    const items = await prisma.lastMinuteOffer.findMany({
      where: { propertyId: pid },
      orderBy: [{ startDate: "asc" }, { id: "asc" }],
    });
    return Response.json(items);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Fehler beim Laden" }, { status: 500 });
  }
}

// POST /api/admin/lastminute
// body: { propertyId, startDate, endDate, discount, note? }
export async function POST(req) {
  try {
    const { propertyId, startDate, endDate, discount, note } = await req.json();
    const pid = Number(propertyId);
    const sd = toDate(startDate);
    const ed = toDate(endDate);
    const disc = Number(discount);

    if (!pid || !sd || !ed || !(disc >= 0 && disc <= 100) || ed <= sd) {
      return Response.json({ error: "Ungültige Eingaben" }, { status: 400 });
    }

    const created = await prisma.lastMinuteOffer.create({
      data: { propertyId: pid, startDate: sd, endDate: ed, discount: disc, note: note || null },
    });

    // komplette frische Liste zurückgeben (praktisch für UI-Refresh)
    const fresh = await prisma.lastMinuteOffer.findMany({
      where: { propertyId: pid },
      orderBy: [{ startDate: "asc" }, { id: "asc" }],
    });
    return Response.json(fresh, { status: 201 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Anlegen fehlgeschlagen" }, { status: 500 });
  }
}

// PUT /api/admin/lastminute
// body: { id, startDate?, endDate?, discount?, note? }
export async function PUT(req) {
  try {
    const { id, startDate, endDate, discount, note } = await req.json();
    const offerId = Number(id);
    if (!offerId) return Response.json({ error: "id fehlt" }, { status: 400 });

    const data = {};
    if (startDate !== undefined) {
      const sd = toDate(startDate);
      if (!sd) return Response.json({ error: "startDate ungültig" }, { status: 400 });
      data.startDate = sd;
    }
    if (endDate !== undefined) {
      const ed = toDate(endDate);
      if (!ed) return Response.json({ error: "endDate ungültig" }, { status: 400 });
      data.endDate = ed;
    }
    if (discount !== undefined) {
      const disc = Number(discount);
      if (!(disc >= 0 && disc <= 100)) return Response.json({ error: "discount 0–100" }, { status: 400 });
      data.discount = disc;
    }
    if (note !== undefined) data.note = note || null;

    const upd = await prisma.lastMinuteOffer.update({ where: { id: offerId }, data: data });

    // zurück mit kompletter Liste des Objekts
    const fresh = await prisma.lastMinuteOffer.findMany({
      where: { propertyId: upd.propertyId },
      orderBy: [{ startDate: "asc" }, { id: "asc" }],
    });
    return Response.json(fresh);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Aktualisieren fehlgeschlagen" }, { status: 500 });
  }
}
