# Benachrichtigungen für neue Anfragen

Im Adminbereich zeigt die Glocke die Anzahl offener Anfragen und öffnet die Liste. Über das Lautsprechersymbol daneben lässt sich der Ton einschalten. Der Browser benötigt dafür einen Klick. Der Ton ist für ein sichtbares Adminfenster gedacht. Die Anzeige für Buchungsanfragen folgt den bestehenden Leserechten. Kontaktanfragen zählen nur für Superadmins.

Für E-Mails verwendet die Anwendung das bestehende Exchange-Online-Postfach `info@urlaub-gosch.de`. Empfänger und Absender sind dasselbe Postfach. Die Nachricht enthält einen festen Hinweis auf den Menüpunkt „Anfragen“. Formularinhalte, Kundendaten und Anfragekennungen werden nicht an Microsoft Graph übergeben. Die Anwendung braucht dafür kein zusätzliches npm-Paket, keinen weiteren Mailanbieter und keine DNS-Änderung.

1. Die Datenbankmigrationen für Kontaktanfragen und die Versandbegrenzung auf der Zielumgebung einspielen.
2. Eine eigene App in Microsoft Entra ID im vorhandenen Microsoft-365-Mandanten registrieren. In Exchange Online der App die Rolle `Application Mail.Send` mit einem Geltungsbereich ausschließlich für `info@urlaub-gosch.de` zuweisen. Keine mandantenweite Graph-Berechtigung `Mail.Send` daneben erteilen, da die Berechtigungen sonst zusammenwirken. Den Geltungsbereich in Exchange für das zugelassene Postfach und ein unzulässiges Postfach prüfen.
3. In der gewünschten Umgebung die folgenden serverseitigen Variablen hinterlegen. Geheimnisse gehören weder in Git noch in Nachrichten.

```dotenv
INQUIRY_ALERT_MAIL_ENABLED=true
MS365_ALERT_TENANT_ID=<Mandanten-ID>
MS365_ALERT_CLIENT_ID=<Anwendungs-ID>
MS365_ALERT_CLIENT_SECRET=<Client-Geheimnis>
# Optional, falls info@urlaub-gosch.de nur die Mailadresse und nicht der Benutzerprinzipalname ist:
# MS365_ALERT_MAILBOX_ID=<Entra-Objekt-ID desselben Postfachs>
```

Ohne `INQUIRY_ALERT_MAIL_ENABLED=true` bleibt E-Mail aus. Der Versand startet nach erfolgreichem Speichern und basiert auf einem gemeinsamen Zeitlimit von einem Versandversuch innerhalb von zwei Minuten. Bei mehreren Anfragen in diesem Fenster kann eine Meldung für den gesamten Eingang genügen. Ein Mailfehler ändert den Speicherstatus nicht. Die Anwendung versucht fehlgeschlagene E-Mails nicht erneut zu senden.

- [Microsoft Graph – sendMail](https://learn.microsoft.com/en-us/graph/api/user-sendmail?view=graph-rest-1.0)
- [Exchange Online – anwendungsbezogene Rechte auf ein Postfach begrenzen](https://learn.microsoft.com/en-us/exchange/permissions-exo/application-rbac)
