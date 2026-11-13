"use client";

import { useEffect, useMemo, useState } from "react";
import { Droplets, MapPin, Thermometer, Wind } from "lucide-react";

const PLACES = [
  { id: "holm", name: "Holm", latitude: 54.419, longitude: 10.424 },
  { id: "schoenberger-strand", name: "Schönberger Strand", latitude: 54.425, longitude: 10.413 },
  { id: "kiel", name: "Kiel", latitude: 54.323, longitude: 10.122 },
  { id: "hohwacht", name: "Hohwacht", latitude: 54.318, longitude: 10.668 },
  { id: "fehmarn", name: "Fehmarn", latitude: 54.468, longitude: 11.139 },
  { id: "scharbeutz", name: "Scharbeutz", latitude: 54.026, longitude: 10.754 },
  { id: "luebeck", name: "Lübeck", latitude: 53.866, longitude: 10.686 },
  { id: "flensburg", name: "Flensburg", latitude: 54.793, longitude: 9.446 },
];

/** WMO weather code -> visual kind + German label */
function getWeatherInfo(code) {
  if (code === 0) return { kind: "clear", label: "Klar" };
  if ([1, 2].includes(code)) return { kind: "partly", label: "Heiter" };
  if (code === 3) return { kind: "cloudy", label: "Bewölkt" };
  if ([45, 48].includes(code)) return { kind: "fog", label: "Nebel" };
  if ([51, 53, 55, 56, 57].includes(code)) return { kind: "drizzle", label: "Nieselregen" };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { kind: "rain", label: "Regen" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { kind: "snow", label: "Schnee" };
  if ([95, 96, 99].includes(code)) return { kind: "storm", label: "Gewitter" };
  return { kind: "cloudy", label: "Wechselhaft" };
}

function getTravelHint(temp, wind, kind) {
  if (kind === "storm") return "Heute lieber drinnen";
  if (kind === "rain" || kind === "drizzle") return "Regenjacke einpacken";
  if (wind >= 35) return "Sehr windig – Drachenwetter";
  if (temp >= 24) return "Strandwetter!";
  if (temp >= 18) return "Ideal für Ausflüge";
  if (temp >= 12) return "Jacke mitnehmen";
  return "Warm anziehen";
}

/** Sky colours per condition, separate for day and night. */
const SKIES = {
  clear: ["from-sky-400 via-sky-500 to-blue-600", "from-[#0b1736] via-[#132a5c] to-[#1f3f7a]"],
  partly: ["from-sky-400 via-sky-600 to-blue-700", "from-[#0b1736] via-[#16294f] to-[#26406b]"],
  cloudy: ["from-slate-400 via-slate-500 to-slate-600", "from-[#111827] via-[#1f2937] to-[#334155]"],
  fog: ["from-slate-300 via-slate-400 to-slate-500", "from-[#1f2937] via-[#334155] to-[#475569]"],
  drizzle: ["from-slate-500 via-sky-700 to-slate-700", "from-[#0f172a] via-[#1e293b] to-[#1e3a5f]"],
  rain: ["from-slate-600 via-sky-800 to-slate-800", "from-[#0b1120] via-[#13213a] to-[#1e2f4f]"],
  snow: ["from-sky-200 via-slate-300 to-slate-500", "from-[#1e293b] via-[#334155] to-[#475569]"],
  storm: ["from-slate-700 via-indigo-900 to-slate-900", "from-[#070b16] via-[#141a33] to-[#1e1b4b]"],
};

function formatDay(value, index) {
  if (index === 0) return "Heute";
  return new Intl.DateTimeFormat("de-DE", { weekday: "short" }).format(new Date(`${value}T12:00:00`));
}

/* ------------------------------------------------------------------ */
/* Animated scene (pure CSS/SVG, no extra library, respects reduced motion) */
/* ------------------------------------------------------------------ */

function Scene({ kind, isDay, wind }) {
  const drops = kind === "rain" || kind === "storm" ? 22 : kind === "drizzle" ? 12 : 0;
  const flakes = kind === "snow" ? 18 : 0;
  const clouds = ["partly", "cloudy", "drizzle", "rain", "storm", "snow"].includes(kind);

  return (
    <div className="wx-motion pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Sun or moon + stars */}
      {(kind === "clear" || kind === "partly") && isDay ? (
        <div className="absolute -right-10 -top-10 h-40 w-40">
          <div className="wx-spin absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,rgba(255,236,170,0.0),rgba(255,236,170,0.35),rgba(255,236,170,0.0),rgba(255,236,170,0.35),rgba(255,236,170,0.0),rgba(255,236,170,0.35),rgba(255,236,170,0.0))]" />
          <div className="wx-pulse absolute inset-10 rounded-full bg-amber-200/90 shadow-[0_0_60px_20px_rgba(253,224,71,0.45)]" />
        </div>
      ) : null}
      {!isDay ? (
        <>
          {Array.from({ length: 14 }).map((_, index) => (
            <span
              key={`star-${index}`}
              className="wx-twinkle absolute h-0.5 w-0.5 rounded-full bg-white"
              style={{
                left: `${(index * 37) % 100}%`,
                top: `${(index * 23) % 55}%`,
                animationDelay: `${(index % 7) * 0.6}s`,
              }}
            />
          ))}
          {kind === "clear" || kind === "partly" ? (
            <div className="absolute right-6 top-5 h-12 w-12 rounded-full bg-slate-100 shadow-[0_0_40px_8px_rgba(226,232,240,0.35)]">
              <div className="absolute -right-1 -top-1 h-11 w-11 rounded-full bg-[#132a5c]" />
            </div>
          ) : null}
        </>
      ) : null}

      {/* Drifting clouds */}
      {clouds ? (
        <>
          <Cloud className="wx-drift absolute -left-6 top-3 w-40 opacity-50" dark={kind === "storm" || kind === "rain"} />
          <Cloud className="wx-drift-slow absolute right-[-30px] top-10 w-48 opacity-40" dark={kind === "storm" || kind === "rain"} />
        </>
      ) : null}

      {/* Fog bands */}
      {kind === "fog"
        ? [0, 1, 2].map((index) => (
            <div
              key={`fog-${index}`}
              className="wx-drift absolute h-6 w-[140%] rounded-full bg-white/25 blur-md"
              style={{ top: `${25 + index * 22}%`, left: "-20%", animationDelay: `${index * 2}s` }}
            />
          ))
        : null}

      {/* Rain */}
      {Array.from({ length: drops }).map((_, index) => (
        <span
          key={`drop-${index}`}
          className="wx-fall absolute top-0 h-4 w-px bg-gradient-to-b from-transparent to-white/70"
          style={{
            left: `${(index * 47) % 100}%`,
            animationDuration: `${0.7 + (index % 5) * 0.12}s`,
            animationDelay: `${(index % 9) * 0.13}s`,
            transform: `rotate(${Math.min(20, wind / 3)}deg)`,
          }}
        />
      ))}

      {/* Snow */}
      {Array.from({ length: flakes }).map((_, index) => (
        <span
          key={`flake-${index}`}
          className="wx-snow absolute top-0 h-1.5 w-1.5 rounded-full bg-white/90"
          style={{
            left: `${(index * 53) % 100}%`,
            animationDuration: `${3 + (index % 4)}s`,
            animationDelay: `${(index % 6) * 0.5}s`,
          }}
        />
      ))}

      {/* Lightning */}
      {kind === "storm" ? <div className="wx-flash absolute inset-0 bg-white" /> : null}

      {/* Wind gusts */}
      {wind >= 20
        ? [0, 1].map((index) => (
            <span
              key={`gust-${index}`}
              className="wx-gust absolute h-px w-16 rounded-full bg-white/60"
              style={{ top: `${58 + index * 12}%`, animationDelay: `${index * 1.4}s`, animationDuration: `${Math.max(1.6, 4 - wind / 20)}s` }}
            />
          ))
        : null}

      {/* Sea at the bottom */}
      <svg className="absolute inset-x-0 bottom-0 h-10 w-[200%] text-white/10 wx-waves" viewBox="0 0 800 40" preserveAspectRatio="none">
        <path fill="currentColor" d="M0 20 Q 50 8 100 20 T 200 20 T 300 20 T 400 20 T 500 20 T 600 20 T 700 20 T 800 20 V40 H0 Z" />
      </svg>
    </div>
  );
}

function Cloud({ className = "", dark = false }) {
  return (
    <svg viewBox="0 0 120 50" className={className}>
      <path
        fill={dark ? "rgba(30,41,59,0.85)" : "rgba(255,255,255,0.9)"}
        d="M28 44c-11 0-20-7-20-16s9-15 19-15c3-8 11-13 21-13 12 0 22 8 23 19 2-1 5-1 7-1 11 0 20 7 20 13s-9 13-20 13z"
      />
    </svg>
  );
}

/** Small static icon for the forecast row. */
function MiniIcon({ kind }) {
  const sun = <circle cx="12" cy="12" r="4.5" fill="#fcd34d" />;
  const cloud = (fill = "#e2e8f0") => (
    <path fill={fill} d="M7 18a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.5A3.5 3.5 0 1 1 17.5 18z" />
  );
  return (
    <svg viewBox="0 0 24 24" className="mx-auto h-7 w-7" aria-hidden="true">
      {kind === "clear" ? sun : null}
      {kind === "partly" ? (
        <>
          <circle cx="9" cy="9" r="4" fill="#fcd34d" />
          {cloud()}
        </>
      ) : null}
      {["cloudy", "fog"].includes(kind) ? cloud(kind === "fog" ? "#cbd5e1" : "#e2e8f0") : null}
      {["drizzle", "rain", "storm", "snow"].includes(kind) ? (
        <g transform="translate(0,-3)">{cloud(kind === "storm" ? "#94a3b8" : "#e2e8f0")}</g>
      ) : null}
      {kind === "rain" || kind === "drizzle" ? (
        <path stroke="#7dd3fc" strokeWidth="1.6" strokeLinecap="round" d="M9 18l-1 3M13 18l-1 3M17 18l-1 3" />
      ) : null}
      {kind === "snow" ? <path stroke="#fff" strokeWidth="2" strokeLinecap="round" d="M9 19h.01M13 21h.01M16 19h.01" /> : null}
      {kind === "storm" ? <path fill="#fde047" d="M12 15l-2 5h2l-1 4 4-6h-2l1-3z" /> : null}
    </svg>
  );
}

function WeatherSkeleton() {
  return (
    <div className="w-full animate-pulse rounded-[1.4rem] bg-gradient-to-br from-sky-500 via-sky-600 to-blue-700 p-4 text-white">
      <div className="h-8 w-2/3 rounded-xl bg-white/20" />
      <div className="mt-5 h-24 rounded-2xl bg-white/15" />
      <div className="mt-4 h-24 rounded-2xl bg-white/15" />
    </div>
  );
}

export default function WeatherWidget({ initialPlaceId = "holm" }) {
  const safeInitialPlace = PLACES.some((place) => place.id === initialPlaceId) ? initialPlaceId : "holm";

  const [placeId, setPlaceId] = useState(safeInitialPlace);
  const [reloadKey, setReloadKey] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const place = useMemo(() => PLACES.find((item) => item.id === placeId) || PLACES[0], [placeId]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadWeather() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/weather?lat=${place.latitude}&lon=${place.longitude}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) throw new Error(`Wetterdienst antwortet mit ${response.status}.`);
        const payload = await response.json();
        if (!payload?.current || !payload?.daily?.time) throw new Error("Die Wetterdaten sind unvollständig.");
        setData(payload);
      } catch (requestError) {
        if (requestError?.name !== "AbortError") {
          console.error("WeatherWidget:", requestError);
          setError("Wetterdaten konnten gerade nicht geladen werden.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadWeather();
    return () => controller.abort();
  }, [place, reloadKey]);

  if (loading && !data) return <WeatherSkeleton />;

  if (error && !data) {
    return (
      <div className="w-full rounded-[1.4rem] bg-slate-950 p-5 text-white">
        <p className="text-sm font-bold">Wetter nicht verfügbar</p>
        <p className="mt-2 text-sm leading-6 text-slate-300">{error}</p>
        <button
          type="button"
          onClick={() => setReloadKey((key) => key + 1)}
          className="mt-4 min-h-11 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-950"
        >
          Erneut versuchen
        </button>
      </div>
    );
  }

  const current = data.current;
  const info = getWeatherInfo(Number(current.weather_code));
  const isDay = Number(current.is_day) !== 0;
  const temperature = Math.round(Number(current.temperature_2m));
  const feelsLike = Number.isFinite(Number(current.apparent_temperature)) ? Math.round(Number(current.apparent_temperature)) : null;
  const humidity = Number.isFinite(Number(current.relative_humidity_2m)) ? Math.round(Number(current.relative_humidity_2m)) : null;
  const wind = Math.round(Number(current.wind_speed_10m)) || 0;
  const forecastDays = data.daily.time.slice(0, 5);
  const sky = SKIES[info.kind]?.[isDay ? 0 : 1] || SKIES.cloudy[0];

  // Common scale for the min/max bars of the 5-day forecast.
  const mins = forecastDays.map((_, i) => Number(data.daily.temperature_2m_min[i]));
  const maxs = forecastDays.map((_, i) => Number(data.daily.temperature_2m_max[i]));
  const low = Math.min(...mins);
  const high = Math.max(...maxs);
  const span = Math.max(1, high - low);

  return (
    <section
      aria-label={`Wettervorhersage für ${place.name}`}
      className={`relative min-w-0 overflow-hidden rounded-[1.4rem] bg-gradient-to-br ${sky} text-white shadow-2xl shadow-sky-950/25 transition-colors duration-700`}
    >
      {/* Live scene: key restarts animations when the place/condition changes */}
      <div key={`${place.id}-${info.kind}-${isDay}`} className="wx-fade absolute inset-0">
        <Scene kind={info.kind} isDay={isDay} wind={wind} />
      </div>

      <div className="relative p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-black/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/90 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="wx-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Live
          </p>
          <label className="relative min-w-0">
            <span className="sr-only">Wetter-Ort auswählen</span>
            <MapPin className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/80" aria-hidden="true" />
            <select
              id="weather-place"
              name="weather-place"
              value={placeId}
              onChange={(event) => setPlaceId(event.target.value)}
              className="min-h-9 max-w-[150px] truncate rounded-full border border-white/25 bg-black/15 py-1.5 pl-7 pr-2 text-xs font-bold text-white outline-none backdrop-blur-md transition hover:bg-black/25 focus:ring-2 focus:ring-white/60"
            >
              {PLACES.map((item) => (
                <option key={item.id} value={item.id} className="text-slate-950">
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-6 flex items-end justify-between gap-3">
          <div>
            <p className="text-6xl font-black leading-none tracking-tight drop-shadow-sm tabular-nums">{temperature}°</p>
            <p className="mt-2 text-sm font-bold">{info.label}</p>
            <p className="text-xs text-white/80">{place.name} · {isDay ? "Tag" : "Nacht"}</p>
          </div>
          <p className="max-w-[45%] rounded-xl bg-black/15 px-3 py-2 text-right text-xs font-bold leading-4 backdrop-blur-sm">
            {getTravelHint(temperature, wind, info.kind)}
          </p>
        </div>

        <dl className="mt-4 grid grid-cols-3 gap-1.5 text-center">
          <Metric icon={Wind} label="Wind" value={`${wind} km/h`} />
          <Metric icon={Thermometer} label="Gefühlt" value={feelsLike != null ? `${feelsLike}°` : "–"} />
          <Metric icon={Droplets} label="Feuchte" value={humidity != null ? `${humidity} %` : "–"} />
        </dl>

        <ul className="mt-3 space-y-1 rounded-2xl bg-black/15 p-2.5 backdrop-blur-sm" aria-label="5-Tage-Vorhersage">
          {forecastDays.map((day, index) => {
            const dayInfo = getWeatherInfo(Number(data.daily.weather_code[index]));
            const rain = data.daily.precipitation_probability_max?.[index];
            const min = mins[index];
            const max = maxs[index];
            return (
              <li
                key={day}
                className="wx-rise grid grid-cols-[42px_28px_1fr] items-center gap-2 text-xs"
                style={{ animationDelay: `${index * 70}ms` }}
                title={`${dayInfo.label}${Number.isFinite(rain) ? `, ${rain} % Regenwahrscheinlichkeit` : ""}`}
              >
                <span className="font-bold">{formatDay(day, index)}</span>
                <MiniIcon kind={dayInfo.kind} />
                <span className="flex items-center gap-1.5 tabular-nums">
                  <span className="w-7 text-right text-white/75">{Math.round(min)}°</span>
                  <span className="relative h-1.5 flex-1 rounded-full bg-white/20">
                    <span
                      className="absolute inset-y-0 rounded-full bg-gradient-to-r from-sky-200 via-amber-200 to-orange-300"
                      style={{ left: `${((min - low) / span) * 100}%`, right: `${100 - ((max - low) / span) * 100}%` }}
                    />
                  </span>
                  <span className="w-7 font-bold">{Math.round(max)}°</span>
                </span>
              </li>
            );
          })}
        </ul>

        {error ? (
          <p className="mt-3 text-xs leading-5 text-amber-100" role="status">
            Aktualisierung fehlgeschlagen. Die zuletzt geladenen Werte bleiben sichtbar.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl bg-black/15 px-1.5 py-2 backdrop-blur-sm">
      <Icon className="mx-auto h-3.5 w-3.5 text-white/80" aria-hidden="true" />
      <dt className="mt-1 text-[9px] uppercase tracking-wide text-white/70">{label}</dt>
      <dd className="text-xs font-black">{value}</dd>
    </div>
  );
}
