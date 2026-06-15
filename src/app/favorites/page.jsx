"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import useFavorites from "@/hooks/useFavorites";
import PropertyGridClient from "@/components/PropertyGridClient";

export default function FavoritesPage() {
  const { ready, ids } = useFavorites(); // ids: string[]
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;

    async function load() {
      if (!ready) return;
      setLoading(true);

      if (!ids || ids.length === 0) {
        if (!cancel) {
          setItems([]);
          setLoading(false);
        }
        return;
      }

      const res = await fetch(`/api/properties/by-ids?ids=${ids.join(",")}`, {
        cache: "no-store",
      });

      const arr = res.ok ? await res.json() : [];
      if (!cancel) {
        setItems(Array.isArray(arr) ? arr : []);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancel = true;
    };
  }, [ready, ids]);

  useEffect(() => {
    setItems((prev) => {
      const allowed = new Set((ids || []).map(String));
      return prev.filter((p) => allowed.has(String(p.id)));
    });
  }, [ids]);

  return (
    <main className="bg-[#050e1a] min-h-150 text-white">
      <section className="mx-auto max-w-6xl px-3 sm:px-4 pt-28 pb-14 md:pt-32">
        {/* Header area */}
        <div className="animate-fadeUp">
          <p className="text-[11px] uppercase tracking-[0.22em] text-sky-100/70">
            Favorites
          </p>
          <h1 className="mt-2 text-3xl font-extrabold md:text-4xl">
            Deine <span className="text-sky-200">Merkliste</span>
          </h1>
          <p className="mt-2 text-sm text-sky-100/80 max-w-2xl">
            Speichere Unterkünfte mit dem Herz-Icon und vergleiche sie später in
            Ruhe.
          </p>
        </div>

        {/* Content card */}
        <div className="mt-8 rounded-3xl border border-white/10 bg-[rgba(6,20,35,0.55)] p-4 backdrop-blur-xl shadow-[0_18px_55px_rgba(0,0,0,0.55)] animate-fadeUp">
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-sky-400/80 to-transparent opacity-85" />

          <div className="pt-4">
            {loading ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-sky-100/70">Lade deine Favoriten…</p>
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <p className="text-sm text-sky-100/75">
                  Noch keine Favoriten gespeichert.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href="/#suche"
                    className="inline-flex items-center justify-center rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-sky-400"
                  >
                    Zur Suche
                  </Link>

                  <Link
                    href="/#unterkuenfte"
                    className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/10"
                  >
                    Unterkünfte ansehen
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Gespeicherte Unterkünfte
                    </h2>
                    <p className="text-sm text-sky-100/70">
                      {items.length} Objekt{items.length === 1 ? "" : "e"} in
                      deiner Merkliste
                    </p>
                  </div>

                  <Link
                    href="/#suche"
                    className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/10"
                  >
                    Neue Suche
                  </Link>
                </div>

                {/* Property grid bleibt wie es ist */}
                <PropertyGridClient
                  items={items}
                  showAvailabilityBadge={false}
                  controls={false}
                />
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
