/**
 * Sends form notifications (contact form, booking request) to our own
 * mailbox via Mailjet (Mailjet SAS, Paris – EU provider).
 *
 * Data protection:
 * - Notifications go only to our fixed business mailbox; the guest address
 *   is used there solely as Reply-To.
 * - The automatic confirmation to the guest contains only our own fixed
 *   texts (no name, no message or other text entered in the form), so the
 *   forms cannot be misused to send arbitrary content to third parties.
 *   It is limited per recipient address.
 * - Open and click tracking are switched off for every message.
 * - The subject never contains guest data (Mailjet keeps subjects in its
 *   message statistics); the guest data is only in the text body.
 * - All mails are HTML with a plain-text alternative; the logo is attached
 *   inline (no external images). Every value is HTML-escaped.
 * - Provider error messages may echo addresses or content, so only fixed
 *   error codes are ever passed on or logged.
 */

import { MAIL_LOGO_PNG_BASE64 } from "./mail-logo.js";

const MAILJET_SEND_URL = "https://api.mailjet.com/v3.1/send";
const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;

export function mailConfig(kind = "booking") {
  return {
    apiKey: process.env.MAILJET_API_KEY,
    secretKey: process.env.MAILJET_SECRET_KEY,
    from: process.env.MAIL_FROM_EMAIL,
    fromName: process.env.MAIL_FROM_NAME || "Urlaub-GOSCH Website",
    to:
      kind === "contact"
        ? process.env.CONTACT_ADMIN_EMAIL || process.env.BOOKING_ADMIN_EMAIL
        : process.env.BOOKING_ADMIN_EMAIL,
  };
}

function singleLine(value, max) {
  return String(value ?? "").replace(/[\r\n\0]+/g, " ").trim().slice(0, max);
}

async function mailProviderError(response) {
  const data = await response.json().catch(() => null);
  const errors = Array.isArray(data?.Messages)
    ? data.Messages.flatMap((m) => (Array.isArray(m?.Errors) ? m.Errors : []))
    : [];
  const related = errors.flatMap((e) => (Array.isArray(e?.ErrorRelatedTo) ? e.ErrorRelatedTo : []))
    .filter((r) => typeof r === "string");

  let code = `MAIL_PROVIDER_${response.status}`;
  if (response.status === 401) code = "MAIL_KEY_INVALID";
  else if (response.status === 403) code = "MAIL_KEY_PERMISSION_DENIED";
  else if (response.status === 400 && related.some((r) => /^From/i.test(r))) code = "MAIL_SENDER_NOT_VALIDATED";
  else if (response.status === 400 && related.some((r) => /^(To|ReplyTo)/i.test(r))) code = "MAIL_RECIPIENT_INVALID";
  // Never attach the provider text: it can contain addresses or content.
  return new Error(code);
}

/**
 * @param {{kind?: "booking"|"contact", subject: string, text: string, replyTo: string, reference?: string}} message
 * @returns {Promise<string>} Mailjet message id
 */
async function sendMailjet({ to, replyTo, subject, text, html, inline, reference }, fetcher) {
  const { apiKey, secretKey, from, fromName } = mailConfig();
  if (!apiKey || !secretKey || !from || !EMAIL_RE.test(from)) throw new Error("MAIL_NOT_CONFIGURED");

  const auth = Buffer.from(`${apiKey}:${secretKey}`).toString("base64");
  const response = await fetcher(MAILJET_SEND_URL, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      Messages: [
        {
          From: { Email: from, Name: singleLine(fromName, 80) },
          To: [{ Email: to }],
          ReplyTo: { Email: replyTo },
          Subject: singleLine(subject, 200),
          TextPart: String(text ?? ""),
          ...(html ? { HTMLPart: html } : {}),
          ...(inline ? { InlinedAttachments: inline } : {}),
          TrackOpens: "disabled",
          TrackClicks: "disabled",
          // Technical reference only (random form id / request number), never guest data.
          ...(reference ? { CustomID: singleLine(reference, 100) } : {}),
        },
      ],
    }),
    signal: AbortSignal.timeout(12000),
  });

  if (!response.ok) throw await mailProviderError(response);
  const result = await response.json().catch(() => null);
  const message = Array.isArray(result?.Messages) ? result.Messages[0] : null;
  const id = message?.Status === "success" ? message?.To?.[0]?.MessageUUID || message?.To?.[0]?.MessageID : null;
  if (!id) throw new Error("MAIL_INVALID_RESPONSE");
  return String(id);
}

function validAddress(value) {
  return typeof value === "string" && !/[\r\n]/.test(value) && value.length <= 254 && EMAIL_RE.test(value);
}

/**
 * Notification to our own mailbox (contact form, booking request).
 * `layout` (optional) is rendered as HTML next to the plain text; every
 * value in it is escaped, so guest input can never inject markup.
 * @param {{kind?: "booking"|"contact", subject: string, text: string, replyTo: string, reference?: string, layout?: object}} message
 * @returns {Promise<string>} Mailjet message id
 */
export async function sendInquiryMail({ kind = "booking", subject, text, replyTo, reference, layout }, fetcher = fetch) {
  const { to } = mailConfig(kind);
  if (!to || !EMAIL_RE.test(to)) throw new Error("MAIL_NOT_CONFIGURED");
  if (!validAddress(replyTo)) throw new Error("INVALID_REPLY_TO");
  const html = layout ? notificationHtml({ subject, ...layout }) : undefined;
  return sendMailjet({ to, replyTo, subject, text, html, inline: html ? [LOGO_ATTACHMENT] : undefined, reference }, fetcher);
}

/* ------------------------------------------------------------------ */
/* Automatic confirmation of receipt to the guest                      */
/* ------------------------------------------------------------------ */

const CONFIRMATIONS_PER_ADDRESS = 3;
const CONFIRMATION_WINDOW_MS = 60 * 60 * 1000;
const confirmationsSent = new Map();

// At most 3 confirmations per address and hour (per server instance), so
// nobody can flood a third person's mailbox through our forms.
function confirmationAllowed(address, now = Date.now()) {
  for (const [key, times] of confirmationsSent) {
    const recent = times.filter((t) => now - t < CONFIRMATION_WINDOW_MS);
    if (recent.length) confirmationsSent.set(key, recent);
    else confirmationsSent.delete(key);
  }
  const key = address.trim().toLowerCase();
  const times = confirmationsSent.get(key) || [];
  if (times.length >= CONFIRMATIONS_PER_ADDRESS) return false;
  if (confirmationsSent.size >= 10000) confirmationsSent.delete(confirmationsSent.keys().next().value);
  confirmationsSent.set(key, [...times, now]);
  return true;
}

function siteLink(path) {
  const origin = String(process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/+$/, "");
  return /^https:\/\/[^/\s]+$/i.test(origin) ? `${origin}${path}` : null;
}

function formatDay(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return `${String(d.getUTCDate()).padStart(2, "0")}.${String(d.getUTCMonth() + 1).padStart(2, "0")}.${d.getUTCFullYear()}`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

const COMPANY = {
  name: "Ostsee-Ferienhausvermietung Birgit Gosch",
  address: "Bahnhofstr. 25, 24217 Schönberg",
  phone: "04344 414415",
  phoneHref: "+494344414415",
  email: "info@urlaub-gosch.de",
};

/**
 * One separate confirmation per form. Only our own fixed texts plus the
 * property title (from our database) and the validated dates are used –
 * never a name, message or anything else typed in by the visitor.
 */
const TEMPLATES = {
  booking: {
    subject: "Ihre Buchungsanfrage bei Urlaub-GOSCH ist eingegangen",
    heading: "Vielen Dank für Ihre Buchungsanfrage",
    greeting: "Moin liebe Gäste,",
    intro: "Ihre Buchung ist bei uns eingegangen. Die Unterlagen stellen wir Ihnen kurzfristig per Mail zur Verfügung.",
    notice: null,
    showStay: true,
  },
  info: {
    subject: "Ihre Informationsanfrage bei Urlaub-GOSCH ist eingegangen",
    heading: "Vielen Dank für Ihre Informationsanfrage",
    intro: "Ihre Informationsanfrage ist bei uns eingegangen. Wir beantworten Ihre Fragen zur Unterkunft so schnell wie möglich.",
    notice: "Bitte beachten Sie: Eine Informationsanfrage ist keine Buchung. Der Zeitraum ist nicht für Sie reserviert.",
    showStay: true,
  },
  contact: {
    subject: "Ihre Nachricht an Urlaub-GOSCH ist eingegangen",
    heading: "Vielen Dank für Ihre Nachricht",
    intro: "Ihre Nachricht über unser Kontaktformular ist bei uns eingegangen. Wir melden uns so schnell wie möglich bei Ihnen.",
    notice: null,
    showStay: false,
  },
  landlord: {
    subject: "Ihr Interesse als Vermieter bei Urlaub-GOSCH",
    heading: "Vielen Dank für Ihr Interesse",
    intro: "Schön, dass Sie Ihre Ferienunterkunft über Urlaub-GOSCH vermieten möchten. Ihre Nachricht ist bei uns eingegangen. Wir melden uns persönlich bei Ihnen, um alles Weitere zu besprechen.",
    notice: null,
    showStay: false,
  },
};

export function confirmationTemplateKey({ kind, requestType, landlord }) {
  if (kind === "booking") return requestType === "booking" ? "booking" : "info";
  return landlord ? "landlord" : "contact";
}

function stayRows(template, { propertyTitle, arrival, departure }) {
  if (!template.showStay) return [];
  const rows = [];
  if (propertyTitle) rows.push(["Unterkunft", singleLine(propertyTitle, 200)]);
  const from = formatDay(arrival);
  const to = formatDay(departure);
  if (from && to) {
    rows.push(["Anreise", from]);
    rows.push(["Abreise", to]);
  }
  return rows;
}

const IGNORE_NOTE = "Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren oder uns kurz Bescheid geben.";
const AUTO_NOTE = "Diese E-Mail wurde automatisch versendet. Sie können direkt auf diese E-Mail antworten.";

/** Plain-text alternative (shown by mail clients without HTML). */
export function confirmationText(input) {
  const template = TEMPLATES[confirmationTemplateKey(input)];
  const privacy = siteLink("/datenschutz");
  const lines = [template.greeting || "Guten Tag,", "", template.intro];
  const rows = stayRows(template, input);
  if (rows.length) lines.push("", ...rows.map(([label, value]) => `${`${label}:`.padEnd(12)}${value}`));
  if (template.notice) lines.push("", template.notice);
  lines.push(
    "", IGNORE_NOTE, "",
    "Mit freundlichen Grüßen",
    "Ihr Team von Urlaub-GOSCH", "",
    COMPANY.name, COMPANY.address, `Telefon ${COMPANY.phone} · ${COMPANY.email}`, "",
    AUTO_NOTE,
    privacy ? `Datenschutz: ${privacy}` : "Informationen zum Datenschutz finden Sie auf unserer Website.",
  );
  return lines.join("\n");
}

/* ------------------------------------------------------------------ */
/* Shared HTML layout (table layout, inline styles: works in Outlook,  */
/* Gmail, Apple Mail). The logo is an inline attachment (cid).         */
/* ------------------------------------------------------------------ */

const FONT = "font-family:Arial,Helvetica,sans-serif;";
const LOGO_ATTACHMENT = { ContentType: "image/png", Filename: "urlaub-gosch-logo.png", ContentID: "urlaub-gosch-logo", Base64Content: MAIL_LOGO_PNG_BASE64 };

function multiline(value) {
  return escapeHtml(value).replace(/\r?\n/g, "<br>");
}

function safeHref(href) {
  const value = String(href ?? "");
  if (/^mailto:[^\s@<>"?&]+@[^\s@<>"?&]+$/i.test(value)) return value;
  if (/^tel:\+?[0-9]{3,20}$/.test(value)) return value;
  if (/^https:\/\/[^\s"<>]+$/i.test(value)) return value;
  return null;
}

function cellValue(value, href) {
  const link = safeHref(href);
  return link
    ? `<a href="${escapeHtml(link)}" style="color:#0077b6;text-decoration:none;">${escapeHtml(value)}</a>`
    : multiline(value);
}

function sectionTitle(title) {
  return `<tr><td style="padding:4px 32px 8px 32px;${FONT}font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#0077b6;font-weight:bold;">${escapeHtml(title)}</td></tr>`;
}

function infoTable(rows) {
  const visible = rows.filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== "");
  if (!visible.length) return "";
  return `<tr><td style="padding:0 32px 20px 32px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eaf7fb;border-radius:8px;">
      ${visible.map(([label, value, href], i) => `<tr>
        <td style="${FONT}font-size:14px;color:#475569;padding:9px 16px;width:120px;vertical-align:top;${i ? "border-top:1px solid #d6eef6;" : ""}">${escapeHtml(label)}</td>
        <td style="${FONT}font-size:15px;color:#0f172a;padding:9px 16px;font-weight:bold;vertical-align:top;${i ? "border-top:1px solid #d6eef6;" : ""}">${cellValue(value, href)}</td>
      </tr>`).join("")}
    </table>
  </td></tr>`;
}

function noticeBox(text) {
  return text
    ? `<tr><td style="padding:0 32px 20px 32px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="${FONT}font-size:14px;line-height:21px;color:#5b4511;background:#f7f1e5;border-left:4px solid #c49a3a;padding:12px 16px;">${escapeHtml(text)}</td>
      </tr></table></td></tr>`
    : "";
}

function messageBox(text) {
  return `<tr><td style="padding:0 32px 20px 32px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="${FONT}font-size:15px;line-height:23px;color:#0f172a;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 16px;">${multiline(text)}</td>
    </tr></table></td></tr>`;
}

function buttonRow(action) {
  const href = safeHref(action?.href);
  if (!href) return "";
  return `<tr><td style="padding:4px 32px 24px 32px;">
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td style="background:#0077b6;border-radius:8px;"><a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 22px;${FONT}font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;">${escapeHtml(action.label)}</a></td>
    </tr></table>
  </td></tr>`;
}

function mailLayout({ title, heading, badge, blocks, footerNote }) {
  return `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;"><tr><td align="center" style="padding:24px 12px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
    <tr><td align="center" style="padding:28px 32px 20px 32px;border-bottom:4px solid #0077b6;">
      <img src="cid:urlaub-gosch-logo" width="180" height="99" alt="Urlaub-GOSCH" style="display:block;border:0;width:180px;height:auto;">
    </td></tr>
    ${badge ? `<tr><td style="padding:24px 32px 0 32px;${FONT}font-size:13px;color:#0077b6;font-weight:bold;">${escapeHtml(badge)}</td></tr>` : ""}
    <tr><td style="padding:${badge ? "6px" : "28px"} 32px 18px 32px;${FONT}font-size:22px;line-height:28px;color:#050b1f;font-weight:bold;">${escapeHtml(heading)}</td></tr>
    ${blocks.join("\n    ")}
    <tr><td style="background:#050b1f;padding:22px 32px;${FONT}font-size:13px;line-height:20px;color:#cbd5e1;">
      <strong style="color:#ffffff;">${escapeHtml(COMPANY.name)}</strong><br>
      ${escapeHtml(COMPANY.address)}<br>
      Telefon <a href="tel:${COMPANY.phoneHref}" style="color:#ffffff;text-decoration:none;">${escapeHtml(COMPANY.phone)}</a> ·
      <a href="mailto:${COMPANY.email}" style="color:#ffffff;text-decoration:none;">${escapeHtml(COMPANY.email)}</a>
    </td></tr>
  </table>
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;"><tr>
    <td style="padding:14px 32px;${FONT}font-size:12px;line-height:18px;color:#64748b;text-align:center;">${footerNote}</td>
  </tr></table>
</td></tr></table>
</body></html>`;
}

function paragraph(html, size = 15, color = "#0f172a") {
  return `<tr><td style="padding:0 32px 20px 32px;${FONT}font-size:${size}px;line-height:${Math.round(size * 1.5)}px;color:${color};">${html}</td></tr>`;
}

/** HTML version of the confirmation to the guest. */
export function confirmationHtml(input) {
  const template = TEMPLATES[confirmationTemplateKey(input)];
  const privacy = siteLink("/datenschutz");
  const privacyLine = privacy
    ? `<a href="${escapeHtml(privacy)}" style="color:#0077b6;">Datenschutzerklärung</a>`
    : "Informationen zum Datenschutz finden Sie auf unserer Website.";
  return mailLayout({
    title: template.subject,
    heading: template.heading,
    blocks: [
      paragraph(`${escapeHtml(template.greeting || "Guten Tag,")}<br><br>${escapeHtml(template.intro)}`),
      infoTable(stayRows(template, input)),
      noticeBox(template.notice),
      paragraph("Mit freundlichen Grüßen<br><strong>Ihr Team von Urlaub-GOSCH</strong>"),
      paragraph(escapeHtml(IGNORE_NOTE), 13, "#64748b"),
    ],
    footerNote: `${escapeHtml(AUTO_NOTE)}<br>${privacyLine}`,
  });
}

/**
 * HTML version of a notification to our own mailbox.
 * @param {{subject: string, heading: string, badge?: string,
 *   sections?: {title: string, rows: [string, any, string?][]}[],
 *   message?: string, notice?: string, action?: {label: string, href: string}}} layout
 */
export function notificationHtml({ subject, heading, badge, sections = [], message, notice, action }) {
  const blocks = [];
  for (const section of sections) {
    const table = infoTable(section.rows);
    if (table) blocks.push(sectionTitle(section.title), table);
  }
  blocks.push(sectionTitle("Nachricht"), message && String(message).trim() ? messageBox(message) : paragraph("Keine Nachricht angegeben.", 14, "#64748b"));
  blocks.push(noticeBox(notice), buttonRow(action));
  return mailLayout({
    title: subject,
    heading,
    badge,
    blocks,
    footerNote: "Über das Formular auf der Website eingegangen. Mit „Antworten“ schreiben Sie direkt an den Absender.",
  });
}

/**
 * Sends the automatic confirmation of receipt to the guest. Returns the
 * message id, or null if the address is invalid or the per-address limit
 * is reached. Errors are thrown as fixed MAIL_* codes.
 * @param {{to: string, kind?: "booking"|"contact", requestType?: string, landlord?: boolean,
 *   propertyTitle?: string, arrival?: string|Date, departure?: string|Date, reference?: string}} input
 */
export async function sendConfirmationMail(input, fetcher = fetch) {
  const { to, reference } = input;
  if (!validAddress(to) || !confirmationAllowed(to)) return null;
  const { from } = mailConfig();
  const template = TEMPLATES[confirmationTemplateKey(input)];
  return sendMailjet({
    to,
    replyTo: from,
    subject: template.subject,
    text: confirmationText(input),
    html: confirmationHtml(input),
    inline: [LOGO_ATTACHMENT],
    reference: reference ? `confirm-${reference}` : undefined,
  }, fetcher);
}
