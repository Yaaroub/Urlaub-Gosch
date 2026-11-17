import prisma from "@/lib/db";
import { createEvents } from "ics";
import { currentBookingsWhere, publicEventUid } from "@/lib/public-calendar";

export const dynamic = "force-dynamic";

function dToParts(d) {
  const x = new Date(d);
  return [x.getUTCFullYear(), x.getUTCMonth() + 1, x.getUTCDate()];
}

/**
 * Public iCal export of one property (used by booking portals and the
 * "iCal abonnieren" link). Contains only booked date ranges from today on:
 * no guest names, no booking requests, no internal booking numbers.
 */
export async function GET(_req, { params }) {
  const { slug } = await params;
  if (typeof slug !== "string" || slug.length > 200) return new Response("Not found", { status: 404 });

  const property = await prisma.property.findUnique({
    where: { slug },
    select: { id: true, title: true },
  });
  if (!property) return new Response("Not found", { status: 404 });

  const bookings = await prisma.booking.findMany({
    where: currentBookingsWhere(property.id),
    orderBy: { startDate: "asc" },
    select: { id: true, startDate: true, endDate: true },
  });

  const events = bookings.map((b) => ({
    start: dToParts(b.startDate),
    end: dToParts(b.endDate), // DTEND exclusive, matches our model
    title: `${property.title} – Belegt`,
    description: "Belegt",
    status: "CONFIRMED",
    productId: "urlaub-gosch",
    uid: publicEventUid("booking", b.id),
    calName: `${property.title} Belegung`,
  }));

  const { error, value } = events.length
    ? createEvents(events)
    : { error: null, value: emptyCalendar(property.title) };
  if (error) {
    console.error("GET /api/ical: calendar could not be created");
    return new Response("Failed to create ICS", { status: 500 });
  }

  return new Response(value, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(property.title)}.ics"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

function emptyCalendar(title) {
  const name = String(title).replace(/[\r\n,;\\]/g, " ");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    "PRODID:urlaub-gosch",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${name} Belegung`,
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
