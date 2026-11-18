import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const { transform } = require("next/dist/build/swc");
const source = await fs.readFile(new URL("../src/app/api/admin/anfragen/status/route.js", import.meta.url), "utf8");
const { code } = await transform(source, {
  filename: "route.js",
  jsc: { parser: { syntax: "ecmascript" } },
  module: { type: "commonjs" },
});

function setup(access) {
  const calls = [];
  function model(type, pending, id) {
    return {
      count({ where }) {
        calls.push(type);
        assert.equal(where.status, "PENDING");
        return pending;
      },
      findFirst({ orderBy, select }) {
        calls.push(type);
        assert.equal(orderBy.id, "desc");
        assert.deepEqual(Object.keys(select), ["id"]);
        return id ? { id } : null;
      },
    };
  }
  const dependencies = {
    "@/lib/admin-permissions": {
      ADMIN_PERMISSIONS: { AVAILABILITY_VIEW: "AVAILABILITY_VIEW" },
      requireAdminPermission(permission) {
        assert.equal(permission, "AVAILABILITY_VIEW");
        return access;
      },
    },
    "@/lib/db": { bookingRequest: model("booking", 2, 18), contactRequest: model("contact", 0, 0) },
    "@/lib/safe-log": { logError() {} },
  };

  const module = { exports: {} };
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    Response,
    require: (name) => dependencies[name],
  });
  return { calls, get: module.exports.GET };
}

const request = new Request("https://example.test/api/admin/anfragen/status");

test("inquiry counter denies unauthorised access without reading inquiries", async () => {
  const { get, calls } = setup({ ok: false, status: 403, error: "Zugriff verweigert" });
  const response = await get(request);
  assert.equal(response.status, 403);
  assert.match(response.headers.get("cache-control"), /no-store/);
  assert.deepEqual(calls, []);
});

test("inquiry counters disclose only permitted categories and integer summaries", async () => {
  const employee = setup({ ok: true, user: { role: "EDITOR" } });
  const limited = await employee.get(request);
  assert.deepEqual(await limited.json(), { booking: { pendingCount: 2, latestId: 18 } });
  assert.deepEqual(employee.calls, ["booking", "booking"]);

  const superadmin = setup({ ok: true, user: { role: "SUPERADMIN" } });
  const full = await superadmin.get(request);
  assert.match(full.headers.get("cache-control"), /private, no-store/);
  assert.deepEqual(await full.json(), {
    booking: { pendingCount: 2, latestId: 18 },
    contact: { pendingCount: 0, latestId: 0 },
  });
});
