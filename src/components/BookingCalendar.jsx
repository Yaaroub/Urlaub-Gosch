"use client";

import { useEffect, useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import { de } from "react-day-picker/locale";
import "react-day-picker/style.css";
import { getCalendarBoundaries } from "@/lib/calendar-boundaries";

const dateOnly = (d) => {
  const x = new Date(d);
  return new Date(x.getFullYear(), x.getMonth(), x.getDate());
};

const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

const WEEKDAY_LABELS = ["So.", "Mo.", "Di.", "Mi.", "Do.", "Fr.", "Sa."];
const EMPTY_BOOKINGS = [];

export default function BookingCalendar({
  propertyId,
  bookings: bookingsProp,
  selectable = false,
  range,
  onSelectRange,
  numberOfMonths = 1,
  compact = false,
}) {
  const [calendar, setCalendar] = useState(null);

  useEffect(() => {
    if (!propertyId || bookingsProp) return;

    let cancelled = false;

    async function loadBookings() {
      try {
        const res = await fetch(`/api/bookings?propertyId=${propertyId}`, {
          cache: "no-store",
        });

        if (!res.ok) throw new Error("Calendar unavailable");
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error("Invalid calendar data");

        if (!cancelled) {
          setCalendar({ propertyId, bookings: data });
        }
      } catch {
        if (!cancelled) {
          setCalendar({ propertyId, unavailable: true });
        }
      }
    }

    loadBookings();

    return () => {
      cancelled = true;
    };
  }, [propertyId, bookingsProp]);

  const loadedCalendar = calendar?.propertyId === propertyId ? calendar : null;
  const source = bookingsProp ?? loadedCalendar?.bookings ?? EMPTY_BOOKINGS;

  const bookedRanges = useMemo(() => {
    return source
      .filter((booking) => booking.startDate && booking.endDate)
      .map((booking) => ({
        from: dateOnly(booking.startDate),
        to: addDays(dateOnly(booking.endDate), -1),
      }));
  }, [source]);

  const { changeoverDays } = useMemo(
    () => getCalendarBoundaries(source),
    [source]
  );

  const modifiers = useMemo(
    () => ({
      booked: (day) =>
        bookedRanges.some(({ from, to }) => day >= from && day <= to) &&
        !changeoverDays.some((boundary) => boundary.getTime() === day.getTime()),
      changeover: changeoverDays,
    }),
    [bookedRanges, changeoverDays]
  );

  const modifiersClassNames = {
    booked:
      "[&>button]:bg-red-500 [&>button]:text-white [&>button]:font-semibold [&>button]:ring-1 [&>button]:ring-red-500",

    changeover:
      "[&>button]:bg-pink-100 [&>button]:text-pink-700 [&>button]:font-semibold [&>button]:ring-1 [&>button]:ring-pink-300",
  };

  const today = useMemo(() => dateOnly(new Date()), []);
  const startMonth = useMemo(() => new Date(today.getFullYear(), today.getMonth(), 1), [today]);
  // Past days are never selectable; past months are not shown at all.
  const disabled = selectable ? [{ before: today }, ...bookedRanges] : undefined;

  if (!bookingsProp && propertyId && !loadedCalendar) {
    return <p role="status" className="text-sm text-slate-600">Belegung wird geladen …</p>;
  }
  if (!bookingsProp && loadedCalendar?.unavailable) {
    return <p role="status" className="text-sm text-slate-600">Die Belegung kann gerade nicht angezeigt werden.</p>;
  }

  return (
    <div className="w-full overflow-hidden">
      <DayPicker
        mode="range"
        locale={de}
        weekStartsOn={1}
        showOutsideDays
        numberOfMonths={numberOfMonths}
        startMonth={startMonth}
        defaultMonth={startMonth}
        modifiers={modifiers}
        modifiersClassNames={modifiersClassNames}
        disabled={disabled}
        selected={selectable ? range : undefined}
        onSelect={selectable ? onSelectRange : undefined}
        formatters={{
          formatWeekdayName: (date) => WEEKDAY_LABELS[date.getDay()],
        }}
        labels={{ labelPrevious: () => "Vorheriger Monat", labelNext: () => "Nächster Monat" }}
        classNames={{
          root: "relative m-0 w-full",

          months: "flex w-full justify-center",

          month: "w-full max-w-[300px]",

          month_caption: "mb-4 flex justify-center pr-20",

          caption_label:
            "text-sm font-bold capitalize text-slate-900",

          nav: "absolute right-0 top-0 flex items-center gap-1",

          button_previous:
            "flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 aria-disabled:cursor-default aria-disabled:opacity-25",

          button_next:
            "flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 aria-disabled:cursor-default aria-disabled:opacity-25",

          weekdays: "grid grid-cols-7 gap-1",

          weekday:
            "flex h-7 items-center justify-center text-[10px] font-semibold text-slate-500",

          week: "mt-1 grid grid-cols-7 gap-1",

          day: "flex h-8 items-center justify-center p-0",

          day_button:
            "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",

          outside:
            "[&>button]:text-slate-300",

          today:
            "[&>button]:bg-slate-100 [&>button]:font-bold [&>button]:text-slate-700",

          selected:
            "[&>button]:bg-slate-900 [&>button]:text-white",

          range_start:
            "[&>button]:bg-slate-900 [&>button]:text-white",

          range_middle:
            "[&>button]:bg-slate-100 [&>button]:text-slate-900",

          range_end:
            "[&>button]:bg-slate-900 [&>button]:text-white",

          disabled:
            "cursor-not-allowed opacity-90 [&>button]:cursor-not-allowed",
        }}
      />

      {!compact && (
        <div className="mt-5 flex flex-wrap items-center gap-5 border-t border-slate-100 pt-4 text-xs font-medium text-slate-600">
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full bg-red-500"
              aria-hidden="true"
            />
            <span>Belegt</span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full bg-pink-300"
              aria-hidden="true"
            />
            <span>An-/Abreise</span>
          </div>
        </div>
      )}
    </div>
  );
}
