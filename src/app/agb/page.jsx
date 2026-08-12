// src/app/agb/page.jsx

import {
  CalendarDays,
  FileText,
  Scale,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "AGB | Urlaub-GOSCH",
  description:
    "Allgemeine Geschäftsbedingungen der Ostsee-Ferienhausvermietung.",
};

const sections = [
  {
    id: "allgemeines",
    title: "1. Allgemeines",
    paragraphs: [
      "Die Ostsee-Ferienhausvermietung handelt, sofern sie nicht selbst Eigentümer des zu vermietenden Objekts ist, im Auftrag und auf Kosten der Vermieter und vermittelt Ferienhäuser und Ferienwohnungen. Alle Leistungen sind in einem Mietvertrag enthalten und werden zwischen dem Gast und der Ostsee-Ferienhausvermietung vereinbart.",
    ],
  },
  {
    id: "gueltigkeit-mietvertrag",
    title: "2. Gültigkeit und Dauer eines Mietvertrages",
    paragraphs: [
      "Der Vertrag gilt als abgeschlossen, sobald das Ferienhaus oder die Ferienwohnung bestellt und zugesagt ist. Für die Buchung ist der Eingang der Anzahlung bindend. Der Abschluss des Mietvertrages verpflichtet die Vertragspartner zur Erfüllung des Vertrages, gleichgültig auf welche Dauer der Vertrag abgeschlossen ist. Der Mietvertrag beginnt am Anreisetag mit der Schlüsselübergabe und endet am Abreisetag mit der Schlüsselrückgabe. Abweichende Regelungen sind mit der Ostsee-Ferienhausvermietung zu vereinbaren.",
    ],
  },
  {
    id: "rechte-pflichten",
    title: "3. Rechte und Pflichten",
    paragraphs: [
      "Die Ostsee-Ferienhausvermietung ist verpflichtet, die vereinbarten Leistungen zu erbringen. Der Gast ist verpflichtet, der Ostsee-Ferienhausvermietung den vereinbarten Mietpreis zu zahlen. Bis zum Anreisetag ist der Gast berechtigt, dass statt seiner ein Dritter in die Rechte und Pflichten aus dem Reisevertrag eintritt. In diesem Fall haften der Gast und der als Dritter Eingetretene als Gesamtschuldner für den Reisespreis und die durch den Eintritt des Dritten entstandenen Mehrkosten. Es bleibt der Ostsee-Ferienhausvermietung vorbehalten, diesen Dritten aus wichtigem Grunde abzulehnen.",
    ],
  },
  {
    id: "mangelabhilfe",
    title: "4. Mangelabhilfe",
    paragraphs: [
      "Die Ostsee-Ferienhausvermietung ist bei Nichtbereitstellung der Unterkunft dem Gast gegenüber zu Schadensersatz verpflichtet, wenn sie keinen gleichwertigen Ersatz zur Verfügung stellen kann. Ist die Beherbergung im Sinne der vereinbarten Leistungen mangelhaft, so mindert sich der Preis für die Dauer des Mangels. Die Haftung des Vermieters ist auf den doppelten Preis der Vertragsleistung beschränkt. Kleine Mängel an der Einrichtung oder der Ausfall eines Geräts berechtigen nicht zur Minderung.",
    ],
  },
  {
    id: "reiseruecktritt",
    title: "5. Reiserücktritt",
    paragraphs: [
      "Der Gast kann vor dem Anreisetag jederzeit vom Vertrag zurücktreten. Die Ostsee-Ferienhausvermietung verliert dadurch den Anspruch auf den Vermietungspreis, macht für diesen Fall jedoch nachfolgende pauschale Stornogebühr unter Berücksichtigung der ersparten Aufwendungen mit sofortiger Fälligkeit geltend:",
    ],
    bullets: [
      "bis zum 49. Tag vor Reiseantritt: 15 % vom Reisepreis, mindestens jedoch EUR 50,-",
      "bis zum 35. Tag vor Reiseantritt: 30 % vom Reisepreis",
      "bis zum 21. Tag vor Reiseantritt: 60 % vom Reisepreis",
      "bis zum 14. Tag vor Reiseantritt: 90 % vom Reisepreis",
      "ansonsten 100% des Reisepreises",
    ],
    after: [
      "Bei Nichtinanspruchnahme der Vermietungsleistung ist die Ferienagentur zur baldmöglichsten anderweitigen Vermietung verpflichtet, um Ausfälle zu vermeiden und den Schaden so gering wie möglich zu halten. Eine Bearbeitungsgebühr von 50,- Euro steht der Ostsee-Ferienhausvermietung trotzdem zu. Wir empfehlen den Abschluss einer Reiserücktrittsversicherung. Rücktrittserklärungen müssen in jedem Falle schriftlich erfolgen und sind direkt an die Ostsee-Ferienhausvermietung zu richten.",
    ],
  },
  {
    id: "zahlungsbedingungen",
    title: "6. Zahlungsbedingungen",
    paragraphs: [
      "Mit Erhalt der schriftlichen Buchungsbestätigung wird eine Anzahlung bis 15 % des Mietpreises, jedoch mind. EUR 50,- fällig. Die Restzahlung erfolgt gemäß Reisevertrag. Die Zahlung kann in Form von Einzahlung / Überweisung auf das Konto der Ostsee-Ferienhausvermietung erfolgen. Die Zahlung per Kreditkarte ist nicht möglich. Die Kurtaxe ist am Anreisetag beim Tourist-Service in Kalifornien bzw. Schönberger Strand oder bei der Ostsee-Ferienhausvermietung zu bezahlen.",
    ],
  },
  {
    id: "kaution",
    title: "7. Kaution",
    paragraphs: [
      "Bei Buchung wird eine Kaution von mindestens EUR 100,- mit ausgewiesen. Diese ist mit der Restmiete gemäß Mietvertrag zu zahlen. Bei Buchungen im Zeitraum Weihnachten und Silvester wird eine Kaution von EUR 200,- berechnet. Bei Buchungen mit 2 oder mehr Haustieren, wird eine Kaution von EUR 200,- berechnet. Die Erstattung wird nach Abreise des Gastes entsprechend zurücküberwiesen.",
    ],
  },
  {
    id: "anreise",
    title: "8. Anreise",
    paragraphs: [
      "Unsere Objekte werden in der Regel an Ihrem Anreisetag gereinigt und stehen Ihnen je nach Unterkunft zwischen 14:00 und 16 Uhr zur Verfügung. Die Schlüsselübergabe erfolgt in der Bahnhofstr. 25, 24217 Schönberg.",
      "Die Abreise und Schlüsselrückgabe hat bis 10:00 Uhr am letzten Buchungstag zu erfolgen.",
    ],
  },
  {
    id: "nebenkosten",
    title: "9. Nebenkosten / Zusatzleistungen",
    paragraphs: [
      "Die Nebenkosten für Gas, Wasser und Strom sind im Mietpreis enthalten, sofern nicht anders beim Objekt und auf dem Mietvertrag ausgewiesen. Die Nebenkosten für Endreinigung sind im Mietpreis enthalten, sofern im Mietvertrag nichts anderes vereinbart wurde. Das Mietobjekt ist bei Abreise besenrein zu hinterlassen. Sofern Bettwäsche nicht gesondert gebucht wurde, ist diese selbst mitzubringen.",
      "Elektroautos sind schon aus Sicherheitsgründen nicht über die Haussteckdosen zu laden.",
    ],
  },
  {
    id: "hausordnung-haftung",
    title: "10. Allgemeine Verpflichtungen / Hausordnung / Haftung des Mieters",
    paragraphs: [
      "Das Mietobjekt darf nur bis zu der angegebenen Maximalzahl an Personen belegt werden, das Aufstellen von Zelten, Campingwagen oder Wohnmobilen auf dem Grundstück des Mietobjektes ist nicht gestattet. Alle Gäste sind gehalten, sich nach der jeweils geltenden Hausordnung zu richten, die in jedem Objekt ausliegt. Gegenstände, die während des Aufenthaltes beschädigt wurden oder abhanden gekommen sind, sind vom Mieter zu ersetzen. Der Mieter ist verpflichtet, alle Mängel und Schäden, die in der Zeit entstehen, in der er das Mietobjekt bewohnt, sofort zu melden. Dem Mieter obliegt der Beweis, dass ein Schaden nicht während seiner Mietzeit entstanden ist, dass ihn oder die ihn begleitenden Personen kein Verschulden trifft.",
      "Es besteht für den Eigentümer und für die Ostsee-Ferienhausvermietung Gosch keine Haftpflicht dem Mieter und dessen Eigentum gegenüber. Der Mieter trägt somit selber die Verantwortung für seinen Versicherungsschutz während des Aufenthaltes.",
      "Reklamationen bezgl. des Reinigungszustandes sind sofort bei Ankunft und vor Einzug der Ostsee-Ferienhausvermietung mitzuteilen. Bei Anreise außerhalb der Bürozeiten verzichtet der Mieter auf das Reklamationsrecht zur Reinigung. Reklamationen bedürfen generell der Textform und müssen sofort gegenüber dem Eigentümer und der Ostsee-Ferienhausvermietung Gosch angezeigt werden. Reklamationen bei und nach der Abreise werden nicht anerkannt. Der Mieter ist verpflichtet das Domizil sorgfältig zu behandeln und bei Abreise in einem aufgeräumten und besenreinen Zustand zu verlassen. Wird ein Hund / Hunde oder Haustier / Haustiere mitgebracht, ist der Mieter verpflichtet die Hundehaare bzw. Tierhaare und deren Hinterlassenschaften vor Abreise zu beseitigen, auch wenn eine Endreinigung bestellt ist oder diese in der Miete enthalten ist.",
      "Der anmeldende Mieter haftet persönlich für alle Mitreisenden. Das Mitbringen von Haustieren, insbesondere von Hunden, ist nur gestattet, wenn es bei dem Mietobjekt explizit ausgewiesen ist. Hunde und / oder Haustiere dürfen nicht unbeaufsichtigt allein in den Objekten gelassen werden. Des Weiteren ist es nicht erlaubt, dass sich Hunde und / oder Haustiere in den Schlafzimmer-Betten aufhalten. Auch bei Objekten, bei denen das Mitbringen von Haustieren ausgeschlossen ist, kann nicht garantiert werden, dass sich niemals Tiere im Haus befunden haben. Bitte beachten Sie die Rauchverbote in den Objekten.",
      "Bei Insekten im Haus oder dessen Umgebung können weder der Vermittler noch der Eigentümer zur Verantwortung gezogen werden. Der Vermittler und der Hauseigentümer tragen keine Verantwortung für Baulärm oder Staub von den Nachbargrundstücken.",
    ],
  },
  {
    id: "kundenstimmen",
    title: "11. Kundenstimmen und Meinungsbeiträge",
    paragraphs: [
      "Auf dem Webportal des Anbieters besteht für die Mieter der jeweiligen Objekte, die Möglichkeit Erfahrungsberichte und Meinungen über die Ferienunterkünfte zu verfassen und zu veröffentlichen. Die Nutzung dieser Funktion unterliegt einer eigenen Richtlinie, welche vor der Veröffentlichung eingesehen werden kann. Die Meinungsäußerungen sind öffentlich abrufbar. Mit der jeweils gültigen Fassung dieser Richtlinien erklären sich Vermieter/Mieter/Nutzer einverstanden. Die Entscheidung über die Veröffentlichung unterliegt ausschließlich dem Anbieter. Es besteht kein Anspruch gegenüber dem Anbieter auf Veröffentlichung, Löschung oder Abänderung durch den Vermieter/Mieter/Nutzer, sofern keine gesetzlichen Verpflichtungen hierfür bestehen. Im Zuge der qualifizierten Eindrucksvermittlung können diese Beiträge auch kritischen Inhalt enthalten. Hiermit erklärt sich der Vermieter ausdrücklich einverstanden. Die Richtlinien zur Veröffentlichung von Meinungsäußerungen enthalten jedoch Bestimmungen, die eine diffamierenden und nicht objektiven Bewertungsstandard sowie sonstige unqualifizierten Inhalt durch den Nutzer untersagt.",
    ],
  },
  {
    id: "webportal",
    title: "12. Verfügbarkeit des Webportals / Änderungen",
    paragraphs: [
      "Der Anbieter ist bemüht eine lückenlose Verfügbarkeit des Webportals sicherzustellen. Dennoch kann es zu vorübergehenden Ausfällen z.B. aus Gründen der Wartung kommen. Der vorübergehende Ausfall des Webportals berechtigt keinerlei Ansprüche gegen den Anbieter. Der Anbieter ist ebenfalls berechtigt Funktionen und Gestaltung des Webportals zu ändern, ohne dass dies Einfluss auf den Vertrag hat.",
    ],
  },
  {
    id: "gerichtsstand",
    title: "13. Gerichtsstand",
    paragraphs: [
      "Ausschließlicher Gerichtsstand ist Plön.",
    ],
  },
  {
    id: "unwirksamkeit",
    title: "14. Unwirksamkeit einzelner Bestimmungen",
    paragraphs: [
      "Die Unwirksamkeit einzelner Bestimmungen des Mietvertrages, hat nicht die Unwirksamkeit des gesamten Mietvertrages zur Folge.",
    ],
  },
  {
    id: "gutschein-agb",
    title: "15. Gutschein-AGB's",
    subSections: [
      {
        title: "Geltungsbereich",
        paragraphs: [
          "Die AGB gelten für alle von der Ostsee-Ferienhausvermietung, Lerchenweg 10, 24217 Kalifornien, ausgegebenen Gutscheine.",
        ],
      },
      {
        title: "Datenschutz",
        paragraphs: [
          "Die Ostsee-Ferienhausvermietung nutzt personenbezogene Daten ausschließlich zur Vertragsabwickung. Eine Verwendung für darüber hinausgehende Zwecke findet nur statt, sofern eine Einwilligung des Betroffenen oder ein gesetzlicher Ausnahmetatbestand vorliegen.",
        ],
      },
      {
        title: "Gerichtsstand, Rechtswahl",
        paragraphs: [
          "Gerichtsstand für alle Rechtsstreitigkeiten im Verhältnis der Ostsee-Ferienhausvermietung und einem gewerblichen Kunden ist der Sitz der Ostsee-Ferienhausvermietung. Es gilt ausschließlich deutsches Recht.",
        ],
      },
      {
        title: "Gültigkeitszeitraum",
        paragraphs: [
          "Gutscheine der Ostsee-Ferienhausvermietung haben Gültigkeit in dem aufgedruckten bzw. (bei elektronischen Gutscheinen) elektronisch übermittelten Zeiträumen. Ist kein Zeitraum angegeben, so richtet sich die Gültigkeit nach den allgemeinen Verjährungsregeln, §§ 195,197 BGB. Die Verjährungsfrist beträgt drei (3) Jahre.",
        ],
      },
      {
        title: "Übertragbarkeit",
        paragraphs: [
          "Alle Gutscheine der Ostsee-Ferienhausvermietung sind frei übertragbar. Bei Weitergabe des Gutscheins muss der Gutscheinempfänger über die geltenden AGB informiert werden.",
        ],
      },
      {
        title: "Einlösung",
        paragraphs: [
          "Die EInlösung des Gutscheins kann ausschließlich im Ganzen erfolgen. Teileinlösungen und Restauszahlungen sind nicht möglich. Ebenfalls ist eine Barauszahlung des kompletten Gutscheinwertes nicht möglich.",
        ],
      },
      {
        title: "Verjährung",
        paragraphs: [
          "Die Verjährungsfrist eines ausgestellten Gutscheins der Ostsee-Ferienhausvermietung unterliegt den allgemeinen Verjährungsfristen des Bürgerlichen Gesetzbuches, §§ 195,197 (sofern nicht eingeschränkt). Danach verjährt der Anspruch auf Nutzung des Gutscheins nach drei (3) Jahren. Die Verjährungsfrist beginnt dabei mit Ende des Jahres, in welchem der Gutschein gekauft bzw. ausgegeben wurde.",
        ],
      },
    ],
  },
  {
    id: "aussergewoehnliche-umstaende",
    title: "16. Außergewöhnliche Umstände (Covid-19)",
    paragraphs: [
      "Im Falle eines Erlasses unserer Landesregierung (Schleswig-Holstein), der ihre Anreise, z.B. in Folge eines Beherbergungsverbotes, unmöglich macht, haben Sie die Möglichkeit der kostenfreien Stornierung.",
      "Weiterhin bieten wir Ihnen die Möglichkeit einer kostenfreien Umbuchung oder Ausstellung eines Gutscheins, sofern die Anreise per Erlass der schleswig-holsteinischen Landesregierung unmöglich ist.",
      "Die Möglichkeiten der kostenfreien Stornierung, kostenfreien Umbuchung und Gutscheinausstellung bestehen nicht im Krankheitsfall oder einer Ausreisesperre ihres Bundeslandes/ ihres Kreises oder ihrem Heimatort.",
    ],
  },
];

export default function AgbPage() {
  return (
    <main className="min-h-screen bg-[#f7fafc] pt-28 text-slate-800 sm:pt-32">
      {/* Hero */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#07131f] text-white shadow-[0_24px_80px_rgba(7,19,31,0.18)]">
          <div className="relative overflow-hidden px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-[#e8c375]/10 blur-3xl"
            />

            <div className="relative max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#e8c375]">
                <Scale className="h-4 w-4" />
                Rechtliche Informationen
              </div>

              <h1 className="mt-6 font-serif text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
                Allgemeine Geschäftsbedingungen
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-white/65">
                Allgemeine Geschäftsbedingungen der Ostsee-Ferienhausvermietung
                für die Vermittlung und Vermietung von Ferienhäusern und
                Ferienwohnungen.
              </p>

              <div className="mt-7 flex flex-wrap gap-3 text-sm">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-white/70">
                  <CalendarDays className="h-4 w-4 text-[#e8c375]" />
                  Geändert am 01.06.2025
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-white/70">
                  <ShieldCheck className="h-4 w-4 text-[#e8c375]" />
                  Ostsee-Ferienhausvermietung
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Inhalt */}
      <section className="px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
          {/* Inhaltsverzeichnis */}
          <aside className="lg:sticky lg:top-28">
            <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#07131f] text-[#e8c375]">
                  <FileText className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400">
                    Übersicht
                  </p>
                  <h2 className="font-semibold text-slate-950">
                    Inhaltsverzeichnis
                  </h2>
                </div>
              </div>

              <nav
                aria-label="AGB Inhaltsverzeichnis"
                className="mt-5 max-h-[calc(100vh-190px)] space-y-1 overflow-y-auto pr-1"
              >
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="block rounded-xl px-3 py-2.5 text-sm leading-5 text-slate-600 transition hover:bg-slate-50 hover:text-[#07131f]"
                  >
                    {section.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* AGB */}
          <article className="min-w-0">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-8 lg:p-10">
              <div className="border-b border-slate-200 pb-8">
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#b48a32]">
                  Unsere AGB
                </p>

                <h2 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.03em] text-slate-950">
                  Unsere Allgemeinen Geschäftsbedingungen
                </h2>

                <p className="mt-3 text-sm text-slate-500">
                  geändert am 01.06.2025
                </p>
              </div>

              <div className="divide-y divide-slate-200">
                {sections.map((section) => (
                  <section
                    key={section.id}
                    id={section.id}
                    className="scroll-mt-32 py-8 first:pt-8"
                  >
                    <h2 className="font-serif text-2xl font-semibold tracking-[-0.02em] text-[#07131f] sm:text-[1.7rem]">
                      {section.title}
                    </h2>

                    {section.paragraphs?.map((paragraph, index) => (
                      <p
                        key={index}
                        className="mt-4 text-[15px] leading-8 text-slate-650 sm:text-base"
                      >
                        {paragraph}
                      </p>
                    ))}

                    {section.bullets ? (
                      <ul className="mt-5 space-y-3">
                        {section.bullets.map((item) => (
                          <li
                            key={item}
                            className="flex gap-3 rounded-xl bg-slate-50 px-4 py-3 text-[15px] leading-6 text-slate-700"
                          >
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#e8c375]" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    {section.after?.map((paragraph, index) => (
                      <p
                        key={index}
                        className="mt-5 text-[15px] leading-8 text-slate-650 sm:text-base"
                      >
                        {paragraph}
                      </p>
                    ))}

                    {section.subSections ? (
                      <div className="mt-6 space-y-4">
                        {section.subSections.map((subSection) => (
                          <div
                            key={subSection.title}
                            className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5"
                          >
                            <h3 className="font-semibold text-slate-950">
                              {subSection.title}
                            </h3>

                            {subSection.paragraphs.map((paragraph, index) => (
                              <p
                                key={index}
                                className="mt-3 text-[15px] leading-7 text-slate-650"
                              >
                                {paragraph}
                              </p>
                            ))}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </section>
                ))}
              </div>
            </div>

            {/* Abschluss */}
            <div className="mt-6 flex flex-col gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-slate-950">
                  Fragen zu den AGB?
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Bei Fragen zu Buchung, Vertrag oder Bedingungen kannst du uns
                  direkt kontaktieren.
                </p>
              </div>

              <Link
                href="/contact"
                className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-[#07131f] px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                Kontakt aufnehmen
              </Link>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}