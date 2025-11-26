"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchForm({ initialParams, amenities }) {
  const router = useRouter();

  function normalizeAmenityParam(value) {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }

  const [form, setForm] = useState(() => ({
    arrival: initialParams.arrival || "",
    departure: initialParams.departure || "",
    location: initialParams.location || "",
    persons: initialParams.persons || "",
    dogs: initialParams.dogs === "true",
    amenity: normalizeAmenityParam(initialParams.amenity),
  }));

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleDogs() {
    setForm((prev) => ({ ...prev, dogs: !prev.dogs }));
  }

  function toggleAmenity(name) {
    setForm((prev) => {
      const current = new Set(prev.amenity);
      if (current.has(name)) {
        current.delete(name);
      } else {
        current.add(name);
      }
      return { ...prev, amenity: Array.from(current) };
    });
  }

  function submit(e) {
    e.preventDefault();

    const params = new URLSearchParams();

    if (form.arrival && form.departure) {
      params.set("arrival", form.arrival);
      params.set("departure", form.departure);
    }

    const loc = String(form.location || "").trim();
    if (loc !== "") {
      params.set("location", loc);
    }

    const personsNum = parseInt(form.persons, 10);
    if (!Number.isNaN(personsNum) && personsNum > 0) {
      params.set("persons", String(personsNum));
    }

    if (form.dogs === true) {
      params.set("dogs", "true");
    }

    form.amenity.forEach((name) => {
      params.append("amenity", name);
    });

    router.push(params.toString() ? `/?${params.toString()}` : "/");
  }

  function resetAll() {
    setForm({
      arrival: "",
      departure: "",
      location: "",
      persons: "",
      dogs: false,
      amenity: [],
    });
    router.push("/");
  }

  return (
    <section className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
      <h2 className="text-lg font-semibold text-gray-900">
        Finde deine Unterkunft
      </h2>
      <p className="text-sm text-gray-500">
        Verfügbarkeit wird nur berücksichtigt, wenn An- &amp; Abreise gesetzt
        sind.
      </p>

      <form onSubmit={submit} className="space-y-4">
        {/* Zeile 1 */}
        <div className="grid gap-3 md:grid-cols-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700">Anreise</label>
            <input
              type="date"
              className="rounded border px-3 py-2 text-sm"
              value={form.arrival}
              onChange={(e) => updateField("arrival", e.target.value)}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700">Abreise</label>
            <input
              type="date"
              className="rounded border px-3 py-2 text-sm"
              value={form.departure}
              onChange={(e) => updateField("departure", e.target.value)}
            />
          </div>

          <div className="flex flex-col md:col-span-1">
            <label className="text-sm font-medium text-gray-700">Ort</label>
            <input
              type="text"
              placeholder="z. B. Holm"
              className="rounded border px-3 py-2 text-sm"
              value={form.location}
              onChange={(e) => updateField("location", e.target.value)}
            />
          </div>

          <div className="flex flex-col md:col-span-1">
            <label className="text-sm font-medium text-gray-700">Personen</label>
            <input
              type="number"
              min={1}
              className="rounded border px-3 py-2 text-sm"
              value={form.persons}
              onChange={(e) => updateField("persons", e.target.value)}
            />
          </div>
        </div>

        {/* Hunde erlaubt */}
        <div className="flex items-center gap-2">
          <input
            id="filter-dogs"
            type="checkbox"
            className="h-4 w-4"
            checked={form.dogs}
            onChange={toggleDogs}
          />
          <label htmlFor="filter-dogs" className="text-sm text-gray-800">
            Nur Unterkünfte, in denen Hunde erlaubt sind
          </label>
        </div>

        {/* Alle Amenities aus DB */}
        <div className="grid gap-y-2 gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
          {amenities.map((a) => (
            <label
              key={a.id}
              className="flex items-center gap-2 text-sm text-gray-800"
            >
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={form.amenity.includes(a.name)}
                onChange={() => toggleAmenity(a.name)}
              />
              <span>{a.name}</span>
            </label>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Suchen
          </button>

          <button
            type="button"
            onClick={resetAll}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Zurücksetzen
          </button>
        </div>
      </form>
    </section>
  );
}
