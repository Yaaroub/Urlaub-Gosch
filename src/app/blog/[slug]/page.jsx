import { notFound } from "next/navigation";
import InspirationArticle from "@/components/InspirationArticle";
import {
  getInspirationArticle,
  getRelatedArticles,
  inspirationArticles,
  inspirationSite,
} from "@/lib/inspiration";

export function generateStaticParams() {
  return inspirationArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = getInspirationArticle(slug);

  if (!article) return { title: "Beitrag nicht gefunden | Urlaub Gosch" };

  const url = `${inspirationSite.baseUrl}/blog/${article.slug}`;
  const images = article.heroImage ? [{ url: article.heroImage, alt: article.imageAlt || article.shortTitle }] : [];

  return {
    title: article.seoTitle,
    description: article.seoDescription,
    keywords: article.keywords,
    alternates: { canonical: `/blog/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.seoTitle,
      description: article.seoDescription,
      url,
      siteName: inspirationSite.name,
      images,
    },
    twitter: {
      card: article.heroImage ? "summary_large_image" : "summary",
      title: article.seoTitle,
      description: article.seoDescription,
      images: article.heroImage ? [article.heroImage] : [],
    },
  };
}

export default async function InspirationDetailPage({ params }) {
  const { slug } = await params;
  const article = getInspirationArticle(slug);
  if (!article) notFound();

  const related = getRelatedArticles(article);
  const url = `${inspirationSite.baseUrl}/blog/${article.slug}`;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.seoDescription,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    image: article.heroImage ? [`${inspirationSite.baseUrl}${article.heroImage}`] : undefined,
    datePublished: "2026-07-28",
    dateModified: "2026-08-11",
    author: { "@type": "Organization", name: inspirationSite.name },
    publisher: { "@type": "Organization", name: inspirationSite.name, url: inspirationSite.baseUrl },
    about: article.entities?.map((name) => ({ "@type": "Thing", name })),
    contentLocation: article.places?.map((name) => ({ "@type": "Place", name })),
    keywords: article.keywords?.join(", "),
    inLanguage: "de-DE",
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: inspirationSite.baseUrl },
      { "@type": "ListItem", position: 2, name: "Inspiration", item: `${inspirationSite.baseUrl}/blog` },
      { "@type": "ListItem", position: 3, name: article.shortTitle, item: url },
    ],
  };

  const faqJsonLd = article.faq?.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: article.faq.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      }
    : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}
      <InspirationArticle article={article} related={related} />
    </>
  );
}
