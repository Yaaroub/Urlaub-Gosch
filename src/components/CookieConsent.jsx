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
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [consent, setConsent] = useState(DEFAULT_CONSENT);

  /* ---------------------------------------------------------
     Initialisierung
  --------------------------------------------------------- */

  useEffect(() => {
    setMounted(true);

    const saved = readConsent();

    if (saved) {
      setConsent({
        necessary: true,
        externalMedia: saved.externalMedia === true,
        statistics: saved.statistics === true,
      });
    } else {
      /*
       * Optionale Kategorien beim ersten Besuch
       * standardmäßig deaktiviert.
       */
      setConsent({
        necessary: true,
        externalMedia: false,
        statistics: false,
      });

      setOpen(true);
    }

    function handleOpenSettings() {
      const current = readConsent();

      setConsent({
        necessary: true,
        externalMedia: current?.externalMedia === true,
        statistics: current?.statistics === true,
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

  /* ---------------------------------------------------------
     Body-Scroll sperren
  --------------------------------------------------------- */

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [open]);

  /* ---------------------------------------------------------
     Aktionen
  --------------------------------------------------------- */

  function acceptAll() {
    const nextConsent = {
      necessary: true,
      externalMedia: true,
      statistics: true,
    };

    setConsent(nextConsent);
    saveConsent(nextConsent);

    setOpen(false);
    setSettingsOpen(false);
  }

  function acceptNecessary() {
    const nextConsent = {
      necessary: true,
      externalMedia: false,
      statistics: false,
    };

    setConsent(nextConsent);
    saveConsent(nextConsent);

    setOpen(false);
    setSettingsOpen(false);
  }

  function saveSelection() {
    const nextConsent = {
      necessary: true,
      externalMedia:
        consent.externalMedia === true,
      statistics:
        consent.statistics === true,
    };

    setConsent(nextConsent);
    saveConsent(nextConsent);

    setOpen(false);
    setSettingsOpen(false);
  }

  function closeSettings() {
    /*
     * Schließen ist nur möglich, wenn die Einstellungen
     * später über "Cookie-Einstellungen" geöffnet wurden.
     */
    if (!settingsOpen) {
      return;
    }

    setOpen(false);
    setSettingsOpen(false);
  }

  /* ---------------------------------------------------------
     Nicht rendern
  --------------------------------------------------------- */

  if (!mounted || !open) {
    return null;
  }

  return (
    <>
      {/* =====================================================
          OVERLAY
      ====================================================== */}

      <div
        aria-hidden="true"
        className="
          fixed inset-0
          z-[90]
          bg-[#020811]/65
          backdrop-blur-[3px]
        "
      />

      {/* =====================================================
          COOKIE DIALOG
      ====================================================== */}

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-consent-title"
        className="
          fixed
          inset-x-3
          bottom-3
          z-[100]

          mx-auto
          flex
          max-h-[calc(100dvh-1.5rem)]
          max-w-4xl
          flex-col

          overflow-hidden
          rounded-[1.6rem]

          border
          border-white/10

          bg-[#07131f]
          text-white

          shadow-[0_30px_100px_rgba(0,0,0,0.58)]

          sm:inset-x-6
          sm:bottom-6
          sm:rounded-[2rem]
        "
      >
        {/* Hintergrund Glow */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            left-1/2
            top-[-180px]

            h-96
            w-[700px]
            max-w-full

            -translate-x-1/2

            rounded-full
            bg-sky-500/10
            blur-3xl
          "
        />

        {/* ===================================================
            SCROLLBARER INHALT
        ==================================================== */}

        <div
          className="
            relative
            min-h-0
            flex-1
            overflow-y-auto
            overscroll-contain
          "
        >
          <div
            className="
              p-5
              sm:p-7
              lg:p-8
            "
          >
            {/* =================================================
                HEADER
            ================================================== */}

            <div
              className="
                flex
                items-start
                gap-4
                sm:gap-5
              "
            >
              {/* Icon */}

              <div
                className="
                  grid
                  h-11
                  w-11
                  shrink-0
                  place-items-center

                  rounded-2xl

                  bg-[#e8c375]/10
                  text-[#e8c375]

                  ring-1
                  ring-[#e8c375]/20

                  sm:h-12
                  sm:w-12
                "
              >
                <Cookie
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  aria-hidden="true"
                />
              </div>

              {/* Texte */}

              <div className="min-w-0 flex-1">
                <p
                  className="
                    text-[9px]
                    font-extrabold
                    uppercase
                    tracking-[0.22em]
                    text-[#e8c375]

                    sm:text-[10px]
                  "
                >
                  Datenschutz & Cookies
                </p>

                <h2
                  id="cookie-consent-title"
                  className="
                    mt-1

                    max-w-3xl

                    font-serif
                    text-[1.55rem]
                    font-semibold
                    leading-tight
                    tracking-tight
                    text-white

                    sm:text-3xl
                    lg:text-[2rem]
                  "
                >
                  Deine Privatsphäre ist uns wichtig
                </h2>

                <p
                  className="
                    mt-3

                    max-w-3xl

                    text-[13px]
                    leading-6
                    text-white/60

                    sm:text-[15px]
                    sm:leading-7
                  "
                >
                  Wir verwenden notwendige Technologien,
                  damit Urlaub-GOSCH zuverlässig
                  funktioniert. Externe Medien und
                  Statistik werden nur verwendet, wenn
                  du zustimmst. Deine Entscheidung kannst
                  du jederzeit über die
                  Cookie-Einstellungen ändern.
                </p>

                {/* Links */}

                <div
                  className="
                    mt-4
                    flex
                    flex-wrap
                    gap-x-5
                    gap-y-2
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
                      duration-200

                      hover:text-white

                      focus:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-[#e8c375]/70
                    "
                  >
                    Datenschutzerklärung
                  </Link>

                  <Link
                    href="/impressum"
                    className="
                      text-white/50

                      transition
                      duration-200

                      hover:text-white

                      focus:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-[#e8c375]/70
                    "
                  >
                    Impressum
                  </Link>
                </div>
              </div>

              {/* Schließen */}

              {settingsOpen ? (
                <button
                  type="button"
                  onClick={closeSettings}
                  aria-label="Cookie-Einstellungen schließen"
                  className="
                    grid
                    h-10
                    w-10
                    shrink-0
                    place-items-center

                    rounded-full

                    border
                    border-white/10

                    bg-white/[0.045]
                    text-white/50

                    transition
                    duration-200

                    hover:border-white/20
                    hover:bg-white/10
                    hover:text-white

                    focus:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-[#e8c375]/70
                  "
                >
                  <X
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                </button>
              ) : null}
            </div>

            {/* =================================================
                EINSTELLUNGEN
            ================================================== */}

            {settingsOpen ? (
              <div
                className="
                  mt-6
                  space-y-3

                  border-t
                  border-white/10

                  pt-6
                "
              >
                {/* Notwendig */}

                <ConsentRow
                  icon={ShieldCheck}
                  title="Notwendig"
                  description="Erforderlich für grundlegende Funktionen der Webseite und zum Speichern deiner Datenschutzauswahl."
                  checked
                  locked
                />

                {/* Externe Medien */}

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

                {/* Statistik */}

                <ConsentRow
                  icon={BarChart3}
                  title="Statistik"
                  description="Erlaubt Reichweitenmessung, sofern ein Statistikdienst eingesetzt wird."
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
        </div>

        {/* =====================================================
            FOOTER / BUTTONS
        ====================================================== */}

        <div
          className="
            relative
            shrink-0

            border-t
            border-white/10

            bg-[#06111c]/95
            px-4
            py-4

            backdrop-blur-xl

            sm:px-6
            sm:py-5
          "
        >
          {settingsOpen ? (
            /* ===============================================
               BUTTONS IN EINSTELLUNGEN
            ================================================ */

            <div
              className="
                grid
                gap-2.5

                sm:grid-cols-3
              "
            >
              {/* Nur notwendige */}

              <button
                type="button"
                onClick={acceptNecessary}
                className="
                  inline-flex
                  min-h-12
                  items-center
                  justify-center

                  rounded-xl

                  border
                  border-[#e8c375]/35

                  bg-transparent

                  px-5
                  py-3

                  text-sm
                  font-bold
                  text-[#e8c375]

                  transition
                  duration-200

                  hover:border-[#e8c375]/60
                  hover:bg-[#e8c375]/10

                  focus:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-[#e8c375]/70
                "
              >
                Nur notwendige
              </button>

              {/* Auswahl speichern */}

              <button
                type="button"
                onClick={saveSelection}
                className="
                  inline-flex
                  min-h-12
                  items-center
                  justify-center
                  gap-2

                  rounded-xl

                  border
                  border-white/15

                  bg-white/[0.055]

                  px-5
                  py-3

                  text-sm
                  font-bold
                  text-white

                  transition
                  duration-200

                  hover:border-white/25
                  hover:bg-white/10

                  focus:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-[#e8c375]/70
                "
              >
                <Check
                  className="h-4 w-4"
                  aria-hidden="true"
                />

                Auswahl speichern
              </button>

              {/* Alle akzeptieren */}

              <button
                type="button"
                onClick={acceptAll}
                className="
                  inline-flex
                  min-h-12
                  items-center
                  justify-center

                  rounded-xl

                  border
                  border-[#e8c375]

                  bg-[#e8c375]

                  px-6
                  py-3

                  text-sm
                  font-extrabold
                  text-[#07131f]

                  shadow-[0_10px_30px_rgba(232,195,117,0.12)]

                  transition
                  duration-200

                  hover:border-[#f2d58e]
                  hover:bg-[#f2d58e]

                  focus:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-[#e8c375]
                  focus-visible:ring-offset-2
                  focus-visible:ring-offset-[#07131f]
                "
              >
                Alle akzeptieren
              </button>
            </div>
          ) : (
            /* ===============================================
               ERSTE ANSICHT
            ================================================ */

            <div
              className="
                grid
                gap-2.5

                sm:grid-cols-3
              "
            >
              {/* Nur notwendige */}

              <button
                type="button"
                onClick={acceptNecessary}
                className="
                  inline-flex
                  min-h-12
                  items-center
                  justify-center

                  rounded-xl

                  border
                  border-[#e8c375]/35

                  bg-transparent

                  px-5
                  py-3

                  text-sm
                  font-bold
                  text-[#e8c375]

                  transition
                  duration-200

                  hover:border-[#e8c375]/60
                  hover:bg-[#e8c375]/10

                  focus:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-[#e8c375]/70
                "
              >
                Nur notwendige
              </button>

              {/* Einstellungen */}

              <button
                type="button"
                onClick={() =>
                  setSettingsOpen(true)
                }
                className="
                  inline-flex
                  min-h-12
                  items-center
                  justify-center
                  gap-2

                  rounded-xl

                  border
                  border-white/15

                  bg-white/[0.055]

                  px-5
                  py-3

                  text-sm
                  font-bold
                  text-white

                  transition
                  duration-200

                  hover:border-white/25
                  hover:bg-white/10

                  focus:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-[#e8c375]/70
                "
              >
                <SlidersHorizontal
                  className="h-4 w-4"
                  aria-hidden="true"
                />

                Einstellungen
              </button>

              {/* Alle akzeptieren */}

              <button
                type="button"
                onClick={acceptAll}
                className="
                  inline-flex
                  min-h-12
                  items-center
                  justify-center

                  rounded-xl

                  border
                  border-[#e8c375]

                  bg-[#e8c375]

                  px-6
                  py-3

                  text-sm
                  font-extrabold
                  text-[#07131f]

                  shadow-[0_10px_30px_rgba(232,195,117,0.12)]

                  transition
                  duration-200

                  hover:border-[#f2d58e]
                  hover:bg-[#f2d58e]

                  focus:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-[#e8c375]
                  focus-visible:ring-offset-2
                  focus-visible:ring-offset-[#07131f]
                "
              >
                Alle akzeptieren
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

/* ============================================================
   CONSENT ROW
============================================================ */

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
        group

        rounded-2xl

        border
        border-white/10

        bg-white/[0.035]

        px-4
        py-4

        transition
        duration-200

        hover:border-white/[0.16]
        hover:bg-white/[0.045]

        sm:px-5
        sm:py-5
      "
    >
      <div
        className="
          flex
          items-center
          gap-4

          sm:gap-5
        "
      >
        {/* ===================================================
            ICON
        ==================================================== */}

        <div
          className="
            grid
            h-11
            w-11
            shrink-0
            place-items-center

            rounded-xl

            bg-white/[0.055]
            text-[#e8c375]

            ring-1
            ring-white/[0.04]

            sm:h-12
            sm:w-12
          "
        >
          <Icon
            className="h-5 w-5"
            aria-hidden="true"
          />
        </div>

        {/* ===================================================
            TEXT + STEUERUNG
        ==================================================== */}

        <div className="min-w-0 flex-1">
          <div
            className="
              flex
              items-center
              justify-between
              gap-5
            "
          >
            {/* Titel */}

            <h3
              className="
                min-w-0

                text-[15px]
                font-extrabold
                leading-tight
                text-white

                sm:text-base
              "
            >
              {title}
            </h3>

            {/* Desktop Steuerung */}

            <div
              className="
                hidden
                shrink-0
                sm:block
              "
            >
              {locked ? (
                <LockedStatus />
              ) : (
                <ConsentSwitch
                  checked={checked}
                  title={title}
                  onChange={onChange}
                />
              )}
            </div>
          </div>

          {/* Beschreibung */}

          <p
            className="
              mt-1.5

              max-w-[650px]

              text-xs
              leading-5
              text-white/50

              sm:text-[13px]
              sm:leading-5
            "
          >
            {description}
          </p>

          {/* Mobile Steuerung */}

          <div className="mt-3 sm:hidden">
            {locked ? (
              <LockedStatus />
            ) : (
              <ConsentSwitch
                checked={checked}
                title={title}
                onChange={onChange}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   LOCKED / IMMER AKTIV
============================================================ */

function LockedStatus() {
  return (
    <div
      className="
        inline-flex
        h-9
        shrink-0
        items-center
        gap-2

        rounded-full

        border
        border-[#e8c375]/15

        bg-[#e8c375]/[0.08]

        px-3.5

        text-[9px]
        font-extrabold
        uppercase
        tracking-[0.13em]
        text-[#e8c375]

        sm:text-[10px]
      "
    >
      <span
        aria-hidden="true"
        className="
          h-1.5
          w-1.5
          rounded-full

          bg-[#e8c375]

          shadow-[0_0_8px_rgba(232,195,117,0.55)]
        "
      />

      Immer aktiv
    </div>
  );
}

/* ============================================================
   SWITCH
============================================================ */

function ConsentSwitch({
  checked,
  title,
  onChange,
}) {
  return (
    <div
      className="
        inline-flex
        items-center
        gap-3
      "
    >
      {/* ===================================================
          STATUS
      ==================================================== */}

      <span
        className={[
          "min-w-[30px]",
          "text-right",
          "text-[9px]",
          "font-extrabold",
          "uppercase",
          "tracking-[0.12em]",
          "transition-colors",
          "duration-200",
          "sm:text-[10px]",

          checked
            ? "text-[#e8c375]"
            : "text-white/35",
        ].join(" ")}
      >
        {checked ? "An" : "Aus"}
      </span>

      {/* ===================================================
          SWITCH BUTTON
      ==================================================== */}

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={`${title}: ${
          checked ? "aktiviert" : "deaktiviert"
        }`}
        onClick={() => {
          onChange?.(!checked);
        }}
        className={[
          "relative",
          "h-[30px]",
          "w-[52px]",
          "shrink-0",
          "overflow-hidden",

          "rounded-full",

          "border",

          "transition-all",
          "duration-200",
          "ease-out",

          "focus:outline-none",
          "focus-visible:ring-2",
          "focus-visible:ring-[#e8c375]/70",
          "focus-visible:ring-offset-2",
          "focus-visible:ring-offset-[#07131f]",

          checked
            ? [
                "border-[#e8c375]/50",
                "bg-[#e8c375]",
                "shadow-[0_0_0_4px_rgba(232,195,117,0.06)]",
              ].join(" ")
            : [
                "border-white/10",
                "bg-white/10",
              ].join(" "),
        ].join(" ")}
      >
        {/* Switch Knopf */}

        <span
          aria-hidden="true"
          className={[
            "absolute",

            "left-[4px]",
            "top-[4px]",

            "h-5",
            "w-5",

            "rounded-full",

            "shadow-[0_2px_8px_rgba(0,0,0,0.3)]",

            "transition-all",
            "duration-200",
            "ease-out",

            checked
              ? [
                  "translate-x-[22px]",
                  "bg-[#07131f]",
                ].join(" ")
              : [
                  "translate-x-0",
                  "bg-white/80",
                ].join(" "),
          ].join(" ")}
        />
      </button>
    </div>
  );
}