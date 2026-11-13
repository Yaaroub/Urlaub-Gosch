# Urlaub-GOSCH

Ferienunterkünfte mit öffentlicher Suche, Preisberechnung und geschützter Verwaltung.

## Lokal arbeiten

Node.js ab Version 22 verwenden. Zugangsdaten gehören ausschließlich in lokale Umgebungsvariablen oder die Hosting-Konfiguration.

- npm ci: Abhängigkeiten installieren und Prisma Client erzeugen.
- npm run dev: Entwicklungsserver starten.
- npm test: automatisierte Funktions- und Sicherheitstests ausführen.
- npm run lint: Quellcode prüfen.
- npm run build: Produktionsbuild einschließlich Prisma Client erstellen.
- npm start: den fertigen Produktionsbuild starten.

## Projektstruktur

- src/app: Seiten, Layouts und API-Endpunkte. Admin-Seiten liegen unter admin/(protected); Berechtigungen werden zusätzlich in den Admin-APIs geprüft.
- src/components: gemeinsam verwendete Oberflächenelemente. Bereichsspezifische Admin-Komponenten bleiben bei ihren Seiten.
- src/lib: Geschäftslogik, Datenbankzugriff, Authentifizierung und Validierung.
- src/data: redaktionelle JSON-Inhalte für die Anwendung.
- src/context und src/hooks: gemeinsam genutzter Zustand und React-Hooks.
- prisma/schema.prisma: Datenmodell; prisma/migrations: erforderliche Datenbankmigrationen.
- prisma.config.ts: zentrale Prisma-Konfiguration einschließlich Seed-Befehl.
- scripts: separat ausgeführte Import-, Pflege- und Administrationswerkzeuge. Diese können Daten verändern; vor Ausführung prüfen.
- tests: Tests für Preise, Kalender, Suche und Sicherheitsgrenzen.
- docs: Sicherheitsbefunde und offene Punkte vor Veröffentlichung.
- public: statische Dateien.

## Speicherung

Die Anwendung verwendet Prisma für den Zugriff auf PostgreSQL bei Neon. DATABASE_URL ist der Anwendungszugang, DIRECT_DATABASE_URL der direkte Datenbankzugang. Bilder werden über Vercel Blob gespeichert. Die Website wird auf Vercel betrieben. Produktionswerte werden separat im Hosting verwaltet; lokale Werte belegen nicht die Produktionseinstellungen.

## Änderungen prüfen

Vor Veröffentlichung Tests, Codeprüfung und Build ausführen. Migrationen und Importdaten nicht als temporäre Dateien löschen. Die offenen Datenschutz- und Produktionspunkte stehen in docs/privacy-release-checklist.md und docs/production-check-2026-11-04.md.

Automatisch erzeugte Dateien wie .next und node_modules gehören nicht in Git. Sicherheitsprüfungen bei Bedarf neu ausführen (npm audit beziehungsweise npm audit --omit=dev); alte JSON-Berichte sind kein aktueller Sicherheitsnachweis.
