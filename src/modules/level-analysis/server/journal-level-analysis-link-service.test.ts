import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import type Database from "better-sqlite3";

import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { journalLevelAnalysisTradeLinkContainsRawPayload } from "@/src/lib/level-analysis/level-analysis-journal-delivery-trade-link-contract";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";

import { JournalLevelAnalysisLinkRepository } from "./journal-level-analysis-link-repository";
import { readJournalLevelAnalysisLinkRequest } from "./journal-level-analysis-link-request";
import { JournalLevelAnalysisLinkService } from "./journal-level-analysis-link-service";
import { LevelAnalysisDeliveryRepository } from "./level-analysis-delivery-repository";
import { LevelAnalysisDeliveryService } from "./level-analysis-delivery-service";

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function id(sequence: number): string {
  return `00000000-0000-4000-8000-${String(sequence).padStart(12, "0")}`;
}

function digest(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

const now = "2026-08-02T12:00:00.000Z";
const userId = id(1);
const workspaceId = id(2);
const accountA = id(10);
const accountB = id(20);

function scope(accountId: string): AccountScope {
  return Object.freeze({ userId, workspaceId, workspaceRole: "owner" as const, accountId });
}

function fixture(): unknown {
  return JSON.parse(readFileSync(resolve(
    process.cwd(),
    "src/lib/level-analysis/__fixtures__/level-analysis-journal-delivery-package-v1.compact.json",
  ), "utf8")) as unknown;
}

function setup(): Database.Database {
  const root = mkdtempSync(join(tmpdir(), "traderlink-level-link-"));
  roots.push(root);
  const database = openPlatformDatabase({
    mode: "initializer",
    databasePath: join(root, "platform.sqlite"),
    forbiddenRepositoryRoots: [],
  });
  runPlatformMigrations(database, { now: () => new Date(now) });
  database.transaction(() => {
    database.prepare(`INSERT INTO platform_users (
  user_id, auth_provider, auth_subject, display_name, status, created_at_utc, updated_at_utc
) VALUES (?, 'test', 'owner', 'Owner', 'active', ?, ?)`).run(userId, now, now);
    database.prepare(`INSERT INTO platform_workspaces (
  workspace_id, display_name, default_trading_timezone, status, created_at_utc, updated_at_utc
) VALUES (?, 'Workspace', 'America/New_York', 'active', ?, ?)`).run(workspaceId, now, now);
    database.prepare(`INSERT INTO platform_workspace_memberships (
  workspace_id, user_id, role, status, created_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, 'owner', 'active', ?, ?, ?)`).run(workspaceId, userId, userId, now, now);
    for (const accountId of [accountA, accountB]) {
      database.prepare(`INSERT INTO journal_accounts (
  account_id, workspace_id, display_name, base_currency, trading_timezone,
  status, created_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, 'Journal', 'USD', 'America/New_York', 'active', ?, ?, ?)`)
        .run(accountId, workspaceId, userId, now, now);
    }
  }).immediate();
  return database;
}

function seedRoundTrip(
  database: Database.Database,
  accountId: string,
  sequence: number,
  closedAt = "2026-08-02T14:00:00.000Z",
): string {
  const instrumentId = id(sequence);
  const rebuildId = id(sequence + 1);
  const roundTripId = id(sequence + 2);
  const versionId = id(sequence + 3);
  const openedAt = new Date(Date.parse(closedAt) - 30 * 60 * 1000).toISOString();
  database.transaction(() => {
    database.prepare(`INSERT INTO journal_instruments (
  instrument_id, workspace_id, asset_class, normalized_symbol, quote_currency,
  venue, identity_scheme_version, provider_identity_sha256, status, created_at_utc, updated_at_utc
) VALUES (?, ?, 'stock', 'DEVS', 'USD', NULL, NULL, NULL, 'active', ?, ?)`)
      .run(instrumentId, workspaceId, now, now);
    database.prepare(`INSERT INTO journal_chain_rebuilds (
  rebuild_id, workspace_id, account_id, instrument_id, trade_currency,
  chain_key_sha256, trigger_kind, trigger_import_event_id, trigger_decision_event_id,
  maintenance_reason_code, previous_rebuild_id, algorithm_version,
  ordered_input_sha256, output_sha256, coverage_state, ready_closed_count,
  legitimate_open_count, needs_decision_count, excluded_count,
  first_execution_at_utc, last_execution_at_utc, completed_at_utc
) VALUES (?, ?, ?, ?, 'USD', ?, 'maintenance', NULL, NULL, 'level_analysis_test',
  NULL, 'round_trip_v1', ?, ?, 'complete', 1, 0, 0, 0, ?, ?, ?)`)
      .run(rebuildId, workspaceId, accountId, instrumentId, digest(`chain-${sequence}`),
        digest(`input-${sequence}`), digest(`output-${sequence}`),
        openedAt, closedAt, now);
    database.prepare(`INSERT INTO journal_round_trips (
  round_trip_id, workspace_id, account_id, current_version_id,
  lifecycle_state, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, 'active', ?, ?)`).run(
      roundTripId, workspaceId, accountId, versionId, now, now,
    );
    database.prepare(`INSERT INTO journal_round_trip_versions (
  round_trip_version_id, workspace_id, account_id, round_trip_id, version_number,
  rebuild_id, instrument_id, trade_currency, chain_key_sha256, direction,
  opened_at_utc, closed_at_utc, final_position_decimal, projection_state,
  coverage_reason_code, projection_fingerprint_sha256, created_at_utc
) VALUES (?, ?, ?, ?, 1, ?, ?, 'USD', ?, 'long', ?,
  ?, '0', 'ready_closed', NULL, ?, ?)`).run(
      versionId, workspaceId, accountId, roundTripId, rebuildId, instrumentId,
      digest(`chain-${sequence}`), openedAt, closedAt, digest(`projection-${sequence}`), now,
    );
  }).immediate();
  return roundTripId;
}

describe("replacement Journal Level Analysis links", () => {
  it("accepts only opaque account selection and stable trade coordinates from the browser", async () => {
    await expect(readJournalLevelAnalysisLinkRequest(new Request("http://local", {
      method: "POST",
      body: JSON.stringify({
        roundTripId: id(102),
        expectedAccountSelectionRef: "a".repeat(64),
        provider: "ibkr",
      }),
    }))).resolves.toEqual({
      roundTripId: id(102),
      expectedAccountSelectionRef: "a".repeat(64),
      provider: "ibkr",
      deliveryId: undefined,
      linkSource: undefined,
    });
    await expect(readJournalLevelAnalysisLinkRequest(new Request("http://local", {
      method: "POST",
      body: JSON.stringify({
        roundTripId: id(102),
        expectedAccountSelectionRef: "a".repeat(64),
        provider: "ibkr",
        accountId: accountA,
      }),
    }))).rejects.toThrowError("TRADERLINK_LEVEL_ANALYSIS_LINK_INVALID");
  });

  it("derives the selected-account trade, links accepted facts, and is idempotent", () => {
    const database = setup();
    try {
      const deliveryRepository = new LevelAnalysisDeliveryRepository(database);
      const delivery = new LevelAnalysisDeliveryService(
        deliveryRepository,
        ["ibkr"],
        () => new Date(now),
      ).ingest(fixture());
      expect(delivery.status).toBe("accepted");
      const roundTripId = seedRoundTrip(database, accountA, 100);
      const service = new JournalLevelAnalysisLinkService(
        deliveryRepository,
        new JournalLevelAnalysisLinkRepository(database),
        ["ibkr"],
        () => new Date(now),
      );
      expect(service.resolve(scope(accountA), { roundTripId, provider: "ibkr" }))
        .toMatchObject({ status: "matched", symbol: "DEVS" });
      const first = service.link(scope(accountA), { roundTripId, provider: "ibkr" });
      const duplicate = service.link(scope(accountA), { roundTripId, provider: "ibkr" });
      expect(first).toMatchObject({ status: "linked", duplicate: false, symbol: "DEVS" });
      expect(duplicate).toMatchObject({
        status: "linked",
        duplicate: true,
        linkId: first.linkId,
      });
      expect(database.prepare(
        "SELECT COUNT(*) AS count FROM journal_round_trip_level_analysis_links",
      ).get()).toEqual({ count: 1 });
      expect(database.prepare(
        "SELECT COUNT(*) AS count FROM journal_round_trip_level_analysis_link_versions",
      ).get()).toEqual({ count: 1 });
      const facts = service.facts(scope(accountA), roundTripId);
      expect(facts.availability.availability).toBe("attached");
      expect(facts.availability.linkId).toBe(first.linkId);
      expect(journalLevelAnalysisTradeLinkContainsRawPayload(facts)).toBe(false);
      expect(() => database.prepare(`
UPDATE journal_round_trip_level_analysis_link_versions SET provider = 'changed'`).run())
        .toThrow();
    } finally {
      database.close();
    }
  });

  it("blocks disallowed, future, and cross-account relationships without writing", () => {
    const database = setup();
    try {
      const deliveries = new LevelAnalysisDeliveryRepository(database);
      new LevelAnalysisDeliveryService(
        deliveries,
        ["ibkr"],
        () => new Date(now),
      ).ingest(fixture());
      const futureRoundTrip = seedRoundTrip(
        database,
        accountA,
        200,
        "2026-05-01T14:00:00.000Z",
      );
      const service = new JournalLevelAnalysisLinkService(
        deliveries,
        new JournalLevelAnalysisLinkRepository(database),
        ["ibkr"],
        () => new Date(now),
      );
      expect(service.resolve(scope(accountA), {
        roundTripId: futureRoundTrip,
        provider: "blocked_provider",
      })).toMatchObject({ status: "blocked", matchResult: { reason: "provider_not_allowed" } });
      expect(service.resolve(scope(accountA), {
        roundTripId: futureRoundTrip,
        provider: "ibkr",
      })).toMatchObject({
        status: "blocked",
        matchResult: { reason: "as_of_after_allowed_boundary" },
      });
      expect(() => service.forTrade(scope(accountB), futureRoundTrip))
        .toThrowError("TRADERLINK_LEVEL_ANALYSIS_LINK_INVALID");
      expect(database.prepare(
        "SELECT COUNT(*) AS count FROM journal_round_trip_level_analysis_links",
      ).get()).toEqual({ count: 0 });
    } finally {
      database.close();
    }
  });

  it("rejects a stale round-trip version at the write boundary", () => {
    const database = setup();
    try {
      const deliveries = new LevelAnalysisDeliveryRepository(database);
      new LevelAnalysisDeliveryService(
        deliveries,
        ["ibkr"],
        () => new Date(now),
      ).ingest(fixture());
      const roundTripId = seedRoundTrip(database, accountA, 300);
      let raced = false;
      class RaceRepository extends JournalLevelAnalysisLinkRepository {
        override save(
          ...args: Parameters<JournalLevelAnalysisLinkRepository["save"]>
        ): ReturnType<JournalLevelAnalysisLinkRepository["save"]> {
          if (!raced) {
            raced = true;
            const oldVersionId = args[1].roundTripVersionId;
            const nextVersionId = id(399);
            database.transaction(() => {
              database.prepare(`INSERT INTO journal_round_trip_versions (
  round_trip_version_id, workspace_id, account_id, round_trip_id, version_number,
  rebuild_id, instrument_id, trade_currency, chain_key_sha256, direction,
  opened_at_utc, closed_at_utc, final_position_decimal, projection_state,
  coverage_reason_code, projection_fingerprint_sha256, created_at_utc
)
SELECT ?, workspace_id, account_id, round_trip_id, version_number + 1,
       rebuild_id, instrument_id, trade_currency, chain_key_sha256, direction,
       opened_at_utc, closed_at_utc, final_position_decimal, projection_state,
       coverage_reason_code, ?, created_at_utc
FROM journal_round_trip_versions WHERE round_trip_version_id = ?`)
                .run(nextVersionId, digest("raced-projection"), oldVersionId);
              database.prepare(`UPDATE journal_round_trips
SET current_version_id = ?, updated_at_utc = ?
WHERE workspace_id = ? AND account_id = ? AND round_trip_id = ?`)
                .run(nextVersionId, now, workspaceId, accountA, roundTripId);
            }).immediate();
          }
          return super.save(...args);
        }
      }
      const service = new JournalLevelAnalysisLinkService(
        deliveries,
        new RaceRepository(database),
        ["ibkr"],
        () => new Date(now),
      );
      expect(() => service.link(scope(accountA), { roundTripId, provider: "ibkr" }))
        .toThrowError("TRADERLINK_LEVEL_ANALYSIS_LINK_CONFLICT");
      expect(database.prepare(
        "SELECT COUNT(*) AS count FROM journal_round_trip_level_analysis_links",
      ).get()).toEqual({ count: 0 });
    } finally {
      database.close();
    }
  });
});
