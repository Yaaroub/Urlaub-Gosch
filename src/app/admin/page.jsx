export const dynamic = "force-dynamic";

import {
  Home,
  Images,
  Calendar,
  Euro,
  Settings,
  Upload,
  Tag,
  Layers,
} from "lucide-react";

export default function AdminHome() {
  const items = [
    {
      href: "/admin/properties",
      title: "Objekte",
      desc: "Unterkünfte, Slugs, Grunddaten.",
      icon: Home,
    },
    {
      href: "/admin/prices",
      title: "Preiszeiten",
      desc: "Preislogik & Zeiträume definieren.",
      icon: Euro,
    },
    {
      href: "/admin/fees",
      title: "Nebenkosten",
      desc: "Endreinigung, Kurtaxe & Zuschläge.",
      icon: Settings,
    },
    {
      href: "/admin/images",
      title: "Bilder",
      desc: "Upload, Reihenfolge, Alt-Texte.",
      icon: Images,
    },
    {
      href: "/admin/availability",
      title: "Verfügbarkeiten",
      desc: "Manuell blockieren oder freigeben.",
      icon: Calendar,
    },
    {
      href: "/admin/ical",
      title: "iCal Import & Sync",
      desc: "Kalender-URLs hinterlegen & importieren.",
      icon: Upload,
    },
    {
      href: "/admin/lastminute",
      title: "Last-Minute Angebote",
      desc: "Erstellen, bearbeiten, löschen.",
      icon: Tag,
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
          Admin Dashboard
        </p>
        <h1 className="text-3xl font-bold text-slate-900 mt-1">
          Verwaltung & Steuerung
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Nutze die administrativen Funktionen zur Verwaltung deiner Plattform.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.href}
              href={item.href}
              className="
                group relative flex flex-col rounded-2xl 
                bg-white/70 backdrop-blur-md 
                ring-1 ring-slate-200 shadow-sm 
                p-6 transition-all 
                hover:shadow-lg hover:ring-sky-300
                hover:bg-white
              "
            >
              {/* Icon */}
              <div className="absolute -top-3 -left-3 rounded-xl bg-sky-500 text-white p-2 shadow-md group-hover:bg-sky-600">
                <Icon className="h-5 w-5" />
              </div>

              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                {item.title}
              </h3>
              <p className="text-sm text-slate-600 mt-1">{item.desc}</p>

              <div className="mt-4 text-xs font-medium text-sky-600 group-hover:underline">
                Öffnen →
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
