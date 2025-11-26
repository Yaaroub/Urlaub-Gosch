export const dynamic = "force-dynamic";

export default function AdminHome() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">Admin</h1>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        <a
          href="/admin/properties"
          className="rounded-2xl bg-white ring-1 ring-black/5 shadow-sm p-6 hover:bg-slate-50"
        >
          <h3 className="font-semibold mb-2">Objekte</h3>
          <p className="text-sm text-slate-600">
            Liste aller Unterkünfte mit Slugs & Links.
          </p>
        </a>
        <a
          href="/admin/prices"
          className="rounded-2xl bg-white ring-1 ring-black/5 shadow-sm p-6 hover:bg-slate-50"
        >
          <h3 className="font-semibold mb-2">Preiszeiten</h3>
          <p className="text-sm text-slate-600">
            Preiszeiträume verwalten (Editor).
          </p>
        </a>
        <a
          href="/admin/fees"
          className="rounded-2xl bg-white ring-1 ring-black/5 shadow-sm p-6 hover:bg-slate-50"
        >
          <h3 className="font-semibold mb-2">Nebenkosten</h3>
          <p className="text-sm text-slate-600">
            Endreinigung, Kurtaxe & weitere Zusatzkosten.
          </p>
        </a>
        <a
          href="/admin/images"
          className="rounded-2xl bg-white ring-1 ring-black/5 shadow-sm p-6 hover:bg-slate-50"
        >
          <h3 className="font-semibold mb-2">Bilder</h3>
          <p className="text-sm text-slate-600">
            Bilder hochladen, sortieren & Alt-Texte pflegen.
          </p>
        </a>
        <a
          href="/admin/availability"
          className="rounded-2xl bg-white ring-1 ring-black/5 shadow-sm p-6 hover:bg-slate-50"
        >
          <h3 className="font-semibold mb-2">Verfügbarkeitskalender</h3>
          <p className="text-sm text-slate-600">
            Manuell Zeiträume blockieren oder freigeben.
          </p>
        </a>
        {/* 👇 Neue iCal-Funktion */}
        <a
          href="/admin/ical"
          className="rounded-2xl bg-white ring-1 ring-black/5 shadow-sm p-6 hover:bg-slate-50"
        >
          <h3 className="font-semibold mb-2">iCal Import & Sync</h3>
          <p className="text-sm text-slate-600">
            iCal-URLs hinterlegen, synchronisieren & .ics-Dateien importieren.
          </p>
        </a>
        <a
          href="/admin/lastminute"
          className="rounded-2xl bg-white ring-1 ring-black/5 shadow-sm p-6 hover:bg-slate-50"
        >
          <h3 className="font-semibold mb-2">LM-Angebote anlegen</h3>
          <p className="text-sm text-slate-600">
            LM Angebote erstellen, bearbeiten & löschen.
          </p>
        </a>
      </div>
    </section>
  );
}
