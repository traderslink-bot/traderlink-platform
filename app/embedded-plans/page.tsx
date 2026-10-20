import type { Metadata } from "next";
import { FeaturePlansSection } from "../plans/feature-plans-section";
import { EmbeddedPlansFrame } from "./embedded-plans-frame";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Plans | TradersLink",
  robots: { index: false, follow: false },
};

export default function EmbeddedPlansPage() {
  return <EmbeddedPlansFrame><FeaturePlansSection /></EmbeddedPlansFrame>;
}
