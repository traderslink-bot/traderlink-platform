import type { BreakoutRow, LiveScannerRow, NormalizedSnapshot, ScannerSession } from "./contracts";

export class BreakoutBook {
  private date: string | undefined;
  private references = new Map<string, number>();
  private rows = new Map<string, BreakoutRow>();
  private observedAt = new Map<string, number>();

  begin(date: string, eligible: ReadonlyMap<string, unknown>) {
    if (this.date !== date) {
      this.clear();
      this.date = date;
    }
    for (const symbol of this.observedAt.keys()) {
      if (!eligible.has(symbol)) {
        this.references.delete(symbol);
        this.rows.delete(symbol);
        this.observedAt.delete(symbol);
      }
    }
  }

  observe(snapshot: NormalizedSnapshot, row: LiveScannerRow) {
    const previous = this.rows.get(row.symbol);
    if (snapshot.session === "after_hours" && !previous) return;
    const at = snapshot.priceTimeBasis === "session_observation" && snapshot.provider !== "alpaca"
      ? snapshot.receivedAt : snapshot.providerAt;
    if (!Number.isFinite(row.price) || row.price <= 0 || at <= (this.observedAt.get(row.symbol) ?? 0)) return;
    this.observedAt.set(row.symbol, at);
    const high = snapshot.premarketHigh;
    if (!previous && high != null && Number.isFinite(high) && high > 0) {
      this.references.set(row.symbol, snapshot.session === "premarket"
        ? Math.max(high, this.references.get(row.symbol) ?? 0) : high);
    }
    const level = previous?.breakoutLevel ?? this.references.get(row.symbol);
    if (level === undefined || (!previous && (snapshot.session !== "regular" || row.price <= level)) || snapshot.session === "premarket") return;
    this.rows.set(row.symbol, {
      ...row,
      breakoutLevel: level,
      breakoutAtUtc: previous?.breakoutAtUtc ?? new Date(at).toISOString(),
      breakoutState: row.price > level ? "above" : row.price < level ? "below" : "at",
    });
  }

  read(session: ScannerSession): readonly BreakoutRow[] {
    return session === "premarket" ? [] : [...this.rows.values()]
      .sort((a,b)=>b.breakoutAtUtc.localeCompare(a.breakoutAtUtc) || a.symbol.localeCompare(b.symbol))
      .slice(0, 30);
  }

  clear() {
    this.date = undefined;
    this.references.clear();
    this.rows.clear();
    this.observedAt.clear();
  }
}
