"use client";

import { useEffect, useMemo, useState } from "react";

const PLACES = [
  { id: "holm", name: "Holm", latitude: 54.419, longitude: 10.424 },
  {
    id: "schoenberger-strand",
    name: "Schönberger Strand",
    latitude: 54.425,
    longitude: 10.413,
  },
  { id: "kiel", name: "Kiel", latitude: 54.323, longitude: 10.122 },
  {
    id: "hohwacht",
    name: "Hohwacht",
    latitude: 54.318,
    longitude: 10.668,
  },
  {
    id: "fehmarn",
    name: "Fehmarn",
    latitude: 54.468,
    longitude: 11.139,
  },
  {
    id: "scharbeutz",
    name: "Scharbeutz",
    latitude: 54.026,
    longitude: 10.754,
  },
  {
    id: "luebeck",
    name: "Lübeck",
    latitude: 53.866,
    longitude: 10.686,
  },
  {
    id: "flensburg",
    name: "Flensburg",
    latitude: 54.793,
    longitude: 9.446,
  },
];

function getWeatherInfo(code) {
  if (code === 0) return { icon: "☀️", label: "Klar" };
  if ([1, 2].includes(code)) return { icon: "🌤️", label: "Heiter" };
  if (code === 3) return { icon: "☁️", label: "Bewölkt" };
  if ([45, 48].includes(code)) return { icon: "🌫️", label: "Nebel" };
  if ([51, 53, 55, 56, 57].includes(code)) {
    return { icon: "🌦️", label: "Nieselregen" };
  }
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return { icon: "🌧️", label: "Regen" };
  }
  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return { icon: "🌨️", label: "Schnee" };
  }
  if ([95, 96, 99].includes(code)) {
    return { icon: "⛈️", label: "Gewitter" };
  }

  return { icon: "🌥️", label: "Wechselhaft" };
}

function getTravelHint(temp, wind, code) {
  if ([95, 96, 99].includes(code)) return "Lieber drinnen";
  if ([61, 63, 65, 80, 81, 82].includes(code)) return "Regenjacke";
  if (wind >= 35) return "Sehr windig";
  if (temp >= 24) return "Strandwetter";
  if (temp >= 18) return "Sehr angenehm";
  if (temp >= 12) return "Jacke mitnehmen";
  return "Warm anziehen";
}

function formatDay(value) {
  return new Intl.DateTimeFormat("de-DE", { weekday: "short" }).format(
    new Date(`${value}T12:00:00`)
  );
}

function formatDate(value) {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(`${value}T12:00:00`));
}

function WeatherSkeleton() {
  return (
    <div className="w-full animate-pulse rounded-[1.4rem] bg-gradient-to-br from-sky-600 via-blue-700 to-indigo-800 p-4 text-white">
      <div className="h-10 rounded-xl bg-white/15" />
      <div className="mt-4 h-32 rounded-3xl bg-white/15" />
      <div className="mt-4 grid grid-cols-5 gap-1.5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-24 rounded-2xl bg-white/15" />
        ))}
      </div>
    </div>
  );
}

export default function WeatherWidget({ initialPlaceId = "holm" }) {
  const safeInitialPlace = PLACES.some((place) => place.id === initialPlaceId)
    ? initialPlaceId
    : "holm";

  const [placeId, setPlaceId] = useState(safeInitialPlace);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const place = useMemo(
    () => PLACES.find((item) => item.id === placeId) || PLACES[0],
    [placeId]
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadWeather() {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        latitude: String(place.latitude),
        longitude: String(place.longitude),
        current: "temperature_2m,weather_code,wind_speed_10m",
        daily:
          "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
        timezone: "auto",
        forecast_days: "5",
      });

      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
          {
            signal: controller.signal,
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(`Wetterdienst antwortet mit ${response.status}.`);
        }

        const payload = await response.json();

        if (!payload?.current || !payload?.daily?.time) {
          throw new Error("Die Wetterdaten sind unvollständig.");
        }

        setData(payload);
      } catch (requestError) {
        if (requestError?.name !== "AbortError") {
          console.error("WeatherWidget:", requestError);
          setError("Wetterdaten konnten gerade nicht geladen werden.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadWeather();
    return () => controller.abort();
  }, [place]);

  if (loading && !data) return <WeatherSkeleton />;

  if (error && !data) {
    return (
      <div className="w-full rounded-[1.4rem] bg-slate-950 p-5 text-white">
        <p className="text-sm font-bold">Wetter nicht verfügbar</p>
        <p className="mt-2 text-sm leading-6 text-slate-300">{error}</p>
        <button
          type="button"
          onClick={() => setPlaceId((current) => current)}
          className="mt-4 min-h-11 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-950"
        >
          Erneut versuchen
        </button>
      </div>
    );
  }

  const current = data.current;
  const currentInfo = getWeatherInfo(Number(current.weather_code));
  const temperature = Math.round(Number(current.temperature_2m));
  const wind = Math.round(Number(current.wind_speed_10m));
  const forecastDays = data.daily.time.slice(0, 5);

  return (
    <section
      aria-label={`Wettervorhersage für ${place.name}`}
      className="min-w-0 overflow-hidden rounded-[1.4rem] bg-gradient-to-br from-sky-600 via-blue-700 to-indigo-800 p-3.5 text-white shadow-2xl shadow-sky-950/20 sm:p-4"
    >
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(108px,132px)] items-start gap-2.5">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-100">
            Live Wetter
          </p>
          <h3 className="mt-1 text-lg font-black leading-tight sm:text-xl">
            Ostsee-Wetter
          </h3>
        </div>

        <div className="min-w-0">
          <label htmlFor="weather-place" className="sr-only">
            Wetter-Ort auswählen
          </label>
          <select
            id="weather-place"
            name="weather-place"
            value={placeId}
            onChange={(event) => setPlaceId(event.target.value)}
            className="min-h-11 w-full min-w-0 truncate rounded-2xl border border-white/20 bg-white/15 px-2.5 py-2 text-xs font-bold text-white shadow-lg outline-none backdrop-blur-xl transition hover:bg-white/20 focus:ring-2 focus:ring-white/50"
          >
            {PLACES.map((item) => (
              <option key={item.id} value={item.id} className="text-slate-950">
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 min-w-0 rounded-[1.55rem] bg-white/12 p-3.5 ring-1 ring-white/15 backdrop-blur-xl">
        <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
          <div className="text-4xl" aria-hidden="true">
            {currentInfo.icon}
          </div>

          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
            <div className="min-w-0">
              <p className="text-4xl font-black leading-none sm:text-5xl">
                {temperature}°
              </p>
              <p className="mt-1 truncate text-xs font-bold text-white/85">
                {currentInfo.label}
              </p>
            </div>

            <div className="pb-0.5 text-right">
              <p className="text-[9px] uppercase tracking-wide text-white/70">
                Aktualisiert
              </p>
              <p className="mt-0.5 text-xs font-bold">
                {new Intl.DateTimeFormat("de-DE", {
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(new Date(current.time))}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid min-w-0 grid-cols-2 gap-2">
          <div className="min-w-0 rounded-2xl bg-white/12 px-3 py-2.5 ring-1 ring-white/10">
            <p className="text-[10px] text-white/75">Wind</p>
            <p className="mt-0.5 truncate text-sm font-black">{wind} km/h</p>
          </div>

          <div className="min-w-0 rounded-2xl bg-white/12 px-3 py-2.5 ring-1 ring-white/10">
            <p className="text-[10px] text-white/75">Urlaubstipp</p>
            <p className="mt-0.5 truncate text-sm font-black">
              {getTravelHint(temperature, wind, Number(current.weather_code))}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid min-w-0 grid-cols-5 gap-1.5">
        {forecastDays.map((day, index) => {
          const info = getWeatherInfo(Number(data.daily.weather_code[index]));
          const rain = data.daily.precipitation_probability_max?.[index];

          return (
            <div
              key={day}
              className="group min-w-0 rounded-2xl bg-white/10 px-1 py-2.5 text-center ring-1 ring-white/10 transition hover:bg-white/15"
              title={`${info.label}${Number.isFinite(rain) ? `, ${rain}% Regenwahrscheinlichkeit` : ""}`}
            >
              <p className="truncate text-[10px] font-black text-white/90">
                {formatDay(day)}
              </p>
              <p className="mt-0.5 text-[9px] text-white/70">{formatDate(day)}</p>
              <div className="my-1.5 text-xl" aria-hidden="true">
                {info.icon}
              </div>
              <p className="text-[11px] font-black">
                {Math.round(Number(data.daily.temperature_2m_max[index]))}°
              </p>
              <p className="text-[10px] text-white/75">
                {Math.round(Number(data.daily.temperature_2m_min[index]))}°
              </p>
            </div>
          );
        })}
      </div>

      {error ? (
        <p className="mt-3 text-xs leading-5 text-amber-100" role="status">
          Aktualisierung fehlgeschlagen. Die zuletzt geladenen Werte bleiben sichtbar.
        </p>
      ) : null}
    </section>
  );
}