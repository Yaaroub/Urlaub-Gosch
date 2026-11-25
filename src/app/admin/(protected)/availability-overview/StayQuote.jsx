"use client";

import { loadPrice } from "@/lib/price-loader";

import { useEffect, useState } from "react";

const money = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });
const date = (value) => new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));

export function PriceSummary({ quote, arrival, departure, compact = false }) {
  if (!quote) return <span className="text-xs text-slate-500">Preis wird berechnet …</span>;
  if (quote.error) return <p role="alert" title={quote.error} className="text-xs text-amber-800">{compact ? "Preis derzeit nicht berechenbar" : quote.error}</p>;
  if (compact) return <div className="space-y-1">
    <p className="text-lg font-semibold tabular-nums text-slate-950">{money.format(quote.total)} <span className="text-[10px] font-normal text-slate-500">/ {quote.nights} Nächte</span></p>
    <p className="text-xs tabular-nums text-slate-600">Ø {money.format(quote.subtotal / quote.nights)} / Nacht</p>
    <p className="text-[10px] text-slate-400">Gesamt inkl. Nebenkosten · Nachtpreis ohne</p>
    {quote.discountAmount > 0 && <p className="text-[10px] text-emerald-700">{quote.kuschelwochen ? "Kuschelwochen" : "Last-Minute"} inklusive</p>}
  </div>;
  return <div>
    <p className="text-xs tabular-nums text-slate-500">{date(arrival)} – {date(departure)} · {quote.nights} Nächte</p>
    <p className="mt-1 text-xl font-semibold tabular-nums text-slate-950">{money.format(quote.total)}</p>
    <p className="text-[11px] text-slate-500">inkl. hinterlegter Nebenkosten</p>
    <p className="mt-2 text-sm font-medium text-slate-800">Ø {money.format(quote.subtotal / quote.nights)} / Nacht</p>
    <p className="text-[10px] text-slate-500">Übernachtung nach Rabatt, ohne Nebenkosten</p>
    {quote.discountAmount > 0 && <p className="mt-1 text-xs text-emerald-700">{quote.kuschelwochen ? "Kuschelwochen" : "Last-Minute"} · {money.format(quote.discountAmount)} gespart</p>}
    <details className="mt-2"><summary className="cursor-pointer py-1 text-xs font-medium text-sky-700">Nachtpreise & Nebenkosten</summary>
      <dl className="mt-2 space-y-1 text-xs">{quote.breakdown?.map((night) => <div key={night.date} className="flex justify-between gap-2"><dt>{date(night.date)}</dt><dd className="tabular-nums">{money.format(night.price)}</dd></div>)}
        <div className="flex justify-between gap-2 border-t border-slate-200 pt-2"><dt>Nebenkosten gesamt</dt><dd>{money.format(quote.extras)}</dd></div>
      </dl>
    </details>
  </div>;
}

export default function StayQuote({ selection, onClear }) {
  const [quote, setQuote] = useState(null);
  useEffect(() => {
    if (!selection.departure) return;
    const controller = new AbortController();
    loadPrice({ propertyId: selection.propertyId, arrival: selection.arrival, departure: selection.departure }, { signal: controller.signal, priority: true })
      .then((data) => {
        if (!controller.signal.aborted) setQuote(data);
      }).catch((error) => { if (!controller.signal.aborted) setQuote({ error: error.message, code: error.code }); });
    return () => controller.abort();
  }, [selection]);
  return <div className="border-l-2 border-sky-500 pl-3" aria-live="polite">
    <div className="mb-2 flex items-center justify-between gap-2"><span className="text-xs font-semibold text-sky-700">Markierter Aufenthalt</span><button onClick={onClear} className="min-h-8 px-2 text-xs text-slate-500 hover:text-sky-700">Aufheben</button></div>
    {selection.departure ? <PriceSummary quote={quote} arrival={selection.arrival} departure={selection.departure} /> : <p className="text-sm text-slate-700">Anreise: {date(selection.arrival)}. Jetzt den Abreisetag anklicken.</p>}
  </div>;
}
