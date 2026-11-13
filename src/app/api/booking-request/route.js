import prisma from "@/lib/db";
import nodemailer from "nodemailer";
import { checkInquiryRequest, readInquiryJson, validInquiry } from "@/lib/public-inquiry";

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
        message: `
Telefon: ${phone || "-"}
Nachricht: ${message || "-"}
        `.trim(),
        status: "PENDING",
      },
    });

    // Admin-Mail. The request is already stored: a mail failure must not
    // produce an error for the guest (otherwise they resubmit -> duplicates).
    const adminEmail = process.env.BOOKING_ADMIN_EMAIL;
    if (adminEmail && process.env.SMTP_HOST) {
      try {
        const smtpPort = Number(process.env.SMTP_PORT || 587);
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: smtpPort,
          // 465 = implicit TLS; otherwise STARTTLS is mandatory (no plaintext fallback).
          secure: smtpPort === 465,
          requireTLS: smtpPort !== 465,
          tls: { minVersion: "TLSv1.2" },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 15000,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const text = `
Neue unverbindliche Anfrage (PENDING)

Objekt:  ${property.title}
Ort:     ${property.location ?? "-"}
Slug:    ${property.slug}

Zeitraum:
  Anreise:  ${fmtISODate(start)}
  Abreise:  ${fmtISODate(end)}

Gast:
  Name:    ${fullName}
  E-Mail:  ${email}
  Telefon: ${phone || "-"}

Nachricht:
${message || "-"}

Hinweis:
Die Tage sind im Kalender NOCH NICHT blockiert.
Bitte im Admin-Bereich prüfen und ggf. Buchung anlegen.
        `.trim();

        await transporter.sendMail({
          from: `"Urlaub-GOSCH" <${process.env.SMTP_FROM || adminEmail}>`,
          to: adminEmail,
          replyTo: { name: fullName, address: email.trim() },
          subject: `Neue Anfrage – ${property.title}`,
          text,
        });
      } catch (mailError) {
        console.error("POST /api/booking-request: admin mail failed (request saved):", request.id, mailError?.message);
      }
    }

    return Response.json({ ok: true, requestId: request.id });
  } catch (e) {
    console.error("POST /api/booking-request error:", e);
    return Response.json(
      { error: "Interner Fehler beim Erstellen der Anfrage." },
      { status: 500 }
    );
  }
}
