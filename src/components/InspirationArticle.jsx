import Image from "next/image";
import Link from "next/link";
import InspirationCard from "./InspirationCard";

function SourceLinks({ article }) {
  if (!article.officialSources?.length && !article.freshnessNote) return null;

  return (
    <aside className="mt-12 rounded-[2rem] border border-slate-200 bg-[#f7fafc] p-6 sm:p-8" aria-labelledby="sources-heading">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-700">Aktualität</p>
      <h2 id="sources-heading" className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
        Quellen & aktuelle Hinweise
      </h2>
      {article.freshnessNote && (
        <p className="mt-3 text-sm leading-6 text-slate-600">{article.freshnessNote}</p>
      )}
      {!!article.officialSources?.length && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {article.officialSources.map((source) => (
            <li key={source.url}>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
              >
                {source.label} ↗
              </a>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

export default function InspirationArticle({ article, related = [] }) {
  const hero = article.heroImage || article.images?.[0] || null;

  return (
    <main className="min-h-screen bg-[#f7fafc] text-slate-950">
      <section className="bg-[#07131f] px-4 pb-12 pt-28 text-white sm:px-6 lg:px-8 lg:pb-16 lg:pt-32">
        <div className="mx-auto max-w-7xl">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs font-medium text-white/60">
            <Link href="/" className="hover:text-white">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/blog" className="hover:text-white">Inspiration</Link>
            <span aria-hidden="true">/</span>
            <span className="text-white/90">{article.shortTitle}</span>
          </nav>

          <div className="mt-8 grid items-end gap-8 lg:grid-cols-[1fr_0.82fr] lg:gap-14">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[#f4d59d] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.17em] text-[#07131f]">
                  {article.category}
                </span>
                <span className="rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.17em] text-white/80">
                  {article.kicker}
                </span>
              </div>

              <h1 className="mt-5 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl lg:leading-[1.04]">
                {article.title}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-white/70 sm:text-lg sm:leading-8">
                {article.summary}
              </p>
            </div>

            {hero && (
              <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl shadow-black/20">
                <Image
                  src={hero}
                  alt={article.imageAlt || article.shortTitle}
                  fill
                  priority
                  sizes="(min-width: 1024px) 42vw, 100vw"
                  className="object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:px-8 lg:py-16">
        <article className="min-w-0 rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] sm:p-8 lg:p-10">
          <section className="rounded-[1.6rem] bg-[#f4d59d]/45 p-5 sm:p-6" aria-labelledby="quick-answer">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#75591f]">Kurz gesagt</p>
            <h2 id="quick-answer" className="sr-only">Kurzantwort</h2>
            <p className="mt-2 text-lg font-semibold leading-7 text-[#07131f]">{article.llmSummary}</p>
          </section>

          {!!article.facts?.length && (
            <section className="mt-10" aria-labelledby="facts-heading">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-700">Orientierung</p>
              <h2 id="facts-heading" className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Auf einen Blick</h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {article.facts.map((fact) => (
                  <li key={fact} className="rounded-2xl border border-slate-200 bg-[#f7fafc] px-4 py-4 text-sm font-medium leading-6 text-slate-700">
                    <span aria-hidden="true" className="mr-2 text-sky-700">✓</span>{fact}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="mt-12 space-y-12">
            {article.sections?.map((section) => (
              <section key={section.heading}>
                <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{section.heading}</h2>
                <div className="mt-4 space-y-4 text-[15px] leading-7 text-slate-700 sm:text-base sm:leading-8">
                  {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </div>
                {!!section.items?.length && (
                  <ul className="mt-5 space-y-3">
                    {section.items.map((item) => (
                      <li key={item} className="flex gap-3 text-[15px] leading-7 text-slate-700 sm:text-base">
                        <span aria-hidden="true" className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-sky-700" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          {article.images?.length > 1 && (
            <section className="mt-12" aria-labelledby="gallery-heading">
              <h2 id="gallery-heading" className="text-2xl font-bold tracking-tight text-slate-950">Eindrücke</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {article.images.slice(1).map((image, index) => (
                  <div key={image} className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-slate-100">
                    <Image
                      src={image}
                      alt={`${article.shortTitle} – Eindruck ${index + 2}`}
                      fill
                      sizes="(min-width: 640px) 40vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {!!article.faq?.length && (
            <section className="mt-12" aria-labelledby="faq-heading">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-700">Häufige Fragen</p>
              <h2 id="faq-heading" className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Gut zu wissen</h2>
              <div className="mt-5 divide-y divide-slate-200 overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white">
                {article.faq.map((item) => (
                  <details key={item.q} className="group p-5 sm:p-6">
                    <summary className="cursor-pointer list-none font-bold text-slate-950 marker:hidden">
                      <span className="flex items-center justify-between gap-4">
                        {item.q}<span aria-hidden="true" className="text-xl font-normal text-slate-400 transition group-open:rotate-45">+</span>
                      </span>
                    </summary>
                    <p className="mt-3 pr-8 text-sm leading-6 text-slate-600 sm:text-[15px] sm:leading-7">{item.a}</p>
                  </details>
                ))}
              </div>
            </section>
          )}

          <SourceLinks article={article} />
        </article>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-700">Thema</p>
            <p className="mt-2 text-lg font-bold text-slate-950">{article.category}</p>
            {!!article.places?.length && (
              <div className="mt-4 flex flex-wrap gap-2">
                {article.places.slice(0, 5).map((place) => (
                  <span key={place} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">{place}</span>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[2rem] bg-[#07131f] p-6 text-white shadow-lg shadow-slate-900/10">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#f4d59d]">Passende Unterkunft</p>
            <p className="mt-3 text-xl font-bold tracking-tight">Ostseeurlaub direkt weiterplanen</p>
            <p className="mt-2 text-sm leading-6 text-white/65">Finde Ferienhäuser und Ferienwohnungen für deinen Aufenthalt.</p>
            <Link href="/offers" className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#f4d59d] px-5 py-3 text-sm font-bold text-[#07131f] transition hover:bg-white">
              Unterkünfte ansehen
            </Link>
          </div>
        </aside>
      </div>

      {!!related.length && (
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
          <div className="mb-7">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-700">Weiter entdecken</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Das könnte dich auch interessieren</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {related.map((item) => <InspirationCard key={item.slug} article={item} />)}
          </div>
        </section>
      )}
    </main>
  );
}
