"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Ban,
  Building2,
  ChevronDown,
  Dog,
  MapPin,
  Minus,
  PawPrint,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import {
  getAmenityIcon,
  normalizeAmenityName,
} from "@/lib/amenity-icons";

/** "24217 Schönberger Strand" -> "Schönberger Strand" (value stays unchanged). */
function placeLabel(place) {
  return String(place).replace(/^\d{5}\s+/, "").trim() || String(place);
}

function isUnknownPlace(place) {
  return /^(\d{5}\s+)?unbekannt$/i.test(String(place).trim());
}

/**
 * Compact search: the four things guests actually decide on (dates, place,
 * guests) plus dog preference. Object name, street and amenities live under
 * "Mehr Filter" so the first accommodations are visible much sooner on mobile.
 */
export default function SearchForm({
  initialParams = {},
  amenities = [],
  locations = [],
  objects = [],
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [arrival, setArrival] = useState(initialParams.arrival || "");
  const [departure, setDeparture] = useState(initialParams.departure || "");
  const [objectName, setObjectName] = useState(initialParams.objectName || "");
  const [street, setStreet] = useState(initialParams.street || "");
  const [location, setLocation] = useState(initialParams.location || "");
  const [persons, setPersons] = useState(initialParams.persons || "");
  const [dogs, setDogs] = useState(initialParams.dogs === "true");
  const [petFree, setPetFree] = useState(initialParams.dogs === "false");

  const [amenityValues, setAmenityValues] = useState(() => {
    const value = initialParams?.amenity;
    const values = Array.isArray(value) ? value : value ? [value] : [];
    return values.map((item) => normalizeAmenityName(item)).filter(Boolean);
  });

  const advancedCount = Number(Boolean(street.trim())) + amenityValues.length;
  const [showMore, setShowMore] = useState(advancedCount > 0);

  // Dropdown of existing objects (requested by Urlaub Gosch). A value from an
  // older free-text search stays selectable.
  const objectOptions = useMemo(() => {
    const list = (Array.isArray(objects) ? objects : []).map((title) => String(title).trim()).filter(Boolean);
    if (objectName && !list.includes(objectName)) list.push(objectName);
    return [...new Set(list)].sort((a, b) => a.localeCompare(b, "de", { sensitivity: "base" }));
  }, [objects, objectName]);

  const amenitiesSorted = useMemo(() => {
    const values = Array.isArray(amenities) ? amenities : [];
    return [...values].sort((a, b) =>
      String(a?.name || "").localeCompare(String(b?.name || ""), "de", { sensitivity: "base" })
    );
  }, [amenities]);

  const locationsSorted = useMemo(() => {
    const values = Array.isArray(locations) ? locations : [];
    const normalized = values
      .map((item) => (typeof item === "string" ? item.trim() : String(item?.location || "").trim()))
      .filter((place) => place && !isUnknownPlace(place));

    // A place already in the URL stays selectable.
    if (location) normalized.push(String(location).trim());

    return [...new Set(normalized)].sort((a, b) =>
      placeLabel(a).localeCompare(placeLabel(b), "de", { sensitivity: "base" })
    );
  }, [locations, location]);

  function toggleAmenity(value) {
    setAmenityValues((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  }

  function changePersons(delta) {
    setPersons((current) => {
      const next = Math.min(20, Math.max(0, (Number(current) || 0) + delta));
      return next === 0 ? "" : String(next);
    });
  }

  function resetForm() {
    setArrival("");
    setDeparture("");
    setObjectName("");
    setStreet("");
    setLocation("");
    setPersons("");
    setDogs(false);
    setPetFree(false);
    setAmenityValues([]);

    startTransition(() => {
      router.replace("/", { scroll: false });
    });

    window.setTimeout(() => {
      document.getElementById("suche")?.scrollIntoView({ behavior: "smooth", block: "start" });
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

    const numberOfPersons = Number(persons);
    if (Number.isFinite(numberOfPersons) && numberOfPersons > 0) {
      params.set("persons", String(numberOfPersons));
    }

    if (dogs) params.set("dogs", "true");
    if (petFree) params.set("dogs", "false");

    amenityValues.forEach((amenity) => params.append("amenity", amenity));

    const queryString = params.toString();

    startTransition(() => {
      router.replace(queryString ? `/?${queryString}` : "/", { scroll: false });
    });

    window.setTimeout(() => {
      document.getElementById("unterkuenfte")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {/* Main fields: 2 columns on phones, 4 on desktop */}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-3">
        <Field label="Anreise" htmlFor="arrival">
          <input
            id="arrival"
            name="arrival"
            type="date"
            value={arrival}
            onChange={(event) => {
              const nextArrival = event.target.value;
              setArrival(nextArrival);
              if (departure && nextArrival && departure <= nextArrival) setDeparture("");
            }}
            className={inputClass}
          />
        </Field>

        <Field label="Abreise" htmlFor="departure">
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

        <Field label="Ort" htmlFor="location">
          <select
            id="location"
            name="location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            className={inputClass}
          >
            <option value="">Alle Orte</option>
            {locationsSorted.map((place) => (
              <option key={place} value={place}>
                {placeLabel(place)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Gäste" htmlFor="persons">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => changePersons(-1)}
              disabled={!persons}
              aria-label="Eine Person weniger"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700 transition hover:bg-slate-200 disabled:opacity-40"
            >
              <Minus className="h-4 w-4" />
            </button>
            <input
              id="persons"
              name="persons"
              type="number"
              min={1}
              max={20}
              inputMode="numeric"
              placeholder="Alle"
              value={persons}
              onChange={(event) => {
                const value = event.target.value;
                if (value === "") return setPersons("");
                setPersons(String(Math.min(20, Math.max(1, Number(value) || 1))));
              }}
              className="h-9 w-full min-w-0 bg-transparent text-center text-sm font-semibold text-slate-900 outline-none [appearance:textfield] placeholder:font-normal placeholder:text-slate-400 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={() => changePersons(1)}
              aria-label="Eine Person mehr"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700 transition hover:bg-slate-200"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </Field>

        <div className="col-span-2">
          <Field label="Unterkunft" htmlFor="objectName" icon={Building2}>
            <select
              id="objectName"
              name="objectName"
              value={objectName}
              onChange={(event) => setObjectName(event.target.value)}
              className={inputClass}
            >
              <option value="">Alle Unterkünfte</option>
              {objectOptions.map((title) => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {/* Pets + more filters (next to the object dropdown on desktop) */}
        <div className="col-span-2 flex flex-wrap items-center gap-2">

        <TogglePill
          active={dogs}
          onClick={() => {
            setDogs((value) => !value);
            setPetFree(false);
          }}
          icon={<Dog className="h-4 w-4" aria-hidden="true" />}
          label="Mit Hund"
        />
        <TogglePill
          active={petFree}
          onClick={() => {
            setPetFree((value) => !value);
            setDogs(false);
          }}
          icon={
            <span className="relative inline-flex h-4 w-4 items-center justify-center" aria-hidden="true">
              <PawPrint className="h-3.5 w-3.5" />
              <Ban className="absolute h-4 w-4" />
            </span>
          }
          label="Tierfrei"
        />
        <button
          type="button"
          onClick={() => setShowMore((value) => !value)}
          aria-expanded={showMore}
          aria-controls="search-more-filters"
          className="ml-auto inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-slate-600 transition hover:text-slate-950"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Mehr Filter
          {advancedCount > 0 ? (
            <span className="rounded-full bg-sky-600 px-1.5 text-[10px] font-bold text-white">{advancedCount}</span>
          ) : null}
          <ChevronDown className={`h-4 w-4 transition ${showMore ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
        </div>
      </div>

      {showMore ? (
        <div id="search-more-filters" className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3">
          <div className="grid gap-2 sm:max-w-sm">
            <Field label="Straße" htmlFor="street" icon={MapPin}>
              <input
                id="street"
                name="street"
                type="search"
                value={street}
                onChange={(event) => setStreet(event.target.value)}
                placeholder="z. B. Strandstraße"
                autoComplete="off"
                className={inputClass}
              />
            </Field>
          </div>

          {amenitiesSorted.length > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Ausstattung</p>
                {amenityValues.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setAmenityValues([])}
                    className="text-xs font-medium text-slate-500 hover:text-slate-800"
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
                      aria-pressed={isActive}
                      className={[
                        "inline-flex min-h-9 items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition",
                        isActive
                          ? "border-sky-300 bg-sky-50 text-sky-900"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {amenity.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Actions */}
      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={resetForm}
          disabled={isPending}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 text-xs font-semibold text-slate-500 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Zurücksetzen
        </button>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 px-6 text-sm font-extrabold uppercase tracking-[0.12em] text-slate-900 shadow-md hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/70 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          {isPending ? "Suche läuft …" : "Unterkünfte finden"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, htmlFor, icon: Icon, children }) {
  return (
    <div className="min-w-0 rounded-2xl bg-white px-3 pb-2 pt-2.5 ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-sky-400">
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500"
      >
        {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
        {label}
      </label>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

function TogglePill({ active, onClick, icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-xs font-semibold transition",
        active
          ? "border-sky-300 bg-sky-50 text-sky-900"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
      ].join(" ")}
    >
      {icon}
      {label}
    </button>
  );
}

const inputClass =
  "h-9 w-full min-w-0 bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400";
