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

function toDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

// ============================================================
// GET /api/admin/booking?propertyId=21
//
// benötigt:
// AVAILABILITY_VIEW
//
// liefert zusätzlich:
// X-Admin-Can-Edit: 1 oder 0
// ============================================================

export async function GET(req) {
  try {
    const auth = await requireAdminPermission(
      ADMIN_PERMISSIONS.AVAILABILITY_VIEW,
      req
    );

    if (!auth.ok) {
      return deny(auth);
    }

    const canEdit =
      auth.user.role === "SUPERADMIN" ||
      auth.user.permissions.includes(
        ADMIN_PERMISSIONS.AVAILABILITY_EDIT
      );

    const searchParams =
      new URL(req.url).searchParams;

    const propertyId = Number(
      searchParams.get("propertyId")
    );

    if (
      !propertyId ||
      Number.isNaN(propertyId)
    ) {
      return Response.json([], {
        headers: {
          "Cache-Control": "no-store",
          "X-Admin-Can-Edit": canEdit ? "1" : "0",
        },
      });
    }

    const bookings =
      await prisma.booking.findMany({
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

        select: {
          id: true,
          propertyId: true,
          startDate: true,
          endDate: true,
          guestName: true,
          createdAt: true,
        },
      });

    return Response.json(bookings, {
      headers: {
        "Cache-Control": "no-store",
        "X-Admin-Can-Edit": canEdit ? "1" : "0",
      },
    });
  } catch (error) {
    console.error(
      "GET /api/admin/booking failed:",
      error
    );

    return Response.json(
      {
        error:
          "Belegungen konnten nicht geladen werden.",
      },
      {
        status: 500,
      }
    );
  }
}

// ============================================================
// POST /api/admin/booking
//
// body:
// {
//   propertyId,
//   startDate,
//   endDate,
//   guestName
// }
//
// benötigt:
// AVAILABILITY_EDIT
// ============================================================

export async function POST(req) {
  try {
    const auth = await requireAdminPermission(
      ADMIN_PERMISSIONS.AVAILABILITY_EDIT,
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
      toDate(
        body?.startDate
      );

    const endDate =
      toDate(
        body?.endDate
      );

    const guestName =
      typeof body?.guestName === "string"
        ? body.guestName.trim()
        : "";

    // ========================================================
    // Objekt-ID prüfen
    // ========================================================

    if (
      !propertyId ||
      Number.isNaN(propertyId)
    ) {
      return Response.json(
        {
          error:
            "Ungültige Objekt-ID.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // Datum prüfen
    // ========================================================

    if (
      !startDate ||
      !endDate
    ) {
      return Response.json(
        {
          error:
            "Startdatum und Enddatum sind erforderlich.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      startDate >= endDate
    ) {
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
    // Objekt muss existieren
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
    // Überschneidung prüfen
    //
    // Enddatum ist exklusiv.
    //
    // bestehend:
    // 01.08 → 05.08
    //
    // neu:
    // 05.08 → 10.08
    //
    // = erlaubt
    // ========================================================

    const conflict =
      await prisma.booking.findFirst({
        where: {
          propertyId,

          startDate: {
            lt: endDate,
          },

          endDate: {
            gt: startDate,
          },
        },

        select: {
          id: true,
          startDate: true,
          endDate: true,
          guestName: true,
        },
      });

    if (conflict) {
      return Response.json(
        {
          error:
            "Der Zeitraum überschneidet sich mit einer bestehenden Belegung.",

          conflict,
        },
        {
          status: 409,
        }
      );
    }

    // ========================================================
    // Eintrag anlegen
    // ========================================================

    const created =
      await prisma.booking.create({
        data: {
          propertyId,

          startDate,

          endDate,

          guestName:
            guestName ||
            "(Admin)",
        },

        select: {
          id: true,
          propertyId: true,
          startDate: true,
          endDate: true,
          guestName: true,
          createdAt: true,
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
      "POST /api/admin/booking failed:",
      error
    );

    return Response.json(
      {
        error:
          "Belegung konnte nicht angelegt werden.",
      },
      {
        status: 500,
      }
    );
  }
}