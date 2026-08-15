import prisma from "@/lib/db";

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

function normalizeDiscountType(value) {
  return value === "FIXED"
    ? "FIXED"
    : "PERCENT";
}

function normalizePercent(value) {
  const percent = Number(value);

  if (
    !Number.isFinite(percent) ||
    !Number.isInteger(percent) ||
    percent < 0 ||
    percent > 100
  ) {
    return null;
  }

  return percent;
}

function normalizeFixedAmount(value) {
  const amount = Number(value);

  if (
    !Number.isFinite(amount) ||
    amount < 0
  ) {
    return null;
  }

  return Math.round(
    amount * 100
  ) / 100;
}

async function freshList(propertyId) {
  return prisma.lastMinuteOffer.findMany({
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
}

// ============================================================
// GET /api/admin/lastminute?propertyId=123
//
// benötigt:
// LASTMINUTE_VIEW
// ============================================================

export async function GET(req) {
  try {
    const auth =
      await requireAdminPermission(
        ADMIN_PERMISSIONS.LASTMINUTE_VIEW,
        req
      );

    if (!auth.ok) {
      return deny(auth);
    }

    const url =
      new URL(req.url);

    const propertyId =
      Number(
        url.searchParams.get(
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
      await freshList(
        propertyId
      );

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
      "GET /api/admin/lastminute failed:",
      error
    );

    return Response.json(
      {
        error:
          "Fehler beim Laden der Last-Minute-Angebote.",
      },
      {
        status: 500,
      }
    );
  }
}

// ============================================================
// POST /api/admin/lastminute
//
// Prozent:
// {
//   propertyId,
//   startDate,
//   endDate,
//   discountType: "PERCENT",
//   discount: 20,
//   note?
// }
//
// Fester Betrag:
// {
//   propertyId,
//   startDate,
//   endDate,
//   discountType: "FIXED",
//   discountAmount: 25,
//   note?
// }
//
// benötigt:
// LASTMINUTE_EDIT
// ============================================================

export async function POST(req) {
  try {
    const auth =
      await requireAdminPermission(
        ADMIN_PERMISSIONS.LASTMINUTE_EDIT,
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
      toDateOnlyUTC(
        body?.startDate
      );

    const endDate =
      toDateOnlyUTC(
        body?.endDate
      );

    const discountType =
      normalizeDiscountType(
        body?.discountType
      );

    if (
      !propertyId ||
      Number.isNaN(propertyId)
    ) {
      return Response.json(
        {
          error:
            "Ungültiges Objekt.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !startDate ||
      !endDate ||
      endDate <= startDate
    ) {
      return Response.json(
        {
          error:
            "Ungültiger Zeitraum.",
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
            "Objekt wurde nicht gefunden.",
        },
        {
          status: 404,
        }
      );
    }

    const data = {
      propertyId,
      startDate,
      endDate,

      discountType,

      note:
        typeof body?.note ===
          "string" &&
        body.note.trim()
          ? body.note.trim()
          : null,
    };

    if (
      discountType ===
      "PERCENT"
    ) {
      const discount =
        normalizePercent(
          body?.discount
        );

      if (
        discount === null
      ) {
        return Response.json(
          {
            error:
              "Prozent-Rabatt muss eine ganze Zahl zwischen 0 und 100 sein.",
          },
          {
            status: 400,
          }
        );
      }

      data.discount =
        discount;

      data.discountAmount =
        null;
    } else {
      const discountAmount =
        normalizeFixedAmount(
          body?.discountAmount
        );

      if (
        discountAmount === null
      ) {
        return Response.json(
          {
            error:
              "Der feste Rabattbetrag muss 0 € oder größer sein.",
          },
          {
            status: 400,
          }
        );
      }

      data.discount =
        0;

      data.discountAmount =
        discountAmount;
    }

    await prisma.lastMinuteOffer.create({
      data,
    });

    const fresh =
      await freshList(
        propertyId
      );

    return Response.json(
      fresh,
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
      "POST /api/admin/lastminute failed:",
      error
    );

    return Response.json(
      {
        error:
          "Last-Minute-Angebot konnte nicht angelegt werden.",
      },
      {
        status: 500,
      }
    );
  }
}

// ============================================================
// PUT /api/admin/lastminute
//
// {
//   id,
//   startDate?,
//   endDate?,
//   discountType?,
//   discount?,
//   discountAmount?,
//   note?
// }
//
// benötigt:
// LASTMINUTE_EDIT
// ============================================================

export async function PUT(req) {
  try {
    const auth =
      await requireAdminPermission(
        ADMIN_PERMISSIONS.LASTMINUTE_EDIT,
        req
      );

    if (!auth.ok) {
      return deny(auth);
    }

    const body =
      await req.json();

    const id =
      Number(body?.id);

    if (
      !id ||
      Number.isNaN(id)
    ) {
      return Response.json(
        {
          error:
            "id fehlt oder ist ungültig.",
        },
        {
          status: 400,
        }
      );
    }

    const existing =
      await prisma.lastMinuteOffer.findUnique({
        where: {
          id,
        },
      });

    if (!existing) {
      return Response.json(
        {
          error:
            "Last-Minute-Angebot wurde nicht gefunden.",
        },
        {
          status: 404,
        }
      );
    }

    const startDate =
      body.startDate !== undefined
        ? toDateOnlyUTC(
            body.startDate
          )
        : existing.startDate;

    const endDate =
      body.endDate !== undefined
        ? toDateOnlyUTC(
            body.endDate
          )
        : existing.endDate;

    if (
      !startDate ||
      !endDate ||
      endDate <= startDate
    ) {
      return Response.json(
        {
          error:
            "Ende muss nach dem Start liegen.",
        },
        {
          status: 400,
        }
      );
    }

    const discountType =
      body.discountType !== undefined
        ? normalizeDiscountType(
            body.discountType
          )
        : existing.discountType ||
          "PERCENT";

    const data = {
      startDate,
      endDate,
      discountType,
    };

    if (
      body.note !==
      undefined
    ) {
      data.note =
        typeof body.note ===
          "string" &&
        body.note.trim()
          ? body.note.trim()
          : null;
    }

    if (
      discountType ===
      "PERCENT"
    ) {
      const rawDiscount =
        body.discount !== undefined
          ? body.discount
          : existing.discount;

      const discount =
        normalizePercent(
          rawDiscount
        );

      if (
        discount === null
      ) {
        return Response.json(
          {
            error:
              "Prozent-Rabatt muss eine ganze Zahl zwischen 0 und 100 sein.",
          },
          {
            status: 400,
          }
        );
      }

      data.discount =
        discount;

      data.discountAmount =
        null;
    } else {
      const rawAmount =
        body.discountAmount !==
        undefined
          ? body.discountAmount
          : existing.discountAmount;

      const discountAmount =
        normalizeFixedAmount(
          rawAmount
        );

      if (
        discountAmount ===
        null
      ) {
        return Response.json(
          {
            error:
              "Der feste Rabattbetrag muss 0 € oder größer sein.",
          },
          {
            status: 400,
          }
        );
      }

      data.discount =
        0;

      data.discountAmount =
        discountAmount;
    }

    const updated =
      await prisma.lastMinuteOffer.update({
        where: {
          id,
        },

        data,
      });

    const fresh =
      await freshList(
        updated.propertyId
      );

    return Response.json(
      fresh,
      {
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "PUT /api/admin/lastminute failed:",
      error
    );

    return Response.json(
      {
        error:
          "Last-Minute-Angebot konnte nicht aktualisiert werden.",
      },
      {
        status: 500,
      }
    );
  }
}