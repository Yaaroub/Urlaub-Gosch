"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchForm({ initialParams, amenities }) {
  const router = useRouter();

  const [arrival, setArrival] = useState(initialParams.arrival || "");
  const [departure, setDeparture] = useState(initialParams.departure || "");
  const [location, setLocation] = useState(initialParams.location || "");
  const [persons, setPersons] = useState(initialParams.persons || "");
  const [dogs, setDogs] = useState(initialParams.dogs === "true");
  const [amenityValues, setAmenityValues] = useState(
    Array.isArray(initialParams.amenity) ? initialParams.amenity : []
  );

  function toggleAmenity(val) {
    setAmenityValues((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  }

  function resetForm() {
    setArrival("");
    setDeparture("");
    setLocation("");
    setPersons("");
    setDogs(false);
    setAmenityValues([]);
    router.push("/");
  }

  function submit(e) {
    e.preventDefault();

    const params = new URLSearchParams();

    if (arrival) params.set("arrival", arrival);
    if (departure) params.set("departure", departure);
    if (location) params.set("location", location);
    if (persons) params.set("persons", persons);
    if (dogs) params.set("dogs", "true");

    amenityValues.forEach((a) => {
      params.append("amenity", a.toLowerCase());
    });

    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* Obere Eingabefelder */}
      <div className="grid gap-3 md:grid-cols-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">
            Anreise
          </label>
          <input
            type="date"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
            value={arrival}
            onChange={(e) => setArrival(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">
            Abreise
          </label>
          <input
            type="date"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
            value={departure}
            onChange={(e) => setDeparture(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">Ort</label>
          <input
            type="text"
            placeholder="z.B. Nordsee, Ostsee, Insel…"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">
            Personen
          </label>
          <input
            type="number"
            min={1}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
            value={persons}
            onChange={(e) => setPersons(e.target.value)}
          />
        </div>
      </div>

      {/* Hunde-Checkbox */}
      <label className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-slate-400 text-sky-600 focus:ring-sky-500"
          checked={dogs}
          onChange={(e) => setDogs(e.target.checked)}
        />
        <span>Nur Unterkünfte, in denen Hunde erlaubt sind</span>
      </label>

      {/* Amenity-Pills */}
      {amenities && amenities.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Ausstattung
          </p>
          <div className="flex flex-wrap gap-2">
            {amenities.map((a) => {
              const val = a.name.toLowerCase();
              const active = amenityValues.includes(val);
              return (
                <button
                  type="button"
                  key={a.id}
                  onClick={() => toggleAmenity(val)}
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition ${
                    active
                      ? "border-sky-500 bg-sky-50 text-sky-800"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {a.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Aktionen */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={resetForm}
          className="text-xs font-medium text-slate-500 hover:text-slate-700"
        >
          Filter zurücksetzen
        </button>

        <button
          type="submit"
          className="inline-flex items-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/70"
        >
          Unterkünfte anzeigen
        </button>
      </div>
    </form>
  );
}
