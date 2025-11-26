"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  Calendar,
  Euro,
  Pencil,
  Trash2,
  Save,
  Plus,
} from "lucide-react";

export default function AdminPropertiesPage() {
  const [items, setItems] = useState([]);
  const [amenities, setAmenities] = useState([]);

  // Formular-State (Neu ODER Bearbeiten)
  const [form, setForm] = useState({
    id: null,
    title: "",
    location: "",
    maxPersons: 2,
    dogsAllowed: false,
    description: "",
    slug: "",
    amenityNames: [], // Strings
  });

  const [loading, setLoading] = useState(false); // Liste
  const [busy, setBusy] = useState(false); // Speichern/Löschen
  const [msg, setMsg] = useState(null); // { t:"ok"|"error", m:string }

  // Lösch-Modal
  const [pendingDelete, setPendingDelete] = useState(null); // Objekt

  // Neue Ausstattung (inline statt prompt)
  const [showAmenityInput, setShowAmenityInput] = useState(false);
  const [newAmenityName, setNewAmenityName] = useState("");

  const editing = useMemo(() => form.id !== null, [form.id]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [propsRes, amenitiesRes] = await Promise.all([
          fetch("/api/admin/properties", { cache: "no-store" }),
          fetch("/api/admin/amenities", { cache: "no-store" }),
        ]);

        if (propsRes.status === 401 || amenitiesRes.status === 401) {
          window.location.href = "/admin";
          return;
        }

        const propsData = await propsRes.json();
        const amenitiesData = await amenitiesRes.json();

        setItems(Array.isArray(propsData) ? propsData : []);
        setAmenities(
          Array.isArray(amenitiesData)
            ? [...amenitiesData].sort((a, b) =>
                a.name.localeCompare(b.name, "de")
              )
            : []
        );
      } catch {
        setMsg({
          t: "error",
          m: "Daten konnten nicht geladen werden.",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function resetForm() {
    setForm({
      id: null,
      title: "",
      location: "",
      maxPersons: 2,
      dogsAllowed: false,
      description: "",
      slug: "",
      amenityNames: [],
    });
  }

  function toggleAmenity(name) {
    setForm((f) => {
      const has = f.amenityNames.includes(name);
      return {
        ...f,
        amenityNames: has
          ? f.amenityNames.filter((x) => x !== name)
          : [...f.amenityNames, name],
      };
    });
  }

  async function addAmenityInline(e) {
    e.preventDefault();
    setMsg(null);
    const name = newAmenityName.trim();
    if (!name) return;

    setBusy(true);
    try {
      const r = await fetch("/api/admin/amenities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await r.json();
      if (r.status === 401) {
        window.location.href = "/admin";
        return;
      }
      if (!r.ok) {
        setMsg({
          t: "error",
          m: data?.error || "Ausstattung konnte nicht angelegt werden.",
        });
        return;
      }

      setAmenities((a) =>
        [...a, data].sort((x, y) => x.name.localeCompare(y.name, "de"))
      );
      // direkt ausgewählt setzen
      setForm((f) => ({
        ...f,
        amenityNames: [...f.amenityNames, data.name],
      }));
      setNewAmenityName("");
      setShowAmenityInput(false);
      setMsg({ t: "ok", m: "Ausstattung hinzugefügt." });
    } catch {
      setMsg({
        t: "error",
        m: "Netzwerkfehler beim Anlegen der Ausstattung.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function save(e) {
    e.preventDefault();
    setMsg(null);

    const payload = {
      title: form.title.trim(),
      location: form.location.trim(),
      maxPersons: Number(form.maxPersons) || 2,
      dogsAllowed: !!form.dogsAllowed,
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

    setBusy(true);
    try {
      if (editing) {
        const r = await fetch(`/api/admin/properties/${form.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await r.json();
        if (r.status === 401) {
          window.location.href = "/admin";
          return;
        }
        if (!r.ok) {
          setMsg({
            t: "error",
            m: data?.error || "Aktualisieren fehlgeschlagen.",
          });
          return;
        }
        setItems((arr) =>
          arr.map((it) => (it.id === data.id ? { ...it, ...data } : it))
        );
        resetForm();
        setMsg({ t: "ok", m: "Objekt aktualisiert." });
      } else {
        const r = await fetch("/api/admin/properties", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await r.json();
        if (r.status === 401) {
          window.location.href = "/admin";
          return;
        }
        if (!r.ok) {
          setMsg({
            t: "error",
            m: data?.error || "Anlegen fehlgeschlagen.",
          });
          return;
        }
        setItems((arr) => [...arr, data].sort((a, b) => a.id - b.id));
        resetForm();
        setMsg({ t: "ok", m: "Objekt angelegt." });
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

  function editRow(id) {
    setMsg(null);
    fetch(`/api/admin/properties/${id}`, { cache: "no-store" })
      .then((r) => {
        if (r.status === 401) {
          window.location.href = "/admin";
          return null;
        }
        return r.json();
      })
      .then((p) => {
        if (!p) return;
        setForm({
          id: p.id,
          title: p.title || "",
          location: p.location || "",
          maxPersons: p.maxPersons || 2,
          dogsAllowed: !!p.dogsAllowed,
          description: p.description || "",
          slug: p.slug || "",
          amenityNames: (p.amenities || []).map((a) => a.name),
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
  }

  function askRemoveRow(obj) {
    setMsg(null);
    setPendingDelete(obj);
  }

  async function confirmRemove() {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/properties/${pendingDelete.id}`, {
        method: "DELETE",
      });
      const data = await r.json().catch(() => ({}));
      if (r.status === 401) {
        window.location.href = "/admin";
        return;
      }
      if (!r.ok) {
        setMsg({
          t: "error",
          m: data?.error || "Löschen fehlgeschlagen.",
        });
        setPendingDelete(null);
        return;
      }
      setItems((arr) => arr.filter((x) => x.id !== pendingDelete.id));
      if (form.id === pendingDelete.id) resetForm();
      setMsg({ t: "ok", m: "Objekt wurde gelöscht." });
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

      {/* Header */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
            Admin · Objekte
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Unterkünfte verwalten
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Lege neue Objekte an, bearbeite Stammdaten und ordne Ausstattung zu.
          </p>
        </div>
        {items.length > 0 && (
          <span className="text-xs text-slate-500">
            {items.length} Objekt{items.length === 1 ? "" : "e"} angelegt
          </span>
        )}
      </div>

      {/* Formular */}
      <form
        onSubmit={save}
        className="mb-8 space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-xs text-slate-500">Titel *</span>
            <input
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              placeholder="z. B. Ferienhaus Düne 7"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-slate-500">Ort *</span>
            <input
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
              value={form.location}
              onChange={(e) =>
                setForm((f) => ({ ...f, location: e.target.value }))
              }
              placeholder="z. B. Holm"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-slate-500">Max. Personen</span>
            <input
              type="number"
              min={1}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
              value={form.maxPersons}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  maxPersons: Number(e.target.value || 1),
                }))
              }
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-slate-500">Slug (optional)</span>
            <input
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="wird sonst automatisch erzeugt"
            />
          </label>
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            checked={form.dogsAllowed}
            onChange={(e) =>
              setForm((f) => ({ ...f, dogsAllowed: e.target.checked }))
            }
          />
          Hunde erlaubt
        </label>

        <label className="grid gap-1">
          <span className="text-xs text-slate-500">Beschreibung</span>
          <textarea
            className="min-h-[100px] w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
            rows={4}
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            placeholder="Kurze Objektbeschreibung …"
          />
        </label>

        {/* Amenities Auswahl */}
        <div className="space-y-2">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900">
              Ausstattung
            </h3>
            <button
              type="button"
              onClick={() => {
                setShowAmenityInput((v) => !v);
                setNewAmenityName("");
              }}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-800 shadow-sm hover:bg-slate-100"
            >
              <Plus className="h-3 w-3" />
              Neue Ausstattung
            </button>
          </div>

          {showAmenityInput && (
            <form
              onSubmit={addAmenityInline}
              className="mb-2 flex flex-wrap items-center gap-2"
            >
              <input
                className="w-full max-w-xs rounded-xl border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                placeholder="z. B. WLAN"
                value={newAmenityName}
                onChange={(e) => setNewAmenityName(e.target.value)}
              />
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center gap-1 rounded-xl bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-500 disabled:opacity-60"
              >
                <Save className="h-3 w-3" />
                Hinzufügen
              </button>
            </form>
          )}

          {amenities.length === 0 ? (
            <p className="text-sm text-slate-500">
              Noch keine Ausstattung hinterlegt.
            </p>
          ) : (
            <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-4">
              {amenities.map((a) => (
                <label
                  key={a.id}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-800 shadow-sm"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    checked={form.amenityNames.includes(a.name)}
                    onChange={() => toggleAmenity(a.name)}
                  />
                  <span className="truncate">{a.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {editing ? "Änderungen speichern" : "Objekt anlegen"}
          </button>
          {editing && (
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
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">
          Objektliste
        </h3>
        {loading ? (
          <p className="text-sm text-slate-500">Lade Objekte…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-500">Noch keine Objekte.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="py-2 text-left">Titel</th>
                  <th className="py-2 text-left">Ort</th>
                  <th className="py-2 text-left">Slug</th>
                  <th className="py-2 text-left">Pers.</th>
                  <th className="py-2 text-left">Hunde</th>
                  <th className="py-2 text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-t">
                    <td className="py-2">{it.title}</td>
                    <td className="py-2">{it.location}</td>
                    <td className="py-2 text-xs text-slate-500">
                      {it.slug || "—"}
                    </td>
                    <td className="py-2">{it.maxPersons}</td>
                    <td className="py-2">{it.dogsAllowed ? "ja" : "nein"}</td>
                    <td className="py-2 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <a
                          href={`/properties/${it.slug}`}
                          target="_blank"
                          className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white p-2 text-slate-600 shadow-sm hover:bg-slate-50"
                          title="Frontend-Ansicht"
                        >
                          <Eye className="h-4 w-4" />
                        </a>

                        <a
                          href={`/api/ical/${it.slug}`}
                          target="_blank"
                          className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white p-2 text-slate-600 shadow-sm hover:bg-slate-50"
                          title="iCal Export"
                        >
                          <Calendar className="h-4 w-4" />
                        </a>

                        <a
                          href={`/admin/prices?propertyId=${it.id}`}
                          className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white p-2 text-slate-600 shadow-sm hover:bg-slate-50"
                          title="Preiszeiten bearbeiten"
                        >
                          <Euro className="h-4 w-4" />
                        </a>

                        <button
                          type="button"
                          onClick={() => editRow(it.id)}
                          className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white p-2 text-slate-600 shadow-sm hover:bg-slate-50"
                          title="Bearbeiten"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => askRemoveRow(it)}
                          className="inline-flex items-center justify-center rounded-md bg-rose-600 p-2 text-white shadow-sm hover:bg-rose-700"
                          title="Löschen"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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
              Objekt wirklich löschen?
            </h4>
            <p className="mt-2 text-sm text-slate-600">
              Dieses Objekt und verknüpfte Daten (z. B. Bilder, Preiszeiten,
              Buchungen) werden dauerhaft entfernt.
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              {pendingDelete.title} · {pendingDelete.location}
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
