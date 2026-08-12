import Image from "next/image";
import Link from "next/link";

export default function InspirationCard({ article, featured = false }) {
  const image = article.heroImage || article.images?.[0] || null;

  return (
    <article
      className={[
        "group overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white",
        "shadow-[0_18px_60px_rgba(15,23,42,0.07)] transition duration-300",
        "hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(15,23,42,0.12)]",
        featured ? "lg:grid lg:grid-cols-[1.08fr_0.92fr]" : "",
      ].join(" ")}
    >
      <Link
        href={`/blog/${article.slug}`}
        className={[
          "relative block overflow-hidden bg-[#07131f]",
          featured ? "min-h-[300px] lg:min-h-[430px]" : "aspect-[16/10]",
        ].join(" ")}
        aria-label={`${article.shortTitle} lesen`}
      >
        {image ? (
          <Image
            src={image}
            alt={article.imageAlt || article.shortTitle}
            fill
            sizes={featured ? "(min-width: 1024px) 54vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
            className="object-cover transition duration-500 group-hover:scale-[1.025]"
          />
        ) : (
          <div className="absolute inset-0 flex items-end bg-[radial-gradient(circle_at_top_right,rgba(244,213,157,0.28),transparent_42%),linear-gradient(135deg,#07131f,#10283b)] p-7">
            <span className="max-w-xs text-2xl font-bold tracking-tight text-white/90">
              {article.shortTitle}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07131f]/45 via-transparent to-transparent" />
        <span className="absolute left-5 top-5 rounded-full border border-white/20 bg-[#07131f]/72 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-md">
          {article.category}
        </span>
      </Link>

      <div className={featured ? "flex flex-col justify-center p-7 sm:p-9 lg:p-11" : "p-6"}>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-700">
          {article.kicker}
        </p>

        <h2
          className={[
            "mt-3 font-bold tracking-tight text-slate-950",
            featured ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl",
          ].join(" ")}
        >
          <Link href={`/blog/${article.slug}`} className="outline-none hover:text-sky-800 focus-visible:underline">
            {article.shortTitle}
          </Link>
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-[15px]">
          {article.summary}
        </p>

        <div className="mt-6 flex items-center justify-between gap-4">
          <span className="text-xs font-medium text-slate-500">
            {article.places?.slice(0, 2).join(" · ") || "Ostsee"}
          </span>
          <Link
            href={`/blog/${article.slug}`}
            className="inline-flex min-h-10 items-center rounded-full bg-[#07131f] px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            Weiterlesen <span aria-hidden="true" className="ml-1">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
