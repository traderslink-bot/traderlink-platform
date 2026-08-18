import "server-only";

import { createHash } from "node:crypto";

import type Database from "better-sqlite3";

import {
  TRADE_EXPLORER_COMPARISON_STUDY_VERSION,
  type TradeExplorerComparisonStudyPayload,
  type TradeExplorerComparisonStudyRecord,
} from "@/src/modules/journal-analytics/contracts/trade-explorer-comparison-study";
import { TradeExplorerComparisonStudyRepository } from "@/src/modules/journal-analytics/server/trade-explorer-comparison-study-repository";
import { TradeExplorerComparisonStudyService } from "@/src/modules/journal-analytics/server/trade-explorer-comparison-study-service";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { narrowWorkspaceAccessToAccount } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  currentJournalAccountSelectionRef,
  requireExpectedJournalAccountSelection,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";

import type { AnalyticsLabPlatformQuery } from "../lab/analytics-lab-platform-types";
import {
  TRADE_EXPLORER_COMPARISON_VERSION,
  type TradeExplorerComparisonInput,
  type TradeExplorerComparisonStudy,
} from "./trade-explorer-comparison-model";
import { normalizeTradeExplorerComparison } from "./trade-explorer-service";

type SavedQuery = Omit<AnalyticsLabPlatformQuery, "expectedAccountSelectionRef">;
type SavedStudyDocument = Readonly<{
  comparisonVersion: typeof TRADE_EXPLORER_COMPARISON_VERSION;
  groups: readonly Readonly<{ name: string; query: SavedQuery }>[];
}>;

function accountScope(scope: WorkspaceAccessScope) {
  if (!scope.activeAccountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  return narrowWorkspaceAccessToAccount(scope, scope.activeAccountId);
}

function service(database: Database.Database): TradeExplorerComparisonStudyService {
  return new TradeExplorerComparisonStudyService(
    new TradeExplorerComparisonStudyRepository(database),
  );
}

function prepare(
  scope: WorkspaceAccessScope,
  input: unknown,
): Readonly<{
  comparison: TradeExplorerComparisonInput;
  payload: TradeExplorerComparisonStudyPayload;
}> {
  const comparison = normalizeTradeExplorerComparison(input);
  for (const group of comparison.groups) {
    requireExpectedJournalAccountSelection(scope, group.query.expectedAccountSelectionRef);
  }
  const document: SavedStudyDocument = Object.freeze({
    comparisonVersion: TRADE_EXPLORER_COMPARISON_VERSION,
    groups: Object.freeze(comparison.groups.map((group) => {
      const { expectedAccountSelectionRef: _selection, ...query } = group.query;
      void _selection;
      return Object.freeze({ name: group.name, query: Object.freeze(query) });
    })),
  });
  const normalizedStudyJson = JSON.stringify(document);
  return Object.freeze({
    comparison,
    payload: Object.freeze({
      studyVersion: TRADE_EXPLORER_COMPARISON_STUDY_VERSION,
      normalizedStudyJson,
      studySha256: createHash("sha256").update(normalizedStudyJson, "utf8").digest("hex"),
    }),
  });
}

function restore(
  record: TradeExplorerComparisonStudyRecord,
  expectedAccountSelectionRef: string,
): TradeExplorerComparisonStudy {
  let value: unknown;
  try {
    value = JSON.parse(record.normalizedStudyJson);
  } catch {
    platformFailure("TRADERLINK_TRADE_EXPLORER_STUDY_INVALID", { field: "savedStudy" });
  }
  if (!value || Array.isArray(value) || typeof value !== "object") {
    platformFailure("TRADERLINK_TRADE_EXPLORER_STUDY_INVALID", { field: "savedStudy" });
  }
  const document = value as Readonly<Record<string, unknown>>;
  if (!Array.isArray(document.groups)) {
    platformFailure("TRADERLINK_TRADE_EXPLORER_STUDY_INVALID", { field: "savedStudy" });
  }
  const comparison = normalizeTradeExplorerComparison(Object.freeze({
    comparisonVersion: document.comparisonVersion,
    groups: Object.freeze(document.groups.map((candidate) => {
      if (!candidate || Array.isArray(candidate) || typeof candidate !== "object") {
        platformFailure("TRADERLINK_TRADE_EXPLORER_STUDY_INVALID", { field: "savedGroup" });
      }
      const group = candidate as Readonly<Record<string, unknown>>;
      if (!group.query || Array.isArray(group.query) || typeof group.query !== "object") {
        platformFailure("TRADERLINK_TRADE_EXPLORER_STUDY_INVALID", { field: "savedQuery" });
      }
      return Object.freeze({
        name: group.name,
        query: Object.freeze({
          ...(group.query as Record<string, unknown>),
          expectedAccountSelectionRef,
        }),
      });
    })),
  }));
  return Object.freeze({
    studyId: record.studyId,
    name: record.name,
    revision: record.revision,
    groups: comparison.groups,
    createdAtUtc: record.createdAtUtc,
    updatedAtUtc: record.updatedAtUtc,
  });
}

function list(
  database: Database.Database,
  scope: WorkspaceAccessScope,
): readonly TradeExplorerComparisonStudy[] {
  const expected = currentJournalAccountSelectionRef(scope);
  return Object.freeze(service(database).list(accountScope(scope)).map((record) =>
    restore(record, expected)));
}

export function listTradeExplorerComparisonStudies(
  scope: WorkspaceAccessScope,
): readonly TradeExplorerComparisonStudy[] {
  return withReadonlyPlatformDatabase({}, (database) => list(database, scope));
}

export function createTradeExplorerComparisonStudy(
  scope: WorkspaceAccessScope,
  input: Readonly<{ name: unknown; comparison: unknown }>,
): Readonly<{
  studyId: string;
  studies: readonly TradeExplorerComparisonStudy[];
}> {
  const prepared = prepare(scope, input.comparison);
  return withPlatformDatabase({ mode: "runtime" }, (database) => {
    const created = service(database).create(accountScope(scope), {
      name: input.name,
      payload: prepared.payload,
    });
    return Object.freeze({ studyId: created.studyId, studies: list(database, scope) });
  });
}

export function updateTradeExplorerComparisonStudy(
  scope: WorkspaceAccessScope,
  input: Readonly<{
    studyId: unknown;
    expectedRevision: unknown;
    name: unknown;
    comparison: unknown;
  }>,
): readonly TradeExplorerComparisonStudy[] {
  const prepared = prepare(scope, input.comparison);
  return withPlatformDatabase({ mode: "runtime" }, (database) => {
    service(database).update(accountScope(scope), {
      studyId: input.studyId,
      expectedRevision: input.expectedRevision,
      name: input.name,
      payload: prepared.payload,
    });
    return list(database, scope);
  });
}

export function retireTradeExplorerComparisonStudy(
  scope: WorkspaceAccessScope,
  input: Readonly<{
    expectedAccountSelectionRef: unknown;
    studyId: unknown;
    expectedRevision: unknown;
  }>,
): readonly TradeExplorerComparisonStudy[] {
  if (typeof input.expectedAccountSelectionRef !== "string") {
    platformFailure("TRADERLINK_TRADE_EXPLORER_STUDY_INVALID", {
      field: "expectedAccountSelectionRef",
    });
  }
  requireExpectedJournalAccountSelection(scope, input.expectedAccountSelectionRef);
  return withPlatformDatabase({ mode: "runtime" }, (database) => {
    service(database).retire(accountScope(scope), input);
    return list(database, scope);
  });
}
