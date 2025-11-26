import prisma from "@/lib/db";

export async function GET() {
  const list = await prisma.amenity.findMany({ orderBy: { name: "asc" } });
  return Response.json(list);
}

export async function POST(req) {
  try {
    const { name } = await req.json();
    if (!name?.trim()) return Response.json({ error: "Name fehlt" }, { status: 400 });
    const a = await prisma.amenity.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    return Response.json(a, { status: 201 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Erstellen fehlgeschlagen" }, { status: 500 });
  }
}
