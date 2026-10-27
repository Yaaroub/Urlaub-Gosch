import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";
import { createRequire } from "node:module";
import * as logic from "../src/lib/kuschelwochen.js";

const require = createRequire(import.meta.url);
const { transform } = require("next/dist/build/swc");
async function loadRoute(path, mocks) {
  const { code } = await transform(await fs.readFile(new URL(path, import.meta.url), "utf8"), {
    filename: path, jsc: { parser: { syntax: "ecmascript" } }, module: { type: "commonjs" },
  });
  const module = { exports: {} };
  vm.runInNewContext(code, { exports: module.exports, module, Response, Date, console, require: (name) => {
    if (!(name in mocks)) throw new Error(`Unexpected import: ${name}`);
    return mocks[name];
  } });
  return module.exports;
}
const periods = [{ startDate: new Date("2026-10-31"), endDate: new Date("2026-12-18") }];
async function price({ offer = [], enabled = true, missingPrice = false, booked = false } = {}) {
  const route = await loadRoute("../src/app/api/price/route.js", {
    "@/lib/kuschelwochen": logic,
    "@/lib/kuschelwochen-periods": { getKuschelwochenPeriods: async () => periods },
    "@/lib/db": {
      property: { findUnique: async () => ({ id: 1, kuschelwochenEnabled: enabled, pricePeriods: missingPrice ? [] : [{ startDate: new Date("2026-01-01"), endDate: new Date("2027-01-01"), pricePerNight: 100 }] }) },
      booking: { findFirst: async () => booked ? { id: 1 } : null },
      lastMinuteOffer: { findMany: async () => offer },
      extraCost: { findMany: async () => [{ title: "Reinigung", amount: 5000, isDaily: false }, { title: "Pro Nacht", amount: 1000, isDaily: true }] },
    },
  });
  const response = await route.POST({ json: async () => ({ propertyId: 1, arrival: "2026-10-31", departure: "2026-11-07" }) });
  return { status: response.status, body: await response.json() };
}

test("price API applies Kuschelwochen while charging extras for all seven nights", async () => {
  const { status, body } = await price();
  assert.equal(status, 200);
  assert.equal(body.subtotal, 600);
  assert.equal(body.extras, 120);
  assert.equal(body.total, 720);
  assert.equal(body.discountAmount, 100);
  assert(body.invoiceNote.includes("Ostsee-Kuschelwochen"));
  assert.equal(body.invoiceLines.find((line) => line.type === "discount").title, "Ostsee-Kuschelwochen");
});
test("price API keeps a better Last-Minute offer, with no extra Kuschelwochen discount", async () => {
  const { body } = await price({ offer: [{ startDate: new Date("2026-10-31"), endDate: new Date("2026-11-07"), discountType: "PERCENT", discount: 20 }] });
  assert.equal(body.total, 680);
  assert.equal(body.kuschelwochen, null);
  assert(body.invoiceNote.includes("Last-Minute"));
  assert.equal((await price({ enabled: false })).body.total, 820);
});
test("price API rejects occupied stays and missing rates", async () => {
  assert.equal((await price({ booked: true })).status, 409);
  assert.equal((await price({ missingPrice: true })).status, 422);
});
test("admin endpoint rejects unauthorized writes before changing periods", async () => {
  let changed = false;
  const route = await loadRoute("../src/app/api/admin/kuschelwochen/route.js", {
    "@/lib/db": { $transaction: async () => { changed = true; } },
    "@/lib/admin-permissions": { ADMIN_PERMISSIONS: { PRICES_EDIT: "PRICES_EDIT" }, requireAdminPermission: async () => ({ ok: false, status: 403, error: "Keine Berechtigung" }) },
    "@/lib/kuschelwochen": logic,
    "@/lib/kuschelwochen-periods": {},
    "next/cache": { revalidatePath: () => {} },
  });
  const response = await route.PUT({ json: async () => ({ periods: [] }) });
  assert.equal(response.status, 403);
  assert.equal(changed, false);
});
