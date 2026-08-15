"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Clock3,
  LogOut,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

const TIMEOUT_MS = 30 * 60 * 1000;
const WARNING_MS = 2 * 60 * 1000;

const STORAGE_KEY = "admin:lastActivity";

function formatTime(milliseconds) {
  const totalSeconds = Math.max(
    0,
    Math.ceil(milliseconds / 1000)
  );

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;
}

export default function AdminIdleTimeout() {
  const [remaining, setRemaining] = useState(TIMEOUT_MS);
  const [showWarning, setShowWarning] = useState(false);

  const loggingOutRef = useRef(false);
  const warningRef = useRef(false);
  const lastWriteRef = useRef(0);

  useEffect(() => {
    warningRef.current = showWarning;
  }, [showWarning]);

  const setActivityNow = useCallback(() => {
    const now = Date.now();

    try {
      localStorage.setItem(STORAGE_KEY, String(now));
    } catch {}

    lastWriteRef.current = now;
    setRemaining(TIMEOUT_MS);
  }, []);

  const registerActivity = useCallback(() => {
    // Sobald der Warn-Dialog offen ist,
    // nur noch "Weiterarbeiten" verlängert die Sitzung.
    if (warningRef.current) {
      return;
    }

    const now = Date.now();

    if (now - lastWriteRef.current < 1000) {
      return;
    }

    lastWriteRef.current = now;

    try {
      localStorage.setItem(STORAGE_KEY, String(now));
    } catch {}
  }, []);

  const logout = useCallback(async () => {
    if (loggingOutRef.current) return;

    loggingOutRef.current = true;

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch {}

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}

    window.location.href =
      "/admin/login?reason=timeout";
  }, []);

  const extendSession = useCallback(() => {
    setActivityNow();
    setShowWarning(false);
  }, [setActivityNow]);

  useEffect(() => {
    try {
      const stored = Number(
        localStorage.getItem(STORAGE_KEY)
      );

      if (!stored) {
        localStorage.setItem(
          STORAGE_KEY,
          String(Date.now())
        );
      }
    } catch {}

    function updateTimer() {
      let lastActivity = Date.now();

      try {
        const stored = Number(
          localStorage.getItem(STORAGE_KEY)
        );

        if (Number.isFinite(stored) && stored > 0) {
          lastActivity = stored;
        }
      } catch {}

      const inactiveFor =
        Date.now() - lastActivity;

      const timeLeft =
        TIMEOUT_MS - inactiveFor;

      if (timeLeft <= 0) {
        setRemaining(0);
        logout();
        return;
      }

      setRemaining(timeLeft);

      if (timeLeft <= WARNING_MS) {
        setShowWarning(true);
      }
    }

    updateTimer();

    const interval = window.setInterval(
      updateTimer,
      1000
    );

    const events = [
      "pointerdown",
      "keydown",
      "touchstart",
      "scroll",
    ];

    events.forEach((eventName) => {
      window.addEventListener(
        eventName,
        registerActivity,
        { passive: true }
      );
    });

    function handleStorage(event) {
      if (event.key === STORAGE_KEY) {
        updateTimer();
      }
    }

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {
      window.clearInterval(interval);

      events.forEach((eventName) => {
        window.removeEventListener(
          eventName,
          registerActivity
        );
      });

      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, [logout, registerActivity]);

  const warning =
    remaining <= WARNING_MS;

  return (
    <>
      {/* Countdown direkt IM Admin-Dock */}
      <div
        className={`
          flex h-11 shrink-0 items-center gap-2
          rounded-xl border px-3
          transition-colors

          ${
            warning
              ? "border-amber-200 bg-amber-50"
              : "border-slate-200 bg-slate-50"
          }
        `}
        title="Automatische Abmeldung nach 30 Minuten Inaktivität"
      >
        <Clock3
          className={`h-4 w-4 ${
            warning
              ? "text-amber-700"
              : "text-sky-600"
          }`}
        />

        <div className="hidden sm:block">
          <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
            Sitzung
          </p>

          <p
            className={`font-mono text-xs font-bold tabular-nums ${
              warning
                ? "text-amber-700"
                : "text-slate-700"
            }`}
          >
            {formatTime(remaining)}
          </p>
        </div>

        <span
          className={`font-mono text-xs font-bold tabular-nums sm:hidden ${
            warning
              ? "text-amber-700"
              : "text-slate-700"
          }`}
        >
          {formatTime(remaining)}
        </span>
      </div>

      {/* Eigener Warn-Dialog */}
      {showWarning && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[4px]">
          <div className="w-full max-w-[460px] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_32px_100px_rgba(15,23,42,0.28)]">

            {/* Kopf */}
            <div className="relative overflow-hidden border-b border-slate-100 px-6 py-6 sm:px-7">
              <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-amber-100/80 blur-3xl" />
              <div className="pointer-events-none absolute -left-16 bottom-0 h-32 w-32 rounded-full bg-sky-100/50 blur-3xl" />

              <div className="relative flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-100">
                  <Clock3 className="h-5 w-5" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-sky-600" />

                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-700">
                      Urlaub GOSCH Admin
                    </p>
                  </div>

                  <h2 className="mt-1.5 text-xl font-bold tracking-tight text-slate-950">
                    Sitzung läuft gleich ab
                  </h2>

                  <p className="mt-1.5 text-sm leading-6 text-slate-500">
                    Nach 30 Minuten Inaktivität wirst du
                    aus Sicherheitsgründen automatisch
                    ausgeloggt.
                  </p>
                </div>
              </div>
            </div>

            {/* Inhalt */}
            <div className="px-6 py-6 sm:px-7">
              <div className="rounded-2xl border border-amber-100 bg-amber-50/60 px-5 py-5 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700/70">
                  Automatische Abmeldung in
                </p>

                <p className="mt-2 font-mono text-4xl font-bold tracking-tight text-slate-950 tabular-nums">
                  {formatTime(remaining)}
                </p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={logout}
                  className="
                    inline-flex h-11
                    items-center justify-center gap-2
                    rounded-xl
                    border border-slate-200
                    bg-white px-4
                    text-sm font-semibold
                    text-slate-700
                    transition
                    hover:border-red-200
                    hover:bg-red-50
                    hover:text-red-700
                  "
                >
                  <LogOut className="h-4 w-4" />
                  Ausloggen
                </button>

                <button
                  type="button"
                  onClick={extendSession}
                  className="
                    inline-flex h-11
                    items-center justify-center gap-2
                    rounded-xl
                    bg-sky-600 px-4
                    text-sm font-semibold
                    text-white
                    shadow-sm
                    transition
                    hover:bg-sky-700
                  "
                >
                  <RefreshCw className="h-4 w-4" />
                  Weiterarbeiten
                </button>
              </div>

              <p className="mt-4 text-center text-[11px] leading-5 text-slate-400">
                Mit „Weiterarbeiten“ startet die
                30-Minuten-Frist erneut.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}