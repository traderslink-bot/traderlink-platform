"use server";

import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";

import { runTradeExplorerQuery } from "./trade-explorer-service";

export async function runTradeExplorer(
  input: unknown,
  afterCursor?: unknown,
  tradeSort?: unknown,
): Promise<
  | Readonly<{ ok: true; preview: ReturnType<typeof runTradeExplorerQuery> }>
  | Readonly<{ ok: false; message: string; refreshRequired: boolean }>
> {
  try {
    const scope = await requireTraderLinkPlatformPageScope();
    return Object.freeze({
      ok: true as const,
      preview: runTradeExplorerQuery(scope, input, afterCursor, tradeSort),
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
