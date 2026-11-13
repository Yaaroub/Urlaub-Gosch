import Link from "next/link";

export const metadata = {
  title: "Seite nicht gefunden | Urlaub GOSCH",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#07131f] px-4 pb-24 pt-36 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex rounded-full bg-[#f4d59d] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#07131f]">
          Fehler 404
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
          Hier ist leider nur Strand.
        </h1>
        <p className="mt-5 text-base leading-7 text-white/70 sm:text-lg">
          Die Seite gibt es nicht (mehr). Vielleicht findest du über die Startseite,
          unsere Ausflugsziele oder die Angebote, was du suchst.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="inline-flex min-h-12 items-center rounded-full bg-[#f4d59d] px-6 text-sm font-bold text-[#07131f] transition hover:bg-[#f8e2b8]">
            Zur Startseite
          </Link>
          <Link href="/aktivitaeten" className="inline-flex min-h-12 items-center rounded-full border border-white/20 px-6 text-sm font-bold text-white transition hover:bg-white/10">
            Ausflugsziele
          </Link>
          <Link href="/offers" className="inline-flex min-h-12 items-center rounded-full border border-white/20 px-6 text-sm font-bold text-white transition hover:bg-white/10">
            Angebote
          </Link>
        </div>
      </div>
    </main>
  );
}
