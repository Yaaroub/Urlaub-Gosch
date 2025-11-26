import prisma from "@/lib/db";

function toDateOnlyUTC(v) {
  const d = new Date(v);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
function overlaps(aStart, aEnd, bStart, bEnd) {
  return !(aEnd <= bStart || aStart >= bEnd); // end exklusiv
}

export async function PUT(req, { params }) {
  const id = Number(params.id);
  const { startDate, endDate, pricePerNight } = await req.json();
  if (!id || !startDate || !endDate || pricePerNight == null)
    return Response.json({ error: "Felder: startDate, endDate, pricePerNight" }, { status: 400 });

  const pp = await prisma.pricePeriod.findUnique({ where: { id } });
  if (!pp) return Response.json({ error: "Nicht gefunden" }, { status: 404 });

  const start = toDateOnlyUTC(startDate);
  const end   = toDateOnlyUTC(endDate);
  if (!(end > start)) return Response.json({ error: "endDate muss nach startDate liegen" }, { status: 400 });

  const others = await prisma.pricePeriod.findMany({
    where: { propertyId: pp.propertyId, NOT: { id } },
  });
  const conflict = others.find(o => overlaps(start, end, o.startDate, o.endDate));
  if (conflict) {
    return Response.json({ error: "Überschneidung mit bestehender Preiszeit.", conflict }, { status: 409 });
  }

  const updated = await prisma.pricePeriod.update({
    where: { id },
    data: { startDate: start, endDate: end, pricePerNight: Number(pricePerNight) },
  });
  return Response.json(updated);
}

export async function DELETE(_req, { params }) {
  const id = Number(params.id);
  await prisma.pricePeriod.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
