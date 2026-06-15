"use client";

import dynamic from "next/dynamic";

const ActivityMapClient = dynamic(() => import("@/components/ActivityMapClient"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center bg-slate-100 text-sm text-slate-500">
      Karte wird geladen …
    </div>
  ),
});

export default function LazyActivityMap(props) {
  return <ActivityMapClient {...props} />;
}