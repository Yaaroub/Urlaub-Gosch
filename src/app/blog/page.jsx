import InspirationCard from "@/components/InspirationCard";
import InspirationExplorer from "@/components/InspirationExplorer";
import {
  inspirationArticles,
  inspirationCategories,
  inspirationSite,
} from "@/lib/inspiration";

export const metadata = {
  title: "Inspiration für deinen Ostseeurlaub | Urlaub Gosch",
  description:
    "Regionen, Ausflugsziele und Urlaubstipps rund um Probstei, Kieler Förde, Hohwacht und die Ostsee – kompakt und praktisch für deine Urlaubsplanung.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Ostsee-Inspiration: Regionen & Ausflugstipps | Urlaub Gosch",
    description:
      "Entdecke Küstenorte, Natur, Familienziele, Kultur und Ausflugstipps für deinen Urlaub an der Ostsee.",
    type: "website",
    url: `${inspirationSite.baseUrl}/blog`,
  },
};

export default function InspirationPage() {
  const featured = inspirationArticles.find((article) => article.slug === "schoenberger-strand") || inspirationArticles[0];
  const rest = inspirationArticles.filter((article) => article.slug !== featured.slug);

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Inspiration für den Ostseeurlaub",
    description: metadata.description,
    url: `${inspirationSite.baseUrl}/blog`,
    isPartOf: { "@type": "WebSite", name: inspirationSite.name, url: inspirationSite.baseUrl },
    hasPart: inspirationArticles.map((article) => ({
      "@type": "Article",
      headline: article.title,
      url: `${inspirationSite.baseUrl}/blog/${article.slug}`,
    })),
  };

  return (
    <main className="min-h-screen bg-[#f7fafc]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />

      <section className="bg-[#07131f] px-4 pb-20 pt-28 text-white sm:px-6 lg:px-8 lg:pb-24 lg:pt-32">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-4xl">
            <span className="inline-flex rounded-full bg-[#f4d59d] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#07131f]">
              Urlaub Gosch · Inspiration
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-7xl lg:leading-[1.02]">
              Mehr Ostsee erleben.
              <span className="block text-white/55">Regionen, Ausflüge & echte Urlaubsideen.</span>
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-7 text-white/70 sm:text-lg sm:leading-8">
              Entdecke Schönberger Strand, Probstei, Laboe, Hohwacht, Kiel und weitere Ziele in Schleswig-Holstein. Die Beiträge bündeln Ortswissen, Naturerlebnisse, Familienziele und praktische Ideen für deinen nächsten Urlaubstag.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-10 max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Empfohlener Beitrag">
        <InspirationCard article={featured} featured />
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-6 rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm md:grid-cols-3 md:p-8">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-700">Schnell verstehen</p>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">Klare Antworten statt Textwüste</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Jeder Beitrag beginnt mit einer kompakten Einordnung und den wichtigsten Punkten.</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-700">Regional planen</p>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">Orte sinnvoll verbinden</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Küstenorte, Natur und Ausflugsziele werden so beschrieben, dass sich daraus konkrete Urlaubstage planen lassen.</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-700">Aktuell bleiben</p>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">Variable Angaben bewusst prüfen</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Bei Preisen, Fahrplänen, Öffnungszeiten und Veranstaltungen führen Hinweise zu aktuellen Quellen.</p>
          </div>
        </div>
      </section>

      <InspirationExplorer articles={rest} categories={inspirationCategories} />
    </main>
  );
}
