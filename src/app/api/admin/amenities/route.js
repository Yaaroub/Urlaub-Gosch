import prisma from "@/lib/db";

import {
  ADMIN_PERMISSIONS,
  requireAdminPermission,
} from "@/lib/admin-permissions";

/**
 * Einheitliche Antwort bei fehlender Berechtigung.
 */
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

/**
 * GET /api/admin/amenities
 *
 * Benötigt:
 * PROPERTIES_VIEW
 *
 * Ausstattung gehört zu den
 * Objekt-Stammdaten.
 */
export async function GET(
  request
) {
  try {
    const auth =
      await requireAdminPermission(
        ADMIN_PERMISSIONS.PROPERTIES_VIEW,
        request
      );

    if (!auth.ok) {
      return deny(auth);
    }

    const items =
      await prisma.amenity.findMany({
        orderBy: {
          name: "asc",
        },
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
      "GET /api/admin/amenities failed:",
      error
    );

    return Response.json(
      {
        error:
          "Ausstattungen konnten nicht geladen werden.",
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * POST /api/admin/amenities
 *
 * Benötigt:
 * PROPERTIES_EDIT
 */
export async function POST(
  request
) {
  try {
    const auth =
      await requireAdminPermission(
        ADMIN_PERMISSIONS.PROPERTIES_EDIT,
        request
      );

    if (!auth.ok) {
      return deny(auth);
    }

    const body =
      await request.json();

    const name =
      String(
        body?.name || ""
      ).trim();

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

    /**
     * Prüfen, ob die Ausstattung
     * bereits vorhanden ist.
     */
    const existing =
      await prisma.amenity.findFirst({
        where: {
          name: {
            equals:
              name,

            mode:
              "insensitive",
          },
        },
      });

    if (existing) {
      return Response.json(
        existing,
        {
          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    const created =
      await prisma.amenity.create({
        data: {
          name,
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
      "POST /api/admin/amenities failed:",
      error
    );

    return Response.json(
      {
        error:
          "Ausstattung konnte nicht angelegt werden.",
      },
      {
        status: 500,
      }
    );
  }
}