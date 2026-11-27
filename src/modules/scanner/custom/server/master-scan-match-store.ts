import "server-only";

import Database from "better-sqlite3";
import { createHash, randomUUID } from "node:crypto";
import { closeSync, constants, lstatSync, mkdirSync, openSync } from "node:fs";
import { join } from "node:path";
import type { MasterScanEvaluation, MasterScanMatch, MasterScanRecipient, MasterScanSource, MasterScanSession } from "./master-scan-match-types";

const keepMs = 7 * 86_400_000;
const keepRuns = 2048;
const renewalMs = 20_000;

type MatchFact = Omit<MasterScanMatch, "evidenceRef"> & {
  symbol: string;
  reasonCodes: readonly ("volume-increased" | "price-rising" | "price-falling" | "news-reported")[];
  companyPin?: import("../company-match-evidence").CompanyMatchPin;
  privateLevels?: readonly string[];
  newsId?: string;
  newsIds?: string[];
  /** Internal event discriminator when a ticker has multiple qualifying events. */
  eventId?: string;
};
export type MasterScanFacts = {
  coverage: "complete" | "partial" | "unavailable";
  detectedAtUtc: string;
  session: MasterScanSession;
  matches: readonly MatchFact[];
};
export type { MatchFact };

type RunRow = {
  runId: string;
  sequence: number;
  payload: string;
  detectedMs: number;
  signature: string;
  publishedMs: number;
};
type StreamRow = { sequence: number; detectedMs: number; signature: string; publishedMs: number };

const shareRecipientKey = (recipient: MasterScanRecipient) =>
  createHash("sha256").update(JSON.stringify([recipient.workspaceId, recipient.userId])).digest("hex");

export const masterScanStreamKey = (recipient: MasterScanRecipient, source: MasterScanSource) =>
  createHash("sha256").update(JSON.stringify([recipient.workspaceId, recipient.userId, source.scanId, source.version])).digest("hex");

function decode(row: RunRow): MasterScanFacts {
  return JSON.parse(row.payload) as MasterScanFacts;
}

function evaluation(source: MasterScanSource, row: RunRow): MasterScanEvaluation {
  const { coverage, detectedAtUtc, session, matches } = decode(row);
  const base = { scanId: source.scanId, version: source.version, runId: row.runId, sequence: row.sequence, session, detectedAtUtc };
  return coverage === "unavailable" ? { ...base, coverage } : { ...base, coverage,
    matches: matches.map(({ instrumentId, observedAtUtc, activation }, index) => ({
      instrumentId, observedAtUtc, ...(activation ? { activation } : {}), evidenceRef: row.runId + ":" + index,
    })),
  };
}

export class MasterScanMatchStore {
  constructor(private readonly directory: string, private readonly now: () => number = Date.now) {}

  private use<T>(write: boolean, absent: T, run: (db: Database.Database) => T): T {
    const path = join(this.directory, "master-scan-matches.sqlite");
    if (write) {
      mkdirSync(this.directory, { recursive: true, mode: 0o700 });
      closeSync(openSync(path, constants.O_WRONLY | constants.O_CREAT | constants.O_NOFOLLOW, 0o600));
    }
    try {
      if (!lstatSync(path).isFile()) throw Error("master_scan_store_unavailable");
    } catch (error) {
      if (!write && (error as NodeJS.ErrnoException).code === "ENOENT") return absent;
      throw error;
    }
    const db = new Database(path, { readonly: !write, fileMustExist: true, timeout: 750 });
    try {
      if (write) db.exec(`
        CREATE TABLE IF NOT EXISTS scan_streams (
          streamKey TEXT PRIMARY KEY, sequence INTEGER NOT NULL, detectedMs INTEGER NOT NULL,
          signature TEXT NOT NULL, publishedMs INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS scan_runs (
          streamKey TEXT NOT NULL, sequence INTEGER NOT NULL, runId TEXT NOT NULL UNIQUE,
          payload TEXT NOT NULL, detectedMs INTEGER NOT NULL, signature TEXT NOT NULL,
          publishedMs INTEGER NOT NULL, PRIMARY KEY(streamKey, sequence)
        );
        CREATE INDEX IF NOT EXISTS scan_runs_retention ON scan_runs(publishedMs);
        CREATE TABLE IF NOT EXISTS scan_share_admissions (
          streamKey TEXT PRIMARY KEY, recipientKey TEXT NOT NULL, grantId TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS scan_share_admissions_recipient ON scan_share_admissions(recipientKey);
      `);
      return run(db);
    } finally { db.close(); }
  }

  admitShare(recipient: MasterScanRecipient, source: MasterScanSource, grantId: string) {
    return this.use(true, undefined, db => {
      db.prepare("INSERT OR IGNORE INTO scan_share_admissions VALUES (?, ?, ?)")
        .run(masterScanStreamKey(recipient, source), shareRecipientKey(recipient), grantId);
    });
  }

  readShareAdmission(recipient: MasterScanRecipient, source: MasterScanSource): string | null {
    return this.use(false, null, db => db.prepare<[string], { grantId: string }>(
      "SELECT grantId FROM scan_share_admissions WHERE streamKey=?",
    ).get(masterScanStreamKey(recipient, source))?.grantId ?? null);
  }

  listShareAdmissions(recipient: MasterScanRecipient): readonly string[] {
    return this.use(false, [], db => db.prepare<[string], { grantId: string }>(
      "SELECT grantId FROM scan_share_admissions WHERE recipientKey=? ORDER BY rowid",
    ).all(shareRecipientKey(recipient)).map(row => row.grantId));
  }

  append(recipient: MasterScanRecipient, source: MasterScanSource, facts: MasterScanFacts): MasterScanEvaluation | null {
    const streamKey = masterScanStreamKey(recipient, source);
    const now = this.now();
    const detectedMs = Date.parse(facts.detectedAtUtc);
    if (!Number.isSafeInteger(detectedMs) || detectedMs > now || detectedMs <= 0) return null;
    const signature = createHash("sha256").update(JSON.stringify([
      facts.coverage, facts.session, facts.detectedAtUtc.slice(0, 10),
      facts.matches.map(match => [match.instrumentId, match.activation, match.reasonCodes, match.eventId, match.privateLevels, match.newsIds??match.newsId, match.companyPin?.fields]),
    ])).digest("hex");
    const payload = JSON.stringify(facts);
    return this.use(true, null as MasterScanEvaluation | null, db => db.transaction(() => {
      const last = db.prepare<[string], StreamRow>("SELECT sequence, detectedMs, signature, publishedMs FROM scan_streams WHERE streamKey = ?").get(streamKey);
      if (last && (detectedMs < last.detectedMs ||
        last.signature === signature && (detectedMs === last.detectedMs || now - last.publishedMs < renewalMs))) return null;
      const sequence = (last?.sequence ?? 0) + 1;
      const row = { streamKey, sequence, runId: randomUUID(), payload, detectedMs, signature, publishedMs: now };
      db.prepare("INSERT INTO scan_runs VALUES (@streamKey, @sequence, @runId, @payload, @detectedMs, @signature, @publishedMs)").run(row);
      db.prepare(`INSERT INTO scan_streams VALUES (@streamKey, @sequence, @detectedMs, @signature, @publishedMs)
        ON CONFLICT(streamKey) DO UPDATE SET sequence=excluded.sequence, detectedMs=excluded.detectedMs,
          signature=excluded.signature, publishedMs=excluded.publishedMs`).run(row);
      db.prepare("DELETE FROM scan_runs WHERE streamKey=? AND sequence<=?").run(streamKey, sequence - keepRuns);
      db.prepare("DELETE FROM scan_runs WHERE publishedMs<=?").run(now - keepMs);
      return evaluation(source, row);
    }).immediate());
  }

  read(recipient: MasterScanRecipient, source: MasterScanSource, after: number, limit: number) {
    const streamKey = masterScanStreamKey(recipient, source);
    const now = this.now();
    return this.use(false, { continuity: (after ? "gap" : "continuous") as "gap" | "continuous",
      events: [] as MasterScanEvaluation[], latest: null as MasterScanEvaluation | null }, db => db.transaction(() => {
      const last = db.prepare<[string], StreamRow>("SELECT sequence, detectedMs, signature, publishedMs FROM scan_streams WHERE streamKey = ?").get(streamKey);
      const rows = db.prepare<[string, number, number, number], RunRow>(`SELECT * FROM scan_runs
        WHERE streamKey=? AND sequence>? AND publishedMs>? ORDER BY sequence LIMIT ?`).all(streamKey, after, now - keepMs, limit);
      const latest = db.prepare<[string, number], RunRow>(`SELECT * FROM scan_runs
        WHERE streamKey=? AND publishedMs>? ORDER BY sequence DESC LIMIT 1`).get(streamKey, now - keepMs);
      const gap = after > (last?.sequence ?? 0) || (rows.length
        ? rows.some((row, index) => row.sequence !== after + index + 1)
        : after < (last?.sequence ?? 0));
      return { continuity: gap ? "gap" as const : "continuous" as const,
        events: rows.map(row => evaluation(source, row)), latest: latest ? evaluation(source, latest) : null };
    })());
  }

  evidence(recipient: MasterScanRecipient, source: MasterScanSource, match: MasterScanMatch): MatchFact | null {
    const reference = /^([a-f0-9-]{36}):(0|[1-9][0-9]{0,3})$/u.exec(match.evidenceRef);
    if (!reference) return null;
    return this.use(false, null as MatchFact | null, db => {
      const row = db.prepare<[string, string, number], RunRow>(
        "SELECT * FROM scan_runs WHERE streamKey=? AND runId=? AND publishedMs>?",
      ).get(masterScanStreamKey(recipient, source), reference[1], this.now() - keepMs);
      const saved = row && decode(row).matches[Number(reference[2])];
      return saved && saved.instrumentId === match.instrumentId && saved.observedAtUtc === match.observedAtUtc ? saved : null;
    });
  }
}
