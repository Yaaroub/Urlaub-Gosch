import { activities } from "@/lib/activities";
import ActivityMapClient from "@/components/ActivityMapClient";
import Link from "next/link";
import { headers } from "next/headers";

export async function generateMetadata({ params }) {
  const a = activities.find((x) => x.slug === params.slug);
  if (!a) return { title: "Aktivität nicht gefunden" };
  return {
    title: `${a.title} – Ausflugsziel | Urlaub-Gosch`,
    description: a.description,
  };
}

async function getNearby({ lat, lng, radiusKm }) {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "http";
  const baseUrl = `${proto}://${host}`;

  const res = await fetch(
    `${baseUrl}/api/properties/nearby?lat=${lat}&lng=${lng}&radius=${radiusKm}`,
    { cache: "no-store" }
  );

  // API kann Fehler liefern:
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  if (!res.ok) return { items: [], error: json?.error || "Nearby-Request fehlgeschlagen" };
  return { items: json?.items || [], error: null };
}

export default async function ActivityDetailPage({ params }) {
  const a = activities.find((x) => x.slug === params.slug);
  if (!a) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Nicht gefunden</h1>
      </main>
    );
  }

  const radiusKm = 25;
  const { items: nearby, error } = await getNearby({ lat: a.lat, lng: a.lng, radiusKm });

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 pt-34 space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold text-sky-700">{a.category}</p>
        <h1 className="text-3xl font-semibold text-slate-900">{a.title}</h1>
        <p className="text-slate-600">{a.description}</p>
      </header>

      {a.content ? (
        <article className="prose prose-slate max-w-none">
          <p>{a.content}</p>
        </article>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md">
        <h2 className="text-sm font-semibold text-slate-900 mb-2">Lage auf der Karte</h2>
        <ActivityMapClient items={[a]} center={[a.lat, a.lng]} zoom={11} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Unterkünfte in der Nähe</h2>
            <p className="text-xs text-slate-600">
              {radiusKm} km Umkreis
            </p>
          </div>
        </div>

        <div className="mt-3 space-y-3">
          {error ? (
            <div className="rounded-xl bg-slate-50 ring-1 ring-black/5 p-4 text-sm text-slate-600">
              {error}
            </div>
          ) : nearby.length === 0 ? (
            <div className="rounded-xl bg-slate-50 ring-1 ring-black/5 p-4 text-sm text-slate-600">
              Keine Unterkünfte im Umkreis gefunden.
            </div>
          ) : (
            nearby.map((p) => (
              <Link
                key={p.id}
                href={`/properties/${p.slug}`}
                className="block rounded-xl ring-1 ring-black/10 p-3 hover:bg-slate-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-900">{p.title}</div>
                    <div className="text-xs text-slate-600">{p.location}</div>
                  </div>
                  <div className="text-xs font-semibold">{Number(p.distanceKm).toFixed(1)} km</div>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
