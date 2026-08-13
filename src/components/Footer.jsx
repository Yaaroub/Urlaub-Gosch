import {
  ArrowRight,
  Compass,
  Facebook,
  Heart,
  Home,
  Instagram,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
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

const accommodationLinks = [
  {
    label: "Unterkünfte & Angebote",
    href: "/offers",
  },
  {
    label: "Favoriten",
    href: "/favorites",
    icon: Heart,
  },
];

const discoverLinks = [
  {
    label: "Regionen & Inspiration",
    href: "/blog",
  },
  {
    label: "Aktivitäten & Ausflugsziele",
    href: "/aktivitaeten",
  },
];

const companyLinks = [
  {
    label: "Über uns",
    href: "/about",
  },
  {
    label: "Kontakt",
    href: "/contact",
  },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#050e1a] text-white">
      {/* =========================================================
          AMBIENT BACKGROUND
      ========================================================= */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute inset-x-0 top-0 h-px
          bg-gradient-to-r
          from-transparent
          via-[#e8c375]/80
          to-transparent
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute
          left-1/2 top-[-280px]
          h-[560px] w-[1100px]
          -translate-x-1/2
          rounded-full
          bg-sky-500/[0.055]
          blur-3xl
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute
          -right-52 bottom-20
          h-[520px] w-[520px]
          rounded-full
          bg-[#e8c375]/[0.035]
          blur-3xl
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute
          -left-52 bottom-[-180px]
          h-[460px] w-[460px]
          rounded-full
          bg-sky-400/[0.025]
          blur-3xl
        "
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* =========================================================
            TRUST STRIP
        ========================================================= */}

        <section
          aria-label="Vorteile von Urlaub-GOSCH"
          className="
            grid
            border-b border-white/[0.07]
            py-6
            md:grid-cols-3
            md:py-8
          "
        >
          {trustItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className={[
                  "group flex items-start gap-4 py-4",
                  "md:px-7 md:py-1",
                  index === 0 ? "md:pl-0" : "",
                  index === trustItems.length - 1 ? "md:pr-0" : "",
                  index !== 0
                    ? "border-t border-white/[0.065] md:border-l md:border-t-0"
                    : "",
                ].join(" ")}
              >
                <div
                  className="
                    grid h-11 w-11 shrink-0
                    place-items-center
                    rounded-2xl
                    border border-[#e8c375]/20
                    bg-[#e8c375]/[0.07]
                    text-[#e8c375]
                    shadow-[0_8px_30px_rgba(232,195,117,0.035)]
                    transition-all duration-300
                    group-hover:border-[#e8c375]/35
                    group-hover:bg-[#e8c375]/[0.11]
                  "
                >
                  <Icon className="h-[18px] w-[18px] stroke-[1.8]" />
                </div>

                <div className="min-w-0">
                  <h2 className="font-serif text-[17px] font-semibold text-white">
                    {item.title}
                  </h2>

                  <p className="mt-1.5 max-w-[290px] text-[13px] leading-5 text-white/40">
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

        <div
          className="
            grid gap-x-10 gap-y-12
            py-12
            sm:grid-cols-2
            lg:py-16
            xl:grid-cols-[1.45fr_0.8fr_0.95fr_0.7fr_1.3fr]
            xl:gap-x-11
          "
        >
          {/* =====================================================
              BRAND
          ===================================================== */}

          <div className="sm:col-span-2 xl:col-span-1">
            <Link
              href="/"
              aria-label="Urlaub-GOSCH Startseite"
              className="inline-flex"
            >
              <Image
                src="/urlaub-gosch-logo.png"
                alt="Urlaub-GOSCH"
                width={190}
                height={100}
                sizes="190px"
                quality={82}
                className="h-[74px] w-auto object-contain"
              />
            </Link>

            <h2
              className="
                mt-5
                font-serif
                text-[1.75rem]
                font-semibold
                leading-[1.16]
                text-[#e8c375]
                sm:text-[1.95rem]
              "
            >
              Persönlich.
              <br />
              Regional.
              <br />
              Vertrauensvoll.
            </h2>

            <p
              className="
                mt-5 max-w-[340px]
                text-sm leading-7
                text-white/43
              "
            >
              Ferienunterkünfte an Nord- und Ostsee entdecken und den Urlaub
              mit regionalen Tipps, Ausflugszielen und persönlichem Service
              genießen.
            </p>

            {/* SOCIAL */}
            <div className="mt-7">
              <p
                className="
                  text-[9px]
                  font-extrabold uppercase
                  tracking-[0.2em]
                  text-white/25
                "
              >
                Folge uns
              </p>

              <div className="mt-3 flex items-center gap-2.5">
                <a
                  href="https://www.facebook.com/Ostseeferienhausvermietung"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Urlaub-GOSCH auf Facebook"
                  title="Facebook"
                  className="
                    group grid h-10 w-10 place-items-center
                    rounded-xl
                    border border-white/[0.09]
                    bg-white/[0.025]
                    text-white/45
                    transition-all duration-300
                    hover:-translate-y-0.5
                    hover:border-[#e8c375]/30
                    hover:bg-[#e8c375]/10
                    hover:text-[#e8c375]
                  "
                >
                  <Facebook className="h-4 w-4" />
                </a>

                <a
                  href="https://www.instagram.com/urlaubgosch"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Urlaub-GOSCH auf Instagram"
                  title="Instagram"
                  className="
                    group grid h-10 w-10 place-items-center
                    rounded-xl
                    border border-white/[0.09]
                    bg-white/[0.025]
                    text-white/45
                    transition-all duration-300
                    hover:-translate-y-0.5
                    hover:border-[#e8c375]/30
                    hover:bg-[#e8c375]/10
                    hover:text-[#e8c375]
                  "
                >
                  <Instagram className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          {/* =====================================================
              UNTERKÜNFTE
          ===================================================== */}

          <FooterNavigation
            icon={Home}
            title="Unterkünfte"
            links={accommodationLinks}
          />

          {/* =====================================================
              ENTDECKEN
          ===================================================== */}

          <FooterNavigation
            icon={Compass}
            title="Entdecken"
            links={discoverLinks}
          />

          {/* =====================================================
              SERVICE
          ===================================================== */}

          <FooterNavigation
            icon={UserRound}
            title="Service"
            links={companyLinks}
          />

          {/* =====================================================
              KONTAKT
          ===================================================== */}

          <div>
            <FooterHeading icon={Phone} title="Kontakt" />

            <p className="mt-5 max-w-[270px] text-xs leading-5 text-white/35">
              Fragen zur Buchung oder zu einer Unterkunft? Wir helfen dir
              persönlich weiter.
            </p>

            <div className="mt-6 space-y-5">
              {/* TELEFON */}

              <a
                href="tel:+494344414415"
                className="
                  group flex w-fit items-start gap-3
                  text-white/60
                  transition duration-200
                  hover:text-white
                "
              >
                <span
                  className="
                    mt-0.5
                    grid h-9 w-9 shrink-0
                    place-items-center
                    rounded-xl
                    border border-white/[0.09]
                    bg-white/[0.025]
                    text-[#e8c375]
                    transition-all duration-300
                    group-hover:border-[#e8c375]/25
                    group-hover:bg-[#e8c375]/[0.08]
                  "
                >
                  <Phone className="h-4 w-4" />
                </span>

                <span>
                  <span
                    className="
                      block
                      text-[9px]
                      font-extrabold uppercase
                      tracking-[0.18em]
                      text-white/25
                    "
                  >
                    Telefon
                  </span>

                  <span className="mt-1 block text-sm font-semibold">
                    04344 414415
                  </span>
                </span>
              </a>

              {/* MAIL */}

              <a
                href="mailto:info@urlaub-gosch.de"
                className="
                  group flex w-fit max-w-full
                  items-start gap-3
                  text-white/60
                  transition duration-200
                  hover:text-white
                "
              >
                <span
                  className="
                    mt-0.5
                    grid h-9 w-9 shrink-0
                    place-items-center
                    rounded-xl
                    border border-white/[0.09]
                    bg-white/[0.025]
                    text-[#e8c375]
                    transition-all duration-300
                    group-hover:border-[#e8c375]/25
                    group-hover:bg-[#e8c375]/[0.08]
                  "
                >
                  <Mail className="h-4 w-4" />
                </span>

                <span className="min-w-0">
                  <span
                    className="
                      block
                      text-[9px]
                      font-extrabold uppercase
                      tracking-[0.18em]
                      text-white/25
                    "
                  >
                    E-Mail
                  </span>

                  <span className="mt-1 block break-all text-sm font-semibold sm:break-normal">
                    info@urlaub-gosch.de
                  </span>
                </span>
              </a>

              {/* STANDORT */}

              <div className="flex items-start gap-3 text-white/60">
                <span
                  className="
                    mt-0.5
                    grid h-9 w-9 shrink-0
                    place-items-center
                    rounded-xl
                    border border-white/[0.09]
                    bg-white/[0.025]
                    text-[#e8c375]
                  "
                >
                  <MapPin className="h-4 w-4" />
                </span>

                <span>
                  <span
                    className="
                      block
                      text-[9px]
                      font-extrabold uppercase
                      tracking-[0.18em]
                      text-white/25
                    "
                  >
                    Standort
                  </span>

                  <span className="mt-1 block text-sm font-semibold text-white/70">
                    24217 Schönberg
                  </span>

                  <span className="mt-1 block text-[11px] leading-4 text-white/30">
                    Schleswig-Holstein
                    <br />
                    Ostseeküste
                  </span>
                </span>
              </div>
            </div>

            <Link
              href="/contact"
              className="
                group mt-7
                inline-flex items-center gap-2
                text-xs font-semibold
                text-[#e8c375]/70
                transition
                hover:text-[#e8c375]
              "
            >
              Kontakt aufnehmen

              <ArrowRight
                className="
                  h-3.5 w-3.5
                  transition-transform duration-300
                  group-hover:translate-x-1
                "
              />
            </Link>
          </div>
        </div>

        {/* =========================================================
            OWNER CTA
            Premium Bild-Version
        ========================================================= */}

        <section
          className="
            group relative
            overflow-hidden
            rounded-[2rem]
            border border-white/[0.09]
            bg-[#091523]
            shadow-[0_30px_90px_rgba(0,0,0,0.26)]
          "
        >
          {/* feiner Goldrand oben */}
          <div
            aria-hidden="true"
            className="
              pointer-events-none absolute
              inset-x-[7%] top-0 z-20 h-px
              bg-gradient-to-r
              from-transparent
              via-[#e8c375]/45
              to-transparent
            "
          />

          {/* Ambient glow */}
          <div
            aria-hidden="true"
            className="
              pointer-events-none absolute
              right-[10%] top-1/2
              h-[300px] w-[420px]
              -translate-y-1/2
              rounded-full
              bg-[#e8c375]/[0.045]
              blur-3xl
            "
          />

          <div
            className="
              grid
              lg:grid-cols-[0.82fr_1.55fr]
            "
          >
            {/* IMAGE */}

            <div
              className="
                relative
                min-h-[260px]
                overflow-hidden
                sm:min-h-[320px]
                lg:min-h-[430px]
              "
            >
              <Image
                src={HERO_IMAGE}
                alt="Ferienimmobilie an der Ostseeküste"
                fill
                quality={80}
                sizes="(max-width: 1024px) 100vw, 36vw"
                className="
                  object-cover object-center
                  transition-transform
                  duration-[1200ms]
                  ease-out
                  group-hover:scale-[1.025]
                "
              />

              {/* Bildabdunklung */}
              <div
                className="
                  absolute inset-0
                  bg-gradient-to-t
                  from-[#06111f]/25
                  via-transparent
                  to-[#06111f]/10
                "
              />

              {/* Übergang zum Text */}
              <div
                className="
                  absolute inset-0
                  hidden lg:block
                  bg-gradient-to-r
                  from-transparent
                  via-transparent
                  to-[#091523]/55
                "
              />

              {/* Mobile Übergang */}
              <div
                className="
                  absolute inset-0
                  bg-gradient-to-t
                  from-[#091523]
                  via-transparent
                  to-transparent
                  lg:hidden
                "
              />
            </div>

            {/* CONTENT */}

            <div
              className="
                relative flex items-center
                px-6 py-9
                sm:px-9 sm:py-11
                lg:px-12 lg:py-14
                xl:px-16
              "
            >
              <div className="max-w-[760px]">
                {/* EYEBROW */}

                <span
                  className="
                    inline-flex items-center gap-2
                    rounded-full
                    border border-[#e8c375]/20
                    bg-[#e8c375]/[0.085]
                    px-4 py-2
                    text-[10px]
                    font-extrabold uppercase
                    tracking-[0.22em]
                    text-[#e8c375]
                    shadow-[0_8px_28px_rgba(232,195,117,0.045)]
                  "
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#e8c375]" />
                  Für Eigentümer
                </span>

                {/* HEADLINE */}

                <h2
                  className="
                    mt-6
                    font-serif
                    text-[2rem]
                    leading-[1.08]
                    tracking-[-0.025em]
                    text-white
                    sm:text-[2.65rem]
                    lg:text-[3.2rem]
                    xl:text-[3.45rem]
                  "
                >
                  Ihre Ferienimmobilie{" "}
                  <span className="text-[#e8c375]">
                    professionell präsentieren.
                  </span>
                </h2>

                {/* DESCRIPTION */}

                <p
                  className="
                    mt-6 max-w-[690px]
                    text-sm leading-7
                    text-white/48
                    sm:text-[15px]
                    lg:text-base
                    lg:leading-8
                  "
                >
                  Urlaub-GOSCH unterstützt Eigentümer bei der Präsentation und
                  Vermarktung ihrer Ferienunterkunft – persönlich, strukturiert
                  und mit direktem Kontakt.
                </p>

                {/* CTA */}

                <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Link
                    href="/contact"
                    className="
                      group/button
                      inline-flex
                      min-h-[56px]
                      w-full
                      items-center
                      justify-center
                      gap-3
                      rounded-2xl
                      bg-[#e8c375]
                      px-7 py-4
                      text-sm
                      font-extrabold
                      text-[#06111f]
                      shadow-[0_16px_38px_rgba(232,195,117,0.13)]
                      transition-all duration-300
                      hover:-translate-y-0.5
                      hover:bg-[#f0cf82]
                      hover:shadow-[0_20px_45px_rgba(232,195,117,0.18)]
                      sm:w-auto
                    "
                  >
                    Ferienimmobilie anbieten

                    <ArrowRight
                      className="
                        h-4 w-4
                        transition-transform duration-300
                        group-hover/button:translate-x-1
                      "
                    />
                  </Link>

                  <span
                    className="
                      hidden text-xs text-white/28
                      sm:block
                    "
                  >
                    Persönlich & unverbindlich
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            BOTTOM BAR
        ========================================================= */}

        <div
          className="
            mt-10
            flex flex-col gap-5
            border-t border-white/[0.07]
            py-7
            text-xs text-white/30
            md:flex-row
            md:items-center
            md:justify-between
          "
        >
          <p>
            © {new Date().getFullYear()} Urlaub-GOSCH. Alle Rechte vorbehalten.
          </p>

          <nav
            aria-label="Rechtliche Navigation"
            className="
              flex flex-wrap
              items-center
              gap-x-6 gap-y-3
            "
          >
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
          </nav>
        </div>
      </div>
    </footer>
  );
}

/* ===============================================================
   HEADING
================================================================ */

function FooterHeading({
  icon: Icon,
  title,
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="
          grid h-8 w-8
          place-items-center
          rounded-xl
          bg-[#e8c375]/10
          text-[#e8c375]
          ring-1 ring-[#e8c375]/10
        "
      >
        <Icon className="h-4 w-4" />
      </span>

      <h3
        className="
          text-[10px]
          font-extrabold uppercase
          tracking-[0.19em]
          text-white
        "
      >
        {title}
      </h3>
    </div>
  );
}

/* ===============================================================
   NAVIGATION COLUMN
================================================================ */

function FooterNavigation({
  icon,
  title,
  links,
}) {
  return (
    <div>
      <FooterHeading
        icon={icon}
        title={title}
      />

      <ul className="mt-6 space-y-1.5">
        {links.map((item) => {
          const LinkIcon = item.icon;

          return (
            <li key={item.label}>
              <Link
                href={item.href}
                className="
                  group/link
                  flex w-fit
                  items-center gap-2
                  py-1.5
                  text-sm font-medium
                  text-white/45
                  transition-all duration-200
                  hover:translate-x-0.5
                  hover:text-white
                "
              >
                {LinkIcon ? (
                  <LinkIcon className="h-3.5 w-3.5 text-[#e8c375]/70" />
                ) : null}

                <span>{item.label}</span>

                <ArrowRight
                  className="
                    h-3.5 w-3.5
                    -translate-x-1
                    text-[#e8c375]
                    opacity-0
                    transition-all duration-200
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