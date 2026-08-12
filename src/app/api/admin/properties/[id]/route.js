import prisma from "@/lib/db";

/**
 * GET /api/admin/properties/[id]
 *
 * Holt ein einzelnes Objekt inklusive Amenities.
 */
export async function GET(_req, ctx) {
  try {
    // Next.js 15: params asynchron auflösen
    const params = ctx?.params
      ? await ctx.params
      : {};

    const idNum = Number(params.id);

    if (
      !Number.isInteger(idNum) ||
      idNum <= 0
    ) {
      return Response.json(
        {
          error: "Ungültige ID",
        },
        {
          status: 400,
        }
      );
    }

    const property =
      await prisma.property.findUnique({
        where: {
          id: idNum,
        },

        include: {
          amenities: true,
        },
      });

    if (!property) {
      return Response.json(
        {
          error: "Nicht gefunden",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Da wir kein select benutzen, wird
     * kuschelwochenEnabled automatisch
     * mit zurückgegeben.
     */
    return Response.json(property, {
      status: 200,
    });
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
 * PUT /api/admin/properties/[id]
 *
 * Aktualisiert:
 * - Stammdaten
 * - Ostsee-Kuschelwochen
 * - Amenities
 *
 * Erwarteter Body:
 *
 * {
 *   title,
 *   location,
 *   maxPersons,
 *   dogsAllowed,
 *   kuschelwochenEnabled,
 *   description,
 *   amenities: ["WLAN", "Sauna"],
 *   slug
 * }
 */
export async function PUT(req, ctx) {
  try {
    const params = ctx?.params
      ? await ctx.params
      : {};

    const idNum = Number(params.id);

    if (
      !Number.isInteger(idNum) ||
      idNum <= 0
    ) {
      return Response.json(
        {
          error: "Ungültige ID",
        },
        {
          status: 400,
        }
      );
    }

    const existing =
      await prisma.property.findUnique({
        where: {
          id: idNum,
        },

        select: {
          id: true,
          slug: true,
        },
      });

    if (!existing) {
      return Response.json(
        {
          error: "Objekt nicht gefunden.",
        },
        {
          status: 404,
        }
      );
    }

    const body = await req.json();

    const {
      title,
      location,
      maxPersons,
      dogsAllowed,

      // Ostsee-Kuschelwochen
      kuschelwochenEnabled,

      description,
      amenities,
      slug,
    } = body;

    const updates = {};

    /*
     * Titel
     */
    if (title !== undefined) {
      const cleanTitle =
        typeof title === "string"
          ? title.trim()
          : "";

      if (!cleanTitle) {
        return Response.json(
          {
            error:
              "Titel darf nicht leer sein.",
          },
          {
            status: 400,
          }
        );
      }

      updates.title = cleanTitle;
    }

    /*
     * Ort
     */
    if (location !== undefined) {
      const cleanLocation =
        typeof location === "string"
          ? location.trim()
          : "";

      if (!cleanLocation) {
        return Response.json(
          {
            error:
              "Ort darf nicht leer sein.",
          },
          {
            status: 400,
          }
        );
      }

      updates.location = cleanLocation;
    }

    /*
     * Personen
     */
    if (maxPersons !== undefined) {
      const parsedMaxPersons =
        Number(maxPersons);

      if (
        !Number.isFinite(
          parsedMaxPersons
        ) ||
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

      updates.maxPersons =
        Math.floor(parsedMaxPersons);
    }

    /*
     * Hunde erlaubt
     */
    if (dogsAllowed !== undefined) {
      if (
        typeof dogsAllowed !==
        "boolean"
      ) {
        return Response.json(
          {
            error:
              "Ungültiger Wert für Hunde erlaubt.",
          },
          {
            status: 400,
          }
        );
      }

      updates.dogsAllowed =
        dogsAllowed;
    }

    /*
     * OSTSEE-KUSCHELWOCHEN
     *
     * WICHTIG:
     * false darf NICHT durch || true
     * überschrieben werden.
     */
    if (
      kuschelwochenEnabled !==
      undefined
    ) {
      if (
        typeof kuschelwochenEnabled !==
        "boolean"
      ) {
        return Response.json(
          {
            error:
              "Ungültiger Wert für Ostsee-Kuschelwochen.",
          },
          {
            status: 400,
          }
        );
      }

      updates.kuschelwochenEnabled =
        kuschelwochenEnabled;
    }

    /*
     * Beschreibung
     */
    if (description !== undefined) {
      updates.description =
        typeof description === "string" &&
        description.trim()
          ? description.trim()
          : null;
    }

    /*
     * Slug
     */
    if (slug !== undefined) {
      const cleanSlug =
        typeof slug === "string"
          ? slug
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
              .slice(0, 80)
          : "";

      if (cleanSlug) {
        const slugOwner =
          await prisma.property.findUnique(
            {
              where: {
                slug: cleanSlug,
              },

              select: {
                id: true,
              },
            }
          );

        if (
          slugOwner &&
          slugOwner.id !== idNum
        ) {
          return Response.json(
            {
              error:
                "Dieser Slug wird bereits von einem anderen Objekt verwendet.",
            },
            {
              status: 409,
            }
          );
        }

        updates.slug = cleanSlug;
      }
    }

    /*
     * Amenities vorbereiten.
     */
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
        : null;

    const updated =
      await prisma.property.update({
        where: {
          id: idNum,
        },

        data: {
          ...updates,

          ...(cleanAmenities !== null
            ? {
                amenities: {
                  /*
                   * Alte Verbindungen
                   * vollständig lösen.
                   */
                  set: [],

                  /*
                   * Gewünschte Amenities
                   * wieder verbinden.
                   */
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
              }
            : {}),
        },

        include: {
          amenities: true,
        },
      });

    return Response.json(updated, {
      status: 200,
    });
  } catch (error) {
    console.error(
      "PUT /api/admin/properties/[id] failed:",
      error
    );

    /*
     * Prisma Unique-Constraint,
     * beispielsweise Slug.
     */
    if (error?.code === "P2002") {
      return Response.json(
        {
          error:
            "Ein eindeutiger Wert wird bereits verwendet. Bitte prüfe insbesondere den Slug.",
        },
        {
          status: 409,
        }
      );
    }

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
 * DELETE /api/admin/properties/[id]
 *
 * Löscht eine Unterkunft.
 */
export async function DELETE(
  _req,
  ctx
) {
  try {
    const params = ctx?.params
      ? await ctx.params
      : {};

    const idNum = Number(params.id);

    if (
      !Number.isInteger(idNum) ||
      idNum <= 0
    ) {
      return Response.json(
        {
          error: "Ungültige ID",
        },
        {
          status: 400,
        }
      );
    }

    const existing =
      await prisma.property.findUnique({
        where: {
          id: idNum,
        },

        select: {
          id: true,
        },
      });

    if (!existing) {
      return Response.json(
        {
          error:
            "Objekt nicht gefunden.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Durch onDelete: Cascade werden
     * abhängige Datensätze wie Bilder,
     * Preiszeiten, Extras usw.
     * entsprechend gelöscht.
     */
    await prisma.property.delete({
      where: {
        id: idNum,
      },
    });

    return Response.json(
      {
        ok: true,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "DELETE /api/admin/properties/[id] failed:",
      error
    );

    return Response.json(
      {
        error: "Löschen fehlgeschlagen.",
      },
      {
        status: 500,
      }
    );
  }
}