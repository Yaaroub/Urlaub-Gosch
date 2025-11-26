// src/components/Providers.jsx (or wherever)
"use client";
import FavoritesProvider from "@/context/FavoritesProvider";

export default function Providers({ children }) {
  return <FavoritesProvider>{children}</FavoritesProvider>;
}
