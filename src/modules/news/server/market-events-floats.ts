/** Cache-first float parity with Company Details. No provider/config ownership here. */
export type MarketEventsFloatPorts = {
  cached: (symbols: readonly string[]) => Promise<Readonly<Record<string, {shares: number}>>>;
  profile: (symbol: string) => Promise<{ticker?: string; floatingShare?: number} | null>;
};
export async function readMarketEventsFloats(symbols: readonly string[], ports: MarketEventsFloatPorts) {
  if (!symbols.length || symbols.length > 10 || symbols.some(symbol => !/^[A-Z][A-Z0-9.-]{0,15}$/u.test(symbol))) throw new Error("Invalid symbols");
  const requested = [...new Set(symbols)];
  const cached = await ports.cached(requested).catch(() => ({} as Readonly<Record<string, {shares: number}>>));
  const rows = await Promise.all(requested.map(async symbol => {
    const shares = cached[symbol]?.shares;
    if (Number.isSafeInteger(shares) && shares > 0) return [symbol, {shares}] as const;
    const profile = await ports.profile(symbol).catch(() => null);
    // Company Details reports floatingShare in millions, not shares outstanding.
    const millions = profile?.ticker === symbol ? profile.floatingShare : undefined;
    if (typeof millions !== "number" || !Number.isFinite(millions) || millions <= 0) return null;
    const raw = millions * 1_000_000, rounded = Math.round(raw);
    if (!Number.isSafeInteger(rounded) || rounded <= 0 || Math.abs(raw-rounded) > Math.max(1,raw)*Number.EPSILON*4) return null;
    return [symbol, {shares: rounded}] as const;
  }));
  return Object.fromEntries(rows.filter(row => row !== null));
}
