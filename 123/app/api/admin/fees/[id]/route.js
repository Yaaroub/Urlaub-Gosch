import prisma from "@/lib/db";

// PUT /api/admin/fees/:id
// body: { name, kind, amount }
export async function PUT(req, { params }) {
  try {
    const id = Number(params.id);
    const { name, kind, amount } = await req.json();

    const row = await prisma.extraCost.update({
      where: { id },
      data: {
        title: String(name),
        isDaily: kind === "PER_NIGHT",
        amount: Number(amount),
      },
    });

    return Response.json({
      id: row.id,
      propertyId: row.propertyId,
      name: row.title,
      kind: row.isDaily ? "PER_NIGHT" : "FIXED",
      amount: row.amount,
    });
  } catch (e) {
    console.error("PUT /api/admin/fees/[id]:", e);
    return Response.json({ error: "Update failed" }, { status: 500 });
  }
}

// DELETE /api/admin/fees/:id
export async function DELETE(_req, { params }) {
  try {
    const id = Number(params.id);
    await prisma.extraCost.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (e) {
    console.error("DELETE /api/admin/fees/[id]:", e);
    return Response.json({ error: "Delete failed" }, { status: 500 });
  }
}
