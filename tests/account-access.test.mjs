import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";
import { createRequire } from "node:module";
import { SignJWT, decodeJwt, jwtVerify } from "jose";
import * as requestOrigin from "../src/lib/request-origin.js";

const require = createRequire(import.meta.url);
const { transform } = require("next/dist/build/swc");

async function load(path, mocks) {
  const { code } = await transform(await fs.readFile(new URL(path, import.meta.url), "utf8"), {
    filename: path,
    jsc: { parser: { syntax: "ecmascript" } },
    module: { type: "commonjs" },
  });
  const module = { exports: {} };
  vm.runInNewContext(code, {
    exports: module.exports,
    module,
    Response,
    URL,
    TextEncoder,
    process: { env: { AUTH_SECRET: "test-key-for-account-authorization-only" } },
    require(name) {
      assert.ok(name in mocks, `Unexpected import: ${name}`);
      return mocks[name];
    },
  });
  return module.exports;
}

test("the session cookie omits e-mail and is used only by the site's own origin", async () => {
  let userReads = 0;
  const user = { id: 1, email: "staff@example.test", role: "EDITOR", sessionVersion: 3, sessionTimeoutMinutes: 30, isActive: true };
  const auth = await load("../src/lib/auth.js", {
    jose: { SignJWT, jwtVerify },
    "./request-origin.js": requestOrigin,
    "next/headers": {},
    "@/lib/db": { user: { async findUnique() { userReads += 1; return user; } } },
    "@/lib/database-availability": { retryDatabaseRead: (read) => read() },
  });
  const token = await auth.createSession(user);
  assert.equal(decodeJwt(token).email, undefined);

  function request(origin, site) {
    return new Request("https://example.test/api/admin/properties", {
      headers: { cookie: `session=${token}`, origin, "sec-fetch-site": site },
    });
  }

  assert.equal(await auth.getCurrentUser(request("https://example.test", "same-origin")), user);
  assert.equal(await auth.getCurrentUser(request("https://other.example.test", "same-site")), null);
  assert.equal(await auth.getCurrentUser(request("https://example.invalid", "cross-site")), null);
  assert.equal(userReads, 1);
});

test("admin permission check stops when the verified session version changes", async () => {
  const user = { id: 1, role: "EDITOR", isActive: true, sessionVersion: 3 };
  const permission = "AVAILABILITY_VIEW";
  let nextUser = { ...user, adminPermissions: [{ permission }] };
  const guards = await load("../src/lib/admin-permissions.js", {
    "@/lib/auth": { getCurrentUser: async () => user, isStaffRole: (role) => role === "EDITOR" },
    "@/lib/db": { user: { findUnique: async () => nextUser } },
    "@/lib/database-availability": { retryDatabaseRead: (read) => read() },
  });
  assert.equal((await guards.requireAdminPermission(permission)).ok, true);
  nextUser = { ...nextUser, sessionVersion: 4 };
  assert.equal((await guards.requireAdminPermission(permission)).ok, false);
});

test("a reset during staff login prevents issuing a session with the new version", async () => {
  const user = { id: 1, email: "staff@example.test", password: "test-hash", role: "ADMIN", isActive: true, sessionVersion: 4 };
  let issued = false;
  let writeVersion;
  const route = await load("../src/app/api/admin/login/route.js", {
    "@/lib/auth": {
      isTrustedRequestOrigin: () => true,
      createSession: async () => { issued = true; return "test-token"; },
      sessionCookie: () => "session=test-token",
    },
    "@/lib/db": { user: {
      findUnique: async () => user,
      update: async ({ where }) => {
        writeVersion = where.sessionVersion;
        if (writeVersion !== 5) throw Object.assign(new Error(), { code: "P2025" });
        return { ...user, sessionVersion: 5 };
      },
    } },
    "@/lib/rate-limit": {
      checkLoginLimit: () => null,
      recordLoginFailure() {},
      recordLoginSuccess() {},
      verifyPasswordConstantTime: async () => true,
    },
    "@/lib/safe-log": { logError(error) { assert.fail(error); } },
  });
  const request = { json: async () => ({ email: user.email, password: "test-password" }) };
  const response = await route.POST(request);
  assert.equal(writeVersion, 4);
  assert.equal(response.status, 401);
  assert.equal(response.headers.get("set-cookie"), null);
  assert.equal(issued, false);
});

test("employee management only processes staff accounts", async () => {
  const roles = ["EDITOR", "ADMIN", "SUPERADMIN"];
  const currentUser = { id: 1, role: "SUPERADMIN", sessionVersion: 4 };
  const checkStaffFilter = ({ where }) => {
    assert.equal(where.id, 2);
    assert.deepEqual(where.role?.in, roles);
  };
  const mocks = {
    "@/lib/admin-auth": {
      STAFF_ROLES: roles,
      getSuperAdmin: async () => currentUser,
      getSuperAdminSession: async () => ({
        user: currentUser,
        session: { sessionVersion: 4, authTime: 12345 },
      }),
    },
    "@/lib/admin-permissions": {},
    "@/lib/auth": {},
    "@/lib/db": {
      user: {
        async findUnique(args) {
          checkStaffFilter(args);
          return null;
        },
        async updateMany(args) {
          checkStaffFilter(args);
          return { count: 0 };
        },
      },
    },
    bcrypt: {},
    crypto: {},
  };
  const employee = await load("../src/app/api/admin/mitarbeiter/[id]/route.js", mocks);
  const password = await load("../src/app/api/admin/mitarbeiter/[id]/password/route.js", mocks);
  const sessions = await load("../src/app/api/admin/mitarbeiter/[id]/sessions/route.js", mocks);
  const ctx = { params: Promise.resolve({ id: "2" }) };
  const actions = [employee.PATCH, employee.DELETE, password.POST, sessions.POST];
  for (const action of actions) assert.equal((await action({}, ctx)).status, 404);
});

test("customer (non-staff) accounts never receive a session", async () => {
  const customer = { id: 2, email: "kunde@example.test", role: "USER", sessionVersion: 0, isActive: true };
  const auth = await load("../src/lib/auth.js", {
    jose: { SignJWT, jwtVerify },
    "./request-origin.js": requestOrigin,
    "next/headers": {},
    "@/lib/db": { user: { async findUnique() { return customer; } } },
    "@/lib/database-availability": { retryDatabaseRead: (read) => read() },
  });
  const token = await auth.createSession(customer);
  const request = new Request("https://example.test/api/admin/properties", { headers: { cookie: `session=${token}` } });
  assert.equal(await auth.getCurrentUser(request), null);
});
