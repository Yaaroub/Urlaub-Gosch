# Datenschutz und technische Prüfung – 4. November 2026

Lokal umgesetzt: korrekter Datenschutzlink und Telefonkontakt; nicht angeschlossenes Kontaktformular explizit deaktiviert (keine GET-Übermittlung personenbezogener Daten); Basisschutz-Header; externe Karten/Webcams an Einwilligung gebunden, bei Widerruf entfernt; Wetterabfrage über eigene API; keine Statistik-Auswahl für einen nicht eingebundenen Dienst. Kein Google-Fonts-CDN im Quellcode gefunden. Keine Veröffentlichung vorgenommen.

Die Buchungsanfrage bleibt eine unverbindliche Anfrage in BookingRequest/PENDING, keine Zahlung und keine verbindliche Buchung. Sie hat jetzt Typ-/Längen-/Datumsvalidierung, einen 16-KiB-Body-Grenzwert auch ohne Content-Length, Herkunftsprüfung, Honeypot und Begrenzung pro Serverinstanz sowie pro E-Mail über gespeicherte Anfragen. Der E-Mail-Zähler ist nicht atomar; IP-Limits sind nicht instanzübergreifend und ersetzen keine Vercel-WAF-Regel. Vor Freigabe zentralen Rate-Limit-Schutz konfigurieren. Keine Testmails versandt.

Die CSP beschränkt Einbettung, Plugins, Basis-URL und Formularziele. Sie ist keine vollständige script-src/Nonce-CSP und kein vollständiger XSS-Schutz. HSTS nur im Produktionsmodus, ohne Subdomain-/Preload-Zusage. Preview Protection und Hosting-Einstellungen sind nicht aus dem Repository nachgewiesen.

Vor Veröffentlichung der Datenschutzerklärung durch den Betreiber klären:

- Verantwortlichenangaben und Kontakt bestätigen.
- Tatsächlich abgeschlossene Auftragsverarbeitungsverträge mit Vercel und Neon einschließlich Unterauftragnehmer prüfen. Ein Link zum DPA beweist keinen Vertragsabschluss.
- Tatsächliche internationale Datenübermittlungen, geltenden Transfermechanismus und gegebenenfalls Zertifizierung/SCC anhand der eigenen Verträge bestätigen. EU-Datenbankregion allein schließt Drittlandverarbeitung nicht aus.
- Konkrete Log-, Backup-, Konto- und Anfrage-Aufbewahrungs-/Löschfristen festlegen und ergänzen.
- Anbieterangaben und Datenschutzlinks für Google Maps, Mapbox und beide Webcam-Betreiber vervollständigen; Einwilligungstext rechtlich freigeben.
- SMTP-Anbieter und Maildatenverarbeitung ergänzen, sobald die Mail-Einrichtung erfolgt. Domain und Mail-Einrichtung wurden ausdrücklich zurückgestellt.

Quellen zur Vertragsprüfung: https://vercel.com/legal/dpa und https://neon.com/dpa . Die Änderungen sind technische Korrekturen und eine inhaltliche Bereinigung, keine abschließende rechtliche Freigabe.
