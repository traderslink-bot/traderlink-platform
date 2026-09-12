import "server-only";
import { dirname, join } from "node:path";
import { resolvePlatformDatabaseConfig } from "@/src/modules/platform/server/database/platform-database-config";
import { IndicatorAuditStore } from "./indicator-audit-store";

const processState = globalThis as typeof globalThis & { __watchlistIndicatorAuditV1?: IndicatorAuditStore };
/** Uses the existing persistent-volume boundary; never a repository or public directory. */
export function watchlistIndicatorAuditStore(): IndicatorAuditStore {
  if (!processState.__watchlistIndicatorAuditV1) {
    const { databasePath } = resolvePlatformDatabaseConfig();
    processState.__watchlistIndicatorAuditV1 = new IndicatorAuditStore(join(dirname(databasePath), "watchlist-indicator-audit"));
  }
  return processState.__watchlistIndicatorAuditV1;
}
