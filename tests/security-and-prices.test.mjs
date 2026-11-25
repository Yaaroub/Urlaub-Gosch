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
import * as icalFeed from "../src/lib/ical-feed.js";
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
    "@/lib/db": { booking: { findMany: async (a) => { args = a; return [
      { id: 7, startDate: new Date("2026-12-01"), endDate: new Date("2026-12-08"), guestName: "TEST_GUEST_NOT_PUBLIC" },
      { id: 8, startDate: new Date("2026-12-08"), endDate: new Date("2026-12-15"), guestName: "TEST_GUEST_NOT_PUBLIC" },
      { id: 9, startDate: new Date("2027-01-10"), endDate: new Date("2027-01-12") },
    ]; } } }, "@/lib/admin-permissions": deny,
    "@/lib/public-calendar": publicCalendar,
    "@/lib/booking-lock": { withPropertyBookingLock: async () => { throw new Error("Lock must not be reached"); }, overlapWhere: () => ({}) },
  });
  const body = await (await route.GET({ url: "http://localhost/api/bookings?propertyId=1" })).json();
  assert.equal(args.select.guestName, undefined);
  assert.equal(args.select.id, undefined);
  assert.ok(args.where.endDate?.gt instanceof Date, "past bookings are filtered out");
  assert.ok(args.where.startDate?.lt instanceof Date, "only the public booking horizon");
  assert.deepEqual(Object.keys(body[0]).sort(), ["endDate", "startDate"]);
  // Back-to-back stays are merged: the guest change is not visible.
  assert.equal(body.length, 2);
  assert.equal(body[0].startDate.slice(0, 10), "2026-12-01");
  assert.equal(body[0].endDate.slice(0, 10), "2026-12-15");
  assert(!JSON.stringify(body).includes("TEST_GUEST_NOT_PUBLIC"));
});
function icalDb(state) {
  return {
    property: { findUnique: async (a) => { assert.equal(a.select.requests, undefined); state.lookups = (state.lookups || 0) + 1; return { id: 3, title: "Test" }; } },
    booking: { findMany: async (a) => { state.bookingArgs = a; return [{ id: 257, startDate: new Date("2026-12-01"), endDate: new Date("2026-12-08"), guestName: "TEST_GUEST_NOT_PUBLIC" }]; } },
  };
}
test("secret iCal feed exports bookings only: no names, no requests, no internal numbers", async () => {
  const state = {};
  const route = await load("../src/app/api/ical/[slug]/[token]/route.js", {
    "@/lib/db": icalDb(state), "@/lib/public-calendar": publicCalendar, "@/lib/ical-feed": icalFeed,
  });
  const previous = process.env.AUTH_SECRET;
  process.env.AUTH_SECRET = "security-test-only-secret";
  try {
    const token = publicCalendar.icalFeedToken(3);
    assert.match(token, /^[A-Za-z0-9_-]{22}$/);
    const res = await route.GET(null, { params: Promise.resolve({ slug: "test", token }) });
    assert.equal(res.status, 200);
    const body = await res.text();
    assert(body.includes("BEGIN:VCALENDAR"));
    assert(!body.includes("TEST_GUEST_NOT_PUBLIC"));
    assert(!/booking-257|request-/.test(body), "no internal numbers, no requests");
    assert.equal(state.bookingArgs.select.guestName, undefined);
    assert.ok(state.bookingArgs.where.endDate?.gt instanceof Date, "past bookings are filtered out");

    // Wrong, foreign or missing key: always the same 404, no bookings read.
    state.bookingArgs = undefined;
    for (const bad of ["", "x", token.slice(0, -1) + (token.endsWith("A") ? "B" : "A"), publicCalendar.icalFeedToken(4)]) {
      assert.equal((await route.GET(null, { params: Promise.resolve({ slug: "test", token: bad }) })).status, 404);
    }
    assert.equal(state.bookingArgs, undefined);
  } finally {
    process.env.AUTH_SECRET = previous;
  }
});
test("old iCal links without key are switched off unless a short transition is set", async () => {
  const state = {};
  const route = await load("../src/app/api/ical/[slug]/route.js", {
    "@/lib/db": icalDb(state), "@/lib/public-calendar": publicCalendar, "@/lib/ical-feed": icalFeed,
  });
  const previous = process.env.ICAL_LEGACY_LINKS_UNTIL;
  try {
    delete process.env.ICAL_LEGACY_LINKS_UNTIL;
    assert.equal((await route.GET(null, { params: Promise.resolve({ slug: "test" }) })).status, 404);
    assert.equal(state.lookups, undefined, "no database lookup without transition period");
    const now = new Date("2026-11-18T12:00:00Z");
    process.env.ICAL_LEGACY_LINKS_UNTIL = "2026-12-31";
    assert.equal(publicCalendar.legacyIcalLinksAllowed(now), true);
    process.env.ICAL_LEGACY_LINKS_UNTIL = "2027-06-30"; // longer than 60 days: refused
    assert.equal(publicCalendar.legacyIcalLinksAllowed(now), false);
    process.env.ICAL_LEGACY_LINKS_UNTIL = "2026-11-01"; // expired
    assert.equal(publicCalendar.legacyIcalLinksAllowed(now), false);
    process.env.ICAL_LEGACY_LINKS_UNTIL = "bald";
    assert.equal(publicCalendar.legacyIcalLinksAllowed(now), false);
  } finally {
    if (previous === undefined) delete process.env.ICAL_LEGACY_LINKS_UNTIL;
    else process.env.ICAL_LEGACY_LINKS_UNTIL = previous;
  }
});
test("feed keys depend on the secret and on the property", () => {
  const previous = { a: process.env.AUTH_SECRET, f: process.env.ICAL_FEED_SECRET };
  try {
    delete process.env.ICAL_FEED_SECRET;
    process.env.AUTH_SECRET = "first-secret";
    const first = publicCalendar.icalFeedToken(1);
    assert.notEqual(first, publicCalendar.icalFeedToken(2));
    assert.equal(publicCalendar.isValidIcalFeedToken(1, first), true);
    process.env.ICAL_FEED_SECRET = "rotated-feed-secret";
    assert.notEqual(publicCalendar.icalFeedToken(1), first, "rotating ICAL_FEED_SECRET invalidates all links");
    assert.equal(publicCalendar.isValidIcalFeedToken(1, first), false);
    delete process.env.ICAL_FEED_SECRET;
    delete process.env.AUTH_SECRET;
    assert.equal(publicCalendar.icalFeedToken(1), null, "no key without secret");
    assert.equal(publicCalendar.isValidIcalFeedToken(1, first), false);
  } finally {
    if (previous.a === undefined) delete process.env.AUTH_SECRET; else process.env.AUTH_SECRET = previous.a;
    if (previous.f === undefined) delete process.env.ICAL_FEED_SECRET; else process.env.ICAL_FEED_SECRET = previous.f;
  }
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

test("contact only reports success after mail acceptance and rejects missing consent", async () => {
  let sends = 0;
  let fail = false;
  const data = { name: "Ada", email: "ada@example.com", message: "Hallo", privacyAccepted: true, submissionId: "12345678-1234-1234-1234-123456789abc" };
  const route = await load("../src/app/api/contact/route.js", {
    "node:crypto": require("node:crypto"),
    "@/lib/public-inquiry": { checkInquiryRequest: () => null, readInquiryJson: req => req.json() },
    "@/lib/mailjet-mail": { sendInquiryMail: async () => { sends++; if(fail) throw Error("MAIL_PROVIDER_503"); } },
  });
  const req = body => ({ json: async () => body });
  assert.equal((await route.POST(req({...data,privacyAccepted:false}))).status,400);
  assert.equal(sends,0);
  assert.equal((await route.POST(req(data))).status,200);
  fail=true;
  assert.equal((await route.POST(req({...data,message:"Andere Nachricht"}))).status,503);
});

test("contact accepts a real form request, trims surrounding spaces and keeps retry identity", async () => {
  const sent = [];
  const confirmations = [];
  const route = await load("../src/app/api/contact/route.js", {
    "node:crypto": require("node:crypto"),
    "@/lib/public-inquiry": publicInquiry,
    "@/lib/mailjet-mail": { sendInquiryMail: async message => { sent.push(message); }, sendConfirmationMail: async c => { confirmations.push(c); return "id"; } },
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
  assert.equal(sent[0].replyTo, "ada@example.com");
  // Subject without guest data; data only in the body.
  assert.equal(sent[0].subject, "Kontaktanfrage über die Website");
  assert(!sent[0].subject.includes("Ada"));
  assert.match(sent[0].text, /Telefon: -\nBetreff: -\n\nHallo\nOstsee!$/);
  assert.equal(sent[0].reference, "contact-12345678-1234-1234-1234-123456789abc");
  // A repeated submit of the same form does not send a second mail.
  assert.equal(sent.length, 1);
  // One confirmation to the guest, without any typed-in text.
  assert.deepEqual(JSON.parse(JSON.stringify(confirmations)), [{ to: "ada@example.com", kind: "contact", landlord: false, reference: "contact-12345678-1234-1234-1234-123456789abc" }]);
});

test("contact: a failing confirmation never fails the request", async () => {
  const route = await load("../src/app/api/contact/route.js", {
    "node:crypto": require("node:crypto"),
    "@/lib/public-inquiry": { ...publicInquiry, checkInquiryRequest: () => null, readInquiryJson: req => req.json() },
    "@/lib/mailjet-mail": { sendInquiryMail: async () => {}, sendConfirmationMail: async () => { throw Error("MAIL_PROVIDER_500"); } },
  });
  const body = { name: "Ada", email: "ada@example.com", message: "Hallo", privacyAccepted: true, isLandlordProspect: true, submissionId: "22345678-1234-1234-1234-123456789abc" };
  const response = await route.POST({ json: async () => body });
  assert.equal(response.status, 200);
});

test("contact explains invalid fields without sending mail or weakening request protection", async () => {
  let sends = 0;
  const route = await load("../src/app/api/contact/route.js", {
    "node:crypto": require("node:crypto"),
    "@/lib/public-inquiry": publicInquiry,
    "@/lib/mailjet-mail": { sendInquiryMail: async () => { sends++; } },
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
  assert.equal(sends, 0);
});

const bookingForm = {
  propertyId: 1, requestType: "booking", arrival: "2099-11-01", departure: "2099-11-08",
  firstName: "Ada", lastName: "Test", email: "ada@example.com", street: "Teststr. 1", postalCode: "24217", city: "Testort",
  phone: "0171 000000", mobile: "0171 000000", adults: 2, children: 1, pets: true, dogCount: 1, message: "Hallo",
};
function bookingRoute(state, mail) {
  return load("../src/app/api/booking-request/route.js", {
    "@/lib/public-inquiry": { ...publicInquiry, checkInquiryRequest: () => null, readInquiryJson: req => req.json() },
    "@/lib/mailjet-mail": { sendInquiryMail: mail, sendConfirmationMail: async (c) => { (state.confirmations ||= []).push(c); return "id"; } },
    "@/lib/db": { bookingRequest: { count: async()=>0, create: async(a)=>{state.saved = a.data; return {id:123};} }, property: { findUnique: async()=>({id:1,title:"Test",slug:"test",location:"Ort"}) }, booking: { findFirst: async()=>null } },
  });
}
test("booking remains saved when the mail service fails, without reporting successful notification", async () => {
  const state = {};
  const route = await bookingRoute(state, async () => { throw Error("MAIL_PROVIDER_503"); });
  const response = await route.POST({ json: async()=>bookingForm });
  assert.equal(response.status,200);
  assert.ok(state.saved);
  assert.deepEqual(await response.json(),{ok:true,requestId:123,notificationSent:false,confirmationSent:true});
});
test("booking form: every required field stays required on the server", async () => {
  const state = {};
  let mails = 0;
  const route = await bookingRoute(state, async () => { mails++; });
  const broken = [
    { requestType: "" }, { requestType: "spam" }, { street: " " }, { postalCode: "" }, { postalCode: "<x>" }, { city: "" },
    { mobile: "", phone: "" }, { adults: 0 }, { adults: "2.5" }, { children: -1 }, { pets: "yes" }, { pets: false, dogCount: 2 },
    { dogCount: 11 }, { street: "Weg 1\nBcc: x@example.com" }, { firstName: "" }, { email: "kein" },
  ];
  for (const change of broken) {
    const response = await route.POST({ json: async()=>({ ...bookingForm, ...change }) });
    assert.equal(response.status, 400, JSON.stringify(change));
  }
  assert.equal(state.saved, undefined, "nothing saved for incomplete requests");
  assert.equal(mails, 0);
  assert.equal(state.confirmations, undefined, "no confirmation for rejected requests");
  // The guest is told exactly which field to correct.
  const plz = await (await route.POST({ json: async()=>({ ...bookingForm, postalCode: "" }) })).json();
  assert.equal(plz.field, "postalCode");
  assert.match(plz.error, /„PLZ“/);
  const spam = await (await route.POST({ json: async()=>({ ...bookingForm, website: "x" }) })).json();
  assert.equal(spam.code, "SPAM_CHECK_FAILED");
});
test("booking form details reach the mail and the stored request, subject without guest data", async () => {
  const state = {};
  const sent = [];
  const route = await bookingRoute(state, async (m) => { sent.push(m); });
  assert.equal((await route.POST({ json: async()=>bookingForm })).status, 200);
  const [mail] = sent;
  assert.equal(mail.subject, "Neue Buchungsanfrage – Test");
  assert(!mail.subject.includes("Ada"));
  // Dates as TT.MM.JJJJ in text and HTML layout.
  assert(mail.text.includes("Anreise:  01.11.2099") && mail.text.includes("Abreise:  08.11.2099"));
  const stayRows = Object.fromEntries(mail.layout.sections[0].rows.map(([k, v]) => [k, v]));
  assert.equal(stayRows.Anreise, "01.11.2099");
  assert.equal(stayRows.Nächte, "7");
  for (const part of ["Teststr. 1, 24217 Testort", "0171 000000", "Erwachsene: 2", "Kinder:     1", "ja, 1 Hund(e)", "Hallo"]) assert(mail.text.includes(part), part);
  const split = requestsAdmin.splitRequestMessage(state.saved.message);
  assert.equal(split.phone, "0171 000000");
  assert.equal(split.text, "Hallo");
  assert.deepEqual(split.details.map((d) => d.label), ["Art", "Anschrift", "Personen", "Haustiere"]);
});

// ---- Admin "Anfragen" (booking requests with guest contact data) ----
import * as requestsAdmin from "../src/lib/booking-requests-admin.js";

const noDb = new Proxy({}, { get: () => new Proxy({}, { get: () => async () => { throw new Error("Database must not be reached"); } }) });
const permissionMock = (ok, perms = []) => ({
  ADMIN_PERMISSIONS: { AVAILABILITY_VIEW: "AVAILABILITY_VIEW", AVAILABILITY_EDIT: "AVAILABILITY_EDIT" },
  requireAdminPermission: async (permission) =>
    ok && perms.includes(permission)
      ? { ok: true, user: { role: "EDITOR", permissions: perms } }
      : { ok: false, status: ok ? 403 : 401, error: "verweigert" },
});
const anfragenMocks = (db, perms, ok = true) => ({
  "@/lib/db": db,
  "@/lib/admin-permissions": permissionMock(ok, perms),
  "@/lib/booking-requests-admin": requestsAdmin,
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
  assert.deepEqual(requestsAdmin.splitRequestMessage("Telefon: 0431 123\nNachricht: Hallo\nzweite Zeile"), { phone: "0431 123", details: [], text: "Hallo\nzweite Zeile" });
  assert.deepEqual(requestsAdmin.splitRequestMessage("Telefon: -\nNachricht: -"), { phone: "", details: [], text: "" });
  // A guest cannot fake detail lines inside the free-text message.
  assert.deepEqual(requestsAdmin.splitRequestMessage("Telefon: 1\nNachricht: x\nAnschrift: gefälscht").details, []);
  assert.equal(requestsAdmin.parseListQuery(new URLSearchParams("status=hack&page=-3&q=" + "a".repeat(500))).status, "ALL");
  assert.equal(requestsAdmin.parseListQuery(new URLSearchParams("page=-3")).page, 1);
  assert.equal(requestsAdmin.parseListQuery(new URLSearchParams("q=" + "a".repeat(500))).q.length, 100);
});
