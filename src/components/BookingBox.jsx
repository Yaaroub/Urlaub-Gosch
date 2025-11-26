// src/components/BookingBox.jsx
"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  ReceiptText,
  Info,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

async function fetchPrice(propertyId, arrival, departure) {
  if (!arrival || !departure) return null;
  const res = await fetch("/api/price", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ propertyId, arrival, departure }),
  });
  return await res.json(); // kann {error} enthalten
}

export default function BookingBox({ propertyId }) {
  const [arrival, setArrival] = useState("");
  const [departure, setDeparture] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [messageText, setMessageText] = useState("");

  const [price, setPrice] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const [showDetails, setShowDetails] = useState(false);

  const canQuote = useMemo(
    () => Boolean(arrival && departure),
    [arrival, departure]
  );

  const isFormValid = useMemo(() => {
    return (
      arrival &&
      departure &&
      firstName.trim() &&
      lastName.trim() &&
      email.trim()
    );
  }, [arrival, departure, firstName, lastName, email]);

  // Live-Preis nach Eingabe beider Daten
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!arrival || !departure) {
        setPrice(null);
        return;
      }
      setLoadingPrice(true);
      try {
        const p = await fetchPrice(propertyId, arrival, departure);
        if (!cancelled) setPrice(p);
      } catch {
        if (!cancelled)
          setPrice({ error: "Preis konnte nicht berechnet werden." });
      } finally {
        if (!cancelled) setLoadingPrice(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [propertyId, arrival, departure]);

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/booking-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          arrival,
          departure,
          firstName,
          lastName,
          email,
          phone,
          message: messageText,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setMessage({
          type: "error",
          text: data.error || "Anfrage konnte nicht gespeichert werden.",
        });
      } else {
        setMessage({
          type: "ok",
          text:
            "Ihre Anfrage wurde erfolgreich übermittelt. Die ausgewählten Tage sind noch nicht blockiert – wir prüfen Ihre Anfrage und melden uns.",
        });

        // Felder zurücksetzen
        setArrival("");
        setDeparture("");
        setFirstName("");
        setLastName("");
        setEmail("");
        setPhone("");
        setMessageText("");
        setPrice(null);
      }
    } catch {
      setMessage({ type: "error", text: "Netzwerkfehler." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Anfrage / Buchung</h3>
        <ReceiptText className="h-5 w-5 text-slate-400" />
      </div>

      <form onSubmit={submit} className="grid gap-3">
        {/* Zeitraum */}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-xs text-slate-500">Anreise *</span>
            <input
              type="date"
              className="border rounded-xl px-3 py-2"
              value={arrival}
              onChange={(e) => setArrival(e.target.value)}
              required
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-slate-500">Abreise *</span>
            <input
              type="date"
              className="border rounded-xl px-3 py-2"
              value={departure}
              onChange={(e) => setDeparture(e.target.value)}
              required
            />
          </label>
        </div>

        {/* Kontaktdaten */}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-xs text-slate-500">Vorname *</span>
            <input
              type="text"
              className="border rounded-xl px-3 py-2"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Max"
              required
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-slate-500">Nachname *</span>
            <input
              type="text"
              className="border rounded-xl px-3 py-2"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Mustermann"
              required
            />
          </label>
        </div>

        <label className="grid gap-1">
          <span className="text-xs text-slate-500">E-Mail-Adresse *</span>
          <input
            type="email"
            className="border rounded-xl px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="max@example.de"
            required
          />
        </label>

        <label className="grid gap-1">
          <span className="text-xs text-slate-500">Rufnummer (optional)</span>
          <input
            type="tel"
            className="border rounded-xl px-3 py-2"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+49 ..."
          />
        </label>

        <label className="grid gap-1">
          <span className="text-xs text-slate-500">
            Nachricht (optional, z.&nbsp;B. Anzahl Kinder, Fragen)
          </span>
          <textarea
            className="border rounded-xl px-3 py-2 min-h-[80px] resize-y"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Ihre Nachricht an den Vermieter..."
          />
        </label>

        {/* Live-Preis */}
        <div className="text-sm mt-1">
          {loadingPrice ? (
            <div className="inline-flex items-center gap-2 text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Preis wird
              berechnet…
            </div>
          ) : price && !price.error ? (
            <>
              <div className="font-medium">
                Gesamtpreis: {price.total.toFixed(2)} €{" "}
                <span className="text-xs text-slate-500">
                  für {price.nights} Nacht
                  {price.nights === 1 ? "" : "e"} (inkl. Nebenkosten)
                </span>
              </div>

              {/* Rabatt-Hinweis */}
              {price.discountAmount > 0 && (
                <div className="mt-2 rounded-lg bg-rose-50 text-rose-800 ring-1 ring-rose-200 p-2 text-xs leading-5">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    <span>{price.invoiceNote}</span>
                  </div>
                </div>
              )}

              {/* Rechnungspositionen */}
              {Array.isArray(price.invoiceLines) &&
                price.invoiceLines.length > 0 && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => setShowDetails((v) => !v)}
                      className="text-xs text-sky-700 hover:underline inline-flex items-center gap-1"
                    >
                      {showDetails ? (
                        <>
                          <ChevronUp className="h-4 w-4" /> Details ausblenden
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" /> Details anzeigen
                        </>
                      )}
                    </button>

                    {showDetails && (
                      <ul className="mt-2 text-sm text-slate-700 space-y-1">
                        {price.invoiceLines.map((l, i) => (
                          <li key={i} className="flex justify-between">
                            <span>
                              {l.type === "lodging" &&
                                `${l.title} (${l.quantity} × ${Number(
                                  l.unitPrice
                                ).toFixed(2)} €)`}
                              {l.type === "discount" && l.title}
                              {l.type === "extra" &&
                                `${l.title}${
                                  l.quantity
                                    ? ` (${l.quantity} ${l.unit || ""})`
                                    : ""
                                }`}
                            </span>
                            <span
                              className={
                                l.type === "discount" ? "text-rose-700" : ""
                              }
                            >
                              {l.type === "discount"
                                ? `−${(-Number(l.amount)).toFixed(2)} €`
                                : `${Number(
                                    l.lineTotal ?? l.baseTotal
                                  ).toFixed(2)} €`}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
            </>
          ) : (
            <div className="text-xs text-slate-500">
              {price?.error ||
                "Bitte An- und Abreise wählen, um den Preis zu sehen."}
            </div>
          )}
        </div>

        <div className="pt-2">
          <button
            className="rounded-xl px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm disabled:opacity-60 inline-flex items-center gap-2"
            disabled={submitting || !canQuote || !!price?.error || !isFormValid}
            title={
              !isFormValid
                ? "Bitte alle Pflichtfelder ausfüllen."
                : undefined
            }
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Sende…
              </>
            ) : (
              "Anfrage senden"
            )}
          </button>
        </div>

        {message && (
          <div
            className={`mt-2 text-sm inline-flex items-center gap-2 ${
              message.type === "ok" ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            {message.type === "ok" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <p className="mt-1 text-[11px] text-slate-400">
          * Pflichtfelder. Ihre Anfrage ist unverbindlich – es erfolgt noch
          keine feste Buchung.
        </p>
      </form>
    </div>
  );
}
