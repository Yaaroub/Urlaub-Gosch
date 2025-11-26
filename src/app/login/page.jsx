"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/";

  async function submit(e) {
    e.preventDefault();
    setErr("");
    const res = await fetch("/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) { setErr(data.error || "Login fehlgeschlagen"); return; }
    router.replace(next);
  }

  return (
    <section className="mx-auto max-w-sm px-4 py-12">
      <h1 className="text-2xl font-semibold mb-6">Anmelden</h1>
      <form onSubmit={submit} className="space-y-3 bg-white rounded-2xl ring-1 ring-black/5 p-6">
        <input className="border rounded-xl px-3 py-2 w-full" placeholder="E-Mail"
               value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="border rounded-xl px-3 py-2 w-full" placeholder="Passwort" type="password"
               value={password} onChange={e=>setPassword(e.target.value)} />
        {err && <p className="text-sm text-rose-600">{err}</p>}
        <button className="rounded-xl px-4 py-2 bg-sky-600 text-white w-full">Einloggen</button>
      </form>

      <p className="text-sm text-slate-600 mt-3">
        Kein Konto?{" "}
        <a className="underline" href={`/register?next=${encodeURIComponent(next)}`}>Registrieren</a>
      </p>
    </section>
  );
}
