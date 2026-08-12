"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Home, ShieldCheck, UserRound } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

const HERO_IMAGE = "/hero/hero.jpeg";

const trustItems = [
  {
    icon: Home,
    title: "Ausgewählte Unterkünfte",
    text: "Sorgfältig kuratiert an Nord- und Ostsee.",
  },
  {
    icon: UserRound,
    title: "Persönlicher Service",
    text: "Vor, während und nach deinem Urlaub.",
  },
  {
    icon: ShieldCheck,
    title: "Sicher & fair",
    text: "Transparente Abläufe und direkte Buchung.",
  },
];

export default function HomeHero({ hasActiveFilters, resultsCount }) {
  const reduceMotion = useReducedMotion();

  const reveal = (delay = 0, distance = 16) => ({
    initial: reduceMotion
      ? false
      : {
          opacity: 0,
          y: distance,
        },
    animate: {
      opacity: 1,
      y: 0,
    },
    transition: {
      duration: 0.7,
      delay: reduceMotion ? 0 : delay,
      ease: [0.22, 1, 0.36, 1],
    },
  });

  return (
    <section
      className="
        relative isolate overflow-hidden
        bg-[#07131f]
        text-[#07131f]
      "
    >
      {/* Hintergrund */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute inset-0"
          initial={
            reduceMotion
              ? false
              : {
                  scale: 1.035,
                  opacity: 0.94,
                }
          }
          animate={{
            scale: 1,
            opacity: 1,
          }}
          transition={{
            scale: {
              duration: 1.8,
              ease: [0.22, 1, 0.36, 1],
            },
            opacity: {
              duration: 0.8,
            },
          }}
        >
          <Image
            src={HERO_IMAGE}
            alt="Ferienhaus am Meer"
            fill
            priority
            fetchPriority="high"
            quality={78}
            sizes="100vw"
            className="
              object-cover

              object-[72%_center]

              sm:object-[69%_center]

              md:object-[66%_center]

              lg:object-[63%_center]

              xl:object-center
            "
          />
        </motion.div>

        {/* Mobile Overlay */}
        <div
          className="
            absolute inset-0

            bg-gradient-to-b
            from-white/95
            via-white/82
            via-[58%]
            to-[#07131f]/96

            md:hidden
          "
        />

        {/* Tablet / Desktop Overlay */}
        <div
          className="
            absolute inset-0
            hidden

            md:block
            md:bg-gradient-to-r
            md:from-white/98
            md:via-white/86
            md:via-[52%]
            md:to-white/5
          "
        />

        {/* Unterer Verlauf Desktop */}
        <div
          className="
            absolute inset-0
            hidden

            md:block
            md:bg-gradient-to-t
            md:from-[#07131f]/94
            md:via-[#07131f]/12
            md:via-[28%]
            md:to-transparent
          "
        />
      </div>

      {/* Gesamter Hero-Inhalt */}
      <div
        className="
          mx-auto
          flex
          w-full
          max-w-[1440px]
          flex-col

          px-4
          pb-4
          pt-20

          sm:px-6
          sm:pb-6
          sm:pt-24

          md:min-h-[clamp(720px,92svh,900px)]
          md:px-8
          md:pb-7
          md:pt-24

          lg:min-h-[clamp(740px,92svh,920px)]
          lg:px-10
          lg:pb-8
          lg:pt-28

          xl:px-12
        "
      >
        {/* Hauptinhalt */}
        <div
          className="
            flex
            flex-1
            items-start

            py-8

            sm:py-10

            md:items-center
            md:py-12

            lg:py-14
          "
        >
          <div
            className="
              w-full
              max-w-[570px]

              sm:max-w-[610px]

              md:max-w-[630px]

              lg:max-w-[680px]

              xl:max-w-[720px]
            "
          >
            {/* Eyebrow */}
            <motion.p
              {...reveal(0.05, 10)}
              className="
                text-[10px]
                font-bold
                uppercase
                tracking-[0.22em]
                text-[#ad8d47]

                sm:text-[11px]
                sm:tracking-[0.28em]

                md:text-xs
                md:tracking-[0.32em]
              "
            >
              Nordsee · Ostsee · Ferienunterkünfte
            </motion.p>

            {/* Überschrift */}
            <motion.h1
              {...reveal(0.12, 18)}
              className="
                mt-3

                font-serif
                font-semibold
                leading-[0.94]
                tracking-[-0.045em]
                text-[#071b31]

                text-[clamp(2.65rem,13vw,4.15rem)]

                sm:mt-4
                sm:text-[clamp(3.6rem,10vw,4.8rem)]

                md:text-[clamp(4rem,7.5vw,5.4rem)]

                lg:text-[clamp(4.5rem,6vw,5.9rem)]

                xl:text-[6rem]
              "
            >
              <span className="block">Deine Auszeit</span>

              <span
                className="
                  block
                  font-normal
                  italic
                  text-[#d2ad69]
                "
              >
                am Meer.
              </span>
            </motion.h1>

            {/* Beschreibung */}
            <motion.p
              {...reveal(0.2, 14)}
              className="
                mt-5
                max-w-[520px]

                text-[14px]
                leading-6
                text-[#102033]/80

                sm:max-w-[550px]
                sm:text-[15px]
                sm:leading-7

                md:max-w-[580px]
                md:text-base

                lg:text-[17px]
                lg:leading-8
              "
            >
              Entdecke handverlesene Ferienhäuser und Apartments an Nord- und
              Ostsee – persönlich ausgewählt, übersichtlich geplant und perfekt
              für Familie, Hund oder ruhige Tage am Wasser.
            </motion.p>

            {/* Aktionen */}
            <motion.div
              {...reveal(0.28, 14)}
              className="
                mt-6
                flex
                flex-col
                gap-3

                sm:mt-7
                sm:flex-row
                sm:flex-wrap
                sm:items-center
              "
            >
              <a
                href="#suche"
                className="
                  group

                  inline-flex
                  min-h-12
                  w-full
                  items-center
                  justify-center
                  gap-3

                  rounded-2xl
                  bg-[#e8c375]

                  px-5
                  py-3

                  text-sm
                  font-extrabold
                  text-[#07131f]

                  shadow-[0_18px_50px_rgba(7,19,31,0.18)]

                  transition-all
                  duration-300

                  hover:-translate-y-0.5
                  hover:bg-[#f2d58e]
                  hover:shadow-[0_22px_55px_rgba(7,19,31,0.23)]

                  active:translate-y-0

                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-[#07131f]/45

                  sm:w-auto
                  sm:px-7
                  sm:py-3.5
                "
              >
                Unterkunft finden

                <ArrowRight
                  className="
                    h-5
                    w-5

                    transition-transform
                    duration-300

                    group-hover:translate-x-1
                  "
                />
              </a>

              <Link
                href="/offers"
                className="
                  inline-flex
                  min-h-12
                  w-full
                  items-center
                  justify-center

                  rounded-2xl

                  border
                  border-[#07131f]/15

                  bg-white/45

                  px-5
                  py-3

                  text-sm
                  font-extrabold
                  text-[#07131f]

                  backdrop-blur-xl

                  transition-all
                  duration-300

                  hover:-translate-y-0.5
                  hover:border-[#07131f]/20
                  hover:bg-white/75

                  active:translate-y-0

                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-[#07131f]/35

                  sm:w-auto
                  sm:px-7
                  sm:py-3.5
                "
              >
                Angebote ansehen
              </Link>

              {hasActiveFilters && (
                <span
                  className="
                    w-full
                    pt-1

                    text-center
                    text-sm
                    font-semibold
                    text-[#07131f]/70

                    sm:w-auto
                    sm:pt-0
                    sm:text-left
                  "
                >
                  {resultsCount} Treffer
                </span>
              )}
            </motion.div>
          </div>
        </div>

        {/* Trust Bereich */}
        <motion.div
          {...reveal(0.4, 18)}
          className="
            grid
            w-full
            overflow-hidden

            rounded-[1.4rem]

            border
            border-white/10

            bg-[#061421]/92

            shadow-[0_24px_70px_rgba(0,0,0,0.28)]

            backdrop-blur-2xl

            md:grid-cols-3

            lg:max-w-[1050px]

            xl:rounded-[1.6rem]
          "
        >
          {trustItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.div
                key={item.title}
                initial={
                  reduceMotion
                    ? false
                    : {
                        opacity: 0,
                        y: 10,
                      }
                }
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.55,
                  delay: reduceMotion ? 0 : 0.48 + index * 0.07,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={`
                  flex
                  min-w-0
                  items-start
                  gap-4

                  p-4

                  text-white

                  sm:p-5

                  md:flex-col
                  md:gap-3
                  md:p-4

                  lg:p-5

                  xl:flex-row
                  xl:gap-4
                  xl:p-6

                  ${
                    index !== 0
                      ? `
                        border-t
                        border-white/10

                        md:border-l
                        md:border-t-0
                      `
                      : ""
                  }
                `}
              >
                {/* Icon */}
                <div
                  className="
                    grid
                    h-11
                    w-11
                    shrink-0
                    place-items-center

                    rounded-2xl

                    bg-white/[0.045]

                    text-[#3b9ae8]

                    transition
                    duration-300

                    hover:bg-white/[0.075]

                    lg:h-12
                    lg:w-12
                  "
                >
                  <Icon
                    className="
                      h-6
                      w-6
                      stroke-[1.7]

                      lg:h-7
                      lg:w-7
                    "
                  />
                </div>

                {/* Text */}
                <div className="min-w-0">
                  <h3
                    className="
                      text-sm
                      font-bold
                      leading-snug
                      text-white

                      lg:text-[15px]
                    "
                  >
                    {item.title}
                  </h3>

                  <p
                    className="
                      mt-1.5

                      text-xs
                      leading-5
                      text-white/65

                      lg:text-sm
                      lg:leading-6
                    "
                  >
                    {item.text}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}