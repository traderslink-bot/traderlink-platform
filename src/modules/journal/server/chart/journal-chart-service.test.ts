import {openPristinePlatformTestDatabase,setPlatformTestFixtureMigrationTime} from '@/src/test/pristine-platform-test-database';
import { removePlatformDatabaseTestFixture } from "@/src/test/platform-database-fixture";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { chartJournalDay, readChartJournal, readChartJournalPlot, saveChartJournalItem } from "./journal-chart-service";

const id = (value: number) => `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`;
const at = "2026-11-13T18:01:37.000Z";
const owner = { userId: id(1), workspaceId: id(2), accountId: id(3), workspaceRole: "owner" as const };

async function fixture(run: (db: ReturnType<typeof openPlatformDatabase>) => void) {
  const dir = mkdtempSync(join(tmpdir(), "traderlink-chart-journal-"));
  const db = openPristinePlatformTestDatabase({ mode: "initializer", databasePath: join(dir, "scratch.sqlite"), forbiddenRepositoryRoots: [] });
  try {
    setPlatformTestFixtureMigrationTime(db, () => new Date(at));
    db.prepare(`INSERT INTO platform_users(user_id,auth_provider,auth_subject,display_name,status,created_at_utc,updated_at_utc)
      VALUES (?, 'test','chart-journal','Test','active',?,?)`).run(owner.userId, at, at);
    db.prepare(`INSERT INTO platform_workspaces(workspace_id,display_name,default_trading_timezone,status,created_at_utc,updated_at_utc)
      VALUES (?, 'Test','America/New_York','active',?,?)`).run(owner.workspaceId, at, at);
    for (const accountId of [owner.accountId, id(4)]) {
      db.prepare(`INSERT INTO journal_accounts(account_id,workspace_id,display_name,base_currency,trading_timezone,status,created_by_user_id,created_at_utc,updated_at_utc)
        VALUES (?, ?, 'Test','USD','America/New_York','active',?,?,?)`).run(accountId, owner.workspaceId, owner.userId, at, at);
    }
    run(db);
    expect(db.pragma("foreign_key_check")).toEqual([]);
  } finally {
    db.close();
    await removePlatformDatabaseTestFixture(dir);
  }
}

describe("Chart Journal storage", () => {
  it("uses the full Eastern date through both daylight-saving transitions", () => {
    expect(chartJournalDay("2026-03-08")).toEqual({
      day: "2026-03-08", start: "2026-03-08T05:00:00.000Z", end: "2026-03-09T04:00:00.000Z",
    });
    expect(chartJournalDay("2026-11-01")).toEqual({
      day: "2026-11-01", start: "2026-11-01T04:00:00.000Z", end: "2026-11-02T05:00:00.000Z",
    });
    expect(() => chartJournalDay("2026-02-30")).toThrow();
  });

  it("retains standalone notes, retries safely, and isolates reads and edits by account", () => fixture((db) => {
    const note = { id: id(8), at, kind: "note", symbol: "SHFS", text: "Passed on the setup.", roundTripId: null, expectedRevision: null };
    const saved = saveChartJournalItem(db, owner, note, new Date(at));
    expect(saved).toMatchObject({ id: note.id, text: note.text, revision: 1, roundTripId: null });
    expect(saveChartJournalItem(db, owner, note, new Date(at))).toEqual(saved);
    const other = { ...owner, accountId: id(4) };
    const read = (scope = owner, symbol = "SHFS") => readChartJournal(db, scope, { day: "2026-11-13", symbol, page: 0 }, () => "versioned");
    expect(read().items).toEqual([saved]);
    expect(read(other).items).toEqual([]);
    expect(read(owner, "ZBAO").items).toEqual([]);
    expect(() => saveChartJournalItem(db, other, { ...note, expectedRevision: 1, text: "Changed" }, new Date(at))).toThrow();
    expect(() => saveChartJournalItem(db, owner, { ...note, roundTripId: id(99), expectedRevision: 1 }, new Date(at))).toThrow();
    expect(saveChartJournalItem(db, owner, { ...note, expectedRevision: 1, text: "Changed" }, new Date(at)).revision).toBe(2);
    expect(readChartJournalPlot(db, owner, { day: "2026-11-13", symbol: "SHFS", mode: "notes" }).notes)
      .toMatchObject([{ text: "Changed", id: note.id }]);
    expect(readChartJournalPlot(db, other, { day: "2026-11-13", symbol: "SHFS", mode: "notes" }).notes).toEqual([]);
    expect(read().fills).toEqual([]);
  }));

  it("reads system and trader executions while excluding superseded versions", () => fixture((db) => {
    db.prepare(`INSERT INTO journal_instruments(instrument_id,workspace_id,asset_class,normalized_symbol,quote_currency,status,created_at_utc,updated_at_utc)
      VALUES (?,?,'stock','SHFS','USD','active',?,?)`).run(id(10), owner.workspaceId, at, at);
    const execute = (n: number, actor: "system" | "user", state: "accepted" | "superseded") => {
      const execution = id(n), version = id(n + 1);
      db.transaction(() => {
        db.prepare(`INSERT INTO journal_executions(execution_id,workspace_id,account_id,current_version_id,current_state,created_at_utc,updated_at_utc)
          VALUES (?,?,?,?,?,?,?)`).run(execution, owner.workspaceId, owner.accountId, version, state, at, at);
        db.prepare(`INSERT INTO journal_execution_versions(execution_version_id,workspace_id,account_id,execution_id,version_number,
          instrument_id,trade_currency,source_timestamp_text,source_timezone,time_parser_version,executed_at_utc,source_order_key,side,
          quantity_decimal,price_decimal,fee_sign_convention,fact_completeness,actor_kind,actor_user_id,change_reason_code,created_at_utc)
          VALUES (?,?,?,?,1,?,'USD',?,'America/New_York','test_time_v1',?,?,'buy','1','0.0277','not_reported','complete',?,?,?,?)`)
          .run(version, owner.workspaceId, owner.accountId, execution, id(10), at, at, String(n), actor, actor === "user" ? owner.userId : null,
            actor === "system" ? "broker_import" : "manual_entry", at);
      })();
    };
    execute(20, "system", "accepted");
    execute(30, "user", "accepted");
    execute(40, "system", "superseded");
    const base = { day: "2026-11-13", symbol: "SHFS", page: 0 };
    const result = readChartJournal(db, owner, base, () => "versioned");
    expect(result.fills.map(({ id, price }) => ({ id, price }))).toEqual([{ id: id(20), price: "0.0277" }, { id: id(30), price: "0.0277" }]);
    const plotted = readChartJournalPlot(db, owner, { ...base, mode: "fills" });
    expect(plotted).toEqual({ notes: [], fills: [id(20), id(30)].map(fill => ({ id: fill, side: "buy", executedAt: at })) });
    expect(readChartJournalPlot(db, owner, { ...base, mode: "notes" }).fills).toEqual([]);
    expect(readChartJournalPlot(db, owner, { ...base, symbol: "AAPL", mode: "fills" }).fills).toEqual([]);
    expect(readChartJournalPlot(db, { ...owner, accountId: id(4) }, { ...base, mode: "fills" }).fills).toEqual([]);
    expect(readChartJournal(db, { ...owner, accountId: id(4) }, base, () => "versioned").fills).toEqual([]);
  }));
});
