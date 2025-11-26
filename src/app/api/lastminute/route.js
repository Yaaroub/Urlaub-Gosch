import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const today = new Date();

  const items = await prisma.lastMinuteOffer.findMany({
    where: {
      // alle aktuellen UND zukünftigen Angebote (Ende in der Zukunft)
      endDate: { gt: today },
    },
    include: {
      property: {
        select: {
          id: true,
          slug: true,
          title: true,
          location: true,
          images: {
            take: 1,
            orderBy: { sort: "asc" },
            select: { url: true, alt: true },
          },
        },
      },
    },
    orderBy: { startDate: "asc" },
  });

  // kompaktere Antwort fürs Frontend
  return Response.json(
    items.map((o) => ({
      id: o.id,
      discount: o.discount,
      note: o.note,
      startDate: o.startDate,
      endDate: o.endDate,
      propertyId: o.property.id,
      property: o.property,
    }))
  );
}
