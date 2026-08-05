"use server";

import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";

import { runTradeExplorerQuery } from "./trade-explorer-service";

export async function runTradeExplorer(
  input: unknown,
  afterCursor?: unknown,
): Promise<
  | Readonly<{ ok: true; preview: ReturnType<typeof runTradeExplorerQuery> }>
  | Readonly<{ ok: false; message: string }>
> {
  try {
    const scope = await requireTraderLinkPlatformPageScope();
    return Object.freeze({ ok: true as const, preview: runTradeExplorerQuery(scope, input, afterCursor) });
  } catch (error) {
    const accountChanged = isTraderLinkPlatformError(error) &&
      error.code === "TRADERLINK_ACCOUNT_SELECTION_CONFLICT";
    return Object.freeze({
      ok: false as const,
      message: accountChanged
        ? "The selected Journal account changed. Refresh this page and try again."
        : "Those results could not be displayed. Check the selected filters and try again.",
    });
  }
}
