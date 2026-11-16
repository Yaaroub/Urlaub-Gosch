import Link from "next/link";
import { ArrowRight, CalendarDays, CalendarSearch, Euro, Home, Images, KeyRound, Settings, RefreshCw, Tag, Users, ExternalLink } from "lucide-react";
import HuggedHeartIcon from "@/components/HuggedHeartIcon";
import { getAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const groups = [
  {
    title: "Objekte & Inhalte",
    description: "Alles, was eine Unterkunft ausmacht.",
    items: [
      { href: "/admin/properties", title: "Objekte verwalten", description: "Adressen, Ausstattung und Objektdaten bearbeiten.", icon: Home },
      { href: "/admin/images", title: "Objektfotos", description: "Fotos hochladen, sortieren und das Titelbild festlegen.", icon: Images },
      { href: "/admin/ical", title: "Kalender synchronisieren", description: "Externe Kalender über iCal verbinden und abgleichen.", icon: RefreshCw },
    ],
  },
  {
    title: "Preise & Angebote",
    description: "Nachtpreise, Zuschläge und Aktionen pflegen.",
    items: [
      { href: "/admin/prices", title: "Nachtpreise & Saisonzeiten", description: "Bestehende Preise anpassen und neue Preiszeiträume anlegen.", icon: Euro },
      { href: "/admin/fees", title: "Nebenkosten & Zuschläge", description: "Endreinigung und weitere Kosten pro Objekt hinterlegen.", icon: Settings },
      { href: "/admin/lastminute", title: "Last-Minute-Angebote", description: "Kurzfristige Rabatte und ihre Gültigkeit verwalten.", icon: Tag },
      { href: "/admin/kuschelwochen", title: "Ostsee-Kuschelwochen", description: "Aktionszeiträume für 7 bzw. 14 Nächte festlegen.", icon: HuggedHeartIcon },
    ],
  },
];

function AreaLink({ item }) {
  const Icon = item.icon;
  return <Link href={item.href} className="group flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-sky-300 hover:bg-sky-50/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600">
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-600 group-hover:bg-sky-100 group-hover:text-sky-700"><Icon className="h-5 w-5" aria-hidden="true" /></span>
    <div className="min-w-0 flex-1"><h3 className="font-semibold text-slate-900 group-hover:text-sky-800">{item.title}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{item.description}</p></div>
    <ArrowRight className="mt-2 h-4 w-4 shrink-0 text-slate-300 group-hover:text-sky-600" aria-hidden="true" />
  </Link>;
}

export default async function AdminHome() {
  const user = await getAdminUser();
  const name = user?.name?.trim() || user?.email?.split("@")?.[0] || "Team";
  return <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6">
      <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Urlaub GOSCH · Verwaltung</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Admin-Übersicht</h1><p className="mt-2 text-sm text-slate-500">Hallo {name}. Was steht heute an?</p></div>
      <div className="flex flex-wrap gap-2">
        <Link href="/admin/mein-passwort" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 hover:border-sky-300 hover:text-sky-700"><KeyRound className="h-4 w-4" aria-hidden="true" /> Passwort ändern</Link>
        <Link href="/" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 hover:border-sky-300 hover:text-sky-700">Website ansehen <ExternalLink className="h-4 w-4" aria-hidden="true" /></Link>
      </div>
    </header>

    <section aria-labelledby="daily-tasks" className="mb-10">
      <h2 id="daily-tasks" className="mb-4 text-lg font-semibold text-slate-900">Beratung & Belegung</h2>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Link href="/admin/availability-overview" className="group rounded-2xl bg-[#12364a] p-6 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 sm:p-7">
          <div className="flex items-center justify-between"><CalendarSearch className="h-6 w-6 text-sky-200" aria-hidden="true" /><span className="text-xs text-sky-200">Für die Kundenberatung</span></div>
          <h3 className="mt-5 text-xl font-semibold">Freie Objekte finden</h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-200">Reisezeit wählen, Kalender vergleichen und passende Angebote oder freie Lücken finden.</p>
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white">Verfügbarkeitsübersicht öffnen <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true" /></span>
        </Link>
        <Link href="/admin/availability" className="group rounded-2xl border border-slate-200 bg-white p-6 hover:border-sky-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 sm:p-7">
          <CalendarDays className="h-6 w-6 text-sky-700" aria-hidden="true" />
          <h3 className="mt-5 text-xl font-semibold text-slate-900">Buchungen & Belegungen</h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">Belegungen einzelner Objekte prüfen, Einträge bearbeiten und Zeiträume sperren oder freigeben.</p>
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-sky-700">Belegungskalender öffnen <ArrowRight className="h-4 w-4" aria-hidden="true" /></span>
        </Link>
      </div>
    </section>

    {groups.map((group, index) => <section key={group.title} aria-labelledby={`admin-group-${index}`} className="mb-9">
      <div className="mb-4"><h2 id={`admin-group-${index}`} className="text-lg font-semibold text-slate-900">{group.title}</h2><p className="mt-1 text-sm text-slate-500">{group.description}</p></div>
      <div className="grid gap-3 md:grid-cols-2">{group.items.map((item) => <AreaLink key={item.href} item={item} />)}</div>
    </section>)}

    {user?.role === "SUPERADMIN" && <section aria-labelledby="team-access" className="border-t border-slate-200 pt-6"><h2 id="team-access" className="mb-4 text-lg font-semibold text-slate-900">Team & Zugriff</h2><div className="max-w-xl"><AreaLink item={{ href: "/admin/mitarbeiter", title: "Mitarbeiter & Berechtigungen", description: "Konten, Rollen und Zugriffsrechte verwalten.", icon: Users }} /></div></section>}
  </div>;
}
