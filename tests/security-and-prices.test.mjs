import test from "node:test";
import * as safeLog from "../src/lib/safe-log.js";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";
import { createRequire } from "node:module";
import { getMinimumNightlyPrice } from "../src/lib/min-nightly-price.js";
import { publicPropertySelect } from "../src/lib/public-property-select.js";
import { isPublicCalendarAddress, validateCalendarUrl } from "../src/lib/safe-calendar-fetch.js";
import * as publicInquiry from "../src/lib/public-inquiry.js";
import * as publicCalendar from "../src/lib/public-calendar.js";
import * as requestOrigin from "../src/lib/request-origin.js";

const require = createRequire(import.meta.url);
const { transform } = require("next/dist/build/swc");
async function load(path, mocks) {
  const { code } = await transform(await fs.readFile(new URL(path, import.meta.url), "utf8"), {
    filename: path, jsc: { parser: { syntax: "ecmascript" } }, module: { type: "commonjs" },
  });
  const module = { exports: {} };
  vm.runInNewContext(code, { exports: module.exports, module, Response, URL, URLSearchParams, AbortSignal, Date, console, TextEncoder, process: { env: { AUTH_SECRET: "security-test-only-secret" } }, require: (name) => {
    if (name === "@/lib/safe-log") return safeLog;
    if (name === "@/lib/inquiry-mail" && !(name in mocks)) return { scheduleInquiryAlert() {} };
    if (!(name in mocks)) throw new Error(`Unexpected dependency ${name}`);
    return mocks[name];
  } });
  return module.exports;
}
const deny = { ADMIN_PERMISSIONS: { AVAILABILITY_EDIT: "AVAILABILITY_EDIT", IMAGES_EDIT: "IMAGES_EDIT" }, requireAdminPermission: async () => ({ ok: false, status: 401, error: "Nicht angemeldet" }) };

test("updated iCal parser preserves checkout and source timezone across DST", async () => {
  const parser = await load("../src/lib/ical-import.js", {
    "node-ical": require("node-ical"),
    "@/lib/safe-calendar-fetch": {},
  });
  for (const [start, end, expectedStart, expectedEnd] of [
    [";VALUE=DATE:20261114", ";VALUE=DATE:20261121", "2026-11-14", "2026-11-21"],
    [";TZID=Europe/Berlin:20261024T003000", ";TZID=Europe/Berlin:20261026T003000", "2026-10-24", "2026-10-26"],
    [";VALUE=DATE:20261231", ";VALUE=DATE:20270101", "2026-12-31", "2027-01-01"],
  ]) {
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT", "UID:date-test", `DTSTART${start}`, `DTEND${end}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const events = await parser.parseIcsFromBuffer(Buffer.from(ics));
    assert.equal(events.length, 1);
    assert.equal(events[0].start.toISOString(), `${expectedStart}T00:00:00.000Z`);
    assert.equal(events[0].end.toISOString(), `${expectedEnd}T00:00:00.000Z`);
  }
});


test("Ab-price ignores expired, invalid and empty prices and uses cheapest current/future season", () => {
  const now = new Date("2026-10-29T12:00:00Z");
  const rate = (pricePerNight, startDate = "2026-10-01", endDate = "2027-01-01") => ({ pricePerNight, startDate, endDate });
  assert.equal(getMinimumNightlyPrice([rate(60, "2025-01-01", "2026-01-01"), rate("90.00"), rate(75, "2026-12-01"), rate(0), rate(-5), rate("invalid")], now), 75);
  assert.equal(getMinimumNightlyPrice([], now), null);
  assert.equal(getMinimumNightlyPrice([rate(50, "2027-01-01", "2026-01-01")], now), null);
  assert.equal(getMinimumNightlyPrice([rate(50, "2026-10-01", "2026-10-30")], new Date("2026-10-29T23:30:00Z")), null);
});
test("anonymous booking POST cannot reach the database", async () => {
  const route = await load("../src/app/api/bookings/route.js", { "@/lib/db": {}, "@/lib/admin-permissions": deny, "@/lib/public-calendar": publicCalendar, "@/lib/booking-lock": { withPropertyBookingLock: async () => { throw new Error("Lock must not be reached"); }, overlapWhere: () => ({}) } });
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
  // No occupancy at all in the public property list.
  assert.equal(selection.bookings, undefined);
});
test("public calendar JSON returns only current date ranges, without ids or names", async () => {
  let args;
  const route = await load("../src/app/api/bookings/route.js", {
    "@/lib/db": { booking: { findMany: async (a) => { args = a; return [{ id: 7, startDate: new Date("2026-12-01"), endDate: new Date("2026-12-08"), guestName: "TEST_GUEST_NOT_PUBLIC" }]; } } }, "@/lib/admin-permissions": deny,
    "@/lib/public-calendar": publicCalendar,
    "@/lib/booking-lock": { withPropertyBookingLock: async () => { throw new Error("Lock must not be reached"); }, overlapWhere: () => ({}) },
  });
  const body = await (await route.GET({ url: "http://localhost/api/bookings?propertyId=1" })).json();
  assert.equal(args.select.guestName, undefined);
  assert.equal(args.select.id, undefined);
  assert.ok(args.where.endDate?.gt instanceof Date, "past bookings are filtered out");
  assert.deepEqual(Object.keys(body[0]).sort(), ["endDate", "startDate"]);
});
test("public iCal exports bookings only: no names, no requests, no internal numbers", async () => {
  let events;
  let bookingArgs;
  const route = await load("../src/app/api/ical/[slug]/route.js", {
    "@/lib/db": {
      property: { findUnique: async (a) => { assert.equal(a.select.requests, undefined); return { id: 3, title: "Test" }; } },
      booking: { findMany: async (a) => { bookingArgs = a; return [{ id: 257, startDate: new Date("2026-12-01"), endDate: new Date("2026-12-08"), guestName: "TEST_GUEST_NOT_PUBLIC" }]; } },
    },
    "@/lib/public-calendar": publicCalendar,
    ics: { createEvents: (data) => { events = data; return { value: "BEGIN:VCALENDAR" }; } },
  });
  assert.equal((await route.GET(null, { params: Promise.resolve({ slug: "test" }) })).status, 200);
  const serialized = JSON.stringify(events);
  assert(!serialized.includes("TEST_GUEST_NOT_PUBLIC"));
  assert(!/booking-257|request-/.test(serialized), "no internal numbers, no requests");
  assert.equal(bookingArgs.select.guestName, undefined);
  assert.ok(bookingArgs.where.endDate?.gt instanceof Date, "past bookings are filtered out");
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
test("revoked sessions and non-staff accounts never get a session", async () => {
  let lookupCount = 0;
  const auth = await load("../src/lib/auth.js", {
    "./request-origin.js": requestOrigin,
    jose: { jwtVerify: async () => ({ payload: { sub: "1", sv: 1 } }), SignJWT: class {} },
    "next/headers": {}, "@/lib/db": { user: { findUnique: async () => { lookupCount++; return { id: 1, isActive: true, sessionVersion: 2 }; } } },
    "@/lib/database-availability": { retryDatabaseRead: (read) => read() },
  });
  const request = { headers: new Headers({ cookie: "session=test-token" }) };
  assert.equal(await auth.getCurrentUser(request), null);
  assert.equal(lookupCount, 1);
  assert.equal(auth.getVerifiedSession, undefined, "customer session helpers are removed");
  assert.equal(auth.requireCustomerSession, undefined, "customer session helpers are removed");
});

test("contact reports failure when the database cannot save the request", async () => {
  let saves = 0;
  const data = { name: "Ada", email: "ada@example.com", message: "Hallo", privacyAccepted: true, submissionId: "12345678-1234-1234-1234-123456789abc" };
  const route = await load("../src/app/api/contact/route.js", {
    "node:crypto": require("node:crypto"),
    "@/lib/public-inquiry": { checkInquiryRequest: () => null, readInquiryJson: req => req.json() },
    "@/lib/db": { contactRequest: { createMany: async () => { saves++; throw new Error("DATABASE_UNAVAILABLE"); } } },
  });
  const req = body => ({ json: async () => body });
  assert.equal((await route.POST(req({...data,privacyAccepted:false}))).status,400);
  assert.equal(saves,0);
  assert.equal((await route.POST(req(data))).status,503);
  assert.equal(saves,1);
});

test("contact only persists customer data in the database and keeps retry identity", async () => {
  const writes = [];
  let alerts = 0;
  const route = await load("../src/app/api/contact/route.js", {
    "node:crypto": require("node:crypto"),
    "@/lib/public-inquiry": publicInquiry,
    "@/lib/db": { contactRequest: { createMany: async args => { writes.push(args); return { count: writes.length === 1 ? 1 : 0 }; } } },
    "@/lib/inquiry-mail": { scheduleInquiryAlert: (...args) => { assert.deepEqual(args, []); alerts++; } },
  });
  const fields = new FormData();
  for (const [name, value] of Object.entries({ name: " Ada ", email: " ada@example.com ", message: " Hallo\nOstsee! ", privacyAccepted: "on", website: "" })) fields.set(name, value);
  const body = { ...Object.fromEntries(fields), privacyAccepted: fields.has("privacyAccepted"), isLandlordProspect: fields.has("isLandlordProspect"), submissionId: "12345678-1234-1234-1234-123456789abc" };
  for (let i = 0; i < 2; i++) {
    const response = await route.POST(new Request("http://localhost:3000/api/contact", {
      method: "POST", headers: { "Content-Type": "application/json", Origin: "http://localhost:3000", "x-real-ip": "contact-valid-test" }, body: JSON.stringify(body),
    }));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
  }
  assert.equal(writes[0].skipDuplicates, true);
  const [saved] = writes[0].data;
  assert.equal(saved.guestEmail, "ada@example.com");
  assert.equal(saved.guestName, "Ada");
  assert.equal(saved.message, "Hallo\nOstsee!");
  assert.equal(saved.phone, null);
  assert.equal(saved.deduplicationKey, writes[1].data[0].deduplicationKey);
  assert.equal(alerts, 1);
});

test("contact explains invalid fields without persisting rejected requests", async () => {
  let saves = 0;
  const route = await load("../src/app/api/contact/route.js", {
    "node:crypto": require("node:crypto"),
    "@/lib/public-inquiry": publicInquiry,
    "@/lib/db": { contactRequest: { createMany: async () => { saves++; } } },
  });
  const data = { name: "Ada", email: "ada@example.com", message: "Hallo", privacyAccepted: true, submissionId: "12345678-1234-1234-1234-123456789abc" };
  const cases = [
    [{ privacyAccepted: false }, "PRIVACY_REQUIRED", "privacyAccepted"],
    [{ privacyAccepted: "on" }, "PRIVACY_REQUIRED", "privacyAccepted"],
    [{ website: "https://example.com" }, "SPAM_CHECK_FAILED"],
    [{ email: "ada@example" }, "INVALID_EMAIL", "email"],
    [{ submissionId: "" }, "INVALID_SUBMISSION"],
    [{ submissionId: {} }, "INVALID_SUBMISSION"],
    [{ name: "   " }, "REQUIRED_FIELD", "name"],
    [{ message: "\n " }, "REQUIRED_FIELD", "message"],
    [{ name: "A".repeat(201) }, "FIELD_TOO_LONG", "name"],
    [{ message: "A".repeat(5001) }, "FIELD_TOO_LONG", "message"],
    [{ email: "ada@example.com\r\nBcc: other@example.com" }, "INVALID_FIELD", "email"],
    [{ customSubject: "Hallo\nBcc: other@example.com" }, "INVALID_FIELD", "customSubject"],
    [{ name: {} }, "INVALID_FIELD", "name"],
  ];
  for (const [index, [changes, code, field]] of cases.entries()) {
    const response = await route.POST(new Request("http://localhost:3000/api/contact", {
      method: "POST", headers: { "Content-Type": "application/json", "x-real-ip": `contact-invalid-${index}` }, body: JSON.stringify({ ...data, ...changes }),
    }));
    assert.equal(response.status, 400, code);
    const result = await response.json();
    assert.equal(result.code, code);
    assert.equal(result.field, field);
    assert.ok(result.error);
  }
  const malformed = await route.POST(new Request("http://localhost:3000/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{" }));
  assert.equal(malformed.status, 400);
  const crossSite = await route.POST(new Request("http://localhost:3000/api/contact", { method: "POST", headers: { "Content-Type": "application/json", Origin: "https://other.example" }, body: JSON.stringify(data) }));
  assert.equal(crossSite.status, 403);
  assert.equal(saves, 0);
});

test("booking saves the request and triggers a notification without passing customer data", async () => {
  let saves = 0;
  let alerts = 0;
  const route = await load("../src/app/api/booking-request/route.js", {
    "@/lib/public-inquiry": { checkInquiryRequest: () => null, readInquiryJson: req => req.json(), validInquiry: () => true },
    "@/lib/db": { bookingRequest: { count: async()=>0, create: async()=>{saves++;return {id:123};} }, property: { findUnique: async()=>({id:1,title:"Test",slug:"test"}) }, booking: { findFirst: async()=>null } },
    "@/lib/inquiry-mail": { scheduleInquiryAlert: (...args) => { assert.deepEqual(args, []); alerts++; } },
  });
  const response = await route.POST({ json: async()=>({propertyId:1,arrival:"2099-11-01",departure:"2099-11-08",firstName:"Ada",lastName:"Test",email:"ada@example.com"}) });
  assert.equal(response.status,200);
  assert.equal(saves,1);
  assert.equal(alerts,1);
  assert.deepEqual(await response.json(),{ok:true,requestId:123});
});

test("Microsoft 365 receives only a fixed alert to the existing business mailbox", async () => {
  let scheduled = 0;
  const { sendInquiryAlert, scheduleInquiryAlert } = await load("../src/lib/inquiry-mail.js", {
    "next/server": { after: () => { scheduled++; } },
    "@/lib/db": {},
  });
  scheduleInquiryAlert();
  assert.equal(scheduled, 0);
  const calls = [];
  const accepted = await sendInquiryAlert(
    { tenantId: "sample-tenant", clientId: "sample-client", clientSecret: "sample-token-secret" },
    async (url, options) => {
      calls.push({ url, options });
      return calls.length === 1 ? Response.json({ access_token: "sample-access-token" }) : new Response(null, { status: 202 });
    }
  );
  assert.equal(accepted, true);
  assert.equal(calls.length, 2);
  assert.match(calls[0].url, /^https:\/\/login\.microsoftonline\.com\//);
  assert.equal(calls[0].options.body.get("scope"), "https://graph.microsoft.com/.default");
  assert.equal(calls[1].url, "https://graph.microsoft.com/v1.0/users/info%40urlaub-gosch.de/sendMail");
  assert.equal(calls[1].options.redirect, "error");
  assert.equal(calls[1].options.headers.Authorization, "Bearer sample-access-token");
  assert.deepEqual(JSON.parse(calls[1].options.body), {
    message: {
      subject: "Neue Anfrage bei Urlaub-GOSCH",
      body: { contentType: "Text", content: "Eine neue Anfrage ist eingegangen. Bitte öffnen Sie im Adminbereich den Menüpunkt „Anfragen“." },
      toRecipients: [{ emailAddress: { address: "info@urlaub-gosch.de" } }],
    },
    saveToSentItems: false,
  });
});

// ---- Admin "Anfragen" (booking requests with guest contact data) ----
import * as requestsAdmin from "../src/lib/booking-requests-admin.js";

const noDb = new Proxy({}, { get: () => new Proxy({}, { get: () => async () => { throw new Error("Database must not be reached"); } }) });
const permissionMock = (ok, perms = [], role = "EDITOR") => ({
  ADMIN_PERMISSIONS: { AVAILABILITY_VIEW: "AVAILABILITY_VIEW", AVAILABILITY_EDIT: "AVAILABILITY_EDIT" },
  requireAdminPermission: async (permission) =>
    ok && perms.includes(permission)
      ? { ok: true, user: { role, permissions: perms } }
      : { ok: false, status: ok ? 403 : 401, error: "verweigert" },
});
const anfragenMocks = (db, perms, ok = true, role) => ({
  "@/lib/db": db,
  "@/lib/admin-permissions": permissionMock(ok, perms, role),
  "@/lib/booking-requests-admin": requestsAdmin,
});

test("only superadmins can access contact requests and contact lookup cannot select booking records", async () => {
  const permissions = ["AVAILABILITY_VIEW", "AVAILABILITY_EDIT"];
  const url = "http://localhost/api/admin/anfragen?kind=contact";
  const request = (method, body = {}) => new Request(url, { method, body: JSON.stringify(body) });
  const editor = await load("../src/app/api/admin/anfragen/route.js", anfragenMocks(noDb, permissions));
  assert.equal((await editor.POST(request("POST"))).status, 403);
  assert.equal((await editor.DELETE(request("DELETE", { ids: [1] }))).status, 403);
  const detail = await load("../src/app/api/admin/anfragen/[id]/route.js", anfragenMocks(noDb, permissions));
  assert.equal((await detail.PATCH(request("PATCH", { status: "APPROVED" }), { params: { id: "1" } })).status, 403);

  let selection;
  const db = {
    bookingRequest: noDb.bookingRequest,
    contactRequest: {
      findMany: async (options) => { selection = options; return []; },
      count: async () => 0,
      groupBy: async () => [],
    },
  };
  const admin = await load("../src/app/api/admin/anfragen/route.js", anfragenMocks(db, permissions, true, "SUPERADMIN"));
  const response = await admin.POST(request("POST", { q: "Rückfrage" }));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(selection.select.deduplicationKey, undefined);
  assert.equal(selection.select.property, undefined);
  assert.ok(selection.where.OR.some((field) => field.subject?.contains === "Rückfrage"));
});

test("booking requests are never readable or deletable without the right permission", async () => {
  const list = await load("../src/app/api/admin/anfragen/route.js", anfragenMocks(noDb, [], false));
  assert.equal((await list.POST(new Request("http://x/api/admin/anfragen", { method: "POST", body: "{}" }))).status, 401);
  assert.equal(list.GET, undefined, "no GET: search terms must never be part of a URL");
  assert.equal((await list.DELETE(new Request("http://x/api/admin/anfragen", { method: "DELETE", body: '{"olderThanMonths":12}' }))).status, 401);

  // Viewing right alone must not allow deleting or changing.
  const viewOnly = await load("../src/app/api/admin/anfragen/route.js", anfragenMocks(noDb, ["AVAILABILITY_VIEW"]));
  assert.equal((await viewOnly.DELETE(new Request("http://x/api/admin/anfragen", { method: "DELETE", body: '{"ids":[1]}' }))).status, 403);
  const one = await load("../src/app/api/admin/anfragen/[id]/route.js", anfragenMocks(noDb, ["AVAILABILITY_VIEW"]));
  const ctx = { params: Promise.resolve({ id: "1" }) };
  assert.equal((await one.DELETE(new Request("http://x", { method: "DELETE" }), ctx)).status, 403);
  assert.equal((await one.PATCH(new Request("http://x", { method: "PATCH", body: '{"status":"APPROVED"}' }), ctx)).status, 403);
});

test("bulk deletion of booking requests only accepts explicit ids or a retention of at least 6 months", async () => {
  let deleteWhere = null;
  const db = { bookingRequest: { deleteMany: async ({ where }) => { deleteWhere = where; return { count: 2 }; } } };
  const route = await load("../src/app/api/admin/anfragen/route.js", anfragenMocks(db, ["AVAILABILITY_VIEW", "AVAILABILITY_EDIT"]));
  const del = (body) => route.DELETE(new Request("http://x/api/admin/anfragen", { method: "DELETE", body: JSON.stringify(body) }));

  for (const body of [{}, { ids: [] }, { ids: ["x"] }, { ids: [-1] }, { olderThanMonths: 1 }, { olderThanMonths: 0 }, { olderThanMonths: "all" }]) {
    deleteWhere = null;
    assert.equal((await del(body)).status, 400, JSON.stringify(body));
    assert.equal(deleteWhere, null, "nothing may be deleted for " + JSON.stringify(body));
  }
  assert.equal((await del({ ids: [3, 3, 4] })).status, 200);
  assert.equal(JSON.stringify(deleteWhere), JSON.stringify({ id: { in: [3, 4] } }));
  assert.equal((await del({ olderThanMonths: 12 })).status, 200);
  const cutoff = deleteWhere.createdAt.lt;
  const elevenMonthsAgo = new Date(); elevenMonthsAgo.setUTCMonth(elevenMonthsAgo.getUTCMonth() - 11);
  assert.ok(cutoff < elevenMonthsAgo, "only requests older than 12 months are deleted");
});

test("request messages are split into phone and text for display", () => {
  assert.deepEqual(requestsAdmin.splitRequestMessage("Telefon: 0431 123\nNachricht: Hallo\nzweite Zeile"), { phone: "0431 123", text: "Hallo\nzweite Zeile" });
  assert.deepEqual(requestsAdmin.splitRequestMessage("Telefon: -\nNachricht: -"), { phone: "", text: "" });
  assert.equal(requestsAdmin.parseListQuery(new URLSearchParams("status=hack&page=-3&q=" + "a".repeat(500))).status, "ALL");
  assert.equal(requestsAdmin.parseListQuery(new URLSearchParams("page=-3")).page, 1);
  assert.equal(requestsAdmin.parseListQuery(new URLSearchParams("q=" + "a".repeat(500))).q.length, 100);
});
