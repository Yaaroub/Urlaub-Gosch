import { createEvents } from "ics";
import { mergeOccupiedRanges, publicEventUid } from "./public-calendar.js";

function dToParts(d) {
  const x = new Date(d);
  return [x.getUTCFullYear(), x.getUTCMonth() + 1, x.getUTCDate()];
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

export function notFound() {
  return new Response("Not found", {
    status: 404,
    headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}

/**
 * Builds the iCal response of one property. Contains only what a portal
 * needs to block dates: merged occupied ranges ("Belegt"). No guest names,
 * no booking requests, no internal numbers, and back-to-back stays are
 * joined so guest changes are not visible.
 */
export function icalFeedResponse(property, bookings) {
  const events = mergeOccupiedRanges(bookings).map((b) => ({
    start: dToParts(b.startDate),
    end: dToParts(b.endDate), // DTEND exclusive, matches our model
    title: `${property.title} – Belegt`,
    description: "Belegt",
    status: "CONFIRMED",
    productId: "urlaub-gosch",
    // Stable per block start, without any booking number.
    uid: publicEventUid("block", `${property.id}:${dToParts(b.startDate).join("-")}`),
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
      "Referrer-Policy": "no-referrer",
    },
  });
}
