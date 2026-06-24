import prisma from "@/lib/db";

// Haversine Distanz (km)
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(a));
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = Number(searchParams.get("lat"));
    const lng = Number(searchParams.get("lng"));
    const radius = Number(searchParams.get("radius") || 25);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return Response.json({ error: "lat/lng fehlen" }, { status: 400 });
    }

    // Bounding-Box (DB-Filter) – schnell
    const latDelta = radius / 111;
    const lngDelta = radius / (111 * Math.cos((lat * Math.PI) / 180));

    const candidates = await prisma.property.findMany({
      where: {
        lat: { gte: lat - latDelta, lte: lat + latDelta },
        lng: { gte: lng - lngDelta, lte: lng + lngDelta },
      },
      select: {
        id: true,
        slug: true,
        title: true,
        location: true,
        lat: true,
        lng: true,
        maxPersons: true,
        dogsAllowed: true,
        images: {
          orderBy: { sort: "asc" },
          take: 1,
          select: { url: true, alt: true },
        },
      },
      take: 250,
    });

    const items = candidates
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
      .map((p) => ({
        ...p,
        distanceKm: haversineKm(lat, lng, p.lat, p.lng),
      }))
      .filter((p) => p.distanceKm <= radius)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return Response.json({ items });
  }  catch (e) {
    console.error("nearby error:", e);
    return Response.json(
      { error: "nearby failed", details: String(e?.message || e) },
      { status: 500 }
    );
  }
}
