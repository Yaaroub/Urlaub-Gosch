"use client";

import { useEffect, useMemo, useState } from "react";

const PLACES = [
  { id: "holm", label: "Holm", lat: 54.41, lon: 10.33 },
  { id: "kiel", label: "Kiel", lat: 54.32, lon: 10.14 },
  { id: "flensburg", label: "Flensburg", lat: 54.78, lon: 9.44 },
];

const WMO = {
  0: { text: "Klar", icon: "☀️", mood: "sun" },
  1: { text: "Überwiegend klar", icon: "🌤️", mood: "sun" },
  2: { text: "Teilweise bewölkt", icon: "⛅", mood: "cloud" },
  3: { text: "Bewölkt", icon: "☁️", mood: "cloud" },
  45: { text: "Nebel", icon: "🌫️", mood: "fog" },
  48: { text: "Nebel", icon: "🌫️", mood: "fog" },
  51: { text: "Nieselregen", icon: "🌦️", mood: "rain" },
  53: { text: "Nieselregen", icon: "🌦️", mood: "rain" },
  55: { text: "Nieselregen", icon: "🌧️", mood: "rain" },
  61: { text: "Regen", icon: "🌧️", mood: "rain" },
  63: { text: "Regen", icon: "🌧️", mood: "rain" },
  65: { text: "Starker Regen", icon: "🌧️", mood: "rain" },
  71: { text: "Schnee", icon: "❄️", mood: "snow" },
  73: { text: "Schnee", icon: "❄️", mood: "snow" },
  75: { text: "Starker Schnee", icon: "❄️", mood: "snow" },
  80: { text: "Schauer", icon: "🌦️", mood: "rain" },
  81: { text: "Schauer", icon: "🌧️", mood: "rain" },
  82: { text: "Starke Schauer", icon: "⛈️", mood: "storm" },
  95: { text: "Gewitter", icon: "⛈️", mood: "storm" },
  96: { text: "Gewitter", icon: "⛈️", mood: "storm" },
  97: { text: "Gewitter", icon: "⛈️", mood: "storm" },
};

function weatherInfo(code) {
  return WMO[code] ?? { text: "Wetter", icon: "🌤️", mood: "cloud" };
}

function fmtDay(date) {
  return new Date(date).toLocaleDateString("de-DE", {
    weekday: "short",
  });
}

function fmtDate(date) {
  return new Date(date).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
  });
}

function moodClasses(mood) {
  switch (mood) {
    case "sun":
      return "from-sky-400 via-blue-500 to-cyan-600";
    case "rain":
      return "from-slate-700 via-blue-800 to-slate-950";
    case "storm":
      return "from-slate-900 via-indigo-950 to-black";
    case "snow":
      return "from-sky-200 via-blue-400 to-indigo-500";
    case "fog":
      return "from-slate-400 via-slate-600 to-slate-800";
    default:
      return "from-sky-600 via-blue-700 to-indigo-800";
  }
}

function getTravelHint(temp, wind, code) {
  const mood = weatherInfo(code).mood;

  if (mood === "storm") return "Lieber Indoor-Aktivitäten planen";
  if (mood === "rain") return "Regenjacke einpacken";
  if (wind >= 35) return "Windig – perfekt für frische Seeluft";
  if (temp >= 20) return "Sehr gut für Strand & Spaziergänge";
  if (temp >= 14) return "Angenehm für Ausflüge";
  return "Frisch – warme Kleidung empfohlen";
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="flex items-center justify-between">
        <div className="h-5 w-28 rounded-full bg-white/20" />
        <div className="h-8 w-24 rounded-xl bg-white/20" />
      </div>
      <div className="h-24 rounded-3xl bg-white/15" />
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-white/15" />
        ))}
      </div>
    </div>
  );
}

export default function WeatherWidget({ initialPlaceId = "holm" }) {
  const [placeId, setPlaceId] = useState(initialPlaceId);
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  const place = useMemo(
    () => PLACES.find((p) => p.id === placeId) ?? PLACES[0],
    [placeId]
  );

  useEffect(() => {
    let cancel = false;

    async function loadWeather() {
      setErr("");
      setData(null);

      try {
        const res = await fetch(
          `/api/weather?lat=${place.lat}&lon=${place.lon}`,
          { cache: "no-store" }
        );

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json?.error || "Fehler");
        }

        if (!cancel) setData(json);
      } catch {
        if (!cancel) setErr("Wetter konnte nicht geladen werden.");
      }
    }

    loadWeather();

    return () => {
      cancel = true;
    };
  }, [place.lat, place.lon]);

  const currentCode = data?.current?.weather_code;
  const info = weatherInfo(currentCode);
  const temp = data?.current?.temperature_2m;
  const wind = data?.current?.wind_speed_10m;

  return (
    <div
      className={`relative overflow-hidden rounded-[2rem] bg-gradient-to-br ${
        data ? moodClasses(info.mood) : "from-sky-600 via-blue-700 to-indigo-800"
      } p-5 text-white shadow-2xl shadow-sky-950/25`}
    >
      {/* Glow */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl" />

      <div className="relative">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">
              Live Wetter
            </p>
            <h3 className="mt-1 text-xl font-bold tracking-tight">
              Ostsee-Wetter
            </h3>
          </div>

          <select
            value={placeId}
            onChange={(e) => setPlaceId(e.target.value)}
            className="rounded-2xl border border-white/20 bg-white/15 px-3 py-2 text-xs font-bold text-white shadow-lg backdrop-blur-xl outline-none transition hover:bg-white/20 focus:ring-2 focus:ring-white/40"
          >
            {PLACES.map((p) => (
              <option key={p.id} value={p.id} className="text-slate-900">
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {err ? (
          <div className="rounded-3xl border border-white/20 bg-white/15 p-4 text-sm text-white backdrop-blur-xl">
            {err}
          </div>
        ) : !data ? (
          <Skeleton />
        ) : (
          <>
            {/* Main */}
            <div className="rounded-[1.5rem] border border-white/15 bg-white/15 p-4 shadow-xl backdrop-blur-xl">
              <div className="flex items-end justify-between gap-5">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-5xl drop-shadow-sm">{info.icon}</span>
                    <div>
                      <div className="text-5xl font-black tracking-tight">
                        {Math.round(temp)}°
                      </div>
                      <p className="mt-1 text-sm font-semibold text-white/85">
                        {info.text}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs text-white/65">Aktualisiert</p>
                  <p className="text-sm font-bold">
                    {new Date(data.current.time).toLocaleTimeString("de-DE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    Uhr
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-5 grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-white/12 px-3 py-2 ring-1 ring-white/10">
                  <p className="text-[11px] text-white/60">Wind</p>
                  <p className="mt-0.5 text-sm font-bold">
                    {Math.round(wind)} km/h
                  </p>
                </div>

                <div className="rounded-2xl bg-white/12 px-3 py-2 ring-1 ring-white/10">
                  <p className="text-[11px] text-white/60">Urlaubstipp</p>
                  <p className="mt-0.5 line-clamp-1 text-sm font-bold">
                    {getTravelHint(Math.round(temp), Math.round(wind), currentCode)}
                  </p>
                </div>
              </div>
            </div>

            {/* Forecast */}
            <div className="mt-4 grid grid-cols-5 gap-2">
              {data.daily.time.slice(0, 5).map((day, i) => {
                const dayInfo = weatherInfo(data.daily.weather_code[i]);

                return (
                  <div
                    key={day}
                    className="group rounded-2xl border border-white/15 bg-white/15 px-2 py-3 text-center shadow-sm backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/25 hover:shadow-lg"
                  >
                    <p className="text-[11px] font-bold text-white/80">
                      {fmtDay(day)}
                    </p>
                    <p className="text-[10px] text-white/55">{fmtDate(day)}</p>

                    <div className="my-2 text-2xl transition group-hover:scale-110">
                      {dayInfo.icon}
                    </div>

                    <p className="text-xs font-black">
                      {Math.round(data.daily.temperature_2m_max[i])}°
                    </p>
                    <p className="text-[11px] text-white/65">
                      {Math.round(data.daily.temperature_2m_min[i])}°
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/10 px-3 py-2 text-[11px] text-white/70 ring-1 ring-white/10">
              <span>{place.label}, Schleswig-Holstein</span>
              <span>Open-Meteo</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}