export default function AdminLoading() {
  return <section aria-busy="true" aria-label="Verwaltung wird geladen" className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
    <p role="status" className="mb-6 text-sm font-medium text-slate-600">Bereich wird geladen …</p>
    <div aria-hidden="true" className="space-y-5 motion-safe:animate-pulse">
      <div className="h-8 w-64 rounded-lg bg-slate-200" />
      <div className="h-24 rounded-xl border border-slate-200 bg-white" />
      <div className="grid gap-4 sm:grid-cols-2">{[0, 1, 2, 3].map((key) => <div key={key} className="h-28 rounded-xl border border-slate-200 bg-white" />)}</div>
    </div>
  </section>;
}
