import "server-only";
import { dirname, join } from "node:path";
import { resolvePlatformDatabaseConfig } from "@/src/modules/platform/server/database/platform-database-config";
import { IndicatorAuditStore } from "./indicator-audit-store";

let store: IndicatorAuditStore | null = null;
/** Uses the existing persistent-volume boundary; never a repository or public directory. */
export function watchlistIndicatorAuditStore(): IndicatorAuditStore {
  if (!store) {
    const { databasePath } = resolvePlatformDatabaseConfig();
    store = new IndicatorAuditStore(join(dirname(databasePath), "watchlist-indicator-audit"));
  }
  return store;
}
