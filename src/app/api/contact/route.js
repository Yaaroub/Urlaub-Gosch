import { createHash } from "node:crypto";
import { checkInquiryRequest, readInquiryJson } from "@/lib/public-inquiry";
import { sendConfirmationMail, sendInquiryMail } from "@/lib/mailjet-mail";

// Mailjet has no idempotency keys. A repeated submit of the same form
// (double click, retry after a network error) is answered from this short,
// per-instance memory instead of sending a second mail. Only hashes are kept.
const SENT_TTL_MS = 24 * 60 * 60 * 1000;
const recentlySent = new Map();
function alreadySent(key, now = Date.now()) {
  for (const [k, at] of recentlySent) if (now - at > SENT_TTL_MS) recentlySent.delete(k);
  return recentlySent.has(key);
}
function rememberSent(key, now = Date.now()) {
  if (recentlySent.size >= 5000) recentlySent.delete(recentlySent.keys().next().value);
  recentlySent.set(key, now);
}

export async function POST(req) {
  const rejected = checkInquiryRequest(req);
  if (rejected) return Response.json({ error: "Anfrage nicht möglich. Bitte versuchen Sie es später erneut." }, { status: rejected });
  let data;
  try { data = await readInquiryJson(req); }
  catch (error) { return Response.json({ error: "Ungültige oder zu große Anfrage." }, { status: error.message === "BODY_TOO_LARGE" ? 413 : 400 }); }
  if (!data || typeof data !== "object" || Array.isArray(data)) return Response.json({ error: "Ungültige Anfrage." }, { status: 400 });
  for (const [field, label, max, required] of [["name","Name",200,true],["email","E-Mail-Adresse",254,true],["phone","Telefonnummer",50,false],["customSubject","Betreff",150,false],["message","Nachricht",5000,true]]) {
    const value = data[field] ?? "";
    if (typeof value !== "string" || (field !== "message" && /[\r\n\0]/.test(value))) return Response.json({ error: `Bitte prüfen Sie das Feld „${label}“.`, field, code: "INVALID_FIELD" }, { status: 400 });
    data[field] = value.trim();
    if (data[field].length > max) return Response.json({ error: `Das Feld „${label}“ darf höchstens ${max} Zeichen enthalten.`, field, code: "FIELD_TOO_LONG" }, { status: 400 });
    if (required && !data[field]) return Response.json({ error: `Bitte füllen Sie das Feld „${label}“ aus.`, field, code: "REQUIRED_FIELD" }, { status: 400 });
  }
  if (data.website) return Response.json({ error: "Der automatische Spam-Schutz hat die Anfrage abgelehnt. Bitte laden Sie die Seite neu und geben Sie Ihre Angaben ohne automatisches Ausfüllen ein.", code: "SPAM_CHECK_FAILED" }, { status: 400 });
  if (data.privacyAccepted !== true) return Response.json({ error: "Bitte bestätigen Sie den Datenschutzhinweis unter Ihrer Nachricht.", field: "privacyAccepted", code: "PRIVACY_REQUIRED" }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return Response.json({ error: "Bitte geben Sie eine vollständige E-Mail-Adresse ein, zum Beispiel name@beispiel.de.", field: "email", code: "INVALID_EMAIL" }, { status: 400 });
  if (typeof data.submissionId !== "string" || !/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(data.submissionId)) return Response.json({ error: "Das Formular konnte nicht zugeordnet werden. Bitte laden Sie die Seite neu und versuchen Sie es erneut.", code: "INVALID_SUBMISSION" }, { status: 400 });
  const type = data.isLandlordProspect === true ? "Vermieter-Interessent" : "Kontaktanfrage";
  const text = `${type}\n\nName: ${data.name.trim()}\nE-Mail: ${data.email.trim()}\nTelefon: ${data.phone || "-"}\nBetreff: ${data.customSubject || "-"}\n\n${data.message.trim()}`;
  const sentKey = createHash("sha256").update(`${data.submissionId.toLowerCase()}\n${text}`).digest("hex");
  if (alreadySent(sentKey)) return Response.json({ ok: true });
  try {
    // Neutral subject: no guest name or guest subject (kept in provider statistics).
    const layout = {
      heading: data.isLandlordProspect === true ? "Neuer Vermieter-Interessent" : "Neue Kontaktanfrage",
      badge: "Kontaktformular",
      sections: [{ title: "Absender", rows: [
        ["Name", data.name.trim()],
        ["E-Mail", data.email.trim(), `mailto:${data.email.trim()}`],
        ["Telefon", data.phone, data.phone ? `tel:${data.phone.replace(/[^\d+]/g, "")}` : null],
        ["Betreff", data.customSubject],
        ["Anliegen", data.isLandlordProspect === true ? "Möchte eine Unterkunft vermieten" : null],
      ] }],
      message: data.message.trim(),
      action: { label: "Antworten", href: `mailto:${data.email.trim()}` },
    };
    await sendInquiryMail({ kind: "contact", subject: `${type} über die Website`, text, replyTo: data.email.trim(), reference: `contact-${data.submissionId.toLowerCase()}`, layout });
    rememberSent(sentKey);
  } catch (error) {
    // Only our fixed MAIL_* codes, never provider text or form content.
    console.error("Contact mail failed:", /^[A-Z0-9_]+$/.test(error?.message || "") ? error.message : "MAIL_SEND_FAILED");
    return Response.json({ error: "Ihre Nachricht konnte gerade nicht versendet werden. Bitte versuchen Sie es erneut oder kontaktieren Sie uns telefonisch." }, { status: 503 });
  }
  // Automatic confirmation of receipt (fixed texts only); never fails the request.
  try {
    await sendConfirmationMail({ to: data.email.trim(), kind: "contact", landlord: data.isLandlordProspect === true, reference: `contact-${data.submissionId.toLowerCase()}` });
  } catch (error) {
    console.error("Contact confirmation failed:", /^[A-Z0-9_]+$/.test(error?.message || "") ? error.message : "MAIL_SEND_FAILED");
  }
  return Response.json({ ok: true });
}
