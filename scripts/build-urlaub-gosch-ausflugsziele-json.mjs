// build-urlaub-gosch-ausflugsziele-json.mjs
// Erstellt eine JSON-Datei mit allen Ausflugszielen von urlaub-gosch.de,
// ohne Kategorie "Feriendomizil".
// Ausgabe: urlaub-gosch-ausflugsziele-wortgetreu.json

import fs from "node:fs/promises";

const MAIN_URL = "https://www.urlaub-gosch.de/ausflugsziele";
const BASE_URL = "https://www.urlaub-gosch.de";
const OUT_FILE = "urlaub-gosch-ausflugsziele-wortgetreu.json";

const CATEGORY_ORDER = [
  "Ausflug",
  "Information",
  "Einkaufen",
  "Restaurants",
  "Selbsterzeuger",
  "Gesundheit",
  "Historischer Platz",
  "Golf",
  "Museum",
  "Wassersport",
];

function decodeHtml(input = "") {
  return input
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'")
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function stripTags(html = "") {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h1|h2|h3|h4|tr)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\r/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/\n[ \t]+/g, "\n")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

function absUrl(href) {
  if (!href) return null;
  if (href.startsWith("http://") || href.startsWith("https://")) return href;
  if (href.startsWith("/")) return BASE_URL + href;
  return BASE_URL + "/" + href;
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 Urlaub-Gosch JSON Export Script",
      "accept": "text/html,application/xhtml+xml",
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} bei ${url}`);
  return await res.text();
}

function normalize(s = "") {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function extractMainLinks(html) {
  const links = [];
  const seen = new Set();
  const re = /<a\b[^>]*href=["']([^"']*\/ausflugsziel\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  let m;
  while ((m = re.exec(html))) {
    const href = absUrl(decodeHtml(m[1]));
    const title = stripTags(m[2]);
    if (!title || seen.has(href)) continue;
    seen.add(href);
    links.push({ title, url: href });
  }

  return links;
}

function categorizeLinks(allLinks) {
  const firstAusflugIndex = allLinks.findIndex((x) => x.title.includes("5-Seen-Fahrt"));
  const nonFeriendomizil = firstAusflugIndex >= 0 ? allLinks.slice(firstAusflugIndex) : allLinks;

  const knownStarts = [
    ["Ausflug", "5-Seen-Fahrt Bad Malente"],
    ["Information", "Aebtissinwisch am Nord-Ostsee-Kanal"],
    ["Einkaufen", "ALDI Nord Schönberg"],
    ["Restaurants", "Altes Probsteier Café Probsteierhagen"],
    ["Selbsterzeuger", "Angus-Hof in Stakendorf"],
    ["Gesundheit", "Augenarztpraxis Dr. med. Inge Stoltenberg Schönberg"],
    ["Historischer Platz", "Bräutigamseiche Dodauer Forst"],
    ["Golf", "Country-Golf-Club Hohwacht"],
    ["Museum", "Eiszeitmuseum in Lütjenburg"],
    ["Wassersport", "Schnellboottouren auf der Ostsee Baltic Pirates"],
  ];

  let current = null;

  return nonFeriendomizil
    .map((item) => {
      const start = knownStarts.find(([, title]) => normalize(item.title) === normalize(title));
      if (start) current = start[0];
      return { ...item, category: current || "Unbekannt" };
    })
    .filter((x) => x.category !== "Unbekannt");
}

function getMetaDescription(html) {
  const m =
    html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i) ||
    html.match(/<meta\s+content=["']([^"']*)["']\s+name=["']description["']/i);

  return m ? decodeHtml(m[1]).trim() : null;
}

function extractTitle(html, fallback) {
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1) return stripTags(h1[1]);

  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (title) {
    return stripTags(title[1]).replace(/\s*\|\s*Ostsee-Ferienhausvermietung.*$/i, "");
  }

  return fallback;
}

function extractEmails(text, html) {
  const emails = new Set();

  for (const m of html.matchAll(/mailto:([^"'?>\s]+)/gi)) {
    emails.add(decodeURIComponent(m[1]).replace(/\?.*$/, ""));
  }

  const plain = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];
  for (const e of plain) emails.add(e);

  return [...emails];
}

function extractPhones(text) {
  const phones = new Set();

  const patterns = [
    /(?:Telefon|Tel\.?|Fon|Phone)\s*[:.]?\s*([+()0-9][0-9\s./()\-]{5,})/gi,
    /(?:Fax)\s*[:.]?\s*([+()0-9][0-9\s./()\-]{5,})/gi,
  ];

  for (const re of patterns) {
    let m;
    while ((m = re.exec(text))) {
      phones.add(m[1].replace(/\s{2,}/g, " ").trim());
    }
  }

  return [...phones];
}

function extractWebsite(html) {
  const re = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;

  while ((m = re.exec(html))) {
    const href = decodeHtml(m[1]);

    if (href.startsWith("mailto:") || href.startsWith("tel:")) continue;
    if (href.includes("urlaub-gosch.de")) continue;
    if (href.startsWith("/") || href.startsWith("#")) continue;

    if (/^https?:\/\//i.test(href) || /^www\./i.test(href)) {
      return href.startsWith("www.") ? "https://" + href : href;
    }
  }

  return null;
}

function extractAddress(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const addressLines = [];

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];

    if (/\b\d{5}\b/.test(l)) {
      if (
        i > 0 &&
        !/^(Telefon|Tel\.|E-Mail|Email|Internet|www\.|http)/i.test(lines[i - 1])
      ) {
        addressLines.push(lines[i - 1]);
      }

      addressLines.push(l);
      break;
    }
  }

  return addressLines.length ? addressLines.join(", ") : null;
}

function extractOpeningHours(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  const hits = lines.filter((l) =>
    /(Öffnungszeiten|Geöffnet|Uhr|Mo\.|Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag|Saison|täglich)/i.test(l)
  );

  return hits.length ? hits.join("\n") : null;
}

function cleanDetailText(text, title) {
  const removeStarts = [
    "Direkt zum Inhalt",
    "Home",
    "Ferienhäuser",
    "Ferienwohnungen",
    "Die Region",
    "Über uns",
    "Kontakt",
    "Impressum",
    "Datenschutz",
    "Gästebuch",
    "Vermieterservice",
    "Suchformular",
    "Suche",
    "Last Minute",
    "Neue Objekte",
    "Urlaub mit Hund",
    "Urlaub mit Kindern",
    "Webcam Holm",
    "Webcam Brasilien",
    "Ausflugsziele",
  ];

  let lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  lines = lines.filter((l) => !removeStarts.includes(l));

  const titleIndex = lines.findIndex((l) => normalize(l) === normalize(title));
  if (titleIndex >= 0) lines = lines.slice(titleIndex + 1);

  const cutAt = lines.findIndex((l) =>
    /^(Zurück|Google Analytics|Unsere Allgemeinen Geschäftsbedingungen|Unser Haftungsausschluss)/i.test(l)
  );

  if (cutAt >= 0) lines = lines.slice(0, cutAt);

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim() || null;
}

function splitDescriptionAndNote(detailText) {
  if (!detailText) return { description: null, note: null };

  const lines = detailText.split("\n").map((l) => l.trim()).filter(Boolean);

  const contactIndex = lines.findIndex(
    (l) =>
      /^(Adresse|Telefon|Tel\.|Fax|E-Mail|Email|Internet|Web|www\.|http)/i.test(l) ||
      /\b\d{5}\b/.test(l)
  );

  if (contactIndex > 0) {
    return {
      description: lines.slice(0, contactIndex).join("\n").trim() || null,
      note: lines.slice(contactIndex).join("\n").trim() || null,
    };
  }

  return { description: detailText, note: null };
}

async function parseDetail(item, index, total) {
  const html = await fetchText(item.url);
  const text = stripTags(html);

  const title = extractTitle(html, item.title);
  const fullCleanText = cleanDetailText(text, title);
  const metaDescription = getMetaDescription(html);
  const { description, note } = splitDescriptionAndNote(fullCleanText);

  const emails = extractEmails(text, html);
  const phones = extractPhones(text);

  console.log(`[${index}/${total}] ${item.category}: ${title}`);

  return {
    title,
    category: item.category,
    description: description || metaDescription || null,
    address: extractAddress(text),
    phone: phones.length ? phones.join(" | ") : null,
    email: emails.length ? emails.join(" | ") : null,
    website: extractWebsite(html),
    openingHours: extractOpeningHours(text),
    note,
    sourceUrl: item.url,
  };
}

async function main() {
  console.log(`Lade Hauptseite: ${MAIN_URL}`);

  const mainHtml = await fetchText(MAIN_URL);
  const allLinks = extractMainLinks(mainHtml);

  if (!allLinks.length) {
    throw new Error("Keine /ausflugsziel/-Links gefunden. Seitenstruktur hat sich eventuell geändert.");
  }

  const items = categorizeLinks(allLinks);

  console.log(`Gefundene Einträge ohne Feriendomizil: ${items.length}`);

  const results = [];

  for (let i = 0; i < items.length; i++) {
    try {
      results.push(await parseDetail(items[i], i + 1, items.length));
      await new Promise((r) => setTimeout(r, 150));
    } catch (err) {
      console.warn(`FEHLER bei ${items[i].title}: ${err.message}`);

      results.push({
        title: items[i].title,
        category: items[i].category,
        description: null,
        address: null,
        phone: null,
        email: null,
        website: null,
        openingHours: null,
        note: `Fehler beim Auslesen: ${err.message}`,
        sourceUrl: items[i].url,
      });
    }
  }

  const data = {
    sourceMainUrl: MAIN_URL,
    excludedCategory: "Feriendomizil",
    count: results.length,
    generatedAt: new Date().toISOString(),
    items: results,
  };

  await fs.writeFile(OUT_FILE, JSON.stringify(data, null, 2), "utf8");

  console.log(`\nFertig: ${OUT_FILE}`);
  console.log(`Einträge: ${results.length}`);
}

main().catch((err) => {
  console.error("\nABBRUCH:", err);
  process.exit(1);
});
