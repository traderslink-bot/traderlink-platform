// Public chrome is opt-in by content route, not merely by domain: installed
// apps and dashboard pages can also run through the public-domain proxy.
const publicPageRoots = [
  "/academy", "/help", "/news", "/small-cap-stocks",
] as const;
const publicPages = new Set([
  "/", "/trading-journal", "/trade-analyzer", "/trade-analytics",
  "/privacy", "/terms", "/beta", "/filtered-news-momentum-scanner-access",
  "/access-required", "/watchlist/how-it-works",
  "/smokeys-12-week-market-structure-plan",
]);

export function isPublicWebsiteRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  const path = pathname.replace(/\/+$/, "") || "/";
  return publicPages.has(path) || publicPageRoots.some(
    (root) => path === root || path.startsWith(`${root}/`),
  );
}
