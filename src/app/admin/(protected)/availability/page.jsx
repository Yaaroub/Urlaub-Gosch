"use client";

import { useEffect, useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import { de } from "react-day-picker/locale";
import "react-day-picker/style.css";

function toDateOnly(date) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function emptyRange() {
  return { from: undefined, to: undefined };
}

export default function AvailabilityPage() {
  const [properties, setProperties] = useState([]);
  const [propertyId, setPropertyId] = useState("");
  const [bookings, setBookings] = useState([]);
  const [range, setRange] = useState(emptyRange());

  const [guestName, setGuestName] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [pendingDelete, setPendingDelete] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);

  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editGuestName, setEditGuestName] = useState("");

  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [canEdit, setCanEdit] = useState(false);

  function showError(message) {
    setErrorMsg(message);
    setSuccessMsg("");
  }

  function showSuccess(message) {
    setSuccessMsg(message);
    setErrorMsg("");
  }

  // ============================================================
  // propertyId aus URL übernehmen
  // ============================================================

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const propertyIdFromUrl = searchParams.get("propertyId");

    if (propertyIdFromUrl) {
      setPropertyId(propertyIdFromUrl);
    }
  }, []);

  // ============================================================
  // Objekte laden
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    async function loadProperties() {
      try {
        setIsLoadingProperties(true);

        const res = await fetch("/api/admin/properties", {
          cache: "no-store",
        });

        if (res.status === 401) {
          window.location.href = "/admin/login";
          return;
        }

        if (res.status === 403) {
          if (!cancelled) {
            setBookings([]);
            setCanEdit(false);
            showError(
              "Dir fehlt die Berechtigung, Verfügbarkeiten anzusehen."
            );
          }

          return;
        }

        const data = await res.json().catch(() => []);

        if (!res.ok) {
          throw new Error(
            data?.error || "Objekte konnten nicht geladen werden."
          );
        }

        if (!cancelled) {
          const sortedProperties = Array.isArray(data)
            ? [...data].sort((a, b) =>
                String(a.title || "").localeCompare(
                  String(b.title || ""),
                  "de",
                  {
                    sensitivity: "base",
                  }
                )
              )
            : [];

          setProperties(sortedProperties);
        }
      } catch {
        if (!cancelled) {
          setProperties([]);
          showError("Objekte konnten nicht geladen werden.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingProperties(false);
        }
      }
    }

    loadProperties();

    return () => {
      cancelled = true;
    };
  }, []);

  // ============================================================
  // Buchungen des ausgewählten Objekts laden
  // ============================================================

  useEffect(() => {
    if (!propertyId) {
      setBookings([]);
      setRange(emptyRange());
      setCanEdit(false);
      return;
    }

    let cancelled = false;

    async function loadBookings() {
      try {
        setIsLoadingBookings(true);

        const res = await fetch(
          `/api/admin/booking?propertyId=${encodeURIComponent(propertyId)}`,
          {
            cache: "no-store",
          }
        );

        if (res.status === 401) {
          window.location.href = "/admin";
          return;
        }

        const data = await res.json().catch(() => []);

        if (!res.ok) {
          throw new Error(
            data?.error || "Buchungen konnten nicht geladen werden."
          );
        }

        if (!cancelled) {
          setBookings(Array.isArray(data) ? data : []);
          setCanEdit(res.headers.get("x-admin-can-edit") === "1");
        }
      } catch {
        if (!cancelled) {
          setBookings([]);
          showError("Buchungen konnten nicht geladen werden.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingBookings(false);
        }
      }
    }

    loadBookings();

    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  // ============================================================
  // Objekt wechseln
  // ============================================================

  function handlePropertyChange(event) {
    const nextPropertyId = event.target.value;

    setPropertyId(nextPropertyId);
    setRange(emptyRange());
    setGuestName("");
    setEditingBooking(null);
    setPendingDelete(null);
    setErrorMsg("");
    setSuccessMsg("");

    const url = new URL(window.location.href);

    if (nextPropertyId) {
      url.searchParams.set("propertyId", nextPropertyId);
    } else {
      url.searchParams.delete("propertyId");
    }

    window.history.replaceState(
      {},
      "",
      `${url.pathname}${url.search}${url.hash}`
    );
  }

  const selectedProperty = useMemo(() => {
    return properties.find(
      (property) => property.id === Number(propertyId)
    );
  }, [properties, propertyId]);

  // ============================================================
  // Überschneidung prüfen
  //
  // Buchungen werden als halb-offenes Intervall behandelt:
  //
  // [Check-in, Check-out)
  //
  // Beispiel:
  //
  // 23.10. -> 25.10.
  //
  // Eine neue Buchung darf am 25.10. beginnen.
  //
  // Ebenso darf eine Buchung am 23.10. enden.
  // ============================================================

  function hasBookingConflict(
    startDate,
    endDate,
    ignoreBookingId = null
  ) {
    return bookings.some((booking) => {
      if (
        !booking.startDate ||
        !booking.endDate ||
        booking.id === ignoreBookingId
      ) {
        return false;
      }

      const existingStart = toDateOnly(booking.startDate);
      const existingEnd = toDateOnly(booking.endDate);

      return (
        existingStart < endDate &&
        existingEnd > startDate
      );
    });
  }

  // ============================================================
  // ROTE TAGE
  //
  // Nur die tatsächlichen Aufenthaltstage zwischen
  // Check-in und Check-out.
  //
  // Beispiel:
  //
  // 23.10. Check-in     -> rosa
  // 24.10. Belegt       -> rot
  // 25.10. Check-out    -> rosa
  //
  // 26.10.              -> frei
  // ============================================================

  const bookedRanges = useMemo(() => {
    return bookings.flatMap((booking) => {
      if (!booking.startDate || !booking.endDate) {
        return [];
      }

      const checkin = toDateOnly(booking.startDate);
      const checkout = toDateOnly(booking.endDate);

      const firstBookedDay = addDays(checkin, 1);
      const lastBookedDay = addDays(checkout, -1);

      // Beispiel:
      // 23.10. Check-in
      // 24.10. Check-out
      //
      // Es gibt keinen roten Tag dazwischen.
      if (firstBookedDay > lastBookedDay) {
        return [];
      }

      return [
        {
          from: firstBookedDay,
          to: lastBookedDay,
        },
      ];
    });
  }, [bookings]);

  // ============================================================
  // ROSA TAGE
  //
  // Check-in UND Check-out.
  //
  // Diese Tage bleiben auswählbar / buchbar.
  //
  // Falls ein Tag gleichzeitig Checkout einer Buchung
  // und Check-in der nächsten Buchung ist, bleibt er rosa.
  // ============================================================

  const changeoverDays = useMemo(() => {
    const days = new Map();

    for (const booking of bookings) {
      if (booking.startDate) {
        const checkin = toDateOnly(booking.startDate);

        days.set(
          formatDate(checkin),
          checkin
        );
      }

      if (booking.endDate) {
        const checkout = toDateOnly(booking.endDate);

        days.set(
          formatDate(checkout),
          checkout
        );
      }
    }

    return [...days.values()];
  }, [bookings]);

  const modifiers = useMemo(
    () => ({
      booked: bookedRanges,
      changeover: changeoverDays,
    }),
    [bookedRanges, changeoverDays]
  );

  const modifiersClassNames = {
    booked:
      "[&>button]:bg-rose-500 " +
      "[&>button]:text-white " +
      "[&>button]:font-semibold " +
      "[&>button]:ring-1 " +
      "[&>button]:ring-rose-500",

    changeover:
      "relative " +
      "[&>button]:bg-pink-50 " +
      "[&>button]:text-pink-700 " +
      "[&>button]:font-semibold " +
      "[&>button]:ring-2 " +
      "[&>button]:ring-pink-300 " +
      "after:absolute " +
      "after:bottom-1 " +
      "after:left-1/2 " +
      "after:h-1 " +
      "after:w-1 " +
      "after:-translate-x-1/2 " +
      "after:rounded-full " +
      "after:bg-pink-400",
  };

  // ============================================================
  // Buchungen neu laden
  // ============================================================

  async function reloadBookings() {
    if (!propertyId) return;

    const res = await fetch(
      `/api/admin/booking?propertyId=${encodeURIComponent(propertyId)}`,
      {
        cache: "no-store",
      }
    );

    if (res.status === 401) {
      window.location.href = "/admin/login";
      return;
    }

    if (res.status === 403) {
      setBookings([]);
      setCanEdit(false);

      throw new Error(
        "Dir fehlt die Berechtigung, Verfügbarkeiten anzusehen."
      );
    }

    const data = await res.json().catch(() => []);

    if (!res.ok) {
      throw new Error(
        data?.error ||
          "Buchungen konnten nicht neu geladen werden."
      );
    }

    setBookings(Array.isArray(data) ? data : []);
    setCanEdit(
      res.headers.get("x-admin-can-edit") === "1"
    );
  }

  // ============================================================
  // Neue Buchung / Block speichern
  // ============================================================

  async function add() {
    if (!canEdit) {
      showError(
        "Dir fehlt die Berechtigung zum Bearbeiten von Verfügbarkeiten."
      );

      return;
    }

    if (
      !range?.from ||
      !range?.to ||
      !propertyId ||
      isSaving
    ) {
      return;
    }

    const arrivalDate = toDateOnly(range.from);
    const departureDate = toDateOnly(range.to);

    if (arrivalDate >= departureDate) {
      showError(
        "Der Check-out muss nach dem Check-in liegen."
      );

      return;
    }

    // Frontend-Sicherheitsprüfung.
    //
    // Gleiche Grenztage sind erlaubt:
    //
    // bestehender Checkout = neuer Check-in
    //
    // oder
    //
    // neuer Checkout = bestehender Check-in

    if (
      hasBookingConflict(
        arrivalDate,
        departureDate
      )
    ) {
      showError(
        "Der gewählte Zeitraum überschneidet sich mit einer bestehenden Buchung. Ein Check-in am Check-out-Tag ist erlaubt."
      );

      return;
    }

    // WICHTIG:
    //
    // KEIN addDays(range.to, 1) mehr!
    //
    // Wenn der Benutzer den 25.10. als Checkout auswählt,
    // wird tatsächlich der 25.10. gespeichert.

    const arrival = formatDate(arrivalDate);
    const departure = formatDate(departureDate);

    setErrorMsg("");
    setSuccessMsg("");
    setIsSaving(true);

    try {
      const res = await fetch(
        "/api/admin/booking",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            propertyId: Number(propertyId),
            startDate: arrival,
            endDate: departure,
            guestName:
              guestName.trim() || "(Admin)",
          }),
        }
      );

      const data = await res
        .json()
        .catch(() => null);

      if (res.status === 401) {
        window.location.href =
          "/admin/login";

        return;
      }

      if (res.status === 403) {
        setCanEdit(false);

        showError(
          data?.error ||
            "Dir fehlt die Berechtigung zum Bearbeiten von Verfügbarkeiten."
        );

        return;
      }

      if (!res.ok) {
        showError(
          data?.error ||
            "Fehler beim Speichern des Zeitraums."
        );

        return;
      }

      await reloadBookings();

      setRange(emptyRange());
      setGuestName("");

      showSuccess(
        "Zeitraum wurde gespeichert."
      );
    } catch {
      showError(
        "Zeitraum konnte nicht gespeichert werden."
      );
    } finally {
      setIsSaving(false);
    }
  }

  // ============================================================
  // Bearbeiten öffnen
  // ============================================================

  function openEditDialog(booking) {
    if (!canEdit) {
      showError(
        "Dir fehlt die Berechtigung zum Bearbeiten von Verfügbarkeiten."
      );

      return;
    }

    setEditingBooking(booking);

    setEditStartDate(
      formatDate(booking.startDate)
    );

    setEditEndDate(
      formatDate(booking.endDate)
    );

    setEditGuestName(
      booking.guestName || ""
    );
  }

  // ============================================================
  // Buchung aktualisieren
  // ============================================================

  async function updateBooking() {
    if (!canEdit) {
      showError(
        "Dir fehlt die Berechtigung zum Bearbeiten von Verfügbarkeiten."
      );

      return;
    }

    if (
      !editingBooking ||
      !editStartDate ||
      !editEndDate ||
      isUpdating
    ) {
      return;
    }

    const nextStartDate =
      toDateOnly(editStartDate);

    const nextEndDate =
      toDateOnly(editEndDate);

    if (
      nextStartDate >= nextEndDate
    ) {
      showError(
        "Der Check-out muss nach dem Check-in liegen."
      );

      return;
    }

    if (
      hasBookingConflict(
        nextStartDate,
        nextEndDate,
        editingBooking.id
      )
    ) {
      showError(
        "Der gewählte Zeitraum überschneidet sich mit einer bestehenden Buchung. Ein Check-in am Check-out-Tag ist erlaubt."
      );

      return;
    }

    setIsUpdating(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch(
        `/api/admin/booking/${editingBooking.id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            startDate: editStartDate,
            endDate: editEndDate,
            guestName:
              editGuestName.trim() ||
              "(Admin)",
          }),
        }
      );

      const data = await res
        .json()
        .catch(() => null);

      if (res.status === 401) {
        window.location.href =
          "/admin/login";

        return;
      }

      if (res.status === 403) {
        setCanEdit(false);
        setEditingBooking(null);

        showError(
          data?.error ||
            "Dir fehlt die Berechtigung zum Bearbeiten von Verfügbarkeiten."
        );

        return;
      }

      if (!res.ok) {
        showError(
          data?.error ||
            "Der Zeitraum konnte nicht aktualisiert werden."
        );

        return;
      }

      await reloadBookings();

      setEditingBooking(null);

      showSuccess(
        "Zeitraum wurde aktualisiert."
      );
    } catch {
      showError(
        "Der Zeitraum konnte nicht aktualisiert werden."
      );
    } finally {
      setIsUpdating(false);
    }
  }

  // ============================================================
  // Löschen
  // ============================================================

  async function confirmDelete() {
    if (!canEdit) {
      setPendingDelete(null);

      showError(
        "Dir fehlt die Berechtigung zum Bearbeiten von Verfügbarkeiten."
      );

      return;
    }

    if (!pendingDelete) return;

    const id = pendingDelete.id;

    try {
      const res = await fetch(
        `/api/admin/booking/${id}`,
        {
          method: "DELETE",
        }
      );

      if (res.status === 401) {
        window.location.href =
          "/admin/login";

        return;
      }

      if (res.status === 403) {
        setCanEdit(false);

        showError(
          "Dir fehlt die Berechtigung zum Bearbeiten von Verfügbarkeiten."
        );

        setPendingDelete(null);

        return;
      }

      if (!res.ok) {
        showError(
          "Der Eintrag konnte nicht gelöscht werden."
        );

        setPendingDelete(null);

        return;
      }

      setBookings((prev) =>
        prev.filter(
          (booking) =>
            booking.id !== id
        )
      );

      showSuccess(
        "Buchung / Block wurde gelöscht."
      );

      setPendingDelete(null);
    } catch {
      showError(
        "Der Eintrag konnte nicht gelöscht werden."
      );

      setPendingDelete(null);
    }
  }

  // ============================================================
  // Oberfläche
  // ============================================================

  return (
    <section className="relative mx-auto mt-24 max-w-6xl px-4 py-8 md:py-10">
      {/* Meldungen */}

      <div className="mb-4 space-y-2">
        {errorMsg && (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            <span>{errorMsg}</span>

            <button
              type="button"
              className="text-xs font-medium text-rose-500 hover:text-rose-700"
              onClick={() =>
                setErrorMsg("")
              }
            >
              Schließen
            </button>
          </div>
        )}

        {successMsg && (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            <span>{successMsg}</span>

            <button
              type="button"
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
              onClick={() =>
                setSuccessMsg("")
              }
            >
              Schließen
            </button>
          </div>
        )}
      </div>

      {/* Kopfbereich */}

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
            Admin · Verfügbarkeiten
          </p>

          <h1 className="text-2xl font-semibold text-slate-900">
            Buchungskalender verwalten
          </h1>

          <p className="mt-1 text-sm text-slate-600">
            Zeiträume blockieren,
            Bezeichnungen hinterlegen und
            bestehende Einträge bearbeiten.
          </p>

          {propertyId &&
            !isLoadingBookings &&
            !canEdit && (
              <span className="mt-3 inline-flex rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
                Nur Leserechte
              </span>
            )}
        </div>

        {/* Objekt Auswahl */}

        <div className="w-full max-w-xs">
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            Objekt wählen
          </label>

          <select
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/50 disabled:opacity-60"
            value={propertyId}
            onChange={
              handlePropertyChange
            }
            disabled={
              isLoadingProperties
            }
          >
            <option value="">
              {isLoadingProperties
                ? "Objekte werden geladen..."
                : "— Objekt wählen —"}
            </option>

            {properties.map(
              (property) => (
                <option
                  key={property.id}
                  value={property.id}
                >
                  {property.title}
                </option>
              )
            )}
          </select>
        </div>
      </div>

      {propertyId ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          {/* Kalender */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Kalender
                  {selectedProperty?.title
                    ? ` · ${selectedProperty.title}`
                    : ""}
                </h2>

                {/* Legende */}

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {/* Rot */}

                  <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />

                    Belegt
                  </span>

                  {/* Rosa */}

                  <span className="inline-flex items-center gap-1.5 rounded-full bg-pink-50 px-2.5 py-1 text-xs font-semibold text-pink-700 ring-1 ring-pink-200">
                    <span className="h-2.5 w-2.5 rounded-full border-2 border-pink-300 bg-white" />

                    Check-in / Check-out
                  </span>

                  {/* Auswahl */}

                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-900" />

                    Auswahl
                  </span>
                </div>
              </div>

              {isLoadingBookings && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                  Lädt...
                </span>
              )}
            </div>

            {/* DayPicker */}

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              <DayPicker
                locale={de}
                weekStartsOn={1}
                formatters={{
                  formatWeekdayName:
                    (date) =>
                      [
                        "So.",
                        "Mo.",
                        "Di.",
                        "Mi.",
                        "Do.",
                        "Fr.",
                        "Sa.",
                      ][
                        date.getDay()
                      ],
                }}
                mode="range"
                selected={range}
                onSelect={(
                  selectedRange
                ) => {
                  if (!canEdit) {
                    return;
                  }

                  setRange(
                    selectedRange ??
                      emptyRange()
                  );
                }}
                numberOfMonths={2}
                showOutsideDays
                modifiers={
                  modifiers
                }
                modifiersClassNames={
                  modifiersClassNames
                }

                // =================================================
                // Nur ROTE Aufenthaltstage werden gesperrt.
                //
                // Check-in / Check-out bleiben anklickbar.
                // =================================================

                disabled={
                  canEdit
                    ? bookedRanges
                    : true
                }

                // Verhindert, dass ein neuer Bereich
                // über einen gesperrten roten Tag gezogen wird.

                excludeDisabled
                classNames={{
                  root:
                    "relative m-0 w-full",

                  months:
                    "flex w-max min-w-full flex-col gap-8 md:flex-row md:justify-center md:gap-8",

                  month:
                    "w-[300px]",

                  month_caption:
                    "mb-4 flex justify-center pr-16",

                  caption_label:
                    "text-sm font-bold text-slate-900",

                  nav:
                    "absolute right-0 top-0 flex items-center gap-1",

                  button_previous:
                    "flex h-8 w-8 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-200/70 hover:text-slate-900",

                  button_next:
                    "flex h-8 w-8 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-200/70 hover:text-slate-900",

                  weekdays:
                    "grid grid-cols-7 gap-1",

                  weekday:
                    "flex h-7 items-center justify-center text-[11px] font-semibold text-slate-500",

                  week:
                    "mt-1 grid grid-cols-7 gap-1",

                  day:
                    "flex h-9 items-center justify-center p-0",

                  day_button:
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950",

                  outside:
                    "[&>button]:text-slate-300",

                  today:
                    "[&>button]:font-bold",

                  selected:
                    "[&>button]:bg-slate-900 [&>button]:text-white",

                  range_start:
                    "[&>button]:bg-slate-900 [&>button]:text-white",

                  range_middle:
                    "[&>button]:bg-slate-200 [&>button]:text-slate-900",

                  range_end:
                    "[&>button]:bg-slate-900 [&>button]:text-white",

                  disabled:
                    "cursor-not-allowed [&>button]:cursor-not-allowed",
                }}
              />
            </div>

            {/* Gast */}

            <div className="mt-4 grid gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Gast / Bezeichnung
                </label>

                <input
                  value={guestName}
                  onChange={(event) =>
                    setGuestName(
                      event.target.value
                    )
                  }
                  placeholder="z. B. Familie Müller"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/50"
                />
              </div>
            </div>

            {/* Speichern */}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={add}
                disabled={
                  !canEdit ||
                  !range?.from ||
                  !range?.to ||
                  isSaving
                }
                className="inline-flex items-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/70 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSaving
                  ? "Speichert..."
                  : "Zeitraum speichern"}
              </button>

              <p className="max-w-sm text-xs leading-5 text-slate-500">
                Check-in und Check-out
                sind rosa und buchbar.
                Nur die Tage dazwischen
                sind belegt.
              </p>
            </div>
          </div>

          {/* Buchungsliste */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900">
                Buchungen / Blöcke
              </h3>

              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                {bookings.length}{" "}
                Eintrag
                {bookings.length === 1
                  ? ""
                  : "e"}
              </span>
            </div>

            {bookings.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-500">
                Noch keine Einträge.
              </p>
            ) : (
              <ul className="space-y-2">
                {bookings.map(
                  (booking) => (
                    <li
                      key={booking.id}
                      className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {formatDate(
                              booking.startDate
                            )}{" "}
                            →{" "}
                            {formatDate(
                              booking.endDate
                            )}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-500">
                            Check-in /
                            Check-out rosa
                            · Tage
                            dazwischen
                            belegt
                          </p>
                        </div>

                        {canEdit && (
                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openEditDialog(
                                  booking
                                )
                              }
                              className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                            >
                              Ändern
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setPendingDelete(
                                  booking
                                )
                              }
                              className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
                            >
                              Löschen
                            </button>
                          </div>
                        )}
                      </div>

                      {booking.guestName && (
                        <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                          <p>
                            <span className="font-semibold text-slate-700">
                              Bezeichnung:
                            </span>{" "}
                            {
                              booking.guestName
                            }
                          </p>
                        </div>
                      )}
                    </li>
                  )
                )}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <p className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-slate-500">
          Bitte zuerst oben ein
          Objekt auswählen.
        </p>
      )}

      {/* ===================================================== */}
      {/* Bearbeiten Dialog */}
      {/* ===================================================== */}

      {editingBooking &&
        canEdit && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-slate-900">
                  Zeitraum bearbeiten
                </h4>

                <p className="mt-1 text-xs text-slate-500">
                  Startdatum =
                  Check-in,
                  Enddatum =
                  Check-out.
                  Beide
                  Wechsel-Tage
                  bleiben buchbar.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {/* Check-in */}

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Check-in
                  </label>

                  <input
                    type="date"
                    value={
                      editStartDate
                    }
                    onChange={(
                      event
                    ) =>
                      setEditStartDate(
                        event.target
                          .value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/50"
                  />
                </div>

                {/* Check-out */}

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Check-out
                  </label>

                  <input
                    type="date"
                    value={
                      editEndDate
                    }
                    onChange={(
                      event
                    ) =>
                      setEditEndDate(
                        event.target
                          .value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/50"
                  />
                </div>

                {/* Gast */}

                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Gast /
                    Bezeichnung
                  </label>

                  <input
                    value={
                      editGuestName
                    }
                    onChange={(
                      event
                    ) =>
                      setEditGuestName(
                        event.target
                          .value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/50"
                  />
                </div>
              </div>

              {/* Dialog Buttons */}

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setEditingBooking(
                      null
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Abbrechen
                </button>

                <button
                  type="button"
                  onClick={
                    updateBooking
                  }
                  disabled={
                    isUpdating
                  }
                  className="rounded-xl bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isUpdating
                    ? "Speichert..."
                    : "Speichern"}
                </button>
              </div>
            </div>
          </div>
        )}

      {/* ===================================================== */}
      {/* Löschen Dialog */}
      {/* ===================================================== */}

      {pendingDelete &&
        canEdit && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
              <h4 className="text-sm font-semibold text-slate-900">
                Buchung / Block
                löschen?
              </h4>

              <p className="mt-2 text-sm text-slate-600">
                Zeitraum:{" "}
                <span className="font-medium">
                  {formatDate(
                    pendingDelete.startDate
                  )}{" "}
                  →{" "}
                  {formatDate(
                    pendingDelete.endDate
                  )}
                </span>
              </p>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setPendingDelete(
                      null
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Abbrechen
                </button>

                <button
                  type="button"
                  onClick={
                    confirmDelete
                  }
                  className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500"
                >
                  Ja, löschen
                </button>
              </div>
            </div>
          </div>
        )}
    </section>
  );
}