// src/app/datenschutz/page.jsx

import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  Cookie,
  Database,
  ExternalLink,
  FileText,
  Globe,
  Lock,
  Mail,
  Scale,
  Server,
  ShieldCheck,
  UserRound,
} from "lucide-react";

export const metadata = {
  title:
    "Datenschutzerklärung & Haftungsausschluss | Urlaub-GOSCH",
  description:
    "Datenschutzerklärung, Haftungsausschluss und rechtliche Hinweise von Urlaub-GOSCH.",
  robots: {
    index: true,
    follow: true,
  },
};

const sections = [
  {
    id: "haftung",
    label: "Haftung",
  },
  {
    id: "links",
    label: "Links",
  },
  {
    id: "urheberrecht",
    label: "Urheberrecht",
  },
  {
    id: "datenschutz",
    label: "Datenschutz",
  },
  {
    id: "daten",
    label: "Datenarten",
  },
  {
    id: "auftragsverarbeitung",
    label: "Auftragsverarbeitung",
  },
  {
    id: "rechte",
    label: "Ihre Rechte",
  },
  {
    id: "cookies",
    label: "Cookies",
  },
  {
    id: "loeschung",
    label: "Speicherdauer",
  },
  {
    id: "hosting",
    label: "Hosting",
  },
  {
    id: "logfiles",
    label: "Server-Logfiles",
  },
  {
    id: "kontakt",
    label: "Kontakt",
  },
  {
    id: "dienste",
    label: "Dienste Dritter",
  },
  {
    id: "google-fonts",
    label: "Google Fonts",
  },
];

const heroLinks = [
  sections[3],
  sections[6],
  sections[7],
  sections[9],
  sections[10],
  sections[13],
];

export default function DatenschutzPage() {
  return (
    <main
      className="
        min-h-screen
        bg-[#f6f4ef]
        pb-20
        pt-24
        text-[#07131f]

        sm:pb-24
        sm:pt-28

        lg:pt-32
      "
    >
      <div
        className="
          mx-auto
          w-full
          max-w-7xl

          px-4

          sm:px-6

          lg:px-8
        "
      >
        {/* =====================================================
            ZURÜCK
        ====================================================== */}

        <Link
          href="/"
          className="
            group

            mb-6
            inline-flex
            items-center
            gap-2.5

            text-sm
            font-semibold
            text-slate-600

            transition-colors
            duration-200

            hover:text-[#07131f]

            sm:mb-7
          "
        >
          <span
            className="
              grid
              h-9
              w-9
              place-items-center

              rounded-full

              border
              border-[#e4dccd]

              bg-white

              shadow-[0_4px_14px_rgba(7,19,31,0.06)]

              transition-all
              duration-200

              group-hover:-translate-x-0.5
              group-hover:border-[#c99a43]/40
            "
          >
            <ArrowLeft
              className="h-4 w-4"
              aria-hidden="true"
            />
          </span>

          Zurück zur Startseite
        </Link>

        {/* =====================================================
            HERO
        ====================================================== */}

        <section
          className="
            relative
            overflow-hidden

            rounded-[1.75rem]

            border
            border-[#e5dccd]

            bg-white

            shadow-[0_24px_70px_rgba(7,19,31,0.07)]

            sm:rounded-[2rem]
          "
        >
          {/* Hintergrund */}

          <div
            aria-hidden="true"
            className="
              pointer-events-none

              absolute
              inset-0

              bg-[radial-gradient(circle_at_12%_12%,rgba(201,154,67,0.18),transparent_30%),radial-gradient(circle_at_85%_10%,rgba(7,19,31,0.03),transparent_30%),linear-gradient(135deg,rgba(7,19,31,0.018),transparent_60%)]
            "
          />

          <div
            aria-hidden="true"
            className="
              pointer-events-none

              absolute
              -left-24
              top-16

              h-72
              w-72

              rounded-full

              bg-[#c99a43]/[0.06]

              blur-3xl
            "
          />

          <div
            className="
              relative

              grid
              gap-9

              p-5

              sm:p-8

              lg:p-10

              xl:grid-cols-[minmax(0,1fr)_300px]
              xl:items-center
              xl:gap-12
              xl:p-12
            "
          >
            {/* =================================================
                HERO TEXT
            ================================================== */}

            <div className="min-w-0">
              <div
                className="
                  inline-flex
                  items-center
                  gap-2

                  rounded-full

                  border
                  border-[#e4dccd]

                  bg-[#f8f3e9]

                  px-3.5
                  py-2

                  text-[10px]
                  font-extrabold
                  uppercase
                  tracking-[0.18em]
                  text-[#07131f]

                  sm:px-4
                  sm:text-[11px]
                "
              >
                <ShieldCheck
                  className="h-3.5 w-3.5 text-[#c99a43]"
                  aria-hidden="true"
                />

                Rechtliches
              </div>

              {/* Titel */}

              <div className="mt-7 min-w-0">
                <h1
                  className="
                    max-w-[920px]

                    break-words

                    text-[clamp(2.35rem,4.1vw,4.25rem)]
                    font-semibold
                    leading-[0.97]
                    tracking-[-0.055em]
                    text-[#07131f]
                  "
                >
                  Datenschutzerklärung
                </h1>

                <div
                  className="
                    mt-2

                    flex
                    max-w-[900px]
                    flex-wrap
                    items-baseline
                    gap-x-3

                    font-serif
                    italic
                    text-[#c99a43]

                    sm:gap-x-4
                  "
                >
                  <span
                    className="
                      text-[clamp(2.3rem,4vw,3.8rem)]
                      leading-none
                    "
                  >
                    &
                  </span>

                  <span
                    className="
                      break-words

                      text-[clamp(2rem,3.8vw,3.6rem)]
                      leading-[1]
                      tracking-[-0.04em]
                    "
                  >
                    Haftungsausschluss
                  </span>
                </div>
              </div>

              {/* Beschreibung */}

              <p
                className="
                  mt-7
                  max-w-2xl

                  text-[15px]
                  leading-7
                  text-slate-600

                  sm:text-base
                  sm:leading-8

                  lg:text-[17px]
                "
              >
                Informationen zur Verarbeitung
                personenbezogener Daten, zur Haftung für
                Inhalte und Links sowie zu Cookies,
                Hosting und eingebundenen Diensten.
              </p>

              {/* Trust */}

              <div
                className="
                  mt-7

                  flex
                  flex-wrap

                  gap-x-5
                  gap-y-3

                  border-t
                  border-[#ebe4d9]

                  pt-5

                  text-xs
                  font-semibold
                  text-slate-500
                "
              >
                <HeroTrust
                  icon={ShieldCheck}
                  label="Datenschutz"
                />

                <HeroTrust
                  icon={Lock}
                  label="Transparenz"
                />

                <HeroTrust
                  icon={FileText}
                  label="Rechtliche Hinweise"
                />
              </div>
            </div>

            {/* =================================================
                HERO ÜBERSICHT
            ================================================== */}

            <aside
              className="
                rounded-[1.5rem]

                border
                border-[#e4dccd]

                bg-white/90

                p-5

                shadow-[0_18px_50px_rgba(7,19,31,0.06)]

                backdrop-blur-xl

                sm:p-6
              "
            >
              <div
                className="
                  grid
                  h-12
                  w-12
                  place-items-center

                  rounded-full

                  bg-[#07131f]
                  text-white

                  shadow-[0_8px_20px_rgba(7,19,31,0.12)]
                "
              >
                <Lock
                  className="h-5 w-5"
                  aria-hidden="true"
                />
              </div>

              <h2
                className="
                  mt-5

                  text-xl
                  font-semibold
                  tracking-[-0.03em]
                  text-[#07131f]
                "
              >
                Übersicht
              </h2>

              <p
                className="
                  mt-2

                  text-sm
                  leading-6
                  text-slate-500
                "
              >
                Schnell zu den wichtigsten Bereichen
                dieser Seite.
              </p>

              <nav
                aria-label="Schnellnavigation"
                className="mt-5 grid gap-2"
              >
                {heroLinks.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="
                      group

                      flex
                      items-center
                      justify-between
                      gap-3

                      rounded-xl

                      border
                      border-[#e6dfd3]

                      bg-[#f8f5ee]

                      px-3.5
                      py-2.5

                      text-sm
                      font-semibold
                      text-slate-600

                      transition-all
                      duration-200

                      hover:-translate-y-[1px]
                      hover:border-[#c99a43]/30
                      hover:bg-[#07131f]
                      hover:text-white

                      focus:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-[#c99a43]/50
                    "
                  >
                    <span>{item.label}</span>

                    <ChevronRight
                      className="
                        h-4
                        w-4

                        text-[#c99a43]

                        transition-transform
                        duration-200

                        group-hover:translate-x-0.5
                      "
                      aria-hidden="true"
                    />
                  </a>
                ))}
              </nav>
            </aside>
          </div>
        </section>

        {/* =====================================================
            MOBILE / TABLET NAVIGATION
        ====================================================== */}

        <div
          className="
            mt-5

            overflow-hidden

            rounded-2xl

            border
            border-[#e4dccd]

            bg-white

            p-2

            shadow-[0_10px_30px_rgba(7,19,31,0.035)]

            lg:hidden
          "
        >
          <nav
            aria-label="Inhaltsnavigation"
            className="
              flex
              gap-2

              overflow-x-auto

              pb-1

              [scrollbar-width:none]
              [&::-webkit-scrollbar]:hidden
            "
          >
            {sections.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="
                  shrink-0

                  rounded-xl

                  bg-[#f8f5ee]

                  px-3.5
                  py-2.5

                  text-xs
                  font-semibold
                  text-slate-600

                  ring-1
                  ring-[#e6dfd3]

                  transition-colors

                  hover:bg-[#07131f]
                  hover:text-white
                "
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        {/* =====================================================
            HAUPTBEREICH

            WICHTIG:
            KEIN items-start!

            Die Grid-Spalten dürfen sich über die komplette
            Höhe der Zeile erstrecken, damit die linke Spalte
            genügend Höhe für position: sticky besitzt.
        ====================================================== */}

        <section
          className="
            mt-7

            grid
            gap-6

            lg:grid-cols-[245px_minmax(0,1fr)]

            xl:grid-cols-[270px_minmax(0,1fr)]
            xl:gap-8
          "
        >
          {/* ===================================================
              LINKE SPALTE

              Diese Spalte wird über die gesamte Höhe des
              rechten Contents gestreckt.

              KEIN self-start.
          ==================================================== */}

          <aside className="hidden lg:block">
            {/* =================================================
                DER EIGENTLICHE STICKY CONTAINER
            ================================================== */}

            <div
              className="
                sticky
                top-28

                flex
                max-h-[calc(100dvh-8rem)]
                flex-col

                overflow-hidden

                rounded-[1.5rem]

                border
                border-[#e4dccd]

                bg-white/95

                shadow-[0_18px_50px_rgba(7,19,31,0.045)]

                backdrop-blur-xl
              "
            >
              {/* ===============================================
                  FESTER SIDEBAR HEADER
              ================================================ */}

              <div
                className="
                  shrink-0

                  border-b
                  border-[#eee7dc]

                  bg-white/95

                  px-5
                  pb-4
                  pt-5
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-3
                  "
                >
                  <div
                    className="
                      grid
                      h-9
                      w-9
                      shrink-0
                      place-items-center

                      rounded-xl

                      bg-[#07131f]
                      text-[#c99a43]

                      shadow-[0_6px_16px_rgba(7,19,31,0.12)]
                    "
                  >
                    <FileText
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                  </div>

                  <div className="min-w-0">
                    <p
                      className="
                        text-[10px]
                        font-extrabold
                        uppercase
                        tracking-[0.2em]
                        text-[#c99a43]
                      "
                    >
                      Inhalt
                    </p>

                    <p
                      className="
                        mt-0.5

                        text-xs
                        font-medium
                        text-slate-400
                      "
                    >
                      Stichwortverzeichnis
                    </p>
                  </div>
                </div>
              </div>

              {/* ===============================================
                  NUR DIE LISTE SCROLLT
              ================================================ */}

              <nav
                aria-label="Inhaltsverzeichnis"
                className="
                  min-h-0
                  flex-1

                  overflow-y-auto
                  overscroll-contain

                  px-3
                  py-3

                  [scrollbar-color:#d7c59f_transparent]
                  [scrollbar-width:thin]

                  [&::-webkit-scrollbar]:w-[5px]

                  [&::-webkit-scrollbar-track]:bg-transparent

                  [&::-webkit-scrollbar-thumb]:rounded-full
                  [&::-webkit-scrollbar-thumb]:bg-[#d7c59f]

                  [&::-webkit-scrollbar-thumb:hover]:bg-[#c99a43]
                "
              >
                <div className="grid gap-1">
                  {sections.map(
                    (item, index) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className="
                          group

                          flex
                          items-center
                          gap-3

                          rounded-xl

                          px-3
                          py-2.5

                          text-[13px]
                          font-semibold
                          leading-5
                          text-slate-600

                          transition-all
                          duration-200

                          hover:bg-[#f8f5ee]
                          hover:text-[#07131f]

                          focus:outline-none
                          focus-visible:ring-2
                          focus-visible:ring-[#c99a43]/40
                        "
                      >
                        {/* Nummer */}

                        <span
                          className="
                            grid
                            h-6
                            w-6
                            shrink-0
                            place-items-center

                            rounded-lg

                            bg-[#f6f1e8]

                            text-[9px]
                            font-extrabold
                            text-[#c99a43]

                            ring-1
                            ring-[#e8dfcf]

                            transition-all
                            duration-200

                            group-hover:bg-[#07131f]
                            group-hover:text-[#e8c375]
                            group-hover:ring-[#07131f]
                          "
                        >
                          {String(
                            index + 1
                          ).padStart(2, "0")}
                        </span>

                        {/* Text */}

                        <span
                          className="
                            min-w-0
                            flex-1
                          "
                        >
                          {item.label}
                        </span>

                        {/* Pfeil */}

                        <ChevronRight
                          className="
                            h-3.5
                            w-3.5
                            shrink-0

                            text-[#c99a43]

                            opacity-0

                            transition-all
                            duration-200

                            group-hover:translate-x-0.5
                            group-hover:opacity-100
                          "
                          aria-hidden="true"
                        />
                      </a>
                    )
                  )}
                </div>
              </nav>

              {/* ===============================================
                  FESTER FOOTER
              ================================================ */}

              <div
                className="
                  shrink-0

                  border-t
                  border-[#eee7dc]

                  bg-[#faf8f3]

                  px-5
                  py-3
                "
              >
                <p
                  className="
                    flex
                    items-center
                    gap-2

                    text-[10px]
                    font-semibold
                    text-slate-400
                  "
                >
                  <span
                    aria-hidden="true"
                    className="
                      h-1.5
                      w-1.5
                      shrink-0

                      rounded-full

                      bg-[#c99a43]
                    "
                  />

                  Scrollen für weitere Bereiche
                </p>
              </div>
            </div>
          </aside>

          {/* ===================================================
              RECHTER INHALT
          ==================================================== */}

          <div
            className="
              min-w-0

              space-y-5

              sm:space-y-6
            "
          >
            {/* =================================================
                HAFTUNG
            ================================================== */}

            <LegalCard
              id="haftung"
              icon={Scale}
              eyebrow="Haftungsausschluss"
              title="Haftung für Inhalte"
            >
              <p>
                Die Inhalte unserer Seiten wurden mit
                größter Sorgfalt erstellt. Für die
                Richtigkeit, Vollständigkeit und
                Aktualität der Inhalte können wir jedoch
                keine Gewähr übernehmen.
              </p>

              <p>
                Als Diensteanbieter sind wir für eigene
                Inhalte auf diesen Seiten nach den
                allgemeinen Gesetzen verantwortlich. Wir
                sind jedoch nicht verpflichtet,
                übermittelte oder gespeicherte fremde
                Informationen zu überwachen oder nach
                Umständen zu forschen, die auf eine
                rechtswidrige Tätigkeit hinweisen.
              </p>

              <p>
                Verpflichtungen zur Entfernung oder
                Sperrung der Nutzung von Informationen
                nach den allgemeinen Gesetzen bleiben
                hiervon unberührt. Eine Haftung ist jedoch
                erst ab dem Zeitpunkt der Kenntnis einer
                konkreten Rechtsverletzung möglich. Bei
                Bekanntwerden entsprechender
                Rechtsverletzungen werden wir diese
                Inhalte umgehend entfernen.
              </p>
            </LegalCard>

            {/* =================================================
                LINKS
            ================================================== */}

            <LegalCard
              id="links"
              icon={ExternalLink}
              eyebrow="Externe Webseiten"
              title="Haftung für Links"
            >
              <p>
                Unser Angebot enthält Links zu externen
                Webseiten Dritter, auf deren Inhalte wir
                keinen Einfluss haben. Deshalb können wir
                für diese fremden Inhalte auch keine
                Gewähr übernehmen.
              </p>

              <p>
                Für die Inhalte der verlinkten Seiten ist
                stets der jeweilige Anbieter oder
                Betreiber der Seiten verantwortlich. Die
                verlinkten Seiten wurden zum Zeitpunkt der
                Verlinkung auf mögliche Rechtsverstöße
                überprüft. Rechtswidrige Inhalte waren zum
                Zeitpunkt der Verlinkung nicht erkennbar.
              </p>

              <p>
                Eine permanente inhaltliche Kontrolle der
                verlinkten Seiten ist ohne konkrete
                Anhaltspunkte einer Rechtsverletzung nicht
                zumutbar. Bei Bekanntwerden von
                Rechtsverletzungen werden wir derartige
                Links umgehend entfernen.
              </p>
            </LegalCard>

            {/* =================================================
                URHEBERRECHT
            ================================================== */}

            <LegalCard
              id="urheberrecht"
              icon={FileText}
              eyebrow="Urheberrecht"
              title="Urheberrechtliche Hinweise"
            >
              <p>
                Die durch die Seitenbetreiber erstellten
                Inhalte und Werke auf diesen Seiten
                unterliegen dem deutschen Urheberrecht.
                Die Vervielfältigung, Bearbeitung,
                Verbreitung und jede Art der Verwertung
                außerhalb der Grenzen des Urheberrechtes
                bedürfen der schriftlichen Zustimmung des
                jeweiligen Autors bzw. Erstellers.
              </p>

              <p>
                Downloads und Kopien dieser Seite sind nur
                für den privaten, nicht kommerziellen
                Gebrauch gestattet. Soweit die Inhalte auf
                dieser Seite nicht vom Betreiber erstellt
                wurden, werden die Urheberrechte Dritter
                beachtet.
              </p>

              <p>
                Sollten Sie trotzdem auf eine
                Urheberrechtsverletzung aufmerksam werden,
                bitten wir um einen entsprechenden
                Hinweis. Bei Bekanntwerden von
                Rechtsverletzungen werden wir derartige
                Inhalte umgehend entfernen.
              </p>
            </LegalCard>

            {/* =================================================
                DATENSCHUTZ
            ================================================== */}

            <LegalCard
              id="datenschutz"
              icon={ShieldCheck}
              eyebrow="Datenschutzerklärung"
              title="Allgemeine Hinweise zur Datenverarbeitung"
            >
              <p>
                Im Rahmen dieser Datenschutzerklärung
                werden Sie über Zweck und Umfang der
                Verarbeitung personenbezogener Daten
                innerhalb unserer Webseite und der mit
                dieser verbundenen Systeme aufgeklärt.
              </p>

              <p>
                Die Verwendung der Begrifflichkeiten
                orientiert sich, sofern nicht anders
                angegeben, an Art. 4 der
                Datenschutzgrundverordnung (DSGVO).
              </p>
            </LegalCard>

            {/* =================================================
                DATENARTEN
            ================================================== */}

            <LegalCard
              id="daten"
              icon={Database}
              eyebrow="Datenverarbeitung"
              title="Betroffene Personen, Zwecke und Datenarten"
            >
              <div
                className="
                  grid
                  gap-4

                  md:grid-cols-2
                "
              >
                <InfoBox
                  title="Betroffene Personen"
                  items={[
                    "Besucher unseres Onlineangebotes",
                    "Nutzer der Webseite",
                  ]}
                />

                <InfoBox
                  title="Zwecke der Verarbeitung"
                  items={[
                    "Bereitstellung des Onlineangebotes",
                    "Kommunikation mit Nutzern",
                    "Abwehr von Gefahren",
                    "Reichweitenmessung und Marketing",
                  ]}
                />

                <InfoBox
                  title="Arten der Daten"
                  items={[
                    "Inhaltsdaten",
                    "Nutzungsdaten",
                    "Meta- und Kommunikationsdaten",
                    "Kontaktdaten",
                  ]}
                />

                <InfoBox
                  title="Rechtsgrundlagen"
                  items={[
                    "Art. 6 DSGVO",
                    "Art. 7 DSGVO",
                    "Art. 13 DSGVO",
                    "Weitere gesetzliche Grundlagen im Einzelfall",
                  ]}
                />
              </div>
            </LegalCard>

            {/* =================================================
                AUFTRAGSVERARBEITUNG
            ================================================== */}

            <LegalCard
              id="auftragsverarbeitung"
              icon={Globe}
              eyebrow="Zusammenarbeit"
              title="Auftragsverarbeiter, Dritte und Drittländer"
            >
              <p>
                Sollten anderen Personen oder Unternehmen
                Zugriff auf Daten gewährt werden, erfolgt
                dies aufgrund einer rechtlichen
                Verpflichtung, einer gesetzlichen
                Erlaubnis, einer Einwilligung oder
                aufgrund berechtigter Interessen.
              </p>

              <p>
                Wurden Dritte mit der Verarbeitung von
                Daten beauftragt, so geschieht dies gemäß
                Art. 28 DSGVO auf Grundlage eines
                Auftragsverarbeitungsvertrages.
              </p>

              <p>
                Eine Verarbeitung von Daten in einem
                Drittland erfolgt nur unter den
                Voraussetzungen der Art. 44 ff. DSGVO,
                etwa auf Grundlage besonderer Garantien
                oder spezieller vertraglicher
                Verpflichtungen.
              </p>
            </LegalCard>

            {/* =================================================
                RECHTE
            ================================================== */}

            <LegalCard
              id="rechte"
              icon={UserRound}
              eyebrow="Nutzerrechte"
              title="Ihre Rechte"
            >
              <div
                className="
                  grid
                  gap-4

                  md:grid-cols-2
                "
              >
                <InfoBox
                  title="Auskunft und Bestätigung"
                  items={[
                    "Recht auf Auskunft gemäß Art. 15 DSGVO",
                  ]}
                />

                <InfoBox
                  title="Berichtigung"
                  items={[
                    "Recht auf Vervollständigung",
                    "Recht auf Berichtigung gemäß Art. 16 DSGVO",
                  ]}
                />

                <InfoBox
                  title="Löschung und Einschränkung"
                  items={[
                    "Recht auf Löschung gemäß Art. 17 DSGVO",
                    "Recht auf Einschränkung gemäß Art. 18 DSGVO",
                  ]}
                />

                <InfoBox
                  title="Weitere Rechte"
                  items={[
                    "Recht auf Datenübertragbarkeit gemäß Art. 20 DSGVO",
                    "Beschwerderecht gemäß Art. 77 DSGVO",
                    "Widerruf gemäß Art. 7 Abs. 3 DSGVO",
                    "Widerspruch gemäß Art. 21 DSGVO",
                  ]}
                />
              </div>
            </LegalCard>

            {/* =================================================
                COOKIES
            ================================================== */}

            <LegalCard
              id="cookies"
              icon={Cookie}
              eyebrow="Cookies"
              title="Cookies"
            >
              <p>
                Unser Onlineangebot benutzt Cookies.
                Cookies sind kleine Textdateien, die beim
                Besuch unserer Webseite auf Ihrem Computer
                gespeichert werden. Sie können dazu
                dienen, Angaben des Nutzers während oder
                nach einem Besuch zu speichern.
              </p>

              <p>
                Sollten Sie keine Cookies wünschen, können
                Sie die Speicherung in den Einstellungen
                Ihres Browsers deaktivieren oder
                bestehende Cookies löschen. Ein Ausschluss
                von Cookies kann zu
                Funktionseinschränkungen führen.
              </p>
            </LegalCard>

            {/* =================================================
                LÖSCHUNG
            ================================================== */}

            <LegalCard
              id="loeschung"
              icon={Database}
              eyebrow="Speicherung"
              title="Löschung von Daten"
            >
              <p>
                Soweit nicht anders angegeben, werden
                gespeicherte Daten gelöscht, sobald sie
                für ihre Zweckbestimmung nicht mehr
                erforderlich sind und keine gesetzlichen
                Aufbewahrungspflichten entgegenstehen.
              </p>

              <p>
                Gesetzliche Aufbewahrungspflichten können
                je nach Art der Daten unterschiedlich
                lange bestehen.
              </p>
            </LegalCard>

            {/* =================================================
                HOSTING
            ================================================== */}

            <LegalCard
              id="hosting"
              icon={Server}
              eyebrow="Hosting"
              title="Hosting"
            >
              <p>
                Um das Onlineangebot anbieten zu können,
                nutzen wir Hosting-Dienstleistungen wie
                Infrastruktur, Rechenkapazität,
                Speicherplatz, Sicherheit und Wartung.
              </p>

              <p>
                In diesem Rahmen können Inhaltsdaten,
                Nutzungsdaten, Meta-/Kommunikationsdaten
                und Kontaktdaten verarbeitet werden.
                Grundlage ist das berechtigte Interesse an
                einer sicheren und professionellen
                Bereitstellung des Onlineangebotes.
              </p>
            </LegalCard>

            {/* =================================================
                LOGFILES
            ================================================== */}

            <LegalCard
              id="logfiles"
              icon={Server}
              eyebrow="Serverdaten"
              title="Erhebung von Zugriffsdaten und Logfiles"
            >
              <p>
                Der Hosting-Anbieter speichert Daten von
                jedem Zugriff auf den Server. Dazu können
                Name der abgerufenen Webseite, Datei,
                Datum und Uhrzeit des Abrufs, übertragene
                Datenmenge, Browsertyp, Betriebssystem,
                Referrer URL, IP-Adresse sowie der
                anfragende Provider gehören.
              </p>

              <p>
                Diese Informationen dienen der stabilen
                Bereitstellung des Onlineangebotes sowie
                der Gefahrenabwehr und werden nur für eine
                bestimmte Zeit gespeichert, sofern keine
                längere Aufbewahrung zu Beweiszwecken
                erforderlich ist.
              </p>
            </LegalCard>

            {/* =================================================
                KONTAKT
            ================================================== */}

            <LegalCard
              id="kontakt"
              icon={Mail}
              eyebrow="Kontaktaufnahme"
              title="Kontaktaufnahme"
            >
              <p>
                Erfolgt eine Kontaktaufnahme per E-Mail,
                Kontaktformular, Telefon oder über soziale
                Medien, werden die Angaben des Nutzers zur
                Bearbeitung der Anfrage verarbeitet.
              </p>

              <p>
                Die Daten der Anfragen werden gelöscht,
                sofern sie nicht mehr erforderlich sind.
                Darüber hinaus können gesetzliche
                Archivierungspflichten gelten.
              </p>
            </LegalCard>


            {/* =================================================
                DIENSTE DRITTER
            ================================================== */}

            <LegalCard
              id="dienste"
              icon={Globe}
              eyebrow="Drittanbieter"
              title="Einbindung von Diensten und Inhalten Dritter"
            >
              <p>
                Innerhalb des Onlineangebotes können
                Inhalte oder Dienste von Drittanbietern
                eingebunden werden, etwa Karten,
                Schriftarten oder externe Inhalte.
              </p>

              <p>
                Für die Darstellung solcher Inhalte kann
                es technisch erforderlich sein, dass
                Drittanbieter die IP-Adresse des Nutzers
                wahrnehmen.
              </p>
            </LegalCard>

            {/* =================================================
                GOOGLE FONTS
            ================================================== */}

            <LegalCard
              id="google-fonts"
              icon={Globe}
              eyebrow="Schriftarten"
              title="Google Fonts"
            >
              <p>
                Im Onlineangebot können Schriftarten des
                Anbieters Google LLC, 1600 Amphitheatre
                Parkway, Mountain View, CA 94043, USA,
                genutzt werden.
              </p>

              <p>
                Datenschutzerklärung des Anbieters:
                <br />

                <a
                  href="https://www.google.com/policies/privacy/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    break-all

                    font-semibold
                    text-[#07131f]

                    underline
                    decoration-[#c99a43]/40
                    underline-offset-4

                    transition-colors

                    hover:decoration-[#c99a43]
                  "
                >
                  https://www.google.com/policies/privacy/
                </a>
              </p>

              <p>
                Opt-Out des Anbieters:
                <br />

                <a
                  href="https://adssettings.google.com/authenticated"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    break-all

                    font-semibold
                    text-[#07131f]

                    underline
                    decoration-[#c99a43]/40
                    underline-offset-4

                    transition-colors

                    hover:decoration-[#c99a43]
                  "
                >
                  https://adssettings.google.com/authenticated
                </a>
              </p>
            </LegalCard>
          </div>
        </section>
      </div>
    </main>
  );
}

/* ============================================================
   HERO TRUST
============================================================ */

function HeroTrust({
  icon: Icon,
  label,
}) {
  return (
    <span
      className="
        inline-flex
        items-center
        gap-2
      "
    >
      <Icon
        className="
          h-4
          w-4
          text-[#c99a43]
        "
        aria-hidden="true"
      />

      {label}
    </span>
  );
}

/* ============================================================
   LEGAL CARD
============================================================ */

function LegalCard({
  id,
  icon: Icon,
  eyebrow,
  title,
  children,
}) {
  return (
    <section
      id={id}
      className="
        scroll-mt-32

        rounded-[1.5rem]

        border
        border-[#e4dccd]

        bg-white

        p-5

        shadow-[0_16px_45px_rgba(7,19,31,0.038)]

        sm:p-7

        lg:p-8
      "
    >
      <div
        className="
          mb-5

          flex
          items-start
          gap-4

          sm:mb-6
        "
      >
        <div
          className="
            grid
            h-11
            w-11
            shrink-0
            place-items-center

            rounded-full

            bg-[#07131f]
            text-white

            shadow-[0_8px_18px_rgba(7,19,31,0.11)]
          "
        >
          <Icon
            className="h-5 w-5"
            aria-hidden="true"
          />
        </div>

        <div className="min-w-0">
          <p
            className="
              text-[10px]
              font-extrabold
              uppercase
              tracking-[0.18em]
              text-[#c99a43]

              sm:text-xs
            "
          >
            {eyebrow}
          </p>

          <h2
            className="
              mt-1

              break-words

              text-xl
              font-semibold
              leading-tight
              tracking-[-0.035em]
              text-[#07131f]

              sm:text-2xl
            "
          >
            {title}
          </h2>
        </div>
      </div>

      <div
        className="
          space-y-4

          text-sm
          leading-7
          text-slate-600

          sm:text-[15px]
          sm:leading-8

          lg:text-base
        "
      >
        {children}
      </div>
    </section>
  );
}

/* ============================================================
   INFO BOX
============================================================ */

function InfoBox({
  title,
  items,
}) {
  return (
    <div
      className="
        rounded-2xl

        border
        border-[#e6dfd3]

        bg-[#f8f5ee]

        p-4

        sm:p-5
      "
    >
      <h3
        className="
          text-sm
          font-bold
          text-[#07131f]

          sm:text-[15px]
        "
      >
        {title}
      </h3>

      <ul
        className="
          mt-3

          space-y-2.5

          text-sm
          leading-6
          text-slate-600
        "
      >
        {items.map((item) => (
          <li
            key={item}
            className="
              flex
              items-start
              gap-2.5
            "
          >
            <span
              aria-hidden="true"
              className="
                mt-[9px]

                h-1.5
                w-1.5
                shrink-0

                rounded-full

                bg-[#c99a43]
              "
            />

            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ============================================================
   NOTICE BOX
============================================================ */

function NoticeBox({
  children,
}) {
  return (
    <div
      className="
        mt-5

        flex
        gap-3

        rounded-2xl

        border
        border-[#e5d8be]

        bg-[#f8f3e9]

        p-4

        text-sm
        leading-6
        text-[#07131f]

        sm:p-5
      "
    >
      <div
        className="
          mt-0.5

          grid
          h-7
          w-7
          shrink-0
          place-items-center

          rounded-full

          bg-[#c99a43]/10
          text-[#c99a43]
        "
      >
        <ShieldCheck
          className="h-3.5 w-3.5"
          aria-hidden="true"
        />
      </div>

      <div>{children}</div>
    </div>
  );
}