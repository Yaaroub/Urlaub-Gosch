"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Calendar,
  Dog,
  MapPin,
  RotateCcw,
  Search,
  Users,
} from "lucide-react";
import {
  getAmenityIcon,
  normalizeAmenityName,
} from "@/lib/amenity-icons";

export default function SearchForm({
  initialParams = {},
  amenities = [],
  locations = [],
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [arrival, setArrival] = useState(initialParams.arrival || "");
  const [departure, setDeparture] = useState(initialParams.departure || "");
  const [objectName, setObjectName] = useState(
    initialParams.objectName || ""
  );
  const [street, setStreet] = useState(initialParams.street || "");
  const [location, setLocation] = useState(initialParams.location || "");
  const [persons, setPersons] = useState(initialParams.persons || "");
  const [dogs, setDogs] = useState(initialParams.dogs === "true");

  const [amenityValues, setAmenityValues] = useState(() => {
    const value = initialParams?.amenity;
    const values = Array.isArray(value) ? value : value ? [value] : [];

    return values
      .map((item) => normalizeAmenityName(item))
      .filter(Boolean);
  });

  const amenitiesSorted = useMemo(() => {
    const values = Array.isArray(amenities) ? amenities : [];

    return [...values].sort((a, b) =>
      String(a?.name || "").localeCompare(String(b?.name || ""), "de", {
        sensitivity: "base",
      })
    );
  }, [amenities]);

  const locationsSorted = useMemo(() => {
    const values = Array.isArray(locations) ? locations : [];

    const normalizedLocations = values
      .map((item) => {
        if (typeof item === "string") return item.trim();
        return String(item?.location || "").trim();
      })
      .filter(Boolean);

    // Falls eine Ortschaft bereits in der URL steht, bleibt sie auswählbar.
    if (location) normalizedLocations.push(String(location).trim());

    return [...new Set(normalizedLocations)].sort((a, b) =>
      a.localeCompare(b, "de", { sensitivity: "base" })
    );
  }, [locations, location]);

  function toggleAmenity(value) {
    setAmenityValues((currentValues) =>
      currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value]
    );
  }

  function resetForm() {
    setArrival("");
    setDeparture("");
    setObjectName("");
    setStreet("");
    setLocation("");
    setPersons("");
    setDogs(false);
    setAmenityValues([]);

    startTransition(() => {
      router.replace("/", { scroll: false });
    });

    window.setTimeout(() => {
      document.getElementById("suche")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 150);
  }

  function submit(event) {
    event.preventDefault();

    const params = new URLSearchParams();

    if (arrival) params.set("arrival", arrival);
    if (departure) params.set("departure", departure);

    const cleanObjectName = objectName.trim();
    const cleanStreet = street.trim();
    const cleanLocation = location.trim();

    if (cleanObjectName) params.set("objectName", cleanObjectName);
    if (cleanStreet) params.set("street", cleanStreet);
    if (cleanLocation) params.set("location", cleanLocation);

    if (persons) {
      const numberOfPersons = Number(persons);

      if (Number.isFinite(numberOfPersons) && numberOfPersons > 0) {
        params.set("persons", String(numberOfPersons));
      }
    }

    if (dogs) params.set("dogs", "true");

    amenityValues.forEach((amenity) => {
      params.append("amenity", amenity);
    });

    const queryString = params.toString();

    startTransition(() => {
      router.replace(queryString ? `/?${queryString}` : "/", {
        scroll: false,
      });
    });

    window.setTimeout(() => {
      document.getElementById("unterkuenfte")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 150);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-3">
        {/* Anreise und Abreise */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="CHECK-IN" htmlFor="arrival" icon={Calendar}>
            <input
              id="arrival"
              name="arrival"
              type="date"
              value={arrival}
              onChange={(event) => {
                const nextArrival = event.target.value;
                setArrival(nextArrival);

                if (
                  departure &&
                  nextArrival &&
                  departure <= nextArrival
                ) {
                  setDeparture("");
                }
              }}
              className={inputClass}
            />
          </Field>

          <Field label="CHECK-OUT" htmlFor="departure" icon={Calendar}>
            <input
              id="departure"
              name="departure"
              type="date"
              value={departure}
              min={arrival || undefined}
              onChange={(event) => setDeparture(event.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        {/* Objektname und Straße */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="OBJEKTNAME" htmlFor="objectName" icon={Building2}>
            <input
              id="objectName"
              name="objectName"
              type="search"
              value={objectName}
              onChange={(event) => setObjectName(event.target.value)}
              placeholder="z. B. Haus Seestern"
              autoComplete="off"
              className={inputClass}
            />
          </Field>

          <Field label="STRASSENNAME" htmlFor="street" icon={MapPin}>
            <input
              id="street"
              name="street"
              type="search"
              value={street}
              onChange={(event) => setStreet(event.target.value)}
              placeholder="z. B. Strandstraße"
              autoComplete="street-address"
              className={inputClass}
            />
          </Field>
        </div>

        {/* Ortschaft und Gäste */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="ORTSCHAFT" htmlFor="location" icon={MapPin}>
            <select
              id="location"
              name="location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className={inputClass}
            >
              <option value="">Alle Ortschaften</option>

              {locationsSorted.map((place) => (
                <option key={place} value={place}>
                  {place}
                </option>
              ))}
            </select>
          </Field>

          <Field label="GÄSTE" htmlFor="persons" icon={Users}>
            <input
              id="persons"
              name="persons"
              type="number"
              min={1}
              inputMode="numeric"
              value={persons}
              onChange={(event) => {
                const value = event.target.value;

                if (value === "") {
                  setPersons("");
                  return;
                }

                const numberOfPersons = Math.max(1, Number(value || 1));
                setPersons(String(numberOfPersons));
              }}
              className={inputClass}
            />
          </Field>
        </div>

        {/* Hund */}
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
              onChange={(event) => setDogs(event.target.checked)}
              className="h-5 w-5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              aria-label="Nur Unterkünfte anzeigen, in denen Hunde erlaubt sind"
            />
          </span>
        </label>

        {/* Ausstattung */}
        {amenitiesSorted.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Ausstattung
              </p>

              {amenityValues.length > 0 && (
                <button
                  type="button"
                  onClick={() => setAmenityValues([])}
                  className="inline-flex min-h-10 items-center text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                  Auswahl löschen
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {amenitiesSorted.map((amenity) => {
                const value = normalizeAmenityName(amenity.name);
                const isActive = amenityValues.includes(value);
                const Icon = getAmenityIcon(amenity.name);

                return (
                  <button
                    type="button"
                    key={amenity.id}
                    onClick={() => toggleAmenity(value)}
                    className={[
                      "inline-flex min-h-10 items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition",
                      isActive
                        ? "border-sky-500 bg-sky-50 text-sky-900"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <Icon className="h-4 w-4" />
                    {amenity.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Aktionen */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={resetForm}
          disabled={isPending}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RotateCcw className="h-4 w-4" />
          Filter zurücksetzen
        </button>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-amber-400 px-5 py-2.5 text-sm font-extrabold uppercase tracking-[0.14em] text-slate-900 shadow-md hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/70 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Search className="h-4 w-4" />
          {isPending ? "Suche läuft …" : "Ergebnisse anzeigen"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, htmlFor, icon: Icon, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <label
          htmlFor={htmlFor}
          className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500"
        >
          {label}
        </label>

        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 ring-1 ring-slate-200">
          <Icon className="h-4 w-4 text-slate-700" />
        </span>
      </div>

      {children}
    </div>
  );
}

const inputClass =
  "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/50";