"use client";

import { useMemo, useState } from "react";
import InspirationCard from "./InspirationCard";

export default function InspirationExplorer({ articles, categories }) {
  const [category, setCategory] = useState("Alle");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("de");

    return articles.filter((article) => {
      const categoryMatches = category === "Alle" || article.category === category;
      if (!categoryMatches) return false;
      if (!needle) return true;

      const searchable = [
        article.title,
        article.shortTitle,
        article.summary,
        ...(article.keywords || []),
        ...(article.places || []),
        ...(article.entities || []),
      ]
        .join(" ")
        .toLocaleLowerCase("de");

      return searchable.includes(needle);
    });
  }, [articles, category, query]);

  return (
    <section aria-labelledby="inspiration-list" className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
      <div className="rounded-[2rem] border border-slate-200/80 bg-white p-3 shadow-sm sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0" aria-label="Beiträge filtern">
            {categories.map((item) => {
              const active = item === category;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={[
                    "min-h-10 shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition",
                    active
                      ? "bg-[#07131f] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-950",
                  ].join(" ")}
                >
                  {item}
                </button>
              );
            })}
          </div>

          <label className="relative block lg:w-80">
            <span className="sr-only">Inspiration durchsuchen</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ort oder Thema suchen …"
              className="min-h-11 w-full rounded-full border border-slate-200 bg-[#f7fafc] px-5 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
            />
          </label>
        </div>
      </div>

      <div className="mt-10 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-sky-700">Urlaub planen</p>
          <h2 id="inspiration-list" className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Regionen, Ausflüge & Urlaubsideen
          </h2>
        </div>
        <p className="hidden text-sm text-slate-500 sm:block">{visible.length} Beiträge</p>
      </div>

      {visible.length ? (
        <div className="mt-7 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((article) => (
            <InspirationCard key={article.slug} article={article} />
          ))}
        </div>
      ) : (
        <div className="mt-7 rounded-[2rem] border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <h3 className="text-xl font-bold text-slate-950">Keine passenden Beiträge gefunden</h3>
          <p className="mt-2 text-sm text-slate-600">Probiere einen anderen Ort, ein anderes Thema oder setze den Filter zurück.</p>
        </div>
      )}
    </section>
  );
}
