"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { RefreshCw } from "lucide-react";

export default function DatabaseUnavailable() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <main className="mx-auto my-32 max-w-lg px-5">
      <div className="border-l-4 border-amber-500 bg-white p-7 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Verwaltung</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-950">Die Datenbank antwortet gerade nicht.</h1>
        <p role="status" className="mt-3 text-sm leading-6 text-slate-600">Deine Zugriffsrechte können momentan nicht geprüft werden. Bitte versuche die Verbindung erneut.</p>
        <button type="button" disabled={pending} onClick={() => startTransition(() => router.refresh())} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-teal-800 px-4 text-sm font-semibold text-white hover:bg-teal-900 disabled:opacity-60">
          <RefreshCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
          {pending ? "Verbindung wird geprüft …" : "Erneut verbinden"}
        </button>
      </div>
    </main>
  );
}
