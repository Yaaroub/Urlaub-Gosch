"use client";

import { useEffect, useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

const dateOnly = (d) => {
  const x = new Date(d);
  return new Date(x.getFullYear(), x.getMonth(), x.getDate());
};

const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export default function BookingCalendar({
  propertyId,
  bookings: bookingsProp,
  selectable = false,
  range,
  onSelectRange,
  numberOfMonths = 1,
  compact = false,
}) {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    if (!propertyId || bookingsProp) return;

    let cancelled = false;

    async function loadBookings() {
      try {
        const res = await fetch(`/api/bookings?propertyId=${propertyId}`, {
          cache: "no-store",
        });

        const data = res.ok ? await res.json() : [];

        if (!cancelled) {
          setBookings(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!cancelled) setBookings([]);
      }
    }

    loadBookings();

    return () => {
      cancelled = true;
    };
  }, [propertyId, bookingsProp]);

  const source = bookingsProp ?? bookings;

  const bookedRanges = useMemo(() => {
    return source
      .filter((b) => b.startDate && b.endDate)
      .map((b) => ({
        from: dateOnly(b.startDate),
        to: addDays(dateOnly(b.endDate), -1),
      }));
  }, [source]);

  const checkoutDays = useMemo(() => {
    return source
      .filter((b) => b.endDate)
      .map((b) => dateOnly(b.endDate));
  }, [source]);

  const modifiers = {
    booked: bookedRanges,
    checkout: checkoutDays,
  };

  const modifiersClassNames = {
    booked:
      "[&>button]:bg-red-500 [&>button]:text-white [&>button]:font-semibold [&>button]:ring-1 [&>button]:ring-red-500",
    checkout:
      "[&>button]:bg-pink-100 [&>button]:text-pink-700 [&>button]:font-semibold [&>button]:ring-1 [&>button]:ring-pink-300",
  };

  const disabled = selectable ? bookedRanges : undefined;

  return (
    <div className="w-full overflow-hidden">
      <DayPicker
        mode="range"
        showOutsideDays
        numberOfMonths={numberOfMonths}
        modifiers={modifiers}
        modifiersClassNames={modifiersClassNames}
        disabled={disabled}
        selected={selectable ? range : undefined}
        onSelect={selectable ? onSelectRange : undefined}
        classNames={{
          root: "relative m-0 w-full",
          months: "flex w-full justify-center",
          month: "w-full max-w-[300px]",
          month_caption: "mb-4 flex justify-center pr-20",
          caption_label: "text-sm font-bold text-slate-900",

          nav: "absolute right-0 top-0 flex items-center gap-1",
          button_previous:
            "flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900",
          button_next:
            "flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900",

          weekdays: "grid grid-cols-7 gap-1",
          weekday:
            "flex h-7 items-center justify-center text-[10px] font-semibold text-slate-500",

          week: "mt-1 grid grid-cols-7 gap-1",
          day: "flex h-8 items-center justify-center p-0",
          day_button:
            "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950",

          outside: "[&>button]:text-slate-300",
          today:
            "[&>button]:bg-slate-100 [&>button]:font-bold [&>button]:text-slate-500",

          selected:
            "[&>button]:bg-slate-900 [&>button]:text-white",
          range_start:
            "[&>button]:bg-slate-900 [&>button]:text-white",
          range_middle:
            "[&>button]:bg-slate-100 [&>button]:text-slate-900",
          range_end:
            "[&>button]:bg-slate-900 [&>button]:text-white",

          disabled:
            "cursor-not-allowed [&>button]:cursor-not-allowed",
        }}
      />

      {!compact && (
        <div className="mt-5 flex flex-wrap items-center gap-5 border-t border-slate-100 pt-4 text-xs font-medium text-slate-600">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
            <span>Belegt</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-pink-300" />
            <span>Checkout</span>
          </div>
        </div>
      )}
    </div>
  );
}