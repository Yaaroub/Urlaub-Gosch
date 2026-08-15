import prisma from "@/lib/db";

import {
  ADMIN_PERMISSIONS,
  requireAdminPermission,
} from "@/lib/admin-permissions";

/**
 * Erstellt einen einfachen URL-Slug und sorgt dafür,
 * dass er unter den Properties eindeutig ist.
 */
async function uniqueSlug(base) {
  const raw =
    (base || "")
      .toLowerCase()
      .trim()
      .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "objekt";

  let slug = raw;
  let n = 1;

  while (true) {
    const hit = await prisma.property.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
      },
    });

    if (!hit) {
      return slug;
    }

    n += 1;
    slug = `${raw}-${n}`;
  }
}

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
        "Cache-Control": "no-store",
      },
    }
  );
}

/**
 * GET /api/admin/properties
 *
 * Benötigt:
 * PROPERTIES_VIEW
 *
 * Gibt zusätzlich über Header zurück,
 * ob der Benutzer bearbeiten oder löschen darf.
 */
export async function GET(request) {
  try {
    const auth = await requireAdminPermission(
      ADMIN_PERMISSIONS.PROPERTIES_VIEW,
      request
    );

    if (!auth.ok) {
      return deny(auth);
    }

    const user = auth.user;

    const canEdit =
      user.role === "SUPERADMIN" ||
      user.permissions.includes(
        ADMIN_PERMISSIONS.PROPERTIES_EDIT
      );

    const canDelete =
      user.role === "SUPERADMIN" ||
      user.permissions.includes(
        ADMIN_PERMISSIONS.PROPERTIES_DELETE
      );

    const items = await prisma.property.findMany({
      orderBy: {
        id: "asc",
      },

      select: {
        id: true,
        slug: true,
        title: true,
        location: true,
        maxPersons: true,
        dogsAllowed: true,
        kuschelwochenEnabled: true,
      },
    });

    return Response.json(items, {
      headers: {
        "Cache-Control": "no-store",

        "X-Admin-Can-Edit":
          canEdit ? "1" : "0",

        "X-Admin-Can-Delete":
          canDelete ? "1" : "0",
      },
    });
  } catch (error) {
    console.error(
      "GET /api/admin/properties failed:",
      error
    );

    return Response.json(
      {
        error:
          "Objekte konnten nicht geladen werden.",
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * POST /api/admin/properties
 *
 * Benötigt:
 * PROPERTIES_EDIT
 *
 * Legt ein neues Objekt an.
 */
export async function POST(request) {
  try {
    const auth = await requireAdminPermission(
      ADMIN_PERMISSIONS.PROPERTIES_EDIT,
      request
    );

    if (!auth.ok) {
      return deny(auth);
    }

    const body = await request.json();

    const {
      title,
      location,

      maxPersons = 2,

      dogsAllowed = false,

      kuschelwochenEnabled = true,

      description = "",

      amenities = [],

      slug,
    } = body;

    const cleanTitle =
      typeof title === "string"
        ? title.trim()
        : "";

    const cleanLocation =
      typeof location === "string"
        ? location.trim()
        : "";

    if (!cleanTitle || !cleanLocation) {
      return Response.json(
        {
          error:
            "Titel und Ort sind erforderlich.",
        },
        {
          status: 400,
        }
      );
    }

    const parsedMaxPersons =
      Number(maxPersons);

    if (
      !Number.isFinite(parsedMaxPersons) ||
      parsedMaxPersons < 1
    ) {
      return Response.json(
        {
          error:
            "Die maximale Personenzahl muss mindestens 1 sein.",
        },
        {
          status: 400,
        }
      );
    }

    const cleanAmenities =
      Array.isArray(amenities)
        ? [
            ...new Set(
              amenities
                .map((name) =>
                  String(
                    name || ""
                  ).trim()
                )
                .filter(Boolean)
            ),
          ]
        : [];

    const requestedSlug =
      typeof slug === "string"
        ? slug.trim()
        : "";

    const finalSlug =
      requestedSlug
        ? await uniqueSlug(
            requestedSlug
          )
        : await uniqueSlug(
            cleanTitle
          );

    const created =
      await prisma.property.create({
        data: {
          title:
            cleanTitle,

          location:
            cleanLocation,

          maxPersons:
            Math.floor(
              parsedMaxPersons
            ),

          dogsAllowed:
            dogsAllowed === true,

          kuschelwochenEnabled:
            kuschelwochenEnabled !== false,

          description:
            typeof description ===
              "string" &&
            description.trim()
              ? description.trim()
              : null,

          slug:
            finalSlug,

          amenities: {
            connectOrCreate:
              cleanAmenities.map(
                (name) => ({
                  where: {
                    name,
                  },

                  create: {
                    name,
                  },
                })
              ),
          },
        },

        select: {
          id: true,
          title: true,
          location: true,
          maxPersons: true,
          dogsAllowed: true,
          kuschelwochenEnabled: true,
          slug: true,

          amenities: {
            select: {
              id: true,
              name: true,
            },
          },
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
      "POST /api/admin/properties failed:",
      error
    );

    return Response.json(
      {
        error:
          "Anlegen fehlgeschlagen.",
      },
      {
        status: 500,
      }
    );
  }
}