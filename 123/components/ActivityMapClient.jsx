"use client";

import dynamic from "next/dynamic";

const ActivityMap = dynamic(() => import("./ActivityMap"), { ssr: false });

export default function ActivityMapClient(props) {
  return <ActivityMap {...props} />;
}
