// src/components/Footer.jsx
import { Facebook, Instagram, Mail, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Logo & Company Info */}
        <div>
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Image
              src="/logo.svg"
              alt="Urlaub Gosch Logo"
              width={40}
              height={40}
              className="h-10 w-10"
            />
            <span className="text-lg font-semibold text-white">
              Urlaub-Gosch
            </span>
          </Link>
          <p className="text-sm leading-relaxed text-slate-400 mb-4">
            Genieße deinen perfekten Urlaub an der Ostsee – komfortabel, modern
            und unvergesslich. Entdecke unsere Ferienhäuser und Aktivitäten.
          </p>

          <div className="flex items-center gap-4 mt-3">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-sky-400 transition"
            >
              <Facebook className="h-5 w-5" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-pink-400 transition"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href="mailto:info@urlaub-gosch.de"
              className="hover:text-emerald-400 transition"
            >
              <Mail className="h-5 w-5" />
            </a>
          </div>
        </div>

        {/* Explore */}
        <div>
          <h3 className="text-white font-semibold text-lg mb-4">
            Explore Urlaub-Gosch
          </h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/properties" className="hover:text-white transition">
                Ferienhäuser & Apartments
              </Link>
            </li>
            <li>
              <Link href="/activities" className="hover:text-white transition">
                Aktivitäten & Umgebung
              </Link>
            </li>
            <li>
              <Link href="/lastminute" className="hover:text-white transition">
                Last-Minute Angebote
              </Link>
            </li>
          </ul>
        </div>

        {/* Resources */}
        <div>
          <h3 className="text-white font-semibold text-lg mb-4">Resources</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/blog" className="hover:text-white transition">
                Blog & Inspiration
              </Link>
            </li>
            <li>
              <Link href="/faqs" className="hover:text-white transition">
                Häufige Fragen (FAQ)
              </Link>
            </li>
            <li>
              <Link href="/guides" className="hover:text-white transition">
                Reise- & Buchungsguides
              </Link>
            </li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <h3 className="text-white font-semibold text-lg mb-4">Company</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/contact" className="hover:text-white transition flex items-center gap-2">
                <Phone className="h-4 w-4" /> Kontakt & Support
              </Link>
            </li>
            <li>
              <Link href="/impressum" className="hover:text-white transition">
                Impressum
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-white transition">
                Datenschutz
              </Link>
            </li>
            <li>
              <Link href="/agb" className="hover:text-white transition">
                AGB
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800 mt-10 pt-6 text-center text-xs text-slate-500">
        <p>
          © {new Date().getFullYear()} Urlaub-Gosch. Alle Rechte vorbehalten.{" "}
          <span className="text-slate-600">|</span> Made with ❤️ by{" "}
          <a
            href="https://hexel-tech.de"
            target="_blank"
            className="text-sky-400 hover:text-sky-300"
          >
            Hexel-Tech
          </a>
        </p>
      </div>
    </footer>
  );
}
