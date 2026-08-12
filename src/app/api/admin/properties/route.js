import prisma from "@/lib/db";

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
      where: { slug },
      select: { id: true },
    });

    if (!hit) {
      return slug;
    }

    n += 1;
    slug = `${raw}-${n}`;
  }
}

/**
 * GET /api/admin/properties
 *
 * Liefert alle Objekte für die Admin-Übersicht.
 */
export async function GET() {
  try {
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

        // Ostsee-Kuschelwochen
        kuschelwochenEnabled: true,
      },
    });

    return Response.json(items);
  } catch (error) {
    console.error(
      "GET /api/admin/properties failed:",
      error
    );

    return Response.json(
      {
        error: "Objekte konnten nicht geladen werden.",
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
 * Legt eine neue Unterkunft an.
 *
 * Neue Objekte nehmen standardmäßig an den
 * Ostsee-Kuschelwochen teil.
 */
export async function POST(req) {
  try {
    const body = await req.json();

    const {
      title,
      location,
      maxPersons = 2,
      dogsAllowed = false,

      // Standardmäßig aktiviert
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

    const cleanAmenities = Array.isArray(
      amenities
    )
      ? [
          ...new Set(
            amenities
              .map((name) =>
                String(name || "").trim()
              )
              .filter(Boolean)
          ),
        ]
      : [];

    const requestedSlug =
      typeof slug === "string"
        ? slug.trim()
        : "";

    const finalSlug = requestedSlug
      ? await uniqueSlug(requestedSlug)
      : await uniqueSlug(cleanTitle);

    const created =
      await prisma.property.create({
        data: {
          title: cleanTitle,
          location: cleanLocation,

          maxPersons: Math.floor(
            parsedMaxPersons
          ),

          dogsAllowed:
            dogsAllowed === true,

          // Ostsee-Kuschelwochen
          kuschelwochenEnabled:
            kuschelwochenEnabled !== false,

          description:
            typeof description === "string" &&
            description.trim()
              ? description.trim()
              : null,

          slug: finalSlug,

          amenities: {
            connectOrCreate:
              cleanAmenities.map((name) => ({
                where: {
                  name,
                },
                create: {
                  name,
                },
              })),
          },
        },

        select: {
          id: true,
          title: true,
          location: true,
          maxPersons: true,
          dogsAllowed: true,

          // Wichtig für Admin-UI
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

    return Response.json(created, {
      status: 201,
    });
  } catch (error) {
    console.error(
      "POST /api/admin/properties failed:",
      error
    );

    return Response.json(
      {
        error: "Anlegen fehlgeschlagen.",
      },
      {
        status: 500,
      }
    );
  }
}