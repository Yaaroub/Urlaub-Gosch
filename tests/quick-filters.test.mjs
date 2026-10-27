import test from "node:test";
import assert from "node:assert/strict";
import { getQuickFilterResults } from "../src/lib/quick-filters.js";

const items = [
  { id: 1, kuschelwochenEnabled: true },
  { id: 2, kuschelwochenEnabled: false },
  { id: 3, kuschelwochenEnabled: true },
  { id: 4, kuschelwochenEnabled: false },
];
const defaults = { ready: true, favorites: new Set(["1", "2", "99"]), lastMinuteMap: new Map([["1", {}], ["3", {}]]) };

test("counts include only the current search results, not all saved favorites", () => {
  const { results, counts } = getQuickFilterResults(items, defaults);
  assert.deepEqual(results, items);
  assert.deepEqual(counts, { favorites: 2, lastMinute: 2, kuschelwochen: 2 });
});
test("all eight combinations filter by intersection, without mutating the input", () => {
  for (let mask = 0; mask < 8; mask++) {
    const options = { ...defaults, onlyFavs: Boolean(mask & 1), onlyLastMinute: Boolean(mask & 2), onlyKuschelwochen: Boolean(mask & 4) };
    const expected = items.filter((item) => (!options.onlyFavs || [1, 2].includes(item.id)) && (!options.onlyLastMinute || [1, 3].includes(item.id)) && (!options.onlyKuschelwochen || [1, 3].includes(item.id)));
    assert.deepEqual(getQuickFilterResults(items, options).results, expected);
  }
  assert.deepEqual(items.map((p) => p.id), [1, 2, 3, 4]);
});
test("counts account for other active filters, but not their own selection", () => {
  const options = { ...defaults, onlyFavs: true, onlyLastMinute: true };
  assert.deepEqual(getQuickFilterResults(items, options).counts, { favorites: 1, lastMinute: 1, kuschelwochen: 1 });
  assert.equal(getQuickFilterResults(items, { ...defaults, onlyFavs: true }).counts.favorites, 2);
});
test("removing favorites updates filtered results; loading does not hide properties", () => {
  assert.equal(getQuickFilterResults(items, { ...defaults, onlyFavs: true, favorites: new Set() }).results.length, 0);
  assert.equal(getQuickFilterResults(items, { ...defaults, onlyFavs: true, ready: false }).results.length, 4);
  assert.deepEqual(getQuickFilterResults([], defaults), { results: [], counts: { favorites: 0, lastMinute: 0, kuschelwochen: 0 } });
});
