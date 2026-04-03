import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const ROOT = path.join(process.cwd(), "public", "objects");

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

function toPascalCaseFromSlug(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function slugToFolderCandidates(slug) {
  const parts = slug.split("-").filter(Boolean);

  const candidates = new Set();

  candidates.add(slug);
  candidates.add(slug.toLowerCase());
  candidates.add(toPascalCaseFromSlug(slug));

  if (parts.length > 1) {
    candidates.add(parts.join(""));
    candidates.add(parts.join("").toLowerCase());
    candidates.add(
      parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("")
    );
  }

  // Spezialfall für Dinge wie nt-1 -> Nt1 / nt1
  candidates.add(slug.replace(/-/g, ""));
  candidates.add(slug.replace(/-/g, "").toLowerCase());
  candidates.add(
    slug
      .split("-")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join("")
  );

  return [...candidates];
}
const FOLDER_ALIASES = {
    "buhne-22": "Buhne22",
    "meeresrausch": "Meeresrausch",
    "ostseelodge": "Ostseelodge",
    "villa-mare": "VillaMare",
    "villa-wendtorf": "VillaWendtorf",
    "wittdun": "Wittduen",
  };
  function normalize(str) {
    return str
      .toLowerCase()
      .replace(/ä/g, "ae")
      .replace(/ö/g, "oe")
      .replace(/ü/g, "ue")
      .replace(/ß/g, "ss")
      .replace(/[^a-z0-9]/g, "");
  }
  
  function findMatchingFolder(slug, folders) {
    const alias = FOLDER_ALIASES[slug];
    if (alias) {
      const exactAlias = folders.find(
        (f) => normalize(f) === normalize(alias)
      );
      if (exactAlias) return exactAlias;
    }
  
    const slugNorm = normalize(slug);
  
    for (const folder of folders) {
      const folderNorm = normalize(folder);
  
      if (folderNorm === slugNorm) return folder;
      if (folderNorm.includes(slugNorm) || slugNorm.includes(folderNorm)) {
        return folder;
      }
    }
  
    return null;
  }

function listImageFiles(folderPath) {
  return fs
    .readdirSync(folderPath, { withFileTypes: true })
    .filter((ent) => ent.isFile())
    .map((ent) => ent.name)
    .filter((file) => IMAGE_EXTS.has(path.extname(file).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, "de", { numeric: true }));
}

function toBlobUrl(folderName, fileName) {
  const parsed = path.parse(fileName);
  const webpName = `${parsed.name}.webp`;

  return `https://fxqx9btq7lmbaw4u.public.blob.vercel-storage.com/objects/${folderName}/${webpName}`;
}

async function main() {
  if (!fs.existsSync(ROOT)) {
    throw new Error(`Ordner nicht gefunden: ${ROOT}`);
  }

  const folders = fs
    .readdirSync(ROOT, { withFileTypes: true })
    .filter((ent) => ent.isDirectory())
    .map((ent) => ent.name);

  const properties = await prisma.property.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      images: {
        select: { id: true, url: true, sort: true },
        orderBy: { sort: "asc" },
      },
    },
    orderBy: { id: "asc" },
  });

  let fixed = 0;
  let skipped = 0;
  let notFound = 0;

  for (const property of properties) {
    if (property.images && property.images.length > 0) {
      skipped++;
      continue;
    }

    const folderName = findMatchingFolder(property.slug, folders);

    if (!folderName) {
      notFound++;
      console.log(`❌ Kein Ordner gefunden für ${property.slug} (${property.title})`);
      continue;
    }

    const folderPath = path.join(ROOT, folderName);
    const imageFiles = listImageFiles(folderPath);

    if (imageFiles.length === 0) {
      notFound++;
      console.log(`❌ Keine Bilder in Ordner ${folderName} für ${property.slug}`);
      continue;
    }

    const data = imageFiles.map((fileName, index) => ({
      url: toBlobUrl(folderName, fileName),
      alt: property.title,
      sort: index + 1,
      propertyId: property.id,
    }));

    await prisma.propertyImage.createMany({ data });

    fixed++;
    console.log(`✅ ${property.slug} <- ${folderName} (${imageFiles.length} Bilder)`);
  }

  console.log("\nFertig.");
  console.log("Gefixt:", fixed);
  console.log("Übersprungen (hatten schon Bilder):", skipped);
  console.log("Nicht gefunden:", notFound);

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});