import prisma from "@/lib/db";

export const MAX_NEARBY_RADIUS_KM = 100;

export function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}

/** Returns null for invalid input; read-only query. */
export function parseNearbyParams({ lat, lng, radius }) {
  const la = Number(lat);
  const ln = Number(lng);
  const r = radius == null || radius === "" ? 25 : Number(radius);
  if (!Number.isFinite(la) || !Number.isFinite(ln) || Math.abs(la) >= 85 || Math.abs(ln) > 180) return null;
  if (!Number.isFinite(r) || r <= 0) return null;
  return { lat: la, lng: ln, radiusKm: Math.min(r, MAX_NEARBY_RADIUS_KM) };
}

export async function findNearbyProperties({ lat, lng, radiusKm }) {
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

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
      images: { orderBy: { sort: "asc" }, take: 1, select: { url: true, alt: true } },
    },
    take: 250,
  });

  return candidates
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
    .map((p) => ({ ...p, distanceKm: haversineKm(lat, lng, p.lat, p.lng) }))
    .filter((p) => p.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
