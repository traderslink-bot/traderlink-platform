/** Optional agreement-snapshot policy. Its absence preserves the legacy cap. */
export type CoachingTradeReviewSelectionPolicy = Readonly<{
  version: 1;
  mode: 'require_quantity_when_available';
  planItemIds: readonly string[];
}>;

/** Call only while preparing a NEW proposal, never when accepting an old one. */
export function newTradeReviewSelectionPolicy(
  items: readonly Readonly<{planItemId: string; itemType: string}>[],
): CoachingTradeReviewSelectionPolicy | undefined {
  const planItemIds = items.filter(item => item.itemType === 'trade_review').map(item => item.planItemId);
  return planItemIds.length ? {version: 1, mode: 'require_quantity_when_available', planItemIds} : undefined;
}

export function requiresTradeReviewQuantity(
  policy: CoachingTradeReviewSelectionPolicy | undefined,
  item: Readonly<{planItemId: string; itemType: string}>,
): boolean {
  if (policy === undefined || item.itemType !== 'trade_review') return false;
  if (!policy || policy.version !== 1 || policy.mode !== 'require_quantity_when_available'
    || !Array.isArray(policy.planItemIds) || policy.planItemIds.some(id => typeof id !== 'string' || !id.trim())) {
    throw new Error('The agreed trade-review requirement is unavailable.');
  }
  return policy.planItemIds.includes(item.planItemId);
}

export function requiredTradeReviewQuantity(quantity: number, eligibleCount: number): number {
  if (!Number.isSafeInteger(quantity) || quantity < 1 || !Number.isSafeInteger(eligibleCount) || eligibleCount < 0) {
    throw new Error('The available trade count could not be verified.');
  }
  return Math.min(quantity, eligibleCount);
}
