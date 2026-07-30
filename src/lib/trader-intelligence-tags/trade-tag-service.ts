import type { AnalyticalRow } from "@/src/lib/trader-intelligence-v3/analytics/dataset/analytical-row";
import type { TraderIntelligenceOwnerContext } from "@/src/lib/trader-intelligence-v3/domain";

import {
  SqliteTradeTagRepository,
  type TradeTagDefinition,
  type TradeTagOwnerScope,
} from "./trade-tag-repository";

export function tradeTagOwnerScope(
  owner: TraderIntelligenceOwnerContext,
): TradeTagOwnerScope {
  return Object.freeze({
    userId: owner.identity.ownerId,
    workspaceId: "primary-workspace",
  });
}

export function readTradeTagCatalog(
  owner: TraderIntelligenceOwnerContext,
): readonly TradeTagDefinition[] {
  const repository = new SqliteTradeTagRepository();
  try {
    return repository.list(tradeTagOwnerScope(owner));
  } finally {
    repository.close();
  }
}
export function readTradeTagsByRoundTripKeys(
  owner: TraderIntelligenceOwnerContext,
  rows: readonly AnalyticalRow[],
): Readonly<Record<string, readonly TradeTagDefinition[]>> {
  const repository = new SqliteTradeTagRepository();
  try {
    return repository.listForTrades(
      tradeTagOwnerScope(owner),
      rows.map((row) => row.semanticRoundTripKey),
    );
  } finally {
    repository.close();
  }
}
