type PriceDraft = {
  kind: "existing" | "new";
  priceDecimal: string;
  originalPriceDecimal?: string | null;
  priceEdited?: boolean;
};

/** Display rounding must never become a new saved execution fact. */
export function submittedWorkspaceTradePrice(row: PriceDraft): string {
  return row.kind === "existing" && !row.priceEdited && row.originalPriceDecimal !== undefined
    ? row.originalPriceDecimal ?? ""
    : row.priceDecimal;
}

/** Keyboard, paste and accessibility input changes all pass through onChange. */
export function updateWorkspaceTradeDraftField<T extends PriceDraft, K extends keyof T>(row: T, key: K, value: T[K]): T {
  return { ...row, [key]: value, ...(key === "priceDecimal" ? { priceEdited: true } : {}) };
}
