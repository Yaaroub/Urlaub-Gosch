"use client";

import { Bell, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const POLL_INTERVAL = 30_000;

function playNotification(audio) {
  if (audio?.state !== "running") return;

  const start = audio.currentTime;
  const volume = audio.createGain();
  volume.connect(audio.destination);
  volume.gain.setValueAtTime(0.001, start);
  volume.gain.exponentialRampToValueAtTime(0.12, start + 0.025);
  volume.gain.exponentialRampToValueAtTime(0.001, start + 0.42);

  const notes = audio.createOscillator();
  notes.type = "sine";
  notes.frequency.setValueAtTime(660, start);
  notes.frequency.setValueAtTime(880, start + 0.17);
  notes.connect(volume);
  notes.onended = () => {
    notes.disconnect();
    volume.disconnect();
  };
  notes.start(start);
  notes.stop(start + 0.43);
}

export default function AdminInquiryNotifications() {
  const [summary, setSummary] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [soundLoading, setSoundLoading] = useState(false);
  const [soundError, setSoundError] = useState(false);
  const audioRef = useRef(null);
  const refreshRef = useRef(null);
  const alertRef = useRef({ enabled: false, armed: false });

  useEffect(() => {
    let timer;
    let controller;
    let stopped = false;
    let blocked = false;
    let lastSeen = null;

    async function poll() {
      if (stopped || blocked || document.hidden || controller) return;
      clearTimeout(timer);
      const pending = new AbortController();
      controller = pending;
      const timeout = setTimeout(() => pending.abort(), 10_000);

      try {
        const response = await fetch("/api/admin/anfragen/status", {
          cache: "no-store",
          signal: pending.signal,
        });
        if (stopped || document.hidden) return;
        if (response.status === 401 || response.status === 403) {
          blocked = true;
          setSummary(null);
          return;
        }
        if (!response.ok) return;

        const { booking, contact } = await response.json();
        if (stopped || document.hidden || pending.signal.aborted) return;
        const latest = { booking: booking.latestId, contact: contact?.latestId ?? 0 };
        const appeared = lastSeen && (latest.booking > lastSeen.booking || latest.contact > lastSeen.contact);
        const alerts = alertRef.current;
        const shouldRing = appeared && alerts.enabled && alerts.armed;

        // Removing or resolving an inquiry must not allow the same one to ring again.
        lastSeen = {
          booking: Math.max(lastSeen?.booking ?? 0, latest.booking),
          contact: Math.max(lastSeen?.contact ?? 0, latest.contact),
        };
        alerts.armed = alerts.enabled;
        setSummary({ booking: booking.pendingCount, contact: contact?.pendingCount ?? null });
        if (shouldRing) playNotification(audioRef.current);
      } catch {
        // An unavailable status check should not interrupt the admin workspace.
      } finally {
        clearTimeout(timeout);
        controller = null;
        if (!stopped && !blocked && !document.hidden) timer = setTimeout(poll, POLL_INTERVAL);
      }
    }

    function handleVisibilityChange() {
      clearTimeout(timer);
      if (!document.hidden) poll();
    }

    refreshRef.current = poll;
    document.addEventListener("visibilitychange", handleVisibilityChange);
    poll();
    return () => {
      stopped = true;
      clearTimeout(timer);
      controller?.abort();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      refreshRef.current = null;
      const audio = audioRef.current;
      audioRef.current = null;
      audio?.close().catch(() => {});
    };
  }, []);

  async function toggleSound() {
    const alerts = alertRef.current;
    if (alerts.enabled) {
      alerts.enabled = false;
      alerts.armed = false;
      setSoundEnabled(false);
      return;
    }

    const AudioContext = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContext) {
      setSoundError(true);
      return;
    }

    setSoundLoading(true);
    setSoundError(false);
    try {
      // Browsers require a user gesture to unlock sound.
      audioRef.current ??= new AudioContext();
      const audio = audioRef.current;
      await audio.resume();
      if (audio !== audioRef.current) return;
      alerts.enabled = true;
      alerts.armed = false;
      setSoundEnabled(true);
      refreshRef.current?.();
      playNotification(audio);
    } catch {
      setSoundError(true);
    } finally {
      setSoundLoading(false);
    }
  }

  if (!summary) return null;

  const count = summary.booking + (summary.contact ?? 0);
  const bookingLabel = summary.booking === 1 ? "1 offene Buchungsanfrage" : `${summary.booking} offene Buchungsanfragen`;
  const contactLabel = summary.contact === 1 ? "1 offene Kontaktanfrage" : `${summary.contact} offene Kontaktanfragen`;
  const inboxLabel = summary.contact === null ? bookingLabel : `${bookingLabel}, ${contactLabel}`;
  const soundLabel = soundError
    ? "Ton konnte nicht gestartet werden. Erneut versuchen."
    : soundEnabled ? "Ton für neue Anfragen ausschalten" : "Ton für neue Anfragen einschalten";

  return (
    <div className="flex shrink-0 items-center gap-0.5 max-[460px]:absolute max-[460px]:bottom-full max-[460px]:right-0 max-[460px]:mb-2 max-[460px]:rounded-xl max-[460px]:border max-[460px]:border-slate-200 max-[460px]:bg-white max-[460px]:p-1 max-[460px]:shadow-sm">
      <Link
        href="/admin/anfragen"
        aria-label={`Anfragen öffnen, ${inboxLabel}`}
        title={inboxLabel}
        className="relative grid size-9 place-items-center rounded-lg text-slate-700 hover:bg-sky-50 hover:text-sky-800 focus-visible:outline-2 focus-visible:outline-sky-600"
      >
        <Bell size={18} aria-hidden="true" />
        {count > 0 && (
          <span aria-hidden="true" className="absolute -right-1 -top-1 min-w-4 rounded-full bg-sky-700 px-1 text-center text-[10px] font-bold leading-4 text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </Link>
      <button
        type="button"
        aria-label="Ton für neue Anfragen"
        aria-pressed={soundEnabled}
        title={soundLabel}
        disabled={soundLoading}
        onClick={toggleSound}
        className={`grid size-9 place-items-center rounded-lg focus-visible:outline-2 focus-visible:outline-sky-600 disabled:opacity-50 ${soundEnabled ? "bg-sky-50 text-sky-800 hover:bg-sky-100" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"}`}
      >
        {soundEnabled ? <Volume2 size={17} aria-hidden="true" /> : <VolumeX size={17} aria-hidden="true" />}
      </button>
      <span className="sr-only" role="status">{soundError ? soundLabel : inboxLabel}</span>
    </div>
  );
}
