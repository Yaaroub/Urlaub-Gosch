// src/components/AmenitiesList.jsx
import { getAmenityIcon, normalizeAmenityName } from "@/lib/amenity-icons";

/**
 * amenities: Array<{ id:number, name:string }>
 * - normalisiert Duplikate (z.B. "Eingezäunt" -> "Eingezäuntes Grundstück")
 * - zeigt Icon + Label
 */
export default function AmenitiesList({ amenities = [] }) {
  // Duplikate raus (nach normalisiertem Key)
  const unique = [];
  const seen = new Set();

  for (const a of amenities) {
    const key = normalizeAmenityName(a?.name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(a);
  }

  if (!unique.length) {
    return <p className="text-sm text-slate-600">–</p>;
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {unique.map((a) => {
        const Icon = getAmenityIcon(a.name);
        return (
          <li
            key={a.id}
            className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-black/5"
          >
            <Icon className="h-4 w-4 text-slate-600" />
            {a.name}
          </li>
        );
      })}
    </ul>
  );
}
