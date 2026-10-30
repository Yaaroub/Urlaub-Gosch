"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import StayQuote from "./StayQuote";

export default function FloatingStayQuote({ selection, calendarRef, onClear }) {
  const popupRef = useRef(null);
  const [position, setPosition] = useState(null);

  useLayoutEffect(() => {
    const calendar = calendarRef.current;
    const popup = popupRef.current;
    if (!calendar || !popup) return;
    let frame;
    function update() {
      const cells = [...calendar.querySelectorAll('button[aria-pressed="true"]')];
      const container = calendar.getBoundingClientRect();
      const rects = cells.map((cell) => cell.getBoundingClientRect()).filter((rect) => rect.right > container.left && rect.left < container.right && rect.bottom > Math.max(0, container.top) && rect.top < Math.min(window.innerHeight, container.bottom));
      if (!rects.length) { setPosition(null); return; }
      const first = rects[0];
      const last = rects[rects.length - 1];
      const center = (Math.max(first.left, container.left) + Math.min(last.right, container.right)) / 2;
      const size = popup.getBoundingClientRect();
      const left = Math.max(12, Math.min(center - size.width / 2, window.innerWidth - size.width - 12));
      const above = first.top - size.height - 12;
      const top = above >= 12 ? above : Math.max(12, Math.min(first.bottom + 12, window.innerHeight - size.height - 12));
      setPosition({ left, top });
    }
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    const observer = new ResizeObserver(schedule);
    observer.observe(popup);
    observer.observe(calendar);
    window.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);
    const dismiss = (event) => {
      if (event.type === "keydown" && event.key === "Escape") onClear();
      if (event.type === "pointerdown" && !popup.contains(event.target) && !calendar.contains(event.target)) onClear();
    };
    document.addEventListener("keydown", dismiss);
    document.addEventListener("pointerdown", dismiss);
    update();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("keydown", dismiss);
      document.removeEventListener("pointerdown", dismiss);
    };
  }, [selection, calendarRef, onClear]);

  return createPortal(<div ref={popupRef} role="dialog" aria-label="Preis für den markierten Aufenthalt" className="fixed z-[100] max-h-[70vh] w-[290px] max-w-[calc(100vw-24px)] overflow-auto rounded-xl border border-slate-200 bg-white p-4 shadow-[0_12px_40px_rgba(15,23,42,0.22)]" style={{ left: position?.left ?? 0, top: position?.top ?? 0, visibility: position ? "visible" : "hidden" }}>
    <StayQuote key={`${selection.propertyId}-${selection.arrival}-${selection.departure}`} selection={selection} onClear={onClear} />
  </div>, document.body);
}
