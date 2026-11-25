# Verzeichnis der Verarbeitungstätigkeiten (Art. 30 DSGVO) – Website urlaub-gosch.de

Entwurf vom 24.11.2026, erstellt anhand des Website-Codes. **Vom Verantwortlichen zu prüfen, zu ergänzen und zu unterschreiben.** Felder mit „⚠ prüfen“ kann nur der Betreiber bestätigen.

**Verantwortlicher:** Ostsee-Ferienhausvermietung Birgit Gosch, Bahnhofstr. 25, 24217 Schönberg, Tel. 04344 414415, info@urlaub-gosch.de
**Datenschutzbeauftragter:** ⚠ prüfen (Pflicht erst ab 20 Personen, die ständig personenbezogene Daten verarbeiten, § 38 BDSG)

---

## 1. Bereitstellung der Website, Server-Protokolle

| | |
|---|---|
| Zweck | Auslieferung der Website, Sicherheit, Fehlersuche |
| Rechtsgrundlage | Art. 6 Abs. 1 lit. f DSGVO |
| Betroffene | Besucher der Website |
| Daten | IP-Adresse, Zeitpunkt, aufgerufene Adresse, Browser-Kennung |
| Empfänger / Auftragsverarbeiter | Vercel Inc. (Hosting, Region Frankfurt) |
| Drittland | USA (Vercel Inc.) – EU-US Data Privacy Framework / Standardvertragsklauseln ⚠ prüfen |
| Löschfrist | nach Vorgaben von Vercel (Protokolle kurzzeitig) ⚠ prüfen |
| TOM | HTTPS, Sicherheits-Header, keine Analyse- oder Marketingdienste |

## 2. Unverbindliche Buchungs- und Informationsanfragen (Formular auf den Objektseiten)

| | |
|---|---|
| Zweck | Prüfung von Verfügbarkeit und Preis, Vorbereitung des Mietvertrags |
| Rechtsgrundlage | Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahmen) |
| Betroffene | Interessenten / Gäste |
| Daten | Art der Anfrage, Vor- und Nachname, Anschrift, E-Mail, Mobilnummer, Zahl Erwachsene/Kinder, Hunde, Reisezeitraum, Objekt, optionale Nachricht |
| Speicherung | Datenbank (Neon, Region Frankfurt) und E-Mail-Postfach info@ |
| Empfänger / Auftragsverarbeiter | Neon Inc. (Datenbank), Mailjet SAS (Versand an das Postfach und Eingangsbestätigung an den Gast), Microsoft Ireland (Postfach), Vercel Inc. (Hosting); intern nur Mitarbeiter mit Recht „Belegung ansehen“ |
| Drittland | Neon Inc./Vercel Inc. (USA, Server in der EU); Mailjet: US-Unterauftragnehmer nur für Support/Abrechnung (Standardvertragsklauseln); Microsoft: EU-US Data Privacy Framework |
| Löschfrist | nach Erledigung; spätestens nach 12 Monaten (Admin → Anfragen, Löschung älterer Anfragen); bei Vertragsabschluss gesetzliche Aufbewahrung (bis 10 Jahre) ⚠ prüfen |
| TOM | Pflichtfeld- und Formatprüfung auf dem Server, Spam-Schutz, Begrenzung je IP/E-Mail, kein Tracking, Betreff ohne Gastdaten, Eingangsbestätigung ohne eingegebene Texte und max. 3 pro Adresse/Stunde, Zugriff nur nach Rollen/Rechten |

## 3. Kontaktformular

| | |
|---|---|
| Zweck | Beantwortung allgemeiner Anfragen und von Vermieter-Interessenten |
| Rechtsgrundlage | Art. 6 Abs. 1 lit. b DSGVO (bei Buchungs-/Vermietungsbezug), sonst lit. f |
| Betroffene | Anfragende |
| Daten | Name, E-Mail, optional Telefon und Betreff, Nachricht, ggf. „Vermieter-Interessent“ |
| Speicherung | **nur** im E-Mail-Postfach info@ (keine Datenbank) |
| Empfänger / Auftragsverarbeiter | Mailjet SAS (auch Eingangsbestätigung an den Absender), Microsoft Ireland, Vercel Inc. |
| Drittland | wie Nr. 2 |
| Löschfrist | nach Erledigung im Postfach löschen ⚠ Ablauf festlegen |
| TOM | wie Nr. 2; doppeltes Absenden erzeugt keine zweite Mail |

## 4. Belegungskalender und iCal-Export an Buchungsportale

| | |
|---|---|
| Zweck | Anzeige freier Zeiträume, Abgleich mit Buchungsportalen (Vermeidung von Doppelbuchungen) |
| Rechtsgrundlage | Art. 6 Abs. 1 lit. b und f DSGVO |
| Betroffene | Gäste (nur mittelbar) |
| Daten | nur belegte Zeiträume („Belegt“), keine Namen, keine Buchungsnummern |
| Empfänger | Buchungsportale (z. B. fewoFlow, Airbnb, Booking) – nur über Link mit geheimem Schlüssel |
| Drittland | je nach Portal ⚠ prüfen |
| Löschfrist | vergangene Zeiträume werden nicht mehr ausgegeben |
| TOM | geheimer Schlüssel pro Objekt (austauschbar über `ICAL_FEED_SECRET`), Link nur für Mitarbeiter mit Kalender-Bearbeitungsrecht, öffentlicher Kalender nur zusammengefasste Blöcke |

## 5. Buchungsverwaltung im Admin-Bereich (Belegungen, Gästenamen)

| | |
|---|---|
| Zweck | Verwaltung von Belegungen und Gästen |
| Rechtsgrundlage | Art. 6 Abs. 1 lit. b und c DSGVO |
| Betroffene | Gäste |
| Daten | Gastname, Zeitraum, Objekt |
| Empfänger / Auftragsverarbeiter | Neon Inc., Vercel Inc.; intern nur berechtigte Mitarbeiter |
| Löschfrist | ⚠ festlegen (gesetzliche Aufbewahrung beachten) |
| TOM | Rollen und Rechte, kurze Sitzungen (max. 12 h), Abmeldung bei Inaktivität, Passwortwechsel-Pflicht, Sitzungen widerrufbar |

## 6. Mitarbeiterkonten

| | |
|---|---|
| Zweck | Zugang zum Verwaltungsbereich |
| Rechtsgrundlage | Art. 6 Abs. 1 lit. b DSGVO, § 26 BDSG |
| Betroffene | Mitarbeiter |
| Daten | Name, E-Mail, Rolle/Rechte, Passwort (nur als Hash), letzte Anmeldung |
| Empfänger | Neon Inc., Vercel Inc. |
| Löschfrist | bei Ausscheiden Konto löschen/deaktivieren |
| TOM | bcrypt-Hash, Begrenzung von Anmeldeversuchen, Cookie nur HttpOnly/HTTPS |

## 7. Externe Medien (nur mit Einwilligung)

| | |
|---|---|
| Zweck | Karten (Google Maps, Mapbox), Strand-Webcams |
| Rechtsgrundlage | Einwilligung, § 25 Abs. 1 TDDDG, Art. 6 Abs. 1 lit. a DSGVO |
| Betroffene | Besucher, die zustimmen |
| Daten | IP-Adresse, Browserdaten |
| Empfänger | Google Ireland/Google LLC, Mapbox Inc., Webcam-Betreiber (eigene Verantwortliche) |
| Drittland | USA – Google und Mapbox unter EU-US Data Privacy Framework |
| Löschfrist | beim jeweiligen Anbieter |
| TOM | Laden erst nach Einwilligung, „Nur notwendige“ gleichwertig zu „Alle akzeptieren“, Widerruf jederzeit |

## 8. Bilder der Unterkünfte

| | |
|---|---|
| Zweck | Darstellung der Objekte |
| Rechtsgrundlage | Art. 6 Abs. 1 lit. f DSGVO |
| Daten | Fotos (keine Personen abbilden ⚠ prüfen) |
| Empfänger | Vercel Inc. (Blob-Speicher) |

---

### Verträge zur Auftragsverarbeitung (Art. 28) – Stand ⚠ prüfen

| Anbieter | Zweck | AVV abgeschlossen? |
|---|---|---|
| Vercel Inc. | Hosting, Bilder | ⚠ |
| Neon Inc. | Datenbank | ⚠ |
| Mailjet SAS (Sinch) | Formular-Mails | ⚠ im Mailjet-Konto akzeptieren, Speicherort **Europa** |
| Microsoft Ireland | E-Mail-Postfach | ⚠ (Teil der Microsoft-365-Bedingungen) |
| IONOS SE | Domain (später DNS) | ⚠ |
| planet-ocean | alte Website, DNS (bis zum Umzug) | ⚠ |
