import prisma from "@/lib/db";
import { createEvents } from "ics";

export const dynamic = "force-dynamic";

function dToParts(d) {
  const x = new Date(d);
  return [x.getFullYear(), x.getMonth() + 1, x.getDate()];
}

export async function GET(_req, { params }) {
  const slug = decodeURIComponent(params.slug);

  const property = await prisma.property.findUnique({
    where: { slug },
    select: {
      id: true, title: true, location: true,
      bookings: { select: { id:true, startDate:true, endDate:true, guestName:true } },
      requests: { select: { id:true, startDate:true, endDate:true, guestName:true, status:true } },
    },
  });
  if (!property) return new Response("Not found", { status: 404 });

  // Events: Bookings (VERBINDLICH) + Requests (optional, z. B. status===PENDING) – du kannst hier filtern
  const events = [];

  for (const b of property.bookings) {
    events.push({
      start: dToParts(b.startDate),
      end: dToParts(b.endDate),              // DTEND exklusiv → passt zu unserem Modell
      title: `${property.title} – Belegt`,
      description: b.guestName ? `Gast: ${b.guestName}` : undefined,
      status: "CONFIRMED",
      productId: "urlaub-gosch",
      uid: `booking-${b.id}@urlaub-gosch`,
      calName: `${property.title} Belegung`,
    });
  }

  for (const r of property.requests) {
    // Nur PENDING als „vorläufig blockiert“ exportieren:
    if (r.status !== "PENDING") continue;
    events.push({
      start: dToParts(r.startDate),
      end: dToParts(r.endDate),
      title: `${property.title} – Anfrage`,
      description: r.guestName ? `Anfrage von ${r.guestName}` : "Unverbindliche Anfrage",
      status: "TENTATIVE",
      productId: "urlaub-gosch",
      uid: `request-${r.id}@urlaub-gosch`,
      calName: `${property.title} Belegung`,
    });
  }

  const { error, value } = createEvents(events);
  if (error) {
    console.error(error);
    return new Response("Failed to create ICS", { status: 500 });
  }

  return new Response(value, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(property.title)}.ics"`,
      "Cache-Control": "no-cache",
    },
  });
}
