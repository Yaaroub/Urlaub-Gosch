import {
  getActivityGroup,
  getActivitySchemaType,
  isActivityAddressVerified,
  isActivityLocationVerified,
} from "@/lib/activity-groups";

export function buildActivityJsonLd(activity, { siteUrl } = {}) {
  if (!activity?.slug || !activity?.title) return null;

  const url = siteUrl
    ? `${siteUrl.replace(/\/$/, "")}/aktivitaeten/${activity.slug}`
    : undefined;
  const verifiedAddress = isActivityAddressVerified(activity);
  const verifiedGeo = isActivityLocationVerified(activity);
  const schemaType = getActivitySchemaType(activity);

  const entity = compact({
    "@context": "https://schema.org",
    "@type": schemaType,
    "@id": url ? `${url}#activity` : undefined,
    name: activity.title,
    url,
    description:
      activity.shortDescription || activity.description || undefined,
    category: getActivityGroup(activity),
    sameAs: isHttpUrl(activity.website) ? [activity.website] : undefined,
    telephone: activity.phone || undefined,
    email: activity.email || undefined,
    address:
      verifiedAddress && activity.address
        ? parseGermanAddress(activity.address)
        : undefined,
    geo:
      verifiedGeo && isFiniteNumber(activity.lat) && isFiniteNumber(activity.lng)
        ? {
            "@type": "GeoCoordinates",
            latitude: Number(activity.lat),
            longitude: Number(activity.lng),
          }
        : undefined,
  });

  const breadcrumb = compact({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Startseite",
        item: siteUrl ? `${siteUrl.replace(/\/$/, "")}/` : undefined,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Aktivitäten",
        item: siteUrl
          ? `${siteUrl.replace(/\/$/, "")}/aktivitaeten`
          : undefined,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: activity.title,
        item: url,
      },
    ],
  });

  return [entity, breadcrumb];
}

export function safeJsonLd(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function parseGermanAddress(value) {
  const address = String(value || "").trim();
  const [streetPart, localityPart] = address.split(",").map((part) => part.trim());
  const localityMatch = localityPart?.match(/^(\d{5})\s+(.+)$/);

  return compact({
    "@type": "PostalAddress",
    streetAddress: streetPart || address,
    postalCode: localityMatch?.[1],
    addressLocality: localityMatch?.[2],
    addressCountry: "DE",
  });
}

function isFiniteNumber(value) {
  return Number.isFinite(Number(value));
}

function isHttpUrl(value) {
  return /^https?:\/\//i.test(String(value || ""));
}

function compact(value) {
  if (Array.isArray(value)) {
    return value.map(compact).filter((item) => item !== undefined);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined && item !== null && item !== "")
        .map(([key, item]) => [key, compact(item)])
    );
  }

  return value;
}
