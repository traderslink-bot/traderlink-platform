import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { hasScannerEarlyAccess } from "@/src/modules/scanner/server/scanner-early-access";
import { ScannerClient } from "./scanner-client";

export const metadata: Metadata = {
  description: "Ready-to-use TradersLink stock screens with live market results.",
  title: "Scanner | TraderLink Platform",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ScannerPage() {
  const identity = await requireTraderLinkPlatformPageIdentity();
  if (!hasScannerEarlyAccess(identity)) notFound();

  return <ScannerClient />;
}
