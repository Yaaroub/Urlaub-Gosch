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
// GET /api/admin/images?propertyId=123
//
// benötigt:
// IMAGES_VIEW
// ============================================================

export async function GET(req) {
  try {
    const auth = await requireAdminPermission(
      ADMIN_PERMISSIONS.IMAGES_VIEW,
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

    const items =
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
      });

    return Response.json(items, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(
      "GET /api/admin/images:",
      error
    );

    return Response.json(
      {
        error: "Fehler beim Laden der Bilder.",
      },
      {
        status: 500,
      }
    );
  }
}

// ============================================================
// POST /api/admin/images
//
// Einzelbild:
// {
//   propertyId,
//   url,
//   alt
// }
//
// Bulk:
// {
//   propertyId,
//   images: [
//     { url, alt }
//   ]
// }
//
// benötigt:
// IMAGES_EDIT
// ============================================================

export async function POST(req) {
  try {
    const auth = await requireAdminPermission(
      ADMIN_PERMISSIONS.IMAGES_EDIT,
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

    if (
      !propertyId ||
      Number.isNaN(propertyId)
    ) {
      return Response.json(
        {
          error: "propertyId fehlt oder ist ungültig.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------------
    // Objekt prüfen
    // --------------------------------------------------------

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
          error: "Objekt wurde nicht gefunden.",
        },
        {
          status: 404,
        }
      );
    }

    // --------------------------------------------------------
    // Bilder vorbereiten
    // --------------------------------------------------------

    const rawImages =
      Array.isArray(body?.images)
        ? body.images
        : body?.url
          ? [
              {
                url: body.url,
                alt: body.alt || null,
              },
            ]
          : [];

    const images =
      rawImages
        .map((image) => ({
          url: String(
            image?.url || ""
          ).trim(),

          alt:
            typeof image?.alt === "string" &&
            image.alt.trim()
              ? image.alt.trim()
              : null,
        }))
        .filter(
          (image) => image.url
        );

    if (images.length === 0) {
      return Response.json(
        {
          error: "Keine Bilder angegeben.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------------
    // höchste aktuelle Sortierung bestimmen
    // --------------------------------------------------------

    const max =
      await prisma.propertyImage.aggregate({
        where: {
          propertyId,
        },

        _max: {
          sort: true,
        },
      });

    const start =
      (max._max.sort ?? -1) + 1;

    const data =
      images.map(
        (image, index) => ({
          propertyId,

          url:
            image.url,

          alt:
            image.alt,

          sort:
            start + index,
        })
      );

    await prisma.propertyImage.createMany({
      data,
    });

    // --------------------------------------------------------
    // aktualisierte Liste zurückgeben
    // --------------------------------------------------------

    const fresh =
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
      });

    return Response.json(
      fresh,
      {
        status: 201,

        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "POST /api/admin/images:",
      error
    );

    return Response.json(
      {
        error:
          "Interner Fehler beim Anlegen der Bilder.",
      },
      {
        status: 500,
      }
    );
  }
}

// ============================================================
// PUT /api/admin/images
//
// z. B.:
// {
//   id,
//   alt,
//   sort
// }
//
// benötigt:
// IMAGES_EDIT
// ============================================================

export async function PUT(req) {
  try {
    const auth = await requireAdminPermission(
      ADMIN_PERMISSIONS.IMAGES_EDIT,
      req
    );

    if (!auth.ok) {
      return deny(auth);
    }

    const body =
      await req.json();

    const id = Number(
      body?.id
    );

    if (
      !id ||
      Number.isNaN(id)
    ) {
      return Response.json(
        {
          error: "id fehlt oder ist ungültig.",
        },
        {
          status: 400,
        }
      );
    }

    const existing =
      await prisma.propertyImage.findUnique({
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
          error: "Bild wurde nicht gefunden.",
        },
        {
          status: 404,
        }
      );
    }

    const data = {};

    if (
      body.alt !== undefined
    ) {
      data.alt =
        typeof body.alt === "string" &&
        body.alt.trim()
          ? body.alt.trim()
          : null;
    }

    if (
      body.sort !== undefined
    ) {
      const sort =
        Number(body.sort);

      if (
        !Number.isFinite(sort)
      ) {
        return Response.json(
          {
            error:
              "Ungültige Sortierreihenfolge.",
          },
          {
            status: 400,
          }
        );
      }

      data.sort =
        Math.max(
          0,
          Math.floor(sort)
        );
    }

    if (
      Object.keys(data).length === 0
    ) {
      return Response.json(
        {
          error:
            "Keine Änderungen angegeben.",
        },
        {
          status: 400,
        }
      );
    }

    const updated =
      await prisma.propertyImage.update({
        where: {
          id,
        },

        data,
      });

    return Response.json(
      updated,
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "PUT /api/admin/images:",
      error
    );

    return Response.json(
      {
        error: "Update fehlgeschlagen.",
      },
      {
        status: 500,
      }
    );
  }
}