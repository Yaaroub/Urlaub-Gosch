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

async function getImageId(
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
// GET /api/admin/images/:id
//
// benötigt:
// IMAGES_VIEW
// ============================================================

export async function GET(
  req,
  context
) {
  try {
    const auth =
      await requireAdminPermission(
        ADMIN_PERMISSIONS.IMAGES_VIEW,
        req
      );

    if (!auth.ok) {
      return deny(auth);
    }

    const id =
      await getImageId(
        context
      );

    if (!id) {
      return Response.json(
        {
          error:
            "Ungültige Bild-ID.",
        },
        {
          status: 400,
        }
      );
    }

    const image =
      await prisma.propertyImage.findUnique({
        where: {
          id,
        },
      });

    if (!image) {
      return Response.json(
        {
          error:
            "Bild wurde nicht gefunden.",
        },
        {
          status: 404,
        }
      );
    }

    return Response.json(
      image,
      {
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "GET /api/admin/images/[id]:",
      error
    );

    return Response.json(
      {
        error:
          "Bild konnte nicht geladen werden.",
      },
      {
        status: 500,
      }
    );
  }
}

// ============================================================
// DELETE /api/admin/images/:id
//
// benötigt:
// IMAGES_DELETE
// ============================================================

export async function DELETE(
  req,
  context
) {
  try {
    const auth =
      await requireAdminPermission(
        ADMIN_PERMISSIONS.IMAGES_DELETE,
        req
      );

    if (!auth.ok) {
      return deny(auth);
    }

    const id =
      await getImageId(
        context
      );

    if (!id) {
      return Response.json(
        {
          error:
            "Ungültige Bild-ID.",
        },
        {
          status: 400,
        }
      );
    }

    const image =
      await prisma.propertyImage.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          propertyId: true,
        },
      });

    if (!image) {
      return Response.json(
        {
          error:
            "Bild wurde nicht gefunden.",
        },
        {
          status: 404,
        }
      );
    }

    await prisma.propertyImage.delete({
      where: {
        id,
      },
    });

    // --------------------------------------------------------
    // Reihenfolge für dieses Objekt neu aufbauen
    // --------------------------------------------------------

    const remaining =
      await prisma.propertyImage.findMany({
        where: {
          propertyId:
            image.propertyId,
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

    if (
      remaining.length >
      0
    ) {
      await prisma.$transaction(
        remaining.map(
          (
            item,
            index
          ) =>
            prisma.propertyImage.update({
              where: {
                id:
                  item.id,
              },

              data: {
                sort:
                  index,
              },
            })
        )
      );
    }

    return Response.json(
      {
        ok: true,
        id,
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
      "DELETE /api/admin/images/[id]:",
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