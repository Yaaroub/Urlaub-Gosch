"use client";

import { useEffect, useRef } from "react";

/**
 * Intelligente Buchungs-Sidebar ohne eigenen Scrollbereich.
 *
 * - Vor dem Buchungsblock: normale Position im Dokument.
 * - Passt der Block in den Viewport: oben unter dem Header fixiert.
 * - Ist der Block höher als der freie Viewport: Beim Scrollen nach unten
 *   wandert er mit, bis seine Unterkante sichtbar ist. Beim Scrollen nach
 *   oben erscheint seine Oberkante wieder.
 * - Am Ende der Inhaltssektion stoppt er, damit Footer und weitere Inhalte
 *   nicht überlagert werden.
 */
export default function StickyBookingSidebar({
  before,
  children,
  topOffset = 112,
  bottomOffset = 16,
}) {
  const containerRef = useRef(null);
  const anchorRef = useRef(null);
  const panelRef = useRef(null);

  const previousScrollYRef = useRef(0);
  const floatingTopRef = useRef(topOffset);
  const modeRef = useRef("normal");

  useEffect(() => {
    const container = containerRef.current;
    const anchor = anchorRef.current;
    const panel = panelRef.current;

    if (!container || !anchor || !panel) return undefined;

    let frameId = 0;
    let resizeObserver;

    const setNormal = () => {
      anchor.style.height = "auto";

      panel.style.position = "relative";
      panel.style.top = "auto";
      panel.style.right = "auto";
      panel.style.bottom = "auto";
      panel.style.left = "auto";
      panel.style.width = "auto";
      panel.style.zIndex = "auto";

      modeRef.current = "normal";
      floatingTopRef.current = topOffset;
    };

    const setFixed = ({ top, left, width, height }) => {
      anchor.style.height = `${height}px`;

      panel.style.position = "fixed";
      panel.style.top = `${top}px`;
      panel.style.right = "auto";
      panel.style.bottom = "auto";
      panel.style.left = `${left}px`;
      panel.style.width = `${width}px`;
      panel.style.zIndex = "40";

      modeRef.current = "fixed";
    };

    const setStoppedAtBottom = (height) => {
      anchor.style.height = `${height}px`;

      panel.style.position = "absolute";
      panel.style.top = "auto";
      panel.style.right = "0";
      panel.style.bottom = "0";
      panel.style.left = "0";
      panel.style.width = "auto";
      panel.style.zIndex = "20";

      modeRef.current = "bottom";
    };

    const update = () => {
      frameId = 0;

      const scrollY = window.scrollY;

      // Auf Mobilgeräten bleibt alles normal im Seitenfluss.
      if (window.innerWidth < 1024) {
        setNormal();
        previousScrollYRef.current = scrollY;
        return;
      }

      const anchorRect = anchor.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const panelHeight = panel.offsetHeight;
      const panelWidth = anchorRect.width;
      const viewportHeight = window.innerHeight;

      // Solange der Anfrageblock seine normale Position noch nicht erreicht
      // hat, bleibt er vollständig im Dokumentfluss.
      if (anchorRect.top >= topOffset) {
        setNormal();
        previousScrollYRef.current = scrollY;
        return;
      }

      const maximumTop = topOffset;

      // Ist der Block höher als der freie Platz, darf seine Oberkante beim
      // Herunterscrollen nach oben wandern. Dadurch wird die Unterkante über
      // den normalen Seitenscroll erreichbar – ohne inneren Scrollbereich.
      const minimumTop = Math.min(
        maximumTop,
        viewportHeight - bottomOffset - panelHeight,
      );

      const wasFloating = modeRef.current === "fixed";
      const scrollDelta = scrollY - previousScrollYRef.current;

      if (!wasFloating) {
        // Beim erstmaligen Fixieren immer sauber unter dem Header beginnen.
        floatingTopRef.current = maximumTop;
      } else if (scrollDelta > 0) {
        // Nach unten: Block nach oben bewegen, bis seine Unterkante sichtbar ist.
        floatingTopRef.current = Math.max(
          minimumTop,
          floatingTopRef.current - scrollDelta,
        );
      } else if (scrollDelta < 0) {
        // Nach oben: Block wieder bis unter den Header zurückholen.
        floatingTopRef.current = Math.min(
          maximumTop,
          floatingTopRef.current - scrollDelta,
        );
      }

      // Nach Resize oder dynamischen Formularänderungen immer neu begrenzen.
      floatingTopRef.current = Math.max(
        minimumTop,
        Math.min(maximumTop, floatingTopRef.current),
      );

      // Sobald die Unterkante des Containers erreicht wird, bleibt der Block
      // dort stehen und überlagert weder Footer noch nachfolgende Sektionen.
      if (
        containerRect.bottom <=
        floatingTopRef.current + panelHeight
      ) {
        setStoppedAtBottom(panelHeight);
        previousScrollYRef.current = scrollY;
        return;
      }

      setFixed({
        top: floatingTopRef.current,
        left: anchorRect.left,
        width: panelWidth,
        height: panelHeight,
      });

      previousScrollYRef.current = scrollY;
    };

    const requestUpdate = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(update);
    };

    previousScrollYRef.current = window.scrollY;
    update();

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(requestUpdate);
      resizeObserver.observe(container);
      resizeObserver.observe(anchor);
      resizeObserver.observe(panel);
    }

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      resizeObserver?.disconnect();
      setNormal();
    };
  }, [bottomOffset, topOffset]);

  return (
    <aside
      ref={containerRef}
      aria-label="Verfügbarkeit und Buchung"
      className="relative min-w-0 self-stretch lg:h-full"
    >
      {before}

      <div ref={anchorRef} className="mt-6 min-w-0">
        <div ref={panelRef} className="min-w-0">
          {children}
        </div>
      </div>
    </aside>
  );
}