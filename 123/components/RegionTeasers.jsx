"use client";
import Link from "next/link";

export default function RegionTeasers({ items = [] }) {
  if (!items.length) {
    items = [
      {
        title: "Top-Spots an der Küste",
        desc: "Die schönsten Strände, Leuchttürme und Aussichtspunkte.",
        href: "/blog/top-spots",
        tag: "Guide",
      },
      {
        title: "Schietwetter? Kein Problem!",
        desc: "Indoor-Tipps: Museen, Thermen, Manufakturen & Cafés.",
        href: "/blog/schietwetter",
        tag: "Tipps",
      },
      {
        title: "Familien mit Hund",
        desc: "Hundestrände, eingezäunte Parks und Gassi-Runden.",
        href: "/blog/hunde",
        tag: "Für Familien",
      },
    ];
  }

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Region & Ausflugsziele</h3>
        <Link href="/region" className="text-sm text-sky-700 hover:underline">
          Alle Beiträge
        </Link>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {items.map((it, i) => (
          <li key={i} className="group rounded-xl ring-1 ring-black/5 p-4 hover:bg-slate-50 transition">
            {it.tag && (
              <span className="inline-block text-[11px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 ring-1 ring-sky-200 mb-2">
                {it.tag}
              </span>
            )}
            <h4 className="font-medium">{it.title}</h4>
            <p className="text-sm text-slate-600 mt-1 line-clamp-2">{it.desc}</p>
            <Link
              href={it.href}
              className="inline-block mt-3 text-sm text-sky-700 hover:underline"
            >
              Weiterlesen →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
