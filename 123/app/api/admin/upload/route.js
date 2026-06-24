import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// Speicherort: /public/uploads
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function POST(req) {
  try {
    const form = await req.formData();
    // mehrere Files: name="files"
    const files = form.getAll("files");
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Keine Datei übergeben" }, { status: 400 });
    }

    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const out = [];
    for (const file of files) {
      if (typeof file === "string") continue;
      const buf = Buffer.from(await file.arrayBuffer());
      const ext = path.extname(file.name || "").toLowerCase() || ".bin";
      const base = path.basename(file.name || "upload", ext).replace(/[^\w\-]+/g, "_");
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}-${base}${ext}`;
      const dest = path.join(UPLOAD_DIR, filename);
      await fs.writeFile(dest, buf);
      out.push({ url: `/uploads/${filename}`, name: file.name || filename });
    }

    return NextResponse.json({ files: out }, { status: 201 });
  } catch (e) {
    console.error("UPLOAD ERROR:", e);
    return NextResponse.json({ error: "Upload fehlgeschlagen" }, { status: 500 });
  }
}
