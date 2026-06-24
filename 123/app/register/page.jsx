"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function RegisterContent() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/";

  async function submit(e) {
    e.preventDefault();
    setErr("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setErr(data.error || "Registrierung fehlgeschlagen");
      return;
    }

    router.replace(next);
  }

  return (
    <section className="mx-auto max-w-sm px-4 py-12">
      <h1 className="text-2xl font-semibold mb-6">Registrieren</h1>
      <form
        onSubmit={submit}
        className="space-y-3 bg-white rounded-2xl ring-1 ring-black/5 p-6"
      >
        <input
          className="border rounded-xl px-3 py-2 w-full"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="border rounded-xl px-3 py-2 w-full"
          placeholder="E-Mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="border rounded-xl px-3 py-2 w-full"
          placeholder="Passwort"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {err && <p className="text-sm text-rose-600">{err}</p>}
        <button className="rounded-xl px-4 py-2 bg-sky-600 text-white w-full">
          Konto anlegen
        </button>
      </form>
    </section>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <section className="mx-auto max-w-sm px-4 py-12">
          <p className="text-slate-600">Lade Registrierung…</p>
        </section>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
