import prisma from "@/lib/db";

export async function DELETE(req) {
  // Erwarteter Body vom Client:
  // {
  //   propertyId: 123,
  //   ids: [59, 60, 70]
  // }

  const body = await req.json();
  const propertyId = parseInt(body.propertyId, 10);
  const ids = Array.isArray(body.ids)
    ? body.ids.map((n) => parseInt(n, 10)).filter((n) => !Number.isNaN(n))
    : [];

  if (Number.isNaN(propertyId) || ids.length === 0) {
    return new Response(
      JSON.stringify({ error: "Invalid propertyId or no ids provided" }),
      { status: 400 }
    );
  }

  // 1) Sicherstellen, dass die Bilder wirklich zu dieser Property gehören
  const toDelete = await prisma.propertyImage.findMany({
    where: {
      propertyId,
      id: { in: ids },
    },
    select: { id: true },
  });

  if (toDelete.length === 0) {
    return new Response(
      JSON.stringify({ error: "No matching images for this property" }),
      { status: 404 }
    );
  }

  const validIds = toDelete.map((img) => img.id);

  // 2) Löschen in einem Rutsch
  await prisma.propertyImage.deleteMany({
    where: {
      propertyId,
      id: { in: validIds },
    },
  });

  // 3) Rest-Bilder holen und nach aktueller sort sortieren
  const remaining = await prisma.propertyImage.findMany({
    where: { propertyId },
    orderBy: { sort: "asc" },
    select: { id: true },
  });

  // 4) sort neu durchnummerieren (0,1,2,3,...) -> wichtig für dein Titelbild-Logik
  await prisma.$transaction(
    remaining.map((img, index) =>
      prisma.propertyImage.update({
        where: { id: img.id },
        data: { sort: index },
      })
    )
  );

  // 5) aktualisierte Liste zurückgeben
  const updatedList = await prisma.propertyImage.findMany({
    where: { propertyId },
    orderBy: { sort: "asc" },
    select: {
      id: true,
      url: true,
      alt: true,
      sort: true,
    },
  });

  return new Response(
    JSON.stringify({
      ok: true,
      removed: validIds,
      images: updatedList,
    }),
    { status: 200 }
  );
}
