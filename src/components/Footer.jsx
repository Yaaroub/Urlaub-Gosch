import {
  ArrowRight,
  Compass,
  Headphones,
  Heart,
  Home,
  Mail,
  MapPin,
  ShieldCheck,
  UserRound,
  Waves,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import CookieSettingsButton from "@/components/CookieSettingsButton";

const HERO_IMAGE = "/hero/hero.jpeg";

const trustItems = [
  {
    icon: Home,
    title: "Handverlesen",
    text: "Ausgewählte Ferienunterkünfte an Nord- und Ostsee.",
  },
  {
    icon: UserRound,
    title: "Persönlich betreut",
    text: "Direkter Service vor, während und nach deinem Urlaub.",
  },
  {
    icon: ShieldCheck,
    title: "Sicher & transparent",
    text: "Klare Informationen und nachvollziehbare Abläufe.",
  },
];

const footerGroups = [
  {
    icon: Home,
    title: "Unterkünfte",
    description: "Deinen nächsten Urlaub finden.",
    links: [
      {
        label: "Unterkünfte & Angebote",
        href: "/offers",
      },
      {
        label: "Favoriten",
        href: "/favorites",
        icon: Heart,
      },
    ],
  },
  {
    icon: Compass,
    title: "Entdecken",
    description: "Die Küste und ihre Umgebung erleben.",
    links: [
      {
        label: "Aktivitäten & Ausflugsziele",
        href: "/aktivitaeten",
      },
      {
        label: "Regionen & Inspiration",
        href: "/blog",
      },
    ],
  },
  {
    icon: Headphones,
    title: "Urlaub-GOSCH",
    description: "Persönlich für Gäste und Eigentümer.",
    links: [
      {
        label: "Über uns",
        href: "/about",
      },
      {
        label: "Kontakt",
        href: "/contact",
      },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#050e1a] text-white">
      {/* obere Akzentlinie */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#e8c375]/80 to-transparent"
      />

      {/* Hintergrundeffekte */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-170px] h-[440px] w-[900px] -translate-x-1/2 rounded-full bg-sky-500/[0.08] blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 bottom-0 h-[400px] w-[400px] rounded-full bg-[#e8c375]/[0.04] blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
        {/* =========================================================
            TRUST BAR
        ========================================================= */}
        <section
          aria-label="Vorteile von Urlaub-GOSCH"
          className="
            grid overflow-hidden rounded-[1.75rem]
            border border-white/10
            bg-white/[0.035]
            shadow-[0_24px_80px_rgba(0,0,0,0.28)]
            backdrop-blur-xl
            md:grid-cols-3
          "
        >
          {trustItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className={[
                  "group flex gap-4 p-5 transition sm:p-6",
                  "hover:bg-white/[0.035]",
                  index !== 0
                    ? "border-t border-white/10 md:border-l md:border-t-0"
                    : "",
                ].join(" ")}
              >
                <div
                  className="
                    grid h-12 w-12 shrink-0 place-items-center
                    rounded-2xl
                    bg-[#e8c375]/10
                    text-[#e8c375]
                    ring-1 ring-[#e8c375]/15
                    transition
                    group-hover:bg-[#e8c375]/15
                  "
                >
                  <Icon className="h-5 w-5 stroke-[1.8]" />
                </div>

                <div>
                  <h2 className="font-serif text-lg font-semibold text-white">
                    {item.title}
                  </h2>

                  <p className="mt-1.5 text-sm leading-6 text-white/60">
                    {item.text}
                  </p>
                </div>
              </div>
            );
          })}
        </section>

        {/* =========================================================
            MAIN FOOTER
        ========================================================= */}
        <div className="mt-12 grid gap-12 lg:grid-cols-[0.9fr_1.6fr] lg:gap-16">
          {/* BRAND */}
          <div>
            <Link
              href="/"
              aria-label="Urlaub-GOSCH Startseite"
              className="inline-flex"
            >
              <Image
                src="/urlaub-gosch-logo.png"
                alt="Urlaub-GOSCH"
                width={180}
                height={96}
                sizes="180px"
                quality={82}
                className="h-16 w-auto object-contain sm:h-[78px]"
              />
            </Link>

            <p className="mt-6 font-serif text-xl font-semibold leading-snug text-[#e8c375]">
              Persönlich. Regional.
              <br />
              Vertrauensvoll.
            </p>

            <p className="mt-4 max-w-md text-sm leading-7 text-white/60 sm:text-[15px]">
              Ferienunterkünfte an Nord- und Ostsee entdecken und den Aufenthalt
              mit regionalen Tipps, Ausflugszielen und persönlichem Service
              planen.
            </p>

            {/* Kontakt */}
            <div className="mt-7 space-y-3">
              <Link
                href="/contact"
                className="
                  group flex w-fit items-center gap-3
                  text-sm font-semibold text-white/70
                  transition hover:text-white
                "
              >
                <span
                  className="
                    grid h-9 w-9 place-items-center
                    rounded-full
                    border border-white/10
                    bg-white/[0.035]
                    text-[#e8c375]
                    transition
                    group-hover:bg-white/[0.08]
                  "
                >
                  <Mail className="h-4 w-4" />
                </span>

                Kontakt aufnehmen
              </Link>

              <div className="flex items-center gap-3 text-sm text-white/55">
                <span
                  className="
                    grid h-9 w-9 place-items-center
                    rounded-full
                    border border-white/10
                    bg-white/[0.035]
                    text-[#e8c375]
                  "
                >
                  <MapPin className="h-4 w-4" />
                </span>

                Schleswig-Holstein &amp; Küste
              </div>
            </div>
          </div>

          {/* LINK-BEREICHE */}
          <nav
            aria-label="Footer Navigation"
            className="grid gap-4 sm:grid-cols-3"
          >
            {footerGroups.map((group) => (
              <FooterCard
                key={group.title}
                {...group}
              />
            ))}
          </nav>
        </div>

        {/* =========================================================
            OWNER CTA
        ========================================================= */}
        <section
          className="
            relative mt-12 overflow-hidden
            rounded-[2rem]
            border border-white/10
            bg-white/[0.035]
            shadow-[0_24px_80px_rgba(0,0,0,0.24)]
          "
        >
          <div className="grid md:grid-cols-[290px_1fr] lg:grid-cols-[360px_1fr]">
            <div className="relative min-h-[220px] overflow-hidden md:min-h-full">
              <Image
                src={HERO_IMAGE}
                alt="Ferienimmobilie an der Küste"
                fill
                quality={72}
                sizes="(max-width: 768px) 100vw, 360px"
                className="object-cover object-center"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-[#050e1a]/15 to-[#050e1a]/50 md:bg-gradient-to-r md:from-transparent md:to-[#050e1a]/65" />
            </div>

            <div className="relative p-6 sm:p-8 lg:p-10">
              <div className="max-w-3xl">
                <span
                  className="
                    inline-flex rounded-full
                    border border-[#e8c375]/20
                    bg-[#e8c375]/10
                    px-3 py-1.5
                    text-[10px] font-extrabold
                    uppercase tracking-[0.2em]
                    text-[#e8c375]
                  "
                >
                  Für Eigentümer
                </span>

                <h2 className="mt-5 font-serif text-3xl leading-[1.1] text-white sm:text-4xl">
                  Ihre Ferienimmobilie
                  <span className="text-[#e8c375]"> professionell präsentieren.</span>
                </h2>

                <p className="mt-5 max-w-2xl text-sm leading-7 text-white/62 sm:text-base">
                  Urlaub-GOSCH unterstützt Eigentümer bei der Präsentation und
                  Vermarktung ihrer Ferienunterkunft – persönlich, strukturiert
                  und mit direktem Kontakt.
                </p>

                <Link
                  href="/contact"
                  className="
                    group mt-7 inline-flex min-h-12
                    w-full items-center justify-center gap-3
                    rounded-2xl
                    bg-[#e8c375]
                    px-6 py-3.5
                    text-sm font-extrabold
                    text-[#07131f]
                    shadow-[0_12px_35px_rgba(232,195,117,0.14)]
                    transition
                    hover:-translate-y-0.5
                    hover:bg-[#f2d58e]
                    sm:w-auto
                  "
                >
                  Ferienimmobilie anbieten

                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            BOTTOM BAR
        ========================================================= */}
        <div
          className="
            mt-10 flex flex-col gap-5
            border-t border-white/10
            pt-7
            text-sm text-white/45
            md:flex-row
            md:items-center
            md:justify-between
          "
        >
          <p>
            © {new Date().getFullYear()} Urlaub-GOSCH. Alle Rechte vorbehalten.
          </p>

          <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
  <Link
    href="/"
    className="transition hover:text-white"
  >
    Startseite
  </Link>

  <Link
    href="/impressum"
    className="transition hover:text-white"
  >
    Impressum
  </Link>

  <Link
    href="/datenschutz"
    className="transition hover:text-white"
  >
    Datenschutz
  </Link>

  <CookieSettingsButton className="transition hover:text-white" />

  <Link
    href="/agb"
    className="transition hover:text-white"
  >
    AGB
  </Link>
</div>
        </div>
      </div>
    </footer>
  );
}

function FooterCard({
  icon: Icon,
  title,
  description,
  links,
}) {
  return (
    <div
      className="
        group relative overflow-hidden
        rounded-[1.65rem]
        border border-white/10
        bg-white/[0.035]
        p-5
        transition duration-300
        hover:-translate-y-1
        hover:border-white/15
        hover:bg-white/[0.055]
        hover:shadow-[0_20px_50px_rgba(0,0,0,0.18)]
        sm:p-6
      "
    >
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute
          -right-12 -top-12
          h-28 w-28 rounded-full
          bg-[#e8c375]/[0.035]
          blur-2xl
          transition
          group-hover:bg-[#e8c375]/[0.07]
        "
      />

      <div
        className="
          relative grid h-11 w-11
          place-items-center
          rounded-2xl
          bg-[#e8c375]/10
          text-[#e8c375]
          ring-1 ring-[#e8c375]/15
        "
      >
        <Icon className="h-5 w-5" />
      </div>

      <h3
        className="
          relative mt-5
          text-xs font-extrabold
          uppercase tracking-[0.18em]
          text-white
        "
      >
        {title}
      </h3>

      <p className="relative mt-2 min-h-10 text-xs leading-5 text-white/45">
        {description}
      </p>

      <ul className="relative mt-6 space-y-1">
        {links.map((item) => {
          const LinkIcon = item.icon;

          return (
            <li key={item.label}>
              <Link
                href={item.href}
                className="
                  group/link flex min-h-10
                  items-center justify-between gap-3
                  rounded-xl
                  px-3 py-2
                  text-sm font-medium
                  text-white/65
                  transition
                  hover:bg-white/[0.055]
                  hover:text-white
                "
              >
                <span className="flex items-center gap-2">
                  {LinkIcon ? (
                    <LinkIcon className="h-3.5 w-3.5 text-[#e8c375]" />
                  ) : null}

                  {item.label}
                </span>

                <ArrowRight
                  className="
                    h-3.5 w-3.5
                    -translate-x-1
                    text-white/20
                    opacity-0
                    transition
                    group-hover/link:translate-x-0
                    group-hover/link:opacity-100
                  "
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}