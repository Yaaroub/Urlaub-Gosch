"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Compass,
  ExternalLink,
  Filter,
  MapPin,
  Navigation,
  SearchX,
  SlidersHorizontal,
} from "lucide-react";
import { haversineKm, withinBoundingBox } from "@/lib/geo";

const ActivityMapClient = dynamic(() => import("@/components/ActivityMapClient"), {
  ssr: false,
  loading: () => (
    <div className="grid h-[420px] place-items-center rounded-3xl bg-slate-100 text-sm text-slate-500 ring-1 ring-black/5">
      Karte wird geladen …
    </div>
  ),
});

function groupFromCategory(category = "") {
  const c = String(category).toLowerCase();

  if (
    c.includes("familie") ||
    c.includes("indoor") ||
    c.includes("freizeitpark") ||
    c.includes("tier") ||
    c.includes("zoo") ||
    c.includes("aquarium")
  ) {
    return "Familie";
  }

  if (
    c.includes("sport") ||
    c.includes("outdoor") ||
    c.includes("reitsport") ||
    c.includes("klettern") ||
    c.includes("wandern")
  ) {
    return "Sport";
  }

  if (
    c.includes("kulinarik") ||
    c.includes("restaurant") ||
    c.includes("café") ||
    c.includes("cafe") ||
    c.includes("brauerei") ||
    c.includes("genuss") ||
    c.includes("manufaktur")
  ) {
    return "Restaurant";
  }

  if (
    c.includes("museum") ||
    c.includes("kultur") ||
    c.includes("science") ||
    c.includes("planetarium") ||
    c.includes("stadt") ||
    c.includes("tour")
  ) {
    return "Kultur";
  }

  return "Natur";
}

const FILTERS = ["Alle", "Familie", "Natur", "Sport", "Restaurant", "Kultur"];

export default function NearbyActivities({
  property,
  activities = [],
  defaultRadiusKm = 30,
  maxListItems = 12,
}) {
  const [radiusKm, setRadiusKm] = useState(defaultRadiusKm);
  const [category, setCategory] = useState("Alle");

  const centerLat = Number(property?.lat);
  const centerLng = Number(property?.lng);
  const hasValidCenter = Number.isFinite(centerLat) && Number.isFinite(centerLng);

  const propertyTitle = property?.title || "deiner Unterkunft";

  const normalizedActivities = useMemo(() => {
    return activities
      .filter((activity) => {
        return Number.isFinite(Number(activity.lat)) && Number.isFinite(Number(activity.lng));
      })
      .map((activity) => ({
        ...activity,
        lat: Number(activity.lat),
        lng: Number(activity.lng),
        group: groupFromCategory(activity.category),
      }));
  }, [activities]);

  const nearby = useMemo(() => {
    if (!hasValidCenter) return [];

    return normalizedActivities
      .filter((activity) =>
        withinBoundingBox(activity.lat, activity.lng, centerLat, centerLng, radiusKm)
      )
      .map((activity) => ({
        ...activity,
        distanceKm: haversineKm(centerLat, centerLng, activity.lat, activity.lng),
      }))
      .filter((activity) => activity.distanceKm <= radiusKm)
      .filter((activity) => category === "Alle" || activity.group === category)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [normalizedActivities, hasValidCenter, centerLat, centerLng, radiusKm, category]);

  const counts = useMemo(() => {
    const result = Object.fromEntries(FILTERS.map((filter) => [filter, 0]));
    result.Alle = 0;

    if (!hasValidCenter) return result;

    for (const activity of normalizedActivities) {
      if (!withinBoundingBox(activity.lat, activity.lng, centerLat, centerLng, radiusKm)) {
        continue;
      }

      const distanceKm = haversineKm(centerLat, centerLng, activity.lat, activity.lng);
      if (distanceKm > radiusKm) continue;

      result.Alle += 1;
      result[activity.group] = (result[activity.group] || 0) + 1;
    }

    return result;
  }, [normalizedActivities, hasValidCenter, centerLat, centerLng, radiusKm]);

  const visibleList = nearby.slice(0, maxListItems);

  if (!hasValidCenter) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold tracking-[-0.02em] text-slate-950">
          Aktivitäten in der Nähe
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Für diese Unterkunft sind aktuell keine gültigen Koordinaten hinterlegt.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="nearby-activities-title"
      className="space-y-5"
      itemScope
      itemType="https://schema.org/ItemList"
    >
      <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700 ring-1 ring-sky-100">
              <Compass className="h-3.5 w-3.5" />
              Umgebung entdecken
            </p>

            <h2
              id="nearby-activities-title"
              className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-slate-950 md:text-3xl"
            >
              Aktivitäten nahe {propertyTitle}
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
              Entdecke Ausflugsziele, Naturerlebnisse, Familienaktivitäten,
              Restaurants und Kulturangebote im Umkreis von{" "}
              <strong className="font-semibold text-slate-900">{radiusKm} km</strong>.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 ring-1 ring-slate-200">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <Navigation className="h-4 w-4" />
              {nearby.length} Ziele gefunden
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Sortiert nach Entfernung zur Unterkunft
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Filter className="h-4 w-4" />
            Kategorie wählen
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {FILTERS.map((filter) => {
              const active = category === filter;

              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setCategory(filter)}
                  className={[
                    "inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ring-1 transition-colors",
                    active
                      ? "bg-slate-950 text-white ring-slate-950"
                      : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50",
                  ].join(" ")}
                  aria-pressed={active}
                >
                  <span>{filter}</span>
                  <span
                    className={[
                      "rounded-full px-1.5 py-0.5 text-[10px]",
                      active ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500",
                    ].join(" ")}
                  >
                    {counts[filter] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="max-w-xl rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
            <label className="flex items-center gap-3 text-sm text-slate-700">
              <SlidersHorizontal className="h-4 w-4 shrink-0 text-slate-500" />
              <span className="whitespace-nowrap font-semibold text-slate-900">
                {radiusKm} km
              </span>
              <input
                className="w-full accent-slate-950"
                type="range"
                min={5}
                max={80}
                step={5}
                value={radiusKm}
                onChange={(event) => setRadiusKm(Number(event.target.value))}
                aria-label="Radius für Aktivitäten ändern"
              />
            </label>
          </div>
        </div>
      </header>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-sm md:p-4">
        <ActivityMapClient
          items={nearby}
          center={[centerLat, centerLng]}
          zoom={11}
          showFilters={false}
        />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-xl font-semibold tracking-[-0.025em] text-slate-950">
              Die nächsten Ausflugsziele
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Praktisch für Gäste, die schnell sehen möchten, was in der Umgebung möglich ist.
            </p>
          </div>

          {nearby.length > maxListItems ? (
            <p className="text-sm font-medium text-slate-500">
              Zeigt {maxListItems} von {nearby.length}
            </p>
          ) : null}
        </div>

        {nearby.length === 0 ? (
          <div className="flex items-start gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
            <SearchX className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold text-slate-800">
                Keine Aktivitäten im aktuellen Filter gefunden.
              </p>
              <p className="mt-1">
                Erhöhe den Radius oder wähle eine andere Kategorie.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {visibleList.map((activity, index) => (
              <article
                key={activity.id || activity.slug || activity.title}
                className="group rounded-2xl border border-slate-200 bg-white p-4 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_14px_34px_rgba(15,23,42,0.07)]"
                itemProp="itemListElement"
                itemScope
                itemType="https://schema.org/ListItem"
              >
                <meta itemProp="position" content={String(index + 1)} />

                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    {activity.slug ? (
                      <Link
                        href={`/aktivitaete/${activity.slug}`}
                        className="line-clamp-2 text-base font-semibold leading-6 text-slate-950 hover:text-sky-700"
                        itemProp="url"
                      >
                        <span itemProp="name">{activity.title}</span>
                      </Link>
                    ) : (
                      <h4
                        className="line-clamp-2 text-base font-semibold leading-6 text-slate-950"
                        itemProp="name"
                      >
                        {activity.title}
                      </h4>
                    )}

                    <p className="mt-1 text-sm text-slate-500">
                      {activity.group}
                      {activity.category && activity.category !== activity.group
                        ? ` · ${activity.category}`
                        : ""}
                    </p>
                  </div>

                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    <MapPin className="h-3 w-3" />
                    {activity.distanceKm.toFixed(1)} km
                  </span>
                </div>

                {activity.description ? (
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-700">
                    {activity.description}
                  </p>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {activity.slug ? (
                    <Link
                      href={`/aktivitaete/${activity.slug}`}
                      className="text-sm font-semibold text-slate-950 hover:text-sky-700"
                    >
                      Details ansehen →
                    </Link>
                  ) : null}

                  {activity.website ? (
                    <a
                      className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900"
                      href={activity.website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Website
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}