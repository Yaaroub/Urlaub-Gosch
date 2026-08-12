import prisma from "@/lib/db";
import { activities } from "@/lib/activities";
import inspirationArticles from "@/lib/inspiration-articles.json";

export const dynamic = "force-dynamic";

const STATIC_PAGES = [
  {
    type: "page",
    title: "Angebote",
    description:
      "Aktuelle Angebote und Last-Minute-Angebote für Ferienunterkünfte.",
    href: "/offers",
    keywords:
      "angebote last minute rabatt günstig ferienwohnung ferienhaus urlaub",
  },
  {
    type: "page",
    title: "Regionen & Urlaubstipps",
    description:
      "Regionen, Ausflugstipps und Inspiration für deinen Urlaub entdecken.",
    href: "/blog",
    keywords:
      "region regionen blog inspiration ratgeber tipps ostsee nordsee urlaub",
  },
  {
    type: "page",
    title: "Über uns",
    description:
      "Mehr über Urlaub GOSCH und unseren Service erfahren.",
    href: "/about",
    keywords:
      "über uns urlaub gosch firma service vermietung",
  },
  {
    type: "page",
    title: "Kontakt",
    description:
      "Kontakt zu Urlaub GOSCH aufnehmen.",
    href: "/contact",
    keywords:
      "kontakt telefon email anfrage urlaub gosch",
  },
];

function normalize(value) {
  return String(value ?? "")
    .toLocaleLowerCase("de-DE")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function containsQuery(value, query) {
  return normalize(value).includes(query);
}

function makeText(...values) {
  return values
    .flat(Infinity)
    .filter(
      (value) =>
        value !== null &&
        value !== undefined &&
        value !== false
    )
    .map((value) => {
      if (typeof value === "object") {
        try {
          return JSON.stringify(value);
        } catch {
          return "";
        }
      }

      return String(value);
    })
    .join(" ");
}

function cleanDescription(value, maxLength = 150) {
  const text = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return "";

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trim()}…`;
}

function scoreResult(text, title, query) {
  const normalizedText = normalize(text);
  const normalizedTitle = normalize(title);

  let score = 0;

  if (normalizedTitle === query) {
    score += 100;
  }

  if (normalizedTitle.startsWith(query)) {
    score += 60;
  }

  if (normalizedTitle.includes(query)) {
    score += 40;
  }

  if (normalizedText.includes(query)) {
    score += 10;
  }

  return score;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const rawQuery = searchParams.get("q") ?? "";
    const query = normalize(rawQuery);

    if (query.length < 2) {
      return Response.json({
        query: rawQuery,
        items: [],
      });
    }

    /*
     * 1. UNTERKÜNFTE
     *
     * Die Datenbank wird bewusst nur im öffentlichen
     * Property-Bereich durchsucht.
     */
    const properties = await prisma.property.findMany({
      where: {
        OR: [
          {
            title: {
              contains: rawQuery,
              mode: "insensitive",
            },
          },
          {
            location: {
              contains: rawQuery,
              mode: "insensitive",
            },
          },
          {
            address: {
              contains: rawQuery,
              mode: "insensitive",
            },
          },
          {
            amenities: {
              some: {
                name: {
                  contains: rawQuery,
                  mode: "insensitive",
                },
              },
            },
          },
        ],
      },

      take: 12,

      select: {
        id: true,
        slug: true,
        title: true,
        location: true,
        address: true,

        amenities: {
          select: {
            name: true,
          },

          take: 8,
        },
      },
    });

    const propertyResults = properties
      .filter((property) => property.slug)
      .map((property) => {
        const text = makeText(
          property.title,
          property.location,
          property.address,
          property.amenities?.map((item) => item.name)
        );

        return {
          type: "property",
          title: property.title,
          location: property.location || "",
          description: cleanDescription(
            [
              property.address,
              property.amenities?.length
                ? property.amenities
                    .map((item) => item.name)
                    .join(", ")
                : "",
            ]
              .filter(Boolean)
              .join(" · ")
          ),
          href: `/properties/${property.slug}`,
          score: scoreResult(
            text,
            property.title,
            query
          ),
        };
      });

    /*
     * 2. AKTIVITÄTEN
     *
     * Hier durchsuchen wir bewusst praktisch den
     * gesamten Activity-Datensatz:
     * Titel, Ort, Adresse, Beschreibung, Kategorien,
     * Highlights, Tags usw.
     */
    const activityResults = activities
      .filter((activity) => {
        if (!activity?.slug) return false;

        const searchableText = makeText(activity);

        return containsQuery(searchableText, query);
      })
      .map((activity) => {
        const text = makeText(activity);

        return {
          type: "activity",
          title:
            activity.title ||
            activity.name ||
            "Aktivität",

          location:
            activity.city ||
            activity.location ||
            "",

          description: cleanDescription(
            activity.shortDescription ||
              activity.description ||
              activity.address ||
              "Ausflugsziel entdecken."
          ),

          href: `/aktivitaeten/${activity.slug}`,

          score: scoreResult(
            text,
            activity.title || activity.name,
            query
          ),
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);

    /*
     * 3. BLOG / REGIONEN / RATGEBER
     *
     * Da die Artikel als JSON vorliegen, kann wirklich
     * der gesamte Datensatz durchsucht werden:
     * Titel, Fließtext, FAQs, Orte, Kategorien,
     * Keywords usw.
     */
    const articleResults = (
      Array.isArray(inspirationArticles)
        ? inspirationArticles
        : []
    )
      .filter((article) => {
        if (!article?.slug) return false;

        return containsQuery(
          makeText(article),
          query
        );
      })
      .map((article) => {
        const title =
          article.title ||
          article.headline ||
          article.seoTitle ||
          "Urlaubstipp";

        const description =
          article.excerpt ||
          article.summary ||
          article.intro ||
          article.description ||
          article.shortAnswer ||
          "";

        const location =
          article.location ||
          article.region ||
          article.city ||
          "";

        return {
          type: "article",
          title,
          location:
            typeof location === "string"
              ? location
              : "",
          description:
            cleanDescription(description),
          href: `/blog/${article.slug}`,
          score: scoreResult(
            makeText(article),
            title,
            query
          ),
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);

    /*
     * 4. FESTE ÖFFENTLICHE SEITEN
     */
    const pageResults = STATIC_PAGES
      .filter((page) =>
        containsQuery(
          makeText(
            page.title,
            page.description,
            page.keywords
          ),
          query
        )
      )
      .map((page) => ({
        type: page.type,
        title: page.title,
        location: "",
        description: page.description,
        href: page.href,
        score: scoreResult(
          makeText(
            page.title,
            page.description,
            page.keywords
          ),
          page.title,
          query
        ),
      }));

    /*
     * Zusammenführen + sortieren.
     *
     * Gleiche URLs werden entfernt.
     */
    const seen = new Set();

    const items = [
      ...propertyResults,
      ...activityResults,
      ...articleResults,
      ...pageResults,
    ]
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }

        return a.title.localeCompare(
          b.title,
          "de",
          {
            sensitivity: "base",
          }
        );
      })
      .filter((item) => {
        if (!item.href || seen.has(item.href)) {
          return false;
        }

        seen.add(item.href);

        return true;
      })
      .slice(0, 25)
      .map(({ score, ...item }) => item);

    return Response.json(
      {
        query: rawQuery,
        count: items.length,
        items,
      },
      {
        headers: {
          "Cache-Control":
            "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error(
      "GET /api/site-search fehlgeschlagen:",
      error
    );

    return Response.json(
      {
        error: "Suche konnte nicht ausgeführt werden.",
        items: [],
      },
      {
        status: 500,
      }
    );
  }
}