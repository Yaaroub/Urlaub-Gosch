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
// PUT /api/admin/images/reorder
//
// Body:
//
// {
//   propertyId: 21,
//   ids: [55, 61, 58, 63]
// }
//
// Die Position im Array bestimmt automatisch "sort".
//
// benötigt:
// IMAGES_EDIT
// ============================================================

export async function PUT(req) {
  try {
    const auth =
      await requireAdminPermission(
        ADMIN_PERMISSIONS.IMAGES_EDIT,
        req
      );

    if (!auth.ok) {
      return deny(auth);
    }

    const body =
      await req.json();

    const propertyId =
      Number(body?.propertyId);

    const ids =
      Array.isArray(body?.ids)
        ? body.ids
            .map((id) => Number(id))
            .filter(
              (id) =>
                Number.isInteger(id) &&
                id > 0
            )
        : [];

    // ========================================================
    // Validierung
    // ========================================================

    if (
      !propertyId ||
      Number.isNaN(propertyId)
    ) {
      return Response.json(
        {
          error:
            "Ungültige propertyId.",
        },
        {
          status: 400,
        }
      );
    }

    if (ids.length === 0) {
      return Response.json(
        {
          error:
            "Keine Bild-IDs angegeben.",
        },
        {
          status: 400,
        }
      );
    }

    // Doppelte IDs verhindern
    const uniqueIds =
      [...new Set(ids)];

    if (
      uniqueIds.length !==
      ids.length
    ) {
      return Response.json(
        {
          error:
            "Die Reihenfolge enthält doppelte Bild-IDs.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // Prüfen, welche Bilder tatsächlich zum Objekt gehören
    // ========================================================

    const existing =
      await prisma.propertyImage.findMany({
        where: {
          propertyId,
        },

        select: {
          id: true,
        },
      });

    const existingIds =
      existing.map(
        (image) => image.id
      );

    // Es sollen alle Bilder des Objektes übermittelt werden.
    if (
      existingIds.length !==
      ids.length
    ) {
      return Response.json(
        {
          error:
            "Die übermittelte Reihenfolge enthält nicht alle Bilder des Objekts.",
        },
        {
          status: 400,
        }
      );
    }

    const existingSet =
      new Set(existingIds);

    const invalidId =
      ids.find(
        (id) =>
          !existingSet.has(id)
      );

    if (invalidId) {
      return Response.json(
        {
          error:
            `Bild ${invalidId} gehört nicht zu diesem Objekt.`,
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // Neue Reihenfolge speichern
    //
    // Arrayposition = sort
    // ========================================================

    await prisma.$transaction(
      ids.map(
        (id, index) =>
          prisma.propertyImage.update({
            where: {
              id,
            },

            data: {
              sort: index,
            },
          })
      )
    );

    // ========================================================
    // Aktualisierte Liste zurückgeben
    // ========================================================

    const images =
      await prisma.propertyImage.findMany({
        where: {
          propertyId,
        },

        orderBy: [
          {
            sort: "asc",
          },
          {
            id: "asc",
          },
        ],

        select: {
          id: true,
          propertyId: true,
          url: true,
          alt: true,
          sort: true,
        },
      });

    return Response.json(
      {
        ok: true,
        images,
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
      "PUT /api/admin/images/reorder:",
      error
    );

    return Response.json(
      {
        error:
          "Bildreihenfolge konnte nicht gespeichert werden.",
      },
      {
        status: 500,
      }
    );
  }
}