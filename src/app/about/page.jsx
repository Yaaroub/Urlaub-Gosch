import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarCheck2,
  Check,
  Clock3,
  HeartHandshake,
  Home,
  KeyRound,
  Mail,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Shirt,
  Sparkles,
  Users,
  Waves,
  Wrench,
} from "lucide-react";

export const metadata = {
  title: "Über uns | Urlaub Gosch – Ferienvermietung an der Ostsee",
  description:
    "Urlaub Gosch ist seit 2004 Ihr persönlicher Partner für Ferienwohnungen, Ferienhäuser, Gästebetreuung und professionelle Ferienvermietung an der Ostsee.",

  keywords: [
    "Urlaub Gosch",
    "Ferienvermietung Ostsee",
    "Ferienwohnung Ostsee",
    "Ferienhaus Ostsee",
    "Ferienimmobilie vermieten",
    "Objektbetreuung Ostsee",
    "Ferienhausverwaltung Ostsee",
  ],

  alternates: {
    canonical: "/ueber-uns",
  },

  openGraph: {
    title: "Über Urlaub Gosch",
    description:
      "Seit 2004 persönliche Ferienvermietung und professionelle Objektbetreuung an der Ostsee.",
    url: "/ueber-uns",
    siteName: "Urlaub Gosch",
    locale: "de_DE",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Über Urlaub Gosch",
    description:
      "Persönliche Ferienvermietung und professionelle Objektbetreuung an der Ostsee – seit 2004.",
  },

  robots: {
    index: true,
    follow: true,
  },
};

const facts = [
  {
    value: "2004",
    label: "gegründet",
    text: "Mehr als zwei Jahrzehnte Erfahrung in der Ferienvermietung.",
  },
  {
    value: "120+",
    label: "Unterkünfte",
    text: "Ferienwohnungen und Ferienhäuser in attraktiven Ostseeregionen.",
  },
  {
    value: "24 h",
    label: "Anreise",
    text: "Flexible Anreise über ein modernes Schlüsseltresor-System.",
  },
];

const services = [
  {
    icon: CalendarCheck2,
    title: "Buchungsmanagement",
    text: "Wir koordinieren Buchungsanfragen, Reservierungen und wichtige Informationen rund um den Aufenthalt.",
  },
  {
    icon: MessageCircle,
    title: "Gästekommunikation",
    text: "Gäste erhalten vor der Anreise und während ihres Aufenthalts einen persönlichen Ansprechpartner.",
  },
  {
    icon: KeyRound,
    title: "Flexible Anreise",
    text: "Durch unser Schlüsseltresor-System ist eine entspannte und zeitlich flexible Anreise möglich.",
  },
  {
    icon: Sparkles,
    title: "Reinigung und Kontrolle",
    text: "Die Unterkünfte werden zwischen den Aufenthalten sorgfältig gereinigt, vorbereitet und kontrolliert.",
  },
  {
    icon: Shirt,
    title: "Wäscheservice",
    text: "Wir organisieren die benötigte Wäsche zuverlässig und passend zu den jeweiligen Belegungen.",
  },
  {
    icon: Wrench,
    title: "Hausmeisterservice",
    text: "Technische Anliegen, regelmäßige Kontrollen und notwendige Maßnahmen werden vor Ort koordiniert.",
  },
];

const values = [
  {
    icon: ShieldCheck,
    title: "Zuverlässigkeit",
    text: "Klare Abläufe und eine verantwortungsvolle Betreuung bilden die Grundlage unserer Arbeit.",
  },
  {
    icon: HeartHandshake,
    title: "Persönlichkeit",
    text: "Trotz digitaler Buchungswege bleiben wir für Gäste und Eigentümer persönlich erreichbar.",
  },
  {
    icon: Sparkles,
    title: "Qualität",
    text: "Sauberkeit, gepflegte Unterkünfte und zuverlässiger Service haben für uns einen hohen Stellenwert.",
  },
  {
    icon: Waves,
    title: "Ostseeverbundenheit",
    text: "Wir kennen die Region, ihre Gäste und die besonderen Anforderungen einer Ferienimmobilie an der Küste.",
  },
];

const faqs = [
  {
    question: "Seit wann gibt es Urlaub Gosch?",
    answer:
      "Urlaub Gosch wurde am 1. April 2004 gegründet und verfügt damit über mehr als 20 Jahre Erfahrung in der Ferienvermietung und Objektbetreuung an der Ostsee.",
  },
  {
    question: "Wie viele Ferienunterkünfte betreut Urlaub Gosch?",
    answer:
      "Urlaub Gosch betreut mehr als 120 Ferienhäuser und Ferienwohnungen in attraktiven Urlaubsregionen entlang der Ostseeküste.",
  },
  {
    question: "Welche Leistungen übernimmt Urlaub Gosch?",
    answer:
      "Zu den Leistungen gehören unter anderem Buchungsmanagement, Gästekommunikation, Anreiseorganisation, Reinigung, Wäscheservice, Objektkontrolle und Hausmeisterservice.",
  },
  {
    question: "Kann ich meine Ferienimmobilie über Urlaub Gosch vermieten?",
    answer:
      "Ja. Eigentümer einer Ferienwohnung oder eines Ferienhauses an der Ostsee können Urlaub Gosch für eine unverbindliche Beratung zur Vermietung und Betreuung ihrer Immobilie kontaktieren.",
  },
  {
    question: "Ist eine späte Anreise möglich?",
    answer:
      "Ja. Urlaub Gosch ermöglicht eine flexible Anreise über ein modernes Schlüsseltresor-System. Gäste erhalten die notwendigen Informationen vor ihrer Ankunft.",
  },
];

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://www.urlaub-gosch.de/#organization",
  name: "Urlaub Gosch",
  url: "https://www.urlaub-gosch.de",
  logo: {
    "@type": "ImageObject",
    url: "https://www.urlaub-gosch.de/logo.png",
  },
  foundingDate: "2004-04-01",
  description:
    "Urlaub Gosch ist seit 2004 auf Ferienvermietung, Gästebetreuung und die professionelle Betreuung von Ferienimmobilien an der Ostsee spezialisiert.",
  email: "info@urlaub-gosch.de",
  areaServed: {
    "@type": "AdministrativeArea",
    name: "Ostseeküste",
  },
  knowsAbout: [
    "Ferienvermietung",
    "Ferienwohnungen an der Ostsee",
    "Ferienhäuser an der Ostsee",
    "Objektbetreuung",
    "Gästebetreuung",
    "Buchungsmanagement",
    "Reinigungsservice",
    "Wäscheservice",
    "Hausmeisterservice",
  ],
  slogan: "Ihr Urlaub. Ihre Immobilie. Unser Service.",
};

const aboutPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "@id": "https://www.urlaub-gosch.de/ueber-uns/#webpage",
  url: "https://www.urlaub-gosch.de/ueber-uns",
  name: "Über Urlaub Gosch",
  headline:
    "Urlaub Gosch – Ferienvermietung und Objektbetreuung an der Ostsee seit 2004",
  description:
    "Erfahren Sie mehr über Urlaub Gosch, unsere Leistungen, unsere Werte und unsere Betreuung für Gäste und Eigentümer.",
  inLanguage: "de-DE",
  isPartOf: {
    "@type": "WebSite",
    "@id": "https://www.urlaub-gosch.de/#website",
    name: "Urlaub Gosch",
    url: "https://www.urlaub-gosch.de",
  },
  about: {
    "@id": "https://www.urlaub-gosch.de/#organization",
  },
  mainEntity: {
    "@id": "https://www.urlaub-gosch.de/#organization",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

function safeJsonLd(data) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(organizationJsonLd),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(aboutPageJsonLd),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(faqJsonLd),
        }}
      />

      <main className="overflow-hidden bg-[#f6f8fb] text-slate-950">
        {/* Hero */}
        <section className="relative px-4 pb-20 pt-28 sm:px-6 lg:px-8 lg:pb-28">
          <div
            aria-hidden="true"
            className="absolute -right-40 top-16 h-[32rem] w-[32rem] rounded-full bg-[#f4d59d]/25 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="absolute -left-48 top-80 h-96 w-96 rounded-full bg-sky-200/25 blur-3xl"
          />

          <div className="relative mx-auto max-w-7xl">
            <nav
              aria-label="Breadcrumb"
              className="mb-8 flex items-center gap-2 text-sm text-slate-500"
            >
              <Link href="/" className="transition hover:text-slate-950">
                Startseite
              </Link>

              <span aria-hidden="true">/</span>

              <span className="font-medium text-slate-800">Über uns</span>
            </nav>

            <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_420px] lg:gap-16">
              <div>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#ead7b4] bg-[#fffaf1] px-4 py-2 text-sm font-semibold text-[#9a6b25]">
                  <Waves className="h-4 w-4" />
                  Seit 2004 an der Ostsee
                </div>

                <h1 className="max-w-5xl text-[clamp(3rem,7vw,6.7rem)] font-semibold leading-[0.91] tracking-[-0.075em] text-slate-950">
                  Urlaub beginnt
                  <span className="block font-serif font-normal italic text-[#c99a43]">
                    mit Vertrauen.
                  </span>
                </h1>

                <p className="mt-7 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                  Urlaub Gosch ist Ihr erfahrener Partner für hochwertige
                  Ferienunterkünfte, persönliche Gästebetreuung und die
                  professionelle Betreuung von Ferienimmobilien an der Ostsee.
                </p>

                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/search"
                    className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#07131f] px-7 py-4 text-sm font-bold text-white shadow-[0_18px_55px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-800"
                  >
                    Unterkunft entdecken
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </Link>

                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-7 py-4 text-sm font-bold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50"
                  >
                    <Mail className="h-4 w-4" />
                    Kontakt aufnehmen
                  </Link>
                </div>
              </div>

              {/* Hero Visual */}
  {/* Hero Visual */}
<div className="relative">
  <div className="relative flex min-h-[500px] overflow-hidden rounded-[2.5rem] bg-[#07131f] p-7 text-white shadow-[0_35px_90px_rgba(15,23,42,0.2)] sm:p-9 lg:min-h-[520px]">
    {/* Dekoration oben rechts */}
    <div
      aria-hidden="true"
      className="absolute -right-20 -top-20 h-64 w-64 rounded-full border-[42px] border-white/[0.04]"
    />

    {/* Dezenter goldener Verlauf */}
    <div
      aria-hidden="true"
      className="absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-[#c99a43]/20 blur-3xl"
    />

    <div className="relative z-10 flex w-full flex-col">
      {/* Kopfzeile */}
      <div className="flex items-start justify-between gap-5">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#f4d59d] text-[#07131f]">
          <Home className="h-6 w-6" />
        </div>

        <div className="text-right">
          <p className="text-3xl font-semibold leading-none tracking-[-0.05em] text-[#f4d59d]">
            20+
          </p>

          <p className="mt-2 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-white/40">
            Jahre Erfahrung
          </p>
        </div>
      </div>

      {/* Zitat */}
      <div className="my-auto py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40 sm:text-sm">
          Unser Versprechen
        </p>

        <p className="mt-5 max-w-md font-serif text-[2.25rem] italic leading-[1.12] tracking-[-0.035em] text-white sm:text-[2.7rem]">
          „Ankommen, wohlfühlen und die Ostsee genießen.“
        </p>
      </div>

      {/* Unterer Bereich */}
      <div className="border-t border-white/10 pt-6">
        <div className="flex items-center gap-4">
          <div className="flex shrink-0 -space-x-2">
            {[Users, HeartHandshake, ShieldCheck].map((Icon, index) => (
              <span
                key={index}
                className="grid h-10 w-10 place-items-center rounded-full border-2 border-[#07131f] bg-white/10 backdrop-blur"
              >
                <Icon className="h-4 w-4 text-[#f4d59d]" />
              </span>
            ))}
          </div>

          <p className="text-sm leading-6 text-white/65">
            Persönlich für Gäste
            <span className="block">und Eigentümer da</span>
          </p>
        </div>
      </div>
    </div>
  </div>
</div>
            </div>
          </div>
        </section>

        {/* Facts */}
        <section
          aria-label="Urlaub Gosch auf einen Blick"
          className="px-4 pb-20 sm:px-6 lg:px-8"
        >
          <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_25px_80px_rgba(15,23,42,0.06)] md:grid-cols-3">
            {facts.map((fact, index) => (
              <article
                key={fact.label}
                className={`p-7 sm:p-8 ${
                  index !== facts.length - 1
                    ? "border-b border-slate-200 md:border-b-0 md:border-r"
                    : ""
                }`}
              >
                <p className="text-4xl font-semibold tracking-[-0.06em] text-[#c99a43]">
                  {fact.value}
                </p>

                <h2 className="mt-2 text-lg font-semibold text-slate-950">
                  {fact.label}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {fact.text}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Direct answer / GEO section */}
        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:gap-20">
            <div>
              <SectionLabel>Urlaub Gosch kurz erklärt</SectionLabel>

              <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.055em] sm:text-5xl">
                Wer wir sind und
                <span className="block font-serif font-normal italic text-[#c99a43]">
                  was uns auszeichnet.
                </span>
              </h2>
            </div>

            <div>
              <p className="text-xl font-medium leading-9 text-slate-800">
                Urlaub Gosch ist ein seit 2004 tätiges Unternehmen für
                Ferienvermietung und Objektbetreuung an der Ostsee.
              </p>

              <p className="mt-5 text-base leading-8 text-slate-600">
                Wir betreuen mehr als 120 Ferienwohnungen und Ferienhäuser.
                Dabei verbinden wir digitale Buchungsprozesse mit persönlicher
                Erreichbarkeit und zuverlässigen Abläufen vor Ort.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {[
                  "Persönliche Gästebetreuung",
                  "Professionelles Buchungsmanagement",
                  "Reinigung und Objektkontrolle",
                  "Unterstützung für Eigentümer",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-[0_12px_40px_rgba(15,23,42,0.05)]"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#f4d59d] text-[#07131f]">
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </span>

                    <span className="text-sm font-semibold text-slate-700">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Story */}
        <section className="bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div className="relative min-h-[500px] overflow-hidden rounded-[2.5rem] bg-[#dceaf0] p-6 sm:p-8">
              <div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-[58%] bg-[#a8cbd8]"
              />

              <div
                aria-hidden="true"
                className="absolute -right-20 top-10 h-64 w-64 rounded-full bg-[#f4d59d]"
              />

              <div
                aria-hidden="true"
                className="absolute -left-20 bottom-20 h-44 w-[130%] rotate-[-5deg] rounded-[50%] bg-white/45"
              />

              <div
                aria-hidden="true"
                className="absolute -left-16 bottom-5 h-40 w-[130%] rotate-[4deg] rounded-[50%] bg-[#6ea8bd]/45"
              />

              <div className="relative flex h-full min-h-[436px] flex-col justify-between">
                <div className="flex justify-end">
                  <div className="rounded-full bg-white/75 p-4 backdrop-blur">
                    <Waves className="h-8 w-8 text-[#3d7184]" />
                  </div>
                </div>

                <div className="max-w-xs rounded-[1.75rem] bg-[#07131f]/95 p-6 text-white shadow-2xl backdrop-blur">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/40">
                    Seit dem 1. April
                  </p>

                  <p className="mt-2 text-5xl font-semibold tracking-[-0.06em] text-[#f4d59d]">
                    2004
                  </p>

                  <p className="mt-4 text-sm leading-6 text-white/65">
                    Mit Leidenschaft für Gastfreundschaft, Ferienvermietung und
                    die Ostseeküste.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <SectionLabel>Unsere Geschichte</SectionLabel>

              <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.055em] sm:text-5xl">
                Erfahrung, die mit
                <span className="block font-serif font-normal italic text-[#c99a43]">
                  der Zeit gewachsen ist.
                </span>
              </h2>

              <div className="mt-7 space-y-5 text-base leading-8 text-slate-600">
                <p>
                  Was 2004 mit der Leidenschaft für Gastfreundschaft und
                  Ferienvermietung begann, hat sich zu einem etablierten
                  Unternehmen an der Ostsee entwickelt.
                </p>

                <p>
                  Buchungen sind digitaler geworden, neue Plattformen sind
                  entstanden und die Erwartungen der Gäste haben sich
                  verändert. Wir haben diese Entwicklung begleitet und unsere
                  Arbeitsweise kontinuierlich weiterentwickelt.
                </p>

                <p>
                  Eines ist dabei unverändert geblieben: der persönliche
                  Kontakt. Hinter jeder Buchung stehen Menschen, die sich auf
                  ihren Urlaub freuen. Hinter jeder Immobilie steht ein
                  Eigentümer, der uns sein Vertrauen schenkt.
                </p>
              </div>

              <blockquote className="mt-8 border-l-2 border-[#c99a43] pl-5 font-serif text-2xl italic leading-9 text-slate-800">
                „Wir verstehen uns nicht als reine Vermittlungsplattform,
                sondern als persönlicher Partner.“
              </blockquote>
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <SectionLabel>Alles aus einer Hand</SectionLabel>

              <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.055em] sm:text-5xl">
                Viele Leistungen.
                <span className="block font-serif font-normal italic text-[#c99a43]">
                  Ein verlässlicher Ansprechpartner.
                </span>
              </h2>

              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600">
                Professionelle Ferienvermietung besteht aus vielen Aufgaben.
                Wir koordinieren die einzelnen Bereiche so, dass sie
                zuverlässig ineinandergreifen.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <article
                  key={service.title}
                  className="group rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:border-[#dec38e] hover:shadow-[0_25px_75px_rgba(15,23,42,0.09)] sm:p-7"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-[#fff4df] text-[#9a6b25] transition group-hover:bg-[#f4d59d] group-hover:text-[#07131f]">
                    <service.icon className="h-5 w-5" />
                  </div>

                  <h3 className="mt-6 text-xl font-semibold tracking-[-0.035em]">
                    {service.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    {service.text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Guests and owners */}
        <section className="px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
          <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2.5rem] shadow-[0_30px_90px_rgba(15,23,42,0.12)] lg:grid-cols-2">
            <article className="bg-white p-7 sm:p-10 lg:p-12">
              <div className="grid h-13 w-13 place-items-center rounded-full bg-[#fff4df] text-[#9a6b25]">
                <Users className="h-6 w-6" />
              </div>

              <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-[#b9893f]">
                Für unsere Gäste
              </p>

              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
                Ankommen und wohlfühlen
              </h2>

              <p className="mt-5 text-base leading-8 text-slate-600">
                Wir unterstützen Sie bei Fragen zur Unterkunft, Buchung,
                Anreise und Ihrem Aufenthalt. Auch vor Ort haben Sie einen
                verlässlichen Ansprechpartner.
              </p>

              <ul className="mt-7 space-y-3">
                {[
                  "Unterschiedliche Unterkünfte für individuelle Urlaubswünsche",
                  "Unterstützung vor und während des Aufenthalts",
                  "Flexible Anreise über Schlüsseltresor",
                  "Sorgfältig vorbereitete Ferienunterkünfte",
                ].map((item) => (
                  <CheckLine key={item}>{item}</CheckLine>
                ))}
              </ul>

              <Link
                href="/search"
                className="group mt-9 inline-flex items-center gap-2 text-sm font-bold text-slate-950"
              >
                Ferienunterkünfte ansehen
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
            </article>

            <article className="relative overflow-hidden bg-[#07131f] p-7 text-white sm:p-10 lg:p-12">
              <div
                aria-hidden="true"
                className="absolute -right-24 -top-24 h-80 w-80 rounded-full border-[55px] border-white/[0.035]"
              />

              <div className="relative">
                <div className="grid h-13 w-13 place-items-center rounded-full bg-white/10 text-[#f4d59d]">
                  <Building2 className="h-6 w-6" />
                </div>

                <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-[#f4d59d]">
                  Für Eigentümer
                </p>

                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
                  Ihre Immobilie in professionellen Händen
                </h2>

                <p className="mt-5 text-base leading-8 text-white/65">
                  Wir unterstützen Eigentümer bei der Vermarktung,
                  Gästekommunikation und Organisation rund um ihre
                  Ferienimmobilie.
                </p>

                <ul className="mt-7 space-y-3">
                  {[
                    "Professionelle Präsentation und Vermarktung",
                    "Buchungsmanagement und Gästekommunikation",
                    "Reinigung, Wäscheservice und Objektkontrolle",
                    "Persönliche und langfristige Zusammenarbeit",
                  ].map((item) => (
                    <CheckLine key={item} dark>
                      {item}
                    </CheckLine>
                  ))}
                </ul>

                <Link
                  href="/contact"
                  className="group mt-9 inline-flex items-center gap-2 rounded-full bg-[#f4d59d] px-6 py-3.5 text-sm font-bold text-[#07131f] transition hover:-translate-y-0.5 hover:bg-[#f7dfb3]"
                >
                  Zusammenarbeit anfragen
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </Link>
              </div>
            </article>
          </div>
        </section>

        {/* Values */}
        <section className="bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="text-center">
              <SectionLabel centered>Unsere Werte</SectionLabel>

              <h2 className="mx-auto mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.055em] sm:text-5xl">
                Was unsere tägliche
                <span className="block font-serif font-normal italic text-[#c99a43]">
                  Arbeit bestimmt.
                </span>
              </h2>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {values.map((value) => (
                <article
                  key={value.title}
                  className="rounded-[2rem] bg-[#f6f8fb] p-6 sm:p-7"
                >
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#9a6b25] shadow-sm">
                    <value.icon className="h-5 w-5" />
                  </div>

                  <h3 className="mt-6 text-lg font-semibold tracking-[-0.03em]">
                    {value.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    {value.text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Local connection */}
        <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto grid max-w-7xl items-center gap-10 rounded-[2.5rem] border border-[#ead7b4] bg-[#fffaf1] p-7 sm:p-10 lg:grid-cols-[1fr_0.8fr] lg:p-14">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#9a6b25]">
                <MapPin className="h-4 w-4" />
                Unsere Heimat
              </div>

              <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.055em] sm:text-5xl">
                Zuhause an
                <span className="font-serif font-normal italic text-[#c99a43]">
                  {" "}
                  der Ostsee.
                </span>
              </h2>

              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600">
                Die Ostsee steht für Erholung, Freiheit und gemeinsame Zeit.
                Unsere Ferienunterkünfte sind der Ausgangspunkt für
                Strandspaziergänge, Fahrradtouren und persönliche
                Urlaubserlebnisse.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {[
                {
                  icon: Waves,
                  text: "Ferienunterkünfte entlang der Ostseeküste",
                },
                {
                  icon: Home,
                  text: "Apartments, Ferienwohnungen und Ferienhäuser",
                },
                {
                  icon: Clock3,
                  text: "Persönliche Betreuung und flexible Anreise",
                },
              ].map((item) => (
                <div
                  key={item.text}
                  className="flex items-center gap-4 rounded-2xl bg-white/80 p-4 shadow-sm"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f4d59d] text-[#07131f]">
                    <item.icon className="h-4 w-4" />
                  </span>

                  <p className="text-sm font-semibold leading-6 text-slate-700">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
            <div>
              <SectionLabel>Häufige Fragen</SectionLabel>

              <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.055em] sm:text-5xl">
                Das Wichtigste
                <span className="block font-serif font-normal italic text-[#c99a43]">
                  auf einen Blick.
                </span>
              </h2>

              <p className="mt-6 max-w-md text-base leading-8 text-slate-600">
                Weitere Fragen beantworten wir Ihnen gerne persönlich.
              </p>

              <Link
                href="/contact"
                className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-slate-950"
              >
                Kontakt aufnehmen
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="space-y-3">
              {faqs.map((faq) => (
                <details
                  key={faq.question}
                  className="group rounded-2xl border border-slate-200 bg-[#f8fafc] px-5 open:bg-white open:shadow-[0_18px_55px_rgba(15,23,42,0.06)] sm:px-6"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-base font-semibold text-slate-950 marker:hidden">
                    {faq.question}

                    <span className="relative h-6 w-6 shrink-0 rounded-full bg-white shadow-sm">
                      <span className="absolute left-1/2 top-1/2 h-px w-2.5 -translate-x-1/2 -translate-y-1/2 bg-slate-700" />
                      <span className="absolute left-1/2 top-1/2 h-2.5 w-px -translate-x-1/2 -translate-y-1/2 bg-slate-700 transition group-open:rotate-90 group-open:opacity-0" />
                    </span>
                  </summary>

                  <p className="max-w-2xl border-t border-slate-200 pb-6 pt-4 text-sm leading-7 text-slate-600">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.75rem] bg-[#07131f] px-6 py-14 text-center text-white shadow-[0_35px_100px_rgba(15,23,42,0.2)] sm:px-10 sm:py-20">
            <div
              aria-hidden="true"
              className="absolute -left-24 -top-24 h-72 w-72 rounded-full border-[48px] border-white/[0.035]"
            />

            <div
              aria-hidden="true"
              className="absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-[#c99a43]/20 blur-3xl"
            />

            <div className="relative mx-auto max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#f4d59d]">
                Urlaub Gosch
              </p>

              <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.06em] sm:text-6xl">
                Ihr Urlaub.
                <span className="font-serif font-normal italic text-[#f4d59d]">
                  {" "}
                  Ihre Immobilie.
                </span>
                <span className="block">Unser Service.</span>
              </h2>

              <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-white/65">
                Wir freuen uns darauf, Sie als Gast oder als Eigentümer einer
                Ferienimmobilie kennenzulernen.
              </p>

              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/search"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#f4d59d] px-7 py-4 text-sm font-bold text-[#07131f] transition hover:-translate-y-0.5 hover:bg-[#f7dfb3]"
                >
                  Urlaub finden
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </Link>

                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-4 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  <Mail className="h-4 w-4" />
                  Nachricht senden
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

function SectionLabel({ children, centered = false }) {
  return (
    <p
      className={`text-sm font-semibold uppercase tracking-[0.22em] text-[#b9893f] ${
        centered ? "text-center" : ""
      }`}
    >
      {children}
    </p>
  );
}

function CheckLine({ children, dark = false }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${
          dark
            ? "bg-white/10 text-[#f4d59d]"
            : "bg-[#fff4df] text-[#9a6b25]"
        }`}
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>

      <span
        className={`text-sm leading-6 ${
          dark ? "text-white/70" : "text-slate-600"
        }`}
      >
        {children}
      </span>
    </li>
  );
}