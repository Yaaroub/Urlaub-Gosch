import test from "node:test";
import assert from "node:assert/strict";
import { getCalendarBoundaries } from "../src/lib/calendar-boundaries.js";

const stay = (startDate, endDate) => ({ startDate, endDate });
const days = (values) => values.map((date) => date.getDate()).sort((a, b) => a - b);

test("single arrival and departure remain pink", () => {
  const result = getCalendarBoundaries([stay("2026-10-20", "2026-10-25")]);
  assert.deepEqual(days(result.changeoverDays), [20, 25]);
  assert.deepEqual(result.sharedDays, []);
});

test("same-day departure and next arrival are red, never pink", () => {
  const result = getCalendarBoundaries([
    stay("2026-10-25", "2026-10-29"),
    stay("2026-10-20", "2026-10-25"),
  ]);
  assert.deepEqual(days(result.sharedDays), [25]);
  assert.deepEqual(days(result.changeoverDays), [20, 29]);
});

test("consecutive one-night stays and month boundaries classify correctly", () => {
  const result = getCalendarBoundaries([
    stay("2026-10-31", "2026-11-01"),
    stay("2026-11-01", "2026-11-02"),
    stay("2026-11-02", "2026-11-03"),
  ]);
  assert.deepEqual(days(result.sharedDays), [1, 2]);
  assert.deepEqual(days(result.changeoverDays), [3, 31]);
});

test("gaps and duplicate bookings do not create shared days", () => {
  const result = getCalendarBoundaries([
    stay("2026-10-20", "2026-10-21"),
    stay("2026-10-20", "2026-10-21"),
    stay("2026-10-22", "2026-10-25"),
    stay("invalid", "2026-10-22"),
    stay("2026-10-22", "2026-10-22"),
  ]);
  assert.deepEqual(result.sharedDays, []);
  assert.deepEqual(days(result.changeoverDays), [20, 21, 22, 25]);
});
