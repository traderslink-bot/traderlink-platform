import type { CompanyReadings } from "./audited-filters";

type CompanyBatch = { revision: number; records: ReadonlyMap<string, CompanyReadings> };
export type CompanyBatchReader = (
  symbols: readonly string[],
  at: number,
  pinned?: number,
) => Promise<CompanyBatch>;
const refreshMs = 5_000;
const batchSize = 64;

// One atomic view for all active custom definitions, result pages and alert readers.
export class CompanyStudyCache {
  private snapshot?: {
    at: number;
    checkedAt: number;
    revision: number;
    records: Map<string, CompanyReadings>;
  };
  private running = false;
  private generation = 0;
  private nextRead = 0;
  constructor(
    private readonly load: CompanyBatchReader,
    private readonly notify: () => void,
  ) {}
  value(symbol: string, at: number) {
    const view = this.snapshot;
    if (
      view &&
      view.at <= at &&
      at - view.checkedAt <= 30_000 &&
      Math.floor(view.at / 86_400_000) === Math.floor(at / 86_400_000)
    )
      return view.records.get(symbol);
  }
  reset() {
    this.generation++;
    this.nextRead = 0;
    this.snapshot = undefined;
  }
  async observe(symbols: Iterable<string>, at: number) {
    if (this.running || at < this.nextRead) return;
    const wanted = [...new Set(symbols)];
    if (!wanted.length) return;
    this.running = true;
    const generation = this.generation;
    this.nextRead = at + refreshMs;
    try {
      const prior = this.snapshot;
      // Probe one listing for the current revision before transferring a whole roster again.
      const firstSize = prior ? 1 : batchSize;
      const first = await this.load(wanted.slice(0, firstSize), at);
      if (generation !== this.generation) return;
      if (
        prior &&
        prior.revision === first.revision &&
        prior.records.size === wanted.length &&
        wanted.every((s) => prior.records.has(s)) &&
        Math.floor(prior.at / 86_400_000) === Math.floor(at / 86_400_000)
      ) {
        prior.checkedAt = at;
        return;
      }
      const records = new Map(first.records);
      for (let i = firstSize; i < wanted.length; i += batchSize) {
        const next = await this.load(wanted.slice(i, i + batchSize), at, first.revision);
        if (generation !== this.generation) return;
        for (const [symbol, reading] of next.records) records.set(symbol, reading);
      }
      this.snapshot = { at, checkedAt: at, revision: first.revision, records };
      this.notify();
    } catch {
      if (generation === this.generation && this.snapshot) {
        this.snapshot = undefined;
        this.notify();
      }
    } finally {
      this.running = false;
    }
  }
}
