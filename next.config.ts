import type { NextConfig } from "next";

import { legacyIntelligenceRedirects } from "./src/modules/platform/contracts/legacy-intelligence-route-disposition";

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

const privateTraderIntelligenceRoutes = [
  "/intelligence/:path*",
  "/workspace/:path*",
  "/trades/:path*",
  "/analytics/:path*",
  "/reflection-loop",
  "/rules",
  "/imports/:path*",
  "/manual-entry",
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
    return privateTraderIntelligenceRoutes.map((source) => ({
      source,
      headers: privateNoStoreHeaders,
    }));
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

export default nextConfig;
