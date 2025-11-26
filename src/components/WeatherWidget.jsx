"use client";
import { useEffect, useMemo, useState } from "react";

const PLACES = [
  { id: "holm", label: "Holm", lat: 54.41, lon: 10.33 },
  { id: "kiel", label: "Kiel", lat: 54.32, lon: 10.14 },
  { id: "flensburg", label: "Flensburg", lat: 54.78, lon: 9.44 },
];

const WMO = {
  0: "Klar",
  1: "Überwiegend klar",
  2: "Teilw. bewölkt",
  3: "Bewölkt",
  45: "Nebel",
  48: "Nebel/rei.",
  51: "Niesel",
  53: "Niesel",
  55: "Niesel",
  61: "Regen",
  63: "Regen",
  65: "Starker Regen",
  66: "Gefr. Regen",
  67: "Gefr. Regen",
  71: "Schnee",
  73: "Schnee",
  75: "Starker Schnee",
  77: "Schneekörner",
  80: "Schauer",
  81: "Schauer",
  82: "Starke Schauer",
  85: "Schneeschauer",
  86: "Schneeschauer",
  95: "Gewitter",
  96: "Gewitter/Hagel",
  97: "Gewitter/Hagel",
};

function codeToText(c) {
  return WMO[c] ?? "—";
}
function fmtDay(d) {
  return new Date(d).toLocaleDateString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

export default function WeatherWidget({ initialPlaceId = "holm" }) {
  const [placeId, setPlaceId] = useState(initialPlaceId);
  const place = useMemo(
    () => PLACES.find((p) => p.id === placeId) ?? PLACES[0],
    [placeId]
  );
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancel = false;
    (async () => {
      setErr("");
      setData(null);
      try {
        const r = await fetch(
          `/api/weather?lat=${place.lat}&lon=${place.lon}`,
          { cache: "no-store" }
        );
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || "Fehler");
        if (!cancel) setData(j);
      } catch (e) {
        if (!cancel) setErr("Wetter konnte nicht geladen werden.");
      }
    })();
    return () => {
      cancel = true;
    };
  }, [place.lat, place.lon]);

  return (
    <div className="space-y-3 text-sm text-slate-900">
      {/* Kopf mit Ort-Auswahl */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-slate-100 md:text-slate-200">
          Ort
        </span>
        <select
          value={placeId}
          onChange={(e) => setPlaceId(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white/95 px-3 py-1.5 text-xs text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
        >
          {PLACES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {err ? (
        <p className="text-xs text-rose-100 md:text-rose-600">{err}</p>
      ) : !data ? (
        <p className="text-xs text-slate-100 md:text-slate-500">Lade…</p>
      ) : (
        <>
          {/* Aktuell */}
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-3xl font-semibold text-white md:text-slate-900">
                {Math.round(data.current.temperature_2m)}°C
              </div>
              <div className="text-xs text-sky-100 md:text-slate-600">
                {codeToText(data.current.weather_code)} · Wind{" "}
                {Math.round(data.current.wind_speed_10m)} km/h
              </div>
            </div>
            <div className="text-right text-[11px] text-sky-100/90 md:text-slate-500">
              {new Date(data.current.time).toLocaleTimeString("de-DE", {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              Uhr
            </div>
          </div>

          {/* 5-Tage-Vorschau */}
          <div className="grid grid-cols-5 gap-2 text-center text-[11px]">
            {data.daily.time.slice(0, 5).map((t, i) => (
              <div
                key={t}
                className="flex flex-col items-center rounded-xl border border-sky-200/70 bg-white/90 px-2 py-2 text-slate-800 shadow-sm"
              >
                <div className="font-medium text-slate-700">
                  {fmtDay(t).split(",")[0]}
                </div>
                <div className="text-[10px] text-slate-500">
                  {fmtDay(t).split(",")[1]}
                </div>
                <div className="mt-1 text-xs font-semibold">
                  {Math.round(data.daily.temperature_2m_min[i])}° /{" "}
                  {Math.round(data.daily.temperature_2m_max[i])}°
                </div>
                <div className="mt-0.5 text-[10px] text-slate-500">
                  {codeToText(data.daily.weather_code[i])}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
