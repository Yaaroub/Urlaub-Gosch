"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Dog,
  Flame,
  MapPin,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import LastMinuteBadge from "@/components/LastMinuteBadge";

export default function OffersPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadLastMinute() {
      try {
        const response = await fetch("/api/lastminute", {
          cache: "no-store",
        });

        const data = await response.json();

        if (active) {
          setItems(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error(
          "Last-Minute Angebote konnten nicht geladen werden:",
          error
        );

        if (active) {
          setItems([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadLastMinute();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#f6f8fb] pb-20 pt-28 text-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Intro */}
        <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(244,213,157,0.28),transparent_30%),radial-gradient(circle_at_86%_24%,rgba(56,189,248,0.12),transparent_28%)]" />

          <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end lg:p-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-800">
                <Flame className="h-3.5 w-3.5" />
                Last Minute
              </div>

              <h1 className="mt-6 max-w-4xl text-[clamp(2.4rem,6vw,5rem)] font-semibold leading-[0.96] tracking-[-0.07em] text-slate-950">
                Kurzfristig
                <span className="block font-serif italic font-normal text-[#c99a43]">
                  ans Meer.
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                Entdecken Sie kurzfristig verfügbare Ferienunterkünfte an der
                Küste — ideal für spontane Auszeiten an Nordsee und Ostsee.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-white/85 p-5 shadow-sm backdrop-blur">
              <div className="flex items-start gap-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-950 text-white">
                  <CalendarDays className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    {loading
                      ? "Angebote werden geladen"
                      : `${items.length} Last-Minute-Angebot${
                          items.length === 1 ? "" : "e"
                        }`}
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Diese Unterkünfte sind kurzfristig verfügbar oder als Last
                    Minute markiert.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#c99a43]" />
                  <p className="text-sm leading-6 text-slate-600">
                    Für eine schnelle Anfrage empfehlen wir, Zeitraum und
                    Personenzahl direkt bereitzuhalten.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="mt-8">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#c99a43]">
                Angebote
              </p>

              <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                Verfügbare Last-Minute-Unterkünfte
              </h2>
            </div>

            {!loading && items.length > 0 && (
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
                <Flame className="h-4 w-4 text-rose-500" />
                {items.length} Treffer
              </div>
            )}
          </div>

          {loading ? (
            <LoadingState />
          ) : items.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2">
              {items.map((offer) => (
                <LastMinuteCard key={offer.id} offer={offer} />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </section>
      </div>
    </main>
  );
}

function LastMinuteCard({ offer }) {
  const property = offer.property || {};

  const title = property.title || property.name || "Ferienunterkunft";

  const href = property.slug
    ? `/properties/${property.slug}`
    : `/properties/${property.id}`;

  const image =
    property.images?.[0]?.url ||
    property.images?.[0]?.src ||
    property.images?.[0]?.path ||
    property.coverImage ||
    property.image ||
    "/placeholder.jpg";

  const location = [
    property.zip,
    property.location,
    property.city,
    property.region,
  ]
    .filter(Boolean)
    .slice(0, 2)
    .join(" ");

  const maxPersons =
    property.maxPersons ||
    property.persons ||
    property.guests ||
    property.maxGuests ||
    property.capacity;

  const petsAllowed =
    property.petsAllowed ||
    property.dogsAllowed ||
    property.petFriendly ||
    property.hund ||
    property.hunde ||
    property.hasPets;

  const endDate = offer.endDate
    ? new Date(offer.endDate).toLocaleDateString("de-DE")
    : null;

  const description =
    property.shortDescription ||
    property.description ||
    "Komfortable Ferienunterkunft an der Küste — ideal für entspannte Urlaubstage am Meer.";

  return (
    <article
      className={[
        "group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm",
        "transition-[border-color,box-shadow,background-color] duration-200 ease-out",
        "hover:border-slate-300 hover:shadow-[0_16px_42px_rgba(15,23,42,0.07)]",
      ].join(" ")}
    >
      <Link href={href} className="relative block aspect-[16/10] overflow-hidden bg-slate-100">
        <LastMinuteBadge discount={offer.discount} />

        <Image
          src={image}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition-[filter] duration-200 ease-out group-hover:brightness-[0.97]"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent" />
      </Link>

      <div className="flex min-h-[310px] flex-col p-5">
        <div className="min-w-0">
          <Link href={href}>
            <h2 className="line-clamp-2 text-xl font-semibold leading-7 tracking-[-0.035em] text-slate-950 transition-colors group-hover:text-slate-800">
              {title}
            </h2>
          </Link>

          {location && (
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">{location}</span>
            </div>
          )}
        </div>

        <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-500">
          {description}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {maxPersons && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
              <Users className="h-3.5 w-3.5" />
              bis {maxPersons} Pers.
            </span>
          )}

          {petsAllowed && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
              <Dog className="h-3.5 w-3.5" />
              Hund erlaubt
            </span>
          )}

          {offer.discount !== undefined && offer.discount !== null && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-100">
              <Flame className="h-3.5 w-3.5" />
              −{offer.discount}% Rabatt
            </span>
          )}

          {endDate && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-100">
              <CalendarDays className="h-3.5 w-3.5" />
              bis {endDate}
            </span>
          )}
        </div>

        {offer.note && (
          <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600 ring-1 ring-slate-100">
            {offer.note}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
              Last Minute
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-700">
              Verfügbarkeit prüfen
            </p>
          </div>

          <Link
            href={href}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-slate-800"
          >
            Details
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function LoadingState() {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm"
        >
          <div className="aspect-[16/10] animate-pulse bg-slate-200" />

          <div className="p-5">
            <div className="h-6 w-2/3 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-4 h-4 w-1/3 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-6 h-4 w-full animate-pulse rounded-full bg-slate-200" />
            <div className="mt-3 h-4 w-4/5 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-8 h-11 w-36 animate-pulse rounded-full bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-slate-100 text-slate-600">
        <Search className="h-6 w-6" />
      </div>

      <h2 className="mt-6 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
        Aktuell keine Last-Minute-Angebote
      </h2>

      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
        Momentan sind keine Unterkünfte als Last Minute markiert. Schauen Sie
        gerne später noch einmal vorbei.
      </p>

      <Link
        href="/"
        className="mt-7 inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-slate-800"
      >
        Zur Startseite
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}