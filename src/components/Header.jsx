"use client";

import Link from "next/link";
import AuthButton from "@/components/AuthButton";
import { Phone, Mail, Facebook, Instagram } from "lucide-react";
import FavButton from "./FavButton";

export default function Header() {
  return (
    <header
      className="sticky top-0 z-40 w-full border-b border-slate-200/60
                 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60"
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-14 items-center justify-between gap-3">
          {/* Branding */}
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-lg font-semibold tracking-tight text-slate-900">
              Urlaub-GOSCH
            </span>
            <span className="rounded-md bg-sky-100 px-1.5 py-0.5 text-[11px] font-medium text-sky-700">
              Beta
            </span>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <FavButton />

            <a
              href="tel:+4943123456"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-slate-200
                         px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50
                         focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <Phone className="h-4 w-4" />
              <span className="hidden md:inline">+49&nbsp;431&nbsp;23456</span>
              <span className="md:hidden">Tel.</span>
            </a>

            <a
              href="mailto:info@urlaub-gosch.de"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-slate-200
                         px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50
                         focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <Mail className="h-4 w-4" />
              <span className="hidden md:inline">E-Mail</span>
              <span className="md:hidden">Mail</span>
            </a>

            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-md p-2 text-slate-600
                         hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              aria-label="Facebook"
              title="Facebook"
            >
              <Facebook className="h-5 w-5" />
            </a>

            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-md p-2 text-slate-600
                         hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              aria-label="Instagram"
              title="Instagram"
            >
              <Instagram className="h-5 w-5" />
            </a>

            <AuthButton />
          </div>
        </div>
      </div>
    </header>
  );
}
