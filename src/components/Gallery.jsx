"use client";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";

/**
 * images: Array<{ id:number|string, url:string, alt?:string, caption?:string }>
 */
export default function Gallery({ images = [] }) {
  const [openIndex, setOpenIndex] = useState(null);

  if (!images?.length) {
    return (
      <div className="rounded-2xl bg-slate-100 ring-1 ring-black/5 h-64 grid place-items-center text-slate-500">
        Keine Fotos vorhanden.
      </div>
    );
  }

  const hero = images[0];
  const gridItems = images.slice(1);

  const openAt = useCallback((idx) => setOpenIndex(idx), []);
  const close = useCallback(() => setOpenIndex(null), []);

  return (
    <div className="space-y-4">
      {/* Hero */}
      <button
        type="button"
        onClick={() => openAt(0)}
        className="group relative block overflow-hidden rounded-2xl ring-1 ring-black/5"
      >
        <Image
          src={hero.url}
          alt={hero.alt || ""}
          width={1800}
          height={1000}
          className="h-[22rem] w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          priority
        />
        {hero.caption && (
          <span className="pointer-events-none absolute inset-x-0 bottom-0 m-3 rounded-md bg-black/45 px-2 py-1 text-xs text-white backdrop-blur-sm">
            {hero.caption}
          </span>
        )}
      </button>

      {/* Responsive Mosaic Grid */}
      {gridItems.length > 0 && (
        <div
          className="
            grid gap-3
            grid-cols-2
            sm:grid-cols-3
            lg:grid-cols-6
            auto-rows-[8rem] sm:auto-rows-[9.5rem] lg:auto-rows-[10rem]
          "
        >
          {gridItems.map((img, i) => {
            const mod = i % 7;
            const spanCols =
              mod === 0 ? "col-span-2" : mod === 5 ? "col-span-2 lg:col-span-3" : "col-span-1";
            const spanRows =
              mod === 1 || mod === 4 ? "row-span-2" : mod === 6 ? "row-span-3" : "row-span-1";

            return (
              <button
                key={img.id ?? `${img.url}-${i}`}
                type="button"
                onClick={() => openAt(i + 1)}
                className={[
                  "group relative overflow-hidden rounded-xl ring-1 ring-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600",
                  "flex",
                  spanCols,
                  spanRows,
                ].join(" ")}
                aria-label="Bild vergrößern"
              >
                <Image
                  src={img.url}
                  alt={img.alt || ""}
                  width={900}
                  height={700}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  loading="lazy"
                />
                {img.caption && (
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 m-2 rounded bg-black/40 px-2 py-0.5 text-[11px] text-white backdrop-blur-sm">
                    {img.caption}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {openIndex !== null && (
        <Lightbox
          images={images}
          index={openIndex}
          onClose={close}
          onChange={setOpenIndex}
        />
      )}
    </div>
  );
}

/* ======================= Lightbox ======================= */

function Lightbox({ images, index, onClose, onChange }) {
  const dialogRef = useRef(null);
  const startX = useRef(null);
  const count = images.length;

  const prev = useCallback(() => {
    onChange(index > 0 ? index - 1 : count - 1);
  }, [index, count, onChange]);

  const next = useCallback(() => {
    onChange(index < count - 1 ? index + 1 : 0);
  }, [index, count, onChange]);

  // Keyboard controls & focus handling
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    const prevFocus = document.activeElement;
    dialogRef.current?.focus();
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      prevFocus && prevFocus.focus && prevFocus.focus();
    };
  }, [next, prev, onClose]);

  // Swipe on mobile
  const onTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (startX.current === null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(dx) > 40) (dx > 0 ? prev() : next());
    startX.current = null;
  };

  // Preload neighbors
  const neighbors = useMemo(() => {
    const n1 = images[(index + 1) % count]?.url;
    const n2 = images[(index - 1 + count) % count]?.url;
    return [n1, n2].filter(Boolean);
  }, [index, images, count]);

  useEffect(() => {
    neighbors.forEach((src) => {
      const img = new window.Image();
      img.src = src;
    });
  }, [neighbors]);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Bildanzeige"
      tabIndex={-1}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm p-3 md:p-6 grid"
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="relative mx-auto flex w-full max-w-6xl flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top controls */}
        <div className="flex items-center justify-between text-white/90 text-sm pb-2">
          <span className="rounded bg-white/10 px-2 py-1">
            {index + 1} / {count}
          </span>
          <button
            onClick={onClose}
            className="rounded-full bg-white/90 px-3 py-1 text-slate-900 shadow hover:bg-white"
            aria-label="Schließen"
          >
            Schließen
          </button>
        </div>

        {/* Main image */}
        <div className="relative overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-2xl">
          <Image
            src={images[index].url}
            alt={images[index].alt || ""}
            width={2200}
            height={1600}
            className="h-auto w-full select-none"
            priority
          />
          {/* Hotspots */}
          <button
            onClick={prev}
            aria-label="Vorheriges Bild"
            className="absolute left-0 top-0 h-full w-1/3 md:w-1/5 cursor-[w-resize] focus:outline-none"
          />
          <button
            onClick={next}
            aria-label="Nächstes Bild"
            className="absolute right-0 top-0 h-full w-1/3 md:w-1/5 cursor-[e-resize] focus:outline-none"
          />
        </div>

        {/* Caption */}
        {(images[index].caption || images[index].alt) && (
          <div className="mt-2 text-[13px] text-white/85">
            {images[index].caption || images[index].alt}
          </div>
        )}

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button
                key={`${img.url}-${i}`}
                onClick={() => onChange(i)}
                aria-label={`Bild ${i + 1} anzeigen`}
                className={[
                  "shrink-0 rounded-lg ring-1 transition",
                  i === index ? "ring-sky-400 outline-none" : "ring-white/10 hover:ring-white/30",
                ].join(" ")}
                style={{ lineHeight: 0 }}
              >
                <Image
                  src={img.url}
                  alt={img.alt || ""}
                  width={120}
                  height={90}
                  className={["h-16 w-24 object-cover rounded-md", i === index ? "opacity-100" : "opacity-80"].join(" ")}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
