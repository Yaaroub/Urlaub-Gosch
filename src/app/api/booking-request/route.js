import prisma from "@/lib/db";
import { sendConfirmationMail, sendInquiryMail } from "@/lib/mailjet-mail";
import { bookingFieldProblem, bookingRequestDetails, checkInquiryRequest, readInquiryJson, validInquiry } from "@/lib/public-inquiry";
import { logError } from "@/lib/safe-log";

function dateOnly(input) {
  if (typeof input !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(input)) return new Date(NaN);
  const d = new Date(`${input}T00:00:00.000Z`);
  return !Number.isNaN(+d) && d.toISOString().slice(0, 10) === input ? d : new Date(NaN);
}
function fmtISODate(d) {
  return d.toISOString().slice(0, 10);
}
function fmtGermanDate(d) {
  const [year, month, day] = fmtISODate(d).split("-");
  return `${day}.${month}.${year}`;
}

export async function POST(req) {
  const rejected = checkInquiryRequest(req);
  if (rejected) return Response.json({ error: "Anfrage nicht möglich. Bitte prüfen Sie Ihre Eingaben oder versuchen Sie es später erneut." }, { status: rejected, headers: rejected === 429 ? { "Retry-After": "600" } : {} });
  let data;
  try { data = await readInquiryJson(req); }
  catch (error) { return Response.json({ error: "Ungültige oder zu große Anfrage." }, { status: error.message === "BODY_TOO_LARGE" ? 413 : 400 }); }
  if (data && typeof data === "object" && data.website) {
    return Response.json({ error: "Der automatische Spam-Schutz hat die Anfrage abgelehnt. Bitte laden Sie die Seite neu und füllen Sie das Formular ohne automatisches Ausfüllen aus.", code: "SPAM_CHECK_FAILED" }, { status: 400 });
  }
  // Name the exact field, so guests know what to correct.
  const problem = bookingFieldProblem(data);
  if (problem || !validInquiry(data)) {
    const label = problem?.label;
    // Only the field name is logged, never the entered value.
    console.warn("Booking request rejected, field:", problem?.field || "general");
    return Response.json(
      { error: label ? `Bitte prüfen Sie das Feld „${label}“.` : "Bitte prüfen Sie Ihre Angaben.", field: problem?.field || null, code: "INVALID_FIELD" },
      { status: 400 }
    );
  }
  try {
    const {
      propertyId,
      arrival,
      departure,
      firstName,
      lastName,
      email,
      message,
    } = data;

    const pid = Number(propertyId);
    // Everything the form marks as required is required here as well.
    const details = bookingRequestDetails(data);
    if (!pid || !arrival || !departure || !firstName || !lastName || !email || !details) {
      return Response.json(
        { error: !arrival || !departure ? "Bitte wählen Sie An- und Abreise." : "Bitte füllen Sie alle Pflichtfelder aus.", code: "REQUIRED_FIELD" },
        { status: 400 }
      );
    }
    const kindLabel = details.requestType === "booking" ? "Buchungsanfrage" : "Informationsanfrage";
    const guestDetails = [
      `Art: ${kindLabel}`,
      `Anschrift: ${details.street}, ${details.postalCode} ${details.city}`,
      `Personen: ${details.adults} Erwachsene, ${details.children} Kinder`,
      `Haustiere: ${details.pets ? `ja, ${details.dogCount} Hund(e)` : "nein"}`,
    ].join("\n");

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

    const start = dateOnly(arrival);
    const end = dateOnly(departure);
    if (!(end > start) || (end - start) / 86400000 > 730) {
      return Response.json(
        { error: "Das Abreisedatum muss nach der Anreise liegen." },
        { status: 400 }
      );
    }
    // Arrival must not be in the past (calendar day in Europe/Berlin).
    const todayBerlin = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(new Date());
    if (fmtISODate(start) < todayBerlin) {
      return Response.json(
        { error: "Das Anreisedatum liegt in der Vergangenheit." },
        { status: 400 }
      );
    }

    const recent = await prisma.bookingRequest.count({ where: {
      guestEmail: { equals: email.trim(), mode: "insensitive" },
      createdAt: { gte: new Date(Date.now() - 3600000) },
    } });
    if (recent >= 5) return Response.json({ error: "Zu viele Anfragen. Bitte versuchen Sie es später erneut." }, { status: 429, headers: { "Retry-After": "3600" } });

    const property = await prisma.property.findUnique({
      where: { id: pid },
      select: { id: true, title: true, location: true, slug: true },
    });
    if (!property) {
      return Response.json(
        { error: "Die Unterkunft wurde nicht gefunden." },
        { status: 404 }
      );
    }

    // nicht über bestehende echte Buchungen drübergehen
    const overlap = await prisma.booking.findFirst({
      where: {
        propertyId: pid,
        NOT: [
          { endDate: { lte: start } },
          { startDate: { gte: end } },
        ],
      },
    });

    if (overlap) {
      return Response.json(
        { error: "Der Zeitraum ist bereits belegt." },
        { status: 409 }
      );
    }

    // Anfrage speichern (BookingRequest)
    const request = await prisma.bookingRequest.create({
      data: {
        propertyId: pid,
        startDate: start,
        endDate: end,
        guestName: fullName,
        guestEmail: email.trim().toLowerCase(),
        // No schema change: the extra form details are kept in the message text
        // (before "Nachricht:", so the admin view can still split it).
        message: `Telefon: ${details.mobile}\n${guestDetails}\nNachricht: ${message || "-"}`,
        status: "PENDING",
      },
    });

    let notificationSent = false;
    try {
        const text = `
Neue unverbindliche ${kindLabel} (PENDING)

Objekt:  ${property.title}
Ort:     ${property.location ?? "-"}
Slug:    ${property.slug}

Zeitraum:
  Anreise:  ${fmtGermanDate(start)}
  Abreise:  ${fmtGermanDate(end)}

Gast:
  Name:      ${fullName}
  Anschrift: ${details.street}, ${details.postalCode} ${details.city}
  E-Mail:    ${email}
  Mobil:     ${details.mobile}

Reisende:
  Erwachsene: ${details.adults}
  Kinder:     ${details.children}
  Haustiere:  ${details.pets ? `ja, ${details.dogCount} Hund(e)` : "nein"}

Nachricht:
${message || "-"}

Hinweis:
Die Tage sind im Kalender NOCH NICHT blockiert.
Bitte im Admin-Bereich prüfen und ggf. Buchung anlegen.
        `.trim();
      // Subject only names the property, never the guest.
      const nights = Math.round((end - start) / 86400000);
      const siteUrl = String(process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/+$/, "");
      const phoneHref = `tel:${details.mobile.replace(/[^\d+]/g, "")}`;
      const layout = {
        heading: `Neue ${kindLabel}`,
        badge: property.title,
        sections: [
          { title: "Aufenthalt", rows: [
            ["Unterkunft", property.title], ["Ort", property.location],
            ["Anreise", fmtGermanDate(start)], ["Abreise", fmtGermanDate(end)],
            ["Nächte", String(nights)],
          ] },
          { title: "Gast", rows: [
            ["Name", fullName],
            ["Anschrift", `${details.street}\n${details.postalCode} ${details.city}`],
            ["E-Mail", email.trim(), `mailto:${email.trim()}`],
            ["Mobil", details.mobile, phoneHref],
          ] },
          { title: "Reisende", rows: [
            ["Erwachsene", String(details.adults)], ["Kinder", String(details.children)],
            ["Haustiere", details.pets ? `ja, ${details.dogCount} Hund(e)` : "nein"],
          ] },
        ],
        message,
        notice: "Die Tage sind im Kalender noch NICHT blockiert. Bitte im Admin-Bereich prüfen und gegebenenfalls eine Buchung anlegen.",
        action: /^https:\/\/[^/\s]+$/i.test(siteUrl) ? { label: "Anfrage im Admin-Bereich öffnen", href: `${siteUrl}/admin/anfragen` } : null,
      };
      await sendInquiryMail({ subject: `Neue ${kindLabel} – ${property.title}`, text, replyTo: email.trim(), reference: `booking-request-${request.id}`, layout });
      notificationSent = true;
    } catch (error) {
      console.error("Booking notification failed; request saved:", request.id, /^[A-Z0-9_]+$/.test(error?.message || "") ? error.message : "MAIL_SEND_FAILED");
    }

    // Automatic confirmation of receipt to the guest (fixed texts only).
    // A failure never fails the request – it is already saved.
    let confirmationSent = false;
    try {
      confirmationSent = Boolean(await sendConfirmationMail({
        to: email.trim(), kind: "booking", requestType: details.requestType,
        propertyTitle: property.title, arrival: start, departure: end, reference: `booking-request-${request.id}`,
      }));
    } catch (error) {
      console.error("Booking confirmation failed:", request.id, /^[A-Z0-9_]+$/.test(error?.message || "") ? error.message : "MAIL_SEND_FAILED");
    }

    return Response.json({ ok: true, requestId: request.id, notificationSent, confirmationSent });
  } catch (e) {
    logError("POST /api/booking-request error:", e);
    return Response.json(
      { error: "Interner Fehler beim Erstellen der Anfrage." },
      { status: 500 }
    );
  }
}
