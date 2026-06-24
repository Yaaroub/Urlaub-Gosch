import prisma from "@/lib/db";

export async function GET() {
  const items = await prisma.property.findMany({
    include: { amenities: true, pricePeriods: true, bookings: true },
    orderBy: { id: "asc" },
  });
  return Response.json(items);
}

export async function POST(req) {
  const data = await req.json();

  const created = await prisma.property.create({
    data: {
      title: data.title,
      description: data.description ?? null,
      location: data.location,
      maxPersons: Number(data.maxPersons ?? 2),
      dogsAllowed: !!data.dogsAllowed,
      amenities: {
        connectOrCreate: (data.amenities ?? []).map((name) => ({
          where: { name },
          create: { name },
        })),
      },
    },
    include: { amenities: true },
  });

  return Response.json(created, { status: 201 });
}
