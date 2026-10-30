export function getMinimumNightlyPrice(periods, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const date = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const today = `${date.year}-${date.month}-${date.day}`;
  const prices = (periods || []).filter((period) => {
    const start = new Date(period.startDate);
    const end = new Date(period.endDate);
    return Number.isFinite(start.getTime()) && Number.isFinite(end.getTime()) &&
      end > start && end.toISOString().slice(0, 10) > today;
  }).map((period) => Number(period.pricePerNight)).filter((price) => Number.isFinite(price) && price > 0);
  return prices.length ? Math.min(...prices) : null;
}
