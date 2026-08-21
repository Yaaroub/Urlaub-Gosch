"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplets,
  MapPin,
  MoonStar,
  Sparkles,
  Sun,
  ThermometerSun,
  Umbrella,
  Wind,
} from "lucide-react";

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

function getWeatherInfo(code, isDay = 1) {
  const night = Number(isDay) === 0;

  if (code === 0) {
    return night
      ? { label: "Klare Nacht", Icon: MoonStar }
      : { label: "Klar", Icon: Sun };
  }

  if ([1, 2].includes(code)) {
    return night
      ? { label: "Leicht bewölkt", Icon: CloudMoon }
      : { label: "Heiter", Icon: CloudSun };
  }

  if (code === 3) {
    return { label: "Bewölkt", Icon: Cloud };
  }

  if ([45, 48].includes(code)) {
    return { label: "Nebel", Icon: CloudFog };
  }

  if ([51, 53, 55, 56, 57].includes(code)) {
    return { label: "Nieselregen", Icon: CloudDrizzle };
  }

  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return { label: "Regen", Icon: CloudRain };
  }

  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return { label: "Schnee", Icon: CloudSnow };
  }

  if ([95, 96, 99].includes(code)) {
    return { label: "Gewitter", Icon: CloudLightning };
  }

  return {
    label: "Wechselhaft",
    Icon: night ? CloudMoon : CloudSun,
  };
}

function getTravelHint(temp, wind, code) {
  if ([95, 96, 99].includes(code)) return "Lieber drinnen";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return "Regenjacke";
  }
  if (wind >= 35) return "Sehr windig";
  if (temp >= 24) return "Strandwetter";
  if (temp >= 18) return "Sehr angenehm";
  if (temp >= 12) return "Jacke mitnehmen";
  return "Warm anziehen";
}

function formatDay(value) {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
  }).format(new Date(`${value}T12:00:00`));
}

function formatDate(value) {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(`${value}T12:00:00`));
}

function formatUpdated(value) {
  if (!value) return "–";

  return new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function WeatherSkeleton() {
  return (
    <div className="w-full overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
      <div className="animate-pulse">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="h-3 w-20 rounded-full bg-slate-200" />
            <div className="mt-2 h-6 w-36 rounded-lg bg-slate-200" />
          </div>
          <div className="h-10 w-10 rounded-2xl bg-slate-100" />
        </div>

        <div className="mt-4 flex gap-2 overflow-hidden">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-9 w-24 shrink-0 rounded-full bg-slate-100"
            />
          ))}
        </div>

        <div className="mt-4 h-48 rounded-[1.5rem] bg-slate-200" />

        <div className="mt-4 flex gap-2 overflow-hidden">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-24 w-20 shrink-0 rounded-2xl bg-slate-100"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function WeatherWidget({ initialPlaceId = "holm" }) {
  const safeInitialPlace = PLACES.some(
    (place) => place.id === initialPlaceId,
  )
    ? initialPlaceId
    : "holm";

  const [placeId, setPlaceId] = useState(safeInitialPlace);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retryKey, setRetryKey] = useState(0);

  const place = useMemo(
    () =>
      PLACES.find((item) => item.id === placeId) ||
      PLACES[0],
    [placeId],
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadWeather() {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        latitude: String(place.latitude),
        longitude: String(place.longitude),
        current:
          "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day",
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
          },
        );

        if (!response.ok) {
          throw new Error(
            `Wetterdienst antwortet mit ${response.status}.`,
          );
        }

        const payload = await response.json();

        if (!payload?.current || !payload?.daily?.time) {
          throw new Error(
            "Die Wetterdaten sind unvollständig.",
          );
        }

        setData(payload);
      } catch (requestError) {
        if (requestError?.name !== "AbortError") {
          console.error(
            "WeatherWidget:",
            requestError,
          );

          setError(
            "Wetterdaten konnten gerade nicht geladen werden.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadWeather();

    return () => controller.abort();
  }, [place, retryKey]);

  if (loading && !data) {
    return <WeatherSkeleton />;
  }

  if (error && !data) {
    return (
      <div className="w-full rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-50 text-sky-700">
          <Cloud className="h-6 w-6" />
        </div>

        <h3 className="mt-4 text-base font-black text-[#07131f]">
          Wetter nicht verfügbar
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          {error}
        </p>

        <button
          type="button"
          onClick={() =>
            setRetryKey((value) => value + 1)
          }
          className="mt-4 min-h-11 rounded-full bg-[#07131f] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
        >
          Erneut versuchen
        </button>
      </div>
    );
  }

  const current = data.current;

  const weatherCode = Number(current.weather_code);
  const isDay = Number(current.is_day);
  const isNight = isDay === 0;

  const currentInfo = getWeatherInfo(
    weatherCode,
    isDay,
  );

  const CurrentIcon = currentInfo.Icon;

  const temperature = Math.round(
    Number(current.temperature_2m),
  );

  const feelsLike = Math.round(
    Number(current.apparent_temperature),
  );

  const humidity = Math.round(
    Number(current.relative_humidity_2m),
  );

  const wind = Math.round(
    Number(current.wind_speed_10m),
  );

  const forecastDays = data.daily.time.slice(0, 5);

  return (
    <section
      aria-label={`Wettervorhersage für ${place.name}`}
      className="min-w-0"
    >
      <div
        className={[
          `
            relative
            min-w-0
            overflow-hidden
            rounded-[1.75rem]
            border
            p-3.5
            shadow-[0_22px_65px_rgba(15,23,42,0.16)]
            sm:p-4
          `,
          isNight
            ? `
                border-white/10
                bg-gradient-to-br
                from-[#08111f]
                via-[#102347]
                to-[#16466a]
                text-white
              `
            : `
                border-sky-300/25
                bg-gradient-to-br
                from-[#2496c9]
                via-[#1777ae]
                to-[#0b477b]
                text-white
              `,
        ].join(" ")}
      >
        {/* Atmosphäre */}

        <div
          aria-hidden="true"
          className={[
            `
              pointer-events-none
              absolute
              -right-20
              -top-24
              h-56
              w-56
              rounded-full
              blur-3xl
            `,
            isNight
              ? "bg-indigo-300/15"
              : "bg-white/20",
          ].join(" ")}
        />

        <div
          aria-hidden="true"
          className={[
            `
              pointer-events-none
              absolute
              -bottom-28
              -left-20
              h-56
              w-56
              rounded-full
              blur-3xl
            `,
            isNight
              ? "bg-sky-400/10"
              : "bg-cyan-200/15",
          ].join(" ")}
        />

        <div className="relative">
          {/* Kopf */}

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-white/85 backdrop-blur-xl">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
                </span>

                Live Wetter
              </div>

              <h3 className="mt-2 text-xl font-black leading-tight tracking-[-0.035em]">
                Ostsee-Wetter
              </h3>
            </div>

            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl">
              {isNight ? (
                <MoonStar className="h-5 w-5" />
              ) : (
                <Sparkles className="h-5 w-5" />
              )}
            </div>
          </div>

          {/* Orte – horizontal wischbar */}

          <div
            className="
              -mx-1
              mt-4
              flex
              snap-x
              snap-mandatory
              gap-1.5
              overflow-x-auto
              px-1
              pb-1

              [scrollbar-width:none]
              [&::-webkit-scrollbar]:hidden
            "
            aria-label="Wetter-Ort auswählen"
          >
            {PLACES.map((item) => {
              const selected =
                item.id === placeId;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    setPlaceId(item.id)
                  }
                  aria-pressed={selected}
                  className={[
                    `
                      snap-start
                      shrink-0
                      rounded-full
                      border
                      px-3
                      py-2
                      text-[11px]
                      font-bold
                      transition
                    `,
                    selected
                      ? `
                          border-white
                          bg-white
                          text-[#07131f]
                          shadow-[0_8px_24px_rgba(0,0,0,0.15)]
                        `
                      : `
                          border-white/15
                          bg-white/[0.08]
                          text-white/78
                          backdrop-blur-xl
                          hover:bg-white/15
                          hover:text-white
                        `,
                  ].join(" ")}
                >
                  {item.name}
                </button>
              );
            })}
          </div>

          {/* Hauptwetter */}

          <div className="mt-3 overflow-hidden rounded-[1.45rem] border border-white/15 bg-white/[0.10] p-3.5 backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/65">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />

                  <span className="truncate">
                    {place.name}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[1.15rem] border border-white/15 bg-white/10 shadow-inner">
                    <CurrentIcon className="h-8 w-8" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-end gap-1">
                      <strong className="text-[2.8rem] font-black leading-none tracking-[-0.065em]">
                        {temperature}
                      </strong>

                      <span className="pb-1 text-xl font-bold text-white/75">
                        °
                      </span>
                    </div>

                    <p className="mt-1 truncate text-xs font-bold text-white/85">
                      {currentInfo.label}
                    </p>
                  </div>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-white/70">
                  {isNight ? "Nacht" : "Tag"}
                </span>

                <p className="mt-3 text-[9px] uppercase tracking-[0.12em] text-white/45">
                  Aktualisiert
                </p>

                <p className="mt-0.5 text-xs font-bold text-white/85">
                  {formatUpdated(
                    current.time,
                  )}
                </p>
              </div>
            </div>

            {/* Werte */}

            <div className="mt-4 grid grid-cols-2 gap-2">
              <WeatherMetric
                icon={ThermometerSun}
                label="Gefühlt"
                value={`${feelsLike}°`}
              />

              <WeatherMetric
                icon={Wind}
                label="Wind"
                value={`${wind} km/h`}
              />

              <WeatherMetric
                icon={Droplets}
                label="Feuchte"
                value={`${humidity}%`}
              />

              <WeatherMetric
                icon={Sparkles}
                label="Urlaubstipp"
                value={getTravelHint(
                  temperature,
                  wind,
                  weatherCode,
                )}
                small
              />
            </div>
          </div>

          {/* Prognose */}

          <div className="mt-4 flex items-center justify-between gap-3 px-0.5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/55">
                Vorschau
              </p>

              <p className="mt-0.5 text-xs font-bold text-white/85">
                Die nächsten 5 Tage
              </p>
            </div>

            <Umbrella className="h-4 w-4 text-white/45" />
          </div>

          <div
            className="
              -mx-1
              mt-2.5
              flex
              snap-x
              snap-mandatory
              gap-2
              overflow-x-auto
              px-1
              pb-1

              [scrollbar-width:none]
              [&::-webkit-scrollbar]:hidden
            "
          >
            {forecastDays.map(
              (day, index) => {
                const info =
                  getWeatherInfo(
                    Number(
                      data.daily
                        .weather_code[index],
                    ),
                    1,
                  );

                const ForecastIcon =
                  info.Icon;

                const rain =
                  data.daily
                    .precipitation_probability_max?.[
                    index
                  ];

                const maxTemp =
                  Math.round(
                    Number(
                      data.daily
                        .temperature_2m_max[
                        index
                      ],
                    ),
                  );

                const minTemp =
                  Math.round(
                    Number(
                      data.daily
                        .temperature_2m_min[
                        index
                      ],
                    ),
                  );

                const today =
                  index === 0;

                return (
                  <div
                    key={day}
                    className={[
                      `
                        min-w-[74px]
                        flex-1
                        snap-start
                        rounded-[1.15rem]
                        border
                        px-2
                        py-2.5
                        text-center
                        backdrop-blur-xl
                        transition
                      `,
                      today
                        ? `
                            border-white/30
                            bg-white/[0.16]
                          `
                        : `
                            border-white/10
                            bg-white/[0.07]
                          `,
                    ].join(" ")}
                    title={`${info.label}${
                      Number.isFinite(
                        Number(rain),
                      )
                        ? `, ${rain}% Regenwahrscheinlichkeit`
                        : ""
                    }`}
                  >
                    <p className="truncate text-[10px] font-black text-white/90">
                      {today
                        ? "Heute"
                        : formatDay(day)}
                    </p>

                    <p className="mt-0.5 text-[8px] font-medium text-white/45">
                      {formatDate(day)}
                    </p>

                    <div className="my-2 flex justify-center">
                      <ForecastIcon className="h-5 w-5 text-white/90" />
                    </div>

                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-xs font-black">
                        {maxTemp}°
                      </span>

                      <span className="text-[9px] font-semibold text-white/50">
                        {minTemp}°
                      </span>
                    </div>

                    {Number.isFinite(
                      Number(rain),
                    ) ? (
                      <div className="mt-1.5 flex items-center justify-center gap-1 text-[8px] font-bold text-sky-100/75">
                        <Droplets className="h-2.5 w-2.5" />
                        {Math.round(
                          Number(rain),
                        )}
                        %
                      </div>
                    ) : null}
                  </div>
                );
              },
            )}
          </div>

          {loading && data ? (
            <p
              className="mt-3 text-center text-[10px] font-semibold text-white/55"
              role="status"
            >
              Wetter wird aktualisiert …
            </p>
          ) : null}

          {error && data ? (
            <p
              className="mt-3 rounded-xl border border-amber-200/15 bg-amber-100/10 px-3 py-2 text-[10px] leading-4 text-amber-50/85"
              role="status"
            >
              Aktualisierung fehlgeschlagen. Die zuletzt geladenen Werte bleiben sichtbar.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function WeatherMetric({
  icon: Icon,
  label,
  value,
  small = false,
}) {
  return (
    <div className="min-w-0 rounded-[1rem] border border-white/10 bg-black/[0.06] px-2.5 py-2.5">
      <div className="flex items-center gap-1.5 text-white/55">
        <Icon className="h-3.5 w-3.5 shrink-0" />

        <span className="truncate text-[9px] font-semibold">
          {label}
        </span>
      </div>

      <p
        className={[
          `
            mt-1
            truncate
            font-black
            text-white
          `,
          small
            ? "text-[11px]"
            : "text-sm",
        ].join(" ")}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}