"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Menu, Search, X } from "lucide-react";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/offers", label: "Angebote" },
  { href: "/blog", label: "Inspiration" },
  { href: "/contact", label: "Kontakt" },
];

export default function Header() {
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);

  const isHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => {
      setSolid(!isHome || window.scrollY > 28);
    };

    onScroll();

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5">
        <div
          className={[
            "mx-auto flex h-[58px] max-w-7xl items-center justify-between rounded-full border px-4 transition-all duration-300",
            solid
              ? "border-slate-200/80 bg-white/90 text-slate-950 shadow-[0_18px_60px_rgba(15,23,42,0.10)] backdrop-blur-2xl"
              : "border-white/15 bg-white/[0.08] text-white shadow-[0_18px_60px_rgba(0,0,0,0.18)] backdrop-blur-2xl",
          ].join(" ")}
        >
          {/* Logo */}
          <Link href="/" className="flex min-w-0 items-center">
            <div className="relative h-10 w-[140px] sm:w-[150px]">
              <Image
                src="/urlaub-gosch-logo.png"
                alt="Urlaub Gosch Logo"
                fill
                sizes="150px"
                className="object-contain"
                priority
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "rounded-full px-4 py-2 text-sm font-semibold transition",
                    solid
                      ? active
                        ? "bg-slate-950 text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                      : active
                      ? "bg-white/15 text-white"
                      : "text-white/75 hover:bg-white/10 hover:text-white",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/favorites"
              aria-label="Favoriten"
              className={[
                "grid h-10 w-10 place-items-center rounded-full border transition",
                solid
                  ? "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                  : "border-white/15 bg-white/[0.08] text-white hover:bg-white/[0.14]",
              ].join(" ")}
            >
              <Heart className="h-4 w-4" />
            </Link>

            <Link
              href="/offers"
              className={[
                "hidden items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition md:inline-flex",
                solid
                  ? "bg-slate-950 text-white hover:bg-slate-800"
                  : "bg-[#f4d59d] text-[#07131f] hover:bg-white",
              ].join(" ")}
            >
              <Search className="h-4 w-4" />
              Suchen
            </Link>

            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-label={open ? "Menü schließen" : "Menü öffnen"}
              className={[
                "grid h-10 w-10 place-items-center rounded-full border transition lg:hidden",
                solid
                  ? "border-slate-200 bg-white text-slate-950 hover:bg-slate-50"
                  : "border-white/15 bg-white/[0.08] text-white hover:bg-white/[0.14]",
              ].join(" ")}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile / Tablet Menu */}
      {open && (
        <div className="fixed inset-0 z-40 bg-[#07131f]/96 px-4 pb-6 pt-24 text-white backdrop-blur-xl lg:hidden">
          <div className="mx-auto flex h-full max-w-md flex-col">
            <div className="rounded-[2rem] border border-white/12 bg-white/[0.08] p-2 shadow-2xl shadow-black/30">
              {NAV.map((item) => {
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={[
                      "flex items-center justify-between rounded-[1.35rem] px-5 py-4 text-lg font-semibold transition",
                      active
                        ? "bg-[#f4d59d] text-[#07131f]"
                        : "text-white/82 hover:bg-white/10 hover:text-white",
                    ].join(" ")}
                  >
                    {item.label}
                    <span className="text-sm opacity-60">→</span>
                  </Link>
                );
              })}

              <Link
                href="/favorites"
                onClick={() => setOpen(false)}
                className="mt-2 flex items-center justify-between rounded-[1.35rem] px-5 py-4 text-lg font-semibold text-white/82 transition hover:bg-white/10 hover:text-white"
              >
                Favoriten
                <Heart className="h-5 w-5" />
              </Link>
            </div>

            <div className="mt-auto rounded-[2rem] border border-white/12 bg-white/[0.08] p-4 shadow-2xl shadow-black/20">
              <p className="text-sm leading-6 text-white/68">
                Finde schnell deine passende Ferienunterkunft an der Küste.
              </p>

              <Link
                href="/offers"
                onClick={() => setOpen(false)}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#f4d59d] px-5 py-3.5 text-sm font-bold text-[#07131f] transition hover:bg-white"
              >
                Unterkunft suchen
                <Search className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}