"use client";
import { useEffect, useState } from "react";

/** ---- Helpers ---- */
const jsonOrEmpty = async (res) => {
  if (res.status === 401) { window.location.href = "/admin"; return []; }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : [];
};
const toCents = (eurString) => {
  const n = Number(String(eurString).replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) : NaN;
};
const fromCents = (cents) => (Number(cents) / 100);

/** ---- Page ---- */
export default function FeesPage() {
  const [properties, setProperties] = useState([]);
  const [propertyId, setPropertyId] = useState("");
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ id: null, name: "", kind: "FIXED", amount: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  /** Properties laden */
  useEffect(() => {
    (async () => {
      const r = await fetch("/api/admin/properties", { cache: "no-store" });
      setProperties(await jsonOrEmpty(r));
    })();
  }, []);

  /** Fees laden */
  async function loadFees(pid) {
    if (!pid) { setItems([]); return; }
    const r = await fetch(`/api/admin/fees?propertyId=${pid}`, { cache: "no-store" });
    const raw = await jsonOrEmpty(r); // API liefert Cent
    // Fürs UI in EUR umrechnen
    const data = Array.isArray(raw) ? raw.map(x => ({ ...x, amountEur: fromCents(x.amount) })) : [];
    setItems(data);
  }
  useEffect(() => { loadFees(propertyId); }, [propertyId]);

  /** Speichern (neu/ändern) */
  async function save(e) {
    e.preventDefault();
    setMsg(null);
    if (!propertyId) { setMsg({ t:"error", m:"Bitte zuerst eine Unterkunft wählen." }); return; }

    const cents = toCents(form.amount);
    if (!Number.isFinite(cents)) { setMsg({ t:"error", m:"Bitte gültigen Betrag eingeben." }); return; }

    const payload = {
      propertyId: Number(propertyId),
      name: form.name.trim(),
      kind: form.kind,            // "FIXED" | "PER_NIGHT"
      amount: cents,              // <-- Cent an API senden
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
      if (res.status === 401) { window.location.href = "/admin"; return; }
      if (!res.ok) {
        const t = await res.text();
        setMsg({ t:"error", m:`Speichern fehlgeschlagen: ${t}` });
        return;
      }
      setForm({ id: null, name: "", kind: "FIXED", amount: "" });
      await loadFees(propertyId);
      setMsg({ t:"ok", m:"Gespeichert." });
    } catch {
      setMsg({ t:"error", m:"Netzwerkfehler beim Speichern." });
    } finally {
      setBusy(false);
    }
  }

  /** Löschen */
  async function remove(id) {
    setMsg(null);
    if (!confirm("Diesen Eintrag wirklich löschen?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/fees/${id}`, { method: "DELETE" });
      if (res.status === 401) { window.location.href = "/admin"; return; }
      if (!res.ok) {
        const t = await res.text();
        setMsg({ t:"error", m:`Löschen fehlgeschlagen: ${t}` });
        return;
      }
      setItems(prev => prev.filter(i => i.id !== id));
      setMsg({ t:"ok", m:"Gelöscht." });
    } catch {
      setMsg({ t:"error", m:"Netzwerkfehler beim Löschen." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <h1 className="text-2xl font-semibold">Nebenkosten</h1>
        <div className="sm:ml-auto flex items-center gap-3">
          <label className="text-sm">Objekt</label>
          <select
            className="border rounded-xl px-3 py-2"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
          >
            <option value="">— Objekt wählen —</option>
            {properties?.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
          {msg && (
            <span className={`text-xs ${msg.t === "ok" ? "text-emerald-700" : "text-rose-700"}`}>
              {msg.m}
            </span>
          )}
        </div>
      </div>

      {/* Formular */}
      <form
        onSubmit={save}
        className="grid md:grid-cols-4 gap-3 bg-white p-4 rounded-2xl ring-1 ring-black/5 mb-6"
      >
        <input
          className="border rounded-xl px-3 py-2"
          placeholder="Name (z. B. Endreinigung)"
          value={form.name}
          onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
        />
        <select
          className="border rounded-xl px-3 py-2"
          value={form.kind}
          onChange={(e) => setForm(f => ({ ...f, kind: e.target.value }))}
        >
          <option value="FIXED">Einmalig</option>
          <option value="PER_NIGHT">Pro Nacht</option>
        </select>
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          className="border rounded-xl px-3 py-2"
          placeholder="Betrag in € (z. B. 49,00)"
          value={form.amount}
          onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
        />
        <button
          disabled={busy || !propertyId}
          className="rounded-xl px-4 py-2 bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-60"
        >
          {form.id ? "Aktualisieren" : "Hinzufügen"}
        </button>
      </form>

      {/* Liste */}
      <div className="bg-white p-4 rounded-2xl ring-1 ring-black/5 overflow-x-auto">
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">Keine Nebenkosten hinterlegt.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="text-left py-2">Name</th>
                <th className="text-left">Art</th>
                <th className="text-left">Betrag</th>
                <th className="w-24"></th>
              </tr>
            </thead>
            <tbody>
              {items.map(i => (
                <tr key={i.id} className="border-t">
                  <td className="py-2">{i.name}</td>
                  <td>{i.kind === "FIXED" ? "Einmalig" : "pro Nacht"}</td>
                  <td>{fromCents(i.amount).toFixed(2)} €</td>
                  <td className="text-right">
                    <button
                      className="text-sky-700 mr-3"
                      onClick={() =>
                        setForm({
                          id: i.id,
                          name: i.name,
                          kind: i.kind,
                          amount: fromCents(i.amount).toFixed(2), // EUR ins Formular
                        })
                      }
                    >
                      Bearbeiten
                    </button>
                    <button className="text-rose-700" onClick={() => remove(i.id)}>
                      Löschen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
