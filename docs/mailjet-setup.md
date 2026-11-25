# Mailjet für Kontakt- und Buchungsanfragen

Serverseitiger Versand über `POST https://api.mailjet.com/v3.1/send` (Code: `src/lib/mailjet-mail.js`). Die Schlüssel kommen nie in den Browser. Die Microsoft-365-MX-Einträge bleiben unverändert, Mails werden weiter in Microsoft 365 empfangen.

## Vercel-Umgebungsvariablen

```dotenv
MAILJET_API_KEY=<API-Key aus Mailjet>
MAILJET_SECRET_KEY=<Secret Key aus Mailjet>
MAIL_FROM_EMAIL=info@urlaub-gosch.de
MAIL_FROM_NAME=Urlaub-GOSCH Website
BOOKING_ADMIN_EMAIL=info@urlaub-gosch.de
CONTACT_ADMIN_EMAIL=info@urlaub-gosch.de
```

Schlüssel nie committen oder im Chat teilen. Ohne vollständige Konfiguration schlägt der Versand kontrolliert fehl (`MAIL_NOT_CONFIGURED`). Nicht mehr benötigt: `RESEND_*`, `INQUIRY_ALERT_MAIL_ENABLED`, `MS365_ALERT_*`.

## Einrichtung bei Mailjet

1. Konto anlegen und dabei als Speicherort **Europa** wählen (Mailjet bietet USA oder Europa an). **Vertrag zur Auftragsverarbeitung (DPA)** der Sinch-Gruppe akzeptieren und ablegen. Unterauftragnehmer (geprüft 21.11.2026): Rechenzentren Google Cloud in Deutschland/Belgien; für Support und Abrechnung auch US-Firmen (Mailgun, Atlassian, Zendesk, Stripe) – in der Datenschutzerklärung berücksichtigt.
2. **Absender-Domain `urlaub-gosch.de` hinzufügen** und die angezeigten DNS-Einträge bei IONOS eintragen:
   - SPF: den **bestehenden** SPF-Eintrag ergänzen, keinen zweiten anlegen. Stand 21.11.2026 (DNS geprüft):
     `v=spf1 include:spf.protection.outlook.com include:planet-ocean.email -all`
     Neu (den genauen `include`-Wert aus dem Mailjet-Dashboard übernehmen, üblich ist `include:spf.mailjet.com`):
     `v=spf1 include:spf.protection.outlook.com include:spf.mailjet.com -all`
     `include:planet-ocean.email` nur entfernen, wenn über den alten Anbieter keine Mails mehr verschickt werden (nach dem Umzug zu IONOS).
   - DMARC ist vorhanden (`p=none`). Nach erfolgreichem Test kann er auf `p=quarantine` verschärft werden.
   - DKIM: den von Mailjet angezeigten TXT-Eintrag (`mailjet._domainkey…`) eintragen.
   - MX-, Autodiscover- und Microsoft-Einträge nicht ändern.
3. Absender `info@urlaub-gosch.de` bestätigen, bis Domain und Absender als **validiert** angezeigt werden.
4. Im Konto **Öffnungs- und Klick-Tracking ausschalten** (der Code schaltet es pro Mail zusätzlich ab) und keine Kontaktlisten/Newsletter-Funktionen für diese Mails verwenden.
5. API-Key-Paar erzeugen und nur in Vercel hinterlegen.
6. Danach einmal ausdrücklich mit fiktiven Angaben testen (Kontaktformular). Für Buchungsanfragen beachten: Sie werden in der Datenbank gespeichert – nicht gegen echte Objekte testen.

## Datenschutz-Maßnahmen im Code

- Benachrichtigung: einziger Empfänger ist das eigene Postfach; die Gastadresse steht nur als Reply-To.
- Eingangsbestätigung an den Gast: je Formular eine eigene Mail (Buchungsanfrage, Informationsanfrage, Kontakt, Vermieter-Interesse), HTML mit eingebettetem Logo (keine externen Bilder) plus Textfassung. Sie enthält nur feste Texte, bei Objektanfragen Objektname und Zeitraum – keinen Namen und keine Nachricht des Absenders, damit die Formulare nicht für Spam an fremde Adressen missbraucht werden können. Höchstens 3 Bestätigungen pro Adresse und Stunde. Reply-To ist `MAIL_FROM_EMAIL`. Schlägt sie fehl, bleibt die Anfrage trotzdem erfolgreich.
- Betreff ohne Gastdaten („Kontaktanfrage über die Website“, „Neue Buchungsanfrage – <Objekt>“); Gastdaten nur im Text.
- Nur Text, kein HTML, keine externen Bilder; Öffnungs- und Klick-Tracking pro Mail aus.
- Fehlermeldungen von Mailjet werden nie weitergegeben oder protokolliert, nur feste Codes (`MAIL_KEY_INVALID`, `MAIL_SENDER_NOT_VALIDATED`, `MAIL_PROVIDER_<Status>` …).
- Kontaktformular: keine Speicherung in der Datenbank; doppeltes Absenden desselben Formulars löst innerhalb von 24 Stunden keine zweite Mail aus (nur Hash im Speicher).
- Buchungsanfrage: erst Speicherung, dann Mail; schlägt die Mail fehl, bleibt die Anfrage im Admin unter „Anfragen“ erhalten.
