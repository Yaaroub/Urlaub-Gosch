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

    return Array.isArray(parsed)
      ? parsed.map(String)
      : [];
  } catch {
    return [];
  }
}

function writeLocalFavorites(ids) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(ids)
    );
  } catch {}
}

function runWhenIdle(callback) {
  if (typeof window === "undefined") {
    return undefined;
  }

  if ("requestIdleCallback" in window) {
    const id = window.requestIdleCallback(
      callback,
      {
        timeout: 2500,
      }
    );

    return () =>
      window.cancelIdleCallback(id);
  }

  const id = window.setTimeout(
    callback,
    1200
  );

  return () =>
    window.clearTimeout(id);
}

export default function FavoritesProvider({
  children,
}) {
  const [ready, setReady] = useState(false);

  const [loggedIn, setLoggedIn] =
    useState(false);

  const [user, setUser] = useState(null);

  const [ids, setIds] = useState([]);

  useEffect(() => {
    let cancelled = false;

    // --------------------------------------------------
    // 1. Sofort lokale Favoriten anzeigen
    // --------------------------------------------------

    const localIds =
      readLocalFavorites();

    setIds(localIds);
    setReady(true);

    // --------------------------------------------------
    // 2. Auth + Server-Favoriten erst im Idle-Fenster
    // --------------------------------------------------

    return runWhenIdle(async () => {
      try {
        // ----------------------------------------------
        // Benutzer prüfen
        // ----------------------------------------------

        const authResponse = await fetch(
          "/api/auth/me",
          {
            cache: "no-store",
          }
        );

        if (!authResponse.ok) {
          if (!cancelled) {
            setLoggedIn(false);
            setUser(null);
          }

          return;
        }

        const authData =
          await authResponse.json();

        const currentUser =
          authData?.user ?? null;

        if (!currentUser) {
          if (!cancelled) {
            setLoggedIn(false);
            setUser(null);
          }

          return;
        }

        if (!cancelled) {
          setLoggedIn(true);
          setUser(currentUser);
        }

        // ----------------------------------------------
        // Favoriten vom Server laden
        // ----------------------------------------------

        const favoritesResponse =
          await fetch(
            "/api/favorites",
            {
              cache: "no-store",
            }
          );

        if (!favoritesResponse.ok) {
          return;
        }

        const favoritesData =
          await favoritesResponse.json();

        const serverIds =
          Array.isArray(
            favoritesData?.ids
          )
            ? favoritesData.ids.map(
                String
              )
            : [];

        if (cancelled) {
          return;
        }

        setIds(serverIds);

        writeLocalFavorites(
          serverIds
        );
      } catch {
        if (!cancelled) {
          setLoggedIn(false);
          setUser(null);
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // ----------------------------------------------------
  // Set für schnelle Prüfung
  // ----------------------------------------------------

  const favorites = useMemo(
    () => new Set(ids),
    [ids]
  );

  // ----------------------------------------------------
  // Favorit?
  // ----------------------------------------------------

  const isFav = useCallback(
    (id) =>
      favorites.has(
        String(id)
      ),
    [favorites]
  );

  // ----------------------------------------------------
  // Hinzufügen
  // ----------------------------------------------------

  const add = useCallback(
    async (id) => {
      const key =
        String(id);

      if (
        favorites.has(key)
      ) {
        return;
      }

      const next =
        new Set(favorites);

      next.add(key);

      const nextIds = [
        ...next,
      ];

      // Optimistisches Update
      setIds(nextIds);

      writeLocalFavorites(
        nextIds
      );

      // Nur für eingeloggte Benutzer
      // zusätzlich in DB speichern
      if (loggedIn) {
        try {
          const response =
            await fetch(
              "/api/favorites",
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body: JSON.stringify({
                  propertyId: id,
                }),
              }
            );

          // Session vielleicht inzwischen
          // ungültig / Benutzer gesperrt
          if (
            response.status === 401
          ) {
            setLoggedIn(false);
            setUser(null);
          }
        } catch {}
      }
    },
    [
      favorites,
      loggedIn,
    ]
  );

  // ----------------------------------------------------
  // Entfernen
  // ----------------------------------------------------

  const remove =
    useCallback(
      async (id) => {
        const key =
          String(id);

        if (
          !favorites.has(key)
        ) {
          return;
        }

        const next =
          new Set(favorites);

        next.delete(key);

        const nextIds = [
          ...next,
        ];

        // Optimistisches Update
        setIds(nextIds);

        writeLocalFavorites(
          nextIds
        );

        if (loggedIn) {
          try {
            const response =
              await fetch(
                `/api/favorites/${id}`,
                {
                  method:
                    "DELETE",
                }
              );

            if (
              response.status ===
              401
            ) {
              setLoggedIn(
                false
              );

              setUser(null);
            }
          } catch {}
        }
      },
      [
        favorites,
        loggedIn,
      ]
    );

  // ----------------------------------------------------
  // Umschalten
  // ----------------------------------------------------

  const toggle =
    useCallback(
      (id) =>
        isFav(id)
          ? remove(id)
          : add(id),
      [
        isFav,
        add,
        remove,
      ]
    );

  // ----------------------------------------------------
  // Lokal leeren
  // ----------------------------------------------------

  const clear =
    useCallback(() => {
      setIds([]);

      writeLocalFavorites(
        []
      );
    }, []);

  // ----------------------------------------------------
  // Context
  // ----------------------------------------------------

  const value = useMemo(
    () => ({
      ready,

      loggedIn,

      // NEU:
      // vollständiger Benutzer
      user,

      ids,
      favorites,

      isFav,
      add,
      remove,
      toggle,
      clear,

      // Rollen-Helfer
      isStaff:
        user?.role ===
          "EDITOR" ||
        user?.role ===
          "ADMIN" ||
        user?.role ===
          "SUPERADMIN",

      isAdmin:
        user?.role ===
          "ADMIN" ||
        user?.role ===
          "SUPERADMIN",

      isSuperAdmin:
        user?.role ===
        "SUPERADMIN",
    }),
    [
      ready,
      loggedIn,
      user,
      ids,
      favorites,
      isFav,
      add,
      remove,
      toggle,
      clear,
    ]
  );

  return (
    <Ctx.Provider
      value={value}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useFavoritesCtx() {
  const ctx =
    useContext(Ctx);

  if (!ctx) {
    throw new Error(
      "useFavoritesCtx must be used within <FavoritesProvider>"
    );
  }

  return ctx;
}