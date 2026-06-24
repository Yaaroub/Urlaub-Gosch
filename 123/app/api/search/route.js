import prisma from "@/lib/db";
import { buildPropertyWhere, isDateStr } from "@/lib/search-utils";

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

  // Datumsvalidierung
  if ((arrival && !departure) || (!arrival && departure)) {
    return Response.json(
      { error: "arrival und departure müssen gemeinsam gesetzt sein." },
      { status: 400 }
    );
  }
  if (isDateStr(arrival) && isDateStr(departure)) {
    if (new Date(departure) <= new Date(arrival)) {
      return Response.json(
        { error: "departure muss nach arrival liegen." },
        { status: 400 }
      );
    }
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
      include: { amenities: true, pricePeriods: true },
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
        detail: err?.message ?? String(err),
      },
      { status: 503 }
    );
  }
}
