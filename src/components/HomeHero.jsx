"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

export default function HomeHero({ hasActiveFilters, resultsCount }) {
  const slides = useMemo(
    () => [
      { src: "/hero/hero-1.jpg", alt: "Küste & Strand" },
      { src: "/hero/hero-2.jpg", alt: "Ferienhaus am Meer" },
      { src: "/hero/hero-3.jpg", alt: "Hafen & Abendstimmung" },
    ],
    []
  );

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 5200);
    return () => clearInterval(t);
  }, [slides.length]);

  const container = {
    hidden: { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.65, ease: "easeOut", staggerChildren: 0.08 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 10, filter: "blur(6px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.55, ease: "easeOut" } },
  };

  return (
    <section className="relative overflow-hidden bg-[#050e1a] text-white">
      {/* BACKGROUND */}
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={slides[index].src}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute inset-0"
          >
            {/* Ken Burns (subtil) */}
            <motion.div
              className="absolute inset-0"
              initial={{ scale: 1.05, x: 0, y: 0 }}
              animate={{
                scale: 1.12,
                x: index % 2 === 0 ? 10 : -10,
                y: index % 2 === 0 ? -8 : 8,
              }}
              transition={{ duration: 6.2, ease: "easeOut" }}
            >
              <Image
                src={slides[index].src}
                alt={slides[index].alt}
                fill
                priority
                className="object-cover"
              />
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Overlay (Header-Style: deep navy glass + cyan glow) */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#061423]/92 via-[#061423]/58 to-black/15" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#061423]/78 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_30%,rgba(51,188,242,0.18),transparent_46%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_22%,rgba(13,136,211,0.14),transparent_42%)]" />

        {/* Floating light blobs (subtil, premium) */}
        <motion.div
          aria-hidden="true"
          className="absolute -left-24 top-24 h-64 w-64 rounded-full bg-sky-400/10 blur-3xl"
          animate={{ y: [0, -10, 0], x: [0, 8, 0] }}
          transition={{ duration: 8.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden="true"
          className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-sky-300/10 blur-3xl"
          animate={{ y: [0, 12, 0], x: [0, -10, 0] }}
          transition={{ duration: 9.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* CONTENT */}
      <div className="relative mx-auto max-w-6xl px-3 sm:px-4">
        {/* Platz für fixed header */}
        <div className="min-h-[70svh] pt-28 pb-12 md:min-h-[98vh] md:pt-32 md:pb-16">
          {/* Accent line (wie Header) */}
          <div className="mb-6 h-[2px] w-40 bg-gradient-to-r from-transparent via-sky-400/80 to-transparent" />

          <motion.div variants={container} initial="hidden" animate="show" className="max-w-2xl">
           <motion.div variants={item} className="flex items-center gap-3">
  <div className="flex items-center gap-3 rounded-xl bg-black/45 px-3 py-2 backdrop-blur-md border border-white/10">
    <img
      src="/urlaub-gosch-logo.png"
      alt="URLAUB-GOSCH Logo"
      className="h-12 w-auto drop-shadow-[0_6px_18px_rgba(0,0,0,0.7)]"
    />
    <div className="flex flex-col leading-tight">
      <span className="text-xs font-semibold tracking-[0.22em] uppercase text-white">
        Urlaub-GOSCH
      </span>
      <span className="text-[11px] text-white/75">
        Nord- & Ostsee • handverlesen
      </span>
    </div>
  </div>
</motion.div>


            <motion.p
              variants={item}
              className="mt-6 text-[11px] uppercase tracking-[0.22em] text-sky-100/80"
            >
              Welcome to
            </motion.p>

            <motion.h1
              variants={item}
              className="mt-2 text-4xl font-extrabold leading-[1.05] md:text-6xl"
            >
              URLAUB
              <span className="block text-sky-200">AN DER KÜSTE</span>
            </motion.h1>

            <motion.p variants={item} className="mt-4 text-sm text-sky-100/90 md:text-base">
              Klare Suche, echte Verfügbarkeiten und Unterkünfte, die wirklich passen –
              für Familien, Paare und Urlaub mit Hund.
            </motion.p>

            <motion.div variants={item} className="mt-5 flex flex-wrap gap-2 text-[11px] text-sky-100/85">
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 backdrop-blur">
                • Strandnah &amp; küstennah
              </span>
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 backdrop-blur">
                • Hund erlaubt (viele Objekte)
              </span>
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 backdrop-blur">
                • Geprüfte Unterkünfte
              </span>
            </motion.div>

            <motion.div variants={item} className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href="#suche"
                className="inline-flex items-center justify-center rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white
                shadow-[0_18px_40px_rgba(13,136,211,0.25)] hover:bg-sky-400"
              >
                Unterkunft suchen
              </a>

              <Link
                href="/offers"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white
                backdrop-blur hover:bg-white/10"
              >
                Specials
              </Link>

              {hasActiveFilters && (
                <span className="text-xs text-sky-100/75">{resultsCount} Treffer für deine Filter</span>
              )}
            </motion.div>

            {/* Slider dots */}
            <motion.div variants={item} className="mt-6 flex items-center gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={[
                    "h-1.5 w-7 rounded-full transition",
                    i === index
                      ? "bg-sky-300 shadow-[0_0_0_3px_rgba(51,188,242,0.12)]"
                      : "bg-white/20 hover:bg-white/35",
                  ].join(" ")}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </motion.div>

            {/* Subtle scroll hint */}
            <motion.div
              variants={item}
              className="mt-8 flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-sky-100/60"
            >
              <span className="inline-block h-[1px] w-10 bg-white/20" />
              scroll
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* bottom glow */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[-6rem] h-[14rem] opacity-60">
        <div className="absolute inset-x-[-40%] bottom-0 h-[12rem] rounded-[50%] bg-gradient-to-r from-sky-500/60 via-sky-300/40 to-sky-500/60 blur-3xl" />
      </div>
    </section>
    
  );
}
