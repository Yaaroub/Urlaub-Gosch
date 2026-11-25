"use client";

import { useEffect, useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import { de } from "react-day-picker/locale";
import "react-day-picker/style.css";

/**
 * Date selection for the booking request: only free days can be chosen.
 *
 * - Past months are not shown, past days are not selectable.
 * - Arrival: any free night from today on.
 * - Departure: any later day as long as every night in between is free.
 *   The arrival day of the next guest can be the departure day (changeover).
 * - Values are passed as "YYYY-MM-DD" (local calendar day).
 */

const WEEKDAY_LABELS = ["So.", "Mo.", "Di.", "Mi.", "Do.", "Fr.", "Sa."];
const HORIZON_DAYS = 540;
const DAY_MS = 24 * 60 * 60 * 1000;

const dateOnly = (value) => {
  const d = new Date(value);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};
const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
export const toDateKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fromDateKey = (key) => {
  const [y, m, d] = String(key || "").split("-").map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
};
const formatDay = (d) =>
  d ? `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}` : "";

export default function StayDatePicker({ propertyId, arrival, departure, onChange }) {
  const [state, setState] = useState({ propertyId: null, nights: null, error: false });

  useEffect(() => {
    if (!propertyId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/bookings?propertyId=${propertyId}`, { cache: "no-store" });
        if (!res.ok) throw new Error("unavailable");
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error("invalid");
        // Every occupied night as a day key (departure day itself stays free).
        const nights = new Set();
        for (const { startDate, endDate } of data) {
          if (!startDate || !endDate) continue;
          for (let d = dateOnly(startDate), end = dateOnly(endDate); d < end; d = addDays(d, 1)) nights.add(toDateKey(d));
        }
        if (!cancelled) setState({ propertyId, nights, error: false });
      } catch {
        if (!cancelled) setState({ propertyId, nights: null, error: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  const today = useMemo(() => dateOnly(new Date()), []);
  const lastDay = useMemo(() => addDays(today, HORIZON_DAYS), [today]);
  const startMonth = useMemo(() => new Date(today.getFullYear(), today.getMonth(), 1), [today]);
  const endMonth = useMemo(() => new Date(lastDay.getFullYear(), lastDay.getMonth(), 1), [lastDay]);

  const loaded = state.propertyId === propertyId ? state : null;
  const nights = loaded?.nights;
  const from = fromDateKey(arrival);
  const to = fromDateKey(departure);
  const choosingDeparture = Boolean(from && !to);

  const isBookedNight = (day) => Boolean(nights?.has(toDateKey(day)));
  const nightsFree = (start, end) => {
    for (let d = start; d < end; d = addDays(d, 1)) if (isBookedNight(d)) return false;
    return true;
  };

  // A day is clickable when it can be the next sensible choice.
  const isDisabled = (day) => {
    if (!nights) return true;
    if (day < today || day > lastDay) return true;
    if (choosingDeparture && day > from) return !nightsFree(from, day);
    return isBookedNight(day);
  };

  function handleDayClick(day, modifiers) {
    if (modifiers.disabled) return;
    if (choosingDeparture && day > from) {
      onChange({ arrival, departure: toDateKey(day) });
      return;
    }
    // New start (first click, a click before the arrival, or after a complete range).
    onChange({ arrival: toDateKey(day), departure: "" });
  }

  const modifiers = {
    booked: (day) => isBookedNight(day) && day >= today,
    stayStart: from ? [from] : [],
    stayEnd: to ? [to] : [],
    stayMiddle: (day) => Boolean(from && to && day > from && day < to),
  };
  const modifiersClassNames = {
    booked: "[&>button]:bg-red-100 [&>button]:text-red-400 [&>button]:line-through",
    stayStart: "[&>button]:!bg-slate-900 [&>button]:!text-white [&>button]:!no-underline",
    stayEnd: "[&>button]:!bg-slate-900 [&>button]:!text-white [&>button]:!no-underline",
    stayMiddle: "[&>button]:!bg-slate-100 [&>button]:!text-slate-900",
  };

  const nightsCount = from && to ? Math.round((to - from) / DAY_MS) : 0;

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1">
          <span className="text-xs text-slate-500">Anreise *</span>
          <div className={`flex min-h-11 items-center rounded-xl border px-3 text-sm ${from ? "border-slate-300 text-slate-900" : "border-slate-200 text-slate-400"}`}>
            {from ? formatDay(from) : "Bitte wählen"}
          </div>
        </div>
        <div className="grid gap-1">
          <span className="text-xs text-slate-500">Abreise *</span>
          <div className={`flex min-h-11 items-center rounded-xl border px-3 text-sm ${to ? "border-slate-300 text-slate-900" : "border-slate-200 text-slate-400"}`}>
            {to ? formatDay(to) : choosingDeparture ? "Abreisetag wählen" : "–"}
          </div>
        </div>
      </div>

      {loaded?.error ? (
        <p role="status" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">
          Die Belegung kann gerade nicht geladen werden. Bitte versuchen Sie es später erneut oder rufen Sie uns an.
        </p>
      ) : !nights ? (
        <p role="status" className="text-sm text-slate-600">Freie Tage werden geladen …</p>
      ) : (
        <div className="w-full overflow-hidden rounded-xl border border-slate-200 p-3">
          <DayPicker
            locale={de}
            weekStartsOn={1}
            startMonth={startMonth}
            endMonth={endMonth}
            defaultMonth={from || startMonth}
            disabled={isDisabled}
            onDayClick={handleDayClick}
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
            formatters={{ formatWeekdayName: (date) => WEEKDAY_LABELS[date.getDay()] }}
            labels={{ labelPrevious: () => "Vorheriger Monat", labelNext: () => "Nächster Monat" }}
            classNames={{
              root: "relative m-0 w-full",
              months: "flex w-full justify-center",
              month: "w-full max-w-[300px]",
              month_caption: "mb-3 flex justify-center pr-20",
              caption_label: "text-sm font-bold capitalize text-slate-900",
              nav: "absolute right-0 top-0 flex items-center gap-1",
              button_previous: "flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 aria-disabled:cursor-default aria-disabled:opacity-25",
              button_next: "flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 aria-disabled:cursor-default aria-disabled:opacity-25",
              weekdays: "grid grid-cols-7 gap-1",
              weekday: "flex h-7 items-center justify-center text-[10px] font-semibold text-slate-500",
              week: "mt-1 grid grid-cols-7 gap-1",
              day: "flex h-9 items-center justify-center p-0",
              day_button: "flex h-9 w-9 items-center justify-center rounded-full text-xs font-medium text-slate-700 transition hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
              outside: "invisible",
              today: "[&>button]:font-bold [&>button]:ring-1 [&>button]:ring-slate-300",
              disabled: "[&>button]:cursor-not-allowed [&>button]:text-slate-300 [&>button]:hover:bg-transparent",
            }}
          />
          <p className="mt-3 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-500">
            {choosingDeparture
              ? "Wählen Sie jetzt den Abreisetag. Nur Tage, bis zu denen durchgehend frei ist, sind wählbar."
              : nightsCount
                ? `${nightsCount} ${nightsCount === 1 ? "Nacht" : "Nächte"}. Zum Ändern einfach einen neuen Anreisetag wählen.`
                : "Wählen Sie zuerst den Anreisetag. Belegte Tage sind durchgestrichen."}
          </p>
        </div>
      )}
    </div>
  );
}
