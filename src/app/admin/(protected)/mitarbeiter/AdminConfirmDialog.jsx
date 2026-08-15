"use client";

import {
  AlertTriangle,
  Trash2,
  KeyRound,
  Lock,
  X,
  Loader2,
} from "lucide-react";

const CONFIG = {
  delete: {
    icon: Trash2,
    eyebrow: "Mitarbeiter entfernen",
    title: "Mitarbeiter wirklich entfernen?",
    confirmText: "Endgültig entfernen",
    buttonClass:
      "bg-red-600 hover:bg-red-700 shadow-red-600/20",
    iconClass:
      "bg-red-50 text-red-600 ring-red-100",
  },

  password: {
    icon: KeyRound,
    eyebrow: "Passwort zurücksetzen",
    title: "Neues Passwort erzeugen?",
    confirmText: "Passwort zurücksetzen",
    buttonClass:
      "bg-sky-600 hover:bg-sky-700 shadow-sky-600/20",
    iconClass:
      "bg-sky-50 text-sky-700 ring-sky-100",
  },

  lock: {
    icon: Lock,
    eyebrow: "Zugang sperren",
    title: "Mitarbeiter sperren?",
    confirmText: "Zugang sperren",
    buttonClass:
      "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20",
    iconClass:
      "bg-amber-50 text-amber-700 ring-amber-100",
  },
};

export default function AdminConfirmDialog({
  open,
  type = "delete",
  employee,
  loading = false,
  onCancel,
  onConfirm,
}) {
  if (!open || !employee) return null;

  const config = CONFIG[type] || CONFIG.delete;
  const Icon = config.icon;

  const employeeName =
    employee.name?.trim() ||
    employee.email ||
    "Dieser Mitarbeiter";

  let description = "";

  if (type === "delete") {
    description = `Der Zugang von ${employeeName} wird dauerhaft entfernt. Diese Aktion kann nicht rückgängig gemacht werden.`;
  }

  if (type === "password") {
    description = `Für ${employeeName} wird ein neues temporäres Passwort erzeugt. Alle bestehenden Sitzungen dieses Kontos werden beendet.`;
  }

  if (type === "lock") {
    description = `${employeeName} kann sich danach nicht mehr im Verwaltungsbereich anmelden. Eine bestehende Sitzung wird ebenfalls ungültig.`;
  }

  return (
    <div
      className="
        fixed inset-0 z-[300]
        flex items-center justify-center
        bg-slate-950/40
        p-4
        backdrop-blur-[4px]
      "
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onCancel?.();
        }
      }}
    >
      <div
        className="
          relative w-full max-w-[470px]
          overflow-hidden
          rounded-[28px]
          border border-slate-200
          bg-white
          shadow-[0_35px_100px_rgba(15,23,42,0.28)]
        "
      >
        {/* Hintergrund */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-sky-100/40 blur-3xl" />

        {/* Kopf */}
        <div className="relative px-6 pb-5 pt-6 sm:px-7 sm:pt-7">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="
              absolute right-5 top-5
              flex h-9 w-9
              items-center justify-center
              rounded-xl
              text-slate-400
              transition
              hover:bg-slate-100
              hover:text-slate-700
              disabled:pointer-events-none
            "
            aria-label="Dialog schließen"
          >
            <X className="h-4 w-4" />
          </button>

          <div
            className={`
              flex h-12 w-12
              items-center justify-center
              rounded-2xl
              ring-1
              ${config.iconClass}
            `}
          >
            <Icon className="h-5 w-5" />
          </div>

          <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-sky-700">
            {config.eyebrow}
          </p>

          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
            {config.title}
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {description}
          </p>
        </div>

        {/* Mitarbeiter */}
        <div className="mx-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:mx-7">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm ring-1 ring-slate-200">
              <AlertTriangle className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">
                {employeeName}
              </p>

              <p className="mt-0.5 truncate text-xs text-slate-500">
                {employee.email}
              </p>
            </div>
          </div>
        </div>

        {/* Aktionen */}
        <div className="mt-6 grid gap-3 border-t border-slate-100 bg-slate-50/50 p-5 sm:grid-cols-2 sm:px-7">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="
              h-11 rounded-xl
              border border-slate-200
              bg-white
              px-4
              text-sm font-semibold
              text-slate-700
              transition
              hover:bg-slate-50
              disabled:opacity-50
            "
          >
            Abbrechen
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`
              inline-flex h-11
              items-center justify-center gap-2
              rounded-xl
              px-4
              text-sm font-semibold
              text-white
              shadow-lg
              transition
              disabled:cursor-not-allowed
              disabled:opacity-60
              ${config.buttonClass}
            `}
          >
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}

            {config.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}