"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  ShieldCheck,
} from "lucide-react";

export default function ForcedPasswordChangeForm({
  email,
}) {
  const router =
    useRouter();

  const [password, setPassword] =
    useState("");

  const [repeat, setRepeat] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function submit(event) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");

    if (
      password.length < 10
    ) {
      setError(
        "Das neue Passwort muss mindestens 10 Zeichen lang sein."
      );

      return;
    }

    if (
      password !== repeat
    ) {
      setError(
        "Die Passwörter stimmen nicht überein."
      );

      return;
    }

    try {
      setLoading(true);

      const response =
        await fetch(
          "/api/admin/passwort-aendern",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                password,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data?.error ||
            "Passwort konnte nicht geändert werden."
        );

        return;
      }

      try {
        localStorage.setItem(
          "admin:lastActivity",
          String(
            Date.now()
          )
        );
      } catch {}

      router.replace(
        "/admin"
      );

      router.refresh();
    } catch {
      setError(
        "Die Verbindung zum Server konnte nicht hergestellt werden."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-20">
      <div className="mx-auto flex min-h-[70vh] max-w-lg items-center">
        <div className="w-full overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-xl shadow-slate-200/60">

          <div className="border-b border-slate-100 bg-gradient-to-br from-sky-50 to-white px-7 py-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-lg shadow-sky-600/20">
              <ShieldCheck className="h-6 w-6" />
            </div>

            <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-sky-700">
              Urlaub GOSCH Admin
            </p>

            <h1 className="mt-2 text-2xl font-bold text-slate-950">
              Neues Passwort erforderlich
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Für dein Konto wurde ein
              Passwortwechsel angefordert.
              Lege ein neues Passwort fest,
              bevor du den Adminbereich
              weiter verwendest.
            </p>

            <p className="mt-3 text-xs font-medium text-slate-500">
              {email}
            </p>
          </div>

          <form
            onSubmit={submit}
            className="space-y-5 p-7"
          >
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Neues Passwort
              </label>

              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  autoComplete="new-password"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-12 text-sm outline-none focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (value) =>
                        !value
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Passwort wiederholen
              </label>

              <input
                type="password"
                value={repeat}
                onChange={(event) =>
                  setRepeat(
                    event.target.value
                  )
                }
                autoComplete="new-password"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 text-sm font-bold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-700 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Speichern...
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4" />
                  Neues Passwort speichern
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}