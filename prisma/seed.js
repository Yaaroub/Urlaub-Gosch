// prisma/seed.js (clean, CommonJS)
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const CORE_AMENITIES = [
  "WLAN",
  "Sauna",
  "Kamin",
  "Meerblick",
  "Waschmaschine",
  "Eingezäuntes Grundstück", // ✅ nur diese (kein "Eingezäunt")
];

// Keyword-Erkennung NUR für Kern-Amenities (damit nicht “explodiert”)
const AMENITY_KEYWORDS = [
  { name: "WLAN", keys: ["wlan", "wifi", "wi-fi", "internet"] },
  { name: "Sauna", keys: ["sauna"] },
  { name: "Kamin", keys: ["kamin", "kaminofen", "offener kamin", "ofen"] },
  { name: "Meerblick", keys: ["meerblick", "blick aufs meer", "seeblick", "ostseeblick", "nordseeblick"] },
  { name: "Waschmaschine", keys: ["waschmaschine"] },
  { name: "Eingezäuntes Grundstück", keys: ["eingezäuntes grundstück", "eingezäunt"] },
];

function normalizeText(x) {
  return String(x || "").toLowerCase();
}

async function main() {
  // 1) Kern-Amenities sicher anlegen
  const coreRows = await Promise.all(
    CORE_AMENITIES.map((name) =>
      prisma.amenity.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );
  const amenityIdByName = new Map(coreRows.map((a) => [a.name, a.id]));

  // 2) JSON importieren (Properties + Bilder + address)
  const importPath = path.join(__dirname, "import.json");
  if (!fs.existsSync(importPath)) {
    console.log("ℹ️ prisma/import.json nicht gefunden – nur Kern-Amenities angelegt.");
    return;
  }

  const raw = fs.readFileSync(importPath, "utf8");
  const items = JSON.parse(raw);

  for (const p of items) {
    // Pflichtfelder absichern
    const slug = String(p.slug || "").trim();
    if (!slug) continue;

    const personsNum = Number(p.maxPersons ?? p.persons);
    const maxPersons = Number.isFinite(personsNum) && personsNum > 0 ? personsNum : 2;

    const title =
      typeof p.title === "string" && p.title.trim() ? p.title.trim() : slug;

    const description = p.description ?? null;

    const location =
      typeof p.location === "string" && p.location.trim() ? p.location.trim() : "Unbekannt";

    const address =
      typeof p.address === "string" && p.address.trim() ? p.address.trim() : null;

    // Bilder
    const imagesCreate = (p.images ?? []).map((img, idx) => ({
      url: img.url,
      alt: img.alt ?? null,
      sort: Number(img.sort ?? img.sortOrder ?? idx) || 0,
    }));

    // ✅ Amenities: NUR Kern-Amenities verbinden
    let amenityConnect = [];

    // Wenn JSON amenities hat → nur die, die zu Kernliste passen
    if (Array.isArray(p.amenities) && p.amenities.length) {
      const set = new Set(p.amenities.map((x) => String(x).trim()));
      amenityConnect = CORE_AMENITIES
        .filter((name) => set.has(name))
        .map((name) => ({ id: amenityIdByName.get(name) }))
        .filter((x) => x.id);
    } else {
      // sonst Keyword-Erkennung (auch nur Kern)
      const haystack = normalizeText(`${title} ${description ?? ""}`);
      amenityConnect = AMENITY_KEYWORDS
        .filter(({ keys }) => keys.some((k) => haystack.includes(k)))
        .map(({ name }) => ({ id: amenityIdByName.get(name) }))
        .filter((x) => x.id);
    }

    // Upsert Property
    await prisma.property.upsert({
      where: { slug },
      update: {
        title,
        description,
        location,
        address, // ✅ für Google Maps
        maxPersons,
        dogsAllowed: !!p.dogsAllowed,

        // nur connect (kein delete)
        amenities: amenityConnect.length ? { connect: amenityConnect } : undefined,
      },
      create: {
        slug,
        title,
        description,
        location,
        address, // ✅ für Google Maps
        maxPersons,
        dogsAllowed: !!p.dogsAllowed,

        amenities: amenityConnect.length ? { connect: amenityConnect } : undefined,
        images: imagesCreate.length ? { create: imagesCreate } : undefined,
      },
    });
  }

  console.log("✅ Seed clean fertig:", items.length, "Objekte importiert");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
