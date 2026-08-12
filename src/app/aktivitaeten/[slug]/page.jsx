import { activities } from "@/lib/activities";
import ActivityMapClient from "@/components/ActivityMapClient";
import SmartStickySidebar from "@/components/SmartStickySidebar";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  ExternalLink,
  Home,
  MapPin,
  Navigation,
  PawPrint,
  Sparkles,
  Users,
} from "lucide-react";
import {
  getActivityGroup,
  getGoogleMapsUrl,
} from "@/lib/activity-groups";
import { buildActivityJsonLd, safeJsonLd } from "@/lib/activity-seo";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "");

export const revalidate = 900;

export function generateStaticParams() {
  return activities
    .filter((activity) => activity.slug)
    .map((activity) => ({ slug: activity.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const activity = activities.find((item) => item.slug === slug);

  if (!activity) {
    return {
      title: "Aktivität nicht gefunden | Urlaub GOSCH",
      robots: { index: false, follow: false },
    };
  }

  const description =
    activity.shortDescription ||
    activity.description ||
    "Ausflugsziel und passende Ferienunterkünfte bei Urlaub GOSCH entdecken.";
  const canonical = SITE_URL ? `${SITE_URL}/aktivitaeten/${activity.slug}` : undefined;

  return {
    title: `${activity.title} – Ausflugsziel | Urlaub GOSCH`,
    description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      type: "article",
      title: `${activity.title} – Ausflugsziel | Urlaub GOSCH`,
      description,
      url: canonical,
      siteName: "Urlaub GOSCH",
      locale: "de_DE",
    },
    twitter: {
      card: "summary_large_image",
      title: `${activity.title} – Ausflugsziel | Urlaub GOSCH`,
      description,
    },
  };
}

async function getNearby({ lat, lng, radiusKm }) {
  try {
    const h = await headers();

    const host =
      h.get("x-forwarded-host") ||
      h.get("host");

    if (!host) {
      return {
        items: [],
        error: "Host konnte nicht ermittelt werden.",
      };
    }

    const forwardedProto = h.get("x-forwarded-proto");
    const proto =
      forwardedProto ||
      (host.includes("localhost") || host.startsWith("127.0.0.1")
        ? "http"
        : "https");

    const baseUrl = `${proto}://${host}`;

    const res = await fetch(
      `${baseUrl}/api/properties/nearby?lat=${encodeURIComponent(
        lat
      )}&lng=${encodeURIComponent(lng)}&radius=${encodeURIComponent(radiusKm)}`,
      {
        next: { revalidate: 900 },
      }
    );

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        items: [],
        error: json?.error || "Nearby-Request fehlgeschlagen.",
      };
    }

    return {
      items: Array.isArray(json?.items) ? json.items : [],
      error: null,
    };
  } catch (error) {
    console.error("Nearby-Unterkünfte konnten nicht geladen werden:", error);

    return {
      items: [],
      error: "Unterkünfte in der Nähe konnten nicht geladen werden.",
    };
  }
}

function getNearbyActivities(currentActivity, radiusKm = 25, limit = 12) {
  const lat = Number(currentActivity?.lat);
  const lng = Number(currentActivity?.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return [];
  }

  return activities
    .filter((item) => item.slug && item.slug !== currentActivity.slug)
    .map((item) => {
      const itemLat = Number(item.lat);
      const itemLng = Number(item.lng);

      if (!Number.isFinite(itemLat) || !Number.isFinite(itemLng)) {
        return null;
      }

      const distanceKm = haversineKm(lat, lng, itemLat, itemLng);

      if (distanceKm > radiusKm) {
        return null;
      }

      return {
        ...item,
        distanceKm,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default async function ActivityDetailPage({ params }) {
  const resolvedParams = await params;
  const activity = activities.find((item) => item.slug === resolvedParams.slug);

  if (!activity) notFound();

  const radiusKm = 25;
  const detectedGroup = getActivityGroup(activity);
  const jsonLd = buildActivityJsonLd(activity, { siteUrl: SITE_URL || undefined });

  const nearbyActivities = getNearbyActivities(activity, radiusKm, 12);
  const mapActivities = [activity, ...nearbyActivities];

  const { items: nearby, error } = await getNearby({
    lat: activity.lat,
    lng: activity.lng,
    radiusKm,
  });

  return (
    <main className="min-h-screen bg-[#f7f1e5]/40 px-4 pb-24 pt-32 text-[#0f172a] sm:px-6 lg:px-8">
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
        />
      ) : null}

      <div className="mx-auto max-w-7xl">
        <Link
          href="/aktivitaeten"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-[#050b1f]"
        >
          <span className="grid h-8 w-8 place-items-center rounded-full border border-[#dbeafe] bg-white shadow-sm">
            <ArrowLeft className="h-4 w-4" />
          </span>
          Zurück zu Ausflugszielen
        </Link>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0">
            <section className="relative overflow-hidden rounded-[2rem] border border-[#dbeafe] bg-white shadow-sm">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(196,154,58,0.18),transparent_32%),radial-gradient(circle_at_85%_15%,rgba(0,119,182,0.13),transparent_30%)]" />

              <div className="relative p-6 sm:p-8 lg:p-10">
                <div className="max-w-4xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#dbeafe] bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500 backdrop-blur">
                    <Sparkles className="h-3.5 w-3.5 text-[#c49a3a]" />
                    {detectedGroup}
                  </div>

                  <h1 className="mt-6 max-w-4xl text-[clamp(2.2rem,6vw,5rem)] font-semibold leading-[0.98] tracking-[-0.07em] text-[#050b1f]">
                    {activity.title}
                  </h1>

                  {activity.shortDescription ? (
                    <p className="mt-6 max-w-2xl text-base leading-8 text-slate-700 sm:text-lg">
                      {activity.shortDescription}
                    </p>
                  ) : null}

                  {activity.description ? (
                    <div className="mt-6 max-w-3xl space-y-4 text-sm leading-7 text-slate-500 sm:text-base">
                      {splitParagraphs(activity.description).map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </section>

            {Array.isArray(activity.highlights) && activity.highlights.length > 0 ? (
              <section className="mt-8 rounded-[2rem] border border-[#dbeafe] bg-white p-6 shadow-sm sm:p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#c49a3a]">
                  Highlights
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {activity.highlights.map((highlight) => (
                    <div
                      key={highlight}
                      className="rounded-2xl border border-[#dbeafe] bg-[#eaf7fb]/50 px-4 py-3 text-sm font-semibold text-slate-700"
                    >
                      {highlight}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="mt-8 overflow-hidden rounded-[2rem] border border-[#dbeafe] bg-white shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#eaf7fb] p-5 sm:p-6">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#c49a3a]">
                    Lage
                  </p>

                  <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[#050b1f]">
                    Auf der Karte
                  </h2>
                </div>

                <a
                  href={getGoogleMapsUrl(activity)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-[#dbeafe] bg-[#eaf7fb] px-4 py-2 text-sm font-semibold text-[#075985] transition hover:bg-white"
                >
                  Google Maps
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              <div className="p-3 sm:p-4">
                <ActivityMapClient
                  items={mapActivities}
                  center={[activity.lat, activity.lng]}
                  zoom={10.5}
                  className="h-[360px] sm:h-[460px] lg:h-[540px]"
                />
              </div>
            </section>

            {nearbyActivities.length > 0 ? (
              <section className="mt-8 rounded-[2rem] border border-[#dbeafe] bg-white p-5 shadow-sm sm:p-6 lg:p-7">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#c49a3a]">
                      Umgebung
                    </p>

                    <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[#050b1f]">
                      Weitere Ausflugsziele in der Nähe
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                      Entdecke weitere Ziele im Umkreis von {radiusKm} km rund um{" "}
                      <span className="font-semibold text-[#050b1f]">
                        {activity.title}
                      </span>.
                    </p>
                  </div>

                  <Link
                    href="/aktivitaeten"
                    className="inline-flex items-center gap-2 rounded-full border border-[#dbeafe] bg-[#eaf7fb]/70 px-4 py-2 text-sm font-bold text-[#075985] transition hover:bg-white"
                  >
                    Alle Ausflugsziele
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {nearbyActivities.slice(0, 6).map((item) => (
                    <Link
                      key={item.slug}
                      href={`/aktivitaeten/${item.slug}`}
                      className="group rounded-[1.25rem] border border-[#dbeafe] bg-[#eaf7fb]/25 p-4 transition hover:-translate-y-0.5 hover:border-[#0077b6]/30 hover:bg-white hover:shadow-[0_12px_30px_rgba(5,11,31,0.06)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-sm font-bold leading-5 text-[#050b1f] group-hover:text-[#0077b6]">
                            {item.title}
                          </p>

                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {getActivityGroup(item)}
                          </p>
                        </div>

                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-[#075985] ring-1 ring-[#dbeafe]">
                          <MapPin className="h-3 w-3" />
                          {item.distanceKm.toFixed(1)} km
                        </span>
                      </div>

                      {item.shortDescription ? (
                        <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">
                          {item.shortDescription}
                        </p>
                      ) : null}

                      <span className="mt-3 inline-flex text-xs font-bold text-[#0077b6]">
                        Ziel ansehen →
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="mt-8">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#c49a3a]">
                    Nähe
                  </p>

                  <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[#050b1f]">
                    Unterkünfte in der Nähe
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Ferienunterkünfte im Umkreis von {radiusKm} km.
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-[#dbeafe] bg-white px-4 py-2 text-sm font-semibold text-[#075985] shadow-sm">
                  <Home className="h-4 w-4" />
                  {nearby.length} Treffer
                </div>
              </div>

              {error ? (
                <Notice text={error} />
              ) : nearby.length === 0 ? (
                <Notice text="Keine Unterkünfte im Umkreis gefunden." />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {nearby.map((property) => (
                    <NearbyProperty key={property.id} property={property} />
                  ))}
                </div>
              )}
            </section>
          </div>

          <SmartStickySidebar
            topOffset={112}
            bottomOffset={16}
            ariaLabel="Informationen zum Ausflugsziel"
          >
            <aside className="rounded-[1.5rem] border border-[#dbeafe] bg-white/95 p-5 shadow-sm backdrop-blur">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-[#050b1f] text-white">
                <Compass className="h-5 w-5" />
              </div>

              <h2 className="mt-5 text-xl font-semibold tracking-[-0.03em] text-[#050b1f]">
                Ausflugsziel
              </h2>

              <div className="mt-5 space-y-4">
                <InfoLine
                  icon={MapPin}
                  label="Kategorie"
                  value={detectedGroup}
                />

                <InfoLine
                  icon={Navigation}
                  label="Umkreis"
                  value={`${radiusKm} km`}
                />

                <InfoLine
                  icon={Compass}
                  label="Ausflugsziele"
                  value={`${nearbyActivities.length} weitere in der Nähe`}
                />

                <InfoLine
                  icon={Home}
                  label="Unterkünfte"
                  value={`${nearby.length} Treffer in der Nähe`}
                />
              </div>

              {activity.address ? (
                <div className="mt-5 rounded-2xl bg-[#eaf7fb]/60 p-4 text-sm leading-6 text-slate-600 ring-1 ring-[#bae6fd]">
                  <p className="font-bold text-[#050b1f]">Adresse</p>
                  <p className="mt-1">{activity.address}</p>
                </div>
              ) : null}

              <a
                href={getGoogleMapsUrl(activity)}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0077b6] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0369a1]"
              >
                In Google Maps öffnen
                <ExternalLink className="h-4 w-4" />
              </a>
            </aside>
          </SmartStickySidebar>
        </div>
      </div>
    </main>
  );
}

function InfoLine({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#eaf7fb] text-[#0077b6]">
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
          {label}
        </p>

        <p className="mt-1 truncate text-sm font-semibold text-[#050b1f]">
          {value}
        </p>
      </div>
    </div>
  );
}

function Notice({ text }) {
  return (
    <div className="rounded-2xl border border-[#dbeafe] bg-white p-5 text-sm leading-6 text-slate-600 shadow-sm">
      {text}
    </div>
  );
}

function NearbyProperty({ property }) {
  const image =
    property.coverImage ||
    property.image ||
    property.images?.[0]?.url ||
    property.images?.[0]?.src ||
    property.images?.[0]?.path ||
    null;

  const distance =
    typeof property.distanceKm !== "undefined" && property.distanceKm !== null
      ? `${Number(property.distanceKm).toFixed(1)} km`
      : null;

  return (
    <Link
      href={`/properties/${property.slug}`}
      className={[
        "group overflow-hidden rounded-[1.5rem] border border-[#dbeafe] bg-white shadow-sm",
        "transition-[border-color,box-shadow,background-color] duration-200 ease-out",
        "hover:border-[#0077b6]/35 hover:bg-white hover:shadow-[0_16px_42px_rgba(5,11,31,0.07)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077b6]/30",
      ].join(" ")}
    >
      <div className="grid gap-0 sm:grid-cols-[190px_minmax(0,1fr)]">
        <div className="relative aspect-[4/3] overflow-hidden bg-[#eaf7fb] sm:h-full sm:min-h-[170px] sm:aspect-auto">
          {image ? (
            <Image
              src={image}
              alt={property.title || "Ferienunterkunft"}
              fill
              sizes="(max-width: 768px) 100vw, 190px"
              className="object-cover transition-[filter] duration-200 ease-out group-hover:brightness-[0.97]"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-[#0077b6]">
              <Home className="h-7 w-7" />
            </div>
          )}

          {distance ? (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-[#075985] shadow-sm backdrop-blur">
              <MapPin className="h-3 w-3" />
              {distance}
            </span>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-col p-4">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-base font-semibold leading-6 tracking-[-0.02em] text-[#050b1f]">
              {property.title}
            </h3>

            {property.location ? (
              <p className="mt-1 line-clamp-1 text-sm text-slate-500">
                {property.location}
              </p>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
            {typeof property.maxPersons !== "undefined" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#eaf7fb] px-2.5 py-1 text-[#075985] ring-1 ring-[#bae6fd]">
                <Users className="h-3.5 w-3.5" />
                bis {property.maxPersons} Pers.
              </span>
            ) : null}

            {typeof property.dogsAllowed !== "undefined" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#f7f1e5] px-2.5 py-1 text-[#7a5b18] ring-1 ring-[#ead9b6]">
                <PawPrint className="h-3.5 w-3.5" />
                {property.dogsAllowed ? "Hunde erlaubt" : "Keine Hunde"}
              </span>
            ) : null}
          </div>

          <div className="mt-auto pt-4">
            <span className="text-sm font-bold text-[#0077b6]">
              Unterkunft ansehen →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function splitParagraphs(text = "") {
  return String(text)
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}