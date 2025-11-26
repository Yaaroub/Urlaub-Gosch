"use client";
import { useEffect, useMemo, useState } from "react";
import { Eye, Calendar, Euro, Pencil, Trash2, Plus, Save } from "lucide-react";

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

  const editing = useMemo(() => form.id !== null, [form.id]);

  useEffect(() => {
    fetch("/api/admin/properties")
      .then((r) => r.json())
      .then(setItems);
    fetch("/api/admin/amenities")
      .then((r) => r.json())
      .then(setAmenities);
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

  async function addAmenityQuick() {
    const name = prompt("Neue Ausstattung (z. B. WLAN):");
    if (!name) return;
    const r = await fetch("/api/admin/amenities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await r.json();
    if (!r.ok) return alert(data?.error || "Anlegen fehlgeschlagen");
    setAmenities((a) =>
      [...a, data].sort((x, y) => x.name.localeCompare(y.name, "de"))
    );
  }

  async function save(e) {
    e.preventDefault();
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
      alert("Titel und Ort sind erforderlich.");
      return;
    }

    if (editing) {
      const r = await fetch(`/api/admin/properties/${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await r.json();
      if (!r.ok) return alert(data?.error || "Aktualisieren fehlgeschlagen");
      setItems((arr) =>
        arr.map((it) => (it.id === data.id ? { ...it, ...data } : it))
      );
      resetForm();
    } else {
      const r = await fetch("/api/admin/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await r.json();
      if (!r.ok) return alert(data?.error || "Anlegen fehlgeschlagen");
      setItems((arr) => [...arr, data].sort((a, b) => a.id - b.id));
      resetForm();
    }
  }

  function editRow(id) {
    fetch(`/api/admin/properties/${id}`)
      .then((r) => r.json())
      .then((p) =>
        setForm({
          id: p.id,
          title: p.title || "",
          location: p.location || "",
          maxPersons: p.maxPersons || 2,
          dogsAllowed: !!p.dogsAllowed,
          description: p.description || "",
          slug: p.slug || "",
          amenityNames: (p.amenities || []).map((a) => a.name),
        })
      );
  }

  async function removeRow(id) {
    if (
      !confirm(
        "Objekt wirklich löschen? Dies entfernt auch verknüpfte Daten (z. B. Bilder, Preiszeiten, Buchungen)."
      )
    )
      return;
    const r = await fetch(`/api/admin/properties/${id}`, { method: "DELETE" });
    const data = await r.json();
    if (!r.ok) return alert(data?.error || "Löschen fehlgeschlagen");
    setItems((arr) => arr.filter((x) => x.id !== id));
    if (form.id === id) resetForm();
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">Objekte verwalten</h1>

      {/* Formular */}
      <form
        onSubmit={save}
        className="rounded-2xl bg-white ring-1 ring-black/5 p-6 space-y-4 mb-8"
      >
        <div className="grid md:grid-cols-2 gap-4">
          <label className="grid gap-1">
            <span className="text-xs text-slate-500">Titel *</span>
            <input
              className="border rounded-xl px-3 py-2"
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
              className="border rounded-xl px-3 py-2"
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
              className="border rounded-xl px-3 py-2"
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
            <span className="text-xs text-slate-500">Slug</span>
            <input
              className="border rounded-xl px-3 py-2"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="wird sonst automatisch erzeugt"
            />
          </label>
        </div>

        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
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
            className="border rounded-xl px-3 py-2"
            rows={4}
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            placeholder="Kurze Objektbeschreibung …"
          />
        </label>

        {/* Amenities Auswahl */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Ausstattung</h3>
            <button
              type="button"
              onClick={addAmenityQuick}
              className="text-sm inline-flex items-center gap-1"
            >
            </button>
          </div>
          {amenities.length === 0 ? (
            <p className="text-sm text-slate-500">
              Noch keine Ausstattung hinterlegt.
            </p>
          ) : (
            <div className="grid md:grid-cols-4 gap-2">
              {amenities.map((a) => (
                <label
                  key={a.id}
                  className="inline-flex items-center gap-2 text-sm bg-slate-50 rounded-lg px-3 py-2"
                >
                  <input
                    type="checkbox"
                    checked={form.amenityNames.includes(a.name)}
                    onChange={() => toggleAmenity(a.name)}
                  />
                  {a.name}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button className="rounded-xl px-4 py-2 bg-sky-600 text-white inline-flex items-center gap-2">
            <Save className="h-4 w-4" />
            {editing ? "Änderungen speichern" : "Objekt anlegen"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl px-4 py-2 bg-slate-100 hover:bg-slate-200"
            >
              Abbrechen
            </button>
          )}
        </div>
      </form>

      {/* Liste */}
      <div className="rounded-2xl bg-white ring-1 ring-black/5 p-6">
        <h3 className="font-semibold mb-3">Objektliste</h3>
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">Noch keine Objekte.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="text-left py-2">Titel</th>
                  <th className="text-left">Ort</th>
                  <th className="text-left">Slug</th>
                  <th className="text-left">Pers.</th>
                  <th className="text-left">Hunde</th>
                  <th className="text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-t">
                    <td className="py-2">{it.title}</td>
                    <td>{it.location}</td>
                    <td className="text-xs text-slate-500">{it.slug || "—"}</td>
                    <td>{it.maxPersons}</td>
                    <td>{it.dogsAllowed ? "ja" : "nein"}</td>
                    <td className="text-right py-2">
                      <div className="flex justify-end flex-wrap gap-2">
                        <a
                          href={`/properties/${it.slug}`}
                          target="_blank"
                          className="inline-flex items-center justify-center rounded-md border p-2 text-slate-600 hover:bg-slate-100"
                          title="Frontend-Ansicht"
                        >
                          <Eye className="h-4 w-4" />
                        </a>

                        <a
                          href={`/api/ical/${it.slug}`}
                          target="_blank"
                          className="inline-flex items-center justify-center rounded-md border p-2 text-slate-600 hover:bg-slate-100"
                          title="iCal Export"
                        >
                          <Calendar className="h-4 w-4" />
                        </a>

                        <a
                          href={`/admin/prices?propertyId=${it.id}`}
                          className="inline-flex items-center justify-center rounded-md border p-2 text-slate-600 hover:bg-slate-100"
                          title="Preiszeiten bearbeiten"
                        >
                          <Euro className="h-4 w-4" />
                        </a>

                        <button
                          onClick={() => editRow(it.id)}
                          className="inline-flex items-center justify-center rounded-md border p-2 text-slate-600 hover:bg-slate-100"
                          title="Bearbeiten"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => removeRow(it.id)}
                          className="inline-flex items-center justify-center rounded-md bg-rose-600 text-white hover:bg-rose-700 p-2"
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
    </section>
  );
}
