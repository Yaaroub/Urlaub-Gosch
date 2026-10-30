import prisma from "@/lib/db";
import { publicPropertySelect } from "@/lib/public-property-select";

export async function GET() {
  const items = await prisma.property.findMany({
    select: { ...publicPropertySelect, bookings: { select: { startDate: true, endDate: true } } },
    orderBy: { id: "asc" },
  });
  return Response.json(items);
}

// Legacy write endpoint shares the same permission checks as the admin route.
export { POST } from "@/app/api/admin/properties/route";
