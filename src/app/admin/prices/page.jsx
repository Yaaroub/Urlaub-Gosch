"use client";
import { useEffect, useMemo, useState } from "react";

export default function PriceEditorPage() {
  const [properties, setProperties] = useState([]);
  const [propertyId, setPropertyId] = useState("");
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ id: null, startDate: "", endDate: "", pricePerNight: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  // Beim Mount: optionales ?propertyId= übernehmen
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const pid = sp.get("propertyId");
    if (pid) setPropertyId(pid);
  }, []);

  // Properties laden (für Dropdown)
  useEffect(() => {
    fetch("/api/admin/properties")
      .then((r) => r.json())
      .then(setProperties)
      .catch(() => setProperties([]));
  }, []);

  // Preiszeiten laden, wenn Property gewählt
  useEffect(() => {
    if (!propertyId) return;
    setLoading(true);
    fetch(`/api/admin/price-periods?propertyId=${propertyId}`)
      .then((r) => r.json())
      .then(setItems)
      .finally(() => setLoading(false));
  }, [propertyId]);

  const currentTitle = useMemo(
    () => properties.find((p) => p.id === Number(propertyId))?.title || "",
    [propertyId, properties]
  );

  function edit(pp) {
    setForm({
      id: pp?.id ?? null,
      startDate: pp ? pp.startDate.slice(0, 10) : "",
      endDate: pp ? pp.endDate.slice(0, 10) : "",
      pricePerNight: pp ? String(pp.pricePerNight) : "",
    });
    setMsg(null);
  }
  function resetForm() {
    setForm({ id: null, startDate: "", endDate: "", pricePerNight: "" });
    setMsg(null);
  }

  async function reloadList(pid = propertyId) {
    const fresh = await fetch(`/api/admin/price-periods?propertyId=${pid}`).then((r) => r.json());
    setItems(fresh);
  }

  async function save(e) {
    e.preventDefault();
    if (!propertyId) return setMsg({ type: "error", text: "Bitte zuerst ein Objekt wählen." });

    const payload = {
      propertyId: Number(propertyId),
      startDate: form.startDate,
      endDate: form.endDate,
      pricePerNight: Number(form.pricePerNight),
    };

    setLoading(true);
    setMsg(null);
    try {
      let res;
      if (form.id) {
        res = await fetch(`/api/admin/price-periods/${form.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/admin/price-periods`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      const data = res.status === 204 ? {} : await res.json();

      if (!res.ok) {
        const conflictInfo = data?.conflict
          ? ` (Konflikt: ${data.conflict.startDate?.slice(0, 10)} → ${data.conflict.endDate?.slice(0, 10)})`
          : "";
        setMsg({ type: "error", text: (data.error || "Fehler beim Speichern.") + conflictInfo });
      } else {
        setMsg({ type: "ok", text: form.id ? "Aktualisiert." : "Hinzugefügt." });
        resetForm();
        await reloadList();
      }
    } catch {
      setMsg({ type: "error", text: "Netzwerkfehler." });
    } finally {
      setLoading(false);
    }
  }

  async function remove(id) {
    if (!confirm("Diese Preiszeit wirklich löschen?")) return;
    setLoading(true);
    setMsg(null);
    try {
      await fetch(`/api/admin/price-periods/${id}`, { method: "DELETE" });
      await reloadList();
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">Preiszeiten</h1>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <label className="text-sm">Objekt</label>
        <select
          className="border rounded-xl px-3 py-2"
          value={propertyId}
          onChange={(e) => {
            setPropertyId(e.target.value);
            resetForm();
          }}
        >
          <option value="">— wählen —</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
        {currentTitle && <span className="text-xs text-slate-500">({currentTitle})</span>}
        {!!propertyId && (
          <a
            className="text-xs underline text-sky-700"
            href={`/admin/properties`}
            title="Zur Objektliste"
          >
            Objekt wechseln
          </a>
        )}
      </div>

      {/* Formular */}
      <form
        onSubmit={save}
        className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-4 mb-6 grid md:grid-cols-4 gap-4"
      >
        <div>
          <label className="block text-xs text-slate-500 mb-1">Start (inkl.)</label>
          <input
            type="date"
            className="border rounded-xl px-3 py-2 w-full"
            value={form.startDate}
            onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Ende (exkl.)</label>
          <input
            type="date"
            className="border rounded-xl px-3 py-2 w-full"
            value={form.endDate}
            onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Preis/Nacht (€)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="border rounded-xl px-3 py-2 w-full"
            value={form.pricePerNight}
            onChange={(e) => setForm((f) => ({ ...f, pricePerNight: e.target.value }))}
          />
        </div>
        <div className="flex items-end gap-2">
          <button
            disabled={loading || !propertyId}
            className="rounded-xl px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm disabled:opacity-60"
          >
            {form.id ? "Aktualisieren" : "Hinzufügen"}
          </button>
          {form.id && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl px-4 py-2 border text-sm"
            >
              Abbrechen
            </button>
          )}
        </div>
        {msg && (
          <div
            className={`md:col-span-4 text-sm ${
              msg.type === "ok" ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            {msg.text}
          </div>
        )}
      </form>

      {/* Liste */}
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-4">
        {loading && <p className="text-sm text-slate-500">Laden…</p>}
        {!loading && items.length === 0 && (
          <p className="text-sm text-slate-500">Keine Preiszeiten.</p>
        )}

        {items.length > 0 && (
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="py-2">Start</th>
                <th className="py-2">Ende (exkl.)</th>
                <th className="py-2">Preis/Nacht</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((pp) => (
                <tr key={pp.id} className="border-t">
                  <td className="py-2">{pp.startDate.slice(0, 10)}</td>
                  <td className="py-2">{pp.endDate.slice(0, 10)}</td>
                  <td className="py-2">{Number(pp.pricePerNight).toFixed(2)} €</td>
                  <td className="py-2 text-right">
                    <button
                      onClick={() => edit(pp)}
                      className="mr-2 text-sky-700 hover:underline"
                    >
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => remove(pp.id)}
                      className="text-rose-700 hover:underline"
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
    </section>
  );
}
