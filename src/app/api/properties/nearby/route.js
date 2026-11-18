import { findNearbyProperties, parseNearbyParams } from "@/lib/nearby-properties";
import { logError } from "@/lib/safe-log";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const params = parseNearbyParams({
      lat: searchParams.get("lat"),
      lng: searchParams.get("lng"),
      radius: searchParams.get("radius"),
    });

    if (!params) {
      return Response.json({ error: "lat/lng/radius fehlen oder ungültig" }, { status: 400 });
    }

    return Response.json({ items: await findNearbyProperties(params) });
  } catch (e) {
    logError("nearby error:", e);
    return Response.json({ error: "nearby failed" }, { status: 500 });
  }
}
