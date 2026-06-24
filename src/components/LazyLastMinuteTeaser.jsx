"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const LastMinuteTeaser = dynamic(() => import("@/components/LastMinuteTeaser"), {
  ssr: false,
  loading: () => null,
});

export default function LazyLastMinuteTeaser(props) {
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

  return <div ref={rootRef}>{shouldLoad ? <LastMinuteTeaser {...props} /> : null}</div>;
}
