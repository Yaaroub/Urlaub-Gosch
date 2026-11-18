import prisma from "@/lib/db";
import { checkInquiryRequest, readInquiryJson, validInquiry } from "@/lib/public-inquiry";
import { logError } from "@/lib/safe-log";
import { scheduleInquiryAlert } from "@/lib/inquiry-mail";

function dateOnly(input) {
  if (typeof input !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(input)) return new Date(NaN);
  const d = new Date(`${input}T00:00:00.000Z`);
  return !Number.isNaN(+d) && d.toISOString().slice(0, 10) === input ? d : new Date(NaN);
}
function fmtISODate(d) {
  return d.toISOString().slice(0, 10);
}

export async function POST(req) {
  const rejected = checkInquiryRequest(req);
  if (rejected) return Response.json({ error: "Anfrage nicht möglich. Bitte prüfen Sie Ihre Eingaben oder versuchen Sie es später erneut." }, { status: rejected, headers: rejected === 429 ? { "Retry-After": "600" } : {} });
  let data;
  try { data = await readInquiryJson(req); }
  catch (error) { return Response.json({ error: "Ungültige oder zu große Anfrage." }, { status: error.message === "BODY_TOO_LARGE" ? 413 : 400 }); }
  if (!validInquiry(data)) return Response.json({ error: "Bitte prüfen Sie Ihre Kontaktdaten." }, { status: 400 });
  if (data.website) return Response.json({ error: "Anfrage nicht möglich." }, { status: 400 });
  try {
    const {
      propertyId,
      arrival,
      departure,
      firstName,
      lastName,
      email,
      phone,
      message,
    } = data;

    const pid = Number(propertyId);
    if (!pid || !arrival || !departure || !firstName || !lastName || !email) {
      return Response.json(
        { error: "Bitte füllen Sie alle Pflichtfelder aus." },
        { status: 400 }
      );
    }

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
      select: { id: true },
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
        message: `
Telefon: ${phone || "-"}
Nachricht: ${message || "-"}
        `.trim(),
        status: "PENDING",
      },
      select: { id: true },
    });

    scheduleInquiryAlert();
    return Response.json({ ok: true, requestId: request.id });
  } catch (e) {
    logError("POST /api/booking-request error:", e);
    return Response.json(
      { error: "Interner Fehler beim Erstellen der Anfrage." },
      { status: 500 }
    );
  }
}
