// app/page.js
import prisma from "@/lib/db";
import SearchForm from "@/components/SearchForm";
import PropertyGridClient from "@/components/PropertyGridClient";
import WeatherWidget from "@/components/WeatherWidget";
import RegionTeasers from "@/components/RegionTeasers";
import LastMinuteTeaser from "@/components/LastMinuteTeaser";
import { buildPropertyWhere } from "@/lib/search-utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage(ctx) {
  // 🔁 searchParams sauber auflösen
  const spRaw = ctx?.searchParams;
  const sp = spRaw ? await spRaw : {};

  // einzelne Werte rausziehen mit Fallbacks
  const arrival = sp.arrival || "";
  const departure = sp.departure || "";
  const location = sp.location || "";
  const persons = sp.persons || "";
  const dogsStr = sp.dogs ?? "";

  const dogs =
    dogsStr === "true"
      ? true
      : dogsStr === "false"
      ? false
      : undefined;

  // amenity kann string oder array sein
  const amenitiesSelected = []
    .concat(sp.amenity ?? [])
    .filter(Boolean)
    .map((a) => String(a).toLowerCase());

  // WHERE für Prisma erzeugen
  const where = buildPropertyWhere({
    arrival,
    departure,
    location,
    persons,
    dogs,
    amenities: amenitiesSelected,
  });

  // Unterkünfte aus DB holen
  let properties = [];
  try {
    properties = await prisma.property.findMany({
      where,
      orderBy: { id: "asc" },
      select: {
        id: true,
        slug: true,
        title: true,
        location: true,
        maxPersons: true,
        dogsAllowed: true,
        images: {
          orderBy: { sort: "asc" },
          take: 1,
          select: { url: true, alt: true },
        },
      },
    });
  } catch (e) {
    console.error("DB error:", e?.message || e);
  }

  // alle Amenities (Ausstattungen) holen für dynamische Checkbox-Liste
  let allAmenities = [];
  try {
    allAmenities = await prisma.amenity.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    });
  } catch (e) {
    console.error("Amenity fetch error:", e?.message || e);
  }

  const hasActiveFilters =
    Boolean(
      location ||
        persons ||
        amenitiesSelected.length ||
        typeof dogs === "boolean"
    ) ||
    Boolean(arrival && departure);

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-8 mb-8">
          <h1 className="text-2xl font-semibold mb-2">
            Finde deine Unterkunft
          </h1>
          <p className="text-sm text-slate-600 mb-6">
            Verfügbarkeit wird nur berücksichtigt, wenn An- &amp; Abreise
            gesetzt sind.
          </p>

          {/* Wir geben initialParams + amenities in die SearchForm */}
          <SearchForm
            initialParams={{
              arrival,
              departure,
              location,
              persons,
              dogs: dogs === true ? "true" : "",
              amenity: amenitiesSelected,
            }}
            amenities={allAmenities}
          />

          {hasActiveFilters && (
            <p className="mt-3 text-xs text-slate-500">
              {properties.length} Ergebnis
              {properties.length === 1 ? "" : "se"} gefunden.
            </p>
          )}
        </div>

        <h2 className="text-xl font-semibold mb-4">Unterkünfte</h2>
        {properties.length === 0 ? (
          <p className="text-sm text-slate-500">
            Keine Treffer für die aktuelle Suche.
          </p>
        ) : (
          <PropertyGridClient
            items={properties}
            showAvailabilityBadge={false}
          />
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="grid md:grid-cols-3 gap-6">
          <WeatherWidget />
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-6">
            <RegionTeasers />
          </div>
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-6">
            <h3 className="font-semibold mb-2">Favoriten</h3>
            <p className="text-sm text-slate-600">
              Merke dir Unterkünfte mit dem Herz-Icon und finde sie hier
              schnell wieder.
            </p>
            <a
              href="/favorites"
              className="inline-block mt-3 rounded-xl px-4 py-2 bg-sky-600 text-white text-sm"
            >
              Favoriten ansehen
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <LastMinuteTeaser />
      </section>
    </>
  );
}
