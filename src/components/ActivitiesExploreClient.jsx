"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ActivityMapClient from "@/components/ActivityMapClient";
import {
  ACTIVITY_GROUPS,
  getActivityGroup,
  getGoogleMapsUrl,
} from "@/lib/activity-groups";
import {
  ExternalLink,
  Home,
  MapPin,
  Navigation,
  PawPrint,
  SlidersHorizontal,
  Users,
} from "lucide-react";

const FILTERS = ACTIVITY_GROUPS;

const FILTER_STYLES = {
  Alle: {
    active: "bg-[#050b1f] text-white ring-[#050b1f]",
    idle: "bg-white text-[#0f172a] ring-[#dbeafe] hover:bg-[#eaf7fb]",
  },
  Familie: {
    active: "bg-[#c49a3a] text-white ring-[#c49a3a]",
    idle: "bg-[#f7f1e5] text-[#7a5b18] ring-[#ead9b6] hover:bg-white",
  },
  Natur: {
    active: "bg-[#0077b6] text-white ring-[#0077b6]",
    idle: "bg-[#eaf7fb] text-[#075985] ring-[#bae6fd] hover:bg-white",
  },
  Sport: {
    active: "bg-[#050b1f] text-white ring-[#050b1f]",
    idle: "bg-slate-50 text-slate-700 ring-slate-200 hover:bg-white",
  },
  Restaurant: {
    active: "bg-[#b8791c] text-white ring-[#b8791c]",
    idle: "bg-orange-50 text-orange-800 ring-orange-200 hover:bg-white",
  },
  Kultur: {
    active: "bg-[#475569] text-white ring-[#475569]",
    idle: "bg-slate-100 text-slate-700 ring-slate-200 hover:bg-white",
  },
};

export default function ActivitiesExploreClient({
  activities = [],
  defaultRadiusKm = 25,
}) {
  const [category, setCategory] = useState("Alle");
  const [radiusKm, setRadiusKm] = useState(defaultRadiusKm);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(false);
  const [nearby, setNearby] = useState([]);

  const normalizedActivities = useMemo(() => {
    return activities
      .filter((activity) => isValidCoordinate(activity.lat, activity.lng))
      .map((activity) => ({
        ...activity,
        group: getActivityGroup(activity),
      }));
  }, [activities]);

  const counts = useMemo(() => {
    const result = {
      Alle: normalizedActivities.length,
      Familie: 0,
      Natur: 0,
      Sport: 0,
      Restaurant: 0,
      Kultur: 0,
    };

    for (const activity of normalizedActivities) {
      if (result[activity.group] !== undefined) {
        result[activity.group] += 1;
      }
    }

    return result;
  }, [normalizedActivities]);

  const filtered = useMemo(() => {
    if (category === "Alle") return normalizedActivities;

    return normalizedActivities.filter(
      (activity) => activity.group === category
    );
  }, [normalizedActivities, category]);

  const onSelectActivity = useCallback(
    async (activity) => {
      setActive(activity);
      setLoading(true);
      setNearby([]);

      try {
        const res = await fetch(
          `/api/properties/nearby?lat=${activity.lat}&lng=${activity.lng}&radius=${radiusKm}`,
          { cache: "no-store" }
        );

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json?.error || "Fehler beim Laden der Unterkünfte");
        }

        setNearby(Array.isArray(json.items) ? json.items : []);
      } catch (error) {
        console.error(error);
        setNearby([]);
      } finally {
        setLoading(false);
      }
    },
    [radiusKm]
  );

  const mapItems = useMemo(() => {
    return filtered.map((activity) => ({
      ...activity,
      onClick: () => onSelectActivity(activity),
    }));
  }, [filtered, onSelectActivity]);

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-[#dbeafe] bg-white shadow-2xl shadow-[#050b1f]/10">
        <div className="border-b border-[#eaf7fb] bg-white px-5 py-6 md:px-7 md:py-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#c49a3a]">
                Ausflugsziele
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#050b1f] md:text-4xl">
                Aktivitäten entdecken
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                Wähle ein Ziel auf der Karte. Danach zeigen wir dir passende
                Ferienunterkünfte in der Nähe.
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#dbeafe] bg-[#eaf7fb] px-4 py-2 text-sm font-bold text-[#075985]">
              <Navigation className="h-4 w-4" />
              Radius {radiusKm} km
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {FILTERS.map((filter) => {
              const activeFilter = category === filter;
              const styles = FILTER_STYLES[filter] || FILTER_STYLES.Alle;

              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => {
                    setCategory(filter);
                    setActive(null);
                    setNearby([]);
                  }}
                  className={[
                    "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-bold ring-1 transition",
                    activeFilter ? styles.active : styles.idle,
                  ].join(" ")}
                >
                  <span>{filter}</span>

                  <span
                    className={[
                      "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                      activeFilter
                        ? "bg-white/20 text-white"
                        : "bg-white/90 text-slate-500",
                    ].join(" ")}
                  >
                    {counts[filter] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 max-w-md rounded-2xl border border-[#dbeafe] bg-[#eaf7fb]/45 p-4">
            <div className="mb-3 flex items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2 text-sm font-bold text-[#050b1f]">
                <SlidersHorizontal className="h-4 w-4 text-[#0077b6]" />
                Suchradius
              </div>

              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#075985] shadow-sm">
                {radiusKm} km
              </span>
            </div>

            <input
              className="w-full accent-[#0077b6]"
              type="range"
              min={5}
              max={80}
              step={5}
              value={radiusKm}
              onChange={(event) => {
                setRadiusKm(Number(event.target.value));
                setNearby([]);
              }}
            />
          </div>
        </div>

        <div className="bg-[#eaf7fb]/45 p-3 md:p-4">
          <div className="relative overflow-hidden rounded-[1.5rem] border border-[#dbeafe] bg-[#eaf7fb] shadow-inner">
            <div className="h-[430px] sm:h-[520px] lg:h-[640px]">
              <ActivityMapClient
                items={mapItems}
                center={[54.35, 10.13]}
                zoom={8}
                showFilters={false}
              />
            </div>

            <div className="pointer-events-none absolute left-4 top-4 hidden rounded-2xl border border-white/70 bg-white/90 px-4 py-3 shadow-xl shadow-[#050b1f]/10 backdrop-blur-xl sm:block">
              <p className="text-xs font-bold text-[#050b1f]">
                {filtered.length} Ziele sichtbar
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Klick auf einen Pin für Unterkünfte
              </p>
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#050b1f]/10 to-transparent" />
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-[#dbeafe] bg-white p-5 shadow-xl shadow-[#050b1f]/5 md:p-7">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#c49a3a]">
              Unterkünfte
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#050b1f] md:text-3xl">
              Unterkünfte in der Nähe
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {active ? (
                <>
                  Für{" "}
                  <span className="font-bold text-[#050b1f]">
                    {active.title}
                  </span>{" "}
                  im {radiusKm} km Umkreis.
                </>
              ) : (
                "Wähle zuerst ein Ziel auf der Karte."
              )}
            </p>
          </div>

          {active ? (
            <div className="flex flex-wrap gap-2">
              {active.slug ? (
                <Link
                  href={`/aktivitaeten/${active.slug}`}
                  className="inline-flex w-fit items-center rounded-full bg-[#050b1f] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#050b1f]/15 transition hover:-translate-y-0.5 hover:bg-[#0f172a] hover:shadow-xl"
                >
                  Mehr erfahren →
                </Link>
              ) : null}

              <a
                href={getGoogleMapsUrl(active)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-fit items-center gap-2 rounded-full border border-[#dbeafe] bg-white px-5 py-3 text-sm font-bold text-[#075985] shadow-sm transition hover:-translate-y-0.5 hover:border-[#0077b6]/40 hover:bg-[#eaf7fb] hover:shadow-md"
              >
                Google Maps
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          ) : null}
        </div>

        {loading ? (
          <Notice text="Lädt Unterkünfte…" />
        ) : active && nearby.length === 0 ? (
          <Notice text="Keine Unterkünfte im Umkreis gefunden." />
        ) : !active ? (
          <Notice text="Noch kein Ziel ausgewählt." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {nearby.map((property) => (
              <NearbyProperty key={property.id} property={property} />
            ))}
          </div>
        )}
      </section>
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

function Notice({ text }) {
  return (
    <div className="rounded-3xl border border-dashed border-[#bae6fd] bg-[#eaf7fb]/45 px-5 py-8 text-center text-sm font-medium text-slate-600">
      {text}
    </div>
  );
}

function isValidCoordinate(lat, lng) {
  return Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
}