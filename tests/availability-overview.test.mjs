import test from "node:test";
import * as safeLog from "../src/lib/safe-log.js";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";
import { createRequire } from "node:module";
import { getOverviewWindow, getDayStatus, getFreeIntervals, isStayAvailable, selectCalendarStay } from "../src/lib/availability-overview.js";

const stays = [{ startDate: "2026-10-20", endDate: "2026-10-25" }, { startDate: "2026-10-25", endDate: "2026-10-28" }];
test("calendar selection prices one object and permits departure at the next booking's arrival", () => {
  const property = { id: 1, bookings: stays };
  const first = selectCalendarStay(null, property, "2026-10-18").selection;
  assert.deepEqual(first, { propertyId: 1, arrival: "2026-10-18", departure: null });
  assert.equal(selectCalendarStay(first, property, "2026-10-20").selection.departure, "2026-10-20");
  assert.ok(selectCalendarStay(first, property, "2026-10-29").error);
  assert.ok(selectCalendarStay(null, property, "2026-10-25").error);
  assert.equal(selectCalendarStay(null, property, "2026-10-28").selection.arrival, "2026-10-28");
});
test("earlier clicks restart selection, another row cannot complete it", () => {
  const current = { propertyId: 1, arrival: "2026-11-07", departure: null };
  assert.deepEqual(selectCalendarStay(current, { id: 1, bookings: [] }, "2026-11-06").selection, { propertyId: 1, arrival: "2026-11-06", departure: null });
  assert.deepEqual(selectCalendarStay(current, { id: 2, bookings: [] }, "2026-11-10").selection, { propertyId: 2, arrival: "2026-11-10", departure: null });
});
test("partial availability finds every free gap clipped to the search", () => {
  const bookings = [{ startDate: "2026-11-01", endDate: "2026-11-09" }, { startDate: "2026-11-13", endDate: "2026-11-20" }];
  assert.deepEqual(getFreeIntervals(bookings, "2026-11-07", "2026-11-14"), [{ arrival: "2026-11-09", departure: "2026-11-13", nights: 4 }]);
  assert.deepEqual(getFreeIntervals([{ startDate: "2026-11-09", endDate: "2026-11-11" }], "2026-11-07", "2026-11-14"), [
    { arrival: "2026-11-07", departure: "2026-11-09", nights: 2 },
    { arrival: "2026-11-11", departure: "2026-11-14", nights: 3 },
  ]);
});
test("overlaps, duplicates and touching stays cannot create artificial gaps", () => {
  const bookings = [...stays, stays[0], { startDate: "2026-10-21", endDate: "2026-10-23" }].reverse();
  assert.deepEqual(getFreeIntervals(bookings, "2026-10-20", "2026-10-28"), []);
  assert.deepEqual(getFreeIntervals(bookings, "2026-10-20", "2026-10-29"), [{ arrival: "2026-10-28", departure: "2026-10-29", nights: 1 }]);
});
test("empty calendars, out-of-window stays and DST retain complete free intervals", () => {
  const expected = [{ arrival: "2026-10-24", departure: "2026-10-26", nights: 2 }];
  assert.deepEqual(getFreeIntervals([], "2026-10-24", "2026-10-26"), expected);
  assert.deepEqual(getFreeIntervals([{ startDate: "2026-10-26", endDate: "2026-10-29" }, { startDate: "2026-10-01", endDate: "2026-10-24" }], "2026-10-24", "2026-10-26"), expected);
  assert.deepEqual(getFreeIntervals([], "invalid", "2026-10-26"), []);
});
test("checkout is exclusive for availability, shared turnover is occupied", () => {
  assert.equal(isStayAvailable(stays, "2026-10-28", "2026-11-04"), true);
  assert.equal(isStayAvailable(stays, "2026-10-13", "2026-10-20"), true);
  assert.equal(isStayAvailable(stays, "2026-10-25", "2026-10-26"), false);
  assert.equal(isStayAvailable(stays, "2026-10-19", "2026-10-29"), false);
  assert.equal(getDayStatus(stays, "2026-10-25"), "booked");
  assert.equal(getDayStatus(stays, "2026-10-20"), "boundary");
  assert.equal(getDayStatus(stays, "2026-10-28"), "boundary");
  assert.equal(getDayStatus(stays, "2026-10-29"), "free");
});
test("invalid and oversized date windows are rejected, DST does not change night count", () => {
  for (const [a, b] of [["2026-02-30", "2026-03-05"], ["2026-10-29", "2026-10-29"], ["2026-10-30", "2026-10-29"], ["2026-01-01", "2026-12-31"], [null, null]]) assert.equal(getOverviewWindow(a, b), null);
  assert.equal(getOverviewWindow("2026-10-24", "2026-10-26").nights, 2);
  assert.equal(getOverviewWindow("2026-12-31", "2027-01-07").nights, 7);
});

async function loadRoute(auth, database) {
  const require = createRequire(import.meta.url);
  const { transform } = require("next/dist/build/swc");
  const path = "../src/app/api/admin/availability-overview/route.js";
  const { code } = await transform(await fs.readFile(new URL(path, import.meta.url), "utf8"), { filename: path, jsc: { parser: { syntax: "ecmascript" } }, module: { type: "commonjs" } });
  const module = { exports: {} };
  const mocks = { "@/lib/db": database, "@/lib/admin-permissions": { ADMIN_PERMISSIONS: { AVAILABILITY_VIEW: "AVAILABILITY_VIEW" }, requireAdminPermission: async (permission) => { assert.equal(permission, "AVAILABILITY_VIEW"); return auth; } }, "@/lib/availability-overview": { getOverviewWindow } };
  vm.runInNewContext(code, { module, exports: module.exports, Response, URL, console: { error() {} }, require: (name) => { if (name === "@/lib/safe-log") return safeLog; if (!(name in mocks)) throw Error(name); return mocks[name]; } });
  return module.exports;
}
const request = { url: "https://example.test/api/admin/availability-overview?arrival=2026-10-29&departure=2026-11-05" };
test("overview requires permission before accessing data", async () => {
  for (const status of [401, 403]) {
    const route = await loadRoute({ ok: false, status, error: "Denied" }, {});
    assert.equal((await route.GET(request)).status, status);
  }
});
test("overview fetches bounded calendars without guest information", async () => {
  let selection;
  const route = await loadRoute({ ok: true }, { property: { findMany: async (args) => { selection = args; return []; } } });
  const response = await route.GET(request);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(Object.keys(selection.select.bookings.select), ["startDate", "endDate"]);
  assert.equal(selection.select.bookings.where.endDate.gte.toISOString().slice(0, 10), "2026-10-26");
  assert.equal((await route.GET({ url: "https://example.test?arrival=broken" })).status, 400);
});
test("database failure is not represented as available inventory", async () => {
  const route = await loadRoute({ ok: true }, { property: { findMany: async () => { throw Error("offline"); } } });
  assert.equal((await route.GET(request)).status, 503);
});
