import test from "node:test";
import assert from "node:assert/strict";
import { sendInquiryMail } from "../src/lib/resend-mail.js";

// Tests are sequential; each restores the environment even when an assertion fails.
async function withMailConfig(run) {
  const keys = ["RESEND_API_KEY", "RESEND_FROM_EMAIL", "BOOKING_ADMIN_EMAIL", "CONTACT_ADMIN_EMAIL"];
  const old = Object.fromEntries(keys.map(k=>[k,process.env[k]]));
  Object.assign(process.env, { RESEND_API_KEY: "test-only", RESEND_FROM_EMAIL: "Site <sender@example.com>", BOOKING_ADMIN_EMAIL: "bookings@example.com", CONTACT_ADMIN_EMAIL: "contact@example.com" });
  try { return await run(); }
  finally { for (const key of keys) if(old[key]===undefined) delete process.env[key]; else process.env[key]=old[key]; }
}

const message = { kind: "contact", subject: "Kontakt", text: "Hallo", replyTo: "guest@example.com", idempotencyKey: "test-key" };

test("Resend uses configured recipients, verified sender and guest Reply-To; handles rejection", async () => {
  await withMailConfig(async () => {
    const id = await sendInquiryMail(message, async (url, options) => {
      assert.equal(url, "https://api.resend.com/emails");
      const body = JSON.parse(options.body);
      assert.equal(body.from, "Site <sender@example.com>");
      assert.deepEqual(body.to, ["contact@example.com"]);
      assert.equal(body.reply_to, "guest@example.com");
      assert.equal(options.headers["Idempotency-Key"], "test-key");
      return Response.json({ id: "mail-id" });
    });
    assert.equal(id, "mail-id");
    await assert.rejects(sendInquiryMail(message, async()=>Response.json({}, {status:429})), /MAIL_PROVIDER_429/);
    await assert.rejects(sendInquiryMail({...message,replyTo:"guest@example.com\r\nBcc:x@example.com"}, ()=>{throw Error("must not send")}), /INVALID_REPLY_TO/);
    delete process.env.RESEND_API_KEY;
    await assert.rejects(sendInquiryMail(message, ()=>{throw Error("must not send")}), /MAIL_NOT_CONFIGURED/);
  });
});

test("Resend classifies configuration failures without exposing provider messages or secrets", async () => {
  await withMailConfig(async () => {
    const privateData = "guest-private@example.com re_private_secret private-message-text";
    const cases = [
      [403, "validation_error", "The example.com domain is not verified. Please, add and verify your domain.", "MAIL_DOMAIN_NOT_VERIFIED"],
      [403, "validation_error", "You can only send testing emails to your own email address (owner@example.com).", "MAIL_TEST_RECIPIENT_RESTRICTED"],
      [403, "restricted_api_key", "API key is not active", "MAIL_KEY_PERMISSION_DENIED"],
      [401, "restricted_api_key", "This API key is restricted to only send emails.", "MAIL_KEY_PERMISSION_DENIED"],
      [403, "invalid_permission", "Access token is missing required scopes.", "MAIL_KEY_PERMISSION_DENIED"],
      [403, "suspended_api_key", "This API key is suspended", "MAIL_KEY_SUSPENDED"],
      [400, "validation_error", "API key is invalid", "MAIL_KEY_INVALID"],
      [401, "validation_error", "API key is invalid", "MAIL_KEY_INVALID"],
    ];
    for (const [status, name, providerMessage, code] of cases) {
      await assert.rejects(sendInquiryMail(message, async () => Response.json({
        name, message: `${providerMessage} ${privateData}`, key: privateData, guest: privateData,
      }, { status })), error => {
        assert.equal(error.message, code);
        assert.equal(error.cause, undefined);
        assert.equal(JSON.stringify(error).includes(privateData), false);
        assert.equal(String(error).includes(privateData), false);
        return true;
      });
    }
  });
});

test("Resend retains the HTTP error when the provider response is unknown or malformed", async () => {
  await withMailConfig(async () => {
    const cases = [
      [403, { name: "validation_error", message: "Unknown provider failure containing guest@example.com" }],
      [403, null],
      [403, []],
      [403, { name: {}, message: { private: "guest@example.com" } }],
      [403, { name: "validation_error", message: null }],
      [429, { name: "rate_limit_exceeded", message: "Too many requests" }],
      [500, { name: "validation_error", message: "The example.com domain is not verified." }],
      [500, { name: "validation_error", message: "API key is invalid" }],
    ];
    for (const [status, body] of cases) {
      await assert.rejects(sendInquiryMail(message, async () => Response.json(body, { status })), { message: `MAIL_PROVIDER_${status}` });
    }
    await assert.rejects(sendInquiryMail(message, async () => new Response("<html>guest@example.com upstream error</html>", { status: 403 })), { message: "MAIL_PROVIDER_403" });
  });
});
