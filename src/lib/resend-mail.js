export function mailConfig(kind = "booking") {
  return {
    key: process.env.RESEND_API_KEY,
    from: process.env.RESEND_FROM_EMAIL,
    to: kind === "contact" ? (process.env.CONTACT_ADMIN_EMAIL || process.env.BOOKING_ADMIN_EMAIL) : process.env.BOOKING_ADMIN_EMAIL,
  };
}

async function mailProviderError(response) {
  const data = await response.json().catch(() => null);
  const name = typeof data?.name === "string" ? data.name : "";
  const message = typeof data?.message === "string" ? data.message : "";
  let code = `MAIL_PROVIDER_${response.status}`;

  if (response.status === 403 && name === "validation_error") {
    if (/domain is not verified/i.test(message)) code = "MAIL_DOMAIN_NOT_VERIFIED";
    else if (/only send testing emails/i.test(message)) code = "MAIL_TEST_RECIPIENT_RESTRICTED";
  }
  if (response.status === 401 || response.status === 403) {
    if (name === "restricted_api_key" || name === "invalid_permission") code = "MAIL_KEY_PERMISSION_DENIED";
    else if (name === "suspended_api_key") code = "MAIL_KEY_SUSPENDED";
  }
  if ((response.status === 400 || response.status === 401) && name === "validation_error" && /api key is invalid/i.test(message)) code = "MAIL_KEY_INVALID";

  // Provider messages can contain account addresses or submitted data. Only log our fixed codes.
  return new Error(code);
}

export async function sendInquiryMail({ kind = "booking", subject, text, replyTo, idempotencyKey }, fetcher = fetch) {
  const { key, from, to } = mailConfig(kind);
  if (!key || !from || !to) throw new Error("MAIL_NOT_CONFIGURED");
  if (/[\r\n]/.test(replyTo) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyTo)) throw new Error("INVALID_REPLY_TO");
  const response = await fetcher("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
    body: JSON.stringify({ from, to: [to], reply_to: replyTo, subject: subject.replace(/[\r\n]/g, " ").slice(0, 200), text }),
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw await mailProviderError(response);
  const result = await response.json();
  if (!result.id) throw new Error("MAIL_INVALID_RESPONSE");
  return result.id;
}
