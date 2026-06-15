import Link from "next/link";
import {
  ArrowLeft,
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
  title: "Datenschutzerklärung & Haftungsausschluss | Urlaub-GOSCH",
  description:
    "Datenschutzerklärung, Haftungsausschluss und rechtliche Hinweise von Urlaub-GOSCH.",
  robots: {
    index: true,
    follow: true,
  },
};

const sections = [
  { id: "haftung", label: "Haftung" },
  { id: "links", label: "Links" },
  { id: "urheberrecht", label: "Urheberrecht" },
  { id: "datenschutz", label: "Datenschutz" },
  { id: "daten", label: "Datenarten" },
  { id: "rechte", label: "Rechte" },
  { id: "cookies", label: "Cookies" },
  { id: "hosting", label: "Hosting" },
  { id: "kontakt", label: "Kontakt" },
  { id: "matomo", label: "Matomo" },
  { id: "dienste", label: "Dienste Dritter" },
];

export default function DatenschutzPage() {
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

        <section className="relative overflow-hidden rounded-[2rem] border border-[#e7dfd1] bg-white shadow-[0_24px_70px_rgba(7,19,31,0.08)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(201,154,67,0.22),transparent_32%),linear-gradient(135deg,rgba(7,19,31,0.035),transparent_55%)]" />

          <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:p-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#e7dfd1] bg-[#f6efe2] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#07131f]">
                <ShieldCheck className="h-3.5 w-3.5 text-[#c99a43]" />
                Rechtliches
              </div>

              <h1 className="mt-6 max-w-4xl text-[clamp(2.3rem,6vw,5rem)] font-semibold leading-[0.98] tracking-[-0.07em] text-[#07131f]">
                Datenschutzerklärung
                <span className="block font-serif italic font-normal text-[#c99a43]">
                  & Haftungsausschluss.
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                Informationen zur Verarbeitung personenbezogener Daten, zur
                Haftung für Inhalte und Links sowie zu Cookies, Hosting und
                eingebundenen Diensten.
              </p>
            </div>

            <aside className="rounded-[1.5rem] border border-[#e7dfd1] bg-white/90 p-5 shadow-[0_18px_50px_rgba(7,19,31,0.06)] backdrop-blur">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-[#07131f] text-white">
                <Lock className="h-5 w-5" />
              </div>

              <h2 className="mt-5 text-xl font-semibold tracking-[-0.03em] text-[#07131f]">
                Übersicht
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Schnell zu den wichtigsten Bereichen dieser Seite.
              </p>

              <nav className="mt-5 grid gap-2">
                {sections.slice(0, 6).map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="rounded-xl bg-[#f8f5ee] px-3 py-2 text-sm font-semibold text-slate-600 ring-1 ring-[#e7dfd1] transition-colors hover:bg-[#07131f] hover:text-white"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </aside>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="hidden h-fit rounded-[1.5rem] border border-[#e7dfd1] bg-white p-4 shadow-[0_18px_50px_rgba(7,19,31,0.045)] lg:sticky lg:top-28 lg:block">
            <p className="px-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#c99a43]">
              Inhalt
            </p>

            <nav className="mt-3 grid gap-1">
              {sections.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-[#f8f5ee] hover:text-[#07131f]"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </aside>

          <div className="space-y-6">
            <LegalCard
              id="haftung"
              icon={Scale}
              eyebrow="Haftungsausschluss"
              title="Haftung für Inhalte"
            >
              <p>
                Die Inhalte unserer Seiten wurden mit größter Sorgfalt
                erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität
                der Inhalte können wir jedoch keine Gewähr übernehmen.
              </p>

              <p>
                Als Diensteanbieter sind wir für eigene Inhalte auf diesen
                Seiten nach den allgemeinen Gesetzen verantwortlich. Wir sind
                jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
                Informationen zu überwachen oder nach Umständen zu forschen, die
                auf eine rechtswidrige Tätigkeit hinweisen.
              </p>

              <p>
                Verpflichtungen zur Entfernung oder Sperrung der Nutzung von
                Informationen nach den allgemeinen Gesetzen bleiben hiervon
                unberührt. Eine Haftung ist jedoch erst ab dem Zeitpunkt der
                Kenntnis einer konkreten Rechtsverletzung möglich. Bei
                Bekanntwerden entsprechender Rechtsverletzungen werden wir diese
                Inhalte umgehend entfernen.
              </p>
            </LegalCard>

            <LegalCard
              id="links"
              icon={ExternalLink}
              eyebrow="Externe Webseiten"
              title="Haftung für Links"
            >
              <p>
                Unser Angebot enthält Links zu externen Webseiten Dritter, auf
                deren Inhalte wir keinen Einfluss haben. Deshalb können wir für
                diese fremden Inhalte auch keine Gewähr übernehmen.
              </p>

              <p>
                Für die Inhalte der verlinkten Seiten ist stets der jeweilige
                Anbieter oder Betreiber der Seiten verantwortlich. Die
                verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf
                mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren
                zum Zeitpunkt der Verlinkung nicht erkennbar.
              </p>

              <p>
                Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist
                ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht
                zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir
                derartige Links umgehend entfernen.
              </p>
            </LegalCard>

            <LegalCard
              id="urheberrecht"
              icon={FileText}
              eyebrow="Urheberrecht"
              title="Urheberrechtliche Hinweise"
            >
              <p>
                Die durch die Seitenbetreiber erstellten Inhalte und Werke auf
                diesen Seiten unterliegen dem deutschen Urheberrecht. Die
                Vervielfältigung, Bearbeitung, Verbreitung und jede Art der
                Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der
                schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
              </p>

              <p>
                Downloads und Kopien dieser Seite sind nur für den privaten,
                nicht kommerziellen Gebrauch gestattet. Soweit die Inhalte auf
                dieser Seite nicht vom Betreiber erstellt wurden, werden die
                Urheberrechte Dritter beachtet.
              </p>

              <p>
                Sollten Sie trotzdem auf eine Urheberrechtsverletzung
                aufmerksam werden, bitten wir um einen entsprechenden Hinweis.
                Bei Bekanntwerden von Rechtsverletzungen werden wir derartige
                Inhalte umgehend entfernen.
              </p>
            </LegalCard>

            <LegalCard
              id="datenschutz"
              icon={ShieldCheck}
              eyebrow="Datenschutzerklärung"
              title="Allgemeine Hinweise zur Datenverarbeitung"
            >
              <p>
                Im Rahmen dieser Datenschutzerklärung werden Sie über Zweck und
                Umfang der Verarbeitung personenbezogener Daten innerhalb
                unserer Webseite und der mit dieser verbundenen Systeme
                aufgeklärt.
              </p>

              <p>
                Die Verwendung der Begrifflichkeiten orientiert sich, sofern
                nicht anders angegeben, an Art. 4 der
                Datenschutzgrundverordnung (DSGVO).
              </p>
            </LegalCard>

            <LegalCard
              id="daten"
              icon={Database}
              eyebrow="Datenverarbeitung"
              title="Betroffene Personen, Zwecke und Datenarten"
            >
              <div className="grid gap-4 md:grid-cols-2">
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

            <LegalCard
              id="auftragsverarbeitung"
              icon={Globe}
              eyebrow="Zusammenarbeit"
              title="Auftragsverarbeiter, Dritte und Drittländer"
            >
              <p>
                Sollten anderen Personen oder Unternehmen Zugriff auf Daten
                gewährt werden, erfolgt dies aufgrund einer rechtlichen
                Verpflichtung, einer gesetzlichen Erlaubnis, einer Einwilligung
                oder aufgrund berechtigter Interessen.
              </p>

              <p>
                Wurden Dritte mit der Verarbeitung von Daten beauftragt, so
                geschieht dies gemäß Art. 28 DSGVO auf Grundlage eines
                Auftragsverarbeitungsvertrages.
              </p>

              <p>
                Eine Verarbeitung von Daten in einem Drittland erfolgt nur unter
                den Voraussetzungen der Art. 44 ff. DSGVO, etwa auf Grundlage
                besonderer Garantien oder spezieller vertraglicher
                Verpflichtungen.
              </p>
            </LegalCard>

            <LegalCard id="rechte" icon={UserRound} eyebrow="Nutzerrechte" title="Ihre Rechte">
              <div className="grid gap-4 md:grid-cols-2">
                <InfoBox
                  title="Auskunft und Bestätigung"
                  items={["Recht auf Auskunft gemäß Art. 15 DSGVO"]}
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

            <LegalCard id="cookies" icon={Cookie} eyebrow="Cookies" title="Cookies">
              <p>
                Unser Onlineangebot benutzt Cookies. Cookies sind kleine
                Textdateien, die beim Besuch unserer Webseite auf Ihrem Computer
                gespeichert werden. Sie können dazu dienen, Angaben des Nutzers
                während oder nach einem Besuch zu speichern.
              </p>

              <p>
                Sollten Sie keine Cookies wünschen, können Sie die Speicherung
                in den Einstellungen Ihres Browsers deaktivieren oder bestehende
                Cookies löschen. Ein Ausschluss von Cookies kann zu
                Funktionseinschränkungen führen.
              </p>
            </LegalCard>

            <LegalCard
              id="loeschung"
              icon={Database}
              eyebrow="Speicherung"
              title="Löschung von Daten"
            >
              <p>
                Soweit nicht anders angegeben, werden gespeicherte Daten
                gelöscht, sobald sie für ihre Zweckbestimmung nicht mehr
                erforderlich sind und keine gesetzlichen Aufbewahrungspflichten
                entgegenstehen.
              </p>

              <p>
                Gesetzliche Aufbewahrungspflichten können je nach Art der Daten
                unterschiedlich lange bestehen.
              </p>
            </LegalCard>

            <LegalCard id="hosting" icon={Server} eyebrow="Hosting" title="Hosting">
              <p>
                Um das Onlineangebot anbieten zu können, nutzen wir
                Hosting-Dienstleistungen wie Infrastruktur, Rechenkapazität,
                Speicherplatz, Sicherheit und Wartung.
              </p>

              <p>
                In diesem Rahmen können Inhaltsdaten, Nutzungsdaten,
                Meta-/Kommunikationsdaten und Kontaktdaten verarbeitet werden.
                Grundlage ist das berechtigte Interesse an einer sicheren und
                professionellen Bereitstellung des Onlineangebotes.
              </p>
            </LegalCard>

            <LegalCard
              id="logfiles"
              icon={Server}
              eyebrow="Serverdaten"
              title="Erhebung von Zugriffsdaten und Logfiles"
            >
              <p>
                Der Hosting-Anbieter speichert Daten von jedem Zugriff auf den
                Server. Dazu können Name der abgerufenen Webseite, Datei, Datum
                und Uhrzeit des Abrufs, übertragene Datenmenge, Browsertyp,
                Betriebssystem, Referrer URL, IP-Adresse sowie der anfragende
                Provider gehören.
              </p>

              <p>
                Diese Informationen dienen der stabilen Bereitstellung des
                Onlineangebotes sowie der Gefahrenabwehr und werden nur für eine
                bestimmte Zeit gespeichert, sofern keine längere Aufbewahrung zu
                Beweiszwecken erforderlich ist.
              </p>
            </LegalCard>

            <LegalCard
              id="kontakt"
              icon={Mail}
              eyebrow="Kontaktaufnahme"
              title="Kontaktaufnahme"
            >
              <p>
                Erfolgt eine Kontaktaufnahme per E-Mail, Kontaktformular,
                Telefon oder über soziale Medien, werden die Angaben des Nutzers
                zur Bearbeitung der Anfrage verarbeitet.
              </p>

              <p>
                Die Daten der Anfragen werden gelöscht, sofern sie nicht mehr
                erforderlich sind. Darüber hinaus können gesetzliche
                Archivierungspflichten gelten.
              </p>
            </LegalCard>

            <LegalCard
              id="matomo"
              icon={ShieldCheck}
              eyebrow="Analyse"
              title="Reichweitenmessung mit Matomo"
            >
              <p>
                Auf Grundlage berechtigter Interessen kann Matomo zur Analyse
                und Optimierung des Onlineangebotes eingesetzt werden. Dabei
                können unter anderem Browserinformationen, Betriebssystem,
                Herkunftsland, Zeitpunkt der Serveranfrage, Anzahl der Besuche,
                Verweildauer sowie betätigte Links verarbeitet werden.
              </p>

              <p>
                Nutzer können der anonymisierten Datenerhebung widersprechen,
                sofern eine entsprechende Opt-Out-Möglichkeit bereitgestellt
                wird.
              </p>

              <div className="mt-5 rounded-2xl border border-[#e7dfd1] bg-[#f8f5ee] p-4 text-sm leading-6 text-[#07131f]">
                Hinweis: Falls Matomo auf Urlaub-GOSCH nicht aktiv genutzt wird,
                sollte dieser Abschnitt entfernt oder angepasst werden.
              </div>
            </LegalCard>

            <LegalCard
              id="dienste"
              icon={Globe}
              eyebrow="Drittanbieter"
              title="Einbindung von Diensten und Inhalten Dritter"
            >
              <p>
                Innerhalb des Onlineangebotes können Inhalte oder Dienste von
                Drittanbietern eingebunden werden, etwa Karten, Schriftarten
                oder externe Inhalte.
              </p>

              <p>
                Für die Darstellung solcher Inhalte kann es technisch
                erforderlich sein, dass Drittanbieter die IP-Adresse des Nutzers
                wahrnehmen.
              </p>
            </LegalCard>

            <LegalCard
              id="google-fonts"
              icon={Globe}
              eyebrow="Schriftarten"
              title="Google Fonts"
            >
              <p>
                Im Onlineangebot können Schriftarten des Anbieters Google LLC,
                1600 Amphitheatre Parkway, Mountain View, CA 94043, USA,
                genutzt werden.
              </p>

              <p>
                Datenschutzerklärung des Anbieters:
                <br />
                <a
                  href="https://www.google.com/policies/privacy/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#07131f] underline decoration-[#c99a43]/40 underline-offset-4 hover:decoration-[#c99a43]"
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
                  className="font-semibold text-[#07131f] underline decoration-[#c99a43]/40 underline-offset-4 hover:decoration-[#c99a43]"
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

function LegalCard({ id, icon: Icon, eyebrow, title, children }) {
  return (
    <section
      id={id}
      className="scroll-mt-32 rounded-[1.75rem] border border-[#e7dfd1] bg-white p-6 shadow-[0_18px_50px_rgba(7,19,31,0.045)] sm:p-8"
    >
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

function InfoBox({ title, items }) {
  return (
    <div className="rounded-2xl border border-[#e7dfd1] bg-[#f8f5ee] p-4">
      <h3 className="text-sm font-semibold text-[#07131f]">{title}</h3>

      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c99a43]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}