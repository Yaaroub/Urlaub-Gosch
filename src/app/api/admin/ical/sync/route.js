import prisma from "@/lib/db";
import { parseIcsFromUrl } from "@/lib/ical-import";

export const dynamic = "force-dynamic";

export async function POST(req) {
  const { propertyId } = await req.json();
  const pid = Number(propertyId);
  if (!pid) return Response.json({ error: "propertyId fehlt" }, { status: 400 });

  const property = await prisma.property.findUnique({
    where: { id: pid },
    select: { icalUrl: true },
  });
  if (!property || !property.icalUrl) {
    return Response.json({ error: "Keine icalUrl hinterlegt" }, { status: 400 });
  }

  try {
    const events = await parseIcsFromUrl(property.icalUrl);

    const existing = await prisma.booking.findMany({
      where: { propertyId: pid },
      select: { id:true, startDate:true, endDate:true },
    });

    function overlaps(aStart, aEnd, bStart, bEnd) {
      return aStart < bEnd && bStart < aEnd;
    }

    const toCreate = [];
    for (const ev of events) {
      const conflict = existing.some(b => overlaps(ev.start, ev.end, b.startDate, b.endDate));
      if (conflict) continue;
      toCreate.push({
        propertyId: pid,
        startDate: ev.start,
        endDate: ev.end,
        guestName: ev.summary?.slice(0,120) || null,
      });
    }

    if (toCreate.length > 0) {
      await prisma.booking.createMany({ data: toCreate });
    }

    await prisma.property.update({
      where: { id: pid },
      data: { icalUpdatedAt: new Date(), icalLastRunAt: new Date() },
    });

    return Response.json({ ok: true, created: toCreate.length, total: events.length });
  } catch (e) {
    console.error(e);
    await prisma.property.update({
      where: { id: pid },
      data: { icalLastRunAt: new Date() },
    });
    return Response.json({ error: "Sync fehlgeschlagen" }, { status: 500 });
  }
}
