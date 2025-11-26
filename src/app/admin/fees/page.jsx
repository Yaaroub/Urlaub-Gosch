"use client";
import { useEffect, useState } from "react";

/** ---- Helpers ---- */
const jsonOrEmpty = async (res) => {
  if (res.status === 401) {
    window.location.href = "/admin";
    return [];
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : [];
};

const toCents = (eurString) => {
  const n = Number(String(eurString).replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) : NaN;
};

const fromCents = (cents) => Number(cents) / 100;

/** ---- Page ---- */
export default function FeesPage() {
  const [properties, setProperties] = useState([]);
  const [propertyId, setPropertyId] = useState("");
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    id: null,
    name: "",
    kind: "FIXED",
    amount: "",
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { t: "ok" | "error", m: string }
  const [pendingDelete, setPendingDelete] = useState(null); // Eintrag zum Löschen

  /** Properties laden */
  useEffect(() => {
    (async () => {
      const r = await fetch("/api/admin/properties", { cache: "no-store" });
      setProperties(await jsonOrEmpty(r));
    })();
  }, []);

  /** Fees laden */
  async function loadFees(pid) {
    if (!pid) {
      setItems([]);
      return;
    }
    const r = await fetch(`/api/admin/fees?propertyId=${pid}`, {
      cache: "no-store",
    });
    const raw = await jsonOrEmpty(r); // API liefert Cent
    const data = Array.isArray(raw) ? raw : [];
    setItems(data);
  }

  useEffect(() => {
    loadFees(propertyId);
  }, [propertyId]);

  /** Speichern (neu/ändern) */
  async function save(e) {
    e.preventDefault();
    setMsg(null);
    if (!propertyId) {
      setMsg({ t: "error", m: "Bitte zuerst eine Unterkunft wählen." });
      return;
    }

    const cents = toCents(form.amount);
    if (!Number.isFinite(cents)) {
      setMsg({ t: "error", m: "Bitte gültigen Betrag eingeben." });
      return;
    }

    const payload = {
      propertyId: Number(propertyId),
      name: form.name.trim(),
      kind: form.kind, // "FIXED" | "PER_NIGHT"
      amount: cents, // Cent an API senden
    };

    const url = form.id ? `/api/admin/fees/${form.id}` : `/api/admin/fees`;
    const method = form.id ? "PUT" : "POST";

    setBusy(true);
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 401) {
        window.location.href = "/admin";
        return;
      }
      if (!res.ok) {
        const t = await res.text();
        setMsg({ t: "error", m: `Speichern fehlgeschlagen: ${t}` });
        return;
      }
      setForm({ id: null, name: "", kind: "FIXED", amount: "" });
      await loadFees(propertyId);
      setMsg({ t: "ok", m: "Nebenkosten wurden gespeichert." });
    } catch {
      setMsg({ t: "error", m: "Netzwerkfehler beim Speichern." });
    } finally {
      setBusy(false);
    }
  }

  /** Delete starten (Dialog öffnen) */
  function askDelete(item) {
    setMsg(null);
    setPendingDelete(item);
  }

  /** Delete bestätigen */
  async function confirmDelete() {
    if (!pendingDelete) return;
    const id = pendingDelete.id;

    setBusy(true);
    try {
      const res = await fetch(`/api/admin/fees/${id}`, { method: "DELETE" });
      if (res.status === 401) {
        window.location.href = "/admin";
        return;
      }
      if (!res.ok) {
        const t = await res.text();
        setMsg({ t: "error", m: `Löschen fehlgeschlagen: ${t}` });
        setPendingDelete(null);
        return;
      }
      setItems((prev) => prev.filter((i) => i.id !== id));
      setMsg({ t: "ok", m: "Nebenkosten-Eintrag wurde gelöscht." });
      setPendingDelete(null);
    } catch {
      setMsg({ t: "error", m: "Netzwerkfehler beim Löschen." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 md:py-10 relative">
      {/* Messages oben als Banner */}
      <div className="mb-4 space-y-2">
        {msg && msg.t === "error" && (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            <span>{msg.m}</span>
            <button
              type="button"
              className="text-xs text-rose-500"
              onClick={() => setMsg(null)}
            >
              Schließen
            </button>
          </div>
        )}
        {msg && msg.t === "ok" && (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            <span>{msg.m}</span>
            <button
              type="button"
              className="text-xs text-emerald-600"
              onClick={() => setMsg(null)}
            >
              Schließen
            </button>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
            Admin · Nebenkosten
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Nebenkosten verwalten
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Endreinigung, Kurtaxe oder weitere Zusatzkosten für das ausgewählte
            Objekt pflegen.
          </p>
        </div>

        <div className="sm:ml-auto flex items-center gap-3">
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-700 mb-1">
              Objekt
            </label>
            <select
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
            >
              <option value="">— Objekt wählen —</option>
              {properties?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Formular */}
      <form
        onSubmit={save}
        className="mb-6 grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-black/5 md:grid-cols-4"
      >
        <input
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/60 md:col-span-2"
          placeholder="Name (z. B. Endreinigung)"
          value={form.name}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              name: e.target.value,
            }))
          }
        />
        <select
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
          value={form.kind}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              kind: e.target.value,
            }))
          }
        >
          <option value="FIXED">Einmalig</option>
          <option value="PER_NIGHT">Pro Nacht</option>
        </select>
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
            placeholder="Betrag in € (z. B. 49,00)"
            value={form.amount}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                amount: e.target.value,
              }))
            }
          />
        </div>
        <button
          disabled={busy || !propertyId}
          className="mt-1 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/70 disabled:opacity-60 md:col-span-1"
        >
          {form.id ? "Aktualisieren" : "Hinzufügen"}
        </button>
      </form>

      {/* Liste */}
      <div className="overflow-x-auto rounded-2xl bg-white p-4 ring-1 ring-black/5">
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">
            Keine Nebenkosten hinterlegt. Lege oben einen neuen Eintrag an.
          </p>
        ) : (
          <table className="w-full min-w-[480px] text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="py-2 text-left">Name</th>
                <th className="text-left">Art</th>
                <th className="text-left">Betrag</th>
                <th className="w-32 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id} className="border-t border-slate-100">
                  <td className="py-2">{i.name}</td>
                  <td>{i.kind === "FIXED" ? "Einmalig" : "pro Nacht"}</td>
                  <td>{fromCents(i.amount).toFixed(2)} €</td>
                  <td className="py-2 text-right">
                    <button
                      type="button"
                      className="mr-3 text-xs font-semibold text-sky-700 hover:text-sky-800"
                      onClick={() =>
                        setForm({
                          id: i.id,
                          name: i.name,
                          kind: i.kind,
                          amount: fromCents(i.amount).toFixed(2),
                        })
                      }
                    >
                      Bearbeiten
                    </button>
                    <button
                      type="button"
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                      onClick={() => askDelete(i)}
                    >
                      Löschen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Lösch-Dialog (statt confirm) */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <h4 className="text-sm font-semibold text-slate-900">
              Nebenkosten-Eintrag löschen?
            </h4>
            <p className="mt-2 text-sm text-slate-600">
              Eintrag:{" "}
              <span className="font-medium">{pendingDelete.name}</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Betrag: {fromCents(pendingDelete.amount).toFixed(2)} € (
              {pendingDelete.kind === "FIXED" ? "einmalig" : "pro Nacht"}).
            </p>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-60"
                disabled={busy}
              >
                Ja, löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
