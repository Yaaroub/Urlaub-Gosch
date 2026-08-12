// src/lib/amenity-icons.js
import {
  Wifi,
  Flame,
  Waves,
  Shirt,
  ShieldCheck,
  Fence,
  Building2,
  Home,
  Sun,
  Trees,
  Car,
  Utensils,
  ChefHat,
  Tv,
  Snowflake,
  Thermometer,
  WashingMachine,
  PlugZap,
  PawPrint,
  HelpCircle,
} from "lucide-react";

/**
 * Normalisiert Amenity-Namen für:
 * - URL Query
 * - Filter keys
 * - Icon-Mapping
 *
 * Ziel: gleiche Bedeutung => gleicher Key
 */
export function normalizeAmenityName(name) {
  const n = String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

  const map = {
    // WLAN Varianten
    "wi-fi": "wlan",
    wifi: "wlan",
    internet: "wlan",

    // Grundstück Varianten
    eingezäunt: "eingezäunt",


    // Blick Varianten
    seeblick: "meerblick",
    ostseeblick: "meerblick",
    nordseeblick: "meerblick",

    // TV Varianten
    fernseher: "tv",
    "smart tv": "tv",

    // Spülmaschine Varianten
    geschirrspüler: "spülmaschine",
    spuelmaschine: "spülmaschine",

    // Parkplatz Varianten
    stellplatz: "parkplatz",
    garage: "parkplatz",

    // Hunde Varianten
    "hunde erlaubt": "hund erlaubt",
    "haustiere erlaubt": "hund erlaubt",

    // Unterkunftstyp Varianten
    ferienwohnung: "ferienwohnung",
    apartment: "ferienwohnung",
    wohnung: "ferienwohnung",

    ferienhaus: "ferienhaus",
    haus: "ferienhaus",
  };

  return map[n] ?? n;
}

/**
 * Icon mapping nach normalisiertem Key
 */
export const amenityIconMap = {
  wlan: Wifi,
  sauna: Thermometer,
  kamin: Flame,
  meerblick: Waves,

  waschmaschine: WashingMachine,
  trockner: Shirt,

  "eingezäuntes grundstück": Fence,
  sicher: ShieldCheck,

  balkon: Sun,
  terrasse: Sun,
  garten: Trees,

  parkplatz: Car,
  ladestation: PlugZap,

  küche: ChefHat,
  spülmaschine: Utensils,

  tv: Tv,

  klimaanlage: Snowflake,
  heizung: Thermometer,

  "hund erlaubt": PawPrint,

  // ✅ Unterkunftstyp
  ferienwohnung: Building2,
  ferienhaus: Home,
};

/**
 * Gibt ein Icon (Lucide Component) zurück
 */
export function getAmenityIcon(name) {
  const key = normalizeAmenityName(name);
  return amenityIconMap[key] ?? HelpCircle;
}
