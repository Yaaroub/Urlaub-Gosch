import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Dog,
  Flame,
  Info,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import prisma from "@/lib/db";

/**
 * Last-Minute-Angebote ändern sich regelmäßig,
 * müssen aber nicht bei jedem Request neu aus der DB geladen werden.
 *
 * 60 Sekunden ISR:
 * - sehr schnell
 * - SEO-freundlich
 * - neue LM-Angebote erscheinen zeitnah
 */
export const revalidate = 60;

const PAGE_PATH = "/offers";

const PAGE_TITLE =
  "Last Minute Ostsee | Ferienhäuser & Angebote | Urlaub-GOSCH";

const PAGE_DESCRIPTION =
  "Last-Minute-Angebote für Ferienhäuser und Ferienwohnungen an der Ostsee entdecken. Kurzfristig verfügbare Unterkünfte mit aktuellen Rabatten direkt bei Urlaub-GOSCH.";

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "");
}

function toAbsoluteUrl(value) {
  if (!value) return undefined;

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const siteUrl = getSiteUrl();

  if (!siteUrl) {
    return value;
  }

  return `${siteUrl}${value.startsWith("/") ? "" : "/"}${value}`;
}

export const metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,

  alternates: {
    canonical: PAGE_PATH,
  },

  robots: {
    index: true,
    follow: true,

    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: PAGE_PATH,
    siteName: "Urlaub-GOSCH",
    locale: "de_DE",
    type: "website",
  },

  twitter: {
    card: "summary",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatEuro(value) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Berlin",
  }).format(date);
}

function cleanText(value = "") {
  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateText(value, maxLength = 170) {
  const text = cleanText(value);

  if (!text) {
    return "";
  }

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trimEnd()}…`;
}

/**
 * Auf der Kartenübersicht nur den Straßennamen anzeigen.
 *
 * Beispiele:
 * Strandstraße 27       -> Strandstraße
 * Am Deich 12a          -> Am Deich
 * Hauptstraße 12-14     -> Hauptstraße
 * Strandstraße 27, Ort  -> Strandstraße
 */
function getStreetName(address = "") {
  const normalized = String(address).trim();

  if (!normalized) {
    return "";
  }

  const streetPart = normalized.split(",")[0].trim();

  return streetPart
    .replace(
      /\s+\d+(?:\s*[a-zA-Z])?(?:\s*[-–/]\s*\d+(?:\s*[a-zA-Z])?)?\s*$/,
      "",
    )
    .trim();
}

function getDiscountType(offer) {
  return offer?.discountType === "FIXED"
    ? "FIXED"
    : "PERCENT";
}

function isValidOffer(offer) {
  const type = getDiscountType(offer);

  if (type === "FIXED") {
    return Number(offer?.discountAmount) > 0;
  }

  return Number(offer?.discount) > 0;
}

function getDiscountLabel(offer) {
  const type = getDiscountType(offer);

  if (type === "FIXED") {
    return `${formatEuro(offer?.discountAmount)} sparen`;
  }

  return `${Number(offer?.discount) || 0} % sparen`;
}

function getDiscountShortLabel(offer) {
  const type = getDiscountType(offer);

  if (type === "FIXED") {
    return `−${formatEuro(offer?.discountAmount)}`;
  }

  return `−${Number(offer?.discount) || 0}%`;
}

function getOfferStatus(offer, now = new Date()) {
  const start = offer?.startDate
    ? new Date(offer.startDate)
    : null;

  const end = offer?.endDate
    ? new Date(offer.endDate)
    : null;

  if (
    start &&
    !Number.isNaN(start.getTime()) &&
    start > now
  ) {
    return {
      type: "upcoming",
      label: `Ab ${formatDate(start)}`,
    };
  }

  if (
    end &&
    !Number.isNaN(end.getTime()) &&
    end > now
  ) {
    return {
      type: "active",
      label: "Aktuell verfügbar",
    };
  }

  return {
    type: "unknown",
    label: "Last Minute",
  };
}

function getOfferPeriod(offer) {
  const start = formatDate(offer?.startDate);
  const end = formatDate(offer?.endDate);

  if (start && end) {
    return `${start} – ${end}`;
  }

  if (end) {
    return `bis ${end}`;
  }

  return "";
}

/* -------------------------------------------------------------------------- */
/* Daten                                                                      */
/* -------------------------------------------------------------------------- */

async function getLastMinuteOffers() {
  const now = new Date();

  const offers =
    await prisma.lastMinuteOffer.findMany({
      where: {
        endDate: {
          gt: now,
        },
      },

      orderBy: [
        {
          startDate: "asc",
        },
        {
          id: "asc",
        },
      ],

      select: {
        id: true,
        propertyId: true,

        startDate: true,
        endDate: true,

        discountType: true,
        discount: true,
        discountAmount: true,

        note: true,

        property: {
          select: {
            id: true,
            slug: true,
            title: true,

            address: true,
            location: true,

            maxPersons: true,
            dogsAllowed: true,

            description: true,

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
        },
      },
    });

  return offers.filter(
    (offer) =>
      offer.property &&
      isValidOffer(offer),
  );
}

/* -------------------------------------------------------------------------- */
/* JSON-LD                                                                    */
/* -------------------------------------------------------------------------- */

function StructuredData({ offers }) {
  const pageUrl =
    toAbsoluteUrl(PAGE_PATH) || PAGE_PATH;

  const itemListId = `${pageUrl}#angebote`;

  const faqId = `${pageUrl}#faq`;

  const graph = {
    "@context": "https://schema.org",

    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": pageUrl,

        url: pageUrl,

        name:
          "Last-Minute-Angebote an der Ostsee",

        description:
          PAGE_DESCRIPTION,

        inLanguage: "de-DE",

        mainEntity: {
          "@id": itemListId,
        },
      },

      {
        "@type": "BreadcrumbList",

        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Startseite",
            item:
              toAbsoluteUrl("/") || "/",
          },

          {
            "@type": "ListItem",
            position: 2,
            name: "Last Minute",
            item: pageUrl,
          },
        ],
      },

      {
        "@type": "ItemList",
        "@id": itemListId,

        name:
          "Aktuelle Last-Minute-Unterkünfte",

        numberOfItems: offers.length,

        itemListElement: offers.map(
          (offer, index) => {
            const property =
              offer.property || {};

            const href = property.slug
              ? `/properties/${encodeURIComponent(
                  property.slug,
                )}`
              : `/properties/${property.id}`;

            return {
              "@type": "ListItem",

              position: index + 1,

              item: {
                "@type":
                  "VacationRental",

                name:
                  property.title ||
                  "Ferienunterkunft",

                url:
                  toAbsoluteUrl(href) ||
                  href,

                ...(property.location
                  ? {
                      address: {
                        "@type":
                          "PostalAddress",

                        addressLocality:
                          property.location,

                        addressCountry:
                          "DE",
                      },
                    }
                  : {}),

                ...(property.maxPersons
                  ? {
                      occupancy: {
                        "@type":
                          "QuantitativeValue",

                        maxValue:
                          Number(
                            property.maxPersons,
                          ),
                      },
                    }
                  : {}),
              },
            };
          },
        ),
      },

      {
        "@type": "FAQPage",
        "@id": faqId,

        mainEntity: [
          {
            "@type": "Question",

            name:
              "Was ist ein Last-Minute-Angebot bei Urlaub-GOSCH?",

            acceptedAnswer: {
              "@type": "Answer",

              text:
                "Last-Minute-Angebote sind zeitlich begrenzte Angebote für ausgewählte Ferienunterkünfte. Der jeweilige Angebotszeitraum und der Rabatt werden direkt beim Angebot angezeigt.",
            },
          },

          {
            "@type": "Question",

            name:
              "Welche Rabatte gibt es bei den Last-Minute-Angeboten?",

            acceptedAnswer: {
              "@type": "Answer",

              text:
                "Je nach Unterkunft kann der Last-Minute-Rabatt als prozentuale Ermäßigung oder als fester Euro-Betrag angeboten werden.",
            },
          },

          {
            "@type": "Question",

            name:
              "Wie kann ich die Verfügbarkeit einer Last-Minute-Unterkunft prüfen?",

            acceptedAnswer: {
              "@type": "Answer",

              text:
                "Über die Detailseite der jeweiligen Ferienunterkunft können Reisezeitraum und Verfügbarkeit geprüft und anschließend eine Anfrage gestellt werden.",
            },
          },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(
          graph,
        ).replace(/</g, "\\u003c"),
      }}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default async function OffersPage() {
  const offers =
    await getLastMinuteOffers();

  return (
    <>
      <StructuredData offers={offers} />

      <main className="min-h-screen bg-[#f6f8fb] pb-20 pt-28 text-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* HERO */}
          <section
            aria-labelledby="last-minute-heading"
            className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.05)]"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(244,213,157,0.30),transparent_31%),radial-gradient(circle_at_86%_24%,rgba(56,189,248,0.11),transparent_28%)]"
            />

            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full border border-amber-200/40"
            />

            <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end lg:p-10 xl:p-12">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-800">
                  <Flame
                    aria-hidden="true"
                    className="h-3.5 w-3.5"
                  />

                  Last Minute Ostsee
                </div>

                <h1
                  id="last-minute-heading"
                  className="mt-6 max-w-4xl text-[clamp(2.5rem,6vw,5rem)] font-semibold leading-[0.97] tracking-[-0.065em] text-slate-950"
                >
                  Last-Minute Urlaub

                  <span className="block font-serif font-normal italic text-[#c99a43]">
                    an der Ostsee.
                  </span>
                </h1>

                <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                  Entdecken Sie kurzfristig
                  verfügbare Ferienhäuser und
                  Ferienwohnungen an der Ostsee.
                  Ausgewählte Unterkünfte bieten
                  für bestimmte Reisezeiträume
                  einen aktuellen Last-Minute-
                  Rabatt.
                </p>

                <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600">
                  <TrustItem>
                    Aktuelle Angebote
                  </TrustItem>

                  <TrustItem>
                    Transparente Rabatte
                  </TrustItem>

                  <TrustItem>
                    Direkte Verfügbarkeitsprüfung
                  </TrustItem>
                </div>
              </div>

              {/* INFO CARD */}
              <aside className="rounded-[1.65rem] border border-slate-200 bg-white/90 p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)] backdrop-blur sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-slate-950 text-white shadow-sm">
                    <CalendarDays className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-lg font-semibold tracking-[-0.025em] text-slate-950">
                      {offers.length}{" "}
                      Last-Minute-
                      {offers.length === 1
                        ? "Angebot"
                        : "Angebote"}
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Aktuell oder für einen
                      kommenden Reisezeitraum
                      verfügbar.
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                  <div className="flex gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#c99a43]" />

                    <p className="text-sm leading-6 text-slate-600">
                      Der jeweilige Rabatt gilt
                      für den angegebenen
                      Angebotszeitraum. Die
                      konkrete Verfügbarkeit
                      prüfen Sie direkt bei der
                      Unterkunft.
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          </section>

          {/* RESULT HEADER */}
          <section
            aria-labelledby="angebote-heading"
            className="mt-9"
          >
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b78332]">
                  Aktuelle Angebote
                </p>

                <h2
                  id="angebote-heading"
                  className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-3xl"
                >
                  Last-Minute-Unterkünfte
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                  Ferienunterkünfte mit
                  zeitlich begrenzten
                  Preisvorteilen für ausgewählte
                  Reisezeiträume.
                </p>
              </div>

              {offers.length > 0 && (
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
                  <Flame className="h-4 w-4 text-rose-500" />

                  {offers.length}{" "}
                  {offers.length === 1
                    ? "Treffer"
                    : "Treffer"}
                </div>
              )}
            </div>

            {offers.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2 lg:gap-6">
                {offers.map(
                  (offer, index) => (
                    <LastMinuteCard
                      key={offer.id}
                      offer={offer}
                      priority={index === 0}
                    />
                  ),
                )}
              </div>
            ) : (
              <EmptyState />
            )}
          </section>

          {/* INFO / GEO / LLM */}
          <section className="mt-12 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[0.8fr_1.2fr] lg:p-10">
              <div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-[#b78332] ring-1 ring-amber-100">
                  <Sparkles className="h-5 w-5" />
                </div>

                <h2 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                  Spontan an die Ostsee
                </h2>

                <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                  Last-Minute-Angebote eignen
                  sich besonders für Gäste, die
                  ihren Ostseeurlaub kurzfristig
                  planen und beim Reisezeitraum
                  flexibel sind.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <InfoBox
                  title="Zeitraum beachten"
                  text="Jedes Last-Minute-Angebot gilt nur für den jeweils angegebenen Zeitraum."
                />

                <InfoBox
                  title="Rabatt transparent"
                  text="Je nach Angebot wird der Preis prozentual oder um einen festen Euro-Betrag reduziert."
                />

                <InfoBox
                  title="Unterkunft prüfen"
                  text="Auf der Detailseite finden Sie Ausstattung, Lage, Preise und die aktuelle Verfügbarkeit."
                />

                <InfoBox
                  title="Direkt anfragen"
                  text="Passt die Unterkunft zu Ihrem Reisezeitraum, können Sie anschließend direkt eine Anfrage stellen."
                />
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section
            aria-labelledby="faq-heading"
            className="mt-12"
          >
            <div className="mx-auto max-w-4xl">
              <div className="text-center">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b78332]">
                  Häufige Fragen
                </p>

                <h2
                  id="faq-heading"
                  className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-3xl"
                >
                  Last-Minute Urlaub an der
                  Ostsee
                </h2>
              </div>

              <div className="mt-7 space-y-3">
                <FaqItem
                  question="Was ist ein Last-Minute-Angebot bei Urlaub-GOSCH?"
                  answer="Last-Minute-Angebote sind zeitlich begrenzte Angebote für ausgewählte Ferienunterkünfte. Der jeweilige Angebotszeitraum und der Rabatt werden direkt beim Angebot angezeigt."
                />

                <FaqItem
                  question="Welche Rabatte gibt es?"
                  answer="Je nach Unterkunft kann der Last-Minute-Rabatt als prozentuale Ermäßigung oder als fester Euro-Betrag angeboten werden."
                />

                <FaqItem
                  question="Wie prüfe ich die Verfügbarkeit?"
                  answer="Öffnen Sie die gewünschte Unterkunft. Auf der Detailseite können Sie Ihren Reisezeitraum prüfen und anschließend eine Anfrage stellen."
                />
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Last-Minute Card                                                           */
/* -------------------------------------------------------------------------- */

function LastMinuteCard({
  offer,
  priority = false,
}) {
  const property = offer.property || {};

  const title =
    property.title || "Ferienunterkunft";

  const href = property.slug
    ? `/properties/${encodeURIComponent(
        property.slug,
      )}`
    : `/properties/${property.id}`;

  const image =
    property.images?.[0]?.url ||
    "/placeholder.jpg";

  const imageAlt =
    property.images?.[0]?.alt ||
    `${title} – Last-Minute-Unterkunft`;

  const streetName = getStreetName(
    property.address,
  );

  const location = String(
    property.location || "",
  ).trim();

  const description =
    truncateText(property.description) ||
    "Ferienunterkunft an der Ostsee – ideal für einen spontanen Urlaub am Meer.";

  const status =
    getOfferStatus(offer);

  const offerPeriod =
    getOfferPeriod(offer);

  return (
<article className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_5px_22px_rgba(15,23,42,0.035)] transition-[border-color,box-shadow] duration-300 ease-out hover:border-slate-300 hover:shadow-[0_12px_32px_rgba(15,23,42,0.065)]">      <Link
        href={href}
        aria-label={`${title} ansehen`}
        className="relative block aspect-[16/10] overflow-hidden bg-slate-100"
      >
        <DiscountBadge offer={offer} />

        <div className="absolute right-3 top-3 z-10">
          <span
            className={[
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold shadow-sm backdrop-blur",
              status.type === "active"
                ? "bg-emerald-600/95 text-white"
                : "bg-white/95 text-slate-700",
            ].join(" ")}
          >
            <span
              className={[
                "h-1.5 w-1.5 rounded-full",
                status.type === "active"
                  ? "bg-white"
                  : "bg-amber-500",
              ].join(" ")}
            />

            {status.label}
          </span>
        </div>

        <Image
          src={image}
          alt={imageAlt}
          fill
          priority={priority}
          fetchPriority={
            priority
              ? "high"
              : undefined
          }
          sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 620px"
          quality={74}
          className="object-cover transition-[filter] duration-300 ease-out group-hover:brightness-[0.97]"
        />

        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-slate-950/5 to-transparent"
        />
      </Link>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div>
          <Link href={href}>
            <h3 className="line-clamp-2 text-xl font-semibold leading-7 tracking-[-0.035em] text-slate-950 sm:text-[1.35rem]">
              {title}
            </h3>
          </Link>

          {(streetName || location) && (
            <div className="mt-3 flex items-start gap-2 text-sm text-slate-500">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

              <div className="min-w-0">
                {streetName && (
                  <p className="truncate font-medium text-slate-700">
                    {streetName}
                  </p>
                )}

                {location && (
                  <p
                    className={
                      streetName
                        ? "mt-0.5 truncate"
                        : "truncate font-medium text-slate-700"
                    }
                  >
                    {location}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-500">
          {description}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {property.maxPersons ? (
            <MetaBadge>
              <Users className="h-3.5 w-3.5" />

              bis {property.maxPersons} Pers.
            </MetaBadge>
          ) : null}

          {property.dogsAllowed ? (
            <MetaBadge>
              <Dog className="h-3.5 w-3.5" />

              Hund erlaubt
            </MetaBadge>
          ) : null}

          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-100">
            <Flame className="h-3.5 w-3.5" />

            {getDiscountLabel(offer)}
          </span>
        </div>

        {offerPeriod && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl bg-amber-50/70 px-4 py-3 ring-1 ring-amber-100">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.11em] text-amber-700">
                Angebotszeitraum
              </p>

              <p className="mt-0.5 text-sm font-semibold text-slate-700">
                {offerPeriod}
              </p>
            </div>
          </div>
        )}

        {offer.note ? (
          <div className="mt-4 flex gap-2.5 rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

            <p className="line-clamp-3 text-sm leading-6 text-slate-600">
              {cleanText(offer.note)}
            </p>
          </div>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-4 border-t border-slate-100 pt-5">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
              Last Minute
            </p>

            <p className="mt-1 truncate text-sm font-semibold text-slate-700">
              Verfügbarkeit prüfen
            </p>
          </div>

          <Link
            href={href}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-[background-color,transform] hover:bg-slate-800 "
          >
            Details

            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/* Discount Badge                                                             */
/* -------------------------------------------------------------------------- */

function DiscountBadge({ offer }) {
  return (
    <div className="pointer-events-none absolute left-3 top-3 z-10">
      <div className="relative overflow-hidden rounded-full bg-rose-600 px-3 py-1.5 text-[11px] font-bold shadow-lg shadow-rose-950/20 ring-1 ring-white/30">
        <span className="relative z-10 flex items-center gap-2">
          <span className="text-white">
            {getDiscountShortLabel(
              offer,
            )}
          </span>

          <span className="text-white/80">
            LAST MINUTE
          </span>
        </span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Kleine Komponenten                                                         */
/* -------------------------------------------------------------------------- */

function TrustItem({ children }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
        <Check className="h-3 w-3" />
      </span>

      {children}
    </span>
  );
}

function MetaBadge({ children }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
      {children}
    </span>
  );
}

function InfoBox({ title, text }) {
  return (
    <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50/60 p-5">
      <h3 className="text-sm font-semibold text-slate-900">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {text}
      </p>
    </div>
  );
}

function FaqItem({
  question,
  answer,
}) {
  return (
    <details className="group rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm open:border-slate-300">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-900">
        <span>{question}</span>

        <span
          aria-hidden="true"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-50 text-slate-500 transition-transform group-open:rotate-45"
        >
          +
        </span>
      </summary>

      <p className="mt-3 max-w-3xl pr-8 text-sm leading-7 text-slate-600">
        {answer}
      </p>
    </details>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty State                                                                */
/* -------------------------------------------------------------------------- */

function EmptyState() {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-slate-100 text-slate-600">
        <Search className="h-6 w-6" />
      </div>

      <h2 className="mt-6 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
        Aktuell keine
        Last-Minute-Angebote
      </h2>

      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
        Momentan sind keine
        Last-Minute-Angebote verfügbar.
        Entdecken Sie stattdessen unsere
        Ferienhäuser und Ferienwohnungen
        an der Ostsee.
      </p>

      <Link
        href="/"
        className="mt-7 inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-slate-800"
      >
        Unterkünfte entdecken

        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}