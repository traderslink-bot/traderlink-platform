"use server";

import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";

import {
  runTradeExplorerComparison,
  runTradeExplorerQuery,
} from "./trade-explorer-service";
import {
  createTradeExplorerComparisonStudy as createComparisonStudy,
  retireTradeExplorerComparisonStudy as retireComparisonStudy,
  updateTradeExplorerComparisonStudy as updateComparisonStudy,
} from "./trade-explorer-comparison-study-runtime";
import type { TradeExplorerComparisonStudyMutationResult } from "./trade-explorer-comparison-model";
import {
  createTradeExplorerSavedView as createSavedView,
} from "./trade-explorer-saved-view-runtime";
import type { TradeExplorerSavedViewMutationResult } from "./trade-explorer-saved-view-model";

function inputRecord(input: unknown): Readonly<Record<string, unknown>> {
  if (!input || Array.isArray(input) || typeof input !== "object") return Object.freeze({});
  return input as Readonly<Record<string, unknown>>;
}

function comparisonStudyFailure(error: unknown): TradeExplorerComparisonStudyMutationResult {
  const conflict = isTraderLinkPlatformError(error) && [
    "TRADERLINK_ACCOUNT_SELECTION_CONFLICT",
    "TRADERLINK_TRADE_EXPLORER_STUDY_CONFLICT",
  ].includes(error.code);
  return Object.freeze({
    ok: false as const,
    message: conflict
      ? "This saved comparison or selected trading account changed. Refresh before trying again."
      : "This comparison could not be saved. Check its name and groups.",
  });
}

export async function runTradeExplorer(
  input: unknown,
  afterCursor?: unknown,
  tradeSort?: unknown,
): Promise<
  | Readonly<{ ok: true; preview: Awaited<ReturnType<typeof runTradeExplorerQuery>> }>
  | Readonly<{ ok: false; message: string; refreshRequired: boolean }>
> {
  try {
    const scope = await requireTraderLinkPlatformPageScope();
    return Object.freeze({
      ok: true as const,
      preview: await runTradeExplorerQuery(scope, input, afterCursor, tradeSort),
    });
  } catch (error) {
    const accessChanged = isTraderLinkPlatformError(error) && [
      "TRADERLINK_AUTH_SESSION_INVALID",
      "TRADERLINK_WORKSPACE_ACCESS_DENIED",
      "TRADERLINK_ACCOUNT_ACCESS_DENIED",
      "TRADERLINK_ACCOUNT_SELECTION_CONFLICT",
    ].includes(error.code);
    const tooManyGroups = isTraderLinkPlatformError(error) &&
      error.code === "TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED" &&
      error.safeContext.field === "groupRowLimit";
    const resultsChanged = isTraderLinkPlatformError(error) &&
      error.code === "TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED" &&
      error.safeContext.field === "table.afterCursor";
    return Object.freeze({
      ok: false as const,
      refreshRequired: accessChanged,
      message: accessChanged
        ? "Your access or selected trading account changed. Refresh this page and try again."
        : tooManyGroups
          ? "There are too many groups to display at once. Narrow the date range or other filters and try again."
          : resultsChanged
            ? "These results changed while you were paging. Choose Update results to load the latest trades."
            : "Those results could not be displayed. The table still shows your last successful results. Check the selected filters and try again.",
    });
  }
}

export async function createTradeExplorerSavedView(
  input: unknown,
): Promise<TradeExplorerSavedViewMutationResult> {
  try {
    const value = inputRecord(input);
    const scope = await requireTraderLinkPlatformPageScope();
    const result = createSavedView(scope, {
      name: value.name,
      view: value.view,
    });
    return Object.freeze({
      ok: true as const,
      savedViews: result.savedViews,
      selectedSavedViewId: result.savedViewId,
    });
  } catch (error) {
    const refreshRequired = isTraderLinkPlatformError(error) && [
      "TRADERLINK_AUTH_SESSION_INVALID",
      "TRADERLINK_WORKSPACE_ACCESS_DENIED",
      "TRADERLINK_ACCOUNT_ACCESS_DENIED",
      "TRADERLINK_ACCOUNT_SELECTION_CONFLICT",
    ].includes(error.code);
    const limitReached = isTraderLinkPlatformError(error) &&
      error.code === "TRADERLINK_TRADE_EXPLORER_SAVED_VIEW_CONFLICT" &&
      error.safeContext.reason === "active_view_limit";
    return Object.freeze({
      ok: false as const,
      refreshRequired,
      message: refreshRequired
        ? "Your access or selected trading account changed. Refresh this page and try again."
        : limitReached
          ? "This account already has 100 saved views."
          : "This view could not be saved. Check its name and try again.",
    });
  }
}

export async function compareTradeExplorerGroups(
  input: unknown,
): Promise<
  | Readonly<{ ok: true; comparison: Awaited<ReturnType<typeof runTradeExplorerComparison>> }>
  | Readonly<{ ok: false; message: string; refreshRequired: boolean }>
> {
  try {
    const scope = await requireTraderLinkPlatformPageScope();
    return Object.freeze({
      ok: true as const,
      comparison: await runTradeExplorerComparison(scope, input),
    });
  } catch (error) {
    const accessChanged = isTraderLinkPlatformError(error) && [
      "TRADERLINK_AUTH_SESSION_INVALID",
      "TRADERLINK_WORKSPACE_ACCESS_DENIED",
      "TRADERLINK_ACCOUNT_ACCESS_DENIED",
      "TRADERLINK_ACCOUNT_SELECTION_CONFLICT",
    ].includes(error.code);
    return Object.freeze({
      ok: false as const,
      refreshRequired: accessChanged,
      message: accessChanged
        ? "Your access or selected trading account changed. Refresh this page and try again."
        : "Those groups could not be compared. Check each group and try again.",
    });
  }
}

export async function createTradeExplorerComparisonStudy(
  input: unknown,
): Promise<TradeExplorerComparisonStudyMutationResult> {
  try {
    const value = inputRecord(input);
    const scope = await requireTraderLinkPlatformPageScope();
    const result = createComparisonStudy(scope, {
      name: value.name,
      comparison: value.comparison,
    });
    return Object.freeze({
      ok: true as const,
      studies: result.studies,
      selectedStudyId: result.studyId,
    });
  } catch (error) {
    return comparisonStudyFailure(error);
  }
}

export async function updateTradeExplorerComparisonStudy(
  input: unknown,
): Promise<TradeExplorerComparisonStudyMutationResult> {
  try {
    const value = inputRecord(input);
    const scope = await requireTraderLinkPlatformPageScope();
    const studies = updateComparisonStudy(scope, {
      studyId: value.studyId,
      expectedRevision: value.expectedRevision,
      name: value.name,
      comparison: value.comparison,
    });
    return Object.freeze({
      ok: true as const,
      studies,
      selectedStudyId: value.studyId as string,
    });
  } catch (error) {
    return comparisonStudyFailure(error);
  }
}

export async function retireTradeExplorerComparisonStudy(
  input: unknown,
): Promise<TradeExplorerComparisonStudyMutationResult> {
  try {
    const value = inputRecord(input);
    const scope = await requireTraderLinkPlatformPageScope();
    const studies = retireComparisonStudy(scope, {
      expectedAccountSelectionRef: value.expectedAccountSelectionRef,
      studyId: value.studyId,
      expectedRevision: value.expectedRevision,
    });
    return Object.freeze({
      ok: true as const,
      studies,
      selectedStudyId: null,
    });
  } catch (error) {
    return comparisonStudyFailure(error);
  }
}
