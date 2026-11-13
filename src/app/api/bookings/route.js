import { ADMIN_PERMISSIONS, requireAdminPermission } from "@/lib/admin-permissions";
import prisma from "@/lib/db";
import { overlapWhere, withPropertyBookingLock } from "@/lib/booking-lock";

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
      select: { id: true, startDate: true, endDate: true },
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
    const auth = await requireAdminPermission(ADMIN_PERMISSIONS.AVAILABILITY_EDIT, req);
    if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });
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

    // Overlap check and insert run under a per-property lock (no double bookings on concurrent requests).
    const result = await withPropertyBookingLock(pid, async (tx) => {
      const overlap = await tx.booking.findFirst({
        where: overlapWhere(pid, start, end),
        select: { id: true, startDate: true, endDate: true },
      });
      if (overlap) return { overlap };
      const booking = await tx.booking.create({
        data: {
          propertyId: pid,
          startDate: start,
          endDate: end,
          guestName: guestName?.trim() || "(Admin)",
        },
        select: { id: true, startDate: true, endDate: true, guestName: true },
      });
      return { booking };
    });

    if (result.overlap) {
      return Response.json(
        {
          error: "Zeitraum ist bereits belegt.",
          conflict: {
            id: result.overlap.id,
            startDate: result.overlap.startDate,
            endDate: result.overlap.endDate,
          },
        },
        { status: 409 }
      );
    }
    const { booking } = result;

    return Response.json({ ok: true, booking });
  } catch (e) {
    console.error("POST /api/bookings error:", e);
    return Response.json(
      { error: "Interner Fehler beim Anlegen der Buchung." },
      { status: 500 }
    );
  }
}

