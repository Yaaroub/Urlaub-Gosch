import { clientIp } from "./rate-limit.js";
import { isTrustedRequestOrigin } from "./request-origin.js";

const attempts = new Map();

export function checkInquiryRequest(req, now = Date.now()) {
  if (!isTrustedRequestOrigin(req)) return 403;
  const contentType = req.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (contentType !== "application/json") return 415;
  if (Number(req.headers.get("content-length")) > 16384) return 413;
  // Best-effort per-instance limit; persisted limits are checked in the route.
  const key = clientIp(req);
  for (const [id, value] of attempts) if (value.until <= now) attempts.delete(id);
  const value = attempts.get(key) || { count: 0, until: now + 600000 };
  if (value.count >= 10 || (!attempts.has(key) && attempts.size >= 10000)) return 429;
  value.count++;
  attempts.set(key, value);
  return null;
}

export async function readInquiryJson(req) {
  const reader = req.body?.getReader();
  if (!reader) throw new Error("INVALID_BODY");
  let size = 0;
  const chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 16384) { await reader.cancel(); throw new Error("BODY_TOO_LARGE"); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}

export function validInquiry(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;
  for (const [key, max, required] of [["firstName",100,true],["lastName",100,true],["email",254,true],["phone",50,false],["message",5000,false]]) {
    const value = data[key];
    if (value == null && !required) continue;
    if (typeof value !== "string" || value.length > max || (required && !value.trim())) return false;
    if (key !== "message" && /[\r\n\0]/.test(value)) return false;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) && Number.isSafeInteger(Number(data.propertyId)) && Number(data.propertyId) > 0;
}

const SINGLE_LINE = /^[^\r\n\0]*$/;

function requiredText(value, max) {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text && text.length <= max && SINGLE_LINE.test(text) ? text : null;
}

function wholeNumber(value, min, max) {
  const n = typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : NaN;
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
}

/**
 * Required details of the booking form on the property pages. Everything the
 * form marks as required is required here too; returns null if anything is
 * missing or invalid.
 */
export function bookingRequestDetails(data) {
  if (!data || typeof data !== "object") return null;
  const requestType = data.requestType === "booking" || data.requestType === "info" ? data.requestType : null;
  const street = requiredText(data.street, 150);
  const postalCode = requiredText(data.postalCode, 12);
  const city = requiredText(data.city, 100);
  const mobile = requiredText(data.mobile ?? data.phone, 50);
  const adults = wholeNumber(data.adults, 1, 30);
  const children = wholeNumber(data.children, 0, 30);
  const pets = typeof data.pets === "boolean" ? data.pets : null;
  const dogCount = wholeNumber(data.dogCount ?? 0, 0, 10);
  if (!requestType || !street || !postalCode || !/^[A-Za-z0-9 -]{3,12}$/.test(postalCode) || !city || !mobile) return null;
  if (adults === null || children === null || pets === null || dogCount === null) return null;
  if (!pets && dogCount !== 0) return null;
  return { requestType, street, postalCode, city, mobile, adults, children, pets, dogCount };
}

const BOOKING_FIELD_LABELS = {
  requestType: "Art der Anfrage", firstName: "Vorname", lastName: "Nachname", street: "Straße und Hausnummer",
  postalCode: "PLZ", city: "Ort", mobile: "Mobilnummer", email: "E-Mail-Adresse", adults: "Erwachsene",
  children: "Kinder", pets: "Haustiere", dogCount: "Anzahl Hunde", message: "Nachricht",
};

/**
 * Names the first field of the booking form that is missing or invalid, so
 * the guest sees exactly what to correct. Returns null if all fields are ok.
 */
export function bookingFieldProblem(data) {
  if (!data || typeof data !== "object") return { field: null, label: null };
  const fail = (field) => ({ field, label: BOOKING_FIELD_LABELS[field] });
  if (data.requestType !== "booking" && data.requestType !== "info") return fail("requestType");
  for (const [field, max] of [["firstName", 100], ["lastName", 100]]) if (!requiredText(data[field], max)) return fail(field);
  if (!requiredText(data.street, 150)) return fail("street");
  const postalCode = requiredText(data.postalCode, 12);
  if (!postalCode || !/^[A-Za-z0-9 -]{3,12}$/.test(postalCode)) return fail("postalCode");
  if (!requiredText(data.city, 100)) return fail("city");
  if (!requiredText(data.mobile ?? data.phone, 50)) return fail("mobile");
  const email = requiredText(data.email, 254);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("email");
  if (wholeNumber(data.adults, 1, 30) === null) return fail("adults");
  if (wholeNumber(data.children, 0, 30) === null) return fail("children");
  if (typeof data.pets !== "boolean") return fail("pets");
  const dogs = wholeNumber(data.dogCount ?? 0, 0, 10);
  if (dogs === null || (!data.pets && dogs !== 0)) return fail("dogCount");
  if (data.message != null && (typeof data.message !== "string" || data.message.length > 5000)) return fail("message");
  return null;
}
