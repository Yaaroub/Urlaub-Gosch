import prisma from "@/lib/db";

import {
  ADMIN_PERMISSIONS,
  requireAdminPermission,
} from "@/lib/admin-permissions";

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

// ============================================================
// Datum auf UTC-Tagesbeginn normalisieren
// ============================================================

function toDateOnlyUTC(value) {
  if (!value) {
    return null;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate()
    )
  );
}

// ============================================================
// Heute UTC
// ============================================================

function getTodayUTC() {
  const now =
    new Date();

  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    )
  );
}

// ============================================================
// Überschneidung prüfen
//
// Enddatum ist EXKLUSIV.
// ============================================================

function overlaps(
  aStart,
  aEnd,
  bStart,
  bEnd
) {
  return !(
    aEnd <= bStart ||
    aStart >= bEnd
  );
}

// ============================================================
// Next.js 15:
//
// context.params muss awaited werden.
// ============================================================

async function getPricePeriodId(
  context
) {
  const params =
    await context.params;

  const id =
    Number(
      params.id
    );

  if (
    !id ||
    Number.isNaN(id)
  ) {
    return null;
  }

  return id;
}

// ============================================================
// PUT /api/admin/price-periods/:id
//
// benötigt:
// PRICES_EDIT
// ============================================================

export async function PUT(
  req,
  context
) {
  try {
    const auth =
      await requireAdminPermission(
        ADMIN_PERMISSIONS.PRICES_EDIT,
        req
      );

    if (!auth.ok) {
      return deny(auth);
    }

    // ========================================================
    // ID
    // ========================================================

    const id =
      await getPricePeriodId(
        context
      );

    if (!id) {
      return Response.json(
        {
          error:
            "Ungültige Preiszeit-ID.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // Body
    // ========================================================

    const body =
      await req.json();

    const {
      startDate,
      endDate,
      pricePerNight,
    } = body;

    if (
      !startDate ||
      !endDate ||
      pricePerNight == null
    ) {
      return Response.json(
        {
          error:
            "Felder: startDate, endDate, pricePerNight",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // Bestehende Preiszeit
    // ========================================================

    const pricePeriod =
      await prisma.pricePeriod.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          propertyId: true,
          startDate: true,
          endDate: true,
          pricePerNight: true,
        },
      });

    if (!pricePeriod) {
      return Response.json(
        {
          error:
            "Preiszeit wurde nicht gefunden.",
        },
        {
          status: 404,
        }
      );
    }

    // ========================================================
    // Datum
    // ========================================================

    const start =
      toDateOnlyUTC(
        startDate
      );

    const end =
      toDateOnlyUTC(
        endDate
      );

    if (
      !start ||
      !end
    ) {
      return Response.json(
        {
          error:
            "Start- oder Enddatum ist ungültig.",
        },
        {
          status: 400,
        }
      );
    }

    if (!(end > start)) {
      return Response.json(
        {
          error:
            "Das Enddatum muss nach dem Startdatum liegen.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // Preis
    // ========================================================

    const price =
      Number(
        pricePerNight
      );

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      return Response.json(
        {
          error:
            "Bitte einen gültigen Preis pro Nacht eingeben.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // Konflikte prüfen
    //
    // 1. Eigener Datensatz wird ausgeschlossen.
    //
    // 2. Vollständig abgelaufene Preiszeiten werden ignoriert.
    //
    // Beispiel:
    //
    // alte versteckte Preiszeit:
    // 27.06.2026 - 04.07.2026
    //
    // heute:
    // 15.08.2026
    //
    // => blockiert NICHT mehr.
    // ========================================================

    const today =
      getTodayUTC();

    const others =
      await prisma.pricePeriod.findMany({
        where: {
          propertyId:
            pricePeriod.propertyId,

          NOT: {
            id,
          },

          endDate: {
            gt: today,
          },
        },

        select: {
          id: true,
          startDate: true,
          endDate: true,
          pricePerNight: true,
        },

        orderBy: {
          startDate: "asc",
        },
      });

    const conflict =
      others.find(
        (other) =>
          overlaps(
            start,
            end,
            other.startDate,
            other.endDate
          )
      );

    if (conflict) {
      return Response.json(
        {
          error:
            "Der Zeitraum überschneidet sich mit einer bestehenden Preiszeit.",

          conflict: {
            id:
              conflict.id,

            startDate:
              conflict.startDate,

            endDate:
              conflict.endDate,

            pricePerNight:
              conflict.pricePerNight,
          },
        },
        {
          status: 409,
        }
      );
    }

    // ========================================================
    // Aktualisieren
    // ========================================================

    const updated =
      await prisma.pricePeriod.update({
        where: {
          id,
        },

        data: {
          startDate:
            start,

          endDate:
            end,

          pricePerNight:
            price,
        },
      });

    return Response.json(
      updated,
      {
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "PUT /api/admin/price-periods/[id] failed:",
      error
    );

    return Response.json(
      {
        error:
          "Preiszeit konnte nicht aktualisiert werden.",
      },
      {
        status: 500,
      }
    );
  }
}

// ============================================================
// DELETE /api/admin/price-periods/:id
//
// benötigt:
// PRICES_EDIT
// ============================================================

export async function DELETE(
  req,
  context
) {
  try {
    const auth =
      await requireAdminPermission(
        ADMIN_PERMISSIONS.PRICES_EDIT,
        req
      );

    if (!auth.ok) {
      return deny(auth);
    }

    const id =
      await getPricePeriodId(
        context
      );

    if (!id) {
      return Response.json(
        {
          error:
            "Ungültige Preiszeit-ID.",
        },
        {
          status: 400,
        }
      );
    }

    const existing =
      await prisma.pricePeriod.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
        },
      });

    if (!existing) {
      return Response.json(
        {
          error:
            "Preiszeit wurde nicht gefunden.",
        },
        {
          status: 404,
        }
      );
    }

    await prisma.pricePeriod.delete({
      where: {
        id,
      },
    });

    return new Response(
      null,
      {
        status: 204,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "DELETE /api/admin/price-periods/[id] failed:",
      error
    );

    return Response.json(
      {
        error:
          "Preiszeit konnte nicht gelöscht werden.",
      },
      {
        status: 500,
      }
    );
  }
}