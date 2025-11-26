"use client";
import { useEffect, useMemo, useState } from "react";
import { Plus, Save, Trash2, PencilLine, RefreshCcw } from "lucide-react";

function toISO(d) {
  if (!d) return "";
  const x = new Date(d);
  if (isNaN(+x)) return "";
  const off = x.getTimezoneOffset(); // Date-Inputs erwarten Local-Zeit → wir zeigen YYYY-MM-DD
  const local = new Date(x.getTime() - off * 60000);
  return local.toISOString().slice(0, 10);
}

export default function AdminLastMinutePage() {
  const [properties, setProperties] = useState([]);
  const [propertyId, setPropertyId] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Formular: neu oder bearbeiten
  const [form, setForm] = useState({
    id: null,
    startDate: "",
    endDate: "",
    discount: "",
    note: "",
  });

  const editing = useMemo(() => form.id !== null, [form.id]);

  useEffect(() => {
    fetch("/api/admin/properties").then((r) => r.json()).then(setProperties);
  }, []);

  useEffect(() => {
    if (!propertyId) return setItems([]);
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  async function loadList() {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/lastminute?propertyId=${propertyId}`, { cache: "no-store" });
      const j = await r.json();
      setItems(Array.isArray(j) ? j : []);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({ id: null, startDate: "", endDate: "", discount: "", note: "" });
  }

  function editRow(o) {
    setForm({
      id: o.id,
      startDate: toISO(o.startDate),
      endDate: toISO(o.endDate),
      discount: String(o.discount ?? ""),
      note: o.note || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(e) {
    e.preventDefault();
    if (!propertyId) return alert("Bitte zuerst ein Objekt wählen.");
    const disc = Number(form.discount);
    if (!form.startDate || !form.endDate) return alert("Start- und Enddatum sind erforderlich.");
    if (!(disc >= 0 && disc <= 100)) return alert("Rabatt muss zwischen 0 und 100 liegen.");
    if (new Date(form.endDate) <= new Date(form.startDate)) return alert("Ende muss nach Start liegen.");

    const payload = {
      propertyId: Number(propertyId),
      startDate: form.startDate,
      endDate: form.endDate,
      discount: disc,
      note: form.note || undefined,
      ...(editing ? { id: form.id } : {}),
    };

    const url = editing ? "/api/admin/lastminute" : "/api/admin/lastminute";
    const method = editing ? "PUT" : "POST";

    const r = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await r.json();
    if (!r.ok) return alert(data?.error || "Speichern fehlgeschlagen.");

    setItems(Array.isArray(data) ? data : []);
    resetForm();
  }

  async function remove(id) {
    if (!confirm("Angebot wirklich löschen?")) return;
    const r = await fetch(`/api/admin/lastminute/${id}`, { method: "DELETE" });
    const data = await r.json();
    if (!r.ok) return alert(data?.error || "Löschen fehlgeschlagen.");
    setItems(Array.isArray(data) ? data : []);
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">Last-Minute Angebote</h1>

      {/* Objektwahl */}
      <div className="mb-6 flex items-center gap-3">
        <select
          className="border rounded-xl px-3 py-2"
          value={propertyId}
          onChange={(e) => setPropertyId(e.target.value)}
        >
          <option value="">— Objekt wählen —</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
        <button
          onClick={loadList}
          disabled={!propertyId || loading}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50"
          title="Liste neu laden"
        >
          <RefreshCcw className="h-4 w-4" /> Neu laden
        </button>
      </div>

      {/* Formular */}
      <form onSubmit={save} className="rounded-2xl bg-white ring-1 ring-black/5 p-6 space-y-4 mb-8">
        <div className="grid md:grid-cols-4 gap-3">
          <label className="grid gap-1">
            <span className="text-xs text-slate-500">Start</span>
            <input
              type="date"
              className="border rounded-xl px-3 py-2"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-slate-500">Ende (exkl.)</span>
            <input
              type="date"
              className="border rounded-xl px-3 py-2"
              value={form.endDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-slate-500">Rabatt (%)</span>
            <input
              type="number"
              min={0}
              max={100}
              className="border rounded-xl px-3 py-2"
              value={form.discount}
              onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value }))}
            />
          </label>
          <label className="grid gap-1 md:col-span-1">
            <span className="text-xs text-slate-500">Hinweis (optional)</span>
            <input
              className="border rounded-xl px-3 py-2"
              placeholder="z. B. Nur noch wenige Tage!"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            />
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button className="rounded-xl px-4 py-2 bg-sky-600 text-white inline-flex items-center gap-2">
            <Save className="h-4 w-4" />
            {editing ? "Änderungen speichern" : "Angebot anlegen"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl px-4 py-2 bg-slate-100 hover:bg-slate-200"
            >
              Abbrechen
            </button>
          )}
        </div>
        <p className="text-xs text-slate-500">
          Hinweis: Enddatum ist <strong>exklusiv</strong> (Belegung endet am Vortag 23:59).
        </p>
      </form>

      {/* Liste */}
      <div className="rounded-2xl bg-white ring-1 ring-black/5 p-6">
        <h3 className="font-semibold mb-3">Angebote</h3>
        {loading ? (
          <p className="text-sm text-slate-500">Lade…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-500">Keine Angebote vorhanden.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="text-left py-2">Start</th>
                  <th className="text-left">Ende (exkl.)</th>
                  <th className="text-left">Rabatt</th>
                  <th className="text-left">Hinweis</th>
                  <th className="text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {items.map((o) => (
                  <tr key={o.id} className="border-t">
                    <td className="py-2">{toISO(o.startDate)}</td>
                    <td>{toISO(o.endDate)}</td>
                    <td>-{o.discount}%</td>
                    <td className="max-w-[320px] truncate" title={o.note || ""}>
                      {o.note || "—"}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <button
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 mr-2"
                        onClick={() => editRow(o)}
                        title="Bearbeiten"
                      >
                        <PencilLine className="h-4 w-4" /> Bearbeiten
                      </button>
                      <button
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-600 text-white hover:bg-rose-700"
                        onClick={() => remove(o.id)}
                        title="Löschen"
                      >
                        <Trash2 className="h-4 w-4" /> Löschen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
