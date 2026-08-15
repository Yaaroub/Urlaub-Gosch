"use client";

import { useState } from "react";
import { LogOut, Loader2 } from "lucide-react";

export default function AdminLogoutButton() {
  const [loading, setLoading] = useState(false);

  async function logout() {
    if (loading) return;

    setLoading(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      // harter Reload, damit alle Server Components
      // garantiert ohne alte Session geladen werden
      window.location.href = "/admin/login";
    }
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className="
        inline-flex h-10 items-center justify-center gap-2
        rounded-xl border border-slate-200
        bg-white px-4
        text-sm font-semibold text-slate-700
        shadow-sm transition
        hover:border-red-200
        hover:bg-red-50
        hover:text-red-700
        disabled:cursor-not-allowed
        disabled:opacity-60
      "
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}

      {loading ? "Abmelden..." : "Ausloggen"}
    </button>
  );
}