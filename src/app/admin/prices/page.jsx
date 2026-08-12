"use client";

import { useEffect, useMemo, useState } from "react";
import {
  formatEuro,
  formatPriceDate,
  getActivePricePeriods,
  getAvailablePriceYears,
  getDateKey,
  getDefaultPriceYear,
  getPricePeriodsForYear,
  getTodayDateKey,
} from "@/lib/pricePeriodUtils";

export default function PriceEditorPage() {
  const [properties, setProperties] = useState([]);
  const [propertyId, setPropertyId] = useState("");
  const [items, setItems] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [form, setForm] = useState({
    id: null,
    startDate: "",
    endDate: "",
    pricePerNight: "",
  });
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const todayKey = useMemo(() => getTodayDateKey(), []);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const pid = searchParams.get("propertyId");
    if (pid) setPropertyId(pid);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/admin/properties", {
          cache: "no-store",
        });

        if (response.status === 401) {
          window.location.href = "/admin";
          return;
        }

        const data = await response.json();
        const sortedProperties = Array.isArray(data)
          ? [...data].sort((a, b) =>
              String(a.title || "").localeCompare(String(b.title || ""), "de", {
                sensitivity: "base",
              })
            )
          : [];

        setProperties(sortedProperties);
      } catch {
        setProperties([]);
        setMsg({
          t: "error",
          m: "Unterkünfte konnten nicht geladen werden.",
        });
      }
    })();
  }, []);

  useEffect(() => {
    if (!propertyId) {
      setItems([]);
      setSelectedYear(null);
      return;
    }

    reloadList(propertyId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  async function reloadList(pid = propertyId) {
    if (!pid) return;

    setLoading(true);
    setMsg(null);

    try {
      const response = await fetch(
        `/api/admin/price-periods?propertyId=${encodeURIComponent(pid)}`,
        { cache: "no-store" }
      );

      if (response.status === 401) {
        window.location.href = "/admin";
        return;
      }

      const data = await response.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setMsg({
        t: "error",
        m: "Preiszeiten konnten nicht geladen werden.",
      });
    } finally {
      setLoading(false);
    }
  }

  function handlePropertyChange(event) {
    const nextPropertyId = event.target.value;

    setPropertyId(nextPropertyId);
    setSelectedYear(null);
    resetForm();
    setPendingDelete(null);

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

  const currentTitle = useMemo(
    () => properties.find((property) => property.id === Number(propertyId))?.title || "",
    [propertyId, properties]
  );

  const activeItems = useMemo(
    () => getActivePricePeriods(items, todayKey),
    [items, todayKey]
  );

  const availableYears = useMemo(
    () => getAvailablePriceYears(items, todayKey),
    [items, todayKey]
  );

  const visibleItems = useMemo(
    () => getPricePeriodsForYear(items, selectedYear, todayKey),
    [items, selectedYear, todayKey]
  );

  const expiredCount = items.length - activeItems.length;

  useEffect(() => {
    setSelectedYear((previousYear) => {
      if (previousYear && availableYears.includes(previousYear)) {
        return previousYear;
      }

      return getDefaultPriceYear(availableYears, todayKey);
    });
  }, [availableYears, todayKey]);

  function edit(pricePeriod) {
    setForm({
      id: pricePeriod?.id ?? null,
      startDate: pricePeriod ? getDateKey(pricePeriod.startDate) : "",
      endDate: pricePeriod ? getDateKey(pricePeriod.endDate) : "",
      pricePerNight: pricePeriod ? String(pricePeriod.pricePerNight) : "",
    });
    setMsg(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setForm({ id: null, startDate: "", endDate: "", pricePerNight: "" });
    setMsg(null);
  }

  async function save(event) {
    event.preventDefault();
    setMsg(null);

    if (!propertyId) {
      setMsg({ t: "error", m: "Bitte zuerst ein Objekt wählen." });
      return;
    }

    if (!form.startDate || !form.endDate) {
      setMsg({
        t: "error",
        m: "Start- und Enddatum sind erforderlich.",
      });
      return;
    }

    if (form.endDate <= form.startDate) {
      setMsg({ t: "error", m: "Ende muss nach Start liegen." });
      return;
    }

    const price = Number(form.pricePerNight);
    if (!Number.isFinite(price) || price < 0) {
      setMsg({
        t: "error",
        m: "Bitte einen gültigen Preis pro Nacht eingeben.",
      });
      return;
    }

    const payload = {
      propertyId: Number(propertyId),
      startDate: form.startDate,
      endDate: form.endDate,
      pricePerNight: price,
    };

    setBusy(true);

    try {
      const response = await fetch(
        form.id
          ? `/api/admin/price-periods/${encodeURIComponent(form.id)}`
          : "/api/admin/price-periods",
        {
          method: form.id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (response.status === 401) {
        window.location.href = "/admin";
        return;
      }

      const data = response.status === 204 ? {} : await response.json();

      if (!response.ok) {
        const conflictInfo = data?.conflict
          ? ` (Konflikt: ${getDateKey(data.conflict.startDate)} → ${getDateKey(
              data.conflict.endDate
            )})`
          : "";

        setMsg({
          t: "error",
          m: (data.error || "Fehler beim Speichern.") + conflictInfo,
        });
        return;
      }

      resetForm();
      await reloadList();
      setMsg({
        t: "ok",
        m: form.id ? "Preiszeit aktualisiert." : "Preiszeit hinzugefügt.",
      });
    } catch {
      setMsg({ t: "error", m: "Netzwerkfehler beim Speichern." });
    } finally {
      setBusy(false);
    }
  }

  function askRemove(pricePeriod) {
    setMsg(null);
    setPendingDelete(pricePeriod);
  }

  async function confirmRemove() {
    if (!pendingDelete) return;

    setBusy(true);

    try {
      const response = await fetch(
        `/api/admin/price-periods/${encodeURIComponent(pendingDelete.id)}`,
        { method: "DELETE" }
      );

      if (response.status === 401) {
        window.location.href = "/admin";
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setMsg({
          t: "error",
          m: data.error || "Löschen fehlgeschlagen.",
        });
        setPendingDelete(null);
        return;
      }

      setPendingDelete(null);
      await reloadList();
      setMsg({ t: "ok", m: "Preiszeit wurde gelöscht." });
    } catch {
      setMsg({ t: "error", m: "Netzwerkfehler beim Löschen." });
      setPendingDelete(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto mt-24 max-w-6xl px-4 py-8 md:py-10">
      <div className="mb-4 space-y-2">
        {msg?.t === "error" && (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            <span>{msg.m}</span>
            <button
              type="button"
              className="text-xs text-rose-500"
              onClick={() => setMsg(null)}
            >
              Schließen
            </button>
          </div>
        )}

        {msg?.t === "ok" && (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            <span>{msg.m}</span>
            <button
              type="button"
              className="text-xs text-emerald-600"
              onClick={() => setMsg(null)}
            >
              Schließen
            </button>
          </div>
        )}
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
            Admin · Preiszeiten
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Saisonpreise & Zeiträume
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Lege Preiszeiträume mit Start- und Enddatum an. Das Ende ist{" "}
            <strong>exklusiv</strong> (Abreise-Tag).
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:ml-auto sm:items-end">
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            Objekt wählen
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <select
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
              value={propertyId}
              onChange={handlePropertyChange}
            >
              <option value="">— wählen —</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.title}
                </option>
              ))}
            </select>

            {currentTitle && (
              <span className="text-xs text-slate-500">({currentTitle})</span>
            )}

            {!!propertyId && (
              <a
                className="text-xs font-medium text-sky-700 underline"
                href="/admin/properties"
              >
                Zur Objektliste
              </a>
            )}
          </div>
        </div>
      </div>

      <form
        onSubmit={save}
        className="mb-6 grid gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 md:grid-cols-4"
      >
        <div>
          <label className="mb-1 block text-xs text-slate-500">
            Start (inkl.)
          </label>
          <input
            type="date"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
            value={form.startDate}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                startDate: event.target.value,
              }))
            }
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-slate-500">
            Ende (exkl.)
          </label>
          <input
            type="date"
            min={form.startDate || undefined}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
            value={form.endDate}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                endDate: event.target.value,
              }))
            }
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-slate-500">
            Preis/Nacht (€)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
            value={form.pricePerNight}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                pricePerNight: event.target.value,
              }))
            }
          />
        </div>

        <div className="flex items-end gap-2">
          <button
            disabled={busy || !propertyId}
            className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 disabled:opacity-60"
          >
            {form.id ? "Aktualisieren" : "Hinzufügen"}
          </button>

          {form.id && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Abbrechen
            </button>
          )}
        </div>
      </form>

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Preisübersicht</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Abgelaufene Zeiträume werden automatisch nicht mehr angezeigt.
            </p>
          </div>

          {availableYears.length > 0 && (
            <div
              className="flex flex-wrap gap-2"
              role="tablist"
              aria-label="Preisjahr auswählen"
            >
              {availableYears.map((year) => {
                const isActive = year === selectedYear;

                return (
                  <button
                    key={year}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setSelectedYear(year)}
                    className={
                      isActive
                        ? "rounded-full bg-sky-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm"
                        : "rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 hover:border-sky-300 hover:text-sky-700"
                    }
                  >
                    {year}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {loading && (
          <p className="text-sm text-slate-500">Lade Preiszeiten…</p>
        )}

        {!loading && activeItems.length === 0 && (
          <p className="text-sm text-slate-500">
            Keine aktuellen oder zukünftigen Preiszeiten vorhanden.
          </p>
        )}

        {!loading && activeItems.length > 0 && visibleItems.length === 0 && (
          <p className="text-sm text-slate-500">
            Für {selectedYear} sind keine Preiszeiten vorhanden.
          </p>
        )}

        {!loading && visibleItems.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="py-2">Start</th>
                  <th className="py-2">Ende (exkl.)</th>
                  <th className="py-2">Preis/Nacht</th>
                  <th className="py-2 text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((pricePeriod) => (
                  <tr key={pricePeriod.id} className="border-t">
                    <td className="py-2">
                      {formatPriceDate(pricePeriod.startDate)}
                    </td>
                    <td className="py-2">
                      {formatPriceDate(pricePeriod.endDate)}
                    </td>
                    <td className="py-2 font-medium text-slate-900">
                      {formatEuro(pricePeriod.pricePerNight)}
                    </td>
                    <td className="whitespace-nowrap py-2 text-right">
                      <button
                        type="button"
                        onClick={() => edit(pricePeriod)}
                        className="mr-2 rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-800 shadow-sm hover:bg-slate-200"
                      >
                        Bearbeiten
                      </button>
                      <button
                        type="button"
                        onClick={() => askRemove(pricePeriod)}
                        className="rounded-lg bg-rose-600 px-2 py-1 text-xs font-semibold text-white shadow-sm hover:bg-rose-700"
                      >
                        Löschen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && expiredCount > 0 && (
          <p className="mt-3 text-xs text-slate-400">
            {expiredCount} abgelaufene{expiredCount === 1 ? "r" : ""} Zeitraum
            {expiredCount === 1 ? "" : "e"} ausgeblendet.
          </p>
        )}
      </div>

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <h4 className="text-sm font-semibold text-slate-900">
              Preiszeit löschen?
            </h4>
            <p className="mt-2 text-sm text-slate-600">
              Möchtest du diese Preiszeit wirklich löschen? Die Aktion kann
              nicht rückgängig gemacht werden.
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Zeitraum: {formatPriceDate(pendingDelete.startDate)} →{" "}
              {formatPriceDate(pendingDelete.endDate)} · Preis:{" "}
              {formatEuro(pendingDelete.pricePerNight)} / Nacht
            </p>
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
                onClick={confirmRemove}
                disabled={busy}
                className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-60"
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