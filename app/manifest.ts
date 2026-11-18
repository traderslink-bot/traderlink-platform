import type { MetadataRoute } from "next";

import { PLATFORM_PWA_START_PATH } from "@/src/modules/platform/contracts/platform-home-page";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/workspace",
    name: "TraderLink Platform",
    short_name: "TradersLink",
    description:
      "Track trades, review your Journal, and understand your trading performance.",
    start_url: PLATFORM_PWA_START_PATH,
    scope: "/",
    display: "standalone",
    background_color: "#f5f7fb",
    theme_color: "#011e56",
    lang: "en-CA",
    categories: ["finance", "productivity"],
    related_applications: [
      {
        id: "/workspace",
        platform: "webapp",
        url: "/manifest.webmanifest",
      },
    ],
    icons: [
      {
        src: "/icons/traderlink-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/traderlink-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/traderlink-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
