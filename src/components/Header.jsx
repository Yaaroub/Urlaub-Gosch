"use client";

import { useState } from "react";
import Link from "next/link";
import AuthButton from "@/components/AuthButton";
import { Phone, Mail, Facebook, Instagram, Menu, X } from "lucide-react";
import FavButton from "./FavButton";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-40 w-full overflow-x-clip bg-gradient-to-b
                 from-sky-950 via-sky-900 to-sky-900 text-white"
    >
      <div className="mx-auto w-full max-w-6xl px-3">
        {/* TOP BAR */}
        <div className="flex h-16 items-center justify-between gap-3">
          {/* Branding */}
          <Link
            href="/"
            className="inline-flex items-center gap-3"
            onClick={() => setOpen(false)}
          >
            <div className="flex items-center gap-2">
              {/* Logo – Pfad anpassen */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/urlaub-gosch-logo.png"
                alt="Urlaub-GOSCH"
                className="h-9 w-auto"
              />
              <div className="leading-tight">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-200">
                  Urlaub
                </p>
                <p className="text-lg font-bold tracking-tight text-white">
                  GOSCH
                </p>
              </div>
            </div>

            <span className="hidden sm:inline-flex items-center rounded-full border border-sky-500/50 bg-sky-900/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-100">
              Beta
            </span>
          </Link>

          {/* RECHTS */}
          <div className="flex items-center gap-1.5">
            {/* Fav immer sichtbar */}
            <div className="inline-flex items-center justify-center rounded-full bg-white px-2 py-1 text-sky-800 shadow-sm">
              <FavButton />
            </div>

            {/* DESKTOP-BEREICH */}
            <div className="hidden md:flex items-center gap-1.5">
              <a
                href="tel:+4943123456"
                className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/50 bg-sky-900/60 px-3 py-1.5 text-xs font-medium text-sky-50 hover:bg-sky-800/80 focus:outline-none focus:ring-2 focus:ring-sky-300"
              >
                <Phone className="h-4 w-4" />
                <span>+49&nbsp;431&nbsp;23456</span>
              </a>

              <a
                href="mailto:info@urlaub-gosch.de"
                className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/50 bg-sky-900/60 px-3 py-1.5 text-xs font-medium text-sky-50 hover:bg-sky-800/80 focus:outline-none focus:ring-2 focus:ring-sky-300"
              >
                <Mail className="h-4 w-4" />
                <span>E-Mail</span>
              </a>

              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-sky-900/60 text-sky-100 hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-300"
                aria-label="Facebook"
                title="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>

              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-sky-900/60 text-sky-100 hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-300"
                aria-label="Instagram"
                title="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>

              <AuthButton />
            </div>

            {/* MOBILE: BURGER */}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center justify-center rounded-full bg-sky-900/70 p-2 text-sky-50 hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-300 md:hidden"
              aria-label="Menü öffnen"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* MOBILE-DROPDOWN */}
        {open && (
          <div className="md:hidden pb-3">
            <div className="space-y-2 rounded-2xl border border-sky-700/60 bg-sky-950/90 px-3 py-3 text-sm">
              <a
                href="tel:+4943123456"
                className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sky-50 hover:bg-sky-800/80"
              >
                <Phone className="h-4 w-4" />
                <span>+49&nbsp;431&nbsp;23456</span>
              </a>

              <a
                href="mailto:info@urlaub-gosch.de"
                className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sky-50 hover:bg-sky-800/80"
              >
                <Mail className="h-4 w-4" />
                <span>info@urlaub-gosch.de</span>
              </a>

              <div className="flex gap-2 pt-1">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-sky-900/70 px-2 py-1.5 text-xs text-sky-50 hover:bg-sky-800"
                >
                  <Facebook className="h-4 w-4" />
                  <span>Facebook</span>
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-sky-900/70 px-2 py-1.5 text-xs text-sky-50 hover:bg-sky-800"
                >
                  <Instagram className="h-4 w-4" />
                  <span>Instagram</span>
                </a>
              </div>

              <div className="pt-1">
                <AuthButton />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
