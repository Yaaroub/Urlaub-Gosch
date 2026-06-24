"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import LastMinuteBadge from "@/components/LastMinuteBadge";

export default function LastMinuteTeaser() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch("/api/lastminute").then(r => r.json()).then(setItems);
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="rounded-3xl bg-white ring-1 ring-black/5 shadow-sm p-6">
      <h3 className="mb-4 text-lg font-semibold text-slate-900">
        Last-Minute Angebote
      </h3>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(o => (
          <Link
            key={o.id}
            href={`/properties/${o.property.slug}`}
            className="
              group relative overflow-hidden rounded-2xl
              ring-1 ring-black/5
              transition
              hover:ring-rose-400/50
              hover:shadow-xl
            "
          >
            {/* Badge */}
            <LastMinuteBadge discount={o.discount} />

            {/* Image */}
            {o.property.images?.[0]?.url && (
              <Image
                src={o.property.images[0].url}
                alt={o.property.title}
                width={400}
                height={300}
                className="
                  w-full aspect-[4/3] object-cover
                  transition-transform duration-500
                  group-hover:scale-105
                "
              />
            )}

            {/* Content */}
            <div className="p-4">
              <h4 className="font-semibold text-slate-900">
                {o.property.title}
              </h4>
              <p className="text-sm text-slate-600">
                {o.property.location}
              </p>

              <p className="mt-1 text-sm font-semibold text-rose-600">
                −{o.discount}% bis{" "}
                {new Date(o.endDate).toLocaleDateString("de-DE")}
              </p>

              {o.note && (
                <p className="mt-1 text-xs text-slate-500">
                  {o.note}
                </p>
              )}
            </div>

            {/* Glow overlay */}
            <div
              className="
                pointer-events-none absolute inset-0
                opacity-0 group-hover:opacity-100
                transition
                bg-[radial-gradient(circle_at_30%_20%,rgba(244,63,94,0.25),transparent_60%)]
              "
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
