import { createHmac } from "node:crypto";

/**
 * Rules for everything the public (no login) gets to see about occupancy:
 * only date ranges, only from today on, no internal ids, no names, no requests.
 */

/** Start of "today" (calendar day in Europe/Berlin) as a UTC date. */
export function startOfTodayBerlin(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const date = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return new Date(`${date.year}-${date.month}-${date.day}T00:00:00.000Z`);
}

/** Bookings that still matter for availability (departure today or later). */
export function currentBookingsWhere(propertyId, now = new Date()) {
  return { propertyId: Number(propertyId), endDate: { gt: startOfTodayBerlin(now) } };
}

/**
 * Stable, non-guessable event id for calendar exports. Booking portals need a
 * stable UID per event; a plain "booking-257" would reveal internal numbering.
 */
export function publicEventUid(kind, id) {
  const key = process.env.AUTH_SECRET || "urlaub-gosch-public-calendar";
  const digest = createHmac("sha256", key).update(`ical:${kind}:${id}`).digest("hex").slice(0, 24);
  return `${digest}@urlaub-gosch.de`;
}
