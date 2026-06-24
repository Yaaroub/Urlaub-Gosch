"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // Profile form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");

  // Delete form state
  const [confirmText, setConfirmText] = useState("");
  const [delPw, setDelPw] = useState("");
  const [delErr, setDelErr] = useState("");

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/account/me", { cache: "no-store" });
      if (!r.ok) { router.replace("/login?next=/account"); return; }
      const data = await r.json();
      setMe(data);
      setName(data.name || "");
      setEmail(data.email || "");
      setLoading(false);
    })();
  }, [router]);

  async function saveProfile(e) {
    e.preventDefault(); setMsg(""); setErr("");
    const r = await fetch("/api/account/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });
    const data = await r.json();
    if (!r.ok) { setErr(data.error || "Speichern fehlgeschlagen"); return; }
    setMsg("Profil aktualisiert.");
  }

  async function changePassword(e) {
    e.preventDefault(); setPwMsg(""); setPwErr("");
    const r = await fetch("/api/account/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await r.json();
    if (!r.ok) { setPwErr(data.error || "Passwortwechsel fehlgeschlagen"); return; }
    setPwMsg("Passwort geändert.");
    setCurrentPassword(""); setNewPassword("");
  }

  async function deleteAccount(e) {
    e.preventDefault(); setDelErr("");
    if (!confirm("Wirklich unwiderruflich löschen?")) return;
    const r = await fetch("/api/account/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmText, password: delPw || undefined }),
    });
    const data = await r.json();
    if (!r.ok) { setDelErr(data.error || "Löschen fehlgeschlagen"); return; }
    // zurück zur Startseite
    window.location.href = "/";
  }

  if (loading) return <section className="mx-auto max-w-4xl px-4 py-10"><p>Lade…</p></section>;

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 space-y-8">
      <h1 className="text-2xl font-semibold">Konto & Einstellungen</h1>

      {/* Profil */}
      <form onSubmit={saveProfile} className="rounded-2xl bg-white ring-1 ring-black/5 p-6 space-y-3">
        <h2 className="font-semibold">Profil</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <label className="grid gap-1">
            <span className="text-xs text-slate-500">Name</span>
            <input className="border rounded-xl px-3 py-2" value={name} onChange={e=>setName(e.target.value)} />
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-slate-500">E-Mail</span>
            <input type="email" className="border rounded-xl px-3 py-2" value={email} onChange={e=>setEmail(e.target.value)} />
          </label>
        </div>
        <div className="flex items-center gap-3">
          <button className="rounded-xl px-4 py-2 bg-sky-600 text-white">Speichern</button>
          {msg && <span className="text-sm text-emerald-700">{msg}</span>}
          {err && <span className="text-sm text-rose-700">{err}</span>}
        </div>
        <p className="text-xs text-slate-500">Mit dem Speichern werden E-Mail/Name aktualisiert und deine Session erneuert.</p>
      </form>

      {/* Passwort */}
      <form onSubmit={changePassword} className="rounded-2xl bg-white ring-1 ring-black/5 p-6 space-y-3">
        <h2 className="font-semibold">Passwort ändern</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <label className="grid gap-1">
            <span className="text-xs text-slate-500">Aktuelles Passwort</span>
            <input type="password" className="border rounded-xl px-3 py-2"
              value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} />
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-slate-500">Neues Passwort</span>
            <input type="password" className="border rounded-xl px-3 py-2"
              value={newPassword} onChange={e=>setNewPassword(e.target.value)} />
          </label>
        </div>
        <div className="flex items-center gap-3">
          <button className="rounded-xl px-4 py-2 bg-sky-600 text-white">Ändern</button>
          {pwMsg && <span className="text-sm text-emerald-700">{pwMsg}</span>}
          {pwErr && <span className="text-sm text-rose-700">{pwErr}</span>}
        </div>
        <p className="text-xs text-slate-500">Mindestens 8 Zeichen empfohlen: Satz + Zahl + Sonderzeichen.</p>
      </form>

      {/* Konto löschen */}
      <form onSubmit={deleteAccount} className="rounded-2xl bg-white ring-1 ring-black/5 p-6 space-y-3">
        <h2 className="font-semibold text-rose-700">Konto löschen</h2>
        <p className="text-sm text-slate-600">
          Dieser Vorgang ist <strong>unwiderruflich</strong>. Deine Favoriten und dein Konto werden gelöscht.
        </p>
        <div className="grid md:grid-cols-2 gap-3">
          <label className="grid gap-1">
            <span className="text-xs text-slate-500">Zur Sicherheit tippe: DELETE ME</span>
            <input className="border rounded-xl px-3 py-2" value={confirmText} onChange={e=>setConfirmText(e.target.value)} />
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-slate-500">Oder bestätige mit Passwort (optional)</span>
            <input type="password" className="border rounded-xl px-3 py-2" value={delPw} onChange={e=>setDelPw(e.target.value)} />
          </label>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="rounded-xl px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white"
            disabled={!(confirmText === "DELETE ME" || delPw)}
          >
            Konto unwiderruflich löschen
          </button>
          {delErr && <span className="text-sm text-rose-700">{delErr}</span>}
        </div>
      </form>
    </section>
  );
}
