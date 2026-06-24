"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Map, { Marker, Popup } from "react-map-gl/mapbox";
import mapboxgl from "mapbox-gl";
import { ExternalLink } from "lucide-react";
import { getActivityGroup, getGoogleMapsUrl } from "@/lib/activity-groups";

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
    bg: "bg-[#c49a3a]",
    text: "text-[#7a5b18]",
    chip: "bg-[#f7f1e5] ring-[#ead9b6]",
    activeChip: "bg-[#c49a3a] text-white ring-[#c49a3a]",
    Icon: FamilyIcon,
  },
  natur: {
    bg: "bg-[#0077b6]",
    text: "text-[#075985]",
    chip: "bg-[#eaf7fb] ring-[#bae6fd]",
    activeChip: "bg-[#0077b6] text-white ring-[#0077b6]",
    Icon: LeafIcon,
  },
  sport: {
    bg: "bg-[#050b1f]",
    text: "text-[#050b1f]",
    chip: "bg-slate-50 ring-slate-200",
    activeChip: "bg-[#050b1f] text-white ring-[#050b1f]",
    Icon: SportIcon,
  },
  restaurant: {
    bg: "bg-[#b8791c]",
    text: "text-orange-800",
    chip: "bg-orange-50 ring-orange-200",
    activeChip: "bg-[#b8791c] text-white ring-[#b8791c]",
    Icon: CupIcon,
  },
  kultur: {
    bg: "bg-[#475569]",
    text: "text-slate-700",
    chip: "bg-slate-100 ring-slate-200",
    activeChip: "bg-[#475569] text-white ring-[#475569]",
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

  const safeCenter = useMemo(() => {
    const lat = Number(center?.[0]);
    const lng = Number(center?.[1]);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return [54.35, 10.13];
    }

    return [lat, lng];
  }, [center]);

  const initialView = useMemo(
    () => ({
      latitude: safeCenter[0],
      longitude: safeCenter[1],
      zoom,
    }),
    [safeCenter, zoom]
  );

  const normalizedItems = useMemo(() => {
    return items
      .filter((item) => isValidCoordinate(item.lat, item.lng))
      .map((item) => ({
        ...item,
        lat: Number(item.lat),
        lng: Number(item.lng),
        group: toMapGroup(getActivityGroup(item)),
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
      <div className="grid h-full min-h-[360px] place-items-center rounded-2xl bg-[#eaf7fb] p-6 text-center text-sm text-slate-600 ring-1 ring-[#0077b6]/10">
        <div>
          <p className="font-semibold text-[#050b1f]">Mapbox Token fehlt</p>
          <p className="mt-2 text-slate-500">
            Bitte in deiner{" "}
            <code className="rounded bg-white px-1 py-0.5">.env</code> Datei
            setzen:
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
        <div className="absolute left-3 right-3 top-3 z-10 rounded-2xl border border-white/70 bg-white/90 p-3 shadow-xl shadow-[#050b1f]/10 backdrop-blur-xl">
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            {FILTERS.map((filter) => {
              const active = activeFilter === filter.key;

              const style =
                filter.key === "all"
                  ? {
                      chip: "bg-white ring-[#dbeafe]",
                      text: "text-[#0f172a]",
                      activeChip: "bg-[#050b1f] text-white ring-[#050b1f]",
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
                    "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-bold ring-1 transition",
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
        mapStyle="mapbox://styles/mapbox/outdoors-v12"
        scrollZoom={false}
        dragPan
        doubleClickZoom
        touchZoomRotate
        reuseMaps
        style={{ width: "100%", height: "100%" }}
        onClick={() => setSelected(null)}
        attributionControl={true}
      >
        {visibleItems.map((activity) => {
          const style = GROUP_STYLE[activity.group] || GROUP_STYLE.natur;
          const Icon = style.Icon;

          return (
            <Marker
              key={
                activity.id ??
                activity.slug ??
                `${activity.lat}-${activity.lng}`
              }
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
                  "relative grid h-10 w-10 place-items-center rounded-full",
                  "ring-[3px] ring-white shadow-lg shadow-[#050b1f]/25",
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
            <div className="min-w-[220px] space-y-3 rounded-xl">
              <div>
                <p className="text-sm font-bold text-[#050b1f]">
                  {selected.title}
                </p>

                <p className="mt-0.5 text-xs font-medium text-slate-500">
                  {selected.category}
                </p>
              </div>

              {selected.shortDescription || selected.description ? (
                <p className="line-clamp-4 text-sm leading-5 text-slate-700">
                  {selected.shortDescription || selected.description}
                </p>
              ) : null}

              {typeof selected.distanceKm === "number" ? (
                <p className="rounded-full bg-[#eaf7fb] px-3 py-1.5 text-xs font-bold text-[#075985]">
                  {selected.distanceKm.toFixed(1)} km entfernt
                </p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {selected.slug ? (
                  <Link
                    href={`/aktivitaeten/${selected.slug}`}
                    className="inline-flex rounded-full bg-[#050b1f] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#0f172a]"
                  >
                    Details ansehen
                  </Link>
                ) : null}

                <a
                  href={getGoogleMapsUrl(selected)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => event.stopPropagation()}
                  className="inline-flex items-center gap-1 rounded-full border border-[#dbeafe] bg-white px-3 py-1.5 text-xs font-bold text-[#075985] transition hover:bg-[#eaf7fb]"
                >
                  Google Maps
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <p className="text-[11px] leading-4 text-slate-400">
                Tipp: Die Karte zoomt nicht beim Scrollen. Zum Zoomen bitte die
                Kartensteuerung oder Touch-Gesten nutzen.
              </p>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}

function toMapGroup(group) {
  const value = String(group || "").toLowerCase();

  if (value === "familie") return "familie";
  if (value === "natur") return "natur";
  if (value === "sport") return "sport";
  if (value === "restaurant") return "restaurant";
  if (value === "kultur") return "kultur";

  return "natur";
}

function isValidCoordinate(lat, lng) {
  return Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
}

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
      <path d="M5 10h14" stroke="currentColor" strokeWidth="2" />
      <path
        d="M6 10v8M10 10v8M14 10v8M18 10v8"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M4 20h16" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function SportIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M7 17l10-10M8 7h9v9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M5 19c4-1 7-4 8-8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );
}

function CupIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M6 8h10v5a5 5 0 01-10 0V8z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M16 9h1.5a2.5 2.5 0 010 5H16"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M5 20h12" stroke="currentColor" strokeWidth="2" />
      <path d="M8 4v2M12 4v2M16 4v2" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}