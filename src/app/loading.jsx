export default function PageLoading() {
  return <div aria-busy="true" className="mx-auto min-h-[65vh] max-w-6xl px-5 pb-12 pt-36">
    <p role="status" className="mb-6 text-sm text-slate-600">Seite wird geladen …</p>
    <div aria-hidden="true" className="space-y-6 motion-safe:animate-pulse"><div className="h-9 w-2/3 rounded-lg bg-slate-200" /><div className="h-64 rounded-2xl bg-slate-100" /><div className="h-5 w-3/4 rounded bg-slate-100" /></div>
  </div>;
}
