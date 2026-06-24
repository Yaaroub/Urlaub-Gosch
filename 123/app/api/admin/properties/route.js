import prisma from "@/lib/db";

// einfache Slugify + Eindeutigkeit
async function uniqueSlug(base) {
  const raw = (base || "").toLowerCase().trim()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "objekt";
  let slug = raw, n = 1;
  // falls existiert, hochzählen
  while (true) {
    const hit = await prisma.property.findUnique({ where: { slug } });
    if (!hit) return slug;
    n += 1;
    slug = `${raw}-${n}`;
  }
}

export async function GET() {
  const items = await prisma.property.findMany({
    orderBy: { id: "asc" },
    select: {
      id: true,
      slug: true,
      title: true,
      location: true,
      maxPersons: true,
      dogsAllowed: true,
    },
  });
  return Response.json(items);
}

export async function POST(req) {
    try {
      const body = await req.json();
      const { title, location, maxPersons = 2, dogsAllowed = false, description = "", amenities = [], slug } = body;
  
      if (!title || !location) {
        return Response.json({ error: "Titel und Ort sind erforderlich." }, { status: 400 });
      }
  
      const finalSlug = (slug && slug.trim()) || (await uniqueSlug(title));
  
      const created = await prisma.property.create({
        data: {
          title,
          location,
          maxPersons: Number(maxPersons) || 2,
          dogsAllowed: Boolean(dogsAllowed),
          description: description || null,
          slug: finalSlug,
          amenities: {
            connectOrCreate: amenities.map((name) => ({
              where: { name },
              create: { name },
            })),
          },
        },
        select: {
          id: true,
          title: true,
          location: true,
          maxPersons: true,
          dogsAllowed: true,
          slug: true,
        },
      });
  
      return Response.json(created, { status: 201 });
    } catch (e) {
      console.error(e);
      return Response.json({ error: "Anlegen fehlgeschlagen." }, { status: 500 });
    }
  }


