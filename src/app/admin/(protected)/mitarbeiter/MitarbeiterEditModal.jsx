"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clipboard,
  Clock3,
  Eye,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Save,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  X,
} from "lucide-react";

const TIMEOUT_OPTIONS = [
  15,
  30,
  45,
  60,
  120,
];

const DEFAULT_EDITOR_PERMISSIONS = [
  "PROPERTIES_VIEW",
  "PROPERTIES_EDIT",

  "PRICES_VIEW",
  "PRICES_EDIT",

  "FEES_VIEW",
  "FEES_EDIT",

  "IMAGES_VIEW",
  "IMAGES_EDIT",

  "AVAILABILITY_VIEW",
  "AVAILABILITY_EDIT",

  "ICAL_VIEW",
  "ICAL_EDIT",

  "LASTMINUTE_VIEW",
  "LASTMINUTE_EDIT",
];

const DEFAULT_ADMIN_PERMISSIONS = [
  "PROPERTIES_VIEW",
  "PROPERTIES_EDIT",
  "PROPERTIES_DELETE",

  "PRICES_VIEW",
  "PRICES_EDIT",

  "FEES_VIEW",
  "FEES_EDIT",

  "IMAGES_VIEW",
  "IMAGES_EDIT",
  "IMAGES_DELETE",

  "AVAILABILITY_VIEW",
  "AVAILABILITY_EDIT",

  "ICAL_VIEW",
  "ICAL_EDIT",

  "LASTMINUTE_VIEW",
  "LASTMINUTE_EDIT",
  "LASTMINUTE_DELETE",
];

const PERMISSION_GROUPS = [
  {
    title: "Objekte",
    description:
      "Unterkünfte und Stammdaten verwalten.",
    permissions: [
      {
        key: "PROPERTIES_VIEW",
        label: "Ansehen",
      },
      {
        key: "PROPERTIES_EDIT",
        label: "Bearbeiten",
      },
      {
        key: "PROPERTIES_DELETE",
        label: "Löschen",
      },
    ],
  },

  {
    title: "Preiszeiten",
    description:
      "Preise und Saisonzeiträume.",
    permissions: [
      {
        key: "PRICES_VIEW",
        label: "Ansehen",
      },
      {
        key: "PRICES_EDIT",
        label: "Bearbeiten",
      },
    ],
  },

  {
    title: "Nebenkosten",
    description:
      "Reinigung, Kurtaxe und Zuschläge.",
    permissions: [
      {
        key: "FEES_VIEW",
        label: "Ansehen",
      },
      {
        key: "FEES_EDIT",
        label: "Bearbeiten",
      },
    ],
  },

  {
    title: "Bilder",
    description:
      "Bilder hochladen und verwalten.",
    permissions: [
      {
        key: "IMAGES_VIEW",
        label: "Ansehen",
      },
      {
        key: "IMAGES_EDIT",
        label: "Bearbeiten",
      },
      {
        key: "IMAGES_DELETE",
        label: "Löschen",
      },
    ],
  },

  {
    title: "Verfügbarkeiten",
    description:
      "Belegungen und Sperrzeiträume.",
    permissions: [
      {
        key: "AVAILABILITY_VIEW",
        label: "Ansehen",
      },
      {
        key: "AVAILABILITY_EDIT",
        label: "Bearbeiten",
      },
    ],
  },

  {
    title: "iCal",
    description:
      "Kalender und Synchronisierung.",
    permissions: [
      {
        key: "ICAL_VIEW",
        label: "Ansehen",
      },
      {
        key: "ICAL_EDIT",
        label: "Bearbeiten",
      },
    ],
  },

  {
    title: "Last-Minute",
    description:
      "Kurzfristige Angebote verwalten.",
    permissions: [
      {
        key: "LASTMINUTE_VIEW",
        label: "Ansehen",
      },
      {
        key: "LASTMINUTE_EDIT",
        label: "Bearbeiten",
      },
      {
        key: "LASTMINUTE_DELETE",
        label: "Löschen",
      },
    ],
  },

  {
    title: "Mitarbeiterverwaltung",
    description:
      "Besonders sensible Verwaltungsrechte.",
    permissions: [
      {
        key: "STAFF_VIEW",
        label: "Mitarbeiter ansehen",
      },
      {
        key: "STAFF_CREATE",
        label: "Mitarbeiter anlegen",
      },
      {
        key: "STAFF_EDIT",
        label: "Zugangsdaten bearbeiten",
      },
      {
        key: "STAFF_LOCK",
        label: "Konten sperren",
      },
      {
        key: "STAFF_PASSWORD_RESET",
        label: "Passwörter zurücksetzen",
      },
      {
        key: "STAFF_PERMISSIONS_EDIT",
        label: "Rechte verwalten",
      },
      {
        key: "STAFF_DELETE",
        label: "Konten entfernen",
      },
    ],
  },
];

function formatDate(value) {
  if (!value) {
    return "Noch nicht vorhanden";
  }

  try {
    return new Date(value).toLocaleString(
      "de-DE",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  } catch {
    return "–";
  }
}

function Switch({
  checked,
  disabled = false,
  onChange,
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (!disabled) {
          onChange?.(!checked);
        }
      }}
      className={`
        relative h-6 w-11 shrink-0
        rounded-full transition

        ${
          checked
            ? "bg-sky-600"
            : "bg-slate-200"
        }

        ${
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer"
        }
      `}
      aria-pressed={checked}
    >
      <span
        className={`
          absolute top-0.5
          h-5 w-5
          rounded-full bg-white
          shadow-sm transition-all

          ${
            checked
              ? "left-[22px]"
              : "left-0.5"
          }
        `}
      />
    </button>
  );
}

export default function MitarbeiterEditModal({
  open,
  employee,
  currentUserId,
  onClose,
  onUpdated,
}) {
  const router = useRouter();

  const [tab, setTab] =
    useState("account");

  const [form, setForm] =
    useState(null);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [passwordLoading, setPasswordLoading] =
    useState(false);

  const [sessionLoading, setSessionLoading] =
    useState(false);

  const [showSessionConfirm, setShowSessionConfirm] =
    useState(false);

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [newPasswordRepeat, setNewPasswordRepeat] =
    useState("");

  const [generatedPassword, setGeneratedPassword] =
    useState("");

  const [copied, setCopied] =
    useState(false);

  const isSelf =
    employee?.id === currentUserId;

  const isSuperAdmin =
    form?.role === "SUPERADMIN";

  useEffect(() => {
    if (!open || !employee) {
      return;
    }

    setTab("account");

    setForm({
      name:
        employee.name || "",

      email:
        employee.email || "",

      role:
        employee.role || "EDITOR",

      isActive:
        employee.isActive !== false,

      sessionTimeoutMinutes:
        employee.sessionTimeoutMinutes ||
        30,

      mustChangePassword:
        Boolean(
          employee.mustChangePassword
        ),

      permissions:
        Array.isArray(
          employee.permissions
        )
          ? [...employee.permissions]
          : [],
    });

    setError("");
    setSuccess("");

    setCurrentPassword("");
    setNewPassword("");
    setNewPasswordRepeat("");

    setGeneratedPassword("");
    setCopied(false);

    setShowSessionConfirm(false);
  }, [
    open,
    employee,
  ]);

  const permissionCount =
    useMemo(() => {
      if (!form) {
        return 0;
      }

      if (
        form.role ===
        "SUPERADMIN"
      ) {
        return PERMISSION_GROUPS.reduce(
          (sum, group) =>
            sum +
            group.permissions.length,
          0
        );
      }

      return form.permissions.length;
    }, [form]);

  if (
    !open ||
    !employee ||
    !form
  ) {
    return null;
  }

  function setField(
    key,
    value
  ) {
    setForm((old) => ({
      ...old,
      [key]: value,
    }));
  }

  function handleRoleChange(
    role
  ) {
    setForm((old) => {
      let permissions =
        old.permissions;

      if (
        role ===
        "SUPERADMIN"
      ) {
        permissions = [];
      } else if (
        old.role ===
          "SUPERADMIN" ||
        old.permissions.length === 0
      ) {
        permissions =
          role === "ADMIN"
            ? [
                ...DEFAULT_ADMIN_PERMISSIONS,
              ]
            : [
                ...DEFAULT_EDITOR_PERMISSIONS,
              ];
      }

      return {
        ...old,
        role,
        permissions,
      };
    });
  }

  function togglePermission(
    permission
  ) {
    if (isSuperAdmin) {
      return;
    }

    setForm((old) => {
      const exists =
        old.permissions.includes(
          permission
        );

      return {
        ...old,

        permissions:
          exists
            ? old.permissions.filter(
                (item) =>
                  item !== permission
              )
            : [
                ...old.permissions,
                permission,
              ],
      };
    });
  }

  function enableGroup(
    group
  ) {
    if (isSuperAdmin) {
      return;
    }

    setForm((old) => ({
      ...old,

      permissions: [
        ...new Set([
          ...old.permissions,

          ...group.permissions.map(
            (item) => item.key
          ),
        ]),
      ],
    }));
  }

  function disableGroup(
    group
  ) {
    if (isSuperAdmin) {
      return;
    }

    const groupKeys =
      group.permissions.map(
        (item) => item.key
      );

    setForm((old) => ({
      ...old,

      permissions:
        old.permissions.filter(
          (permission) =>
            !groupKeys.includes(
              permission
            )
        ),
    }));
  }

  function useRoleDefaults() {
    if (
      form.role ===
      "SUPERADMIN"
    ) {
      return;
    }

    setField(
      "permissions",
      form.role === "ADMIN"
        ? [
            ...DEFAULT_ADMIN_PERMISSIONS,
          ]
        : [
            ...DEFAULT_EDITOR_PERMISSIONS,
          ]
    );
  }

  async function saveEmployee() {
    if (saving) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

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
              name:
                form.name,

              email:
                form.email,

              role:
                form.role,

              isActive:
                form.isActive,

              sessionTimeoutMinutes:
                Number(
                  form.sessionTimeoutMinutes
                ),

              mustChangePassword:
                form.mustChangePassword,

              permissions:
                form.role ===
                "SUPERADMIN"
                  ? []
                  : form.permissions,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Änderungen konnten nicht gespeichert werden."
        );
      }

      setSuccess(
        "Änderungen wurden gespeichert."
      );

      if (
        data?.employee
      ) {
        setForm({
          name:
            data.employee.name ||
            "",

          email:
            data.employee.email ||
            "",

          role:
            data.employee.role,

          isActive:
            data.employee
              .isActive !== false,

          sessionTimeoutMinutes:
            data.employee
              .sessionTimeoutMinutes ||
            30,

          mustChangePassword:
            Boolean(
              data.employee
                .mustChangePassword
            ),

          permissions:
            data.employee
              .permissions || [],
        });
      }

      await onUpdated?.();

      if (isSelf) {
        try {
          localStorage.setItem(
            "admin:lastActivity",
            String(Date.now())
          );
        } catch {}

        router.refresh();
      }
    } catch (err) {
      setError(
        err.message ||
          "Änderungen konnten nicht gespeichert werden."
      );
    } finally {
      setSaving(false);
    }
  }

  async function changePassword({
    generate = false,
  } = {}) {
    if (
      passwordLoading
    ) {
      return;
    }

    setError("");
    setSuccess("");
    setGeneratedPassword("");

    if (isSelf) {
      if (
        !currentPassword
      ) {
        setError(
          "Bitte dein aktuelles Passwort eingeben."
        );

        return;
      }

      if (
        newPassword.length <
        10
      ) {
        setError(
          "Das neue Passwort muss mindestens 10 Zeichen lang sein."
        );

        return;
      }

      if (
        newPassword !==
        newPasswordRepeat
      ) {
        setError(
          "Die neuen Passwörter stimmen nicht überein."
        );

        return;
      }
    } else if (
      !generate &&
      newPassword &&
      newPassword.length < 10
    ) {
      setError(
        "Das Passwort muss mindestens 10 Zeichen lang sein."
      );

      return;
    }

    try {
      setPasswordLoading(
        true
      );

      const body =
        isSelf
          ? {
              currentPassword,
              newPassword,
            }
          : {
              newPassword:
                generate
                  ? ""
                  : newPassword,

              mustChangePassword:
                form.mustChangePassword,
            };

      const response =
        await fetch(
          `/api/admin/mitarbeiter/${employee.id}/password`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                body
              ),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Passwort konnte nicht geändert werden."
        );
      }

      if (
        data.generatedPassword
      ) {
        setGeneratedPassword(
          data.generatedPassword
        );
      }

      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordRepeat("");

      setSuccess(
        isSelf
          ? "Dein Passwort wurde erfolgreich geändert."
          : data.generatedPassword
            ? "Ein neues temporäres Passwort wurde erzeugt."
            : "Das Passwort wurde geändert."
      );

      await onUpdated?.();
    } catch (err) {
      setError(
        err.message ||
          "Passwort konnte nicht geändert werden."
      );
    } finally {
      setPasswordLoading(
        false
      );
    }
  }

  async function endSessions() {
    if (
      sessionLoading
    ) {
      return;
    }

    try {
      setSessionLoading(
        true
      );

      setError("");
      setSuccess("");

      const response =
        await fetch(
          `/api/admin/mitarbeiter/${employee.id}/sessions`,
          {
            method: "POST",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Sessions konnten nicht beendet werden."
        );
      }

      if (data.loggedOut) {
        window.location.href =
          "/admin/login";

        return;
      }

      setShowSessionConfirm(
        false
      );

      setSuccess(
        "Alle bestehenden Sitzungen dieses Mitarbeiters wurden beendet."
      );

      await onUpdated?.();
    } catch (err) {
      setError(
        err.message ||
          "Sessions konnten nicht beendet werden."
      );
    } finally {
      setSessionLoading(
        false
      );
    }
  }

  async function copyGeneratedPassword() {
    if (!generatedPassword) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        generatedPassword
      );

      setCopied(true);

      window.setTimeout(
        () => {
          setCopied(false);
        },
        1800
      );
    } catch {
      setError(
        "Passwort konnte nicht kopiert werden."
      );
    }
  }

  const tabs = [
    {
      key: "account",
      label: "Zugangsdaten",
      icon: UserRound,
    },
    {
      key: "permissions",
      label: "Rechte",
      icon: Shield,
    },
    {
      key: "security",
      label: "Sicherheit",
      icon: Lock,
    },
  ];

  return (
    <>
      <div
        className="
          fixed inset-0 z-[99999]
          flex items-center justify-center
          bg-slate-950/45
          p-3
          backdrop-blur-[5px]
          sm:p-6
        "
      >
        <div
          className="
            flex max-h-[94vh]
            w-full max-w-5xl
            flex-col
            overflow-hidden
            rounded-[30px]
            border border-slate-200
            bg-white
            shadow-[0_40px_120px_rgba(15,23,42,0.32)]
          "
        >
          {/* HEADER */}

          <header
            className="
              relative shrink-0
              overflow-hidden
              border-b border-slate-100
              bg-white
              px-5 py-5
              sm:px-7
            "
          >
            <div className="pointer-events-none absolute -right-10 -top-20 h-52 w-52 rounded-full bg-sky-100/70 blur-3xl" />

            <div className="relative flex items-start justify-between gap-5">
              <div className="flex min-w-0 items-center gap-4">
                <div
                  className="
                    flex h-12 w-12
                    shrink-0
                    items-center justify-center
                    rounded-2xl
                    bg-sky-600
                    text-white
                    shadow-lg shadow-sky-600/20
                  "
                >
                  {form.role ===
                  "SUPERADMIN" ? (
                    <ShieldCheck className="h-5 w-5" />
                  ) : (
                    <UserRound className="h-5 w-5" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-700">
                      Urlaub GOSCH Admin
                    </p>

                    {isSelf && (
                      <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[9px] font-bold uppercase text-sky-700">
                        Dein Konto
                      </span>
                    )}
                  </div>

                  <h2 className="mt-1 truncate text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                    Mitarbeiter bearbeiten
                  </h2>

                  <p className="mt-1 truncate text-sm text-slate-500">
                    {employee.email}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={
                  saving ||
                  passwordLoading ||
                  sessionLoading
                }
                className="
                  flex h-10 w-10
                  shrink-0
                  items-center justify-center
                  rounded-xl
                  text-slate-400
                  transition
                  hover:bg-slate-100
                  hover:text-slate-700
                  disabled:opacity-40
                "
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* TABS */}

            <div className="relative mt-5 flex gap-1 overflow-x-auto rounded-2xl bg-slate-100 p-1">
              {tabs.map(
                (item) => {
                  const Icon =
                    item.icon;

                  const active =
                    tab === item.key;

                  return (
                    <button
                      key={
                        item.key
                      }
                      type="button"
                      onClick={() =>
                        setTab(
                          item.key
                        )
                      }
                      className={`
                        inline-flex h-10
                        min-w-max flex-1
                        items-center justify-center
                        gap-2
                        rounded-xl
                        px-4
                        text-sm font-semibold
                        transition

                        ${
                          active
                            ? "bg-white text-slate-950 shadow-sm"
                            : "text-slate-500 hover:text-slate-800"
                        }
                      `}
                    >
                      <Icon className="h-4 w-4" />

                      {
                        item.label
                      }
                    </button>
                  );
                }
              )}
            </div>
          </header>

          {/* CONTENT */}

          <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/60 p-5 sm:p-7">

            {error && (
              <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />

                <span>
                  {error}
                </span>
              </div>
            )}

            {success && (
              <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-800">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />

                <span>
                  {success}
                </span>
              </div>
            )}

            {/* ==================================================
                ZUGANGSDATEN
               ================================================== */}

            {tab ===
              "account" && (
              <div className="space-y-5">
                <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="mb-5">
                    <h3 className="font-bold text-slate-950">
                      Persönliche Daten
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Name und
                      Anmelde-E-Mail des
                      Mitarbeiterkontos.
                    </p>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
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
                          setField(
                            "name",
                            event
                              .target
                              .value
                          )
                        }
                        className="
                          h-11 w-full
                          rounded-xl
                          border border-slate-200
                          bg-slate-50
                          px-4 text-sm
                          outline-none
                          transition
                          focus:border-sky-400
                          focus:bg-white
                          focus:ring-4
                          focus:ring-sky-100
                        "
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        E-Mail
                      </label>

                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                        <input
                          type="email"
                          value={
                            form.email
                          }
                          onChange={(
                            event
                          ) =>
                            setField(
                              "email",
                              event
                                .target
                                .value
                            )
                          }
                          className="
                            h-11 w-full
                            rounded-xl
                            border border-slate-200
                            bg-slate-50
                            pl-10 pr-4
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
                    </div>
                  </div>
                </section>

                <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <h3 className="font-bold text-slate-950">
                    Rolle & Zugang
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Bestimmt die
                    grundsätzliche
                    Zugriffsstufe des
                    Kontos.
                  </p>

                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Rolle
                      </label>

                      <select
                        value={
                          form.role
                        }
                        disabled={
                          isSelf &&
                          employee.role ===
                            "SUPERADMIN"
                        }
                        onChange={(
                          event
                        ) =>
                          handleRoleChange(
                            event
                              .target
                              .value
                          )
                        }
                        className="
                          h-11 w-full
                          rounded-xl
                          border border-slate-200
                          bg-white
                          px-4 text-sm
                          outline-none
                          transition
                          focus:border-sky-400
                          focus:ring-4
                          focus:ring-sky-100
                          disabled:cursor-not-allowed
                          disabled:bg-slate-100
                          disabled:text-slate-500
                        "
                      >
                        <option value="EDITOR">
                          Editor
                        </option>

                        <option value="ADMIN">
                          Administrator
                        </option>

                        <option value="SUPERADMIN">
                          Superadmin
                        </option>
                      </select>

                      {isSelf &&
                        employee.role ===
                          "SUPERADMIN" && (
                          <p className="mt-2 text-[11px] leading-5 text-slate-500">
                            Die
                            Superadmin-Rolle
                            deines eigenen
                            Kontos ist
                            geschützt.
                          </p>
                        )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Kontostatus
                      </label>

                      <div className="flex h-11 items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {form.isActive
                              ? "Aktiv"
                              : "Gesperrt"}
                          </p>
                        </div>

                        <Switch
                          checked={
                            form.isActive
                          }
                          disabled={
                            isSelf
                          }
                          onChange={(
                            value
                          ) =>
                            setField(
                              "isActive",
                              value
                            )
                          }
                        />
                      </div>

                      {isSelf && (
                        <p className="mt-2 text-[11px] text-slate-500">
                          Dein eigenes
                          Konto kann hier
                          nicht gesperrt
                          werden.
                        </p>
                      )}
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* ==================================================
                RECHTE
               ================================================== */}

            {tab ===
              "permissions" && (
              <div className="space-y-5">
                {isSuperAdmin ? (
                  <div className="overflow-hidden rounded-[24px] border border-sky-200 bg-white shadow-sm">
                    <div className="bg-gradient-to-br from-sky-50 to-white p-6">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-lg shadow-sky-600/20">
                        <ShieldCheck className="h-5 w-5" />
                      </div>

                      <h3 className="mt-5 text-xl font-bold text-slate-950">
                        Vollzugriff
                      </h3>

                      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                        Superadmins
                        besitzen
                        automatisch alle
                        Berechtigungen.
                        Einzelne Rechte
                        können bei dieser
                        Rolle nicht
                        deaktiviert
                        werden.
                      </p>

                      <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1.5 text-xs font-bold text-sky-700">
                        <Check className="h-3.5 w-3.5" />

                        {
                          permissionCount
                        }{" "}
                        Rechte aktiv
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="font-bold text-slate-950">
                          Individuelle
                          Rechte
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          {
                            permissionCount
                          }{" "}
                          Berechtigungen
                          aktuell aktiv.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={
                          useRoleDefaults
                        }
                        className="
                          inline-flex h-10
                          items-center justify-center
                          gap-2 rounded-xl
                          border border-slate-200
                          bg-white px-4
                          text-sm font-semibold
                          text-slate-700
                          transition
                          hover:bg-slate-50
                        "
                      >
                        <SlidersHorizontal className="h-4 w-4" />

                        Standard für{" "}
                        {form.role ===
                        "ADMIN"
                          ? "Admin"
                          : "Editor"}
                      </button>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      {PERMISSION_GROUPS.map(
                        (
                          group
                        ) => {
                          const active =
                            group.permissions.filter(
                              (
                                item
                              ) =>
                                form.permissions.includes(
                                  item.key
                                )
                            )
                              .length;

                          return (
                            <section
                              key={
                                group.title
                              }
                              className="
                                overflow-hidden
                                rounded-[22px]
                                border border-slate-200
                                bg-white
                                shadow-sm
                              "
                            >
                              <div className="border-b border-slate-100 px-5 py-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <h4 className="font-bold text-slate-900">
                                      {
                                        group.title
                                      }
                                    </h4>

                                    <p className="mt-1 text-xs leading-5 text-slate-500">
                                      {
                                        group.description
                                      }
                                    </p>
                                  </div>

                                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">
                                    {
                                      active
                                    }
                                    /
                                    {
                                      group
                                        .permissions
                                        .length
                                    }
                                  </span>
                                </div>

                                <div className="mt-3 flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      enableGroup(
                                        group
                                      )
                                    }
                                    className="text-[11px] font-semibold text-sky-700 hover:underline"
                                  >
                                    Alle
                                    aktivieren
                                  </button>

                                  <span className="text-slate-300">
                                    •
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      disableGroup(
                                        group
                                      )
                                    }
                                    className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                                  >
                                    Alle
                                    deaktivieren
                                  </button>
                                </div>
                              </div>

                              <div className="divide-y divide-slate-100">
                                {group.permissions.map(
                                  (
                                    permission
                                  ) => {
                                    const checked =
                                      form.permissions.includes(
                                        permission.key
                                      );

                                    return (
                                      <div
                                        key={
                                          permission.key
                                        }
                                        className="flex items-center justify-between gap-4 px-5 py-3.5"
                                      >
                                        <span className="text-sm font-medium text-slate-700">
                                          {
                                            permission.label
                                          }
                                        </span>

                                        <Switch
                                          checked={
                                            checked
                                          }
                                          onChange={() =>
                                            togglePermission(
                                              permission.key
                                            )
                                          }
                                        />
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            </section>
                          );
                        }
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ==================================================
                SICHERHEIT
               ================================================== */}

            {tab ===
              "security" && (
              <div className="space-y-5">

                {/* SESSION SETTINGS */}

                <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                      <Clock3 className="h-4 w-4" />
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-950">
                        Sitzung
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Automatische
                        Abmeldung bei
                        Inaktivität.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Inaktivitäts-Timeout
                      </label>

                      <select
                        value={
                          form.sessionTimeoutMinutes
                        }
                        onChange={(
                          event
                        ) =>
                          setField(
                            "sessionTimeoutMinutes",
                            Number(
                              event
                                .target
                                .value
                            )
                          )
                        }
                        className="
                          h-11 w-full
                          rounded-xl
                          border border-slate-200
                          bg-white px-4
                          text-sm outline-none
                          focus:border-sky-400
                          focus:ring-4
                          focus:ring-sky-100
                        "
                      >
                        {TIMEOUT_OPTIONS.map(
                          (
                            minutes
                          ) => (
                            <option
                              key={
                                minutes
                              }
                              value={
                                minutes
                              }
                            >
                              {
                                minutes
                              }{" "}
                              Minuten
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          Passwortwechsel
                          erzwingen
                        </p>

                        <p className="mt-1 text-[11px] leading-4 text-slate-500">
                          Beim nächsten
                          Login muss ein
                          neues Passwort
                          vergeben werden.
                        </p>
                      </div>

                      <Switch
                        checked={
                          form.mustChangePassword
                        }
                        disabled={
                          isSelf
                        }
                        onChange={(
                          value
                        ) =>
                          setField(
                            "mustChangePassword",
                            value
                          )
                        }
                      />
                    </div>
                  </div>
                </section>

                {/* SECURITY INFO */}

                <section className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                      Letzter Login
                    </p>

                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {formatDate(
                        employee.lastLoginAt
                      )}
                    </p>
                  </div>

                  <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                      Passwort zuletzt
                      geändert
                    </p>

                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {formatDate(
                        employee.passwordChangedAt
                      )}
                    </p>
                  </div>
                </section>

                {/* PASSWORD */}

                <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                      <KeyRound className="h-4 w-4" />
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-950">
                        Passwort
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {isSelf
                          ? "Ändere dein eigenes Passwort sicher."
                          : "Setze ein neues Passwort oder lasse automatisch eines erzeugen."}
                      </p>
                    </div>
                  </div>

                  {isSelf ? (
                    <div className="mt-5 grid gap-4">
                      <input
                        type="password"
                        autoComplete="current-password"
                        placeholder="Aktuelles Passwort"
                        value={
                          currentPassword
                        }
                        onChange={(
                          event
                        ) =>
                          setCurrentPassword(
                            event
                              .target
                              .value
                          )
                        }
                        className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                      />

                      <div className="grid gap-4 md:grid-cols-2">
                        <input
                          type="password"
                          autoComplete="new-password"
                          placeholder="Neues Passwort"
                          value={
                            newPassword
                          }
                          onChange={(
                            event
                          ) =>
                            setNewPassword(
                              event
                                .target
                                .value
                            )
                          }
                          className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                        />

                        <input
                          type="password"
                          autoComplete="new-password"
                          placeholder="Neues Passwort wiederholen"
                          value={
                            newPasswordRepeat
                          }
                          onChange={(
                            event
                          ) =>
                            setNewPasswordRepeat(
                              event
                                .target
                                .value
                            )
                          }
                          className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                        />
                      </div>

                      <button
                        type="button"
                        disabled={
                          passwordLoading
                        }
                        onClick={() =>
                          changePassword()
                        }
                        className="
                          inline-flex h-11
                          w-fit items-center
                          justify-center gap-2
                          rounded-xl
                          bg-sky-600 px-5
                          text-sm font-semibold
                          text-white
                          transition
                          hover:bg-sky-700
                          disabled:opacity-60
                        "
                      >
                        {passwordLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <KeyRound className="h-4 w-4" />
                        )}

                        Passwort ändern
                      </button>
                    </div>
                  ) : (
                    <div className="mt-5">
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Neues Passwort
                      </label>

                      <input
                        type="password"
                        value={
                          newPassword
                        }
                        onChange={(
                          event
                        ) =>
                          setNewPassword(
                            event
                              .target
                              .value
                          )
                        }
                        placeholder="Leer lassen, um automatisch eines zu erzeugen"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                      />

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={
                            passwordLoading ||
                            !newPassword
                          }
                          onClick={() =>
                            changePassword()
                          }
                          className="
                            inline-flex h-10
                            items-center gap-2
                            rounded-xl
                            border border-slate-200
                            bg-white px-4
                            text-sm font-semibold
                            text-slate-700
                            transition
                            hover:border-sky-200
                            hover:bg-sky-50
                            hover:text-sky-700
                            disabled:opacity-40
                          "
                        >
                          <KeyRound className="h-4 w-4" />

                          Passwort setzen
                        </button>

                        <button
                          type="button"
                          disabled={
                            passwordLoading
                          }
                          onClick={() =>
                            changePassword(
                              {
                                generate: true,
                              }
                            )
                          }
                          className="
                            inline-flex h-10
                            items-center gap-2
                            rounded-xl
                            bg-sky-600 px-4
                            text-sm font-semibold
                            text-white
                            transition
                            hover:bg-sky-700
                            disabled:opacity-60
                          "
                        >
                          {passwordLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <KeyRound className="h-4 w-4" />
                          )}

                          Sicheres Passwort
                          erzeugen
                        </button>
                      </div>
                    </div>
                  )}

                  {generatedPassword && (
                    <div className="mt-5 rounded-2xl border border-sky-200 bg-sky-50/60 p-4">
                      <p className="text-xs font-bold text-sky-800">
                        Neues temporäres
                        Passwort
                      </p>

                      <div className="mt-2 flex gap-2">
                        <code className="min-w-0 flex-1 overflow-x-auto rounded-xl border border-sky-200 bg-white px-4 py-3 font-mono text-sm font-bold text-slate-900">
                          {
                            generatedPassword
                          }
                        </code>

                        <button
                          type="button"
                          onClick={
                            copyGeneratedPassword
                          }
                          className="flex h-11 shrink-0 items-center gap-2 rounded-xl border border-sky-200 bg-white px-4 text-sm font-semibold text-sky-700"
                        >
                          {copied ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Clipboard className="h-4 w-4" />
                          )}

                          {copied
                            ? "Kopiert"
                            : "Kopieren"}
                        </button>
                      </div>

                      <p className="mt-2 text-[11px] text-amber-700">
                        Dieses Passwort
                        wird später nicht
                        erneut angezeigt.
                      </p>
                    </div>
                  )}
                </section>

                {/* SESSIONS */}

                <section className="rounded-[24px] border border-amber-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-bold text-slate-950">
                        Aktive Sitzungen
                      </h3>

                      <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
                        Alle bereits
                        angemeldeten
                        Geräte und Browser
                        dieses Kontos
                        werden abgemeldet.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setShowSessionConfirm(
                          true
                        )
                      }
                      className="
                        inline-flex h-10
                        shrink-0
                        items-center justify-center
                        gap-2 rounded-xl
                        border border-amber-200
                        bg-amber-50
                        px-4
                        text-sm font-semibold
                        text-amber-800
                        transition
                        hover:bg-amber-100
                      "
                    >
                      <LogOut className="h-4 w-4" />

                      Alle Sessions
                      beenden
                    </button>
                  </div>
                </section>
              </div>
            )}
          </div>

          {/* FOOTER */}

          <footer className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <p className="text-[11px] text-slate-400">
              Änderungen an Rolle,
              Status oder Rechten können
              bestehende Sitzungen
              ungültig machen.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={onClose}
                className="
                  h-10 rounded-xl
                  border border-slate-200
                  bg-white px-4
                  text-sm font-semibold
                  text-slate-700
                  transition
                  hover:bg-slate-50
                "
              >
                Schließen
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={
                  saveEmployee
                }
                className="
                  inline-flex h-10
                  items-center justify-center
                  gap-2 rounded-xl
                  bg-sky-600 px-5
                  text-sm font-semibold
                  text-white
                  shadow-lg shadow-sky-600/20
                  transition
                  hover:bg-sky-700
                  disabled:opacity-60
                "
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}

                {saving
                  ? "Speichern..."
                  : "Änderungen speichern"}
              </button>
            </div>
          </footer>
        </div>
      </div>

      {/* ========================================================
          CUSTOM SESSION CONFIRM
         ======================================================== */}

      {showSessionConfirm && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[6px]">
          <div className="w-full max-w-md overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_35px_100px_rgba(15,23,42,0.35)]">
            <div className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-100">
                <LogOut className="h-5 w-5" />
              </div>

              <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-sky-700">
                Urlaub GOSCH Admin
              </p>

              <h3 className="mt-1 text-xl font-bold text-slate-950">
                Alle Sitzungen
                beenden?
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {isSelf
                  ? "Du wirst auf diesem Gerät ebenfalls sofort ausgeloggt und musst dich anschließend neu anmelden."
                  : `Alle angemeldeten Geräte von ${
                      employee.name ||
                      employee.email
                    } werden ausgeloggt.`}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={
                    sessionLoading
                  }
                  onClick={() =>
                    setShowSessionConfirm(
                      false
                    )
                  }
                  className="h-11 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Abbrechen
                </button>

                <button
                  type="button"
                  disabled={
                    sessionLoading
                  }
                  onClick={
                    endSessions
                  }
                  className="
                    inline-flex h-11
                    items-center justify-center
                    gap-2 rounded-xl
                    bg-amber-600
                    px-4
                    text-sm font-semibold
                    text-white
                    transition
                    hover:bg-amber-700
                    disabled:opacity-60
                  "
                >
                  {sessionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}

                  Sessions beenden
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}