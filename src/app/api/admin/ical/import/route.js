import prisma from "@/lib/db";
import { parseIcsFromBuffer, parseIcsFromUrl } from "@/lib/ical-import";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/ical/import
 * - multipart/form-data: { file, propertyId }
 * - oder JSON: { url, propertyId }
 * Importiert Events als Booking-Einträge (ohne Duplikate),
 * überspringt Konflikte (optional: umschalten).
 */
export async function POST(req) {
  try {
    let propertyId, events = [];

    if ((req.headers.get("content-type") || "").includes("multipart/form-data")) {
      const form = await req.formData();
      propertyId = Number(form.get("propertyId"));
      const file = form.get("file");
      if (!file) return Response.json({ error: "file fehlt" }, { status: 400 });
      const buf = Buffer.from(await file.arrayBuffer());
      events = await parseIcsFromBuffer(buf);
    } else {
      const { url, propertyId: pid } = await req.json();
      propertyId = Number(pid);
      if (!url) return Response.json({ error: "url fehlt" }, { status: 400 });
      events = await parseIcsFromUrl(url);
    }

    if (!propertyId) return Response.json({ error: "propertyId fehlt" }, { status: 400 });

    // existierende Buchungen holen
    const existing = await prisma.booking.findMany({
      where: { propertyId },
      select: { id:true, startDate:true, endDate:true },
    });

    // Hilfsfunktion: überschneidet sich mit existierenden?
    function overlaps(aStart, aEnd, bStart, bEnd) {
      return aStart < bEnd && bStart < aEnd; // echte Überlappung bei exklusivem Enddatum
    }

    const toCreate = [];
    for (const ev of events) {
      const conflict = existing.some(b => overlaps(ev.start, ev.end, b.startDate, b.endDate));
      if (conflict) continue; // Skip bei Konflikt; alternativ: updaten/ersetzen
      toCreate.push({
        propertyId,
        startDate: ev.start,
        endDate: ev.end,
        guestName: ev.summary?.slice(0,120) || null,
      });
    }

    if (toCreate.length > 0) {
      await prisma.booking.createMany({ data: toCreate });
    }

    // Property-Metadaten updaten (wenn aus URL)
    await prisma.property.update({
      where: { id: propertyId },
      data: { icalUpdatedAt: new Date(), icalLastRunAt: new Date() },
    });

    return Response.json({ ok: true, created: toCreate.length, total: events.length });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Import fehlgeschlagen" }, { status: 500 });
  }
}
