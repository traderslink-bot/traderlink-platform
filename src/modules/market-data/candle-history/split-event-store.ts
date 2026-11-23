import Database from "better-sqlite3";
import { closeSync, constants, openSync } from "node:fs";
import { chartSymbol } from "../../scanner/alpaca/candles";
import { calendarDate } from "../../scanner/alpaca/chart-calendar";
import type { AlpacaSplitHistory } from "../../scanner/alpaca/chart-vwap-events";

export type QualifiedSplitHistory = Omit<AlpacaSplitHistory, "revision"> & Readonly<{
  coverageStart: string;
  priceBasis: string;
  evidenceSha256: string;
}>;

const sha256 = /^[a-f0-9]{64}$/u;

export class CandleSplitEventStore {
  private readonly database: Database.Database;

  constructor(path: string) {
    closeSync(openSync(path, constants.O_WRONLY | constants.O_CREAT | constants.O_NOFOLLOW, 0o600));
    const database = new Database(path, { fileMustExist: true, timeout: 250 });
    try {
      database.pragma("journal_mode = WAL");
      database.exec(`CREATE TABLE IF NOT EXISTS archive_split_history (
        symbol TEXT PRIMARY KEY,
        basis_date TEXT NOT NULL,
        revision TEXT NOT NULL,
        events_json TEXT NOT NULL CHECK (json_valid(events_json) AND json_type(events_json) = 'array')
      ) STRICT;
      CREATE TABLE IF NOT EXISTS archive_qualified_split_history (
        symbol TEXT PRIMARY KEY,
        basis_date TEXT NOT NULL,
        coverage_start TEXT NOT NULL,
        price_basis TEXT NOT NULL,
        evidence_sha256 TEXT NOT NULL,
        events_json TEXT NOT NULL CHECK (json_valid(events_json) AND json_type(events_json) = 'array')
      ) STRICT`);
      this.database = database;
    } catch (error) {
      database.close();
      throw error;
    }
  }

  close() { this.database.close(); }

  /** The caller supplies a complete, validated provider snapshot. */
  save(history: AlpacaSplitHistory) {
    this.database.prepare(`INSERT INTO archive_split_history VALUES (?, ?, ?, ?)
      ON CONFLICT(symbol) DO UPDATE SET basis_date = excluded.basis_date, revision = excluded.revision,
        events_json = excluded.events_json WHERE excluded.basis_date >= archive_split_history.basis_date`)
      .run(chartSymbol(history.symbol), history.basisDate, history.revision, JSON.stringify(history.events));
  }

  read(symbol: string): AlpacaSplitHistory | null {
    const normalized = chartSymbol(symbol);
    const row = this.database.prepare("SELECT basis_date, revision, events_json FROM archive_split_history WHERE symbol = ?")
      .get(normalized) as { basis_date: string; revision: string; events_json: string } | undefined;
    return row ? { symbol: normalized, basisDate: row.basis_date, revision: row.revision,
      events: JSON.parse(row.events_json) as AlpacaSplitHistory["events"] } : null;
  }

  /** Publish only events whose security lineage and archived price basis were independently checked. */
  publishQualified(histories: readonly QualifiedSplitHistory[]) {
    const insert = this.database.prepare(`INSERT INTO archive_qualified_split_history VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(symbol) DO UPDATE SET basis_date = excluded.basis_date, coverage_start = excluded.coverage_start,
        price_basis = excluded.price_basis, evidence_sha256 = excluded.evidence_sha256, events_json = excluded.events_json
      WHERE excluded.basis_date >= archive_qualified_split_history.basis_date`);
    const uniqueSymbols = new Set<string>();
    this.database.transaction(() => {
      for (const history of histories) {
        const { basisDate, coverageStart, priceBasis, evidenceSha256, events } = history;
        const symbol = chartSymbol(history.symbol);
        if (uniqueSymbols.has(symbol) || !calendarDate(basisDate) || !calendarDate(coverageStart) || coverageStart > basisDate ||
          !sha256.test(priceBasis) || !sha256.test(evidenceSha256) ||
          new Set(events.map(event => event.providerEventId)).size !== events.length ||
          events.some(event => !calendarDate(event.effectiveDate) || event.effectiveDate < coverageStart ||
            event.effectiveDate > basisDate)) throw Error("invalid_split_lineage_evidence");
        uniqueSymbols.add(symbol);
        insert.run(symbol, basisDate, coverageStart, priceBasis, evidenceSha256, JSON.stringify(events));
      }
    }).immediate();
  }

  readQualified(symbol: string, priceBasis: string): QualifiedSplitHistory | null {
    return readQualified(this.database, symbol, priceBasis);
  }

  /** Reads existing evidence before this archive instance has opened its split writer. */
  static readQualifiedFile(path: string, symbol: string, priceBasis: string): QualifiedSplitHistory | null {
    return readSplitFile(path, database => {
      const table = database.prepare("SELECT 1 FROM sqlite_schema WHERE type = 'table' AND name = ?")
        .get("archive_qualified_split_history");
      return table ? readQualified(database, symbol, priceBasis) : null;
    });
  }

  static readEffectiveFile(path: string, date: string): AlpacaSplitHistory[] {
    if (!calendarDate(date)) return [];
    return readSplitFile(path, database => {
      const table = database.prepare("SELECT 1 FROM sqlite_schema WHERE type = 'table' AND name = ?")
        .get("archive_split_history");
      if (!table) return [];
      const rows = database.prepare(`SELECT symbol, revision, events_json FROM archive_split_history AS history
        WHERE history.basis_date = ? AND EXISTS (
          SELECT 1 FROM json_each(history.events_json) WHERE json_extract(value, '$.effectiveDate') = ?
        ) ORDER BY symbol`).all(date, date) as { symbol: string; revision: string; events_json: string }[];
      return rows.map(row => ({ symbol: row.symbol, basisDate: date, revision: row.revision,
        events: JSON.parse(row.events_json) as AlpacaSplitHistory["events"] }));
    }) ?? [];
  }
}

function readSplitFile<T>(path: string, load: (database: Database.Database) => T): T | null {
  try { closeSync(openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW)); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
  const database = new Database(path, { readonly: true, fileMustExist: true, timeout: 250 });
  try { return load(database); }
  finally { database.close(); }
}

function readQualified(database: Database.Database, symbol: string, priceBasis: string): QualifiedSplitHistory | null {
  const normalized = chartSymbol(symbol);
  const row = database.prepare(`SELECT basis_date, coverage_start, evidence_sha256, events_json
    FROM archive_qualified_split_history WHERE symbol = ? AND price_basis = ?`).get(normalized, priceBasis) as
      { basis_date: string; coverage_start: string; evidence_sha256: string; events_json: string } | undefined;
  return row ? { symbol: normalized, basisDate: row.basis_date, coverageStart: row.coverage_start, priceBasis,
    evidenceSha256: row.evidence_sha256, events: JSON.parse(row.events_json) as AlpacaSplitHistory["events"] } : null;
}
