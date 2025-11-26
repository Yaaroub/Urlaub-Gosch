// app/page.js
import prisma from "@/lib/db";
import SearchForm from "@/components/SearchForm";
import PropertyGridClient from "@/components/PropertyGridClient";
import WeatherWidget from "@/components/WeatherWidget";
import RegionTeasers from "@/components/RegionTeasers";
import LastMinuteTeaser from "@/components/LastMinuteTeaser";
import { buildPropertyWhere } from "@/lib/search-utils";
import Link from "next/link";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage(ctx) {
  const spRaw = ctx?.searchParams;
  const sp = spRaw ? await spRaw : {};

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

  const amenitiesSelected = []
    .concat(sp.amenity ?? [])
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
      {/* HERO MIT WELLE & SUCHE */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-900 via-sky-800 to-sky-900 text-white">
        {/* dekorative Wellen */}
        <div className="pointer-events-none absolute inset-x-0 bottom-[-6rem] h-[14rem] opacity-70">
          <div className="absolute inset-x-[-40%] bottom-0 h-[12rem] rounded-[50%] bg-gradient-to-r from-sky-500 via-sky-300 to-sky-500 blur-3xl" />
        </div>

        <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-4 pt-8 pb-16 md:flex-row md:items-center md:pt-12 md:pb-20">
          {/* linke Seite: Brand + Claim */}
          <div className="md:flex-1 space-y-4">
            <div className="flex items-center gap-3">
              {/* Logo – Pfad ggf. anpassen */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/urlaub-gosch-logo.png"
                alt="URLAUB-GOSCH Logo"
                className="h-12 w-auto drop-shadow-md"
              />
              <span className="text-xs font-semibold tracking-[0.22em] uppercase text-sky-100">
                Urlaub-GOSCH
              </span>
            </div>

            <h1 className="text-3xl leading-tight font-bold md:text-4xl lg:text-[2.8rem] lg:leading-[1.1]">
              Ferien an Nord- &amp; Ostsee –
              <span className="block text-sky-200">
                handverlesene Unterkünfte, direkt am Meer.
              </span>
            </h1>

            <p className="max-w-xl text-sm md:text-base text-sky-100/90">
              Finde Ferienwohnungen, Häuser und Apartments, die wirklich zu dir
              passen – mit klarer Suche, echten Verfügbarkeiten und Fokus auf
              Küste, Familien &amp; Hunde.
            </p>

            <div className="flex flex-wrap gap-3 text-[11px] text-sky-100/80">
              <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 backdrop-blur">
                • Strandnah &amp; küstennah
              </span>
              <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 backdrop-blur">
                • Viele Unterkünfte mit Hund erlaubt
              </span>
              <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 backdrop-blur">
                • Persönlich geprüfte Objekte
              </span>
            </div>
          </div>

          {/* rechte Seite: „glasmorphische“ Suchkarte */}
          <div className="md:flex-1 md:max-w-md md:self-stretch">
            <div className="mt-2 rounded-3xl bg-white/95 p-4 shadow-xl ring-1 ring-slate-200 backdrop-blur">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Jetzt Unterkunft suchen
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Reisedaten angeben und direkt freie Unterkünfte sehen.
                  </p>
                </div>
                <span className="rounded-full border border-slate-200 bg-sky-50 px-3 py-1 text-[11px] font-medium text-sky-700">
                  Küste entdecken
                </span>
              </div>

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
                <p className="mt-3 text-[11px] text-slate-500">
                  {properties.length} passende Unterkunft
                  {properties.length === 1 ? "" : "en"} für deine Suche
                  gefunden.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* THEMEN-KACHELN / „BESONDERES“ */}
      <section className="bg-slate-50">
  <div className="mx-auto max-w-6xl px-4 pb-8 pt-8 md:pb-10 md:pt-10">
    <h2 className="text-lg font-semibold text-slate-900 md:text-xl">
      Wie möchtest du reisen?
    </h2>
    <p className="mt-1 text-sm text-slate-600">
      Wähle dein Urlaubsthema – wir zeigen dir passende Unterkünfte.
    </p>

    <div className="mt-5 grid gap-4 sm:grid-cols-3">
      {/* 1 */}
      <Link
        href="/?location=Strand"
        className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 to-sky-700 p-4 text-white shadow-md ring-1 ring-sky-300/50"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0_0,rgba(255,255,255,0.22),transparent_55%)] opacity-80" />
        <div className="relative space-y-1">
          <p className="text-[11px] uppercase tracking-[0.16em] text-sky-100">
            Direkt am Wasser
          </p>
          <h3 className="text-base font-semibold">Meerblick &amp; Hafenflair</h3>
          <p className="text-xs text-sky-50/90">
            Wohnungen mit Blick aufs Wasser oder fußläufig zum Strand.
          </p>
        </div>
      </Link>

      {/* 2 */}
      <Link
        href="/?dogs=true"
        className="group relative overflow-hidden rounded-2xl bg-white p-4 text-slate-900 shadow-md ring-1 ring-sky-100"
      >
        <div className="absolute right-[-30px] top-[-30px] h-24 w-24 rounded-full bg-sky-100 group-hover:scale-110 transition-transform" />
        <div className="relative space-y-1">
          <p className="text-[11px] uppercase tracking-[0.16em] text-sky-700">
            Hunde willkommen
          </p>
          <h3 className="text-base font-semibold">
            Urlaub mit Hund &amp; Familie
          </h3>
          <p className="text-xs text-slate-600">
            Unterkünfte mit Garten, Nähe zu Spazierwegen und Strand.
          </p>
        </div>
      </Link>

      {/* 3 */}
      <Link
        href="/?persons=2"
        className="group relative overflow-hidden rounded-2xl bg-white p-4 text-slate-900 shadow-md ring-1 ring-sky-100"
      >
        <div className="absolute left-[-24px] bottom-[-24px] h-20 w-20 rounded-full bg-sky-50 group-hover:scale-110 transition-transform" />
        <div className="relative space-y-1">
          <p className="text-[11px] uppercase tracking-[0.16em] text-sky-700">
            Kurzurlaub
          </p>
          <h3 className="text-base font-semibold">
            Wochenende am Meer
          </h3>
          <p className="text-xs text-slate-600">
            Kleine Apartments für 2–3 Personen, perfekt für den
            spontanen Trip.
          </p>
        </div>
      </Link>
    </div>
  </div>
</section>

      {/* UNTERKÜNFTE */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-6 md:pb-12 md:pt-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 md:text-2xl">
                Unsere Unterkünfte
              </h2>
              <p className="text-sm text-slate-600">
                Ausgewählte Ferienobjekte in den schönsten Küstenregionen.
              </p>
            </div>
            {properties.length > 0 && (
              <span className="text-xs text-slate-500">
                {properties.length} Unterkunft
                {properties.length === 1 ? "" : "en"} aktuell im Überblick
              </span>
            )}
          </div>

          {properties.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
              Keine Treffer für die aktuelle Suche. Entferne einzelne Filter
              oder löse die Datumsangabe, um mehr Unterkünfte zu sehen.
            </p>
          ) : (
            <PropertyGridClient
              items={properties}
              showAvailabilityBadge={false}
            />
          )}
        </div>
      </section>

      {/* MOSAIK: WETTER / REGIONEN / FAVORITEN */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-8 md:pb-12">
          <div className="grid gap-5 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <div className="grid gap-5 md:grid-cols-2">
              {/* Wetter */}
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-sky-500 to-sky-700 p-4 text-white shadow-md">
                <h3 className="mb-2 text-sm font-semibold">
                  Wetter an der Küste
                </h3>
                <div className="-mx-1">
                  <WeatherWidget />
                </div>
              </div>

              {/* Regionen */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md">
                <h3 className="mb-2 text-sm font-semibold text-slate-900">
                  Beliebte Regionen
                </h3>
                <p className="mb-3 text-xs text-slate-500">
                  Von bekannten Klassikern bis hin zu stillen Buchten –
                  entdecke deine Lieblingsregion.
                </p>
                <RegionTeasers />
              </div>
            </div>

            {/* Favoriten */}
            <div className="flex flex-col rounded-2xl border border-slate-700/60 bg-slate-900 p-5 text-white shadow-xl">
              <h3 className="text-sm font-semibold mb-2">Deine Merkliste</h3>
              <p className="text-xs text-slate-200 mb-4">
                Tippe auf das Herz-Icon bei einer Unterkunft und speichere sie
                für später – perfekt, um verschiedene Optionen in Ruhe zu
                vergleichen.
              </p>
              <a
                href="/favorites"
                className="mt-auto inline-flex items-center justify-center rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-400"
              >
                Favoriten ansehen
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* LAST MINUTE */}
      <section className="bg-gradient-to-b from-sky-900 to-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
          <div className="rounded-3xl border border-sky-200/70 bg-gradient-to-br from-sky-500 via-sky-400 to-sky-600 p-5 text-white shadow-2xl sm:p-7">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-100">
                  Last Minute
                </p>
                <h2 className="text-xl font-bold md:text-2xl">
                  Kurzfristig ans Meer – unsere aktuellen Angebote
                </h2>
                <p className="mt-1 text-sm text-sky-50 max-w-xl">
                  Perfekt für spontane Auszeiten: reduzierte Preise und freie
                  Zeiträume in den nächsten Wochen.
                </p>
              </div>
            </div>
            <LastMinuteTeaser />
          </div>
        </div>
      </section>
    </>
  );
}
