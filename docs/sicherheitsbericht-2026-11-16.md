# Sicherheitsbericht Urlaub-GOSCH – 16. November 2026

Geprüft wurden der Quellcode der neuen Website (Next.js, Vercel), die Live-Adresse `urlaub-gosch.vercel.app` und die alte Website `www.urlaub-gosch.de` (Drupal 7). Auf den Live-Systemen wurde **nur lesend** getestet: keine Testbuchungen, keine Registrierungen, keine Uploads, keine Lasttests. An der Datenbank wurde nichts geändert. Es wurde nichts committet oder gepusht.

Dieser Bericht ist eine technische Prüfung und keine Garantie für vollständige Sicherheit. Die Datenschutz-Hinweise sind keine Rechtsberatung.

---

## 1. Kurzfassung

| Thema | Ergebnis |
| --- | --- |
| Datenschutz-Vorfall (Portal sah Gästedaten) | **Bestätigt.** Ursache gefunden, im aktuellen Code behoben, Live-Seite ist dicht. Organisatorische Schritte sind offen (Abschnitt 2). |
| Neue Website, aktueller Code | Keine kritische Lücke. Alle gefundenen Punkte sind lokal behoben (Abschnitt 3), aber noch **nicht veröffentlicht**. |
| Live-Seite `urlaub-gosch.vercel.app` | Dicht. TLS und Header sind in Ordnung, geschützte Schnittstellen abgesichert (Abschnitt 4). |
| Alte Seite `www.urlaub-gosch.de` | Kein öffentliches Datenleck gefunden, aber **veraltet und ohne Sicherheitsupdates** (Abschnitt 5). |
| Automatische Prüfungen | 56 von 56 Tests bestanden, Lint ohne Befund, Produktions-Build erfolgreich, `npm audit` 0 Schwachstellen. |

---

## 2. Datenschutz-Vorfall: Gästedaten für ein Buchungsportal sichtbar

### Was passiert ist

1. Im Admin-Bereich unter „Kalender synchronisieren“ zeigt die Seite für jedes Objekt einen eigenen iCal-Export-Link. Der Link wurde aus der Adresse gebaut, unter der der Admin geöffnet war, also `https://urlaub-gosch.vercel.app/api/ical/<objekt>`.
2. Dieser Link wurde bei einem Buchungsportal für den Kalender-Abgleich eingetragen. Das Portal ruft ihn automatisch ab. Die Vercel-Adresse musste dafür nirgends veröffentlicht sein.
3. In älteren Versionen der Website enthielt dieser Export zu jeder Buchung „Gast: <Name>“ und zu jeder Anfrage „Anfrage von <Name>“. Darunter waren auch Buchungen, die aus anderen Portalen importiert wurden.

### Welche Versionen betroffen waren

| Code-Stand | Zeitraum | Gästedaten öffentlich |
| --- | --- | --- |
| `f17ba72` bis `1efa20d` | 26.11.2025 – 28.10.2026 | **Ja** |
| `9599e4c` „Test Vorschau 2“ | 30.10.2026 | Nein (Korrektur) |
| `a0ba201` | 01.11.2026 | Nein |
| `70dddb4` (heute live) | 14.11.2026 | Nein |

Ab wann die korrigierte Version tatsächlich live war, lässt sich nur in Vercel unter „Deployments“ ablesen. Bei der Prüfung am 04.11. fehlten live noch die Sicherheits-Header. Es ist möglich, dass die undichte Version bis zum 14.11. öffentlich lief.

### Was in den alten Versionen offenlag

| Schnittstelle | Offengelegt |
| --- | --- |
| `/api/ical/<objekt>` | Gästenamen der Buchungen und Namen der Anfragenden, jeweils mit Zeitraum |
| `/api/bookings?propertyId=…` | Gästenamen mit Zeitraum |
| `/api/properties` | alle Buchungen aller Objekte mit Gästenamen, dazu die privaten Kalender-Links anderer Portale (`icalUrl`) |
| `/api/search` | die privaten Kalender-Links |

**Nicht** offengelegt waren E-Mail-Adressen, Telefonnummern, Nachrichten aus Anfragen und Passwörter.

### Stand heute (live geprüft am 16.11.2026)

- Alle 123 Kalender-Exporte: 868 Einträge, alle nur „Belegt“ oder „Anfrage“, kein Name.
- `/api/properties`, `/api/bookings`, `/api/search`, Last-Minute, Umkreissuche: keine Gästedaten.
- Admin- und Konto-Schnittstellen ohne Login gesperrt.

### Was der Betreiber jetzt tun muss

1. **Alte Deployments sperren oder löschen.** Vercel hält jede frühere Version unter einer eigenen Adresse erreichbar. Dort läuft die undichte Version unter Umständen noch. In Vercel: „Settings → Deployment Protection“ einschalten, unter „Deployments“ alle Versionen mit Commit bis `1efa20d` löschen.
2. **Private Kalender-Links erneuern.** Bei jedem Portal den Kalender-Link neu erzeugen und im Admin unter „Kalender-Sync“ ersetzen.
3. **Portale ermitteln.** In den Kalender-Import-Einstellungen der Portale nach `urlaub-gosch.vercel.app/api/ical/` suchen. Im Team klären, wer wann welche Links eingetragen hat.
4. **Löschung verlangen.** Die betroffenen Portale schriftlich um Löschung der erhaltenen Gästenamen bitten.
5. **Meldepflicht prüfen (Art. 33 DSGVO).** Frist 72 Stunden ab Kenntnis (16.11.2026). Zuständig in Schleswig-Holstein: ULD. Die Entscheidung trifft der Verantwortliche, am besten mit Datenschutzbeauftragtem oder Anwalt. Dokumentiert werden muss der Vorfall in jedem Fall (Art. 33 Abs. 5).
6. **Zugriffsprotokolle sichern.** In Vercel unter „Logs“ Abrufe von `/api/properties`, `/api/ical` und `/api/bookings` exportieren, soweit noch vorhanden.

---

## 3. Am 16.11.2026 im Code behoben (lokal, nicht veröffentlicht)

| Nr. | Befund | Schwere | Korrektur |
| --- | --- | --- | --- |
| 1 | Bild-Adressen wurden nicht geprüft. Eine fremde Adresse hätte Startseite und Objektseite zum Absturz gebracht. | Mittel | Nur noch der eigene Bildspeicher und lokale Pfade erlaubt (`src/lib/image-hosts.js`, `api/admin/images`). |
| 2 | Mitarbeiter konnten ihr Passwort nicht mehr selbst ändern. | Mittel | Neue Seite „Passwort ändern“ im Admin, verlangt das alte Passwort, meldet andere Geräte ab (`/admin/mein-passwort`). |
| 3 | iCal-Export-Link nutzte die gerade geöffnete Adresse (Ursache des Vorfalls). | Mittel | Link verwendet fest die Hauptdomain aus `NEXT_PUBLIC_SITE_URL`. Warnhinweis, falls noch die Vercel-Adresse angezeigt wird. |
| 4 | Content-Security-Policy schränkte nur Einbettung und Formularziele ein. | Mittel | Vollständige Richtlinie: Skripte, Bilder, Verbindungen und Frames nur noch von der eigenen Seite und den tatsächlich genutzten Diensten. |
| 5 | Bildoptimierung für fremde Server freigegeben (Unsplash, Google, alle Vercel-Blob-Speicher). | Klein | Nur noch eigener Bildspeicher und eigene Domain. Fremde Adressen liefern jetzt 400. |
| 6 | Objektseite lud alle Datenbankfelder inklusive privater Kalender-Adresse. | Klein | Kalender-Felder werden nicht mehr geladen. |
| 7 | Website-Suche ohne Längenbegrenzung. | Klein | Suchbegriff auf 80 Zeichen begrenzt. |
| 8 | Die technische `*.vercel.app`-Adresse konnte von Suchmaschinen erfasst werden. | Klein | `X-Robots-Tag: noindex` für diese Adresse. Admin und Admin-APIs zusätzlich `noindex` und `no-store`. |
| 9 | Bilder in Objektbeschreibungen konnten von fremden Servern geladen werden (Tracking). | Klein | Nur Bilder aus dem eigenen Bildspeicher. |
| 10 | Mitarbeiter-Passwörter über 72 Zeichen wurden still abgeschnitten. | Klein | Obergrenze 72 Zeichen in allen drei Passwort-Routen. |
| 11 | Favorit für nicht vorhandenes Objekt führte zu Serverfehler 500. | Klein | Antwort 404. |
| 12 | Login-Prüfung meldete jedem Besucher einen Fehler 401 in der Browser-Konsole. | Klein | Antwort 200 mit „nicht angemeldet“. |
| 13 | Der Vorschau-Build-Ordner `.next-preview` war im Git-Commit vom 14.11. enthalten. | Klein | Aus der Versionsverwaltung genommen, alle Next-Build-Ordner in `.gitignore`. Geprüft: keine Geheimnisse und keine Kundendaten darin. |

Bereits am 13.11.2026 behoben und seit dem 14.11. live: Login-Begrenzung, Kunden-Login nur für Kunden, Konto löschen nur mit Passwort, Open Redirect, Admin-Sitzung serverseitig begrenzt, Schutz gegen Doppelbuchungen, verschlüsselter Mailversand, Wetter- und Umkreis-Grenzen. Details in `docs/projekt-pruefung-2026-11-13.md`.

---

## 4. Nachweislich sicher (Code und lokaler Produktions-Build)

- Alle 39 geschützten Schnittstellen lehnen Anfragen ohne Login ab. Mitarbeiterverwaltung nur für Superadmins.
- Gefälschte Login-Cookies (ohne Signatur, falsche Signatur) werden abgewiesen. Der geheime Schlüssel hat 64 Zeichen.
- Der letzte Superadmin kann nicht gesperrt oder herabgestuft werden. Rechteänderungen machen alte Sitzungen ungültig.
- Öffentliche Schnittstellen geben keine Gästenamen, E-Mails, Passwörter oder Kalender-Adressen heraus.
- Kein XSS über Objekttexte oder über die Adresszeile. Skript-Code in der URL wird nicht ausgeführt.
- Kalender-Import gegen Angriffe auf interne Server (SSRF) abgesichert: private IP-Adressen gesperrt, Größen- und Zeitlimit.
- Anfrageformular weist fremde Herkunft, falsches Format und zu große Inhalte ab.
- Live: nur TLS 1.2 und 1.3, Zertifikat gültig bis 29.01.2027, http leitet auf https um.
- Keine Geheimnisse im Git-Verlauf. Quellcode-Dateien (Source Maps) nicht öffentlich.
- Unter der neuen Content-Security-Policy laden Startseite, Objektseite, Aktivitäten und Admin-Login ohne blockierte Inhalte.

### Nicht geprüft

- Karten (Mapbox, Google Maps) und Webcams unter der neuen Content-Security-Policy. Dafür müsste im Browser „Externe Medien“ akzeptiert werden. Die Freigaben folgen den Vorgaben der Anbieter. Bitte nach der Veröffentlichung einmal Karte, Webcam und Bild-Upload im Admin testen.
- Angemeldete Admin-Abläufe im Browser (Bild-Upload, Passwort ändern). Die Logik ist mit Tests und Abweisungs-Tests abgedeckt.

---

## 5. Alte Website `www.urlaub-gosch.de` (Drupal 7)

Eigene, alte Website auf einem anderen Server. Sie läuft noch unter der Hauptdomain.

**Kundendaten:** kein öffentliches Leck gefunden. Die gespeicherten Buchungsanfragen (Entityform) sind geschützt, der Belegungskalender zeigt keine Namen, Admin und Registrierung sind gesperrt.

**Probleme:**

1. **Drupal 7.101 ohne Sicherheitsupdates** (eingestellt seit 5. Januar 2025). Die Datenbank enthält alle bisherigen Buchungsanfragen.
2. `/CHANGELOG.txt` verrät die genaue Version.
3. jQuery 1.4.4 mit bekannten Schwachstellen.
4. `xmlrpc.php` ist aktiv.
5. Kein HSTS, kein Schutz gegen Einbettung, keine CSP.
6. Google Analytics (`UA-7485004-2`) und Google Fonts werden von Google-Servern geladen. Ob vor der Zustimmung, wurde nicht geprüft.

**Empfehlung:** Domain bald auf die neue Seite umstellen und die Drupal-Seite offline nehmen. Vorher die Anfragen sichern, die aufbewahrt werden müssen, den Rest gemäß Löschfristen löschen.

---

## 6. Vor der Veröffentlichung unter der Hauptdomain

| Schritt | Wer |
| --- | --- |
| Änderungen committen und veröffentlichen (enthält die Korrekturen aus Abschnitt 3) | Betreiber |
| In Vercel `NEXT_PUBLIC_SITE_URL` auf die Hauptadresse setzen, z. B. `https://www.urlaub-gosch.de` | Betreiber |
| Vercel: Deployment Protection einschalten, alte Deployments löschen | Betreiber |
| Vercel: Rate-Limit-Regel (WAF) für `/api/auth/*`, `/api/admin/login`, `/api/booking-request` | Betreiber |
| Vercel-Tarif prüfen (Hobby ist nur für nicht kommerzielle Projekte) | Betreiber |
| Domain zu IONOS, DNS-Einträge 1:1 übernehmen, Mail testen | Betreiber |
| Domain in Vercel eintragen, DNS auf Vercel zeigen lassen | Betreiber |
| iCal-Links bei den Portalen auf die Hauptdomain umstellen | Betreiber |
| Nach Veröffentlichung: Karte, Webcam, Bild-Upload, Admin-Login testen | Betreiber |
| Alle Mitarbeiter melden sich einmal neu an | Betreiber |
| Kontaktformular über Microsoft 365 (App-Registrierung) | Betreiber, Code-Teil offen |
| AV-Verträge mit Vercel und Neon bestätigen, Datenschutzerklärung rechtlich prüfen | Betreiber |

---

## 7. Prüfnachweise

- `npm test`: 56 von 56 bestanden (davon 6 Sicherheitstests in `tests/hardening.test.mjs`).
- `npm run lint`: keine Fehler, keine Warnungen.
- `next build`: erfolgreich.
- `npm audit --omit=dev`: 0 Schwachstellen.
- Lokaler Produktions-Build, von außen getestet: 39 geschützte Endpunkte, gefälschte Cookies, Datenfelder öffentlicher Antworten, XSS in der Adresszeile, Bildoptimierer mit fremden Adressen (400), Header je Host (`noindex` nur für `*.vercel.app`).
- Live `urlaub-gosch.vercel.app`: TLS, Header, 123 Kalender-Exporte, öffentliche und geschützte Schnittstellen (nur lesend).
- `www.urlaub-gosch.de`: Technik, typische Drupal-Pfade, Anfrage-Speicher, TLS, Header (nur lesend).

---

## 8. Nachtrag 17.11.2026: Hinweis von fewoFlow

fewoFlow hat beim Auslesen von `urlaub-gosch.vercel.app` für den Objekt-Import am **06.10.2026** dieselben Stellen gefunden, die in Abschnitt 2 beschrieben sind: `/api/properties` mit Buchungen samt `guestName` und den `icalUrl`-Feldern sowie `/api/ical/<objekt>` mit „Gast: <Name>“ und „Anfrage von <Name>“.

**Wichtig für die Datenschutz-Bewertung:** Laut fewoFlow standen dort am 06.10. bei fast allen Belegungen nur „(Admin)“ und zwei Testeinträge, auch die Anfragen waren erkennbar Tests. **Echte Gästenamen hat fewoFlow nicht gesehen und nicht gespeichert.** Ob zu einem anderen Zeitpunkt im betroffenen Zeitraum (26.11.2025 bis zur Korrektur) echte Namen eingetragen waren und abgerufen wurden, muss der Betreiber anhand der Datenbank (Eintragsdatum der Buchungen mit echten Namen) und der Vercel-Protokolle prüfen.

### Umsetzung der Empfehlungen von fewoFlow (lokal, noch nicht veröffentlicht)

| Empfehlung | Umsetzung |
| --- | --- |
| `/api/bookings` antwortet ohne Anmeldung | Die Adresse wird vom **öffentlichen Belegungskalender** auf jeder Objektseite gebraucht und bleibt deshalb ohne Login erreichbar. Sie liefert jetzt nur noch **Anreise und Abreise ab heute**: keine Buchungsnummern, keine Namen, keine vergangenen Belegungen. Geprüft: Der Kalender zeigt weiter alle belegten Tage. |
| Weitere Adressen unter `/api/` prüfen | Alle 19 öffentlichen Adressen ohne Login aufgerufen. Keine liefert Gästedaten, Buchungsnummern, Anfragen oder Kalender-Links. Übrig sind nur Objekt-, Ausstattungs- und Preis-IDs aus dem öffentlichen Katalog. |
| `/api/properties` | Enthält **keine Belegungen** mehr (bisher Anreise/Abreise aller Buchungen). Die Belegung gibt es nur noch über den Kalender und den iCal-Export. Objektdaten für den fewoFlow-Import bleiben verfügbar. |
| Anfragen im iCal-Export | **Entfernt.** Der Export enthält nur noch feste Belegungen. Eine unverbindliche Anfrage blockiert damit bei Portalen keine Tage mehr. |
| Interne Buchungsnummern im iCal-Export | **Entfernt.** Statt `booking-257@urlaub-gosch` steht eine nicht zählbare, gleichbleibende Kennung. Portale sehen beim nächsten Abgleich einmalig alle Einträge als neu. Das ist normal. |
| Vergangene Belegungen im iCal-Export | **Entfernt.** Nur noch Belegungen mit Abreise ab heute. |
| Rückblick in den Zugriffsprotokollen | Offen, nur durch den Betreiber in Vercel möglich (siehe Abschnitt 2). |

Prüfung: 62 von 62 Tests bestanden (neue Tests für Kalender-JSON und iCal-Export), Lint ohne Befund, Produktions-Build erfolgreich, alle öffentlichen Adressen lokal ohne Login abgefragt.

### Hinweis zum neuen Kontaktformular

Parallel wurde ein Kontaktformular mit dem Versanddienst **Resend** angelegt (`src/app/api/contact`, `src/lib/resend-mail.js`). Es ist technisch sauber abgesichert: Herkunftsprüfung, Größen- und Anzahlbegrenzung, Spam-Feld, keine Zeilenumbrüche in Kopfzeilen, Fehlermeldungen ohne Kundendaten in den Logs. Resend ist allerdings ein **zusätzlicher Auftragsverarbeiter** mit Sitz in den USA. Dafür braucht es einen AV-Vertrag und eine Angabe in der Datenschutzerklärung. Das weicht vom besprochenen Weg über Microsoft 365 ab. Die Entscheidung liegt beim Betreiber.
