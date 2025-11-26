"use client";
import { useEffect, useMemo, useState } from "react";

const PLACES = [
  // grobe Koordinaten – gern anpassen
  { id: "holm", label: "Holm", lat: 54.41, lon: 10.33 },
  { id: "kiel", label: "Kiel", lat: 54.32, lon: 10.14 },
  { id: "flensburg", label: "Flensburg", lat: 54.78, lon: 9.44 },
];

const WMO = {
  0: "Klar",
  1: "Überwiegend klar", 2: "Teilw. bewölkt", 3: "Bewölkt",
  45: "Nebel", 48: "Nebel/rei.",
  51: "Niesel", 53: "Niesel", 55: "Niesel",
  61: "Regen", 63: "Regen", 65: "Starker Regen",
  66: "Gefr. Regen", 67: "Gefr. Regen",
  71: "Schnee", 73: "Schnee", 75: "Starker Schnee",
  77: "Schneekörner",
  80: "Schauer", 81: "Schauer", 82: "Starke Schauer",
  85: "Schneeschauer", 86: "Schneeschauer",
  95: "Gewitter", 96: "Gewitter/Hagel", 97: "Gewitter/Hagel",
};

function codeToText(c){ return WMO[c] ?? "—"; }
function fmtDay(d){ return new Date(d).toLocaleDateString("de-DE", { weekday:"short", day:"2-digit", month:"2-digit" }); }

export default function WeatherWidget({ initialPlaceId = "holm" }) {
  const [placeId, setPlaceId] = useState(initialPlaceId);
  const place = useMemo(() => PLACES.find(p => p.id === placeId) ?? PLACES[0], [placeId]);
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancel = false;
    (async () => {
      setErr(""); setData(null);
      try {
        const r = await fetch(`/api/weather?lat=${place.lat}&lon=${place.lon}`, { cache: "no-store" });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || "Fehler");
        if (!cancel) setData(j);
      } catch (e) {
        if (!cancel) setErr("Wetter konnte nicht geladen werden.");
      }
    })();
    return () => { cancel = true; };
  }, [place.lat, place.lon]);

  return (
    <div className="rounded-2xl bg-white ring-1 ring-black/5 shadow-sm p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="font-semibold">Wetter</h3>
        <select
          value={placeId}
          onChange={e=>setPlaceId(e.target.value)}
          className="border rounded-xl px-2 py-1 text-sm"
        >
          {PLACES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
      </div>

      {err ? (
        <p className="text-sm text-rose-600">{err}</p>
      ) : !data ? (
        <p className="text-sm text-slate-500">Lade…</p>
      ) : (
        <>
          {/* Aktuell */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-3xl font-semibold">
                {Math.round(data.current.temperature_2m)}°C
              </div>
              <div className="text-sm text-slate-600">
                {codeToText(data.current.weather_code)} · Wind {Math.round(data.current.wind_speed_10m)} km/h
              </div>
            </div>
            <div className="text-right text-xs text-slate-500">
              {new Date(data.current.time).toLocaleTimeString("de-DE", { hour:"2-digit", minute:"2-digit" })} Uhr
            </div>
          </div>

          {/* 5-Tage Vorschau */}
          <div className="grid grid-cols-5 gap-2 text-center">
            {data.daily.time.slice(0,5).map((t, i) => (
              <div key={t} className="rounded-xl bg-slate-50 p-2">
                <div className="text-xs text-slate-500 mb-1">{fmtDay(t)}</div>
                <div className="text-sm font-medium">
                  {Math.round(data.daily.temperature_2m_min[i])}° / {Math.round(data.daily.temperature_2m_max[i])}°
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
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
