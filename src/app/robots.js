const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/+$/, "");

/** robots.txt: keep admin, the personal favourites list and technical endpoints out of search engines. */
export default function robots() {
  const onVercelHost = /\.vercel\.app$/i.test(process.env.VERCEL_URL || "") && !SITE_URL;
  return {
    rules: onVercelHost
      ? [{ userAgent: "*", disallow: "/" }]
      : [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/favorites"] }],
    ...(SITE_URL ? { host: SITE_URL } : {}),
  };
}
