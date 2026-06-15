// src/app/regionen/[slug]/page.jsx

import { notFound } from "next/navigation";
import { regions } from "@/lib/regions";

export async function generateStaticParams() {
  return regions.map((region) => ({
    slug: region.slug,
  }));
}

export async function generateMetadata({ params }) {
  const region = regions.find((item) => item.slug === params.slug);

  if (!region) {
    return {
      title: "Region nicht gefunden",
    };
  }

  return {
    title: region.seoTitle,
    description: region.seoDescription,
    keywords: region.keywords,
    alternates: {
      canonical: `/regionen/${region.slug}`,
    },
    openGraph: {
      title: region.seoTitle,
      description: region.seoDescription,
      images: [region.image],
    },
  };
}

export default function RegionDetailPage({ params }) {
  const region = regions.find((item) => item.slug === params.slug);

  if (!region) notFound();

  return (
    <main className="bg-[#f7fafc]">
      <section className="mx-auto max-w-5xl px-4 py-16 md:py-24">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-sky-700">
          Ostsee Region
        </p>

        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">
          {region.title}
        </h1>

        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
          {region.description}
        </p>
      </section>
    </main>
  );
}