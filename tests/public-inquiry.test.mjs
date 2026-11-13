import test from "node:test";
import assert from "node:assert/strict";
import { checkInquiryRequest, readInquiryJson, validInquiry } from "../src/lib/public-inquiry.js";
import config from "../next.config.mjs";

const request = (headers = {}, body = "{}") => new Request("https://example.com/api/booking-request", { method: "POST", headers: { "content-type": "application/json", ...headers }, body });
test("public inquiry rejects cross-site and large requests, and limits repeated attempts", () => {
  assert.equal(checkInquiryRequest(request({ origin: "https://attacker.test" })), 403);
  assert.equal(checkInquiryRequest(request({ "content-type": "text/plain" })), 415);
  assert.equal(checkInquiryRequest(request({ "content-length": "17000" })), 413);
  for (let i=0;i<10;i++) assert.equal(checkInquiryRequest(request({ "x-real-ip": "test-client" }), 1000), null);
  assert.equal(checkInquiryRequest(request({ "x-real-ip": "test-client" }), 1000), 429);
  assert.equal(checkInquiryRequest(request({ "x-real-ip": "test-client" }), 601001), null);
});
test("body limit also applies when content-length is absent", async () => {
  await assert.rejects(readInquiryJson(request({}, "x".repeat(16385))), /BODY_TOO_LARGE/);
  await assert.rejects(readInquiryJson(request({}, "{")));
  assert.deepEqual(await readInquiryJson(request({}, '{"message":"Hallo"}')), {message:"Hallo"});
});
test("inquiry validation rejects wrong types, oversized text and header injection", () => {
  const valid = { propertyId: 1, firstName: "Ada", lastName: "Test", email: "ada@example.com", message: "Hallo" };
  assert.equal(validInquiry(valid), true);
  for (const change of [{ email: "ada@example.com\r\nBcc:other@example.com" },{ firstName: {} },{ message: "x".repeat(5001) },{ propertyId: 1.2 },{ email: "not-an-email" }]) assert.equal(validInquiry({...valid,...change}), false);
});
test("security headers block framing and MIME sniffing without disabling application scripts", async () => {
  const headers = Object.fromEntries((await config.headers())[0].headers.map(h=>[h.key,h.value]));
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.equal(headers["X-Frame-Options"], "DENY");
  assert.match(headers["Content-Security-Policy"], /frame-ancestors 'none'/);
  assert.match(headers["Content-Security-Policy"], /form-action 'self'/);
});
