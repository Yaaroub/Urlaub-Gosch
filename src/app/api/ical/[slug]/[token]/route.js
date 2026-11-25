import prisma from "@/lib/db";
import { icalFeedResponse, notFound } from "@/lib/ical-feed";
import { currentBookingsWhere, isValidIcalFeedToken } from "@/lib/public-calendar";

export const dynamic = "force-dynamic";

/**
 * Secret iCal export of one property for booking portals:
 * /api/ical/<slug>/<token>. Without the matching key the answer is always
 * the same 404, whether the property exists or not.
 */
export async function GET(_req, { params }) {
  const { slug, token } = await params;
  if (typeof slug !== "string" || slug.length > 200 || typeof token !== "string" || token.length > 64) {
    return notFound();
  }

  const property = await prisma.property.findUnique({
    where: { slug },
    select: { id: true, title: true },
  });
  if (!property || !isValidIcalFeedToken(property.id, token)) return notFound();

  const bookings = await prisma.booking.findMany({
    where: currentBookingsWhere(property.id),
    orderBy: { startDate: "asc" },
    select: { startDate: true, endDate: true },
  });
  return icalFeedResponse(property, bookings);
}
