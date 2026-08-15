import Link from "next/link";

import {
  Home,
  Images,
  CalendarDays,
  Euro,
  Settings,
  Upload,
  Tag,
  Users,
  ShieldCheck,
  ArrowUpRight,
  LayoutDashboard,
} from "lucide-react";

import { getAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const ROLE_LABELS = {
  EDITOR: "Editor",
  ADMIN: "Administrator",
  SUPERADMIN: "Superadmin",
};

export default async function AdminHome() {
  const user = await getAdminUser();

  const items = [
    {
      href: "/admin/properties",
      title: "Objekte",
      desc: "Unterkünfte, Stammdaten, Slugs und Ausstattung verwalten.",
      icon: Home,
    },
    {
      href: "/admin/prices",
      title: "Preiszeiten",
      desc: "Preise, Zeiträume und saisonale Preislogik bearbeiten.",
      icon: Euro,
    },
    {
      href: "/admin/fees",
      title: "Nebenkosten",
      desc: "Endreinigung, Kurtaxe und weitere Zuschläge verwalten.",
      icon: Settings,
    },
    {
      href: "/admin/images",
      title: "Bilder",
      desc: "Bilder hochladen, sortieren und Alt-Texte bearbeiten.",
      icon: Images,
    },
    {
      href: "/admin/availability",
      title: "Verfügbarkeiten",
      desc: "Belegungen prüfen und Zeiträume blockieren oder freigeben.",
      icon: CalendarDays,
    },
    {
      href: "/admin/ical",
      title: "iCal Import & Sync",
      desc: "Kalenderquellen verwalten und Buchungen synchronisieren.",
      icon: Upload,
    },
    {
      href: "/admin/lastminute",
      title: "Last-Minute",
      desc: "Kurzfristige Angebote erstellen, bearbeiten und entfernen.",
      icon: Tag,
    },
  ];

  if (user?.role === "SUPERADMIN") {
    items.push({
      href: "/admin/mitarbeiter",
      title: "Mitarbeiter",
      desc: "Konten, Rollen, Passwörter und Zugriffsrechte verwalten.",
      icon: Users,
      protected: true,
    });
  }

  const displayName =
    user?.name?.trim() ||
    user?.email?.split("@")?.[0] ||
    "Mitarbeiter";

  const roleLabel =
    ROLE_LABELS[user?.role] ||
    user?.role ||
    "Mitarbeiter";

  return (
    <main className="min-h-screen bg-slate-50/60">
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-32 sm:px-6 lg:px-8">
        {/* Kopfbereich */}
        <div className="mb-8 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
          <div className="relative overflow-hidden px-6 py-7 sm:px-8 sm:py-8">
            {/* dekorativer Hintergrund */}
            <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-sky-100/70 blur-3xl" />
            <div className="pointer-events-none absolute right-32 top-12 h-32 w-32 rounded-full bg-amber-100/50 blur-3xl" />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-lg shadow-sky-600/20">
                  <LayoutDashboard className="h-6 w-6" />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-700">
                    Admin Dashboard
                  </p>

                  <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                    Verwaltung & Steuerung
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                    Verwalte Unterkünfte, Preise, Bilder,
                    Verfügbarkeiten und weitere Inhalte von Urlaub GOSCH.
                  </p>
                </div>
              </div>

              {/* eingeloggter Benutzer */}
              <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="max-w-52 truncate text-sm font-bold text-slate-900">
                      {displayName}
                    </p>

                    <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-700">
                      {roleLabel}
                    </span>
                  </div>

                  <p className="mt-0.5 max-w-64 truncate text-xs text-slate-500">
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bereichsüberschrift */}
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Verwaltungsbereiche
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Wähle den Bereich aus, den du bearbeiten möchtest.
            </p>
          </div>

          <div className="hidden rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 sm:block">
            {items.length} Bereiche
          </div>
        </div>

        {/* Karten */}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="
                  group relative flex min-h-52 flex-col
                  overflow-hidden rounded-3xl
                  border border-slate-200/90
                  bg-white p-6
                  shadow-sm
                  transition-all duration-300
                  hover:-translate-y-1
                  hover:border-sky-200
                  hover:shadow-xl
                  hover:shadow-slate-200/60
                "
              >
                {/* subtiler Hover-Hintergrund */}
                <div
                  className="
                    pointer-events-none absolute
                    -right-16 -top-16
                    h-40 w-40 rounded-full
                    bg-sky-50 opacity-0 blur-2xl
                    transition-opacity duration-300
                    group-hover:opacity-100
                  "
                />

                <div className="relative flex items-start justify-between">
                  <div
                    className="
                      flex h-12 w-12
                      items-center justify-center
                      rounded-2xl
                      bg-sky-50 text-sky-700
                      ring-1 ring-sky-100
                      transition-all duration-300
                      group-hover:bg-sky-600
                      group-hover:text-white
                      group-hover:shadow-lg
                      group-hover:shadow-sky-600/20
                    "
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div
                    className="
                      flex h-9 w-9
                      items-center justify-center
                      rounded-full
                      border border-slate-200
                      bg-white text-slate-400
                      transition-all duration-300
                      group-hover:border-sky-200
                      group-hover:bg-sky-50
                      group-hover:text-sky-700
                    "
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </div>

                <div className="relative mt-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">
                      {item.title}
                    </h3>

                    {item.protected && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                        Superadmin
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {item.desc}
                  </p>
                </div>

                <div className="relative mt-auto pt-5">
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700">
                    Öffnen
                    <ArrowUpRight
                      className="
                        h-3.5 w-3.5
                        transition-transform duration-300
                        group-hover:translate-x-0.5
                        group-hover:-translate-y-0.5
                      "
                    />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Sicherheitshinweis */}
        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <ShieldCheck className="h-4 w-4" />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-800">
              Geschützter Verwaltungsbereich
            </p>

            <p className="mt-0.5 text-xs leading-5 text-slate-500">
              Dein Zugriff wird anhand deines persönlichen Kontos und
              deiner hinterlegten Rolle gesteuert.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}