"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import ActivityMapClient from "@/components/ActivityMapClient";

export default function ActivitiesExploreClient({ activities, defaultRadiusKm = 25 }) {
  const [category, setCategory] = useState("Alle");
  const [radiusKm, setRadiusKm] = useState(defaultRadiusKm);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(false);
  const [nearby, setNearby] = useState([]);

  const categories = useMemo(() => {
    const set = new Set(activities.map((a) => a.category).filter(Boolean));
    return ["Alle", ...Array.from(set).sort()];
  }, [activities]);

  const filtered = useMemo(() => {
    return activities.filter((a) => (category === "Alle" ? true : a.category === category));
  }, [activities, category]);

  async function onSelectActivity(a) {
    setActive(a);
    setLoading(true);
    setNearby([]);

    try {
        const res = await fetch(
            `/api/properties/nearby?lat=${a.lat}&lng=${a.lng}&radius=${radiusKm}`,
            { cache: "no-store" }
          );
          
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Fehler");
      setNearby(json.items || []);
    } catch (e) {
      console.error(e);
      setNearby([]);
    } finally {
      setLoading(false);
    }
  }

  // wir geben dem Map Items mit click-handler über
  const mapItems = filtered.map((a) => ({
    ...a,
    onClick: () => onSelectActivity(a),
  }));

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Aktivitäten</h1>
            <p className="text-sm text-slate-600">
              Klicke auf ein Ziel – wir zeigen dir passende Unterkünfte in der Nähe.
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

        <ActivityMapClient
          items={mapItems}
          center={[54.35, 10.13]}
          zoom={8}
        />
        <p className="mt-2 text-xs text-slate-500">
          Tipp: Marker anklicken → Unterkünfte erscheinen rechts.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Unterkünfte in der Nähe</h2>
            <p className="text-xs text-slate-600">
              {active ? (
                <>
                  Für <span className="font-semibold">{active.title}</span> • {radiusKm} km Umkreis
                </>
              ) : (
                "Wähle ein Ziel auf der Karte."
              )}
            </p>
          </div>

          {active?.slug ? (
            <Link
              href={`/aktivitaete/${active.slug}`}
              className="text-xs font-semibold text-sky-700 hover:text-sky-600"
            >
              Mehr erfahren →
            </Link>
          ) : null}
        </div>

        <div className="mt-3 space-y-3">
          {loading ? (
            <div className="rounded-xl bg-slate-50 ring-1 ring-black/5 p-4 text-sm text-slate-600">
              Lädt Unterkünfte…
            </div>
          ) : active && nearby.length === 0 ? (
            <div className="rounded-xl bg-slate-50 ring-1 ring-black/5 p-4 text-sm text-slate-600">
              Keine Unterkünfte im Umkreis gefunden.
            </div>
          ) : null}

          {nearby.map((p) => (
            <Link
              key={p.id}
              href={`/properties/${p.slug}`}
              className="block rounded-xl ring-1 ring-black/10 p-3 hover:bg-slate-50"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-slate-900">{p.title}</div>
                  <div className="text-xs text-slate-600">{p.location}</div>
                </div>
                <div className="text-xs font-semibold">{p.distanceKm.toFixed(1)} km</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
