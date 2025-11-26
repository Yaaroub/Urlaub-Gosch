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

  // Lokale neue Bilder vorm Upload: { file, preview, alt, sort }
  const [selectedNew, setSelectedNew] = useState([]);

  // Busy / Messages
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(""); // speziell für Upload etc.
  const [msg, setMsg] = useState(null); // { t: "ok" | "error", m: string }

  // Auswahl vorhandener Bilder (für Bulk-Delete)
  const [selectedExisting, setSelectedExisting] = useState(new Set());

  // Delete-Modals
  const [pendingDeleteOne, setPendingDeleteOne] = useState(null); // Bild-Objekt
  const [pendingDeleteMany, setPendingDeleteMany] = useState(false);

  // -------------------------------------------------
  // Daten laden
  // -------------------------------------------------

  // Properties laden (einmalig)
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

  // Bilder für die aktuell gewählte Property laden
  useEffect(() => {
    setItems([]);
    setSelectedExisting(new Set());
    setMsg(null);
    setErr("");

    if (!propertyId) return;

    (async () => {
      try {
        const r = await fetch(`/api/admin/images?propertyId=${propertyId}`, {
          cache: "no-store",
        });
        if (r.status === 401) {
          window.location.href = "/admin";
          return;
        }
        const data = await r.json();
        setItems(data || []);
      } catch {
        setMsg({ t: "error", m: "Bilder konnten nicht geladen werden." });
      }
    })();
  }, [propertyId]);

  // -------------------------------------------------
  // Neue Bilder auswählen & vorbereiten
  // -------------------------------------------------

  function onPick(e) {
    const files = Array.from(e.target.files || []);

    setSelectedNew((prev) => {
      const baseSortStart = prev.length;
      const mapped = files.map((file, i) => {
        const url = URL.createObjectURL(file);
        const name = file.name || "";
        const base = name.replace(/\.[^/.]+$/, ""); // Dateiname ohne Extension
        return {
          file,
          preview: url,
          alt: base,
          sort: baseSortStart + i,
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
      [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
      return arr.map((item, newIndex) => ({ ...item, sort: newIndex }));
    });
  }

  function moveNewImageDown(idx) {
    setSelectedNew((prev) => {
      if (idx >= prev.length - 1) return prev;
      const arr = [...prev];
      [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
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
    setMsg(null);

    try {
      const fd = new FormData();
      selectedNew.forEach((s) => fd.append("files", s.file));

      const up = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
      });

      if (up.status === 401) {
        window.location.href = "/admin";
        return;
      }

      const upJson = await up.json();
      if (!up.ok) throw new Error(upJson?.error || "Upload fehlgeschlagen");

      const images = selectedNew.map((s, i) => ({
        url: upJson.files[i].url,
        alt: s.alt || null,
      }));

      const res = await fetch("/api/admin/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: Number(propertyId),
          images,
        }),
      });

      if (res.status === 401) {
        window.location.href = "/admin";
        return;
      }

      const fresh = await res.json();
      if (!res.ok) throw new Error(fresh?.error || "Speichern fehlgeschlagen");

      setItems(fresh);
      setSelectedExisting(new Set());
      selectedNew.forEach((s) => URL.revokeObjectURL(s.preview));
      setSelectedNew([]);
      setMsg({ t: "ok", m: "Bilder wurden hochgeladen und gespeichert." });
    } catch (e) {
      console.error(e);
      setErr(e.message || "Fehler beim Upload.");
      setMsg({ t: "error", m: "Upload oder Speichern fehlgeschlagen." });
    } finally {
      setBusy(false);
    }
  }

  // -------------------------------------------------
  // Bestehende Bilder bearbeiten/speichern
  // -------------------------------------------------

  async function save(item) {
    setMsg(null);
    try {
      const res = await fetch("/api/admin/images", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          alt: item.alt,
          sort: Number(item.sort),
        }),
      });

      if (res.status === 401) {
        window.location.href = "/admin";
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setMsg({
          t: "error",
          m: data?.error || "Speichern fehlgeschlagen.",
        });
        return;
      }

      if (data.images) {
        setItems(data.images);
        setSelectedExisting((prev) => {
          const stillExisting = new Set();
          for (const img of data.images) {
            if (prev.has(img.id)) stillExisting.add(img.id);
          }
          return stillExisting;
        });
      } else {
        const again = await fetch(
          `/api/admin/images?propertyId=${propertyId}`
        ).then((r) => r.json());
        setItems(again || []);
      }
      setMsg({ t: "ok", m: "Bilddaten wurden gespeichert." });
    } catch {
      setMsg({ t: "error", m: "Netzwerkfehler beim Speichern." });
    }
  }

  // -------------------------------------------------
  // Einzelnes Bild löschen (Modal)
  // -------------------------------------------------

  function askRemoveOne(item) {
    setMsg(null);
    setPendingDeleteOne(item);
  }

  async function confirmRemoveOne() {
    if (!pendingDeleteOne || !propertyId) return;
    const id = pendingDeleteOne.id;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/images/${id}`, {
        method: "DELETE",
      });

      if (res.status === 401) {
        window.location.href = "/admin";
        return;
      }

      if (!res.ok) {
        setMsg({ t: "error", m: "Löschen fehlgeschlagen." });
        setPendingDeleteOne(null);
        return;
      }

      const fresh = await res.json();
      if (fresh?.images) {
        setItems(fresh.images);
      } else {
        const again = await fetch(
          `/api/admin/images?propertyId=${propertyId}`
        ).then((r) => r.json());
        setItems(again || []);
      }

      setSelectedExisting((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      setMsg({ t: "ok", m: "Bild wurde gelöscht." });
      setPendingDeleteOne(null);
    } catch {
      setMsg({ t: "error", m: "Netzwerkfehler beim Löschen." });
    } finally {
      setBusy(false);
    }
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
      if (prev.size === items.length) return new Set();
      return new Set(items.map((i) => i.id));
    });
  }

  function askRemoveSelectedMany() {
    if (selectedExisting.size === 0) return;
    setMsg(null);
    setPendingDeleteMany(true);
  }

  async function confirmRemoveSelectedMany() {
    if (selectedExisting.size === 0 || !propertyId) {
      setPendingDeleteMany(false);
      return;
    }

    const ids = Array.from(selectedExisting);
    setBusy(true);

    try {
      const res = await fetch("/api/admin/images/bulk-delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: Number(propertyId),
          ids,
        }),
      });

      if (res.status === 401) {
        window.location.href = "/admin";
        return;
      }

      if (!res.ok) {
        setMsg({ t: "error", m: "Löschen fehlgeschlagen." });
        setPendingDeleteMany(false);
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
      setMsg({ t: "ok", m: "Ausgewählte Bilder wurden gelöscht." });
      setPendingDeleteMany(false);
    } catch {
      setMsg({ t: "error", m: "Netzwerkfehler beim Löschen." });
      setPendingDeleteMany(false);
    } finally {
      setBusy(false);
    }
  }

  // -------------------------------------------------
  // Render
  // -------------------------------------------------

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
            Admin · Bilder
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Bilder verwalten
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Bilder hochladen, Reihenfolge festlegen und Alt-Texte pflegen.
          </p>
        </div>

        <div className="sm:ml-auto">
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            Objekt wählen
          </label>
          <select
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
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
      </div>

      {/* Mehrfach-Upload mit Alt-Texten & Vorschau mit Sortierung */}
      <div className="mb-6 rounded-2xl bg-white p-6 ring-1 ring-black/5">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">
          Mehrere Bilder auswählen & Reihenfolge festlegen
        </h3>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={onPick}
              className="hidden"
            />
            <span className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs shadow-sm hover:bg-slate-50">
              Dateien auswählen…
            </span>
          </label>

          <button
            disabled={!propertyId || selectedNew.length === 0 || busy}
            onClick={uploadAll}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-500 disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            Alle hochladen
          </button>

          {busy && (
            <span className="text-sm text-slate-500">Bitte warten…</span>
          )}
        </div>

        {err && <p className="mb-3 text-sm text-rose-600">{err}</p>}

        {selectedNew.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {selectedNew.map((s, idx) => (
              <div
                key={idx}
                className="flex flex-col overflow-hidden rounded-xl bg-white ring-1 ring-black/5"
              >
                {/* Preview */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.preview}
                  alt=""
                  className="aspect-[4/3] w-full object-cover"
                />

                {/* Sortierung & Alt-Text */}
                <div className="flex flex-col gap-3 bg-slate-50 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-600">
                      Reihenfolge:{" "}
                      <span className="font-semibold">{idx + 1}</span>
                      {idx === 0 && (
                        <span className="ml-2 inline-block rounded border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[10px] leading-none text-emerald-700">
                          wird Titelbild
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveNewImageUp(idx)}
                        className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] hover:bg-slate-100 disabled:opacity-30"
                        disabled={idx === 0}
                        title="nach oben"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveNewImageDown(idx)}
                        className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] hover:bg-slate-100 disabled:opacity-30"
                        disabled={idx === selectedNew.length - 1}
                        title="nach unten"
                      >
                        ↓
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600">
                      Alt-Text
                    </label>
                    <input
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
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
      <div className="rounded-2xl bg-white p-6 ring-1 ring-black/5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Bilderliste
            </h3>

            {items.length > 0 && (
              <label className="inline-flex items-center gap-2 rounded border border-slate-300 bg-white/70 px-2 py-1 text-xs text-slate-700 shadow-sm backdrop-blur-sm">
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
            onClick={askRemoveSelectedMany}
            className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-rose-500 disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" />
            Ausgewählte löschen ({selectedExisting.size})
          </button>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-slate-500">
            Keine Bilder vorhanden. Lade oben neue Bilder hoch.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it) => (
              <div
                key={it.id}
                className="relative overflow-hidden rounded-xl bg-white ring-1 ring-black/5"
              >
                {/* Checkbox oben links für Mehrfachauswahl */}
                <label className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded border border-slate-300 bg-white/80 px-2 py-1 text-[11px] text-slate-700 shadow-sm backdrop-blur-sm">
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
                    className="aspect-[4/3] w-full object-cover"
                  />
                </div>

                <div className="space-y-2 p-3">
                  <div className="grid grid-cols-5 items-center gap-2">
                    <label className="col-span-1 text-[11px] text-slate-600">
                      Sort
                    </label>
                    <input
                      type="number"
                      className="col-span-4 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
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

                  <div className="grid grid-cols-5 items-center gap-2">
                    <label className="col-span-1 text-[11px] text-slate-600">
                      Alt
                    </label>
                    <input
                      className="col-span-4 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
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
                      className="inline-flex items-center gap-1 rounded-lg bg-sky-600 px-3 py-1.5 text-sm text-white shadow-sm hover:bg-sky-500"
                    >
                      <Save className="h-4 w-4" /> Speichern
                    </button>

                    <button
                      onClick={() => askRemoveOne(it)}
                      className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-sm text-white shadow-sm hover:bg-rose-500"
                    >
                      <Trash2 className="h-4 w-4" /> Löschen
                    </button>
                  </div>

                  <div className="pt-1 text-[11px] text-slate-500">
                    {it.sort === 0 && (
                      <span className="mr-2 inline-block rounded border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
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

      {/* Einzelbild-Löschdialog */}
      {pendingDeleteOne && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <h4 className="text-sm font-semibold text-slate-900">
              Bild löschen?
            </h4>
            <p className="mt-2 text-sm text-slate-600">
              Möchtest du dieses Bild wirklich löschen? Die Aktion kann nicht
              rückgängig gemacht werden.
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              ID: {pendingDeleteOne.id}
              {typeof pendingDeleteOne.sort === "number" &&
                ` · Sort: ${pendingDeleteOne.sort}`}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDeleteOne(null)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={confirmRemoveOne}
                className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-60"
                disabled={busy}
              >
                Ja, löschen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk-Löschdialog */}
      {pendingDeleteMany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <h4 className="text-sm font-semibold text-slate-900">
              Ausgewählte Bilder löschen?
            </h4>
            <p className="mt-2 text-sm text-slate-600">
              Es werden{" "}
              <span className="font-semibold">{selectedExisting.size}</span>{" "}
              Bilder gelöscht. Die Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDeleteMany(false)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={confirmRemoveSelectedMany}
                className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-60"
                disabled={busy}
              >
                Ja, alle löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
