import Link from "next/link";
import Image from "next/image";
import { CalendarDays, ArrowRight } from "lucide-react";
import prisma from "@/lib/db";
import { getFreeIntervals, getOverviewWindow } from "@/lib/availability-overview";
import CustomerStayPrice from "./CustomerStayPrice";

const formatDate = (value) => new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));

export default async function CustomerAlternatives({ arrival, departure, where, searchParams, exactCount }) {
  const window = getOverviewWindow(arrival, departure);
  if (!window) return null;
  let candidates;
  try {
    candidates = await prisma.property.findMany({
      where: { AND: [where, { bookings: { some: { startDate: { lt: window.end }, endDate: { gt: window.start } } } }] },
      select: {
        id: true, title: true, location: true, maxPersons: true, dogsAllowed: true,
        images: { orderBy: { sort: "asc" }, take: 1, select: { url: true, alt: true } },
        bookings: { where: { startDate: { lt: window.end }, endDate: { gt: window.start } }, select: { startDate: true, endDate: true } },
      },
    });
  } catch {
    return <p className="mt-6 text-sm text-slate-500">Alternative Reisezeiträume können gerade nicht geprüft werden.</p>;
  }
  const alternatives = candidates.map((property) => ({ ...property, gap: getFreeIntervals(property.bookings, arrival, departure).sort((a, b) => b.nights - a.nights || a.arrival.localeCompare(b.arrival))[0] }))
    .filter((property) => property.gap)
    .sort((a, b) => b.gap.nights - a.gap.nights || a.title.localeCompare(b.title, "de"))
    .slice(0, 6);
  if (!alternatives.length) return null;
  function href(gap) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      for (const item of Array.isArray(value) ? value : [value]) if (item != null) query.append(key, String(item));
    }
    query.set("arrival", gap.arrival);
    query.set("departure", gap.departure);
    return `/?${query}#unterkuenfte`;
  }
  return <section aria-labelledby="alternative-stays" className="mt-10 border-t border-slate-200 pt-8">
    <div className="mb-5 flex items-start gap-3"><span className="rounded-xl bg-sky-50 p-3 text-sky-700"><CalendarDays className="h-5 w-5" aria-hidden="true" /></span><div>
      <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">Etwas kürzer, trotzdem Ostsee</p>
      <h2 id="alternative-stays" className="mt-1 text-xl font-semibold text-slate-950">{exactCount ? "Vielleicht passen diese freien Tage?" : "Diese Teilzeiträume sind noch frei"}</h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">Diese Unterkünfte sind nur für einen Teil Ihrer Reise vom {formatDate(arrival)} bis {formatDate(departure)} verfügbar. Ihre übrigen Suchkriterien bleiben berücksichtigt.</p>
    </div></div>
    <div className="grid gap-4 sm:grid-cols-2">{alternatives.map((property) => <article key={property.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {property.images[0]?.url && <div className="relative h-40"><Image src={property.images[0].url} alt={property.images[0].alt || property.title} fill sizes="(min-width: 640px) 400px, 100vw" className="object-cover" /></div>}
      <div className="p-5"><p className="text-xs text-slate-500">{property.location} · bis {property.maxPersons} Personen{property.dogsAllowed ? " · Hund erlaubt" : ""}</p><h3 className="mt-1 font-semibold text-slate-900">{property.title}</h3>
        <div className="my-4 rounded-lg bg-[#f5f7f8] px-3 py-3"><p className="text-xs text-slate-500">Freier Teilzeitraum</p><p className="mt-1 font-semibold text-slate-900">{formatDate(property.gap.arrival)} – {formatDate(property.gap.departure)} <span className="font-normal text-slate-500">· {property.gap.nights} Nächte</span></p></div>
        <CustomerStayPrice propertyId={property.id} arrival={property.gap.arrival} departure={property.gap.departure} />
        <Link href={href(property.gap)} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-3 text-sm font-semibold text-white hover:bg-sky-700">Mit diesen Reisedaten suchen <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
      </div>
    </article>)}</div>
  </section>;
}
