# Projektprüfung – 13. November 2026

Ich habe nur gelesen und geprüft. Am Code habe ich nichts geändert, nichts gepusht und nichts veröffentlicht. Geprüft wurde der lokale Stand mit allen Änderungen, die noch nicht committet sind.

## Automatische Prüfungen

| Prüfung | Ergebnis |
| --- | --- |
| `npm audit --omit=dev` | 0 Schwachstellen. Das Update auf Next 15.5.28 und Nodemailer 10.3.1 hat die Meldungen vom 29.10. behoben. |
| `npm test` | 50 von 50 Tests bestanden |
| `npm run lint` | 0 Fehler, 1 Warnung (`<img>` in `HeaderWebcams.jsx:330`) |
| `next build` | Erfolgreich. 123 Objektseiten, 24 Blogseiten und 111 Aktivitätsseiten werden vorab erzeugt. Größte Seiten beim ersten Laden: `/` mit 170 kB, `/admin/properties` mit 164 kB. **Dabei 111 Fehlermeldungen, siehe Funktionsfehler unten.** |

## Funktionsfehler (aus dem Build)

**„Unterkünfte in der Nähe“ sind auf allen Aktivitätsseiten leer.** `aktivitaeten/[slug]/page.jsx:77-130` ruft `headers()` auf, um die eigene API per HTTP abzufragen. Die Seite wird aber statisch bzw. per ISR (`revalidate = 900`) erzeugt. `headers()` wirft dabei „Dynamic server usage“, der Fehler wird abgefangen, und die Liste bleibt **auf allen 111 Seiten leer**, auch bei jeder späteren Aktualisierung. Außerdem würde der Server bei dynamischer Darstellung ein Ziel abfragen, das aus dem `Host`-Header stammt. Darüber ließe sich der Cache mit fremden Inhalten vergiften.
*Lösung:* Die Abfrage-Logik von `/api/properties/nearby` in eine Funktion in `src/lib/` auslagern und in der Seite direkt mit Prisma aufrufen, ohne HTTP-Umweg und ohne `headers()`.

## Sicherheitslücken

### Hoch

1. **Ein Superadmin oder Mitarbeiter kann sich über die Kunden-API selbst löschen.** `POST /api/account/delete` prüft keine Rolle. Statt eines Passworts reicht außerdem der Text `"DELETE ME"`. Die Schutzregel „mindestens ein Superadmin bleibt übrig“ (`superAdminCount` in `admin/mitarbeiter/[id]`) wird so umgangen. Wer ein gestohlenes Cookie hat, kann damit ein Konto endgültig löschen.
   *Lösung:* Immer das Passwort verlangen. Für die Rollen EDITOR, ADMIN und SUPERADMIN mit 403 ablehnen.

2. **Kein Schutz gegen Brute Force bei Login und Registrierung.** `/api/auth/login`, `/api/admin/login` und `/api/auth/register` haben keine Begrenzung der Versuche. Das war schon am 29.10. offen und ist es weiterhin. Der Admin-Login ist das wichtigste Ziel.
   *Lösung:* Vercel-WAF-Rate-Limit-Regel für `/api/*/login` und `/api/auth/register`. Zusätzlich eine Sperre nach X Fehlversuchen pro Konto in der Datenbank (Felder `failedLogins` und `lockedUntil`).

3. **Mitarbeiter können sich über den Kunden-Login anmelden.** `/api/auth/login` nimmt jedes aktive Konto an, auch EDITOR, ADMIN und SUPERADMIN, und vergleicht die E-Mail ohne Kleinschreibung. Das ist an sich keine Umgehung, denn die Admin-Rechte werden trotzdem geprüft. Es ist aber ein zweiter Login-Weg ohne die Logik des Admin-Logins (`lastLoginAt`, künftige Sperren oder MFA).
   *Lösung:* Im Kunden-Login nur `role === "USER"` zulassen.

### Mittel

4. **Open Redirect nach Login und Registrierung.** `app/login/page.jsx:13` und `app/register/page.jsx:14` rufen `router.replace(sp.get("next"))` ohne Prüfung auf. Ein Link wie `/login?next=//boese-seite.de` leitet nach dem Login auf eine fremde Seite weiter (Phishing).
   *Lösung:* Nur Pfade zulassen, die mit `/` beginnen und nicht mit `//` oder `/\`.

5. **Der Session-Timeout im Admin-Bereich gilt nur im Browser.** `AdminIdleTimeout.jsx` meldet nach 15 bis 120 Minuten ab. Das JWT bleibt aber **7 Tage** gültig (`auth.js`, `MAX_AGE`). Ein kopiertes Cookie funktioniert also eine Woche lang. Auch der Logout erhöht `sessionVersion` nicht. Ein abgegriffenes Token bleibt nach dem Abmelden gültig.
   *Lösung:* Für Mitarbeiter eine kurze JWT-Laufzeit mit gleitender Verlängerung. Alternativ serverseitig `lastActivity` prüfen. Beim Logout `sessionVersion` erhöhen.

6. **Profiländerung ohne Passwort und ohne Prüfung.** `PUT /api/account/profile` ändert die E-Mail ohne Passwortbestätigung, ohne Formatprüfung und ohne Kleinschreibung. Mit einem gestohlenen Cookie lässt sich ein Konto dauerhaft übernehmen. Großbuchstaben in der E-Mail sperren einen Mitarbeiter außerdem aus dem Admin-Login aus, weil der die E-Mail kleinschreibt.
   *Lösung:* Passwort verlangen, E-Mail normalisieren und prüfen. Für Mitarbeiterkonten sperren (das regelt die Mitarbeiterverwaltung).

7. **Registrierung ohne Regeln.** Es gibt keine Mindestlänge für Passwörter (beim Ändern sind es 8, bei Mitarbeitern 10), keine E-Mail-Prüfung und keine Kleinschreibung (`A@x.de` und `a@x.de` werden zwei Konten). Die Antwort 409 „Email bereits registriert“ verrät außerdem, welche E-Mails existieren. Die Registrierung ist offen für alle.
   *Lösung:* Regeln wie beim Passwortwechsel. Oder Kundenkonten ganz abschalten, falls sie nicht gebraucht werden (siehe Anmerkungen).

8. **Doppelbuchungen bei gleichzeitigen Zugriffen.** `admin/booking` und `bookings` prüfen Überschneidungen mit `findFirst` und legen danach mit `create` an, ohne Transaktion oder Datenbank-Constraint. Zwei gleichzeitige Anfragen können sich überschneidende Buchungen erzeugen (TOCTOU).
   *Lösung:* Ein PostgreSQL-`EXCLUDE USING gist (property_id WITH =, daterange(start_date,end_date) WITH &&)` als Constraint. Alternativ `prisma.$transaction` mit `SERIALIZABLE`.

9. **Superadmin-Routen ignorieren `mustChangePassword`.** `getSuperAdmin()` prüft das Flag nicht, anders als `requireAdminPermission`. Ein Superadmin mit Pflicht-Passwortwechsel kann über die API trotzdem Mitarbeiter verwalten.

### Niedrig

10. **Buchungsanfrage (`/api/booking-request`)**
    - SMTP mit `secure:false` ohne `requireTLS: true`: Ein Angreifer im Netz kann STARTTLS unterdrücken. Damit gehen Zugangsdaten und Gastdaten im Klartext raus.
    - Schlägt der Mailversand fehl, ist die Anfrage schon gespeichert, der Gast sieht aber 500. Er schickt sie nochmal, und es entstehen Duplikate.
    - Die Anreise darf in der Vergangenheit liegen. Offene Anfragen (PENDING) werden bei der Überschneidungsprüfung nicht berücksichtigt.
    - Das IP-Limit nimmt den ersten Eintrag aus `x-forwarded-for`, und den kann der Absender fälschen. Auf Vercel besser nur `x-real-ip` bzw. `request.ip` verwenden. Das Limit gilt außerdem nur pro Instanz.
11. **Admin-Login verrät gesperrte Konten.** Gesperrte Konten bekommen 403 „Konto ist gesperrt“, unbekannte E-Mails sofort 401 ohne bcrypt. Über Antwort und Antwortzeit lässt sich herausfinden, welche Mitarbeiter-E-Mails existieren.
12. **Öffentlicher iCal-Export (`/api/ical/[slug]`)** zeigt auch offene Anfragen als „vorläufig“. Jeder sieht also, wann Anfragen eingehen. Wenn das nicht gewollt ist, nur feste Buchungen exportieren oder die Adresse mit einem geheimen Token schützen.
13. **`/api/properties/nearby`**: `radius` hat keine Obergrenze. Bei `lat=±90` ergibt `cos` = 0, `lngDelta` wird Infinity und die Anfrage endet mit 500. Den Radius auf maximal 100 km begrenzen und `lat` auf ±90 prüfen.
14. **`/api/weather`** ist ein offener Proxy für beliebige Koordinaten. Jede Koordinate erzeugt einen eigenen Cache-Eintrag. Koordinaten auf die Region begrenzen oder auf 2 Nachkommastellen runden.
15. **Bild-Optimierung**: `remotePatterns` erlaubt `lh3.googleusercontent.com` und `images.unsplash.com`. Damit kann jeder fremde Bilder über das Kontingent für Bildoptimierung laufen lassen (Kosten). Entfernen, falls nicht genutzt.
16. **CSP** begrenzt nur Einbettung, Plugins, Basis-URL und Formularziele. `script-src` oder Nonces fehlen, ein echter XSS-Schutz ist das also noch nicht. Positiv: Alle JSON-LD-Blöcke mit Datenbankdaten sind mit `<` escaped. Nur `blog/[slug]` und `blog/page.jsx` nicht, die aber aus statischem JSON gespeist werden. Trotzdem `safeJsonLd` einheitlich verwenden.
17. **HSTS** ohne `includeSubDomains`. Das ist so gewollt, aber vor dem Domainumzug noch einmal prüfen.

### Positiv bestätigt

- Alle `/api/admin/*`-Routen prüfen serverseitig die Rechte (`requireAdminPermission` oder `getSuperAdmin`). Die Middleware (Basic Auth, ohnehin auskommentiert) wurde zu Recht gelöscht.
- Passwort-Hashes mit bcrypt (Kosten 12). `sessionVersion` widerruft Sessions bei Passwortwechsel und Sperre.
- Cookies sind `HttpOnly` und `SameSite=Lax` und in Produktion `Secure`. Damit ist CSRF bei JSON-POSTs weitgehend abgedeckt.
- Der SSRF-Schutz beim iCal-Import ist gut umgesetzt und getestet.
- Öffentliche Abfragen geben keine Gästenamen und keine iCal-Quell-URLs heraus.
- Für den Blob-Upload gibt es eine Rechteprüfung, eine Pfadbindung und kein Überschreiben.
- `.env` steht in `.gitignore`. In der Git-Historie wurden keine Secrets gefunden (Stichprobe nach typischen Mustern).
- Externe Medien (Google Maps, Mapbox, Webcams) laden erst nach Einwilligung.

## Optimierungen (Performance)

1. **Hero-Bilder in `public/hero/`**: `hero-11.jpg` hat **8,2 MB**, andere 2,3 bis 2,6 MB. `next/image` optimiert sie zwar, aber der erste Abruf und der Build werden langsam, und das Repository wird groß. Die Bilder vorher auf etwa 2560 px Breite und WebP/AVIF mit unter 500 KB verkleinern.
2. **Sehr große Dateien**: `admin/properties/page.jsx` (2585 Zeilen), `MitarbeiterEditModal.jsx` (2174), `admin/images/page.jsx` (2053), `app/page.js` (1967), `properties/[slug]/page.jsx` (1922), `Header.jsx` (1488), `CookieConsent.jsx` (1161). Das ist schwer zu warten. Wenn das gesamte Client-Bundle mit `"use client"` gebaut wird, wird es außerdem unnötig groß. Die Dateien in Teilkomponenten aufteilen und nur die interaktiven Teile als Client-Komponenten bauen.
3. **`/api/properties` (GET)** liefert alle Objekte mit allen Buchungen, ohne Paginierung oder Cache. Wenn das nicht mehr gebraucht wird, entfernen. Sonst `revalidate` setzen.
4. **`site-search`** baut bei jeder Anfrage den Index neu auf (`force-dynamic`). Statische Teile (Aktivitäten, Artikel) einmal pro Modul vorberechnen und Objekte mit `unstable_cache` cachen.
5. **Prisma auf Vercel**: Für Neon die gepoolte Verbindung (`-pooler`-Host) als `DATABASE_URL` nutzen und `DIRECT_DATABASE_URL` nur für Migrationen. Bitte auf Vercel prüfen. Lokal ist das nicht nachweisbar.
6. **Datenbank-Indizes**: Für Abfragen nach Überschneidungen prüfen, ob `Booking(propertyId, startDate, endDate)`, `PricePeriod(propertyId, startDate, endDate)` und `BookingRequest(guestEmail, createdAt)` indiziert sind.

## Anpassungen (Aufräumen)

- **Arbeitsdateien entfernen bzw. ignorieren**: `cleanup-build.log`, `cleanup-lint.log` und `cleanup-tests.log` nicht committen. Am besten `*.log` in `.gitignore` aufnehmen. `prisma/migrations_backup_20260815_010514/` gehört nicht ins Repository.
- **`.env`-Kommentare** sind veraltet (Prisma-Postgres-Hinweis, „Gmail“). Eine `.env.example` ohne Werte anlegen, damit klar ist, welche Variablen nötig sind (`NEXT_PUBLIC_SITE_URL` fehlt in `.env`, wird aber benutzt).
- **Mapbox-Token** (`NEXT_PUBLIC_*`) ist absichtlich öffentlich. Im Mapbox-Konto auf die eigenen Domains beschränken (URL-Restriction).
- **Altlasten**: `public/file.svg`, `globe.svg`, `next.svg` und `vercel.svg` (Next-Vorlage) sowie `src/urlaub-gosch-ausflugsziele-ohne-feriendomizil.json` (prüfen, ob noch benutzt).
- **Uneinheitlicher Code-Stil**: Teile sind extrem vertikal formatiert (ein Token pro Zeile), andere kompakt. Prettier einführen und einmal formatieren, dann lassen sich Diffs wieder gut lesen.
- **Überschneidungslogik doppelt**: `bookings` und `admin/booking` machen dasselbe. Auf eine Implementierung zusammenführen.
- **Metadaten im Layout**: `title: "Urlaub-GOSCH"` ohne `template` und ohne `metadataBase`. `metadata = { metadataBase: new URL(SITE_URL), title: { default, template: "%s | Urlaub-GOSCH" } }` setzen.

## Erweiterungen (Vorschläge)

1. **`sitemap.js` und `robots.js`** im App-Router fehlen ganz. Für Ferienobjekte, Aktivitäten und Blog ist das ein spürbarer SEO-Gewinn.
2. **`not-found.jsx` und `error.jsx`** (global und für `properties/[slug]`) für eigene Fehlerseiten auf Deutsch.
3. **Automatischer iCal-Sync**: Derzeit gibt es nur einen manuellen Sync im Admin-Bereich. Ein Vercel-Cron (`vercel.json` → `/api/cron/ical-sync` mit `CRON_SECRET`) verhindert Doppelbuchungen mit Portalen.
4. **Eingangsbestätigung für Gäste** bei der Buchungsanfrage, mit `replyTo` auf die Gast-E-Mail in der Admin-Mail.
5. **Admin: Anfragen-Übersicht** mit Status PENDING, ACCEPTED oder DECLINED und einer Ein-Klick-Umwandlung in eine Buchung.
6. **Audit-Log** für Admin-Aktionen (wer hat wann Preis, Buchung oder Rechte geändert).
7. **MFA (TOTP) für Superadmins.**
8. **Zentrale Fehlerüberwachung** (z. B. Sentry), damit `console.error` in Produktion nicht unbemerkt bleibt.
9. **Löschfristen automatisieren**: Ein Cron, der alte `BookingRequest`-Datensätze nach der festgelegten Frist löscht (passt zur offenen Datenschutz-Checkliste).

## Anmerkungen

- **Kundenkonten**: `AuthButton` und `useAuth` wurden gelöscht, im Header gibt es keinen Login-Link mehr. Die Seiten `/login`, `/register` und `/account` sowie die zugehörigen APIs existieren aber noch und sind öffentlich erreichbar. Wenn Favoriten auch ohne Konto funktionieren sollen, wären Login und Registrierung reine Angriffsfläche. Am besten entscheiden: entweder ganz entfernen oder richtig absichern (Punkte 2, 3, 4, 6 und 7).
- Die offenen Punkte aus `docs/production-check-2026-11-04.md` gelten weiter: Die Live-Seite hat die Sicherheits-Header noch nicht, die Datenbankrolle hat zu viele Rechte, und AV-Verträge, Löschfristen und die DNS- und Mail-Umstellung stehen noch aus.
- Es gibt **sehr viele nicht committete Änderungen** (40+ Dateien inklusive Löschungen). Vor weiteren Arbeiten in sinnvollen Commits sichern. Der letzte Commit heißt „123“.

## Empfohlene Reihenfolge

1. Den Funktionsfehler „Unterkünfte in der Nähe“ sowie die Punkte 1 (Konto löschen), 4 (Open Redirect) und 9 (mustChangePassword): jeweils wenige Zeilen
2. Rate-Limit per Vercel WAF für die Login-Routen (Punkt 2) und der Kunden-Login nur für USER (Punkt 3)
3. Entscheiden, ob Kundenkonten bleiben (Anmerkung oben)
4. Session-Laufzeit für Admins (Punkt 5) und Datenbank-Constraint gegen Doppelbuchungen (Punkt 8)
5. Hero-Bilder verkleinern, Sitemap und robots, Fehlerseiten
6. Änderungen committen und veröffentlichen, damit die Live-Seite die Sicherheits-Header bekommt

---

## Umsetzung am 13.11.2026 (lokal, nicht committet, nicht gepusht, keine Datenbankänderung)

| Befund | Umsetzung |
| --- | --- |
| „Unterkünfte in der Nähe“ leer | Direkte Abfrage über `src/lib/nearby-properties.js` statt HTTP-Umweg mit `headers()`. Der Build zeigt jetzt 41 Treffer statt 0. |
| 1 Konto löschen | `/api/account/*` nur noch für Kunden (Rolle USER). Löschen nur noch mit Passwort, in einer Transaktion. |
| 2 Brute Force | `src/lib/rate-limit.js`: pro Instanz max. 30 Login-Versuche je IP und 8 Fehlversuche je Konto in 15 Minuten. Registrierung max. 5 pro IP und Stunde. **Eine Vercel-WAF-Regel bleibt empfohlen**, denn das Limit gilt nur pro Instanz. |
| 3 Kunden-Login | Nur noch Rolle USER. E-Mail wird kleingeschrieben verglichen, bcrypt läuft immer (kein Timing-Leck). |
| 4 Open Redirect | `src/lib/safe-redirect.js` in Login und Registrierung. |
| 5 Admin-Session | Das Mitarbeiter-Token läuft nach der eingestellten Inaktivitätszeit ab, höchstens nach 12 Stunden. Verlängert wird es über `/api/admin/session` (Aufruf aus `AdminIdleTimeout`). Logout erhöht `sessionVersion`. **Folge: Nach dem Deployment müssen sich alle Mitarbeiter einmal neu anmelden. Logout meldet alle Geräte des Kontos ab.** |
| 6 Profil | Eine E-Mail-Änderung braucht das Passwort. Die E-Mail wird geprüft und kleingeschrieben, andere Geräte werden abgemeldet. |
| 7 Registrierung | E-Mail-Prüfung, Passwort 10 bis 72 Zeichen, Kleinschreibung, eine Prüfung auf Groß- und Kleinschreibung bei Duplikaten. |
| 8 Doppelbuchungen | `src/lib/booking-lock.js`: PostgreSQL-Advisory-Lock pro Objekt in einer Transaktion, **ohne Schemaänderung**. Gilt für `POST /api/bookings`, `POST /api/admin/booking` und `PUT /api/admin/booking/[id]` (dort fehlte die Überschneidungsprüfung bisher ganz). |
| 9 mustChangePassword | `getSuperAdmin()` beachtet das Flag. |
| 10 Buchungsanfrage | STARTTLS ist Pflicht (`requireTLS`), Anreise in der Vergangenheit wird abgelehnt. Schlägt die Mail fehl, bekommt der Gast trotzdem ein OK (keine Duplikate). `replyTo` zeigt auf den Gast, optional gibt es `SMTP_FROM`. Das IP-Limit nutzt `x-real-ip` bzw. den letzten Eintrag in `x-forwarded-for`. |
| 11 Admin-Login | bcrypt läuft immer, die Sperre wird erst nach richtigem Passwort genannt, plus Rate-Limit. |
| 13 / 14 Nearby / Wetter | Radius höchstens 100 km, Breitengrad geprüft. Wetter nur für Norddeutschland, Koordinaten gerundet. |
| 16 JSON-LD | Blog verwendet `safeJsonLd`. |
| Lint | `<img>` der Webcam begründet freigegeben, Lint ohne Warnung. |
| Datenschutz & Cookies | Verantwortlicher und Stand, eine vollständige Liste der gespeicherten Cookies und localStorage-Einträge mit TDDDG/DSGVO-Grundlage, Vercel (Hosting, Region Frankfurt), Neon, **IONOS als Domain/DNS**, Server-Logfiles, Buchungsanfrage, Kundenkonto, Drittanbieter mit Anbieterangaben, Open-Meteo. Der Cookie-Banner nennt die Anbieter, „Statistik“ wurde entfernt, und „Alle akzeptieren“ speichert keine Statistik-Einwilligung mehr. |
| Vercel-Region | `vercel.json` mit `regions: ["fra1"]` (Funktionen in Frankfurt, nahe der Neon-Datenbank in eu-central-1). |
| Aufräumen | `*.log` steht in `.gitignore`. `distDir` lässt sich über `NEXT_DIST_DIR` setzen (für Prüf-Builds neben `next dev`). |

**Prüfung:** 54 von 54 Tests bestanden (davon 4 neue in `tests/hardening.test.mjs`), Lint ohne Fehler und Warnungen, `next build` erfolgreich (306 Seiten).

### Bewusst nicht geändert bzw. vom Betreiber zu erledigen

- **Vercel-WAF-Rate-Limit** für `/api/auth/*`, `/api/admin/login` und `/api/booking-request` im Vercel-Dashboard anlegen.
- **AV-Verträge mit Vercel und Neon** tatsächlich abschließen bzw. bestätigen. In der Datenschutzerklärung steht jetzt, dass sie bestehen.
- **E-Mail-Anbieter (SMTP)** in der Datenschutzerklärung namentlich ergänzen, sobald feststeht, über wen der Versand läuft (IONOS, Microsoft 365 o. Ä.).
- **Bei IONOS**: DNS der Domain auf Vercel zeigen lassen (A-/CNAME-Einträge laut Vercel-Domain-Einstellungen). MX- und SPF-Einträge für die Mail dabei nicht verändern.
- **iCal-Import und -Sync** legen Buchungen weiterhin ohne Sperre an (nur durch Admins ausgelöst, geringes Risiko).
- **Öffentlicher iCal-Export** zeigt weiter offene Anfragen als „vorläufig“, weil das für den Abgleich mit Portalen gewollt sein dürfte.
- **Hero-Bilder verkleinern**, Sitemap/robots und Fehlerseiten sind Erweiterungen und noch offen.
- Die Datenschutzerklärung ist technisch korrekt überarbeitet, **ersetzt aber keine rechtliche Prüfung**.
