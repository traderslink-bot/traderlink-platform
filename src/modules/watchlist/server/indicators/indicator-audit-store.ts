import { mkdir, open, readdir, rename, stat, unlink } from "node:fs/promises";
import { isAbsolute, join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { gzip, gunzip } from "node:zlib";
import { promisify } from "node:util";
import type { IndicatorCandle, IndicatorCheckpoint, IndicatorResult, IndicatorTimeframe } from "../../../../lib/live-watchlist/indicators/indicator-engine";
import type { IndicatorRequestAudit } from "../../../../lib/live-watchlist/indicators/indicator-request-coordinator";

const compress = promisify(gzip), decompress = promisify(gunzip);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const FILE = /^(\d{13})_([0-9a-f-]{36})\.(json|json\.gz)$/u;
const RETENTION_MS = 14 * 86_400_000;
const MAX_CATEGORY_BYTES = 100_000_000;
const MAX_METADATA_BYTES = 128 * 1024;
const MAX_SNAPSHOT_BYTES = 8 * 1024 * 1024;
const MAX_CATEGORY_FILES = 10_000;
export type IndicatorRefreshAudit = Readonly<{
  id: string; instanceId: string; symbol: string; activationId: string; queuedAt: number;
  startedAt: number | null; finishedAt: number | null;
  outcome: "queued" | "running" | "published" | "partial" | "retained" | "unavailable" | "superseded" | "interrupted_unknown"
    | "cache_hit" | "coalesced" | "session_closed" | "calendar_unavailable" | "closed_retry_wait" | "closed_retry_exhausted";
  calculationId: string | null;
  attempts: readonly IndicatorRequestAudit[];
  timeframes: readonly Readonly<{
    timeframe: IndicatorTimeframe; provider: "moomoo" | "yahoo" | null;
    primaryOutcome: string; fallbackOutcome: string | null; acceptedBars: number; through: number | null;
    missingMinutes: number; missingVolumeBars?: number; excludedBars: number; calculationRevision: string | null;
    correctedBars?: number; addedBars?: number; gapReset?: boolean; rebuildReason?: string | null;
  }>[];
}>;
export type IndicatorCalculationEvidence = Readonly<{
  id: string; refreshId: string; createdAt: number; symbol: string; activationId: string;
  algorithmVersion: string; calendarId: string;
  timeframes: readonly Readonly<{
    timeframe: IndicatorTimeframe; seriesKey: string; provider: "moomoo" | "yahoo";
    adjustment: string; initialCheckpoint: IndicatorCheckpoint | null;
    candles: readonly IndicatorCandle[]; result: IndicatorResult | null;
  }>[];
  vwap: Readonly<{ candles: readonly IndicatorCandle[]; start: number; end: number;
    completedThrough: number; coverageComplete: boolean; value: number | null }> | null;
}>;
export type IndicatorAuditCoverage = Readonly<{
  retentionDays: 14; metadataCapBytes: number; snapshotCapBytes: number;
  droppedWrites: number; expiredMetadata: number; expiredSnapshots: number;
  oldestRetainedAt: number | null;
  maxFilesPerCategory: number;
  bufferedEventsMayBeMissingAfterRestart: true;
  filesystemOverheadBytes: null;
}>;

function validId(id: string): void { if (!UUID.test(id)) throw Error("indicator_audit_invalid_id"); }
function validTime(time: number): void {
  if (!Number.isSafeInteger(time) || time < 1_000_000_000_000 || time > 9_999_999_999_999) throw Error("indicator_audit_invalid_time");
}
function fileName(time: number, id: string, snapshot: boolean): string {
  validId(id); validTime(time); return `${time}_${id}.${snapshot ? "json.gz" : "json"}`;
}
function safeSummary(value: IndicatorRefreshAudit): IndicatorRefreshAudit {
  validId(value.id); validId(value.instanceId); validTime(value.queuedAt);
  if (!/^[A-Z][A-Z0-9.-]{0,15}$/u.test(value.symbol) || !/^[A-Za-z0-9:_-]{1,100}$/u.test(value.activationId)) throw Error("indicator_audit_invalid_symbol_activation");
  // Explicit field projection excludes any accidental transport URL, scope, raw body or token.
  return { id: value.id, instanceId: value.instanceId, symbol: value.symbol, activationId: value.activationId,
    queuedAt: value.queuedAt, startedAt: value.startedAt, finishedAt: value.finishedAt, outcome: value.outcome,
    calculationId: value.calculationId,
    attempts: value.attempts.slice(-128).map(event => ({ kind: event.kind, provider: event.provider,
      consumer: event.consumer, transportId: event.transportId, at: event.at,
      elapsedMs: event.elapsedMs, outcome: event.outcome, retryAt: event.retryAt,
      httpStatus: event.httpStatus, retryAfterMs: event.retryAfterMs })),
    timeframes: value.timeframes.slice(0, 4).map(frame => ({ timeframe: frame.timeframe, provider: frame.provider,
      primaryOutcome: frame.primaryOutcome, fallbackOutcome: frame.fallbackOutcome, acceptedBars: frame.acceptedBars,
      through: frame.through, missingMinutes: frame.missingMinutes, missingVolumeBars: frame.missingVolumeBars, excludedBars: frame.excludedBars,
      correctedBars: frame.correctedBars, addedBars: frame.addedBars, gapReset: frame.gapReset, rebuildReason: frame.rebuildReason, calculationRevision: frame.calculationRevision })),
  };
}

/** Single-writer, bounded, file-backed audit. No new Platform database migration. */
export class IndicatorAuditStore {
  private readonly root: string;
  private readonly now: () => number;
  private writes: Promise<void> = Promise.resolve();
  private flushing = false;
  private queued = new Map<string, IndicatorRefreshAudit>();
  private failures = 0;
  private expiredMetadata = 0;
  private expiredSnapshots = 0;
  private initialized = false;
  private initializing: Promise<void> | null = null;
  private sizes = new Map<string, number>();
  private lastPruneAt = 0;
  private pruning: Promise<void> = Promise.resolve();
  private coverageWriting: Promise<void> = Promise.resolve();

  constructor(directory: string, now: () => number = Date.now) {
    if (!isAbsolute(directory) || resolve(directory) !== directory || directory === resolve(directory, "..")) throw Error("indicator_audit_invalid_directory");
    this.root = directory; this.now = now;
  }
  /** At most 64 pending refresh records. Call flush at lifecycle boundaries; do not await from quote delivery. */
  enqueue(record: IndicatorRefreshAudit): void {
    try {
      if (this.queued.size >= 64 && !this.queued.has(record.id)) { this.failures++; return; }
      this.queued.set(record.id, safeSummary(record));
    } catch { this.failures++; }
  }
  flush(): Promise<void> {
    if (this.flushing || this.queued.size === 0) return this.writes;
    this.flushing = true;
    this.writes = (async () => {
      try {
        while (this.queued.size > 0) {
          const records = [...this.queued.values()]; this.queued.clear();
          try {
            await this.initialize();
            for (const record of records) {
              try { await this.atomicWrite(fileName(record.queuedAt, record.id, false), Buffer.from(JSON.stringify(record)), MAX_METADATA_BYTES); }
              catch { this.failures++; }
            }
            await this.prune(); await this.persistCoverage();
          } catch { this.failures += records.length; }
        }
      } finally { this.flushing = false; }
    })();
    return this.writes;
  }
  private async initialize(): Promise<void> {
    if (this.initialized) return;
    if (!this.initializing) this.initializing = (async () => {
      await mkdir(this.root, { recursive: true, mode: 0o700 });
      for (const name of await readdir(this.root)) {
        const match = FILE.exec(name);
        if (match && UUID.test(match[2])) this.sizes.set(name, (await stat(join(this.root, name))).size);
      }
      try {
        const saved = JSON.parse((await this.readBounded("coverage.json", 4096)).toString("utf8"));
        for (const field of ["failures", "expiredMetadata", "expiredSnapshots"] as const) {
          if (Number.isSafeInteger(saved[field]) && saved[field] >= 0) this[field] = saved[field];
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") this.failures++;
      }
      this.initialized = true;
    })().finally(() => { this.initializing = null; });
    await this.initializing;
  }
  private async atomicWrite(name: string, bytes: Buffer, limit: number, immutable = false): Promise<void> {
    if ((!FILE.test(name) && name !== "coverage.json") || bytes.length > limit) throw Error("indicator_audit_size_or_name_invalid");
    const path = join(this.root, name);
    if (immutable) {
      // wx ensures an existing historical calculation cannot be replaced by newer inputs.
      const file = await open(path, "wx", 0o600);
      try { await file.writeFile(bytes); await file.sync(); } finally { await file.close(); }
      this.sizes.set(name, bytes.length);
      return;
    }
    const temporary = join(this.root, `${name}.${randomUUID()}.tmp`);
    const file = await open(temporary, "wx", 0o600);
    try { await file.writeFile(bytes); await file.sync(); }
    finally { await file.close(); }
    try { await rename(temporary, path); if (FILE.test(name)) this.sizes.set(name, bytes.length); }
    finally { await unlink(temporary).catch(() => {}); }
  }
  async saveCalculation(evidence: IndicatorCalculationEvidence): Promise<boolean> {
    try {
      validId(evidence.id); validId(evidence.refreshId); validTime(evidence.createdAt);
      const raw = Buffer.from(JSON.stringify(evidence));
      if (raw.length > MAX_SNAPSHOT_BYTES) throw Error("indicator_calculation_too_large");
      const bytes = await compress(raw);
      await this.initialize();
      await this.atomicWrite(fileName(evidence.createdAt, evidence.id, true), bytes, MAX_SNAPSHOT_BYTES, true);
      await this.prune(); await this.persistCoverage(); return true;
    } catch { this.failures++; return false; }
  }
  private async names(snapshot: boolean): Promise<string[]> {
    await this.initialize();
    return (await readdir(this.root)).filter(name => {
      const match = FILE.exec(name); return match !== null && UUID.test(match[2]) && (match[3] === "json.gz") === snapshot;
    }).sort();
  }
  private async readBounded(name: string, maximum: number): Promise<Buffer> {
    if (!FILE.test(name) && name !== "coverage.json") throw Error("indicator_audit_name_invalid");
    const file = await open(join(this.root, name), "r");
    try {
      const details = await file.stat();
      if (!details.isFile() || details.size > maximum) throw Error("indicator_audit_file_invalid");
      return await file.readFile();
    } finally { await file.close(); }
  }
  async history(options: Readonly<{ before?: string; limit?: number }> = {}): Promise<Readonly<{
    records: readonly IndicatorRefreshAudit[]; nextCursor: string | null; coverage: IndicatorAuditCoverage;
  }>> {
    const limit = Math.min(100, Math.max(1, Math.floor(options.limit ?? 50)));
    if (!Number.isFinite(limit) || (options.before !== undefined && (!FILE.test(options.before) || options.before.endsWith(".gz")))) throw Error("indicator_audit_page_invalid");
    const names = await this.names(false);
    const eligible = names.filter(name => options.before === undefined || name < options.before).reverse();
    const records: IndicatorRefreshAudit[] = [];
    for (const name of eligible.slice(0, limit)) {
      try { records.push(safeSummary(JSON.parse((await this.readBounded(name, MAX_METADATA_BYTES)).toString("utf8")))); }
      catch { this.failures++; }
    }
    return { records, nextCursor: eligible.length > limit ? eligible[limit - 1] : null,
      coverage: { retentionDays: 14, metadataCapBytes: MAX_CATEGORY_BYTES, snapshotCapBytes: MAX_CATEGORY_BYTES,
        droppedWrites: this.failures, expiredMetadata: this.expiredMetadata, expiredSnapshots: this.expiredSnapshots,
        oldestRetainedAt: names[0] ? Number(names[0].slice(0, 13)) : null,
        maxFilesPerCategory: MAX_CATEGORY_FILES, bufferedEventsMayBeMissingAfterRestart: true, filesystemOverheadBytes: null } };
  }
  async calculation(id: string): Promise<Readonly<{ status: "retained"; evidence: IndicatorCalculationEvidence }> | Readonly<{ status: "expired_or_unavailable" }>> {
    validId(id);
    const names = (await this.names(true)).filter(name => name.includes(`_${id}.`));
    if (names.length !== 1) return { status: "expired_or_unavailable" };
    try {
      const compressed = await this.readBounded(names[0], MAX_SNAPSHOT_BYTES);
      const raw = await decompress(compressed, { maxOutputLength: MAX_SNAPSHOT_BYTES });
      const evidence = JSON.parse(raw.toString("utf8")) as IndicatorCalculationEvidence;
      if (evidence.id !== id) return { status: "expired_or_unavailable" };
      return { status: "retained", evidence };
    } catch { this.failures++; return { status: "expired_or_unavailable" }; }
  }
  /** Bounded warm-start lookup. Older/unretained inputs cause fresh acquisition, not a guessed seed. */
  async latestCalculation(symbol: string, activationId: string): Promise<IndicatorCalculationEvidence | null> {
    const recent = await this.history({ limit: 100 });
    const record = recent.records.find(row => row.symbol === symbol && row.activationId === activationId && row.calculationId);
    if (!record?.calculationId) return null;
    const result = await this.calculation(record.calculationId);
    return result.status === "retained" && result.evidence.symbol === symbol && result.evidence.activationId === activationId ? result.evidence : null;
  }
  async reconcileRestart(instanceId: string): Promise<void> {
    validId(instanceId);
    for (const name of await this.names(false)) {
      try {
        const record = safeSummary(JSON.parse((await this.readBounded(name, MAX_METADATA_BYTES)).toString("utf8")));
        if (record.instanceId !== instanceId && ["queued", "running"].includes(record.outcome)) {
          this.enqueue({ ...record, outcome: "interrupted_unknown", finishedAt: this.now() });
          if (this.queued.size >= 32) await this.flush();
        }
      } catch { this.failures++; }
    }
    await this.flush();
  }
  private prune(): Promise<void> {
    this.pruning = this.pruning.catch(() => {}).then(() => this.pruneOnce());
    return this.pruning;
  }
  private persistCoverage(): Promise<void> {
    this.coverageWriting = this.coverageWriting.catch(() => {}).then(() => this.atomicWrite("coverage.json",
      Buffer.from(JSON.stringify({ failures: this.failures, expiredMetadata: this.expiredMetadata,
        expiredSnapshots: this.expiredSnapshots })), 4096));
    return this.coverageWriting;
  }
  private async pruneOnce(): Promise<void> {
    const expiryDue = this.now() - this.lastPruneAt >= 120_000;
    if (expiryDue) this.lastPruneAt = this.now();
    for (const snapshot of [false, true]) {
      // Inventory is loaded once and maintained by the single writer; no full filesystem stat scan per refresh.
      const entries = [...this.sizes].filter(([name]) => name.endsWith(".gz") === snapshot)
        .map(([name, size]) => ({ name, size })).sort((a, b) => a.name.localeCompare(b.name));
      let bytes = entries.reduce((sum, entry) => sum + entry.size, 0);
      let files = entries.length;
      if (!expiryDue && bytes <= MAX_CATEGORY_BYTES && files <= MAX_CATEGORY_FILES) continue;
      for (const entry of entries) {
        if (Number(entry.name.slice(0, 13)) >= this.now() - RETENTION_MS && bytes <= MAX_CATEGORY_BYTES && files <= MAX_CATEGORY_FILES) break;
        // Only exact validated files in this store's directory; never recursive deletion.
        if (!snapshot) {
          const record = JSON.parse((await this.readBounded(entry.name, MAX_METADATA_BYTES)).toString("utf8")) as IndicatorRefreshAudit;
          if (["queued", "running"].includes(record.outcome)) continue;
        }
        await unlink(join(this.root, entry.name)); this.sizes.delete(entry.name); bytes -= entry.size; files--;
        if (snapshot) this.expiredSnapshots++; else this.expiredMetadata++;
      }
    }
  }
}
