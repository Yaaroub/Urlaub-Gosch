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
// GET /api/admin/fees?propertyId=1
//
// benötigt: FEES_VIEW
// ============================================================

export async function GET(req) {
  try {
    const auth = await requireAdminPermission(
      ADMIN_PERMISSIONS.FEES_VIEW,
      req
    );

    if (!auth.ok) {
      return deny(auth);
    }

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
        },
      });
    }

    const rows =
      await prisma.extraCost.findMany({
        where: {
          propertyId,
        },

        orderBy: {
          id: "asc",
        },
      });

    const items = rows.map((row) => ({
      id: row.id,

      propertyId:
        row.propertyId,

      name:
        row.title,

      kind:
        row.isDaily
          ? "PER_NIGHT"
          : "FIXED",

      // Cent
      amount:
        row.amount,
    }));

    return Response.json(items, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(
      "GET /api/admin/fees:",
      error
    );

    return Response.json(
      {
        error:
          "Nebenkosten konnten nicht geladen werden.",
      },
      {
        status: 500,
      }
    );
  }
}

// ============================================================
// POST /api/admin/fees
//
// body:
// {
//   propertyId,
//   name,
//   kind,
//   amount
// }
//
// benötigt: FEES_EDIT
// ============================================================

export async function POST(req) {
  try {
    const auth = await requireAdminPermission(
      ADMIN_PERMISSIONS.FEES_EDIT,
      req
    );

    if (!auth.ok) {
      return deny(auth);
    }

    const body =
      await req.json();

    const propertyId = Number(
      body?.propertyId
    );

    const name =
      String(
        body?.name || ""
      ).trim();

    const kind =
      String(
        body?.kind || "FIXED"
      );

    const amount = Number(
      body?.amount
    );

    // --------------------------------------------------------
    // Validierung
    // --------------------------------------------------------

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

    if (!name) {
      return Response.json(
        {
          error:
            "Bitte eine Bezeichnung eingeben.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      kind !== "FIXED" &&
      kind !== "PER_NIGHT"
    ) {
      return Response.json(
        {
          error:
            "Ungültige Kostenart.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isFinite(amount) ||
      amount < 0
    ) {
      return Response.json(
        {
          error:
            "Bitte einen gültigen Betrag eingeben.",
        },
        {
          status: 400,
        }
      );
    }

    // Prüfen, ob Objekt existiert
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

    // --------------------------------------------------------
    // Erstellen
    // --------------------------------------------------------

    const row =
      await prisma.extraCost.create({
        data: {
          propertyId,

          title:
            name,

          isDaily:
            kind ===
            "PER_NIGHT",

          // Cent
          amount:
            Math.round(amount),
        },
      });

    return Response.json(
      {
        id:
          row.id,

        propertyId:
          row.propertyId,

        name:
          row.title,

        kind:
          row.isDaily
            ? "PER_NIGHT"
            : "FIXED",

        amount:
          row.amount,
      },
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
      "POST /api/admin/fees:",
      error
    );

    return Response.json(
      {
        error:
          "Nebenkosten konnten nicht angelegt werden.",
      },
      {
        status: 500,
      }
    );
  }
}