"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Image from "next/image";
import Link from "next/link";

import { MapPin } from "lucide-react";

import useFavorites from "@/hooks/useFavorites";

import FavButton from "@/components/FavButton";
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

function SwitchRow({
  checked,
  onChange,
  label,
  disabled = false,
}) {
  return (
    <button
      type="button"
      onClick={() =>
        onChange(!checked)
      }
      disabled={disabled}
      className={[
        "inline-flex min-h-11 items-center gap-2 rounded-full border px-3 py-2 text-sm transition",

        checked
          ? "border-sky-200 bg-sky-50 text-sky-800"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",

        disabled
          ? "cursor-not-allowed opacity-60"
          : "",
      ].join(" ")}
      aria-pressed={
        checked
      }
    >
      <span
        className={[
          "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",

          checked
            ? "bg-sky-600"
            : "bg-slate-300",
        ].join(" ")}
      >
        <span
          className={[
            "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",

            checked
              ? "translate-x-4"
              : "translate-x-1",
          ].join(" ")}
        />
      </span>

      <span className="font-medium">
        {label}
      </span>
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
      : [];

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

  const filtered =
    useMemo(() => {
      let base =
        properties;

      /*
       * Last-Minute:
       * Prozent UND fester Betrag
       */
      if (
        onlyLastMinute
      ) {
        base =
          base.filter(
            (item) =>
              lastMinuteMap.has(
                String(
                  item.id,
                ),
              ),
          );
      }

      /*
       * Ostsee-Kuschelwochen:
       * Nur Objekte anzeigen, bei denen
       * die Teilnahme ausdrücklich aktiviert ist.
       */
      if (
        onlyKuschelwochen
      ) {
        base =
          base.filter(
            (item) =>
              item.kuschelwochenEnabled === true,
          );
      }

      if (
        onlyFavs &&
        ready
      ) {
        base =
          base.filter(
            (item) =>
              favorites.has(
                String(
                  item.id,
                ),
              ),
          );
      }

      if (
        favFirst &&
        ready
      ) {
        return sortByFavoritesFirst(
          base,
          favSortSnapshot,
        );
      }

      return base;
    }, [
      properties,
      onlyLastMinute,
      onlyKuschelwochen,
      onlyFavs,
      favFirst,
      ready,
      favorites,
      favSortSnapshot,
      lastMinuteMap,
    ]);

  const lastMinuteCount =
    useMemo(() => {
      let count = 0;

      for (
        const property of
        properties
      ) {
        if (
          lastMinuteMap.has(
            String(
              property.id,
            ),
          )
        ) {
          count++;
        }
      }

      return count;
    }, [
      properties,
      lastMinuteMap,
    ]);

  const kuschelwochenCount =
    useMemo(
      () =>
        properties.filter(
          (property) =>
            property.kuschelwochenEnabled === true,
        ).length,
      [
        properties,
      ],
    );

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
                Filtere die
                Objekte nach
                Favoriten,
                Last-Minute-Angeboten
                oder Ostsee-Kuschelwochen.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <SwitchRow
                checked={
                  onlyFavs
                }
                onChange={
                  setOnlyFavs
                }
                label="Nur Favoriten"
                disabled={
                  !ready
                }
              />

              <SwitchRow
                checked={
                  favFirst
                }
                onChange={
                  handleFavFirstChange
                }
                label="Favoriten zuerst"
                disabled={
                  !ready
                }
              />

              <SwitchRow
                checked={
                  onlyLastMinute
                }
                onChange={
                  setOnlyLastMinute
                }
                label={`Last-Minute (${lastMinuteCount})`}
              />

              <SwitchRow
                checked={
                  onlyKuschelwochen
                }
                onChange={
                  setOnlyKuschelwochen
                }
                label={`Kuschelwochen (${kuschelwochenCount})`}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="rounded-full bg-slate-50 px-3 py-1.5 ring-1 ring-slate-200">
              Angezeigt:{" "}

              <span className="font-semibold text-slate-700">
                {
                  filtered.length
                }
              </span>
            </span>

            {ready ? (
              <span className="rounded-full bg-slate-50 px-3 py-1.5 ring-1 ring-slate-200">
                Favoriten:{" "}

                <span className="font-semibold text-slate-700">
                  {
                    favorites.size
                  }
                </span>
              </span>
            ) : (
              <span className="rounded-full bg-slate-50 px-3 py-1.5 ring-1 ring-slate-200">
                Favoriten werden
                geladen …
              </span>
            )}

            <span className="rounded-full bg-slate-50 px-3 py-1.5 ring-1 ring-slate-200">
              Last-Minute:{" "}

              <span className="font-semibold text-slate-700">
                {
                  lastMinuteCount
                }
              </span>
            </span>

            <span className="rounded-full bg-slate-50 px-3 py-1.5 ring-1 ring-slate-200">
              Kuschelwochen:{" "}

              <span className="font-semibold text-slate-700">
                {
                  kuschelwochenCount
                }
              </span>
            </span>
          </div>
        </div>
      )}

      {filtered.length ===
      0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
          Keine Objekte für die
          Auswahl.
        </p>
      ) : (
        <div
          className={
            gridClassName
          }
          aria-label="Ferienunterkünfte"
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