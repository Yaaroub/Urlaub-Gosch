// src/context/FavoritesProvider.jsx
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "fav:properties";
const Ctx = createContext(null);

export default function FavoritesProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  // Wir halten IDs als Strings (vermeidet Number/String-Mismatches)
  const [ids, setIds] = useState([]); // string[]

  // Initial laden: erst Server, sonst localStorage
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/favorites", { cache: "no-store" });
        if (r.ok) {
          setLoggedIn(true);
          const data = await r.json();
          const arr = Array.isArray(data?.ids) ? data.ids.map(String) : [];
          setIds(arr);
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); } catch {}
        } else {
          setLoggedIn(false);
          const raw = localStorage.getItem(STORAGE_KEY);
          setIds(raw ? JSON.parse(raw).map(String) : []);
        }
      } catch {
        setLoggedIn(false);
        const raw = localStorage.getItem(STORAGE_KEY);
        setIds(raw ? JSON.parse(raw).map(String) : []);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  // abgeleiteter Set für schnelle lookups
  const favorites = useMemo(() => new Set(ids), [ids]); // Set<string>

  const persistLocal = useCallback((nextSet) => {
    const arr = [...nextSet];
    setIds(arr);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); } catch {}
  }, []);

  const isFav = useCallback((id) => favorites.has(String(id)), [favorites]);

  const add = useCallback(
    async (id) => {
      const key = String(id);
      if (favorites.has(key)) return;

      // optimistisch updaten
      const next = new Set(favorites);
      next.add(key);
      setIds([...next]);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...next])); } catch {}

      if (loggedIn) {
        try {
          await fetch("/api/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ propertyId: id }),
          });
        } catch {
          // bei Fehler zurückrollen (optional)
        }
      }
    },
    [favorites, loggedIn]
  );

  const remove = useCallback(
    async (id) => {
      const key = String(id);
      if (!favorites.has(key)) return;

      // optimistisch updaten
      const next = new Set(favorites);
      next.delete(key);
      setIds([...next]);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...next])); } catch {}

      if (loggedIn) {
        try {
          await fetch(`/api/favorites/${id}`, { method: "DELETE" });
        } catch {
          // bei Fehler zurückrollen (optional)
        }
      }
    },
    [favorites, loggedIn]
  );

  const toggle = useCallback(
    (id) => (isFav(id) ? remove(id) : add(id)),
    [isFav, add, remove]
  );

  const clear = useCallback(() => {
    setIds([]);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify([])); } catch {}
    // optional: wenn eingeloggt -> auf Server alles löschen (nicht implementiert)
  }, []);

  const value = useMemo(
    () => ({
      ready,
      loggedIn,
      ids, // string[]
      favorites, // Set<string>
      isFav,
      add,
      remove,
      toggle,
      clear,
    }),
    [ready, loggedIn, ids, favorites, isFav, add, remove, toggle, clear]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFavoritesCtx() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFavoritesCtx must be used within <FavoritesProvider>");
  return ctx;
}
