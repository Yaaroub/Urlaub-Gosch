// src/lib/amenity-icons.js
import {
    Wifi,
    Flame,
    Waves,
    Shirt,
    ShieldCheck,
    Fence,
    Building2,
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
   * - URL Query (amenity=...)
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
      "wi-fi": "wlan",
      wifi: "wlan",
      internet: "wlan",
  
      // Duplikate zusammenführen
      eingezäunt: "eingezäuntes grundstück",
      "eingezäunte": "eingezäuntes grundstück",
      "eingezäuntes": "eingezäuntes grundstück",
      "eingezäuntes grundstück": "eingezäuntes grundstück",
  
      seeblick: "meerblick",
      ostseeblick: "meerblick",
      nordseeblick: "meerblick",
  
      fernseher: "tv",
      "smart tv": "tv",
  
      geschirrspüler: "spülmaschine",
      spuelmaschine: "spülmaschine",
  
      stellplatz: "parkplatz",
      garage: "parkplatz",
  
      "hunde erlaubt": "hund erlaubt",
      "haustiere erlaubt": "hund erlaubt",
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
  
    "eingezäuntes grundstück": Fence, // Alternative: ShieldCheck
    sicher: ShieldCheck,
  
    balkon: Building2,
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
  };
  
  /**
   * Gibt ein Icon (Lucide Component) zurück
   */
  export function getAmenityIcon(name) {
    const key = normalizeAmenityName(name);
    return amenityIconMap[key] ?? HelpCircle;
  }
  