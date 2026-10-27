const DAY = 86400000;

export function parseTravelDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
}

export function validateKuschelwochenPeriods(periods) {
  if (!Array.isArray(periods) || periods.length > 100) throw new Error("Bitte höchstens 100 Aktionszeiträume angeben.");
  const parsed = periods.map((period) => {
    const startDate = parseTravelDate(period?.startDate);
    const endDate = parseTravelDate(period?.endDate);
    if (!startDate || !endDate || endDate <= startDate) throw new Error("Jeder Zeitraum benötigt ein gültiges Startdatum und ein späteres Enddatum.");
    if ((endDate - startDate) / DAY < 7) throw new Error("Ein Aktionszeitraum muss mindestens sieben Nächte umfassen.");
    return { startDate, endDate };
  }).sort((a, b) => a.startDate - b.startDate);
  if (parsed.some((period, index) => index > 0 && period.startDate < parsed[index - 1].endDate)) {
    throw new Error("Aktionszeiträume dürfen sich nicht überschneiden.");
  }
  return parsed;
}

// Uses existing nightly prices only. Never combines this with Last Minute.
export function applyKuschelwochen({ enabled, start, end, periods, breakdown }) {
  const nights = (end - start) / DAY;
  if (!enabled || ![7, 14].includes(nights) || breakdown.length !== nights) return null;
  const eligible = periods.some((period) => start >= new Date(period.startDate) && end <= new Date(period.endDate));
  if (!eligible) return null;
  const cents = breakdown.map((row) => Math.round(row.base * 100));
  const baseCents = cents.reduce((sum, value) => sum + value, 0);
  const savingCents = Math.round(baseCents / 7);
  const lastMinuteCents = breakdown.reduce((sum, row) => sum + Math.round(row.discountAmount * 100), 0);
  if (savingCents <= 0 || savingCents < lastMinuteCents) return null;

  // Largest-remainder allocation keeps the per-night breakdown exact to the cent.
  const discounts = cents.map((value) => Math.floor(value / 7));
  const remainder = savingCents - discounts.reduce((sum, value) => sum + value, 0);
  const order = cents.map((value, index) => ({ index, fraction: value % 7 }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  for (let i = 0; i < remainder; i++) discounts[order[i].index]++;
  breakdown.forEach((row, index) => {
    row.discountType = "KUSCHELWOCHEN";
    row.discountValue = nights / 7;
    row.discountAmount = discounts[index] / 100;
    row.discount = 0;
    row.price = (cents[index] - discounts[index]) / 100;
  });
  return { freeNights: nights / 7, paidNights: nights - nights / 7, amount: savingCents / 100 };
}
