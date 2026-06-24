import { activities } from "@/lib/activities";
import ActivityMapClient from "@/components/ActivityMapClient";
import Link from "next/link";
import Image from "next/image";
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
import { getActivityGroup, getGoogleMapsUrl } from "@/lib/activity-groups";

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const activity = activities.find((item) => item.slug === resolvedParams.slug);

  if (!activity) {
    return {
      title: "Aktivität nicht gefunden | Urlaub GOSCH",
    };
  }

  return {
    title: `${activity.title} – Ausflugsziel | Urlaub GOSCH`,
    description:
      activity.shortDescription ||
      activity.description ||
      "Ausflugsziel und passende Unterkünfte bei Urlaub GOSCH entdecken.",
  };
}

async function getNearby({ lat, lng, radiusKm }) {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") || h.get("host");

    if (!host) {
      return {
        items: [],
        error: "Host konnte nicht ermittelt werden.",
      };
    }

    const proto = h.get("x-forwarded-proto") || "http";
    const baseUrl = `${proto}://${host}`;

    const res = await fetch(
      `${baseUrl}/api/properties/nearby?lat=${lat}&lng=${lng}&radius=${radiusKm}`,
      { cache: "no-store" }
    );

    let json = null;

    try {
      json = await res.json();
    } catch {
      json = null;
    }

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
    console.error(error);

    return {
      items: [],
      error: "Unterkünfte in der Nähe konnten nicht geladen werden.",
    };
  }
}

export default async function ActivityDetailPage({ params }) {
  const resolvedParams = await params;
  const activity = activities.find((item) => item.slug === resolvedParams.slug);

  if (!activity) {
    return (
      <main className="min-h-screen bg-[#f7f1e5]/40 px-4 pb-20 pt-32 text-[#0f172a] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-[#dbeafe] bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
            Nicht gefunden
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#050b1f]">
            Aktivität nicht gefunden
          </h1>

          <Link
            href="/aktivitaeten"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#050b1f] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0f172a]"
          >
            Zurück zu Aktivitäten
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    );
  }

  const radiusKm = 25;
  const detectedGroup = getActivityGroup(activity);

  const { items: nearby, error } = await getNearby({
    lat: activity.lat,
    lng: activity.lng,
    radiusKm,
  });

  return (
    <main className="min-h-screen bg-[#f7f1e5]/40 px-4 pb-24 pt-32 text-[#0f172a] sm:px-6 lg:px-8">
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

        <section className="relative overflow-hidden rounded-[2rem] border border-[#dbeafe] bg-white shadow-sm">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(196,154,58,0.18),transparent_32%),radial-gradient(circle_at_85%_15%,rgba(0,119,182,0.13),transparent_30%)]" />

          <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:p-10">
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

            <aside className="rounded-[1.5rem] border border-[#dbeafe] bg-white/85 p-5 shadow-sm backdrop-blur">
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
            <div className="h-[360px] overflow-hidden rounded-[1.5rem] border border-[#dbeafe] bg-[#eaf7fb] sm:h-[460px] lg:h-[560px]">
              <ActivityMapClient
                items={[activity]}
                center={[activity.lat, activity.lng]}
                zoom={11}
                showFilters={false}
              />
            </div>
          </div>
        </section>

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