/**
 * Lightweight data-quality check for src/lib/activities.js.
 * Run after converting/importing the activities array into this script or adapt the import path.
 * It flags generic addresses, non-verified coordinate qualities and duplicate coordinates.
 */
import { activities } from "../src/lib/activities.js";

const genericAddress = (address = "") => !/\d/.test(String(address));
const coordKey = (activity) => `${Number(activity.lat).toFixed(5)},${Number(activity.lng).toFixed(5)}`;

const duplicateMap = new Map();
for (const activity of activities) {
  const key = coordKey(activity);
  const list = duplicateMap.get(key) || [];
  list.push(activity);
  duplicateMap.set(key, list);
}

const issues = activities.map((activity) => {
  const duplicates = duplicateMap.get(coordKey(activity)) || [];
  return {
    id: activity.id,
    title: activity.title,
    address: activity.address,
    coordinateQuality: activity.coordinateQuality,
    genericAddress: genericAddress(activity.address),
    duplicateCoordinateCount: duplicates.length,
    duplicateWith: duplicates
      .filter((item) => item.id !== activity.id)
      .map((item) => item.title),
  };
});

console.table(
  issues.filter(
    (item) =>
      item.genericAddress ||
      item.coordinateQuality !== "marker" ||
      item.duplicateCoordinateCount > 1
  )
);
