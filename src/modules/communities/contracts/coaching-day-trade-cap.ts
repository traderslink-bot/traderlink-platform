/** Advisory UI check only; selection is still authorized and enforced on the server. */
export function coachingDayTradeCapProblem(
  cap: {basis: "per_day" | "per_review"; quantity: number} | null | undefined,
  selectedIds: readonly string[],
  addedIds: readonly string[],
  trades: readonly {roundTripId: string; tradingDate?: string | null}[],
): string | null {
  if (!cap) return null;
  const selected = new Set([...selectedIds, ...addedIds]);
  const dateById = new Map(trades.map(trade => [trade.roundTripId, trade.tradingDate]));
  const addedDates = new Set(addedIds.map(id => dateById.get(id)).filter(Boolean));
  const overCap = cap.basis === "per_review"
    ? selected.size > cap.quantity
    : [...addedDates].some(date => [...selected].filter(id => dateById.get(id) === date).length > cap.quantity);
  return overCap
    ? `This accepted review allows up to ${cap.quantity} individual trade reviews ${cap.basis === "per_review" ? "across the whole review" : "per trading day"}. Remove a selected trade before adding another.`
    : null;
}
