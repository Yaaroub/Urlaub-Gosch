"use client";

import { useEffect, useRef, useState } from "react";
import {
  Camera,
  ExternalLink,
  ImageOff,
  RefreshCw,
  Waves,
  X,
} from "lucide-react";

const WEBCAMS = [
  {
    id: "brasilien",
    name: "Strand Brasilien",
    eyebrow: "Schönberg · Brasilien",
    location: "Brasilien an der Ostsee",
    region: "Probstei · Kieler Bucht",
    description:
      "Aktueller Blick auf den Ostseestrand von Brasilien bei Schönberg. Die Webcam befindet sich am Ferienhaus Strandblick in unmittelbarer Nähe zur Ostsee.",
    imageUrl:
      "https://www.baltic-sea-webcam.de/webcam/latest.jpg",
    sourceUrl:
      "https://www.baltic-sea-webcam.de/",
    sourceName: "Baltic Sea Webcam",
    refreshLabel: "Neues Kamerabild etwa alle 5 Minuten",
    refreshInterval: 5 * 60 * 1000,
  },
  {
    id: "holm",
    name: "Webcam Holm",
    eyebrow: "Schönberg · Holm",
    location: "Ferienpark Holm",
    region: "Probstei · Ostsee",
    description:
      "Aktueller Webcam-Blick aus dem Bereich Holm bei Schönberg an der Ostsee. Die Kamera vermittelt einen Eindruck vom Wetter und der aktuellen Situation vor Ort.",
    imageUrl:
      "https://www.ostsee-blick.com/webcam/image.jpg",
    sourceUrl:
      "https://www.ostsee-blick.com/",
    sourceName: "Ostsee-Blick Holm",
    refreshLabel: "Kamerabild wird regelmäßig aktualisiert",
    refreshInterval: 60 * 1000,
  },
];

function WebcamCard({ webcam, active }) {
  const [version, setVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const refreshImage = () => {
    setLoading(true);
    setFailed(false);
    setVersion(Date.now());
  };

  useEffect(() => {
    if (!active) return;

    refreshImage();

    const interval = window.setInterval(() => {
      refreshImage();
    }, webcam.refreshInterval);

    return () => {
      window.clearInterval(interval);
    };
  }, [active, webcam.refreshInterval]);

  const imageSrc =
    active && version
      ? `${webcam.imageUrl}${
          webcam.imageUrl.includes("?") ? "&" : "?"
        }v=${version}`
      : null;

  return (
    <article
      className="
        overflow-hidden rounded-[1.35rem]
        border border-slate-200
        bg-white
        shadow-[0_8px_28px_rgba(7,19,31,0.06)]
      "
      itemScope
      itemType="https://schema.org/CreativeWork"
    >
      <meta itemProp="name" content={webcam.name} />
      <meta itemProp="description" content={webcam.description} />
      <meta itemProp="contentLocation" content={webcam.location} />

      <div
        className="
          relative aspect-[16/8.3]
          overflow-hidden bg-[#eaf0f3]
        "
      >
        {active && !failed && imageSrc ? (
          <>
            {loading ? (
              <div
                className="
                  absolute inset-0 z-10
                  flex items-center justify-center
                  bg-[#eef3f5]
                "
              >
                <div className="flex flex-col items-center gap-2">
                  <RefreshCw
                    className="
                      h-5 w-5 animate-spin
                      text-[#07131f]/45
                    "
                  />

                  <span
                    className="
                      text-[11px] font-semibold
                      text-slate-500
                    "
                  >
                    Kamerabild wird geladen …
                  </span>
                </div>
              </div>
            ) : null}

            <img
              src={imageSrc}
              alt={`Aktuelles Webcam-Bild vom ${webcam.location} an der Ostsee`}
              className="
                h-full w-full object-cover
                transition duration-500
              "
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onLoad={() => {
                setLoading(false);
                setFailed(false);
              }}
              onError={() => {
                setLoading(false);
                setFailed(true);
              }}
            />

            <div
              className="
                pointer-events-none absolute inset-0
                bg-gradient-to-t
                from-[#07131f]/45
                via-transparent
                to-transparent
              "
            />

            <div
              className="
                absolute bottom-3 left-3
                inline-flex items-center gap-2
                rounded-full
                border border-white/20
                bg-[#07131f]/60
                px-3 py-1.5
                text-[10px] font-bold
                uppercase tracking-[0.12em]
                text-white
                backdrop-blur-md
              "
            >
              <Camera className="h-3.5 w-3.5" />

              Aktuelles Bild
            </div>
          </>
        ) : null}

        {failed ? (
          <div
            className="
              absolute inset-0
              flex flex-col items-center
              justify-center
              px-6 text-center
            "
          >
            <div
              className="
                grid h-12 w-12 place-items-center
                rounded-full bg-white
                text-slate-400 shadow-sm
              "
            >
              <ImageOff className="h-5 w-5" />
            </div>

            <p
              className="
                mt-3 text-sm font-bold
                text-[#07131f]
              "
            >
              Kamerabild momentan nicht erreichbar
            </p>

            <p
              className="
                mt-1 max-w-[260px]
                text-xs leading-5
                text-slate-500
              "
            >
              Die externe Webcam-Quelle antwortet derzeit nicht.
            </p>
          </div>
        ) : null}

        {!active ? (
          <div
            className="
              absolute inset-0
              flex items-center justify-center
              bg-[#eef3f5]
            "
          >
            <Camera
              className="
                h-8 w-8
                text-[#07131f]/20
              "
            />
          </div>
        ) : null}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p
              className="
                text-[10px] font-extrabold
                uppercase tracking-[0.15em]
                text-sky-700
              "
            >
              {webcam.eyebrow}
            </p>

            <h3
              className="
                mt-1 text-base font-extrabold
                tracking-tight text-[#07131f]
              "
              itemProp="headline"
            >
              {webcam.name}
            </h3>
          </div>

          <div
            className="
              grid h-9 w-9 shrink-0
              place-items-center rounded-full
              bg-sky-50 text-sky-700
            "
            aria-hidden="true"
          >
            <Waves className="h-4 w-4" />
          </div>
        </div>

        <p
          className="
            mt-2 text-[13px] leading-[1.55]
            text-slate-600
          "
          itemProp="abstract"
        >
          {webcam.description}
        </p>

        <div
          className="
            mt-3 rounded-xl
            border border-sky-100
            bg-sky-50/70
            px-3 py-2.5
          "
        >
          <div
            className="
              flex items-start gap-2
              text-xs text-slate-600
            "
          >
            <RefreshCw
              className="
                mt-0.5 h-3.5 w-3.5
                shrink-0 text-sky-700
              "
            />

            <div>
              <p className="font-bold text-[#07131f]">
                {webcam.refreshLabel}
              </p>

              <p className="mt-0.5 leading-5">
                Kein durchgehendes Live-Video, sondern ein automatisch
                erneuertes Webcam-Standbild.
              </p>
            </div>
          </div>
        </div>

        <div
          className="
            mt-3 flex flex-wrap
            items-center justify-between gap-2
          "
        >
          <span
            className="
              text-[11px] font-medium
              text-slate-400
            "
          >
            {webcam.region}
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={refreshImage}
              disabled={!active}
              className="
                inline-flex items-center gap-1.5
                rounded-full
                px-3 py-2
                text-[11px] font-bold
                text-slate-600
                transition
                hover:bg-slate-100
                hover:text-[#07131f]
                disabled:pointer-events-none
                disabled:opacity-40
              "
            >
              <RefreshCw className="h-3.5 w-3.5" />

              Aktualisieren
            </button>

            <a
              href={webcam.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="
                inline-flex items-center gap-1.5
                rounded-full
                px-3 py-2
                text-[11px] font-bold
                text-slate-600
                transition
                hover:bg-slate-100
                hover:text-[#07131f]
              "
              aria-label={`${webcam.name} bei ${webcam.sourceName} öffnen`}
            >
              Quelle

              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function HeaderWebcams({
  open,
  onOpenChange,
  compact,
}) {
  const rootRef = useRef(null);

  useEffect(() => {
    function handlePointerDown(event) {
      if (
        open &&
        rootRef.current &&
        !rootRef.current.contains(event.target)
      ) {
        onOpenChange(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener(
        "mousedown",
        handlePointerDown
      );
    };
  }, [open, onOpenChange]);

  return (
    <div
      ref={rootRef}
      className="relative"
    >
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-label={
          open
            ? "Strand-Webcams schließen"
            : "Strand-Webcams öffnen"
        }
        aria-expanded={open}
        aria-controls="header-webcams-panel"
        className={[
          `
            relative grid place-items-center
            rounded-full
            text-[#07131f]
            transition
            hover:bg-white/70
          `,
          compact
            ? `
                h-10 w-10 bg-white/55
                sm:h-11 sm:w-11
              `
            : `
                h-11 w-11
                bg-white/28
                backdrop-blur-md
                sm:h-12 sm:w-12
              `,
        ].join(" ")}
      >
        <Camera className="h-5 w-5" />

        <span
          className="
            absolute -right-0.5 -top-0.5
            grid min-h-4 min-w-4
            place-items-center
            rounded-full
            bg-[#e8c375]
            px-1
            text-[9px] font-black
            leading-none text-[#07131f]
            ring-2 ring-white/80
          "
          aria-hidden="true"
        >
          2
        </span>
      </button>

      {/*
        Absichtlich immer im DOM:
        Texte sind auch ohne Interaktion im HTML vorhanden.
        Die externen Bilder werden aber erst bei open=true geladen.
      */}
      <section
        id="header-webcams-panel"
        aria-label="Aktuelle Strand-Webcams an der Ostsee"
        aria-hidden={!open}
        className={[
          `
            fixed
            left-3 right-3
            top-[88px]
            z-[90]

            max-h-[calc(100vh-105px)]
            overflow-y-auto

            rounded-[1.75rem]
            border border-slate-200/90
            bg-[#f7fafc]/98

            shadow-[0_25px_90px_rgba(7,19,31,0.28)]
            backdrop-blur-2xl

            transition-all duration-200

            sm:left-auto
            sm:right-6
            sm:top-[94px]
            sm:w-[440px]

            lg:absolute
            lg:right-0
            lg:left-auto
            lg:top-[calc(100%+14px)]
            lg:w-[450px]
          `,
          open
            ? `
                visible
                translate-y-0
                opacity-100
                pointer-events-auto
              `
            : `
                invisible
                -translate-y-2
                opacity-0
                pointer-events-none
              `,
        ].join(" ")}
      >
        <div
          className="
            sticky top-0 z-20
            flex items-start
            justify-between gap-4
            border-b border-slate-200
            bg-[#f7fafc]/95
            px-5 py-4
            backdrop-blur-xl
          "
        >
          <div>
            <div
              className="
                flex items-center gap-2
                text-[10px] font-extrabold
                uppercase tracking-[0.18em]
                text-sky-700
              "
            >
              <Waves className="h-3.5 w-3.5" />

              Ostsee aktuell
            </div>

            <h2
              className="
                mt-1 text-lg font-extrabold
                tracking-tight text-[#07131f]
              "
            >
              Strand-Webcams
            </h2>

            <p
              className="
                mt-1 max-w-[330px]
                text-xs leading-5
                text-slate-500
              "
            >
              Aktuelle Eindrücke aus Brasilien und Holm bei
              Schönberg an der Ostsee. Die Kameras zeigen
              regelmäßig automatisch aktualisierte Standbilder.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Webcams schließen"
            className="
              grid h-9 w-9 shrink-0
              place-items-center
              rounded-full
              border border-slate-200
              bg-white
              text-slate-500
              shadow-sm
              transition
              hover:bg-slate-100
              hover:text-[#07131f]
            "
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 p-3.5">
          {WEBCAMS.map((webcam) => (
            <WebcamCard
              key={webcam.id}
              webcam={webcam}
              active={open}
            />
          ))}
        </div>

        <div
          className="
            border-t border-slate-200
            bg-white/70
            px-5 py-3.5
          "
        >
          <p
            className="
              text-[11px] leading-5
              text-slate-500
            "
          >
            <strong className="font-bold text-slate-700">
              Hinweis:
            </strong>{" "}
            Die Bilder sind keine permanenten Video-Livestreams.
            Sie werden von den jeweiligen Webcams regelmäßig neu
            aufgenommen und automatisch aktualisiert.
          </p>
        </div>
      </section>
    </div>
  );
}