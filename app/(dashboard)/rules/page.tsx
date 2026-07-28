import type { Metadata } from "next";

import { requireTraderIntelligenceOwnerPageAccess } from "@/src/lib/trader-intelligence-v3/auth";
import { readTradingRulesDashboard } from "@/src/lib/trader-intelligence-rules";

import { RulesClient } from "./rules-client";

const MODULE_PATH = "app/(dashboard)/rules/page.tsx";

export const metadata: Metadata = {
  title: "Trading Rules | Trader Intelligence",
  description: "Create and manage deterministic, versioned trading rules.",
};

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default async function TradingRulesPage() {
  const owner =
    await requireTraderIntelligenceOwnerPageAccess(MODULE_PATH);
  return <RulesClient initialView={readTradingRulesDashboard(owner)} />;
}

