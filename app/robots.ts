import type { MetadataRoute } from "next";

import { TRADERSLINK_ORIGIN } from "@/src/lib/academy/academy-seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/debug/", "/*?auth="],
    },
    sitemap: new URL("/sitemap.xml", TRADERSLINK_ORIGIN).toString(),
  };
}
