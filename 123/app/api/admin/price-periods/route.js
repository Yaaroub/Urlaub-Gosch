import prisma from "@/lib/db";

function toDateOnlyUTC(v) {
  const d = new Date(v);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
function overlaps(aStart, aEnd, bStart, bEnd) {
  // end exklusiv
  return !(aEnd <= bStart || aStart >= bEnd);
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const propertyId = Number(searchParams.get("propertyId"));
  if (!propertyId) return Response.json([]);
  const items = await prisma.pricePeriod.findMany({
    where: { propertyId },
    orderBy: { startDate: "asc" },
  });
  return Response.json(items);
}

export async function POST(req) {
  const { propertyId, startDate, endDate, pricePerNight } = await req.json();
  if (!propertyId || !startDate || !endDate || pricePerNight == null) {
    return Response.json({ error: "Felder: propertyId, startDate, endDate, pricePerNight" }, { status: 400 });
  }
  const start = toDateOnlyUTC(startDate);
  const end   = toDateOnlyUTC(endDate);
  if (!(end > start)) return Response.json({ error: "endDate muss nach startDate liegen" }, { status: 400 });

  // Overlap-Check gegen existierende Perioden
  const existing = await prisma.pricePeriod.findMany({ where: { propertyId: Number(propertyId) } });
  const conflict = existing.find(pp => overlaps(start, end, pp.startDate, pp.endDate));
  if (conflict) {
    return Response.json({ error: "Zeitraum überschneidet sich mit bestehender Preiszeit.", conflict }, { status: 409 });
  }

  const created = await prisma.pricePeriod.create({
    data: { propertyId: Number(propertyId), startDate: start, endDate: end, pricePerNight: Number(pricePerNight) },
  });
  return Response.json(created, { status: 201 });
}
