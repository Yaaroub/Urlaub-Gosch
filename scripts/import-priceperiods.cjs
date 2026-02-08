// scripts/import-priceperiods.cjs
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const SLUG_MAP = {
  "det-lille-strandhus": "det-lille-strandhuus",
  "kleiner-eisbar": "kl-eisbar",
  "kleiner-schwede": "kl-schwede",
  "lottilund": "lottliund",
  "malepatus": "malepartus",
  "malibu": "mailbu",
  "meerjungfrau": "mjf",
  "meerlacheln-i": "ml-i",
  "meerlacheln-ii": "ml-ii",
  "mowenschiss": "mowneschiss",
  "picok-huus": "dat-picok-huus",
  "tuterbudel": "tuterbutel",
  // "achtern-diek" existiert NICHT in deiner DB -> bewusst nicht mappen
};

function addDays(date, days) {
  const d = new Date(date.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function parseRangeKey(key, year) {
  const s = String(key).replace(/\s+/g, " ").trim();

  const m =
    s.match(/(\d{1,2})\.(\d{1,2})\.\s*-\s*(\d{1,2})\.(\d{1,2})\./) ||
    s.match(/(\d{1,2})\.(\d{1,2})\s*-\s*(\d{1,2})\.(\d{1,2})/);

  if (!m) return null;

  const d1 = Number(m[1]),
    mo1 = Number(m[2]);
  const d2 = Number(m[3]),
    mo2 = Number(m[4]);

  const start = new Date(Date.UTC(year, mo1 - 1, d1));

  let endYear = year;
  const endIsEarlier = mo2 < mo1 || (mo2 === mo1 && d2 < d1);
  if (endIsEarlier) endYear = year + 1;

  const endInclusive = new Date(Date.UTC(endYear, mo2 - 1, d2));
  const endExclusive = addDays(endInclusive, 1);

  return { startDate: start, endDate: endExclusive };
}

function toMoneyString(v) {
  if (v == null) return null;
  const n = Number(String(v).replace(",", ".").trim());
  if (!Number.isFinite(n)) return null;
  return n.toFixed(2);
}

function slugifySimple(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ß/g, "ss")
    .replace(/\s+/g, "-");
}

async function main() {
  const file = process.argv[2];
  const wipe = process.argv.includes("--wipe");

  if (!file) {
    console.error(
      "Usage: node scripts/import-priceperiods.cjs prisma/hp-preise-YYYY.json [--wipe]"
    );
    process.exit(1);
  }

  const abs = path.resolve(process.cwd(), file);
  if (!fs.existsSync(abs)) throw new Error(`File not found: ${abs}`);

  const rows = JSON.parse(fs.readFileSync(abs, "utf-8"));

  let imported = 0;
  let missing = 0;
  let skipped = 0;

  for (const r of rows) {
    const year = Number(r.year);
    const rawSlug = (r.slug ? String(r.slug) : slugifySimple(r.name)).trim();
    const slug = SLUG_MAP[rawSlug] || rawSlug;
    
    if (slug !== rawSlug) {
      console.log(`🔁 slug mapped: ${rawSlug} -> ${slug}`);
    }
    
    if (!year || !slug) {
      skipped++;
      console.log("SKIP invalid row:", r);
      continue;
    }

    const property = await prisma.property.findUnique({
      where: { slug },
      select: { id: true, slug: true },
    });

    if (!property) {
      missing++;
      console.log("❌ Property not found (slug):", slug);
      continue;
    }

    if (wipe) {
      const yStart = new Date(Date.UTC(year, 0, 1));
      const yNext = new Date(Date.UTC(year + 1, 0, 1));
      await prisma.pricePeriod.deleteMany({
        where: {
          propertyId: property.id,
          startDate: { gte: yStart, lt: yNext },
        },
      });
    }

    const data = [];
    for (const [k, v] of Object.entries(r.prices || {})) {
      if (!/\d{1,2}\.\d{1,2}/.test(k)) continue; // skip ER etc.

      const range = parseRangeKey(k, year);
      if (!range) continue;

      const priceStr = toMoneyString(v);
      if (!priceStr) continue;

      data.push({
        propertyId: property.id,
        startDate: range.startDate,
        endDate: range.endDate,
        pricePerNight: priceStr, // Decimal als String ist ok
      });
    }

    if (!data.length) {
      console.log(`⚠️ No valid periods for ${slug} (${year})`);
      continue;
    }

    await prisma.pricePeriod.createMany({ data });
    imported++;
    console.log(`✅ ${slug} (${year}) -> ${data.length} periods`);
  }

  console.log("\nDone.");
  console.log("Imported properties:", imported);
  console.log("Missing slugs:", missing);
  console.log("Skipped rows:", skipped);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
