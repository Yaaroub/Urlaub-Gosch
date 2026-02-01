// app/layout.jsx
import "./globals.css";
import Link from "next/link";
import AuthButton from "@/components/AuthButton";
import Footer from "@/components/Footer";
import FavoritesProvider from "@/context/FavoritesProvider";
import Header from "@/components/Header";
export const metadata = {
  title: "Urlaub-GOSCH",
  description: "Ferienunterkünfte schnell finden",
};

export default function RootLayout({ children }) {
  return (
    <html lang="de" className="scroll-smooth">
      <body className="min-h-screen bg-slate-50 text-slate-800 antialiased">
        <FavoritesProvider>
          {/* HEADER (passt zum neuen Hero: dunkler/glasig, auf Bildern gut lesbar) */}
<Header />

          {/* MAIN
              Wichtig: Kein extra max-w/padding, weil die Sections in page.js selbst max-w-6xl benutzen.
              So bleibt der Hero full-width und der Rest bleibt wie gehabt.
          */}
          <main id="main" className="min-h-[60vh]">
            {children}
          </main>

          <Footer />
        </FavoritesProvider>
      </body>
    </html>
  );
}
