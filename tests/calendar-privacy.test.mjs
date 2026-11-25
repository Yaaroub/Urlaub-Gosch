import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";
import { createRequire } from "node:module";
import { readInquiryJson } from "../src/lib/public-inquiry.js";
import { validateCalendarUrl } from "../src/lib/safe-calendar-fetch.js";
import * as publicCalendar from "../src/lib/public-calendar.js";
import { startOfTodayBerlin, currentBookingsWhere } from "../src/lib/public-calendar.js";
import { buildPropertyWhere, publicTravelWindow } from "../src/lib/search-utils.js";

const require = createRequire(import.meta.url);
const { transform } = require("next/dist/build/swc");

async function loadRoute(path, mocks) {
  const source = await fs.readFile(new URL(path, import.meta.url), "utf8");
  const { code } = await transform(source, {
    filename: path,
    jsc: { parser: { syntax: "ecmascript" } },
    module: { type: "commonjs" },
  });
  const module = { exports: {} };
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    Response,
    URL,
    process,
    require(name) {
      if (name === "@/lib/safe-log") return { logError() {} };
      if (!(name in mocks)) throw new Error(`Unexpected dependency ${name}`);
      return mocks[name];
    },
  });
  return module.exports;
}

test("Berlin's day boundary excludes historical occupancy from public search", () => {
  const today = startOfTodayBerlin(new Date("2026-11-17T23:30:00Z"));
  assert.equal(today.toISOString(), "2026-11-18T00:00:00.000Z");
  assert.equal(publicTravelWindow("2026-11-17", "2026-11-20", today), null);
  assert.ok(publicTravelWindow("2026-11-18", "2026-11-20", today));
  assert.deepEqual(buildPropertyWhere({ arrival: "2000-01-01", departure: "2000-01-03" }), {});
});

test("availability lookup failures are distinguishable from an empty calendar", async () => {
  const route = await loadRoute("../src/app/api/bookings/route.js", {
    "@/lib/db": { booking: { findMany: async () => { throw new Error("Database connection failed"); } } },
    "@/lib/admin-permissions": {},
    "@/lib/booking-lock": {},
    "@/lib/public-calendar": { currentBookingsWhere },
  });
  const response = await route.GET(new Request("http://localhost/api/bookings?propertyId=1"));
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(Array.isArray(await response.json()), false);
});

test("only iCal editors can see and update private calendar source URLs", async () => {
  process.env.AUTH_SECRET ||= "calendar-privacy-test-secret";
  delete process.env.NEXT_PUBLIC_SITE_URL;
  const privateUrl = "https://calendar.example.test/private.ics?token=test";
  let permissions = [];
  let calls = 0;
  let lastUpdate;
  const route = await loadRoute("../src/app/api/admin/ical/source/[id]/route.js", {
    "@/lib/db": { property: {
      findUnique: async ({ select }) => {
        calls++;
        assert.equal(select.icalUrl, permissions.includes("ICAL_EDIT"));
        return { slug: "test", title: "Test", icalUrl: privateUrl };
      },
      updateMany: async ({ data }) => { lastUpdate = data.icalUrl; return { count: 1 }; },
    } },
    "@/lib/admin-permissions": {
      ADMIN_PERMISSIONS: { ICAL_VIEW: "ICAL_VIEW", ICAL_EDIT: "ICAL_EDIT" },
      requireAdminPermission: async (permission) => permissions.includes(permission)
        ? { ok: true, user: { role: "EDITOR", permissions } }
        : { ok: false, status: 403, error: "Forbidden" },
    },
    "@/lib/auth": { isTrustedRequestOrigin: () => true },
    "@/lib/public-inquiry": { readInquiryJson },
    "@/lib/safe-calendar-fetch": { validateCalendarUrl },
    "@/lib/public-calendar": publicCalendar,
  });
  const context = { params: Promise.resolve({ id: "1" }) };
  const url = "http://localhost/api/admin/ical/source/1";
  const save = (icalUrl) => route.PUT(new Request(url, {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ icalUrl }),
  }), context);

  assert.equal((await route.GET(new Request(url), context)).status, 403);
  assert.equal(calls, 0);
  permissions = ["ICAL_VIEW"];
  const readonly = await route.GET(new Request(url), context);
  assert.equal(readonly.headers.get("cache-control"), "private, no-store");
  const readonlyBody = await readonly.json();
  assert.equal(readonlyBody.icalUrl, undefined);
  assert.equal(readonlyBody.exportUrl, undefined, "secret feed link only for iCal editors");
  assert.equal((await save(privateUrl)).status, 403);
  assert.equal(lastUpdate, undefined);

  permissions.push("ICAL_EDIT");
  const editorBody = await (await route.GET(new Request(url), context)).json();
  assert.equal(editorBody.icalUrl, privateUrl);
  assert.equal(editorBody.exportUrl, `http://localhost${publicCalendar.icalFeedPath("test", 1)}`);
  assert.match(editorBody.exportUrl, /\/api\/ical\/test\/[A-Za-z0-9_-]{22}$/);
  assert.equal((await save("http://calendar.example.test/private.ics")).status, 400);
  assert.equal(lastUpdate, undefined);
  assert.equal((await save(privateUrl)).status, 200);
  assert.equal(lastUpdate, privateUrl);
});
