"use client";

import { useEffect, useState } from "react";

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        if (!response.ok) {
          if (!cancelled) {
            setUser(null);
          }

          return;
        }

        const data = await response.json();

        if (!cancelled) {
          setUser(data?.user ?? null);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setReady(true);
        }
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  async function logout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch {
      // Auch bei Netzwerkfehler lokal abmelden
    } finally {
      setUser(null);
      window.location.href = "/";
    }
  }

  const isLoggedIn = Boolean(user);

  const isStaff =
    user?.role === "EDITOR" ||
    user?.role === "ADMIN" ||
    user?.role === "SUPERADMIN";

  const isAdmin =
    user?.role === "ADMIN" ||
    user?.role === "SUPERADMIN";

  const isSuperAdmin =
    user?.role === "SUPERADMIN";

  return {
    ready,
    user,
    logout,

    isLoggedIn,
    isStaff,
    isAdmin,
    isSuperAdmin,
  };
}