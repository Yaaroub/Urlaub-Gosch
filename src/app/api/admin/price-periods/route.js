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
        "Cache-Control": "no-store",
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

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
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
// Heutigen Tag in UTC bestimmen
// ============================================================

function getTodayUTC() {
  const now = new Date();

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
//
// Beispiel:
//
// 01.08. - 05.08.
// 05.08. - 10.08.
//
// = KEINE Überschneidung
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
// GET /api/admin/price-periods?propertyId=123
//
// benötigt:
// PRICES_VIEW
// ============================================================

export async function GET(req) {
  try {
    const auth =
      await requireAdminPermission(
        ADMIN_PERMISSIONS.PRICES_VIEW,
        req
      );

    if (!auth.ok) {
      return deny(auth);
    }

    const { searchParams } =
      new URL(req.url);

    const propertyId =
      Number(
        searchParams.get(
          "propertyId"
        )
      );

    if (
      !propertyId ||
      Number.isNaN(propertyId)
    ) {
      return Response.json(
        [],
        {
          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    const items =
      await prisma.pricePeriod.findMany({
        where: {
          propertyId,
        },

        orderBy: [
          {
            startDate: "asc",
          },
          {
            id: "asc",
          },
        ],
      });

    return Response.json(
      items,
      {
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "GET /api/admin/price-periods failed:",
      error
    );

    return Response.json(
      {
        error:
          "Preiszeiten konnten nicht geladen werden.",
      },
      {
        status: 500,
      }
    );
  }
}

// ============================================================
// POST /api/admin/price-periods
//
// {
//   propertyId,
//   startDate,
//   endDate,
//   pricePerNight
// }
//
// benötigt:
// PRICES_EDIT
// ============================================================

export async function POST(req) {
  try {
    const auth =
      await requireAdminPermission(
        ADMIN_PERMISSIONS.PRICES_EDIT,
        req
      );

    if (!auth.ok) {
      return deny(auth);
    }

    const body =
      await req.json();

    const propertyId =
      Number(
        body?.propertyId
      );

    const startDate =
      body?.startDate;

    const endDate =
      body?.endDate;

    const pricePerNight =
      body?.pricePerNight;

    // ========================================================
    // Pflichtfelder
    // ========================================================

    if (
      !propertyId ||
      Number.isNaN(
        propertyId
      ) ||
      !startDate ||
      !endDate ||
      pricePerNight == null
    ) {
      return Response.json(
        {
          error:
            "Felder: propertyId, startDate, endDate, pricePerNight",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // Objekt prüfen
    // ========================================================

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
            "Objekt wurde nicht gefunden.",
        },
        {
          status: 404,
        }
      );
    }

    // ========================================================
    // Datum prüfen
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
    // Preis prüfen
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
    // Überschneidungen prüfen
    //
    // WICHTIG:
    //
    // Bereits vollständig abgelaufene Preiszeiten werden
    // ignoriert.
    //
    // Dadurch blockieren alte, in der Admin-Oberfläche nicht
    // mehr sichtbare Zeiträume keine neuen Änderungen.
    // ========================================================

    const today =
      getTodayUTC();

    const existing =
      await prisma.pricePeriod.findMany({
        where: {
          propertyId,

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
      existing.find(
        (period) =>
          overlaps(
            start,
            end,
            period.startDate,
            period.endDate
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
    // Preiszeit erstellen
    // ========================================================

    const created =
      await prisma.pricePeriod.create({
        data: {
          propertyId,

          startDate:
            start,

          endDate:
            end,

          pricePerNight:
            price,
        },
      });

    return Response.json(
      created,
      {
        status: 201,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "POST /api/admin/price-periods failed:",
      error
    );

    return Response.json(
      {
        error:
          "Preiszeit konnte nicht angelegt werden.",
      },
      {
        status: 500,
      }
    );
  }
}