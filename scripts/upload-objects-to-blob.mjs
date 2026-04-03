import fs from "fs";
import path from "path";
import sharp from "sharp";
import { put } from "@vercel/blob";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ROOT = path.join(process.cwd(), "public", "objects");

function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

async function optimizeImage(absPath) {
  const input = fs.readFileSync(absPath);

  return await sharp(input)
    .rotate()
    .resize({
      width: 1920,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 78 })
    .toBuffer();
}

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("Missing BLOB_READ_WRITE_TOKEN in env");
  }

  if (!fs.existsSync(ROOT)) {
    throw new Error(`Folder not found: ${ROOT}`);
  }

  const files = walk(ROOT).filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return [".jpg", ".jpeg", ".png", ".webp"].includes(ext);
  });

  console.log("Files:", files.length);

  let uploaded = 0;
  let updated = 0;
  let failed = 0;

  for (const abs of files) {
    try {
      const rel = path
        .relative(path.join(process.cwd(), "public"), abs)
        .replace(/\\/g, "/");
      // Beispiel: objects/Achnasheen/1.jpg

      const parsed = path.parse(rel);
      const newRel = path.join(parsed.dir, `${parsed.name}.webp`).replace(/\\/g, "/");
      // Beispiel: objects/Achnasheen/1.webp

      const optimizedBuffer = await optimizeImage(abs);

      const blob = await put(newRel, optimizedBuffer, {
        access: "public",
        contentType: "image/webp",
        addRandomSuffix: false,
      });

      uploaded++;

      const oldUrl = "/" + rel;
      const res = await prisma.propertyImage.updateMany({
        where: { url: oldUrl },
        data: { url: blob.url },
      });

      if (res.count) updated += res.count;

      if (uploaded % 25 === 0) {
        console.log(`... uploaded ${uploaded}/${files.length}, updated ${updated}, failed ${failed}`);
      }
    } catch (error) {
      failed++;
      console.error(`Fehler bei Datei: ${abs}`);
      console.error(error.message);
    }
  }

  console.log("Done.");
  console.log("Uploaded:", uploaded);
  console.log("DB updated:", updated);
  console.log("Failed:", failed);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});