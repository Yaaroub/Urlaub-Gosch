import prisma from "@/lib/db";

/** Utils */
function dateOnly(input) {
  const d = typeof input === "string" ? new Date(input) : new Date(input);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function fmtISODate(d) {
  return d.toISOString().slice(0, 10);
}

/**
 * GET /api/bookings?propertyId=1
 * -> Liste aller Buchungen (ISO-Strings)
 */
export async function GET(req) {
  try {
    const sp = new URL(req.url).searchParams;
    const pid = Number(sp.get("propertyId"));
    if (!pid) return Response.json([]);

    const rows = await prisma.booking.findMany({
      where: { propertyId: pid },
      orderBy: { startDate: "asc" },
      select: { id: true, startDate: true, endDate: true, guestName: true },
    });

    return Response.json(rows);
  } catch (e) {
    console.error("GET /api/bookings error:", e);
    return Response.json([], { status: 200 });
  }
}

/**
 * POST /api/bookings
 * Body: { propertyId, arrival: "YYYY-MM-DD", departure: "YYYY-MM-DD", guestName? }
 * -> legt Buchung / Block an (für Admin-Bereich) und gibt Preisdetails zurück
 */
export async function POST(req) {
  try {
    const { propertyId, arrival, departure, guestName } = await req.json();

    const pid = Number(propertyId);
    if (!pid || !arrival || !departure) {
      return Response.json(
        { error: "propertyId, arrival und departure sind erforderlich." },
        { status: 400 }
      );
    }

    const start = dateOnly(arrival);
    const end = dateOnly(departure);
    if (!(end > start)) {
      return Response.json(
        { error: "departure muss nach arrival liegen." },
        { status: 400 }
      );
    }

    const property = await prisma.property.findUnique({
      where: { id: pid },
      select: { id: true, title: true },
    });
    if (!property) {
      return Response.json(
        { error: "Property nicht gefunden." },
        { status: 404 }
      );
    }

    // ✅ Overlap NUR für dieses Haus prüfen
    const overlap = await prisma.booking.findFirst({
      where: {
        propertyId: pid,
        startDate: { lt: end }, // beginnt vor neuem Ende
        endDate: { gt: start }, // endet nach neuem Start
      },
      select: { id: true, startDate: true, endDate: true },
    });

    if (overlap) {
      return Response.json(
        {
          error: "Zeitraum ist bereits belegt.",
          conflict: {
            id: overlap.id,
            startDate: overlap.startDate,
            endDate: overlap.endDate,
          },
        },
        { status: 409 }
      );
    }

    // ❗ KEINE Preisberechnung mehr hier – Admin will nur blocken
    const booking = await prisma.booking.create({
      data: {
        propertyId: pid,
        startDate: start,
        endDate: end,
        guestName: guestName?.trim() || "(Admin)",
      },
      select: { id: true, startDate: true, endDate: true, guestName: true },
    });

    return Response.json({ ok: true, booking });
  } catch (e) {
    console.error("POST /api/bookings error:", e);
    return Response.json(
      { error: "Interner Fehler beim Anlegen der Buchung." },
      { status: 500 }
    );
  }
}

