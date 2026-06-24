import prisma from "@/lib/db";
import nodemailer from "nodemailer";

function dateOnly(input) {
  const d = typeof input === "string" ? new Date(input) : new Date(input);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function fmtISODate(d) {
  return d.toISOString().slice(0, 10);
}

export async function POST(req) {
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
    } = await req.json();

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
    if (!(end > start)) {
      return Response.json(
        { error: "Das Abreisedatum muss nach der Anreise liegen." },
        { status: 400 }
      );
    }

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
        guestEmail: email,
        message: `
Telefon: ${phone || "-"}
Nachricht: ${message || "-"}
        `.trim(),
        status: "PENDING",
      },
    });

    // Admin-Mail
    const adminEmail = process.env.BOOKING_ADMIN_EMAIL;
    if (adminEmail) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: false,
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
        from: `"Urlaub-GOSCH" <${adminEmail}>`,
        to: adminEmail,
        subject: `Neue Anfrage – ${property.title}`,
        text,
      });
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
