import test from "node:test";
import assert from "node:assert/strict";
import { safeNextPath } from "../src/lib/safe-redirect.js";
import {
  checkLoginLimit,
  clientIp,
  passwordProblem,
  recordLoginFailure,
  recordLoginSuccess,
  verifyPasswordConstantTime,
} from "../src/lib/rate-limit.js";

const req = (headers = {}) => ({ headers: new Headers(headers) });

test("post-login redirect only allows same-site paths", () => {
  assert.equal(safeNextPath("/account"), "/account");
  assert.equal(safeNextPath("/favorites?x=1"), "/favorites?x=1");
  for (const bad of ["//evil.example", "/\\evil.example", "https://evil.example", "javascript:alert(1)", "", null, "/\tx"]) {
    assert.equal(safeNextPath(bad), "/", String(bad));
  }
});

test("client IP ignores spoofed leftmost x-forwarded-for entries", () => {
  assert.equal(clientIp(req({ "x-real-ip": "203.0.113.5", "x-forwarded-for": "1.1.1.1" })), "203.0.113.5");
  assert.equal(clientIp(req({ "x-forwarded-for": "6.6.6.6, 198.51.100.7" })), "198.51.100.7");
});

test("account is locked after repeated failures and unlocked by success", () => {
  const email = `t${Date.now()}@example.test`;
  const r = req({ "x-real-ip": `10.9.${Math.floor(Math.random() * 250)}.1` });
  for (let i = 0; i < 8; i++) {
    assert.equal(checkLoginLimit(r, "test", email), null);
    recordLoginFailure("test", email);
  }
  const blocked = checkLoginLimit(r, "test", email);
  assert.equal(blocked?.status, 429);
  recordLoginSuccess("test", email);
  assert.equal(checkLoginLimit(r, "test", email), null);
});

test("password policy and constant-time verification for unknown accounts", async () => {
  assert.ok(passwordProblem("short"));
  assert.ok(passwordProblem("x".repeat(73)));
  assert.equal(passwordProblem("lang-genug-123"), null);
  assert.equal(await verifyPasswordConstantTime("whatever", null), false);
});
