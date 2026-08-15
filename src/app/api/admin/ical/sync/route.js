import prisma from "@/lib/db";

import {
  parseIcsFromUrl,
} from "@/lib/ical-import";

import {
  ADMIN_PERMISSIONS,
  requireAdminPermission,
} from "@/lib/admin-permissions";

export const dynamic =
  "force-dynamic";

function deny(auth) {
  return Response.json(
    {
      error: auth.error,
    },
    {
      status: auth.status,

      headers: {
        "Cache-Control":
          "no-store",
      },
    }
  );
}

function overlaps(
  aStart,
  aEnd,
  bStart,
  bEnd
) {
  return (
    aStart < bEnd &&
    bStart < aEnd
  );
}

// ============================================================
// POST /api/admin/ical/sync
//
// {
//   propertyId
// }
//
// benötigt:
// ICAL_EDIT
// ============================================================

export async function POST(req) {
  let propertyId = null;

  try {
    const auth =
      await requireAdminPermission(
        ADMIN_PERMISSIONS.ICAL_EDIT,
        req
      );

    if (!auth.ok) {
      return deny(auth);
    }

    const body =
      await req.json();

    propertyId =
      Number(
        body?.propertyId
      );

    if (
      !propertyId ||
      Number.isNaN(
        propertyId
      )
    ) {
      return Response.json(
        {
          error:
            "propertyId fehlt oder ist ungültig.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // Objekt + gespeicherte iCal-URL laden
    // ========================================================

    const property =
      await prisma.property.findUnique({
        where: {
          id: propertyId,
        },

        select: {
          id: true,
          icalUrl: true,
        },
      });

    if (!property) {
      return Response.json(
        {
          error:
            "Objekt wurde nicht gefunden.",
        },
        {
          status: 404,
        }
      );
    }

    if (!property.icalUrl) {
      return Response.json(
        {
          error:
            "Keine iCal-URL hinterlegt.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // URL prüfen
    // ========================================================

    let parsedUrl;

    try {
      parsedUrl =
        new URL(
          property.icalUrl
        );
    } catch {
      return Response.json(
        {
          error:
            "Die hinterlegte iCal-URL ist ungültig.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      parsedUrl.protocol !==
        "https:" &&
      parsedUrl.protocol !==
        "http:"
    ) {
      return Response.json(
        {
          error:
            "Die hinterlegte iCal-URL verwendet ein nicht unterstütztes Protokoll.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // iCal laden
    // ========================================================

    const events =
      await parseIcsFromUrl(
        parsedUrl.toString()
      );

    // ========================================================
    // Vorhandene Buchungen
    // ========================================================

    const existing =
      await prisma.booking.findMany({
        where: {
          propertyId,
        },

        select: {
          id: true,
          startDate: true,
          endDate: true,
        },
      });

    const occupied =
      existing.map(
        (booking) => ({
          startDate:
            booking.startDate,

          endDate:
            booking.endDate,
        })
      );

    const toCreate = [];

    for (
      const event of
      Array.isArray(events)
        ? events
        : []
    ) {
      const start =
        event?.start instanceof
        Date
          ? event.start
          : new Date(
              event?.start
            );

      const end =
        event?.end instanceof
        Date
          ? event.end
          : new Date(
              event?.end
            );

      if (
        Number.isNaN(
          start.getTime()
        ) ||
        Number.isNaN(
          end.getTime()
        ) ||
        start >= end
      ) {
        continue;
      }

      const conflict =
        occupied.some(
          (booking) =>
            overlaps(
              start,
              end,
              booking.startDate,
              booking.endDate
            )
        );

      if (conflict) {
        continue;
      }

      toCreate.push({
        propertyId,

        startDate:
          start,

        endDate:
          end,

        guestName:
          event?.summary
            ? String(
                event.summary
              ).slice(
                0,
                120
              )
            : null,
      });

      occupied.push({
        startDate:
          start,

        endDate:
          end,
      });
    }

    // ========================================================
    // Speichern
    // ========================================================

    if (
      toCreate.length > 0
    ) {
      await prisma.booking.createMany({
        data:
          toCreate,
      });
    }

    await prisma.property.update({
      where: {
        id: propertyId,
      },

      data: {
        icalUpdatedAt:
          new Date(),

        icalLastRunAt:
          new Date(),
      },
    });

    return Response.json(
      {
        ok: true,

        created:
          toCreate.length,

        total:
          Array.isArray(
            events
          )
            ? events.length
            : 0,
      },
      {
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "POST /api/admin/ical/sync:",
      error
    );

    /*
     * Wenn propertyId bereits bekannt ist,
     * protokollieren wir trotzdem den
     * letzten Sync-Versuch.
     */
    if (
      propertyId &&
      !Number.isNaN(
        propertyId
      )
    ) {
      try {
        await prisma.property.update({
          where: {
            id: propertyId,
          },

          data: {
            icalLastRunAt:
              new Date(),
          },
        });
      } catch {
        // Fehler beim Logging nicht
        // über den ursprünglichen Fehler legen.
      }
    }

    return Response.json(
      {
        error:
          "Sync fehlgeschlagen.",
      },
      {
        status: 500,
      }
    );
  }
}