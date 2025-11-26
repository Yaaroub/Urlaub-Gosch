// app/layout.jsx
import "./globals.css";
import Link from "next/link";
import AuthButton from "@/components/AuthButton";
import Footer from "@/components/Footer";
import { Heart, Settings } from "lucide-react";
import FavoritesProvider from "@/context/FavoritesProvider"; // <- default import, ohne {}

export const metadata = {
  title: "Urlaub-GOSCH",
  description: "Ferienunterkünfte schnell finden",
};

export default function RootLayout({ children }) {
  return (
    <html lang="de" className="scroll-smooth">
      <body className="bg-slate-50 text-slate-800 min-h-screen antialiased">
        <FavoritesProvider>{/* Client-Provider */}
          <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-slate-200">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
              {/* Logo / Branding */}
              <Link
                href="/"
                className="group inline-flex items-center gap-2 font-semibold text-lg tracking-tight"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-600/10 ring-1 ring-sky-600/30">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 text-sky-700">
                    <path d="M3 20h18M5 18h14l-7-4-7 4Zm7-6V3l6 7-6 2Z" fill="currentColor" />
                  </svg>
                </span>
                <span className="bg-gradient-to-r from-sky-700 to-sky-500 bg-clip-text text-transparent">
                  Urlaub-GOSCH
                </span>
              </Link>

              {/* Navigation / Actions */}
              <nav className="flex items-center gap-4">
                <Link
                  href="/favorites"
                  title="Favoriten"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
                >
                  <Heart className="h-5 w-5" />
                  <span className="sr-only">Favoriten</span>
                </Link>
                <a className="text-sm hover:underline" href="tel:+4943123456" aria-label="Telefonnummer">
                  Tel.
                </a>
                <a className="text-sm hover:underline" href="mailto:info@urlaub-gosch.de" aria-label="E-Mail">
                  Mail
                </a>
                <a className="text-sm hover:underline" href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
                  FB
                </a>
                <a className="text-sm hover:underline" href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
                  Insta
                </a>

                <a
                  href="/account"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
                  title="Konto"
                >
                  <Settings className="h-5 w-5" />
                  <span className="sr-only">Konto</span>
                </a>
                <AuthButton />
              </nav>
            </div>
          </header>

          {/* Main Content */}
          <main id="main" className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
            {children}
          </main>
          <Footer />
        </FavoritesProvider>
      </body>
    </html>
  );
}
