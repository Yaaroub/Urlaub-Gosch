import { createHmac, timingSafeEqual } from "node:crypto";

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

/* ------------------------------------------------------------------ */
/* Secret feed links for booking portals                              */
/* ------------------------------------------------------------------ */

// Own key for feed links (ICAL_FEED_SECRET). Changing it invalidates ALL feed
// links at once (e.g. if a link was leaked). Falls back to AUTH_SECRET.
function feedSecret() {
  return process.env.ICAL_FEED_SECRET || process.env.AUTH_SECRET || "";
}

/** 128-bit, URL-safe secret per property. null if no secret is configured. */
export function icalFeedToken(propertyId) {
  const secret = feedSecret();
  const id = Number(propertyId);
  if (!secret || !Number.isSafeInteger(id) || id <= 0) return null;
  return createHmac("sha256", secret).update(`ical-feed:v1:${id}`).digest("base64url").slice(0, 22);
}

/** Constant-time check of a feed token. */
export function isValidIcalFeedToken(propertyId, token) {
  const expected = icalFeedToken(propertyId);
  if (!expected || typeof token !== "string" || token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

/** Path of the secret feed, e.g. /api/ical/achnasheen/<token>. */
export function icalFeedPath(slug, propertyId) {
  const token = icalFeedToken(propertyId);
  return token ? `/api/ical/${encodeURIComponent(slug)}/${token}` : null;
}

/**
 * Old links without a key (/api/ical/<slug>) keep working only during a
 * transition period set in ICAL_LEGACY_LINKS_UNTIL (YYYY-MM-DD, at most
 * 60 days ahead). Not set = old links are switched off.
 */
export function legacyIcalLinksAllowed(now = new Date()) {
  const until = String(process.env.ICAL_LEGACY_LINKS_UNTIL || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(until)) return false;
  const end = new Date(`${until}T23:59:59.999Z`);
  if (Number.isNaN(end.getTime())) return false;
  const maxEnd = new Date(now.getTime() + 60 * 86400000);
  return now <= end && end <= maxEnd;
}

/* ------------------------------------------------------------------ */
/* Minimal public occupancy (booking calendar on the property page)   */
/* ------------------------------------------------------------------ */

// Visitors can only book within this window; later occupancy is not shown.
export const PUBLIC_OCCUPANCY_DAYS = 540;

/** Bookings from today up to the public horizon. */
export function publicOccupancyWhere(propertyId, now = new Date()) {
  const today = startOfTodayBerlin(now);
  return {
    ...currentBookingsWhere(propertyId, now),
    startDate: { lt: new Date(today.getTime() + PUBLIC_OCCUPANCY_DAYS * 86400000) },
  };
}

/**
 * Merges overlapping and back-to-back stays into one blocked range, so the
 * public calendar shows only "free / occupied" and not how many separate
 * stays there are or where one guest leaves and the next arrives.
 */
export function mergeOccupiedRanges(rows) {
  const ranges = rows
    .map(({ startDate, endDate }) => [new Date(startDate), new Date(endDate)])
    .filter(([s, e]) => !Number.isNaN(s.getTime()) && !Number.isNaN(e.getTime()) && s < e)
    .sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const [s, e] of ranges) {
    const last = merged[merged.length - 1];
    if (last && s <= last[1]) {
      if (e > last[1]) last[1] = e;
    } else {
      merged.push([s, e]);
    }
  }
  return merged.map(([startDate, endDate]) => ({ startDate, endDate }));
}
