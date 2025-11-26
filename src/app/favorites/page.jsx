// src/app/favorites/page.jsx
"use client";

import { useEffect, useState } from "react";
import useFavorites from "@/hooks/useFavorites";
import PropertyGridClient from "@/components/PropertyGridClient";

export default function FavoritesPage() {
  const { ready, ids } = useFavorites(); // ids: string[]
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Items laden, wenn IDs bereit sind
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

  // Wenn Nutzer auf der Seite ent-favorisiert, Liste live ausdünnen
  useEffect(() => {
    setItems((prev) => {
      const allowed = new Set((ids || []).map(String));
      return prev.filter((p) => allowed.has(String(p.id)));
    });
  }, [ids]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">Favoriten</h1>
      {loading ? (
        <p className="text-sm text-slate-500">Lade…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">Noch keine Favoriten.</p>
      ) : (
        <PropertyGridClient
          items={items}
          showAvailabilityBadge={false}
          controls={false}
        />
      )}
    </section>
  );
}
