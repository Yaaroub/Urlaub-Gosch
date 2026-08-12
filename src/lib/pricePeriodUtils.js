const euroFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

export function getDateKey(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

export function getTodayDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function isPricePeriodExpired(
  period,
  todayKey = getTodayDateKey()
) {
  const endDate = getDateKey(period?.endDate);

  return !endDate || endDate <= todayKey;
}

export function pricePeriodOverlapsYear(period, year) {
  const startDate = getDateKey(period?.startDate);
  const endDate = getDateKey(period?.endDate);

  if (!startDate || !endDate || !year) {
    return false;
  }

  const yearStart = `${year}-01-01`;
  const nextYearStart = `${Number(year) + 1}-01-01`;

  // Das Enddatum ist exklusiv.
  return startDate < nextYearStart && endDate > yearStart;
}

export function getActivePricePeriods(
  periods,
  todayKey = getTodayDateKey()
) {
  return (Array.isArray(periods) ? periods : [])
    .filter((period) => !isPricePeriodExpired(period, todayKey))
    .sort((a, b) => {
      const startComparison = getDateKey(a.startDate).localeCompare(
        getDateKey(b.startDate)
      );

      if (startComparison !== 0) {
        return startComparison;
      }

      return getDateKey(a.endDate).localeCompare(
        getDateKey(b.endDate)
      );
    });
}

export function getAvailablePriceYears(
  periods,
  todayKey = getTodayDateKey()
) {
  const years = new Set();

  for (const period of getActivePricePeriods(periods, todayKey)) {
    const startYear = Number(
      getDateKey(period.startDate).slice(0, 4)
    );

    const endYear = Number(
      getDateKey(period.endDate).slice(0, 4)
    );

    if (
      !Number.isInteger(startYear) ||
      !Number.isInteger(endYear)
    ) {
      continue;
    }

    for (let year = startYear; year <= endYear; year += 1) {
      if (pricePeriodOverlapsYear(period, year)) {
        years.add(year);
      }
    }
  }

  return [...years].sort((a, b) => a - b);
}

export function getPricePeriodsForYear(
  periods,
  year,
  todayKey = getTodayDateKey()
) {
  if (!year) {
    return [];
  }

  return getActivePricePeriods(periods, todayKey).filter(
    (period) => pricePeriodOverlapsYear(period, year)
  );
}

export function getDefaultPriceYear(
  years,
  todayKey = getTodayDateKey()
) {
  if (!Array.isArray(years) || years.length === 0) {
    return null;
  }

  const currentYear = Number(todayKey.slice(0, 4));

  if (years.includes(currentYear)) {
    return currentYear;
  }

  return (
    years.find((year) => year > currentYear) ??
    years[years.length - 1]
  );
}

export function formatPriceDate(value) {
  const dateKey = getDateKey(value);
  const [year, month, day] = dateKey.split("-");

  if (!year || !month || !day) {
    return "–";
  }

  return `${day}.${month}.${year}`;
}

export function formatEuro(value) {
  const amount = Number(value);

  return Number.isFinite(amount)
    ? euroFormatter.format(amount)
    : "–";
}