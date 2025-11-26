import prisma from "@/lib/db";
export async function DELETE(_req, { params }) {
  await prisma.booking.delete({ where: { id: Number(params.id) } });
  return new Response(null, { status: 204 });
}
