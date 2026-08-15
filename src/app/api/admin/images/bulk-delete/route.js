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
// BULK DELETE
//
// {
//   propertyId: 123,
//   ids: [59, 60, 70]
// }
//
// benötigt:
// IMAGES_DELETE
// ============================================================

export async function DELETE(req) {
  try {
    const auth =
      await requireAdminPermission(
        ADMIN_PERMISSIONS.IMAGES_DELETE,
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

    const ids =
      Array.isArray(
        body?.ids
      )
        ? [
            ...new Set(
              body.ids
                .map(
                  (value) =>
                    Number(
                      value
                    )
                )
                .filter(
                  (value) =>
                    Number.isInteger(
                      value
                    ) &&
                    value > 0
                )
            ),
          ]
        : [];

    if (
      !propertyId ||
      Number.isNaN(
        propertyId
      ) ||
      ids.length === 0
    ) {
      return Response.json(
        {
          error:
            "Ungültige propertyId oder keine Bild-IDs angegeben.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------------
    // Sicherstellen, dass die Bilder
    // wirklich zu dieser Property gehören.
    // --------------------------------------------------------

    const toDelete =
      await prisma.propertyImage.findMany({
        where: {
          propertyId,

          id: {
            in:
              ids,
          },
        },

        select: {
          id: true,
        },
      });

    if (
      toDelete.length === 0
    ) {
      return Response.json(
        {
          error:
            "Keine passenden Bilder für dieses Objekt gefunden.",
        },
        {
          status: 404,
        }
      );
    }

    const validIds =
      toDelete.map(
        (image) =>
          image.id
      );

    // --------------------------------------------------------
    // Bilder löschen
    // --------------------------------------------------------

    await prisma.propertyImage.deleteMany({
      where: {
        propertyId,

        id: {
          in:
            validIds,
        },
      },
    });

    // --------------------------------------------------------
    // Restliche Bilder holen
    // --------------------------------------------------------

    const remaining =
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
        },
      });

    // --------------------------------------------------------
    // Reihenfolge wieder 0,1,2,3...
    //
    // wichtig für Titelbild-Logik
    // --------------------------------------------------------

    if (
      remaining.length >
      0
    ) {
      await prisma.$transaction(
        remaining.map(
          (
            image,
            index
          ) =>
            prisma.propertyImage.update({
              where: {
                id:
                  image.id,
              },

              data: {
                sort:
                  index,
              },
            })
        )
      );
    }

    // --------------------------------------------------------
    // aktualisierte Liste
    // --------------------------------------------------------

    const updatedList =
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
          url: true,
          alt: true,
          sort: true,
        },
      });

    return Response.json(
      {
        ok: true,

        removed:
          validIds,

        images:
          updatedList,
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
      "DELETE images bulk:",
      error
    );

    return Response.json(
      {
        error:
          "Bilder konnten nicht gelöscht werden.",
      },
      {
        status: 500,
      }
    );
  }
}