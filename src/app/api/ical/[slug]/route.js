import prisma from "@/lib/db";
import { icalFeedResponse, notFound } from "@/lib/ical-feed";
import { currentBookingsWhere, legacyIcalLinksAllowed } from "@/lib/public-calendar";

export const dynamic = "force-dynamic";

/**
 * Old feed address without a key. Switched off; it only answers during a
 * transition period set in ICAL_LEGACY_LINKS_UNTIL (max. 60 days), so
 * booking portals can be moved to the new secret links.
 */
export async function GET(_req, { params }) {
  if (!legacyIcalLinksAllowed()) return notFound();

  const { slug } = await params;
  if (typeof slug !== "string" || slug.length > 200) return notFound();

  const property = await prisma.property.findUnique({
    where: { slug },
    select: { id: true, title: true },
  });
  if (!property) return notFound();

  const bookings = await prisma.booking.findMany({
    where: currentBookingsWhere(property.id),
    orderBy: { startDate: "asc" },
    select: { startDate: true, endDate: true },
  });
  return icalFeedResponse(property, bookings);
}
