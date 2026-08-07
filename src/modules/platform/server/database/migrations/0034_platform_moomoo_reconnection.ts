import type { PlatformMigration } from "../platform-migration-contract";

const sql = `DROP TRIGGER platform_broker_connections_guard_update;

CREATE TRIGGER platform_broker_connections_guard_update
BEFORE UPDATE ON platform_broker_connections
WHEN NEW.connection_id IS NOT OLD.connection_id
  OR NEW.user_id IS NOT OLD.user_id
  OR NEW.workspace_id IS NOT OLD.workspace_id
  OR NEW.provider IS NOT OLD.provider
  OR NEW.connected_at_utc IS NOT OLD.connected_at_utc
  OR NEW.updated_at_utc < OLD.updated_at_utc
  OR (
    OLD.connection_state = 'revoked'
    AND NEW.connection_state <> 'active'
  )
BEGIN
  SELECT RAISE(ABORT, 'platform_broker_connection_invalid_update');
END;`;

export const platformMoomooReconnectionMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0034_platform_moomoo_reconnection",
  executionOrder: 34,
  statements: Object.freeze([sql]),
});
