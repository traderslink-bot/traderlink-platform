export type IndependentCoachingTradeIdentity = Readonly<{
  roundTripId: string;
  logicalTradeId?: string;
  memberIds: readonly string[];
  reviewSelectionAliases?: Readonly<{
    matched: readonly string[];
    blocked: readonly string[];
  }>;
}>;

/** Aliases are supplied only by the authorized server-side saved-selection read. */
export function matchesIndependentCoachingTrade(
  trade: IndependentCoachingTradeIdentity,
  id: string,
): boolean {
  const aliases = trade.reviewSelectionAliases;
  if (aliases?.blocked.includes(id)) return false;
  return Boolean(aliases?.matched.includes(id)) ||
    trade.roundTripId === id ||
    (trade.logicalTradeId === id && !id.startsWith('round-trip:')) ||
    trade.memberIds.includes(id);
}
