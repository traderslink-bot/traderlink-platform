import type { NextConfig } from "next";
import { randomUUID } from "node:crypto";
import withSerwistInit from "@serwist/next";
import type { Compilation } from "webpack";

import { legacyIntelligenceRedirects } from "./src/modules/platform/contracts/legacy-intelligence-route-disposition";

const publicShellRevision =
  process.env.VERCEL_GIT_COMMIT_SHA ??
  process.env.RAILWAY_GIT_COMMIT_SHA ??
  randomUUID();

const withSerwist = withSerwistInit({
  additionalPrecacheEntries: [
    { url: "/offline", revision: publicShellRevision },
    { url: "/manifest.webmanifest", revision: publicShellRevision },
    { url: "/logo-horizontal-main.png", revision: publicShellRevision },
    { url: "/icons/traderlink-192.png", revision: publicShellRevision },
    { url: "/icons/traderlink-512.png", revision: publicShellRevision },
    { url: "/icons/traderlink-maskable-512.png", revision: publicShellRevision },
    { url: "/pwa-trade-sync.js", revision: publicShellRevision },
  ],
  cacheOnNavigation: false,
  chunks: [
    "webpack",
    "main-app",
    "app/layout",
    "app/offline/page",
  ],
  disable: process.env.NODE_ENV !== "production",
  globPublicPatterns: [],
  manifestTransforms: [
    async (entries, transformParameter) => {
      const compilation = transformParameter as Compilation | undefined;
      const polyfillAssets = compilation?.getAssets().filter((asset) =>
        /^static\/chunks\/polyfills-[a-z0-9]+\.js$/u.test(asset.name)
      ) ?? [];
      const manifest = [...entries];
      const knownUrls = new Set(manifest.map((entry) => entry.url));
      for (const asset of polyfillAssets) {
        const url = `/_next/${asset.name}`;
        if (knownUrls.has(url)) continue;
        manifest.push({
          revision: null,
          size: asset.source.size(),
          url,
        });
        knownUrls.add(url);
      }
      return {
        manifest,
        warnings: polyfillAssets.length > 0
          ? []
          : ["The production PWA polyfill asset was not found."],
      };
    },
  ],
  register: false,
  reloadOnOnline: false,
  swDest: "public/sw.js",
  swSrc: "app/sw.ts",
});

const privateNoStoreHeaders: { key: string; value: string }[] = [
  {
    key: "Cache-Control",
    value: "private, no-store, max-age=0",
  },
  { key: "CDN-Cache-Control", value: "no-store" },
  { key: "Vercel-CDN-Cache-Control", value: "no-store" },
  { key: "Pragma", value: "no-cache" },
  { key: "Expires", value: "0" },
  { key: "Vary", value: "Cookie" },
];

const privateTraderLinkRoutes = [
  "/intelligence/:path*",
  "/workspace/:path*",
  "/calendar/:path*",
  "/quick-trade-entry",
  "/trade-tracker/:path*",
  "/trades/:path*",
  "/analytics/:path*",
  "/reflection-loop",
  "/rules/:path*",
  "/charts/:path*",
  "/imports/:path*",
  "/manual-entry/:path*",
  "/data-decisions/:path*",
  "/account/:path*",
  "/admin/journal/:path*",
  "/api/admin/journal/:path*",
  "/api/platform/journal/:path*",
  "/api/platform/pwa/:path*",
] as const;

const legacyTopLevelReplacementRedirects = [
  {
    source: "/platform-readiness",
    destination: "/workspace/readiness",
    permanent: false,
  },
  {
    source: "/workspace/admin",
    destination: "/workspace/readiness?capability=legacy-admin",
    permanent: false,
  },
  {
    source: "/coach/:path*",
    destination: "/reflection-loop",
    permanent: false,
  },
  {
    source: "/review",
    destination: "/reflection-loop",
    permanent: false,
  },
  {
    source: "/progress",
    destination: "/reflection-loop",
    permanent: false,
  },
  {
    source: "/upload-csv",
    destination: "/imports",
    permanent: false,
  },
  {
    source: "/trader-intelligence",
    destination: "/workspace",
    permanent: false,
  },
  {
    source: "/import-dry-run",
    destination: "/imports?mode=preview",
    permanent: false,
  },
  {
    source: "/import-health",
    destination: "/imports",
    permanent: false,
  },
  {
    source: "/import-trials",
    destination: "/workspace/readiness?capability=import-trials",
    permanent: false,
  },
  {
    source: "/repair-wizard",
    destination: "/data-decisions",
    permanent: false,
  },
  {
    source: "/review-cockpit",
    destination: "/reflection-loop?view=backlog",
    permanent: false,
  },
  {
    source: "/session-recap",
    destination: "/reflection-loop?period=daily",
    permanent: false,
  },
  {
    source: "/compare-trades",
    destination: "/analytics/lab?view=trade-comparison",
    permanent: false,
  },
  {
    source: "/calibration",
    destination: "/analytics/lab?view=calibration",
    permanent: false,
  },
  {
    source: "/onboarding",
    destination: "/imports",
    permanent: false,
  },
  {
    source: "/first-run",
    destination: "/imports",
    permanent: false,
  },
  {
    source: "/debug/:path*",
    destination: "/workspace/readiness?capability=legacy-debug",
    permanent: false,
  },
  {
    source: "/admin/broker-mappings",
    destination: "/imports?mode=mapping",
    permanent: false,
  },
  {
    source: "/coaching",
    destination: "/reflection-loop",
    permanent: false,
  },
] as const;

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["levels-system-v2", "better-sqlite3"],
  async headers() {
    return [
      ...privateTraderLinkRoutes.map((source) => ({
        source,
        headers: privateNoStoreHeaders,
      })),
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "www.traderslink.pro",
          },
        ],
        destination: "https://traderslink.pro/:path*",
        permanent: true,
      },
      ...legacyIntelligenceRedirects(),
      ...legacyTopLevelReplacementRedirects,
      {
        source: "/academy/candlestick-deep-dive-lessons",
        destination: "/academy/candlestick-patterns",
        permanent: true,
      },
      {
        source: "/academy/candlestick-patterns/hammer",
        destination: "/academy/candle-behavior/hammer",
        permanent: true,
      },
      {
        source: "/academy/candlestick-patterns/bottoming-tail",
        destination: "/academy/candle-behavior/bottoming-tail-candle",
        permanent: true,
      },
      {
        source: "/academy/candlestick-patterns/topping-tail",
        destination: "/academy/candle-behavior/topping-tail-candle",
        permanent: true,
      },
      {
        source: "/academy/candlestick-patterns/doji",
        destination: "/academy/candle-behavior/standard-doji",
        permanent: true,
      },
      {
        source: "/academy/candlestick-patterns/spinning-top",
        destination: "/academy/candle-behavior/spinning-top",
        permanent: true,
      },
      {
        source: "/academy/candlestick-patterns/inside-bar",
        destination: "/academy/candle-behavior/inside-bar",
        permanent: true,
      },
      {
        source: "/academy/candlestick-patterns/outside-bar",
        destination: "/academy/candle-behavior/outside-bar",
        permanent: true,
      },
      {
        source: "/academy/candlestick-patterns/candle-volume-confirmation",
        destination: "/academy/candle-behavior/high-volume-green-candle",
        permanent: true,
      },
      {
        source: "/academy/candlestick-patterns/red-to-green-move",
        destination: "/academy/candle-behavior/red-to-green-move",
        permanent: true,
      },
      {
        source: "/academy/candlestick-patterns/green-to-red-move",
        destination: "/academy/candle-behavior/green-to-red-move",
        permanent: true,
      },
      {
        source: "/academy/candlestick-patterns/long-wick-candle",
        destination: "/academy/candlestick-patterns",
        permanent: true,
      },
      {
        source: "/academy/candlestick-patterns/pin-bar",
        destination: "/academy/candlestick-patterns",
        permanent: true,
      },
      {
        source: "/academy/candlestick-patterns/engulfing-candle",
        destination: "/academy/candlestick-patterns",
        permanent: true,
      },
    ];
  },
};

export default withSerwist(nextConfig);
