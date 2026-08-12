// src/components/CookieConsent.jsx

"use client";

import {
  BarChart3,
  Check,
  Cookie,
  Map,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  CONSENT_OPEN_EVENT,
  DEFAULT_CONSENT,
  readConsent,
  saveConsent,
} from "@/lib/consent";

export default function CookieConsent() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] =
    useState(false);

  const [consent, setConsent] = useState(
    DEFAULT_CONSENT
  );

  useEffect(() => {
    setMounted(true);

    const saved = readConsent();

    if (saved) {
      setConsent({
        necessary: true,
        externalMedia:
          saved.externalMedia === true,
        statistics:
          saved.statistics === true,
      });
    } else {
      setOpen(true);
    }

    function handleOpenSettings() {
      const current = readConsent();

      setConsent({
        necessary: true,
        externalMedia:
          current?.externalMedia === true,
        statistics:
          current?.statistics === true,
      });

      setSettingsOpen(true);
      setOpen(true);
    }

    window.addEventListener(
      CONSENT_OPEN_EVENT,
      handleOpenSettings
    );

    return () => {
      window.removeEventListener(
        CONSENT_OPEN_EVENT,
        handleOpenSettings
      );
    };
  }, []);

  function acceptAll() {
    saveConsent({
      necessary: true,
      externalMedia: true,
      statistics: true,
    });

    setOpen(false);
    setSettingsOpen(false);
  }

  function acceptNecessary() {
    saveConsent({
      necessary: true,
      externalMedia: false,
      statistics: false,
    });

    setOpen(false);
    setSettingsOpen(false);
  }

  function saveSelection() {
    saveConsent(consent);

    setOpen(false);
    setSettingsOpen(false);
  }

  if (!mounted || !open) {
    return null;
  }

  return (
    <>
      {/* Hintergrund */}
      <div
        aria-hidden="true"
        className="
          fixed inset-0 z-[90]
          bg-[#020811]/55
          backdrop-blur-[2px]
        "
      />

      {/* Dialog */}
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-consent-title"
        className="
          fixed inset-x-3 bottom-3
          z-[100]
          mx-auto
          max-h-[calc(100vh-1.5rem)]
          max-w-4xl
          overflow-y-auto
          rounded-[2rem]
          border border-white/10
          bg-[#07131f]
          text-white
          shadow-[0_30px_100px_rgba(0,0,0,0.5)]
          sm:inset-x-6
          sm:bottom-6
        "
      >
        {/* Hintergrund Glow */}
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute left-1/2 top-[-140px]
            h-80 w-[700px]
            -translate-x-1/2
            rounded-full
            bg-sky-500/10
            blur-3xl
          "
        />

        <div className="relative">
          {/* Inhalt */}
          <div className="p-5 sm:p-7">
            <div className="flex items-start gap-4">
              <div
                className="
                  grid h-12 w-12
                  shrink-0 place-items-center
                  rounded-2xl
                  bg-[#e8c375]/10
                  text-[#e8c375]
                  ring-1 ring-[#e8c375]/20
                "
              >
                <Cookie className="h-6 w-6" />
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className="
                    text-[10px]
                    font-extrabold uppercase
                    tracking-[0.22em]
                    text-[#e8c375]
                  "
                >
                  Datenschutz & Cookies
                </p>

                <h2
                  id="cookie-consent-title"
                  className="
                    mt-1
                    font-serif
                    text-2xl font-semibold
                    tracking-tight
                    text-white
                    sm:text-3xl
                  "
                >
                  Deine Privatsphäre ist uns wichtig
                </h2>

                <p
                  className="
                    mt-3
                    max-w-3xl
                    text-sm leading-6
                    text-white/65
                    sm:text-[15px]
                  "
                >
                  Wir verwenden notwendige Technologien,
                  damit Urlaub-GOSCH zuverlässig
                  funktioniert. Externe Medien und
                  Statistik werden nur verwendet, wenn
                  du zustimmst. Deine Entscheidung kannst
                  du jederzeit über die Cookie-Einstellungen
                  ändern.
                </p>

                <div
                  className="
                    mt-4 flex flex-wrap
                    gap-x-5 gap-y-2
                    text-xs
                  "
                >
                  <Link
                    href="/datenschutz"
                    className="
                      font-semibold
                      text-[#e8c375]
                      underline
                      decoration-[#e8c375]/30
                      underline-offset-4
                      transition
                      hover:text-white
                    "
                  >
                    Datenschutzerklärung
                  </Link>

                  <Link
                    href="/impressum"
                    className="
                      text-white/55
                      transition
                      hover:text-white
                    "
                  >
                    Impressum
                  </Link>
                </div>
              </div>

              {settingsOpen ? (
                <button
                  type="button"
                  onClick={() =>
                    setSettingsOpen(false)
                  }
                  aria-label="Cookie-Einstellungen schließen"
                  className="
                    grid h-10 w-10
                    shrink-0 place-items-center
                    rounded-full
                    border border-white/10
                    bg-white/[0.05]
                    text-white/60
                    transition
                    hover:bg-white/10
                    hover:text-white
                  "
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            {/* Einstellungen */}
            {settingsOpen ? (
              <div
                className="
                  mt-6 space-y-3
                  border-t border-white/10
                  pt-6
                "
              >
                <ConsentRow
                  icon={ShieldCheck}
                  title="Notwendig"
                  description="Erforderlich für grundlegende Funktionen der Webseite und zum Speichern deiner Datenschutzauswahl."
                  checked
                  locked
                />

                <ConsentRow
                  icon={Map}
                  title="Externe Medien"
                  description="Erlaubt externe Karten und Inhalte wie Mapbox oder Google Maps."
                  checked={consent.externalMedia}
                  onChange={(checked) => {
                    setConsent((current) => ({
                      ...current,
                      externalMedia: checked,
                    }));
                  }}
                />

                <ConsentRow
                  icon={BarChart3}
                  title="Statistik"
                  description="Erlaubt Reichweitenmessung, sofern ein Statistikdienst wie Matomo eingesetzt wird."
                  checked={consent.statistics}
                  onChange={(checked) => {
                    setConsent((current) => ({
                      ...current,
                      statistics: checked,
                    }));
                  }}
                />
              </div>
            ) : null}
          </div>

          {/* Aktionen */}
          <div
            className="
              border-t border-white/10
              bg-black/10
              p-4 sm:p-5
            "
          >
            {settingsOpen ? (
              <div
                className="
                  flex flex-col gap-2.5
                  sm:flex-row
                  sm:justify-end
                "
              >
                <button
                  type="button"
                  onClick={acceptNecessary}
                  className="
                    min-h-12
                    rounded-xl
                    border border-white/15
                    bg-white/[0.06]
                    px-5 py-3
                    text-sm font-bold
                    text-white
                    transition
                    hover:bg-white/10
                  "
                >
                  Nur notwendige
                </button>

                <button
                  type="button"
                  onClick={saveSelection}
                  className="
                    inline-flex min-h-12
                    items-center justify-center
                    gap-2
                    rounded-xl
                    border border-[#e8c375]/30
                    bg-[#e8c375]/10
                    px-5 py-3
                    text-sm font-bold
                    text-[#e8c375]
                    transition
                    hover:bg-[#e8c375]/15
                  "
                >
                  <Check className="h-4 w-4" />
                  Auswahl speichern
                </button>

                <button
                  type="button"
                  onClick={acceptAll}
                  className="
                    min-h-12
                    rounded-xl
                    bg-[#e8c375]
                    px-6 py-3
                    text-sm font-extrabold
                    text-[#07131f]
                    transition
                    hover:bg-[#f2d58e]
                  "
                >
                  Alle akzeptieren
                </button>
              </div>
            ) : (
              <div
                className="
                  grid gap-2.5
                  sm:grid-cols-3
                "
              >
                <button
                  type="button"
                  onClick={acceptNecessary}
                  className="
                    min-h-12
                    rounded-xl
                    border border-white/15
                    bg-white/[0.06]
                    px-5 py-3
                    text-sm font-bold
                    text-white
                    transition
                    hover:bg-white/10
                  "
                >
                  Nur notwendige
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSettingsOpen(true)
                  }
                  className="
                    inline-flex min-h-12
                    items-center justify-center
                    gap-2
                    rounded-xl
                    border border-white/15
                    bg-white/[0.06]
                    px-5 py-3
                    text-sm font-bold
                    text-white
                    transition
                    hover:bg-white/10
                  "
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Einstellungen
                </button>

                <button
                  type="button"
                  onClick={acceptAll}
                  className="
                    min-h-12
                    rounded-xl
                    bg-[#e8c375]
                    px-6 py-3
                    text-sm font-extrabold
                    text-[#07131f]
                    transition
                    hover:bg-[#f2d58e]
                  "
                >
                  Alle akzeptieren
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function ConsentRow({
  icon: Icon,
  title,
  description,
  checked,
  locked = false,
  onChange,
}) {
  return (
    <div
      className="
        flex items-start gap-4
        rounded-2xl
        border border-white/10
        bg-white/[0.035]
        p-4
      "
    >
      <div
        className="
          grid h-10 w-10
          shrink-0 place-items-center
          rounded-xl
          bg-white/[0.05]
          text-[#e8c375]
        "
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-4">
          <h3 className="font-bold text-white">
            {title}
          </h3>

          <button
            type="button"
            disabled={locked}
            onClick={() => {
              if (!locked) {
                onChange?.(!checked);
              }
            }}
            aria-pressed={checked}
            aria-label={`${title} ${
              checked ? "deaktivieren" : "aktivieren"
            }`}
            className={[
              "relative h-7 w-12 shrink-0 rounded-full transition",
              checked
                ? "bg-[#e8c375]"
                : "bg-white/15",
              locked
                ? "cursor-not-allowed opacity-80"
                : "cursor-pointer",
            ].join(" ")}
          >
            <span
              className={[
                "absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform",
                checked
                  ? "translate-x-6"
                  : "translate-x-1",
              ].join(" ")}
            />
          </button>
        </div>

        <p
          className="
            mt-1.5
            max-w-2xl
            text-xs leading-5
            text-white/55
          "
        >
          {description}
        </p>

        {locked ? (
          <p
            className="
              mt-2
              text-[10px] font-bold
              uppercase tracking-[0.12em]
              text-[#e8c375]/70
            "
          >
            Immer aktiv
          </p>
        ) : null}
      </div>
    </div>
  );
}