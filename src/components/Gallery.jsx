"use client";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export default function Gallery({ images = [] }) {
  const [openIndex, setOpenIndex] = useState(null);

  if (!images?.length) {
    return (
      <div className="grid h-64 place-items-center rounded-2xl bg-slate-100 text-slate-500 ring-1 ring-black/5">
        Keine Fotos vorhanden.
      </div>
    );
  }

  const hero = images[0];
  const rest = images.slice(1);

  const openAt = useCallback((idx) => setOpenIndex(idx), []);
  const close = useCallback(() => setOpenIndex(null), []);

  // Show a nice set under hero (looks premium)
  const grid = rest.slice(0, 8);
  const remaining = Math.max(0, rest.length - grid.length);

  return (
    <div className="space-y-3">
      {/* HERO */}
      <button
        type="button"
        onClick={() => openAt(0)}
        className="group relative block min-h-11 w-full overflow-hidden rounded-2xl ring-1 ring-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
        aria-label="Hero Bild vergrößern"
      >
        <div className="relative aspect-[16/6] w-full">
          <Image
            src={hero.url}
            alt={hero.alt || ""}
            fill
            priority
            fetchPriority="high"
            quality={76}
            className="object-cover transition duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 900px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/0 to-black/0 opacity-90" />
          {(hero.caption || hero.alt) && (
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <div className="inline-flex max-w-[95%] rounded-lg bg-black/45 px-2.5 py-1.5 text-xs text-white backdrop-blur-sm">
                {hero.caption || hero.alt}
              </div>
            </div>
          )}
        </div>
      </button>

      {/* GRID */}
      {grid.length > 0 && (
        <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {grid.map((img, i) => {
            const realIndex = i + 1; // because hero is 0
            const isLast = i === grid.length - 1 && remaining > 0;

            return (
              <button
                key={img.id ?? `${img.url}-${i}`}
                type="button"
                onClick={() => openAt(realIndex)}
                className="group relative overflow-hidden rounded-xl ring-1 ring-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
                aria-label="Bild vergrößern"
              >
                <div className="relative aspect-[4/3] w-full">
                  <Image
                    src={img.url}
                    alt={img.alt || ""}
                    fill
                    loading="lazy"
                    quality={70}
                    className="object-cover transition duration-300 group-hover:scale-[1.03]"
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 300px"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
                  {isLast && (
                    <div className="absolute inset-0 grid place-items-center bg-black/45 backdrop-blur-[2px]">
                      <div className="rounded-xl bg-white/15 px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/20">
                        +{remaining}
                      </div>
                    </div>
                  )}
                </div>
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

/* ======================= Lightbox (clean) ======================= */

function Lightbox({ images, index: initialIndex = 0, onClose, onChange }) {
  const len = images?.length || 0;

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const safeInitial = clamp(initialIndex ?? 0, 0, Math.max(0, len - 1));
  const [index, setIndex] = useState(safeInitial);

  const stageRef = useRef(null);
  const trackRef = useRef(null);

  // Focus refs
  const dialogRef = useRef(null);
  const closeBtnRef = useRef(null);

  // gesture refs
  const isDown = useRef(false);
  const pointerId = useRef(null);

  const startX = useRef(0);
  const startY = useRef(0);
  const lastX = useRef(0);
  const lastT = useRef(0);

  const dx = useRef(0);
  const vx = useRef(0);

  const raf = useRef(null);
  const width = useRef(0);

  const captionId = "lightbox-caption";

  // sync when parent changes
  useEffect(() => {
    setIndex(clamp(initialIndex ?? 0, 0, Math.max(0, len - 1)));
  }, [initialIndex, len]);

  // report back
  useEffect(() => {
    onChange?.(index);
  }, [index, onChange]);

  const neighbors = useMemo(() => {
    if (!len) return new Set();
    const p = clamp(index - 1, 0, len - 1);
    const n = clamp(index + 1, 0, len - 1);
    return new Set([p, index, n]);
  }, [index, len]);

  const apply = useCallback(
    (offsetX = 0, animate = false) => {
      const el = trackRef.current;
      if (!el) return;

      const w = width.current || 1;
      const x = -index * w + offsetX;

      el.style.transition = animate
        ? "transform 280ms cubic-bezier(.2,.9,.2,1)"
        : "none";
      el.style.transform = `translate3d(${x}px,0,0)`;
    },
    [index]
  );

  const measure = useCallback(() => {
    width.current = stageRef.current?.clientWidth || window.innerWidth || 1;
    apply(0, false);
  }, [apply]);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure, { passive: true });
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  // body scroll lock
  useEffect(() => {
    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevPaddingRight = body.style.paddingRight;

    const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (scrollbarW > 0) body.style.paddingRight = `${scrollbarW}px`;

    return () => {
      body.style.overflow = prevOverflow || "";
      body.style.paddingRight = prevPaddingRight || "";
    };
  }, []);

  // snap on index
  useEffect(() => {
    apply(0, true);
  }, [index, apply]);

  // focus trap + keys
  useEffect(() => {
    const prevActive = document.activeElement;
    closeBtnRef.current?.focus?.({ preventScroll: true });

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "ArrowRight") setIndex((v) => clamp(v + 1, 0, len - 1));
      if (e.key === "ArrowLeft") setIndex((v) => clamp(v - 1, 0, len - 1));

      if (e.key === "Tab") {
        const root = dialogRef.current;
        if (!root) return;

        const focusables = root.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        const list = Array.from(focusables).filter((el) => {
          if (el.hasAttribute("disabled")) return false;
          if (el.getAttribute("aria-hidden") === "true") return false;
          return true;
        });

        if (!list.length) return;

        const first = list[0];
        const last = list[list.length - 1];
        const active = document.activeElement;

        if (e.shiftKey) {
          if (active === first || !root.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (active === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      prevActive?.focus?.({ preventScroll: true });
    };
  }, [len, onClose]);

  const schedule = () => {
    if (raf.current) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = null;
      apply(dx.current, false);
    });
  };

  const beginDrag = (clientX, clientY, pid = null, currentTarget = null) => {
    if (len <= 1) return;

    isDown.current = true;
    pointerId.current = pid;

    startX.current = clientX;
    startY.current = clientY;
    lastX.current = clientX;

    const now = performance.now();
    lastT.current = now;
    vx.current = 0;
    dx.current = 0;

    apply(0, false);

    if (pid != null && currentTarget?.setPointerCapture) {
      try {
        currentTarget.setPointerCapture(pid);
      } catch {}
    }
  };

  const moveDrag = (clientX, clientY, pid = null) => {
    if (!isDown.current) return;
    if (pid != null && pointerId.current != null && pid !== pointerId.current) return;

    const moveX = clientX - lastX.current;
    const totalX = clientX - startX.current;
    const totalY = clientY - startY.current;

    // Wenn vertikal dominiert: ignore
    if (Math.abs(totalY) > Math.abs(totalX) * 1.25) return;

    const now = performance.now();
    const dt = Math.max(1, now - lastT.current);
    lastT.current = now;

    vx.current = moveX / dt;
    lastX.current = clientX;

    dx.current += moveX;

    // edge resistance
    if ((index === 0 && dx.current > 0) || (index === len - 1 && dx.current < 0)) {
      dx.current *= 0.55;
    }

    schedule();
  };

  const endDrag = (currentTarget = null, pid = null) => {
    if (!isDown.current) return;
    isDown.current = false;

    if (pid != null && currentTarget?.releasePointerCapture) {
      try {
        currentTarget.releasePointerCapture(pid);
      } catch {}
    }
    pointerId.current = null;

    const w = width.current || window.innerWidth || 1;
    const distThreshold = Math.min(140, w * 0.18);
    const veloThreshold = 0.55;

    const goNext = dx.current <= -distThreshold || vx.current <= -veloThreshold;
    const goPrev = dx.current >= distThreshold || vx.current >= veloThreshold;

    if (goNext && index < len - 1) setIndex((v) => v + 1);
    else if (goPrev && index > 0) setIndex((v) => v - 1);
    else apply(0, true);

    dx.current = 0;
    vx.current = 0;
  };

  // Pointer events
  const onPointerDown = (e) => {
    if (e.target.closest("[data-noswipe]")) return;
    beginDrag(e.clientX, e.clientY, e.pointerId, e.currentTarget);
  };
  const onPointerMove = (e) => moveDrag(e.clientX, e.clientY, e.pointerId);
  const onPointerUp = (e) => endDrag(e.currentTarget, e.pointerId);

  // Touch fallback (iOS-safe)
  const onTouchStart = (e) => {
    if (e.target.closest("[data-noswipe]")) return;
    const t = e.touches?.[0];
    if (!t) return;
    beginDrag(t.clientX, t.clientY, null, null);
  };
  const onTouchMove = (e) => {
    const t = e.touches?.[0];
    if (!t) return;
    moveDrag(t.clientX, t.clientY, null);
  };
  const onTouchEnd = () => endDrag(null, null);

  const prev = () => setIndex((v) => clamp(v - 1, 0, len - 1));
  const next = () => setIndex((v) => clamp(v + 1, 0, len - 1));

  if (!images || !len) return null;

  return (
    <div
      ref={dialogRef}
      className="
        fixed inset-0 z-[100000]
        bg-black/80 backdrop-blur-[2px]
        flex items-center justify-center
        p-0 sm:p-6
        [padding-top:calc(env(safe-area-inset-top)+8px)]
        [padding-bottom:calc(env(safe-area-inset-bottom)+8px)]
        [padding-left:calc(env(safe-area-inset-left)+8px)]
        [padding-right:calc(env(safe-area-inset-right)+8px)]
      "
      role="dialog"
      aria-modal="true"
      aria-label="Bildergalerie"
      aria-describedby={captionId}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      {/* FIXED Top bar (immer über allem) */}
      <div className="fixed left-3 right-3 top-[calc(env(safe-area-inset-top)+12px)] z-[100001] sm:left-0 sm:right-0 sm:top-6 sm:mx-auto sm:max-w-5xl">
        <div className="flex items-center justify-between text-white/80">
          <div className="text-sm bg-black/35 border border-white/10 rounded-full px-3 py-1">
            {index + 1} / {len}
          </div>

          <button
            ref={closeBtnRef}
            onClick={onClose}
            data-noswipe
            className="h-10 px-3.5 rounded-full border border-white/15 bg-black/35 hover:bg-black/55 transition text-white"
            aria-label="Schließen"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content wrapper */}
      <div
        className="relative w-full sm:max-w-5xl h-[100svh] sm:h-auto"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Stage */}
        <div
          ref={stageRef}
          className="
            relative overflow-hidden
            h-[100svh] sm:h-auto
            rounded-none sm:rounded-2xl
            border-0 sm:border border-white/10
            bg-black
            shadow-none sm:shadow-[0_30px_80px_rgba(0,0,0,0.6)]
            select-none overscroll-contain
            [touch-action:none]
          "
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div ref={trackRef} className="flex will-change-transform">
            {images.map((img, i) => (
              <div
                key={`${img.id ?? img.url}-${i}`}
                className="
                  relative w-full shrink-0
                  h-[100svh] sm:h-auto
                  sm:aspect-[16/9]
                  bg-black
                "
              >
                {neighbors.has(i) ? (
                  <Image
                    src={img.url}
                    alt={img.alt || "Bild"}
                    fill
                    sizes="(max-width: 640px) 100vw, 960px"
                    className="object-contain"
                    loading={i === index ? "eager" : "lazy"}
                    priority={i === index}
                    draggable={false}
                  />
                ) : (
                  <div className="absolute inset-0 bg-black" />
                )}
              </div>
            ))}
          </div>

          {/* Arrows */}
          <div className="absolute inset-0 pointer-events-none">
            <button
              type="button"
              onClick={prev}
              disabled={index === 0}
              data-noswipe
              className="
                pointer-events-auto
                absolute left-3
                bottom-20 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2
                h-11 w-11 rounded-full
                border border-white/15 bg-white/5
                text-white hover:bg-white/10 transition
                disabled:opacity-30 disabled:cursor-not-allowed
              "
              aria-label="Vorheriges Bild"
            >
              ‹
            </button>

            <button
              type="button"
              onClick={next}
              disabled={index === len - 1}
              data-noswipe
              className="
                pointer-events-auto
                absolute right-3
                bottom-20 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2
                h-11 w-11 rounded-full
                border border-white/15 bg-white/5
                text-white hover:bg-white/10 transition
                disabled:opacity-30 disabled:cursor-not-allowed
              "
              aria-label="Nächstes Bild"
            >
              ›
            </button>
          </div>

          {/* Caption */}
          <div
            id={captionId}
            className="
              absolute bottom-3 left-1/2 -translate-x-1/2
              max-w-[92%]
              rounded-full
              bg-black/45 backdrop-blur
              px-4 py-1.5
              text-center text-xs sm:text-sm
              text-white/80
            "
          >
            {images[index]?.caption || images[index]?.alt || ""}
          </div>
        </div>
      </div>
    </div>
  );
}

