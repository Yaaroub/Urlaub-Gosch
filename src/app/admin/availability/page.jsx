"use client";
import { useEffect, useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

function toDateOnly(d) {
  const x = new Date(d);
  return new Date(x.getFullYear(), x.getMonth(), x.getDate());
}

export default function AvailabilityPage() {
  const [properties, setProperties] = useState([]);
  const [propertyId, setPropertyId] = useState("");
  const [bookings, setBookings] = useState([]);
  const [range, setRange] = useState({ from: undefined, to: undefined });

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null); // Booking zum Löschen

  useEffect(() => {
    fetch("/api/admin/properties")
      .then((r) => r.json())
      .then(setProperties);
  }, []);

  useEffect(() => {
    if (!propertyId) {
      setBookings([]);
      return;
    }
    fetch(`/api/bookings?propertyId=${propertyId}`)
      .then((r) => r.json())
      .then(setBookings);
  }, [propertyId]);

  const bookedDays = useMemo(
    () =>
      bookings.flatMap((b) => {
        const days = [];
        const s = toDateOnly(b.startDate);
        const e = toDateOnly(b.endDate); // Ende exkl.

        for (let d = new Date(s); d < e; d.setDate(d.getDate() + 1)) {
          days.push(new Date(d));
        }
        return days;
      }),
    [bookings]
  );

  function showError(msg) {
    setErrorMsg(msg);
    setSuccessMsg("");
  }

  function showSuccess(msg) {
    setSuccessMsg(msg);
    setErrorMsg("");
  }

  async function add() {
    if (!range.from || !range.to || !propertyId) return;

    const arrival = range.from.toISOString().slice(0, 10);
    const departure = new Date(
      range.to.getFullYear(),
      range.to.getMonth(),
      range.to.getDate() + 1
    )
      .toISOString()
      .slice(0, 10); // Ende exkl.

    setErrorMsg("");
    setSuccessMsg("");

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyId: Number(propertyId),
        arrival,
        departure,
        guestName: "(Admin)",
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      showError(data.error || "Fehler beim Speichern des Zeitraums.");
      return;
    }

    const fresh = await fetch(
      `/api/bookings?propertyId=${propertyId}`
    ).then((r) => r.json());
    setBookings(fresh);
    setRange({ from: undefined, to: undefined });
    showSuccess("Zeitraum wurde eingetragen.");
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const id = pendingDelete.id;

    const res = await fetch(`/api/admin/booking/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      showError("Der Eintrag konnte nicht gelöscht werden.");
      setPendingDelete(null);
      return;
    }

    setBookings((prev) => prev.filter((b) => b.id !== id));
    showSuccess("Buchung/Block wurde gelöscht.");
    setPendingDelete(null);
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 md:py-10 relative">
      {/* Messages */}
      <div className="space-y-2 mb-4">
        {errorMsg && (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            <span>{errorMsg}</span>
            <button
              type="button"
              className="text-xs text-rose-500"
              onClick={() => setErrorMsg("")}
            >
              Schließen
            </button>
          </div>
        )}
        {successMsg && (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            <span>{successMsg}</span>
            <button
              type="button"
              className="text-xs text-emerald-600"
              onClick={() => setSuccessMsg("")}
            >
              Schließen
            </button>
          </div>
        )}
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
            Admin · Verfügbarkeiten
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Buchungskalender verwalten
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Wähle ein Objekt, blockiere interne Zeiträume oder trage manuelle
            Buchungen ein.
          </p>
        </div>

        <div className="w-full max-w-xs">
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            Objekt wählen
          </label>
          <select
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
          >
            <option value="">— Objekt wählen —</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {propertyId && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Kalender-Bereich */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-900">
                Kalender ·{" "}
                {properties.find((p) => p.id === Number(propertyId))?.title}
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <span className="inline-flex h-3 w-3 rounded-[4px] bg-rose-500" />
                <span>belegt / geblockt</span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/70 px-2 py-2">
              <DayPicker
                mode="range"
                selected={range}
                onSelect={setRange}
                numberOfMonths={2}
                showOutsideDays
                modifiers={{ booked: bookedDays }}
                modifiersStyles={{
                  booked: {
                    backgroundColor: "#ef4444",
                    color: "#fff",
                    borderRadius: 6,
                  },
                }}
                styles={{
                  caption: {
                    color: "#0f172a",
                    fontWeight: 600,
                  },
                  head_cell: {
                    color: "#64748b",
                    fontSize: "11px",
                  },
                  day: {
                    borderRadius: 8,
                  },
                }}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={add}
                className="inline-flex items-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/70 disabled:opacity-40"
                disabled={!range.from || !range.to}
              >
                Zeitraum blockieren / buchen
              </button>
              <p className="text-xs text-slate-500 max-w-sm">
                Tipp: Zeitraum im Kalender markieren. Anreisetag inkl., Abreisetag
                exkl. (wird automatisch +1 Tag gesetzt).
              </p>
            </div>
          </div>

          {/* Buchungs-Liste */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900">
                Bestehende Buchungen / Blöcke
              </h3>
              <span className="text-[11px] text-slate-500">
                {bookings.length} Eintrag
                {bookings.length === 1 ? "" : "e"}
              </span>
            </div>

            {bookings.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-500">
                Noch keine Einträge. Markiere im Kalender einen Zeitraum und
                speichere ihn als Block/Buchung.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 text-sm">
                {bookings.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <div className="space-y-0.5">
                      <p className="font-medium text-slate-800">
                        {b.startDate.slice(0, 10)} → {b.endDate.slice(0, 10)}{" "}
                        <span className="text-[11px] font-normal text-slate-500">
                          (Abreise exkl.)
                        </span>
                      </p>
                      {b.guestName && (
                        <p className="text-xs text-slate-500">
                          Gast / Notiz: {b.guestName}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(b)}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                    >
                      Löschen
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {!propertyId && (
        <p className="mt-4 text-sm text-slate-500">
          Bitte zuerst oben ein Objekt auswählen, um den Kalender zu sehen.
        </p>
      )}

      {/* Schöner Delete-Dialog statt confirm() */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <h4 className="text-sm font-semibold text-slate-900">
              Buchung / Block löschen?
            </h4>
            <p className="mt-2 text-sm text-slate-600">
              Zeitraum:{" "}
              <span className="font-medium">
                {pendingDelete.startDate.slice(0, 10)} →{" "}
                {pendingDelete.endDate.slice(0, 10)}
              </span>{" "}
              (Abreise exkl.)
            </p>
            {pendingDelete.guestName && (
              <p className="mt-1 text-xs text-slate-500">
                Notiz: {pendingDelete.guestName}
              </p>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={confirmDelete}
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
