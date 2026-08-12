"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar,
  CalendarDays,
  Dog,
  Euro,
  Eye,
  Home,
  Images,
  MapPin,
  Pencil,
  Plus,
  Save,
  Search,
  Settings,
  Tag,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";

const EMPTY_FORM = {
  id: null,
  title: "",
  location: "",
  maxPersons: 2,
  dogsAllowed: false,
  description: "",
  slug: "",
  amenityNames: [],
};

const MANAGEMENT_ITEMS = [
  {
    key: "prices",
    title: "Preiszeiten",
    description: "Saisonpreise und Zeiträume",
    href: "/admin/prices",
    icon: Euro,
  },
  {
    key: "fees",
    title: "Nebenkosten",
    description: "Endreinigung und Zuschläge",
    href: "/admin/fees",
    icon: Settings,
  },
  {
    key: "images",
    title: "Bilder",
    description: "Upload und Reihenfolge",
    href: "/admin/images",
    icon: Images,
  },
  {
    key: "availability",
    title: "Verfügbarkeit",
    description: "Belegungen und Sperrzeiten",
    href: "/admin/availability",
    icon: CalendarDays,
  },
  {
    key: "ical",
    title: "iCal",
    description: "Import und Synchronisation",
    href: "/admin/ical",
    icon: Upload,
  },
  {
    key: "lastminute",
    title: "Last-Minute",
    description: "Rabatte und Angebote",
    href: "/admin/lastminute",
    icon: Tag,
  },
];

function sortProperties(properties) {
  return [...properties].sort((a, b) =>
    String(a.title || "").localeCompare(String(b.title || ""), "de", {
      sensitivity: "base",
    })
  );
}

export default function AdminPropertiesPage() {
  const formSectionRef = useRef(null);

  const [items, setItems] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState(EMPTY_FORM);

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const [pendingDelete, setPendingDelete] = useState(null);

  const [showAmenityInput, setShowAmenityInput] = useState(false);
  const [newAmenityName, setNewAmenityName] = useState("");

  const editing = useMemo(() => form.id !== null, [form.id]);

  const filteredItems = useMemo(() => {
    const searchValue = searchTerm
      .trim()
      .toLocaleLowerCase("de");

    if (!searchValue) {
      return items;
    }

    return items.filter((item) => {
      const searchableValues = [
        item.id,
        item.title,
        item.location,
        item.slug,
      ];

      return searchableValues.some((value) =>
        String(value ?? "")
          .toLocaleLowerCase("de")
          .includes(searchValue)
      );
    });
  }, [items, searchTerm]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setMsg(null);

    try {
      const [propertiesResponse, amenitiesResponse] = await Promise.all([
        fetch("/api/admin/properties", {
          cache: "no-store",
        }),
        fetch("/api/admin/amenities", {
          cache: "no-store",
        }),
      ]);

      if (
        propertiesResponse.status === 401 ||
        amenitiesResponse.status === 401
      ) {
        window.location.href = "/admin";
        return;
      }

      const propertiesData = await propertiesResponse
        .json()
        .catch(() => []);

      const amenitiesData = await amenitiesResponse
        .json()
        .catch(() => []);

      if (!propertiesResponse.ok) {
        throw new Error(
          propertiesData?.error ||
            "Objekte konnten nicht geladen werden."
        );
      }

      if (!amenitiesResponse.ok) {
        throw new Error(
          amenitiesData?.error ||
            "Ausstattungen konnten nicht geladen werden."
        );
      }

      setItems(
        Array.isArray(propertiesData)
          ? sortProperties(propertiesData)
          : []
      );

      setAmenities(
        Array.isArray(amenitiesData)
          ? [...amenitiesData].sort((a, b) =>
              String(a.name || "").localeCompare(
                String(b.name || ""),
                "de",
                {
                  sensitivity: "base",
                }
              )
            )
          : []
      );
    } catch (error) {
      setMsg({
        t: "error",
        m:
          error?.message ||
          "Daten konnten nicht geladen werden.",
      });
    } finally {
      setLoading(false);
    }
  }

  function scrollToForm() {
    window.setTimeout(() => {
      formSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }

  function openCreateForm() {
    setMsg(null);
    setForm(EMPTY_FORM);
    setNewAmenityName("");
    setShowAmenityInput(false);
    setShowForm(true);
    scrollToForm();
  }

  function closeForm() {
    if (busy) return;

    setForm(EMPTY_FORM);
    setNewAmenityName("");
    setShowAmenityInput(false);
    setShowForm(false);
  }

  function toggleAmenity(name) {
    setForm((currentForm) => {
      const selected =
        currentForm.amenityNames.includes(name);

      return {
        ...currentForm,
        amenityNames: selected
          ? currentForm.amenityNames.filter(
              (item) => item !== name
            )
          : [...currentForm.amenityNames, name],
      };
    });
  }

  async function addAmenityInline(event) {
    event?.preventDefault?.();

    const name = newAmenityName.trim();

    setMsg(null);

    if (!name) {
      setMsg({
        t: "error",
        m: "Bitte eine Bezeichnung für die Ausstattung eingeben.",
      });
      return;
    }

    const existingAmenity = amenities.find(
      (amenity) =>
        String(amenity.name || "")
          .trim()
          .toLocaleLowerCase("de") ===
        name.toLocaleLowerCase("de")
    );

    if (existingAmenity) {
      setForm((currentForm) => ({
        ...currentForm,
        amenityNames: currentForm.amenityNames.includes(
          existingAmenity.name
        )
          ? currentForm.amenityNames
          : [
              ...currentForm.amenityNames,
              existingAmenity.name,
            ],
      }));

      setNewAmenityName("");
      setShowAmenityInput(false);

      setMsg({
        t: "ok",
        m: "Die vorhandene Ausstattung wurde ausgewählt.",
      });

      return;
    }

    setBusy(true);

    try {
      const response = await fetch(
        "/api/admin/amenities",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name }),
        }
      );

      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        window.location.href = "/admin";
        return;
      }

      if (!response.ok) {
        setMsg({
          t: "error",
          m:
            data?.error ||
            "Ausstattung konnte nicht angelegt werden.",
        });
        return;
      }

      setAmenities((currentAmenities) =>
        [...currentAmenities, data].sort((a, b) =>
          String(a.name || "").localeCompare(
            String(b.name || ""),
            "de",
            {
              sensitivity: "base",
            }
          )
        )
      );

      setForm((currentForm) => ({
        ...currentForm,
        amenityNames: currentForm.amenityNames.includes(
          data.name
        )
          ? currentForm.amenityNames
          : [...currentForm.amenityNames, data.name],
      }));

      setNewAmenityName("");
      setShowAmenityInput(false);

      setMsg({
        t: "ok",
        m: "Ausstattung wurde angelegt und ausgewählt.",
      });
    } catch {
      setMsg({
        t: "error",
        m: "Netzwerkfehler beim Anlegen der Ausstattung.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function save(event) {
    event.preventDefault();
    setMsg(null);

    const payload = {
      title: form.title.trim(),
      location: form.location.trim(),
      maxPersons: Number(form.maxPersons) || 2,
      dogsAllowed: Boolean(form.dogsAllowed),
      description: form.description?.trim() || "",
      slug: form.slug?.trim() || undefined,
      amenities: form.amenityNames,
    };

    if (!payload.title || !payload.location) {
      setMsg({
        t: "error",
        m: "Titel und Ort sind erforderlich.",
      });
      return;
    }

    if (payload.maxPersons < 1) {
      setMsg({
        t: "error",
        m: "Die maximale Personenzahl muss mindestens 1 sein.",
      });
      return;
    }

    setBusy(true);

    try {
      const response = await fetch(
        editing
          ? `/api/admin/properties/${form.id}`
          : "/api/admin/properties",
        {
          method: editing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        window.location.href = "/admin";
        return;
      }

      if (!response.ok) {
        setMsg({
          t: "error",
          m:
            data?.error ||
            (editing
              ? "Aktualisieren fehlgeschlagen."
              : "Anlegen fehlgeschlagen."),
        });
        return;
      }

      if (editing) {
        setItems((currentItems) =>
          sortProperties(
            currentItems.map((item) =>
              item.id === data.id
                ? { ...item, ...data }
                : item
            )
          )
        );

        setMsg({
          t: "ok",
          m: "Objekt wurde erfolgreich aktualisiert.",
        });
      } else {
        setItems((currentItems) =>
          sortProperties([...currentItems, data])
        );

        setMsg({
          t: "ok",
          m: "Objekt wurde erfolgreich angelegt.",
        });
      }

      setForm(EMPTY_FORM);
      setNewAmenityName("");
      setShowAmenityInput(false);
      setShowForm(false);
    } catch {
      setMsg({
        t: "error",
        m: "Netzwerkfehler beim Speichern.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function editRow(id) {
    setMsg(null);
    setBusy(true);

    try {
      const response = await fetch(
        `/api/admin/properties/${id}`,
        {
          cache: "no-store",
        }
      );

      const property = await response
        .json()
        .catch(() => null);

      if (response.status === 401) {
        window.location.href = "/admin";
        return;
      }

      if (!response.ok || !property) {
        setMsg({
          t: "error",
          m:
            property?.error ||
            "Objektdaten konnten nicht geladen werden.",
        });
        return;
      }

      setForm({
        id: property.id,
        title: property.title || "",
        location: property.location || "",
        maxPersons: property.maxPersons || 2,
        dogsAllowed: Boolean(property.dogsAllowed),
        description: property.description || "",
        slug: property.slug || "",
        amenityNames: Array.isArray(property.amenities)
          ? property.amenities.map(
              (amenity) => amenity.name
            )
          : [],
      });

      setNewAmenityName("");
      setShowAmenityInput(false);
      setShowForm(true);
      scrollToForm();
    } catch {
      setMsg({
        t: "error",
        m: "Netzwerkfehler beim Laden des Objekts.",
      });
    } finally {
      setBusy(false);
    }
  }

  function askRemoveRow(property) {
    setMsg(null);
    setPendingDelete(property);
  }

  async function confirmRemove() {
    if (!pendingDelete) return;

    const propertyToDelete = pendingDelete;

    setBusy(true);
    setMsg(null);

    try {
      const response = await fetch(
        `/api/admin/properties/${propertyToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (response.status === 401) {
        window.location.href = "/admin";
        return;
      }

      if (!response.ok) {
        setMsg({
          t: "error",
          m: data?.error || "Löschen fehlgeschlagen.",
        });
        return;
      }

      setItems((currentItems) =>
        currentItems.filter(
          (item) => item.id !== propertyToDelete.id
        )
      );

      if (form.id === propertyToDelete.id) {
        setForm(EMPTY_FORM);
        setShowForm(false);
      }

      setMsg({
        t: "ok",
        m: "Objekt wurde dauerhaft gelöscht.",
      });
    } catch {
      setMsg({
        t: "error",
        m: "Netzwerkfehler beim Löschen.",
      });
    } finally {
      setPendingDelete(null);
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto mt-24 max-w-7xl px-4 py-8 md:py-10">
      {/* Meldungen */}
      <div className="mb-5 space-y-2">
        {msg?.t === "error" && (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <span>{msg.m}</span>

            <button
              type="button"
              onClick={() => setMsg(null)}
              className="shrink-0 text-xs font-medium text-rose-600 hover:text-rose-800"
            >
              Schließen
            </button>
          </div>
        )}

        {msg?.t === "ok" && (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <span>{msg.m}</span>

            <button
              type="button"
              onClick={() => setMsg(null)}
              className="shrink-0 text-xs font-medium text-emerald-600 hover:text-emerald-800"
            >
              Schließen
            </button>
          </div>
        )}
      </div>

      {/* Kopfbereich */}
      <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
            Admin · Objekte
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-950">
            Unterkünfte verwalten
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Lege Unterkünfte an und öffne anschließend alle
            zugehörigen Verwaltungsbereiche direkt beim jeweiligen
            Objekt.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
        >
          <Plus
            className="h-4 w-4"
            aria-hidden="true"
          />
          Neues Objekt
        </button>
      </div>

      {/* Formular */}
      {showForm && (
        <div
          ref={formSectionRef}
          className="scroll-mt-28"
        >
          <form
            onSubmit={save}
            className="mb-8 space-y-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                  {editing
                    ? "Objekt bearbeiten"
                    : "Neues Objekt"}
                </p>

                <h2 className="mt-1 text-xl font-semibold text-slate-950">
                  {editing
                    ? form.title ||
                      "Objektdaten bearbeiten"
                    : "Unterkunft anlegen"}
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  Stammdaten, Beschreibung und Ausstattung
                  festlegen.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={busy}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
                aria-label="Formular schließen"
              >
                <X
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-1.5">
                <span className="text-xs font-medium text-slate-600">
                  Titel *
                </span>

                <input
                  required
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-400/30"
                  value={form.title}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      title: event.target.value,
                    }))
                  }
                  placeholder="z. B. Ferienhaus Düne 7"
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-xs font-medium text-slate-600">
                  Ort *
                </span>

                <input
                  required
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-400/30"
                  value={form.location}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      location: event.target.value,
                    }))
                  }
                  placeholder="z. B. Holm"
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-xs font-medium text-slate-600">
                  Maximale Personenzahl
                </span>

                <input
                  type="number"
                  min={1}
                  required
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-400/30"
                  value={form.maxPersons}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      maxPersons: Number(
                        event.target.value || 1
                      ),
                    }))
                  }
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-xs font-medium text-slate-600">
                  Slug
                </span>

                <input
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-400/30"
                  value={form.slug}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      slug: event.target.value,
                    }))
                  }
                  placeholder="Wird ansonsten automatisch erzeugt"
                />
              </label>
            </div>

            <label className="inline-flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-700 ring-1 ring-slate-100">
              <input
                type="checkbox"
                checked={form.dogsAllowed}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    dogsAllowed: event.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />

              <Dog
                className="h-4 w-4 text-slate-500"
                aria-hidden="true"
              />

              Hunde sind in dieser Unterkunft erlaubt
            </label>

            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-slate-600">
                Beschreibung
              </span>

              <textarea
                rows={5}
                className="min-h-32 w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-400/30"
                value={form.description}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    description: event.target.value,
                  }))
                }
                placeholder="Beschreibung der Unterkunft …"
              />
            </label>

            {/* Ausstattung */}
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Ausstattung
                  </h3>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Vorhandene Merkmale auswählen oder eine
                    neue Ausstattung ergänzen.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowAmenityInput(
                      (currentValue) => !currentValue
                    );
                    setNewAmenityName("");
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm transition hover:bg-slate-50"
                >
                  <Plus
                    className="h-3.5 w-3.5"
                    aria-hidden="true"
                  />
                  Neue Ausstattung
                </button>
              </div>

              {showAmenityInput && (
                <div className="flex flex-col gap-2 rounded-xl border border-sky-100 bg-sky-50 p-3 sm:flex-row">
                  <input
                    autoFocus
                    className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-400/30"
                    placeholder="z. B. WLAN"
                    value={newAmenityName}
                    onChange={(event) =>
                      setNewAmenityName(
                        event.target.value
                      )
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addAmenityInline(event);
                      }

                      if (event.key === "Escape") {
                        setNewAmenityName("");
                        setShowAmenityInput(false);
                      }
                    }}
                  />

                  <button
                    type="button"
                    disabled={busy}
                    onClick={addAmenityInline}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-500 disabled:opacity-60"
                  >
                    <Save
                      className="h-3.5 w-3.5"
                      aria-hidden="true"
                    />
                    Hinzufügen
                  </button>
                </div>
              )}

              {amenities.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Noch keine Ausstattung hinterlegt.
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {amenities.map((amenity) => {
                    const checked =
                      form.amenityNames.includes(
                        amenity.name
                      );

                    return (
                      <label
                        key={amenity.id}
                        className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition ${
                          checked
                            ? "border-sky-300 bg-sky-50 text-sky-900"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            toggleAmenity(amenity.name)
                          }
                          className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        />

                        <span className="truncate">
                          {amenity.name}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={closeForm}
                disabled={busy}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
              >
                Abbrechen
              </button>

              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save
                  className="h-4 w-4"
                  aria-hidden="true"
                />

                {busy
                  ? "Wird gespeichert …"
                  : editing
                    ? "Änderungen speichern"
                    : "Objekt anlegen"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Objektübersicht und Suche */}
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">
            Objektübersicht
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Suche eine Unterkunft und öffne direkt den
            gewünschten Verwaltungsbereich.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto">
          {items.length > 0 && (
            <div className="relative w-full sm:w-80">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />

              <input
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                placeholder="Titel, Ort, Slug oder ID suchen …"
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-400/30"
                aria-label="Objekte durchsuchen"
              />

              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Suche zurücksetzen"
                  title="Suche zurücksetzen"
                >
                  <X
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                </button>
              )}
            </div>
          )}

          {items.length > 0 && (
            <span className="shrink-0 self-start rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 sm:self-auto">
              {searchTerm.trim()
                ? `${filteredItems.length} von ${items.length}`
                : `${items.length} Objekt${
                    items.length === 1 ? "" : "e"
                  }`}
            </span>
          )}
        </div>
      </div>

      {/* Objektliste */}
      {loading ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">
            Objekte werden geladen …
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Home className="mx-auto h-10 w-10 text-slate-400" />

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Noch keine Objekte vorhanden
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Lege zuerst eine Unterkunft an.
          </p>

          <button
            type="button"
            onClick={openCreateForm}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-500"
          >
            <Plus
              className="h-4 w-4"
              aria-hidden="true"
            />
            Erstes Objekt anlegen
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Search className="mx-auto h-10 w-10 text-slate-400" />

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Kein Objekt gefunden
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Für „{searchTerm.trim()}“ wurde keine passende
            Unterkunft gefunden.
          </p>

          <button
            type="button"
            onClick={() => setSearchTerm("")}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <X
              className="h-4 w-4"
              aria-hidden="true"
            />
            Suche zurücksetzen
          </button>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {filteredItems.map((item) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:shadow-md"
            >
              {/* Objektinformationen */}
              <div className="border-b border-slate-100 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-lg font-semibold text-slate-950">
                        {item.title}
                      </h3>

                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                        ID {item.id}
                      </span>
                    </div>

                    <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
                      <MapPin
                        className="h-4 w-4 shrink-0"
                        aria-hidden="true"
                      />

                      <span className="truncate">
                        {item.location ||
                          "Kein Ort hinterlegt"}
                      </span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => editRow(item.id)}
                    disabled={busy}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    <Pencil
                      className="h-3.5 w-3.5"
                      aria-hidden="true"
                    />
                    Grunddaten
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                    <Users
                      className="h-3.5 w-3.5"
                      aria-hidden="true"
                    />
                    Bis {item.maxPersons || "–"} Personen
                  </span>

                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                    <Dog
                      className="h-3.5 w-3.5"
                      aria-hidden="true"
                    />
                    Hunde{" "}
                    {item.dogsAllowed
                      ? "erlaubt"
                      : "nicht erlaubt"}
                  </span>

                  {item.slug && (
                    <span className="max-w-full truncate rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500">
                      /{item.slug}
                    </span>
                  )}
                </div>
              </div>

              {/* Verwaltungsbereiche */}
              <div className="p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                  Objekt verwalten
                </p>

                <div className="grid gap-2 sm:grid-cols-2">
                  {MANAGEMENT_ITEMS.map(
                    (managementItem) => {
                      const Icon =
                        managementItem.icon;

                      return (
                        <Link
                          key={managementItem.key}
                          href={`${managementItem.href}?propertyId=${item.id}`}
                          className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 transition hover:border-sky-200 hover:bg-sky-50"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-sky-700 shadow-sm ring-1 ring-slate-200 transition group-hover:ring-sky-200">
                            <Icon
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                          </span>

                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-slate-900 group-hover:text-sky-800">
                              {managementItem.title}
                            </span>

                            <span className="block truncate text-xs text-slate-500">
                              {
                                managementItem.description
                              }
                            </span>
                          </span>
                        </Link>
                      );
                    }
                  )}
                </div>

                {/* Vorschau und Löschen */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <div className="flex flex-wrap gap-2">
                    {item.slug ? (
                      <>
                        <a
                          href={`/properties/${item.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          <Eye
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                          Vorschau
                        </a>

                        <a
                          href={`/api/ical/${item.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          <Calendar
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                          iCal-Export
                        </a>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">
                        Vorschau erst nach Vergabe eines
                        Slugs verfügbar.
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => askRemoveRow(item)}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 ring-1 ring-rose-100 transition hover:bg-rose-100 disabled:opacity-50"
                  >
                    <Trash2
                      className="h-3.5 w-3.5"
                      aria-hidden="true"
                    />
                    Löschen
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Löschdialog */}
      {pendingDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-property-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
              <Trash2
                className="h-5 w-5"
                aria-hidden="true"
              />
            </div>

            <h2
              id="delete-property-title"
              className="mt-4 text-lg font-semibold text-slate-950"
            >
              Objekt dauerhaft löschen?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Das Objekt und die damit verbundenen Daten
              können anschließend nicht wiederhergestellt
              werden.
            </p>

            <div className="mt-4 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
              <p className="font-medium text-slate-900">
                {pendingDelete.title}
              </p>

              <p className="mt-0.5 text-xs text-slate-500">
                {pendingDelete.location}
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setPendingDelete(null)
                }
                disabled={busy}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Abbrechen
              </button>

              <button
                type="button"
                onClick={confirmRemove}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-60"
              >
                <Trash2
                  className="h-4 w-4"
                  aria-hidden="true"
                />

                {busy
                  ? "Wird gelöscht …"
                  : "Ja, löschen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}