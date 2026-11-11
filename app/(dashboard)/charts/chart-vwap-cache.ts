import type { VwapSeed } from "@/src/modules/scanner/alpaca/chart-vwap-seed";

type SeedEntry = { value: VwapSeed; at: number };
type Readout = { time: number; value: number; precision: number };
type StorageAccess = Pick<Storage, "getItem" | "setItem">;
type Entries = {
  seeds: Map<string, SeedEntry>;
  readouts: Map<string, Readout>;
  dirty: boolean;
  savedAt: number;
};
const prefix = "traderlink.chart-vwap.v1:";
const maxBytes = 192 * 1024;

export class ChartVwapCache {
  private owners = new Map<string, Entries>();

  constructor(private storage: () => StorageAccess | undefined) {}

  private entries(owner: string): Entries {
    const existing = this.owners.get(owner);
    if (existing) return existing;
    const entries: Entries = { seeds: new Map(), readouts: new Map(), dirty: false, savedAt: 0 };
    if (owner) try {
      const raw = this.storage()?.getItem(prefix + owner);
      if (raw && raw.length <= maxBytes) {
        const saved = JSON.parse(raw);
        if (Array.isArray(saved?.seeds)) for (const row of saved.seeds.slice(-48)) {
          if (Array.isArray(row) && typeof row[0] === "string" && row[0].length <= 2048
            && Number.isFinite(row[1]?.at) && row[1]?.value) entries.seeds.set(row[0], row[1]);
        }
        if (Array.isArray(saved?.readouts)) for (const row of saved.readouts.slice(-96)) {
          if (Array.isArray(row) && typeof row[0] === "string" && row[0].length <= 2048
            && Number.isFinite(row[1]?.time) && Number.isFinite(row[1]?.value)
            && Number.isInteger(row[1]?.precision) && row[1].precision >= 0 && row[1].precision <= 16) entries.readouts.set(row[0], row[1]);
        }
      }
    } catch { /* A blocked or stale cache does not prevent chart loading. */ }
    this.owners.set(owner, entries);
    if (this.owners.size > 4) {
      const oldest = this.owners.keys().next().value!;
      this.flush(oldest);
      this.owners.delete(oldest);
    }
    return entries;
  }

  readSeed(owner: string, key: string) { return this.entries(owner).seeds.get(key); }

  writeSeed(owner: string, key: string, value: VwapSeed) {
    const entries = this.entries(owner);
    entries.seeds.delete(key);
    entries.seeds.set(key, { value, at: Date.now() });
    if (entries.seeds.size > 48) entries.seeds.delete(entries.seeds.keys().next().value!);
    entries.dirty = true;
    this.flush(owner);
  }

  readReadout(owner: string, key: string) { return this.entries(owner).readouts.get(key); }

  writeReadout(owner: string, key: string, readout: Readout) {
    const entries = this.entries(owner);
    const previous = entries.readouts.get(key);
    if (previous && (previous.time > readout.time || previous.time === readout.time && previous.value === readout.value && previous.precision === readout.precision)) return;
    entries.readouts.delete(key);
    entries.readouts.set(key, readout);
    if (entries.readouts.size > 96) entries.readouts.delete(entries.readouts.keys().next().value!);
    entries.dirty = true;
    if (Date.now() - entries.savedAt >= 5000) this.flush(owner);
  }

  flush(owner: string) {
    const entries = this.owners.get(owner);
    if (!owner || !entries?.dirty) return;
    entries.dirty = false;
    entries.savedAt = Date.now();
    try {
      let seeds = [...entries.seeds];
      const readouts = [...entries.readouts];
      let raw = JSON.stringify({ seeds, readouts });
      while (raw.length > maxBytes && seeds.length) {
        seeds = seeds.slice(1);
        raw = JSON.stringify({ seeds, readouts });
      }
      if (raw.length <= maxBytes) this.storage()?.setItem(prefix + owner, raw);
    } catch { /* Live values still work when browser storage is unavailable. */ }
  }
}

export const chartVwapCache = new ChartVwapCache(() => typeof window === "undefined" ? undefined : window.localStorage);
