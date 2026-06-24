"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import useFavorites from "@/hooks/useFavorites";
import Link from "next/link";
import Image from "next/image";
import FavButton from "@/components/FavButton";
import LastMinuteBadge from "@/components/LastMinuteBadge";
import { getAmenityIcon, normalizeAmenityName } from "@/lib/amenity-icons";

function sortByFavoritesFirst(list, favSet) {
  if (!favSet || favSet.size === 0) return list;

  return list
    .map((item, index) => ({
      item,
      index,
      isFav: favSet.has(String(item.id)) ? 1 : 0,
    }))
    .sort((a, b) => {
      if (a.isFav !== b.isFav) {
        return b.isFav - a.isFav;
      }

      return a.index - b.index;
    })
    .map(({ item }) => item);
}

function SwitchRow({ checked, onChange, label, disabled = false }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={[
        "inline-flex min-h-11 items-center gap-2 rounded-full border px-3 py-2 text-sm transition",
        checked
          ? "border-sky-200 bg-sky-50 text-sky-800"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
        disabled ? "cursor-not-allowed opacity-60" : "",
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

export default function PropertyGridClient({
  items,
  showAvailabilityBadge = false,
  controls = true,
  lastMinuteDiscounts = {},
}) {
  const { ready, favorites } = useFavorites();

  const [onlyFavs, setOnlyFavs] = useState(false);
  const [favFirst, setFavFirst] = useState(true);
  const [onlyLastMinute, setOnlyLastMinute] = useState(false);

  const [favSortSnapshot, setFavSortSnapshot] = useState(() => new Set());
  const snapshotInitializedRef = useRef(false);

  const properties = Array.isArray(items) ? items : [];

  useEffect(() => {
    if (!ready || snapshotInitializedRef.current) return;

    setFavSortSnapshot(new Set(favorites));
    snapshotInitializedRef.current = true;
  }, [ready, favorites]);

  const handleFavFirstChange = (nextChecked) => {
    setFavFirst(nextChecked);

    if (nextChecked && ready) {
      setFavSortSnapshot(new Set(favorites));
    }
  };

  const lastMinuteMap = useMemo(() => {
    const map = new Map();

    if (!lastMinuteDiscounts || typeof lastMinuteDiscounts !== "object") {
      return map;
    }

    for (const [propertyId, discount] of Object.entries(lastMinuteDiscounts)) {
      const value = Number(discount) || 0;

      if (value > 0) {
        map.set(String(propertyId), value);
      }
    }

    return map;
  }, [lastMinuteDiscounts]);

  const filtered = useMemo(() => {
    let base = properties;

    if (onlyLastMinute) {
      base = base.filter((item) => lastMinuteMap.has(String(item.id)));
    }

    if (onlyFavs && ready) {
      base = base.filter((item) => favorites.has(String(item.id)));
    }

    if (favFirst && ready) {
      return sortByFavoritesFirst(base, favSortSnapshot);
    }

    return base;
  }, [
    properties,
    onlyLastMinute,
    onlyFavs,
    favFirst,
    ready,
    favorites,
    favSortSnapshot,
    lastMinuteMap,
  ]);

  const lastMinuteCount = useMemo(() => {
    let count = 0;

    for (const property of properties) {
      if (lastMinuteMap.has(String(property.id))) {
        count++;
      }
    }

    return count;
  }, [properties, lastMinuteMap]);

  return (
    <>
      {controls && (
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">
                Schnellfilter
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Sortiere die Objekte nach Favoriten oder Last-Minute-Angeboten.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <SwitchRow
                checked={onlyFavs}
                onChange={setOnlyFavs}
                label="Nur Favoriten"
                disabled={!ready}
              />

              <SwitchRow
                checked={favFirst}
                onChange={handleFavFirstChange}
                label="Favoriten zuerst"
                disabled={!ready}
              />

              <SwitchRow
                checked={onlyLastMinute}
                onChange={setOnlyLastMinute}
                label={`Last-Minute (${lastMinuteCount})`}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="rounded-full bg-slate-50 px-3 py-1.5 ring-1 ring-slate-200">
              Angezeigt:{" "}
              <span className="font-semibold text-slate-700">
                {filtered.length}
              </span>
            </span>

            {ready ? (
              <span className="rounded-full bg-slate-50 px-3 py-1.5 ring-1 ring-slate-200">
                Favoriten:{" "}
                <span className="font-semibold text-slate-700">
                  {favorites.size}
                </span>
              </span>
            ) : (
              <span className="rounded-full bg-slate-50 px-3 py-1.5 ring-1 ring-slate-200">
                Favoriten werden geladen …
              </span>
            )}

            <span className="rounded-full bg-slate-50 px-3 py-1.5 ring-1 ring-slate-200">
              Last-Minute:{" "}
              <span className="font-semibold text-slate-700">
                {lastMinuteCount}
              </span>
            </span>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
          Keine Objekte für die Auswahl.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((property) => {
            const discount = lastMinuteMap.get(String(property.id));
            const amenities = Array.isArray(property.amenities)
              ? property.amenities
              : [];
            const imageUrl = getSafeImageUrl(property);

            return (
              <article
                key={property.id}
                className={[
                  "group relative overflow-hidden rounded-2xl bg-white",
                  "border border-slate-200 shadow-sm",
                  "transition-[border-color,box-shadow] duration-200 ease-out",
                  "hover:border-slate-300 hover:shadow-[0_14px_34px_rgba(15,23,42,0.08)]",
                ].join(" ")}
              >
                <FavButton
                  id={property.id}
                  className="absolute right-3 top-3 z-20"
                />

                {discount != null && <LastMinuteBadge discount={discount} />}

                <Link
                  href={`/properties/${property.slug}`}
                  className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60"
                >
                  <div className="relative overflow-hidden bg-slate-100">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={property.images?.[0]?.alt || property.title || ""}
                        width={640}
                        height={480}
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
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
                        {uniqueAmenities(amenities).map((amenity) => {
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
                        })}
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
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

function getSafeImageUrl(property) {
  const url = property.images?.[0]?.url;

  if (!url || typeof url !== "string") {
    return null;
  }

  return url;
}

function uniqueAmenities(amenities) {
  const seen = new Set();
  const list = [];

  for (const amenity of amenities) {
    const key = normalizeAmenityName(amenity?.name);

    if (!key || seen.has(key)) continue;

    seen.add(key);
    list.push(amenity);

    if (list.length >= 6) break;
  }

  return list;
}