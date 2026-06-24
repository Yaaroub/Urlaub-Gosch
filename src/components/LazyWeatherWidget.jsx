"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const WeatherWidget = dynamic(() => import("@/components/WeatherWidget"), {
  ssr: false,
  loading: () => <WeatherPlaceholder />,
});

function WeatherPlaceholder() {
  return (
    <div className="rounded-[2rem] bg-gradient-to-br from-sky-600 via-blue-700 to-indigo-800 p-5 text-white shadow-2xl shadow-sky-950/25">
      <div className="animate-pulse space-y-5">
        <div className="flex items-center justify-between">
          <div className="h-5 w-28 rounded-full bg-white/20" />
          <div className="h-8 w-24 rounded-xl bg-white/20" />
        </div>
        <div className="h-24 rounded-3xl bg-white/15" />
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-white/15" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LazyWeatherWidget(props) {
  const rootRef = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (shouldLoad) return;

    const node = rootRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
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
      { rootMargin: "300px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [shouldLoad]);

  return <div ref={rootRef}>{shouldLoad ? <WeatherWidget {...props} /> : <WeatherPlaceholder />}</div>;
}
