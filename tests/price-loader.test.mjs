import test from "node:test";
import assert from "node:assert/strict";
import { createPriceLoader } from "../src/lib/price-loader.js";

const input = (propertyId) => ({ propertyId, arrival: "2026-11-07", departure: "2026-11-14" });
function harness(concurrency = 2) {
  const calls = [];
  const load = createPriceLoader({ concurrency, fetcher: (_url, options) => new Promise((resolve, reject) => {
    const call = { id: JSON.parse(options.body).propertyId, finish: () => resolve(Response.json({ total: 100 })), signal: options.signal };
    options.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
    calls.push(call);
  }) });
  return { calls, load };
}
const tick = () => new Promise((resolve) => setImmediate(resolve));

test("identical in-flight prices share one request; completed prices are fetched afresh", async () => {
  const { calls, load } = harness();
  const first = load(input(1)); const second = load(input("1"));
  assert.equal(calls.length, 1);
  calls[0].finish();
  assert.deepEqual(await first, await second);
  const fresh = load(input(1));
  assert.equal(calls.length, 2);
  calls[1].finish(); await fresh;
});
test("concurrency is bounded and interactive prices jump ahead of queued background work", async () => {
  const { calls, load } = harness(1);
  const a = load(input(1)); const b = load(input(2)); const c = load(input(3), { priority: true });
  assert.deepEqual(calls.map((call) => call.id), [1]);
  calls[0].finish(); await a; await tick();
  assert.deepEqual(calls.map((call) => call.id), [1, 3]);
  calls[1].finish(); await c; await tick();
  calls[2].finish(); await b;
});
test("cancelling one subscriber does not cancel another; abandoned queued work never starts", async () => {
  const { calls, load } = harness(1);
  const one = new AbortController(); const queued = new AbortController();
  const first = load(input(1), { signal: one.signal });
  const remaining = load(input(1));
  const second = load(input(2), { signal: queued.signal });
  const rejectedOne = assert.rejects(first, { name: "AbortError" });
  const rejectedQueued = assert.rejects(second, { name: "AbortError" });
  one.abort(); queued.abort();
  assert.equal(calls[0].signal.aborted, false);
  calls[0].finish(); await remaining; await rejectedOne; await rejectedQueued;
  assert.equal(calls.length, 1);
});
test("fully abandoned active work aborts and releases its slot", async () => {
  const { calls, load } = harness(1); const controller = new AbortController();
  const first = load(input(1), { signal: controller.signal });
  const rejection = assert.rejects(first, { name: "AbortError" });
  const second = load(input(2)); controller.abort(); await rejection; await tick();
  assert.equal(calls[0].signal.aborted, true);
  assert.equal(calls[1].id, 2);
  calls[1].finish(); await second;
});
