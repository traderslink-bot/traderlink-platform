/** Parse dollars without floating-point multiplication or silent rounding. */
export function parseWatchlistBudgetUsd(value: string): number | null {
  const amount = value.trim();
  if (!amount) return null;
  if (!/^\d+(?:\.\d{1,6})?$/.test(amount)) throw new Error("Enter a non-negative USD amount with at most six decimal places.");
  const [whole, fraction = ""] = amount.split(".");
  const units = BigInt(whole) * BigInt(1_000_000) + BigInt(fraction.padEnd(6, "0"));
  if (units > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("The USD budget is too large to store exactly.");
  return Number(units);
}

export function watchlistBudgetUsdInput(units: number | null): string {
  if (units === null) return "";
  if (!Number.isSafeInteger(units) || units < 0) throw new Error("Invalid Watchlist budget.");
  const exact = BigInt(units);
  const decimals = String(exact % BigInt(1_000_000)).padStart(6, "0").replace(/0+$/, "").padEnd(2, "0");
  return `${exact / BigInt(1_000_000)}.${decimals}`;
}

export function formatWatchlistBudget(units: number | null): string {
  return units === null ? "Unlimited" : `USD ${watchlistBudgetUsdInput(units)}`;
}
