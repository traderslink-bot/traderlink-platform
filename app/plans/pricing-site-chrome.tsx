"use client";

import type { ReactNode } from "react";
import { PublicWebsiteChrome, usePublicWebsiteChrome } from "@/src/components/site/public-website-chrome";

export function PricingSiteChrome({ children }: { children: ReactNode }) {
  const hasPublicChrome = usePublicWebsiteChrome();
  return hasPublicChrome ? children : <PublicWebsiteChrome>{children}</PublicWebsiteChrome>;
}
