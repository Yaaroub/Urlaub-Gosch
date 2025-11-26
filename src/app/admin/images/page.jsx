"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Upload, Save, Trash2 } from "lucide-react";

export default function AdminImagesPage() {
  // Alle Properties (Unterkünfte) und aktuell ausgewählte Property
  const [properties, setProperties] = useState([]);
  const [propertyId, setPropertyId] = useState("");

  // Bilder aus der DB für die aktuell ausgewählte Property
  const [items, setItems] = useState([]);

  // Lokale neue Bilder vorm Upload
  // Struktur: { file, preview, alt, sort }
  const [selectedNew, setSelectedNew] = useState([]);

  // Busy / Error
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // Auswahl vorhandener Bilder (für Bulk-Delete)
  // Set<number>
  const [selectedExisting, setSelectedExisting] = useState(new Set());

  // -------------------------------------------------
  // Daten laden
  // -------------------------------------------------

  // Properties laden (einmalig)
  useEffect(() => {
    fetch("/api/admin/properties")
      .then((r) => r.json())
      .then(setProperties)
      .catch(() => {});
  }, []);

  // Bilder für die aktuell gewählte Property laden
  useEffect(() => {
    if (!propertyId) {
      setItems([]);
      setSelectedExisting(new Set());
      return;
    }

    fetch(`/api/admin/images?propertyId=${propertyId}`)
      .then((r) => r.json())
      .then((data) => {
        setItems(data || []);
        setSelectedExisting(new Set());
      })
      .catch(() => {});
  }, [propertyId]);

  // -------------------------------------------------
  // Neue Bilder auswählen & vorbereiten
  // -------------------------------------------------

  function onPick(e) {
    const files = Array.from(e.target.files || []);

    setSelectedNew((prev) => {
      // neue Bilder hinten anhängen
      const baseSortStart = prev.length;
      const mapped = files.map((file, i) => {
        const url = URL.createObjectURL(file);
        const name = file.name || "";
        const base = name.replace(/\.[^/.]+$/, ""); // Dateiname ohne Extension
        return {
          file,
          preview: url,
          alt: base,
          sort: baseSortStart + i, // Reihenfolge erstmal der Reihenfolge des Auswählens
        };
      });
      return [...prev, ...mapped];
    });
  }

  function updateNewAlt(idx, val) {
    setSelectedNew((s) =>
      s.map((it, i) => (i === idx ? { ...it, alt: val } : it))
    );
  }

  // Lokale Neusortierung in der Preview (vor Upload)
  function moveNewImageUp(idx) {
    setSelectedNew((prev) => {
      if (idx <= 0) return prev;
      const arr = [...prev];
      const tmp = arr[idx - 1];
      arr[idx - 1] = arr[idx];
      arr[idx] = tmp;
      // sort neu durchnummerieren
      return arr.map((item, newIndex) => ({ ...item, sort: newIndex }));
    });
  }

  function moveNewImageDown(idx) {
    setSelectedNew((prev) => {
      if (idx >= prev.length - 1) return prev;
      const arr = [...prev];
      const tmp = arr[idx + 1];
      arr[idx + 1] = arr[idx];
      arr[idx] = tmp;
      // sort neu durchnummerieren
      return arr.map((item, newIndex) => ({ ...item, sort: newIndex }));
    });
  }

  // -------------------------------------------------
  // Upload-Flow
  // -------------------------------------------------

  async function uploadAll() {
    if (!propertyId || selectedNew.length === 0) return;
    setBusy(true);
    setErr("");

    try {
      // 1) Dateien hochladen (z.B. nach /public/uploads oder S3),
      //    wir schicken sie in der aktuell angezeigten Reihenfolge.
      const fd = new FormData();
      selectedNew.forEach((s) => fd.append("files", s.file));

      const up = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
      });

      const upJson = await up.json();
      if (!up.ok) throw new Error(upJson?.error || "Upload fehlgeschlagen");

      // Annahme: upJson.files[i].url gehört zu selectedNew[i]
      // Jetzt bauen wir ein Array für /api/admin/images POST
      // in GENAU der Reihenfolge, die der User will:
      const images = selectedNew.map((s, i) => ({
        url: upJson.files[i].url,
        alt: s.alt || null,
      }));

      // 2) Einträge in der DB anlegen
      const res = await fetch("/api/admin/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: Number(propertyId),
          images, // Reihenfolge = gewollte Reihenfolge
        }),
      });

      const fresh = await res.json();
      if (!res.ok) throw new Error(fresh?.error || "Speichern fehlgeschlagen");

      // 3) UI aktualisieren
      setItems(fresh);
      setSelectedExisting(new Set());

      // Previews freigeben & Auswahl zurücksetzen
      selectedNew.forEach((s) => URL.revokeObjectURL(s.preview));
      setSelectedNew([]);
    } catch (e) {
      console.error(e);
      setErr(e.message || "Fehler");
    } finally {
      setBusy(false);
    }
  }

  // -------------------------------------------------
  // Bestehende Bilder bearbeiten/speichern
  // -------------------------------------------------

  // ALT / SORT ändern und dann serverseitig eindeutige Sortierung erzwingen
  async function save(item) {
    const res = await fetch("/api/admin/images", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: item.id,
        alt: item.alt,
        sort: Number(item.sort),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data?.error || "Speichern fehlgeschlagen");
      return;
    }

    // Server hat nach dem Speichern ALLE sort-Werte neu durchnummeriert (0,1,2,...)
    if (data.images) {
      setItems(data.images);
      // Auswahl ggf. neu aufbauen (wir lassen Auswahl stehen)
      setSelectedExisting((prev) => {
        const stillExisting = new Set();
        for (const img of data.images) {
          if (prev.has(img.id)) stillExisting.add(img.id);
        }
        return stillExisting;
      });
    } else {
      // fallback, falls API nicht images zurückgibt
      const again = await fetch(
        `/api/admin/images?propertyId=${propertyId}`
      ).then((r) => r.json());
      setItems(again || []);
    }
  }

  // -------------------------------------------------
  // Einzelnes Bild löschen
  // -------------------------------------------------

  async function removeOne(id) {
    if (!confirm("Bild löschen?")) return;
    if (!propertyId) return;

    const res = await fetch(`/api/admin/images/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      alert("Löschen fehlgeschlagen");
      return;
    }

    const fresh = await res.json();

    if (fresh?.images) {
      // wenn DELETE dir schon neue Liste zurückgibt
      setItems(fresh.images);
    } else {
      // fallback refetch
      const again = await fetch(
        `/api/admin/images?propertyId=${propertyId}`
      ).then((r) => r.json());
      setItems(again || []);
    }

    // Auswahl aktualisieren
    setSelectedExisting((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  // -------------------------------------------------
  // Mehrfachauswahl vorhandener Bilder
  // -------------------------------------------------

  function toggleExisting(id) {
    setSelectedExisting((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedExisting((prev) => {
      // Wenn vorher alles ausgewählt war -> leeren
      if (prev.size === items.length) {
        return new Set();
      }
      // sonst alles auswählen
      return new Set(items.map((i) => i.id));
    });
  }

  async function removeSelectedMany() {
    if (selectedExisting.size === 0) return;
    if (!confirm("Ausgewählte Bilder wirklich löschen?")) return;
    if (!propertyId) return;

    const ids = Array.from(selectedExisting);

    const res = await fetch("/api/admin/images/bulk-delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyId: Number(propertyId),
        ids,
      }),
    });

    if (!res.ok) {
      alert("Löschen fehlgeschlagen");
      return;
    }

    const data = await res.json();

    if (data?.images) {
      setItems(data.images);
    } else {
      const again = await fetch(
        `/api/admin/images?propertyId=${propertyId}`
      ).then((r) => r.json());
      setItems(again || []);
    }

    setSelectedExisting(new Set());
  }

  // -------------------------------------------------
  // Render
  // -------------------------------------------------

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">Bilder verwalten</h1>

      {/* Objektwahl */}
      <div className="mb-6">
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
      </div>

      {/* Mehrfach-Upload mit Alt-Texten & Vorschau mit Sortierung */}
      <div className="rounded-2xl bg-white ring-1 ring-black/5 p-6 mb-6">
        <h3 className="font-semibold mb-3">
          Mehrere Bilder auswählen & Reihenfolge festlegen
        </h3>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="file" multiple accept="image/*" onChange={onPick} />
            <span>Dateien auswählen…</span>
          </label>

          <button
            disabled={!propertyId || selectedNew.length === 0 || busy}
            onClick={uploadAll}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 bg-sky-600 text-white text-sm font-medium disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            Alle hochladen
          </button>

          {busy && (
            <span className="text-sm text-slate-500">Bitte warten…</span>
          )}
        </div>

        {err && <p className="text-sm text-rose-600 mb-3">{err}</p>}

        {selectedNew.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {selectedNew.map((s, idx) => (
              <div
                key={idx}
                className="rounded-xl ring-1 ring-black/5 overflow-hidden bg-white flex flex-col"
              >
                {/* Preview */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.preview}
                  alt=""
                  className="w-full aspect-[4/3] object-cover"
                />

                {/* Sortierung & Alt-Text */}
                <div className="p-3 bg-slate-50 flex flex-col gap-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-600">
                      Reihenfolge:{" "}
                      <span className="font-semibold">{idx + 1}</span>
                      {idx === 0 && (
                        <span className="ml-2 inline-block rounded bg-emerald-100 text-emerald-700 border border-emerald-300 px-2 py-0.5 text-[10px] leading-none">
                          wird Titelbild
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveNewImageUp(idx)}
                        className="px-2 py-1 text-[11px] rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-30"
                        disabled={idx === 0}
                        title="nach oben"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveNewImageDown(idx)}
                        className="px-2 py-1 text-[11px] rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-30"
                        disabled={idx === selectedNew.length - 1}
                        title="nach unten"
                      >
                        ↓
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-600 block">
                      Alt-Text
                    </label>
                    <input
                      className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
                      value={s.alt}
                      onChange={(e) => updateNewAlt(idx, e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vorhandene Bilder (bearbeiten/löschen) */}
      <div className="rounded-2xl bg-white ring-1 ring-black/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold">Bilderliste</h3>

            {items.length > 0 && (
              <label className="inline-flex items-center gap-2 text-sm text-slate-700 border border-slate-300 rounded px-2 py-1 bg-white/70 backdrop-blur-sm shadow-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={
                    selectedExisting.size > 0 &&
                    selectedExisting.size === items.length
                  }
                  onChange={toggleSelectAll}
                />
                <span>Alle auswählen</span>
              </label>
            )}
          </div>

          <button
            disabled={selectedExisting.size === 0}
            onClick={removeSelectedMany}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 bg-rose-600 text-white text-sm font-medium disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" />
            Ausgewählte löschen ({selectedExisting.size})
          </button>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-slate-500">Keine Bilder vorhanden.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it) => (
              <div
                key={it.id}
                className="relative rounded-xl ring-1 ring-black/5 overflow-hidden bg-white"
              >
                {/* Checkbox oben links für Mehrfachauswahl */}
                <label className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded bg-white/80 backdrop-blur-sm border border-slate-300 px-2 py-1 text-[11px] text-slate-700 shadow-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={selectedExisting.has(it.id)}
                    onChange={() => toggleExisting(it.id)}
                  />
                  <span>Auswählen</span>
                </label>

                <div className="relative">
                  <Image
                    src={it.url}
                    alt={it.alt || ""}
                    width={800}
                    height={600}
                    className="w-full aspect-[4/3] object-cover"
                  />
                </div>

                <div className="p-3 space-y-2">
                  <div className="grid grid-cols-5 gap-2 items-center">
                    <label className="col-span-1 text-[11px] text-slate-600">
                      Sort
                    </label>
                    <input
                      type="number"
                      className="col-span-4 border rounded-xl px-3 py-2 text-sm"
                      value={it.sort ?? 0}
                      onChange={(e) =>
                        setItems((arr) =>
                          arr.map((x) =>
                            x.id === it.id
                              ? { ...x, sort: Number(e.target.value) }
                              : x
                          )
                        )
                      }
                    />
                  </div>

                  <div className="grid grid-cols-5 gap-2 items-center">
                    <label className="col-span-1 text-[11px] text-slate-600">
                      Alt
                    </label>
                    <input
                      className="col-span-4 border rounded-xl px-3 py-2 text-sm"
                      value={it.alt || ""}
                      onChange={(e) =>
                        setItems((arr) =>
                          arr.map((x) =>
                            x.id === it.id
                              ? { ...x, alt: e.target.value }
                              : x
                          )
                        )
                      }
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => save(it)}
                      className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 bg-sky-600 text-white text-sm"
                    >
                      <Save className="h-4 w-4" /> Speichern
                    </button>

                    <button
                      onClick={() => removeOne(it.id)}
                      className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 bg-rose-600 text-white text-sm"
                    >
                      <Trash2 className="h-4 w-4" /> Löschen
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-500 pt-1">
                    {it.sort === 0 && (
                      <span className="inline-block rounded bg-emerald-100 text-emerald-700 border border-emerald-300 px-2 py-0.5 mr-2">
                        Titelbild
                      </span>
                    )}
                    ID {it.id}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {err && (
        <p className="text-sm text-rose-600 mt-4">
          {err}
        </p>
      )}
    </section>
  );
}
