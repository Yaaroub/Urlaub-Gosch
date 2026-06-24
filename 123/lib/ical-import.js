import ical from "node-ical";

/**
 * Lädt eine ICS-Quelle (URL oder Buffer) und gibt Normalform zurück:
 * [{ start: Date, end: Date, summary: string }]
 * Achtung: DTEND ist in iCal exklusiv – perfekt für unser Modell.
 */
export async function parseIcsFromUrl(icsUrl) {
  const data = await ical.async.fromURL(icsUrl);
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
      summary: ev.summary || "",
    });
  }
  return out;
}

function toDateOnly(x) {
  if (!x) return null;
  const d = new Date(x);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
