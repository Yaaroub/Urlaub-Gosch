// src/components/BookingBox.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  ReceiptText,
} from "lucide-react";

async function fetchPrice(propertyId, arrival, departure) {
  if (!arrival || !departure) return null;

  const res = await fetch("/api/price", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ propertyId, arrival, departure }),
  });

  return await res.json();
}

const inputClass =
  "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100";

export default function BookingBox({ propertyId }) {
  const [requestType, setRequestType] = useState("");

  const [arrival, setArrival] = useState("");
  const [departure, setDeparture] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [street, setStreet] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");

  const [adults, setAdults] = useState("1");
  const [children, setChildren] = useState("0");
  const [pets, setPets] = useState("");
  const [dogCount, setDogCount] = useState("0");

  const [messageText, setMessageText] = useState("");

  const [price, setPrice] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const hasTravelDates = useMemo(
    () => Boolean(arrival && departure),
    [arrival, departure]
  );

  const isFormValid = useMemo(() => {
    const dogsValid = Number(dogCount) >= 0;

    return Boolean(
      requestType &&
        arrival &&
        departure &&
        firstName.trim() &&
        lastName.trim() &&
        street.trim() &&
        postalCode.trim() &&
        city.trim() &&
        mobile.trim() &&
        email.trim() &&
        Number(adults) > 0 &&
        Number(children) >= 0 &&
        pets &&
        dogsValid
    );
  }, [
    requestType,
    arrival,
    departure,
    firstName,
    lastName,
    street,
    postalCode,
    city,
    mobile,
    email,
    adults,
    children,
    pets,
    dogCount,
  ]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!arrival || !departure) {
        setPrice(null);
        return;
      }

      setLoadingPrice(true);

      try {
        const result = await fetchPrice(propertyId, arrival, departure);
        if (!cancelled) setPrice(result);
      } catch {
        if (!cancelled) {
          setPrice({ error: "Preis konnte nicht berechnet werden." });
        }
      } finally {
        if (!cancelled) setLoadingPrice(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [propertyId, arrival, departure]);

  function resetForm() {
    setRequestType("");
    setArrival("");
    setDeparture("");
    setFirstName("");
    setLastName("");
    setStreet("");
    setPostalCode("");
    setCity("");
    setMobile("");
    setEmail("");
    setAdults("1");
    setChildren("0");
    setPets("");
    setDogCount("0");
    setMessageText("");
    setPrice(null);
  }

  async function submit(e) {
    e.preventDefault();

    if (!isFormValid || submitting) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/booking-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          requestType,
          arrival,
          departure,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          street: street.trim(),
          postalCode: postalCode.trim(),
          city: city.trim(),
          phone: mobile.trim(),
          mobile: mobile.trim(),
          email: email.trim(),
          adults: Number(adults),
          children: Number(children),
          pets: pets === "yes",
          dogCount: pets === "yes" ? Number(dogCount) : 0,
          message: messageText.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.error) {
        setMessage({
          type: "error",
          text: data.error || "Anfrage konnte nicht gespeichert werden.",
        });
        return;
      }

      setMessage({
        type: "ok",
        text:
          requestType === "booking"
            ? "Ihre Buchungsanfrage wurde erfolgreich übermittelt. Die ausgewählten Tage sind noch nicht fest gebucht – wir prüfen Ihre Anfrage und melden uns."
            : "Ihre Informationsanfrage wurde erfolgreich übermittelt. Wir melden uns schnellstmöglich bei Ihnen.",
      });

      resetForm();
    } catch {
      setMessage({ type: "error", text: "Netzwerkfehler." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-950">Info oder Buchung</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Wählen Sie zuerst, welche Art von Anfrage Sie senden möchten.
          </p>
        </div>
        <ReceiptText className="h-5 w-5 shrink-0 text-slate-400" />
      </div>

      <form onSubmit={submit} className="grid gap-5">
        <fieldset>
          <legend className="mb-2 text-xs font-semibold text-slate-700">
            Art der Anfrage *
          </legend>

          <div className="grid grid-cols-2 gap-2">
            <label
              className={`cursor-pointer rounded-xl border px-3 py-3 text-center text-sm font-semibold transition ${
                requestType === "info"
                  ? "border-sky-500 bg-sky-50 text-sky-800 ring-2 ring-sky-100"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name="requestType"
                value="info"
                checked={requestType === "info"}
                onChange={(e) => setRequestType(e.target.value)}
                className="sr-only"
                required
              />
              Information
            </label>

            <label
              className={`cursor-pointer rounded-xl border px-3 py-3 text-center text-sm font-semibold transition ${
                requestType === "booking"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-100"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name="requestType"
                value="booking"
                checked={requestType === "booking"}
                onChange={(e) => setRequestType(e.target.value)}
                className="sr-only"
                required
              />
              Buchungsanfrage
            </label>
          </div>
        </fieldset>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-slate-900">
            Reisezeitraum
          </h4>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-xs text-slate-500">Anreise *</span>
              <input
                type="date"
                className={inputClass}
                value={arrival}
                onChange={(e) => setArrival(e.target.value)}
                required
              />
            </label>

            <label className="grid gap-1">
              <span className="text-xs text-slate-500">Abreise *</span>
              <input
                type="date"
                className={inputClass}
                value={departure}
                onChange={(e) => setDeparture(e.target.value)}
                required
              />
            </label>
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-slate-900">
            Persönliche Daten
          </h4>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-xs text-slate-500">Vorname *</span>
              <input
                type="text"
                autoComplete="given-name"
                className={inputClass}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </label>

            <label className="grid gap-1">
              <span className="text-xs text-slate-500">Nachname *</span>
              <input
                type="text"
                autoComplete="family-name"
                className={inputClass}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </label>
          </div>

          <label className="mt-3 grid gap-1">
            <span className="text-xs text-slate-500">Straße + Hausnummer *</span>
            <input
              type="text"
              autoComplete="street-address"
              className={inputClass}
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="Musterstraße 12"
              required
            />
          </label>

          <div className="mt-3 grid gap-3 sm:grid-cols-[140px_minmax(0,1fr)]">
            <label className="grid gap-1">
              <span className="text-xs text-slate-500">PLZ *</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                className={inputClass}
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="24217"
                required
              />
            </label>

            <label className="grid gap-1">
              <span className="text-xs text-slate-500">Ort *</span>
              <input
                type="text"
                autoComplete="address-level2"
                className={inputClass}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </label>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-xs text-slate-500">Mobil-Nr. *</span>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                className={inputClass}
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+49 ..."
                required
              />
            </label>

            <label className="grid gap-1">
              <span className="text-xs text-slate-500">Mailadresse *</span>
              <input
                type="email"
                autoComplete="email"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.de"
                required
              />
            </label>
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-slate-900">
            Reisende & Haustiere
          </h4>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-xs text-slate-500">Erwachsene *</span>
              <input
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                className={inputClass}
                value={adults}
                onChange={(e) => setAdults(e.target.value)}
                required
              />
            </label>

            <label className="grid gap-1">
              <span className="text-xs text-slate-500">Kinder *</span>
              <input
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                className={inputClass}
                value={children}
                onChange={(e) => setChildren(e.target.value)}
                required
              />
            </label>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-xs text-slate-500">Haustiere *</span>
              <select
                className={inputClass}
                value={pets}
                onChange={(e) => {
                  const value = e.target.value;
                  setPets(value);
                  if (value !== "yes") setDogCount("0");
                }}
                required
              >
                <option value="">Bitte wählen</option>
                <option value="no">Nein</option>
                <option value="yes">Ja</option>
              </select>
            </label>

            <label className="grid gap-1">
              <span className="text-xs text-slate-500">Anzahl Hunde *</span>
              <input
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                className={`${inputClass} disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400`}
                value={dogCount}
                onChange={(e) => setDogCount(e.target.value)}
                disabled={pets !== "yes"}
                required={pets === "yes"}
              />
            </label>
          </div>
        </div>

        <label className="grid gap-1">
          <span className="text-xs text-slate-500">Nachricht (optional)</span>
          <textarea
            className={`${inputClass} min-h-[96px] resize-y`}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Fragen oder besondere Wünsche..."
          />
        </label>

        {/* Preisrechner: nur Gesamtsumme, keine aufklappbaren Detailpositionen */}
        <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm ring-1 ring-slate-100">
          {loadingPrice ? (
            <div className="inline-flex items-center gap-2 text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Preis wird berechnet…
            </div>
          ) : price && !price.error ? (
            <>
              <div className="font-semibold text-slate-950">
                Gesamtpreis: {Number(price.total).toFixed(2)} €
              </div>
              <div className="mt-0.5 text-xs text-slate-500">
                {price.nights} Nacht{price.nights === 1 ? "" : "e"}, inklusive
                hinterlegter Nebenkosten.
              </div>

              {price.discountAmount > 0 && price.invoiceNote && (
                <div className="mt-2 flex items-start gap-2 rounded-lg bg-rose-50 p-2 text-xs leading-5 text-rose-800 ring-1 ring-rose-100">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{price.invoiceNote}</span>
                </div>
              )}
            </>
          ) : (
            <div className="text-xs text-slate-500">
              {price?.error ||
                "Bitte An- und Abreise wählen, um den Gesamtpreis zu sehen."}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={
            submitting ||
            !hasTravelDates ||
            !!price?.error ||
            !isFormValid
          }
          title={!isFormValid ? "Bitte alle Pflichtfelder ausfüllen." : undefined}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Sende…
            </>
          ) : requestType === "info" ? (
            "Informationsanfrage senden"
          ) : requestType === "booking" ? (
            "Buchungsanfrage senden"
          ) : (
            "Anfrage senden"
          )}
        </button>

        {message && (
          <div
            className={`inline-flex items-start gap-2 rounded-xl px-3 py-2 text-sm ${
              message.type === "ok"
                ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100"
                : "bg-rose-50 text-rose-800 ring-1 ring-rose-100"
            }`}
          >
            {message.type === "ok" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <p className="text-[11px] leading-5 text-slate-400">
          * Pflichtfelder. Auch eine Buchungsanfrage ist zunächst unverbindlich
          und stellt noch keine bestätigte Buchung dar.
        </p>
      </form>
    </div>
  );
}