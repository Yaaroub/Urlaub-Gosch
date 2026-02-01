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

function SwitchRow({ checked, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
      aria-pressed={checked}
    >
      <span
        className={[
          "relative inline-flex h-5 w-9 items-center rounded-full transition",
          checked ? "bg-sky-600" : "bg-slate-300",
        ].join(" ")}
      >
        <span
          className={[
            "inline-block h-4 w-4 rounded-full bg-white transition",
            checked ? "translate-x-4" : "translate-x-1",
          ].join(" ")}
        />
      </span>
      <span className="font-medium">{label}</span>
    </button>
  );
}

/**
 * props:
 * - items: Array<{ id, slug, title, location, maxPersons, dogsAllowed, images:[{url,alt}] }>
 * - showAvailabilityBadge?: boolean
 * - controls?: boolean
 */
export default function PropertyGridClient({
  items,
  showAvailabilityBadge = false,
  controls = true,
}) {
  const { ready, favorites } = useFavorites();
  const [onlyFavs, setOnlyFavs] = useState(false);
  const [favFirst, setFavFirst] = useState(true);
  const [onlyLastMinute, setOnlyLastMinute] = useState(false); // ✅ NEU

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
    let base = items;

    // ✅ Last-Minute Filter (nur Objekte mit Discount)
    if (onlyLastMinute) {
      base = base.filter((i) => byProp.has(String(i.id)));
    }

    // Favoriten Filter
    if (onlyFavs && ready) {
      base = base.filter((i) => favorites.has(String(i.id)));
    }

    // Sortierung Favoriten zuerst
    return favFirst && ready ? sortByFavoritesFirst(base, favorites) : base;
  }, [items, onlyLastMinute, onlyFavs, favFirst, ready, favorites, byProp]);

  const lastMinuteCount = useMemo(() => {
    if (!items?.length) return 0;
    let c = 0;
    for (const p of items) if (byProp.has(String(p.id))) c++;
    return c;
  }, [items, byProp]);

  return (
    <>
      {controls && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <SwitchRow
              checked={onlyFavs}
              onChange={setOnlyFavs}
              label="Nur Favoriten"
            />
            <SwitchRow
              checked={favFirst}
              onChange={setFavFirst}
              label="Favoriten zuerst"
            />

            {/* ✅ NEU: Last-Minute Switch */}
            <SwitchRow
              checked={onlyLastMinute}
              onChange={setOnlyLastMinute}
              label={`Last-Minute (${lastMinuteCount})`}
            />
          </div>

          {ready && (
            <span className="text-xs text-slate-500">
              Favoriten: <span className="font-semibold">{favorites.size}</span>
            </span>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
          Keine Objekte für die Auswahl.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const discount = byProp.get(String(p.id));

            return (
              <Link
                key={p.id}
                href={`/properties/${p.slug}`}
                className={[
                  "group relative overflow-hidden rounded-2xl bg-white",
                  "border border-slate-200 shadow-sm",
                  "transition hover:shadow-md hover:-translate-y-0.5",
                ].join(" ")}
              >
                {/* Badges */}
                <FavButton id={p.id} className="absolute right-3 top-3 z-10" />
                {discount != null && <LastMinuteBadge discount={discount} />}

                {/* Image */}
                <div className="relative">
                  {p.images?.[0]?.url ? (
                    <Image
                      src={p.images[0].url}
                      alt={p.images[0].alt || p.title}
                      width={900}
                      height={675}
                      className="w-full aspect-[4/3] object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="w-full aspect-[4/3] bg-slate-100 grid place-items-center text-slate-400 text-sm">
                      Kein Bild
                    </div>
                  )}

                  {showAvailabilityBadge && (
                    <span className="absolute left-3 top-3 rounded-full bg-emerald-600 text-white text-xs px-2 py-1 shadow">
                      Verfügbar
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-base font-semibold text-slate-900 leading-snug">
                    {p.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">{p.location}</p>

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {typeof p.maxPersons !== "undefined"
                        ? `bis ${p.maxPersons} Pers.`
                        : ""}
                    </span>
                    <span>{p.dogsAllowed ? "Hunde erlaubt" : "Keine Hunde"}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
