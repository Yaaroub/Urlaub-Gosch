# DNS-Umzug urlaub-gosch.de zu IONOS – Checkliste

Stand 24.11.2026. Ziel: Die **Nameserver** wechseln von planet-ocean zu IONOS. Dabei bleibt alles erreichbar:
alte Website (Server bei planet-ocean, 178.63.16.44), E-Mail (Microsoft 365), Mailjet-Versand.
Die neue Website (Vercel) wird **nicht** in diesem Schritt umgeschaltet, das folgt später.

Der Abgleich beruht auf dem Zonefile von planet-ocean und dem öffentlich abgefragten DNS vom 24.11.2026.

---

## 0. Vorher klären

1. **planet-ocean:** Der alte Webserver (178.63.16.44) muss nach dem DNS-Umzug weiterlaufen. Vertrag und Hosting **nicht kündigen**, nur die DNS-Verwaltung entfällt.
2. **Mailjet-DKIM-Wert** bereithalten: Mailjet → Domains & Absender → SPF/DKIM-Authentifizierung → Zahnrad. Den Wert vollständig kopieren.
3. **Zeitpunkt:** abends oder am Wochenende. Optional planet-ocean bitten, einen Tag vorher die TTL auf 300 Sekunden zu senken. Dann wirken Korrekturen schneller.

## 1. Einträge, die bei IONOS stehen müssen

| Typ | Hostname | Wert | Zweck |
|---|---|---|---|
| A | @ | `178.63.16.44` | alte Website |
| AAAA | @ | `2a01:4f8:110:5257::3` | alte Website |
| A | www | `178.63.16.44` | alte Website |
| AAAA | www | `2a01:4f8:110:5257::3` | alte Website |
| A | neu | `178.63.16.44` | Subdomain „neu“ (alte Seite) |
| AAAA | neu | `2a01:4f8:110:5257::3` | dto. |
| A | ftp | `178.63.16.44` | FTP alter Server |
| AAAA | ftp | `2a01:4f8:110:5257::6` | dto. |
| MX (Priorität 0) | @ | `urlaubgosch-de01e.mail.protection.outlook.com` | **E-Mail-Empfang Microsoft 365** |
| TXT | @ | `v=spf1 include:spf.protection.outlook.com include:planet-ocean.email include:spf.mailjet.com -all` | SPF: Microsoft, alte Seite, Mailjet |
| TXT | _dmarc | `v=DMARC1; p=none;` | DMARC |
| TXT | mailout._domainkey | `v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCtQFGjtH05n5EdfxvMyCknOy6Jo3rAnZA8A8sLWPIIXzs2nRVOyPUWfk3KdC4Otdh31sOs/i2135KXFuQqGwJ3DZSxLcnY74adr0qma5u+aS6Lgg5dPOVAUCWrnunQHn52DE++oVslGpd65FaniExamnUqyp1NdEQtJfo7Q6kiLwIDAQAB` | DKIM der alten Seite (planet-ocean) |
| TXT | mailjet._domainkey | *Wert aus Mailjet* | DKIM Mailjet |
| TXT | mailjet._e89dc96e | *Wert aus Mailjet* (bereits angelegt) | Domain-Bestätigung Mailjet |
| CNAME | autodiscover | `autodiscover.outlook.com` | Outlook-Einrichtung |
| CNAME | lyncdiscover | `webdir.online.lync.com` | Microsoft Teams/Skype |
| CNAME | sip | `sipdir.online.lync.com` | dto. |
| SRV | _sip._tls | Priorität 100, Gewicht 1, Port 443, Ziel `sipdir.online.lync.com` | dto. |
| SRV | _sipfederationtls._tcp | Priorität 100, Gewicht 1, Port 5061, Ziel `sipfed.online.lync.com` | dto. |

## 2. IONOS-Standardeinträge, die gelöscht oder ersetzt werden müssen

| Typ | Hostname | IONOS-Standard | Aktion |
|---|---|---|---|
| A | @ | 217.160.0.109 | ersetzen durch 178.63.16.44 |
| AAAA | @ | 2001:8d8:100f:f000::200 | ersetzen durch 2a01:4f8:110:5257::3 |
| MX | @ | mx00.ionos.de / mx01.ionos.de | **beide löschen**, Microsoft-MX anlegen |
| TXT | @ | v=spf1 include:_spf-eu.ionos.com ~all | ersetzen durch SPF aus Tabelle 1 |
| CNAME | _dmarc | dmarc.ionos.de | löschen, TXT aus Tabelle 1 anlegen |
| CNAME | s1-ionos._domainkey / s2-ionos._domainkey | s1/s2.dkim.ionos.com | löschen (kein IONOS-Mail) |
| CNAME | autodiscover | adsredir.ionos.info | ersetzen durch autodiscover.outlook.com |
| TXT | _dep_ws_mutex | … | löschen, falls kein IONOS-Webspace genutzt wird |
| CNAME | _domainconnect | _domainconnect.ionos.com | kann bleiben |

Bei IONOS die Einträge über die **Service-Zuordnung „Mail“ und „Default Site“** lösen: Unter Domain → DNS die vorkonfigurierten Mail-Einträge auf „Andere Anbieter / eigene Einträge“ umstellen. Sonst setzt IONOS sie wieder zurück.

## 3. Ablauf

1. Prüfen, ob IONOS die DNS-Einträge schon **vor** der Umstellung bearbeiten lässt (Domain → DNS). Wenn ja: Tabelle 1 und 2 komplett vorbereiten, **dann** Schritt 2.
2. In IONOS: Nameserver → **„IONOS-Standard“** wählen. Ab hier gilt die IONOS-Zone.
3. Wenn die Einträge vorher nicht bearbeitbar waren: **sofort** Tabelle 2 abarbeiten (zuerst den **MX**), dann Tabelle 1 ergänzen. Ziel: in unter 15 Minuten fertig.
4. Mir Bescheid geben. Ich prüfe jeden Eintrag direkt an den IONOS-Nameservern und öffentlich.
5. Test: eine Mail von außen an info@ schicken, Outlook neu starten, www.urlaub-gosch.de aufrufen, Mailjet „Prüfen“ (SPF/DKIM sollten grün werden), Testmail über das Kontaktformular.
6. Die Umstellung ist nach etwa 24 Stunden überall angekommen. Erst danach die DNS-Verwaltung bei planet-ocean beenden, den Webserver **nicht**.

## 4. Später: neue Website auf Vercel

Nicht Teil dieses Umzugs. Wenn es so weit ist: A @ und www auf die Werte aus Vercel (Project → Settings → Domains) setzen, AAAA für @ und www löschen, `ftp` und `neu` entfernen oder weiter auf den alten Server zeigen lassen, `include:planet-ocean.email` und `mailout._domainkey` entfernen, sobald die alte Seite keine Mails mehr verschickt.
