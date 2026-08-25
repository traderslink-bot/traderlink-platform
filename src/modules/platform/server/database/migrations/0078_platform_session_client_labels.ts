import type { PlatformMigration } from "../platform-migration-contract";

const sql = `ALTER TABLE platform_auth_sessions
ADD COLUMN client_label TEXT CHECK (
  client_label IS NULL OR length(client_label) BETWEEN 3 AND 80
)`;

export const platformSessionClientLabelsMigration: PlatformMigration =
  Object.freeze({
    moduleNamespace: "platform",
    migrationId: "0078_platform_session_client_labels",
    executionOrder: 78,
    statements: Object.freeze([sql]),
  });
