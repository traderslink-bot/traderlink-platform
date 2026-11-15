import type {PlatformMigration} from '@/src/modules/platform/server/database/platform-migration-contract';
/** Coordinator allocation0192/community230. Additive source only; no registry or execution here.
 * Existing accepted terms/feedback are never backfilled or rewritten. */
export const coachingTradeEvaluationStatements=Object.freeze([
 `CREATE TABLE traderlink_coaching_trade_evaluations (
  review_id TEXT NOT NULL,round_trip_id TEXT NOT NULL,
  coach_user_id TEXT NOT NULL REFERENCES platform_users(user_id),
  student_user_id TEXT NOT NULL REFERENCES platform_users(user_id),
  agreement_id TEXT NOT NULL REFERENCES traderlink_coaching_accepted_terms(agreement_id),
  journal_account_id TEXT NOT NULL,logical_trade_id TEXT NOT NULL,
  trade_at_utc TEXT NOT NULL,delivered_at_utc TEXT NOT NULL,
  snapshot_json TEXT NOT NULL CHECK(json_valid(snapshot_json)),
  PRIMARY KEY(review_id,round_trip_id),
  FOREIGN KEY(review_id,round_trip_id) REFERENCES traderlink_coaching_review_trades(review_id,round_trip_id)
 ) STRICT;`,
 `CREATE TABLE traderlink_coaching_evaluation_events (
  event_id TEXT PRIMARY KEY,coach_user_id TEXT NOT NULL REFERENCES platform_users(user_id),
  student_user_id TEXT NOT NULL REFERENCES platform_users(user_id),journal_account_id TEXT NOT NULL,
  criterion_key TEXT NOT NULL,source_review_id TEXT NOT NULL REFERENCES traderlink_coaching_reviews(review_id),
  recorded_at_utc TEXT NOT NULL,snapshot_json TEXT NOT NULL CHECK(json_valid(snapshot_json))
 ) STRICT;`,
 `CREATE INDEX traderlink_coaching_evaluation_event_population ON traderlink_coaching_evaluation_events(coach_user_id,student_user_id,journal_account_id,recorded_at_utc);`,
 `CREATE TRIGGER traderlink_coaching_evaluation_event_immutable_update BEFORE UPDATE ON traderlink_coaching_evaluation_events BEGIN SELECT RAISE(ABORT,'Evaluation event evidence is immutable.'); END;`,
 `CREATE TRIGGER traderlink_coaching_evaluation_event_immutable_delete BEFORE DELETE ON traderlink_coaching_evaluation_events BEGIN SELECT RAISE(ABORT,'Evaluation event evidence is immutable.'); END;`,
 `CREATE INDEX traderlink_coaching_trade_evaluation_population ON traderlink_coaching_trade_evaluations(coach_user_id,student_user_id,journal_account_id,trade_at_utc);`,
 `CREATE TRIGGER traderlink_coaching_trade_evaluation_immutable_update BEFORE UPDATE ON traderlink_coaching_trade_evaluations BEGIN SELECT RAISE(ABORT,'Delivered evaluations are immutable.'); END;`,
 `CREATE TRIGGER traderlink_coaching_trade_evaluation_immutable_delete BEFORE DELETE ON traderlink_coaching_trade_evaluations BEGIN SELECT RAISE(ABORT,'Delivered evaluations are immutable.'); END;`,
]);
export const traderLinkCoachingTradeEvaluationTemplatesMigration:PlatformMigration=Object.freeze({moduleNamespace:'community',migrationId:'0192_traderlink_coaching_trade_evaluation_templates',executionOrder:230,statements:coachingTradeEvaluationStatements});
