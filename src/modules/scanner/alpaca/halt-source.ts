/** Explicit source selection preserves the old detector for an intentional rollback. */
export function marketHaltSource(environment: NodeJS.ProcessEnv = process.env): "alpaca" | "official" {
  const selected = environment.TRADERLINK_MARKET_HALT_SOURCE?.trim();
  if (!selected || selected === "official") return "official";
  if (selected === "alpaca") return "alpaca";
  throw Error("invalid_market_halt_source");
}
