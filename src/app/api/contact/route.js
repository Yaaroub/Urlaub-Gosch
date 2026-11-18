import { createHash } from "node:crypto";
import prisma from "@/lib/db";
import { checkInquiryRequest, readInquiryJson } from "@/lib/public-inquiry";
import { logError } from "@/lib/safe-log";
import { scheduleInquiryAlert } from "@/lib/inquiry-mail";

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
  const inquiry = {
    guestName: data.name,
    guestEmail: data.email,
    phone: data.phone || null,
    subject: data.customSubject || null,
    message: data.message,
    isLandlordProspect: data.isLandlordProspect === true,
  };
  const deduplicationKey = createHash("sha256")
    .update(JSON.stringify([data.submissionId.toLowerCase(), inquiry]))
    .digest("hex");

  try {
    const saved = await prisma.contactRequest.createMany({
      data: [{ ...inquiry, deduplicationKey }],
      skipDuplicates: true,
    });
    if (saved.count > 0) scheduleInquiryAlert();
    return Response.json({ ok: true });
  } catch (error) {
    logError("Contact request could not be saved", error);
    return Response.json({ error: "Ihre Nachricht konnte gerade nicht gespeichert werden. Bitte versuchen Sie es erneut oder kontaktieren Sie uns telefonisch." }, { status: 503 });
  }
}
