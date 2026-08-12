import Link from "next/link";
import {
  ArrowRight,
  Mail,
  MapPin,
  Phone,
  Clock,
  MessageCircle,
  Building2,
  Check,
  ShieldCheck,
} from "lucide-react";

export const metadata = {
  title: "Kontakt | Urlaub Gosch",
  description:
    "Kontaktieren Sie Urlaub Gosch bei allgemeinen Fragen oder wenn Sie Ihre Ferienunterkunft über uns vermieten möchten.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#f6f8fb] px-4 pb-20 pt-28 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Intro */}
        <section className="mb-10">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-950"
          >
            <span className="text-lg">‹</span>
            Zurück zur Startseite
          </Link>

          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-[#b9893f]">
              Kontakt
            </p>

            <h1 className="text-[clamp(2.6rem,7vw,5.8rem)] font-semibold leading-[0.95] tracking-[-0.07em] text-slate-950">
              Wir sind gerne
              <span className="block font-serif font-normal italic text-[#c99a43]">
                für Sie da.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Sie haben eine allgemeine Frage oder möchten Ihre eigene
              Ferienunterkunft über Urlaub Gosch vermieten? Schreiben Sie uns
              eine Nachricht – wir melden uns schnellstmöglich zurück.
            </p>
          </div>
        </section>

        {/* Main */}
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Form */}
          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_22px_70px_rgba(15,23,42,0.06)] sm:p-7 lg:p-8">
            <div className="mb-8 flex items-start justify-between gap-5">
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                  Nachricht senden
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  Beschreiben Sie uns kurz Ihr Anliegen. Für Vermieter haben
                  wir eine separate Auswahl vorbereitet.
                </p>
              </div>

              <div className="hidden h-12 w-12 place-items-center rounded-full bg-[#f4d59d] text-[#07131f] sm:grid">
                <Mail className="h-5 w-5" />
              </div>
            </div>

            <form className="grid gap-5">
              {/*
                Standardmäßig handelt es sich um eine allgemeine Anfrage.

                Im API-Handler:
                const isLandlordProspect =
                  formData.get("isLandlordProspect") === "true";

                const subject = isLandlordProspect
                  ? "Interessent"
                  : "Allgemeine Anfrage";
              */}

              <input
                type="hidden"
                name="defaultSubject"
                value="Allgemeine Anfrage"
              />

              {/* Vermieter-Interessent */}
              <label className="group block cursor-pointer">
                <input
                  type="checkbox"
                  name="isLandlordProspect"
                  value="true"
                  className="peer sr-only"
                />

                <div className="relative overflow-hidden rounded-[1.6rem] border border-[#ead7b4] bg-[#fffaf1] p-5 transition duration-200 hover:border-[#c99a43] peer-checked:border-[#c99a43] peer-checked:bg-[#fff7e7] peer-checked:shadow-[0_16px_45px_rgba(185,137,63,0.13)]">
                  <div className="flex items-start gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#f4d59d] text-[#07131f]">
                      <Building2 className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold text-slate-950">
                        Ich möchte meine Unterkunft vermieten
                      </p>

                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        Setzen Sie hier den Haken, wenn Sie Interesse daran
                        haben, Ihre Ferienwohnung oder Ihr Ferienhaus über
                        Urlaub Gosch anzubieten.
                      </p>
                    </div>

                    <div className="grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 border-[#d6bd91] bg-white text-transparent transition peer-checked:border-[#c99a43] peer-checked:bg-[#c99a43] peer-checked:text-white group-has-[:checked]:border-[#c99a43] group-has-[:checked]:bg-[#c99a43] group-has-[:checked]:text-white">
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </div>
                  </div>

                  <div className="mt-4 hidden items-center gap-2 border-t border-[#ead7b4] pt-4 text-sm font-semibold text-[#9a6b25] group-has-[:checked]:flex">
                    <Check className="h-4 w-4" />
                    Anfrage wird als „Interessent“ gekennzeichnet
                  </div>
                </div>
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Name"
                  name="name"
                  placeholder="Ihr vollständiger Name"
                  required
                />

                <Field
                  label="E-Mail"
                  name="email"
                  type="email"
                  placeholder="name@example.de"
                  required
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Telefon"
                  name="phone"
                  type="tel"
                  placeholder="Optional"
                />

                <Field
                  label="Betreff"
                  name="customSubject"
                  placeholder="Worum geht es?"
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Nachricht
                </label>

                <textarea
                  id="message"
                  name="message"
                  rows={8}
                  required
                  placeholder="Wie können wir Ihnen helfen?"
                  className="w-full resize-none rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#c99a43] focus:bg-white focus:ring-4 focus:ring-[#c99a43]/10"
                />
              </div>

              <label className="flex gap-3 rounded-3xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                <input
                  type="checkbox"
                  name="privacyAccepted"
                  required
                  className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 accent-[#07131f]"
                />

                <span>
                  Ich habe die{" "}
                  <Link
                    href="/privacy"
                    className="font-semibold text-slate-950 underline underline-offset-4"
                  >
                    Datenschutzerklärung
                  </Link>{" "}
                  gelesen und stimme der Verarbeitung meiner Angaben zur
                  Bearbeitung der Anfrage zu.
                </span>
              </label>

              <button
                type="submit"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#07131f] px-7 py-4 text-sm font-bold text-white shadow-[0_18px_55px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-800 sm:w-fit"
              >
                Anfrage senden
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </button>
            </form>
          </div>

          {/* Sidebar */}
          <aside className="space-y-5">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_22px_70px_rgba(15,23,42,0.06)]">
              <h2 className="text-xl font-semibold tracking-[-0.03em]">
                Kontakt
              </h2>

              <div className="mt-6 space-y-4">
                <ContactRow
                  icon={Mail}
                  label="E-Mail"
                  value="info@urlaub-gosch.de"
                  href="mailto:info@urlaub-gosch.de"
                />

                <ContactRow
                  icon={Phone}
                  label="Telefon"
                  value="+49 000 000000"
                  href="tel:+490000000000"
                />

                <ContactRow
                  icon={MapPin}
                  label="Region"
                  value="Nordsee & Ostsee"
                />

                <ContactRow
                  icon={Clock}
                  label="Antwortzeit"
                  value="Meist innerhalb von 24 Stunden"
                />
              </div>
            </div>

            <div className="rounded-[2rem] bg-[#07131f] p-6 text-white shadow-[0_22px_70px_rgba(15,23,42,0.12)]">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/40">
                Ihre Anfrage
              </p>

              <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em]">
                Schnell und unkompliziert
              </h3>

              <div className="mt-5 space-y-4 text-sm text-white/70">
                <InfoLine
                  icon={MessageCircle}
                  text="Beschreiben Sie kurz Ihr Anliegen"
                />

                <InfoLine
                  icon={Building2}
                  text="Vermieter wählen den Interessenten-Haken"
                />

                <InfoLine
                  icon={ShieldCheck}
                  text="Ihre Angaben werden vertraulich behandelt"
                />
              </div>
            </div>

            <div className="rounded-[2rem] border border-[#ead7b4] bg-[#fffaf1] p-6">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-[#f4d59d] text-[#07131f]">
                <Building2 className="h-5 w-5" />
              </div>

              <h3 className="mt-5 text-xl font-semibold tracking-[-0.03em] text-slate-950">
                Eigentümer einer Unterkunft?
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Wir beraten Sie gerne unverbindlich zu einer möglichen
                Zusammenarbeit und der Vermietung über Urlaub Gosch.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required = false,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        {label}

        {!required && (
          <span className="ml-1 font-normal text-slate-400">optional</span>
        )}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#c99a43] focus:bg-white focus:ring-4 focus:ring-[#c99a43]/10"
      />
    </div>
  );
}

function ContactRow({ icon: Icon, label, value, href }) {
  const content = (
    <div className="flex gap-4">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700">
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-950">{label}</p>
        <p className="truncate text-sm text-slate-500">{value}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block transition hover:opacity-75">
        {content}
      </a>
    );
  }

  return content;
}

function InfoLine({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-[#f4d59d]">
        <Icon className="h-4 w-4" />
      </div>

      <span>{text}</span>
    </div>
  );
}