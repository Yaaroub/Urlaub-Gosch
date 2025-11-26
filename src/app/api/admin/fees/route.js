import prisma from "@/lib/db";

// GET /api/admin/fees?propertyId=1
export async function GET(req) {
  try {
    const sp = new URL(req.url).searchParams;
    const pid = Number(sp.get("propertyId"));
    if (!pid) return Response.json([]);

    const rows = await prisma.extraCost.findMany({
      where: { propertyId: pid },
      orderBy: { id: "asc" },
    });

    // -> Frontend-kompatibel zurückgeben
    const items = rows.map(r => ({
      id: r.id,
      propertyId: r.propertyId,
      name: r.title,
      kind: r.isDaily ? "PER_NIGHT" : "FIXED",
      amount: r.amount, // Cent (wie im Schema)
    }));

    return Response.json(items);
  } catch (e) {
    console.error("GET /api/admin/fees:", e);
    return Response.json([], { status: 200 });
  }
}

// POST /api/admin/fees
// body: { propertyId, name, kind, amount }
export async function POST(req) {
  try {
    const { propertyId, name, kind, amount } = await req.json();
    const row = await prisma.extraCost.create({
      data: {
        propertyId: Number(propertyId),
        title: String(name),
        isDaily: kind === "PER_NIGHT",
        amount: Number(amount), // Cent
      },
    });

    return Response.json({
      id: row.id,
      propertyId: row.propertyId,
      name: row.title,
      kind: row.isDaily ? "PER_NIGHT" : "FIXED",
      amount: row.amount,
    }, { status: 201 });
  } catch (e) {
    console.error("POST /api/admin/fees:", e);
    return Response.json({ error: "Create failed" }, { status: 500 });
  }
}
