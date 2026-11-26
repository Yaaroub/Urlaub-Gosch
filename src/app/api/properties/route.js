import prisma from "@/lib/db";
import { publicPropertySelect } from "@/lib/public-property-select";

export async function GET() {
  const items = await prisma.property.findMany({
    // No occupancy here: availability is only published via the booking
    // calendar (/api/bookings) and the iCal export, both without names or ids.
    select: publicPropertySelect,
    orderBy: { id: "asc" },
  });
  return Response.json(items);
}
