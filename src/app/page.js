import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarCheck2,
  HeartHandshake,
  ShieldCheck,
  Waves,
} from "lucide-react";

import prisma from "@/lib/db";
import { buildPropertyWhere } from "@/lib/search-utils";

import HomeHero from "@/components/HomeHero";
import HomePlanningRails from "@/components/HomePlanningRails";
import LazyLastMinuteTeaser from "@/components/LazyLastMinuteTeaser";
import PropertyGridClient from "@/components/PropertyGridClient";
import SearchForm from "@/components/SearchForm";

export const revalidate = 300;

export const metadata = {
  title: "Ferienwohnungen an der Ostsee | Urlaub Gosch",

  description:
    "Ferienwohnungen und Ferienhäuser an der Ostsee bei Urlaub Gosch finden. Seit 2004 persönliche Ferienvermietung, Gästebetreuung und über 120 Unterkünfte.",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    title: "Ferienwohnungen an der Ostsee | Urlaub Gosch",

    description:
      "Seit 2004 vermittelt und betreut Urlaub Gosch Ferienwohnungen und Ferienhäuser an der Ostsee – persönlich, zuverlässig und mit über 120 Unterkünften.",

    type: "website",
    locale: "de_DE",
    url: "/",
    siteName: "Urlaub Gosch",
  },

  twitter: {
    card: "summary_large_image",

    title:
      "Ferienwohnungen an der Ostsee | Urlaub Gosch",

    description:
      "Ferienunterkünfte an der Ostsee finden – mit persönlicher Gästebetreuung und Erfahrung seit 2004.",
  },

  robots: {
    index: true,
    follow: true,
  },
};


/* ============================================================================
   HELPERS
============================================================================ */

function getSiteUrl() {
  const value =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "";

  return value
    .trim()
    .replace(/\/$/, "");
}


function getSingleSearchParam(
  searchParams,
  key,
) {
  const value =
    searchParams[key];

  return Array.isArray(value)
    ? value[0]
    : value;
}


function getSearchParamArray(
  searchParams,
  key,
) {
  const value =
    searchParams[key];

  if (!value) {
    return [];
  }

  return Array.isArray(value)
    ? value
    : [value];
}


/* ============================================================================
   HOMEPAGE
============================================================================ */

export default async function HomePage(
  props,
) {
  const searchParams =
    (await props.searchParams) ??
    {};


  /* --------------------------------------------------------------------------
     SUCHPARAMETER
  -------------------------------------------------------------------------- */

  const arrival =
    String(
      getSingleSearchParam(
        searchParams,
        "arrival",
      ) ?? "",
    );


  const departure =
    String(
      getSingleSearchParam(
        searchParams,
        "departure",
      ) ?? "",
    );


  const objectName =
    String(
      getSingleSearchParam(
        searchParams,
        "objectName",
      ) ?? "",
    ).trim();


  const street =
    String(
      getSingleSearchParam(
        searchParams,
        "street",
      ) ?? "",
    ).trim();


  const location =
    String(
      getSingleSearchParam(
        searchParams,
        "location",
      ) ?? "",
    ).trim();


  const persons =
    String(
      getSingleSearchParam(
        searchParams,
        "persons",
      ) ?? "",
    );


  const dogsValue =
    String(
      getSingleSearchParam(
        searchParams,
        "dogs",
      ) ?? "",
    );


  const dogs =
    dogsValue === "true"
      ? true
      : dogsValue === "false"
        ? false
        : undefined;


  const kuschelwochenValue =
    String(
      getSingleSearchParam(
        searchParams,
        "kuschelwochen",
      ) ?? "",
    );


  const kuschelwochen =
    kuschelwochenValue ===
      "1" ||
    kuschelwochenValue ===
      "true";


  const amenitiesSelected =
    getSearchParamArray(
      searchParams,
      "amenity",
    )
      .filter(Boolean)
      .map((amenity) =>
        String(
          amenity,
        ).toLowerCase(),
      );


  /* --------------------------------------------------------------------------
     DATENBANKFILTER
  -------------------------------------------------------------------------- */

  const baseWhere =
    buildPropertyWhere({
      arrival,
      departure,
      location,
      persons,
      dogs,

      amenities:
        amenitiesSelected,
    });


  const where = {
    AND: [
      baseWhere,

      kuschelwochen
        ? {
            kuschelwochenEnabled:
              true,
          }
        : {},

      objectName
        ? {
            title: {
              contains:
                objectName,

              mode:
                "insensitive",
            },
          }
        : {},

      street
        ? {
            address: {
              contains:
                street,

              mode:
                "insensitive",
            },
          }
        : {},
    ],
  };


  const today =
    new Date();


  /* --------------------------------------------------------------------------
     DATEN LADEN
  -------------------------------------------------------------------------- */

  const [
    properties,
    allAmenities,
    activeLastMinuteOffers,
    locationRows,
  ] =
    await Promise.all([
      prisma.property.findMany({
        where,

        orderBy: {
          id: "asc",
        },

        select: {
          id: true,
          slug: true,
          title: true,

          address: true,
          location: true,

          maxPersons: true,
          dogsAllowed: true,

          kuschelwochenEnabled:
            true,

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

          discountType: true,
          discount: true,
          discountAmount:
            true,
        },
      }),


      /*
       * Ortsauswahl immer vollständig laden.
       * Aktive Suchfilter dürfen die
       * Ortsauswahl nicht verkleinern.
       */
      prisma.property.findMany({
        select: {
          location: true,
        },

        orderBy: {
          location: "asc",
        },
      }),
    ]);


  /* --------------------------------------------------------------------------
     ORTE
  -------------------------------------------------------------------------- */

  const allLocations =
    Array.from(
      new Set(
        locationRows
          .map((property) =>
            String(
              property.location ||
                "",
            ).trim(),
          )
          .filter(Boolean),
      ),
    ).sort(
      (a, b) =>
        a.localeCompare(
          b,
          "de",
          {
            sensitivity:
              "base",
          },
        ),
    );


  /* --------------------------------------------------------------------------
     LAST MINUTE
  -------------------------------------------------------------------------- */

  const lastMinuteDiscounts =
    Object.fromEntries(
      activeLastMinuteOffers.map(
        (offer) => [
          String(
            offer.propertyId,
          ),

          {
            discountType:
              offer.discountType ===
              "FIXED"
                ? "FIXED"
                : "PERCENT",

            discount:
              Number(
                offer.discount,
              ) || 0,

            discountAmount:
              Number(
                offer.discountAmount,
              ) || 0,
          },
        ],
      ),
    );


  /* --------------------------------------------------------------------------
     SUCHSTATUS
  -------------------------------------------------------------------------- */

  const hasActiveFilters =
    Boolean(
      objectName ||
        street ||
        location ||
        persons ||
        amenitiesSelected.length ||
        kuschelwochen ||
        typeof dogs ===
          "boolean",
    ) ||
    Boolean(
      arrival &&
        departure,
    );


  const resultsCount =
    properties.length;


  /* --------------------------------------------------------------------------
     SEO / GEO / LLM STRUCTURED DATA
  -------------------------------------------------------------------------- */

  const siteUrl =
    getSiteUrl();


  const structuredData =
    siteUrl
      ? {
          "@context":
            "https://schema.org",

          "@graph": [
            {
              "@type":
                "Organization",

              "@id":
                `${siteUrl}/#organization`,

              name:
                "Urlaub Gosch",

              url:
                `${siteUrl}/`,

              foundingDate:
                "2004-04-01",

              description:
                "Urlaub Gosch ist seit 2004 auf Ferienvermietung, persönliche Gästebetreuung und die Betreuung von Ferienimmobilien an der Ostsee spezialisiert.",

              email:
                "info@urlaub-gosch.de",

              areaServed: [
                {
                  "@type":
                    "AdministrativeArea",

                  name:
                    "Schleswig-Holstein",
                },

                {
                  "@type":
                    "Place",

                  name:
                    "Ostseeküste",
                },
              ],

              knowsAbout: [
                "Ferienvermietung an der Ostsee",
                "Ferienwohnungen an der Ostsee",
                "Ferienhäuser an der Ostsee",
                "Gästebetreuung",
                "Buchungsmanagement",
                "Objektbetreuung",
                "Reinigung und Objektkontrolle",
                "Wäscheservice",
                "Hausmeisterservice",
              ],
            },


            {
              "@type":
                "WebSite",

              "@id":
                `${siteUrl}/#website`,

              url:
                `${siteUrl}/`,

              name:
                "Urlaub Gosch",

              inLanguage:
                "de-DE",

              publisher: {
                "@id":
                  `${siteUrl}/#organization`,
              },

              potentialAction: {
                "@type":
                  "SearchAction",

                target: {
                  "@type":
                    "EntryPoint",

                  urlTemplate:
                    `${siteUrl}/?location={search_term_string}#unterkuenfte`,
                },

                "query-input":
                  "required name=search_term_string",
              },
            },


            {
              "@type":
                "CollectionPage",

              "@id":
                `${siteUrl}/#homepage`,

              url:
                `${siteUrl}/`,

              name:
                "Ferienwohnungen und Ferienhäuser an der Ostsee",

              description:
                "Ferienwohnungen und Ferienhäuser an der Ostsee finden und nach Reisedatum, Ort, Personen, Ausstattung, Hunden und besonderen Angeboten filtern.",

              inLanguage:
                "de-DE",

              isPartOf: {
                "@id":
                  `${siteUrl}/#website`,
              },

              about: {
                "@id":
                  `${siteUrl}/#organization`,
              },

              publisher: {
                "@id":
                  `${siteUrl}/#organization`,
              },

              mainEntity: {
                "@type":
                  "ItemList",

                numberOfItems:
                  resultsCount,

                itemListElement:
                  properties
                    .slice(
                      0,
                      20,
                    )
                    .map(
                      (
                        property,
                        index,
                      ) => ({
                        "@type":
                          "ListItem",

                        position:
                          index +
                          1,

                        name:
                          property.title,

                        url:
                          `${siteUrl}/properties/${property.slug}`,
                      }),
                    ),
              },
            },
          ],
        }
      : null;


  /* ==========================================================================
     RENDER
  ========================================================================== */

  return (
    <>
      {/* ================================================================
          STRUCTURED DATA
      ================================================================ */}

      {structuredData ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html:
              JSON.stringify(
                structuredData,
              ).replace(
                /</g,
                "\\u003c",
              ),
          }}
        />
      ) : null}


      {/* ================================================================
          HERO
      ================================================================ */}

      <HomeHero
        hasActiveFilters={
          hasActiveFilters
        }
        resultsCount={
          resultsCount
        }
      />


      {/* ================================================================
          SUCHE + SUCHERGEBNISSE

          Bewusst EIN zusammenhängender Bereich.
          Kein About-, SEO- oder Last-Minute-Inhalt dazwischen.
      ================================================================ */}

      <section
        id="suche"
        aria-labelledby="search-heading"
        className="
          relative
          overflow-visible
          bg-[#f7fafc]
          pb-14
          md:pb-20
        "
      >
        {/* weicher Übergang vom Hero */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            inset-0
            overflow-hidden
          "
        >
          <div
            className="
              absolute
              inset-x-0
              top-0
              h-[420px]
              bg-gradient-to-b
              from-[#050e1a]
              via-[#061423]
              to-transparent
            "
          />

          <div
            className="
              absolute
              left-1/2
              top-[360px]
              h-[480px]
              w-[980px]
              -translate-x-1/2
              rounded-full
              bg-cyan-100/50
              blur-3xl
            "
          />
        </div>


        <div className="relative">


          {/* ============================================================
              SUCHMASKE
          ============================================================ */}

          <div
            className="
              mx-auto
              max-w-6xl
              px-3
              pb-7
              pt-10
              sm:px-4
              md:pb-9
              md:pt-12
            "
          >
            <div
              className="
                overflow-hidden
                rounded-[1.75rem]
                border
                border-white/10
                bg-[#061423]/95
                shadow-[0_24px_70px_rgba(0,0,0,0.32)]
                backdrop-blur-xl
              "
            >
              {/* obere Akzentlinie */}

              <div
                className="
                  h-[2px]
                  w-full
                  bg-gradient-to-r
                  from-transparent
                  via-sky-400/90
                  to-transparent
                "
              />


              <div
                className="
                  flex
                  flex-col
                  gap-4
                  p-4
                  sm:p-5
                  md:p-6
                "
              >
                {/* Überschrift */}

                <div
                  className="
                    flex
                    items-start
                    justify-between
                    gap-4
                  "
                >
                  <div>
                    <p
                      className="
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-[0.2em]
                        text-sky-300
                      "
                    >
                      Urlaub planen
                    </p>

                    <h2
                      id="search-heading"
                      className="
                        mt-1
                        text-xl
                        font-bold
                        tracking-tight
                        text-white
                        sm:text-2xl
                      "
                    >
                      Ferienunterkunft finden
                    </h2>

                    <p
                      className="
                        mt-1
                        max-w-xl
                        text-xs
                        leading-5
                        text-sky-100/65
                        sm:text-sm
                      "
                    >
                      Reisedaten und Wünsche
                      auswählen und direkt die
                      passenden Ferienwohnungen
                      und Ferienhäuser anzeigen.
                    </p>
                  </div>


                  <span
                    className="
                      hidden
                      shrink-0
                      rounded-full
                      bg-sky-500/90
                      px-3
                      py-1.5
                      text-[10px]
                      font-bold
                      uppercase
                      tracking-[0.12em]
                      text-white
                      sm:inline-flex
                    "
                  >
                    Direkt suchen
                  </span>
                </div>


                {/* eigentliche Suchmaske */}

                <div
                  className="
                    rounded-2xl
                    bg-white/95
                    p-3
                    shadow-inner
                    ring-1
                    ring-white
                    sm:p-4
                  "
                >
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
                          : dogs ===
                                false
                            ? "false"
                            : "",

                      amenity:
                        amenitiesSelected,
                    }}
                    amenities={
                      allAmenities
                    }
                    locations={
                      allLocations
                    }
                  />
                </div>


                {/* aktueller Suchstatus */}

                {hasActiveFilters ? (
                  <div
                    className="
                      flex
                      flex-wrap
                      items-center
                      justify-between
                      gap-2
                    "
                  >
                    <p
                      className="
                        text-xs
                        text-sky-100/75
                      "
                      aria-live="polite"
                    >
                      <strong className="font-bold text-white">
                        {resultsCount}
                      </strong>{" "}
                      passende Unterkunft
                      {resultsCount === 1
                        ? ""
                        : "en"}{" "}
                      gefunden.
                    </p>

                    <span
                      className="
                        rounded-full
                        bg-white/10
                        px-2.5
                        py-1
                        text-[10px]
                        font-semibold
                        text-white/70
                      "
                    >
                      Filter aktiv
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>


          {/* ============================================================
              SUCHERGEBNISSE

              SearchForm scrollt nach Absenden genau hierhin.
          ============================================================ */}

          <div
            id="unterkuenfte"
            className="
              scroll-mt-24
              pt-2
            "
          >
            {/* Überschrift */}

            <div
              className="
                relative
                mx-auto
                max-w-[900px]
                px-4
                sm:px-5
              "
            >
              <div className="mb-7 md:mb-9">
                <div
                  className="
                    flex
                    flex-col
                    gap-4
                    sm:flex-row
                    sm:items-end
                    sm:justify-between
                  "
                >
                  <div>
                    <span
                      className="
                        inline-flex
                        rounded-full
                        border
                        border-sky-200
                        bg-white
                        px-3
                        py-1
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-[0.18em]
                        text-sky-700
                        shadow-sm
                      "
                    >
                      Ostsee-Unterkünfte
                    </span>

                    <h2
                      id="properties-heading"
                      className="
                        mt-3
                        text-3xl
                        font-bold
                        tracking-tight
                        text-slate-950
                        md:text-4xl
                      "
                    >
                      {hasActiveFilters
                        ? "Passende Ferienobjekte"
                        : "Ferienwohnungen und Ferienhäuser an der Ostsee"}
                    </h2>

                    <p
                      className="
                        mt-3
                        max-w-3xl
                        text-sm
                        leading-6
                        text-slate-600
                        md:text-base
                        md:leading-7
                      "
                    >
                      {hasActiveFilters
                        ? `${resultsCount} ${
                            resultsCount ===
                            1
                              ? "Unterkunft entspricht"
                              : "Unterkünfte entsprechen"
                          } deiner aktuellen Suche.`
                        : "Vergleiche unsere Ferienunterkünfte an der Ostsee und finde das passende Ferienhaus oder die passende Ferienwohnung für deinen Urlaub."}
                    </p>
                  </div>


                  {hasActiveFilters ? (
                    <Link
                      href="/#unterkuenfte"
                      className="
                        inline-flex
                        min-h-11
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        border
                        border-slate-200
                        bg-white
                        px-4
                        py-2.5
                        text-sm
                        font-bold
                        text-slate-700
                        shadow-sm
                        transition
                        hover:border-sky-300
                        hover:text-sky-700
                      "
                    >
                      Filter zurücksetzen
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>


            {/* ========================================================
                RESULTS + PLANNING RAILS
            ======================================================== */}

            <HomePlanningRails>
              <main
                className="min-w-0"
                aria-labelledby="properties-heading"
              >
                {/* kleine Ergebnisleiste */}

                <div
                  className="
                    mb-5
                    flex
                    flex-col
                    gap-3
                    rounded-[1.5rem]
                    border
                    border-white
                    bg-white/90
                    p-4
                    shadow-[0_16px_45px_rgba(15,23,42,0.06)]
                    backdrop-blur-sm
                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                  "
                >
                  <div>
                    <p
                      className="
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-[0.18em]
                        text-sky-700
                      "
                    >
                      Suchergebnisse
                    </p>

                    <p
                      className="
                        mt-1
                        text-sm
                        font-semibold
                        text-slate-800
                      "
                      aria-live="polite"
                    >
                      {resultsCount} Objekt
                      {resultsCount === 1
                        ? ""
                        : "e"}

                      {hasActiveFilters
                        ? " entsprechen deiner Auswahl."
                        : " stehen aktuell zur Auswahl."}
                    </p>
                  </div>


                  <a
                    href="#suche"
                    className="
                      inline-flex
                      shrink-0
                      items-center
                      text-xs
                      font-semibold
                      text-sky-700
                      transition
                      hover:text-sky-900
                    "
                  >
                    Suche anpassen
                  </a>
                </div>


                {/* keine Ergebnisse */}

                {resultsCount ===
                0 ? (
                  <div
                    className="
                      rounded-[1.75rem]
                      border
                      border-dashed
                      border-slate-300
                      bg-white
                      px-5
                      py-10
                      text-center
                      shadow-sm
                    "
                  >
                    <h3
                      className="
                        text-lg
                        font-bold
                        text-slate-950
                      "
                    >
                      Keine passende
                      Unterkunft gefunden
                    </h3>

                    <p
                      className="
                        mx-auto
                        mt-2
                        max-w-xl
                        text-sm
                        leading-6
                        text-slate-600
                      "
                    >
                      Ändere den
                      Reisezeitraum, den Ort,
                      die Personenzahl oder
                      einzelne
                      Ausstattungsmerkmale.
                    </p>

                    <a
                      href="#suche"
                      className="
                        mt-5
                        inline-flex
                        min-h-11
                        items-center
                        justify-center
                        rounded-full
                        bg-sky-600
                        px-5
                        py-3
                        text-sm
                        font-bold
                        text-white
                        transition
                        hover:bg-sky-700
                      "
                    >
                      Suche anpassen
                    </a>
                  </div>
                ) : (
                  <PropertyGridClient
                    items={
                      properties
                    }
                    lastMinuteDiscounts={
                      lastMinuteDiscounts
                    }
                    controls={
                      true
                    }
                    initialKuschelwochen={
                      kuschelwochen
                    }
                    desktopColumns={
                      2
                    }
                  />
                )}
              </main>
            </HomePlanningRails>
          </div>
        </div>
      </section>


      {/* ================================================================
          LAST MINUTE

          Erst NACH Suche und Suchergebnissen.
      ================================================================ */}

      <section
        aria-label="Last-Minute-Angebote"
        className="
          border-t
          border-slate-100
          bg-white
        "
      >
        <div
          className="
            mx-auto
            max-w-6xl
            px-4
            py-10
            md:py-14
          "
        >
          <LazyLastMinuteTeaser />
        </div>
      </section>


      {/* ================================================================
          ÜBER URLAUB GOSCH
          SEO + GEO + LLM

          Bewusst NACH den Ferienobjekten.
      ================================================================ */}

      <section
        aria-labelledby="about-home-heading"
        className="
          border-t
          border-slate-100
          bg-[#f7fafc]
        "
      >
        <div
          className="
            mx-auto
            max-w-6xl
            px-4
            py-14
            sm:px-5
            md:py-20
          "
        >
          <div
            className="
              grid
              gap-8
              lg:grid-cols-[1.1fr_0.9fr]
              lg:items-center
              lg:gap-14
            "
          >
            {/* TEXT */}

            <div>
              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-[#ead7b4]
                  bg-[#fffaf1]
                  px-3
                  py-1.5
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.16em]
                  text-[#9a6b25]
                "
              >
                <Waves
                  aria-hidden="true"
                  className="h-3.5 w-3.5"
                />

                Seit 2004 an der Ostsee
              </div>


              <h2
                id="about-home-heading"
                className="
                  mt-4
                  max-w-3xl
                  text-2xl
                  font-bold
                  tracking-tight
                  text-slate-950
                  sm:text-3xl
                  md:text-4xl
                "
              >
                Urlaub Gosch –
                Ferienvermietung und
                persönliche
                Gästebetreuung an der
                Ostsee
              </h2>


              <p
                className="
                  mt-4
                  max-w-3xl
                  text-sm
                  leading-7
                  text-slate-600
                  md:text-base
                  md:leading-8
                "
              >
                Urlaub Gosch ist seit
                2004 auf
                Ferienwohnungen und
                Ferienhäuser an der
                Ostsee spezialisiert.
                Wir betreuen mehr als
                120
                Ferienunterkünfte und
                verbinden komfortable
                digitale
                Buchungsprozesse mit
                persönlicher
                Erreichbarkeit und
                zuverlässigen Abläufen
                vor Ort.
              </p>


              <p
                className="
                  mt-3
                  max-w-3xl
                  text-sm
                  leading-7
                  text-slate-600
                "
              >
                Für Gäste begleiten
                wir Buchung, Anreise
                und Aufenthalt.
                Eigentümer
                unterstützen wir unter
                anderem bei
                Buchungsmanagement,
                Gästekommunikation,
                Reinigung,
                Wäscheservice,
                Objektkontrolle und
                Hausmeisterservice.
              </p>


              <div
                className="
                  mt-6
                  flex
                  flex-wrap
                  items-center
                  gap-3
                "
              >
                <Link
                  href="/about"
                  className="
                    group
                    inline-flex
                    min-h-11
                    items-center
                    gap-2
                    rounded-full
                    bg-[#07131f]
                    px-5
                    py-2.5
                    text-sm
                    font-bold
                    text-white
                    transition
                    hover:bg-slate-800
                  "
                >
                  Mehr über Urlaub
                  Gosch

                  <ArrowRight
                    aria-hidden="true"
                    className="
                      h-4
                      w-4
                      transition
                      group-hover:translate-x-0.5
                    "
                  />
                </Link>


                <Link
                  href="/contact"
                  className="
                    inline-flex
                    min-h-11
                    items-center
                    rounded-full
                    border
                    border-slate-200
                    bg-white
                    px-5
                    py-2.5
                    text-sm
                    font-bold
                    text-slate-700
                    transition
                    hover:border-slate-300
                    hover:text-slate-950
                  "
                >
                  Kontakt
                </Link>
              </div>
            </div>


            {/* TRUST CARDS */}

            <div
              className="
                grid
                gap-3
                sm:grid-cols-3
                lg:grid-cols-1
              "
            >
              <article
                className="
                  flex
                  items-start
                  gap-4
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  p-4
                  shadow-sm
                "
              >
                <span
                  className="
                    grid
                    h-10
                    w-10
                    shrink-0
                    place-items-center
                    rounded-full
                    bg-[#fff4df]
                    text-[#9a6b25]
                  "
                >
                  <ShieldCheck
                    aria-hidden="true"
                    className="h-5 w-5"
                  />
                </span>

                <div>
                  <p
                    className="
                      font-bold
                      text-slate-950
                    "
                  >
                    Seit 2004
                  </p>

                  <p
                    className="
                      mt-0.5
                      text-xs
                      leading-5
                      text-slate-500
                    "
                  >
                    Mehr als zwei
                    Jahrzehnte Erfahrung
                    in der
                    Ferienvermietung.
                  </p>
                </div>
              </article>


              <article
                className="
                  flex
                  items-start
                  gap-4
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  p-4
                  shadow-sm
                "
              >
                <span
                  className="
                    grid
                    h-10
                    w-10
                    shrink-0
                    place-items-center
                    rounded-full
                    bg-[#fff4df]
                    text-[#9a6b25]
                  "
                >
                  <Building2
                    aria-hidden="true"
                    className="h-5 w-5"
                  />
                </span>

                <div>
                  <p
                    className="
                      font-bold
                      text-slate-950
                    "
                  >
                    120+ Unterkünfte
                  </p>

                  <p
                    className="
                      mt-0.5
                      text-xs
                      leading-5
                      text-slate-500
                    "
                  >
                    Ferienwohnungen und
                    Ferienhäuser in
                    attraktiven
                    Ostseeregionen.
                  </p>
                </div>
              </article>


              <article
                className="
                  flex
                  items-start
                  gap-4
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  p-4
                  shadow-sm
                "
              >
                <span
                  className="
                    grid
                    h-10
                    w-10
                    shrink-0
                    place-items-center
                    rounded-full
                    bg-[#fff4df]
                    text-[#9a6b25]
                  "
                >
                  <HeartHandshake
                    aria-hidden="true"
                    className="h-5 w-5"
                  />
                </span>

                <div>
                  <p
                    className="
                      font-bold
                      text-slate-950
                    "
                  >
                    Persönlich betreut
                  </p>

                  <p
                    className="
                      mt-0.5
                      text-xs
                      leading-5
                      text-slate-500
                    "
                  >
                    Persönlicher
                    Ansprechpartner für
                    Gäste und
                    Eigentümer.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>


      {/* ================================================================
          SERVICE
      ================================================================ */}

      <section
        aria-labelledby="service-home-heading"
        className="
          border-t
          border-slate-100
          bg-white
        "
      >
        <div
          className="
            mx-auto
            max-w-6xl
            px-4
            py-14
            sm:px-5
            md:py-18
          "
        >
          <div
            className="
              flex
              flex-col
              gap-7
              lg:flex-row
              lg:items-end
              lg:justify-between
            "
          >
            <div className="max-w-3xl">
              <p
                className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.18em]
                  text-[#9a6b25]
                "
              >
                Persönlicher Service
              </p>

              <h2
                id="service-home-heading"
                className="
                  mt-3
                  text-2xl
                  font-bold
                  tracking-tight
                  text-slate-950
                  md:text-3xl
                "
              >
                Von der Suche bis zur
                Anreise gut begleitet
              </h2>

              <p
                className="
                  mt-3
                  max-w-2xl
                  text-sm
                  leading-7
                  text-slate-600
                  md:text-base
                "
              >
                Urlaub Gosch verbindet
                digitale Buchungswege
                mit persönlicher
                Betreuung rund um
                Unterkunft, Buchung,
                Anreise und
                Aufenthalt.
              </p>
            </div>


            <Link
              href="/about"
              className="
                group
                inline-flex
                min-h-11
                shrink-0
                items-center
                gap-2
                text-sm
                font-bold
                text-slate-950
              "
            >
              Leistungen kennenlernen

              <ArrowRight
                aria-hidden="true"
                className="
                  h-4
                  w-4
                  transition
                  group-hover:translate-x-0.5
                "
              />
            </Link>
          </div>


          <div
            className="
              mt-7
              grid
              gap-3
              sm:grid-cols-3
            "
          >
            <article
              className="
                rounded-2xl
                border
                border-slate-200
                bg-[#f8fafc]
                p-5
              "
            >
              <CalendarCheck2
                aria-hidden="true"
                className="
                  h-5
                  w-5
                  text-sky-700
                "
              />

              <h3
                className="
                  mt-4
                  font-bold
                  text-slate-950
                "
              >
                Buchung & Anreise
              </h3>

              <p
                className="
                  mt-2
                  text-sm
                  leading-6
                  text-slate-500
                "
              >
                Klare Informationen
                und flexible Anreise
                über das
                Schlüsseltresor-System.
              </p>
            </article>


            <article
              className="
                rounded-2xl
                border
                border-slate-200
                bg-[#f8fafc]
                p-5
              "
            >
              <HeartHandshake
                aria-hidden="true"
                className="
                  h-5
                  w-5
                  text-sky-700
                "
              />

              <h3
                className="
                  mt-4
                  font-bold
                  text-slate-950
                "
              >
                Persönlicher Kontakt
              </h3>

              <p
                className="
                  mt-2
                  text-sm
                  leading-6
                  text-slate-500
                "
              >
                Ansprechpartner vor
                und während des
                Aufenthalts für Fragen
                rund um den Urlaub.
              </p>
            </article>


            <article
              className="
                rounded-2xl
                border
                border-slate-200
                bg-[#f8fafc]
                p-5
              "
            >
              <ShieldCheck
                aria-hidden="true"
                className="
                  h-5
                  w-5
                  text-sky-700
                "
              />

              <h3
                className="
                  mt-4
                  font-bold
                  text-slate-950
                "
              >
                Verlässliche Betreuung
              </h3>

              <p
                className="
                  mt-2
                  text-sm
                  leading-6
                  text-slate-500
                "
              >
                Sorgfältig
                vorbereitete
                Unterkünfte und
                koordinierte Abläufe
                rund um Reinigung und
                Objektbetreuung.
              </p>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}