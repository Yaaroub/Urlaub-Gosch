import prisma from "@/lib/db";

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

async function getOfferId(
  context
) {
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
// DELETE /api/admin/lastminute/:id
//
// benötigt:
// LASTMINUTE_DELETE
// ============================================================

export async function DELETE(
  req,
  context
) {
  try {
    const auth =
      await requireAdminPermission(
        ADMIN_PERMISSIONS.LASTMINUTE_DELETE,
        req
      );

    if (!auth.ok) {
      return deny(auth);
    }

    const id =
      await getOfferId(
        context
      );

    if (!id) {
      return Response.json(
        {
          error:
            "Ungültige Angebots-ID.",
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

        select: {
          id: true,
          propertyId: true,
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

    await prisma.lastMinuteOffer.delete({
      where: {
        id,
      },
    });

    const fresh =
      await prisma.lastMinuteOffer.findMany({
        where: {
          propertyId:
            existing.propertyId,
        },

        orderBy: [
          {
            startDate:
              "asc",
          },
          {
            id:
              "asc",
          },
        ],
      });

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
      "DELETE /api/admin/lastminute/[id] failed:",
      error
    );

    return Response.json(
      {
        error:
          "Löschen fehlgeschlagen.",
      },
      {
        status: 500,
      }
    );
  }
}