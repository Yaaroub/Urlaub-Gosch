"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * Favourites ("Merkliste") are stored only in the visitor's own browser
 * (localStorage). There are no customer accounts: nothing is sent to the
 * server and nothing is stored in the database.
 */
const STORAGE_KEY = "fav:properties";
const Ctx = createContext(null);

function readLocalFavorites() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? [...new Set(parsed.map(String).filter((id) => /^\d{1,10}$/.test(id)))]
      : [];
  } catch {
    return [];
  }
}

function writeLocalFavorites(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {}
}

export default function FavoritesProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [ids, setIds] = useState([]);

  useEffect(() => {
    setIds(readLocalFavorites());
    setReady(true);

    // Keep several open tabs in sync.
    const onStorage = (event) => {
      if (event.key === STORAGE_KEY) setIds(readLocalFavorites());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const favorites = useMemo(() => new Set(ids), [ids]);

  const isFav = useCallback((id) => favorites.has(String(id)), [favorites]);

  const update = useCallback((mutate) => {
    setIds((current) => {
      const next = mutate(new Set(current));
      const nextIds = [...next];
      writeLocalFavorites(nextIds);
      return nextIds;
    });
  }, []);

  const add = useCallback((id) => update((set) => set.add(String(id))), [update]);

  const remove = useCallback(
    (id) =>
      update((set) => {
        set.delete(String(id));
        return set;
      }),
    [update]
  );

  const toggle = useCallback((id) => (isFav(id) ? remove(id) : add(id)), [isFav, add, remove]);

  const clear = useCallback(() => update(() => new Set()), [update]);

  const value = useMemo(
    () => ({ ready, ids, favorites, isFav, add, remove, toggle, clear }),
    [ready, ids, favorites, isFav, add, remove, toggle, clear]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFavoritesCtx() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useFavoritesCtx must be used within <FavoritesProvider>");
  }
  return ctx;
}
