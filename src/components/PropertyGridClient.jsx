"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

import Image from "next/image";
import Link from "next/link";

import { MapPin, Heart, Tag, Check, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { getQuickFilterResults } from "@/lib/quick-filters";

const EMPTY_PROPERTIES = [];

import useFavorites from "@/hooks/useFavorites";

import FavButton from "@/components/FavButton";
import HuggedHeartIcon from "@/components/HuggedHeartIcon";
import LastMinuteBadge from "@/components/LastMinuteBadge";

import {
  getAmenityIcon,
  normalizeAmenityName,
} from "@/lib/amenity-icons";

/*
 * Gibt nur den Straßennamen zurück.
 *
 * Beispiele:
 *
 * "Strandstraße 27"
 * -> "Strandstraße"
 *
 * "Am Deich 12a"
 * -> "Am Deich"
 *
 * "Hauptstraße 12-14"
 * -> "Hauptstraße"
 *
 * "Strandstraße 27, Grömitz"
 * -> "Strandstraße"
 */
function getStreetName(
  address = "",
) {
  const normalized =
    String(address).trim();

  if (!normalized) {
    return "";
  }

  /*
   * Falls zusätzlich Ort / PLZ
   * mit Komma gespeichert wurde,
   * nur den ersten Teil verwenden.
   */
  const streetPart =
    normalized
      .split(",")[0]
      .trim();

  /*
   * Hausnummer am Ende entfernen.
   *
   * Unterstützt z. B.:
   * 12
   * 12a
   * 12 A
   * 12-14
   * 12a-14b
   * 12/14
   */
  return streetPart
    .replace(
      /\s+\d+(?:\s*[a-zA-Z])?(?:\s*[-–/]\s*\d+(?:\s*[a-zA-Z])?)?\s*$/,
      "",
    )
    .trim();
}

function sortByFavoritesFirst(
  list,
  favSet,
) {
  if (
    !favSet ||
    favSet.size === 0
  ) {
    return list;
  }

  return list
    .map(
      (item, index) => ({
        item,
        index,

        isFav: favSet.has(
          String(item.id),
        )
          ? 1
          : 0,
      }),
    )
    .sort((a, b) => {
      if (
        a.isFav !== b.isFav
      ) {
        return (
          b.isFav -
          a.isFav
        );
      }

      return (
        a.index -
        b.index
      );
    })
    .map(
      ({ item }) =>
        item,
    );
}

function QuickFilter({ checked, onChange, label, description, count, icon: Icon, disabled = false }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} disabled={disabled}
      aria-pressed={checked} aria-label={label + (count === null ? ", wird geladen" : ", " + count + " passende Unterkünfte")}
      className={[
        "relative flex min-h-20 items-center gap-3 rounded-xl border p-3 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none",
        checked ? "border-sky-600 bg-sky-50 text-sky-950 shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50/40",
      ].join(" ")}>
      <span aria-hidden="true" className={"flex h-9 w-9 shrink-0 items-center justify-center rounded-lg " + (checked ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-500")}><Icon className="h-4 w-4" /></span>
      <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{label}</span><span className="mt-0.5 block text-[11px] leading-4 text-slate-500">{description}</span></span>
      <span aria-hidden="true" className="flex shrink-0 flex-col items-end gap-1"><span className={"min-w-6 rounded-md px-1.5 py-0.5 text-center text-xs font-bold tabular-nums " + (checked ? "bg-sky-100 text-sky-800" : "bg-slate-100 text-slate-600")}>{count ?? "…"}</span><span className="flex h-4 w-4 items-center justify-center">{checked && <Check className="h-3.5 w-3.5 text-sky-700" />}</span></span>
    </button>
  );
}

export default function PropertyGridClient({
  items,
  showAvailabilityBadge = false,
  controls = true,
  lastMinuteDiscounts = {},
  desktopColumns = 3,
  initialKuschelwochen = false,
}) {
  const router = useRouter();
  const [isUpdating, startTransition] = useTransition();
  const {
    ready,
    favorites,
  } = useFavorites();

  const [
    onlyFavs,
    setOnlyFavs,
  ] = useState(false);

  const [
    favFirst,
    setFavFirst,
  ] = useState(true);

  const [
    onlyLastMinute,
    setOnlyLastMinute,
  ] = useState(false);

  const [
    onlyKuschelwochen,
    setOnlyKuschelwochen,
  ] = useState(
    Boolean(initialKuschelwochen),
  );

  /*
   * Snapshot für die Favoriten-Sortierung.
   *
   * Dadurch springen Karten nicht sofort
   * während eines Favoriten-Klicks herum.
   */
  const [
    favSortSnapshot,
    setFavSortSnapshot,
  ] = useState(
    () => new Set(),
  );

  const snapshotInitializedRef =
    useRef(false);

  const properties =
    Array.isArray(items)
      ? items
      : EMPTY_PROPERTIES;

  /*
   * Auf der Startseite sitzt das Grid
   * zwischen zwei Sidebars.
   *
   * Deshalb dort 2 Spalten.
   */
  const gridClassName =
    desktopColumns === 3
      ? "grid grid-cols-1 gap-5 sm:grid-cols-2"
      : "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3";

  const imageSizes =
    desktopColumns === 2
      ? "(min-width: 1536px) 520px, (min-width: 1280px) 380px, (min-width: 640px) 50vw, 100vw"
      : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw";

  useEffect(() => {
    if (
      !ready ||
      snapshotInitializedRef.current
    ) {
      return;
    }

    setFavSortSnapshot(
      new Set(
        favorites,
      ),
    );

    snapshotInitializedRef.current =
      true;
  }, [
    ready,
    favorites,
  ]);

  function handleFavFirstChange(
    nextChecked,
  ) {
    setFavFirst(
      nextChecked,
    );

    if (
      nextChecked &&
      ready
    ) {
      setFavSortSnapshot(
        new Set(
          favorites,
        ),
      );
    }
  }

  /*
   * Unterstützt jetzt:
   *
   * Prozent:
   * {
   *   discountType: "PERCENT",
   *   discount: 20
   * }
   *
   * Fester Betrag:
   * {
   *   discountType: "FIXED",
   *   discountAmount: 25
   * }
   */
  const lastMinuteMap =
    useMemo(() => {
      const map =
        new Map();

      if (
        !lastMinuteDiscounts ||
        typeof lastMinuteDiscounts !==
          "object"
      ) {
        return map;
      }

      for (const [
        propertyId,
        rawOffer,
      ] of Object.entries(
        lastMinuteDiscounts,
      )) {
        /*
         * Rückwärtskompatibel:
         * alte Form:
         *
         * "21": 20
         */
        if (
          typeof rawOffer ===
            "number" ||
          typeof rawOffer ===
            "string"
        ) {
          const discount =
            Number(
              rawOffer,
            ) || 0;

          if (
            discount > 0
          ) {
            map.set(
              String(
                propertyId,
              ),
              {
                discountType:
                  "PERCENT",

                discount,

                discountAmount:
                  0,
              },
            );
          }

          continue;
        }

        if (
          !rawOffer ||
          typeof rawOffer !==
            "object"
        ) {
          continue;
        }

        const discountType =
          rawOffer.discountType ===
          "FIXED"
            ? "FIXED"
            : "PERCENT";

        const discount =
          Number(
            rawOffer.discount,
          ) || 0;

        const discountAmount =
          Number(
            rawOffer.discountAmount,
          ) || 0;

        const valid =
          discountType ===
          "FIXED"
            ? discountAmount >
              0
            : discount > 0;

        if (!valid) {
          continue;
        }

        map.set(
          String(
            propertyId,
          ),
          {
            discountType,
            discount,
            discountAmount,
          },
        );
      }

      return map;
    }, [
      lastMinuteDiscounts,
    ]);

  const { results, counts } = useMemo(() => getQuickFilterResults(properties, {
    onlyFavs, onlyLastMinute, onlyKuschelwochen, ready, favorites, lastMinuteMap,
  }), [properties, onlyFavs, onlyLastMinute, onlyKuschelwochen, ready, favorites, lastMinuteMap]);

  const filtered = useMemo(() => favFirst && ready
    ? sortByFavoritesFirst(results, favSortSnapshot) : results,
    [results, favFirst, ready, favSortSnapshot]);
  const activeCount = Number(onlyFavs) + Number(onlyLastMinute) + Number(onlyKuschelwochen);

  useEffect(() => {
    setOnlyKuschelwochen(Boolean(initialKuschelwochen));
  }, [initialKuschelwochen]);

  function refreshFavoriteOrder() {
    if (ready) setFavSortSnapshot(new Set(favorites));
  }

  function clearKuschelwochenQuery() {
    if (!initialKuschelwochen) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("kuschelwochen");
    startTransition(() => router.replace(url.pathname + url.search + url.hash, { scroll: false }));
  }

  function resetQuickFilters() {
    setOnlyFavs(false);
    setOnlyLastMinute(false);
    setOnlyKuschelwochen(false);
    refreshFavoriteOrder();
    clearKuschelwochenQuery();
  }

  return (
    <>
      {controls && (
        <section aria-label="Schnellfilter" className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="mb-4 flex min-h-11 items-center justify-between gap-3">
            <div className="flex items-center gap-2"><SlidersHorizontal aria-hidden="true" className="h-4 w-4 text-sky-700" /><h2 className="text-sm font-semibold text-slate-900">Schnellfilter</h2>{activeCount > 0 && <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-800">{activeCount} aktiv</span>}</div>
            {activeCount > 0 && <button type="button" onClick={resetQuickFilters} disabled={isUpdating} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-sky-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500"><RotateCcw className="h-3.5 w-3.5" />Zurücksetzen</button>}
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,190px),1fr))] gap-2">
            <QuickFilter checked={onlyFavs} onChange={(value) => { setOnlyFavs(value); refreshFavoriteOrder(); }} label="Favoriten" description="Ihre gemerkten Unterkünfte" count={ready ? counts.favorites : null} icon={Heart} disabled={!ready} />
            <QuickFilter checked={onlyLastMinute} onChange={(value) => { setOnlyLastMinute(value); refreshFavoriteOrder(); }} label="Last-Minute" description="Unterkünfte mit Angebot" count={counts.lastMinute} icon={Tag} />
            <QuickFilter checked={onlyKuschelwochen} onChange={(value) => { setOnlyKuschelwochen(value); refreshFavoriteOrder(); if (!value) clearKuschelwochenQuery(); }} label="Kuschelwochen" description="Teilnehmende Unterkünfte" count={counts.kuschelwochen} icon={HuggedHeartIcon} disabled={isUpdating} />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-slate-100 pt-3">
            <p role="status" aria-live="polite" aria-atomic="true" className="text-xs text-slate-500">{isUpdating ? "Ergebnisse werden aktualisiert …" : <><strong className="font-semibold tabular-nums text-slate-900">{filtered.length}</strong> von {properties.length} Unterkünften{activeCount > 1 ? " · Filter kombiniert" : ""}</>}</p>
            <label className="inline-flex items-center gap-2 text-xs text-slate-500">Sortierung
              <select value={favFirst ? "favorites" : "default"} disabled={!ready || onlyFavs} onChange={(event) => handleFavFirstChange(event.target.value === "favorites")} className="min-h-10 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:opacity-50">
                <option value="favorites">Favoriten zuerst</option><option value="default">Standardreihenfolge</option>
              </select>
            </label>
          </div>
        </section>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
          <p className="font-semibold text-slate-800">Keine Unterkunft passt zu dieser Auswahl.</p>
          <p className="mt-2 text-sm text-slate-500">{onlyFavs ? "Merken Sie Unterkünfte über das Herz oder entfernen Sie einen Schnellfilter." : "Entfernen Sie einen Schnellfilter oder passen Sie Ihre Suche an."}</p>
          {controls && activeCount > 0 && <button type="button" onClick={resetQuickFilters} disabled={isUpdating} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-500"><RotateCcw className="h-4 w-4" />Schnellfilter zurücksetzen</button>}
        </div>
      ) : (
        <div
          className={
            gridClassName
          }
          aria-label="Ferienunterkünfte"
          aria-busy={isUpdating}
        >
          {filtered.map(
            (property) => {
              const lastMinuteOffer =
                lastMinuteMap.get(
                  String(
                    property.id,
                  ),
                );

              const amenities =
                Array.isArray(
                  property.amenities,
                )
                  ? property.amenities
                  : [];

              const imageUrl =
                getSafeImageUrl(
                  property,
                );

              const streetName =
                getStreetName(
                  property.address,
                );

              return (
                <article
                  key={
                    property.id
                  }
                  className={[
                    "group relative overflow-hidden rounded-2xl bg-white",
                    "border border-slate-200 shadow-sm",
                    "transition-[border-color,box-shadow] duration-200 ease-out",
                    "hover:border-slate-300 hover:shadow-[0_14px_34px_rgba(15,23,42,0.08)]",
                  ].join(
                    " ",
                  )}
                >
                  <FavButton
                    id={
                      property.id
                    }
                    className="absolute right-3 top-3 z-20"
                  />

                  {lastMinuteOffer !=
                    null && (
                    <LastMinuteBadge
                      discountType={
                        lastMinuteOffer.discountType
                      }
                      discount={
                        lastMinuteOffer.discount
                      }
                      discountAmount={
                        lastMinuteOffer.discountAmount
                      }
                    />
                  )}

                  <Link
                    href={`/properties/${property.slug}`}
                    className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60"
                  >
                    <div className="relative overflow-hidden bg-slate-100">
                      {imageUrl ? (
                        <Image
                          src={
                            imageUrl
                          }
                          alt={
                            property
                              .images?.[0]
                              ?.alt ||
                            property.title ||
                            ""
                          }
                          width={
                            640
                          }
                          height={
                            480
                          }
                          sizes={
                            imageSizes
                          }
                          className={[
                            "aspect-[4/3] w-full object-cover",
                            "transition duration-300 ease-out",
                            "group-hover:brightness-[0.97]",
                          ].join(
                            " ",
                          )}
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
                        {
                          property.title
                        }
                      </h3>

                      {property.kuschelwochenEnabled === true && (
                        <span className="mt-2 inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700">
                          Ostsee-Kuschelwochen
                        </span>
                      )}

                      {/* STRASSENNAME OHNE HAUSNUMMER */}

                      {streetName ? (
                        <div className="mt-2 flex items-start gap-1.5 text-sm text-slate-700">
                          <MapPin
                            aria-hidden="true"
                            className="mt-0.5 h-4 w-4 shrink-0 text-sky-600"
                          />

                          <span className="line-clamp-1 font-medium">
                            {
                              streetName
                            }
                          </span>
                        </div>
                      ) : null}

                      {/* ORT */}

                      {property.location ? (
                        <p
                          className={
                            streetName
                              ? "mt-0.5 pl-[22px] text-sm text-slate-500"
                              : "mt-1 text-sm text-slate-600"
                          }
                        >
                          {
                            property.location
                          }
                        </p>
                      ) : null}

                      {amenities.length >
                        0 && (
                        <div className="mt-3 flex items-center gap-2 text-slate-500">
                          {uniqueAmenities(
                            amenities,
                          ).map(
                            (
                              amenity,
                            ) => {
                              const Icon =
                                getAmenityIcon(
                                  amenity.name,
                                );

                              return (
                                <span
                                  key={
                                    amenity.id ??
                                    amenity.name
                                  }
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-50 text-slate-500 ring-1 ring-slate-200/80"
                                  title={
                                    amenity.name
                                  }
                                  aria-label={
                                    amenity.name
                                  }
                                >
                                  <Icon className="h-4 w-4" />
                                </span>
                              );
                            },
                          )}
                        </div>
                      )}

                      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                        <span>
                          {typeof property.maxPersons !==
                          "undefined"
                            ? `bis ${property.maxPersons} Pers.`
                            : ""}
                        </span>

                        <span>
                          {property.dogsAllowed
                            ? "Hunde erlaubt"
                            : "Keine Hunde"}
                        </span>
                      </div>
                    </div>
                  </Link>
                </article>
              );
            },
          )}
        </div>
      )}
    </>
  );
}

function getSafeImageUrl(
  property,
) {
  const url =
    property.images?.[0]
      ?.url;

  if (
    !url ||
    typeof url !==
      "string"
  ) {
    return null;
  }

  return url;
}

function uniqueAmenities(
  amenities,
) {
  const seen =
    new Set();

  const list = [];

  for (
    const amenity of
    amenities
  ) {
    const key =
      normalizeAmenityName(
        amenity?.name,
      );

    if (
      !key ||
      seen.has(key)
    ) {
      continue;
    }

    seen.add(key);

    list.push(
      amenity,
    );

    if (
      list.length >= 6
    ) {
      break;
    }
  }

  return list;
}