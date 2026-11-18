// src/lib/search-utils.js
// ======================================================================
// Dienstfunktionen für Suchlogik (Property-Filter für Prisma)
// ======================================================================
import { parseTravelDate } from "./kuschelwochen.js";
import { startOfTodayBerlin } from "./public-calendar.js";
export const AMENITY_LABELS = {
  wlan: "WLAN",
  sauna: "Sauna",
  fireplace: "Kamin",
  seaview: "Meerblick",
  washer: "Waschmaschine",
  fenced: "Eingezäunt",
  parking: "Parkplatz",
  balcony: "Balkon / Terrasse",
  beach: "Strandnah",
  // Optional: "Ferienhaus"/"Ferienwohnung" ebenfalls als Amenity-Namen nutzbar
};

// Hilfsfunktion: Eingabe-Array normalisieren (klein, trimmed)
export const toAmenityLabels = (arr = []) =>
  (Array.isArray(arr) ? arr : [arr])
    .filter(Boolean)
    .map((v) => String(v).trim().toLowerCase())
    .filter(Boolean);

export function publicTravelWindow(arrival, departure, today = startOfTodayBerlin()) {
  const start = parseTravelDate(arrival);
  const end = parseTravelDate(departure);
  if (!start || !end || start < today || end <= start || end - start > 730 * 86400000) return null;
  return { start, end };
}

// Zahl oder 0
export const asNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Baut ein Prisma-Where-Objekt für Property.
 * - Ort, Personen, Hunde, Amenities, Zeitraum
 * - Amenities: AND (alle ausgewählten müssen vorhanden sein)
 * - Case-insensitive Suche
 */
export function buildPropertyWhere({
  arrival,
  departure,
  location,
  persons,
  dogs,
  amenities = [],
} = {}) {
  const window = publicTravelWindow(arrival, departure);
  const aNames = toAmenityLabels(amenities);

  /** @type {import('@prisma/client').Prisma.PropertyWhereInput} */
  const where = { AND: [] };

  // Standort / Titel
  if (location) {
    const q = String(location).trim();
    where.AND.push({
      OR: [
        { location: { contains: q, mode: "insensitive" } },
        { title: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  // Personenanzahl
  if (asNum(persons)) {
    where.AND.push({ maxPersons: { gte: asNum(persons) } });
  }

  // Hunde erlaubt / nicht
  if (typeof dogs === "boolean") {
    where.AND.push({ dogsAllowed: dogs });
  }

  // Ausstattung: alle gewünschten müssen vorkommen (case-insensitive)
  if (aNames.length) {
    where.AND.push(
      ...aNames.map((name) => ({
        amenities: {
          some: { name: { equals: name, mode: "insensitive" } },
        },
      }))
    );
  }

  // Zeitraum: keine Überschneidung mit bestehenden Buchungen
  if (window) {
    const { start, end } = window;
    where.AND.push({
      bookings: {
        none: {
          AND: [{ startDate: { lt: end } }, { endDate: { gt: start } }],
        },
      },
    });
  }

  return where.AND.length ? where : {};
}
