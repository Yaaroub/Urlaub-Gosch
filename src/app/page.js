import Link from "next/link";

import prisma from "@/lib/db";
import { buildPropertyWhere } from "@/lib/search-utils";

import HomeHero from "@/components/HomeHero";
import HomePlanningRails from "@/components/HomePlanningRails";
import LazyLastMinuteTeaser from "@/components/LazyLastMinuteTeaser";
import PropertyGridClient from "@/components/PropertyGridClient";
import SearchForm from "@/components/SearchForm";

export const revalidate = 300;

export const metadata = {
  title: "Ferienwohnungen an der Ostsee",
  description:
    "Ferienwohnungen und Ferienhäuser an der Ostsee finden, Verfügbarkeit prüfen und den Urlaub mit Wetter, Ausflugszielen und regionalen Empfehlungen planen.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Ferienwohnungen an der Ostsee | Urlaub-GOSCH",
    description:
      "Freie Ferienunterkünfte an der Ostsee entdecken und den Aufenthalt mit Küstenwetter, Aktivitäten und regionalen Tipps planen.",
    type: "website",
    locale: "de_DE",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ferienwohnungen an der Ostsee | Urlaub-GOSCH",
    description:
      "Ferienunterkünfte suchen, Verfügbarkeit prüfen und den Ostseeurlaub mit Wetter und Ausflugszielen planen.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

function getSiteUrl() {
  const value =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "";

  return value.trim().replace(/\/$/, "");
}

function getSingleSearchParam(searchParams, key) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

function getSearchParamArray(searchParams, key) {
  const value = searchParams[key];

  if (!value) return [];

  return Array.isArray(value) ? value : [value];
}

export default async function HomePage(props) {
  const searchParams = (await props.searchParams) ?? {};

  const arrival = String(
    getSingleSearchParam(searchParams, "arrival") ?? "",
  );

  const departure = String(
    getSingleSearchParam(searchParams, "departure") ?? "",
  );

  const objectName = String(
    getSingleSearchParam(searchParams, "objectName") ?? "",
  ).trim();

  const street = String(
    getSingleSearchParam(searchParams, "street") ?? "",
  ).trim();

  const location = String(
    getSingleSearchParam(searchParams, "location") ?? "",
  ).trim();

  const persons = String(
    getSingleSearchParam(searchParams, "persons") ?? "",
  );

  const dogsValue = String(
    getSingleSearchParam(searchParams, "dogs") ?? "",
  );

  const dogs =
    dogsValue === "true"
      ? true
      : dogsValue === "false"
        ? false
        : undefined;

  const kuschelwochenValue = String(
    getSingleSearchParam(searchParams, "kuschelwochen") ?? "",
  );

  const kuschelwochen =
    kuschelwochenValue === "1" ||
    kuschelwochenValue === "true";

  const amenitiesSelected = getSearchParamArray(
    searchParams,
    "amenity",
  )
    .filter(Boolean)
    .map((amenity) => String(amenity).toLowerCase());

  const baseWhere = buildPropertyWhere({
    arrival,
    departure,
    location,
    persons,
    dogs,
    amenities: amenitiesSelected,
  });

  const where = {
    AND: [
      baseWhere,

      kuschelwochen
        ? {
            kuschelwochenEnabled: true,
          }
        : {},

      objectName
        ? {
            title: {
              contains: objectName,
              mode: "insensitive",
            },
          }
        : {},

      street
        ? {
            address: {
              contains: street,
              mode: "insensitive",
            },
          }
        : {},
    ],
  };

  const today = new Date();

  const [
    properties,
    allAmenities,
    activeLastMinuteOffers,
    locationRows,
  ] = await Promise.all([
    prisma.property.findMany({
      where,

      orderBy: {
        id: "asc",
      },

      select: {
        id: true,
        slug: true,
        title: true,

        // Straße wird jetzt für jede Objektkarte geladen
        address: true,

        location: true,
        maxPersons: true,
        dogsAllowed: true,

        // Ostsee-Kuschelwochen
        kuschelwochenEnabled: true,

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

        // Beide Last-Minute-Arten laden
        discountType: true,
        discount: true,
        discountAmount: true,
      },
    }),

    // Ortsauswahl unabhängig von den aktiven Filtern laden
    prisma.property.findMany({
      select: {
        location: true,
      },
      orderBy: {
        location: "asc",
      },
    }),
  ]);

  const allLocations = Array.from(
    new Set(
      locationRows
        .map((property) =>
          String(property.location || "").trim(),
        )
        .filter(Boolean),
    ),
  ).sort((a, b) =>
    a.localeCompare(b, "de", {
      sensitivity: "base",
    }),
  );

  /*
   * Struktur:
   *
   * Prozent:
   * {
   *   "21": {
   *     discountType: "PERCENT",
   *     discount: 20,
   *     discountAmount: 0
   *   }
   * }
   *
   * Fester Betrag:
   * {
   *   "21": {
   *     discountType: "FIXED",
   *     discount: 0,
   *     discountAmount: 25
   *   }
   * }
   */
  const lastMinuteDiscounts = Object.fromEntries(
    activeLastMinuteOffers.map((offer) => [
      String(offer.propertyId),
      {
        discountType:
          offer.discountType === "FIXED"
            ? "FIXED"
            : "PERCENT",

        discount: Number(offer.discount) || 0,

        discountAmount:
          Number(offer.discountAmount) || 0,
      },
    ]),
  );

  const hasActiveFilters =
    Boolean(
      objectName ||
        street ||
        location ||
        persons ||
        amenitiesSelected.length ||
        kuschelwochen ||
        typeof dogs === "boolean",
    ) || Boolean(arrival && departure);

  const resultsCount = properties.length;

  const siteUrl = getSiteUrl();

  const structuredData = siteUrl
    ? {
        "@context": "https://schema.org",

        "@graph": [
          {
            "@type": "WebSite",
            "@id": `${siteUrl}/#website`,
            url: `${siteUrl}/`,
            name: "Urlaub-GOSCH",
            inLanguage: "de-DE",

            potentialAction: {
              "@type": "SearchAction",

              target: {
                "@type": "EntryPoint",
                urlTemplate:
                  `${siteUrl}/?location={search_term_string}#unterkuenfte`,
              },

              "query-input":
                "required name=search_term_string",
            },
          },

          {
            "@type": "CollectionPage",
            "@id": `${siteUrl}/#ferienunterkuenfte`,
            url: `${siteUrl}/`,

            name:
              "Ferienwohnungen und Ferienhäuser an der Ostsee",

            description:
              "Ferienunterkünfte an der Ostsee suchen und den Urlaub mit Wetter, Aktivitäten und Informationen zu Küstenregionen planen.",

            inLanguage: "de-DE",

            isPartOf: {
              "@id": `${siteUrl}/#website`,
            },

            mainEntity: {
              "@type": "ItemList",

              numberOfItems: resultsCount,

              itemListElement: properties
                .slice(0, 20)
                .map((property, index) => ({
                  "@type": "ListItem",
                  position: index + 1,
                  name: property.title,
                  url:
                    `${siteUrl}/properties/${property.slug}`,
                })),
            },
          },
        ],
      }
    : null;

  return (
    <>
      {structuredData ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              structuredData,
            ).replace(/</g, "\\u003c"),
          }}
        />
      ) : null}

      {/* HERO */}

      <HomeHero
        hasActiveFilters={hasActiveFilters}
        resultsCount={resultsCount}
      />

      {/* SUCHE */}

      <section
        id="suche"
        aria-labelledby="search-heading"
        className="bg-[#050e1a]"
      >
        <div className="mx-auto max-w-6xl px-3 py-10 sm:px-4 md:py-12">
          <div className="rounded-3xl border border-white/10 bg-[#061423]/70 p-4 shadow-[0_18px_55px_rgba(0,0,0,0.55)] backdrop-blur-xl">
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-sky-400/80 to-transparent" />

            <div className="mb-3 flex items-start justify-between gap-3 pt-3">
              <div>
                <h2
                  id="search-heading"
                  className="text-sm font-semibold text-white"
                >
                  Ferienunterkunft finden
                </h2>

                <p className="text-[11px] text-sky-100/75">
                  Reisedaten und Wünsche auswählen und
                  verfügbare Objekte anzeigen.
                </p>
              </div>

              <span className="rounded-full bg-sky-500/90 px-3 py-1 text-[11px] font-semibold text-white">
                DIREKT SUCHEN
              </span>
            </div>

            <div className="rounded-2xl bg-white/95 p-3 ring-1 ring-slate-200">
              <SearchForm
                initialParams={{
                  arrival,
                  departure,
                  objectName,
                  street,
                  location,
                  persons,

                  kuschelwochen:
                    kuschelwochen
                      ? "1"
                      : "",

                  dogs:
                    dogs === true
                      ? "true"
                      : dogs === false
                        ? "false"
                        : "",

                  amenity: amenitiesSelected,
                }}
                amenities={allAmenities}
                locations={allLocations}
              />
            </div>

            {hasActiveFilters ? (
              <p
                className="mt-3 text-[11px] text-sky-100/70"
                aria-live="polite"
              >
                {resultsCount} passende Unterkunft
                {resultsCount === 1 ? "" : "en"} gefunden.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {/* UNTERKÜNFTE */}

      <section
        id="unterkuenfte"
        aria-labelledby="properties-heading"
        className="relative overflow-visible bg-[#f7fafc] py-12 md:py-16"
      >
        {/* Hintergrund */}

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-sky-100/70 to-transparent" />

          <div className="absolute left-1/2 top-16 h-[460px] w-[980px] -translate-x-1/2 rounded-full bg-cyan-100/55 blur-3xl" />
        </div>

        {/* Überschrift bewusst oberhalb der sticky Rails */}

        <div className="relative mx-auto max-w-[900px] px-4 sm:px-5">
          <div className="mb-8 md:mb-10">
            <span className="inline-flex rounded-full border border-sky-200 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-sky-700 shadow-sm">
              Ostsee-Unterkünfte
            </span>

            <h2
              id="properties-heading"
              className="mt-4 text-3xl font-bold tracking-tight text-slate-950 md:text-5xl"
            >
              Ferienwohnungen und Ferienhäuser an der Ostsee
            </h2>

            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600 md:text-base md:leading-7">
              Vergleiche verfügbare Ferienunterkünfte in
              Schleswig-Holstein und finde das passende
              Ferienhaus oder die passende Ferienwohnung für
              deinen Ostseeurlaub.
            </p>
          </div>
        </div>

        {/* Aktivitäten links / Ergebnisse Mitte / Wetter rechts */}

        <HomePlanningRails>
          <main className="min-w-0">
            <div className="mb-5 flex flex-col gap-3 rounded-[1.75rem] border border-white bg-white/90 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.07)] backdrop-blur-sm sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-700">
                  Suchergebnisse
                </p>

                <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
                  Passende Ferienobjekte
                </h3>

                <p
                  className="mt-2 text-sm text-slate-500"
                  aria-live="polite"
                >
                  {resultsCount} Objekt
                  {resultsCount === 1 ? "" : "e"}

                  {hasActiveFilters
                    ? " entsprechen deiner aktuellen Suche."
                    : " stehen aktuell zur Auswahl."}
                </p>
              </div>

              {hasActiveFilters ? (
                <Link
                  href="/#unterkuenfte"
                  className="inline-flex shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
                >
                  Filter zurücksetzen
                </Link>
              ) : null}
            </div>

            {resultsCount === 0 ? (
              <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-5 py-10 text-center shadow-sm">
                <h3 className="text-lg font-bold text-slate-950">
                  Keine passende Unterkunft gefunden
                </h3>

                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
                  Ändere den Reisezeitraum, den Ort oder einzelne
                  Ausstattungsmerkmale und starte die Suche
                  erneut.
                </p>

                <Link
                  href="/#suche"
                  className="mt-5 inline-flex items-center justify-center rounded-full bg-sky-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-sky-700"
                >
                  Suche anpassen
                </Link>
              </div>
            ) : (
              <PropertyGridClient
                items={properties}
                lastMinuteDiscounts={lastMinuteDiscounts}
                controls={true}
                initialKuschelwochen={kuschelwochen}
                desktopColumns={2}
              />
            )}
          </main>
        </HomePlanningRails>
      </section>

      {/* LAST MINUTE */}

      <section
        aria-label="Last-Minute-Angebote"
        className="bg-white"
      >
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <LazyLastMinuteTeaser />
        </div>
      </section>
    </>
  );
}