import type { LiveScannerRow } from "./contracts";

export const GAINER_LIQUIDITY_GRACE_MS = 15 * 60_000;
const TEMPORARY_LIQUIDITY_FAILURES = new Set([
  "spread_above_maximum", "volume_below_minimum", "dollar_volume_below_minimum",
]);
type Member = { row: LiveScannerRow; failingSince: number | null };

/** Missing data preserves established membership; measured liquidity failures have a grace period. */
export class GainerRetentionBook {
  private context: string | null = null;
  private members = new Map<string, Member>();

  select(context: string, rows: readonly LiveScannerRow[], failures: (row: LiveScannerRow) => readonly string[], now: number,
    allowedSymbols?: ReadonlySet<string>): readonly LiveScannerRow[] {
    if (this.context !== context) { this.context = context; this.members.clear(); }
    if (allowedSymbols) for (const symbol of this.members.keys()) if (!allowedSymbols.has(symbol)) this.members.delete(symbol);
    const selected: LiveScannerRow[] = [];
    const seen = new Set<string>();
    for (const observed of rows) {
      if (allowedSymbols && !allowedSymbols.has(observed.symbol)) continue;
      seen.add(observed.symbol);
      const member = this.members.get(observed.symbol);
      let row = observed;
      // A same-session known comparison remains usable through a transport/cache outage.
      if (member) {
        const comparison = observed.comparisonPrice ?? member.row.comparisonPrice;
        row = { ...observed,
          volume: observed.volume ?? member.row.volume,
          dollarVolume: observed.dollarVolume ?? member.row.dollarVolume,
          comparisonPrice: comparison,
          sessionGain: observed.sessionGain ?? (comparison && comparison > 0 ? (observed.price / comparison - 1) * 100 : member.row.sessionGain),
        };
      }
      const reasons = failures(row);
      if (row.sessionGain !== null && reasons.length === 0) {
        this.members.set(row.symbol, { row, failingSince: null }); selected.push(row); continue;
      }
      if (!member || row.sessionGain === null || reasons.some(reason => !TEMPORARY_LIQUIDITY_FAILURES.has(reason))) {
        this.members.delete(row.symbol); continue;
      }
      member.failingSince ??= now;
      if (now - member.failingSince >= GAINER_LIQUIDITY_GRACE_MS) { this.members.delete(row.symbol); continue; }
      member.row = row; selected.push(row);
    }
    // No observation is a data outage, not proof that an established leader stopped gaining.
    for (const [symbol, member] of this.members) if (!seen.has(symbol)) selected.push(member.row);
    return selected;
  }

  clear(): void { this.context = null; this.members.clear(); }
}
