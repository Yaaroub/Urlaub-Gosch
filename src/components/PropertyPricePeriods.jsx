"use client";

import { useEffect, useMemo, useState } from "react";

const currencyFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

function getDateKey(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function getTodayKeyInBerlin() {
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Europe/Berlin",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function previousDateKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function formatDateKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);

  if (!year || !month || !day) return "–";
  return dateFormatter.format(new Date(Date.UTC(year, month - 1, day)));
}

function overlapsYear(period, year) {
  const startDate = getDateKey(period.startDate);
  const endDate = getDateKey(period.endDate);
  const yearStart = `${year}-01-01`;
  const nextYearStart = `${year + 1}-01-01`;

  // Das Enddatum ist exklusiv.
  return startDate < nextYearStart && endDate > yearStart;
}

function getDisplayRange(period, year) {
  const yearStart = `${year}-01-01`;
  const nextYearStart = `${year + 1}-01-01`;
  const startDate = getDateKey(period.startDate);
  const endDate = getDateKey(period.endDate);

  const visibleStart = startDate > yearStart ? startDate : yearStart;
  const visibleEndExclusive = endDate < nextYearStart ? endDate : nextYearStart;

  return {
    startDate: visibleStart,
    endDate: previousDateKey(visibleEndExclusive),
  };
}

function getDefaultYear(years, currentYear) {
  if (years.includes(currentYear)) return currentYear;
  return years.find((year) => year > currentYear) ?? years[years.length - 1] ?? null;
}

export default function PropertyPricePeriods({ pricePeriods = [] }) {
  const todayKey = useMemo(() => getTodayKeyInBerlin(), []);
  const currentYear = Number(todayKey.slice(0, 4));

  const activePeriods = useMemo(
    () =>
      pricePeriods
        .filter((period) => {
          const startDate = getDateKey(period.startDate);
          const endDate = getDateKey(period.endDate);
          return startDate && endDate && endDate > todayKey;
        })
        .sort((a, b) => {
          const startComparison = getDateKey(a.startDate).localeCompare(
            getDateKey(b.startDate),
          );

          if (startComparison !== 0) return startComparison;
          return getDateKey(a.endDate).localeCompare(getDateKey(b.endDate));
        }),
    [pricePeriods, todayKey],
  );

  const years = useMemo(() => {
    const result = new Set();

    for (const period of activePeriods) {
      const startYear = Number(getDateKey(period.startDate).slice(0, 4));
      const endExclusiveYear = Number(getDateKey(period.endDate).slice(0, 4));

      if (!Number.isInteger(startYear) || !Number.isInteger(endExclusiveYear)) {
        continue;
      }

      for (let year = startYear; year <= endExclusiveYear; year += 1) {
        if (overlapsYear(period, year)) result.add(year);
      }
    }

    return [...result].sort((a, b) => a - b);
  }, [activePeriods]);

  const [selectedYear, setSelectedYear] = useState(() =>
    getDefaultYear(years, currentYear),
  );

  useEffect(() => {
    if (!years.includes(selectedYear)) {
      setSelectedYear(getDefaultYear(years, currentYear));
    }
  }, [currentYear, selectedYear, years]);

  const visiblePeriods = useMemo(() => {
    if (!selectedYear) return [];

    return activePeriods
      .filter((period) => overlapsYear(period, selectedYear))
      .map((period) => ({
        ...period,
        displayRange: getDisplayRange(period, selectedYear),
      }));
  }, [activePeriods, selectedYear]);

  if (years.length === 0) {
    return (
      <p className="text-sm leading-6 text-slate-600">
        Aktuell sind keine zukünftigen Preiszeiten hinterlegt.
      </p>
    );
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label="Preisjahr auswählen"
        className="mb-5 flex gap-2 overflow-x-auto pb-1"
      >
        {years.map((year) => {
          const isActive = selectedYear === year;

          return (
            <button
              key={year}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`price-periods-${year}`}
              id={`price-year-${year}`}
              onClick={() => setSelectedYear(year)}
              className={
                isActive
                  ? "shrink-0 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm"
                  : "shrink-0 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-200 transition hover:bg-slate-200 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2"
              }
            >
              {year}
            </button>
          );
        })}
      </div>

      <div
        id={`price-periods-${selectedYear}`}
        role="tabpanel"
        aria-labelledby={`price-year-${selectedYear}`}
      >
        <ul className="divide-y divide-slate-100 text-sm">
          {visiblePeriods.map((period) => (
            <li
              key={`${period.id}-${selectedYear}`}
              className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-5"
            >
              <span className="text-slate-600">
                {formatDateKey(period.displayRange.startDate)} bis{" "}
                {formatDateKey(period.displayRange.endDate)}
              </span>
              <strong className="whitespace-nowrap text-slate-950">
                {currencyFormatter.format(Number(period.pricePerNight))} / Nacht
              </strong>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-500">
        Das angezeigte Enddatum ist die letzte berechnete Übernachtung. Der
        Abreisetag ist nicht enthalten.
      </p>
    </div>
  );
}