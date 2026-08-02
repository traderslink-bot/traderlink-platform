import "server-only";

import { headers as nextHeaders } from "next/headers";

import type { WorkspaceAccessScope } from "../../contracts/workspace-access-scope";
import { deriveDevelopmentOwnerJournalScope } from "@/src/modules/journal/server/accounts/journal-development-owner-scope";
import { platformFailure } from "../database/platform-migration-contract";
import { withReadonlyPlatformDatabase } from "../database/open-readonly-platform-database";
import { validateDevelopmentDashboardRequest } from "./development-dashboard-network-boundary";

export {
  TRADERLINK_PLATFORM_ALLOW_DEVELOPMENT_DASHBOARD_ENV,
  TRADERLINK_PLATFORM_LOCAL_DASHBOARD_ASSERTION_HEADER,
  TRADERLINK_PLATFORM_LOCAL_DASHBOARD_HOST,
  TRADERLINK_PLATFORM_LOCAL_DASHBOARD_RUNTIME_ENV,
  TRADERLINK_PLATFORM_LOCAL_DASHBOARD_TOKEN_ENV,
  validateDevelopmentDashboardInboundRequest,
  validateDevelopmentDashboardRequest,
} from "./development-dashboard-network-boundary";

export function requireDevelopmentDashboardRequestScope(
  requestHeaders: Headers,
  options: Readonly<{
    environment?: NodeJS.ProcessEnv;
    databasePath?: string;
    forbiddenRepositoryRoots?: readonly string[];
  }> = {},
): WorkspaceAccessScope {
  const boundary = validateDevelopmentDashboardRequest(
    requestHeaders,
    options.environment,
  );
  if (!boundary.ok) platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
  return withReadonlyPlatformDatabase(options, (database) =>
    deriveDevelopmentOwnerJournalScope(database).scope);
}

export async function requireDevelopmentDashboardPageScope(
  options: Omit<
    Parameters<typeof requireDevelopmentDashboardRequestScope>[1],
    "environment"
  > = {},
): Promise<WorkspaceAccessScope> {
  return requireDevelopmentDashboardRequestScope(await nextHeaders(), {
    ...options,
    environment: process.env,
  });
}
