import { publicPropertySelect } from "@/lib/public-property-select";
import prisma from "@/lib/db";
import { buildPropertyWhere, publicTravelWindow } from "@/lib/search-utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req) {
  let body = {};
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let {
    arrival,
    departure,
    location,
    persons,
    dogs,
    amenities = [], // erwartet keys: ["wlan","sauna"]
  } = body ?? {};

  // Normierungen
  if (typeof persons !== "undefined") persons = Number(persons) || 0;
  if (typeof dogs !== "undefined") {
    const s = String(dogs).toLowerCase();
    dogs =
      s === "true" || s === "1"
        ? true
        : s === "false" || s === "0"
        ? false
        : undefined;
  }

  amenities = Array.isArray(amenities)
    ? amenities.map((a) => String(a).toLowerCase())
    : typeof amenities === "string"
    ? [amenities.toLowerCase()]
    : [];

  if ((arrival || departure) && !publicTravelWindow(arrival, departure)) {
    return Response.json(
      { error: "Bitte wählen Sie einen gültigen zukünftigen Reisezeitraum." },
      { status: 400 }
    );
  }

  const where = buildPropertyWhere({
    arrival,
    departure,
    location,
    persons,
    dogs,
    amenities,
  });

  try {
    const results = await prisma.property.findMany({
      where,
      select: publicPropertySelect,
      orderBy: [{ location: "asc" }, { title: "asc" }],
    });

    return Response.json(
      { count: results.length, results },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    return Response.json(
      {
        error: "Database unavailable",
      },
      { status: 503 }
    );
  }
}
