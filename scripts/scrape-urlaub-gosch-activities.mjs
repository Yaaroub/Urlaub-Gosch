import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";

const BASE = "https://www.urlaub-gosch.de";
const INDEX_URL = `${BASE}/ausflugsziele`;

// Falls du Feriendomizile NICHT willst:
const EXCLUDE_CATEGORIES = new Set(["Feriendomizil"]);

// kleine Helpers
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clean = (s) => (s || "").replace(/\s+/g, " ").trim();
const slugify = (s) =>
  clean(s)
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 (scraper for own site integration)" },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return await res.text();
}

/**
 * Parse /ausflugsziele: Kategorien + Links
 * Erwartung: Kategorien stehen als Überschriften und darunter <a> Links.
 */
function parseIndex(html) {
  const $ = cheerio.load(html);

  // Heuristik: Überschriften (z.B. "Ausflug", "Restaurants") und nachfolgende Links.
  // Auf der Seite sind die Kategorien als "### Image Kategorie" gerendert, im HTML sind es meistens h3/h2 Blöcke.
  const result = [];
  let currentCategory = null;

  // Wir iterieren durch den Hauptcontent in Reihenfolge:
  const content = $("main, .region-content, #content, body").first();

  // Alle Elemente in Reihenfolge durchgehen:
  content.find("h2, h3, h4, a").each((_, el) => {
    const tag = el.tagName?.toLowerCase();
    if (tag === "h2" || tag === "h3" || tag === "h4") {
      const t = clean($(el).text());
      // Kategorie-Überschriften sind exakt die Kategorienamen
      const known = [
        "Feriendomizil",
        "Golf",
        "Wassersport",
        "Einkaufen",
        "Selbsterzeuger",
        "Restaurants",
        "Gesundheit",
        "Ausflug",
        "Historischer Platz",
        "Museum",
        "Information",
      ];
      if (known.includes(t)) currentCategory = t;
    }

    if (tag === "a" && currentCategory) {
      const href = $(el).attr("href");
      const title = clean($(el).text());
      if (!href || !title) return;

      const url = href.startsWith("http") ? href : `${BASE}${href}`;
      // nur Detailseiten unter /ausflugsziel/ oder relevante Seiten
      if (!url.includes("/ausflugsziel/")) return;

      result.push({ category: currentCategory, title, url });
    }
  });

  // Duplikate entfernen
  const seen = new Set();
  return result.filter((it) => {
    const key = `${it.category}||${it.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseDetail(html, fallbackTitle) {
  const $ = cheerio.load(html);

  const title = clean($("h1").first().text()) || fallbackTitle;

  // Fließtext: alles zwischen h1 und "Adresse:"-Block
  // (Wir nehmen die ersten relevanten Absätze im Content)
  const main = $("main, .region-content, #content, body").first();
  const paragraphs = [];
  main.find("p").each((_, p) => {
    const t = clean($(p).text());
    if (!t) return;
    // Hausfinder etc. ignorieren
    if (t.toLowerCase().includes("hausfinder")) return;
    paragraphs.push(t);
  });

  // Adresse/Telefon/Email/Link stehen oft als Text "Adresse:" etc.
  const textAll = clean(main.text());

  const pickField = (label) => {
    // sehr robuste Heuristik: "Label: value"
    const idx = textAll.indexOf(label);
    if (idx === -1) return "";
    const chunk = textAll.slice(idx + label.length);
    // bis zum nächsten bekannten Label
    const stopLabels = ["Telefon:", "E-Mail:", "Link:", "Adresse:"];
    let end = chunk.length;
    for (const s of stopLabels) {
      const j = chunk.indexOf(s);
      if (j !== -1) end = Math.min(end, j);
    }
    return clean(chunk.slice(0, end));
  };

  const address = pickField("Adresse:");
  const phone = pickField("Telefon:");
  const email = pickField("E-Mail:");

  // Website-Link: erster externen Link im "Link:" Bereich
  let website = "";
  main.find('a[href^="http"]').each((_, a) => {
    const href = $(a).attr("href");
    const t = clean($(a).text());
    // Skip FB etc., nimm den “richtigen” Link
    if (!href) return;
    if (href.includes("facebook.com")) return;
    if (t.toLowerCase().includes("webcam")) return;
    website = href;
    return false;
  });

  const description = paragraphs[0] || "";
  const content = paragraphs.slice(0, 3).join("\n\n");

  return { title, description, content, address, phone, email, website };
}

async function main() {
  const indexHtml = await fetchHtml(INDEX_URL);
  let links = parseIndex(indexHtml);

  // Kategorie-Filter
  links = links.filter((x) => !EXCLUDE_CATEGORIES.has(x.category));

  console.log(`Found ${links.length} detail links (excluding: ${[...EXCLUDE_CATEGORIES].join(", ")})`);

  const out = [];
  let id = 1;

  for (const it of links) {
    try {
      const html = await fetchHtml(it.url);
      const detail = parseDetail(html, it.title);

      out.push({
        id: id++,
        slug: slugify(it.title),
        title: detail.title,
        category: it.category, // oder hier dein eigenes Mapping rein
        lat: null,
        lng: null,
        description: detail.description,
        content: detail.content,
        tips: [],
        website: detail.website || "",
        address: detail.address || "",
        phone: detail.phone || "",
        email: detail.email || "",
        image: "", // kannst du später ergänzen/zuordnen
        source: it.url,
      });

      // freundlich zum Server
      await sleep(250);
    } catch (e) {
      console.error("Failed:", it.url, e.message);
    }
  }

  const file = `// generated from ${INDEX_URL}\nexport const activities = ${JSON.stringify(out, null, 2)};\n`;
  const target = path.join(process.cwd(), "src/lib/activities.js");
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, file, "utf8");

  console.log("Wrote:", target);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
