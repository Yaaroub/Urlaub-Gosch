"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { haversineKm, withinBoundingBox } from "@/lib/geo";

const ActivityMap = dynamic(() => import("@/components/ActivityMap"), { ssr: false });

export default function NearbyActivities({
  property,          // { lat, lng, title? }
  activities = [],   // alle Aktivitäten
  defaultRadiusKm = 30,
}) {
  const [radiusKm, setRadiusKm] = useState(defaultRadiusKm);
  const categories = useMemo(() => {
    const set = new Set(activities.map((a) => a.category).filter(Boolean));
    return ["Alle", ...Array.from(set).sort()];
  }, [activities]);

  const [category, setCategory] = useState("Alle");

  const nearby = useMemo(() => {
    const centerLat = property?.lat;
    const centerLng = property?.lng;
    if (typeof centerLat !== "number" || typeof centerLng !== "number") return [];

    return activities
      .filter((a) => typeof a.lat === "number" && typeof a.lng === "number")
      .filter((a) => withinBoundingBox(a.lat, a.lng, centerLat, centerLng, radiusKm))
      .map((a) => ({
        ...a,
        distanceKm: haversineKm(centerLat, centerLng, a.lat, a.lng),
      }))
      .filter((a) => a.distanceKm <= radiusKm)
      .filter((a) => category === "Alle" ? true : a.category === category)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [activities, property?.lat, property?.lng, radiusKm, category]);

  return (
    <section className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-end gap-3">
        <div className="flex-1">
          <h2 className="text-xl font-semibold">Aktivitäten in deiner Nähe</h2>
          <p className="text-slate-600 text-sm">
            Rund um {property?.title ?? "deine Unterkunft"} im Umkreis von {radiusKm} km.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <label className="text-sm">
            <div className="text-slate-600 mb-1">Kategorie</div>
            <select
              className="rounded-xl ring-1 ring-black/10 px-3 py-2 bg-white"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <div className="text-slate-600 mb-1">Radius: {radiusKm} km</div>
            <input
              className="w-56"
              type="range"
              min={5}
              max={80}
              step={5}
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
            />
          </label>
        </div>
      </div>

      {/* Map */}
      <ActivityMap
        items={nearby}
        center={[property.lat, property.lng]}
        zoom={11}
      />

      {/* Liste */}
      <div className="grid md:grid-cols-2 gap-3">
        {nearby.length === 0 ? (
          <div className="rounded-2xl p-4 bg-slate-50 ring-1 ring-black/10 text-slate-600">
            Keine Aktivitäten im aktuellen Filter/Radius gefunden.
          </div>
        ) : (
          nearby.map((a) => (
            <div key={a.id} className="rounded-2xl p-4 ring-1 ring-black/10 bg-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{a.title}</div>
                  <div className="text-sm text-slate-600">{a.category}</div>
                </div>
                <div className="text-sm font-medium">
                  {a.distanceKm.toFixed(1)} km
                </div>
              </div>

              {a.description ? (
                <p className="text-sm text-slate-700 mt-2">{a.description}</p>
              ) : null}

              {a.website ? (
                <a className="text-sm underline mt-2 inline-block" href={a.website} target="_blank" rel="noreferrer">
                  Website
                </a>
              ) : null}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
