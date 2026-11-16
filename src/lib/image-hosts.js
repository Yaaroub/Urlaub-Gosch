// Single source of truth for where property images may come from.
// Used by next.config.mjs (image optimizer), the admin image API (validation),
// the Markdown renderer and the Content-Security-Policy.

export const BLOB_IMAGE_HOST = "twsi1p1lhtwlrow0.public.blob.vercel-storage.com";

export const IMAGE_HOSTS = [BLOB_IMAGE_HOST, "urlaub-gosch.de", "www.urlaub-gosch.de"];

/**
 * true for https URLs on an allowed host and for local paths ("/hero/x.jpg").
 * Everything else (other hosts, http:, javascript:, data:, "//host") is rejected.
 */
export function isAllowedImageUrl(value) {
  if (typeof value !== "string") return false;
  const url = value.trim();
  if (!url || url.length > 2048 || /[\u0000-\u001f\\]/.test(url)) return false;
  if (url.startsWith("/")) return !url.startsWith("//");
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password && !parsed.port && IMAGE_HOSTS.includes(parsed.hostname);
  } catch {
    return false;
  }
}
