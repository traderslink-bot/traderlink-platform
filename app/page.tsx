import type { Metadata } from "next";
import { redirect } from "next/navigation";

const SOCIAL_PREVIEW_TITLE = "TradersLink | Trading Journal, Analytics & Live Watchlist";
const SOCIAL_PREVIEW_DESCRIPTION =
  "Follow Watchlist ideas with detailed analysis and trade preparation. Journal your trading day, analyze entries and exits, review performance patterns, and track trading rules.";
const SOCIAL_PREVIEW_IMAGE =
  "https://traderslink.pro/landing-assets/full-dashboard-trade-tracker-with-analyzer.png";
const SOCIAL_PREVIEW_IMAGE_ALT =
  "TradersLink Daily Trade Tracker showing trade executions, chart analysis, trading rules, tags, and notes.";
const APP_CANONICAL_URL = "https://app.traderslink.pro/";

export const metadata: Metadata = {
  title: SOCIAL_PREVIEW_TITLE,
  description: SOCIAL_PREVIEW_DESCRIPTION,
  alternates: { canonical: APP_CANONICAL_URL },
  openGraph: {
    type: "website",
    siteName: "TradersLink",
    url: APP_CANONICAL_URL,
    title: SOCIAL_PREVIEW_TITLE,
    description: SOCIAL_PREVIEW_DESCRIPTION,
    images: [
      {
        url: SOCIAL_PREVIEW_IMAGE,
        width: 1868,
        height: 928,
        alt: SOCIAL_PREVIEW_IMAGE_ALT,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SOCIAL_PREVIEW_TITLE,
    description: SOCIAL_PREVIEW_DESCRIPTION,
    images: [SOCIAL_PREVIEW_IMAGE],
  },
};

export const dynamic = "force-dynamic";

export default function PlatformRootPage() {
  redirect("/dashboard-entry");
}
