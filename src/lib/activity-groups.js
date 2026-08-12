export const ACTIVITY_GROUPS = [
  "Alle",
  "Familie",
  "Natur",
  "Sport",
  "Restaurant",
  "Kultur",
];

export const ACTIVITY_GROUP_META = {
  Alle: {
    label: "Alle",
    mapKey: "all",
    mapColor: "#050b1f",
  },
  Familie: {
    label: "Familie",
    mapKey: "familie",
    mapColor: "#c49a3a",
  },
  Natur: {
    label: "Natur",
    mapKey: "natur",
    mapColor: "#0077b6",
  },
  Sport: {
    label: "Sport",
    mapKey: "sport",
    mapColor: "#050b1f",
  },
  Restaurant: {
    label: "Restaurant",
    mapKey: "restaurant",
    mapColor: "#9a6b2f",
  },
  Kultur: {
    label: "Kultur",
    mapKey: "kultur",
    mapColor: "#475569",
  },
};

export function getActivityGroup(activity = {}) {
  const category = normalize(activity.category);
  const title = normalize(activity.title);
  const shortDescription = normalize(activity.shortDescription);
  const description = normalize(activity.description);
  const content = normalize(activity.content);
  const weather = normalize(activity.weather);

  const highlights = Array.isArray(activity.highlights)
    ? normalize(activity.highlights.join(" "))
    : "";

  const tips = Array.isArray(activity.tips)
    ? normalize(activity.tips.join(" "))
    : "";

  const text = [
    category,
    title,
    shortDescription,
    description,
    content,
    weather,
    highlights,
    tips,
  ].join(" ");

  if (
    hasAny(category, [
      "restaurants",
      "restaurant",
      "selbsterzeuger",
    ])
  ) {
    return "Restaurant";
  }

  if (
    hasAny(category, [
      "museum",
      "historischer platz",
      "information",
    ])
  ) {
    return "Kultur";
  }

  if (
    hasAny(category, [
      "golf",
      "wassersport",
    ])
  ) {
    return "Sport";
  }

  if (hasAny(category, ["gesundheit"])) {
    return "Familie";
  }

  if (
    hasAny(text, [
      "familie",
      "familien",
      "familienausflug",
      "familienfreundlich",
      "kinder",
      "kindern",
      "freizeitpark",
      "erlebnispark",
      "spielhof",
      "landspielhof",
      "spielplatz",
      "spielplaetze",
      "spielplätze",
      "spielscheune",
      "tiergehege",
      "tier",
      "tiere",
      "zoo",
      "aquarium",
      "wildpark",
      "erlebniswald",
      "barfusspark",
      "barfußpark",
      "hansapark",
      "hansa-park",
      "galileo",
      "wissenswelt",
      "ostsee erlebniswelt",
      "therme",
      "rutschen",
      "indoor",
      "schlechtwetter",
      "mitmach",
      "esel",
      "abenteuer",
      "schulklassen",
    ])
  ) {
    return "Familie";
  }

  if (
    hasAny(text, [
      "golf",
      "minigolf",
      "adventure-golf",
      "wassersport",
      "kanu",
      "kajak",
      "sup",
      "surf",
      "segel",
      "segeln",
      "klettern",
      "wandern",
      "reitsport",
      "reiten",
      "sport",
      "outdoor-aktivitaeten",
      "outdoor-aktivitäten",
      "geocaching",
      "eisstock",
      "team-event",
      "teamevent",
      "bewegung",
      "aktiv",
      "parcours",
    ])
  ) {
    return "Sport";
  }

  if (
    hasAny(text, [
      "brauerei",
      "restaurant",
      "cafe",
      "café",
      "bistro",
      "gastronomie",
      "kulinarik",
      "genuss",
      "manufaktur",
      "kocherei",
      "bonbon",
      "marzipan",
      "hofladen",
      "speicher",
      "essen",
      "speisen",
      "verkostung",
      "shop",
      "verkaufsbereich",
    ])
  ) {
    return "Restaurant";
  }

  if (
    hasAny(text, [
      "museum",
      "kultur",
      "kunst",
      "theater",
      "konzert",
      "kabarett",
      "planetarium",
      "science",
      "ausstellung",
      "altstadt",
      "historisch",
      "geschichte",
      "schloss",
      "stadtfuehrung",
      "stadtführung",
      "tour",
      "galerie",
      "tradition",
      "denkmal",
    ])
  ) {
    return "Kultur";
  }

  return "Natur";
}

export function getActivityMapGroup(activity = {}) {
  return (
    ACTIVITY_GROUP_META[getActivityGroup(activity)]?.mapKey ||
    "natur"
  );
}

export function isValidCoordinate(lat, lng) {
  return (
    Number.isFinite(Number(lat)) &&
    Number.isFinite(Number(lng))
  );
}

/*
 * Nur intern für Datenqualität / SEO.
 * Diese Information wird NICHT im Frontend angezeigt.
 */
export function isActivityLocationVerified(activity = {}) {
  if (activity.locationVerified === true) {
    return true;
  }

  if (activity.locationVerified === false) {
    return false;
  }

  return activity.coordinateQuality === "marker";
}

/*
 * Nur intern für strukturierte Daten.
 * Diese Information wird NICHT im Frontend angezeigt.
 */
export function isActivityAddressVerified(activity = {}) {
  if (activity.addressVerified === true) {
    return true;
  }

  if (activity.addressVerified === false) {
    return false;
  }

  return (
    isActivityLocationVerified(activity) &&
    Boolean(activity.address)
  );
}

export function getActivityLocationLabel(activity = {}) {
  const title = String(activity.title || "").trim();
  const address = String(activity.address || "").trim();

  if (title && address) {
    return `${title}, ${address}`;
  }

  return title || address || "Ausflugsziel";
}

/*
 * Wichtig:
 * Google Maps wird IMMER über Name + Adresse geöffnet.
 *
 * lat/lng werden hier bewusst NICHT verwendet.
 */
export function getGoogleMapsUrl(activity = {}) {
  const title = String(activity.title || "").trim();
  const address = String(activity.address || "").trim();

  const searchText =
    [title, address]
      .filter(Boolean)
      .join(", ") || "Ausflugsziel";

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    searchText
  )}`;
}

/*
 * Auch Apple Maps sucht immer nach Name + Adresse.
 */
export function getAppleMapsUrl(activity = {}) {
  const title = String(activity.title || "").trim();
  const address = String(activity.address || "").trim();

  const searchText =
    [title, address]
      .filter(Boolean)
      .join(", ") || "Ausflugsziel";

  return `https://maps.apple.com/?q=${encodeURIComponent(
    searchText
  )}`;
}

export function getActivitySchemaType(activity = {}) {
  const group = getActivityGroup(activity);
  const category = normalize(activity.category);

  if (group === "Restaurant") {
    return "Restaurant";
  }

  if (category.includes("museum")) {
    return "Museum";
  }

  if (category.includes("golf")) {
    return "GolfCourse";
  }

  if (category.includes("gesundheit")) {
    return "LocalBusiness";
  }

  return "TouristAttraction";
}

function normalize(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function hasAny(text, keywords) {
  return keywords.some((keyword) =>
    text.includes(normalize(keyword))
  );
}