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
   Existing Images
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

    const overId = card
      ? Number(card.getAttribute("data-imgid"))
      : null;

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

    if (dragActive.current) {
      end();
    }
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

      return next.map((it, i) => ({
        ...it,
        sort: i,
      }));
    });
  };

  const list = normalizeSort(items);

  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
      {/* HEADER */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">
              Bilderliste
            </h3>

            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              {list.length} Bilder
            </span>

            {dirtyOrder && (
              <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                Reihenfolge geändert
              </span>
            )}
          </div>

          <p className="mt-1 text-xs text-slate-500">
            Bilder ziehen und direkt an die gewünschte Position setzen.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!dirtyOrder || busy || !propertyId}
            onClick={saveOrderAll}
            className="
              inline-flex items-center gap-2
              rounded-lg
              bg-slate-900
              px-3 py-2
              text-xs font-semibold text-white
              shadow-sm
              transition
              hover:bg-slate-800
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
          >
            <Save className="h-4 w-4" />

            Reihenfolge speichern
          </button>

          <button
            type="button"
            disabled={selectedExisting.size === 0}
            onClick={askRemoveSelectedMany}
            className="
              inline-flex items-center gap-1.5
              rounded-lg
              border border-rose-200
              bg-rose-50
              px-3 py-2
              text-xs font-semibold text-rose-700
              transition
              hover:bg-rose-100
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
          >
            <Trash2 className="h-4 w-4" />

            Löschen ({selectedExisting.size})
          </button>

          {list.length > 0 && (
            <label
              className="
                inline-flex cursor-pointer items-center gap-2
                rounded-lg
                border border-slate-200
                bg-white
                px-3 py-2
                text-xs text-slate-600
                shadow-sm
                hover:bg-slate-50
              "
            >
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300"
                checked={
                  selectedExisting.size > 0 &&
                  selectedExisting.size === list.length
                }
                onChange={toggleSelectAll}
              />

              <span>Alle</span>
            </label>
          )}
        </div>
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-slate-500">
          Keine Bilder vorhanden. Lade oben neue Bilder hoch.
        </p>
      ) : (
        <div
          className="
            grid
            grid-cols-2
            gap-3
            sm:grid-cols-3
            lg:grid-cols-4
            xl:grid-cols-5
          "
          onPointerMove={onPointerMoveGrid}
          onPointerUp={onPointerUpGrid}
          onPointerCancel={onPointerUpGrid}
        >
          {list.map((it) => (
            <div
              key={it.id}
              data-imgid={it.id}
              className={[
                `
                  group
                  relative
                  overflow-hidden
                  rounded-xl
                  border
                  bg-white
                  shadow-sm
                  transition-all
                  duration-150
                `,
                draggingId === it.id
                  ? `
                    z-20
                    scale-[1.03]
                    border-sky-400
                    shadow-xl
                    ring-2
                    ring-sky-200
                  `
                  : `
                    border-slate-200
                    hover:-translate-y-0.5
                    hover:border-slate-300
                    hover:shadow-md
                  `,
              ].join(" ")}
              onPointerDown={(e) =>
                onPointerDownCard(e, it.id)
              }
              style={{
                touchAction:
                  draggingId ? "none" : "manipulation",
                cursor:
                  draggingId === it.id
                    ? "grabbing"
                    : "grab",
              }}
            >
              {/* IMAGE */}
              <div className="relative overflow-hidden bg-slate-100">
                <Image
                  src={it.url}
                  alt={it.alt || ""}
                  width={900}
                  height={675}
                  className="
                    aspect-[4/3]
                    w-full
                    object-cover
                    transition
                    duration-200
                    group-hover:scale-[1.02]
                  "
                  draggable={false}
                />

                <div
                  className="
                    pointer-events-none
                    absolute
                    inset-x-0
                    top-0
                    h-16
                    bg-gradient-to-b
                    from-black/45
                    to-transparent
                  "
                />

                {/* POSITION */}
                <div className="absolute left-2 top-2 z-10 flex items-center gap-1.5">
                  <span
                    className="
                      flex
                      h-8
                      min-w-8
                      items-center
                      justify-center
                      rounded-lg
                      bg-slate-950/80
                      px-2
                      text-sm
                      font-bold
                      text-white
                      shadow-sm
                      backdrop-blur
                    "
                  >
                    {it.sort + 1}
                  </span>

                  {it.sort === 0 && (
                    <span
                      className="
                        rounded-lg
                        bg-emerald-500/95
                        px-2 py-1
                        text-[10px]
                        font-bold
                        text-white
                        shadow-sm
                      "
                    >
                      TITEL
                    </span>
                  )}
                </div>

                {/* CHECKBOX */}
                <label
                  data-nosort
                  title="Bild auswählen"
                  className="
                    absolute
                    right-2
                    top-2
                    z-10
                    flex
                    h-8
                    w-8
                    cursor-pointer
                    items-center
                    justify-center
                    rounded-lg
                    bg-white/95
                    shadow-sm
                    backdrop-blur
                    transition
                    hover:bg-white
                  "
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300"
                    checked={selectedExisting.has(it.id)}
                    onChange={() =>
                      toggleExisting(it.id)
                    }
                  />
                </label>

                {/* DRAG INFO */}
                <div
                  className="
                    pointer-events-none
                    absolute
                    bottom-2
                    right-2
                    rounded-lg
                    bg-black/55
                    px-2 py-1
                    text-xs
                    font-semibold
                    text-white/95
                    backdrop-blur
                  "
                >
                  ⠿ ziehen
                </div>
              </div>

              {/* CONTENT */}
              <div className="space-y-2 p-2.5">
                <div data-nosort>
                  <label className="sr-only">
                    Alt-Text
                  </label>

                  <input
                    className="
                      h-8
                      w-full
                      rounded-lg
                      border
                      border-slate-200
                      bg-slate-50
                      px-2.5
                      text-xs
                      text-slate-700
                      outline-none
                      transition
                      placeholder:text-slate-400
                      focus:border-sky-400
                      focus:bg-white
                      focus:ring-2
                      focus:ring-sky-100
                    "
                    value={it.alt || ""}
                    placeholder="Alt-Text"
                    onChange={(e) => {
                      const val = e.target.value;

                      setItems((prev) =>
                        prev.map((x) =>
                          x.id === it.id
                            ? {
                                ...x,
                                alt: val,
                              }
                            : x
                        )
                      );
                    }}
                    onBlur={() => saveAlt(it)}
                  />
                </div>

                <div
                  className="flex items-center gap-1.5"
                  data-nosort
                >
                  <button
                    type="button"
                    onClick={() =>
                      setAsCover(it.id)
                    }
                    disabled={it.sort === 0}
                    className="
                      min-w-0
                      flex-1
                      rounded-lg
                      border
                      border-slate-200
                      bg-white
                      px-2 py-1.5
                      text-[11px]
                      font-medium
                      text-slate-600
                      transition
                      hover:bg-slate-50
                      disabled:cursor-default
                      disabled:bg-emerald-50
                      disabled:text-emerald-700
                    "
                  >
                    {it.sort === 0
                      ? "Titelbild"
                      : "Als Titel"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      askRemoveOne(it)
                    }
                    title="Bild löschen"
                    className="
                      inline-flex
                      h-7
                      w-7
                      shrink-0
                      items-center
                      justify-center
                      rounded-lg
                      border
                      border-rose-200
                      bg-rose-50
                      text-rose-600
                      transition
                      hover:bg-rose-100
                    "
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ===========================
   PAGE
=========================== */

export default function AdminImagesPage() {
  const [properties, setProperties] = useState([]);
  const [propertyId, setPropertyId] = useState("");

  const [items, setItems] = useState([]);

  const [selectedNew, setSelectedNew] = useState([]);

  const [busy, setBusy] = useState(false);

  const [
    isLoadingProperties,
    setIsLoadingProperties,
  ] = useState(true);

  const [
    isLoadingImages,
    setIsLoadingImages,
  ] = useState(false);

  const [err, setErr] = useState("");
  const [msg, setMsg] = useState(null);

  const [
    selectedExisting,
    setSelectedExisting,
  ] = useState(new Set());

  const [
    pendingDeleteOne,
    setPendingDeleteOne,
  ] = useState(null);

  const [
    pendingDeleteMany,
    setPendingDeleteMany,
  ] = useState(false);

  const [
    dirtyOrder,
    setDirtyOrder,
  ] = useState(false);

  /* ===========================
     PROPERTY FROM URL
  =========================== */

  useEffect(() => {
    const searchParams =
      new URLSearchParams(
        window.location.search
      );

    const propertyIdFromUrl =
      searchParams.get("propertyId");

    if (propertyIdFromUrl) {
      setPropertyId(propertyIdFromUrl);
    }
  }, []);

  /* ===========================
     LOAD PROPERTIES
  =========================== */

  useEffect(() => {
    const controller =
      new AbortController();

    async function loadProperties() {
      setIsLoadingProperties(true);

      try {
        const response = await fetch(
          "/api/admin/properties",
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );

        if (response.status === 401) {
          window.location.href = "/admin";
          return;
        }

        const data = await response
          .json()
          .catch(() => []);

        if (!response.ok) {
          throw new Error(
            data?.error ||
              "Unterkünfte konnten nicht geladen werden."
          );
        }

        const sortedProperties =
          Array.isArray(data)
            ? [...data].sort((a, b) =>
                String(
                  a.title || ""
                ).localeCompare(
                  String(b.title || ""),
                  "de",
                  {
                    sensitivity:
                      "base",
                  }
                )
              )
            : [];

        setProperties(sortedProperties);
      } catch (error) {
        if (
          error?.name === "AbortError"
        ) {
          return;
        }

        setProperties([]);

        setMsg({
          t: "error",
          m:
            error?.message ||
            "Unterkünfte konnten nicht geladen werden.",
        });
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingProperties(false);
        }
      }
    }

    loadProperties();

    return () => {
      controller.abort();
    };
  }, []);

  /* ===========================
     LOAD IMAGES
  =========================== */

  useEffect(() => {
    setItems([]);
    setSelectedExisting(new Set());
    setMsg(null);
    setErr("");
    setDirtyOrder(false);

    if (!propertyId) {
      setIsLoadingImages(false);
      return;
    }

    const controller =
      new AbortController();

    async function loadImages() {
      setIsLoadingImages(true);

      try {
        const response = await fetch(
          `/api/admin/images?propertyId=${encodeURIComponent(
            propertyId
          )}`,
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );

        if (response.status === 401) {
          window.location.href = "/admin";
          return;
        }

        const data = await response
          .json()
          .catch(() => []);

        if (!response.ok) {
          throw new Error(
            data?.error ||
              "Bilder konnten nicht geladen werden."
          );
        }

        setItems(
          normalizeSort(
            Array.isArray(data)
              ? data
              : []
          )
        );

        setDirtyOrder(false);
      } catch (error) {
        if (
          error?.name === "AbortError"
        ) {
          return;
        }

        setItems([]);

        setMsg({
          t: "error",
          m:
            error?.message ||
            "Bilder konnten nicht geladen werden.",
        });
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingImages(false);
        }
      }
    }

    loadImages();

    return () => {
      controller.abort();
    };
  }, [propertyId]);

  /* ===========================
     PROPERTY CHANGE
  =========================== */

  function handlePropertyChange(event) {
    const nextPropertyId =
      event.target.value;

    setSelectedNew(
      (currentItems) => {
        currentItems.forEach(
          (item) => {
            if (item.preview) {
              URL.revokeObjectURL(
                item.preview
              );
            }
          }
        );

        return [];
      }
    );

    setPendingDeleteOne(null);
    setPendingDeleteMany(false);

    setPropertyId(nextPropertyId);

    const url = new URL(
      window.location.href
    );

    if (nextPropertyId) {
      url.searchParams.set(
        "propertyId",
        nextPropertyId
      );
    } else {
      url.searchParams.delete(
        "propertyId"
      );
    }

    window.history.replaceState(
      {},
      "",
      `${url.pathname}${url.search}${url.hash}`
    );
  }

  /* ===========================
     PICK NEW IMAGES
  =========================== */

  function onPick(e) {
    const files = Array.from(
      e.target.files || []
    );

    e.target.value = "";

    setSelectedNew((prev) => {
      const baseSortStart =
        prev.length;

      const mapped = files.map(
        (file, i) => {
          const url =
            URL.createObjectURL(file);

          const base = (
            file.name || ""
          ).replace(
            /\.[^/.]+$/,
            ""
          );

          return {
            id: crypto.randomUUID(),
            file,
            preview: url,
            alt: base,
            sort:
              baseSortStart + i,
          };
        }
      );

      return [
        ...prev,
        ...mapped,
      ];
    });
  }

  function updateNewAlt(idx, val) {
    setSelectedNew((s) =>
      s.map((it, i) =>
        i === idx
          ? {
              ...it,
              alt: val,
            }
          : it
      )
    );
  }

  function moveNewImageUp(idx) {
    setSelectedNew((prev) => {
      if (idx <= 0) return prev;

      const arr = [...prev];

      [
        arr[idx - 1],
        arr[idx],
      ] = [
        arr[idx],
        arr[idx - 1],
      ];

      return arr.map(
        (item, newIndex) => ({
          ...item,
          sort: newIndex,
        })
      );
    });
  }

  function moveNewImageDown(idx) {
    setSelectedNew((prev) => {
      if (
        idx >=
        prev.length - 1
      ) {
        return prev;
      }

      const arr = [...prev];

      [
        arr[idx + 1],
        arr[idx],
      ] = [
        arr[idx],
        arr[idx + 1],
      ];

      return arr.map(
        (item, newIndex) => ({
          ...item,
          sort: newIndex,
        })
      );
    });
  }

  /* ===========================
     UPLOAD
  =========================== */

  async function uploadAll() {
    if (
      !propertyId ||
      selectedNew.length === 0
    ) {
      return;
    }

    setBusy(true);
    setErr("");
    setMsg(null);

    try {
      const uploadedFiles = [];

      for (const s of selectedNew) {
        const filename =
          safeClientFileName(
            s.file.name
          );

        const pathname =
          `objects/property-${propertyId}/${filename}`;

        const blob = await upload(
          pathname,
          s.file,
          {
            access: "public",

            handleUploadUrl:
              "/api/admin/upload",

            multipart: true,

            clientPayload:
              JSON.stringify({
                propertyId:
                  Number(propertyId),
              }),
          }
        );

        uploadedFiles.push({
          url: blob.url,
          pathname:
            blob.pathname,
          name:
            s.file.name ||
            filename,
        });
      }

      const images =
        selectedNew.map(
          (s, i) => ({
            url:
              uploadedFiles[i]
                .url,
            alt:
              s.alt || null,
            sort: i,
          })
        );

      const saveRes =
        await fetch(
          "/api/admin/images",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              propertyId:
                Number(propertyId),

              images,
            }),
          }
        );

      const saveText =
        await saveRes.text();

      let saveJson = null;

      try {
        saveJson =
          JSON.parse(saveText);
      } catch {}

      if (!saveRes.ok) {
        console.error(
          "SAVE FAIL",
          saveRes.status,
          saveText
        );

        throw new Error(
          saveJson?.details ||
            saveJson?.error ||
            saveText ||
            `Speichern fehlgeschlagen (${saveRes.status})`
        );
      }

      const freshImages =
        saveJson?.images ??
        saveJson;

      setItems(
        normalizeSort(
          Array.isArray(
            freshImages
          )
            ? freshImages
            : []
        )
      );

      setSelectedExisting(
        new Set()
      );

      setDirtyOrder(false);

      selectedNew.forEach(
        (s) =>
          URL.revokeObjectURL(
            s.preview
          )
      );

      setSelectedNew([]);

      setMsg({
        t: "ok",
        m:
          "Bilder wurden hochgeladen und gespeichert.",
      });
    } catch (e) {
      console.error(e);

      setErr(
        e?.message ||
          "Fehler beim Upload/Speichern."
      );

      setMsg({
        t: "error",
        m:
          "Upload oder Speichern fehlgeschlagen.",
      });
    } finally {
      setBusy(false);
    }
  }

  /* ===========================
     SAVE ALT
  =========================== */

  async function save(item) {
    setMsg(null);

    try {
      const res = await fetch(
        "/api/admin/images",
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            id: item.id,
            alt: item.alt,
            sort: Number(
              item.sort ?? 0
            ),
          }),
        }
      );

      if (res.status === 401) {
        window.location.href =
          "/admin";

        return;
      }

      const data =
        await res.json();

      if (!res.ok) {
        setMsg({
          t: "error",
          m:
            data?.error ||
            "Speichern fehlgeschlagen.",
        });

        return;
      }

      if (data.images) {
        setItems(
          normalizeSort(
            data.images
          )
        );

        setSelectedExisting(
          (prev) => {
            const stillExisting =
              new Set();

            for (const img of data.images) {
              if (
                prev.has(img.id)
              ) {
                stillExisting.add(
                  img.id
                );
              }
            }

            return stillExisting;
          }
        );
      } else {
        const again =
          await fetch(
            `/api/admin/images?propertyId=${propertyId}`
          ).then((r) =>
            r.json()
          );

        setItems(
          normalizeSort(
            again || []
          )
        );
      }

      setMsg({
        t: "ok",
        m:
          "Bilddaten wurden gespeichert.",
      });
    } catch {
      setMsg({
        t: "error",
        m:
          "Netzwerkfehler beim Speichern.",
      });
    }
  }

  const saveAlt = (it) =>
    save(it);

  /* ===========================
     SAVE ORDER
  =========================== */

  async function saveOrderAll() {
    if (
      !propertyId ||
      items.length === 0
    ) {
      return;
    }

    setBusy(true);
    setMsg(null);

    try {
      const normalized =
        normalizeSort(items);

      const res = await fetch(
        "/api/admin/images/reorder",
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            propertyId:
              Number(propertyId),

            ids: normalized.map(
              (it) => it.id
            ),
          }),
        }
      );

      if (res.status === 401) {
        window.location.href =
          "/admin";

        return;
      }

      const text =
        await res.text();

      let json = null;

      try {
        json =
          JSON.parse(text);
      } catch {}

      if (!res.ok) {
        throw new Error(
          json?.error ||
            "Speichern fehlgeschlagen."
        );
      }

      const fresh =
        json?.images ?? json;

      if (
        Array.isArray(fresh)
      ) {
        setItems(
          normalizeSort(fresh)
        );
      }

      setDirtyOrder(false);

      setMsg({
        t: "ok",
        m:
          "Reihenfolge gespeichert.",
      });
    } catch (e) {
      setMsg({
        t: "error",
        m:
          e?.message ||
          "Fehler beim Speichern.",
      });
    } finally {
      setBusy(false);
    }
  }

  /* ===========================
     DELETE ONE
  =========================== */

  function askRemoveOne(item) {
    setMsg(null);
    setPendingDeleteOne(item);
  }

  async function confirmRemoveOne() {
    if (
      !pendingDeleteOne ||
      !propertyId
    ) {
      return;
    }

    const id =
      pendingDeleteOne.id;

    setBusy(true);

    try {
      const res = await fetch(
        `/api/admin/images/${id}`,
        {
          method: "DELETE",
        }
      );

      if (res.status === 401) {
        window.location.href =
          "/admin";

        return;
      }

      if (!res.ok) {
        setMsg({
          t: "error",
          m:
            "Löschen fehlgeschlagen.",
        });

        setPendingDeleteOne(
          null
        );

        return;
      }

      const fresh =
        await res.json();

      if (fresh?.images) {
        setItems(
          normalizeSort(
            fresh.images
          )
        );
      } else {
        const again =
          await fetch(
            `/api/admin/images?propertyId=${propertyId}`
          ).then((r) =>
            r.json()
          );

        setItems(
          normalizeSort(
            again || []
          )
        );
      }

      setSelectedExisting(
        (prev) => {
          const next =
            new Set(prev);

          next.delete(id);

          return next;
        }
      );

      setMsg({
        t: "ok",
        m: "Bild wurde gelöscht.",
      });

      setPendingDeleteOne(
        null
      );

      setDirtyOrder(false);
    } catch {
      setMsg({
        t: "error",
        m:
          "Netzwerkfehler beim Löschen.",
      });
    } finally {
      setBusy(false);
    }
  }

  /* ===========================
     SELECT
  =========================== */

  function toggleExisting(id) {
    setSelectedExisting(
      (prev) => {
        const next =
          new Set(prev);

        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }

        return next;
      }
    );
  }

  function toggleSelectAll() {
    setSelectedExisting(
      (prev) => {
        if (
          prev.size ===
          items.length
        ) {
          return new Set();
        }

        return new Set(
          items.map(
            (i) => i.id
          )
        );
      }
    );
  }

  /* ===========================
     DELETE MANY
  =========================== */

  function askRemoveSelectedMany() {
    if (
      selectedExisting.size === 0
    ) {
      return;
    }

    setMsg(null);

    setPendingDeleteMany(
      true
    );
  }

  async function confirmRemoveSelectedMany() {
    if (
      selectedExisting.size === 0 ||
      !propertyId
    ) {
      setPendingDeleteMany(
        false
      );

      return;
    }

    const ids =
      Array.from(
        selectedExisting
      );

    setBusy(true);

    try {
      const res = await fetch(
        "/api/admin/images/bulk-delete",
        {
          method: "DELETE",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            propertyId:
              Number(propertyId),

            ids,
          }),
        }
      );

      if (res.status === 401) {
        window.location.href =
          "/admin";

        return;
      }

      if (!res.ok) {
        setMsg({
          t: "error",
          m:
            "Löschen fehlgeschlagen.",
        });

        setPendingDeleteMany(
          false
        );

        return;
      }

      const data =
        await res.json();

      if (data?.images) {
        setItems(
          normalizeSort(
            data.images
          )
        );
      } else {
        const again =
          await fetch(
            `/api/admin/images?propertyId=${propertyId}`
          ).then((r) =>
            r.json()
          );

        setItems(
          normalizeSort(
            again || []
          )
        );
      }

      setSelectedExisting(
        new Set()
      );

      setMsg({
        t: "ok",
        m:
          "Ausgewählte Bilder wurden gelöscht.",
      });

      setPendingDeleteMany(
        false
      );

      setDirtyOrder(false);
    } catch {
      setMsg({
        t: "error",
        m:
          "Netzwerkfehler beim Löschen.",
      });

      setPendingDeleteMany(
        false
      );
    } finally {
      setBusy(false);
    }
  }

  /* ===========================
     RENDER
  =========================== */

  return (
    <section className="mx-auto mt-24 max-w-6xl px-4 py-8 md:py-10">
      {/* MESSAGES */}

      <div className="mb-4 space-y-2">
        {msg &&
          msg.t === "error" && (
            <div className="flex items-start justify-between gap-3 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              <span>
                {msg.m}
              </span>

              <button
                type="button"
                className="text-xs text-rose-500"
                onClick={() =>
                  setMsg(null)
                }
              >
                Schließen
              </button>
            </div>
          )}

        {msg &&
          msg.t === "ok" && (
            <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              <span>
                {msg.m}
              </span>

              <button
                type="button"
                className="text-xs text-emerald-600"
                onClick={() =>
                  setMsg(null)
                }
              >
                Schließen
              </button>
            </div>
          )}
      </div>

      {/* PAGE HEADER */}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
            Admin · Bilder
          </p>

          <h1 className="text-2xl font-semibold text-slate-900">
            Bilder verwalten
          </h1>

          <p className="mt-1 text-sm text-slate-600">
            Bilder hochladen,
            Reihenfolge festlegen
            und Alt-Texte pflegen.
          </p>
        </div>

        <div className="sm:ml-auto">
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            Objekt wählen
          </label>

          <select
            className="
              w-full
              rounded-xl
              border
              border-slate-300
              bg-white
              px-3 py-2
              text-sm
              text-slate-900
              shadow-sm
              focus:border-sky-500
              focus:outline-none
              focus:ring-2
              focus:ring-sky-400/60
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
            value={propertyId}
            onChange={
              handlePropertyChange
            }
            disabled={
              isLoadingProperties
            }
          >
            <option value="">
              {isLoadingProperties
                ? "Objekte werden geladen …"
                : "— Objekt wählen —"}
            </option>

            {properties.map(
              (p) => (
                <option
                  key={p.id}
                  value={p.id}
                >
                  {p.title}
                </option>
              )
            )}
          </select>
        </div>
      </div>

      {/* NEW IMAGES */}

      <div className="mb-6 rounded-2xl bg-white p-5 ring-1 ring-black/5">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">
          Neue Bilder
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
            disabled={
              !propertyId ||
              selectedNew.length === 0 ||
              busy
            }
            onClick={uploadAll}
            className="
              inline-flex
              items-center
              gap-2
              rounded-xl
              bg-sky-600
              px-4 py-2
              text-sm
              font-medium
              text-white
              shadow-sm
              hover:bg-sky-500
              disabled:opacity-50
            "
          >
            <Upload className="h-4 w-4" />

            Alle hochladen
          </button>

          {busy && (
            <span className="text-sm text-slate-500">
              Bitte warten…
            </span>
          )}
        </div>

        {err && (
          <p className="mb-3 text-sm text-rose-600">
            {err}
          </p>
        )}

        {selectedNew.length >
          0 && (
          <div
            className="
              grid
              grid-cols-2
              gap-3
              sm:grid-cols-3
              lg:grid-cols-4
              xl:grid-cols-5
            "
          >
            {selectedNew.map(
              (s, idx) => (
                <div
                  key={s.id}
                  className="
                    flex
                    flex-col
                    overflow-hidden
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    shadow-sm
                  "
                >
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={s.preview}
                      alt=""
                      className="aspect-[4/3] w-full object-cover"
                    />

                    <div className="absolute left-2 top-2 flex h-8 min-w-8 items-center justify-center rounded-lg bg-slate-950/80 px-2 text-sm font-bold text-white shadow-sm">
                      {idx + 1}
                    </div>

                    {idx === 0 && (
                      <div className="absolute right-2 top-2 rounded-lg bg-emerald-500 px-2 py-1 text-[10px] font-bold text-white">
                        TITEL
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 bg-slate-50 p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500">
                        Position{" "}
                        <strong>
                          {idx + 1}
                        </strong>
                      </span>

                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            moveNewImageUp(
                              idx
                            )
                          }
                          disabled={
                            idx === 0
                          }
                          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs hover:bg-slate-100 disabled:opacity-30"
                        >
                          ↑
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            moveNewImageDown(
                              idx
                            )
                          }
                          disabled={
                            idx ===
                            selectedNew.length -
                              1
                          }
                          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs hover:bg-slate-100 disabled:opacity-30"
                        >
                          ↓
                        </button>
                      </div>
                    </div>

                    <input
                      className="
                        h-8
                        w-full
                        rounded-lg
                        border
                        border-slate-300
                        px-2.5
                        text-xs
                        text-slate-900
                        focus:border-sky-500
                        focus:outline-none
                        focus:ring-2
                        focus:ring-sky-400/30
                      "
                      value={s.alt}
                      placeholder="Alt-Text"
                      onChange={(e) =>
                        updateNewAlt(
                          idx,
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* EXISTING */}

      {!propertyId ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          Bitte zuerst oben ein
          Objekt auswählen.
        </div>
      ) : isLoadingImages ? (
        <div className="rounded-2xl bg-white p-6 text-sm text-slate-500 ring-1 ring-black/5">
          Bilder werden geladen …
        </div>
      ) : (
        <ExistingImagesPremium
          items={items}
          setItems={setItems}
          propertyId={
            propertyId
          }
          busy={busy}
          dirtyOrder={
            dirtyOrder
          }
          setDirtyOrder={
            setDirtyOrder
          }
          saveOrderAll={
            saveOrderAll
          }
          saveAlt={saveAlt}
          askRemoveOne={
            askRemoveOne
          }
          selectedExisting={
            selectedExisting
          }
          toggleExisting={
            toggleExisting
          }
          toggleSelectAll={
            toggleSelectAll
          }
          askRemoveSelectedMany={
            askRemoveSelectedMany
          }
        />
      )}

      {/* DELETE ONE MODAL */}

      {pendingDeleteOne && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <h4 className="text-sm font-semibold text-slate-900">
              Bild löschen?
            </h4>

            <p className="mt-2 text-sm text-slate-600">
              Möchtest du dieses
              Bild wirklich löschen?
              Die Aktion kann nicht
              rückgängig gemacht
              werden.
            </p>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() =>
                  setPendingDeleteOne(
                    null
                  )
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Abbrechen
              </button>

              <button
                type="button"
                onClick={
                  confirmRemoveOne
                }
                disabled={busy}
                className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-60"
              >
                Ja, löschen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MANY MODAL */}

      {pendingDeleteMany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <h4 className="text-sm font-semibold text-slate-900">
              Ausgewählte Bilder
              löschen?
            </h4>

            <p className="mt-2 text-sm text-slate-600">
              Es werden{" "}
              <span className="font-semibold">
                {
                  selectedExisting.size
                }
              </span>{" "}
              Bilder gelöscht. Die
              Aktion kann nicht
              rückgängig gemacht
              werden.
            </p>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() =>
                  setPendingDeleteMany(
                    false
                  )
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Abbrechen
              </button>

              <button
                type="button"
                onClick={
                  confirmRemoveSelectedMany
                }
                disabled={busy}
                className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-60"
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