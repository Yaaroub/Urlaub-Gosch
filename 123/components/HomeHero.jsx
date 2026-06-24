"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, Star, Waves } from "lucide-react";

export default function HomeHero({ hasActiveFilters, resultsCount }) {
  const slides = useMemo(
    () => [
      { src: "/hero/hero-1.jpg", alt: "Kueste und Strand" },
      { src: "/hero/hero-2.jpg", alt: "Ferienhaus am Meer" },
      { src: "/hero/hero-3.jpg", alt: "Hafen und Abendstimmung" },
    ],
    []
  );

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 8500);

    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="relative isolate overflow-hidden bg-[#071827] text-white">
      <div className="absolute inset-0 -z-10">
        <div
          key={slides[index].src}
          className="absolute inset-0 animate-[heroFade_900ms_ease-out]"
        >
          <Image
            src={slides[index].src}
            alt={slides[index].alt}
            fill
            priority={index === 0}
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>

        <div className="absolute inset-0 bg-[#071827]/62 md:bg-[#071827]/42" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071827] via-[#071827]/55 to-[#071827]/12 md:hidden" />
        <div className="absolute inset-0 hidden bg-gradient-to-r from-[#071827]/95 via-[#071827]/66 to-[#071827]/8 md:block" />
        <div className="absolute inset-0 hidden bg-gradient-to-t from-[#071827] via-transparent to-[#071827]/20 md:block" />
      </div>

      <div
        className="
          relative mx-auto flex w-full max-w-7xl items-center px-4
          min-h-[620px] pb-20 pt-24
          min-[380px]:min-h-[660px]
          sm:min-h-[690px] sm:px-6 sm:pb-24 sm:pt-32
          md:min-h-[720px] md:pb-28 md:pt-32
          lg:min-h-[760px] lg:px-8 lg:pt-36
          xl:min-h-[800px]
        "
      >
        <div className="w-full max-w-[42rem] md:max-w-[46rem]">
          <div
            className="
              inline-flex max-w-full items-center gap-2 rounded-full
              border border-white/15 bg-white/[0.09]
              px-3 py-2 text-[10px] font-semibold uppercase
              tracking-[0.12em] text-white/82 backdrop-blur-xl
              sm:px-3.5 sm:text-xs sm:tracking-[0.16em]
            "
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#eecb83]" />
            <span className="min-w-0 truncate">Nordsee &middot; Ostsee &middot; Ferienunterkuenfte</span>
          </div>

          <h1
            className="
              mt-5 text-5xl font-semibold leading-[0.98]
              sm:mt-6 sm:text-6xl
              md:text-7xl md:leading-[0.96]
              lg:text-8xl
            "
          >
            Deine Auszeit
            <span className="block font-serif italic font-normal text-[#eecb83]">
              am Meer.
            </span>
          </h1>

          <p
            className="
              mt-5 max-w-[34rem] text-sm leading-6 text-white/80
              sm:mt-6 sm:text-base sm:leading-7
              md:max-w-2xl md:text-lg md:leading-8
            "
          >
            Entdecke komfortable Ferienhaeuser und Apartments an der Kueste -
            uebersichtlich geplant, persoenlich ausgewaehlt und ideal fuer Familie,
            Hund oder ruhige Tage am Wasser.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center">
            <a
              href="#suche"
              className="
                group inline-flex w-full items-center justify-center gap-2
                rounded-full bg-[#eecb83] px-5 py-3.5
                text-sm font-bold text-[#071827]
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
                px-5 py-3.5 text-sm font-semibold text-white
                backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/[0.14]
                sm:w-auto sm:px-7 sm:py-4
              "
            >
              Angebote ansehen
            </Link>

            {hasActiveFilters && (
              <span className="text-center text-sm text-white/68 sm:text-left">
                {resultsCount} Treffer
              </span>
            )}
          </div>

          <div className="mt-10 hidden max-w-2xl grid-cols-3 gap-3 lg:grid">
            {[
              {
                icon: Star,
                title: "Ausgewaehlt",
                text: "gepruefte Ferienunterkuenfte",
              },
              {
                icon: MapPin,
                title: "Kuestenlagen",
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
                    rounded-2xl border border-white/12
                    bg-white/[0.075] p-4 backdrop-blur-xl
                    shadow-[0_18px_60px_rgba(0,0,0,0.18)]
                  "
                >
                  <Icon className="h-4 w-4 text-[#eecb83]" />
                  <p className="mt-4 text-sm font-semibold text-white">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-white/58">
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2 rounded-full border border-white/12 bg-white/[0.08] px-3 py-2 backdrop-blur-xl sm:bottom-7">
          {slides.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Slide ${i + 1}`}
              className={[
                "h-2 rounded-full transition-all duration-300",
                i === index ? "w-8 bg-[#eecb83]" : "w-2 bg-white/35",
              ].join(" ")}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
