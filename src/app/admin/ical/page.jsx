"use client";
import { useEffect, useState } from "react";

export default function AdminIcalPage() {
  const [properties, setProperties] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [prop, setProp] = useState(null);
  const [icalUrl, setIcalUrl] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/admin/properties").then(r=>r.json()).then(setProperties);
  }, []);

  useEffect(() => {
    setProp(null); setIcalUrl(""); setMsg(""); setErr("");
    if (!selectedId) return;
    fetch(`/api/admin/properties/${selectedId}`)
      .then(r => r.json())
      .then(data => {
        setProp(data);
        setIcalUrl(data.icalUrl || "");
      });
  }, [selectedId]);

  async function saveUrl(e){
    e.preventDefault(); setMsg(""); setErr("");
    const r = await fetch(`/api/admin/properties/${selectedId}`, {
      method:"PUT",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ icalUrl: icalUrl || null }),
    });
    const j = await r.json();
    if (!r.ok) { setErr(j.error || "Speichern fehlgeschlagen"); return; }
    setProp(j);
    setMsg("Gespeichert.");
  }

  async function syncNow(){
    setMsg(""); setErr("");
    const r = await fetch(`/api/admin/ical/sync`, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ propertyId: Number(selectedId) }),
    });
    const j = await r.json();
    if (!r.ok) { setErr(j.error || "Sync fehlgeschlagen"); return; }
    setMsg(`Sync ok. Neu angelegt: ${j.created} / Events gesamt: ${j.total}`);
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">iCal Import & Sync</h1>

      <div className="mb-4">
        <select className="border rounded-xl px-3 py-2" value={selectedId} onChange={e=>setSelectedId(e.target.value)}>
          <option value="">— Objekt wählen —</option>
          {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
      </div>

      {prop && (
        <div className="rounded-2xl bg-white ring-1 ring-black/5 p-6 space-y-3">
          <div className="text-sm text-slate-600">
            <div><strong>Objekt:</strong> {prop.title}</div>
            <div><strong>Letzter Sync:</strong> {prop.icalLastRunAt ? new Date(prop.icalLastRunAt).toLocaleString("de-DE") : "—"}</div>
            <div><strong>Letzte Übernahme:</strong> {prop.icalUpdatedAt ? new Date(prop.icalUpdatedAt).toLocaleString("de-DE") : "—"}</div>
          </div>

          <form onSubmit={saveUrl} className="grid gap-3">
            <label className="grid gap-1">
              <span className="text-xs text-slate-500">iCal URL (https:// oder webcal://)</span>
              <input className="border rounded-xl px-3 py-2"
                     placeholder="z. B. webcal://…/calendar.ics"
                     value={icalUrl} onChange={e=>setIcalUrl(e.target.value)} />
            </label>
            <div className="flex items-center gap-3">
              <button className="rounded-xl px-4 py-2 bg-sky-600 text-white">URL speichern</button>
              <button type="button" onClick={syncNow} className="rounded-xl px-4 py-2 bg-emerald-600 text-white">Jetzt synchronisieren</button>
              {msg && <span className="text-sm text-emerald-700">{msg}</span>}
              {err && <span className="text-sm text-rose-700">{err}</span>}
            </div>
          </form>

          <hr className="my-4" />

          <form
  className="grid gap-3"
  onSubmit={async (e) => {
    e.preventDefault();
    setMsg(""); setErr("");

    const form = e.currentTarget;         // ← Referenz sichern (wichtig!)
    const fd = new FormData(form);
    fd.append("propertyId", String(selectedId));

    try {
      const r = await fetch("/api/admin/ical/import", { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok) { setErr(j.error || "Upload-Import fehlgeschlagen"); return; }
      setMsg(`Import ok. Neu angelegt: ${j.created} / Events gesamt: ${j.total}`);
      form.reset();                        // ← jetzt sicher, nicht null
    } catch (err) {
      setErr("Upload-Import fehlgeschlagen");
    }
  }}
>
  <label className="grid gap-1">
    <span className="text-xs text-slate-500">ICS-Datei importieren</span>
    <input type="file" name="file" accept=".ics,text/calendar" />
  </label>
  <button className="rounded-xl px-4 py-2 bg-slate-800 text-white w-fit">
    Datei importieren
  </button>
</form>
        </div>
      )}
    </section>
  );
}
