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
  },
  Familie: {
    label: "Familie",
    mapKey: "familie",
  },
  Natur: {
    label: "Natur",
    mapKey: "natur",
  },
  Sport: {
    label: "Sport",
    mapKey: "sport",
  },
  Restaurant: {
    label: "Restaurant",
    mapKey: "restaurant",
  },
  Kultur: {
    label: "Kultur",
    mapKey: "kultur",
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

  if (hasAny(category, ["restaurants", "restaurant", "selbsterzeuger"])) {
    return "Restaurant";
  }

  if (hasAny(category, ["museum", "historischer platz", "information"])) {
    return "Kultur";
  }

  if (hasAny(category, ["golf", "wassersport"])) {
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

  if (
    hasAny(text, [
      "natur",
      "see",
      "seen",
      "strand",
      "meer",
      "ostsee",
      "nordsee",
      "wald",
      "park",
      "garten",
      "botanisch",
      "schifffahrt",
      "rundfahrt",
      "wasser",
      "ufer",
      "spaziergang",
      "landschaft",
      "picknick",
      "holsteinische schweiz",
      "düne",
      "duene",
    ])
  ) {
    return "Natur";
  }

  return "Natur";
}

export function getGoogleMapsUrl(activity = {}) {
  const lat = Number(activity.lat);
  const lng = Number(activity.lng);

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }

  const query = encodeURIComponent(
    [activity.title, activity.address].filter(Boolean).join(", ")
  );

  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function getAppleMapsUrl(activity = {}) {
  const lat = Number(activity.lat);
  const lng = Number(activity.lng);

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return `https://maps.apple.com/?ll=${lat},${lng}&q=${encodeURIComponent(
      activity.title || "Ausflugsziel"
    )}`;
  }

  const query = encodeURIComponent(
    [activity.title, activity.address].filter(Boolean).join(", ")
  );

  return `https://maps.apple.com/?q=${query}`;
}

function normalize(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function hasAny(text, keywords) {
  return keywords.some((keyword) => text.includes(normalize(keyword)));
}