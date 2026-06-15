"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, MapPin, Star, Waves } from "lucide-react";

export default function HomeHero({ hasActiveFilters, resultsCount }) {
  const slides = useMemo(
    () => [
      { src: "/hero/hero-1.jpg", alt: "Küste und Strand" },
      { src: "/hero/hero-2.jpg", alt: "Ferienhaus am Meer" },
      { src: "/hero/hero-3.jpg", alt: "Hafen und Abendstimmung" },
    ],
    []
  );

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 7500);

    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="relative isolate overflow-hidden bg-[#081522] text-white">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={slides[index].src}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            <Image
              src={slides[index].src}
              alt={slides[index].alt}
              fill
              priority={index === 0}
              sizes="100vw"
              className="object-cover"
            />
          </motion.div>
        </AnimatePresence>

        {/* Mobile: image darker, text always readable */}
        <div className="absolute inset-0 bg-[#081522]/55 md:bg-[#081522]/35" />

        <div className="absolute inset-0 bg-gradient-to-t from-[#081522] via-[#081522]/55 to-[#081522]/20 md:hidden" />

        {/* Desktop: cinematic side overlay */}
        <div className="absolute inset-0 hidden bg-gradient-to-r from-[#081522]/95 via-[#081522]/68 to-[#081522]/10 md:block" />
        <div className="absolute inset-0 hidden bg-gradient-to-t from-[#081522] via-transparent to-[#081522]/25 md:block" />
      </div>

      {/* Content */}
      <div
        className="
          mx-auto flex w-full max-w-7xl items-center px-4
          min-h-[calc(100svh-0px)]
          pb-20 pt-28
          sm:px-6 sm:pb-24 sm:pt-32
          md:min-h-[720px] md:pb-28 md:pt-36
          lg:min-h-[780px] lg:px-8
          xl:min-h-[840px]
          2xl:min-h-[900px]
        "
      >
        <div className="w-full max-w-[680px] md:max-w-[740px]">
          {/* Small label */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="
              inline-flex max-w-full items-center gap-2 rounded-full
              border border-white/15 bg-white/[0.09]
              px-3.5 py-2 text-[10px] font-semibold uppercase
              tracking-[0.16em] text-white/78 backdrop-blur-xl
              sm:text-xs sm:tracking-[0.2em]
            "
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#f5d89e]" />
            <span className="truncate">Nordsee · Ostsee · Ferienunterkünfte</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.08 }}
            className="
              mt-6 font-semibold leading-[0.96] tracking-[-0.065em]
              text-[clamp(2.7rem,12vw,4.2rem)]
              sm:text-[clamp(3.4rem,10vw,5rem)]
              md:text-[clamp(4rem,7.5vw,6.1rem)]
            "
          >
            Deine Auszeit
            <span className="block font-serif italic font-normal tracking-[-0.04em] text-[#f5d89e]">
              am Meer.
            </span>
          </motion.h1>

          {/* Text */}
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.16 }}
            className="
              mt-5 max-w-xl text-[15px] leading-7 text-white/76
              sm:mt-6 sm:text-base sm:leading-8
              md:max-w-2xl md:text-lg
            "
          >
            Entdecke komfortable Ferienhäuser und Apartments an der Küste —
            übersichtlich geplant, persönlich ausgewählt und ideal für Familie,
            Hund oder ruhige Tage am Wasser.
          </motion.p>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.24 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <a
              href="#suche"
              className="
                group inline-flex w-full items-center justify-center gap-2
                rounded-full bg-[#f5d89e] px-6 py-3.5
                text-sm font-bold text-[#081522]
                shadow-[0_18px_55px_rgba(0,0,0,0.28)]
                transition hover:-translate-y-0.5 hover:bg-white
                sm:w-auto sm:px-7 sm:py-4
              "
            >
              Unterkunft finden
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </a>

            <Link
              href="/offers"
              className="
                inline-flex w-full items-center justify-center
                rounded-full border border-white/18 bg-white/[0.08]
                px-6 py-3.5 text-sm font-semibold text-white
                backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/[0.14]
                sm:w-auto sm:px-7 sm:py-4
              "
            >
              Angebote ansehen
            </Link>

            {hasActiveFilters && (
              <span className="text-center text-sm text-white/65 sm:text-left">
                {resultsCount} Treffer
              </span>
            )}
          </motion.div>

          {/* Desktop trust cards only */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.32 }}
            className="mt-10 hidden max-w-2xl grid-cols-3 gap-3 md:grid"
          >
            {[
              {
                icon: Star,
                title: "Ausgewählt",
                text: "geprüfte Ferienunterkünfte",
              },
              {
                icon: MapPin,
                title: "Küstenlagen",
                text: "Nordsee und Ostsee",
              },
              {
                icon: Waves,
                title: "Meerzeit",
                text: "ruhig und komfortabel",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="
                    rounded-[1.4rem] border border-white/12
                    bg-white/[0.075] p-4 backdrop-blur-xl
                    shadow-[0_18px_60px_rgba(0,0,0,0.18)]
                  "
                >
                  <Icon className="h-4 w-4 text-[#f5d89e]" />
                  <p className="mt-4 text-sm font-semibold text-white">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-white/55">
                    {item.text}
                  </p>
                </div>
              );
            })}
          </motion.div>
        </div>

        {/* Dots */}
        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2 rounded-full border border-white/12 bg-white/[0.08] px-3 py-2 backdrop-blur-xl sm:bottom-7">
          {slides.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Slide ${i + 1}`}
              className={[
                "h-2 rounded-full transition-all duration-300",
                i === index ? "w-8 bg-[#f5d89e]" : "w-2 bg-white/35",
              ].join(" ")}
            />
          ))}
        </div>
      </div>
    </section>
  );
}