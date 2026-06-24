"use client";

import dynamic from "next/dynamic";

const ActivityMap = dynamic(() => import("@/components/ActivityMap"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full min-h-[360px] place-items-center rounded-[1.5rem] bg-[#eaf7fb] text-sm font-semibold text-[#0f172a] ring-1 ring-[#0077b6]/10">
      Karte wird geladen …
    </div>
  ),
});

export default function ActivityMapClient(props) {
  return <ActivityMap {...props} />;
}