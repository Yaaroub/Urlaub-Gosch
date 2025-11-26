"use client";
import { useEffect, useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

/** Helpers */
const dateOnly = (d) => {
  const x = new Date(d);
  return new Date(x.getFullYear(), x.getMonth(), x.getDate());
};
const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

/**
 * BookingCalendar
 * - Zeigt belegte Zeiträume (rot markiert).
 * - Optional: auswählbar als Range (für Admin oder Preisrechner).
 *
 * Props:
 *  - propertyId?: number           // lädt selbst /api/bookings
 *  - bookings?: {startDate,endDate}[] // alternativ Buchungen direkt übergeben
 *  - selectable?: boolean           // default false (nur anzeigen)
 *  - range?: { from?:Date, to?:Date } // kontrollierte Auswahl (bei selectable)
 *  - onSelectRange?: (range)=>void  // Callback bei Auswahl (bei selectable)
 *  - numberOfMonths?: number        // default 2
 */
export default function BookingCalendar({
  propertyId,
  bookings: bookingsProp,
  selectable = false,
  range,
  onSelectRange,
  numberOfMonths = 2,
}) {
  const [bookings, setBookings] = useState([]);

  // Laden, wenn propertyId übergeben & kein bookingsProp genutzt wird
  useEffect(() => {
    if (!propertyId || bookingsProp) return;
    (async () => {
      const r = await fetch(`/api/bookings?propertyId=${propertyId}`, { cache: "no-store" });
      const data = r.ok ? await r.json() : [];
      setBookings(Array.isArray(data) ? data : []);
    })();
  }, [propertyId, bookingsProp]);

  // Quelle: Prop hat Vorrang, sonst State
  const source = bookingsProp ?? bookings;

  // Gebuchte Ranges (Ende exklusiv -> in DayPicker inklusiv bis Vortag)
  const bookedRanges = useMemo(
    () =>
      source.map((b) => {
        const from = dateOnly(b.startDate);
        const to = addDays(dateOnly(b.endDate), -1);
        return { from, to };
      }),
    [source]
  );

  const modifiers = { booked: bookedRanges };
  const modifiersStyles = {
    booked: { backgroundColor: "#ef4444", color: "#fff", borderRadius: 6 },
  };

  // Bei auswählbarem Kalender: gebuchte Tage deaktivieren
  const disabled = selectable ? bookedRanges : undefined;

  return (
    <DayPicker
      mode="range"
      showOutsideDays
      numberOfMonths={numberOfMonths}
      modifiers={modifiers}
      modifiersStyles={modifiersStyles}
      disabled={disabled}
      selected={selectable ? range : undefined}
      onSelect={selectable ? onSelectRange : undefined}
    />
  );
}
