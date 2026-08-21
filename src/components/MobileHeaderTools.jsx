"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  MapPinned,
  Sun,
  Wind,
  X,
} from "lucide-react";

function getWeatherInfo(code) {
  if (code === 0) {
    return {
      label: "Klar",
      Icon: Sun,
    };
  }

  if ([1, 2].includes(code)) {
    return {
      label: "Heiter",
      Icon: CloudSun,
    };
  }

  if (code === 3) {
    return {
      label: "Bewölkt",
      Icon: Cloud,
    };
  }

  if ([45, 48].includes(code)) {
    return {
      label: "Nebel",
      Icon: CloudFog,
    };
  }

  if (
    [
      51, 53, 55,
      56, 57,
      61, 63, 65,
      66, 67,
      80, 81, 82,
    ].includes(code)
  ) {
    return {
      label: "Regen",
      Icon: CloudRain,
    };
  }

  if (
    [
      71, 73, 75,
      77, 85, 86,
    ].includes(code)
  ) {
    return {
      label: "Schnee",
      Icon: CloudSnow,
    };
  }

  if ([95, 96, 99].includes(code)) {
    return {
      label: "Gewitter",
      Icon: CloudLightning,
    };
  }

  return {
    label: "Wechselhaft",
    Icon: CloudSun,
  };
}

export default function MobileHeaderTools() {
  const [weather, setWeather] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [weatherOpen, setWeatherOpen] =
    useState(false);

  const weatherButtonRef =
    useRef(null);

  useEffect(() => {
    const controller =
      new AbortController();

    async function loadWeather() {
      try {
        const response =
          await fetch(
            "/api/weather?place=holm",
            {
              cache: "no-store",
              signal:
                controller.signal,
            },
          );

        if (!response.ok) {
          throw new Error(
            "Wetter nicht verfügbar",
          );
        }

        const data =
          await response.json();

        setWeather(data);
      } catch (error) {
        if (
          error?.name !==
          "AbortError"
        ) {
          setWeather(null);
        }
      } finally {
        if (
          !controller.signal
            .aborted
        ) {
          setLoading(false);
        }
      }
    }

    loadWeather();

    return () =>
      controller.abort();
  }, []);

  const current =
    weather?.current;

  const temperature =
    Number.isFinite(
      Number(
        current?.temperature_2m,
      ),
    )
      ? Math.round(
          Number(
            current.temperature_2m,
          ),
        )
      : null;

  const wind =
    Number.isFinite(
      Number(
        current?.wind_speed_10m,
      ),
    )
      ? Math.round(
          Number(
            current.wind_speed_10m,
          ),
        )
      : null;

  const weatherInfo =
    getWeatherInfo(
      Number(
        current?.weather_code,
      ),
    );

  const WeatherIcon =
    weatherInfo.Icon;

  return (
    <>
      <div
        className="
          flex
          items-center
          gap-1.5
          xl:hidden
        "
      >
        {/* WETTER */}
        <button
          ref={weatherButtonRef}
          type="button"
          onClick={() =>
            setWeatherOpen(
              (value) => !value,
            )
          }
          aria-label="Aktuelles Ostsee-Wetter anzeigen"
          aria-expanded={
            weatherOpen
          }
          className="
            inline-flex
            h-10
            items-center
            gap-1.5
            rounded-full
            border
            border-slate-200/80
            bg-white/90
            px-3
            text-slate-800
            shadow-sm
            backdrop-blur-xl
            transition

            hover:bg-white
            active:scale-[0.97]
          "
        >
          <WeatherIcon
            aria-hidden="true"
            className="
              h-[18px]
              w-[18px]
              text-sky-600
            "
          />

          <span
            className="
              min-w-[28px]
              text-sm
              font-bold
              tracking-tight
            "
          >
            {loading
              ? "…"
              : temperature !==
                  null
                ? `${temperature}°`
                : "–"}
          </span>
        </button>

        {/* AKTIVITÄTEN / MAP */}
        <Link
          href="/aktivitaeten"
          aria-label="Aktivitätenkarte öffnen"
          title="Aktivitäten"
          className="
            grid
            h-10
            w-10
            place-items-center
            rounded-full
            border
            border-slate-200/80
            bg-white/90
            text-slate-800
            shadow-sm
            backdrop-blur-xl
            transition

            hover:bg-white
            hover:text-sky-700
            active:scale-[0.97]
          "
        >
          <MapPinned
            aria-hidden="true"
            className="
              h-[19px]
              w-[19px]
            "
          />

          <span className="sr-only">
            Aktivitätenkarte
          </span>
        </Link>
      </div>

      {/* WETTER POPUP MOBILE */}
      {weatherOpen ? (
        <>
          <button
            type="button"
            aria-label="Wetter schließen"
            onClick={() =>
              setWeatherOpen(false)
            }
            className="
              fixed
              inset-0
              z-[80]
              bg-slate-950/20
              backdrop-blur-[2px]
              xl:hidden
            "
          />

          <section
            aria-label="Aktuelles Ostsee-Wetter"
            className="
              fixed
              left-3
              right-3
              top-[76px]
              z-[90]

              overflow-hidden
              rounded-[26px]

              border
              border-white/60

              bg-white/95

              p-5

              shadow-[0_25px_80px_rgba(15,23,42,0.22)]
              backdrop-blur-2xl

              sm:left-auto
              sm:right-4
              sm:w-[360px]

              xl:hidden
            "
          >
            <div
              className="
                flex
                items-start
                justify-between
                gap-4
              "
            >
              <div>
                <p
                  className="
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-[0.18em]
                    text-sky-700
                  "
                >
                  Ostsee aktuell
                </p>

                <h2
                  className="
                    mt-1
                    text-xl
                    font-bold
                    tracking-tight
                    text-slate-950
                  "
                >
                  Wetter in Holm
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setWeatherOpen(
                    false,
                  )
                }
                aria-label="Schließen"
                className="
                  grid
                  h-9
                  w-9
                  place-items-center
                  rounded-full
                  bg-slate-100
                  text-slate-600
                  transition
                  hover:bg-slate-200
                "
              >
                <X
                  className="
                    h-4
                    w-4
                  "
                />
              </button>
            </div>

            {weather ? (
              <div
                className="
                  mt-5
                  flex
                  items-center
                  gap-4
                  rounded-[20px]
                  bg-sky-50
                  p-4
                "
              >
                <div
                  className="
                    grid
                    h-14
                    w-14
                    shrink-0
                    place-items-center
                    rounded-2xl
                    bg-white
                    text-sky-600
                    shadow-sm
                  "
                >
                  <WeatherIcon
                    className="
                      h-7
                      w-7
                    "
                  />
                </div>

                <div
                  className="
                    min-w-0
                    flex-1
                  "
                >
                  <div
                    className="
                      flex
                      items-end
                      gap-2
                    "
                  >
                    <strong
                      className="
                        text-3xl
                        font-black
                        tracking-tight
                        text-slate-950
                      "
                    >
                      {temperature}°
                    </strong>

                    <span
                      className="
                        pb-1
                        text-sm
                        font-semibold
                        text-slate-500
                      "
                    >
                      {weatherInfo.label}
                    </span>
                  </div>

                  {wind !== null ? (
                    <div
                      className="
                        mt-1
                        flex
                        items-center
                        gap-1.5
                        text-xs
                        font-medium
                        text-slate-500
                      "
                    >
                      <Wind
                        className="
                          h-3.5
                          w-3.5
                        "
                      />

                      Wind {wind} km/h
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div
                className="
                  mt-5
                  rounded-2xl
                  bg-slate-50
                  p-4
                  text-sm
                  text-slate-500
                "
              >
                Wetterdaten sind
                momentan nicht
                verfügbar.
              </div>
            )}

            <Link
              href="/aktivitaeten"
              onClick={() =>
                setWeatherOpen(false)
              }
              className="
                mt-4
                flex
                min-h-12
                items-center
                justify-between
                rounded-2xl
                border
                border-slate-200
                px-4
                text-sm
                font-bold
                text-slate-800
                transition

                hover:border-sky-200
                hover:bg-sky-50
                hover:text-sky-800
              "
            >
              Aktivitäten entdecken

              <MapPinned
                className="
                  h-4
                  w-4
                "
              />
            </Link>
          </section>
        </>
      ) : null}
    </>
  );
}