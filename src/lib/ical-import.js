import ical from "node-ical";
import { fetchPublicCalendar } from "@/lib/safe-calendar-fetch";

/**
 * Lädt eine ICS-Quelle (URL oder Buffer) und gibt Normalform zurück:
 * [{ start: Date, end: Date }]
 * Achtung: DTEND ist in iCal exklusiv – perfekt für unser Modell.
 */
export async function parseIcsFromUrl(icsUrl) {
  const text = await fetchPublicCalendar(icsUrl);
  const data = await ical.async.parseICS(text);
  return normalizeIcal(data);
}

export async function parseIcsFromBuffer(buf) {
  const data = ical.sync.parseICS(buf.toString("utf-8"));
  return normalizeIcal(data);
}

function normalizeIcal(data) {
  const out = [];
  for (const k of Object.keys(data)) {
    const ev = data[k];
    if (!ev || ev.type !== "VEVENT") continue;

    // Unterstützt ganztägig (date) und mit Zeit (date-time). Wir runden auf Tage.
    const s = toDateOnly(ev.start);
    const e = toDateOnly(ev.end); // exklusiv

    if (!s || !e || +e <= +s) continue;

    out.push({
      start: s,
      end: e,
    });
  }
  return out;
}

function toDateOnly(x) {
  if (!x) return null;
  const d = new Date(x);
  if (Number.isNaN(d.getTime())) return null;
  // Preserve the source calendar's day, independently of the server timezone.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: x.tz || (x.dateOnly ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC"),
    year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(d);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return new Date(Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day)));
}


/**
 * Neutral label for imported bookings. The SUMMARY of a portal's calendar can
 * contain guest names; we only keep where the booking came from.
 */
export function icalImportLabel(url) {
  let host = "";
  try {
    host = new URL(String(url)).hostname.replace(/^www\./, "");
  } catch {
    host = "";
  }
  return (host ? `iCal-Import (${host})` : "iCal-Import").slice(0, 120);
}
