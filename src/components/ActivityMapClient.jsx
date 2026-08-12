"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const ActivityMap = dynamic(() => import("@/components/ActivityMap"), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

export default function ActivityMapClient({
  className = "h-[420px] sm:h-[500px] lg:h-[560px]",
  ...props
}) {
  const rootRef = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    if (!("IntersectionObserver" in window)) {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "320px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={rootRef} className={`relative w-full ${className}`}>
      {shouldLoad ? <ActivityMap {...props} /> : <MapSkeleton />}
    </div>
  );
}

function MapSkeleton() {
  return (
    <div className="grid h-full min-h-[360px] w-full place-items-center overflow-hidden rounded-[1.5rem] border border-[#dbeafe] bg-[#eaf7fb]/70 text-sm font-semibold text-[#475569]">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-[#0077b6]" />
        Karte wird geladen …
      </div>
    </div>
  );
}
