import type { LiveScannerRow } from "./contracts";

export const MOMENTUM_COOLING_MS = 30_000;
type TradeEvidence = Pick<LiveScannerRow, "providerAtUtc" | "volume" | "dollarVolume">;
type MomentumHit = NonNullable<LiveScannerRow["momentumHit"]>;
type Retained = { lastActiveAt: number; evidence: TradeEvidence; visible: boolean; hit: MomentumHit };

function hasNewTrade(row: LiveScannerRow, evidence: TradeEvidence): boolean {
  if (row.providerAtUtc < evidence.providerAtUtc) return false;
  return row.providerAtUtc > evidence.providerAtUtc
    || (row.volume !== null && evidence.volume !== null && row.volume > evidence.volume)
    || (row.dollarVolume !== null && evidence.dollarVolume !== null && row.dollarVolume > evidence.dollarVolume);
}

/** One activation per qualifying trade observation, even across missing scan inputs. */
export class MomentumRetentionBook {
  private context: string | null = null;
  private retained = new Map<string, Retained>();

  select(context: string, rows: readonly LiveScannerRow[], now: number, confirmed: (row: LiveScannerRow) => boolean = () => false): readonly LiveScannerRow[] {
    if (this.context !== context) {
      this.clear();
      this.context = context;
    }
    const present = new Set(rows.map(row => row.symbol));
    for (const [symbol, retained] of this.retained) {
      if (!present.has(symbol)) retained.visible = false;
    }
    const selected: LiveScannerRow[] = [];
    for (const row of rows) {
      const retained = this.retained.get(row.symbol);
      if (row.momentumSignals?.length && (!retained || hasNewTrade(row, retained.evidence))) {
        const { providerAtUtc, volume, dollarVolume } = row;
        const signals = row.momentumSignals;
        const tier = confirmed(row) ? "confirmed" : "early";
        const newHit = !retained || now - retained.lastActiveAt >= MOMENTUM_COOLING_MS;
        const hit: MomentumHit = newHit
          ? { number: (retained?.hit.number ?? 0) + 1, startedAtUtc: new Date(now).toISOString(), tier, signals }
          : tier === "confirmed" && retained.hit.tier === "early"
            ? { ...retained.hit, tier, signals }
            : retained.hit;
        this.retained.set(row.symbol, {
          lastActiveAt: now, evidence: { providerAtUtc, volume, dollarVolume }, visible: true, hit,
        });
        selected.push({ ...row, momentumHit: hit, momentumState: "active", momentumLastActiveAtUtc: new Date(now).toISOString() });
        continue;
      }
      if (!retained?.visible) continue;
      const coolingUntil = retained.lastActiveAt + MOMENTUM_COOLING_MS;
      if (now >= coolingUntil) {
        retained.visible = false;
        continue;
      }
      selected.push({
        ...row, momentumHit: retained.hit, momentumSignals: [], momentumState: "cooling",
        momentumLastActiveAtUtc: new Date(retained.lastActiveAt).toISOString(),
        momentumCoolingUntilUtc: new Date(coolingUntil).toISOString(),
      });
    }
    return Object.freeze(selected);
  }

  clear(): void {
    this.context = null;
    this.retained.clear();
  }
}
