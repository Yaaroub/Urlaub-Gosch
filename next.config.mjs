import { BLOB_IMAGE_HOST, IMAGE_HOSTS } from "./src/lib/image-hosts.js";

const isProd = process.env.NODE_ENV === "production";

/**
 * Content-Security-Policy.
 * Scripts, styles, images, connections and frames are limited to this site and
 * the few services it really uses. Next.js needs inline scripts/styles, so
 * 'unsafe-inline' stays for those two; everything else is locked down.
 */
const csp = [
  "default-src 'self'",
  // Next.js inline bootstrap scripts; eval only for the dev server (hot reload).
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  // Own images, object photos (Blob storage), webcams (after consent), Mapbox sprites.
  `img-src 'self' data: blob: https://${BLOB_IMAGE_HOST} https://www.baltic-sea-webcam.de https://www.ostsee-blick.com https://*.mapbox.com`,
  "font-src 'self' data:",
  // Mapbox (after consent) and Vercel Blob uploads from the admin area.
  `connect-src 'self' https://api.mapbox.com https://events.mapbox.com https://*.tiles.mapbox.com https://vercel.com/api/blob/ https://blob.vercel-storage.com https://${BLOB_IMAGE_HOST}${isProd ? "" : " ws: http://localhost:*"}`,
  // Mapbox GL renders in a web worker created from a blob: URL.
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
  // Google Maps embed (after consent).
  "frame-src https://www.google.com",
  "media-src 'self'",
  "manifest-src 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allows a verification build next to a running `next dev` (both would share .next otherwise).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
          { key: "Content-Security-Policy", value: csp },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          ...(isProd ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }] : []),
        ],
      },
      {
        // The technical *.vercel.app address must never show up in search engines
        // (duplicate of the main domain, and it should not be discoverable).
        source: "/:path*",
        has: [{ type: "host", value: ".*\\.vercel\\.app" }],
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      },
      {
        // Admin area and all APIs: never index, never cache in shared caches.
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      {
        source: "/api/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },

  images: {
    deviceSizes: [360, 640, 768, 1024, 1280, 1536, 1920, 2560, 3840],
    imageSizes: [96, 160, 256, 384, 640],
    // Only our own image sources; foreign hosts could otherwise use the image optimizer at our cost.
    remotePatterns: IMAGE_HOSTS.map((hostname) => ({ protocol: "https", hostname })),
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

export default nextConfig;
