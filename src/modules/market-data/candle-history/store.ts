import { closedScannerStudySession } from "./scanner-study-session";
import type { CandleArchiveRead, CandleArchiveReply } from "./transport";
import Database from "better-sqlite3";
import { closeSync, constants, mkdirSync, openSync, statSync } from "node:fs";
import { dirname } from "node:path";
import { chartSymbol, type Candle } from "../../scanner/alpaca/candles";
import { initialCandleHistorySettings, parseCandleHistorySettings, type CandleHistorySettings, type HistoryFrame } from "./settings";

export type CandleHistorySeries = {
  symbol: string;
  frame: HistoryFrame;
  session: "regular" | "extended" | "daily";
  /** Fingerprint of verified corporate actions and the relevant feed and aggregation rules. */
  basis: string;
};
/** Times are UTC seconds. The end is exclusive, including for an empty market interval. */
export type HistoryRange = { start: number; end: number };
type Window = CandleHistorySeries & HistoryRange;

function rangeValid(range: HistoryRange) {
  return Number.isSafeInteger(range.start) && Number.isSafeInteger(range.end) &&
    range.start > 0 && range.end > range.start;
}

function seriesKey(series: CandleHistorySeries) {
  if (!/^[a-f0-9]{64}$/u.test(series.basis)) throw Error("invalid_history_basis");
  return [chartSymbol(series.symbol), series.frame, series.session, series.basis] as const;
}

const keyWhere = "symbol = ? AND frame = ? AND session = ? AND basis = ?";
const fileBytes = (path: string) => {
  try { return statSync(path).size; } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return 0;
    throw error;
  }
};

class CandleHistoryQueries {
  constructor(protected readonly database: Database.Database) {}

  close() { this.database.close(); }

  missing(window: Window): HistoryRange[] {
    if (!rangeValid(window)) throw Error("invalid_history_window");
    const rows = this.database.prepare(`SELECT start, end FROM archive_coverage
      WHERE ${keyWhere} AND start < ? AND end > ? ORDER BY start`)
      .all(...seriesKey(window), window.end, window.start) as HistoryRange[];
    const missing: HistoryRange[] = [];
    let start = window.start;
    for (const covered of rows) {
      if (covered.start > start) missing.push({ start, end: covered.start });
      start = Math.max(start, covered.end);
    }
    if (start < window.end) missing.push({ start, end: window.end });
    return missing;
  }

  read(window: Window): Candle[] | null {
    return this.database.transaction(() => {
      if (this.missing(window).length) return null;
      return this.database.prepare(`SELECT time, open, high, low, close, volume FROM archive_bars
        WHERE ${keyWhere} AND time >= ? AND time < ? ORDER BY time`)
        .all(...seriesKey(window), window.start, window.end) as Candle[];
    })();
  }

  readScannerStudy(window: CandleArchiveRead, date: string): CandleArchiveReply {
    const closed = closedScannerStudySession(date);
    if (closed && window.end > closed.close) return { state: "miss" };
    return this.database.transaction((): CandleArchiveReply => {
      const row = this.database.prepare("SELECT date, basis FROM archive_basis WHERE symbol = ? AND date BETWEEN ? AND ?")
        .get(chartSymbol(window.symbol), closed?.basisFrom ?? date, date) as { date: string; basis: string } | undefined;
      if (!row) return { state: "miss" };
      const bars = this.read({ ...window, basis: row.basis });
      return bars ? { state: "ready", start: window.start, end: window.end, basisDate: row.date, bars } : { state: "miss" };
    })();
  }

  basisFor(symbol: string, date: string) {
    const row = this.database.prepare("SELECT basis FROM archive_basis WHERE symbol = ? AND date = ?")
      .get(chartSymbol(symbol), date) as { basis: string } | undefined;
    return row?.basis;
  }
}

export class ReadonlyCandleHistoryStore extends CandleHistoryQueries {
  constructor(path: string) {
    closeSync(openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW));
    super(new Database(path, { readonly: true, fileMustExist: true, timeout: 250 }));
  }

  readForDate(window: Omit<Window, "basis">, date: string): Candle[] | null {
    return this.database.transaction(() => {
      const basis = this.basisFor(window.symbol, date);
      return basis ? this.read({ ...window, basis }) : null;
    })();
  }
}

export class CandleHistoryStore extends CandleHistoryQueries {
  constructor(private readonly path: string) {
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    closeSync(openSync(path, constants.O_WRONLY | constants.O_CREAT | constants.O_NOFOLLOW, 0o600));
    const database = new Database(path, { fileMustExist: true, timeout: 250 });
    try {
      database.pragma("journal_mode = WAL");
      database.exec(`
        CREATE TABLE IF NOT EXISTS archive_settings (key INTEGER PRIMARY KEY CHECK (key = 1), content TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS archive_bars (
          symbol TEXT NOT NULL, frame TEXT NOT NULL, session TEXT NOT NULL, basis TEXT NOT NULL,
          time INTEGER NOT NULL, open REAL NOT NULL, high REAL NOT NULL, low REAL NOT NULL,
          close REAL NOT NULL, volume REAL NOT NULL,
          PRIMARY KEY (symbol, frame, session, basis, time)
        ) WITHOUT ROWID;
        CREATE TABLE IF NOT EXISTS archive_basis (symbol TEXT PRIMARY KEY, date TEXT NOT NULL, basis TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS archive_last_used (symbol TEXT PRIMARY KEY, at INTEGER NOT NULL);
        CREATE TABLE IF NOT EXISTS archive_roster (symbol TEXT PRIMARY KEY);
        CREATE TABLE IF NOT EXISTS archive_reconciled (
          symbol TEXT PRIMARY KEY, basis TEXT NOT NULL, through INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS archive_counts (symbol TEXT PRIMARY KEY, bars INTEGER NOT NULL);
        CREATE TABLE IF NOT EXISTS archive_coverage (
          symbol TEXT NOT NULL, frame TEXT NOT NULL, session TEXT NOT NULL, basis TEXT NOT NULL,
          start INTEGER NOT NULL, end INTEGER NOT NULL CHECK (end > start),
          PRIMARY KEY (symbol, frame, session, basis, start)
        ) WITHOUT ROWID;
      `);
    } catch (error) {
      database.close();
      throw error;
    }
    super(database);
  }

  settings(): CandleHistorySettings {
    const row = this.database.prepare("SELECT content FROM archive_settings WHERE key = 1").get() as { content: string } | undefined;
    return row ? parseCandleHistorySettings(JSON.parse(row.content)) : initialCandleHistorySettings();
  }

  changeSettings(input: unknown, marketCapRoster?: readonly string[]): CandleHistorySettings {
    const requested = parseCandleHistorySettings(input);
    return this.database.transaction(() => {
      if (this.settings().revision !== requested.revision) throw Error("candle_history_settings_conflict");
      const next = { ...requested, revision: requested.revision + 1 };
      this.database.prepare("INSERT INTO archive_settings VALUES (1, ?) ON CONFLICT (key) DO UPDATE SET content = excluded.content")
        .run(JSON.stringify(next));
      if (marketCapRoster) this.replaceRoster(marketCapRoster);
      return next;
    }).immediate();
  }

  roster(): string[] {
    return (this.database.prepare("SELECT symbol FROM archive_roster ORDER BY symbol").all() as { symbol: string }[]).map(row => row.symbol);
  }

  replaceRoster(symbols: readonly string[]) {
    const normalized = new Set(symbols.map(chartSymbol));
    this.database.transaction(() => {
      this.database.prepare("DELETE FROM archive_roster").run();
      const insert = this.database.prepare("INSERT INTO archive_roster VALUES (?)");
      for (const symbol of normalized) insert.run(symbol);
    }).immediate();
  }

  reconciledThrough(symbol: string, basis: string): number | undefined {
    const row = this.database.prepare("SELECT through FROM archive_reconciled WHERE symbol = ? AND basis = ?")
      .get(chartSymbol(symbol), basis) as { through: number } | undefined;
    return row?.through;
  }

  markReconciled(symbol: string, basis: string, through: number) {
    this.database.prepare(`INSERT INTO archive_reconciled VALUES (?, ?, ?)
      ON CONFLICT(symbol) DO UPDATE SET basis = excluded.basis, through = excluded.through`)
      .run(chartSymbol(symbol), basis, through);
  }

  /** One transaction publishes candle rows and their verified coverage together. */
  saveVerified(windows: readonly (Window & { bars: readonly Candle[] })[]) {
    this.database.transaction(() => {
      const removeBars = this.database.prepare(`DELETE FROM archive_bars WHERE ${keyWhere} AND time >= ? AND time < ?`);
      const writeBar = this.database.prepare("INSERT INTO archive_bars VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
      const coverage = this.database.prepare(`SELECT start, end FROM archive_coverage
        WHERE ${keyWhere} AND start <= ? AND end >= ? ORDER BY start`);
      const removeCoverage = this.database.prepare(`DELETE FROM archive_coverage WHERE ${keyWhere} AND start <= ? AND end >= ?`);
      const writeCoverage = this.database.prepare("INSERT INTO archive_coverage VALUES (?, ?, ?, ?, ?, ?)");
      const changeCount = this.database.prepare(`INSERT INTO archive_counts VALUES (?, ?)
        ON CONFLICT (symbol) DO UPDATE SET bars = bars + excluded.bars`);
      for (const window of windows) {
        if (!rangeValid(window)) throw Error("invalid_history_window");
        const key = seriesKey(window);
        const previouslyStored = removeBars.run(...key, window.start, window.end).changes;
        for (const bar of window.bars) {
          if (!Number.isSafeInteger(bar.time) || bar.time < window.start || bar.time >= window.end ||
            ![bar.open, bar.high, bar.low, bar.close, bar.volume].every(value => Number.isFinite(value) && value >= 0) ||
            bar.low > Math.min(bar.open, bar.close) || bar.high < Math.max(bar.open, bar.close) || bar.low > bar.high)
            throw Error("invalid_history_bar");
          writeBar.run(...key, bar.time, bar.open, bar.high, bar.low, bar.close, bar.volume);
        }
        changeCount.run(key[0], window.bars.length - previouslyStored);
        let { start, end } = window;
        for (const covered of coverage.all(...key, window.end, window.start) as HistoryRange[]) {
          start = Math.min(start, covered.start);
          end = Math.max(end, covered.end);
        }
        removeCoverage.run(...key, window.end, window.start);
        writeCoverage.run(...key, start, end);
      }
    }).immediate();
  }

  updateBasis(symbol: string, date: string, currentBasis: string) {
    chartSymbol(symbol);
    if (!/^\d{4}-\d{2}-\d{2}$/u.test(date) || !/^[a-f0-9]{64}$/u.test(currentBasis)) throw Error("invalid_history_basis");
    this.database.transaction(() => {
      const normalized = chartSymbol(symbol);
      const rows = this.database.prepare("DELETE FROM archive_bars WHERE symbol = ? AND basis <> ?").run(normalized, currentBasis).changes;
      this.database.prepare("DELETE FROM archive_coverage WHERE symbol = ? AND basis <> ?").run(normalized, currentBasis);
      this.database.prepare("UPDATE archive_counts SET bars = bars - ? WHERE symbol = ?").run(rows, normalized);
      this.database.prepare(`INSERT INTO archive_basis VALUES (?, ?, ?)
        ON CONFLICT(symbol) DO UPDATE SET date = excluded.date, basis = excluded.basis`).run(normalized, date, currentBasis);
    }).immediate();
  }

  touchTicker(symbol: string, at: number) {
    this.database.prepare(`INSERT INTO archive_last_used VALUES (?, ?)
      ON CONFLICT(symbol) DO UPDATE SET at = excluded.at WHERE excluded.at - at >= 60_000`).run(chartSymbol(symbol), at);
  }

  expireOnDemand(keep: ReadonlySet<string>, cutoff: number, limit: number) {
    const active = this.database.prepare("SELECT symbol, at FROM archive_last_used ORDER BY at DESC").all() as { symbol: string; at: number }[];
    let retained = 0;
    const expired = active.filter(row => {
      if (keep.has(row.symbol)) return false;
      return ++retained > limit || row.at < cutoff;
    });
    this.database.transaction(() => {
      for (const { symbol } of expired.slice(0, 16)) {
        for (const table of ["archive_last_used", "archive_bars", "archive_coverage", "archive_counts", "archive_basis", "archive_reconciled"]) {
          this.database.prepare(`DELETE FROM ${table} WHERE symbol = ?`).run(symbol);
        }
      }
    }).immediate();
  }

  retainFrom(series: CandleHistorySeries, cutoff: number) {
    if (!Number.isSafeInteger(cutoff) || cutoff <= 0) throw Error("invalid_history_cutoff");
    const key = seriesKey(series);
    this.database.transaction(() => {
      const removed = this.database.prepare(`DELETE FROM archive_bars WHERE ${keyWhere} AND time < ?`).run(...key, cutoff).changes;
      this.database.prepare(`DELETE FROM archive_coverage WHERE ${keyWhere} AND end <= ?`).run(...key, cutoff);
      this.database.prepare(`UPDATE archive_coverage SET start = ? WHERE ${keyWhere} AND start < ?`).run(cutoff, ...key, cutoff);
      this.database.prepare("UPDATE archive_counts SET bars = bars - ? WHERE symbol = ?").run(removed, key[0]);
    }).immediate();
  }

  storage(marketCap: ReadonlySet<string>, popular: ReadonlySet<string>) {
    const counts = this.database.prepare("SELECT symbol, bars FROM archive_counts WHERE bars > 0").all() as { symbol: string; bars: number }[];
    const sizes = new Map(counts.map(({ symbol, bars }) => [symbol, bars]));
    const pageSize = Number(this.database.pragma("page_size", { simple: true }));
    const pages = Number(this.database.pragma("page_count", { simple: true }));
    const free = Number(this.database.pragma("freelist_count", { simple: true }));
    const candlePageBytes = pageSize * (pages - free);
    const allBars = [...sizes.values()].reduce((sum, count) => sum + count, 0);
    const summary = (symbols: Iterable<string>) => {
      const group = [...symbols].filter(symbol => sizes.has(symbol));
      const bars = group.reduce((sum, symbol) => sum + (sizes.get(symbol) ?? 0), 0);
      return { symbols: group.length, bars, estimatedBytes: allBars ? Math.round(candlePageBytes * bars / allBars) : 0 };
    };
    return {
      measuredAt: Date.now(),
      marketCap: summary(marketCap),
      popular: summary(popular),
      overlap: summary([...popular].filter(symbol => marketCap.has(symbol))),
      combined: summary(new Set([...marketCap, ...popular])),
      physicalBytes: fileBytes(this.path) + fileBytes(this.path + "-wal"),
    };
  }
}
