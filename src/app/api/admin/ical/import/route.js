import prisma from "@/lib/db";

import {
  parseIcsFromBuffer,
  parseIcsFromUrl,
} from "@/lib/ical-import";

import {
  ADMIN_PERMISSIONS,
  requireAdminPermission,
} from "@/lib/admin-permissions";

export const dynamic = "force-dynamic";

function deny(auth) {
  return Response.json(
    {
      error: auth.error,
    },
    {
      status: auth.status,
      headers: {
        "Cache-Control": "no-store",
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
// POST /api/admin/ical/import
//
// multipart/form-data:
// {
//   file,
//   propertyId
// }
//
// oder JSON:
// {
//   url,
//   propertyId
// }
//
// benötigt:
// ICAL_EDIT
// ============================================================

export async function POST(req) {
  try {
    const auth =
      await requireAdminPermission(
        ADMIN_PERMISSIONS.ICAL_EDIT,
        req
      );

    if (!auth.ok) {
      return deny(auth);
    }

    let propertyId;
    let events = [];

    const contentType =
      req.headers.get(
        "content-type"
      ) || "";

    // ========================================================
    // Datei-Import
    // ========================================================

    if (
      contentType.includes(
        "multipart/form-data"
      )
    ) {
      const form =
        await req.formData();

      propertyId =
        Number(
          form.get(
            "propertyId"
          )
        );

      const file =
        form.get("file");

      if (!file) {
        return Response.json(
          {
            error:
              "Keine iCal-Datei ausgewählt.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        typeof file.arrayBuffer !==
        "function"
      ) {
        return Response.json(
          {
            error:
              "Ungültige Datei.",
          },
          {
            status: 400,
          }
        );
      }

      const buffer =
        Buffer.from(
          await file.arrayBuffer()
        );

      events =
        await parseIcsFromBuffer(
          buffer
        );
    }

    // ========================================================
    // URL-Import
    // ========================================================

    else {
      const body =
        await req.json();

      propertyId =
        Number(
          body?.propertyId
        );

      const url =
        String(
          body?.url || ""
        ).trim();

      if (!url) {
        return Response.json(
          {
            error:
              "iCal-URL fehlt.",
          },
          {
            status: 400,
          }
        );
      }

      let parsedUrl;

      try {
        parsedUrl =
          new URL(url);
      } catch {
        return Response.json(
          {
            error:
              "Ungültige iCal-URL.",
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
              "Es sind nur HTTP- oder HTTPS-URLs erlaubt.",
          },
          {
            status: 400,
          }
        );
      }

      events =
        await parseIcsFromUrl(
          parsedUrl.toString()
        );
    }

    // ========================================================
    // Objekt prüfen
    // ========================================================

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

    const property =
      await prisma.property.findUnique({
        where: {
          id: propertyId,
        },

        select: {
          id: true,
        },
      });

    if (!property) {
      return Response.json(
        {
          error:
            "Das ausgewählte Objekt wurde nicht gefunden.",
        },
        {
          status: 404,
        }
      );
    }

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

    /*
     * Enthält zunächst bestehende Buchungen.
     *
     * Neu akzeptierte iCal-Einträge werden ebenfalls
     * ergänzt, damit sich zwei Events aus derselben
     * Importdatei nicht gegenseitig überschneiden.
     */
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
      "POST /api/admin/ical/import:",
      error
    );

    return Response.json(
      {
        error:
          "Import fehlgeschlagen.",
      },
      {
        status: 500,
      }
    );
  }
}