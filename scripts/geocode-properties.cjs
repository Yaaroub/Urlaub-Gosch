const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function geocode(q) {
  const url =
    "https://nominatim.openstreetmap.org/search?" +
    new URLSearchParams({ q, format: "json", limit: "1" }).toString();

  const res = await fetch(url, {
    headers: { "User-Agent": "urlaub-gosch-geocoder" },
  });

  const json = await res.json();
  if (!json?.length) return null;

  return {
    lat: Number(json[0].lat),
    lng: Number(json[0].lon),
  };
}

async function main() {
  // import.json liegt im Projekt-Root
  const filePath = path.join(process.cwd(), "prisma/import.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

  console.log("Loaded entries:", data.length);

  let ok = 0;
  let fail = 0;

  for (const p of data) {
    const slug = p.slug;
    const address = p.address || p.location;

    if (!slug || !address) continue;

    // nur updaten, wenn in DB lat/lng noch fehlen (spart Calls)
    const existing = await prisma.property.findUnique({
      where: { slug },
      select: { id: true, lat: true, lng: true, title: true },
    });

    if (!existing) {
      console.log("⚠️ not found in DB:", slug);
      fail++;
      continue;
    }

    if (existing.lat != null && existing.lng != null) {
      // schon vorhanden
      continue;
    }

    const query = `${address}, Germany`;
    console.log("Geocoding:", slug, "->", query);

    const coords = await geocode(query);

    if (!coords) {
      console.log("❌ not found:", slug);
      fail++;
      await sleep(1100);
      continue;
    }

    await prisma.property.update({
      where: { slug },
      data: coords,
    });

    console.log("✅ saved:", slug, coords.lat, coords.lng);
    ok++;

    // Nominatim freundlich behandeln
    await sleep(1100);
  }

  console.log(`Done. Updated: ${ok}, Failed: ${fail}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
