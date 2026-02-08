/* scripts/import-public-images.cjs */
const fs = require("node:fs");
const path = require("node:path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/**
 * CONFIG
 * - SLUG: property slug in DB
 * - FOLDER: folder inside /public/objects/<FOLDER>
 * - WIPE_EXISTING: true = delete existing images for that property first
 */
const SLUG = process.argv[2] || "dat-picok-huus";
const FOLDER = process.argv[3] || "Picok";
const WIPE_EXISTING = process.argv.includes("--wipe");

/** Allowed file extensions */
const exts = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"]);

/** small helper */
const clean = (s) => String(s || "").trim();

/**
 * Ranking by filename (best order for conversion)
 * You can tune this anytime.
 */
function rank(filenameLower) {
  // very first hero
  if (filenameLower.includes("start")) return 0;

  // overview / outside / aerial
  if (filenameLower.includes("luftbild") || filenameLower.includes("aerial") || filenameLower.includes("drohne")) return 1;
  if (filenameLower.includes("aussen") || filenameLower.includes("außen") || filenameLower.includes("front") || filenameLower.includes("haus")) return 2;

  // living area (most important)
  if (filenameLower.includes("wohn")) return 10;

  // dining
  if (filenameLower.includes("essen") || filenameLower.includes("dining")) return 20;

  // kitchen
  if (filenameLower.includes("küche") || filenameLower.includes("kueche")) return 30;

  // views / balcony / terrace / garden
  if (filenameLower.includes("blick")) return 40;
  if (filenameLower.includes("balkon")) return 45;
  if (filenameLower.includes("terrasse")) return 50;
  if (filenameLower.includes("garten")) return 55;

  // bathroom
  if (filenameLower.includes("bad")) return 60;

  // bedrooms
  if (filenameLower.includes("schlaf") || filenameLower.includes("bett") || filenameLower.includes("stockbett")) return 70;

  // parking / carport
  if (filenameLower.includes("carport") || filenameLower.includes("park") || filenameLower.includes("stellplatz")) return 80;

  // details (tv, stereo, etc.)
  if (filenameLower.includes("tv") || filenameLower.includes("stereo")) return 90;

  return 100;
}

function defaultAltFromFilename(file) {
  const base = file
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // remove "picok" prefix if present
  return base.replace(/^picok\s*/i, "").trim() || "Bild";
}

async function main() {
  const publicDir = path.join(process.cwd(), "public");
  const folderPath = path.join(publicDir, "objects", FOLDER);

  if (!fs.existsSync(folderPath)) {
    throw new Error(`Folder not found: ${folderPath}`);
  }

  const files = fs
    .readdirSync(folderPath)
    .filter((f) => exts.has(path.extname(f).toLowerCase()))
    .filter((f) => !f.startsWith(".")); // ignore hidden

  if (!files.length) {
    console.log("No image files found in:", folderPath);
    return;
  }

  // sort by rank + name
  const sorted = [...files].sort((a, b) => {
    const ra = rank(a.toLowerCase());
    const rb = rank(b.toLowerCase());
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b, "de");
  });

  console.log("Slug:", SLUG);
  console.log("Folder:", FOLDER);
  console.log("Found files:", sorted.length);

  // find property
  const property = await prisma.property.findUnique({
    where: { slug: SLUG },
    select: { id: true, title: true, slug: true },
  });

  if (!property) {
    throw new Error(`Property not found in DB for slug="${SLUG}"`);
  }

  if (WIPE_EXISTING) {
    // adjust model name if yours differs
    // assuming PropertyImage model exists and relation is propertyId
    const del = await prisma.propertyImage.deleteMany({
      where: { propertyId: property.id },
    });
    console.log("Deleted existing images:", del.count);
  }

  const rows = sorted.map((file, i) => ({
    propertyId: property.id,
    url: `/objects/${FOLDER}/${file}`,
    sort: i,
    alt: defaultAltFromFilename(file), // if your schema has alt; if not, remove this line
  }));

  // If your schema DOES NOT have "alt", comment it out above.
  // createMany ignores unknown fields? Prisma will error if field doesn't exist.

  // --- try createMany first ---
  try {
    const res = await prisma.propertyImage.createMany({
      data: rows,
      skipDuplicates: true, // in case you rerun
    });
    console.log("Inserted images:", res.count);
  } catch (e) {
    console.log("createMany failed. Trying per-row create... Reason:", e?.message || e);

    let ok = 0;
    for (const r of rows) {
      try {
        await prisma.propertyImage.create({ data: r });
        ok++;
      } catch (err) {
        console.log("Failed row:", r.url, err?.message || err);
      }
    }
    console.log("Inserted images (fallback):", ok);
  }

  console.log("Done ✅");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
