import { activities } from "@/lib/activities";
import ActivityMapClient from "@/components/ActivityMapClient";
import SmartStickySidebar from "@/components/SmartStickySidebar";
import ActivityCard from "@/components/activities/ActivityCard";
import { GroupArtwork, getGroupVisual } from "@/components/activities/activity-visuals";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { findNearbyProperties, parseNearbyParams } from "@/lib/nearby-properties";
import {
  ArrowRight,
  ChevronRight,
  CircleCheck,
  CloudRain,
  ExternalLink,
  Globe,
  Home,
  Lightbulb,
  MapPin,
  PawPrint,
  Phone,
  Route,
  Sun,
  Users,
} from "lucide-react";
import { getGoogleMapsUrl } from "@/lib/activity-groups";
import { getActivityTown, toActivityCard, WEATHER_LABELS } from "@/lib/activity-view";
import { buildActivityJsonLd, safeJsonLd } from "@/lib/activity-seo";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "");

const RADIUS_KM = 25;

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
  // Direct read-only query: no HTTP self-call and no headers(), so ISR/static rendering works.
  const params = parseNearbyParams({ lat, lng, radius: radiusKm });
  if (!params) return { items: [], error: null };
  try {
    return { items: await findNearbyProperties(params), error: null };
  } catch (error) {
    console.error("Nearby-Unterkünfte konnten nicht geladen werden:", error);
    return { items: [], error: "Unterkünfte in der Nähe konnten nicht geladen werden." };
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
      if (!Number.isFinite(itemLat) || !Number.isFinite(itemLng)) return null;
      const distanceKm = haversineKm(lat, lng, itemLat, itemLng);
      if (distanceKm > radiusKm) return null;
      // Slim object: long texts stay on the server.
      return { ...toActivityCard(item), distanceKm };
    })
    .filter(Boolean)
    // Excursions before everyday services.
    .sort((a, b) => Number(a.group === "Service") - Number(b.group === "Service") || a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function safeWebsite(url) {
  try {
    const parsed = new URL(String(url || "").trim());
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function telHref(phone) {
  const digits = String(phone || "").replace(/[^\d+]/g, "");
  if (digits.length < 5) return null;
  return `tel:${digits.startsWith("0") ? `+49${digits.slice(1)}` : digits}`;
}

function splitParagraphs(text = "") {
  return String(text)
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default async function ActivityDetailPage({ params }) {
  const resolvedParams = await params;
  const activity = activities.find((item) => item.slug === resolvedParams.slug);

  if (!activity) notFound();

  const card = toActivityCard(activity);
  const visual = getGroupVisual(card.group);
  const GroupIcon = visual.icon;
  const town = getActivityTown(activity.address);
  const weatherLabel = WEATHER_LABELS[activity.weather];
  const website = safeWebsite(activity.website);
  const phoneHref = telHref(activity.phone);
  const mapsUrl = getGoogleMapsUrl(activity);
  const jsonLd = buildActivityJsonLd(activity, { siteUrl: SITE_URL || undefined });

  const nearbyActivities = getNearbyActivities(activity, RADIUS_KM, 12);
  const mapActivities = [card, ...nearbyActivities];

  const { items: nearby, error } = await getNearby({
    lat: activity.lat,
    lng: activity.lng,
    radiusKm: RADIUS_KM,
  });

  const paragraphs = splitParagraphs(activity.description);
  const highlights = Array.isArray(activity.highlights) ? activity.highlights : [];
  const tips = Array.isArray(activity.tips) ? activity.tips : [];

  return (
    <main className="min-h-screen bg-[#f7fafc] text-slate-950">
      {jsonLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      ) : null}

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#07131f] px-4 pb-24 pt-28 text-white sm:px-6 lg:px-8 lg:pb-28 lg:pt-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(244,213,157,0.14),transparent_40%),radial-gradient(circle_at_10%_90%,rgba(42,159,214,0.16),transparent_45%)]"
        />
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-20 w-full text-[#f7fafc]"
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
        >
          <path fill="currentColor" d="M0 52 C 260 12 460 80 760 48 S 1220 16 1440 44 V80 H0 Z" />
        </svg>

        <div className="relative mx-auto max-w-7xl">
          <nav aria-label="Brotkrumen" className="flex flex-wrap items-center gap-1.5 text-sm text-white/55">
            <Link href="/" className="transition hover:text-white">Startseite</Link>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            <Link href="/aktivitaeten" className="transition hover:text-white">Aktivitäten</Link>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="text-white/80">{visual.label}</span>
          </nav>

          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${visual.gradient} px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white ring-1 ring-white/15`}>
                  <GroupIcon className="h-4 w-4" aria-hidden="true" />
                  {visual.label}
                </span>
                {town ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-2 text-xs font-semibold text-white/75">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {town}
                  </span>
                ) : null}
              </div>

              <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl lg:leading-[1.04]">
                {activity.title}
              </h1>

              {activity.shortDescription ? (
                <p className="mt-6 max-w-2xl text-base leading-7 text-white/70 sm:text-lg sm:leading-8">
                  {activity.shortDescription}
                </p>
              ) : null}

              <div className="mt-6 flex flex-wrap gap-2">
                {activity.temporarilyClosed ? (
                  <span className="rounded-full bg-rose-500/15 px-3 py-1.5 text-xs font-bold text-rose-200 ring-1 ring-rose-300/30">
                    Vorübergehend geschlossen
                  </span>
                ) : null}
                {weatherLabel ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/85">
                    {activity.weather === "outdoor" ? <Sun className="h-3.5 w-3.5" aria-hidden="true" /> : <CloudRain className="h-3.5 w-3.5" aria-hidden="true" />}
                    {weatherLabel}
                  </span>
                ) : null}
                {activity.category ? (
                  <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/85">
                    {activity.category}
                  </span>
                ) : null}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#f4d59d] px-6 text-sm font-bold text-[#07131f] transition hover:bg-[#f8e2b8]"
                >
                  <Route className="h-4 w-4" aria-hidden="true" />
                  Route planen
                </a>
                {nearby.length ? (
                  <a
                    href="#unterkuenfte"
                    className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/20 px-6 text-sm font-bold text-white transition hover:bg-white/10"
                  >
                    <Home className="h-4 w-4" aria-hidden="true" />
                    {nearby.length} Unterkünfte in der Nähe
                  </a>
                ) : null}
              </div>
            </div>

            <GroupArtwork
              group={card.group}
              className="hidden min-h-[300px] rounded-[2rem] shadow-2xl shadow-black/30 ring-1 ring-white/10 lg:block"
              iconClassName="h-24 w-24"
            >
              <div className="absolute inset-x-6 bottom-6 rounded-2xl bg-white/95 p-5 text-slate-950 shadow-xl backdrop-blur">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-sky-700">Adresse</p>
                <p className="mt-1 text-sm font-semibold leading-6">{activity.address || town || "Schleswig-Holstein"}</p>
              </div>
            </GroupArtwork>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <div className="mx-auto -mt-8 max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-8">
            {paragraphs.length ? (
              <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-sky-700">Über das Ziel</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Das erwartet dich</h2>
                <div className="mt-5 max-w-3xl space-y-4 text-[15px] leading-7 text-slate-600 sm:text-base sm:leading-8">
                  {paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ) : null}

            {highlights.length || tips.length ? (
              <div className="grid gap-6 md:grid-cols-2">
                {highlights.length ? (
                  <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm sm:p-7">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-sky-700">Highlights</p>
                    <ul className="mt-4 space-y-3">
                      {highlights.map((highlight) => (
                        <li key={highlight} className="flex gap-3 text-sm font-medium leading-6 text-slate-700">
                          <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" aria-hidden="true" />
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {tips.length ? (
                  <section className="rounded-[2rem] border border-[#ecdcb8] bg-[#fbf6ea] p-6 sm:p-7">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8a6418]">Unsere Tipps</p>
                    <ul className="mt-4 space-y-3">
                      {tips.map((tip) => (
                        <li key={tip} className="flex gap-3 text-sm font-medium leading-6 text-[#4a3a17]">
                          <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-[#c49a3a]" aria-hidden="true" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
              </div>
            ) : null}

            <section id="unterkuenfte" className="scroll-mt-28">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-sky-700">Übernachten in der Nähe</p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Ferienunterkünfte im Umkreis</h2>
                  <p className="mt-1 text-sm text-slate-500">Innerhalb von {RADIUS_KM} km, nach Entfernung sortiert.</p>
                </div>
                {nearby.length > 6 ? (
                  <Link
                    href="/#unterkuenfte"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:text-slate-950"
                  >
                    Alle Unterkünfte <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                ) : null}
              </div>

              {error ? (
                <Notice text={error} />
              ) : nearby.length === 0 ? (
                <Notice text="Im Umkreis von 25 km haben wir aktuell keine Unterkunft." />
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {nearby.slice(0, 6).map((property) => (
                    <NearbyProperty key={property.id} property={property} />
                  ))}
                </div>
              )}
            </section>

            <section className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-sm">
              <div className="flex flex-wrap items-end justify-between gap-4 p-6 sm:p-7">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-sky-700">Lage</p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight">Karte & Umgebung</h2>
                </div>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                >
                  In Google Maps öffnen <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
              <div className="px-2 pb-2">
                <ActivityMapClient
                  items={mapActivities}
                  center={[activity.lat, activity.lng]}
                  zoom={10.5}
                  className="h-[340px] sm:h-[440px]"
                />
              </div>
            </section>

            {nearbyActivities.length ? (
              <section>
                <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-sky-700">Umgebung</p>
                    <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Weitere Ausflugsziele in der Nähe</h2>
                  </div>
                  <Link
                    href="/aktivitaeten"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:text-slate-950"
                  >
                    Alle Ausflugsziele <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
                <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {nearbyActivities.slice(0, 6).map((item) => (
                    <li key={item.slug}>
                      <ActivityCard activity={item} distanceKm={item.distanceKm} compact />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <SmartStickySidebar topOffset={112} bottomOffset={16} ariaLabel="Informationen zum Ausflugsziel">
            <aside className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
              <div className="border-b border-slate-100 p-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-sky-700">Auf einen Blick</p>
                <dl className="mt-4 space-y-4 text-sm">
                  {activity.address ? (
                    <Fact icon={MapPin} label="Adresse" value={activity.address} />
                  ) : null}
                  {activity.phone && phoneHref ? (
                    <Fact
                      icon={Phone}
                      label="Telefon"
                      value={<a href={phoneHref} className="font-semibold text-sky-700 hover:underline">{activity.phone}</a>}
                    />
                  ) : null}
                  {website ? (
                    <Fact
                      icon={Globe}
                      label="Website"
                      value={
                        <a href={website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-sky-700 hover:underline">
                          {new URL(website).hostname.replace(/^www\./, "")}
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      }
                    />
                  ) : null}
                  {weatherLabel ? (
                    <Fact icon={activity.weather === "outdoor" ? Sun : CloudRain} label="Wetter" value={weatherLabel} />
                  ) : null}
                </dl>
              </div>
              <div className="space-y-2 p-6">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#07131f] px-5 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  <Route className="h-4 w-4" aria-hidden="true" />
                  Route planen
                </a>
                {nearby.length ? (
                  <a
                    href="#unterkuenfte"
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-slate-200 px-5 text-sm font-bold text-slate-800 transition hover:border-slate-300"
                  >
                    <Home className="h-4 w-4" aria-hidden="true" />
                    Unterkunft in der Nähe
                  </a>
                ) : null}
                <p className="pt-2 text-center text-xs leading-5 text-slate-400">
                  Öffnungszeiten und Preise bitte vorab beim Anbieter prüfen.
                </p>
              </div>
            </aside>
          </SmartStickySidebar>
        </div>
      </div>
    </main>
  );
}

function Fact({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</dt>
        <dd className="mt-0.5 break-words font-medium leading-6 text-slate-800">{value}</dd>
      </div>
    </div>
  );
}

function Notice({ text }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-6 text-sm leading-6 text-slate-600">
      {text}
    </div>
  );
}

function NearbyProperty({ property }) {
  const image = property.images?.[0]?.url || null;

  return (
    <Link
      href={`/properties/${property.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(15,23,42,0.12)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300/60 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {image ? (
          <Image
            src={image}
            alt={property.images?.[0]?.alt || property.title || "Ferienunterkunft"}
            fill
            sizes="(min-width: 1280px) 260px, (min-width: 640px) 45vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
          />
        ) : (
          <Home className="absolute inset-0 m-auto h-8 w-8 text-slate-400" aria-hidden="true" />
        )}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-slate-800 shadow-sm">
          <MapPin className="h-3 w-3" aria-hidden="true" />
          {Number(property.distanceKm).toFixed(1)} km
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-base font-bold leading-6 tracking-tight text-slate-950">{property.title}</h3>
        {property.location ? <p className="mt-1 line-clamp-1 text-sm text-slate-500">{property.location}</p> : null}
        <div className="mt-auto flex flex-wrap gap-2 pt-4 text-xs font-semibold">
          {property.maxPersons ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-sky-800">
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              bis {property.maxPersons} Pers.
            </span>
          ) : null}
          {property.dogsAllowed ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#fbf3e2] px-2.5 py-1 text-[#7a5b18]">
              <PawPrint className="h-3.5 w-3.5" aria-hidden="true" />
              Hund erlaubt
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
