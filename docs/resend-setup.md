# Resend für Kontakt- und Buchungsanfragen

Serverseitiger Versand über POST https://api.resend.com/emails. Kein Schlüssel wird an den Browser übermittelt. Keine Änderung der Microsoft-365-MX-Einträge erforderlich.

In der lokalen .env und in den gewünschten Vercel-Umgebungen setzen:

```dotenv
RESEND_API_KEY=<Resend-Schlüssel mit Versandberechtigung>
RESEND_FROM_EMAIL="Urlaub-GOSCH <info@send.urlaub-gosch.de>"
BOOKING_ADMIN_EMAIL=info@urlaub-gosch.de
CONTACT_ADMIN_EMAIL=info@urlaub-gosch.de
```

Die Absenderadresse setzt voraus, dass `send.urlaub-gosch.de` in Resend erfolgreich verifiziert ist. Der Nutzer hat diese Subdomain als angelegte Domain bestätigt; ihr Verifizierungsstatus wurde noch nicht bestätigt. Schlüssel niemals committen oder im Chat teilen. Ohne Schlüssel, Absender und Empfänger schlägt der Versand kontrolliert fehl. SMTP_* wird nicht mehr verwendet.

## Lokal ohne eigene Domain testen

Aktueller lokaler Stand (17.11.2026): Testabsender `Urlaub-GOSCH Test <onboarding@resend.dev>`, beide Empfänger `info@urlaub-gosch.de`. Der ausdrücklich gewünschte Kontakt-Test wurde von Resend mit `MAIL_TEST_RECIPIENT_RESTRICTED` abgelehnt. Die zum verwendeten Schlüssel gehörende Registrierungsadresse muss deshalb noch im Resend-Profil geprüft werden. Kein Test wurde zum Versand angenommen, keine Testbuchung angelegt. Die oben genannte reguläre Absenderkonfiguration bleibt die Vorlage für den späteren produktiven Versand.

Für einen Testversand ohne DNS-Verifizierung kann lokal `RESEND_FROM_EMAIL="Urlaub-GOSCH Test <onboarding@resend.dev>"` verwendet werden. `CONTACT_ADMIN_EMAIL` und `BOOKING_ADMIN_EMAIL` müssen dafür auf die E-Mail-Adresse des Resend-Kontos zeigen. Die Registrierungsadresse vor der Umstellung bestätigen; sie ist nicht automatisch mit dem späteren geschäftlichen Empfänger identisch. Der API-Schlüssel muss den Testabsender erlauben.

Nach Änderung der lokalen Umgebungsvariablen den Entwicklungsserver neu starten und ausschließlich fiktive Testangaben verwenden. Kontaktanfragen werden versendet, Buchungsanfragen zusätzlich in der konfigurierten Datenbank gespeichert; deshalb keinen Buchungstest gegen echte Objekte ausführen, ohne die Speicherung zu berücksichtigen. Die Mock-Tests unter `npm test` versenden keine E-Mails und schreiben keine Buchungsanfragen in die Datenbank.

Diese Testkonfiguration nicht als Produktionskonfiguration übernehmen. Für den späteren regulären Versand gelten wieder der verifizierte Absender und die geschäftlichen Empfänger oben.

Quelle: https://resend.com/docs/knowledge-base/403-error-resend-dev-domain

## Versandfehler 403 beheben

Am 17.11.2026 wurde der lokale Absender auf `Urlaub-GOSCH <info@send.urlaub-gosch.de>` an die vom Nutzer bestätigte Resend-Domain angepasst. Empfänger bleibt `info@urlaub-gosch.de`. Der verwendete Schlüssel hat nur Versandberechtigung; eine lesende Domainabfrage liefert deshalb erwartbar `401 restricted_api_key` und bestätigt keinen Domainstatus.

1. Im Resend-Dashboard unter **Domains** die bereits angelegte Domain `send.urlaub-gosch.de` öffnen. Hier ist `send.urlaub-gosch.de` die Absender-Domain, nicht bloß ein automatisch angelegter Return-Path für `urlaub-gosch.de`.
2. Die von Resend für den Versand angegebenen DNS-Einträge beim DNS-Anbieter eintragen. Werte aus dem Dashboard übernehmen; bestehende Microsoft-365-MX-Einträge für das Postfach nicht ersetzen und keinen Empfang über Resend aktivieren.
3. In Resend die Verifizierung prüfen, bis der Domainstatus für `send.urlaub-gosch.de` **Verified** lautet. Der Versandschlüssel muss diese Domain freigeben. Bei einem Deployment den oben genannten Absender ebenfalls in den Vercel-Umgebungsvariablen hinterlegen.
4. Danach das Kontaktformular erneut absenden. Bei geänderter lokaler `.env` zuvor den Entwicklungsserver neu starten. Ein Website-Umzug ist für diese Mailfreigabe nicht erforderlich.

Die Serverlogs unterscheiden nun `MAIL_DOMAIN_NOT_VERIFIED`, `MAIL_TEST_RECIPIENT_RESTRICTED`, `MAIL_KEY_PERMISSION_DENIED`, `MAIL_KEY_SUSPENDED` und `MAIL_KEY_INVALID`. Unbekannte Antworten behalten `MAIL_PROVIDER_<HTTP-Status>`. Die Rohantwort von Resend wird weder protokolliert noch Besuchern angezeigt. Für den Versand reicht ein auf die passende Domain beschränkter Sending-only-Schlüssel; Full access ist dafür nicht erforderlich.

Offizielle Hinweise: https://resend.com/docs/api-reference/errors und https://resend.com/docs/knowledge-base/403-error-domain-mismatch

- Buchungsanfragen: zuerst Speicherung in Neon, dann Benachrichtigung. Bei Versandfehler bleibt die Anfrage erhalten; der Gast sieht die Referenznummer. Fehlgeschlagene Benachrichtigungen werden derzeit nicht automatisch erneut versendet; im Serverlog steht die Anfrage-ID, keine Nachricht und kein Schlüssel. Resend-Idempotenzschlüssel anhand der Anfrage-ID.
- Kontaktformular: keine zusätzliche Datenbankspeicherung. Erfolg bedeutet Annahme durch Resend, keine bestätigte Zustellung im Postfach. Bei Fehler bleiben Eingaben im Formular erhalten. Wiederholter Versand desselben Versuchs verwendet denselben Idempotenzschlüssel (Resend-Aufbewahrung: 24 Stunden).
- Fester Empfänger aus Serverkonfiguration; Gastadresse nur als Reply-To. Text-E-Mails ohne HTML-Einschleusung. Keine automatische Gastbestätigung.
- Beide Endpunkte verwenden bestehende Herkunfts-, Größen- und IP-Limits sowie Honeypot; Kontakt prüft zusätzlich den Datenschutzhinweis. Die bestehenden Limits pro Serverinstanz ersetzen keinen zentralen WAF-Schutz.

Vor Freischaltung Resend-DPA/Transfergrundlage und Speicherung im Mailpostfach klären. Datenschutztext nennt Resend. Nach Konfiguration einen ausdrücklich gewünschten Testversand durchführen. Es wurden keine echten Testmails versendet und keine DNS-Einträge oder Deployments verändert.

Dokumentation: https://resend.com/docs/api-reference/emails/send-email
