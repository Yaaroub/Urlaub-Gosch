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

async function getFeeId(context) {
  const params =
    await context.params;

  const id =
    Number(params.id);

  if (
    !id ||
    Number.isNaN(id)
  ) {
    return null;
  }

  return id;
}

// ============================================================
// PUT /api/admin/fees/:id
//
// body:
// {
//   name,
//   kind,
//   amount
// }
//
// benötigt: FEES_EDIT
// ============================================================

export async function PUT(
  req,
  context
) {
  try {
    const auth =
      await requireAdminPermission(
        ADMIN_PERMISSIONS.FEES_EDIT,
        req
      );

    if (!auth.ok) {
      return deny(auth);
    }

    const id =
      await getFeeId(
        context
      );

    if (!id) {
      return Response.json(
        {
          error:
            "Ungültige Nebenkosten-ID.",
        },
        {
          status: 400,
        }
      );
    }

    const body =
      await req.json();

    const name =
      String(
        body?.name || ""
      ).trim();

    const kind =
      String(
        body?.kind || "FIXED"
      );

    const amount =
      Number(
        body?.amount
      );

    // --------------------------------------------------------
    // Validierung
    // --------------------------------------------------------

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
      !Number.isFinite(
        amount
      ) ||
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

    const existing =
      await prisma.extraCost.findUnique({
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
            "Nebenkosten-Eintrag wurde nicht gefunden.",
        },
        {
          status: 404,
        }
      );
    }

    // --------------------------------------------------------
    // Aktualisieren
    // --------------------------------------------------------

    const row =
      await prisma.extraCost.update({
        where: {
          id,
        },

        data: {
          title:
            name,

          isDaily:
            kind ===
            "PER_NIGHT",

          // Cent
          amount:
            Math.round(
              amount
            ),
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
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "PUT /api/admin/fees/[id]:",
      error
    );

    return Response.json(
      {
        error:
          "Nebenkosten konnten nicht aktualisiert werden.",
      },
      {
        status: 500,
      }
    );
  }
}

// ============================================================
// DELETE /api/admin/fees/:id
//
// benötigt: FEES_EDIT
// ============================================================

export async function DELETE(
  req,
  context
) {
  try {
    const auth =
      await requireAdminPermission(
        ADMIN_PERMISSIONS.FEES_EDIT,
        req
      );

    if (!auth.ok) {
      return deny(auth);
    }

    const id =
      await getFeeId(
        context
      );

    if (!id) {
      return Response.json(
        {
          error:
            "Ungültige Nebenkosten-ID.",
        },
        {
          status: 400,
        }
      );
    }

    const existing =
      await prisma.extraCost.findUnique({
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
            "Nebenkosten-Eintrag wurde nicht gefunden.",
        },
        {
          status: 404,
        }
      );
    }

    await prisma.extraCost.delete({
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
      "DELETE /api/admin/fees/[id]:",
      error
    );

    return Response.json(
      {
        error:
          "Nebenkosten konnten nicht gelöscht werden.",
      },
      {
        status: 500,
      }
    );
  }
}