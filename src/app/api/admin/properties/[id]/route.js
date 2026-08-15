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
 * Property-ID aus Next.js Context lesen.
 *
 * Next.js 15:
 * context.params muss awaited werden.
 */
async function getPropertyId(
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

/**
 * Eindeutigen Slug erzeugen.
 *
 * excludeId:
 * Beim Bearbeiten darf das aktuelle
 * Objekt seinen bestehenden Slug behalten.
 */
async function uniqueSlug(
  base,
  excludeId = null
) {
  const raw =
    (base || "")
      .toLowerCase()
      .trim()
      .replace(
        /[^\p{Letter}\p{Number}]+/gu,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      )
      .slice(0, 80) ||
    "objekt";

  let slug =
    raw;

  let n =
    1;

  while (true) {
    const hit =
      await prisma.property.findUnique({
        where: {
          slug,
        },

        select: {
          id: true,
        },
      });

    if (
      !hit ||
      hit.id === excludeId
    ) {
      return slug;
    }

    n += 1;

    slug =
      `${raw}-${n}`;
  }
}

/**
 * GET /api/admin/properties/:id
 *
 * Benötigt:
 * PROPERTIES_VIEW
 */
export async function GET(
  request,
  context
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

    const id =
      await getPropertyId(
        context
      );

    if (!id) {
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

    const property =
      await prisma.property.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          slug: true,

          title: true,
          description: true,

          location: true,
          address: true,

          maxPersons: true,
          dogsAllowed: true,

          kuschelwochenEnabled:
            true,

          lat: true,
          lng: true,
          region: true,

          amenities: {
            select: {
              id: true,
              name: true,
            },

            orderBy: {
              name: "asc",
            },
          },
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

    return Response.json(
      property,
      {
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "GET /api/admin/properties/[id] failed:",
      error
    );

    return Response.json(
      {
        error:
          "Objektdaten konnten nicht geladen werden.",
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * PUT /api/admin/properties/:id
 *
 * Benötigt:
 * PROPERTIES_EDIT
 */
export async function PUT(
  request,
  context
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

    const id =
      await getPropertyId(
        context
      );

    if (!id) {
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

    const existing =
      await prisma.property.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          slug: true,
        },
      });

    if (!existing) {
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

    const body =
      await request.json();

    const cleanTitle =
      typeof body?.title ===
      "string"
        ? body.title.trim()
        : "";

    const cleanLocation =
      typeof body?.location ===
      "string"
        ? body.location.trim()
        : "";

    if (
      !cleanTitle ||
      !cleanLocation
    ) {
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

    const maxPersons =
      Number(
        body?.maxPersons ??
          2
      );

    if (
      !Number.isFinite(
        maxPersons
      ) ||
      maxPersons < 1
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
      Array.isArray(
        body?.amenities
      )
        ? [
            ...new Set(
              body.amenities
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
      typeof body?.slug ===
      "string"
        ? body.slug.trim()
        : "";

    let finalSlug =
      existing.slug;

    if (
      requestedSlug &&
      requestedSlug !==
        existing.slug
    ) {
      finalSlug =
        await uniqueSlug(
          requestedSlug,
          id
        );
    }

    if (!requestedSlug) {
      finalSlug =
        existing.slug ||
        (await uniqueSlug(
          cleanTitle,
          id
        ));
    }

    const updated =
      await prisma.property.update({
        where: {
          id,
        },

        data: {
          title:
            cleanTitle,

          location:
            cleanLocation,

          maxPersons:
            Math.floor(
              maxPersons
            ),

          dogsAllowed:
            body?.dogsAllowed ===
            true,

          kuschelwochenEnabled:
            body
              ?.kuschelwochenEnabled !==
            false,

          description:
            typeof body?.description ===
              "string" &&
            body.description.trim()
              ? body.description.trim()
              : null,

          slug:
            finalSlug,

          amenities: {
            set: [],

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
          slug: true,
          title: true,
          location: true,
          maxPersons: true,
          dogsAllowed: true,
          kuschelwochenEnabled:
            true,

          amenities: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

    return Response.json(
      updated,
      {
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "PUT /api/admin/properties/[id] failed:",
      error
    );

    return Response.json(
      {
        error:
          "Aktualisieren fehlgeschlagen.",
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * DELETE /api/admin/properties/:id
 *
 * Benötigt:
 * PROPERTIES_DELETE
 */
export async function DELETE(
  request,
  context
) {
  try {
    const auth =
      await requireAdminPermission(
        ADMIN_PERMISSIONS.PROPERTIES_DELETE,
        request
      );

    if (!auth.ok) {
      return deny(auth);
    }

    const id =
      await getPropertyId(
        context
      );

    if (!id) {
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

    const existing =
      await prisma.property.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          title: true,
        },
      });

    if (!existing) {
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

    await prisma.property.delete({
      where: {
        id,
      },
    });

    return Response.json(
      {
        success: true,
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
      "DELETE /api/admin/properties/[id] failed:",
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