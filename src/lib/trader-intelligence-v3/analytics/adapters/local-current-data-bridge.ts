import type {
  ReadOnlyAuthorityResult,
  ReadOnlySnapshotAuthoritySource,
} from "./snapshot-read-model";

export const LOCAL_CURRENT_DATA_BRIDGE_KEY = "ti_v3_local_current_data_read_bridge" as const;
export const LOCAL_CURRENT_DATA_BRIDGE_VERSION = "v1" as const;
export const LOCAL_CURRENT_DATA_EXACT_AUTHORITY_UNAVAILABLE =
  "ti_v3_current_data_exact_v3_authority_unavailable" as const;

/**
 * The only production-shaped capability accepted by this bridge is an exact,
 * read-only GA0-A2/A3 authority read. Persistence implementations, database
 * handles, migrations, and mutation callbacks are deliberately absent.
 */
export interface LocalCurrentExactAuthorityReadPort {
  readonly readCurrentExactAuthority: () => ReadOnlyAuthorityResult;
}

export function createLocalCurrentDataReadOnlyBridge(
  port?: LocalCurrentExactAuthorityReadPort,
): ReadOnlySnapshotAuthoritySource {
  return Object.freeze({
    sourceKey: LOCAL_CURRENT_DATA_BRIDGE_KEY,
    sourceVersion: LOCAL_CURRENT_DATA_BRIDGE_VERSION,
    readExactAuthority: () =>
      port?.readCurrentExactAuthority() ??
      Object.freeze({
        state: "unavailable" as const,
        reasonCode: LOCAL_CURRENT_DATA_EXACT_AUTHORITY_UNAVAILABLE,
      }),
  });
}
