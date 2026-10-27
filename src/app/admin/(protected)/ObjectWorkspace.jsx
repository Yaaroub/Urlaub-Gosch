"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ArrowLeft, CalendarDays, Euro, Eye, Images, MapPin, Pencil, Settings, Tag, Upload } from "lucide-react";

const FocusContext = createContext(null);
export const useObjectFocus = () => useContext(FocusContext);

const sections = [
  ["properties", "Grunddaten", Pencil],
  ["prices", "Preiszeiten", Euro],
  ["fees", "Nebenkosten", Settings],
  ["images", "Bilder", Images],
  ["availability", "Belegung", CalendarDays],
  ["ical", "iCal", Upload],
  ["lastminute", "Angebote", Tag],
];

export default function ObjectWorkspace({ children }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const id = params.get("propertyId");
  const focused = params.get("focus") === "1" && /^[1-9]\d*$/.test(id || "") &&
    sections.some(([route]) => pathname === `/admin/${route}`);
  const [property, setProperty] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!focused) return;
    const controller = new AbortController();
    setProperty(null);
    setError("");
    fetch(`/api/admin/properties/${id}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Objekt konnte nicht geladen werden.");
        setProperty(data);
      })
      .catch((err) => { if (!controller.signal.aborted) setError(err.message); });
    return () => controller.abort();
  }, [focused, id]);

  return (
    <FocusContext.Provider value={focused ? id : null}>
      {focused && (
        <header className="sticky top-0 z-[70] border-b border-slate-300 bg-[#f8f7f3] shadow-sm">
          <div className="mx-auto max-w-[1600px] px-4 pt-4 md:px-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1 border-l-4 border-teal-700 pl-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-800">Objekt bearbeiten · Nr. {id}</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">{property?.title || `Objekt ${id}`}</h2>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-600"><MapPin className="h-3.5 w-3.5" />{property ? [property.address, property.location].filter(Boolean).join(" · ") : "Objektdaten werden geladen …"}</p>
                {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {property?.slug && <a href={`/properties/${property.slug}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 px-3 text-xs font-semibold text-slate-600 hover:text-teal-800"><Eye className="h-4 w-4" />Vorschau</a>}
                <Link href={`/admin/properties?scrollTo=${id}`} scroll={false} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-800 hover:border-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700"><ArrowLeft className="h-4 w-4" />Zur Objektübersicht</Link>
              </div>
            </div>
            <nav aria-label="Objekt bearbeiten" className="mt-4 flex gap-1 overflow-x-auto">
              {sections.map(([route, label, Icon]) => {
                const active = pathname === `/admin/${route}`;
                return <Link key={route} href={`/admin/${route}?propertyId=${id}&focus=1`} aria-current={active ? "page" : undefined} className={`inline-flex min-h-12 shrink-0 items-center gap-2 border-b-[3px] px-3 text-sm font-medium transition-colors ${active ? "border-teal-700 text-teal-900" : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-900"}`}><Icon className="h-4 w-4" />{label}</Link>;
              })}
            </nav>
          </div>
        </header>
      )}
      <div key={focused ? id : "overview"}>{children}</div>
    </FocusContext.Provider>
  );
}
