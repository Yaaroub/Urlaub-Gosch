"use client";
import { useEffect, useMemo, useState } from "react";

export default function PriceEditorPage() {
  const [properties, setProperties] = useState([]);
  const [propertyId, setPropertyId] = useState("");
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    id: null,
    startDate: "",
    endDate: "",
    pricePerNight: "",
  });
  const [loading, setLoading] = useState(false); // Liste / allgemeines Loading
  const [busy, setBusy] = useState(false); // Speichern/Löschen
  const [msg, setMsg] = useState(null); // { t:"ok"|"error", m:string }

  // Lösch-Modal
  const [pendingDelete, setPendingDelete] = useState(null); // Preiszeit-Objekt

  // Beim Mount: optionales ?propertyId= übernehmen
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const pid = sp.get("propertyId");
    if (pid) setPropertyId(pid);
  }, []);

  // Properties laden (für Dropdown)
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
        setProperties([]);
        setMsg({
          t: "error",
          m: "Unterkünfte konnten nicht geladen werden.",
        });
      }
    })();
  }, []);

  // Preiszeiten laden, wenn Property gewählt
  useEffect(() => {
    if (!propertyId) {
      setItems([]);
      return;
    }
    reloadList(propertyId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  async function reloadList(pid = propertyId) {
    if (!pid) return;
    setLoading(true);
    setMsg(null);
    try {
      const r = await fetch(`/api/admin/price-periods?propertyId=${pid}`, {
        cache: "no-store",
      });
      if (r.status === 401) {
        window.location.href = "/admin";
        return;
      }
      const data = await r.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setMsg({
        t: "error",
        m: "Preiszeiten konnten nicht geladen werden.",
      });
    } finally {
      setLoading(false);
    }
  }

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
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setForm({ id: null, startDate: "", endDate: "", pricePerNight: "" });
    setMsg(null);
  }

  async function save(e) {
    e.preventDefault();
    setMsg(null);

    if (!propertyId) {
      setMsg({
        t: "error",
        m: "Bitte zuerst ein Objekt wählen.",
      });
      return;
    }

    if (!form.startDate || !form.endDate) {
      setMsg({
        t: "error",
        m: "Start- und Enddatum sind erforderlich.",
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

    const price = Number(form.pricePerNight);
    if (!(price >= 0)) {
      setMsg({
        t: "error",
        m: "Bitte einen gültigen Preis pro Nacht eingeben.",
      });
      return;
    }

    const payload = {
      propertyId: Number(propertyId),
      startDate: form.startDate,
      endDate: form.endDate,
      pricePerNight: price,
    };

    setBusy(true);
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

      if (res.status === 401) {
        window.location.href = "/admin";
        return;
      }

      const data = res.status === 204 ? {} : await res.json();

      if (!res.ok) {
        const conflictInfo = data?.conflict
          ? ` (Konflikt: ${data.conflict.startDate?.slice(
              0,
              10
            )} → ${data.conflict.endDate?.slice(0, 10)})`
          : "";
        setMsg({
          t: "error",
          m: (data.error || "Fehler beim Speichern.") + conflictInfo,
        });
      } else {
        setMsg({
          t: "ok",
          m: form.id ? "Preiszeit aktualisiert." : "Preiszeit hinzugefügt.",
        });
        resetForm();
        await reloadList();
      }
    } catch {
      setMsg({
        t: "error",
        m: "Netzwerkfehler beim Speichern.",
      });
    } finally {
      setBusy(false);
    }
  }

  function askRemove(pp) {
    setMsg(null);
    setPendingDelete(pp);
  }

  async function confirmRemove() {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/admin/price-periods/${pendingDelete.id}`,
        { method: "DELETE" }
      );
      if (res.status === 401) {
        window.location.href = "/admin";
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMsg({
          t: "error",
          m: data.error || "Löschen fehlgeschlagen.",
        });
        setPendingDelete(null);
        return;
      }
      setMsg({
        t: "ok",
        m: "Preiszeit wurde gelöscht.",
      });
      setPendingDelete(null);
      await reloadList();
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
            Admin · Preiszeiten
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Saisonpreise & Zeiträume
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Lege Preiszeiträume mit Start- und Enddatum an. Das Ende ist{" "}
            <strong>exklusiv</strong> (Abreise-Tag).
          </p>
        </div>

        <div className="sm:ml-auto flex flex-col gap-2 sm:items-end">
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            Objekt wählen
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <select
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
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
            {currentTitle && (
              <span className="text-xs text-slate-500">
                ({currentTitle})
              </span>
            )}
            {!!propertyId && (
              <a
                className="text-xs font-medium text-sky-700 underline"
                href={`/admin/properties`}
              >
                Zur Objektliste
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Formular */}
      <form
        onSubmit={save}
        className="mb-6 grid gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 md:grid-cols-4"
      >
        <div>
          <label className="mb-1 block text-xs text-slate-500">
            Start (inkl.)
          </label>
          <input
            type="date"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
            value={form.startDate}
            onChange={(e) =>
              setForm((f) => ({ ...f, startDate: e.target.value }))
            }
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500">
            Ende (exkl.)
          </label>
          <input
            type="date"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
            value={form.endDate}
            onChange={(e) =>
              setForm((f) => ({ ...f, endDate: e.target.value }))
            }
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500">
            Preis/Nacht (€)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
            value={form.pricePerNight}
            onChange={(e) =>
              setForm((f) => ({ ...f, pricePerNight: e.target.value }))
            }
          />
        </div>
        <div className="flex items-end gap-2">
          <button
            disabled={busy || !propertyId}
            className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 disabled:opacity-60"
          >
            {form.id ? "Aktualisieren" : "Hinzufügen"}
          </button>
          {form.id && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Abbrechen
            </button>
          )}
        </div>
      </form>

      {/* Liste */}
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        {loading && (
          <p className="text-sm text-slate-500">Lade Preiszeiten…</p>
        )}
        {!loading && items.length === 0 && (
          <p className="text-sm text-slate-500">Keine Preiszeiten vorhanden.</p>
        )}

        {!loading && items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="py-2">Start</th>
                  <th className="py-2">Ende (exkl.)</th>
                  <th className="py-2">Preis/Nacht</th>
                  <th className="py-2 text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {items.map((pp) => (
                  <tr key={pp.id} className="border-t">
                    <td className="py-2">{pp.startDate.slice(0, 10)}</td>
                    <td className="py-2">{pp.endDate.slice(0, 10)}</td>
                    <td className="py-2">
                      {Number(pp.pricePerNight).toFixed(2)} €
                    </td>
                    <td className="py-2 text-right whitespace-nowrap">
                      <button
                        onClick={() => edit(pp)}
                        className="mr-2 rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-800 shadow-sm hover:bg-slate-200"
                      >
                        Bearbeiten
                      </button>
                      <button
                        onClick={() => askRemove(pp)}
                        className="rounded-lg bg-rose-600 px-2 py-1 text-xs font-semibold text-white shadow-sm hover:bg-rose-700"
                      >
                        Löschen
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
              Preiszeit löschen?
            </h4>
            <p className="mt-2 text-sm text-slate-600">
              Möchtest du diese Preiszeit wirklich löschen? Die Aktion kann
              nicht rückgängig gemacht werden.
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Zeitraum: {pendingDelete.startDate.slice(0, 10)} →{" "}
              {pendingDelete.endDate.slice(0, 10)} · Preis:{" "}
              {Number(pendingDelete.pricePerNight).toFixed(2)} € / Nacht
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
