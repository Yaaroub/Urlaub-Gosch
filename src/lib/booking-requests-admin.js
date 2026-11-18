// Pure helpers for the admin "Anfragen" area (no imports, unit-testable).

export const REQUEST_STATUSES = ["PENDING", "APPROVED", "DECLINED"];
export const PAGE_SIZE = 25;
// Bulk deletion by age: never younger than 6 months (protects running enquiries).
export const MIN_RETENTION_MONTHS = 6;
export const DEFAULT_RETENTION_MONTHS = 12;

export function parseListQuery(searchParams) {
  const rawStatus = String(searchParams.get("status") || "ALL").toUpperCase();
  const status = REQUEST_STATUSES.includes(rawStatus) ? rawStatus : "ALL";
  const q = String(searchParams.get("q") || "").trim().slice(0, 100);
  const pageNumber = Number.parseInt(searchParams.get("page") || "1", 10);
  const page = Number.isSafeInteger(pageNumber) && pageNumber > 0 ? Math.min(pageNumber, 10000) : 1;
  return { status, q, page };
}

export function buildListWhere({ status, q }) {
  const where = {};
  if (status !== "ALL") where.status = status;
  if (q) {
    where.OR = [
      { guestName: { contains: q, mode: "insensitive" } },
      { guestEmail: { contains: q, mode: "insensitive" } },
      { property: { title: { contains: q, mode: "insensitive" } } },
    ];
  }
  return where;
}

/** Validates a list of ids for bulk deletion (1–200 positive integers). */
export function parseIds(value) {
  if (!Array.isArray(value) || value.length === 0 || value.length > 200) return null;
  const ids = [...new Set(value.map(Number))];
  return ids.every((id) => Number.isSafeInteger(id) && id > 0) ? ids : null;
}

/** Cut-off date for "older than N months", or null for invalid input. */
export function retentionCutoff(months, now = new Date()) {
  const n = Number(months);
  if (!Number.isInteger(n) || n < MIN_RETENTION_MONTHS || n > 120) return null;
  const cutoff = new Date(now);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - n);
  return cutoff;
}

/** The public form stores "Telefon: …\nNachricht: …" in one field; split it for display. */
export function splitRequestMessage(message) {
  const text = String(message || "");
  const phone = text.match(/^Telefon:\s*(.*)$/m)?.[1]?.trim();
  const body = text.match(/^Nachricht:\s*([\s\S]*)$/m)?.[1]?.trim();
  if (phone === undefined && body === undefined) return { phone: "", text: text.trim() };
  return { phone: phone && phone !== "-" ? phone : "", text: body && body !== "-" ? body : "" };
}
