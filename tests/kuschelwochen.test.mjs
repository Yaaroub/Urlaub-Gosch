import test from "node:test";
import assert from "node:assert/strict";
import { applyKuschelwochen, parseTravelDate, validateKuschelwochenPeriods } from "../src/lib/kuschelwochen.js";

const periods = validateKuschelwochenPeriods([
  { startDate: "2026-10-31", endDate: "2026-12-18" },
  { startDate: "2027-01-07", endDate: "2027-03-19" },
  { startDate: "2027-10-30", endDate: "2027-12-17" },
]);
function quote({ arrival = "2026-10-31", nights = 7, prices, lastMinute = 0, enabled = true, windows = periods } = {}) {
  const start = parseTravelDate(arrival);
  const end = new Date(start.getTime() + nights * 86400000);
  const breakdown = Array.from({ length: nights }, (_, index) => {
    const base = prices?.[index] ?? 100;
    return { base, price: base - lastMinute, discountAmount: lastMinute, discountType: lastMinute ? "FIXED" : null, discountValue: lastMinute };
  });
  const result = applyKuschelwochen({ enabled, start, end, periods: windows, breakdown });
  return { result, breakdown, total: Math.round(breakdown.reduce((sum, row) => sum + row.price, 0) * 100) / 100 };
}

test("7/6 and 14/12 use existing nightly prices", () => {
  assert.equal(quote().total, 600);
  assert.equal(quote({ nights: 14 }).total, 1200);
  assert.equal(quote({ nights: 14 }).result.freeNights, 2);
});
test("mixed seasonal prices use the average; cent amounts reconcile", () => {
  const result = quote({ prices: [80, 80, 80, 100, 100, 100, 160] });
  assert.equal(result.total, 600);
  const cents = quote({ prices: [99.99, 87.23, 111.15, 66.66, 123.45, 98.76, 79.98] });
  const base = cents.breakdown.reduce((sum, row) => sum + Math.round(row.base * 100), 0);
  assert.equal(Math.round(cents.total * 100), base - Math.round(base / 7));
  assert.equal(cents.breakdown.reduce((sum, row) => sum + Math.round(row.discountAmount * 100), 0), Math.round(base / 7));
});
test("only exactly seven or fourteen nights and participating properties", () => {
  for (const nights of [1, 6, 8, 13, 15, 21]) assert.equal(quote({ nights }).result, null);
  assert.equal(quote({ enabled: false }).result, null);
  assert.equal(quote({ windows: [] }).result, null);
});
test("arrival and departure boundaries, Christmas gap and all three windows", () => {
  assert.equal(quote({ arrival: "2026-12-11" }).total, 600);
  for (const arrival of ["2026-10-30", "2026-12-12", "2026-12-25", "2027-01-06", "2027-03-13", "2027-12-11"]) assert.equal(quote({ arrival }).result, null);
  for (const arrival of ["2027-01-07", "2027-03-12", "2027-10-30", "2027-12-10"]) assert.equal(quote({ arrival }).total, 600);
});
test("only the better offer applies; no stacking", () => {
  const betterLastMinute = quote({ lastMinute: 20 });
  assert.equal(betterLastMinute.result, null);
  assert.equal(betterLastMinute.total, 560);
  const betterKuschelwochen = quote({ lastMinute: 10 });
  assert.equal(betterKuschelwochen.total, 600);
  assert(betterKuschelwochen.breakdown.every((row) => row.discountType === "KUSCHELWOCHEN"));
  assert.equal(quote({ enabled: false, lastMinute: 10 }).total, 630);
});
test("invalid dates, short and overlapping periods are rejected", () => {
  assert.equal(parseTravelDate("2027-02-29"), null);
  assert.equal(parseTravelDate("2027-01-07T23:00:00Z"), null);
  assert.throws(() => validateKuschelwochenPeriods([{ startDate: "2027-01-07", endDate: "2027-01-10" }]));
  assert.throws(() => validateKuschelwochenPeriods([{ startDate: "2027-01-07", endDate: "2027-02-01" }, { startDate: "2027-01-20", endDate: "2027-02-20" }]));
  assert.deepEqual(validateKuschelwochenPeriods([]), []);
});
