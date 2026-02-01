"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Phone, Mail, Instagram, Facebook, Menu, X } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/offers", label: "Special Offers" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const isActive = (href) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  const surfaceBase =
    "bg-[rgba(6,20,35,0.55)] supports-[backdrop-filter]:bg-[rgba(6,20,35,0.45)]";
  const surfaceScrolled =
    "bg-[rgba(6,20,35,0.82)] supports-[backdrop-filter]:bg-[rgba(6,20,35,0.72)]";

  return (
    <>
      <header className="fixed inset-x-0 top-3 z-[999]">
        <div className="mx-auto max-w-6xl px-3 sm:px-4">
          <div
            className={[
              "relative rounded-2xl border backdrop-blur-xl"
,
              "transition-all duration-300 ease-out",
              scrolled
                ? `${surfaceScrolled} shadow-[0_14px_40px_rgba(0,0,0,0.50)]`
                : `${surfaceBase} shadow-[0_10px_26px_rgba(0,0,0,0.35)]`,
            ].join(" ")}
          >
            {/* Brand highlight line */}
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-sky-400/80 to-sky-500/70 to-transparent opacity-85" />

            {/* Top row */}
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              {/* Brand */}
              <Link
                href="/"
                className="group inline-flex items-center gap-3"
                aria-label="Urlaub-GOSCH Startseite"
                onClick={() => setOpen(false)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/urlaub-gosch-logo.png"
                  alt="Urlaub-GOSCH Logo"
                  className="h-9 w-auto drop-shadow-sm transition-transform duration-300 ease-out group-hover:scale-[1.02]"
                />
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold tracking-tight text-white">
                    Urlaub-GOSCH
                  </span>
                  <span className="text-[11px] tracking-[0.18em] uppercase text-sky-200/70">
                    Nord- &amp; Ostsee
                  </span>
                </div>
              </Link>

              {/* Actions */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Mini Contact (Desktop) */}
                <div className="hidden items-center gap-2 lg:flex">
                  <a
                    href="tel:+4943123456"
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/90
                    transition-all duration-200 ease-out hover:bg-sky-400/10 hover:-translate-y-[1px] hover:scale-[1.02] active:scale-[0.99]"
                  >
                    <Phone className="h-4 w-4 text-sky-300" />
                    <span>Tel.</span>
                  </a>

                  <a
                    href="mailto:info@urlaub-gosch.de"
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/90
                    transition-all duration-200 ease-out hover:bg-sky-400/10 hover:-translate-y-[1px] hover:scale-[1.02] active:scale-[0.99]"
                  >
                    <Mail className="h-4 w-4 text-sky-300" />
                    <span>Mail</span>
                  </a>
                </div>

                {/* Social */}
                <a
                  className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/90
                  transition-all duration-200 ease-out hover:bg-sky-400/10 hover:-translate-y-[1px] hover:scale-[1.02] active:scale-[0.99]
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                  title="Facebook"
                >
                  <Facebook className="h-5 w-5 text-sky-300" />
                </a>

                <a
                  className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/90
                  transition-all duration-200 ease-out hover:bg-sky-400/10 hover:-translate-y-[1px] hover:scale-[1.02] active:scale-[0.99]
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  title="Instagram"
                >
                  <Instagram className="h-5 w-5 text-sky-300" />
                </a>

                {/* Favorites */}
                <Link
                  href="/favorites"
                  title="Favoriten"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/90
                  transition-all duration-200 ease-out hover:bg-sky-400/10 hover:-translate-y-[1px] hover:scale-[1.02] active:scale-[0.99]
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                  onClick={() => setOpen(false)}
                >
                  <Heart className="h-5 w-5" />
                  <span className="sr-only">Favoriten</span>
                </Link>

                {/* Mobile Menu */}
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/90
                  transition-all duration-200 ease-out hover:bg-sky-400/10 hover:-translate-y-[1px] hover:scale-[1.02] active:scale-[0.99]
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 md:hidden"
                  aria-label={open ? "Menü schließen" : "Menü öffnen"}
                  onClick={() => setOpen((v) => !v)}
                >
                  {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Desktop Subnav */}
            <div className="hidden border-t border-white/10 md:block">
              <div className="flex items-center justify-between px-4 py-2">
                <div className="flex items-center gap-2">
                  {NAV_ITEMS.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={[
                          "relative rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.18em] uppercase transition-all duration-200 ease-out",
                          active
                            ? "text-white"
                            : "text-white/75 hover:text-white",
                        ].join(" ")}
                      >
                        {item.label}

                        {/* active pill + glow line */}
                        {active && (
                          <>
                            <span className="absolute inset-0 -z-10 rounded-full bg-white/10" />
                            <span className="absolute -bottom-[6px] left-2 right-2 h-[2px] rounded-full bg-gradient-to-r from-transparent via-sky-400/80 to-transparent opacity-80" />
                          </>
                        )}
                      </Link>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 lg:hidden">
                  <a
                    href="tel:+4943123456"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/90    transition-all duration-200 ease-out hover:bg-sky-400/10"
                    aria-label="Telefon"
                    title="Telefon"
                  >
                    <Phone className="h-4 w-4 text-sky-300" />
                  </a>
                  <a
                    href="mailto:info@urlaub-gosch.de"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/90   transition-all duration-200 ease-out hover:bg-sky-400/10"
                    aria-label="E-Mail"
                    title="E-Mail"
                  >
                    <Mail className="h-4 w-4 text-sky-300" />
                  </a>
                </div>
              </div>
            </div>

            {/* Mobile Drawer: overlay, drückt NICHT hero */}
            {open && (
              <div className="absolute left-0 right-0 top-full z-[1000] md:hidden">
                <div className="mt-2 px-3 sm:px-4">
                  <div
                    className={[
                      "overflow-hidden rounded-2xl border border-white/10 bg-[rgba(6,20,35,0.92)] backdrop-blur-xl",
                      "shadow-[0_16px_40px_rgba(0,0,0,0.55)]",
                      "origin-top animate-[ugDrop_160ms_ease-out]",
                    ].join(" ")}
                  >
                    <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-sky-400/80 to-transparent opacity-85" />

                    <div className="px-4 pb-4 pt-3">
                      <nav className="grid gap-2">
                        {NAV_ITEMS.map((item) => {
                          const active = isActive(item.href);
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setOpen(false)}
                              className={[
                                "rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-200 ease-out",
                                active
                                  ? "border-sky-400/30 bg-sky-400/10 text-white"
                                  : "border-white/10 bg-white/5 text-white/90 hover:bg-sky-400/10",
                              ].join(" ")}
                            >
                              {item.label}
                            </Link>
                          );
                        })}
                      </nav>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <a
                          href="tel:+4943123456"
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/90 transition-all duration-200 ease-out hover:bg-sky-400/10"
                        >
                          <Phone className="h-4 w-4 text-sky-300" />
                          <span>Telefon</span>
                        </a>
                        <a
                          href="mailto:info@urlaub-gosch.de"
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/90 transition-all duration-200 ease-out hover:bg-sky-400/10"
                        >
                          <Mail className="h-4 w-4 text-sky-300" />
                          <span>E-Mail</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* tiny keyframe via tailwind arbitrary */}
                  <style jsx global>{`
                    @keyframes ugDrop {
                      from {
                        opacity: 0;
                        transform: translateY(-6px) scale(0.98);
                        filter: blur(6px);
                      }
                      to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                        filter: blur(0);
                      }
                    }
                  `}</style>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Backdrop */}
      {open && (
        <button
          aria-label="Menü schließen"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[998] bg-black/40 backdrop-blur-[2px] md:hidden"
        />
      )}
    </>
  );
}
