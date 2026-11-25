import test from "node:test";
import assert from "node:assert/strict";
import { confirmationHtml, confirmationText, notificationHtml, sendConfirmationMail, sendInquiryMail } from "../src/lib/mailjet-mail.js";

// Tests are sequential; each restores the environment even when an assertion fails.
const KEYS = ["MAILJET_API_KEY", "MAILJET_SECRET_KEY", "MAIL_FROM_EMAIL", "MAIL_FROM_NAME", "BOOKING_ADMIN_EMAIL", "CONTACT_ADMIN_EMAIL"];
async function withMailConfig(run) {
  const old = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
  Object.assign(process.env, {
    MAILJET_API_KEY: "test-key", MAILJET_SECRET_KEY: "test-secret",
    MAIL_FROM_EMAIL: "sender@example.com", MAIL_FROM_NAME: "Site",
    BOOKING_ADMIN_EMAIL: "bookings@example.com", CONTACT_ADMIN_EMAIL: "contact@example.com",
  });
  try { return await run(); }
  finally { for (const key of KEYS) if (old[key] === undefined) delete process.env[key]; else process.env[key] = old[key]; }
}

const message = { kind: "contact", subject: "Kontaktanfrage über die Website", text: "Hallo", replyTo: "guest@example.com", reference: "contact-1" };
const ok = () => Response.json({ Messages: [{ Status: "success", To: [{ Email: "contact@example.com", MessageUUID: "uuid-1", MessageID: 1 }] }] });

test("Mailjet sends only to our mailbox, guest only as Reply-To, tracking off", async () => {
  await withMailConfig(async () => {
    const id = await sendInquiryMail(message, async (url, options) => {
      assert.equal(url, "https://api.mailjet.com/v3.1/send");
      assert.equal(options.headers.Authorization, `Basic ${Buffer.from("test-key:test-secret").toString("base64")}`);
      const { Messages: [m], ...rest } = JSON.parse(options.body);
      assert.deepEqual(rest, {});
      assert.deepEqual(m.From, { Email: "sender@example.com", Name: "Site" });
      assert.deepEqual(m.To, [{ Email: "contact@example.com" }]);
      assert.equal(m.Cc, undefined);
      assert.equal(m.Bcc, undefined);
      assert.deepEqual(m.ReplyTo, { Email: "guest@example.com" });
      assert.equal(m.TrackOpens, "disabled");
      assert.equal(m.TrackClicks, "disabled");
      assert.equal(m.HTMLPart, undefined, "no layout given: plain text only");
      assert.equal(m.CustomID, "contact-1");
      return ok();
    });
    assert.equal(id, "uuid-1");
  });
});

test("Mailjet refuses header injection and missing configuration before sending", async () => {
  await withMailConfig(async () => {
    const never = () => { throw Error("must not send"); };
    await assert.rejects(sendInquiryMail({ ...message, replyTo: "guest@example.com\r\nBcc:x@example.com" }, never), /INVALID_REPLY_TO/);
    await assert.rejects(sendInquiryMail({ ...message, replyTo: "keine-adresse" }, never), /INVALID_REPLY_TO/);
    let sentSubject;
    await sendInquiryMail({ ...message, subject: "A\r\nBcc: x@example.com" }, async (_u, o) => { sentSubject = JSON.parse(o.body).Messages[0].Subject; return ok(); });
    assert(!/[\r\n]/.test(sentSubject));
    delete process.env.MAILJET_SECRET_KEY;
    await assert.rejects(sendInquiryMail(message, never), /MAIL_NOT_CONFIGURED/);
  });
});

test("Mailjet errors become fixed codes without provider text or guest data", async () => {
  await withMailConfig(async () => {
    const privateData = "guest-private@example.com private-message-text test-secret";
    const err = (related) => ({ Messages: [{ Status: "error", Errors: [{ ErrorCode: "mj-0000", StatusCode: 400, ErrorMessage: `fail ${privateData}`, ErrorRelatedTo: related }] }] });
    const cases = [
      [401, { ErrorMessage: privateData }, "MAIL_KEY_INVALID"],
      [403, { ErrorMessage: privateData }, "MAIL_KEY_PERMISSION_DENIED"],
      [400, err(["From.Email"]), "MAIL_SENDER_NOT_VALIDATED"],
      [400, err(["ReplyTo.Email"]), "MAIL_RECIPIENT_INVALID"],
      [400, err(["TextPart"]), "MAIL_PROVIDER_400"],
      [429, null, "MAIL_PROVIDER_429"],
      [500, [], "MAIL_PROVIDER_500"],
    ];
    for (const [status, body, code] of cases) {
      await assert.rejects(sendInquiryMail(message, async () => Response.json(body, { status })), (error) => {
        assert.equal(error.message, code);
        assert.equal(error.cause, undefined);
        assert.equal(String(error).includes(privateData), false);
        return true;
      });
    }
    await assert.rejects(sendInquiryMail(message, async () => new Response("<html>guest@example.com</html>", { status: 502 })), { message: "MAIL_PROVIDER_502" });
    await assert.rejects(sendInquiryMail(message, async () => Response.json({ Messages: [{ Status: "error" }] })), { message: "MAIL_INVALID_RESPONSE" });
  });
});

const okTo = (to) => () => Response.json({ Messages: [{ Status: "success", To: [{ Email: to, MessageUUID: "uuid-c" }] }] });

test("confirmation: one separate mail per form, guest is recipient, our mailbox is Reply-To", async () => {
  await withMailConfig(async () => {
    const cases = [
      [{ kind: "booking", requestType: "booking" }, "Ihre Buchungsanfrage bei Urlaub-GOSCH ist eingegangen", "Die Unterlagen stellen wir Ihnen"],
      [{ kind: "booking", requestType: "info" }, "Ihre Informationsanfrage bei Urlaub-GOSCH ist eingegangen", "keine Buchung"],
      [{ kind: "contact" }, "Ihre Nachricht an Urlaub-GOSCH ist eingegangen", "Kontaktformular"],
      [{ kind: "contact", landlord: true }, "Ihr Interesse als Vermieter bei Urlaub-GOSCH", "vermieten"],
    ];
    for (const [i, [input, subject, phrase]] of cases.entries()) {
      const to = `guest${i}@example.com`;
      const id = await sendConfirmationMail({ ...input, to, propertyTitle: "Haus <b>Meer</b>", arrival: new Date("2099-07-01"), departure: new Date("2099-07-08"), reference: `r${i}` }, async (url, options) => {
        const { Messages: [m] } = JSON.parse(options.body);
        assert.deepEqual(m.To, [{ Email: to }]);
        assert.deepEqual(m.ReplyTo, { Email: "sender@example.com" });
        assert.equal(m.Subject, subject);
        assert.equal(m.TrackOpens, "disabled");
        assert.equal(m.TrackClicks, "disabled");
        assert.equal(m.CustomID, `confirm-r${i}`);
        assert(m.TextPart.includes(phrase), phrase);
        assert(m.HTMLPart.includes('src="cid:urlaub-gosch-logo"'));
        assert(!/src="https?:/i.test(m.HTMLPart), "no external images");
        assert.equal(m.InlinedAttachments[0].ContentID, "urlaub-gosch-logo");
        assert(m.InlinedAttachments[0].Base64Content.startsWith("iVBORw0KGgo"), "PNG logo");
        return okTo(to)();
      });
      assert.equal(id, "uuid-c");
    }
  });
});

test("confirmation: booking shows property and dates (escaped), contact does not", () => {
  const booking = { kind: "booking", requestType: "booking", propertyTitle: "Haus <b>Meer</b>", arrival: new Date("2099-07-01"), departure: new Date("2099-07-08") };
  assert.match(confirmationText(booking), /Unterkunft: Haus <b>Meer<\/b>\nAnreise: {4}01\.07\.2099\nAbreise: {4}08\.07\.2099/);
  const html = confirmationHtml(booking);
  assert(html.includes("Haus &lt;b&gt;Meer&lt;/b&gt;"));
  assert(!html.includes("<b>Meer"));
  const contact = confirmationHtml({ kind: "contact", propertyTitle: "X", arrival: new Date("2099-07-01"), departure: new Date("2099-07-08") });
  assert(!contact.includes("01.07.2099"));
});

test("confirmation: limited per address, invalid addresses rejected without sending", async () => {
  await withMailConfig(async () => {
    let calls = 0;
    const fetcher = async () => { calls++; return okTo("limit@example.com")(); };
    const results = [];
    for (let i = 0; i < 5; i++) results.push(await sendConfirmationMail({ kind: "contact", to: i % 2 ? "LIMIT@example.com" : "limit@example.com" }, fetcher));
    assert.deepEqual(results, ["uuid-c", "uuid-c", "uuid-c", null, null]);
    assert.equal(calls, 3);
    assert.equal(await sendConfirmationMail({ kind: "contact", to: "a@example.com\nBcc: b@example.com" }, fetcher), null);
    assert.equal(await sendConfirmationMail({ kind: "contact", to: "kein" }, fetcher), null);
    assert.equal(calls, 3);
  });
});

test("notification HTML: guest input is escaped, only safe links, logo inline", async () => {
  const evil = '<script>alert(1)</script><img src="https://evil.example/x.png">';
  const html = notificationHtml({
    subject: "Neue Buchungsanfrage – Test", heading: "Neue Buchungsanfrage", badge: evil,
    sections: [{ title: "Gast", rows: [["Name", evil], ["E-Mail", "a@example.com", "mailto:a@example.com"], ["Böse", "x", "javascript:alert(1)"], ["Leer", ""]] }],
    message: `Zeile 1\n${evil}`, notice: "Hinweis", action: { label: "Öffnen", href: "javascript:alert(1)" },
  });
  assert(!html.includes("<script>"));
  assert(!/src="https?:/i.test(html), "no external images");
  assert(html.includes("&lt;script&gt;"));
  assert(html.includes('href="mailto:a@example.com"'));
  assert(!html.includes("javascript:"));
  assert(!html.includes(">Leer<"), "empty rows are hidden");
  assert(html.includes("Zeile 1<br>"));
  await withMailConfig(async () => {
    await sendInquiryMail({ ...message, layout: { heading: "Neue Kontaktanfrage", message: "Hallo" } }, async (url, options) => {
      const { Messages: [m] } = JSON.parse(options.body);
      assert(m.HTMLPart.includes("Neue Kontaktanfrage"));
      assert.equal(m.InlinedAttachments[0].ContentID, "urlaub-gosch-logo");
      assert.equal(m.TextPart, "Hallo");
      return ok();
    });
  });
});
