"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import Map, { Marker, Popup } from "react-map-gl/mapbox";
import { useMemo, useState } from "react";
import mapboxgl from "mapbox-gl";

function groupFromCategory(category = "") {
  const c = category.toLowerCase();

  if (c.includes("natur") || c.includes("schifffahrt") || c.includes("aquarium")) return "natur";
  if (c.includes("familie") || c.includes("indoor")) return "familie";
  if (c.includes("freizeitpark")) return "freizeitpark";
  if (c.includes("museum") || c.includes("kultur") || c.includes("science") || c.includes("planetarium")) return "kultur";
  if (c.includes("kulinarik") || c.includes("brauerei") || c.includes("genuss") || c.includes("manufaktur")) return "genuss";
  if (c.includes("sport") || c.includes("outdoor") || c.includes("reitsport")) return "sport";
  if (c.includes("tier") || c.includes("zoo")) return "tiere";
  if (c.includes("stadt") || c.includes("tour")) return "stadt";

  return "default";
}

const GROUP_STYLE = {
  natur: { bg: "bg-emerald-500", ring: "ring-emerald-400/40", Icon: LeafIcon },
  familie: { bg: "bg-lime-500", ring: "ring-lime-400/40", Icon: FamilyIcon },
  freizeitpark: { bg: "bg-fuchsia-500", ring: "ring-fuchsia-400/40", Icon: SparkIcon },
  kultur: { bg: "bg-indigo-500", ring: "ring-indigo-400/40", Icon: MuseumIcon },
  genuss: { bg: "bg-amber-500", ring: "ring-amber-400/40", Icon: CupIcon },
  sport: { bg: "bg-cyan-500", ring: "ring-cyan-400/40", Icon: SportIcon },
  tiere: { bg: "bg-orange-500", ring: "ring-orange-400/40", Icon: PawIcon },
  stadt: { bg: "bg-slate-800", ring: "ring-slate-400/40", Icon: CityIcon },
  default: { bg: "bg-slate-700", ring: "ring-slate-400/40", Icon: PinIcon },
};

export default function ActivityMap({ items = [], center = [54.35, 10.13], zoom = 9 }) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const [selected, setSelected] = useState(null);

  const initialView = useMemo(
    () => ({ latitude: center[0], longitude: center[1], zoom }),
    [center, zoom]
  );

  if (!token) {
    return (
      <div className="rounded-2xl bg-slate-100 ring-1 ring-black/5 h-[420px] grid place-items-center text-slate-600 text-sm">
        Mapbox Token fehlt:{" "}
        <code className="px-1 py-0.5 bg-white rounded">NEXT_PUBLIC_MAPBOX_TOKEN</code>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden ring-1 ring-black/10">
      <Map
        mapLib={mapboxgl}

        mapboxAccessToken={token}
        initialViewState={initialView}
        mapStyle="mapbox://styles/mapbox/standard"
        scrollZoom
        style={{ width: "100%", height: 420 }}
        onClick={() => setSelected(null)}
      >
        {items.map((a) => {
          const group = groupFromCategory(a.category);
          const st = GROUP_STYLE[group] || GROUP_STYLE.default;
          const Icon = st.Icon;

          return (
            <Marker
              key={a.id}
              latitude={a.lat}
              longitude={a.lng}
              anchor="bottom"
              onClick={(e) => e.originalEvent.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => {
                  a.onClick?.();          // ✅ dein existing handler (nearby load)
                  setSelected(a);         // ✅ optional: Popup zeigen
                }}
                className={[
                  "group relative grid place-items-center",
                  "w-11 h-11 rounded-2xl",
                  "ring-8 ring-white/70 shadow-lg",
                  st.bg,
                  st.ring,
                  "transition hover:-translate-y-0.5 hover:scale-[1.03]",
                ].join(" ")}
                title={`${a.title} • ${a.category}`}
                aria-label={a.title}
              >
                <Icon className="w-5 h-5 text-white drop-shadow" />
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 rounded-sm bg-inherit shadow-md" />
              </button>
            </Marker>
          );
        })}

        {/* Optional Popup – kannst du auch komplett entfernen, wenn du nur Klick brauchst */}
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
            <div className="space-y-1">
              <div className="font-semibold">{selected.title}</div>
              <div className="text-sm opacity-80">{selected.category}</div>
              {selected.description ? <div className="text-sm">{selected.description}</div> : null}
              {typeof selected.distanceKm === "number" ? (
                <div className="text-sm font-medium">{selected.distanceKm.toFixed(1)} km entfernt</div>
              ) : null}
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}

/* --- Icons (leicht & clean) --- */
function PinIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M12 21s7-6 7-12a7 7 0 10-14 0c0 6 7 12 7 12z" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="9" r="2.2" fill="currentColor" />
    </svg>
  );
}
function LeafIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M20 4s-7 0-11 4-4 11-4 11 7 0 11-4 4-11 4-11z" stroke="currentColor" strokeWidth="2" />
      <path d="M9 15c2-2 6-6 11-11" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function FamilyIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M7 10a2 2 0 110-4 2 2 0 010 4zm10 0a2 2 0 110-4 2 2 0 010 4z" fill="currentColor" />
      <path d="M4 18v-2c0-2 2-4 3-4s3 2 3 4v2H4zm10 0v-2c0-2 2-4 3-4s3 2 3 4v2h-6z" fill="currentColor" opacity="0.9" />
    </svg>
  );
}
function SparkIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M12 2l1.5 6L20 10l-6.5 2L12 22l-1.5-10L4 10l6.5-2L12 2z" fill="currentColor" />
    </svg>
  );
}
function MuseumIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M3 10l9-6 9 6" stroke="currentColor" strokeWidth="2" />
      <path d="M5 10v10h14V10" stroke="currentColor" strokeWidth="2" />
      <path d="M8 20v-7M12 20v-7M16 20v-7" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function CupIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M6 8h10v5a5 5 0 01-5 5H9a3 3 0 01-3-3V8z" stroke="currentColor" strokeWidth="2" />
      <path d="M16 9h2a2 2 0 010 4h-2" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function SportIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M7 14l4-4 3 3 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M5 19h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function PawIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M8.5 11.5c-1.1 0-2-1-2-2.2S7.4 7 8.5 7s2 1 2 2.3-0.9 2.2-2 2.2zm7 0c-1.1 0-2-1-2-2.2S14.4 7 15.5 7s2 1 2 2.3-0.9 2.2-2 2.2z" fill="currentColor" />
      <path d="M12 13c-2.6 0-5 1.6-5 4.1C7 19.1 9 21 12 21s5-1.9 5-3.9C17 14.6 14.6 13 12 13z" fill="currentColor" opacity="0.9" />
    </svg>
  );
}
function CityIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M4 20V6l6-2v16H4zm10 0V4l6 2v14h-6z" stroke="currentColor" strokeWidth="2" />
      <path d="M7 10h1M7 13h1M7 16h1M16 10h1M16 13h1M16 16h1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
