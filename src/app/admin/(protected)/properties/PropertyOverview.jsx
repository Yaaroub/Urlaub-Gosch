"use client";

import HuggedHeartIcon from "@/components/HuggedHeartIcon";
import Link from "next/link";
import { ArrowUpRight, Dog, Home, MapPin, MoreHorizontal, Pencil, Search, Trash2, Users, X } from "lucide-react";

export default function PropertyOverview({ items, filteredItems, locations, loading, busy, canEdit, canDelete, searchTerm, setSearchTerm, selectedLocation, onLocationChange, onReset, onCreate, onRemember, onDelete, getName, selectedPropertyId, availableObjectOptions, onPropertyChange }) {
  const handleLocationFilterChange = onLocationChange;
  const handlePropertyFilterChange = onPropertyChange;
  const getAdminPropertyName = getName;
  return (
    <div className="space-y-6">
      <div className="mb-5 space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">
            Objektübersicht
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Standardmäßig werden alle Objekte angezeigt. Bei Bedarf
            kannst du nach Ortschaft und Objekt filtern.
          </p>
        </div>

        {/* ====================================================
            Filter
        ==================================================== */}

        {items.length >
          0 && (
          <div className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:grid-cols-2 xl:grid-cols-[220px_280px_minmax(300px,1fr)_auto] xl:items-end">
            {/* Ortschaft */}

            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-slate-600">
                Ortschaft
              </span>

              <select
                value={
                  selectedLocation
                }
                onChange={
                  handleLocationFilterChange
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-400/30"
              >
                <option value="">
                  Alle Ortschaften
                </option>

                {locations.map(
                  (
                    location
                  ) => (
                    <option
                      key={
                        location
                      }
                      value={
                        location
                      }
                    >
                      {
                        location
                      }
                    </option>
                  )
                )}
              </select>
            </label>

            {/* Objekt */}

            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-slate-600">
                Objekt
              </span>

              <select
                value={
                  selectedPropertyId
                }
                onChange={
                  handlePropertyFilterChange
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-400/30"
              >
                <option value="">
                  Alle Objekte
                </option>

                {availableObjectOptions.map(
                  (item) => (
                    <option
                      key={
                        item.id
                      }
                      value={
                        item.id
                      }
                    >
                      {getAdminPropertyName(
                        item
                      )}
                    </option>
                  )
                )}
              </select>
            </label>

            {/* Suche */}

            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-slate-600">
                Suche
              </span>

              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />

                <input
                  type="search"
                  value={
                    searchTerm
                  }
                  onChange={(
                    event
                  ) =>
                    setSearchTerm(
                      event
                        .target
                        .value
                    )
                  }
                  placeholder="Objekt, Ort, Slug oder ID suchen …"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-400/30"
                />

                {searchTerm && (
                  <button
                    type="button"
                    onClick={() =>
                      setSearchTerm(
                        ""
                      )
                    }
                    className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </label>

            {/* Anzahl */}

            <span className="w-fit shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 xl:mb-2.5">
              {searchTerm.trim() ||
              selectedLocation ||
              selectedPropertyId
                ? `${filteredItems.length} von ${items.length}`
                : `${items.length} Objekt${
                    items.length ===
                    1
                      ? ""
                      : "e"
                  }`}
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div role="status" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((key) => <div key={key} className="h-52 animate-pulse rounded-xl border border-slate-200 bg-slate-100 motion-reduce:animate-none" />)}
          <span className="sr-only">Objekte werden geladen</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <Home aria-hidden="true" className="mx-auto h-8 w-8 text-slate-400" />
          <h2 className="mt-4 text-lg font-semibold text-slate-900">{items.length ? "Keine passende Unterkunft" : "Hier ist Platz für deine erste Unterkunft"}</h2>
          <p className="mt-2 text-sm text-slate-500">{items.length ? "Versuche einen anderen Suchbegriff oder entferne den Ortsfilter." : "Lege ein Objekt an, um Bilder, Preise und Belegungen zu verwalten."}</p>
          {items.length > 0 ? <button type="button" onClick={onReset} className="mt-5 min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold">Filter zurücksetzen</button> : canEdit && <button type="button" onClick={onCreate} className="mt-5 min-h-11 rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white">Erstes Objekt anlegen</button>}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => (
            <article key={item.id} id={`admin-property-${item.id}`} className="flex scroll-mt-28 flex-col rounded-xl border border-slate-200 bg-white transition-colors hover:border-teal-700/40">
              <div className="flex items-center justify-between gap-3 px-5 pt-4">
                <p className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-teal-800"><MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{item.location || "Ort fehlt"}</span></p>
                <span className="shrink-0 font-mono text-[10px] tabular-nums text-slate-400">Nr. {item.id}</span>
              </div>
              <div className="flex-1 px-5 pb-5 pt-3">
                <h2 className="break-words text-xl font-semibold leading-snug tracking-tight text-slate-950">{getName(item)}</h2>
                <p className={`mt-1.5 break-words text-sm ${item.address ? "text-slate-500" : "text-amber-700"}`}>{item.address || "Adresse noch ergänzen"}</p>
                <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5"><Users aria-hidden="true" className="h-3.5 w-3.5" />{item.maxPersons || "–"} Gäste</span>
                  <span className="inline-flex items-center gap-1.5"><Dog aria-hidden="true" className="h-3.5 w-3.5" />{item.dogsAllowed ? "Hunde erlaubt" : "Keine Hunde"}</span>
                  {item.kuschelwochenEnabled !== false && <span className="inline-flex items-center gap-1.5 text-amber-800"><HuggedHeartIcon aria-hidden="true" className="h-3.5 w-3.5" />Kuschelwochen</span>}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 rounded-b-xl border-t border-slate-100 bg-slate-50/60 px-4 py-3">
                <Link href={`/admin/properties?propertyId=${item.id}&focus=1`} onClick={() => onRemember(item)} aria-label={`${getName(item)} ${canEdit ? "im Bearbeitungsmodus öffnen" : "ansehen"}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-sky-600 px-3 text-xs font-semibold text-white transition hover:bg-sky-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"><Pencil aria-hidden="true" className="h-3.5 w-3.5" />{canEdit ? "Bearbeiten" : "Objekt öffnen"}</Link>
                {item.slug && <a href={`/properties/${item.slug}`} target="_blank" rel="noreferrer" aria-label={`Vorschau für ${getName(item)} (neuer Tab)`} className="inline-flex min-h-11 items-center gap-1.5 px-2 text-xs font-medium text-slate-600 hover:text-teal-800"><ArrowUpRight aria-hidden="true" className="h-4 w-4" />Vorschau</a>}
                {(item.slug || canDelete) && <details className="relative ml-auto" onKeyDown={(event) => { if (event.key === "Escape") { event.currentTarget.open = false; event.currentTarget.querySelector("summary").focus(); } }} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false; }}>
                  <summary aria-label={`Weitere Aktionen für ${getName(item)}`} className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 [&::-webkit-details-marker]:hidden"><MoreHorizontal aria-hidden="true" className="h-5 w-5" /></summary>
                  <div className="absolute bottom-12 right-0 z-20 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                    {item.slug && <a href={`/api/ical/${item.slug}`} target="_blank" rel="noreferrer" className="flex min-h-11 items-center rounded px-3 text-xs text-slate-700 hover:bg-slate-50">iCal exportieren</a>}
                    {canDelete && <button type="button" disabled={busy} onClick={(event) => { event.currentTarget.closest("details").open = false; onDelete(item); }} className="flex min-h-11 w-full items-center gap-2 rounded px-3 text-xs text-rose-700 hover:bg-rose-50 disabled:opacity-50"><Trash2 aria-hidden="true" className="h-3.5 w-3.5" />Objekt löschen</button>}
                  </div>
                </details>}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
