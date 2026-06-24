import prisma from "@/lib/db";
import SearchForm from "@/components/SearchForm";
import PropertyGridClient from "@/components/PropertyGridClient";
import LazyWeatherWidget from "@/components/LazyWeatherWidget";
import LazyLastMinuteTeaser from "@/components/LazyLastMinuteTeaser";
import { regions } from "@/lib/regions";
import { buildPropertyWhere } from "@/lib/search-utils";
import Link from "next/link";
import HomeHero from "@/components/HomeHero";
import LazyActivityMap from "@/components/LazyActivityMap";
import { activities } from "@/lib/activities";

export const revalidate = 300;

export default async function HomePage(props) {
  const sp = (await props.searchParams) ?? {};

  const getSP = (key) => {
    const value = sp[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const getSPArray = (key) => {
    const value = sp[key];
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  };

  const arrival = String(getSP("arrival") ?? "");
  const departure = String(getSP("departure") ?? "");
  const location = String(getSP("location") ?? "");
  const persons = String(getSP("persons") ?? "");
  const dogsStr = String(getSP("dogs") ?? "");

  const dogs =
    dogsStr === "true" ? true : dogsStr === "false" ? false : undefined;

  const amenitiesSelected = getSPArray("amenity")
    .filter(Boolean)
    .map((a) => String(a).toLowerCase());

  const where = buildPropertyWhere({
    arrival,
    departure,
    location,
    persons,
    dogs,
    amenities: amenitiesSelected,
  });

  const today = new Date();

  const [properties, allAmenities, activeLastMinuteOffers] = await Promise.all([
    prisma.property.findMany({
      where,
      orderBy: { id: "asc" },
      select: {
        id: true,
        slug: true,
        title: true,
        location: true,
        maxPersons: true,
        dogsAllowed: true,
        amenities: {
          select: {
            id: true,
            name: true,
          },
          take: 6,
        },
        images: {
          orderBy: {
            sort: "asc",
          },
          take: 1,
          select: {
            url: true,
            alt: true,
          },
        },
      },
    }),

    prisma.amenity.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
      },
    }),

    prisma.lastMinuteOffer.findMany({
      where: {
        endDate: {
          gt: today,
        },
      },
      select: {
        propertyId: true,
        discount: true,
      },
    }),
  ]);

  const lastMinuteDiscounts = Object.fromEntries(
    activeLastMinuteOffers.map((offer) => [
      String(offer.propertyId),
      Number(offer.discount) || 0,
    ])
  );

  const hasActiveFilters =
    Boolean(
      location ||
        persons ||
        amenitiesSelected.length ||
        typeof dogs === "boolean"
    ) || Boolean(arrival && departure);

  const resultsCount = properties.length;

  return (
    <>
      <HomeHero
        hasActiveFilters={hasActiveFilters}
        resultsCount={resultsCount}
      />

      <section id="suche" className="bg-[#050e1a]">
        <div className="mx-auto max-w-6xl px-3 pb-16 sm:px-4">
          <div className="relative -mt-10 md:-mt-14">
            <div className="rounded-3xl border border-white/10 bg-[#061423]/55 p-4 shadow-[0_18px_55px_rgba(0,0,0,0.55)] backdrop-blur-xl">
              <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-sky-400/80 to-transparent" />

              <div className="mb-3 flex items-start justify-between gap-3 pt-3">
                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Unterkunft finden
                  </h2>
                  <p className="text-[11px] text-sky-100/75">
                    Daten wählen und freie Objekte sehen.
                  </p>
                </div>

                <span className="rounded-full bg-sky-500/90 px-3 py-1 text-[11px] font-semibold text-white">
                  BOOK NOW
                </span>
              </div>

              <div className="rounded-2xl bg-white/95 p-3 ring-1 ring-slate-200">
                <SearchForm
                  initialParams={{
                    arrival,
                    departure,
                    location,
                    persons,
                    dogs:
                      dogs === true
                        ? "true"
                        : dogs === false
                        ? "false"
                        : "",
                    amenity: amenitiesSelected,
                  }}
                  amenities={allAmenities}
                />
              </div>

              {hasActiveFilters && (
                <p className="mt-3 text-[11px] text-sky-100/70">
                  {resultsCount} passende Unterkünfte gefunden.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#f7fafc] py-14 md:py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-sky-100/70 to-transparent" />
          <div className="absolute left-1/2 top-10 h-[420px] w-[900px] -translate-x-1/2 rounded-full bg-cyan-100/60 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4">
          <div className="mb-8 flex flex-col gap-5 md:mb-10 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="inline-flex rounded-full border border-sky-200 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-sky-700 shadow-sm">
                Ostsee Guide
              </span>

              <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 md:text-5xl">
                Entdecken & Planen
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                Finde schöne Ausflugsziele, beliebte Küstenorte und aktuelle
                Wetterinformationen für deine Reise an die Ostsee.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/ausflugsziele"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md"
              >
                Ausflugsziele ansehen
                <span className="ml-2">→</span>
              </Link>

              <Link
                href="/aktivitaete"
                className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-xl"
              >
                Karte öffnen
                <span className="ml-2">↗</span>
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-white bg-white shadow-2xl shadow-slate-900/10">
            <div className="flex flex-col gap-4 border-b border-slate-100 bg-white p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-700">
                  Interaktive Karte
                </p>

                <h3 className="mt-1 text-xl font-bold text-slate-950 md:text-2xl">
                  Ausflugsziele & Aktivitäten rund um die Ostsee
                </h3>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Entdecke Strände, Naturorte, Familienziele und besondere
                  Highlights in der Nähe deiner Unterkunft.
                </p>
              </div>

              <div className="hidden rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600 md:block">
                {activities?.length || 0} Ziele verfügbar
              </div>
            </div>

            <div className="p-3 md:p-5">
              <div className="relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-100">
                <div className="h-[420px] sm:h-[520px] lg:h-[620px]">
                  <LazyActivityMap
                    items={activities}
                    center={[54.35, 10.13]}
                    zoom={8}
                  />
                </div>

                <div className="pointer-events-none absolute left-4 top-4 hidden rounded-2xl border border-white/70 bg-white/90 px-4 py-3 shadow-xl backdrop-blur-xl sm:block">
                  <p className="text-xs font-bold text-slate-950">
                    Ostsee entdecken
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Klick auf einen Pin für Details
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
              <div className="border-b border-slate-100 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-700">
                      Live Wetter
                    </p>

                    <h3 className="mt-1 text-lg font-bold text-slate-950">
                      Wetter an der Küste
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Schnellcheck für deine nächsten Urlaubstage.
                    </p>
                  </div>

                  <span className="rounded-full bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 ring-1 ring-sky-100">
                    Live
                  </span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-sky-50 to-white p-4">
                <div className="rounded-[1.5rem] border border-sky-100 bg-white p-3 shadow-inner">
                  <LazyWeatherWidget />
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-700">
                    Regionen
                  </p>

                  <h3 className="mt-1 text-lg font-bold text-slate-950">
                    Beliebte Küstenorte an der Ostsee
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Entdecke schöne Ostseeorte, Strände, Naturregionen und
                    Ausflugsziele für deinen Urlaub in Schleswig-Holstein.
                  </p>
                </div>

                <Link
                  href="/regionen"
                  aria-label="Alle Ostsee Regionen ansehen"
                  className="shrink-0 rounded-full bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-sky-50 hover:text-sky-700"
                >
                  Alle →
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {regions.slice(0, 6).map((region) => (
                  <Link
                    key={region.slug}
                    href={`/regionen/${region.slug}`}
                    title={region.seoTitle}
                    aria-label={`${region.title} entdecken`}
                    className="group rounded-3xl border border-slate-100 bg-slate-50/80 p-4 transition hover:-translate-y-0.5 hover:border-sky-200 hover:bg-white hover:shadow-lg"
                  >
                    <article>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className="inline-flex rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-sky-700">
                            {region.badge}
                          </span>

                          <h4 className="mt-2 text-sm font-bold text-slate-950">
                            {region.title}
                          </h4>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {region.shortDescription}
                          </p>

                          <p className="mt-2 text-[11px] font-semibold text-sky-700">
                            Mehr über {region.title} erfahren
                          </p>
                        </div>

                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-slate-400 shadow-sm transition group-hover:bg-sky-600 group-hover:text-white">
                          →
                        </span>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="unterkuenfte" className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="mb-6 flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">
              Unterkünfte
            </span>

            <h2 className="text-2xl font-bold tracking-tight text-slate-950 md:text-4xl">
              Passende Ferienobjekte
            </h2>

            <p className="text-sm text-slate-500">
              {resultsCount} Objekt{resultsCount === 1 ? "" : "e"} gefunden.
            </p>
          </div>

          {resultsCount === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
              Keine Treffer
            </p>
          ) : (
            <PropertyGridClient
              items={properties}
              lastMinuteDiscounts={lastMinuteDiscounts}
              controls={true}
            />
          )}
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-4 py-10">
          <LazyLastMinuteTeaser />
        </div>
      </section>
    </>
  );
}