"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Home,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  motion,
  useReducedMotion,
} from "motion/react";

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

export default function HomeHero({
  hasActiveFilters,
  resultsCount,
}) {
  const reduceMotion = useReducedMotion();

  const reveal = (
    delay = 0,
    distance = 16,
  ) => ({
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
      delay: reduceMotion
        ? 0
        : delay,
      ease: [0.22, 1, 0.36, 1],
    },
  });

  return (
    <section
      className="
        relative
        isolate
        overflow-hidden

        bg-[#07131f]
        text-[#07131f]
      "
    >
      {/* =====================================================
          HINTERGRUND
      ====================================================== */}

      <div
        className="
          absolute
          inset-0
          -z-10
          overflow-hidden
        "
      >
        <motion.div
          className="
            absolute
            inset-0
          "
          initial={
            reduceMotion
              ? false
              : {
                  scale: 1.025,
                  opacity: 0.96,
                }
          }
          animate={{
            scale: 1,
            opacity: 1,
          }}
          transition={{
            scale: {
              duration: 1.8,
              ease: [
                0.22,
                1,
                0.36,
                1,
              ],
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
            quality={80}
            sizes="100vw"
            className="
              object-cover

              object-[74%_center]

              sm:object-[71%_center]

              md:object-[68%_center]

              lg:object-[66%_center]

              xl:object-[64%_center]

              2xl:object-[62%_center]
            "
          />
        </motion.div>

        {/* ===================================================
            MOBILE OVERLAY
        ==================================================== */}

        <div
          aria-hidden="true"
          className="
            absolute
            inset-0

            bg-gradient-to-b

            from-white/95
            via-white/84
            via-[55%]
            to-[#07131f]/96

            md:hidden
          "
        />

        {/* ===================================================
            TABLET / DESKTOP – LINKER TEXTVERLAUF
        ==================================================== */}

        <div
          aria-hidden="true"
          className="
            absolute
            inset-0

            hidden
            md:block

            md:bg-gradient-to-r
            md:from-white/98
            md:via-white/90
            md:via-[48%]
            md:to-white/5

            lg:via-white/86
            lg:via-[47%]

            xl:via-white/80
            xl:via-[44%]
            xl:to-transparent

            2xl:via-white/76
            2xl:via-[42%]
          "
        />

        {/* ===================================================
            UNTERER VERLAUF
        ==================================================== */}

        <div
          aria-hidden="true"
          className="
            absolute
            inset-0

            hidden
            md:block

            bg-gradient-to-t

            from-[#07131f]/96
            via-[#07131f]/10
            via-[25%]
            to-transparent

            xl:from-[#07131f]/94
            xl:via-[23%]
          "
        />

        {/* ===================================================
            FEINER LICHTVERLAUF OBEN
        ==================================================== */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            inset-x-0
            top-0

            hidden
            h-40

            bg-gradient-to-b
            from-white/20
            to-transparent

            lg:block
          "
        />
      </div>

      {/* =====================================================
          HERO CONTAINER
      ====================================================== */}

      <div
        className="
          mx-auto
          flex
          w-full
          max-w-[1680px]
          flex-col

          px-4
          pb-4
          pt-20

          sm:px-6
          sm:pb-6
          sm:pt-24

          md:min-h-[min(100svh,820px)]
          md:px-8
          md:pb-7
          md:pt-24

          lg:min-h-[min(94svh,860px)]
          lg:px-10
          lg:pb-8
          lg:pt-24

          xl:min-h-[min(92svh,880px)]
          xl:px-12
          xl:pt-28

          2xl:min-h-[min(88svh,900px)]
          2xl:max-w-[1840px]
          2xl:px-16

          min-[1800px]:px-20

          [@media(min-width:768px)_and_(max-height:780px)]:min-h-[100svh]
          [@media(min-width:768px)_and_(max-height:780px)]:pb-5
          [@media(min-width:768px)_and_(max-height:780px)]:pt-20

          [@media(min-width:768px)_and_(max-height:700px)]:pb-4
          [@media(min-width:768px)_and_(max-height:700px)]:pt-16
        "
      >
        {/* ===================================================
            HAUPTINHALT
        ==================================================== */}

        <div
          className="
            flex
            flex-1
            items-start

            py-8

            sm:py-10

            md:items-center
            md:py-10

            lg:py-12

            xl:py-14

            [@media(min-width:768px)_and_(max-height:780px)]:py-5

            [@media(min-width:768px)_and_(max-height:700px)]:py-3
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

              2xl:max-w-[760px]
            "
          >
            {/* ===============================================
                EYEBROW
            ================================================ */}

            <motion.p
              {...reveal(
                0.05,
                10,
              )}
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

                2xl:text-[13px]

                [@media(min-width:768px)_and_(max-height:700px)]:text-[10px]
              "
            >
              Nordsee · Ostsee ·
              Ferienunterkünfte
            </motion.p>

            {/* ===============================================
                HEADLINE
            ================================================ */}

            <motion.h1
              {...reveal(
                0.12,
                18,
              )}
              className="
                mt-3

                font-serif
                font-semibold

                leading-[0.94]

                tracking-[-0.045em]

                text-[#071b31]

                text-[clamp(2.65rem,13vw,4.15rem)]

                sm:mt-4
                sm:text-[clamp(3.55rem,10vw,4.75rem)]

                md:text-[clamp(4rem,7vw,5.2rem)]

                lg:text-[clamp(4.4rem,5.6vw,5.7rem)]

                xl:text-[clamp(4.9rem,5vw,5.95rem)]

                2xl:text-[6.15rem]

                [@media(min-width:768px)_and_(max-height:780px)]:text-[4.35rem]

                [@media(min-width:1024px)_and_(max-height:780px)]:text-[4.7rem]

                [@media(min-width:768px)_and_(max-height:700px)]:text-[3.9rem]

                [@media(min-width:1024px)_and_(max-height:700px)]:text-[4.2rem]
              "
            >
              <span className="block">
                Deine Auszeit
              </span>

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

            {/* ===============================================
                BESCHREIBUNG
            ================================================ */}

            <motion.p
              {...reveal(
                0.2,
                14,
              )}
              className="
                mt-5

                max-w-[520px]

                text-[14px]
                leading-6

                text-[#102033]/80

                sm:max-w-[550px]
                sm:text-[15px]
                sm:leading-7

                md:max-w-[570px]
                md:text-[15px]

                lg:max-w-[590px]
                lg:text-base
                lg:leading-7

                xl:text-[17px]
                xl:leading-8

                [@media(min-width:768px)_and_(max-height:780px)]:mt-4
                [@media(min-width:768px)_and_(max-height:780px)]:text-[14px]
                [@media(min-width:768px)_and_(max-height:780px)]:leading-6

                [@media(min-width:768px)_and_(max-height:700px)]:mt-3
              "
            >
              Entdecke handverlesene
              Ferienhäuser und Apartments
              an Nord- und Ostsee –
              persönlich ausgewählt,
              übersichtlich geplant und
              perfekt für Familie, Hund
              oder ruhige Tage am Wasser.
            </motion.p>

            {/* ===============================================
                BUTTONS
            ================================================ */}

            <motion.div
              {...reveal(
                0.28,
                14,
              )}
              className="
                mt-6

                flex
                flex-col
                gap-3

                sm:mt-7
                sm:flex-row
                sm:flex-wrap
                sm:items-center

                [@media(min-width:768px)_and_(max-height:780px)]:mt-5

                [@media(min-width:768px)_and_(max-height:700px)]:mt-4
              "
            >
              {/* Primary */}

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
                  focus-visible:ring-offset-2

                  sm:w-auto
                  sm:px-7
                  sm:py-3.5

                  [@media(min-width:768px)_and_(max-height:700px)]:min-h-11
                  [@media(min-width:768px)_and_(max-height:700px)]:py-2.5
                "
              >
                Unterkunft finden

                <ArrowRight
                  aria-hidden="true"
                  className="
                    h-5
                    w-5

                    transition-transform
                    duration-300

                    group-hover:translate-x-1
                  "
                />
              </a>

              {/* Secondary */}

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

                  bg-white/48

                  px-5
                  py-3

                  text-sm
                  font-extrabold

                  text-[#07131f]

                  shadow-[0_8px_28px_rgba(7,19,31,0.06)]

                  backdrop-blur-xl

                  transition-all
                  duration-300

                  hover:-translate-y-0.5
                  hover:border-[#07131f]/22
                  hover:bg-white/78
                  hover:shadow-[0_12px_32px_rgba(7,19,31,0.1)]

                  active:translate-y-0

                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-[#07131f]/35
                  focus-visible:ring-offset-2

                  sm:w-auto
                  sm:px-7
                  sm:py-3.5

                  [@media(min-width:768px)_and_(max-height:700px)]:min-h-11
                  [@media(min-width:768px)_and_(max-height:700px)]:py-2.5
                "
              >
                Angebote ansehen
              </Link>

              {/* Results */}

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

        {/* ===================================================
            TRUST BAR
        ==================================================== */}

        <motion.div
          {...reveal(
            0.4,
            18,
          )}
          className="
            grid
            w-full

            overflow-hidden

            rounded-[1.4rem]

            border
            border-white/10

            bg-[#061421]/94

            shadow-[0_24px_70px_rgba(0,0,0,0.30)]

            backdrop-blur-2xl

            md:grid-cols-3

            lg:max-w-[1120px]

            xl:max-w-[1180px]
            xl:rounded-[1.6rem]

            2xl:max-w-[1220px]

            [@media(min-width:768px)_and_(max-height:780px)]:rounded-[1.2rem]
          "
        >
          {trustItems.map(
            (
              item,
              index,
            ) => {
              const Icon =
                item.icon;

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

                    delay:
                      reduceMotion
                        ? 0
                        : 0.48 +
                          index *
                            0.07,

                    ease: [
                      0.22,
                      1,
                      0.36,
                      1,
                    ],
                  }}
                  className={`
                    flex
                    min-w-0
                    items-start

                    gap-4

                    p-4

                    text-white

                    sm:p-5

                    md:gap-3
                    md:p-4

                    lg:gap-4
                    lg:p-5

                    xl:p-6

                    2xl:gap-5

                    [@media(min-width:768px)_and_(max-height:780px)]:gap-3
                    [@media(min-width:768px)_and_(max-height:780px)]:p-4

                    [@media(min-width:768px)_and_(max-height:700px)]:p-3.5

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
                  {/* ICON */}

                  <div
                    className="
                      grid

                      h-11
                      w-11

                      shrink-0
                      place-items-center

                      rounded-2xl

                      border
                      border-white/[0.055]

                      bg-white/[0.045]

                      text-[#42a7ef]

                      transition
                      duration-300

                      group-hover:bg-white/[0.075]

                      lg:h-12
                      lg:w-12

                      [@media(min-width:768px)_and_(max-height:780px)]:h-10
                      [@media(min-width:768px)_and_(max-height:780px)]:w-10

                      [@media(min-width:768px)_and_(max-height:700px)]:h-9
                      [@media(min-width:768px)_and_(max-height:700px)]:w-9
                    "
                  >
                    <Icon
                      aria-hidden="true"
                      className="
                        h-6
                        w-6

                        stroke-[1.7]

                        lg:h-7
                        lg:w-7

                        [@media(min-width:768px)_and_(max-height:780px)]:h-5
                        [@media(min-width:768px)_and_(max-height:780px)]:w-5
                      "
                    />
                  </div>

                  {/* TEXT */}

                  <div
                    className="
                      min-w-0
                      pt-0.5
                    "
                  >
                    <h3
                      className="
                        text-sm
                        font-bold
                        leading-snug

                        text-white

                        lg:text-[15px]

                        [@media(min-width:768px)_and_(max-height:700px)]:text-[13px]
                      "
                    >
                      {
                        item.title
                      }
                    </h3>

                    <p
                      className="
                        mt-1.5

                        text-xs
                        leading-5

                        text-white/65

                        lg:text-sm
                        lg:leading-6

                        [@media(min-width:768px)_and_(max-height:780px)]:mt-1
                        [@media(min-width:768px)_and_(max-height:780px)]:text-[12px]
                        [@media(min-width:768px)_and_(max-height:780px)]:leading-5

                        [@media(min-width:768px)_and_(max-height:700px)]:text-[11px]
                        [@media(min-width:768px)_and_(max-height:700px)]:leading-4
                      "
                    >
                      {
                        item.text
                      }
                    </p>
                  </div>
                </motion.div>
              );
            },
          )}
        </motion.div>
      </div>
    </section>
  );
}