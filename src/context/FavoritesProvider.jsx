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

function readLocalFavorites() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function writeLocalFavorites(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {}
}

function runWhenIdle(callback) {
  if (typeof window === "undefined") return undefined;

  if ("requestIdleCallback" in window) {
    const id = window.requestIdleCallback(callback, { timeout: 2500 });
    return () => window.cancelIdleCallback(id);
  }

  const id = window.setTimeout(callback, 1200);
  return () => window.clearTimeout(id);
}

export default function FavoritesProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [ids, setIds] = useState([]);

  useEffect(() => {
    // Erst lokal lesen: schnell, keine blockierende API-Anfrage beim ersten Paint.
    const localIds = readLocalFavorites();
    setIds(localIds);
    setReady(true);

    // Server-Sync erst im Idle-Fenster. Das reduziert Arbeit während FCP/LCP/TBT.
    return runWhenIdle(async () => {
      try {
        const response = await fetch("/api/favorites", { cache: "no-store" });
        if (!response.ok) {
          setLoggedIn(false);
          return;
        }

        const data = await response.json();
        const serverIds = Array.isArray(data?.ids) ? data.ids.map(String) : [];

        setLoggedIn(true);
        setIds(serverIds);
        writeLocalFavorites(serverIds);
      } catch {
        setLoggedIn(false);
      }
    });
  }, []);

  const favorites = useMemo(() => new Set(ids), [ids]);

  const isFav = useCallback((id) => favorites.has(String(id)), [favorites]);

  const add = useCallback(
    async (id) => {
      const key = String(id);
      if (favorites.has(key)) return;

      const next = new Set(favorites);
      next.add(key);
      const nextIds = [...next];
      setIds(nextIds);
      writeLocalFavorites(nextIds);

      if (loggedIn) {
        try {
          await fetch("/api/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ propertyId: id }),
          });
        } catch {}
      }
    },
    [favorites, loggedIn]
  );

  const remove = useCallback(
    async (id) => {
      const key = String(id);
      if (!favorites.has(key)) return;

      const next = new Set(favorites);
      next.delete(key);
      const nextIds = [...next];
      setIds(nextIds);
      writeLocalFavorites(nextIds);

      if (loggedIn) {
        try {
          await fetch(`/api/favorites/${id}`, { method: "DELETE" });
        } catch {}
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
    writeLocalFavorites([]);
  }, []);

  const value = useMemo(
    () => ({
      ready,
      loggedIn,
      ids,
      favorites,
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
