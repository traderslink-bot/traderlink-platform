import "server-only";

import { createHash } from "node:crypto";

import type Database from "better-sqlite3";

import {
  TRADE_EXPLORER_SAVED_VIEW_VERSION,
  type TradeExplorerSavedViewPayload,
  type TradeExplorerSavedViewRecord,
} from "@/src/modules/journal-analytics/contracts/trade-explorer-saved-view";
import { TradeExplorerSavedViewRepository } from "@/src/modules/journal-analytics/server/trade-explorer-saved-view-repository";
import { TradeExplorerSavedViewService } from "@/src/modules/journal-analytics/server/trade-explorer-saved-view-service";
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
  type TradeExplorerResultView,
  type TradeExplorerSavedView,
  type TradeExplorerSavedViewDefinition,
} from "./trade-explorer-saved-view-model";
import { normalizeTradeExplorerQueryRequest } from "./trade-explorer-service";

type StoredQuery = Omit<AnalyticsLabPlatformQuery, "expectedAccountSelectionRef">;
type StoredViewDocument = Readonly<{
  viewVersion: typeof TRADE_EXPLORER_SAVED_VIEW_VERSION;
  query: StoredQuery;
  resultView: TradeExplorerResultView;
  tradeSort: TradeExplorerSavedViewDefinition["tradeSort"];
  sortDirection: TradeExplorerSavedViewDefinition["sortDirection"];
}>;

function inputRecord(input: unknown): Readonly<Record<string, unknown>> {
  if (!input || Array.isArray(input) || typeof input !== "object") {
    platformFailure("TRADERLINK_TRADE_EXPLORER_SAVED_VIEW_INVALID", { field: "view" });
  }
  return input as Readonly<Record<string, unknown>>;
}

function hasExactFields(
  value: Readonly<Record<string, unknown>>,
  fields: readonly string[],
): boolean {
  return Object.keys(value).sort().join("\u0000") === [...fields].sort().join("\u0000");
}

function normalizeResultView(value: unknown): TradeExplorerResultView {
  if (!["trades", "days", "tickers", "entry_times", "holding_time", "position_size", "periods"]
    .includes(String(value))) {
    platformFailure("TRADERLINK_TRADE_EXPLORER_SAVED_VIEW_INVALID", { field: "resultView" });
  }
  return value as TradeExplorerResultView;
}

function normalizeSortDirection(
  value: unknown,
): TradeExplorerSavedViewDefinition["sortDirection"] {
  if (value !== "descending" && value !== "ascending") {
    platformFailure("TRADERLINK_TRADE_EXPLORER_SAVED_VIEW_INVALID", { field: "sortDirection" });
  }
  return value;
}

function requireViewGrouping(
  resultView: TradeExplorerResultView,
  grouping: AnalyticsLabPlatformQuery["grouping"],
): void {
  const matches = resultView === "trades"
    ? true
    : resultView === "days"
      ? grouping === "closing_day"
      : resultView === "tickers"
        ? grouping === "instrument"
        : resultView === "entry_times"
          ? grouping === "entry_time_bucket"
          : resultView === "holding_time"
            ? grouping === "holding_duration_bucket"
            : resultView === "position_size"
              ? grouping === "maximum_position_bucket"
              : ["closing_day", "closing_iso_week", "closing_month", "closing_year"]
                  .includes(grouping);
  if (!matches) {
    platformFailure("TRADERLINK_TRADE_EXPLORER_SAVED_VIEW_INVALID", { field: "grouping" });
  }
}

function normalizeView(
  scope: WorkspaceAccessScope,
  input: unknown,
): TradeExplorerSavedViewDefinition {
  const value = inputRecord(input);
  if (!hasExactFields(value, [
    "viewVersion", "query", "resultView", "tradeSort", "sortDirection",
  ]) || value.viewVersion !== TRADE_EXPLORER_SAVED_VIEW_VERSION) {
    platformFailure("TRADERLINK_TRADE_EXPLORER_SAVED_VIEW_INVALID", { field: "view" });
  }
  const normalizedRequest = normalizeTradeExplorerQueryRequest(
    value.query,
    value.tradeSort,
  );
  requireExpectedJournalAccountSelection(
    scope,
    normalizedRequest.query.expectedAccountSelectionRef,
  );
  const resultView = normalizeResultView(value.resultView);
  requireViewGrouping(resultView, normalizedRequest.query.grouping);
  return Object.freeze({
    viewVersion: TRADE_EXPLORER_SAVED_VIEW_VERSION,
    query: normalizedRequest.query,
    resultView,
    tradeSort: normalizedRequest.tradeSort,
    sortDirection: normalizeSortDirection(value.sortDirection),
  });
}

function accountScope(scope: WorkspaceAccessScope) {
  if (!scope.activeAccountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  return narrowWorkspaceAccessToAccount(scope, scope.activeAccountId);
}

function service(database: Database.Database): TradeExplorerSavedViewService {
  return new TradeExplorerSavedViewService(
    new TradeExplorerSavedViewRepository(database),
  );
}

function prepare(
  scope: WorkspaceAccessScope,
  input: unknown,
): Readonly<{
  view: TradeExplorerSavedViewDefinition;
  payload: TradeExplorerSavedViewPayload;
}> {
  const view = normalizeView(scope, input);
  const { expectedAccountSelectionRef: _selection, ...query } = view.query;
  void _selection;
  const document: StoredViewDocument = Object.freeze({
    viewVersion: TRADE_EXPLORER_SAVED_VIEW_VERSION,
    query: Object.freeze(query),
    resultView: view.resultView,
    tradeSort: view.tradeSort,
    sortDirection: view.sortDirection,
  });
  const normalizedViewJson = JSON.stringify(document);
  return Object.freeze({
    view,
    payload: Object.freeze({
      viewVersion: TRADE_EXPLORER_SAVED_VIEW_VERSION,
      normalizedViewJson,
      viewSha256: createHash("sha256").update(normalizedViewJson, "utf8").digest("hex"),
    }),
  });
}

function restore(
  scope: WorkspaceAccessScope,
  record: TradeExplorerSavedViewRecord,
): TradeExplorerSavedView {
  let stored: unknown;
  try {
    stored = JSON.parse(record.normalizedViewJson);
  } catch {
    platformFailure("TRADERLINK_TRADE_EXPLORER_SAVED_VIEW_INVALID", { field: "savedView" });
  }
  const document = inputRecord(stored);
  if (!document.query || Array.isArray(document.query) || typeof document.query !== "object") {
    platformFailure("TRADERLINK_TRADE_EXPLORER_SAVED_VIEW_INVALID", { field: "savedQuery" });
  }
  const view = normalizeView(scope, Object.freeze({
    ...document,
    query: Object.freeze({
      ...(document.query as Readonly<Record<string, unknown>>),
      expectedAccountSelectionRef: currentJournalAccountSelectionRef(scope),
    }),
  }));
  return Object.freeze({
    savedViewId: record.savedViewId,
    name: record.name,
    revision: record.revision,
    view,
    createdAtUtc: record.createdAtUtc,
    updatedAtUtc: record.updatedAtUtc,
  });
}

function list(
  database: Database.Database,
  scope: WorkspaceAccessScope,
): readonly TradeExplorerSavedView[] {
  return Object.freeze(service(database).list(accountScope(scope)).map((record) =>
    restore(scope, record)));
}

export function listTradeExplorerSavedViews(
  scope: WorkspaceAccessScope,
): readonly TradeExplorerSavedView[] {
  return withReadonlyPlatformDatabase({}, (database) => list(database, scope));
}

export function createTradeExplorerSavedView(
  scope: WorkspaceAccessScope,
  input: Readonly<{ name: unknown; view: unknown }>,
): Readonly<{
  savedViewId: string;
  savedViews: readonly TradeExplorerSavedView[];
}> {
  const prepared = prepare(scope, input.view);
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
