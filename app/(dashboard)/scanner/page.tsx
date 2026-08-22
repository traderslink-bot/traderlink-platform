import type { Metadata } from "next";

import {
  requireTraderLinkPlatformPageScope,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { MoomooConnectionRepository } from "@/src/modules/platform/server/broker-connections/moomoo-connection-repository";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { ScannerClient } from "./scanner-client";

export const metadata: Metadata = {
  description: "Ready-to-use TradersLink stock screens with live market results.",
  title: "Scanner | TraderLink Platform",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ScannerPage() {
  const scope = await requireTraderLinkPlatformPageScope();
  const moomooConnected = withReadonlyPlatformDatabase({}, (database) => {
    const connection = new MoomooConnectionRepository(database).find(scope);
    return connection?.state === "active" && connection.authorizedScopes.includes("quote:read");
  });

  return <ScannerClient moomooConnected={moomooConnected} />;
}
