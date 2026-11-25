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

---

## 9. Nachtrag 18.11.2026: Admin-Bereich, Datenschutz, Link-Übertragung

### Behoben (lokal, noch nicht veröffentlicht)

| Befund | Schwere | Korrektur |
| --- | --- | --- |
| **Fehlerprotokolle konnten Kundendaten enthalten.** 53 Stellen in 36 Schnittstellen schrieben das komplette Fehlerobjekt in das Vercel-Protokoll. Bei Datenbank-Fehlern enthält es die übermittelten Werte, etwa Name, E-Mail und Nachricht einer Anfrage. | Mittel (Datenschutz) | Neuer Logger `src/lib/safe-log.js`: protokolliert nur Fehlerart, Code und die erste Zeile, E-Mail-Adressen werden maskiert. Alle 53 Stellen umgestellt. Test belegt, dass Name, E-Mail und Telefon nicht im Protokoll landen. |
| **Kalender-Import speicherte den Ereignistext fremder Portale als „Gastname“.** Manche Portale schreiben dort echte Gästenamen hinein. | Mittel (Datenschutz) | Gespeichert wird nur noch „iCal-Import (Portal)“, z. B. „iCal-Import (airbnb.de)“. Bereits importierte Einträge bleiben, bis zum nächsten Abgleich, unverändert (keine Datenbankänderung). |
| **„iCal abonnieren“ auf jeder Objektseite** machte den Kalender-Export öffentlich bekannt. | Klein | Link entfernt. Der Export bleibt für die Portale erreichbar und wird nur noch im Admin-Bereich herausgegeben. |
| **Kein `robots.txt`.** | Klein | `robots.txt` sperrt Admin, Konto-Seiten und alle `/api`-Adressen für Suchmaschinen. Ohne Hauptdomain (nur Vercel-Adresse) wird die ganze Seite gesperrt. |

Prüfung: 64 von 64 Tests bestanden, Lint ohne Befund, Produktions-Build erfolgreich. Lokal ohne Login geprüft: Objektseite ohne iCal-Link, Export für Portale weiter erreichbar (ohne Namen, Anfragen, Nummern, alte Termine), Admin-Schnittstellen gesperrt.

### Link-Übertragung geprüft – kein Befund

- Alle Links auf fremde Seiten tragen `rel="noopener noreferrer"`. Zusätzlich gilt seitenweit `Referrer-Policy: strict-origin-when-cross-origin`. Fremde Seiten erfahren höchstens die Domain, nie die genaue Seite.
- Keine Adresse (URL) enthält Personendaten. In Links stehen nur Objektname, Reisedaten und Personenzahl.
- Benachrichtigungs-Mails enthalten keine Links.
- Externe Inhalte (Karten, Webcams) laden erst nach Zustimmung. Wetterdaten holt der eigene Server ab.
- Kalender-Links für Portale verwenden fest die Hauptdomain (seit 16.11.).

### Admin-Bereich – Stand

| Thema | Stand |
| --- | --- |
| Rechteprüfung | Alle Admin-Schnittstellen prüfen Anmeldung und Einzelrecht. Einzige Ausnahme ist der Login selbst. |
| Login | Begrenzung der Versuche, gleiche Antwortzeit bei unbekannten Konten, gesperrte Konten erst nach richtigem Passwort erkennbar. |
| Sitzung | Cookie `HttpOnly`, `Secure`, `SameSite=Lax`. Mitarbeiter-Sitzung endet nach der eingestellten Inaktivität, spätestens nach 12 Stunden. Logout macht das Token ungültig. |
| Passwörter | 10–72 Zeichen, bcrypt. Eigenes Passwort im Admin änderbar (mit altem Passwort). |
| Superadmin | Nur Superadmins verwalten Mitarbeiter. Der letzte Superadmin kann nicht gesperrt oder herabgestuft werden. |
| Kundendaten im Admin | Gästenamen sehen nur Mitarbeiter mit dem Recht „Belegung ansehen“. |

### Offen – Entscheidung beim Betreiber

1. ~~**Speicherdauer der Buchungsanfragen.**~~ **Erledigt am 18.11.2026, siehe unten.** Anfragen (Name, E-Mail, Telefon, Nachricht) werden gespeichert, aber **nie gelöscht**, und es gibt **keine Admin-Ansicht** dafür. Damit lassen sich weder Löschfristen (Art. 5 DSGVO) noch Löschwünsche von Gästen (Art. 17 DSGVO) im System umsetzen. Empfehlung: eine Admin-Seite „Anfragen“ mit Löschen-Knopf und eine automatische Löschung nach fester Frist (z. B. 12 Monate). Das ändert Daten in der Live-Datenbank und wird deshalb nur nach ausdrücklicher Freigabe umgesetzt.
2. **Zwei-Faktor-Anmeldung für Superadmins.** Sie fehlt. Ohne Änderung der Datenbank ist sie nicht sauber umsetzbar. Übergangsweise: lange, einzigartige Passwörter und die Vercel-WAF-Regel für `/api/admin/login`.
3. **Protokoll der Admin-Aktionen** (wer hat wann was geändert) fehlt. Für die Nachweispflicht nach DSGVO sinnvoll, braucht aber eine neue Tabelle.
4. **Bestehende importierte Einträge** können noch Portal-Texte enthalten. Sie werden beim nächsten Kalender-Abgleich bzw. auf Wunsch einmalig bereinigt (Datenbankänderung, nur nach Freigabe).

### Neu: Admin-Seite „Buchungsanfragen“ (18.11.2026, lokal, nicht veröffentlicht)

Die gespeicherten Anfragen aus dem Formular sind jetzt im Admin-Bereich unter **Admin-Übersicht → Buchungsanfragen** (`/admin/anfragen`) einsehbar und löschbar. Damit lassen sich Löschfristen und Löschwünsche von Gästen (Art. 17 DSGVO) umsetzen. An der Datenbank wurde dafür nichts geändert; gelöscht wird nur, wenn ein Mitarbeiter es auslöst.

| Funktion | Recht |
| --- | --- |
| Anfragen ansehen, filtern (offen / angenommen / abgelehnt), suchen (Name, E-Mail, Objekt) | „Belegung ansehen“ |
| Status setzen (angenommen, abgelehnt, wieder offen) | „Belegung bearbeiten“ |
| Einzelne oder ausgewählte Anfragen endgültig löschen | „Belegung bearbeiten“ |
| Alle Anfragen älter als 12 Monate auf einmal löschen (Hinweis erscheint automatisch) | „Belegung bearbeiten“ |

Sicherheit: Alle Aktionen prüfen Anmeldung und Recht auf dem Server. Wer nur ansehen darf, kann nichts ändern oder löschen (per Test belegt). Massenlöschung nur mit konkreter Auswahl (max. 200) oder nach Alter von mindestens 6 Monaten. Jede Löschung wird vorher bestätigt. Antworten werden nicht zwischengespeichert, Seite und Schnittstelle sind für Suchmaschinen gesperrt, Fehlerprotokolle enthalten keine Kundendaten.

Geprüft: 67 von 67 Tests, Lint, Produktions-Build. Lokal ohne Login: alle vier Schnittstellen-Aktionen 401, gefälschtes Cookie 401, Seite leitet zum Login. **Nicht geprüft:** die Seite angemeldet im Browser (keine Zugangsdaten). Bitte nach der Veröffentlichung einmal ansehen.

Offen bleibt eine **automatische** Löschung nach Frist (ohne Klick). Sie würde selbständig Daten in der Live-Datenbank löschen und wird nur nach ausdrücklicher Freigabe gebaut.

---

## 10. Nachtrag 18.11.2026: Kundenkonten entfernt (lokal, nicht veröffentlicht)

Urlaub-GOSCH bietet keine Kundenkonten an. Der Code dafür war aber noch vorhanden und öffentlich erreichbar: Über `/register` hätte jeder ein Konto anlegen und damit Daten in die Live-Datenbank schreiben können. In der Datenbank gab es **0 Kundenkonten und 0 gespeicherte Favoriten** (nur gezählt).

**Entfernt:** die Seiten `/login`, `/register`, `/account` und die Schnittstellen `/api/auth/login`, `/api/auth/register`, `/api/auth/me`, `/api/account/*`, `/api/favorites/*`, außerdem die nur dafür genutzten Hilfsfunktionen. Alle liefern jetzt 404.

**Geändert:**
- **Sitzungen nur für Mitarbeiter.** Selbst ein Konto mit Kundenrolle bekäme keine gültige Sitzung (per Test belegt).
- **Favoriten (Herz)** werden nur noch im Browser des Besuchers gespeichert. Es geht nichts an den Server (im Browser geprüft).
- **Datenschutzerklärung:** Der Abschnitt „Kundenkonto“ ist entfernt. Dort steht jetzt, dass Favoriten nur im Browser liegen und das Sitzungs-Cookie nur für Mitarbeiter gilt.
- **`robots.txt` und Header-Regeln** sind entsprechend bereinigt.

**Unverändert:** Mitarbeiter-Login, Logout, Admin-Bereich. Die Datenbank-Tabellen `User` und `Favorite` und die Rolle `USER` bleiben bestehen, weil keine Datenbankänderung erfolgen soll. Sie werden vom Code nicht mehr für Kunden genutzt.

Prüfung: 76 von 76 Tests, Lint, Produktions-Build. Lokal: alle entfernten Adressen 404, Logout, Favoriten-Seite und Admin-Login funktionieren.

## 11. Nachtrag 18.11.2026: iCal-Feed mit geheimem Schlüssel, minimierter Belegungskalender (lokal, nicht veröffentlicht)

Ziel: Auch reine Belegungsdaten (wann ist ein Objekt belegt) sollen nicht mehr frei abrufbar sein. Keine Datenbankänderung.

- **Neue Feed-Adresse mit Schlüssel:** `/api/ical/<objekt>/<schlüssel>`. Der Schlüssel (22 Zeichen, 128 Bit) wird pro Objekt aus einem Server-Geheimnis berechnet (HMAC-SHA256, `ICAL_FEED_SECRET`, ersatzweise `AUTH_SECRET`) und zeitkonstant geprüft. Falscher, fremder oder fehlender Schlüssel und unbekanntes Objekt ergeben immer dieselbe 404 – es ist nicht erkennbar, ob ein Objekt existiert.
- **Alte Adresse ohne Schlüssel (`/api/ical/<objekt>`) ist abgeschaltet** (404, ohne Datenbankabfrage). Nur für eine Übergangszeit kann sie über `ICAL_LEGACY_LINKS_UNTIL=JJJJ-MM-TT` (höchstens 60 Tage im Voraus) wieder eingeschaltet werden.
- **Schlüssel austauschen:** `ICAL_FEED_SECRET` in Vercel ändern → alle Feed-Links werden sofort ungültig; danach neue Links in die Portale eintragen.
- **Link nur serverseitig:** Die Export-URL erzeugt ausschließlich `/api/admin/ical/source/<id>` und liefert sie nur an Mitarbeiter mit dem Recht „iCal bearbeiten“. Domain: `NEXT_PUBLIC_SITE_URL` (nur HTTPS), sonst die aktuelle Adresse mit Warnhinweis bei *.vercel.app. Der Link „iCal exportieren“ in der Objektübersicht führt jetzt auf die Admin-Kalenderseite.
- **Öffentlicher Belegungskalender (`/api/bookings`) minimiert:** nur noch zusammengefasste „belegt“-Blöcke (aneinanderstoßende und überlappende Aufenthalte werden verschmolzen, Gästewechsel nicht erkennbar), ab heute und höchstens 540 Tage im Voraus. Keine IDs, keine Namen. Die Buchbarkeit auf der Objektseite bleibt gleich.

Hinweis: Der Schlüssel steht im Pfad der Adresse und kann daher in den Zugriffsprotokollen von Vercel und der Portale auftauchen. Er gewährt nur Lesezugriff auf belegte Zeiträume eines Objekts und lässt sich jederzeit austauschen.

Prüfung: 78 von 78 Tests, Lint, Produktions-Build. Lokal gegen die Live-Datenbank (nur lesend): Feed mit Schlüssel 200 (nur „Belegt“), ohne / falscher / fremder Schlüssel und unbekanntes Objekt 404; öffentlicher Kalender liefert nur `startDate`/`endDate`.

**Umstellung (zusammen mit dem Domain-Umzug):** `NEXT_PUBLIC_SITE_URL=https://urlaub-gosch.de` und `ICAL_FEED_SECRET` (zufällig, mind. 32 Zeichen) in Vercel setzen, veröffentlichen, dann je Objekt in Admin → iCal die neue URL kopieren und im Portal (fewoFlow u. a.) den alten Link ersetzen. Wenn Portale nicht sofort umgestellt werden können: vorübergehend `ICAL_LEGACY_LINKS_UNTIL` setzen und nach Abschluss wieder entfernen.

## 12. Nachtrag 21.11.2026: Anfragen per Mailjet-Mail, Datenschutz-Durchsicht (lokal, nicht veröffentlicht)

Auf Wunsch des Betreibers zurückgenommen: Kontaktanfragen im Admin-Dashboard, Benachrichtigungs-Glocke und Hinweis-Mail über Microsoft 365. Versanddienst ist jetzt **Mailjet** (EU-Anbieter, Paris) statt Resend (USA), um eine Übermittlung in die USA zu vermeiden.

- **Kontaktformular:** Inhalt geht per Mailjet an das Postfach; keine Speicherung in der Datenbank. Erfolg erst nach Annahme durch Mailjet; doppeltes Absenden erzeugt keine zweite Mail.
- **Buchungsanfrage:** wird gespeichert (Admin → Anfragen, nur Buchungsanfragen) und per Mailjet gemeldet; schlägt die Mail fehl, bleibt die Anfrage erhalten.
- **Datensparsamkeit im Versand:** Tracking aus, Betreff ohne Gastdaten, nur Text, Gast nur als Reply-To, keine Fehlertexte des Anbieters in Logs.
- Die Tabelle `ContactRequest` bleibt bestehen (keine Datenbankänderung), wird aber nicht mehr genutzt. Bereits gespeicherte Kontaktanfragen sollte der Betreiber einmalig löschen.

### Datenschutz-Durchsicht der ganzen Seite (21.11.2026)

Behoben:
- **Buchungsformular ohne Datenschutzhinweis** (Art. 13 DSGVO): Hinweis mit Zweck, Speicherung, Mailjet und Link zur Datenschutzerklärung ergänzt.
- **Kontaktformular:** Text der Checkbox sprach von „Zustimmung“, obwohl die Verarbeitung auf Art. 6 Abs. 1 lit. b/f beruht – jetzt „zur Kenntnis genommen“ mit Angabe, wohin die Daten gehen.
- **Datenschutzerklärung:** Mailjet (statt Resend) ergänzt; **Microsoft 365 als Postfach-Anbieter** fehlte und ist ergänzt; **Grundlage der US-Übermittlung bei Mapbox** fehlte und ist ergänzt.

Geprüft, ohne Befund: Google Maps, Mapbox und Webcams werden erst nach Einwilligung („Externe Medien“) geladen; keine Analyse-/Marketingdienste; keine Google Fonts; Wetter wird serverseitig ohne Besucher-IP abgerufen; Favoriten nur im Browser; Logs ohne Formularinhalte; Referrer werden nicht an Dritte weitergegeben.

Offen beim Betreiber:
- DPA mit Mailjet abschließen; Unterauftragnehmer prüfen; vollständige Anschrift von Mailjet in die Datenschutzerklärung übernehmen.
- Zertifizierung von Mapbox und Microsoft unter dem EU-US Data Privacy Framework prüfen (dataprivacyframework.gov).
- Buchungsanfragen werden nicht automatisch gelöscht: regelmäßig (z. B. alle 6–12 Monate) unter Admin → Anfragen erledigte Anfragen löschen. Mails mit Anfragen im Postfach ebenfalls nach Erledigung löschen.
- Verzeichnis der Verarbeitungstätigkeiten um Mailjet und Microsoft 365 ergänzen.
- Cookie-Banner: „Alle akzeptieren“ ist farbig hervorgehoben, „Nur notwendige“ nur umrandet. Rechtlich meist hingenommen, die Datenschutzbehörden empfehlen aber gleichwertige Gestaltung.
- Alte Website www.urlaub-gosch.de (Drupal) nutzt Google Analytics ohne erkennbare Einwilligung – mit dem Domain-Umzug abschalten.

### Nachtrag 21.11.2026: offene Punkte selbst erledigt bzw. geprüft

- **Cookie-Banner:** „Nur notwendige“ ist jetzt genauso gestaltet wie „Alle akzeptieren“ (beide Ansichten).
- **Online geprüft:** Mailjet SAS, 43 rue de Dunkerque, 75010 Paris (Sinch-Gruppe); Rechenzentren Google Cloud in Deutschland/Belgien; US-Unterauftragnehmer für Support und Abrechnung – Datenschutzerklärung entsprechend präzisiert. Mapbox und Microsoft sind laut eigener Erklärung unter dem EU-US Data Privacy Framework zertifiziert – Datenschutzerklärung angepasst. (Nicht auf der offiziellen Liste dataprivacyframework.gov gegengeprüft.)
- **Datenbank (nur gezählt, nichts geändert):** 0 Kontaktanfragen, 0 Buchungsanfragen gespeichert – es muss nichts gelöscht werden.
- **DNS (nur gelesen):** SPF `v=spf1 include:spf.protection.outlook.com include:planet-ocean.email -all`, DMARC `p=none`. Für Mailjet muss der SPF-Eintrag ergänzt werden (siehe docs/mailjet-setup.md).
- **Alte Website www.urlaub-gosch.de (geprüft):** lädt Google Analytics (`googletagmanager.com`, UA-7485004-2) und Google Fonts direkt beim Seitenaufruf, also vor einer Einwilligung – **Datenschutzverstoß** (Übermittlung der IP-Adresse an Google ohne Einwilligung). Nicht in diesem Code behebbar; Betreiber/Hoster sollte das Google-Analytics-Modul sofort abschalten (Universal Analytics sammelt seit 2024 ohnehin keine Daten mehr) oder die alte Seite mit dem Domain-Umzug ablösen.
- **Impressum:** Angabe „Verantwortlich nach § 18 Abs. 2 MStV“ ergänzt (wegen Blog/redaktioneller Inhalte; eingetragen: Birgit Gosch – bitte bestätigen). Hinweis auf „Analyse-Tools“ korrigiert, da keine eingesetzt werden.

### Nachtrag 24.11.2026: Anfrageformular der Objektseiten

- **Fehler behoben:** Das Formular verlangte Anfrageart, Anschrift, Mobilnummer, Personenzahl und Haustiere als Pflichtfelder, der Server verwarf diese Angaben jedoch (weder gespeichert noch gemailt). Jetzt sind alle Pflichtfelder auch serverseitig Pflicht (Format- und Längenprüfung, keine Zeilenumbrüche), werden gespeichert (im vorhandenen Nachrichtenfeld, keine Schemaänderung), per Mailjet gemeldet und unter Admin → Anfragen angezeigt. Betreff ohne Gastdaten.
- **Datenschutzerklärung** nennt alle abgefragten Angaben und den Zweck.
- **Geprüft:** 79/79 Tests; lokal 7 von 7 unvollständigen Anfragen abgelehnt; eine vollständige Test-Anfrage wurde mit echtem Mailjet-Versand, aber ohne Datenbank (Platzhalter statt Neon) verarbeitet – Mail von Mailjet angenommen, nichts gespeichert.
- **Verzeichnis der Verarbeitungstätigkeiten** als Entwurf: `docs/verarbeitungsverzeichnis.md` (vom Betreiber zu prüfen und zu ergänzen).
