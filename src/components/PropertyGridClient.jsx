"use client";

import { useEffect, useMemo, useState } from "react";
import useFavorites from "@/hooks/useFavorites";
import Link from "next/link";
import Image from "next/image";
import FavButton from "@/components/FavButton";
import LastMinuteBadge from "./LastMinuteBadge";
import { getAmenityIcon, normalizeAmenityName } from "@/lib/amenity-icons";

/** Favoriten nach oben sortieren, sekundär nach Titel */
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
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition",
        checked
          ? "border-sky-200 bg-sky-50 text-sky-800"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
      ].join(" ")}
      aria-pressed={checked}
    >
      <span
        className={[
          "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
          checked ? "bg-sky-600" : "bg-slate-300",
        ].join(" ")}
      >
        <span
          className={[
            "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
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
 * - items: Array<{ id, slug, title, location, maxPersons, dogsAllowed, images:[{url,alt}], amenities:[] }>
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
  const [onlyLastMinute, setOnlyLastMinute] = useState(false);

  const [offers, setOffers] = useState([]);

  useEffect(() => {
    let alive = true;

    async function loadOffers() {
      try {
        const res = await fetch("/api/lastminute", {
          cache: "no-store",
        });

        const data = res.ok ? await res.json() : [];

        if (alive) {
          setOffers(Array.isArray(data) ? data : []);
        }
      } catch {
        if (alive) {
          setOffers([]);
        }
      }
    }

    loadOffers();

    return () => {
      alive = false;
    };
  }, []);

  const byProp = useMemo(() => {
    const map = new Map();

    for (const offer of offers) {
      const propertyId = String(offer.propertyId);
      const currentDiscount = map.get(propertyId) ?? 0;
      const discount = Number(offer.discount) || 0;

      if (discount > currentDiscount) {
        map.set(propertyId, discount);
      }
    }

    return map;
  }, [offers]);

  const filtered = useMemo(() => {
    let base = Array.isArray(items) ? items : [];

    if (onlyLastMinute) {
      base = base.filter((item) => byProp.has(String(item.id)));
    }

    if (onlyFavs && ready) {
      base = base.filter((item) => favorites.has(String(item.id)));
    }

    return favFirst && ready ? sortByFavoritesFirst(base, favorites) : base;
  }, [items, onlyLastMinute, onlyFavs, favFirst, ready, favorites, byProp]);

  const lastMinuteCount = useMemo(() => {
    if (!Array.isArray(items) || items.length === 0) return 0;

    let count = 0;

    for (const property of items) {
      if (byProp.has(String(property.id))) count++;
    }

    return count;
  }, [items, byProp]);

  return (
    <>
      {controls && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
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

            <SwitchRow
              checked={onlyLastMinute}
              onChange={setOnlyLastMinute}
              label={`Last-Minute (${lastMinuteCount})`}
            />
          </div>

          {ready && (
            <span className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500 ring-1 ring-slate-200">
              Favoriten:{" "}
              <span className="font-semibold text-slate-700">
                {favorites.size}
              </span>
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
          {filtered.map((property) => {
            const discount = byProp.get(String(property.id));

            const amenities = Array.isArray(property.amenities)
              ? property.amenities
              : [];

            return (
              <Link
                key={property.id}
                href={`/properties/${property.slug}`}
                className={[
                  "group relative overflow-hidden rounded-2xl bg-white",
                  "border border-slate-200 shadow-sm",
                  "transition-[border-color,box-shadow] duration-200 ease-out",
                  "hover:border-slate-300 hover:shadow-[0_14px_34px_rgba(15,23,42,0.08)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60",
                ].join(" ")}
              >
                <FavButton
                  id={property.id}
                  className="absolute right-3 top-3 z-10"
                />

                {discount != null && <LastMinuteBadge discount={discount} />}

                <div className="relative overflow-hidden bg-slate-100">
                  {property.images?.[0]?.url ? (
                    <Image
                      src={property.images[0].url}
                      alt={property.images[0].alt || property.title}
                      width={900}
                      height={675}
                      className={[
                        "aspect-[4/3] w-full object-cover",
                        "transition duration-300 ease-out",
                        "group-hover:brightness-[0.97]",
                      ].join(" ")}
                    />
                  ) : (
                    <div className="grid aspect-[4/3] w-full place-items-center bg-slate-100 text-sm text-slate-400">
                      Kein Bild
                    </div>
                  )}

                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/[0.10] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  {showAvailabilityBadge && (
                    <span className="absolute left-3 top-3 rounded-full bg-emerald-600 px-2 py-1 text-xs font-medium text-white shadow-sm">
                      Verfügbar
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="line-clamp-2 text-base font-semibold leading-snug text-slate-900 transition-colors duration-200 group-hover:text-slate-950">
                    {property.title}
                  </h3>

                  <p className="mt-1 text-sm text-slate-600">
                    {property.location}
                  </p>

                  {amenities.length > 0 && (
                    <div className="mt-3 flex items-center gap-2 text-slate-500">
                      {(() => {
                        const seen = new Set();
                        const list = [];

                        for (const amenity of amenities) {
                          const key = normalizeAmenityName(amenity?.name);

                          if (!key || seen.has(key)) continue;

                          seen.add(key);
                          list.push(amenity);

                          if (list.length >= 6) break;
                        }

                        return list.map((amenity) => {
                          const Icon = getAmenityIcon(amenity.name);

                          return (
                            <span
                              key={amenity.id ?? amenity.name}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-50 text-slate-500 ring-1 ring-slate-200/80"
                              title={amenity.name}
                              aria-label={amenity.name}
                            >
                              <Icon className="h-4 w-4" />
                            </span>
                          );
                        });
                      })()}
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                    <span>
                      {typeof property.maxPersons !== "undefined"
                        ? `bis ${property.maxPersons} Pers.`
                        : ""}
                    </span>

                    <span>
                      {property.dogsAllowed ? "Hunde erlaubt" : "Keine Hunde"}
                    </span>
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