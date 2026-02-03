"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, Users, Dog, RotateCcw, Search } from "lucide-react";
import { getAmenityIcon, normalizeAmenityName } from "@/lib/amenity-icons";

export default function SearchForm({ initialParams, amenities }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [arrival, setArrival] = useState(initialParams.arrival || "");
  const [departure, setDeparture] = useState(initialParams.departure || "");
  const [location, setLocation] = useState(initialParams.location || "");
  const [persons, setPersons] = useState(initialParams.persons || "");
  const [dogs, setDogs] = useState(initialParams.dogs === "true");

  // ✅ robust: amenity kann string oder array sein -> immer array -> normalisiert
  const [amenityValues, setAmenityValues] = useState(() => {
    const a = initialParams?.amenity;
    const arr = Array.isArray(a) ? a : a ? [a] : [];
    return arr.map((x) => normalizeAmenityName(x)).filter(Boolean);
  });

  const amenitiesSorted = useMemo(() => {
    const arr = Array.isArray(amenities) ? amenities : [];
    return [...arr].sort((a, b) =>
      String(a?.name || "").localeCompare(String(b?.name || ""), "de")
    );
  }, [amenities]);

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
  
    startTransition(() => {
      router.replace("/", { scroll: false });
    });
  
    setTimeout(() => {
      document.getElementById("suche")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  }
  

  function submit(e) {
    e.preventDefault();
  
    const params = new URLSearchParams();
  
    if (arrival) params.set("arrival", arrival);
    if (departure) params.set("departure", departure);
    if (location) params.set("location", location);
  
    if (persons) {
      const n = Number(persons);
      if (Number.isFinite(n) && n > 0) params.set("persons", String(n));
    }
  
    if (dogs) params.set("dogs", "true");
  
    amenityValues.forEach((a) => params.append("amenity", a));
  
    const qs = params.toString();
  
    startTransition(() => {
      router.replace(qs ? `/?${qs}` : "/", { scroll: false });
    });
  
    // ✅ nach Navigation smooth zu Ergebnissen scrollen
    setTimeout(() => {
      const el = document.getElementById("unterkuenfte");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  }
  

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* GRID */}
      <div className="grid gap-3">
        {/* Dates */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="CHECK IN" icon={Calendar}>
            <input
              type="date"
              value={arrival}
              onChange={(e) => {
                const v = e.target.value;
                setArrival(v);
                if (departure && v && departure < v) setDeparture("");
              }}
              className={inputClass}
            />
          </Field>

          <Field label="CHECK OUT" icon={Calendar}>
            <input
              type="date"
              value={departure}
              min={arrival || undefined}
              onChange={(e) => setDeparture(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        {/* Location + Guests */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="LOCATION" icon={MapPin}>
            <input
              type="text"
              placeholder="z.B. Nordsee, Ostsee, Insel…"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="GUESTS" icon={Users}>
            <input
              type="number"
              min={1}
              inputMode="numeric"
              value={persons}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "") return setPersons("");
                const n = Math.max(1, Number(v || 1));
                setPersons(String(n));
              }}
              className={inputClass}
            />
          </Field>
        </div>

        {/* Dogs */}
        <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-800">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white ring-1 ring-slate-200">
              <Dog className="h-4 w-4 text-slate-700" />
            </span>
            Hund erlaubt
          </span>

          <span className="inline-flex items-center gap-2">
            <span className="text-xs text-slate-500">nur anzeigen</span>
            <input
              type="checkbox"
              checked={dogs}
              onChange={(e) => setDogs(e.target.checked)}
              className="h-5 w-5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              aria-label="Nur Unterkünfte mit Hund erlaubt"
            />
          </span>
        </label>

        {/* Amenities */}
        {amenitiesSorted.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-slate-500">
                Amenities
              </p>
              {amenityValues.length > 0 && (
                <button
                  type="button"
                  onClick={() => setAmenityValues([])}
                  className="text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                  löschen
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {amenitiesSorted.map((a) => {
                const val = normalizeAmenityName(a.name);
                const active = amenityValues.includes(val);
                const Icon = getAmenityIcon(a.name);

                return (
                  <button
                    type="button"
                    key={a.id}
                    onClick={() => toggleAmenity(val)}
                    className={[
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition",
                      active
                        ? "border-sky-500 bg-sky-50 text-sky-900"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <Icon className="h-4 w-4" />
                    {a.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ACTIONS */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={resetForm}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl px-2 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <RotateCcw className="h-4 w-4" />
          Filter zurücksetzen
        </button>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-4 py-2.5 text-sm font-extrabold tracking-[0.14em] uppercase text-slate-900 shadow-md hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/70 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Search className="h-4 w-4" />
          {isPending ? "Loading…" : "Show Results"}
        </button>
      </div>
    </form>
  );
}

/* Helpers */

function Field({ label, icon: Icon, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-[0.22em] uppercase text-slate-500">
          {label}
        </span>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 ring-1 ring-slate-200">
          <Icon className="h-4 w-4 text-slate-700" />
        </span>
      </div>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/50";
