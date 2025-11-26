"use client";
import { useEffect, useState } from "react";

export default function AdminIcalPage() {
  const [properties, setProperties] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [prop, setProp] = useState(null);
  const [icalUrl, setIcalUrl] = useState("");
  const [msg, setMsg] = useState(null); // { t: "ok" | "error", m: string }
  const [busy, setBusy] = useState(false);

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
        setMsg({ t: "error", m: "Objekte konnten nicht geladen werden." });
      }
    })();
  }, []);

  useEffect(() => {
    setProp(null);
    setIcalUrl("");
    setMsg(null);
    if (!selectedId) return;

    (async () => {
      try {
        const r = await fetch(`/api/admin/properties/${selectedId}`, {
          cache: "no-store",
        });
        if (r.status === 401) {
          window.location.href = "/admin";
          return;
        }
        const data = await r.json();
        setProp(data);
        setIcalUrl(data.icalUrl || "");
      } catch {
        setMsg({ t: "error", m: "Details konnten nicht geladen werden." });
      }
    })();
  }, [selectedId]);

  async function saveUrl(e) {
    e.preventDefault();
    setMsg(null);
    if (!selectedId) {
      setMsg({ t: "error", m: "Bitte zuerst ein Objekt wählen." });
      return;
    }

    setBusy(true);
    try {
      const r = await fetch(`/api/admin/properties/${selectedId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ icalUrl: icalUrl || null }),
      });
      const j = await r.json();
      if (r.status === 401) {
        window.location.href = "/admin";
        return;
      }
      if (!r.ok) {
        setMsg({ t: "error", m: j.error || "Speichern fehlgeschlagen." });
        return;
      }
      setProp(j);
      setMsg({ t: "ok", m: "iCal-URL wurde gespeichert." });
    } catch {
      setMsg({ t: "error", m: "Netzwerkfehler beim Speichern." });
    } finally {
      setBusy(false);
    }
  }

  async function syncNow() {
    setMsg(null);
    if (!selectedId) {
      setMsg({ t: "error", m: "Bitte zuerst ein Objekt wählen." });
      return;
    }

    setBusy(true);
    try {
      const r = await fetch(`/api/admin/ical/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId: Number(selectedId) }),
      });
      const j = await r.json();
      if (r.status === 401) {
        window.location.href = "/admin";
        return;
      }
      if (!r.ok) {
        setMsg({ t: "error", m: j.error || "Sync fehlgeschlagen." });
        return;
      }
      setMsg({
        t: "ok",
        m: `Sync erfolgreich. Neu angelegt: ${j.created} · Events gesamt: ${j.total}`,
      });
    } catch {
      setMsg({ t: "error", m: "Netzwerkfehler beim Synchronisieren." });
    } finally {
      setBusy(false);
    }
  }

  async function handleImport(e) {
    e.preventDefault();
    setMsg(null);
    if (!selectedId) {
      setMsg({ t: "error", m: "Bitte zuerst ein Objekt wählen." });
      return;
    }

    const formEl = e.currentTarget;
    const fd = new FormData(formEl);
    fd.append("propertyId", String(selectedId));

    setBusy(true);
    try {
      const r = await fetch("/api/admin/ical/import", {
        method: "POST",
        body: fd,
      });
      const j = await r.json();
      if (r.status === 401) {
        window.location.href = "/admin";
        return;
      }
      if (!r.ok) {
        setMsg({
          t: "error",
          m: j.error || "Upload-Import fehlgeschlagen.",
        });
        return;
      }
      setMsg({
        t: "ok",
        m: `Import erfolgreich. Neu angelegt: ${j.created} · Events gesamt: ${j.total}`,
      });
      formEl.reset();
    } catch {
      setMsg({ t: "error", m: "Upload-Import fehlgeschlagen." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-8 md:py-10">
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

      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
            Admin · iCal
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            iCal Import & Sync
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            iCal-URLs hinterlegen, automatische Synchronisation auslösen oder
            .ics-Dateien manuell importieren.
          </p>
        </div>

        <div className="sm:ml-auto">
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            Objekt wählen
          </label>
          <select
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option value="">— Objekt wählen —</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {prop && (
        <div className="space-y-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          {/* Objekt-Infos */}
          <div className="rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-700">
            <div className="mb-1">
              <span className="font-semibold">Objekt: </span>
              <span>{prop.title}</span>
            </div>
            <div className="text-xs text-slate-500 space-y-0.5">
              <div>
                <span className="font-medium">Letzter Sync: </span>
                <span>
                  {prop.icalLastRunAt
                    ? new Date(prop.icalLastRunAt).toLocaleString("de-DE")
                    : "—"}
                </span>
              </div>
              <div>
                <span className="font-medium">Letzte Übernahme: </span>
                <span>
                  {prop.icalUpdatedAt
                    ? new Date(prop.icalUpdatedAt).toLocaleString("de-DE")
                    : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* URL + Sync */}
          <form onSubmit={saveUrl} className="grid gap-3">
            <label className="grid gap-1">
              <span className="text-xs font-semibold text-slate-700">
                iCal-URL (https:// oder webcal://)
              </span>
              <input
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                placeholder="z. B. webcal://…/calendar.ics"
                value={icalUrl}
                onChange={(e) => setIcalUrl(e.target.value)}
              />
              <span className="text-[11px] text-slate-500">
                Viele Portale (FeWo, Booking, Airbnb) bieten eine iCal-Export-URL
                zur Synchronisation an.
              </span>
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={busy || !selectedId}
                className="inline-flex items-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/70 disabled:opacity-60"
              >
                URL speichern
              </button>

              <button
                type="button"
                disabled={busy || !selectedId}
                onClick={syncNow}
                className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/70 disabled:opacity-60"
              >
                Jetzt synchronisieren
              </button>
            </div>
          </form>

          <hr className="border-slate-200" />

          {/* Datei-Import */}
          <form className="grid gap-3" onSubmit={handleImport}>
            <label className="grid gap-1">
              <span className="text-xs font-semibold text-slate-700">
                ICS-Datei importieren
              </span>
              <input
                type="file"
                name="file"
                accept=".ics,text/calendar"
                className="block text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-slate-700"
              />
              <span className="text-[11px] text-slate-500">
                Alternativ kannst du eine heruntergeladene .ics-Datei eines
                Kalenders hier hochladen.
              </span>
            </label>
            <button
              type="submit"
              disabled={busy || !selectedId}
              className="w-fit rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/70 disabled:opacity-60"
            >
              Datei importieren
            </button>
          </form>
        </div>
      )}

      {!selectedId && (
        <p className="mt-4 text-sm text-slate-500">
          Bitte oben ein Objekt wählen, um iCal-Einstellungen zu sehen.
        </p>
      )}
    </section>
  );
}
