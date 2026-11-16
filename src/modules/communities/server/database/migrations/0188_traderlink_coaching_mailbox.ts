import type {PlatformMigration} from '@/src/modules/platform/server/database/platform-migration-contract';

/** SOURCE ONLY. Coordinator owns target-history qualification and common registration.
 * The legacy ID set is seeded once in the migration transaction, never on startup. */
export const independentCoachingMailboxStatements = Object.freeze([
 `CREATE TABLE traderlink_coaching_message_legacy (
   message_id TEXT PRIMARY KEY REFERENCES traderlink_coaching_messages(message_id)
 ) STRICT;`,
 `CREATE TABLE traderlink_coaching_message_read_receipts (
   message_id TEXT NOT NULL REFERENCES traderlink_coaching_messages(message_id),
   recipient_user_id TEXT NOT NULL REFERENCES platform_users(user_id),
   read_at_utc TEXT NOT NULL,PRIMARY KEY(message_id,recipient_user_id)
 ) STRICT;`,
 `CREATE INDEX traderlink_coaching_messages_mailbox_page ON traderlink_coaching_messages(enrollment_id,created_at_utc,message_id);`,
 `INSERT INTO traderlink_coaching_message_legacy(message_id) SELECT message_id FROM traderlink_coaching_messages;`,
]);
export const traderLinkCoachingMailboxMigration:PlatformMigration=Object.freeze({
 moduleNamespace:'community',migrationId:'0188_traderlink_coaching_mailbox',executionOrder:250,
 statements:independentCoachingMailboxStatements,
});
