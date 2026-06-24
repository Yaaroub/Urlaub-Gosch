// src/app/admin/properties/[id]/ExtrasForm.jsx
"use client";

import { useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";

function fromCents(cents) {
  if (cents == null) return "";
  const n = Number(cents) / 100;
  if (!Number.isFinite(n)) return "";
  return n.toFixed(2); // "49.00"
}

function toCents(eurString) {
  const n = Number(String(eurString).replace(",", "."));
  if (!Number.isFinite(n)) return NaN;
  return Math.round(n * 100);
}

export default function ExtrasForm({ propertyId, initialExtras }) {
  const [extras, setExtras] = useState(
    (initialExtras || []).map((e) => ({
      id: e.id ?? null,
      title: e.title ?? "",
      amountEur: fromCents(e.amount),
      isDaily: !!e.isDaily,
    }))
  );
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // {type:"ok"|"error", text:string}

  function updateRow(idx, patch) {
    setExtras((list) =>
      list.map((row, i) => (i === idx ? { ...row, ...patch } : row))
    );
  }

  function addExtra() {
    setMsg(null);
    setExtras((list) => [
      ...list,
      { id: null, title: "", amountEur: "", isDaily: false },
    ]);
  }

  function removeExtra(idx) {
    setMsg(null);
    setExtras((list) => list.filter((_, i) => i !== idx));
  }

  async function save() {
    setMsg(null);
    setBusy(true);

    try {
      // Validierung & Cent-Umrechnung
      const payload = [];
      for (const e of extras) {
        const title = e.title.trim();
        if (!title) continue; // leere Zeilen ignorieren

        const cents = toCents(e.amountEur);
        if (!Number.isFinite(cents)) {
          setMsg({
            type: "error",
            text: `Ungültiger Betrag bei "${title}".`,
          });
          setBusy(false);
          return;
        }

        payload.push({
          id: e.id ?? undefined,
          title,
          amount: cents,
          isDaily: !!e.isDaily,
        });
      }

      const res = await fetch(
        `/api/admin/properties/${propertyId}/extras`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (res.status === 401) {
        window.location.href = "/admin";
        return;
      }

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMsg({
          type: "error",
          text: data?.error || "Speichern fehlgeschlagen.",
        });
        return;
      }

      // Server gibt idealerweise die aktuellen Extras zurück
      const fresh = Array.isArray(data) ? data : payload;
      setExtras(
        fresh.map((e) => ({
          id: e.id ?? null,
          title: e.title ?? "",
          amountEur: fromCents(e.amount),
          isDaily: !!e.isDaily,
        }))
      );

      setMsg({ type: "ok", text: "Nebenkosten gespeichert." });
    } catch {
      setMsg({
        type: "error",
        text: "Netzwerkfehler beim Speichern.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Nebenkosten / Extras
          </h3>
          <p className="text-xs text-slate-500">
            Z. B. Endreinigung, Bettwäsche, Handtücher – Beträge in&nbsp;€.
          </p>
        </div>
        <button
          type="button"
          onClick={addExtra}
          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-800 shadow-sm hover:bg-slate-100"
        >
          <Plus className="h-3 w-3" />
          Position hinzufügen
        </button>
      </div>

      {msg && (
        <div
          className={`mb-3 rounded-xl px-3 py-2 text-xs ${
            msg.type === "ok"
              ? "border border-emerald-300 bg-emerald-50 text-emerald-700"
              : "border border-rose-300 bg-rose-50 text-rose-700"
          }`}
        >
          {msg.text}
        </div>
      )}

      {extras.length === 0 ? (
        <p className="mb-3 text-sm text-slate-500">
          Noch keine Nebenkosten hinterlegt. Füge eine Position hinzu.
        </p>
      ) : (
        <div className="mb-4 space-y-2">
          {extras.map((e, idx) => (
            <div
              key={idx}
              className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]"
            >
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-slate-500">
                  Bezeichnung
                </label>
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                  value={e.title}
                  placeholder="z. B. Endreinigung"
                  onChange={(ev) =>
                    updateRow(idx, { title: ev.target.value })
                  }
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-slate-500">
                  Betrag in €
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                  value={e.amountEur}
                  onChange={(ev) =>
                    updateRow(idx, { amountEur: ev.target.value })
                  }
                  placeholder="z. B. 49,00"
                />
              </div>

              <div className="flex items-center justify-between gap-2 md:flex-col md:items-end md:justify-center">
                <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={e.isDaily}
                    onChange={(ev) =>
                      updateRow(idx, { isDaily: ev.target.checked })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span>pro Nacht</span>
                </label>

                <button
                  type="button"
                  onClick={() => removeExtra(idx)}
                  className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1 text-[11px] font-medium text-white shadow-sm hover:bg-rose-700"
                >
                  <Trash2 className="h-3 w-3" />
                  Entfernen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-slate-500">
          Hinweis: Beträge werden als feste Nebenkosten je Buchung gespeichert.
        </p>
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          Nebenkosten speichern
        </button>
      </div>
    </div>
  );
}
