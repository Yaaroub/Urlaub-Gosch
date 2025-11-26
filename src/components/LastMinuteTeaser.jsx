"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function LastMinuteTeaser() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch("/api/lastminute").then(r=>r.json()).then(setItems);
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl bg-white ring-1 ring-black/5 shadow-sm p-6">
      <h3 className="font-semibold mb-3">Last-Minute Angebote</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(o => (
          <Link key={o.id} href={`/properties/${o.property.slug}`} className="group rounded-xl ring-1 ring-black/5 overflow-hidden hover:shadow">
            {o.property.images?.[0]?.url && (
              <Image src={o.property.images[0].url} alt={o.property.title} width={400} height={300}
                     className="w-full aspect-[4/3] object-cover group-hover:scale-[1.02] transition"/>
            )}
            <div className="p-3">
              <h4 className="font-medium">{o.property.title}</h4>
              <p className="text-sm text-slate-600">{o.property.location}</p>
              <p className="text-sm text-rose-600 mt-1">-{o.discount}% bis {new Date(o.endDate).toLocaleDateString("de-DE")}</p>
              {o.note && <p className="text-xs text-slate-500">{o.note}</p>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
