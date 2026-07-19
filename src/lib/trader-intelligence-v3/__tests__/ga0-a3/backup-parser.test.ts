import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import Database from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";

import { parseBrokerExecutionCsv } from "../../../execution-sources/csv/broker-execution-csv-import";
import { validateParserHardeningInput } from "../../ingestion";
import { createWalSafeSqliteBackup, restoreAndVerifySqliteBackup, type RestoreTruthProbeResult } from "../../recovery";
import type { CanonicalContentDigest } from "../../domain";
import type { CanonicalUtcTimestamp } from "../../domain/canonical";

const roots: string[] = [];
const digest = (domain: string, value: string) => `ti_v3:${domain}:v1:sha256:${value.repeat(64)}` as CanonicalContentDigest;

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("GA0-A3 WAL-safe backup and restore", () => {
  it("preserves representative canonical truth and exact reconstruction through an isolated restore", async () => {
    const root = mkdtempSync(join(tmpdir(), "ti-v3-ga0-a3-")); roots.push(root);
    const sourcePath = join(root, "owner.sqlite");
    const backupPath = join(root, "owner.backup.sqlite");
    const restoredPath = join(root, "isolated-restored.sqlite");
    const database = new Database(sourcePath);
    database.pragma("journal_mode = WAL");
    database.exec("CREATE TABLE truth(kind TEXT NOT NULL, digest TEXT NOT NULL); CREATE TABLE reconstruction(digest TEXT NOT NULL)");
    database.prepare("INSERT INTO truth(kind, digest) VALUES (?, ?)").run("execution", digest("canonical_execution", "1"));
    database.prepare("INSERT INTO truth(kind, digest) VALUES (?, ?)").run("manifest", digest("dataset_manifest", "2"));
    database.prepare("INSERT INTO truth(kind, digest) VALUES (?, ?)").run("snapshot", digest("analysis_snapshot", "3"));
    database.prepare("INSERT INTO reconstruction(digest) VALUES (?)").run(digest("canonical_content", "4"));
    const backup = await createWalSafeSqliteBackup({ sourcePath, destinationPath: backupPath, repositoryRoot: process.cwd(), syntheticTestMode: true });
    expect(backup.ok).toBe(true);
    const probe = (db: Database.Database): RestoreTruthProbeResult => ({
      executionDigests: db.prepare("SELECT digest FROM truth WHERE kind = 'execution'").all().map((row) => (row as { digest: CanonicalContentDigest }).digest),
      manifestDigests: db.prepare("SELECT digest FROM truth WHERE kind = 'manifest'").all().map((row) => (row as { digest: CanonicalContentDigest }).digest),
      snapshotDigests: db.prepare("SELECT digest FROM truth WHERE kind = 'snapshot'").all().map((row) => (row as { digest: CanonicalContentDigest }).digest),
      exactReconstructionDigest: (db.prepare("SELECT digest FROM reconstruction").get() as { digest: CanonicalContentDigest }).digest,
    });
    const restored = await restoreAndVerifySqliteBackup({ backupPath, isolatedDestinationPath: restoredPath, repositoryRoot: process.cwd(), testedAt: "2026-07-18T22:00:00.000000000Z" as CanonicalUtcTimestamp, syntheticTestMode: true, probe });
    expect(restored.ok && restored.value.record.integrityStatus).toBe("ok");
    expect(restored.ok && restored.value.record.executionDigests).toEqual([digest("canonical_execution", "1")]);
    database.close();
  });

  it("rejects unsafe overwrite paths", async () => {
    const root = mkdtempSync(join(tmpdir(), "ti-v3-ga0-a3-")); roots.push(root);
    const sourcePath = join(root, "owner.sqlite");
    new Database(sourcePath).close();
    expect(await createWalSafeSqliteBackup({ sourcePath, destinationPath: sourcePath, repositoryRoot: process.cwd(), syntheticTestMode: true })).toMatchObject({ ok: false, error: { code: "ti_v3_backup_same_path_forbidden" } });
  });
});

describe("GA0-A3 parser hardening", () => {
  it.each([
    ["duplicate raw headers", "Date,Symbol,Symbol,Side,Quantity,Price\n2026-01-01,AAPL,AAPL,Buy,1,10", "ti_v3_parser_duplicate_raw_header"],
    ["duplicate normalized headers", "Date,Symbol,Execution ID,Execution-ID,Side,Quantity,Price\n2026-01-01,AAPL,E1,E1,Buy,1,10", "ti_v3_parser_duplicate_normalized_header"],
    ["unclosed quote", 'Date,Symbol,Side,Quantity,Price\n2026-01-01,"AAPL,Buy,1,10', "ti_v3_parser_unclosed_quote"],
    ["inconsistent width", "Date,Symbol,Side,Quantity,Price\n2026-01-01,AAPL,Buy,1", "ti_v3_parser_inconsistent_row_width"],
    ["ambiguous delimiter", "Date,Symbol;Side\n2026-01-01,AAPL;Buy", "ti_v3_parser_ambiguous_delimiter"],
    ["conflicting execution IDs", "Date,Symbol,Side,Quantity,Price,Execution ID\n2026-01-01,AAPL,Buy,1,10,E1\n2026-01-01,AAPL,Buy,2,10,E1", "ti_v3_parser_conflicting_duplicate_execution_id"],
  ])("rejects %s", (_name, csv, code) => {
    expect(validateParserHardeningInput(csv).issues).toContainEqual(expect.objectContaining({ code }));
  });

  it("rejects unsupported encoding, mapping collisions, controls, and oversized cells", () => {
    expect(validateParserHardeningInput(new Uint8Array([0xff, 0xfe, 0x41, 0x00])).issues[0]?.code).toBe("ti_v3_parser_unsupported_encoding");
    expect(validateParserHardeningInput("Date,Symbol,Side,Quantity,Price\n2026-01-01,AAPL,Buy,1,10", { symbol: "Ticker", instrument: "Ticker" }).issues).toContainEqual(expect.objectContaining({ code: "ti_v3_parser_mapping_collision" }));
    expect(validateParserHardeningInput("Date,Symbol,Side,Quantity,Price\n2026-01-01,AAPL\u0001,Buy,1,10").issues).toContainEqual(expect.objectContaining({ code: "ti_v3_parser_control_character" }));
    expect(validateParserHardeningInput(`Date,Symbol,Side,Quantity,Price\n2026-01-01,${"A".repeat(100_001)},Buy,1,10`).issues).toContainEqual(expect.objectContaining({ code: "ti_v3_parser_oversized_cell" }));
  });

  it("terminates immediately at payload and cell limits", () => {
    const oversized = validateParserHardeningInput("Date,Symbol;Side\n" + "A".repeat(10_000_001));
    expect(oversized).toEqual({ ok: false, delimiter: null, issues: [{ code: "ti_v3_parser_payload_oversized" }] });
    const oversizedCell = validateParserHardeningInput(`Date,Symbol,Side,Quantity,Price\n2026-01-01,"${"A".repeat(100_001)}`);
    expect(oversizedCell.issues).toEqual([{ code: "ti_v3_parser_oversized_cell", rowIndex: 2 }]);
  });

  it("prevents the existing importer from silently accepting ambiguous truth", () => {
    const result = parseBrokerExecutionCsv({ broker: "generic_execution_csv", csvText: "Date,Symbol,Symbol,Side,Quantity,Price\n2026-01-01,AAPL,MSFT,Buy,1,10" });
    expect(result.executions).toEqual([]);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "parser_duplicate_raw_header", severity: "error" }));
  });
});
