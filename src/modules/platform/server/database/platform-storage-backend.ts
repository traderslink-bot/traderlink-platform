import {
  platformFailure,
  type TraderLinkPlatformErrorCode,
} from "./platform-migration-contract";

export const TRADERLINK_PLATFORM_STORAGE_BACKEND_ENV =
  "TRADERLINK_PLATFORM_STORAGE_BACKEND" as const;
export const TRADERLINK_PLATFORM_SQLITE_SINGLE_NODE_BACKEND =
  "sqlite_single_node" as const;

export function requirePlatformSingleNodeSqliteStorage(
  errorCode: TraderLinkPlatformErrorCode,
  environment: NodeJS.ProcessEnv = process.env,
): true {
  const configured = environment[TRADERLINK_PLATFORM_STORAGE_BACKEND_ENV];
  if (
    (environment.NODE_ENV === "production" &&
      configured !== TRADERLINK_PLATFORM_SQLITE_SINGLE_NODE_BACKEND) ||
    (configured !== undefined &&
      configured !== TRADERLINK_PLATFORM_SQLITE_SINGLE_NODE_BACKEND)
  ) {
    platformFailure(errorCode, {
      reason: "sqlite_single_node_storage_required",
    });
  }
  return true;
}
