"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import MapGL, { Layer, Popup, Source } from "react-map-gl/mapbox";
import mapboxgl from "mapbox-gl";
import { ExternalLink, MapPin } from "lucide-react";

import {
  ACTIVITY_GROUP_META,
  getActivityGroup,
  getActivityMapGroup,
  getGoogleMapsUrl,
  isValidCoordinate,
} from "@/lib/activity-groups";

const POINT_LAYER_ID = "urlaub-gosch-activity-points";
const ICON_LAYER_ID = "urlaub-gosch-activity-icons";

const MAP_COLORS = {
  familie: ACTIVITY_GROUP_META?.Familie?.mapColor || "#d6a62e",
  natur: ACTIVITY_GROUP_META?.Natur?.mapColor || "#0077b6",
  sport: ACTIVITY_GROUP_META?.Sport?.mapColor || "#0f2742",
  restaurant: ACTIVITY_GROUP_META?.Restaurant?.mapColor || "#d97706",
  kultur: ACTIVITY_GROUP_META?.Kultur?.mapColor || "#6d5b8c",
};

const pointLayer = {
  id: POINT_LAYER_ID,
  type: "circle",
  paint: {
    "circle-radius": [
      "interpolate",
      ["linear"],
      ["zoom"],
      6,
      6.5,
      8,
      8.5,
      10,
      10.5,
      13,
      12,
    ],
    "circle-color": [
      "match",
      ["get", "group"],
      "familie",
      MAP_COLORS.familie,
      "natur",
      MAP_COLORS.natur,
      "sport",
      MAP_COLORS.sport,
      "restaurant",
      MAP_COLORS.restaurant,
      "kultur",
      MAP_COLORS.kultur,
      MAP_COLORS.natur,
    ],
    "circle-opacity": 1,
    "circle-stroke-width": [
      "interpolate",
      ["linear"],
      ["zoom"],
      6,
      1.5,
      10,
      2.5,
    ],
    "circle-stroke-color": "#ffffff",
    "circle-stroke-opacity": 1,
  },
};

const iconLayer = {
  id: ICON_LAYER_ID,
  type: "symbol",
  layout: {
    "icon-image": [
      "match",
      ["get", "group"],
      "familie",
      "ug-family",
      "natur",
      "ug-nature",
      "sport",
      "ug-sport",
      "restaurant",
      "ug-restaurant",
      "kultur",
      "ug-culture",
      "ug-nature",
    ],
    "icon-size": [
      "interpolate",
      ["linear"],
      ["zoom"],
      6,
      0.48,
      8,
      0.58,
      10,
      0.68,
      13,
      0.76,
    ],
    "icon-allow-overlap": true,
    "icon-ignore-placement": true,
  },
  paint: {
    "icon-opacity": 1,
  },
};

const ICON_DEFINITIONS = {
  "ug-family": `
    <circle cx="9" cy="7" r="3.2"/>
    <path d="M3.5 20v-1.2A4.8 4.8 0 0 1 8.3 14h1.4a4.8 4.8 0 0 1 4.8 4.8V20"/>
    <path d="M15.5 4.2a3 3 0 0 1 0 5.8"/>
    <path d="M17.2 14.3a4.5 4.5 0 0 1 3.3 4.3V20"/>
  `,
  "ug-nature": `
    <path d="M19.5 3.5C13 4 7.8 7.2 6.2 11.6c-1.2 3.2.1 6.7 3.2 8.2 3.3 1.6 7.1.1 8.8-3.2 1.7-3.4 1.1-8.1 1.3-13.1Z"/>
    <path d="M4 21c1.8-4.3 5.4-7.7 11.1-10.5"/>
  `,
  "ug-sport": `
    <circle cx="12" cy="12" r="8.5"/>
    <path d="m8.2 5.1 3.8 2.6 3.8-2.6"/>
    <path d="m12 7.7-2.4 3.5 2.4 2.1 3.5-1.8-.8-3.8"/>
    <path d="m9.6 11.2-4.2 1.4"/>
    <path d="m15.5 11.5 3.6 1.8"/>
    <path d="m12 13.3-.7 4.2 3 1.8"/>
  `,
  "ug-restaurant": `
    <path d="M5 3v7"/>
    <path d="M3 3v4"/>
    <path d="M7 3v4"/>
    <path d="M3 7c0 1.7.9 3 2 3s2-1.3 2-3"/>
    <path d="M5 10v11"/>
    <path d="M18 3v18"/>
    <path d="M14.5 3v5.2c0 2.2 1.4 3.8 3.5 3.8"/>
  `,
  "ug-culture": `
    <path d="M3 21h18"/>
    <path d="M5 18h14"/>
    <path d="M6.5 18v-8"/>
    <path d="M10.2 18v-8"/>
    <path d="M13.8 18v-8"/>
    <path d="M17.5 18v-8"/>
    <path d="M4 8h16"/>
    <path d="m12 3 8 4H4l8-4Z"/>
  `,
};

function createSvg(content) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg"
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#ffffff"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round">
      ${content}
    </svg>
  `;
}

function loadSvgImage(svg) {
  return new Promise((resolve, reject) => {
    const image = new Image(28, 28);

    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

async function registerActivityIcons(map) {
  await Promise.all(
    Object.entries(ICON_DEFINITIONS).map(async ([name, content]) => {
      if (map.hasImage(name)) return;

      const image = await loadSvgImage(createSvg(content));

      if (!map.hasImage(name)) {
        map.addImage(name, image, {
          pixelRatio: 2,
        });
      }
    })
  );
}

function getGroupColor(activity) {
  const group = getActivityMapGroup(activity);
  return MAP_COLORS[group] || MAP_COLORS.natur;
}

export default function ActivityMap({
  items = [],
  center = [54.35, 10.13],
  zoom = 9,
}) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const [selectedKey, setSelectedKey] = useState(null);
  const [iconsReady, setIconsReady] = useState(false);

  const safeCenter = useMemo(() => {
    const lat = Number(center?.[0]);
    const lng = Number(center?.[1]);

    return Number.isFinite(lat) && Number.isFinite(lng)
      ? [lat, lng]
      : [54.35, 10.13];
  }, [center]);

  const normalizedItems = useMemo(() => {
    return items
      .filter((item) => isValidCoordinate(item.lat, item.lng))
      .map((item, index) => ({
        ...item,
        lat: Number(item.lat),
        lng: Number(item.lng),
        __mapKey: String(
          item.id ?? item.slug ?? `${item.lat}-${item.lng}-${index}`
        ),
        __group: getActivityMapGroup(item),
      }));
  }, [items]);

  const itemByKey = useMemo(
    () =>
      new Map(
        normalizedItems.map((item) => [item.__mapKey, item])
      ),
    [normalizedItems]
  );

  const geojson = useMemo(
    () => ({
      type: "FeatureCollection",
      features: normalizedItems.map((item) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [item.lng, item.lat],
        },
        properties: {
          key: item.__mapKey,
          group: item.__group,
        },
      })),
    }),
    [normalizedItems]
  );

  const selected = selectedKey ? itemByKey.get(selectedKey) : null;

  if (!token) {
    return (
      <div className="grid h-full min-h-[360px] place-items-center rounded-[1.5rem] border border-[#dbeafe] bg-[#eaf7fb]/70 p-6 text-center text-sm text-slate-600">
        <div>
          <p className="font-bold text-[#050b1f]">
            Mapbox Token fehlt
          </p>

          <p className="mt-2 text-slate-500">
            Bitte{" "}
            <code className="rounded bg-white px-1 py-0.5">
              NEXT_PUBLIC_MAPBOX_TOKEN
            </code>{" "}
            setzen.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[1.5rem] bg-[#eaf7fb]">
      <MapGL
        mapLib={mapboxgl}
        mapboxAccessToken={token}
        initialViewState={{
          latitude: safeCenter[0],
          longitude: safeCenter[1],
          zoom,
        }}
        mapStyle="mapbox://styles/mapbox/outdoors-v12"
        scrollZoom={false}
        dragPan
        doubleClickZoom
        touchZoomRotate
        reuseMaps
        attributionControl
        interactiveLayerIds={[POINT_LAYER_ID]}
        style={{
          width: "100%",
          height: "100%",
        }}
        onLoad={async (event) => {
          try {
            await registerActivityIcons(event.target);
            setIconsReady(true);
          } catch (error) {
            console.error("Aktivitäts-Icons konnten nicht geladen werden:", error);
            setIconsReady(false);
          }
        }}
        onMouseEnter={(event) => {
          event.target.getCanvas().style.cursor = "pointer";
        }}
        onMouseLeave={(event) => {
          event.target.getCanvas().style.cursor = "";
        }}
        onClick={(event) => {
          const feature = event.features?.[0];

          if (!feature) {
            setSelectedKey(null);
            return;
          }

          const key = String(feature.properties?.key || "");
          const item = itemByKey.get(key);

          if (!item) return;

          setSelectedKey(key);
          item.onClick?.();
        }}
      >
        <Source
          id="urlaub-gosch-activities"
          type="geojson"
          data={geojson}
        >
          <Layer {...pointLayer} />

          {iconsReady ? <Layer {...iconLayer} /> : null}
        </Source>

        {selected ? (
          <Popup
            latitude={selected.lat}
            longitude={selected.lng}
            anchor="top"
            closeButton
            closeOnClick={false}
            offset={14}
            onClose={() => setSelectedKey(null)}
            maxWidth="340px"
          >
            <div className="min-w-[235px] overflow-hidden rounded-[1.1rem] bg-white">
              <div className="p-1">
                <div className="flex items-start gap-3">
                  <div
                    className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full text-white shadow-sm ring-2 ring-white"
                    style={{
                      backgroundColor: getGroupColor(selected),
                    }}
                  >
                    <MapPin className="h-4 w-4" />
                  </div>

                  <div className="min-w-0">
                    <p className="line-clamp-2 text-[15px] font-bold leading-5 text-[#050b1f]">
                      {selected.title}
                    </p>

                    <p
                      className="mt-1 text-xs font-bold"
                      style={{
                        color: getGroupColor(selected),
                      }}
                    >
                      {getActivityGroup(selected)}
                    </p>
                  </div>
                </div>

                {selected.shortDescription || selected.description ? (
                  <p className="mt-3 line-clamp-3 text-sm leading-5 text-slate-600">
                    {selected.shortDescription || selected.description}
                  </p>
                ) : null}

                {selected.address ? (
                  <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">
                    {selected.address}
                  </p>
                ) : null}

                {typeof selected.distanceKm === "number" ? (
                  <div className="mt-3 inline-flex rounded-full bg-[#eaf7fb] px-3 py-1.5 text-xs font-bold text-[#075985]">
                    {selected.distanceKm.toFixed(1)} km entfernt
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  {selected.slug ? (
                    <Link
                      href={`/aktivitaeten/${selected.slug}`}
                      className="inline-flex items-center justify-center rounded-full bg-[#050b1f] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#0f172a]"
                    >
                      Mehr erfahren
                    </Link>
                  ) : null}

                  <a
                    href={getGoogleMapsUrl(selected)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(event) => event.stopPropagation()}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#dbeafe] bg-white px-4 py-2 text-xs font-bold text-[#075985] transition hover:border-[#0077b6]/30 hover:bg-[#eaf7fb]"
                  >
                    Route
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </Popup>
        ) : null}
      </MapGL>
    </div>
  );
}