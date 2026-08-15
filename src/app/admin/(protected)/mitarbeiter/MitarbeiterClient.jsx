"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Check,
  CheckCircle2,
  Clipboard,
  KeyRound,
  Loader2,
  Lock,
  Pencil,
  Shield,
  ShieldCheck,
  Trash2,
  Unlock,
  UserPlus,
  UserRound,
  Users,
  X,
} from "lucide-react";

import AdminConfirmDialog from "./AdminConfirmDialog";
import MitarbeiterEditModal from "./MitarbeiterEditModal";

const ROLE_LABELS = {
  EDITOR: "Editor",
  ADMIN: "Administrator",
  SUPERADMIN: "Superadmin",
};

export default function MitarbeiterClient({
  currentUserId,
}) {
  const [employees, setEmployees] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [showCreate, setShowCreate] =
    useState(false);

  const [copied, setCopied] =
    useState(false);

  const [generatedPassword, setGeneratedPassword] =
    useState(null);

  const [confirmDialog, setConfirmDialog] =
    useState({
      open: false,
      type: null,
      employee: null,
    });

  const [editEmployee, setEditEmployee] =
    useState(null);

  const [form, setForm] =
    useState({
      name: "",
      email: "",
      role: "EDITOR",
      password: "",
    });

  // ============================================================
  // Mitarbeiter laden
  // ============================================================

  const loadEmployees =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            "/api/admin/mitarbeiter",
            {
              cache: "no-store",
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error ||
              "Mitarbeiter konnten nicht geladen werden."
          );
        }

        setEmployees(
          Array.isArray(data?.employees)
            ? data.employees
            : []
        );
      } catch (err) {
        setError(
          err.message ||
            "Mitarbeiter konnten nicht geladen werden."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // ============================================================
  // Hinweise zurücksetzen
  // ============================================================

  function clearFeedback() {
    setMessage("");
    setError("");
    setGeneratedPassword(null);
    setCopied(false);
  }

  // ============================================================
  // Mitarbeiter anlegen
  // ============================================================

  async function createEmployee(event) {
    event.preventDefault();

    if (saving) return;

    try {
      setSaving(true);
      clearFeedback();

      const response =
        await fetch(
          "/api/admin/mitarbeiter",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(form),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Mitarbeiter konnte nicht angelegt werden."
        );
      }

      setForm({
        name: "",
        email: "",
        role: "EDITOR",
        password: "",
      });

      setShowCreate(false);

      if (data.generatedPassword) {
        setGeneratedPassword({
          password:
            data.generatedPassword,

          name:
            data.employee?.name ||
            data.employee?.email ||
            "Mitarbeiter",
        });
      } else {
        setMessage(
          "Mitarbeiter wurde erfolgreich angelegt."
        );
      }

      await loadEmployees();
    } catch (err) {
      setError(
        err.message ||
          "Mitarbeiter konnte nicht angelegt werden."
      );
    } finally {
      setSaving(false);
    }
  }

  // ============================================================
  // Rolle ändern
  // ============================================================

  async function updateEmployee(
    id,
    data
  ) {
    try {
      clearFeedback();

      const response =
        await fetch(
          `/api/admin/mitarbeiter/${id}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(data),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Änderung fehlgeschlagen."
        );
      }

      setMessage(
        "Mitarbeiter wurde aktualisiert."
      );

      await loadEmployees();
    } catch (err) {
      setError(
        err.message ||
          "Änderung fehlgeschlagen."
      );
    }
  }

  // ============================================================
  // Bestätigungsdialog öffnen
  // ============================================================

  function openConfirm(
    type,
    employee
  ) {
    clearFeedback();

    setConfirmDialog({
      open: true,
      type,
      employee,
    });
  }

  function closeConfirm() {
    if (actionLoading) return;

    setConfirmDialog({
      open: false,
      type: null,
      employee: null,
    });
  }

  // ============================================================
  // Sperren / Aktivieren
  // ============================================================

  async function confirmLockChange() {
    const employee =
      confirmDialog.employee;

    if (
      !employee ||
      actionLoading
    ) {
      return;
    }

    const activating =
      confirmDialog.type ===
      "unlock";

    try {
      setActionLoading(true);
      clearFeedback();

      const response =
        await fetch(
          `/api/admin/mitarbeiter/${employee.id}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              isActive:
                activating,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Status konnte nicht geändert werden."
        );
      }

      setConfirmDialog({
        open: false,
        type: null,
        employee: null,
      });

      setMessage(
        activating
          ? `${employee.name || employee.email} wurde aktiviert.`
          : `${employee.name || employee.email} wurde gesperrt.`
      );

      await loadEmployees();
    } catch (err) {
      setError(
        err.message ||
          "Status konnte nicht geändert werden."
      );
    } finally {
      setActionLoading(false);
    }
  }

  // ============================================================
  // Passwort zurücksetzen
  // ============================================================

  async function confirmResetPassword() {
    const employee =
      confirmDialog.employee;

    if (
      !employee ||
      actionLoading
    ) {
      return;
    }

    try {
      setActionLoading(true);
      clearFeedback();

      const response =
        await fetch(
          `/api/admin/mitarbeiter/${employee.id}/password`,
          {
            method: "POST",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Passwort konnte nicht zurückgesetzt werden."
        );
      }

      setConfirmDialog({
        open: false,
        type: null,
        employee: null,
      });

      setGeneratedPassword({
        password:
          data.generatedPassword,

        name:
          employee.name ||
          employee.email,
      });
    } catch (err) {
      setError(
        err.message ||
          "Passwort konnte nicht zurückgesetzt werden."
      );
    } finally {
      setActionLoading(false);
    }
  }

  // ============================================================
  // Löschen
  // ============================================================

  async function confirmDeleteEmployee() {
    const employee =
      confirmDialog.employee;

    if (
      !employee ||
      actionLoading
    ) {
      return;
    }

    try {
      setActionLoading(true);
      clearFeedback();

      const response =
        await fetch(
          `/api/admin/mitarbeiter/${employee.id}`,
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Mitarbeiter konnte nicht entfernt werden."
        );
      }

      setConfirmDialog({
        open: false,
        type: null,
        employee: null,
      });

      setMessage(
        `${employee.name || employee.email} wurde entfernt.`
      );

      await loadEmployees();
    } catch (err) {
      setError(
        err.message ||
          "Mitarbeiter konnte nicht entfernt werden."
      );
    } finally {
      setActionLoading(false);
    }
  }

  // ============================================================
  // Dialog-Aktion
  // ============================================================

  function handleConfirmAction() {
    if (
      confirmDialog.type ===
        "lock" ||
      confirmDialog.type ===
        "unlock"
    ) {
      confirmLockChange();
      return;
    }

    if (
      confirmDialog.type ===
      "password"
    ) {
      confirmResetPassword();
      return;
    }

    if (
      confirmDialog.type ===
      "delete"
    ) {
      confirmDeleteEmployee();
    }
  }

  // ============================================================
  // Passwort kopieren
  // ============================================================

  async function copyPassword() {
    if (
      !generatedPassword?.password
    ) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        generatedPassword.password
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setError(
        "Passwort konnte nicht automatisch kopiert werden."
      );
    }
  }

  // ============================================================
  // Render
  // ============================================================

  return (
    <main className="mx-auto max-w-7xl px-4 pb-32 pt-32 sm:px-6 lg:px-8">

      {/* ======================================================
          HEADER
         ====================================================== */}

      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-700">
            Administration
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            Mitarbeiter
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Persönliche Zugänge,
            Rollen und Zugriffsstatus
            verwalten.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            clearFeedback();
            setShowCreate(true);
          }}
          className="
            inline-flex h-11
            items-center justify-center
            gap-2 rounded-xl
            bg-sky-600 px-5
            text-sm font-semibold
            text-white
            shadow-lg shadow-sky-600/15
            transition
            hover:bg-sky-700
          "
        >
          <UserPlus className="h-4 w-4" />

          Mitarbeiter hinzufügen
        </button>
      </div>

      {/* ======================================================
          ERFOLG
         ====================================================== */}

      {message && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />

          <span>
            {message}
          </span>
        </div>
      )}

      {/* ======================================================
          FEHLER
         ====================================================== */}

      {error && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ======================================================
          GENERIERTES PASSWORT
         ====================================================== */}

      {generatedPassword && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-sky-200 bg-white shadow-sm">

          <div className="flex items-start gap-3 border-b border-sky-100 bg-sky-50/60 px-5 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-sky-700 shadow-sm ring-1 ring-sky-100">
              <KeyRound className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900">
                Neues temporäres Passwort
              </p>

              <p className="mt-0.5 text-xs text-slate-500">
                Für{" "}
                <strong>
                  {generatedPassword.name}
                </strong>
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setGeneratedPassword(
                  null
                )
              }
              className="rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-5">
            <p className="mb-2 text-xs font-semibold text-slate-500">
              Dieses Passwort jetzt
              sicher an den Mitarbeiter
              weitergeben:
            </p>

            <div className="flex items-center gap-2">
              <code
                className="
                  min-w-0 flex-1
                  overflow-x-auto
                  rounded-xl
                  border border-slate-200
                  bg-slate-50
                  px-4 py-3
                  font-mono
                  text-sm font-bold
                  text-slate-900
                "
              >
                {
                  generatedPassword.password
                }
              </code>

              <button
                type="button"
                onClick={copyPassword}
                className="
                  inline-flex h-11
                  shrink-0
                  items-center justify-center
                  gap-2
                  rounded-xl
                  border border-slate-200
                  bg-white
                  px-4
                  text-sm font-semibold
                  text-slate-700
                  transition
                  hover:border-sky-200
                  hover:bg-sky-50
                  hover:text-sky-700
                "
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600" />
                    Kopiert
                  </>
                ) : (
                  <>
                    <Clipboard className="h-4 w-4" />
                    Kopieren
                  </>
                )}
              </button>
            </div>

            <p className="mt-3 text-[11px] leading-5 text-amber-700">
              Das Passwort wird aus
              Sicherheitsgründen später
              nicht erneut angezeigt.
            </p>
          </div>
        </div>
      )}

      {/* ======================================================
          MITARBEITERLISTE
         ====================================================== */}

      {loading ? (
        <div className="flex min-h-52 items-center justify-center rounded-3xl border border-slate-200 bg-white">
          <Loader2 className="h-6 w-6 animate-spin text-sky-600" />
        </div>
      ) : employees.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <Users className="mx-auto h-9 w-9 text-slate-400" />

          <p className="mt-4 font-semibold text-slate-900">
            Noch keine Mitarbeiter
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Lege den ersten
            Mitarbeiterzugang an.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {employees.map(
            (employee) => {
              const isMe =
                employee.id ===
                currentUserId;

              return (
                <article
                  key={employee.id}
                  className="
                    rounded-[22px]
                    border border-slate-200
                    bg-white
                    p-5
                    shadow-sm
                    transition
                    hover:border-slate-300
                    hover:shadow-md
                  "
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                    {/* Person */}
                    <div className="flex min-w-0 items-start gap-4">

                      <div
                        className={`
                          flex h-12 w-12
                          shrink-0
                          items-center justify-center
                          rounded-2xl

                          ${
                            employee.role ===
                            "SUPERADMIN"
                              ? "bg-sky-50 text-sky-700"
                              : "bg-slate-100 text-slate-600"
                          }
                        `}
                      >
                        {employee.role ===
                        "SUPERADMIN" ? (
                          <ShieldCheck className="h-5 w-5" />
                        ) : employee.role ===
                          "ADMIN" ? (
                          <Shield className="h-5 w-5" />
                        ) : (
                          <UserRound className="h-5 w-5" />
                        )}
                      </div>

                      <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-2">

                          <h2 className="truncate font-bold text-slate-900">
                            {employee.name ||
                              "Ohne Namen"}
                          </h2>

                          {isMe && (
                            <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700">
                              Du
                            </span>
                          )}

                          <span
                            className={`
                              rounded-full
                              px-2 py-0.5
                              text-[10px]
                              font-bold

                              ${
                                employee.isActive
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-red-50 text-red-700"
                              }
                            `}
                          >
                            {employee.isActive
                              ? "Aktiv"
                              : "Gesperrt"}
                          </span>
                        </div>

                        <p className="mt-1 truncate text-sm text-slate-600">
                          {
                            employee.email
                          }
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">

                          <span>
                            {ROLE_LABELS[
                              employee
                                .role
                            ] ||
                              employee.role}
                          </span>

                          <span className="text-slate-300">
                            •
                          </span>

                          <span>
                            {employee.lastLoginAt
                              ? `Letzter Login: ${new Date(
                                  employee.lastLoginAt
                                ).toLocaleString(
                                  "de-DE"
                                )}`
                              : "Noch kein Login"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Aktionen */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setEditEmployee(employee)
                        }
                        className="
                          inline-flex h-10
                          items-center gap-2
                          rounded-xl
                          border border-slate-200
                          bg-white
                          px-3
                          text-sm font-medium
                          text-slate-700
                          transition
                          hover:border-sky-200
                          hover:bg-sky-50
                          hover:text-sky-700
                        "
                      >
                        <Pencil className="h-4 w-4" />
                        Bearbeiten
                      </button>

                      {!isMe && (
                        <button
                          type="button"
                          onClick={() =>
                            openConfirm(
                              employee.isActive
                                ? "lock"
                                : "unlock",
                              employee
                            )
                          }
                          className="
                            inline-flex h-10
                            items-center gap-2
                            rounded-xl
                            border border-slate-200
                            bg-white
                            px-3
                            text-sm font-medium
                            text-slate-700
                            transition
                            hover:bg-slate-50
                          "
                        >
                          {employee.isActive ? (
                            <>
                              <Lock className="h-4 w-4" />
                              Sperren
                            </>
                          ) : (
                            <>
                              <Unlock className="h-4 w-4" />
                              Aktivieren
                            </>
                          )}
                        </button>
                      )}

                      {!isMe && (
                        <button
                          type="button"
                          onClick={() =>
                            openConfirm(
                              "password",
                              employee
                            )
                          }
                          className="
                            inline-flex h-10
                            items-center gap-2
                            rounded-xl
                            border border-slate-200
                            bg-white
                            px-3
                            text-sm font-medium
                            text-slate-700
                            transition
                            hover:border-sky-200
                            hover:bg-sky-50
                            hover:text-sky-700
                          "
                        >
                          <KeyRound className="h-4 w-4" />
                          Passwort
                        </button>
                      )}

                      {!isMe && (
                        <button
                          type="button"
                          onClick={() =>
                            openConfirm(
                              "delete",
                              employee
                            )
                          }
                          className="
                            inline-flex h-10
                            items-center gap-2
                            rounded-xl
                            border border-red-200
                            bg-white
                            px-3
                            text-sm font-medium
                            text-red-700
                            transition
                            hover:bg-red-50
                          "
                        >
                          <Trash2 className="h-4 w-4" />
                          Entfernen
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            }
          )}
        </div>
      )}

      {/* ======================================================
          MITARBEITER ANLEGEN MODAL
         ====================================================== */}

      {showCreate && (
        <div
          className="
            fixed inset-0 z-[99999]
            flex items-center justify-center
            bg-slate-950/40
            p-4
            backdrop-blur-[4px]
          "
          onMouseDown={(event) => {
            if (
              event.target ===
                event.currentTarget &&
              !saving
            ) {
              setShowCreate(
                false
              );
            }
          }}
        >
          <div
            className="
              w-full max-w-lg
              overflow-hidden
              rounded-[28px]
              border border-slate-200
              bg-white
              shadow-[0_35px_100px_rgba(15,23,42,0.30)]
            "
          >
            <div className="relative border-b border-slate-100 px-6 py-6">

              <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-sky-100/70 blur-3xl" />

              <div className="relative flex items-start justify-between">

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-700">
                    Urlaub GOSCH Admin
                  </p>

                  <h2 className="mt-2 text-xl font-bold text-slate-950">
                    Mitarbeiter hinzufügen
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Persönliches Konto
                    für den
                    Verwaltungsbereich
                    anlegen.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    setShowCreate(
                      false
                    )
                  }
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form
              onSubmit={
                createEmployee
              }
              className="space-y-5 p-6"
            >
              {/* Name */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Name
                </label>

                <input
                  value={
                    form.name
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (old) => ({
                        ...old,
                        name:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  required
                  placeholder="Max Mustermann"
                  className="
                    h-11 w-full
                    rounded-xl
                    border border-slate-200
                    bg-slate-50
                    px-4
                    text-sm
                    outline-none
                    transition
                    focus:border-sky-400
                    focus:bg-white
                    focus:ring-4
                    focus:ring-sky-100
                  "
                />
              </div>

              {/* Mail */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  E-Mail
                </label>

                <input
                  type="email"
                  value={
                    form.email
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (old) => ({
                        ...old,
                        email:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  required
                  placeholder="name@urlaub-gosch.de"
                  className="
                    h-11 w-full
                    rounded-xl
                    border border-slate-200
                    bg-slate-50
                    px-4
                    text-sm
                    outline-none
                    transition
                    focus:border-sky-400
                    focus:bg-white
                    focus:ring-4
                    focus:ring-sky-100
                  "
                />
              </div>

              {/* Rolle */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Rolle
                </label>

                <select
                  value={
                    form.role
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (old) => ({
                        ...old,
                        role:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  className="
                    h-11 w-full
                    rounded-xl
                    border border-slate-200
                    bg-white
                    px-4
                    text-sm
                    outline-none
                    transition
                    focus:border-sky-400
                    focus:ring-4
                    focus:ring-sky-100
                  "
                >
                  <option value="EDITOR">
                    Editor
                  </option>

                  <option value="ADMIN">
                    Administrator
                  </option>
                </select>
              </div>

              {/* Passwort */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Startpasswort
                </label>

                <input
                  type="password"
                  value={
                    form.password
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (old) => ({
                        ...old,
                        password:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  placeholder="Leer lassen = automatisch erzeugen"
                  className="
                    h-11 w-full
                    rounded-xl
                    border border-slate-200
                    bg-slate-50
                    px-4
                    text-sm
                    outline-none
                    transition
                    focus:border-sky-400
                    focus:bg-white
                    focus:ring-4
                    focus:ring-sky-100
                  "
                />

                <p className="mt-2 text-[11px] leading-5 text-slate-500">
                  Mindestens 10
                  Zeichen. Wenn das
                  Feld leer bleibt,
                  wird automatisch ein
                  sicheres Passwort
                  erzeugt.
                </p>
              </div>

              <div className="grid gap-3 pt-1 sm:grid-cols-2">

                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    setShowCreate(
                      false
                    )
                  }
                  className="
                    h-11
                    rounded-xl
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
                  type="submit"
                  disabled={saving}
                  className="
                    inline-flex h-11
                    items-center justify-center
                    gap-2
                    rounded-xl
                    bg-sky-600
                    px-4
                    text-sm font-semibold
                    text-white
                    shadow-lg shadow-sky-600/20
                    transition
                    hover:bg-sky-700
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}

                  {saving
                    ? "Wird angelegt..."
                    : "Mitarbeiter anlegen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================
          BESTÄTIGUNGS-DIALOG
         ====================================================== */}

      <MitarbeiterEditModal
        open={Boolean(editEmployee)}
        employee={editEmployee}
        currentUserId={currentUserId}
        onClose={() =>
          setEditEmployee(null)
        }
        onUpdated={async () => {
          await loadEmployees();
        }}
      />

      <AdminConfirmDialog
        open={
          confirmDialog.open
        }
        type={
          confirmDialog.type
        }
        employee={
          confirmDialog.employee
        }
        loading={
          actionLoading
        }
        onCancel={
          closeConfirm
        }
        onConfirm={
          handleConfirmAction
        }
      />
    </main>
  );
}