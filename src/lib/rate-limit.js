import bcrypt from "bcrypt";

/**
 * Best-effort in-memory limiter (per server instance).
 * Not a replacement for a central limit (e.g. Vercel WAF rule), but it stops
 * naive brute force against a single warm instance without any DB writes.
 */
const buckets = new Map();
const MAX_KEYS = 20000;

function sweep(now) {
  if (buckets.size < MAX_KEYS) return;
  for (const [key, value] of buckets) if (value.until <= now) buckets.delete(key);
}

export function isLimited(key, limit, now = Date.now()) {
  const entry = buckets.get(key);
  if (!entry || entry.until <= now) return false;
  return entry.count >= limit;
}

export function hit(key, windowMs, now = Date.now()) {
  sweep(now);
  const entry = buckets.get(key);
  if (!entry || entry.until <= now) {
    buckets.set(key, { count: 1, until: now + windowMs });
    return 1;
  }
  entry.count += 1;
  return entry.count;
}

export function reset(key) {
  buckets.delete(key);
}

export function retryAfterSeconds(key, now = Date.now()) {
  const entry = buckets.get(key);
  return entry ? Math.max(1, Math.ceil((entry.until - now) / 1000)) : 60;
}

/** Client IP: x-real-ip (set by Vercel) or the proxy-appended last x-forwarded-for entry. */
export function clientIp(req) {
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return "unknown";
}

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_PER_IP = 30;
const LOGIN_MAX_FAILS_PER_ACCOUNT = 8;

function tooMany(key) {
  return Response.json(
    { error: "Zu viele Anmeldeversuche. Bitte später erneut versuchen." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds(key)), "Cache-Control": "no-store" } }
  );
}

/** Returns a 429 Response when the login attempt must be rejected, otherwise null. */
export function checkLoginLimit(req, scope, email) {
  const ipKey = `${scope}:ip:${clientIp(req)}`;
  if (hit(ipKey, LOGIN_WINDOW_MS) > LOGIN_MAX_PER_IP) return tooMany(ipKey);
  const accountKey = `${scope}:acct:${email}`;
  if (isLimited(accountKey, LOGIN_MAX_FAILS_PER_ACCOUNT)) return tooMany(accountKey);
  return null;
}

export function recordLoginFailure(scope, email) {
  hit(`${scope}:acct:${email}`, LOGIN_WINDOW_MS);
}

export function recordLoginSuccess(scope, email) {
  reset(`${scope}:acct:${email}`);
}

// Comparing against a real hash for unknown accounts keeps the response time
// the same (prevents user enumeration via timing).
let dummyHashPromise = null;
function dummyHash() {
  dummyHashPromise ??= bcrypt.hash(`dummy-${Math.random()}-${Date.now()}`, 12);
  return dummyHashPromise;
}

export async function verifyPasswordConstantTime(password, hash) {
  try {
    const ok = await bcrypt.compare(String(password ?? ""), hash || (await dummyHash()));
    return Boolean(hash) && ok;
  } catch {
    return false;
  }
}

export function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

export function isValidEmail(email) {
  return typeof email === "string" && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const MIN_PASSWORD_LENGTH = 10;
export const MAX_PASSWORD_LENGTH = 72; // bcrypt ignores bytes beyond 72

export function passwordProblem(password) {
  if (typeof password !== "string") return "Passwort fehlt.";
  if (password.length < MIN_PASSWORD_LENGTH) return `Das Passwort muss mindestens ${MIN_PASSWORD_LENGTH} Zeichen haben.`;
  if (Buffer.byteLength(password, "utf8") > MAX_PASSWORD_LENGTH) return `Das Passwort darf höchstens ${MAX_PASSWORD_LENGTH} Byte lang sein.`;
  return null;
}
