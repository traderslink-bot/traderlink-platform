"use server";

import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";

import { runAnalyticsLabPlatformQuery } from "./analytics-lab-platform-service";
import {
  createAnalyticsLabSavedView as createSavedView,
  retireAnalyticsLabSavedView as retireSavedView,
  updateAnalyticsLabSavedView as updateSavedView,
} from "./analytics-lab-saved-view-runtime";
import type {
  AnalyticsLabPlatformQueryResult,
  AnalyticsLabSavedViewMutationResult,
} from "./analytics-lab-platform-types";

function inputRecord(input: unknown): Record<string, unknown> {
  if (!input || Array.isArray(input) || typeof input !== "object") return {};
  return input as Record<string, unknown>;
}

function savedViewFailure(error: unknown): AnalyticsLabSavedViewMutationResult {
  const conflict = isTraderLinkPlatformError(error) && (
    error.code === "TRADERLINK_ACCOUNT_SELECTION_CONFLICT" ||
    error.code === "TRADERLINK_ANALYTICS_SAVED_VIEW_CONFLICT"
  );
  return Object.freeze({
    ok: false as const,
    message: conflict
      ? "This saved view changed or the selected Trade Tracker account changed. Refresh before trying again."
      : "This saved view was not accepted. Check its name and analytics filters.",
  });
}

export async function runAnalyticsLabQuery(
  input: unknown,
): Promise<AnalyticsLabPlatformQueryResult> {
  try {
    const scope = await requireTraderLinkPlatformPageScope();
    return Object.freeze({
      ok: true as const,
      preview: await runAnalyticsLabPlatformQuery(scope, input),
    });
  } catch (error) {
    const conflict = isTraderLinkPlatformError(error) &&
      error.code === "TRADERLINK_ACCOUNT_SELECTION_CONFLICT";
    return Object.freeze({
      ok: false as const,
      message: conflict
        ? "The selected Trade Tracker account changed. Refresh before running this view."
        : "This analytics request was not accepted. Review the selected filters and coverage.",
    });
  }
}

export async function createAnalyticsLabSavedView(
  input: unknown,
): Promise<AnalyticsLabSavedViewMutationResult> {
  try {
    const value = inputRecord(input);
    const scope = await requireTraderLinkPlatformPageScope();
    const result = createSavedView(scope, {
      name: value.name,
      query: value.query,
    });
    return Object.freeze({
      ok: true as const,
      savedViews: result.savedViews,
      selectedSavedViewId: result.savedViewId,
    });
  } catch (error) {
    return savedViewFailure(error);
  }
}

export async function updateAnalyticsLabSavedView(
  input: unknown,
): Promise<AnalyticsLabSavedViewMutationResult> {
  try {
    const value = inputRecord(input);
    const scope = await requireTraderLinkPlatformPageScope();
    const savedViews = updateSavedView(scope, {
      savedViewId: value.savedViewId,
      expectedRevision: value.expectedRevision,
      name: value.name,
      query: value.query,
    });
    return Object.freeze({
      ok: true as const,
      savedViews,
      selectedSavedViewId: value.savedViewId as string,
    });
  } catch (error) {
    return savedViewFailure(error);
  }
}

export async function retireAnalyticsLabSavedView(
  input: unknown,
): Promise<AnalyticsLabSavedViewMutationResult> {
  try {
    const value = inputRecord(input);
    const scope = await requireTraderLinkPlatformPageScope();
    const savedViews = retireSavedView(scope, {
      expectedAccountSelectionRef: value.expectedAccountSelectionRef,
      savedViewId: value.savedViewId,
      expectedRevision: value.expectedRevision,
    });
    return Object.freeze({
      ok: true as const,
      savedViews,
      selectedSavedViewId: null,
    });
  } catch (error) {
    return savedViewFailure(error);
  }
}
