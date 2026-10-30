"use client";

import { usePathname } from "next/navigation";

export default function PublicSiteChrome({ children }) {
  const pathname = usePathname();
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return null;
  return children;
}
