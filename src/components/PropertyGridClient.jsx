"use client";

import { useEffect, useMemo, useState } from "react";
import useFavorites from "@/hooks/useFavorites";
import Link from "next/link";
import Image from "next/image";
import FavButton from "@/components/FavButton";
import LastMinuteBadge from "./LastMinuteBadge";

/** Favoriten nach oben sortieren (sekundär nach Titel) */
function sortByFavoritesFirst(list, favSet) {
  if (!favSet || favSet.size === 0) return list;
  const arr = [...list];
  arr.sort((a, b) => {
    const af = favSet.has(String(a.id)) ? 1 : 0;
    const bf = favSet.has(String(b.id)) ? 1 : 0;
    if (af !== bf) return bf - af;
    return (a.title || "").localeCompare(b.title || "", "de");
  });
  return arr;
}

/**
 * props:
 * - items: Array<{ id, slug, title, location, maxPersons, dogsAllowed, images:[{url,alt}] }>
 * - showAvailabilityBadge?: boolean
 * - controls?: boolean (zeigt Filter/Sort Controls)
 */
export default function PropertyGridClient({
  items,
  showAvailabilityBadge = false,
  controls = true,
}) {
  const { ready, favorites } = useFavorites();
  const [onlyFavs, setOnlyFavs] = useState(false);
  const [favFirst, setFavFirst] = useState(true);

  // aktive Last-Minute-Angebote laden
  const [offers, setOffers] = useState([]);
  useEffect(() => {
    let alive = true;
    fetch("/api/lastminute", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (alive) setOffers(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Map: propertyId -> max. discount
  const byProp = useMemo(() => {
    const m = new Map();
    for (const o of offers) {
      const pid = String(o.propertyId);
      const current = m.get(pid) ?? 0;
      const d = Number(o.discount) || 0;
      if (d > current) m.set(pid, d);
    }
    return m;
  }, [offers]);

  // Filtern + Sortieren
  const filtered = useMemo(() => {
    const base =
      onlyFavs && ready
        ? items.filter((i) => favorites.has(String(i.id)))
        : items;
    return favFirst && ready ? sortByFavoritesFirst(base, favorites) : base;
  }, [items, onlyFavs, favFirst, ready, favorites]);

  return (
    <>
      {controls && (
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={onlyFavs}
              onChange={(e) => setOnlyFavs(e.target.checked)}
            />
            Nur Favoriten
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={favFirst}
              onChange={(e) => setFavFirst(e.target.checked)}
            />
            Favoriten zuerst
          </label>
          {ready && (
            <span className="text-xs text-slate-500">
              Favoriten: {favorites.size}
            </span>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-slate-500">Keine Objekte für die Auswahl.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const discount = byProp.get(String(p.id));

            return (
              <Link
                key={p.id}
                href={`/properties/${p.slug}`}
                className={`
                  relative block
                  rounded-2xl border border-slate-200 bg-white
                  shadow-sm
                  transition-all duration-300 ease-out
                  hover:-translate-y-1 hover:shadow-lg
                  overflow-hidden
                `}
              >
                {/* Herz / Favorit */}
                <FavButton
                  id={p.id}
                  className="absolute right-3 top-3 z-10"
                />

                {/* Last-Minute Badge falls vorhanden */}
                {discount != null && (
                  <LastMinuteBadge discount={discount} />
                )}

                {/* Bildbereich */}
                <div className="relative">
                  {p.images?.[0]?.url ? (
                    <Image
                      src={p.images[0].url}
                      alt={p.images[0].alt || p.title}
                      width={800}
                      height={600}
                      className={`
                        w-full aspect-[4/3] object-cover
                        rounded-t-2xl
                      `}
                    />
                  ) : (
                    <div className="w-full aspect-[4/3] rounded-t-2xl bg-slate-100 grid place-items-center text-slate-400 text-sm">
                      Kein Bild
                    </div>
                  )}

                  {showAvailabilityBadge && (
                    <span className="absolute left-3 top-3 rounded-full bg-emerald-600 text-white text-xs px-2 py-1 shadow">
                      Verfügbar
                    </span>
                  )}
                </div>

                {/* Textbereich */}
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900 leading-snug">
                    {p.title}
                  </h3>
                  <p className="text-sm text-slate-600">{p.location}</p>

                  {typeof p.maxPersons !== "undefined" && (
                    <p className="text-xs text-slate-500 mt-1">
                      bis {p.maxPersons} Pers. • Hunde{" "}
                      {p.dogsAllowed ? "erlaubt" : "nicht"}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
