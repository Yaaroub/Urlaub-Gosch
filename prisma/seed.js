const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  /* ---------- Amenities ---------- */
  const amenityNames = [
    "WLAN",
    "Sauna",
    "Kamin",
    "Meerblick",
    "Waschmaschine",
    "Eingezäunt",
    "Eingezäuntes Grundstück"
  ];

  const amenities = await Promise.all(
    amenityNames.map((name) =>
      prisma.amenity.upsert({
        where: { name },
        update: {},
        create: { name }
      })
    )
  );

  /* ---------- Beispiel Property ---------- */
  await prisma.property.upsert({
    where: { slug: "meerblick" },
    update: {},
    create: {
      slug: "meerblick",
      title: "Wohnung Meerblick",
      description: "Helle Ferienwohnung mit Meerblick – 200m zum Strand.",
      location: "Holm",
      maxPersons: 4,
      dogsAllowed: true,

      amenities: {
        connect: amenities
          .filter(a => ["WLAN","Sauna","Meerblick"].includes(a.name))
          .map(a => ({ id: a.id }))
      },

      pricePeriods: {
        create: [
          {
            startDate: new Date("2025-10-01"),
            endDate: new Date("2025-10-31"),
            pricePerNight: 120
          },
          {
            startDate: new Date("2025-11-01"),
            endDate: new Date("2025-12-20"),
            pricePerNight: 95
          }
        ]
      }
    }
  });

/* ---------- JSON Import ---------- */
const fs = require("fs");
const path = require("path");

const AMENITY_KEYWORDS = [
  { name: "WLAN", keys: ["wlan", "wifi", "wi-fi", "internet"] },
  { name: "Sauna", keys: ["sauna"] },
  { name: "Kamin", keys: ["kamin", "kaminofen", "offener kamin"] },
  { name: "Meerblick", keys: ["meerblick", "blick aufs meer", "seeblick", "ostseeblick", "nordseeblick"] },
  { name: "Waschmaschine", keys: ["waschmaschine"] },
  { name: "Eingezäunt", keys: ["eingezäunt", "eingezäunte", "eingezäuntes"] },
];

const importPath = path.join(__dirname, "import.json");

if (fs.existsSync(importPath)) {
  const raw = fs.readFileSync(importPath, "utf8");
  const items = JSON.parse(raw);

  for (const p of items) {
    const personsNum = Number(p.maxPersons ?? p.persons);
    const maxPersons = Number.isFinite(personsNum) && personsNum > 0 ? personsNum : 2;

    const location =
      typeof p.location === "string" && p.location.trim() ? p.location.trim() : "Unbekannt";

    const title =
      typeof p.title === "string" && p.title.trim() ? p.title.trim() : p.slug;

    const description = p.description ?? null;

    // ---- amenities aus Text erkennen ----
    const haystack = `${title} ${description ?? ""}`.toLowerCase();

    const amenityIdsToConnect = AMENITY_KEYWORDS
      .filter(({ keys }) => keys.some((k) => haystack.includes(k)))
      .map(({ name }) => amenities.find((a) => a.name === name))
      .filter(Boolean)
      .map((a) => ({ id: a.id }));

    // ---- images mapping (dein Schema: sort) ----
    const imagesCreate = (p.images ?? []).map((img, idx) => ({
      url: img.url,
      alt: img.alt ?? null,
      sort: Number(img.sort ?? img.sortOrder ?? idx) || 0,
    }));

    await prisma.property.upsert({
      where: { slug: p.slug },
      update: {
        title,
        description,
        location,
        maxPersons,
        dogsAllowed: !!p.dogsAllowed,

        // nur connect (nichts löschen)
        amenities: amenityIdsToConnect.length ? { connect: amenityIdsToConnect } : undefined,
      },
      create: {
        slug: p.slug,
        title,
        description,
        location,
        maxPersons,
        dogsAllowed: !!p.dogsAllowed,

        amenities: amenityIdsToConnect.length ? { connect: amenityIdsToConnect } : undefined,
        images: imagesCreate.length ? { create: imagesCreate } : undefined,
      },
    });
  }

  console.log("✅ JSON Import inkl. Amenities fertig:", items.length, "Einträge");
}



  console.log("✅ Seed fertig");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
