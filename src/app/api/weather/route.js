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
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return Response.json({ error: "lat/lon fehlen oder ungültig" }, { status: 400 });
    }

    const api = new URL("https://api.open-meteo.com/v1/forecast");
    api.searchParams.set("latitude", String(lat));
    api.searchParams.set("longitude", String(lon));
    api.searchParams.set("current", "temperature_2m,wind_speed_10m,weather_code");
    api.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,weather_code");
    api.searchParams.set("timezone", "Europe/Berlin");

    const r = await fetch(api, { next: { revalidate: 600 } }); // 10 min
    if (!r.ok) throw new Error("weather upstream failed");
    const j = await r.json();

    return Response.json({
      current: j.current ? pick(j.current, ["temperature_2m","wind_speed_10m","weather_code","time"]) : null,
      daily: j.daily || null,
      latitude: j.latitude,
      longitude: j.longitude,
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Wetter konnte nicht geladen werden" }, { status: 500 });
  }
}
