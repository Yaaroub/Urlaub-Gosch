// src/components/BookingBox.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import StayDatePicker from "@/components/StayDatePicker";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
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
          website: new FormData(e.target).get("website") || "",
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

  const submitLabel =
    requestType === "info"
      ? "Informationsanfrage senden"
      : requestType === "booking"
        ? "Buchungsanfrage senden"
        : "Anfrage senden";

  return (
    <form method="post" action="/api/booking-request" onSubmit={submit} className="grid gap-6">
      <label aria-hidden="true" className="absolute -left-[10000px]">Website<input name="website" type="text" tabIndex={-1} autoComplete="off" /></label>

      {/* 1 – Art der Anfrage */}
      <Step number={1} title="Was möchten Sie?">
        <fieldset>
          <legend className="sr-only">Art der Anfrage (Pflichtfeld)</legend>
          <div className="grid grid-cols-2 gap-2">
            <ChoiceCard
              name="requestType"
              value="info"
              checked={requestType === "info"}
              onChange={setRequestType}
              title="Information"
              hint="Fragen zur Unterkunft"
            />
            <ChoiceCard
              name="requestType"
              value="booking"
              checked={requestType === "booking"}
              onChange={setRequestType}
              title="Buchung"
              hint="Zeitraum anfragen"
            />
          </div>
        </fieldset>
      </Step>

      {/* 2 – Reisezeitraum */}
      <Step number={2} title="Reisezeitraum">
        <StayDatePicker
          propertyId={propertyId}
          arrival={arrival}
          departure={departure}
          onChange={({ arrival: nextArrival, departure: nextDeparture }) => {
            setArrival(nextArrival);
            setDeparture(nextDeparture);
          }}
        />
      </Step>

      {/* 3 – Reisende */}
      <Step number={3} title="Reisende">
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
          <CounterRow label="Erwachsene" value={adults} min={1} max={30} onChange={setAdults} />
          <CounterRow label="Kinder" value={children} min={0} max={30} onChange={setChildren} />
          <div className="grid gap-2 px-3 py-3">
            <span id="pets-label" className="text-sm font-medium text-slate-800">Hund dabei? *</span>
            <div role="radiogroup" aria-labelledby="pets-label" className="grid grid-cols-2 gap-2">
              {[
                ["no", "Nein"],
                ["yes", "Ja"],
              ].map(([value, label]) => (
                <label
                  key={value}
                  className={`cursor-pointer rounded-lg border px-3 py-2 text-center text-sm font-medium transition ${
                    pets === value
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="pets"
                    value={value}
                    checked={pets === value}
                    onChange={() => {
                      setPets(value);
                      setDogCount(value === "yes" ? "1" : "0");
                    }}
                    className="sr-only"
                    required
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
          {pets === "yes" && (
            <CounterRow label="Anzahl Hunde" value={dogCount} min={1} max={10} onChange={setDogCount} />
          )}
        </div>
      </Step>

      {/* 4 – Kontaktdaten */}
      <Step number={4} title="Ihre Kontaktdaten">
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Vorname">
              <input type="text" autoComplete="given-name" className={inputClass} value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </Field>
            <Field label="Nachname">
              <input type="text" autoComplete="family-name" className={inputClass} value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </Field>
          </div>
          <Field label="E-Mail-Adresse">
            <input type="email" autoComplete="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@beispiel.de" required />
          </Field>
          <Field label="Mobilnummer">
            <input type="tel" inputMode="tel" autoComplete="tel" className={inputClass} value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="+49 …" required />
          </Field>
          <Field label="Straße und Hausnummer">
            <input type="text" autoComplete="street-address" className={inputClass} value={street} onChange={(e) => setStreet(e.target.value)} required />
          </Field>
          <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3">
            <Field label="PLZ">
              <input type="text" inputMode="numeric" autoComplete="postal-code" className={inputClass} value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required />
            </Field>
            <Field label="Ort">
              <input type="text" autoComplete="address-level2" className={inputClass} value={city} onChange={(e) => setCity(e.target.value)} required />
            </Field>
          </div>
        </div>
      </Step>

      {/* 5 – Nachricht */}
      <Step number={5} title="Nachricht" optional>
        <textarea
          aria-label="Nachricht (optional)"
          className={`${inputClass} min-h-[88px] resize-y`}
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Fragen oder besondere Wünsche …"
        />
      </Step>

      {/* Zusammenfassung und Absenden */}
      <div className="grid gap-3 border-t border-slate-200 pt-5">
        <div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
          {loadingPrice ? (
            <div className="inline-flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Preis wird berechnet …
            </div>
          ) : price && !price.error ? (
            <>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm text-slate-600">
                  {price.nights} {price.nights === 1 ? "Nacht" : "Nächte"}
                </span>
                <span className="text-lg font-semibold tabular-nums text-slate-950">
                  {Number(price.total).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">inklusive hinterlegter Nebenkosten</p>
              {price.discountAmount > 0 && price.invoiceNote && (
                <div className="mt-2 flex items-start gap-2 rounded-lg bg-rose-50 p-2 text-xs leading-5 text-rose-800 ring-1 ring-rose-100">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{price.invoiceNote}</span>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-500">
              {price?.error || "Der Gesamtpreis erscheint, sobald An- und Abreise gewählt sind."}
            </p>
          )}
        </div>

        <p className="text-xs leading-5 text-slate-500">
          Ihre Angaben verwenden wir nur zur Bearbeitung Ihrer Anfrage. Mehr in der{" "}
          <a href="/datenschutz#kontakt" className="underline underline-offset-2 hover:text-slate-700">
            Datenschutzerklärung
          </a>
          .
        </p>

        <button
          type="submit"
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          disabled={submitting || !hasTravelDates || !!price?.error || !isFormValid}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Wird gesendet …
            </>
          ) : (
            submitLabel
          )}
        </button>

        {!isFormValid && !submitting && (
          <p className="text-center text-xs text-slate-500">
            {missingHint({ requestType, arrival, departure, pets, firstName, lastName, email, mobile, street, postalCode, city })}
          </p>
        )}

        {message && (
          <div
            role={message.type === "ok" ? "status" : "alert"}
            className={`flex items-start gap-2 rounded-xl px-3 py-2 text-sm ${
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
          Alle Felder außer der Nachricht sind Pflichtfelder. Auch eine Buchungsanfrage ist zunächst unverbindlich und stellt noch keine bestätigte Buchung dar.
        </p>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Bausteine                                                           */
/* ------------------------------------------------------------------ */

function Step({ number, title, optional = false, children }) {
  return (
    <section className="grid gap-3">
      <h4 className="flex items-center gap-2.5 text-sm font-semibold text-slate-900">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">
          {number}
        </span>
        {title}
        {optional && <span className="text-xs font-normal text-slate-400">(optional)</span>}
      </h4>
      {children}
    </section>
  );
}

function ChoiceCard({ name, value, checked, onChange, title, hint }) {
  return (
    <label
      className={`cursor-pointer rounded-xl border px-3 py-3 text-center transition ${
        checked
          ? "border-slate-900 bg-slate-900 text-white shadow-sm"
          : "border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
        required
      />
      <span className="block text-sm font-semibold">{title}</span>
      <span className={`mt-0.5 block text-[11px] ${checked ? "text-slate-300" : "text-slate-500"}`}>{hint}</span>
    </label>
  );
}

function Field({ label, children }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-medium text-slate-700">{label} *</span>
      {children}
    </label>
  );
}

function CounterRow({ label, value, min, max, onChange }) {
  const number = Number(value) || 0;
  const buttonClass =
    "flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-lg leading-none text-slate-700 transition hover:border-slate-900 hover:text-slate-900 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300";
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5">
      <span className="text-sm font-medium text-slate-800">{label}</span>
      <div className="flex items-center gap-3">
        <button type="button" className={buttonClass} aria-label={`${label} verringern`} disabled={number <= min} onClick={() => onChange(String(Math.max(min, number - 1)))}>
          −
        </button>
        <span className="w-6 text-center text-sm font-semibold tabular-nums text-slate-950" aria-live="polite">
          {number}
        </span>
        <button type="button" className={buttonClass} aria-label={`${label} erhöhen`} disabled={number >= max} onClick={() => onChange(String(Math.min(max, number + 1)))}>
          +
        </button>
      </div>
    </div>
  );
}

function missingHint({ requestType, arrival, departure, pets, firstName, lastName, email, mobile, street, postalCode, city }) {
  if (!requestType) return "Bitte zuerst wählen: Information oder Buchung.";
  if (!arrival || !departure) return "Bitte An- und Abreise im Kalender wählen.";
  if (!pets) return "Bitte angeben, ob ein Hund mitreist.";
  if (![firstName, lastName, email, mobile, street, postalCode, city].every((v) => v.trim())) {
    return "Bitte Ihre Kontaktdaten vollständig ausfüllen.";
  }
  return "Bitte prüfen Sie Ihre Angaben.";
}
