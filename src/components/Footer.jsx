import { Facebook, Instagram, Mail, Phone, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative  overflow-hidden bg-[#050e1a] text-slate-200">
      {/* Top line like Header */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-sky-400/80 to-transparent opacity-85" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.20),transparent_55%)]" />

      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-3xl border border-white/10 bg-[rgba(6,20,35,0.45)] p-6 backdrop-blur-xl shadow-[0_18px_55px_rgba(0,0,0,0.55)]">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="space-y-4">
              <Link href="/" className="inline-flex items-center gap-3">
                <Image
                  src="/urlaub-gosch-logo.png"
                  alt="Urlaub-GOSCH Logo"
                  width={128}
                  height={70}
                  sizes="128px"
                  quality={70}
                  className="h-10 w-auto"
                />
                <div className="leading-tight">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-200">
                    Urlaub
                  </p>
                  <p className="text-lg font-bold tracking-tight text-white">
                    GOSCH
                  </p>
                </div>
              </Link>

              <p className="text-sm leading-relaxed text-slate-300/85">
                Handverlesene Ferienunterkünfte an Nord- &amp; Ostsee – mit klarer
                Suche, echten Verfügbarkeiten und Fokus auf Familien &amp; Urlaub
                mit Hund.
              </p>

              <div className="flex flex-wrap gap-2">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/90 transition hover:bg-sky-400/10"
                  aria-label="Facebook"
                  title="Facebook"
                >
                  <Facebook className="h-4 w-4 text-sky-200" />
                  Facebook
                </a>

                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/90 transition hover:bg-sky-400/10"
                  aria-label="Instagram"
                  title="Instagram"
                >
                  <Instagram className="h-4 w-4 text-sky-200" />
                  Instagram
                </a>

                <a
                  href="mailto:info@urlaub-gosch.de"
                  className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/90 transition hover:bg-sky-400/10"
                  aria-label="E-Mail"
                  title="E-Mail"
                >
                  <Mail className="h-4 w-4 text-sky-200" />
                  Mail
                </a>
              </div>

              <div className="space-y-2 pt-1 text-sm text-slate-300/80">
                <a
                  href="tel:+4943123456"
                  className="inline-flex items-center gap-2 hover:text-white"
                >
                  <Phone className="h-4 w-4 text-sky-200" />
                  +49 431 23456
                </a>
                <div className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-sky-200" />
                  Schleswig-Holstein &amp; Küste
                </div>
              </div>
            </div>

            {/* Explore */}
            <div>
              <h3 className="text-sm font-extrabold tracking-[0.22em] uppercase text-white">
                Explore
              </h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-300/85">
                <li>
                  <Link href="/#unterkuenfte" className="hover:text-white">
                    Ferienhäuser &amp; Apartments
                  </Link>
                </li>
                <li>
                  <Link href="/#lastminute" className="hover:text-white">
                    Last-Minute Angebote
                  </Link>
                </li>
                <li>
                  <Link href="/favorites" className="hover:text-white">
                    Merkliste
                  </Link>
                </li>
                <li>
                  <Link href="/#regionen" className="hover:text-white">
                    Regionen entdecken
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources (nur wenn Seiten existieren – sonst auf Home anchors) */}
            <div>
              <h3 className="text-sm font-extrabold tracking-[0.22em] uppercase text-white">
                Resources
              </h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-300/85">
                <li>
                  <Link href="/#regionen" className="hover:text-white">
                    Inspiration &amp; Regionen
                  </Link>
                </li>
                <li>
                  <Link href="/#suche" className="hover:text-white">
                    Suche starten
                  </Link>
                </li>
                <li>
                  <Link href="/#unterkuenfte" className="hover:text-white">
                    Unterkünfte entdecken
                  </Link>
                </li>
              </ul>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold text-white/90">
                  Schnell. Transparent. Persönlich.
                </p>
                <p className="mt-1 text-xs text-slate-300/80">
                  Unterkünfte kuratiert &amp; übersichtlich – ohne Such-Chaos.
                </p>
              </div>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-sm font-extrabold tracking-[0.22em] uppercase text-white">
                Company
              </h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-300/85">
                <li>
                  <Link href="/#suche" className="inline-flex items-center gap-2 hover:text-white">
                    <Phone className="h-4 w-4 text-sky-200" />
                    Kontakt &amp; Support
                  </Link>
                </li>
                <li>
                  <Link href="/admin" className="hover:text-white">
                    Admin
                  </Link>
                </li>
              </ul>

              <div className="mt-5">
                <Link
                  href="/#suche"
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-sky-500 px-4 py-3 text-xs font-extrabold tracking-[0.22em] uppercase text-white shadow-md transition hover:bg-sky-400"
                >
                  Jetzt anfragen
                </Link>
                <p className="mt-2 text-center text-xs text-slate-400">
                  Antwort meist innerhalb kurzer Zeit
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-10 border-t border-white/10 pt-6">
            <div className="flex flex-col gap-3 text-center sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-400">
                © {new Date().getFullYear()} Urlaub-GOSCH. Alle Rechte vorbehalten.
              </p>

              <p className="text-xs text-slate-500">
                Made with <span className="text-slate-300">♥</span> by{" "}
                <a
                  href="https://hexel-tech.de"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-sky-300 hover:text-sky-200"
                >
                  Hexel-Tech
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
