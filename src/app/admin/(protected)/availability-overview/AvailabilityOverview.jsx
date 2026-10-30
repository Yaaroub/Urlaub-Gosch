"use client";

import { loadPrice } from "@/lib/price-loader";

import Link from "next/link";
import { PriceSummary } from "./StayQuote";
import FloatingStayQuote from "./FloatingStayQuote";
import { useRouter, useSearchParams } from "next/navigation";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, RefreshCw, Search } from "lucide-react";
import { DAY_MS, dateKey, getOverviewWindow, getDayStatus, getFreeIntervals, isStayAvailable, selectCalendarStay } from "@/lib/availability-overview";


const fullDate = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeZone: "UTC" });
const weekday = new Intl.DateTimeFormat("de-DE", { weekday: "short", timeZone: "UTC" });
const gapDate = (value) => fullDate.format(new Date(`${value}T00:00:00Z`));
const groupOf = (property) => property.available ? "full" : property.gaps.length ? "partial" : "booked";
const groupTitles = { full: "Durchgehend frei", partial: "Freie Teilzeiträume · Alternativen", booked: "Im gesamten Zeitraum belegt" };
const field = "mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-100";
const button = "inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40";
const statusLabels = { free: "Frei", boundary: "An- oder Abreise", booked: "Belegt" };


function GapOffer({ gap, propertyTitle, onChoose, primary = false }) {
  return <div className={primary ? "space-y-2" : "border-t border-slate-100 pt-3"}>
    <p className="text-sm font-semibold tabular-nums text-slate-900">{gapDate(gap.arrival)} – {gapDate(gap.departure)}</p>
    <p className="mt-1 text-xs text-slate-500">{gap.nights} {gap.nights === 1 ? "Nacht" : "Nächte"}{primary ? " · längster freier Teilzeitraum" : " · weitere Alternative"}</p>
    <button onClick={() => onChoose({ arrival: gap.arrival, departure: gap.departure })} aria-label={propertyTitle + ": " + gapDate(gap.arrival) + " bis " + gapDate(gap.departure) + " übernehmen"} className="mt-2 inline-flex min-h-10 items-center justify-center rounded-lg bg-sky-600 px-3 text-xs font-semibold text-white hover:bg-sky-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600">Zeitraum übernehmen →</button>
  </div>;
}

function PartialOffer({ property, onChoose }) {
  const gaps = [...property.gaps].sort((a, b) => b.nights - a.nights || a.arrival.localeCompare(b.arrival));
  return <div>
    <GapOffer gap={gaps[0]} propertyTitle={property.title} onChoose={onChoose} primary />
    {gaps.length > 1 && <details className="mt-3"><summary className="cursor-pointer py-2 text-xs font-medium text-slate-600 hover:text-sky-700">{gaps.length - 1} weitere {gaps.length === 2 ? "Lücke" : "Lücken"} anzeigen</summary><div className="space-y-3 pt-1">{gaps.slice(1).map((gap) => <GapOffer key={gap.arrival} gap={gap} propertyTitle={property.title} onChoose={onChoose} />)}</div></details>}
    <p className="mt-3 text-[10px] text-slate-400">Preis nach Auswahl des Teilzeitraums</p>
  </div>;
}

export default function AvailabilityOverview() {
  const router = useRouter();
  const params = useSearchParams();
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(new Date());
  const arrival = params.get("arrival") || today;
  const departure = params.get("departure") || dateKey(new Date(+new Date(`${today}T00:00:00Z`) + 7 * DAY_MS));
  const persons = Math.max(1, Number(params.get("persons")) || 1);
  const dogs = params.get("dogs") === "1";
  const location = params.get("location") || "";
  const onlyFree = params.get("view") !== "all";
  const [draft, setDraft] = useState({ arrival, departure, persons, dogs, location });
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [loadedAt, setLoadedAt] = useState(null);
  const [page, setPage] = useState(0);
  const [prices, setPrices] = useState({});
  const [selection, setSelection] = useState(null);
  const [selectionError, setSelectionError] = useState("");
  const calendarRef = useRef(null);
  const clearSelection = useCallback(() => { setSelection(null); setSelectionError(""); }, []);
  useEffect(() => { setSelection(null); setSelectionError(""); }, [arrival, departure, persons, dogs, location, onlyFree, page, refresh]);
  function selectDay(property, day) {
    const result = selectCalendarStay(selection, property, day);
    setSelectionError(result.error || "");
    if (result.selection) setSelection(result.selection);
  }
  const window = useMemo(() => getOverviewWindow(arrival, departure), [arrival, departure]);

  useEffect(() => { setDraft({ arrival, departure, persons, dogs, location }); }, [arrival, departure, persons, dogs, location]);
  useEffect(() => { setPage(0); }, [arrival, departure, persons, dogs, location, onlyFree]);

  useEffect(() => {
    const controller = new AbortController();
    setProperties([]); setError(""); setLoading(true); setLoadedAt(null);
    if (!window) { setError("Bitte einen gültigen Aufenthalt mit höchstens 90 Nächten wählen."); setLoading(false); return; }
    fetch(`/api/admin/availability-overview?${new URLSearchParams({ arrival, departure })}`, { cache: "no-store", signal: controller.signal })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Verfügbarkeiten konnten nicht geladen werden.");
        if (!controller.signal.aborted) { setProperties(data.properties); setLoadedAt(new Date()); }
      })
      .catch((err) => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [arrival, departure, refresh, window]);

  const matching = useMemo(() => properties
    .filter((p) => p.maxPersons >= persons && (!dogs || p.dogsAllowed) && (!location || p.location === location))
    .map((p) => ({ ...p, available: isStayAvailable(p.bookings, arrival, departure), gaps: getFreeIntervals(p.bookings, arrival, departure) }))
    .sort((a, b) => Number(b.available) - Number(a.available) || Math.max(0, ...b.gaps.map((gap) => gap.nights)) - Math.max(0, ...a.gaps.map((gap) => gap.nights)) || a.title.localeCompare(b.title, "de")),
  [properties, persons, dogs, location, arrival, departure]);
  const freeCount = matching.filter((p) => p.available).length;
  const partialCount = matching.filter((p) => !p.available && p.gaps.length).length;
  const results = useMemo(() => matching.filter((p) => !onlyFree || p.gaps.length), [matching, onlyFree]);
  const visible = useMemo(() => results.slice(page * 20, page * 20 + 20), [results, page]);

  // Limit concurrent price requests and cancel obsolete searches.
  useEffect(() => {
    const controller = new AbortController();
    setPrices({});
    const queue = visible.filter((p) => p.available);
    async function worker() {
      while (queue.length && !controller.signal.aborted) {
        const property = queue.shift();
        try {
          const data = await loadPrice({ propertyId: property.id, arrival, departure }, { signal: controller.signal });
          if (!controller.signal.aborted) setPrices((current) => ({ ...current, [property.id]: data }));
        } catch (err) {
          if (!controller.signal.aborted) setPrices((current) => ({ ...current, [property.id]: { error: err.message, code: err.code } }));
        }
      }
    }
    for (let i = 0; i < 3; i++) worker();
    return () => controller.abort();
  }, [visible, arrival, departure]);

  function navigate(values) {
    const query = new URLSearchParams({ arrival, departure, persons: String(persons), dogs: dogs ? "1" : "0", location, view: onlyFree ? "free" : "all", ...values });
    router.replace(`/admin/availability-overview?${query}`, { scroll: false });
  }
  function submit(event) {
    event.preventDefault();
    if (!getOverviewWindow(draft.arrival, draft.departure)) { setFormError("Die Abreise muss nach der Anreise liegen. Maximal 90 Nächte pro Suche."); return; }
    setFormError("");
    navigate({ ...draft, persons: String(draft.persons), dogs: draft.dogs ? "1" : "0" });
  }
  function shift(amount) {
    if (!window) return;
    navigate({ arrival: dateKey(new Date(+window.start + amount * DAY_MS)), departure: dateKey(new Date(+window.end + amount * DAY_MS)) });
  }
  const days = useMemo(() => window ? Array.from({ length: (window.to - window.from) / DAY_MS }, (_, i) => new Date(+window.from + i * DAY_MS)) : [], [window]);
  const dayStatuses = useMemo(() => new Map(visible.map((property) => [property.id, Object.fromEntries(days.map((day) => { const key = dateKey(day); return [key, getDayStatus(property.bookings, key)]; }))])), [visible, days]);
  const columns = `220px repeat(${days.length}, minmax(32px, 1fr)) 240px`;
  const calendarWidth = 220 + days.length * 32 + 240;
  const returnTo = `/admin/availability-overview?${new URLSearchParams({ arrival, departure, persons: String(persons), dogs: dogs ? "1" : "0", location, view: onlyFree ? "free" : "all" })}`;

  return <main className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6">
    <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-sky-700"><ArrowLeft size={16} /> Zur Verwaltung</Link>
    <div className="mb-4 mt-3 flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-semibold uppercase tracking-widest text-sky-700">Telefonische Beratung</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Was ist noch frei?</h1><p className="mt-1 text-sm text-slate-600">Reisezeit wählen und die Belegung aller passenden Objekte vergleichen.</p></div>
      <Link href="/admin/availability" className={button}>Belegungen verwalten</Link>
    </div>

    <form onSubmit={submit} className="z-50 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_100px_1fr_auto_auto]">
        <label className="text-xs font-semibold text-slate-600">Anreise<input required type="date" value={draft.arrival} onChange={(e) => setDraft({ ...draft, arrival: e.target.value })} className={field} /></label>
        <label className="text-xs font-semibold text-slate-600">Abreise<input required type="date" min={draft.arrival} value={draft.departure} onChange={(e) => setDraft({ ...draft, departure: e.target.value })} className={field} /></label>
        <label className="text-xs font-semibold text-slate-600">Personen<input required type="number" min="1" max="100" value={draft.persons} onChange={(e) => setDraft({ ...draft, persons: e.target.value })} className={field} /></label>
        <label className="text-xs font-semibold text-slate-600">Ort<select value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} className={field}><option value="">Alle Orte</option>{[...new Set([...properties.map((p) => p.location), ...(location ? [location] : [])])].sort().map((place) => <option key={place}>{place}</option>)}</select></label>
        <label className="flex min-h-11 items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={draft.dogs} onChange={(e) => setDraft({ ...draft, dogs: e.target.checked })} className="h-4 w-4 accent-sky-600" /> Mit Hund</label>
        <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-sky-600 px-5 text-sm font-semibold text-white hover:bg-sky-700"><Search size={17} /> Verfügbarkeit prüfen</button>
      </div>
      {formError && <p role="alert" className="mt-3 text-sm text-red-700">{formError}</p>}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2"><span className="text-xs text-slate-500">Aufenthalt verschieben · Dauer bleibt gleich</span>
        <div className="flex flex-wrap gap-2"><button type="button" onClick={() => shift(-1)} disabled={!window || loading} className={button}><ChevronLeft size={16} /> 1 Tag</button><button type="button" onClick={() => shift(1)} disabled={!window || loading} className={button}>1 Tag <ChevronRight size={16} /></button><button type="button" onClick={() => shift(-7)} disabled={!window || loading} className={button}><ChevronLeft size={16} /> 1 Woche</button><button type="button" onClick={() => shift(7)} disabled={!window || loading} className={button}>1 Woche <ChevronRight size={16} /></button><button type="button" onClick={() => setRefresh((n) => n + 1)} disabled={loading} className={button}><RefreshCw size={16} /> Aktualisieren</button></div>
      </div>
    </form>

    <section aria-label="Suchergebnisse" aria-busy={loading} className="mt-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="font-semibold text-slate-900">{window ? `${fullDate.format(window.start)} – ${fullDate.format(window.end)} · ${window.nights} Nächte` : "Zeitraum wählen"}</h2><p aria-live="polite" className="mt-1 text-sm text-slate-500">{loading ? "Belegung wird geprüft …" : error ? "Keine verlässlichen Belegungsdaten verfügbar" : `${freeCount} durchgehend frei · ${partialCount} mit freien Teilzeiträumen · ${matching.length} passende Objekte`}</p></div>

      </div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1">{[[true, "Freie Objekte & Teilzeiträume"], [false, "Alle Objekte"]].map(([value, label]) => <button key={label} aria-pressed={onlyFree === value} onClick={() => navigate({ view: value ? "free" : "all" })} className={`min-h-10 rounded-lg px-4 text-sm font-semibold ${onlyFree === value ? "bg-white text-sky-800 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>{label}</button>)}</div>
        <div className="flex flex-wrap gap-4 text-xs text-slate-600"><span><i className="mr-1 inline-block h-3 w-3 rounded-sm border border-slate-300 bg-white" /> Frei</span><span><i className="mr-1 inline-block h-3 w-3 rounded-sm bg-pink-200" /> An-/Abreise</span><span><i className="mr-1 inline-block h-3 w-3 rounded-sm bg-red-500" /> Belegt</span><span><i className="mr-1 inline-block h-3 w-3 rounded-sm border-2 border-sky-600" /> Gesuchter Aufenthalt</span></div>
      </div>
      {error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">{error}</div> : loading ? <div className="rounded-xl border bg-white p-12 text-center text-slate-500">Kalender werden geladen …</div> : !results.length ? <div className="rounded-xl border border-slate-200 bg-white p-10 text-center"><h3 className="font-semibold text-slate-900">{onlyFree ? "Keine freien Nächte im gesuchten Zeitraum" : "Keine passenden Objekte"}</h3><p className="mt-2 text-sm text-slate-600">{onlyFree ? "Zeige alle Objekte, um benachbarte freie Tage zu vergleichen, oder verschiebe den Aufenthalt." : "Passe die Personenzahl oder den Ort an."}</p>{onlyFree && <button onClick={() => navigate({ view: "all" })} className={`${button} mt-4`}>Alle Objekte anzeigen</button>}</div> : <>
        <p className="mb-2 text-xs text-slate-500">Preis für einen anderen Aufenthalt: In einer Objektzeile zuerst die Anreise, dann die Abreise anklicken. Die Auswahl bucht oder blockiert keine Tage.</p>
        {selectionError && <p role="alert" className="mb-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{selectionError}</p>}
        <div ref={calendarRef} tabIndex={0} role="region" aria-label="Vergleichskalender, horizontal scrollbar" style={{ scrollbarGutter: "stable", overflowAnchor: "none" }} className="max-h-[60vh] overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm focus-visible:outline-2 focus-visible:outline-sky-600">
          <table className="block border-separate border-spacing-0 text-sm" style={{ width: "100%", minWidth: calendarWidth }}>
            <thead className="sticky top-0 z-30 block"><tr className="grid" style={{ gridTemplateColumns: columns }}>
              <th className="z-40 lg:sticky lg:left-0 border-b border-r border-slate-200 bg-slate-100 p-4 text-left">Objekt</th>
              {days.map((day) => { const key = dateKey(day); const selected = key >= arrival && key <= departure; return <th key={key} title={fullDate.format(day)} className={`border-b border-r border-slate-200 py-2 text-center ${selected ? "bg-sky-100 text-sky-900" : "bg-slate-100 text-slate-500"}`}><span className="block text-[9px] font-normal">{day.getUTCDate()}.{day.getUTCMonth() + 1}.</span><span className="block text-[10px]">{weekday.format(day)}</span><span className="block text-[8px]">{key === arrival ? "AN" : key === departure ? "AB" : "\u00a0"}</span></th>; })}
              <th className="border-b border-l border-slate-200 bg-slate-100 p-3 text-left lg:sticky lg:right-0 lg:z-40">Ihr Angebot</th>
            </tr></thead>
            <tbody className="block">{visible.map((property, index) => <Fragment key={property.id}>{(index === 0 || groupOf(visible[index - 1]) !== groupOf(property)) && <tr className="grid" style={{ gridTemplateColumns: columns }}><th style={{ gridColumn: "1 / -1" }} colSpan={days.length + 2} scope="colgroup" className={`border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide ${property.available ? "bg-slate-50 text-slate-800" : property.gaps.length ? "bg-slate-50 text-slate-800" : "bg-slate-100 text-slate-600"}`}><span className="sticky left-4">{groupTitles[groupOf(property)]}</span></th></tr>}<tr className="grid" style={{ gridTemplateColumns: columns }}>
              <th scope="row" className="z-20 lg:sticky lg:left-0 border-b border-r border-slate-200 bg-white px-3 py-2 text-left font-normal">
                <Link href={`/admin/availability?propertyId=${property.id}&returnTo=${encodeURIComponent(returnTo)}`} className="font-semibold text-slate-900 hover:text-sky-700 hover:underline">{property.title}</Link>
                <p className="mt-1 text-xs text-slate-500">{property.location} · bis {property.maxPersons} Pers.{property.dogsAllowed ? " · Hund erlaubt" : ""}</p>
                <span className={`mt-2 inline-block text-[11px] font-semibold ${property.available ? "text-emerald-700" : property.gaps.length ? "text-slate-600" : "text-slate-400"}`}>{property.available ? "Gesamter Aufenthalt frei" : property.gaps.length ? "Teilweise verfügbar" : "Keine freien Nächte"}</span>
              </th>
              {days.map((day) => { const key = dateKey(day); const status = dayStatuses.get(property.id)[key]; const selected = key >= arrival && key <= departure; const marked = selection?.propertyId === property.id && key >= selection.arrival && key <= (selection.departure || selection.arrival); return <td key={key} aria-label={`${fullDate.format(day)}: ${statusLabels[status]}`} title={`${fullDate.format(day)} · ${statusLabels[status]}`} className={`flex items-center justify-center border-b border-r border-slate-100 ${selected ? "bg-slate-50/70" : [0, 6].includes(day.getUTCDay()) ? "bg-slate-50" : "bg-white"} ${key === arrival ? "border-l-2 border-l-sky-300" : ""} ${key === departure ? "border-r-2 border-r-sky-300" : ""}`}><button type="button" onClick={() => selectDay(property, key)} aria-label={`${property.title}, ${fullDate.format(day)}: ${statusLabels[status]}. Als Anreise oder Abreise wählen`} aria-pressed={marked} className={`flex min-h-8 w-full focus-visible:outline-2 focus-visible:outline-sky-700 hover:ring-2 hover:ring-sky-400 ${marked ? "ring-2 ring-sky-600 bg-sky-100 font-bold " : ""} items-center justify-center rounded text-[10px] ${status === "booked" ? "bg-red-500 text-white" : status === "boundary" ? "bg-pink-200 text-pink-900" : selected ? "text-slate-400" : "text-slate-400"}`}>{status === "booked" ? "×" : status === "boundary" ? "↔" : "·"}</button></td>; })}
              <td className="flex min-w-0 flex-col justify-center break-words border-b border-l border-slate-200 bg-white p-3 lg:sticky lg:right-0 lg:z-20">{!property.available ? property.gaps.length ? <PartialOffer key={`${property.id}-${arrival}-${departure}`} property={property} onChoose={navigate} /> : <span className="text-xs text-slate-400">Für diesen Zeitraum belegt</span> : <PriceSummary quote={prices[property.id]} arrival={arrival} departure={departure} compact />}</td>
            </tr></Fragment>)}</tbody>
          </table>
        </div>
        {results.length > 20 && <div className="mt-4 flex items-center justify-between"><button disabled={page === 0} onClick={() => setPage((n) => n - 1)} className={button}>Zurück</button><span className="text-sm text-slate-600">{page * 20 + 1}–{Math.min((page + 1) * 20, results.length)} von {results.length} Objekten</span><button disabled={(page + 1) * 20 >= results.length} onClick={() => setPage((n) => n + 1)} className={button}>Weitere Objekte</button></div>}
      </>}
      {loadedAt && !error && <p className="mt-4 text-xs text-slate-500">Abgerufen um {loadedAt.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr · Belegung laut gespeicherten Buchungen. Vor Zusage bei Bedarf aktualisieren.</p>}
    </section>
    {selection && <FloatingStayQuote selection={selection} calendarRef={calendarRef} onClear={clearSelection} />}
  </main>;
}
