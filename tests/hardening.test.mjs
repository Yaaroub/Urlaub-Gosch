import test from "node:test";
import assert from "node:assert/strict";
import {
  checkLoginLimit,
  clientIp,
  passwordProblem,
  recordLoginFailure,
  recordLoginSuccess,
  verifyPasswordConstantTime,
} from "../src/lib/rate-limit.js";

const req = (headers = {}) => ({ headers: new Headers(headers) });

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

test("image URLs are limited to our own image storage and local paths", async () => {
  const { isAllowedImageUrl, BLOB_IMAGE_HOST } = await import("../src/lib/image-hosts.js");
  assert.equal(isAllowedImageUrl(`https://${BLOB_IMAGE_HOST}/objects/property-1/a.jpg`), true);
  assert.equal(isAllowedImageUrl("/hero/hero.jpeg"), true);
  for (const bad of [
    "https://evil.example/a.jpg",
    `http://${BLOB_IMAGE_HOST}/a.jpg`,
    `https://${BLOB_IMAGE_HOST}.evil.example/a.jpg`,
    `https://user:pw@${BLOB_IMAGE_HOST}/a.jpg`,
    `https://${BLOB_IMAGE_HOST}:8443/a.jpg`,
    "//evil.example/a.jpg",
    "javascript:alert(1)",
    "data:image/png;base64,AAAA",
    "",
    null,
  ]) {
    assert.equal(isAllowedImageUrl(bad), false, String(bad));
  }
});

test("content security policy restricts sources and blocks indexing of the vercel.app host", async () => {
  const { default: config } = await import("../next.config.mjs");
  const rules = await config.headers();
  const csp = Object.fromEntries(rules[0].headers.map((h) => [h.key, h.value]))["Content-Security-Policy"];
  for (const part of ["default-src 'self'", "object-src 'none'", "base-uri 'self'", "frame-ancestors 'none'", "form-action 'self'"]) {
    assert.ok(csp.includes(part), part);
  }
  assert.ok(!/script-src[^;]*\*/.test(csp), "no wildcard script source");
  const vercelRule = rules.find((rule) => rule.has?.some((h) => h.type === "host"));
  assert.match(vercelRule.headers[0].value, /noindex/);
  assert.equal(config.images.remotePatterns.some((p) => /unsplash|googleusercontent|\*/.test(p.hostname)), false);
});

test("error logs never contain submitted personal data", async () => {
  const { describeError } = await import("../src/lib/safe-log.js");
  const prismaLike = new Error(
    "Invalid `prisma.bookingRequest.create()` invocation:\n\n{\n  data: {\n    guestName: \"Erika Mustermann\",\n    guestEmail: \"erika@example.test\",\n    message: \"Telefon 0171 1234567\"\n  }\n}\nArgument missing."
  );
  prismaLike.name = "PrismaClientValidationError";
  const line = describeError(prismaLike);
  assert.equal(line, "PrismaClientValidationError");
  assert.equal(describeError(new Error("Erika Mustermann 0171 1234567 https://example.test/calendar.ics?token=private")), "Error");
  assert.equal(describeError({ name: "Erika Mustermann", code: "GUEST_EMAIL", message: "Private Anfrage" }), "Error");
  assert.equal(describeError({ name: "PrismaClientKnownRequestError", code: "P1001" }), "PrismaClientKnownRequestError | P1001");
});

test("calendar import keeps only the source, never the portal's event text", async () => {
  const fs = await import("node:fs/promises");
  const src = await fs.readFile(new URL("../src/lib/ical-import.js", import.meta.url), "utf8");
  const fn = src.slice(src.indexOf("export function icalImportLabel"));
  const icalImportLabel = new Function(`${fn.replace("export ", "")}; return icalImportLabel;`)();
  assert.equal(icalImportLabel(new URL("https://www.airbnb.de/calendar/ical/123.ics?s=secret")), "iCal-Import (airbnb.de)");
  assert.equal(icalImportLabel("kein-link"), "iCal-Import");
  for (const route of ["../src/app/api/admin/ical/import/route.js", "../src/app/api/admin/ical/sync/route.js"]) {
    const code = await fs.readFile(new URL(route, import.meta.url), "utf8");
    assert.ok(!/guestName:\s*event/.test(code), `${route} must not store event text as guest name`);
  }
});
