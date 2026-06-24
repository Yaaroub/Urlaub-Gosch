"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const ActivityMapClient = dynamic(() => import("@/components/ActivityMapClient"), {
  ssr: false,
  loading: () => <MapPlaceholder text="Karte wird geladen …" />,
});

function MapPlaceholder({ text = "Karte vorbereiten …", onLoad }) {
  return (
    <div className="grid h-full w-full place-items-center bg-slate-100 px-4 text-center text-sm text-slate-500">
      <div>
        <p className="font-semibold text-slate-700">Interaktive Karte</p>
        <p className="mt-1">{text}</p>
        {onLoad && (
          <button
            type="button"
            onClick={onLoad}
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-5 py-2 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            Karte laden
          </button>
        )}
      </div>
    </div>
  );
}

export default function LazyActivityMap(props) {
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
      { rootMargin: "350px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [shouldLoad]);

  return (
    <div ref={rootRef} className="h-full w-full">
      {shouldLoad ? (
        <ActivityMapClient {...props} />
      ) : (
        <MapPlaceholder
          text="Die Karte lädt erst, wenn sie gebraucht wird. Das reduziert JavaScript beim ersten Seitenaufruf."
          onLoad={() => setShouldLoad(true)}
        />
      )}
    </div>
  );
}
