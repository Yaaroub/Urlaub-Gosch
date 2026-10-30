// src/app/layout.js

import "./globals.css";

import CookieConsent from "@/components/CookieConsent";
import FavoritesProvider from "@/context/FavoritesProvider";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import PublicSiteChrome from "@/components/PublicSiteChrome";

export const metadata = {
  title: "Urlaub-GOSCH",
  description: "Ferienunterkünfte schnell finden",
};

export default function RootLayout({ children }) {
  return (
    <html lang="de" className="scroll-smooth">
      <body className="min-h-screen bg-slate-50 text-slate-800 antialiased">
        <FavoritesProvider>
          <PublicSiteChrome><Header /></PublicSiteChrome>

          <main
            id="main"
            className="min-h-[60vh]"
          >
            {children}
          </main>

          <PublicSiteChrome><Footer /></PublicSiteChrome>
        </FavoritesProvider>

        <CookieConsent />
      </body>
    </html>
  );
}
