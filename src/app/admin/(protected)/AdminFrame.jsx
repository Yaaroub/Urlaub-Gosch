"use client";

import { usePathname } from "next/navigation";
import styles from "./AdminFrame.module.css";

export default function AdminFrame({ children }) {
  const pathname = usePathname();
  const overview = pathname === "/admin/availability-overview" || pathname === "/admin";
  return <div className={overview ? styles.overview : undefined}>{children}</div>;
}
