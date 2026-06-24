"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Upload, Save, Trash2 } from "lucide-react";
import { upload } from "@vercel/blob/client";

/* ===========================
   Helpers
=========================== */

function normalizeSort(list) {
  return (list || [])
    .slice()
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
    .map((it, idx) => ({ ...it, sort: idx }));
}

function moveItemById(list, fromId, toId) {
  const arr = normalizeSort(list);
  const from = arr.findIndex((x) => x.id === fromId);
  const to = arr.findIndex((x) => x.id === toId);

  if (from < 0 || to < 0 || from === to) return arr;

  const next = [...arr];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);

  return next.map((it, idx) => ({ ...it, sort: idx }));
}

function safeClientFileName(name = "upload") {
  const dot = name.lastIndexOf(".");
  const rawBase = dot >= 0 ? name.slice(0, dot) : name;
  const rawExt = dot >= 0 ? name.slice(dot).toLowerCase() : "";

  const base = rawBase
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();

  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${
    base || "upload"
  }${rawExt || ".webp"}`;
}

/* ===========================
   Premium Existing Grid
=========================== */

function ExistingImagesPremium({
  items,
  setItems,
  propertyId,
  busy,
  dirtyOrder,
  setDirtyOrder,
  saveOrderAll,
  saveAlt,
  askRemoveOne,
  selectedExisting,
  toggleExisting,
  toggleSelectAll,
  askRemoveSelectedMany,
}) {
  const [draggingId, setDraggingId] = useState(null);
  const pressTimer = useRef(null);
  const dragActive = useRef(false);

  const clearTimer = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const begin = (id) => {
    setDraggingId(id);
    dragActive.current = true;
    document.body.style.userSelect = "none";
  };

  const end = () => {
    dragActive.current = false;
    setDraggingId(null);
    document.body.style.userSelect = "";
  };

  const onOver = (clientX, clientY) => {
    const el = document.elementFromPoint(clientX, clientY);
    const card = el?.closest?.("[data-imgid]");
    const overId = card ? Number(card.getAttribute("data-imgid")) : null;

    if (!overId || !draggingId || overId === draggingId) return;

    setItems((prev) => moveItemById(prev, draggingId, overId));
    setDirtyOrder(true);
  };

  const onPointerDownCard = (e, id) => {
    if (!propertyId) return;
    if (e.target.closest("[data-nosort]")) return;

    if (e.pointerType === "mouse") {
      try {
        e.currentTarget.setPointerCapture?.(e.pointerId);
      } catch {}
      begin(id);
      return;
    }

    clearTimer();

    pressTimer.current = setTimeout(() => {
      try {
        e.currentTarget.setPointerCapture?.(e.pointerId);
      } catch {}
      begin(id);
    }, 180);
  };

  const onPointerMoveGrid = (e) => {
    if (!dragActive.current) return;
    e.preventDefault?.();
    onOver(e.clientX, e.clientY);
  };

  const onPointerUpGrid = () => {
    clearTimer();
    if (dragActive.current) end();
  };

  const setAsCover = (id) => {
    setItems((prev) => {
      const arr = normalizeSort(prev);
      const idx = arr.findIndex((x) => x.id === id);

      if (idx <= 0) return arr;

      const next = [...arr];
      const [picked] = next.splice(idx, 1);
      next.unshift(picked);

      setDirtyOrder(true);

      return next.map((it, i) => ({ ...it, sort: i }));
    });
  };

  const list = normalizeSort(items);

  return (
    <div className="rounded-2xl bg-white p-6 ring-1 ring-black/5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900">Bilderliste</h3>

          {dirtyOrder && (
            <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800">
              Ungespeicherte Reihenfolge
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            disabled={!dirtyOrder || busy || !propertyId}
            onClick={saveOrderAll}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-40"
          >
            <Save className="h-4 w-4" />
            Änderungen speichern
          </button>

          <button
            disabled={selectedExisting.size === 0}
            onClick={askRemoveSelectedMany}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-rose-500 disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" />
            Ausgewählte löschen ({selectedExisting.size})
          </button>

          {list.length > 0 && (
            <label className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={
                  selectedExisting.size > 0 &&
                  selectedExisting.size === list.length
                }
                onChange={toggleSelectAll}
              />
              <span>Alle auswählen</span>
            </label>
          )}
        </div>
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-slate-500">
          Keine Bilder vorhanden. Lade oben neue Bilder hoch.
        </p>
      ) : (
        <>
          <p className="mb-4 text-xs text-slate-500">
            Tipp: <span className="font-medium">Desktop</span> ziehen & ablegen
            · <span className="font-medium">Mobile</span> kurz drücken und
            ziehen.
          </p>

          <div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            onPointerMove={onPointerMoveGrid}
            onPointerUp={onPointerUpGrid}
            onPointerCancel={onPointerUpGrid}
          >
            {list.map((it) => (
              <div
                key={it.id}
                data-imgid={it.id}
                className={[
                  "relative overflow-hidden rounded-2xl bg-white ring-1 ring-black/5 shadow-sm",
                  draggingId === it.id ? "ring-2 ring-sky-400 opacity-90" : "",
                ].join(" ")}
                onPointerDown={(e) => onPointerDownCard(e, it.id)}
                style={{
                  touchAction: draggingId ? "none" : "manipulation",
                  cursor: "grab",
                }}
              >
                <label
                  data-nosort
                  className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-xl border border-slate-200 bg-white/85 px-2.5 py-1.5 text-[11px] text-slate-700 shadow-sm backdrop-blur"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={selectedExisting.has(it.id)}
                    onChange={() => toggleExisting(it.id)}
                  />
                  <span>Auswählen</span>
                </label>

                <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
                  {it.sort === 0 && (
                    <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800 shadow-sm">
                      Titelbild
                    </span>
                  )}

                  <span className="rounded-xl border border-white/15 bg-black/35 px-2.5 py-1 text-[11px] text-white backdrop-blur">
                    #{it.sort + 1}
                  </span>

                  <span className="rounded-xl border border-white/15 bg-black/35 px-2.5 py-1 text-white/90 backdrop-blur">
                    ⠿
                  </span>
                </div>

                <Image
                  src={it.url}
                  alt={it.alt || ""}
                  width={1200}
                  height={900}
                  className="aspect-[4/3] w-full object-cover"
                  draggable={false}
                />

                <div className="space-y-2 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      data-nosort
                      onClick={() => setAsCover(it.id)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Als Titelbild
                    </button>

                    <button
                      type="button"
                      data-nosort
                      onClick={() => askRemoveOne(it)}
                      className="ml-auto inline-flex items-center gap-1 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500"
                    >
                      <Trash2 className="h-4 w-4" />
                      Löschen
                    </button>
                  </div>

                  <div data-nosort>
                    <label className="block text-[11px] text-slate-600">
                      Alt-Text
                    </label>

                    <input
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                      value={it.alt || ""}
                      onChange={(e) => {
                        const val = e.target.value;

                        setItems((prev) =>
                          prev.map((x) =>
                            x.id === it.id ? { ...x, alt: val } : x
                          )
                        );
                      }}
                      onBlur={() => saveAlt(it)}
                    />
                  </div>

                  {dirtyOrder && (
                    <div className="text-[11px] text-amber-700">
                      Reihenfolge geändert – bitte speichern.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ===========================
   Page
=========================== */

export default function AdminImagesPage() {
  const [properties, setProperties] = useState([]);
  const [propertyId, setPropertyId] = useState("");
  const [items, setItems] = useState([]);
  const [selectedNew, setSelectedNew] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState(null);
  const [selectedExisting, setSelectedExisting] = useState(new Set());
  const [pendingDeleteOne, setPendingDeleteOne] = useState(null);
  const [pendingDeleteMany, setPendingDeleteMany] = useState(false);
  const [dirtyOrder, setDirtyOrder] = useState(false);

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
    setItems([]);
    setSelectedExisting(new Set());
    setMsg(null);
    setErr("");
    setDirtyOrder(false);

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

        setItems(normalizeSort(Array.isArray(data) ? data : []));
        setDirtyOrder(false);
      } catch {
        setMsg({ t: "error", m: "Bilder konnten nicht geladen werden." });
      }
    })();
  }, [propertyId]);

  function onPick(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";

    setSelectedNew((prev) => {
      const baseSortStart = prev.length;

      const mapped = files.map((file, i) => {
        const url = URL.createObjectURL(file);
        const base = (file.name || "").replace(/\.[^/.]+$/, "");

        return {
          id: crypto.randomUUID(),
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

  async function uploadAll() {
    if (!propertyId || selectedNew.length === 0) return;

    setBusy(true);
    setErr("");
    setMsg(null);

    try {
      const uploadedFiles = [];

      for (const s of selectedNew) {
        const filename = safeClientFileName(s.file.name);
        const pathname = `objects/property-${propertyId}/${filename}`;

        const blob = await upload(pathname, s.file, {
          access: "public",
          handleUploadUrl: "/api/admin/upload",
          multipart: true,
          clientPayload: JSON.stringify({
            propertyId: Number(propertyId),
          }),
        });

        uploadedFiles.push({
          url: blob.url,
          pathname: blob.pathname,
          name: s.file.name || filename,
        });
      }

      const images = selectedNew.map((s, i) => ({
        url: uploadedFiles[i].url,
        alt: s.alt || null,
        sort: i,
      }));

      const saveRes = await fetch("/api/admin/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: Number(propertyId),
          images,
        }),
      });

      const saveText = await saveRes.text();

      let saveJson = null;

      try {
        saveJson = JSON.parse(saveText);
      } catch {}

      if (!saveRes.ok) {
        console.error("SAVE FAIL", saveRes.status, saveText);

        throw new Error(
          saveJson?.details ||
            saveJson?.error ||
            saveText ||
            `Speichern fehlgeschlagen (${saveRes.status})`
        );
      }

      const freshImages = saveJson?.images ?? saveJson;

      setItems(normalizeSort(Array.isArray(freshImages) ? freshImages : []));
      setSelectedExisting(new Set());
      setDirtyOrder(false);

      selectedNew.forEach((s) => URL.revokeObjectURL(s.preview));
      setSelectedNew([]);

      setMsg({ t: "ok", m: "Bilder wurden hochgeladen und gespeichert." });
    } catch (e) {
      console.error(e);

      setErr(e?.message || "Fehler beim Upload/Speichern.");
      setMsg({ t: "error", m: "Upload oder Speichern fehlgeschlagen." });
    } finally {
      setBusy(false);
    }
  }

  async function save(item) {
    setMsg(null);

    try {
      const res = await fetch("/api/admin/images", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          alt: item.alt,
          sort: Number(item.sort ?? 0),
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
        setItems(normalizeSort(data.images));

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

        setItems(normalizeSort(again || []));
      }

      setMsg({ t: "ok", m: "Bilddaten wurden gespeichert." });
    } catch {
      setMsg({ t: "error", m: "Netzwerkfehler beim Speichern." });
    }
  }

  const saveAlt = (it) => save(it);

  async function saveOrderAll() {
    if (!propertyId || items.length === 0) return;

    setBusy(true);
    setMsg(null);

    try {
      const normalized = normalizeSort(items);

      const res = await fetch("/api/admin/images/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: Number(propertyId),
          order: normalized.map((it) => ({
            id: it.id,
            sort: it.sort,
          })),
        }),
      });

      if (res.status === 401) {
        window.location.href = "/admin";
        return;
      }

      const text = await res.text();

      let json = null;

      try {
        json = JSON.parse(text);
      } catch {}

      if (!res.ok) {
        throw new Error(json?.error || "Speichern fehlgeschlagen.");
      }

      const fresh = json?.images ?? json;

      if (Array.isArray(fresh)) {
        setItems(normalizeSort(fresh));
      }

      setDirtyOrder(false);
      setMsg({ t: "ok", m: "Reihenfolge gespeichert." });
    } catch (e) {
      setMsg({ t: "error", m: e?.message || "Fehler beim Speichern." });
    } finally {
      setBusy(false);
    }
  }

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
        setItems(normalizeSort(fresh.images));
      } else {
        const again = await fetch(
          `/api/admin/images?propertyId=${propertyId}`
        ).then((r) => r.json());

        setItems(normalizeSort(again || []));
      }

      setSelectedExisting((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      setMsg({ t: "ok", m: "Bild wurde gelöscht." });
      setPendingDeleteOne(null);
      setDirtyOrder(false);
    } catch {
      setMsg({ t: "error", m: "Netzwerkfehler beim Löschen." });
    } finally {
      setBusy(false);
    }
  }

  function toggleExisting(id) {
    setSelectedExisting((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

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
        setItems(normalizeSort(data.images));
      } else {
        const again = await fetch(
          `/api/admin/images?propertyId=${propertyId}`
        ).then((r) => r.json());

        setItems(normalizeSort(again || []));
      }

      setSelectedExisting(new Set());
      setMsg({ t: "ok", m: "Ausgewählte Bilder wurden gelöscht." });
      setPendingDeleteMany(false);
      setDirtyOrder(false);
    } catch {
      setMsg({ t: "error", m: "Netzwerkfehler beim Löschen." });
      setPendingDeleteMany(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto mt-24 max-w-6xl px-4 py-8 md:py-10">
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
                key={s.id}
                className="flex flex-col overflow-hidden rounded-xl bg-white ring-1 ring-black/5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.preview}
                  alt=""
                  className="aspect-[4/3] w-full object-cover"
                />

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

      <ExistingImagesPremium
        items={items}
        setItems={setItems}
        propertyId={propertyId}
        busy={busy}
        dirtyOrder={dirtyOrder}
        setDirtyOrder={setDirtyOrder}
        saveOrderAll={saveOrderAll}
        saveAlt={saveAlt}
        askRemoveOne={askRemoveOne}
        selectedExisting={selectedExisting}
        toggleExisting={toggleExisting}
        toggleSelectAll={toggleSelectAll}
        askRemoveSelectedMany={askRemoveSelectedMany}
      />

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