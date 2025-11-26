import prisma from "@/lib/db";

/**
 * GET /api/admin/properties/[id]
 * Holt ein einzelnes Objekt inkl. Amenities
 */
export async function GET(_req, ctx) {
  // params asynchron auflösen (Next.js 15 dynamic API)
  const p = ctx?.params ? await ctx.params : {};
  const idNum = Number(p.id);

  if (!idNum) {
    return Response.json(
      { error: "Ungültige ID" },
      { status: 400 }
    );
  }

  const prop = await prisma.property.findUnique({
    where: { id: idNum },
    include: { amenities: true },
  });

  if (!prop) {
    return Response.json(
      { error: "Nicht gefunden" },
      { status: 404 }
    );
  }

  return Response.json(prop, { status: 200 });
}

/**
 * PUT /api/admin/properties/[id]
 * Aktualisiert Stammdaten + Amenities-Relationen komplett
 *
 * Erwarteter Body:
 * {
 *   title,
 *   location,
 *   maxPersons,
 *   dogsAllowed,
 *   description,
 *   amenities: ["WLAN","Sauna", ...], // ersetzt vollständig
 *   slug
 * }
 */
export async function PUT(req, ctx) {
  try {
    const p = ctx?.params ? await ctx.params : {};
    const idNum = Number(p.id);

    if (!idNum) {
      return Response.json(
        { error: "Ungültige ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const {
      title,
      location,
      maxPersons,
      dogsAllowed,
      description,
      amenities, // array von Namen (Strings) – ersetzt Zuordnung vollständig
      slug,
    } = body;

    // Felder, die aktualisiert werden dürfen
    const updates = {
      title: title ?? undefined,
      location: location ?? undefined,
      maxPersons:
        typeof maxPersons === "number" ? maxPersons : undefined,
      dogsAllowed:
        typeof dogsAllowed === "boolean" ? dogsAllowed : undefined,
      description:
        description === undefined
          ? undefined
          : description || null, // "" -> null speichern
      slug: slug?.trim() || undefined,
    };

    const updated = await prisma.property.update({
      where: { id: idNum },
      data: {
        ...updates,
        ...(Array.isArray(amenities)
          ? {
              amenities: {
                // alte Beziehungen komplett lösen
                set: [],
                // alle gewünschten Amenities verbinden oder neu anlegen
                connectOrCreate: amenities.map((name) => ({
                  where: { name },
                  create: { name },
                })),
              },
            }
          : {}),
      },
      include: { amenities: true },
    });

    return Response.json(updated, { status: 200 });
  } catch (e) {
    console.error("PUT /api/admin/properties/[id] failed:", e);
    return Response.json(
      { error: "Aktualisieren fehlgeschlagen." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/properties/[id]
 * Löscht die Unterkunft
 */
export async function DELETE(_req, ctx) {
  try {
    const p = ctx?.params ? await ctx.params : {};
    const idNum = Number(p.id);

    if (!idNum) {
      return Response.json(
        { error: "Ungültige ID" },
        { status: 400 }
      );
    }

    // Falls du auf Cascade setzt (onDelete: Cascade in Prisma Relations),
    // werden verknüpfte Datensätze (Images, PricePeriods, Extras, usw.) mit gelöscht.
    await prisma.property.delete({
      where: { id: idNum },
    });

    return Response.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error("DELETE /api/admin/properties/[id] failed:", e);
    return Response.json(
      { error: "Löschen fehlgeschlagen." },
      { status: 500 }
    );
  }
}
