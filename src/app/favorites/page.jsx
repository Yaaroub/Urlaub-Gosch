"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import {
  ArrowRight,
  Heart,
  MapPin,
  PawPrint,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";

import useFavorites from "@/hooks/useFavorites";
import FavButton from "@/components/FavButton";

export default function FavoritesPage() {
  const { ready, ids } = useFavorites();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  const idsKey = Array.isArray(ids)
    ? ids.map(String).join(",")
    : "";

  useEffect(() => {
    if (!ready) return undefined;

    const controller = new AbortController();

    async function loadFavorites() {
      const favoriteIds = idsKey
        ? idsKey.split(",").filter(Boolean)
        : [];

      if (favoriteIds.length === 0) {
        setItems([]);
        setError("");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({
          ids: favoriteIds.join(","),
        });

        const response = await fetch(
          `/api/properties/by-ids?${params.toString()}`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(
            `Favoriten konnten nicht geladen werden (${response.status}).`,
          );
        }

        const data = await response.json();

        if (controller.signal.aborted) return;

        const properties = Array.isArray(data)
          ? data
          : [];

        const order = new Map(
          favoriteIds.map((id, index) => [
            String(id),
            index,
          ]),
        );

        properties.sort((a, b) => {
          const aIndex =
            order.get(String(a.id)) ??
            Number.MAX_SAFE_INTEGER;

          const bIndex =
            order.get(String(b.id)) ??
            Number.MAX_SAFE_INTEGER;

          return aIndex - bIndex;
        });

        setItems(properties);
      } catch (requestError) {
        if (
          requestError?.name ===
          "AbortError"
        ) {
          return;
        }

        console.error(
          "Favoriten konnten nicht geladen werden:",
          requestError,
        );

        setItems([]);
        setError(
          "Ihre gespeicherten Unterkünfte konnten gerade nicht geladen werden.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadFavorites();

    return () => {
      controller.abort();
    };
  }, [ready, idsKey, retryKey]);

  useEffect(() => {
    if (!ready) return;

    const allowedIds = new Set(
      idsKey
        ? idsKey.split(",").filter(Boolean)
        : [],
    );

    setItems((currentItems) =>
      currentItems.filter((property) =>
        allowedIds.has(String(property.id)),
      ),
    );
  }, [ready, idsKey]);

  const favoriteCount = items.length;

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f8f8] text-[#07131f]">
      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="relative overflow-hidden border-b border-slate-200/70 bg-[#fbfbfa] px-4 pb-12 pt-32 sm:px-6 sm:pb-14 sm:pt-36 lg:px-8 lg:pb-16">
        <div
          aria-hidden="true"
          className="absolute -right-40 -top-48 h-[34rem] w-[34rem] rounded-full bg-[#ead7b4]/25 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="absolute -bottom-56 -left-40 h-[30rem] w-[30rem] rounded-full bg-sky-100/60 blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 sm:text-sm">
            <Link
              href="/"
              className="transition hover:text-[#07131f]"
            >
              Startseite
            </Link>

            <span aria-hidden="true">/</span>

            <span className="text-slate-600">
              Favoriten
            </span>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#ead7b4] bg-[#fffaf1] px-3.5 py-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#956a28] sm:text-xs">
                <Heart className="h-3.5 w-3.5 fill-current" />
                Ihre Merkliste
              </div>

              <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-[1.04] tracking-[-0.05em] sm:text-5xl lg:text-[3.6rem]">
                Orte zum
                <span className="block font-serif font-normal italic text-[#b9893f]">
                  Wiederfinden.
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-sm leading-7 text-slate-500 sm:text-base">
                Ihre gespeicherten Ferienunterkünfte an der Ostsee –
                übersichtlich gesammelt und jederzeit griffbereit.
              </p>
            </div>

            {!loading &&
            !error &&
            favoriteCount > 0 ? (
              <div className="flex w-fit items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/85 px-4 py-3 shadow-[0_10px_35px_rgba(15,23,42,0.05)] backdrop-blur">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#fff7e8] text-[#b9893f]">
                  <Heart className="h-[18px] w-[18px] fill-current" />
                </div>

                <div>
                  <p className="text-lg font-black leading-none">
                    {favoriteCount}
                  </p>

                  <p className="mt-1 text-[11px] font-medium text-slate-400">
                    {favoriteCount === 1
                      ? "Unterkunft gespeichert"
                      : "Unterkünfte gespeichert"}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <section className="px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-7xl">
          {!ready || loading ? (
            <FavoritesSkeleton />
          ) : null}

          {ready &&
          !loading &&
          error ? (
            <div
              role="alert"
              className="mx-auto max-w-xl rounded-[2rem] border border-red-100 bg-white px-6 py-10 text-center shadow-[0_20px_70px_rgba(15,23,42,0.06)]"
            >
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-red-500">
                <RefreshCw className="h-5 w-5" />
              </div>

              <h2 className="mt-5 text-xl font-bold tracking-tight">
                Favoriten konnten nicht geladen werden
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {error}
              </p>

              <button
                type="button"
                onClick={() =>
                  setRetryKey((value) => value + 1)
                }
                className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#07131f] px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                <RefreshCw className="h-4 w-4" />
                Erneut versuchen
              </button>
            </div>
          ) : null}

          {ready &&
          !loading &&
          !error &&
          favoriteCount === 0 ? (
            <EmptyFavorites />
          ) : null}

          {ready &&
          !loading &&
          !error &&
          favoriteCount > 0 ? (
            <>
              <div className="mb-7 flex flex-col gap-4 border-b border-slate-200/80 pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#a8752c]">
                    Gespeichert
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
                    Ihre Lieblingsunterkünfte
                  </h2>

                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                    Öffnen Sie ein Objekt für alle Details oder
                    entfernen Sie es direkt über das Herz.
                  </p>
                </div>

                <Link
                  href="/#unterkuenfte"
                  className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-[#07131f] shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Weitere Unterkünfte
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div
                className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-7"
                aria-label="Favorisierte Ferienunterkünfte"
              >
                {items.map((property) => (
                  <FavoritePropertyCard
                    key={property.id}
                    property={property}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>
      </section>
    </main>
  );
}

/* ============================================================
   PREMIUM FAVORITE CARD
============================================================ */

function FavoritePropertyCard({ property }) {
  const imageUrl = property?.images?.[0]?.url;
  const imageAlt =
    property?.images?.[0]?.alt ||
    property?.title ||
    "Ferienunterkunft";

  const location =
    property?.location ||
    property?.city ||
    property?.address ||
    "";

  const maxPersons =
    property?.maxPersons != null
      ? Number(property.maxPersons)
      : null;

  const dogsAllowed =
    typeof property?.dogsAllowed === "boolean"
      ? property.dogsAllowed
      : null;

  return (
    <article className="group overflow-hidden rounded-[1.9rem] border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.045)] transition-[box-shadow,border-color] duration-300 hover:border-slate-200/90 hover:shadow-[0_12px_30px_rgba(15,23,42,0.065)]">
      <div className="relative">
        <Link
          href={`/properties/${property.slug}`}
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50"
        >
          <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={imageAlt}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="grid h-full w-full place-items-center bg-gradient-to-br from-slate-100 to-slate-200 text-sm font-medium text-slate-400">
                Kein Bild vorhanden
              </div>
            )}

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#07131f]/45 via-transparent to-black/[0.06]" />

            {location ? (
              <div className="absolute bottom-4 left-4 right-16">
                <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/20 bg-[#07131f]/55 px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg backdrop-blur-md">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">
                    {location}
                  </span>
                </span>
              </div>
            ) : null}
          </div>
        </Link>

        <FavButton
          id={property.id}
          className="absolute right-4 top-4 z-20"
        />
      </div>

      <div className="p-5 sm:p-6">
        <Link
          href={`/properties/${property.slug}`}
          className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40"
        >
          <h3 className="line-clamp-2 text-[1.15rem] font-semibold leading-snug tracking-[-0.025em] text-[#07131f] sm:text-xl">
            {property.title}
          </h3>
        </Link>

        {(maxPersons !== null ||
          dogsAllowed !== null) && (
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-slate-500">
            {maxPersons !== null &&
            Number.isFinite(maxPersons) ? (
              <div className="inline-flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-50 text-slate-500 ring-1 ring-slate-200/80">
                  <Users className="h-3.5 w-3.5" />
                </span>

                <span>
                  bis {maxPersons}{" "}
                  {maxPersons === 1
                    ? "Person"
                    : "Personen"}
                </span>
              </div>
            ) : null}

            {dogsAllowed !== null ? (
              <div className="inline-flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-50 text-slate-500 ring-1 ring-slate-200/80">
                  <PawPrint className="h-3.5 w-3.5" />
                </span>

                <span>
                  {dogsAllowed
                    ? "Hunde willkommen"
                    : "Keine Hunde"}
                </span>
              </div>
            ) : null}
          </div>
        )}

        <div className="mt-5 border-t border-slate-100 pt-4">
          <Link
            href={`/properties/${property.slug}`}
            className="group/link flex items-center justify-between gap-4 rounded-xl py-1 text-sm font-bold text-[#07131f] outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40"
          >
            <span>Unterkunft ansehen</span>

            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#07131f] text-white transition-colors duration-200 group-hover/link:bg-slate-800">
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
      </div>
    </article>
  );
}

/* ============================================================
   EMPTY STATE
============================================================ */

function EmptyFavorites() {
  return (
    <div className="relative overflow-hidden rounded-[2.2rem] border border-slate-200/80 bg-white px-5 py-12 text-center shadow-[0_22px_70px_rgba(15,23,42,0.055)] sm:px-10 sm:py-16">
      <div
        aria-hidden="true"
        className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#ead7b4]/20 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-sky-100/60 blur-3xl"
      />

      <div className="relative mx-auto max-w-xl">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-[#ead7b4] bg-[#fffaf1] text-[#b9893f]">
          <Heart className="h-8 w-8" />
        </div>

        <p className="mt-7 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#a8752c]">
          Noch nichts gespeichert
        </p>

        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
          Ihre persönliche Auswahl
          beginnt hier.
        </h2>

        <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-slate-500">
          Entdecken Sie Ferienwohnungen und Ferienhäuser und
          speichern Sie interessante Objekte einfach mit dem
          Herz-Symbol.
        </p>

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/#unterkuenfte"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#07131f] px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
          >
            Unterkünfte entdecken
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/#suche"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-[#07131f] transition hover:border-slate-300 hover:bg-slate-50"
          >
            <Search className="h-4 w-4" />
            Suche öffnen
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SKELETON
============================================================ */

function FavoritesSkeleton() {
  return (
    <div
      aria-label="Favoriten werden geladen"
      aria-live="polite"
    >
      <div className="mb-7 border-b border-slate-200/80 pb-6">
        <div className="h-3 w-20 animate-pulse rounded-full bg-slate-200" />
        <div className="mt-3 h-8 w-64 max-w-full animate-pulse rounded-xl bg-slate-200" />
        <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded-full bg-slate-100" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-7">
        {Array.from({ length: 4 }).map(
          (_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-[1.9rem] border border-slate-200/80 bg-white shadow-sm"
            >
              <div className="aspect-[16/10] animate-pulse bg-slate-200" />

              <div className="p-6">
                <div className="h-6 w-4/5 animate-pulse rounded-lg bg-slate-200" />
                <div className="mt-5 flex gap-3">
                  <div className="h-8 w-28 animate-pulse rounded-full bg-slate-100" />
                  <div className="h-8 w-28 animate-pulse rounded-full bg-slate-100" />
                </div>
                <div className="mt-5 h-12 animate-pulse rounded-xl border-t border-slate-100 bg-slate-50" />
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}