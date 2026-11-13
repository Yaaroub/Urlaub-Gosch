# Produktionsprüfung – 4. November 2026

Nur lesende Prüfung. Keine Veröffentlichung, DNS-Änderung oder Änderung von Datenbankrechten.

## Live-Seite: urlaub-gosch.vercel.app

- Startseite HTTP 200, Server Vercel, HTTPS erfolgreich, HSTS aktiv.
- CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy und Permissions-Policy fehlen live. Lokal vorbereitete Header sind noch nicht veröffentlicht.
- /admin liefert eine gestreamte Next.js-Weiterleitung zum Login (HTTP 200 allein ist daher kein Nachweis für freien Adminzugriff).
- /api/admin/properties und /api/account/me liefern ohne Anmeldung HTTP 401.
- Keine vollständige Prüfung aller Endpunkte oder der produktiven Paketversionen vorgenommen.

## Datenbank und Berechtigungen

- Lokale Anwendung verbindet sich mit Neon PostgreSQL, neondb, AWS eu-central-1.
- TLS-Verbindungsaufbau zum konfigurierten Neon-Endpunkt: TLS 1.3, gültiges Zertifikat.
- pg_stat_ssl am Datenbank-Backend meldet ssl=false; dieser Wert allein belegt nicht den Transportstatus zum vorgeschalteten Neon-Endpunkt. Die öffentliche TLS-Verbindung wurde separat geprüft.
- Aktuelle Anwendungsrolle ist kein Superuser, darf aber Datenbanken und Rollen anlegen und besitzt 14 Tabellen. Für den laufenden Betrieb ist eine eigene Rolle mit begrenzten Rechten erforderlich; Eigentümer-/Migrationszugang separat halten.
- Produktions-DATABASE_URL auf Vercel, Trennung von Preview/Produktion, Backups/Restore-Fenster, Wiederherstellungstest, MFA und Teamrechte sind ohne Kontozugang nicht bestätigt.
- Rollenwechsel erst nach Vorbereitung und Prüfung eines eingeschränkten Anwendungszugangs einschließlich Sequenzen und künftiger Tabellen vornehmen; bestehende Eigentümerrechte nicht ungeprüft entziehen.

## DNS und Mail

- Autoritative Nameserver: ns2.planet-ocean-hosting.de, ns3.planet-ocean-hosting.com, ns4.planet-ocean-hosting.com.
- A-Record der Hauptdomain: 178.63.16.44.
- MX: urlaubgosch-de01e.mail.protection.outlook.com (Microsoft 365).
- SPF autorisiert Microsoft 365 und planet-ocean.email.
- Nameserver belegen die DNS-Infrastruktur, nicht den Registrar oder wer den Account besitzt. Ein DNS-Verwaltungszugang ist nicht bestätigt.

## Für die Fortsetzung benötigte Zugänge

Im eigenen Browser bei Vercel, Neon und der DNS-Verwaltung anmelden beziehungsweise passende Projekt-/DNS-Berechtigungen durch den Inhaber erteilen lassen. Keine Passwörter oder Tokens in den Chat kopieren. Zunächst Produktionseinstellungen, Backup-Konfiguration und DNS-Zone lesend prüfen. Domain-/Mail-Umstellung bleibt zurückgestellt; GitHub-Push und Veröffentlichung sind nicht autorisiert.
