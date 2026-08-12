import articles from "./inspiration-articles.json";

export const inspirationArticles = articles;

export const inspirationCategories = [
  "Alle",
  ...Array.from(new Set(articles.map((article) => article.category))),
];

export function getInspirationArticle(slug) {
  return articles.find((article) => article.slug === slug) ?? null;
}

export function getRelatedArticles(article, limit = 3) {
  if (!article) return [];

  const sameCategory = articles.filter(
    (candidate) =>
      candidate.slug !== article.slug && candidate.category === article.category
  );

  const samePlaces = articles.filter(
    (candidate) =>
      candidate.slug !== article.slug &&
      candidate.category !== article.category &&
      candidate.places?.some((place) => article.places?.includes(place))
  );

  return [...sameCategory, ...samePlaces]
    .filter(
      (candidate, index, list) =>
        list.findIndex((item) => item.slug === candidate.slug) === index
    )
    .slice(0, limit);
}

export const inspirationSite = {
  name: "Urlaub Gosch",
  baseUrl: "https://www.urlaub-gosch.de",
  sectionName: "Inspiration",
};
