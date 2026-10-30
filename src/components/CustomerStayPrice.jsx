"use client";

import { loadPrice } from "@/lib/price-loader";

import { useEffect, useRef, useState } from "react";

const euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

export default function CustomerStayPrice({ propertyId, arrival, departure }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [quote, setQuote] = useState(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: "100px" });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!visible || !arrival || !departure) return;
    const controller = new AbortController();
    setQuote(null);
    loadPrice({ propertyId, arrival, departure }, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setQuote(data);
      }).catch((error) => { if (!controller.signal.aborted) setQuote({ error: true, code: error.code }); });
    return () => controller.abort();
  }, [visible, propertyId, arrival, departure]);
  return <div ref={ref} className="min-h-[74px] border-t border-slate-100 pt-3" aria-live="polite">
    {!quote ? <p className="text-sm text-slate-500">Aufenthaltspreis wird berechnet …</p> : quote.error ? <p className="text-sm text-slate-600">Preis für diesen Aufenthalt bitte anfragen.</p> : <>
      <p className="text-xl font-semibold tabular-nums text-slate-950">{euro.format(quote.total)} <span className="text-xs font-normal text-slate-500">für {quote.nights} Nächte</span></p>
      <p className="mt-1 text-xs text-slate-500">inkl. hinterlegter Nebenkosten · Ø {euro.format(quote.subtotal / quote.nights)} / Nacht ohne Nebenkosten</p>
      {quote.discountAmount > 0 && <p className="mt-1 text-xs font-medium text-emerald-700">{quote.kuschelwochen ? "Kuschelwochen" : "Last-Minute"} bereits berücksichtigt</p>}
    </>}
  </div>;
}
