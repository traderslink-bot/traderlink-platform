"use server";

import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";

import {
  readWorkspaceTradeLibrary,
  type WorkspaceTradeLibraryModel,
  type WorkspaceTradeLibraryQuery,
} from "./workspace-trade-library";

export async function loadWorkspaceTradeLibraryPage(
  input: WorkspaceTradeLibraryQuery,
): Promise<
  | Readonly<{ ok: true; model: WorkspaceTradeLibraryModel }>
  | Readonly<{ ok: false; message: string; refreshRequired: boolean }>
> {
  try {
    const scope = await requireTraderLinkPlatformPageScope();
    return Object.freeze({
      ok: true as const,
      model: withReadonlyPlatformDatabase({}, (database) =>
        readWorkspaceTradeLibrary(database, scope, input)),
    });
  } catch {
    return Object.freeze({
      ok: false as const,
      message: "These trades changed while you were paging. Refresh to load the latest list.",
      refreshRequired: true,
    });
  }
}
