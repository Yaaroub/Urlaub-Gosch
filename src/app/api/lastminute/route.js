// src/app/api/lastminute/route.js

import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Öffentliche Last-Minute-API
 *
 * Liefert alle noch relevanten Last-Minute-Angebote
 * inklusive der benötigten Unterkunftsdaten.
 *
 * Wird z. B. verwendet von:
 * - /offers
 * - LastMinuteTeaser
 * - PropertyGridClient
 */
export async function GET() {
  try {
    const now = new Date();

    const offers = await prisma.lastMinuteOffer.findMany({
      where: {
        endDate: {
          gt: now,
        },
      },

      orderBy: [
        {
          startDate: "asc",
        },
        {
          id: "asc",
        },
      ],

      select: {
        id: true,
        propertyId: true,

        startDate: true,
        endDate: true,

        discountType: true,
        discount: true,
        discountAmount: true,

        note: true,

        property: {
          select: {
            id: true,
            slug: true,
            title: true,

            address: true,
            location: true,

            maxPersons: true,
            dogsAllowed: true,

            description: true,

            images: {
              orderBy: {
                sort: "asc",
              },

              take: 1,

              select: {
                url: true,
                alt: true,
              },
            },
          },
        },
      },
    });

    return Response.json(offers, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error(
      "GET /api/lastminute failed:",
      error
    );

    return Response.json(
      {
        error:
          "Last-Minute-Angebote konnten nicht geladen werden.",
      },
      {
        status: 500,
      }
    );
  }
}