"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

import {
  ArrowUpRight,
  Compass,
  MapPinned,
  Waves,
} from "lucide-react";

import LazyWeatherWidget from "@/components/LazyWeatherWidget";

const DESKTOP_BREAKPOINT = 1280;

/*
 * Abstand vom oberen Viewport-Rand.
 *
 * Header + etwas Luft.
 * Falls dein Header später höher/niedriger wird,
 * musst du nur diesen Wert ändern.
 */
const STICKY_TOP = 112;

const BOTTOM_GAP = 24;

export default function HomePlanningRails({ children }) {
  return (
    <div
      className="
        relative
        mx-auto
        w-full
        max-w-[1536px]

        px-4
        sm:px-5
        lg:px-6
        xl:px-5
        2xl:px-6
      "
    >
      <div
        className="
          relative
          min-w-0

          xl:grid
          xl:grid-cols-[190px_minmax(0,1fr)_300px]
          xl:items-stretch
          xl:gap-5

          2xl:grid-cols-[205px_minmax(0,1fr)_315px]
          2xl:gap-7

          min-[1700px]:grid-cols-[215px_minmax(0,1fr)_325px]
          min-[1700px]:gap-8
        "
      >
        {/* =====================================================
            LINKS
        ====================================================== */}

        <aside
          aria-label="Aktivitäten an der Ostsee"
          className="
            relative
            hidden
            min-w-0
            xl:block
          "
        >
          <StickyRail>
            <ActivityCard />
          </StickyRail>
        </aside>

        {/* =====================================================
            MITTE
        ====================================================== */}

        <div className="min-w-0 self-start">
          {children}
        </div>

        {/* =====================================================
            RECHTS
        ====================================================== */}

        <aside
          aria-label="Aktuelles Ostsee-Wetter"
          className="
            relative
            hidden
            min-w-0
            xl:block
          "
        >
          <StickyRail>
            <WeatherCard />
          </StickyRail>
        </aside>
      </div>
    </div>
  );
}

/* ============================================================
   ROBUSTER STICKY RAIL

   Drei Zustände:

   1. normal
      Karte steht an ihrer normalen Position.

   2. fixed
      Karte bleibt unter dem Header sichtbar.

   3. bottom
      Am Ende der Ergebnisliste wird sie innerhalb
      ihrer Spalte festgehalten.

   Dadurch:
   - kein interner Scrollbereich
   - keine Überlagerung des Contents
   - kein Weiterlaufen in Last-Minute/Footer
============================================================ */

function StickyRail({ children }) {
  const containerRef = useRef(null);
  const anchorRef = useRef(null);
  const panelRef = useRef(null);

  const modeRef = useRef("normal");

  useEffect(() => {
    const container = containerRef.current;
    const anchor = anchorRef.current;
    const panel = panelRef.current;

    if (!container || !anchor || !panel) {
      return undefined;
    }

    let frameId = 0;
    let resizeObserver;

    /* -------------------------------------------------------
       NORMAL
    ------------------------------------------------------- */

    const setNormal = () => {
      const panelHeight = panel.offsetHeight;

      anchor.style.height = `${panelHeight}px`;

      panel.style.position = "relative";

      panel.style.top = "auto";
      panel.style.right = "auto";
      panel.style.bottom = "auto";
      panel.style.left = "auto";

      panel.style.width = "100%";

      panel.style.zIndex = "auto";

      modeRef.current = "normal";
    };

    /* -------------------------------------------------------
       FIXED
    ------------------------------------------------------- */

    const setFixed = ({
      left,
      width,
      height,
    }) => {
      anchor.style.height = `${height}px`;

      panel.style.position = "fixed";

      panel.style.top = `${STICKY_TOP}px`;
      panel.style.right = "auto";
      panel.style.bottom = "auto";

      panel.style.left = `${left}px`;
      panel.style.width = `${width}px`;

      panel.style.zIndex = "30";

      modeRef.current = "fixed";
    };

    /* -------------------------------------------------------
       UNTEN STOPPEN
    ------------------------------------------------------- */

    const setBottom = (height) => {
      anchor.style.height = `${height}px`;

      panel.style.position = "absolute";

      panel.style.top = "auto";
      panel.style.right = "0";
      panel.style.bottom = "0";
      panel.style.left = "0";

      panel.style.width = "100%";

      panel.style.zIndex = "20";

      modeRef.current = "bottom";
    };

    /* -------------------------------------------------------
       POSITION BERECHNEN
    ------------------------------------------------------- */

    const update = () => {
      frameId = 0;

      /*
       * Unter 1280px existieren die Desktop-Rails nicht.
       */
      if (window.innerWidth < DESKTOP_BREAKPOINT) {
        setNormal();
        return;
      }

      const anchorRect =
        anchor.getBoundingClientRect();

      const containerRect =
        container.getBoundingClientRect();

      const panelHeight =
        panel.offsetHeight;

      const railWidth =
        anchorRect.width;

      /*
       * Die normale Ausgangsposition wurde noch nicht
       * bis unter den Header gescrollt.
       */
      if (anchorRect.top >= STICKY_TOP) {
        setNormal();
        return;
      }

      /*
       * Prüfen, ob unten noch genug Platz vorhanden ist.
       *
       * Wenn nicht:
       * Die Karte wird am unteren Ende ihrer Spalte
       * absolut positioniert.
       */
      const requiredBottom =
        STICKY_TOP +
        panelHeight +
        BOTTOM_GAP;

      if (containerRect.bottom <= requiredBottom) {
        setBottom(panelHeight);
        return;
      }

      /*
       * Standardfall beim Scrollen:
       * Karte bleibt unter dem Header stehen.
       */
      setFixed({
        left: anchorRect.left,
        width: railWidth,
        height: panelHeight,
      });
    };

    /* -------------------------------------------------------
       RAF
    ------------------------------------------------------- */

    const requestUpdate = () => {
      if (frameId) return;

      frameId =
        window.requestAnimationFrame(update);
    };

    /* -------------------------------------------------------
       INIT
    ------------------------------------------------------- */

    update();

    window.addEventListener(
      "scroll",
      requestUpdate,
      {
        passive: true,
      },
    );

    window.addEventListener(
      "resize",
      requestUpdate,
    );

    /* -------------------------------------------------------
       DYNAMISCHE GRÖSSEN

       Wichtig beim Wetter:
       Daten können nachgeladen werden und dadurch verändert
       sich dessen Höhe.
    ------------------------------------------------------- */

    if (
      typeof ResizeObserver !==
      "undefined"
    ) {
      resizeObserver =
        new ResizeObserver(
          requestUpdate,
        );

      resizeObserver.observe(
        container,
      );

      resizeObserver.observe(
        anchor,
      );

      resizeObserver.observe(
        panel,
      );
    }

    /* -------------------------------------------------------
       CLEANUP
    ------------------------------------------------------- */

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(
          frameId,
        );
      }

      window.removeEventListener(
        "scroll",
        requestUpdate,
      );

      window.removeEventListener(
        "resize",
        requestUpdate,
      );

      resizeObserver?.disconnect();

      setNormal();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="
        relative
        h-full
        min-w-0
      "
    >
      <div
        ref={anchorRef}
        className="
          relative
          min-w-0
        "
      >
        <div
          ref={panelRef}
          className="
            min-w-0
            will-change-transform
          "
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   AKTIVITÄTEN
============================================================ */

function ActivityCard() {
  return (
    <Link
      href="/aktivitaeten"
      aria-label="Aktivitäten und Ausflugsziele an der Ostsee entdecken"
      className="
        group
        relative
        block
        overflow-hidden

        rounded-[24px]

        border
        border-slate-200/90

        bg-white
        text-slate-950

        shadow-[0_14px_38px_rgba(15,23,42,0.075)]

        transition-[transform,border-color,box-shadow]
        duration-300
        ease-out

        hover:-translate-y-0.5
        hover:border-sky-200
        hover:shadow-[0_20px_50px_rgba(15,23,42,0.11)]

        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-sky-400
        focus-visible:ring-offset-2
      "
    >
      {/* Hintergrund */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-x-0
          top-0

          h-[115px]

          bg-gradient-to-br
          from-sky-50
          via-cyan-50/70
          to-white
        "
      />

      {/* Glow */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute

          -right-12
          -top-14

          h-36
          w-36

          rounded-full

          bg-sky-300/20
          blur-3xl
        "
      />

      <div className="relative p-[18px]">
        {/* ===================================================
            ICONS
        ==================================================== */}

        <div
          className="
            flex
            items-start
            justify-between
            gap-3
          "
        >
          <span
            className="
              grid

              h-11
              w-11

              shrink-0
              place-items-center

              rounded-[15px]

              border
              border-sky-100

              bg-white
              text-sky-700

              shadow-[0_4px_14px_rgba(15,23,42,0.06)]
            "
          >
            <MapPinned
              className="h-5 w-5"
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </span>

          <span
            className="
              grid

              h-8
              w-8

              shrink-0
              place-items-center

              rounded-full

              border
              border-slate-200

              bg-white
              text-slate-500

              transition-all
              duration-300

              group-hover:border-sky-200
              group-hover:bg-sky-50
              group-hover:text-sky-700
            "
          >
            <ArrowUpRight
              className="
                h-3.5
                w-3.5

                transition-transform
                duration-300

                group-hover:translate-x-[1px]
                group-hover:-translate-y-[1px]
              "
              aria-hidden="true"
            />
          </span>
        </div>

        {/* ===================================================
            LABEL
        ==================================================== */}

        <div
          className="
            mt-6

            flex
            items-center
            gap-1.5

            text-[9px]
            font-extrabold
            uppercase

            tracking-[0.18em]

            text-sky-700
          "
        >
          <Waves
            className="
              h-3.5
              w-3.5
              shrink-0
            "
            strokeWidth={1.8}
            aria-hidden="true"
          />

          <span>
            Ostsee erleben
          </span>
        </div>

        {/* ===================================================
            TITEL
        ==================================================== */}

        <h3
          className="
            mt-2

            text-[18px]
            font-semibold
            leading-[1.22]

            tracking-[-0.025em]

            text-slate-950
          "
        >
          Aktivitäten entdecken
        </h3>

        {/* ===================================================
            BESCHREIBUNG
        ==================================================== */}

        <p
          className="
            mt-3

            text-[12.5px]
            leading-[1.65]

            text-slate-600
          "
        >
          Strände, Natur und schöne
          Ausflugsziele rund um Ihre
          Ferienunterkunft.
        </p>

        {/* ===================================================
            CTA
        ==================================================== */}

        <div
          className="
            mt-5

            flex
            items-center
            justify-between
            gap-3

            border-t
            border-slate-100

            pt-4
          "
        >
          <span
            className="
              text-[12.5px]
              font-bold
              text-slate-900

              transition-colors
              duration-300

              group-hover:text-sky-700
            "
          >
            Karte öffnen
          </span>

          <Compass
            className="
              h-4
              w-4
              shrink-0

              text-sky-600

              transition-transform
              duration-300

              group-hover:rotate-12
            "
            strokeWidth={1.8}
            aria-hidden="true"
          />
        </div>
      </div>
    </Link>
  );
}

/* ============================================================
   WETTER
============================================================ */

function WeatherCard() {
  return (
    <div
      className="
        relative
        min-w-0
        overflow-hidden

        rounded-[26px]

        border
        border-slate-200/80

        bg-white

        shadow-[0_14px_38px_rgba(15,23,42,0.08)]

        transition-shadow
        duration-300

        hover:shadow-[0_20px_50px_rgba(15,23,42,0.11)]
      "
    >
      {/* Glow */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute

          -right-20
          -top-20

          h-44
          w-44

          rounded-full

          bg-sky-300/10
          blur-3xl
        "
      />

      {/* Wetter bleibt komplett sichtbar */}

      <div
        className="
          relative
          min-w-0
          overflow-hidden
        "
      >
        <LazyWeatherWidget />
      </div>
    </div>
  );
}