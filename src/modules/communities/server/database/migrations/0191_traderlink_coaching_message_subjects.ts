import type {PlatformMigration} from '@/src/modules/platform/server/database/platform-migration-contract';

/** Reserved0191/source229. Source proposal only: no registration or execution here.
 * Existing messages retain their IDs, bodies and absent historical subjects. */
export const independentCoachingMessageSubjectStatements=Object.freeze([
 `CREATE TABLE traderlink_coaching_message_subjects (
   message_id TEXT PRIMARY KEY REFERENCES traderlink_coaching_messages(message_id),
   subject TEXT NOT NULL CHECK (
     length(subject) BETWEEN 1 AND 160 AND subject=trim(subject)
     AND instr(subject,char(10))=0 AND instr(subject,char(13))=0
     AND instr(subject,char(0))=0
   )
 ) STRICT;`,
]);

export const traderLinkCoachingMessageSubjectsMigration:PlatformMigration=Object.freeze({
 moduleNamespace:'community',migrationId:'0191_traderlink_coaching_message_subjects',executionOrder:251,
 statements:independentCoachingMessageSubjectStatements,
});
