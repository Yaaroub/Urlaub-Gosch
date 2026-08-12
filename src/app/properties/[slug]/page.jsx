// src/app/properties/[slug]/page.jsx

import { cache } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  CalendarDays,
  ChevronLeft,
  Dog,
  Euro,
  Images as ImagesIcon,
  MapPin,
  Users,
} from "lucide-react";

import prisma from "@/lib/db";

import AmenitiesList from "@/components/AmenitiesList";
import BookingBox from "@/components/BookingBox";
import BookingCalendar from "@/components/BookingCalendar";
import Gallery from "@/components/Gallery";
import GoogleMapEmbed from "@/components/GoogleMapEmbed";
import StickyBookingSidebar from "@/components/StickyBookingSidebar";
import PropertyPricePeriods from "@/components/PropertyPricePeriods";

// Die Seite wird statisch ausgeliefert
// und spätestens alle 5 Minuten aktualisiert.
export const revalidate = 300;
export const dynamicParams = true;

/* ============================================================================
   FORMATTER
============================================================================ */

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Europe/Berlin",
});

const currencyFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

const compactCurrencyFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/* ============================================================================
   LAST-MINUTE
============================================================================ */

function getLastMinuteType(offer) {
  return offer?.discountType === "FIXED"
    ? "FIXED"
    : "PERCENT";
}

function getLastMinuteSaving(offer, basePrice) {
  if (!offer) {
    return 0;
  }

  const base = Math.max(
    0,
    Number(basePrice) || 0,
  );

  /*
   * FESTER BETRAG
   *
   * Beispiel:
   * Normalpreis = 150 €
   * Rabatt      = 25 €
   * Ersparnis   = 25 €
   */
  if (
    getLastMinuteType(offer) ===
    "FIXED"
  ) {
    const amount = Math.max(
      0,
      Number(
        offer.discountAmount,
      ) || 0,
    );

    /*
     * Rabatt darf den Preis
     * nicht unter 0 € drücken.
     */
    return base > 0
      ? Math.min(
          base,
          amount,
        )
      : amount;
  }

  /*
   * PROZENT
   *
   * Beispiel:
   * Normalpreis = 150 €
   * Rabatt      = 20 %
   * Ersparnis   = 30 €
   */
  const percent = Math.min(
    100,
    Math.max(
      0,
      Number(
        offer.discount,
      ) || 0,
    ),
  );

  return base > 0
    ? base *
        (percent / 100)
    : percent;
}

/*
 * Falls mehrere Last-Minute-Angebote
 * gleichzeitig laufen, wird für die
 * öffentliche Anzeige das Angebot mit
 * der größten Ersparnis genommen.
 *
 * Die eigentliche exakte Preisberechnung
 * je Nacht passiert weiterhin in /api/price.
 */
function getBestLastMinuteOffer(
  offers,
  basePrice,
) {
  if (
    !Array.isArray(offers) ||
    offers.length === 0
  ) {
    return null;
  }

  return offers.reduce(
    (best, offer) => {
      if (!best) {
        return offer;
      }

      const currentSaving =
        getLastMinuteSaving(
          offer,
          basePrice,
        );

      const bestSaving =
        getLastMinuteSaving(
          best,
          basePrice,
        );

      return currentSaving >
        bestSaving
        ? offer
        : best;
    },
    null,
  );
}

/*
 * Bevorzugt ein aktuell laufendes Angebot.
 *
 * Falls momentan keines läuft,
 * wird das nächste zukünftige Angebot
 * angezeigt.
 */
function getDisplayedLastMinuteOffer(
  offers,
  basePrice,
) {
  if (
    !Array.isArray(offers) ||
    offers.length === 0
  ) {
    return null;
  }

  const now = new Date();

  const runningOffers =
    offers.filter(
      (offer) =>
        new Date(
          offer.startDate,
        ) <= now &&
        new Date(
          offer.endDate,
        ) > now,
    );

  if (
    runningOffers.length >
    0
  ) {
    return getBestLastMinuteOffer(
      runningOffers,
      basePrice,
    );
  }

  /*
   * Angebote kommen bereits
   * nach Startdatum sortiert.
   */
  return offers[0];
}

/*
 * Kurze Darstellung fürs Badge.
 *
 * Prozent:
 * −20%
 *
 * Fest:
 * −25 €
 */
function getLastMinuteValueLabel(
  offer,
) {
  if (!offer) {
    return "";
  }

  if (
    getLastMinuteType(offer) ===
    "FIXED"
  ) {
    return `−${compactCurrencyFormatter.format(
      Number(
        offer.discountAmount,
      ) || 0,
    )}`;
  }

  return `−${
    Number(
      offer.discount,
    ) || 0
  }%`;
}

/*
 * Ausführliche Darstellung.
 *
 * Prozent:
 * 20% Rabatt
 *
 * Fest:
 * 25 € Rabatt pro Nacht
 */
function getLastMinuteDescription(
  offer,
) {
  if (!offer) {
    return "";
  }

  if (
    getLastMinuteType(offer) ===
    "FIXED"
  ) {
    return `${compactCurrencyFormatter.format(
      Number(
        offer.discountAmount,
      ) || 0,
    )} Rabatt pro Nacht`;
  }

  return `${
    Number(
      offer.discount,
    ) || 0
  }% Rabatt`;
}

/* ============================================================================
   TEXT / SEO
============================================================================ */

function cleanText(
  value = "",
) {
  return value
    .replace(
      /\s+/g,
      " ",
    )
    .trim();
}

function createMetaDescription(
  property,
) {
  const fallback =
    `${property.title} in ${property.location}: ` +
    `Ferienunterkunft für bis zu ${property.maxPersons} Personen. ` +
    `Ausstattung, Preise, Verfügbarkeit und Buchungsanfrage ansehen.`;

  const source =
    cleanText(
      property.description,
    ) || fallback;

  return source.length > 157
    ? `${source
        .slice(0, 157)
        .trimEnd()}…`
    : source;
}

function getSiteUrl() {
  return (
    process.env
      .NEXT_PUBLIC_SITE_URL ||
    ""
  ).replace(
    /\/+$/,
    "",
  );
}

function toAbsoluteUrl(
  value,
) {
  if (!value) {
    return undefined;
  }

  if (
    /^https?:\/\//i.test(
      value,
    )
  ) {
    return value;
  }

  const siteUrl =
    getSiteUrl();

  if (!siteUrl) {
    return undefined;
  }

  return `${siteUrl}${
    value.startsWith("/")
      ? ""
      : "/"
  }${value}`;
}

/* ============================================================================
   PROPERTY LADEN
============================================================================ */

/*
 * React cache verhindert eine doppelte
 * Prisma-Abfrage zwischen Metadata
 * und Seite.
 */
const getProperty = cache(
  async (slug) => {
    const today =
      new Date();

    return prisma.property.findUnique(
      {
        where: {
          slug,
        },

        include: {
          amenities: true,

          images: {
            orderBy: {
              sort: "asc",
            },
          },

          pricePeriods: {
            where: {
              endDate: {
                gt: today,
              },
            },

            orderBy: {
              startDate:
                "asc",
            },
          },

          extras: true,

          /*
           * Prozent UND feste Beträge
           * werden vollständig geladen.
           */
          lastMinuteOffers: {
            where: {
              endDate: {
                gt: today,
              },
            },

            /*
             * Nicht mehr nach discount sortieren,
             * weil FIXED in discount = 0 hat.
             */
            orderBy: [
              {
                startDate:
                  "asc",
              },
              {
                id: "asc",
              },
            ],
          },
        },
      },
    );
  },
);

/* ============================================================================
   STATIC PARAMS
============================================================================ */

export async function generateStaticParams() {
  const properties =
    await prisma.property.findMany(
      {
        select: {
          slug: true,
        },
      },
    );

  return properties.map(
    ({ slug }) => ({
      slug,
    }),
  );
}

/* ============================================================================
   METADATA
============================================================================ */

export async function generateMetadata({
  params,
}) {
  const { slug } =
    await params;

  const property =
    await getProperty(
      slug,
    );

  if (!property) {
    return {
      title:
        "Unterkunft nicht gefunden | Urlaub-GOSCH",

      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title =
    `${property.title} in ${property.location} | Urlaub-GOSCH`;

  const description =
    createMetaDescription(
      property,
    );

  const canonicalPath =
    `/properties/${encodeURIComponent(
      property.slug,
    )}`;

  const canonicalUrl =
    toAbsoluteUrl(
      canonicalPath,
    ) || canonicalPath;

  const mainImage =
    property.images[0]
      ?.url;

  const images =
    mainImage
      ? [
          {
            url: mainImage,
            width: 1200,
            height: 630,

            alt:
              property
                .images[0]
                ?.alt ||
              property.title,
          },
        ]
      : [];

  return {
    title,
    description,

    alternates: {
      canonical:
        canonicalUrl,
    },

    robots: {
      index: true,
      follow: true,

      googleBot: {
        index: true,
        follow: true,

        "max-image-preview":
          "large",

        "max-snippet":
          -1,

        "max-video-preview":
          -1,
      },
    },

    openGraph: {
      title,
      description,
      url: canonicalUrl,

      siteName:
        "Urlaub-GOSCH",

      locale:
        "de_DE",

      type:
        "website",

      images,
    },

    twitter: {
      card:
        "summary_large_image",

      title,
      description,

      images:
        mainImage
          ? [mainImage]
          : [],
    },
  };
}

/* ============================================================================
   PAGE
============================================================================ */

export default async function PropertyPage({
  params,
}) {
  const { slug } =
    await params;

  const property =
    await getProperty(
      slug,
    );

  if (!property) {
    notFound();
  }

  /* --------------------------------------------------------------------------
     PREISZEITEN
  -------------------------------------------------------------------------- */

  const publicPricePeriods =
    property.pricePeriods.map(
      (period) => ({
        id: period.id,

        startDate:
          period.startDate.toISOString(),

        endDate:
          period.endDate.toISOString(),

        pricePerNight:
          Number(
            period.pricePerNight,
          ),
      }),
    );

  const minNightlyPrice =
    publicPricePeriods.length >
    0
      ? Math.min(
          ...publicPricePeriods.map(
            (period) =>
              period.pricePerNight,
          ),
        )
      : null;

  /* --------------------------------------------------------------------------
     LAST MINUTE
  -------------------------------------------------------------------------- */

  const activeLm =
    getDisplayedLastMinuteOffer(
      property.lastMinuteOffers,
      minNightlyPrice,
    );

  /* --------------------------------------------------------------------------
     NEBENKOSTEN
  -------------------------------------------------------------------------- */

  const fees =
    property.extras.map(
      (extra) => ({
        id: extra.id,

        name:
          extra.title,

        isDaily:
          extra.isDaily,

        price:
          Number(
            extra.amount,
          ) / 100,
      }),
    );

  /* --------------------------------------------------------------------------
     SEO / JSON-LD
  -------------------------------------------------------------------------- */

  const canonicalPath =
    `/properties/${encodeURIComponent(
      property.slug,
    )}`;

  const canonicalUrl =
    toAbsoluteUrl(
      canonicalPath,
    );

  const description =
    createMetaDescription(
      property,
    );

  const imageUrls =
    property.images
      .map(
        (image) =>
          toAbsoluteUrl(
            image.url,
          ) ||
          image.url,
      )
      .filter(Boolean);

  const vacationRentalJsonLd =
    {
      "@context":
        "https://schema.org",

      "@type":
        "VacationRental",

      name:
        property.title,

      description,

      identifier:
        String(
          property.id,
        ),

      ...(canonicalUrl
        ? {
            url:
              canonicalUrl,
          }
        : {}),

      ...(imageUrls.length >
      0
        ? {
            image:
              imageUrls,
          }
        : {}),

      address: {
        "@type":
          "PostalAddress",

        ...(property.address
          ? {
              streetAddress:
                property.address,
            }
          : {}),

        addressLocality:
          property.location,

        addressCountry:
          "DE",
      },

      occupancy: {
        "@type":
          "QuantitativeValue",

        maxValue:
          property.maxPersons,
      },

      petsAllowed:
        Boolean(
          property.dogsAllowed,
        ),

      ...(minNightlyPrice !==
      null
        ? {
            offers: {
              "@type":
                "AggregateOffer",

              priceCurrency:
                "EUR",

              lowPrice:
                minNightlyPrice.toFixed(
                  2,
                ),

              availability:
                "https://schema.org/InStock",
            },
          }
        : {}),
    };

  const breadcrumbJsonLd =
    {
      "@context":
        "https://schema.org",

      "@type":
        "BreadcrumbList",

      itemListElement: [
        {
          "@type":
            "ListItem",

          position: 1,

          name:
            "Startseite",

          ...(getSiteUrl()
            ? {
                item:
                  getSiteUrl(),
              }
            : {}),
        },

        {
          "@type":
            "ListItem",

          position: 2,

          name:
            property.title,

          ...(canonicalUrl
            ? {
                item:
                  canonicalUrl,
              }
            : {}),
        },
      ],
    };

  const jsonLd =
    JSON.stringify([
      vacationRentalJsonLd,
      breadcrumbJsonLd,
    ]).replace(
      /</g,
      "\\u003c",
    );

  /* ==========================================================================
     RENDER
  ========================================================================== */

  return (
    <main className="mx-auto max-w-7xl pb-16 pt-24 md:pb-24 md:pt-28">
      {/* STRUCTURED DATA */}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            jsonLd,
        }}
      />

      {/* BREADCRUMB */}

      <nav
        aria-label="Breadcrumb"
        className="px-4 pt-6"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full px-1 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2"
        >
          <ChevronLeft
            aria-hidden="true"
            className="h-4 w-4"
          />

          Zurück zur Suche
        </Link>
      </nav>

      {/* ======================================================================
          HERO
      ====================================================================== */}

      <section
        aria-labelledby="property-title"
        className="relative mx-4 mt-3 overflow-hidden rounded-3xl bg-slate-900 shadow-xl ring-1 ring-black/10"
      >
        <div className="relative h-80 md:h-[440px]">
          {property.images[0]
            ?.url ? (
            <Image
              src={
                property
                  .images[0]
                  .url
              }
              alt={
                property
                  .images[0]
                  .alt ||
                property.title
              }
              fill
              sizes="(max-width: 1280px) calc(100vw - 32px), 1248px"
              quality={78}
              priority
              fetchPriority="high"
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-sky-100 to-slate-300" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-slate-950/5" />

          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-5 p-6 text-white md:flex-row md:items-end md:justify-between md:p-10">
            <div className="max-w-3xl">
              <p className="mb-2 text-sm font-medium text-white/80">
                Ferienunterkunft
                in{" "}
                {
                  property.location
                }
              </p>

              <h1
                id="property-title"
                className="text-3xl font-semibold leading-tight tracking-tight drop-shadow-sm md:text-5xl"
              >
                {
                  property.title
                }
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                {/* STRASSE + ORT */}

                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-md ring-1 ring-white/15">
                  <MapPin
                    aria-hidden="true"
                    className="h-4 w-4"
                  />

                  {[
                    property.address,
                    property.location,
                  ]
                    .filter(
                      Boolean,
                    )
                    .join(
                      ", ",
                    )}
                </span>

                {/* PERSONEN */}

                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-md ring-1 ring-white/15">
                  <Users
                    aria-hidden="true"
                    className="h-4 w-4"
                  />

                  Bis{" "}
                  {
                    property.maxPersons
                  }{" "}
                  Personen
                </span>

                {/* HUNDE */}

                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-md ring-1 ring-white/15">
                  <Dog
                    aria-hidden="true"
                    className="h-4 w-4"
                  />

                  Hunde{" "}
                  {property.dogsAllowed
                    ? "erlaubt"
                    : "nicht erlaubt"}
                </span>

                {/* LAST MINUTE */}

                {activeLm && (
                  <span className="inline-flex items-center rounded-full bg-rose-600 px-3 py-1.5 text-xs font-bold shadow-lg">
                    {getLastMinuteValueLabel(
                      activeLm,
                    )}{" "}
                    Last-Minute
                  </span>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <a
                href="#galerie"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              >
                <ImagesIcon
                  aria-hidden="true"
                  className="h-4 w-4"
                />

                Alle Fotos
              </a>

              {minNightlyPrice !==
                null && (
                <div className="rounded-xl bg-slate-950/70 px-4 py-2.5 text-right backdrop-blur-md ring-1 ring-white/15">
                  <span className="block text-xs text-white/70">
                    ab
                  </span>

                  <strong className="text-xl">
                    {currencyFormatter.format(
                      minNightlyPrice,
                    )}
                  </strong>

                  <span className="ml-1 text-xs text-white/70">
                    / Nacht
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================================
          ÜBERSICHT
      ====================================================================== */}

      <section
        aria-labelledby="overview-title"
        className="mx-4 mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 md:p-7"
      >
        <h2
          id="overview-title"
          className="text-xl font-semibold text-slate-950"
        >
          Das Wichtigste auf
          einen Blick
        </h2>

        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
          {property.title} ist
          eine Ferienunterkunft
          in{" "}
          {
            property.location
          }{" "}
          für bis zu{" "}
          {
            property.maxPersons
          }{" "}
          Personen. Hier finden
          Sie Ausstattung,
          Preise,
          Verfügbarkeit, Lage
          und die direkte
          Buchungsanfrage an
          einem Ort.
        </p>

        <dl className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Kapazität
            </dt>

            <dd className="mt-1 font-semibold text-slate-900">
              Bis{" "}
              {
                property.maxPersons
              }{" "}
              Personen
            </dd>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Haustiere
            </dt>

            <dd className="mt-1 font-semibold text-slate-900">
              Hunde{" "}
              {property.dogsAllowed
                ? "erlaubt"
                : "nicht erlaubt"}
            </dd>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Ausstattung
            </dt>

            <dd className="mt-1 font-semibold text-slate-900">
              {
                property
                  .amenities
                  .length
              }{" "}
              Merkmale
            </dd>
          </div>
        </dl>
      </section>

      {/* ======================================================================
          GALERIE
      ====================================================================== */}

      <section
        id="galerie"
        aria-labelledby="gallery-title"
        className="scroll-mt-28 px-4 pt-8"
      >
        <h2
          id="gallery-title"
          className="sr-only"
        >
          Bildergalerie von{" "}
          {
            property.title
          }
        </h2>

        <Gallery
          images={
            property.images
          }
        />
      </section>

      {/* ======================================================================
          CONTENT + STICKY BOOKING
      ====================================================================== */}

      <div className="grid gap-8 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-stretch">
        <div className="space-y-6">
          {/* BESCHREIBUNG */}

          {property.description && (
            <section
              aria-labelledby="description-title"
              className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 md:p-7"
            >
              <h2
                id="description-title"
                className="text-xl font-semibold text-slate-950"
              >
                Über diese
                Unterkunft
              </h2>

              <p className="mt-4 whitespace-pre-line text-[15px] leading-7 text-slate-700">
                {
                  property.description
                }
              </p>
            </section>
          )}

          {/* AUSSTATTUNG */}

          <section
            aria-labelledby="amenities-title"
            className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 md:p-7"
          >
            <h2
              id="amenities-title"
              className="mb-4 text-xl font-semibold text-slate-950"
            >
              Ausstattung
            </h2>

            <AmenitiesList
              amenities={
                property.amenities
              }
            />
          </section>

          {/* PREISE */}

          <section
            aria-labelledby="prices-title"
            className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 md:p-7"
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2
                id="prices-title"
                className="text-xl font-semibold text-slate-950"
              >
                Preise pro Nacht
              </h2>

              <CalendarDays
                aria-hidden="true"
                className="h-5 w-5 text-slate-500"
              />
            </div>

            <PropertyPricePeriods
              pricePeriods={
                publicPricePeriods
              }
            />
          </section>

          {/* NEBENKOSTEN */}

          <section
            aria-labelledby="fees-title"
            className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 md:p-7"
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2
                id="fees-title"
                className="text-xl font-semibold text-slate-950"
              >
                Nebenkosten
              </h2>

              <Euro
                aria-hidden="true"
                className="h-5 w-5 text-slate-500"
              />
            </div>

            {fees.length === 0 ? (
              <p className="text-sm text-slate-600">
                Keine zusätzlichen
                Nebenkosten
                hinterlegt.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 text-sm">
                {fees.map(
                  (fee) => (
                    <li
                      key={
                        fee.id
                      }
                      className="flex items-start justify-between gap-5 py-3"
                    >
                      <span className="text-slate-700">
                        {
                          fee.name
                        }

                        <span className="ml-1 text-slate-500">
                          {fee.isDaily
                            ? "(pro Nacht)"
                            : "(einmalig)"}
                        </span>
                      </span>

                      <strong className="whitespace-nowrap text-slate-950">
                        {currencyFormatter.format(
                          fee.price,
                        )}
                      </strong>
                    </li>
                  ),
                )}
              </ul>
            )}

            <p className="mt-3 text-xs leading-5 text-slate-500">
              Alle Preise
              inklusive
              gesetzlicher
              Mehrwertsteuer.
              Änderungen bleiben
              vorbehalten.
            </p>
          </section>

          {/* LAGE */}

          <section
            aria-labelledby="location-title"
            className="overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 md:p-7"
          >
            <div className="mb-4">
              <h2
                id="location-title"
                className="text-xl font-semibold text-slate-950"
              >
                Lage in{" "}
                {
                  property.location
                }
              </h2>

              {property.address ? (
                <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <MapPin className="h-4 w-4 shrink-0 text-sky-600" />

                  {
                    property.address
                  }
                  ,{" "}
                  {
                    property.location
                  }
                </p>
              ) : (
                <p className="mt-1 text-sm text-slate-600">
                  Die Karte zeigt
                  die hinterlegte
                  Lage der
                  Unterkunft.
                </p>
              )}
            </div>

            <GoogleMapEmbed
              query={
                [
                  property.address,
                  property.location,
                ]
                  .filter(
                    Boolean,
                  )
                  .join(
                    ", ",
                  ) ||
                property.location
              }
              title={`Lage von ${property.title} auf Google Maps`}
              height={360}
            />
          </section>
        </div>

        {/* ====================================================================
            STICKY SIDEBAR
        ==================================================================== */}

        <StickyBookingSidebar
          topOffset={112}
          before={
            <section
              aria-labelledby="availability-title"
              className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-black/5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2
                    id="availability-title"
                    className="text-xl font-semibold text-slate-950"
                  >
                    Verfügbarkeit
                  </h2>

                  {minNightlyPrice !==
                    null && (
                    <p className="mt-1 text-sm text-slate-600">
                      Ab{" "}

                      <strong className="text-slate-950">
                        {currencyFormatter.format(
                          minNightlyPrice,
                        )}
                      </strong>{" "}

                      pro Nacht
                    </p>
                  )}
                </div>

                {/* LM BADGE */}

                {activeLm && (
                  <span className="shrink-0 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 ring-1 ring-rose-100">
                    {getLastMinuteValueLabel(
                      activeLm,
                    )}
                  </span>
                )}
              </div>

              {/* LM BESCHREIBUNG */}

              {activeLm && (
                <p className="mt-3 rounded-xl bg-rose-50 p-3 text-xs leading-5 text-rose-800 ring-1 ring-rose-100">
                  Last-Minute-Angebot:{" "}

                  <strong>
                    {getLastMinuteDescription(
                      activeLm,
                    )}
                  </strong>{" "}

                  vom{" "}

                  {dateFormatter.format(
                    new Date(
                      activeLm.startDate,
                    ),
                  )}{" "}

                  bis{" "}

                  {dateFormatter.format(
                    new Date(
                      activeLm.endDate,
                    ),
                  )}
                  .
                </p>
              )}

              <div className="mt-5">
                <BookingCalendar
                  propertyId={
                    property.id
                  }
                  compact
                />
              </div>

              <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-start xl:flex-row xl:items-center">
                <p>
                  Belegung inklusive
                  An- und
                  Abreisetag;
                  Enddatum exklusiv.
                </p>

                <a
                  href={`/api/ical/${encodeURIComponent(
                    property.slug,
                  )}`}
                  className="whitespace-nowrap font-medium underline underline-offset-4 transition hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
                >
                  iCal abonnieren
                </a>
              </div>
            </section>
          }
        >
          {/* BUCHUNGSBOX */}

          <section
            aria-labelledby="booking-title"
            className="min-w-0 overflow-hidden rounded-2xl bg-white p-5 shadow-xl ring-1 ring-black/5 sm:p-6"
          >
            <h2
              id="booking-title"
              className="text-xl font-semibold text-slate-950"
            >
              Info oder Buchung
              anfragen
            </h2>

            <p className="mb-4 mt-1 text-sm leading-6 text-slate-600">
              Wählen Sie im
              Formular, ob Sie
              Informationen
              wünschen oder eine
              Buchungsanfrage
              senden möchten.
            </p>

            <div className="min-w-0 max-w-full [&_*]:min-w-0 [&_input]:w-full [&_select]:w-full [&_textarea]:w-full">
              <BookingBox
                propertyId={
                  property.id
                }
              />
            </div>
          </section>
        </StickyBookingSidebar>
      </div>
    </main>
  );
}