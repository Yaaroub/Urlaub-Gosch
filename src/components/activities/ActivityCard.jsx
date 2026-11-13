import Link from "next/link";
import { ArrowUpRight, CloudRain, MapPin, Sun } from "lucide-react";
import { GroupArtwork, getGroupVisual } from "@/components/activities/activity-visuals";

const WEATHER = {
  indoor: { label: "Drinnen", icon: CloudRain },
  "all-weather": { label: "Bei jedem Wetter", icon: CloudRain },
  outdoor: { label: "Draußen", icon: Sun },
};

/**
 * Activity card for overview and "nearby" lists. Works in server and client
 * components (no hooks). Expects a slim object from lib/activity-view.js.
 */
export default function ActivityCard({ activity, distanceKm = null, compact = false, style }) {
  const visual = getGroupVisual(activity.group);
  const weather = WEATHER[activity.weather];
  const WeatherIcon = weather?.icon;

  return (
    <article
      style={style}
      className="activity-card group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(15,23,42,0.12)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <GroupArtwork
        group={activity.group}
        className={compact ? "h-24" : "h-24 sm:h-32"}
        iconClassName={compact ? "h-8 w-8" : "h-10 w-10"}
      >
        <div className="absolute inset-x-4 bottom-3 flex items-end justify-between gap-2">
          <span className="rounded-full border border-white/25 bg-black/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-sm">
            {visual.label}
          </span>
          {distanceKm != null ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-slate-800 shadow-sm">
              <MapPin className="h-3 w-3" aria-hidden="true" />
              {Number(distanceKm).toFixed(1)} km
            </span>
          ) : null}
        </div>
      </GroupArtwork>

      <div className="flex flex-1 flex-col p-5">
        {activity.town ? (
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-sky-700">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="truncate">{activity.town}</span>
          </p>
        ) : null}

        <h3 className="mt-2 text-lg font-bold leading-snug tracking-tight text-slate-950">
          {/* The stretched link makes the whole card clickable while keeping one accessible link. */}
          <Link
            href={`/aktivitaeten/${activity.slug}`}
            className="outline-none after:absolute after:inset-0 after:rounded-[1.75rem] after:content-[''] focus-visible:after:ring-4 focus-visible:after:ring-sky-300/60"
          >
            {activity.title}
          </Link>
        </h3>

        {!compact && activity.shortDescription ? (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{activity.shortDescription}</p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <div className="flex flex-wrap gap-1.5">
            {activity.closed ? (
              <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 ring-1 ring-rose-200">
                Vorübergehend geschlossen
              </span>
            ) : weather ? (
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${visual.soft}`}>
                <WeatherIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {weather.label}
              </span>
            ) : null}
          </div>
          <span
            aria-hidden="true"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#07131f] text-white transition group-hover:bg-sky-700"
          >
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </article>
  );
}
