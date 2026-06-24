export function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
  
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  
    return 2 * R * Math.asin(Math.sqrt(a));
  }
  
  export function withinBoundingBox(lat, lng, centerLat, centerLng, radiusKm) {
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos((centerLat * Math.PI) / 180));
    return (
      lat >= centerLat - latDelta &&
      lat <= centerLat + latDelta &&
      lng >= centerLng - lngDelta &&
      lng <= centerLng + lngDelta
    );
  }
  