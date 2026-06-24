"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import LastMinuteBadge from "@/components/LastMinuteBadge";

export default function LastMinuteTeaser() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let alive = true;

    async function loadOffers() {
      try {
        const response = await fetch("/api/lastminute", { cache: "no-store" });
        const data = response.ok ? await response.json() : [];
        if (alive) setItems(Array.isArray(data) ? data : []);
      } catch {
        if (alive) setItems([]);
      }
    }

    loadOffers();

    return () => {
      alive = false;
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div id="lastminute" className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <h3 className="mb-4 text-lg font-semibold text-slate-900">
        Last-Minute Angebote
      </h3>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((offer) => (
          <Link
            key={offer.id}
            href={`/properties/${offer.property.slug}`}
            className="group relative overflow-hidden rounded-2xl ring-1 ring-black/5 transition hover:ring-rose-400/50 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
          >
            <LastMinuteBadge discount={offer.discount} />

            {offer.property.images?.[0]?.url && (
              <Image
                src={offer.property.images[0].url}
                alt={offer.property.images[0].alt || offer.property.title}
                width={420}
                height={315}
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                quality={72}
                className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            )}

            <div className="p-4">
              <h4 className="font-semibold text-slate-900">
                {offer.property.title}
              </h4>
              <p className="text-sm text-slate-600">{offer.property.location}</p>

              <p className="mt-1 text-sm font-semibold text-rose-600">
                −{offer.discount}% bis {new Date(offer.endDate).toLocaleDateString("de-DE")}
              </p>

              {offer.note && <p className="mt-1 text-xs text-slate-500">{offer.note}</p>}
            </div>

            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(244,63,94,0.25),transparent_60%)] opacity-0 transition group-hover:opacity-100" />
          </Link>
        ))}
      </div>
    </div>
  );
}
