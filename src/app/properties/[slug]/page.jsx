// src/app/properties/[slug]/page.jsx
import prisma from "@/lib/db";
import { notFound } from "next/navigation";
import BookingCalendar from "@/components/BookingCalendar";
import BookingBox from "@/components/BookingBox";
import Gallery from "@/components/Gallery";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Users,
  Dog,
  CalendarDays,
  Euro,
  ChevronLeft,
} from "lucide-react";

export const dynamic = "force-dynamic";

// SEO
export async function generateMetadata({ params }) {
  const { slug } = params;
  const p = await prisma.property.findUnique({
    where: { slug },
    select: {
      title: true,
      location: true,
      images: {
        orderBy: { sort: "asc" },
        take: 1,
        select: { url: true },
      },
    },
  });
  if (!p) return {};
  const ogImg = p.images[0]?.url
    ? [{ url: p.images[0].url, width: 1200, height: 630 }]
    : [];
  return {
    title: `${p.title} – ${p.location} | Urlaub-GOSCH`,
    openGraph: { images: ogImg },
    twitter: { images: ogImg },
  };
}

export default async function PropertyPage({ params }) {
  const { slug } = params;
  const today = new Date();

  const property = await prisma.property.findUnique({
    where: { slug },
    include: {
      amenities: true,
      images: { orderBy: { sort: "asc" } },
      pricePeriods: { orderBy: { startDate: "asc" } },
      extras: true,
      // 🔥 aktive/kommende Last-Minute-Angebote
      lastMinuteOffers: {
        where: { endDate: { gt: today } },
        orderBy: { discount: "desc" }, // größter Rabatt zuerst
      },
    },
  });

  if (!property) return notFound();

  // größtes aktives LM-Angebot (falls mehrere)
  const activeLm = property.lastMinuteOffers[0] ?? null;

  const fees = property.extras.map((e) => ({
    id: e.id,
    name: e.title,
    isDaily: e.isDaily,
    eur: (e.amount / 100).toFixed(2),
  }));

  return (
    <section className="mx-auto max-w-6xl">
      {/* Backlink */}
      <div className="px-4 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ChevronLeft className="h-4 w-4" /> Zurück zur Suche
        </Link>
      </div>

      {/* Hero */}
      <div className="relative mt-4 overflow-hidden rounded-2xl mx-4 ring-1 ring-black/5">
        <div className="relative h-56 md:h-64">
          {property.images[0]?.url ? (
            <Image
              src={property.images[0].url}
              alt={property.images[0].alt || property.title}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-sky-100 to-slate-100" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7 text-white">
            <h1 className="text-xl md:text-2xl font-semibold drop-shadow-sm">
              {property.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm opacity-95">
              <span className="inline-flex items-center gap-1.5 bg-white/15 px-2.5 py-1 rounded-full backdrop-blur">
                <MapPin className="h-4 w-4" /> {property.location}
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/15 px-2.5 py-1 rounded-full backdrop-blur">
                <Users className="h-4 w-4" /> bis {property.maxPersons} Pers.
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/15 px-2.5 py-1 rounded-full backdrop-blur">
                <Dog className="h-4 w-4" /> Hunde{" "}
                {property.dogsAllowed ? "erlaubt" : "nicht erlaubt"}
              </span>

              {/* 🔥 Last-Minute Badge im Hero */}
              {activeLm && (
                <span className="inline-flex items-center gap-1.5 bg-rose-600/90 px-2.5 py-1 rounded-full text-xs font-semibold shadow">
                  −{activeLm.discount}% Last-Minute
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid lg:grid-cols-2 gap-6 px-4 py-8">
        {/* links */}
        <div className="space-y-6">
          {/* Ausstattung */}
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-6">
            <h3 className="font-semibold mb-3">Ausstattung</h3>
            {property.amenities.length ? (
              <ul className="flex flex-wrap gap-2">
                {property.amenities.map((a) => (
                  <li
                    key={a.id}
                    className="text-xs rounded-full bg-slate-100 px-3 py-1 text-slate-700"
                  >
                    {a.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-600">–</p>
            )}
          </div>

          {/* Nebenkosten */}
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Nebenkosten</h3>
              <Euro className="h-4 w-4 text-slate-500" />
            </div>
            {fees.length === 0 ? (
              <p className="text-sm text-slate-600">
                Keine Nebenkosten hinterlegt.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 text-sm">
                {fees.map((f) => (
                  <li
                    key={f.id}
                    className="py-2 flex items-center justify-between"
                  >
                    <span className="text-slate-700">
                      {f.name}{" "}
                      <span className="text-slate-500">
                        {f.isDaily ? "(pro Nacht)" : "(einmalig)"}
                      </span>
                    </span>
                    <span className="font-medium">{f.eur} €</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-xs text-slate-500">
              Alle Preise inkl. gesetzl. MwSt. Änderungen vorbehalten.
            </p>
          </div>

          {/* Preiszeiten */}
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Preiszeiten</h3>
              <CalendarDays className="h-4 w-4 text-slate-500" />
            </div>
            {property.pricePeriods.length === 0 ? (
              <p className="text-sm text-slate-600">
                Keine Preiszeiten hinterlegt.
              </p>
            ) : (
              <ul className="text-sm text-slate-700 divide-y divide-slate-100">
                {property.pricePeriods.map((pp) => (
                  <li
                    key={pp.id}
                    className="py-2 flex items-center justify-between"
                  >
                    <span className="text-slate-700">
                      {pp.startDate.toISOString().slice(0, 10)} →{" "}
                      {pp.endDate.toISOString().slice(0, 10)} (exkl.)
                    </span>
                    <span className="font-medium">
                      {Number(pp.pricePerNight).toFixed(2)} € / Nacht
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Beschreibung */}
          {property.description && (
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-6">
              <h3 className="font-semibold mb-3">Beschreibung</h3>
              <p className="text-sm leading-6 text-slate-700 whitespace-pre-line">
                {property.description}
              </p>
            </div>
          )}
        </div>

        {/* rechts */}
        <aside className="lg:sticky lg:top-6 h-fit space-y-6">
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-6">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold">Verfügbarkeit</h3>
              {/* 🔥 LM-Hinweis beim Kalender */}
              {activeLm && (
                <span className="text-xs font-semibold text-rose-600">
                  −{activeLm.discount}% Last-Minute
                </span>
              )}
            </div>
            {activeLm && (
              <p className="mb-2 text-xs text-rose-700">
                Gültig von{" "}
                {new Date(activeLm.startDate).toLocaleDateString("de-DE")} bis{" "}
                {new Date(activeLm.endDate).toLocaleDateString("de-DE")}. Der
                Rabatt wird im Preis automatisch berücksichtigt.
              </p>
            )}

            <BookingCalendar propertyId={property.id} />
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <p>Belegung inkl. An- &amp; Abreisetage (Ende exkl.).</p>
              <a
                href={`/api/ical/${encodeURIComponent(property.slug)}`}
                className="underline hover:text-slate-700"
              >
                iCal abonnieren
              </a>
            </div>
          </div>

          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-6">
            <h3 className="font-semibold mb-3">Anfrage / Buchung</h3>
            <BookingBox propertyId={property.id} />
          </div>
        </aside>
      </div>

      {/* Galerie unten */}
      <div className="px-4 mt-6">
        <Gallery images={property.images} />
      </div>
    </section>
  );
}
