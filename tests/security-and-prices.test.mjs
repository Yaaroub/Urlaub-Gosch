import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";
import { createRequire } from "node:module";
import { getMinimumNightlyPrice } from "../src/lib/min-nightly-price.js";
import { publicPropertySelect } from "../src/lib/public-property-select.js";
import { isPublicCalendarAddress, validateCalendarUrl } from "../src/lib/safe-calendar-fetch.js";

const require = createRequire(import.meta.url);
const { transform } = require("next/dist/build/swc");
async function load(path, mocks) {
  const { code } = await transform(await fs.readFile(new URL(path, import.meta.url), "utf8"), {
    filename: path, jsc: { parser: { syntax: "ecmascript" } }, module: { type: "commonjs" },
  });
  const module = { exports: {} };
  vm.runInNewContext(code, { exports: module.exports, module, Response, URL, Date, console, TextEncoder, process: { env: { AUTH_SECRET: "security-test-only-secret" } }, require: (name) => {
    if (!(name in mocks)) throw new Error(`Unexpected dependency ${name}`);
    return mocks[name];
  } });
  return module.exports;
}
const deny = { ADMIN_PERMISSIONS: { AVAILABILITY_EDIT: "AVAILABILITY_EDIT", IMAGES_EDIT: "IMAGES_EDIT" }, requireAdminPermission: async () => ({ ok: false, status: 401, error: "Nicht angemeldet" }) };

test("Ab-price ignores expired, invalid and empty prices and uses cheapest current/future season", () => {
  const now = new Date("2026-10-29T12:00:00Z");
  const rate = (pricePerNight, startDate = "2026-10-01", endDate = "2027-01-01") => ({ pricePerNight, startDate, endDate });
  assert.equal(getMinimumNightlyPrice([rate(60, "2025-01-01", "2026-01-01"), rate("90.00"), rate(75, "2026-12-01"), rate(0), rate(-5), rate("invalid")], now), 75);
  assert.equal(getMinimumNightlyPrice([], now), null);
  assert.equal(getMinimumNightlyPrice([rate(50, "2027-01-01", "2026-01-01")], now), null);
  assert.equal(getMinimumNightlyPrice([rate(50, "2026-10-01", "2026-10-30")], new Date("2026-10-29T23:30:00Z")), null);
});
test("anonymous booking POST cannot reach the database", async () => {
  const route = await load("../src/app/api/bookings/route.js", { "@/lib/db": {}, "@/lib/admin-permissions": deny });
  assert.equal((await route.POST({ json: () => { throw new Error("Body must not be processed"); } })).status, 401);
});
test("public property writes use the protected admin implementation", async () => {
  const protectedPost = async () => Response.json({ error: "Forbidden" }, { status: 403 });
  const route = await load("../src/app/api/properties/route.js", { "@/lib/db": {}, "@/lib/public-property-select": { publicPropertySelect }, "@/app/api/admin/properties/route": { POST: protectedPost } });
  assert.equal(route.POST, protectedPost);
});
test("public property selection does not expose iCal source tokens or guest information", async () => {
  let selection;
  const route = await load("../src/app/api/properties/route.js", {
    "@/lib/db": { property: { findMany: async (args) => { selection = args.select; return []; } } },
    "@/lib/public-property-select": { publicPropertySelect }, "@/app/api/admin/properties/route": { POST: async () => {} },
  });
  await route.GET();
  assert.equal(selection.icalUrl, undefined);
  assert.equal(selection.requests, undefined);
  assert.equal(selection.bookings.select.guestName, undefined);
});
test("public calendar JSON does not select guest names", async () => {
  let selection;
  const route = await load("../src/app/api/bookings/route.js", {
    "@/lib/db": { booking: { findMany: async (args) => { selection = args.select; return []; } } }, "@/lib/admin-permissions": deny,
  });
  await route.GET({ url: "http://localhost/api/bookings?propertyId=1" });
  assert.equal(selection.guestName, undefined);
});
test("public iCal never serializes guest names", async () => {
  let events;
  const route = await load("../src/app/api/ical/[slug]/route.js", {
    "@/lib/db": { property: { findUnique: async () => ({ title: "Test", bookings: [{ id: 1, startDate: new Date("2026-11-01"), endDate: new Date("2026-11-08"), guestName: "TEST_GUEST_NOT_PUBLIC" }], requests: [] }) } },
    ics: { createEvents: (data) => { events = data; return { value: "BEGIN:VCALENDAR" }; } },
  });
  assert.equal((await route.GET(null, { params: Promise.resolve({ slug: "test" }) })).status, 200);
  assert(!JSON.stringify(events).includes("TEST_GUEST_NOT_PUBLIC"));
});
test("anonymous upload cannot receive a Blob upload token", async () => {
  const route = await load("../src/app/api/admin/upload/route.js", {
    "@/lib/db": {}, "@/lib/admin-permissions": deny,
    "next/server": { NextResponse: Response },
    "@vercel/blob/client": { handleUpload: async (options) => options.onBeforeGenerateToken("objects/property-1/test.jpg", '{"propertyId":1}') },
  });
  assert.equal((await route.POST({ json: async () => ({}) })).status, 401);
});
test("iCal import rejects private, loopback, metadata and encoded loopback targets", () => {
  for (const ip of ["127.0.0.1", "10.0.0.1", "172.16.0.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "::1", "::ffff:127.0.0.1", "fc00::1", "fe80::1", "2002:7f00:1::"]) assert.equal(isPublicCalendarAddress(ip), false, ip);
  assert.equal(isPublicCalendarAddress("8.8.8.8"), true);
  assert.equal(isPublicCalendarAddress("2606:4700:4700::1111"), true);
  for (const url of ["http://2130706433/test", "http://0x7f000001/", "http://[::1]/", "file:///etc/passwd", "https://user:pass@example.com/", "http://example.com:8080/"]) assert.throws(() => validateCalendarUrl(url));
  assert.equal(validateCalendarUrl("https://example.com/calendar.ics").hostname, "example.com");
});
test("revoked sessions cannot be reused for account APIs", async () => {
  let lookupCount = 0;
  const auth = await load("../src/lib/auth.js", {
    jose: { jwtVerify: async () => ({ payload: { sub: "1", sv: 1 } }), SignJWT: class {} },
    "next/headers": {}, "@/lib/db": { user: { findUnique: async () => { lookupCount++; return { id: 1, isActive: true, sessionVersion: 2 }; } } },
    "@/lib/database-availability": { retryDatabaseRead: (read) => read() },
  });
  const request = { headers: new Headers({ cookie: "session=test-token" }) };
  assert.equal(await auth.getVerifiedSession(request), null);
  assert.equal(lookupCount, 1);
});
