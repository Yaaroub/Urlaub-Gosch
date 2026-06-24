"use client";
import { useEffect, useState } from "react";

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/favorites", { cache: "no-store" });
        if (r.ok) {
          setUser({ ok: true }); // minimal: wir wissen nur "eingeloggt"
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
      setReady(true);
    })();
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.href = "/"; // refresh → raus
  }

  return { ready, user, logout };
}
