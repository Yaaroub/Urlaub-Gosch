import { lookup } from "node:dns/promises";
import { isIP, BlockList } from "node:net";
import https from "node:https";

export const MAX_CALENDAR_BYTES = 2 * 1024 * 1024;

const blocked = new BlockList();
for (const [address, prefix] of [["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24], ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4]]) blocked.addSubnet(address, prefix, "ipv4");
const globalV6 = new BlockList();
globalV6.addSubnet("2000::", 3, "ipv6");
blocked.addSubnet("2001::", 23, "ipv6");
blocked.addSubnet("2001:db8::", 32, "ipv6");
blocked.addSubnet("2002::", 16, "ipv6");

export function isPublicCalendarAddress(address) {
  const family = isIP(address);
  if (family === 4) return !blocked.check(address, "ipv4");
  return family === 6 && globalV6.check(address, "ipv6") && !blocked.check(address, "ipv6");
}

export function validateCalendarUrl(input) {
  const url = new URL(input);
  if (url.protocol !== "https:" || url.username || url.password || url.port) {
    throw new Error("Nur öffentliche HTTPS-Kalender ohne Zugangsdaten oder Sonderport sind erlaubt.");
  }
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(hostname) && !isPublicCalendarAddress(hostname)) throw new Error("Private Kalenderadressen sind nicht erlaubt.");
  return url;
}

export async function fetchPublicCalendar(input, redirects = 0) {
  if (redirects > 3) throw new Error("Zu viele Kalender-Weiterleitungen.");
  const url = validateCalendarUrl(input);
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  let timeout;
  const addresses = await Promise.race([
    lookup(hostname, { all: true }),
    new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error("Kalender-DNS-Zeitlimit überschritten.")), 5000); }),
  ]).finally(() => clearTimeout(timeout));
  if (!addresses.length || addresses.some(({ address }) => !isPublicCalendarAddress(address))) throw new Error("Private Kalenderadressen sind nicht erlaubt.");
  const pinned = addresses[0];
  const result = await new Promise((resolve, reject) => {
    const request = https.get(url, {
      agent: false,
      autoSelectFamily: false,
      // Pin the validated IP to prevent DNS rebinding between validation and connection.
      lookup: (_host, options, callback) => options.all
        ? callback(null, [pinned]) : callback(null, pinned.address, pinned.family),
      headers: { Accept: "text/calendar", "Accept-Encoding": "identity" },
    }, (response) => {
      if ([301, 302, 303, 307, 308].includes(response.statusCode) && response.headers.location) {
        response.destroy();
        resolve({ redirect: response.headers.location });
        return;
      }
      if (response.statusCode !== 200 || (response.headers["content-encoding"] && response.headers["content-encoding"] !== "identity")) {
        response.destroy(); reject(new Error("Kalender konnte nicht geladen werden.")); return;
      }
      let size = 0;
      const chunks = [];
      response.on("data", (chunk) => {
        size += chunk.length;
        if (size > MAX_CALENDAR_BYTES) { request.destroy(new Error("Kalenderdatei ist zu groß (maximal 2 MB).")); return; }
        chunks.push(chunk);
      });
      response.on("end", () => resolve({ text: Buffer.concat(chunks).toString("utf8") }));
      response.on("error", reject);
    });
    const deadline = setTimeout(() => request.destroy(new Error("Kalender-Zeitlimit überschritten.")), 10000);
    request.on("close", () => clearTimeout(deadline));
    request.on("error", reject);
  });
  return result.redirect
    ? fetchPublicCalendar(new URL(result.redirect, url), redirects + 1)
    : result.text;
}
