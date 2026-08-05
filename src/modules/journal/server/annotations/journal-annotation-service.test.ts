import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type Database from "better-sqlite3";

import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { deriveJournalAccountSelectionRef } from "@/src/modules/platform/contracts/journal-account-selection";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";

import { JournalAnnotationRepository } from "./journal-annotation-repository";
import { JournalAnnotationService } from "./journal-annotation-service";
import { JournalRuleRepository } from "./journal-rule-repository";
import {
  JOURNAL_RULE_TEMPLATE_CATALOG,
  mutateJournalTradingRules,
  readJournalTradingRulesDashboard,
} from "./journal-trading-rules-dashboard";

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

function id(sequence: number): string {
  return `00000000-0000-4000-8000-${String(sequence).padStart(12, "0")}`;
}

function digest(value: string): string {
  return value.repeat(64);
}

const at = "2026-08-02T12:00:00.000Z";
const workspaceId = id(2);
const userId = id(1);

function accountScope(accountId: string): AccountScope {
  return Object.freeze({
    userId,
    workspaceId,
    workspaceRole: "owner" as const,
    accountId,
  });
}

function seedAccountGraph(
  database: Database.Database,
  sequence: number,
): Readonly<{ scope: AccountScope; dayId: string; roundTripId: string }> {
  const accountId = id(sequence);
  const instrumentId = id(sequence + 1);
  const rebuildId = id(sequence + 2);
  const roundTripId = id(sequence + 3);
  const roundTripVersionId = id(sequence + 4);
  const dayId = id(sequence + 5);
  database.prepare(`INSERT INTO journal_accounts (
  account_id, workspace_id, display_name, base_currency, trading_timezone,
  status, created_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, 'USD', 'America/New_York', 'active', ?, ?, ?)`)
    .run(accountId, workspaceId, `Account ${sequence}`, userId, at, at);
  database.prepare(`INSERT INTO journal_instruments (
  instrument_id, workspace_id, asset_class, normalized_symbol, quote_currency,
  venue, identity_scheme_version, provider_identity_sha256, status,
  created_at_utc, updated_at_utc
) VALUES (?, ?, 'stock', ?, 'USD', NULL, NULL, NULL, 'active', ?, ?)`)
    .run(instrumentId, workspaceId, `T${sequence}`, at, at);
  database.prepare(`INSERT INTO journal_chain_rebuilds (
  rebuild_id, workspace_id, account_id, instrument_id, trade_currency,
  chain_key_sha256, trigger_kind, trigger_import_event_id,
  trigger_decision_event_id, maintenance_reason_code, previous_rebuild_id,
  algorithm_version, ordered_input_sha256, output_sha256, coverage_state,
  ready_closed_count, legitimate_open_count, needs_decision_count,
  excluded_count, first_execution_at_utc, last_execution_at_utc,
  completed_at_utc
) VALUES (?, ?, ?, ?, 'USD', ?, 'maintenance', NULL, NULL,
  'annotation_test', NULL, 'round_trip_v1', ?, ?, 'complete', 1, 0, 0, 0,
  ?, ?, ?)`)
    .run(rebuildId, workspaceId, accountId, instrumentId, digest("a"),
      digest("b"), digest("c"), at, at, at);
  database.prepare(`INSERT INTO journal_round_trips (
  round_trip_id, workspace_id, account_id, current_version_id,
  lifecycle_state, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, 'active', ?, ?)`)
    .run(roundTripId, workspaceId, accountId, roundTripVersionId, at, at);
  database.prepare(`INSERT INTO journal_round_trip_versions (
  round_trip_version_id, workspace_id, account_id, round_trip_id,
  version_number, rebuild_id, instrument_id, trade_currency,
  chain_key_sha256, direction, opened_at_utc, closed_at_utc,
  final_position_decimal, projection_state, coverage_reason_code,
  projection_fingerprint_sha256, created_at_utc
) VALUES (?, ?, ?, ?, 1, ?, ?, 'USD', ?, 'long', ?, ?, '0',
  'ready_closed', NULL, ?, ?)`)
    .run(roundTripVersionId, workspaceId, accountId, roundTripId,
      rebuildId, instrumentId, digest("a"), at, at, digest("d"), at);
  database.prepare(`INSERT INTO journal_trading_days (
  trading_day_id, workspace_id, account_id, trading_date, trading_timezone,
  status, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, '2026-08-02', 'America/New_York', 'active', ?, ?)`)
    .run(dayId, workspaceId, accountId, at, at);
  return Object.freeze({ scope: accountScope(accountId), dayId, roundTripId });
}

function setup(): Readonly<{
  database: Database.Database;
  service: JournalAnnotationService;
  repository: JournalAnnotationRepository;
  first: ReturnType<typeof seedAccountGraph>;
  second: ReturnType<typeof seedAccountGraph>;
}> {
  const root = mkdtempSync(join(tmpdir(), "traderlink-annotations-"));
  roots.push(root);
  const database = openPlatformDatabase({
    mode: "initializer",
    databasePath: join(root, "journal.sqlite"),
    forbiddenRepositoryRoots: [],
  });
  runPlatformMigrations(database, { now: () => new Date(at) });
  database.exec("BEGIN IMMEDIATE");
  database.prepare(`INSERT INTO platform_users (
  user_id, auth_provider, auth_subject, display_name, status,
  created_at_utc, updated_at_utc
) VALUES (?, 'test', 'owner', 'Owner', 'active', ?, ?)`)
    .run(userId, at, at);
  database.prepare(`INSERT INTO platform_workspaces (
  workspace_id, display_name, default_trading_timezone, status,
  created_at_utc, updated_at_utc
) VALUES (?, 'Workspace', 'America/New_York', 'active', ?, ?)`)
    .run(workspaceId, at, at);
  database.prepare(`INSERT INTO platform_workspace_memberships (
  workspace_id, user_id, role, status, created_by_user_id,
  created_at_utc, updated_at_utc
) VALUES (?, ?, 'owner', 'active', ?, ?, ?)`)
    .run(workspaceId, userId, userId, at, at);
  const first = seedAccountGraph(database, 10);
  const second = seedAccountGraph(database, 30);
  database.exec("COMMIT");
  const repository = new JournalAnnotationRepository(database);
  return Object.freeze({
    database,
    repository,
    service: new JournalAnnotationService(
      repository,
      new JournalRuleRepository(database),
    ),
    first,
    second,
  });
}

describe("Journal annotation service", () => {
  it("keeps user-defined Journal accounts isolated from broker provenance", () => {
    const context = setup();
    context.database.prepare(`INSERT INTO journal_account_source_identities (
  source_identity_id, workspace_id, account_id, source_system,
  fingerprint_scheme_version, source_account_canonicalization_version,
  hmac_key_version, source_account_fingerprint, privacy_safe_display,
  status, first_seen_at_utc, last_seen_at_utc
) VALUES (?, ?, ?, ?, 'hmac-sha256-v1', 'source_account_v1', 'test_v1', ?, ?,
  'active_current', ?, ?)`)
      .run(id(100), workspaceId, context.first.scope.accountId, "ibkr",
        digest("e"), "Imported source 1", at, at);
    context.database.prepare(`INSERT INTO journal_account_source_identities (
  source_identity_id, workspace_id, account_id, source_system,
  fingerprint_scheme_version, source_account_canonicalization_version,
  hmac_key_version, source_account_fingerprint, privacy_safe_display,
  status, first_seen_at_utc, last_seen_at_utc
) VALUES (?, ?, ?, ?, 'hmac-sha256-v1', 'source_account_v1', 'test_v1', ?, ?,
  'active_current', ?, ?)`)
      .run(id(101), workspaceId, context.first.scope.accountId, "moomoo",
        digest("f"), "Imported source 2", at, at);
    expect((context.database.prepare(`SELECT COUNT(*) AS count
FROM journal_account_source_identities
WHERE workspace_id = ? AND account_id = ?`).get(
      workspaceId,
      context.first.scope.accountId,
    ) as { count: number }).count).toBe(2);
    const firstTag = context.service.createTag(context.first.scope, {
      name: "Momentum",
      now: new Date(at),
    });
    context.service.createTag(context.second.scope, {
      name: "Momentum",
      now: new Date(at),
    });
    context.service.replaceRoundTripTags(context.first.scope, {
      roundTripId: context.first.roundTripId,
      tagIds: [firstTag.tagId],
      now: new Date(at),
    });
    expect(context.service.listTagsForRoundTrips(
      context.first.scope,
      [context.first.roundTripId],
    )[context.first.roundTripId]).toHaveLength(1);
    expect(context.service.listTagsForRoundTrips(
      context.second.scope,
      [context.second.roundTripId],
    )[context.second.roundTripId]).toEqual([]);
    expect(() => context.service.replaceRoundTripTags(context.second.scope, {
      roundTripId: context.second.roundTripId,
      tagIds: [firstTag.tagId],
    })).toThrowError("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
    context.database.close();
  });

  it("retains tag history and enforces ten active tags in service and schema", () => {
    const context = setup();
    const tags = Array.from({ length: 11 }, (_, index) =>
      context.service.createTag(context.first.scope, {
        name: `Tag ${index + 1}`,
        now: new Date(at),
      }));
    context.service.replaceRoundTripTags(context.first.scope, {
      roundTripId: context.first.roundTripId,
      tagIds: tags.slice(0, 10).map((tag) => tag.tagId),
      now: new Date(at),
    });
    expect(() => context.service.replaceRoundTripTags(context.first.scope, {
      roundTripId: context.first.roundTripId,
      tagIds: tags.map((tag) => tag.tagId),
    })).toThrowError("TRADERLINK_JOURNAL_ANNOTATION_INVALID");
    expect(() => context.repository.insertAssignment({
      scope: context.first.scope,
      roundTripId: context.first.roundTripId,
      tagId: tags[10].tagId,
      assignmentId: id(80),
      eventId: id(81),
      timestamp: at,
    })).toThrowError("journal_round_trip_tag_limit");
    const renamed = context.service.renameTag(context.first.scope, {
      tagId: tags[0].tagId,
      expectedRevision: tags[0].revision,
      name: "Renamed",
      now: new Date("2026-08-02T12:01:00.000Z"),
    });
    context.service.retireTag(context.first.scope, {
      tagId: renamed.tagId,
      expectedRevision: renamed.revision,
      now: new Date("2026-08-02T12:02:00.000Z"),
    });
    expect(context.database.prepare(`SELECT COUNT(*) AS count
FROM journal_tag_versions WHERE tag_id = ?`).get(renamed.tagId)).toEqual({
      count: 3,
    });
    context.database.close();
  });

  it("creates selected preset tags atomically inside one Journal account", () => {
    const context = setup();
    const custom = context.service.createTag(context.first.scope, {
      name: "My custom tag",
      now: new Date(at),
    });
    const assigned = context.service.replaceRoundTripTagsWithPresets(
      context.first.scope,
      {
        roundTripId: context.first.roundTripId,
        tagIds: [custom.tagId],
        presetKeys: ["setup_breakout", "emotion_calm"],
        now: new Date(at),
      },
    );
    expect(assigned.map((tag) => tag.name).sort()).toEqual([
      "Breakout",
      "Calm",
      "My custom tag",
    ]);
    expect(context.service.listTags(context.first.scope)).toHaveLength(3);
    expect(context.service.listTags(context.second.scope)).toHaveLength(0);

    const repeated = context.service.replaceRoundTripTagsWithPresets(
      context.first.scope,
      {
        roundTripId: context.first.roundTripId,
        tagIds: [custom.tagId],
        presetKeys: ["setup_breakout", "emotion_calm"],
        now: new Date("2026-08-02T12:01:00.000Z"),
      },
    );
    expect(repeated).toHaveLength(3);
    expect(context.service.listTags(context.first.scope)).toHaveLength(3);
    expect(() => context.service.replaceRoundTripTagsWithPresets(
      context.first.scope,
      {
        roundTripId: context.first.roundTripId,
        tagIds: [],
        presetKeys: ["not_a_preset"],
      },
    )).toThrowError("TRADERLINK_JOURNAL_ANNOTATION_INVALID");
    context.database.close();
  });

  it("versions daily and individual-trade notes with stale-write rejection", () => {
    const context = setup();
    const first = context.service.saveDailyNote(context.first.scope, {
      tradingDate: "2026-08-02",
      expectedRevision: null,
      whatWorked: "Waited for confirmation.",
      whatNeedsWork: "",
      technicalRecap: "Held the planned level.",
      tomorrowsFocus: "Repeat the process.",
      anythingElse: "",
      now: new Date(at),
    });
    const second = context.service.saveDailyNote(context.first.scope, {
      tradingDate: "2026-08-02",
      expectedRevision: first.revision,
      whatWorked: "Waited for confirmation.",
      whatNeedsWork: "Avoid early entries.",
      technicalRecap: "Held the planned level.",
      tomorrowsFocus: "Repeat the process.",
      anythingElse: "",
      now: new Date("2026-08-02T12:01:00.000Z"),
    });
    expect(second.revision).toBe(2);
    expect(() => context.service.saveDailyNote(context.first.scope, {
      tradingDate: "2026-08-02",
      expectedRevision: first.revision,
      whatWorked: "stale",
      whatNeedsWork: "",
      technicalRecap: "",
      tomorrowsFocus: "",
      anythingElse: "",
    })).toThrowError("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
    const tradeNote = context.service.saveRoundTripNote(context.first.scope, {
      roundTripId: context.first.roundTripId,
      expectedRevision: null,
      technicalNote: "Reclaim held.",
      tradeNote: "Followed the plan.",
      now: new Date(at),
    });
    expect(tradeNote).toMatchObject({ revision: 1, tradeNote: "Followed the plan." });
    expect(context.database.prepare(`SELECT COUNT(*) AS count
FROM journal_daily_note_revisions`).get()).toEqual({ count: 2 });
    context.database.close();
  });

  it("keeps trade annotations on the stable round trip when its projection is rebuilt", () => {
    const context = setup();
    const tag = context.service.createTag(context.first.scope, {
      name: "Breakout",
      now: new Date(at),
    });
    context.service.replaceRoundTripTags(context.first.scope, {
      roundTripId: context.first.roundTripId,
      tagIds: [tag.tagId],
      now: new Date(at),
    });
    context.service.saveRoundTripNote(context.first.scope, {
      roundTripId: context.first.roundTripId,
      expectedRevision: null,
      tradeNote: "Stayed with the planned exit.",
      technicalNote: "Held the breakout level.",
      now: new Date(at),
    });

    const nextRebuildId = id(110);
    const nextVersionId = id(111);
    const rebuiltAt = "2026-08-02T12:05:00.000Z";
    context.database.prepare(`INSERT INTO journal_chain_rebuilds (
  rebuild_id, workspace_id, account_id, instrument_id, trade_currency,
  chain_key_sha256, trigger_kind, trigger_import_event_id,
  trigger_decision_event_id, maintenance_reason_code, previous_rebuild_id,
  algorithm_version, ordered_input_sha256, output_sha256, coverage_state,
  ready_closed_count, legitimate_open_count, needs_decision_count,
  excluded_count, first_execution_at_utc, last_execution_at_utc,
  completed_at_utc
) SELECT ?, workspace_id, account_id, instrument_id, trade_currency,
  chain_key_sha256, 'maintenance', NULL, NULL, 'annotation_rebuild_test',
  rebuild_id, algorithm_version, ?, ?, coverage_state, ready_closed_count,
  legitimate_open_count, needs_decision_count, excluded_count,
  first_execution_at_utc, last_execution_at_utc, ?
FROM journal_chain_rebuilds
WHERE rebuild_id = ?`)
      .run(nextRebuildId, digest("e"), digest("f"), rebuiltAt, id(12));
    context.database.prepare(`INSERT INTO journal_round_trip_versions (
  round_trip_version_id, workspace_id, account_id, round_trip_id,
  version_number, rebuild_id, instrument_id, trade_currency,
  chain_key_sha256, direction, opened_at_utc, closed_at_utc,
  final_position_decimal, projection_state, coverage_reason_code,
  projection_fingerprint_sha256, created_at_utc
) SELECT ?, workspace_id, account_id, round_trip_id, 2, ?, instrument_id,
  trade_currency, chain_key_sha256, direction, opened_at_utc, closed_at_utc,
  final_position_decimal, projection_state, coverage_reason_code, ?, ?
FROM journal_round_trip_versions
WHERE round_trip_version_id = ?`)
      .run(nextVersionId, nextRebuildId, digest("e"), rebuiltAt, id(14));
    context.database.prepare(`UPDATE journal_round_trips
SET current_version_id = ?, updated_at_utc = ?
WHERE round_trip_id = ?`)
      .run(nextVersionId, rebuiltAt, context.first.roundTripId);

    expect(context.service.listTagsForRoundTrips(
      context.first.scope,
      [context.first.roundTripId],
    )[context.first.roundTripId]).toMatchObject([{ tagId: tag.tagId }]);
    expect(context.service.readRoundTripNotes(
      context.first.scope,
      [context.first.roundTripId],
    )[context.first.roundTripId]).toMatchObject({
      revision: 1,
      tradeNote: "Stayed with the planned exit.",
      technicalNote: "Held the breakout level.",
    });
    context.database.close();
  });

  it("pins reviews to immutable rule versions and keeps lifecycle history", () => {
    const context = setup();
    const created = context.service.createRule(context.first.scope, {
      sourceKind: "custom",
      title: "Wait for confirmation",
      statement: "Do not enter before the setup confirms.",
      category: "discipline",
      reviewScope: "trade",
      isFocus: true,
      configuration: {},
      now: new Date(at),
    });
    const review = context.service.saveRuleReview(context.first.scope, {
      ruleId: created.ruleId,
      ruleVersionId: created.versionId,
      targetKind: "round_trip",
      targetId: context.first.roundTripId,
      status: "followed",
      expectedRevision: null,
      now: new Date(at),
    });
    const revised = context.service.reviseRule(context.first.scope, {
      ruleId: created.ruleId,
      expectedRevision: created.revision,
      title: created.title,
      statement: "Wait for price and volume confirmation.",
      category: created.category,
      reviewScope: created.reviewScope,
      isFocus: created.isFocus,
      configuration: {},
      now: new Date("2026-08-02T12:01:00.000Z"),
    });
    expect(review.ruleVersionId).toBe(created.versionId);
    expect(revised.versionId).not.toBe(created.versionId);
    const paused = context.service.transitionRule(context.first.scope, {
      ruleId: revised.ruleId,
      expectedRevision: revised.revision,
      expectedState: "active",
      newState: "paused",
      now: new Date("2026-08-02T12:02:00.000Z"),
    });
    expect(paused.lifecycleState).toBe("paused");
    expect(context.database.prepare(`SELECT COUNT(*) AS count
FROM journal_rule_versions WHERE rule_id = ?`).get(created.ruleId)).toEqual({
      count: 2,
    });
    expect(context.database.prepare(`SELECT COUNT(*) AS count
FROM journal_rule_lifecycle_events WHERE rule_id = ?`).get(created.ruleId))
      .toEqual({ count: 2 });
    context.database.close();
  });

  it("creates, revises, pauses, resumes, and retires every preset rule", () => {
    const context = setup();
    const selectionRef = deriveJournalAccountSelectionRef(
      context.first.scope.workspaceId,
      context.first.scope.accountId,
    );

    for (const template of JOURNAL_RULE_TEMPLATE_CATALOG) {
      mutateJournalTradingRules(context.service, context.first.scope, {
        action: "create",
        templateId: template.templateId,
        configuration: { ...template.exampleConfiguration },
      });
    }

    let dashboard = readJournalTradingRulesDashboard(
      context.service,
      context.first.scope,
      selectionRef,
    );
    expect(dashboard.packet.rules).toHaveLength(JOURNAL_RULE_TEMPLATE_CATALOG.length);

    for (const original of dashboard.packet.rules) {
      mutateJournalTradingRules(context.service, context.first.scope, {
        action: "revise",
        expectedRevision: original.revision,
        ruleInstanceId: original.ruleInstanceId,
        configuration: { ...original.template.exampleConfiguration },
      });
      let current = readJournalTradingRulesDashboard(
        context.service,
        context.first.scope,
        selectionRef,
      ).packet.rules.find((rule) => rule.ruleInstanceId === original.ruleInstanceId)!;
      expect(current.currentVersion.versionOrdinal).toBe("2");

      for (const [expectedCurrentStatus, newStatus] of [
        ["active", "paused"],
        ["paused", "active"],
        ["active", "retired"],
      ] as const) {
        mutateJournalTradingRules(context.service, context.first.scope, {
          action: "transition",
          expectedRevision: current.revision,
          expectedCurrentStatus,
          newStatus,
          ruleInstanceId: current.ruleInstanceId,
        });
        current = readJournalTradingRulesDashboard(
          context.service,
          context.first.scope,
          selectionRef,
        ).packet.rules.find((rule) => rule.ruleInstanceId === original.ruleInstanceId)!;
        expect(current.status).toBe(newStatus);
      }
    }

    dashboard = readJournalTradingRulesDashboard(
      context.service,
      context.first.scope,
      selectionRef,
    );
    expect(dashboard.packet.rules.every((rule) => rule.status === "retired")).toBe(true);
    context.database.close();
  });
});
