"use client";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Images } from "lucide-react";

/**
 * images: Array<{ id:number|string, url:string, alt?:string, caption?:string }>
 */
export default function Gallery({ images = [] }) {
  const [openIndex, setOpenIndex] = useState(null);

  if (!images?.length) {
    return (
      <div className="rounded-3xl border border-white/10 bg-[rgba(6,20,35,0.45)] backdrop-blur-xl shadow-[0_18px_55px_rgba(0,0,0,0.55)] h-64 grid place-items-center text-sky-100/70">
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
        className="group relative block w-full overflow-hidden rounded-3xl border border-white/10 bg-[rgba(6,20,35,0.35)] shadow-[0_18px_55px_rgba(0,0,0,0.45)] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        aria-label="Foto öffnen"
      >
        <div className="relative">
          <Image
            src={hero.url}
            alt={hero.alt || ""}
            width={1800}
            height={1000}
            className="h-[22rem] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            priority
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(56,189,248,0.16),transparent_55%)]" />
        </div>

        {/* Top-right CTA */}
        <div className="absolute right-3 top-3 z-10 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-md transition group-hover:bg-black/45">
          <Images className="h-4 w-4 text-sky-200" />
          <span>Fotos ansehen</span>
        </div>

        {/* Caption */}
        {(hero.caption || hero.alt) && (
          <div className="absolute inset-x-0 bottom-0 z-10 p-3">
            <div className="inline-flex max-w-full items-center rounded-2xl border border-white/10 bg-black/35 px-3 py-2 text-xs text-white/90 backdrop-blur-md">
              <span className="truncate">{hero.caption || hero.alt}</span>
            </div>
          </div>
        )}
      </button>

      {/* Mosaic Grid */}
      {gridItems.length > 0 && (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 auto-rows-[8rem] sm:auto-rows-[9.5rem] lg:auto-rows-[10rem]">
          {gridItems.map((img, i) => {
            const mod = i % 7;
            const spanCols = mod === 0 ? "col-span-2" : mod === 5 ? "col-span-2 lg:col-span-3" : "col-span-1";
            const spanRows = mod === 1 || mod === 4 ? "row-span-2" : mod === 6 ? "row-span-3" : "row-span-1";

            return (
              <button
                key={img.id ?? `${img.url}-${i}`}
                type="button"
                onClick={() => openAt(i + 1)}
                className={["group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_12px_35px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-[2px] hover:border-sky-400/25 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 flex", spanCols, spanRows].join(" ")}
                aria-label="Bild vergrößern"
              >
                <Image
                  src={img.url}
                  alt={img.alt || ""}
                  width={900}
                  height={700}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                  loading="lazy"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-90" />
                {img.caption && (
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 m-2 rounded-xl border border-white/10 bg-black/30 px-2 py-1 text-[11px] text-white/90 backdrop-blur-md">
                    {img.caption}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {openIndex !== null && (
        <Lightbox images={images} index={openIndex} onClose={close} onChange={setOpenIndex} />
      )}
    </div>
  );
}

/* ======================= Lightbox ======================= */

function Lightbox({ images, index, onClose, onChange }) {
  const dialogRef = useRef(null);
  const startX = useRef(null);
  const count = images.length;

  const prev = useCallback(() => onChange(index > 0 ? index - 1 : count - 1), [index, count, onChange]);
  const next = useCallback(() => onChange(index < count - 1 ? index + 1 : 0), [index, count, onChange]);

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

  const onTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (startX.current === null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(dx) > 40) (dx > 0 ? prev() : next());
    startX.current = null;
  };

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
      className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md p-3 md:p-6 grid"
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="relative mx-auto flex w-full max-w-6xl flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Top bar (glass) */}
        <div className="mb-3 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-md">
            <span className="text-sky-200">{index + 1}</span>
            <span className="text-white/50">/</span>
            <span>{count}</span>
          </div>

          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-md transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            aria-label="Schließen"
          >
            <X className="h-4 w-4" />
            Close
          </button>
        </div>

        {/* Main image */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl">
          <Image
            src={images[index].url}
            alt={images[index].alt || ""}
            width={2200}
            height={1600}
            className="h-auto w-full select-none"
            priority
          />

          {/* Left/Right buttons (premium) */}
          <button
            onClick={prev}
            aria-label="Vorheriges Bild"
            className="absolute left-3 top-1/2 -translate-y-1/2 hidden md:inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white/90 backdrop-blur-md transition hover:bg-black/45 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            onClick={next}
            aria-label="Nächstes Bild"
            className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white/90 backdrop-blur-md transition hover:bg-black/45 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Hotspots for quick tap/drag */}
          <button onClick={prev} aria-label="Vorheriges Bild" className="absolute left-0 top-0 h-full w-1/3 md:hidden focus:outline-none" />
          <button onClick={next} aria-label="Nächstes Bild" className="absolute right-0 top-0 h-full w-1/3 md:hidden focus:outline-none" />
        </div>

        {/* Caption */}
        {(images[index].caption || images[index].alt) && (
          <div className="mt-3 text-[13px] text-white/85">{images[index].caption || images[index].alt}</div>
        )}

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button
                key={`${img.url}-${i}`}
                onClick={() => onChange(i)}
                aria-label={`Bild ${i + 1} anzeigen`}
                className={["shrink-0 rounded-xl border transition", i === index ? "border-sky-400 bg-white/10" : "border-white/10 bg-white/5 hover:bg-white/10"].join(" ")}
                style={{ lineHeight: 0 }}
              >
                <Image
                  src={img.url}
                  alt={img.alt || ""}
                  width={120}
                  height={90}
                  className={["h-16 w-24 object-cover rounded-lg", i === index ? "opacity-100" : "opacity-80"].join(" ")}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
