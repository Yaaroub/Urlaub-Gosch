"use client";

import { useCallback, useDeferredValue, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CloudRain,
  ExternalLink,
  Home,
  LayoutGrid,
  Map as MapIcon,
  MapPin,
  RotateCcw,
  Search,
  Users,
  X,
} from "lucide-react";
import ActivityMapClient from "@/components/ActivityMapClient";
import ActivityCard from "@/components/activities/ActivityCard";
import { GROUP_VISUALS, GroupArtwork, VISIBLE_GROUPS, getGroupVisual } from "@/components/activities/activity-visuals";
import { ACTIVITY_GROUPS, getGoogleMapsUrl } from "@/lib/activity-groups";

const RADIUS_OPTIONS = [10, 25, 50];

function normalize(value) {
  return String(value ?? "")
    .toLocaleLowerCase("de-DE")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * Activity explorer. Receives slim objects only (lib/activity-view.js).
 * The Mapbox map is loaded only when the map view is opened.
 */
export default function ActivitiesExploreClient({ activities = [], counts = {} }) {
  const [category, setCategory] = useState("Alle");
  const [query, setQuery] = useState("");
  const [rainOnly, setRainOnly] = useState(false);
  const [view, setView] = useState("list");
  const [radiusKm, setRadiusKm] = useState(25);
  const [active, setActive] = useState(null);
  const [nearby, setNearby] = useState({ status: "idle", items: [] });
  const requestRef = useRef(0);

  const deferredQuery = useDeferredValue(query);

  const searchIndex = useMemo(
    () =>
      new Map(
        activities.map((activity) => [
          activity.slug,
          normalize([activity.title, activity.town, activity.category, activity.shortDescription].join(" ")),
        ])
      ),
    [activities]
  );

  const filtered = useMemo(() => {
    const needle = normalize(deferredQuery.trim());
    return activities.filter((activity) => {
      if (category !== "Alle" && activity.group !== category) return false;
      if (rainOnly && !(activity.weather === "indoor" || activity.weather === "all-weather")) return false;
      if (needle && !searchIndex.get(activity.slug)?.includes(needle)) return false;
      return true;
    });
  }, [activities, category, rainOnly, deferredQuery, searchIndex]);

  const hasFilters = category !== "Alle" || rainOnly || query.trim() !== "";

  const loadNearby = useCallback(async (activity, radius) => {
    const requestId = ++requestRef.current;
    setNearby({ status: "loading", items: [] });
    try {
      const res = await fetch(
        `/api/properties/nearby?lat=${activity.lat}&lng=${activity.lng}&radius=${radius}`
      );
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Fehler beim Laden");
      if (requestId !== requestRef.current) return;
      setNearby({ status: "done", items: Array.isArray(json?.items) ? json.items : [] });
    } catch {
      if (requestId !== requestRef.current) return;
      setNearby({ status: "error", items: [] });
    }
  }, []);

  const selectActivity = useCallback(
    (activity) => {
      setActive(activity);
      loadNearby(activity, radiusKm);
    },
    [loadNearby, radiusKm]
  );

  const mapItems = useMemo(
    () => filtered.map((activity) => ({ ...activity, onClick: () => selectActivity(activity) })),
    [filtered, selectActivity]
  );

  function resetFilters() {
    setCategory("Alle");
    setRainOnly(false);
    setQuery("");
  }

  return (
    <div className="relative mx-auto -mt-12 max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
      {/* Toolbar */}
      <div className="relative z-20 rounded-[1.75rem] lg:sticky lg:top-24 border border-slate-200/80 bg-white/95 p-3 shadow-[0_18px_60px_rgba(15,23,42,0.10)] backdrop-blur sm:p-4">
        <div className="flex flex-col gap-3">
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 lg:flex-wrap lg:overflow-visible" role="group" aria-label="Nach Kategorie filtern">
            {ACTIVITY_GROUPS.map((group) => {
              const visual = getGroupVisual(group);
              const Icon = visual.icon;
              const selected = category === group;
              return (
                <button
                  key={group}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setCategory(group)}
                  className={[
                    "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
                    selected
                      ? "bg-[#07131f] text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-950",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {visual.label}
                  <span
                    className={[
                      "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                      selected ? "bg-white/15 text-white" : "bg-white text-slate-500",
                    ].join(" ")}
                  >
                    {counts[group] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-center">
            <label className="relative block sm:flex-1 lg:max-w-md">
              <span className="sr-only">Ausflugsziele durchsuchen</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ort oder Ziel suchen …"
                className="min-h-11 w-full rounded-full border border-slate-200 bg-[#f7fafc] py-2.5 pl-10 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              />
            </label>

            <div className="flex gap-2 sm:ml-auto">
              <button
                type="button"
                aria-pressed={rainOnly}
                onClick={() => setRainOnly((value) => !value)}
                className={[
                  "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition sm:flex-none",
                  rainOnly
                    ? "bg-sky-700 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-950",
                ].join(" ")}
              >
                <CloudRain className="h-4 w-4" aria-hidden="true" />
                Bei Regen
              </button>

              <div className="inline-flex rounded-full bg-slate-100 p-1" role="group" aria-label="Ansicht wählen">
                <ViewButton current={view} value="list" onSelect={setView} icon={LayoutGrid} label="Liste" />
                <ViewButton current={view} value="map" onSelect={setView} icon={MapIcon} label="Karte" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Result header */}
      <div className="mt-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-sky-700">
            {category === "Alle" ? "Schleswig-Holstein entdecken" : getGroupVisual(category).label}
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl" aria-live="polite">
            {filtered.length} {filtered.length === 1 ? "Ausflugsziel" : "Ausflugsziele"}
          </h2>
        </div>
        {hasFilters ? (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Filter zurücksetzen
          </button>
        ) : null}
      </div>

      {view === "map" ? (
        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white p-2 shadow-sm">
            <ActivityMapClient
              items={mapItems}
              center={[54.35, 10.4]}
              zoom={8}
              className="h-[460px] sm:h-[560px] lg:h-[640px]"
            />
          </div>

          <MapPanel
            active={active}
            nearby={nearby}
            radiusKm={radiusKm}
            onRadius={(radius) => {
              setRadiusKm(radius);
              if (active) loadNearby(active, radius);
            }}
            onClose={() => {
              requestRef.current++;
              setActive(null);
              setNearby({ status: "idle", items: [] });
            }}
          />
        </div>
      ) : filtered.length ? (
        <ul className="activity-grid mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((activity, index) => (
            <li key={activity.slug} className="activity-rise" style={{ animationDelay: `${Math.min(index, 11) * 35}ms` }}>
              <ActivityCard activity={activity} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 rounded-[2rem] border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <h3 className="text-xl font-bold text-slate-950">Keine passenden Ausflugsziele</h3>
          <p className="mt-2 text-sm text-slate-600">Probiere einen anderen Ort oder setze die Filter zurück.</p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#07131f] px-5 py-2.5 text-sm font-bold text-white"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Filter zurücksetzen
          </button>
        </div>
      )}
    </div>
  );
}

function ViewButton({ current, value, onSelect, icon: Icon, label }) {
  const selected = current === value;
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(value)}
      className={[
        "inline-flex min-h-9 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition",
        selected ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-950",
      ].join(" ")}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}

function MapPanel({ active, nearby, radiusKm, onRadius, onClose }) {
  if (!active) {
    return (
      <aside className="flex flex-col justify-center rounded-[1.75rem] border border-slate-200/80 bg-white p-7 text-center shadow-sm">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#07131f] text-[#f4d59d]">
          <MapPin className="h-6 w-6" aria-hidden="true" />
        </div>
        <h3 className="mt-5 text-lg font-bold text-slate-950">Ziel auf der Karte wählen</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Klicke auf einen Punkt. Hier erscheinen dann Details und Ferienunterkünfte in der Nähe.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-2 text-left">
          {VISIBLE_GROUPS.map((group) => {
            const visual = GROUP_VISUALS[group];
            return (
              <span key={group} className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
                <span className={`h-3 w-3 rounded-full bg-gradient-to-br ${visual.gradient}`} aria-hidden="true" />
                {visual.label}
              </span>
            );
          })}
        </div>
      </aside>
    );
  }

  return (
    <aside className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-sm" aria-live="polite">
      <GroupArtwork group={active.group} className="h-28">
        <button
          type="button"
          onClick={onClose}
          className="absolute left-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-black/25 text-white backdrop-blur-sm transition hover:bg-black/40"
          aria-label="Auswahl schließen"
        >
          <X className="h-4 w-4" />
        </button>
      </GroupArtwork>

      <div className="p-5">
        {active.town ? (
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-sky-700">{active.town}</p>
        ) : null}
        <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">{active.title}</h3>
        {active.shortDescription ? (
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{active.shortDescription}</p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/aktivitaeten/${active.slug}`}
            className="inline-flex items-center rounded-full bg-[#07131f] px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            Details ansehen →
          </Link>
          <a
            href={getGoogleMapsUrl(active)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
          >
            Route <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-5">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-bold text-slate-950">Unterkünfte in der Nähe</h4>
            <div className="inline-flex rounded-full bg-slate-100 p-0.5" role="group" aria-label="Umkreis">
              {RADIUS_OPTIONS.map((radius) => (
                <button
                  key={radius}
                  type="button"
                  aria-pressed={radiusKm === radius}
                  onClick={() => onRadius(radius)}
                  className={[
                    "rounded-full px-2.5 py-1 text-xs font-semibold transition",
                    radiusKm === radius ? "bg-white text-slate-950 shadow-sm" : "text-slate-500",
                  ].join(" ")}
                >
                  {radius} km
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 max-h-[360px] space-y-2 overflow-y-auto pr-1">
            {nearby.status === "loading" ? (
              [0, 1, 2].map((key) => <div key={key} className="h-[72px] animate-pulse rounded-2xl bg-slate-100" />)
            ) : nearby.status === "error" ? (
              <p className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">Unterkünfte konnten nicht geladen werden.</p>
            ) : nearby.items.length === 0 ? (
              <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">Keine Unterkünfte im Umkreis von {radiusKm} km.</p>
            ) : (
              nearby.items.slice(0, 12).map((property) => <CompactProperty key={property.id} property={property} />)
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

function CompactProperty({ property }) {
  const image = property.images?.[0]?.url || null;
  return (
    <Link
      href={`/properties/${property.slug}`}
      className="flex items-center gap-3 rounded-2xl border border-slate-100 p-2 transition hover:border-slate-200 hover:bg-slate-50"
    >
      <span className="relative h-14 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
        {image ? (
          <Image src={image} alt="" fill sizes="64px" className="object-cover" />
        ) : (
          <Home className="absolute inset-0 m-auto h-5 w-5 text-slate-400" aria-hidden="true" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-slate-950">{property.title}</span>
        <span className="mt-0.5 flex items-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" aria-hidden="true" />
            {Number(property.distanceKm).toFixed(1)} km
          </span>
          {property.maxPersons ? (
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" aria-hidden="true" />
              {property.maxPersons} Pers.
            </span>
          ) : null}
        </span>
      </span>
    </Link>
  );
}
