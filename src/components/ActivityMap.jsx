"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import Map, { Marker, Popup } from "react-map-gl/mapbox";
import { useMemo, useState } from "react";
import mapboxgl from "mapbox-gl";

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
    return "familie";
  }

  if (
    c.includes("sport") ||
    c.includes("outdoor") ||
    c.includes("reitsport") ||
    c.includes("klettern") ||
    c.includes("wandern")
  ) {
    return "sport";
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
    return "restaurant";
  }

  if (
    c.includes("museum") ||
    c.includes("kultur") ||
    c.includes("science") ||
    c.includes("planetarium") ||
    c.includes("stadt") ||
    c.includes("tour")
  ) {
    return "kultur";
  }

  if (
    c.includes("natur") ||
    c.includes("see") ||
    c.includes("strand") ||
    c.includes("schifffahrt") ||
    c.includes("park")
  ) {
    return "natur";
  }

  return "natur";
}

const FILTERS = [
  { key: "all", label: "Alle" },
  { key: "familie", label: "Familie" },
  { key: "natur", label: "Natur" },
  { key: "sport", label: "Sport" },
  { key: "restaurant", label: "Restaurant" },
  { key: "kultur", label: "Kultur" },
];

const GROUP_STYLE = {
  familie: {
    bg: "bg-amber-500",
    text: "text-amber-700",
    chip: "bg-amber-50 ring-amber-200",
    activeChip: "bg-amber-500 text-white ring-amber-500",
    Icon: FamilyIcon,
  },
  natur: {
    bg: "bg-emerald-500",
    text: "text-emerald-700",
    chip: "bg-emerald-50 ring-emerald-200",
    activeChip: "bg-emerald-500 text-white ring-emerald-500",
    Icon: LeafIcon,
  },
  sport: {
    bg: "bg-sky-500",
    text: "text-sky-700",
    chip: "bg-sky-50 ring-sky-200",
    activeChip: "bg-sky-500 text-white ring-sky-500",
    Icon: SportIcon,
  },
  restaurant: {
    bg: "bg-orange-500",
    text: "text-orange-700",
    chip: "bg-orange-50 ring-orange-200",
    activeChip: "bg-orange-500 text-white ring-orange-500",
    Icon: CupIcon,
  },
  kultur: {
    bg: "bg-indigo-500",
    text: "text-indigo-700",
    chip: "bg-indigo-50 ring-indigo-200",
    activeChip: "bg-indigo-500 text-white ring-indigo-500",
    Icon: MuseumIcon,
  },
};

export default function ActivityMap({
  items = [],
  center = [54.35, 10.13],
  zoom = 9,
  showFilters = true,
}) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const [selected, setSelected] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");

  const initialView = useMemo(
    () => ({
      latitude: center[0],
      longitude: center[1],
      zoom,
    }),
    [center, zoom]
  );

  const normalizedItems = useMemo(() => {
    return items.map((item) => ({
      ...item,
      group: groupFromCategory(item.category),
    }));
  }, [items]);

  const visibleItems = useMemo(() => {
    if (activeFilter === "all") return normalizedItems;
    return normalizedItems.filter((item) => item.group === activeFilter);
  }, [normalizedItems, activeFilter]);

  const counts = useMemo(() => {
    const result = {
      all: normalizedItems.length,
      familie: 0,
      natur: 0,
      sport: 0,
      restaurant: 0,
      kultur: 0,
    };

    for (const item of normalizedItems) {
      if (result[item.group] !== undefined) {
        result[item.group] += 1;
      }
    }

    return result;
  }, [normalizedItems]);

  if (!token) {
    return (
      <div className="grid h-full min-h-[360px] place-items-center rounded-2xl bg-slate-100 p-6 text-center text-sm text-slate-600 ring-1 ring-black/5">
        <div>
          <p className="font-semibold text-slate-900">Mapbox Token fehlt</p>
          <p className="mt-2 text-slate-500">
            Bitte in deiner <code className="rounded bg-white px-1 py-0.5">.env</code>{" "}
            Datei setzen:
          </p>
          <code className="mt-3 inline-block rounded-lg bg-white px-3 py-2 text-xs text-slate-700 shadow-sm">
            NEXT_PUBLIC_MAPBOX_TOKEN
          </code>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {showFilters && (
        <div className="absolute left-3 right-3 z-10 rounded-2xl border border-white/70 bg-white/90 p-3 shadow-xl shadow-slate-900/10 backdrop-blur-xl">
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            {FILTERS.map((filter) => {
              const active = activeFilter === filter.key;

              const style =
                filter.key === "all"
                  ? {
                      chip: "bg-slate-50 ring-slate-200",
                      text: "text-slate-700",
                      activeChip: "bg-slate-950 text-white ring-slate-950",
                    }
                  : GROUP_STYLE[filter.key];

              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => {
                    setActiveFilter(filter.key);
                    setSelected(null);
                  }}
                  className={[
                    "inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-bold  transition",
                    active
                      ? style.activeChip
                      : `${style.chip} ${style.text} hover:bg-white hover:shadow-sm`,
                  ].join(" ")}
                >
                  <span>{filter.label}</span>

                  <span
                    className={[
                      "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                      active
                        ? "bg-white/20 text-white"
                        : "bg-white/90 text-slate-500",
                    ].join(" ")}
                  >
                    {counts[filter.key] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <Map
        mapLib={mapboxgl}
        mapboxAccessToken={token}
        initialViewState={initialView}
        mapStyle="mapbox://styles/mapbox/standard"
        scrollZoom
        style={{ width: "100%", height: "100%" }}
        onClick={() => setSelected(null)}
        attributionControl={true}
      >
        {visibleItems.map((activity) => {
          const style = GROUP_STYLE[activity.group] || GROUP_STYLE.natur;
          const Icon = style.Icon;

          return (
            <Marker
              key={activity.id}
              latitude={activity.lat}
              longitude={activity.lng}
              anchor="bottom"
              onClick={(event) => event.originalEvent.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => {
                  activity.onClick?.();
                  setSelected(activity);
                }}
                className={[
                  "relative grid h-8 w-8 place-items-center rounded-full",
                  "ring-[3px] ring-white shadow-lg shadow-slate-900/20",
                  style.bg,
                  "transition duration-200 hover:scale-110",
                ].join(" ")}
                title={`${activity.title} • ${activity.category}`}
                aria-label={activity.title}
              >
                <Icon className="h-4 w-4 text-white" />

                <span className="absolute -bottom-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 rounded-sm bg-inherit" />
              </button>
            </Marker>
          );
        })}

        {selected && (
          <Popup
            latitude={selected.lat}
            longitude={selected.lng}
            anchor="top"
            closeButton={false}
            closeOnClick={false}
            offset={16}
            onClose={() => setSelected(null)}
            maxWidth="320px"
          >
            <div className="min-w-[220px] space-y-2 rounded-xl">
              <div>
                <p className="text-sm font-bold text-slate-950">
                  {selected.title}
                </p>

                <p className="mt-0.5 text-xs font-medium text-slate-500">
                  {selected.category}
                </p>
              </div>

              {selected.description ? (
                <p className="text-sm leading-5 text-slate-700">
                  {selected.description}
                </p>
              ) : null}

              {typeof selected.distanceKm === "number" ? (
                <p className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800">
                  {selected.distanceKm.toFixed(1)} km entfernt
                </p>
              ) : null}
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}

/* Icons */

function LeafIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M20 4s-7 0-11 4-4 11-4 11 7 0 11-4 4-11 4-11z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M9 15c2-2 6-6 11-11"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function FamilyIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M7 10a2 2 0 110-4 2 2 0 010 4zm10 0a2 2 0 110-4 2 2 0 010 4z"
        fill="currentColor"
      />
      <path
        d="M4 18v-2c0-2 2-4 3-4s3 2 3 4v2H4zm10 0v-2c0-2 2-4 3-4s3 2 3 4v2h-6z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );
}

function MuseumIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M3 10l9-6 9 6" stroke="currentColor" strokeWidth="2" />
      <path d="M5 10v10h14V10" stroke="currentColor" strokeWidth="2" />
      <path
        d="M8 20v-7M12 20v-7M16 20v-7"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function CupIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M6 8h10v5a5 5 0 01-5 5H9a3 3 0 01-3-3V8z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M16 9h2a2 2 0 010 4h-2" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function SportIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M7 14l4-4 3 3 4-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M5 19h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}