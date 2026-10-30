// A shared departure/arrival belongs to two stays and must appear occupied.
export function getCalendarBoundaries(bookings) {
  const arrivals = new Map();
  const departures = new Map();
  for (const booking of bookings) {
    if (!booking.startDate || !booking.endDate) continue;
    const start = new Date(booking.startDate);
    const end = new Date(booking.endDate);
    const arrival = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const departure = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    if (!(arrival < departure)) continue;
    arrivals.set(arrival.getTime(), arrival);
    departures.set(departure.getTime(), departure);
  }
  const sharedDays = [];
  const changeoverDays = [];
  for (const [time, day] of new Map([...arrivals, ...departures])) {
    if (arrivals.has(time) && departures.has(time)) sharedDays.push(day);
    else changeoverDays.push(day);
  }
  return { sharedDays, changeoverDays };
}
