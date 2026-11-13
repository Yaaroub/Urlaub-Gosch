import { activities } from "@/lib/activities";
import { countByGroup, isRainFriendly, toActivityCards } from "@/lib/activity-view";
import ActivitiesExploreClient from "@/components/ActivitiesExploreClient";
import { GROUP_VISUALS, VISIBLE_GROUPS } from "@/components/activities/activity-visuals";

export const metadata = {
  title: "Aktivitäten & Ausflugsziele an der Ostsee | Urlaub GOSCH",
  description:
    "Entdecke Ausflugsziele, Familienaktivitäten, Natur, Restaurants, Sport und Kultur rund um unsere Ferienunterkünfte an der Ostsee – mit Karte und Unterkünften in der Nähe.",
  alternates: { canonical: "/aktivitaeten" },
  robots: {
    index: true,
    follow: true,
  },
};

export const revalidate = 3600;

// Computed once per build/revalidation on the server; only slim data reaches the browser.
// Excursions first, everyday services (supermarkets, doctors …) at the end.
const cards = toActivityCards(activities).sort(
  (a, b) =>
    Number(a.group === "Service") - Number(b.group === "Service") ||
    a.title.localeCompare(b.title, "de")
);
const counts = countByGroup(cards);
const excursions = cards.filter((card) => card.group !== "Service");
const rainCount = excursions.filter(isRainFriendly).length;
const townCount = new Set(cards.map((card) => card.town).filter(Boolean)).size;

export default function ActivitiesPage() {
  return (
    <main className="min-h-screen bg-[#f7fafc] text-slate-950">
      <section className="relative overflow-hidden bg-[#07131f] px-4 pb-24 pt-28 text-white sm:px-6 lg:px-8 lg:pb-28 lg:pt-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(244,213,157,0.16),transparent_40%),radial-gradient(circle_at_10%_90%,rgba(42,159,214,0.18),transparent_45%)]"
        />
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full text-[#f7fafc]"
          viewBox="0 0 1440 96"
          preserveAspectRatio="none"
        >
          <path fill="currentColor" d="M0 64 C 240 20 420 96 720 60 S 1200 20 1440 52 V96 H0 Z" />
        </svg>

        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-end">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full bg-[#f4d59d] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#07131f]">
              Urlaub Gosch · Ausflugsziele
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl lg:leading-[1.04]">
              Ostsee erleben.
              <span className="block text-white/55">Ausflüge rund um deine Unterkunft.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/70 sm:text-lg sm:leading-8">
              Von Strandtagen und Familienparks über Museen bis zu Hofläden: {excursions.length} geprüfte
              Ausflugsziele in Probstei, Holsteinischer Schweiz, Kieler Förde und an der Küste –
              jeweils mit passenden Ferienunterkünften in der Nähe. Dazu Einkauf, Ärzte und
              Tourist-Infos für den Urlaubsalltag.
            </p>
          </div>

          <dl className="grid grid-cols-3 gap-3">
            <Stat value={excursions.length} label="Ausflugsziele" />
            <Stat value={rainCount} label="auch bei Regen" />
            <Stat value={townCount} label="Orte" />
          </dl>
        </div>

        <ul className="relative mx-auto mt-10 hidden max-w-7xl grid-cols-3 gap-3 md:grid xl:grid-cols-6" aria-label="Kategorien">
          {VISIBLE_GROUPS.map((group) => {
            const visual = GROUP_VISUALS[group];
            const Icon = visual.icon;
            return (
              <li
                key={group}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-sm"
              >
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${visual.gradient}`}>
                  <Icon className="h-5 w-5 text-white" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{visual.label}</span>
                  <span className="block text-xs text-white/50">{counts[group] || 0} Ziele</span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <ActivitiesExploreClient activities={cards} counts={counts} />
    </main>
  );
}

function Stat({ value, label }) {
  return (
    <div className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-5 text-center backdrop-blur-sm">
      <dt className="order-2 mt-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">{label}</dt>
      <dd className="text-3xl font-bold tracking-tight text-[#f4d59d] sm:text-4xl">{value}</dd>
    </div>
  );
}
