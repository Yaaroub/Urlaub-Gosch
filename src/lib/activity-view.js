import { getActivityGroup, isValidCoordinate } from "@/lib/activity-groups";

/**
 * View helpers for the activities area.
 * The full activity records (long texts, ~250 KB) stay on the server;
 * client components only receive these slim objects (~25 KB for all 111).
 */

export const WEATHER_LABELS = {
  indoor: "Drinnen",
  outdoor: "Draußen",
  "all-weather": "Bei jedem Wetter",
};

/** "Bahnhofstraße 5, 23714 Bad Malente-Gremsmühlen" -> "Bad Malente-Gremsmühlen" */
export function getActivityTown(address = "") {
  const match = String(address).match(/\b\d{5}\s+([^,]+)$/);
  return match ? match[1].trim() : "";
}

export function isRainFriendly(activity = {}) {
  return activity.weather === "indoor" || activity.weather === "all-weather";
}

export function toActivityCard(activity) {
  return {
    id: activity.id,
    slug: activity.slug,
    title: activity.title,
    group: getActivityGroup(activity),
    category: activity.category || "",
    town: getActivityTown(activity.address),
    address: activity.address || "",
    shortDescription: activity.shortDescription || "",
    weather: activity.weather || "",
    closed: Boolean(activity.temporarilyClosed),
    lat: Number(activity.lat),
    lng: Number(activity.lng),
  };
}

export function toActivityCards(list = []) {
  return list
    .filter((activity) => activity?.slug && isValidCoordinate(activity.lat, activity.lng))
    .map(toActivityCard);
}

export function countByGroup(cards = []) {
  const counts = { Alle: cards.length };
  for (const card of cards) counts[card.group] = (counts[card.group] || 0) + 1;
  return counts;
}
