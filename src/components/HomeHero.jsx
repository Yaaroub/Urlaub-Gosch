import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Home, ShieldCheck, UserRound } from "lucide-react";

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
  return (
    <section
      className="
        relative isolate overflow-hidden
        bg-[#07131f]
        text-[#07131f]
      "
    >
      {/* Hintergrund */}
      <div className="absolute inset-0 -z-10">
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
            object-[70%_center]
            sm:object-[68%_center]
            md:object-[66%_center]
            lg:object-[62%_center]
            xl:object-center
          "
        />

        {/* Mobile */}
        <div
          className="
            absolute inset-0
            bg-gradient-to-b
            from-white/95
            via-white/80
            via-60%
            to-[#07131f]/95
            md:hidden
          "
        />

        {/* Tablet / Desktop */}
        <div
          className="
            absolute inset-0 hidden md:block
            bg-gradient-to-r
            from-white/98
            via-white/82
            via-50%
            to-white/5
          "
        />

        <div
          className="
            absolute inset-0 hidden md:block
            bg-gradient-to-t
            from-[#07131f]/90
            via-[#07131f]/10
            to-transparent
          "
        />
      </div>

      {/* Inhalt */}
      <div
        className="
          mx-auto flex w-full max-w-7xl flex-col
          px-4
          pb-5
          pt-24

          sm:px-6
          sm:pb-6
          sm:pt-28

          md:min-h-[720px]
          md:px-8
          md:pb-7
          md:pt-28

          lg:min-h-[760px]
          lg:px-10
          lg:pb-8
          lg:pt-32

          xl:min-h-[min(920px,100svh)]
        "
      >
        {/* Hero Text */}
        <div
          className="
            flex flex-1 items-start
            pt-8

            sm:pt-10

            md:items-center
            md:pt-0

            lg:py-10

            xl:py-12
          "
        >
          <div
            className="
              w-full
              max-w-[560px]

              sm:max-w-[600px]

              md:max-w-[620px]

              lg:max-w-[680px]
            "
          >
            <p
              className="
                text-[10px]
                font-bold
                uppercase
                tracking-[0.22em]
                text-[#ad8d47]

                sm:text-[11px]
                sm:tracking-[0.3em]

                md:text-xs
                md:tracking-[0.34em]
              "
            >
              Nordsee · Ostsee · Ferienunterkünfte
            </p>

            <h1
              className="
                mt-4
                font-serif
                font-semibold
                leading-[0.92]
                tracking-[-0.05em]
                text-[#071b31]

                text-[clamp(3rem,14vw,4.6rem)]

                sm:text-[clamp(3.8rem,10vw,5.2rem)]

                md:text-[clamp(4.2rem,8vw,5.5rem)]

                lg:text-[clamp(4.6rem,6.5vw,6rem)]
              "
            >
              Deine Auszeit

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
            </h1>

            <p
              className="
                mt-5
                max-w-[540px]
                text-[14px]
                leading-6
                text-[#102033]/80

                sm:text-[15px]
                sm:leading-7

                md:max-w-[600px]
                md:text-base
                md:leading-7

                lg:text-[17px]
                lg:leading-8
              "
            >
              Entdecke handverlesene Ferienhäuser und Apartments an Nord- und
              Ostsee – persönlich ausgewählt, übersichtlich geplant und perfekt
              für Familie, Hund oder ruhige Tage am Wasser.
            </p>

            {/* Buttons */}
            <div
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
                  transition

                  hover:-translate-y-0.5
                  hover:bg-[#f2d58e]

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
                    h-5 w-5
                    transition-transform
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
                  transition

                  hover:-translate-y-0.5
                  hover:bg-white/70

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
            </div>
          </div>
        </div>

        {/* Trust Bereich */}
        <div
          className="
            mt-10
            grid
            w-full
            overflow-hidden
            rounded-[1.4rem]
            border
            border-white/10
            bg-[#061421]/92
            shadow-[0_24px_70px_rgba(0,0,0,0.28)]
            backdrop-blur-2xl

            sm:mt-12

            md:mt-6
            md:grid-cols-3

            lg:max-w-[1000px]
          "
        >
          {trustItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
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
                  md:p-5

                  lg:flex-row
                  lg:gap-4
                  lg:p-5

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
                <div
                  className="
                    grid
                    h-11
                    w-11
                    shrink-0
                    place-items-center
                    rounded-2xl
                    bg-white/[0.04]
                    text-[#3b9ae8]

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
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}