"use client";
import { Heart } from "lucide-react";
import { useFavoritesCtx } from "@/context/FavoritesProvider";

export default function FavButton({ id, size = 20, className = "" }) {
  const { ready, isFav, toggle } = useFavoritesCtx();
  const active = ready && isFav(id);

  return (
    <button
      type="button"
      aria-label={active ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(id); }}
      className={`inline-flex items-center justify-center min-h-11 min-w-11 rounded-full bg-white/90 p-2 shadow hover:bg-white ring-1 ring-black/10 ${className}`}
    >
      <Heart width={size} height={size} className={active ? "fill-rose-600 text-rose-600" : "text-slate-600"} />
    </button>
  );
}
