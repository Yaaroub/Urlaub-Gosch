import { logError } from "@/lib/safe-log";

export const dynamic = "force-dynamic";

function pick(obj, keys) {
  const out = {};
  for (const k of keys) out[k] = obj[k];
  return out;
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const lat = Number(url.searchParams.get("lat"));
    const lon = Number(url.searchParams.get("lon"));
    // Only the holiday region (Northern Germany / Baltic coast) is needed. This keeps
    // the endpoint from being used as an open proxy for arbitrary coordinates.
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < 47 || lat > 56 || lon < 5 || lon > 16) {
      return Response.json({ error: "lat/lon fehlen oder ungültig" }, { status: 400 });
    }
    // Rounded to ~1 km so the upstream cache is shared between nearby requests.
    const latR = Math.round(lat * 100) / 100;
    const lonR = Math.round(lon * 100) / 100;

    const api = new URL("https://api.open-meteo.com/v1/forecast");
    api.searchParams.set("latitude", String(latR));
    api.searchParams.set("longitude", String(lonR));
    api.searchParams.set("current", "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day");
    api.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max");
    api.searchParams.set("timezone", "Europe/Berlin");

    const r = await fetch(api, { next: { revalidate: 600 }, signal: AbortSignal.timeout(8000) }); // 10 min
    if (!r.ok) throw new Error("weather upstream failed");
    const j = await r.json();

    return Response.json({
      current: j.current ? pick(j.current, ["temperature_2m","apparent_temperature","relative_humidity_2m","wind_speed_10m","weather_code","is_day","time"]) : null,
      daily: j.daily || null,
      latitude: j.latitude,
      longitude: j.longitude,
    });
  } catch (e) {
    logError("GET /api/weather failed", e);
    return Response.json({ error: "Wetter konnte nicht geladen werden" }, { status: 500 });
  }
}
