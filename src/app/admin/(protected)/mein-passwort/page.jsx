"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, KeyRound } from "lucide-react";

const field =
  "min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20";

export default function OwnPasswordPage() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const newPassword = String(data.get("newPassword") || "");

    if (newPassword !== String(data.get("repeat") || "")) {
      setMessage({ error: true, text: "Die beiden neuen Passwörter stimmen nicht überein." });
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/mein-passwort", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: String(data.get("currentPassword") || ""), newPassword }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Passwort konnte nicht geändert werden.");
      form.reset();
      setMessage({ text: "Passwort geändert. Alle anderen Geräte wurden abgemeldet." });
    } catch (error) {
      setMessage({ error: true, text: error.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:px-6">
      <Link href="/admin" className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-slate-600 hover:text-teal-800">
        <ArrowLeft className="h-4 w-4" /> Admin-Übersicht
      </Link>

      <header className="mb-6 mt-3 border-b border-slate-200 pb-5">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-950">
          <KeyRound className="h-6 w-6 text-teal-800" aria-hidden="true" /> Eigenes Passwort ändern
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Mindestens 10 Zeichen. Nach dem Ändern werden alle anderen Geräte abgemeldet; dieser Browser bleibt angemeldet.
        </p>
      </header>

      <form onSubmit={submit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <label className="block text-sm font-medium text-slate-700">
          Aktuelles Passwort
          <input name="currentPassword" type="password" required autoComplete="current-password" className={`mt-1 ${field}`} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Neues Passwort
          <input name="newPassword" type="password" required minLength={10} maxLength={72} autoComplete="new-password" className={`mt-1 ${field}`} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Neues Passwort wiederholen
          <input name="repeat" type="password" required minLength={10} maxLength={72} autoComplete="new-password" className={`mt-1 ${field}`} />
        </label>

        {message ? (
          <p role="status" className={`rounded-lg p-3 text-sm ${message.error ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-800"}`}>
            {message.text}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="inline-flex min-h-11 items-center rounded-lg bg-teal-800 px-5 text-sm font-semibold text-white hover:bg-teal-900 disabled:opacity-50"
        >
          {busy ? "Wird gespeichert …" : "Passwort ändern"}
        </button>
      </form>
    </div>
  );
}
