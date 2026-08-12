"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Compass,
  ExternalLink,
  MapPin,
  Navigation,
  SearchX,
  SlidersHorizontal,
} from "lucide-react";
import ActivityMapClient from "@/components/ActivityMapClient";
import { ACTIVITY_GROUPS, getActivityGroup } from "@/lib/activity-groups";
import { haversineKm, withinBoundingBox } from "@/lib/geo";

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

  const normalizedActivities = useMemo(
    () =>
      activities
        .filter(
          (activity) =>
            Number.isFinite(Number(activity.lat)) &&
            Number.isFinite(Number(activity.lng))
        )
        .map((activity) => ({
          ...activity,
          lat: Number(activity.lat),
          lng: Number(activity.lng),
          group: getActivityGroup(activity),
        })),
    [activities]
  );

  const nearbyWithinRadius = useMemo(() => {
    if (!hasValidCenter) return [];

    return normalizedActivities
      .filter((activity) =>
        withinBoundingBox(
          activity.lat,
          activity.lng,
          centerLat,
          centerLng,
          radiusKm
        )
      )
      .map((activity) => ({
        ...activity,
        distanceKm: haversineKm(
          centerLat,
          centerLng,
          activity.lat,
          activity.lng
        ),
      }))
      .filter((activity) => activity.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [normalizedActivities, hasValidCenter, centerLat, centerLng, radiusKm]);

  const nearby = useMemo(
    () =>
      category === "Alle"
        ? nearbyWithinRadius
        : nearbyWithinRadius.filter((activity) => activity.group === category),
    [nearbyWithinRadius, category]
  );

  const counts = useMemo(() => {
    const result = Object.fromEntries(
      ACTIVITY_GROUPS.map((filter) => [filter, 0])
    );

    result.Alle = nearbyWithinRadius.length;

    for (const activity of nearbyWithinRadius) {
      result[activity.group] = (result[activity.group] || 0) + 1;
    }

    return result;
  }, [nearbyWithinRadius]);

  const visibleList = nearby.slice(0, maxListItems);

  if (!hasValidCenter) {
    return (
      <section className="rounded-[2rem] border border-[#dbeafe] bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c49a3a]">
          Umgebung
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#050b1f]">
          Aktivitäten in der Nähe
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Für diese Unterkunft sind aktuell keine gültigen Koordinaten hinterlegt.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="nearby-activities-title"
      className="space-y-6"
      itemScope
      itemType="https://schema.org/ItemList"
    >
      <header className="overflow-hidden rounded-[2rem] border border-[#dbeafe] bg-white shadow-sm">
        <div className="relative px-5 py-6 sm:px-7 sm:py-7">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_0%,rgba(196,154,58,0.12),transparent_32%),radial-gradient(circle_at_100%_20%,rgba(0,119,182,0.09),transparent_34%)]" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#c49a3a]">
                <Compass className="h-3.5 w-3.5" />
                Umgebung entdecken
              </p>

              <h2
                id="nearby-activities-title"
                className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#050b1f] md:text-3xl"
              >
                Aktivitäten nahe {propertyTitle}
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                Ausflugsziele, Natur, Familienaktivitäten, Restaurants und Kultur
                im Umkreis von <strong className="text-[#050b1f]">{radiusKm} km</strong>.
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#dbeafe] bg-[#eaf7fb]/70 px-4 py-2 text-sm font-bold text-[#075985]">
              <Navigation className="h-4 w-4" />
              {nearby.length} Ziele
            </div>
          </div>

          <div className="relative mt-6 flex gap-2 overflow-x-auto pb-1">
            {ACTIVITY_GROUPS.map((filter) => {
              const active = category === filter;

              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setCategory(filter)}
                  aria-pressed={active}
                  className={[
                    "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-xs font-bold ring-1 transition",
                    active
                      ? "bg-[#050b1f] text-white ring-[#050b1f]"
                      : "bg-white text-slate-600 ring-[#dbeafe] hover:bg-[#eaf7fb]/60 hover:text-[#050b1f]",
                  ].join(" ")}
                >
                  <span>{filter}</span>
                  <span
                    className={[
                      "rounded-full px-1.5 py-0.5 text-[10px]",
                      active
                        ? "bg-white/15 text-white"
                        : "bg-[#f7f1e5] text-slate-500",
                    ].join(" ")}
                  >
                    {counts[filter] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>

          <label className="relative mt-5 flex max-w-lg items-center gap-3 rounded-2xl border border-[#dbeafe] bg-[#eaf7fb]/45 px-4 py-3 text-sm text-slate-600">
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-[#0077b6]" />
            <span className="whitespace-nowrap font-bold text-[#050b1f]">
              {radiusKm} km
            </span>
            <input
              className="w-full accent-[#0077b6]"
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
      </header>

      <div className="overflow-hidden rounded-[2rem] border border-[#dbeafe] bg-white p-2.5 shadow-sm sm:p-3">
        <ActivityMapClient
          items={nearby}
          center={[centerLat, centerLng]}
          zoom={11}
          className="h-[380px] sm:h-[460px] lg:h-[520px]"
        />
      </div>

      <div className="rounded-[2rem] border border-[#dbeafe] bg-white p-5 shadow-sm md:p-7">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#c49a3a]">
              Entdecken
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#050b1f]">
              Die nächsten Ausflugsziele
            </h3>
          </div>

          {nearby.length > maxListItems ? (
            <p className="text-sm font-medium text-slate-500">
              {maxListItems} von {nearby.length} angezeigt
            </p>
          ) : null}
        </div>

        {nearby.length === 0 ? (
          <div className="flex items-start gap-3 rounded-2xl border border-dashed border-[#dbeafe] bg-[#eaf7fb]/35 p-5 text-sm text-slate-600">
            <SearchX className="mt-0.5 h-4 w-4 shrink-0 text-[#0077b6]" />
            <div>
              <p className="font-bold text-[#050b1f]">Keine Ziele gefunden.</p>
              <p className="mt-1">Erhöhe den Radius oder wähle eine andere Kategorie.</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {visibleList.map((activity, index) => (
              <article
                key={activity.id || activity.slug || activity.title}
                className="group rounded-2xl border border-[#dbeafe] bg-white p-4 transition hover:border-[#0077b6]/30 hover:shadow-[0_14px_34px_rgba(5,11,31,0.06)]"
                itemProp="itemListElement"
                itemScope
                itemType="https://schema.org/ListItem"
              >
                <meta itemProp="position" content={String(index + 1)} />

                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    {activity.slug ? (
                      <Link
                        href={`/aktivitaeten/${activity.slug}`}
                        className="line-clamp-2 text-base font-bold leading-6 text-[#050b1f] transition hover:text-[#0077b6]"
                        itemProp="url"
                      >
                        <span itemProp="name">{activity.title}</span>
                      </Link>
                    ) : (
                      <h4 className="line-clamp-2 text-base font-bold leading-6 text-[#050b1f]" itemProp="name">
                        {activity.title}
                      </h4>
                    )}

                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {activity.group}
                    </p>
                  </div>

                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#eaf7fb] px-2.5 py-1 text-xs font-bold text-[#075985]">
                    <MapPin className="h-3 w-3" />
                    {activity.distanceKm.toFixed(1)} km
                  </span>
                </div>

                {activity.shortDescription || activity.description ? (
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                    {activity.shortDescription || activity.description}
                  </p>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {activity.slug ? (
                    <Link
                      href={`/aktivitaeten/${activity.slug}`}
                      className="text-sm font-bold text-[#050b1f] transition hover:text-[#0077b6]"
                    >
                      Details ansehen →
                    </Link>
                  ) : null}

                  {activity.website ? (
                    <a
                      href={activity.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 transition hover:text-[#050b1f]"
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
