# Sicherheitsprüfung und automatische Ab-Preise

Stand: 29.10.2026. Untersucht wurde der lokale Quellstand. Ergänzend wurden drei nicht authentifizierte POST-Anfragen an den lokalen Entwicklungsserver geschickt. Keine Angriffstests gegen die veröffentlichte Website, keine echten Testbuchungen, keine Uploads, keine versandten Nachrichten, keine Lasttests. Diese Prüfung ist keine Garantie auf vollständige Sicherheit.

## Preisangabe – lokal korrigiert

Die Detailseite berechnete bereits ein Minimum; 60 € waren kein fest eingetragener Text. Die Berechnung berücksichtigt jetzt nur gültige, positive Nachtpreise aus laufenden oder zukünftigen Preiszeiträumen. Vergangene, umgekehrte, leere und ungültige Preiszeiträume werden nicht beworben. Maßgeblich ist der Kalendertag in Europe/Berlin. Ohne passenden Preis wird keine Zahl erfunden.

Hero, Verfügbarkeitsbereich und strukturierte Preisdaten verwenden denselben Wert. Änderungen, Neuanlage und Löschung von Preiszeiten invalidieren die betroffenen Seiten im Next.js-Cache. Der Ab-Preis ist der niedrigste reguläre Saisonpreis, kein Versprechen für beliebige Reisedaten. Last-Minute, Kuschelwochen und Nebenkosten berechnet weiterhin der konkrete Preisrechner.

## Bestätigte Befunde und lokale Korrekturen

| Priorität | Befund | Änderung und Prüfung |
| --- | --- | --- |
| Hoch | `POST /api/bookings` enthielt keine Anmeldung oder Berechtigungsprüfung; ein Aufrufer konnte Belegungen erzeugen. | Prüfung `AVAILABILITY_EDIT` vor Body-Auswertung und Datenbankzugriff. Lokale HTTP-Anfrage ohne Cookie: 401. Test bestätigt, dass die Datenbank nicht erreicht wird. |
| Hoch | `/api/admin/upload` konnte vor der Erzeugung eines Upload-Tokens ohne Rechteprüfung aufgerufen werden. | `IMAGES_EDIT` wird im Token-Callback geprüft. Objekt muss existieren; Pfad muss zum Objekt gehören. Überschreiben ist deaktiviert. Signierte Vercel-Fertigstellungs-Callbacks bleiben über den SDK-Mechanismus möglich. Lokale HTTP-Anfrage ohne Cookie: 401. |
| Hoch | Öffentliche Belegungs-JSONs und iCal-Exporte enthielten Gästenamen. `/api/properties` und `/api/search` selektierten außerdem sämtliche Property-Felder, darunter private iCal-Quelladressen. | Öffentliche Feldlisten begrenzt; Gästenamen aus Kalenderausgaben entfernt. Quelladressen werden nicht öffentlich selektiert. Tests verwenden ausschließlich synthetische Gastdaten. |
| Hoch | Der iCal-Import akzeptierte beliebige HTTP-/HTTPS-Ziele ohne Prüfung interner IP-Adressen. Voraussetzung: ein Konto mit iCal-Bearbeitungsrecht. | Private und reservierte IPs blockiert; DNS-Ergebnis für die tatsächliche Verbindung festgehalten; jede Weiterleitung erneut geprüft; maximal drei Weiterleitungen, Zeitlimits und 2-MB-Grenze. Tests für Loopback, IPv4, IPv6, Metadaten-Adresse und alternative IP-Schreibweisen. |
| Hoch | Konto- und Favoritenrouten prüften nur die JWT-Signatur, nicht Kontosperren oder die aktuelle Sitzungsnummer. Ein widerrufenes Token konnte dadurch weiter genutzt werden. | Gemeinsame Prüfung des aktiven Kontos und der Sitzungsnummer. Passwortänderung widerruft ältere Tokens und stellt für die aktuelle Sitzung ein neues aus. Test bestätigt die Abweisung einer alten Sitzungsnummer. |
| Mittel | Erzwungener Passwortwechsel wurde im Adminlayout geprüft, aber nicht zentral für Admin-API-Rechte. | Admin-API-Rechteprüfung weist entsprechende Konten zurück, bis das Passwort geändert wurde. |
| Mittel | Die alte öffentliche Objekterstellung besaß keine Rechteprüfung. Wegen des fehlenden Pflichtfeldes `slug` war ein erfolgreicher Datenbankeintrag mit diesem Code nicht nachgewiesen. | Alte POST-Adresse verwendet die geschützte Admin-Implementierung. Lokale HTTP-Anfrage ohne Anmeldung: 401. |
| Mittel | Öffentliche Such- und Umgebungsschnittstellen gaben rohe Datenbankfehlermeldungen zurück. | Interne Fehlerdetails aus den öffentlichen Antworten entfernt. |

## Noch offen

1. **Abhängigkeiten aktualisieren.** `npm audit --omit=dev` meldete 23 betroffene Pakete bzw. Abhängigkeitsknoten: 1 kritisch, 17 hoch, 5 mittel. Das sind Paketmeldungen, nicht 23 auf dieser Website nachgewiesene Angriffe. Next.js 15.5.9 ist als kritisch aufgeführt; der Check empfiehlt 15.5.28 als Update innerhalb derselben Versionslinie. Die Installation wurde angefragt, aber nicht freigegeben und nicht durchgeführt. Weitere Meldungen betreffen u. a. Nodemailer, node-ical und transitive Abhängigkeiten. Größere Versionswechsel benötigen gesonderte Kompatibilitätsprüfungen. Es wurde kein `npm audit fix --force` ausgeführt.
2. **Verteilte Anfragebegrenzung.** In den untersuchten Login-, Registrierungs- und Buchungsanfragerouten ist keine belastbare verteilte Begrenzung vorhanden. Vercel/WAF-Regeln wurden nicht eingesehen. Brute Force, Registrierungs- und Anfrage-Spam bleiben ein Risiko, sofern kein vorgeschalteter Schutz besteht. Eine bloße In-Memory-Begrenzung wäre für mehrere Serverless-Instanzen unzureichend.
3. **Erweiterte Validierung und Konkurrenztests.** Zusätzliche Grenzen für öffentliche Eingaben sowie parallele Buchungsvorgänge sollten separat geprüft werden. Die bisherigen Überlappungsprüfungen sind nicht automatisch eine transaktionssichere Sperre bei gleichzeitigen Schreibzugriffen.
4. **Veröffentlichung.** Alle Codekorrekturen sind lokal. Die veröffentlichte Website ist durch diese Änderungen noch nicht abgesichert. Es wurde nichts gepusht oder veröffentlicht.

## Verifikation

- 23 automatisierte Tests bestanden, einschließlich neun neuer Sicherheits-/Preisprüfungen und bestehender Kuschelwochen-/Schnellfiltertests.
- ESLint für die geänderten JS-/JSX-Dateien ohne Fehler.
- Drei lokale HTTP-Prüfungen auf Port 3001: jeweils 401 ohne Anmeldung.
- Kein vollständiger Produktionsbuild und kein authentifizierter Ende-zu-Ende-Test realer Uploads oder externer iCal-Dienste in diesem Prüflauf.
- Reproduzierbar mit `node --test tests/security-and-prices.test.mjs tests/kuschelwochen.test.mjs tests/kuschelwochen-api.test.mjs tests/quick-filters.test.mjs`.

## Quellen für Paketmeldungen

Quelle: npm-Registry-Audit vom 29.10.2026 für den installierten Lockfile-Stand. Beispielmeldungen aus dem Audit:

- https://github.com/advisories/GHSA-9g9p-9gw9-jx7f
- https://github.com/advisories/GHSA-h25m-26qc-wcjf
- https://github.com/advisories/GHSA-26hh-7cqf-hhc6

Die Anwendbarkeit einzelner Paketmeldungen hängt von tatsächlich verwendeten Funktionen und der Hosting-Konfiguration ab.
