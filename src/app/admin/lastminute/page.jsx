"use client";
import { useEffect, useMemo, useState } from "react";
import { Save, Trash2, PencilLine, RefreshCcw } from "lucide-react";

function toISO(d) {
  if (!d) return "";
  const x = new Date(d);
  if (isNaN(+x)) return "";
  const off = x.getTimezoneOffset();
  const local = new Date(x.getTime() - off * 60000);
  return local.toISOString().slice(0, 10);
}

export default function AdminLastMinutePage() {
  const [properties, setProperties] = useState([]);
  const [propertyId, setPropertyId] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  // Messages: { t: "ok" | "error", m: string }
  const [msg, setMsg] = useState(null);

  // Lösch-Modal
  const [pendingDelete, setPendingDelete] = useState(null); // Angebot-Objekt

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
    (async () => {
      try {
        const r = await fetch("/api/admin/properties", { cache: "no-store" });
        if (r.status === 401) {
          window.location.href = "/admin";
          return;
        }
        const j = await r.json();
        setProperties(Array.isArray(j) ? j : []);
      } catch {
        setMsg({
          t: "error",
          m: "Unterkünfte konnten nicht geladen werden.",
        });
      }
    })();
  }, []);

  useEffect(() => {
    if (!propertyId) {
      setItems([]);
      return;
    }
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  async function loadList() {
    if (!propertyId) return;
    setLoading(true);
    setMsg(null);
    try {
      const r = await fetch(
        `/api/admin/lastminute?propertyId=${propertyId}`,
        { cache: "no-store" }
      );
      if (r.status === 401) {
        window.location.href = "/admin";
        return;
      }
      const j = await r.json();
      setItems(Array.isArray(j) ? j : []);
    } catch {
      setMsg({ t: "error", m: "Angebotsliste konnte nicht geladen werden." });
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({
      id: null,
      startDate: "",
      endDate: "",
      discount: "",
      note: "",
    });
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
    setMsg(null);

    if (!propertyId) {
      setMsg({
        t: "error",
        m: "Bitte zuerst eine Unterkunft wählen.",
      });
      return;
    }

    const disc = Number(form.discount);
    if (!form.startDate || !form.endDate) {
      setMsg({
        t: "error",
        m: "Start- und Enddatum sind erforderlich.",
      });
      return;
    }
    if (!(disc >= 0 && disc <= 100)) {
      setMsg({
        t: "error",
        m: "Rabatt muss zwischen 0 und 100 liegen.",
      });
      return;
    }
    if (new Date(form.endDate) <= new Date(form.startDate)) {
      setMsg({
        t: "error",
        m: "Ende muss nach Start liegen.",
      });
      return;
    }

    const payload = {
      propertyId: Number(propertyId),
      startDate: form.startDate,
      endDate: form.endDate,
      discount: disc,
      note: form.note || undefined,
      ...(editing ? { id: form.id } : {}),
    };

    setBusy(true);
    try {
      const r = await fetch("/api/admin/lastminute", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (r.status === 401) {
        window.location.href = "/admin";
        return;
      }

      const data = await r.json();
      if (!r.ok) {
        setMsg({
          t: "error",
          m: data?.error || "Speichern fehlgeschlagen.",
        });
        return;
      }

      setItems(Array.isArray(data) ? data : []);
      resetForm();
      setMsg({
        t: "ok",
        m: editing
          ? "Angebot wurde aktualisiert."
          : "Angebot wurde angelegt.",
      });
    } catch {
      setMsg({
        t: "error",
        m: "Netzwerkfehler beim Speichern.",
      });
    } finally {
      setBusy(false);
    }
  }

  function askRemove(o) {
    setMsg(null);
    setPendingDelete(o);
  }

  async function confirmRemove() {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      const r = await fetch(
        `/api/admin/lastminute/${pendingDelete.id}`,
        { method: "DELETE" }
      );
      if (r.status === 401) {
        window.location.href = "/admin";
        return;
      }
      const data = await r.json();
      if (!r.ok) {
        setMsg({
          t: "error",
          m: data?.error || "Löschen fehlgeschlagen.",
        });
        setPendingDelete(null);
        return;
      }
      setItems(Array.isArray(data) ? data : []);
      setMsg({
        t: "ok",
        m: "Angebot wurde gelöscht.",
      });
      setPendingDelete(null);
    } catch {
      setMsg({
        t: "error",
        m: "Netzwerkfehler beim Löschen.",
      });
      setPendingDelete(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 md:py-10">
      {/* Messages */}
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

      {/* Header + Objektwahl */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
            Admin · Last Minute
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Last-Minute-Angebote
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Kurzfristige Rabatte für ausgewählte Zeiträume anlegen, bearbeiten
            und löschen.
          </p>
        </div>

        <div className="sm:ml-auto flex flex-col gap-2 sm:items-end">
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            Objekt wählen
          </label>
          <div className="flex items-center gap-3">
            <select
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
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
              className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-200 disabled:opacity-50"
              title="Liste neu laden"
            >
              <RefreshCcw className="h-4 w-4" /> Neu laden
            </button>
          </div>
        </div>
      </div>

      {/* Formular */}
      <form
        onSubmit={save}
        className="mb-8 space-y-4 rounded-2xl bg-white p-6 ring-1 ring-black/5"
      >
        <div className="grid gap-3 md:grid-cols-4">
          <label className="grid gap-1">
            <span className="text-xs text-slate-500">Start</span>
            <input
              type="date"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
              value={form.startDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, startDate: e.target.value }))
              }
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-slate-500">Ende (exkl.)</span>
            <input
              type="date"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
              value={form.endDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, endDate: e.target.value }))
              }
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-slate-500">Rabatt (%)</span>
            <input
              type="number"
              min={0}
              max={100}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
              value={form.discount}
              onChange={(e) =>
                setForm((f) => ({ ...f, discount: e.target.value }))
              }
            />
          </label>
          <label className="grid gap-1 md:col-span-1">
            <span className="text-xs text-slate-500">Hinweis (optional)</span>
            <input
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
              placeholder="z. B. Nur noch wenige Tage!"
              value={form.note}
              onChange={(e) =>
                setForm((f) => ({ ...f, note: e.target.value }))
              }
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            disabled={busy || !propertyId}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {editing ? "Änderungen speichern" : "Angebot anlegen"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl bg-slate-100 px-4 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-200"
            >
              Abbrechen
            </button>
          )}
          <p className="text-xs text-slate-500">
            Hinweis: Enddatum ist <strong>exklusiv</strong> (Belegung endet am
            Vortag 23:59).
          </p>
        </div>
      </form>

      {/* Liste */}
      <div className="rounded-2xl bg-white p-6 ring-1 ring-black/5">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Angebote</h3>
        {loading ? (
          <p className="text-sm text-slate-500">Lade…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-500">
            Keine Last-Minute-Angebote vorhanden.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="py-2 text-left">Start</th>
                  <th className="text-left">Ende (exkl.)</th>
                  <th className="text-left">Rabatt</th>
                  <th className="text-left">Hinweis</th>
                  <th className="w-48 text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {items.map((o) => (
                  <tr key={o.id} className="border-t">
                    <td className="py-2">{toISO(o.startDate)}</td>
                    <td>{toISO(o.endDate)}</td>
                    <td>-{o.discount}%</td>
                    <td
                      className="max-w-[320px] truncate"
                      title={o.note || ""}
                    >
                      {o.note || "—"}
                    </td>
                    <td className="whitespace-nowrap text-right">
                      <button
                        className="mr-2 inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-800 shadow-sm hover:bg-slate-200"
                        onClick={() => editRow(o)}
                        title="Bearbeiten"
                      >
                        <PencilLine className="h-4 w-4" /> Bearbeiten
                      </button>
                      <button
                        className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2 py-1 text-xs font-semibold text-white shadow-sm hover:bg-rose-700"
                        onClick={() => askRemove(o)}
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

      {/* Lösch-Modal */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <h4 className="text-sm font-semibold text-slate-900">
              Last-Minute-Angebot löschen?
            </h4>
            <p className="mt-2 text-sm text-slate-600">
              Möchtest du dieses Angebot wirklich löschen? Die Aktion kann nicht
              rückgängig gemacht werden.
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Zeitraum: {toISO(pendingDelete.startDate)} →{" "}
              {toISO(pendingDelete.endDate)} · Rabatt: -{pendingDelete.discount}
              %
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
                onClick={confirmRemove}
                disabled={busy}
                className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-60"
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
