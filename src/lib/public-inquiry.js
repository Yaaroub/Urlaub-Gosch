import { clientIp } from "./rate-limit.js";

const attempts = new Map();

export function checkInquiryRequest(req, now = Date.now()) {
  const origin = req.headers.get("origin");
  if (req.headers.get("sec-fetch-site") === "cross-site" || (origin && origin !== new URL(req.url).origin)) return 403;
  if (!req.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return 415;
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
