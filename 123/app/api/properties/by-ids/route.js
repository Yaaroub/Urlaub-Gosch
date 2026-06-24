import prisma from "@/lib/db";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const idsParam = url.searchParams.get("ids") || "";
    const ids = idsParam
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);

    if (ids.length === 0) return Response.json([]);

    const items = await prisma.property.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        slug: true,
        title: true,
        location: true,
        maxPersons: true,
        dogsAllowed: true,
        images: {
          orderBy: { sort: "asc" },
          take: 1,
          select: { url: true, alt: true },
        },
      },
    });

    // Original-Reihenfolge beibehalten
    const order = new Map(ids.map((id, i) => [id, i]));
    items.sort(
      (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)
    );

    return Response.json(items);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to load properties" }, { status: 500 });
  }
}
