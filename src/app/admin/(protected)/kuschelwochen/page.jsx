"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Save, X } from "lucide-react";

const field = "min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20";
const toRows = (periods) => periods.map((p) => ({ startDate: p.startDate.slice(0, 10), endDate: p.endDate.slice(0, 10) }));

export default function KuschelwochenPage() {
  const [periods, setPeriods] = useState([]);
  const [saved, setSaved] = useState("[]");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [message, setMessage] = useState(null);
  const dirty = JSON.stringify(periods) !== saved;

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/kuschelwochen", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        const rows = toRows(data.periods);
        setPeriods(rows); setSaved(JSON.stringify(rows)); setCanEdit(data.canEdit);
      })
      .catch((error) => { if (!controller.signal.aborted) setMessage({ error: true, text: error.message }); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event) => { event.preventDefault(); event.returnValue = ""; };
    const guard = (event) => {
      const link = event.target.closest("a[href]");
      if (link && link.target !== "_blank" && !window.confirm("Ungespeicherte Zeiträume verwerfen?")) { event.preventDefault(); event.stopPropagation(); }
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", guard, true);
    return () => { window.removeEventListener("beforeunload", warn); document.removeEventListener("click", guard, true); };
  }, [dirty]);

  async function save(event) {
    event.preventDefault();
    setBusy(true); setMessage(null);
    try {
      const response = await fetch("/api/admin/kuschelwochen", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ periods }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      const rows = toRows(data.periods);
      setPeriods(rows); setSaved(JSON.stringify(rows));
      setMessage({ text: "Zeiträume gespeichert. Anzeige und Preisberechnung verwenden jetzt diese Termine." });
    } catch (error) { setMessage({ error: true, text: error.message || "Speichern fehlgeschlagen." }); }
    finally { setBusy(false); }
  }

  function change(index, key, value) {
    setPeriods((current) => current.map((period, i) => i === index ? { ...period, [key]: value } : period));
    setMessage(null);
  }

  return (
    <main className="mx-auto max-w-4xl px-5 pb-32 pt-32">
      <Link href="/admin" className="inline-flex min-h-11 items-center gap-2 text-sm text-slate-500 hover:text-teal-800"><ArrowLeft className="h-4 w-4" />Verwaltung</Link>
      <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-teal-800">Angebote · Reisezeiträume</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Ostsee-Kuschelwochen</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">7 Nächte buchen, 6 bezahlen. Oder 14 Nächte buchen, 12 bezahlen. Diese Zeiträume gelten gemeinsam für alle Objekte, bei denen die Teilnahme aktiviert ist.</p>
      <div className="my-6 border-l-4 border-amber-400 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-950">Das Startdatum ist der früheste Anreisetag, das Enddatum der späteste Abreisetag. Der gesamte Aufenthalt muss in einen Aktionszeitraum passen. Nebenkosten werden für den tatsächlichen Aufenthalt berechnet.</div>
      {message && <p role={message.error ? "alert" : "status"} className={`mb-5 rounded-lg border p-4 text-sm ${message.error ? "border-red-200 bg-red-50 text-red-800" : "border-teal-200 bg-teal-50 text-teal-900"}`}>{message.text}</p>}
      {loading ? <p role="status">Zeiträume werden geladen …</p> : (
        <form onSubmit={save} className="rounded-xl border border-slate-200 bg-white p-5 sm:p-7">
          <div className="mb-6 flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">Aktionszeiträume</h2><span className="text-xs text-slate-500">{periods.length} hinterlegt</span></div>
          {!periods.length && <p className="mb-5 text-sm text-slate-500">Ohne Zeiträume wird kein Kuschelwochen-Rabatt angeboten.</p>}
          <fieldset disabled={!canEdit || busy} className="space-y-4 disabled:opacity-60">
            {periods.map((period, index) => (
              <div key={index} className="flex items-end gap-3 border-b border-slate-100 pb-4">
                <div className="grid flex-1 gap-3 sm:grid-cols-2">
                  <label className="grid gap-2 text-xs font-medium text-slate-600">Früheste Anreise<input aria-label={`Zeitraum ${index + 1}: früheste Anreise`} required type="date" className={field} value={period.startDate} onChange={(event) => change(index, "startDate", event.target.value)} /></label>
                  <label className="grid gap-2 text-xs font-medium text-slate-600">Späteste Abreise<input aria-label={`Zeitraum ${index + 1}: späteste Abreise`} required type="date" min={period.startDate || undefined} className={field} value={period.endDate} onChange={(event) => change(index, "endDate", event.target.value)} /></label>
                </div>
                <button type="button" aria-label={`Zeitraum ${index + 1} entfernen`} onClick={() => setPeriods((current) => current.filter((_, i) => i !== index))} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-700"><X className="h-4 w-4" /></button>
              </div>
            ))}
            {canEdit && <button type="button" onClick={() => setPeriods((current) => [...current, { startDate: "", endDate: "" }])} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-teal-800"><Plus className="h-4 w-4" />Zeitraum hinzufügen</button>}
          </fieldset>
          {canEdit ? <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-5"><span className="text-xs text-slate-500">{dirty ? "Ungespeicherte Änderungen" : "Alle Änderungen gespeichert"}</span><button type="submit" disabled={busy || !dirty} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-teal-800 px-5 text-sm font-semibold text-white disabled:opacity-50"><Save className="h-4 w-4" />{busy ? "Wird gespeichert …" : "Zeiträume speichern"}</button></div> : <p className="mt-5 text-xs text-slate-500">Zum Bearbeiten ist die Berechtigung „Preiszeiten bearbeiten“ erforderlich.</p>}
        </form>
      )}
    </main>
  );
}
