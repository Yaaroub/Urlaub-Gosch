/** A sibling subdomain can send same-site cookies, so require the application's own origin. */
export function isTrustedRequestOrigin(request) {
  const site = request.headers?.get?.("sec-fetch-site");
  const origin = request.headers?.get?.("origin");
  if (site === "cross-site" || site === "same-site" || origin === "null") return false;
  if (!origin) return true;

  try {
    if (origin === new URL(request.url).origin) return true;
    // Next may use its bind address rather than the browser's hostname for request.url.
    return site === "same-origin" && new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}
