"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import ActivityMapClient from "@/components/ActivityMapClient";
import { Home, MapPin, Navigation, SlidersHorizontal } from "lucide-react";

function groupFromCategory(category = "") {
  const c = category.toLowerCase();

  if (
    c.includes("familie") ||
    c.includes("indoor") ||
    c.includes("freizeitpark") ||
    c.includes("tier") ||
    c.includes("zoo") ||
    c.includes("aquarium")
  ) {
    return "Familie";
  }

  if (
    c.includes("natur") ||
    c.includes("see") ||
    c.includes("strand") ||
    c.includes("schifffahrt") ||
    c.includes("park")
  ) {
    return "Natur";
  }

  if (
    c.includes("sport") ||
    c.includes("outdoor") ||
    c.includes("reitsport") ||
    c.includes("klettern") ||
    c.includes("wandern")
  ) {
    return "Sport";
  }

  if (
    c.includes("kulinarik") ||
    c.includes("restaurant") ||
    c.includes("café") ||
    c.includes("cafe") ||
    c.includes("brauerei") ||
    c.includes("genuss") ||
    c.includes("manufaktur")
  ) {
    return "Restaurant";
  }

  if (
    c.includes("museum") ||
    c.includes("kultur") ||
    c.includes("science") ||
    c.includes("planetarium") ||
    c.includes("stadt") ||
    c.includes("tour")
  ) {
    return "Kultur";
  }

  return "Natur";
}

const FILTERS = ["Alle", "Familie", "Natur", "Sport", "Restaurant", "Kultur"];

const FILTER_STYLES = {
  Alle: {
    active: "bg-slate-950 text-white ring-slate-950",
    idle: "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50",
  },
  Familie: {
    active: "bg-amber-500 text-white ring-amber-500",
    idle: "bg-amber-50 text-amber-700 ring-amber-200 hover:bg-white",
  },
  Natur: {
    active: "bg-emerald-500 text-white ring-emerald-500",
    idle: "bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-white",
  },
  Sport: {
    active: "bg-sky-500 text-white ring-sky-500",
    idle: "bg-sky-50 text-sky-700 ring-sky-200 hover:bg-white",
  },
  Restaurant: {
    active: "bg-orange-500 text-white ring-orange-500",
    idle: "bg-orange-50 text-orange-700 ring-orange-200 hover:bg-white",
  },
  Kultur: {
    active: "bg-indigo-500 text-white ring-indigo-500",
    idle: "bg-indigo-50 text-indigo-700 ring-indigo-200 hover:bg-white",
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
    return activities.map((activity) => ({
      ...activity,
      group: groupFromCategory(activity.category),
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

  async function onSelectActivity(activity) {
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
  }

  const mapItems = filtered.map((activity) => ({
    ...activity,
    onClick: () => onSelectActivity(activity),
  }));

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
        <div className="border-b border-slate-100 bg-white px-5 py-6 md:px-7 md:py-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-sky-700">
                Ausflugsziele
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                Aktivitäten entdecken
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                Wähle ein Ziel auf der Karte. Danach zeigen wir dir passende
                Unterkünfte in der Nähe.
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-600">
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

          <div className="mt-5 max-w-md rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2 text-sm font-bold text-slate-800">
                <SlidersHorizontal className="h-4 w-4 text-slate-500" />
                Suchradius
              </div>

              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">
                {radiusKm} km
              </span>
            </div>

            <input
              className="w-full accent-slate-950"
              type="range"
              min={5}
              max={80}
              step={5}
              value={radiusKm}
              onChange={(event) => setRadiusKm(Number(event.target.value))}
            />
          </div>
        </div>

        <div className="bg-slate-50/60 p-3 md:p-4">
          <div className="relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-100 shadow-inner">
            <div className="h-[430px] sm:h-[520px] lg:h-[640px]">
              <ActivityMapClient
                items={mapItems}
                center={[54.35, 10.13]}
                zoom={8}
                showFilters={false}
              />
            </div>

            <div className="pointer-events-none absolute left-4 top-4 hidden rounded-2xl border border-white/70 bg-white/90 px-4 py-3 shadow-xl shadow-slate-900/10 backdrop-blur-xl sm:block">
              <p className="text-xs font-bold text-slate-950">
                {filtered.length} Ziele sichtbar
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Klick auf einen Pin für Unterkünfte
              </p>
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-900/10 to-transparent" />
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5 md:p-7">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-sky-700">
              Unterkünfte
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
              Unterkünfte in der Nähe
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {active ? (
                <>
                  Für <span className="font-bold text-slate-900">{active.title}</span>{" "}
                  im {radiusKm} km Umkreis.
                </>
              ) : (
                "Wähle zuerst ein Ziel auf der Karte."
              )}
            </p>
          </div>

          {active?.slug ? (
            <Link
              href={`/aktivitaete/${active.slug}`}
              className="inline-flex w-fit items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-xl"
            >
              Mehr erfahren →
            </Link>
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

function Notice({ text }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm font-medium text-slate-600">
      {text}
    </div>
  );
}

function NearbyProperty({ property }) {
  return (
    <Link
      href={`/properties/${property.slug}`}
      className={[
        "group block rounded-3xl border border-slate-200 bg-white p-5 shadow-sm",
        "transition duration-200",
        "hover:-translate-y-0.5 hover:border-sky-200 hover:bg-sky-50/20 hover:shadow-xl hover:shadow-slate-900/8",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-base font-bold leading-6 text-slate-950">
            {property.title}
          </h3>

          {property.location ? (
            <p className="mt-1 truncate text-sm text-slate-500">
              {property.location}
            </p>
          ) : null}
        </div>

        {typeof property.distanceKm === "number" ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
            <MapPin className="h-3 w-3" />
            {property.distanceKm.toFixed(1)} km
          </span>
        ) : null}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <Home className="h-3.5 w-3.5" />
          Unterkunft
        </span>

        <span className="text-sm font-bold text-slate-900 transition-colors group-hover:text-sky-700">
          Details →
        </span>
      </div>
    </Link>
  );
}