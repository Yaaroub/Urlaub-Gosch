"use client";

import { useRef, useState } from "react";

export default function ContactForm({ children }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const pending = useRef(false);
  const submissionId = useRef(null);
  const resultRef = useRef(null);
  async function submit(event) {
    event.preventDefault();
    if (pending.current) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    submissionId.current ||= crypto.randomUUID();
    const body = Object.fromEntries(fields);
    body.privacyAccepted = fields.has("privacyAccepted");
    body.isLandlordProspect = fields.has("isLandlordProspect");
    body.submissionId = submissionId.current;
    pending.current = true;
    setBusy(true); setResult(null);
    let invalidField;
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) {
        invalidField = data.field;
        throw new Error(data.error || "Versand fehlgeschlagen. Bitte versuchen Sie es erneut.");
      }
      setResult({ ok: true, text: "Vielen Dank! Ihre Nachricht wurde übermittelt. Wir melden uns bei Ihnen." });
      form.reset(); submissionId.current = null;
    } catch (error) { setResult({ ok: false, text: error.message === "Failed to fetch" ? "Verbindung unterbrochen. Bitte versuchen Sie es erneut." : error.message }); }
    finally {
      pending.current = false; setBusy(false);
      // Wait until React has re-enabled the form before focusing the invalid field.
      requestAnimationFrame(() => {
        const input = invalidField && form.elements.namedItem(invalidField);
        if (input instanceof HTMLElement) input.focus();
        else resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    }
  }
  return <form method="post" action="/api/contact" onSubmit={submit} className="grid gap-5" aria-busy={busy}>
    <fieldset disabled={busy} className="grid min-w-0 gap-5">
      <label hidden aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" data-1p-ignore="true" data-lpignore="true" /></label>
      {children}
      <button type="submit" className="rounded-full bg-[#07131f] px-7 py-4 text-sm font-bold text-white disabled:opacity-60 sm:w-fit">{busy ? "Wird gesendet …" : "Anfrage senden"}</button>
    </fieldset>
    {result && <p ref={resultRef} role={result.ok ? "status" : "alert"} className={`rounded-xl p-4 text-sm ${result.ok ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-900"}`}>{result.text}</p>}
  </form>;
}
