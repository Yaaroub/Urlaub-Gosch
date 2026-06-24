import Link from "next/link";
import Image from "next/image";
import FavButton from "@/components/FavButton";
import LastMinuteBadge from "@/components/LastMinuteBadge";
import { getAmenityIcon, normalizeAmenityName } from "@/lib/amenity-icons";

export default function PropertyGrid({
  items,
  showAvailabilityBadge = false,
  lastMinuteDiscounts = {},
}) {
  const properties = Array.isArray(items) ? items : [];

  if (properties.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
        Keine Objekte für die Auswahl.
      </p>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {properties.map((property) => {
        const discount = lastMinuteDiscounts[String(property.id)];
        const amenities = Array.isArray(property.amenities)
          ? property.amenities
          : [];

        const imageUrl = getSafeImageUrl(property);

        return (
          <Link
            key={property.id}
            href={`/properties/${property.slug}`}
            className={[
              "group relative overflow-hidden rounded-2xl bg-white",
              "border border-slate-200 shadow-sm",
              "transition-[border-color,box-shadow] duration-200 ease-out",
              "hover:border-slate-300 hover:shadow-[0_14px_34px_rgba(15,23,42,0.08)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60",
            ].join(" ")}
          >
            <FavButton
              id={property.id}
              className="absolute right-3 top-3 z-10"
            />

            {discount != null && <LastMinuteBadge discount={discount} />}

            <div className="relative overflow-hidden bg-slate-100">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={property.images?.[0]?.alt || property.title || ""}
                  width={640}
                  height={480}
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  quality={72}
                  className={[
                    "aspect-[4/3] w-full object-cover",
                    "transition duration-300 ease-out",
                    "group-hover:brightness-[0.97]",
                  ].join(" ")}
                />
              ) : (
                <div className="grid aspect-[4/3] w-full place-items-center bg-slate-100 text-sm text-slate-400">
                  Kein Bild
                </div>
              )}

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/[0.10] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              {showAvailabilityBadge && (
                <span className="absolute left-3 top-3 rounded-full bg-emerald-600 px-2 py-1 text-xs font-medium text-white shadow-sm">
                  Verfügbar
                </span>
              )}
            </div>

            <div className="p-4">
              <h3 className="line-clamp-2 text-base font-semibold leading-snug text-slate-900 transition-colors duration-200 group-hover:text-slate-950">
                {property.title}
              </h3>

              <p className="mt-1 text-sm text-slate-600">
                {property.location}
              </p>

              {amenities.length > 0 && (
                <div className="mt-3 flex items-center gap-2 text-slate-500">
                  {uniqueAmenities(amenities).map((amenity) => {
                    const Icon = getAmenityIcon(amenity.name);

                    return (
                      <span
                        key={amenity.id ?? amenity.name}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-50 text-slate-500 ring-1 ring-slate-200/80"
                        title={amenity.name}
                        aria-label={amenity.name}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <span>
                  {typeof property.maxPersons !== "undefined"
                    ? `bis ${property.maxPersons} Pers.`
                    : ""}
                </span>

                <span>
                  {property.dogsAllowed ? "Hunde erlaubt" : "Keine Hunde"}
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function getSafeImageUrl(property) {
  const url = property.images?.[0]?.url;

  if (!url || typeof url !== "string") {
    return null;
  }

  /*
    Alte Uploads wie /uploads/xyz.jpg funktionieren online auf Vercel nicht,
    wenn sie nicht wirklich in public/uploads deployed wurden.
    Lokal lassen wir sie trotzdem zu, damit npm run dev weiter funktioniert.
  */
  if (url.startsWith("/uploads/") && process.env.NODE_ENV === "production") {
    return null;
  }

  return url;
}

function uniqueAmenities(amenities) {
  const seen = new Set();
  const list = [];

  for (const amenity of amenities) {
    const key = normalizeAmenityName(amenity?.name);
    if (!key || seen.has(key)) continue;

    seen.add(key);
    list.push(amenity);

    if (list.length >= 6) break;
  }

  return list;
}