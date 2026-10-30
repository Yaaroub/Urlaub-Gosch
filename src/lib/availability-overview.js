import { parseTravelDate } from "./kuschelwochen.js";

export const DAY_MS = 86400000;
export const dateKey = (date) => date.toISOString().slice(0, 10);

export function getOverviewWindow(arrival, departure) {
  const start = parseTravelDate(arrival);
  const end = parseTravelDate(departure);
  if (!start || !end || end <= start || (end - start) / DAY_MS > 90) return null;
  return {
    start, end, nights: (end - start) / DAY_MS,
    from: new Date(+start - 3 * DAY_MS),
    to: new Date(+end + 4 * DAY_MS),
  };
}

export function isStayAvailable(bookings, arrival, departure) {
  return !bookings.some((booking) =>
    dateKey(new Date(booking.startDate)) < departure &&
    dateKey(new Date(booking.endDate)) > arrival
  );
}

// Booking nights are [arrival, departure); a checkout can start a free gap.
export function getFreeIntervals(bookings, arrival, departure) {
  const window = getOverviewWindow(arrival, departure);
  if (!window) return [];
  const occupied = bookings.map((booking) => ({
    start: Math.max(+window.start, +parseTravelDate(dateKey(new Date(booking.startDate)))),
    end: Math.min(+window.end, +parseTravelDate(dateKey(new Date(booking.endDate)))),
  })).filter(({ start, end }) => start < end).sort((a, b) => a.start - b.start);
  let cursor = +window.start;
  const gaps = [];
  const append = (start, end) => gaps.push({ arrival: dateKey(new Date(start)), departure: dateKey(new Date(end)), nights: (end - start) / DAY_MS });
  for (const { start, end } of occupied) {
    if (start > cursor) append(cursor, start);
    cursor = Math.max(cursor, end);
  }
  if (cursor < +window.end) append(cursor, +window.end);
  return gaps;
}

export function getDayStatus(bookings, day) {
  let arrival = false;
  let departure = false;
  let interior = false;
  for (const booking of bookings) {
    const start = dateKey(new Date(booking.startDate));
    const end = dateKey(new Date(booking.endDate));
    arrival ||= start === day;
    departure ||= end === day;
    interior ||= start < day && day < end;
  }
  if (interior || (arrival && departure)) return "booked";
  if (arrival || departure) return "boundary";
  return "free";
}

export function selectCalendarStay(current, property, day) {
  if (current?.propertyId === property.id && !current.departure && day > current.arrival) {
    if (!getOverviewWindow(current.arrival, day)) return { error: "Bitte höchstens 90 Nächte markieren." };
    if (!isStayAvailable(property.bookings, current.arrival, day)) return { error: "In diesem Zeitraum liegen belegte Nächte. Bitte eine freie Lücke wählen." };
    return { selection: { ...current, departure: day } };
  }
  const nextDay = dateKey(new Date(+parseTravelDate(day) + DAY_MS));
  if (!isStayAvailable(property.bookings, day, nextDay)) return { error: "An diesem Tag ist keine Anreise möglich. Bitte einen freien Anreisetag wählen." };
  return { selection: { propertyId: property.id, arrival: day, departure: null } };
}
