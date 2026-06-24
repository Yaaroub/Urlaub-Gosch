import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  FileText,
  Mail,
  MapPin,
  Phone,
  Scale,
  ShieldCheck,
} from "lucide-react";

export const metadata = {
  title: "Impressum | Urlaub-GOSCH",
  description:
    "Impressum der Ostsee-Ferienhausvermietung Birgit Gosch – Urlaub-GOSCH.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function ImpressumPage() {
  return (
    <main className="min-h-screen bg-[#f6f4ef] pb-24 pt-28 text-[#07131f]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-[#07131f]"
        >
          <span className="grid h-8 w-8 place-items-center rounded-full border border-[#e7dfd1] bg-white shadow-sm">
            <ArrowLeft className="h-4 w-4" />
          </span>
          Zurück zur Startseite
        </Link>

        {/* Hero */}
        <section className="relative overflow-hidden rounded-[2rem] border border-[#e7dfd1] bg-white shadow-[0_24px_70px_rgba(7,19,31,0.08)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(201,154,67,0.22),transparent_32%),linear-gradient(135deg,rgba(7,19,31,0.035),transparent_55%)]" />

          <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:p-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#e7dfd1] bg-[#f6efe2] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#07131f]">
                <Scale className="h-3.5 w-3.5 text-[#c99a43]" />
                Rechtliches
              </div>

              <h1 className="mt-6 max-w-4xl text-[clamp(2.5rem,6vw,5rem)] font-semibold leading-[0.98] tracking-[-0.07em] text-[#07131f]">
                Impressum
                <span className="block font-serif italic font-normal text-[#c99a43]">
                  Urlaub-GOSCH.
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                Angaben gemäß den gesetzlichen Informationspflichten für das
                Onlineangebot von Urlaub-GOSCH.
              </p>
            </div>

            <aside className="rounded-[1.5rem] border border-[#e7dfd1] bg-white/90 p-5 shadow-[0_18px_50px_rgba(7,19,31,0.06)] backdrop-blur">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-[#07131f] text-white">
                <Building2 className="h-5 w-5" />
              </div>

              <h2 className="mt-5 text-xl font-semibold tracking-[-0.03em] text-[#07131f]">
                Betreiber
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Ostsee-Ferienhausvermietung
              </p>

              <div className="mt-5 rounded-2xl border border-[#e7dfd1] bg-[#f8f5ee] p-4">
                <p className="text-sm font-semibold text-[#07131f]">
                  Birgit Gosch
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Bahnhofstr. 25
                  <br />
                  24217 Schönberg
                </p>
              </div>
            </aside>
          </div>
        </section>

        {/* Content */}
        <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <InfoCard
              icon={Building2}
              eyebrow="Anbieter"
              title="Angaben zum Betreiber"
            >
              <div className="rounded-2xl border border-[#e7dfd1] bg-[#f8f5ee] p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#c99a43]">
                  Diese Seiten werden betrieben von
                </p>

                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[#07131f]">
                  Ostsee-Ferienhausvermietung
                </h2>

                <p className="mt-2 text-lg font-semibold text-[#07131f]">
                  Birgit Gosch
                </p>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <ContactBox
                  icon={MapPin}
                  label="Adresse"
                  value={
                    <>
                      Bahnhofstr. 25
                      <br />
                      24217 Schönberg
                    </>
                  }
                />

                <ContactBox
                  icon={Phone}
                  label="Telefon"
                  value={
                    <a
                      href="tel:+494344414415"
                      className="font-semibold text-[#07131f] underline decoration-[#c99a43]/40 underline-offset-4 hover:decoration-[#c99a43]"
                    >
                      (0 43 44) 414 415
                    </a>
                  }
                />

                <ContactBox
                  icon={Mail}
                  label="E-Mail"
                  value={
                    <a
                      href="mailto:info@urlaub-gosch.de"
                      className="font-semibold text-[#07131f] underline decoration-[#c99a43]/40 underline-offset-4 hover:decoration-[#c99a43]"
                    >
                      info@urlaub-gosch.de
                    </a>
                  }
                />

                <ContactBox
                  icon={FileText}
                  label="Umsatzsteuer-ID"
                  value="DE 268 313 350"
                />
              </div>
            </InfoCard>

            <InfoCard
              icon={FileText}
              eyebrow="Rechtliches"
              title="Dokumente und Hinweise"
            >
              <p>
                Unsere Allgemeinen Geschäftsbedingungen sowie der
                Haftungsausschluss sind Bestandteil der rechtlichen Hinweise
                dieses Onlineangebotes.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/agb"
                  className="inline-flex items-center justify-center rounded-full border border-[#e7dfd1] bg-white px-5 py-3 text-sm font-bold text-[#07131f] shadow-sm transition-colors hover:bg-[#f8f5ee]"
                >
                  AGB ansehen
                </Link>

                <Link
                  href="/datenschutz"
                  className="inline-flex items-center justify-center rounded-full bg-[#07131f] px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-slate-800"
                >
                  Datenschutz & Haftungsausschluss
                </Link>
              </div>
            </InfoCard>

            <InfoCard
              icon={ShieldCheck}
              eyebrow="Datenschutz"
              title="Hinweis zur Vertraulichkeit"
            >
              <p>
                Wir behandeln Ihre Daten vertraulich, geben sie von unserer
                Seite nicht an Dritte weiter und halten uns an die geltenden
                Datenschutzbestimmungen.
              </p>

              <p>
                Weitere Informationen zu eingesetzten Diensten, Analyse-Tools
                und externen Plattformen finden Sie in der Datenschutzerklärung
                und im Haftungsausschluss.
              </p>
            </InfoCard>

            <InfoCard
              icon={Mail}
              eyebrow="Kontakt"
              title="Hinweis bei Verbesserungsbedarf"
            >
              <p>
                Wir bemühen uns stets um Aktualität und Datenschutz. Sollten Sie
                weiteren Verbesserungsbedarf sehen, informieren Sie uns bitte
                per E-Mail, damit wir reagieren können.
              </p>

              <a
                href="mailto:info@urlaub-gosch.de"
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-[#07131f] px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-slate-800"
              >
                <Mail className="h-4 w-4" />
                E-Mail schreiben
              </a>
            </InfoCard>
          </div>

          {/* Aktionsbox */}
          <aside className="h-fit rounded-[1.5rem] border border-[#e7dfd1] bg-[#07131f] p-5 text-white shadow-[0_22px_60px_rgba(7,19,31,0.16)] lg:sticky lg:top-28">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c99a43]">
              Direktkontakt
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
              Wir helfen gerne weiter.
            </h2>

            <p className="mt-3 text-sm leading-6 text-white/70">
              Fragen zu Unterkünften, Buchungen oder Verfügbarkeit beantworten
              wir gerne persönlich.
            </p>

            <div className="mt-6 grid gap-3">
              <ActionLink
                icon={Phone}
                label="Jetzt anrufen"
                value="(0 43 44) 414 415"
                href="tel:+494344414415"
              />

              <ActionLink
                icon={Mail}
                label="E-Mail schreiben"
                value="info@urlaub-gosch.de"
                href="mailto:info@urlaub-gosch.de"
              />

              <ActionLink
                icon={MapPin}
                label="Route starten"
                value="Bahnhofstr. 25, Schönberg"
                href="https://www.google.com/maps/dir/?api=1&destination=Bahnhofstr.%2025%2C%2024217%20Sch%C3%B6nberg"
                external
              />
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#c99a43]">
                Betreiber
              </p>
              <p className="mt-2 text-sm font-semibold text-white">
                Ostsee-Ferienhausvermietung
              </p>
              <p className="mt-1 text-sm text-white/70">Birgit Gosch</p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function InfoCard({ icon: Icon, eyebrow, title, children }) {
  return (
    <section className="rounded-[1.75rem] border border-[#e7dfd1] bg-white p-6 shadow-[0_18px_50px_rgba(7,19,31,0.045)] sm:p-8">
      <div className="mb-5 flex items-start gap-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#07131f] text-white shadow-sm">
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c99a43]">
            {eyebrow}
          </p>

          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[#07131f]">
            {title}
          </h2>
        </div>
      </div>

      <div className="space-y-4 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
        {children}
      </div>
    </section>
  );
}

function ContactBox({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-[#e7dfd1] bg-[#f8f5ee] p-4">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#07131f] ring-1 ring-[#e7dfd1]">
          <Icon className="h-4 w-4" />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#c99a43]">
            {label}
          </p>

          <div className="mt-1 text-sm font-medium leading-6 text-slate-700">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionLink({ icon: Icon, label, value, href, external = false }) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10"
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-[#07131f]">
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#c99a43]">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-semibold leading-5 text-white">
          {value}
        </p>
      </div>
    </a>
  );
}