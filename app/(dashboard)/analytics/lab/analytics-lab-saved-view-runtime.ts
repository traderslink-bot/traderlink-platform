import "server-only";

import type Database from "better-sqlite3";

import type { JournalAnalyticsSavedViewRecord } from "@/src/modules/journal-analytics/contracts/analytics-lab-saved-view";
import { JournalAnalyticsSavedViewRepository } from "@/src/modules/journal-analytics/server/analytics-lab-saved-view-repository";
import { JournalAnalyticsSavedViewService } from "@/src/modules/journal-analytics/server/analytics-lab-saved-view-service";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { narrowWorkspaceAccessToAccount } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  currentJournalAccountSelectionRef,
  requireExpectedJournalAccountSelection,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";

import {
  prepareAnalyticsLabSavedViewPayload,
  restoreAnalyticsLabSavedViewQuery,
} from "./analytics-lab-platform-query";
import type { AnalyticsLabSavedView } from "./analytics-lab-platform-types";

function accountScope(scope: WorkspaceAccessScope) {
  if (!scope.activeAccountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  return narrowWorkspaceAccessToAccount(scope, scope.activeAccountId);
}

function service(database: Database.Database): JournalAnalyticsSavedViewService {
  return new JournalAnalyticsSavedViewService(
    new JournalAnalyticsSavedViewRepository(database),
  );
}

function mapSavedView(
  record: JournalAnalyticsSavedViewRecord,
  expectedAccountSelectionRef: string,
): AnalyticsLabSavedView {
  return Object.freeze({
    savedViewId: record.savedViewId,
    name: record.name,
    revision: record.revision,
    query: restoreAnalyticsLabSavedViewQuery(record, expectedAccountSelectionRef),
    createdAtUtc: record.createdAtUtc,
    updatedAtUtc: record.updatedAtUtc,
  });
}

function list(
  database: Database.Database,
  scope: WorkspaceAccessScope,
): readonly AnalyticsLabSavedView[] {
  const expected = currentJournalAccountSelectionRef(scope);
  return Object.freeze(service(database).list(accountScope(scope)).map((record) =>
    mapSavedView(record, expected)));
}

export function listAnalyticsLabSavedViews(
  scope: WorkspaceAccessScope,
): readonly AnalyticsLabSavedView[] {
  return withReadonlyPlatformDatabase({}, (database) => list(database, scope));
}

export function createAnalyticsLabSavedView(
  scope: WorkspaceAccessScope,
  input: Readonly<{ name: unknown; query: unknown }>,
): Readonly<{ savedViewId: string; savedViews: readonly AnalyticsLabSavedView[] }> {
  const prepared = prepareAnalyticsLabSavedViewPayload(input.query);
  requireExpectedJournalAccountSelection(
    scope,
    prepared.query.expectedAccountSelectionRef,
  );
  return withPlatformDatabase({ mode: "runtime" }, (database) => {
    const created = service(database).create(accountScope(scope), {
      name: input.name,
      payload: prepared.payload,
    });
    return Object.freeze({
      savedViewId: created.savedViewId,
      savedViews: list(database, scope),
    });
  });
}

export function updateAnalyticsLabSavedView(
  scope: WorkspaceAccessScope,
  input: Readonly<{
    savedViewId: unknown;
    expectedRevision: unknown;
    name: unknown;
    query: unknown;
  }>,
): readonly AnalyticsLabSavedView[] {
  const prepared = prepareAnalyticsLabSavedViewPayload(input.query);
  requireExpectedJournalAccountSelection(
    scope,
    prepared.query.expectedAccountSelectionRef,
  );
  return withPlatformDatabase({ mode: "runtime" }, (database) => {
    service(database).update(accountScope(scope), {
      savedViewId: input.savedViewId,
      expectedRevision: input.expectedRevision,
      name: input.name,
      payload: prepared.payload,
    });
    return list(database, scope);
  });
}

export function retireAnalyticsLabSavedView(
  scope: WorkspaceAccessScope,
  input: Readonly<{
    expectedAccountSelectionRef: unknown;
    savedViewId: unknown;
    expectedRevision: unknown;
  }>,
): readonly AnalyticsLabSavedView[] {
  if (typeof input.expectedAccountSelectionRef !== "string") {
    platformFailure("TRADERLINK_ANALYTICS_SAVED_VIEW_INVALID", {
      field: "expectedAccountSelectionRef",
    });
  }
  requireExpectedJournalAccountSelection(scope, input.expectedAccountSelectionRef);
  return withPlatformDatabase({ mode: "runtime" }, (database) => {
    service(database).retire(accountScope(scope), input);
    return list(database, scope);
  });
}
