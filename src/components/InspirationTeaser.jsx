import Link from "next/link";
import InspirationCard from "./InspirationCard";
import { inspirationArticles } from "@/lib/inspiration";

export default function InspirationTeaser({ limit = 3 }) {
  const preferred = [
    "schoenberger-strand",
    "probstei-ostsee",
    "ausflugstipps-ostsee-schleswig-holstein",
  ];

  const selected = [
    ...preferred
      .map((slug) => inspirationArticles.find((article) => article.slug === slug))
      .filter(Boolean),
    ...inspirationArticles,
  ]
    .filter(
      (article, index, list) =>
        list.findIndex((item) => item.slug === article.slug) === index
    )
    .slice(0, limit);

  return (
    <section className="bg-[#f7fafc] px-4 py-16 sm:px-6 lg:px-8 lg:py-20" aria-labelledby="inspiration-teaser-heading">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-700">Region & Ausflüge</p>
            <h2 id="inspiration-teaser-heading" className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Ostsee-Inspiration für deinen Urlaub
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
              Entdecke Küstenorte, Natur, Familienziele und Tagesausflüge rund um die Probstei und Schleswig-Holstein.
            </p>
          </div>
          <Link
            href="/blog"
            className="inline-flex min-h-11 w-fit items-center rounded-full bg-[#07131f] px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            Alle Inspirationen →
          </Link>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {selected.map((article) => (
            <InspirationCard key={article.slug} article={article} />
          ))}
        </div>
      </div>
    </section>
  );
}
