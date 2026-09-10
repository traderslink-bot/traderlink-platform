import type { PlatformMigration } from "../platform-migration-contract";

const uuid = (column: string) => `CHECK (
  length(${column}) = 36
  AND ${column} = lower(${column})
  AND length(replace(${column}, '-', '')) = 32
  AND replace(${column}, '-', '') NOT GLOB '*[^0-9a-f]*'
  AND substr(${column}, 15, 1) = '4'
  AND substr(${column}, 20, 1) GLOB '[89ab]'
)`;

const decimal = (column: string) => `CHECK (
  length(${column}) BETWEEN 1 AND 48
  AND ${column} NOT GLOB '*[^0-9.-]*'
  AND ${column} GLOB '*[0-9]*'
)`;

const json = (column: string) => `CHECK (json_valid(${column}))`;

const sql = `CREATE TABLE platform_watchlist_recap_candidates (
  candidate_id TEXT PRIMARY KEY ${uuid("candidate_id")},
  symbol TEXT NOT NULL CHECK (length(symbol) BETWEEN 1 AND 20 AND symbol = upper(symbol)),
  new_york_date TEXT NOT NULL CHECK (new_york_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  first_posted_at_ms INTEGER NOT NULL CHECK (first_posted_at_ms > 0),
  first_posted_price_text TEXT NOT NULL ${decimal("first_posted_price_text")},
  first_accepted_price_text TEXT NOT NULL ${decimal("first_accepted_price_text")},
  first_accepted_at_ms INTEGER NOT NULL CHECK (first_accepted_at_ms >= first_posted_at_ms),
  latest_accepted_price_text TEXT NOT NULL ${decimal("latest_accepted_price_text")},
  latest_accepted_at_ms INTEGER NOT NULL CHECK (latest_accepted_at_ms >= first_posted_at_ms),
  high_accepted_price_text TEXT NOT NULL ${decimal("high_accepted_price_text")},
  high_accepted_at_ms INTEGER NOT NULL CHECK (high_accepted_at_ms >= first_posted_at_ms),
  low_accepted_price_text TEXT NOT NULL ${decimal("low_accepted_price_text")},
  low_accepted_at_ms INTEGER NOT NULL CHECK (low_accepted_at_ms >= first_posted_at_ms),
  high_after_low_price_text TEXT ${decimal("high_after_low_price_text")},
  high_after_low_at_ms INTEGER CHECK (high_after_low_at_ms IS NULL OR high_after_low_at_ms >= low_accepted_at_ms),
  lifecycle_state TEXT NOT NULL CHECK (lifecycle_state IN ('active', 'removed')),
  frozen_at_ms INTEGER CHECK (frozen_at_ms IS NULL OR frozen_at_ms >= first_posted_at_ms),
  removed_at_ms INTEGER CHECK (removed_at_ms IS NULL OR removed_at_ms >= first_posted_at_ms),
  created_at_ms INTEGER NOT NULL CHECK (created_at_ms > 0),
  updated_at_ms INTEGER NOT NULL CHECK (updated_at_ms >= created_at_ms),
  UNIQUE(symbol, first_posted_at_ms),
  CHECK ((high_after_low_price_text IS NULL) = (high_after_low_at_ms IS NULL)),
  CHECK ((lifecycle_state = 'active' AND frozen_at_ms IS NULL AND removed_at_ms IS NULL)
    OR (lifecycle_state = 'removed' AND frozen_at_ms IS NOT NULL AND removed_at_ms IS NOT NULL))
) STRICT, WITHOUT ROWID;

CREATE INDEX platform_watchlist_recap_candidates_date_idx
  ON platform_watchlist_recap_candidates(new_york_date, first_posted_at_ms);

CREATE TABLE platform_watchlist_recap_evidence_revisions (
  evidence_revision_id TEXT PRIMARY KEY ${uuid("evidence_revision_id")},
  candidate_id TEXT NOT NULL ${uuid("candidate_id")},
  evidence_kind TEXT NOT NULL CHECK (evidence_kind IN ('activation', 'price_snapshot', 'ai_read', 'potential_path', 'removal_freeze')),
  observed_at_ms INTEGER NOT NULL CHECK (observed_at_ms > 0),
  schema_version INTEGER NOT NULL CHECK (schema_version >= 1),
  evidence_json TEXT NOT NULL ${json("evidence_json")},
  evidence_sha256 TEXT NOT NULL CHECK (length(evidence_sha256) = 64 AND evidence_sha256 NOT GLOB '*[^0-9a-f]*'),
  created_at_ms INTEGER NOT NULL CHECK (created_at_ms > 0),
  FOREIGN KEY (candidate_id) REFERENCES platform_watchlist_recap_candidates(candidate_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  UNIQUE(candidate_id, evidence_kind, observed_at_ms, evidence_sha256)
) STRICT, WITHOUT ROWID;

CREATE INDEX platform_watchlist_recap_evidence_candidate_idx
  ON platform_watchlist_recap_evidence_revisions(candidate_id, observed_at_ms, evidence_revision_id);

CREATE TABLE platform_watchlist_recap_draft_revisions (
  draft_revision_id TEXT PRIMARY KEY ${uuid("draft_revision_id")},
  candidate_id TEXT NOT NULL ${uuid("candidate_id")},
  evidence_revision_id TEXT NOT NULL ${uuid("evidence_revision_id")},
  parent_draft_revision_id TEXT ${uuid("parent_draft_revision_id")},
  authored_by TEXT NOT NULL CHECK (authored_by IN ('generator', 'owner')),
  generator_version TEXT CHECK (generator_version IS NULL OR length(generator_version) BETWEEN 1 AND 80),
  scenario TEXT NOT NULL CHECK (scenario IN ('follow_through', 'follow_through_then_fade', 'no_upside_follow_through', 'pullback_recovery', 'near_zone_recovery', 'needs_to_hold_held', 'needs_to_hold_reclaimed', 'needs_to_hold_approached', 'setup_failure')),
  recap_text TEXT NOT NULL CHECK (length(recap_text) BETWEEN 1 AND 4000),
  facts_json TEXT NOT NULL ${json("facts_json")},
  created_at_ms INTEGER NOT NULL CHECK (created_at_ms > 0),
  FOREIGN KEY (candidate_id) REFERENCES platform_watchlist_recap_candidates(candidate_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (evidence_revision_id) REFERENCES platform_watchlist_recap_evidence_revisions(evidence_revision_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (parent_draft_revision_id) REFERENCES platform_watchlist_recap_draft_revisions(draft_revision_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CHECK ((authored_by = 'generator' AND generator_version IS NOT NULL)
    OR (authored_by = 'owner' AND generator_version IS NULL))
) STRICT, WITHOUT ROWID;

CREATE INDEX platform_watchlist_recap_drafts_candidate_idx
  ON platform_watchlist_recap_draft_revisions(candidate_id, created_at_ms, draft_revision_id);

CREATE TABLE platform_watchlist_recap_reviews (
  candidate_id TEXT PRIMARY KEY ${uuid("candidate_id")},
  current_draft_revision_id TEXT ${uuid("current_draft_revision_id")},
  review_state TEXT NOT NULL CHECK (review_state IN ('unreviewed', 'add_to_recap', 'dont_use', 'needs_correction', 'posted')),
  updated_by_user_id TEXT ${uuid("updated_by_user_id")},
  updated_at_ms INTEGER NOT NULL CHECK (updated_at_ms > 0),
  FOREIGN KEY (candidate_id) REFERENCES platform_watchlist_recap_candidates(candidate_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (current_draft_revision_id) REFERENCES platform_watchlist_recap_draft_revisions(draft_revision_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (updated_by_user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT, WITHOUT ROWID;

CREATE TABLE platform_watchlist_recap_corrections (
  correction_id TEXT PRIMARY KEY ${uuid("correction_id")},
  candidate_id TEXT NOT NULL ${uuid("candidate_id")},
  draft_revision_id TEXT NOT NULL ${uuid("draft_revision_id")},
  reason TEXT NOT NULL CHECK (reason IN ('incorrect_posted_fact', 'incorrect_price_sequence', 'incorrect_pullback_or_level', 'misleading_wording', 'other')),
  owner_note TEXT CHECK (owner_note IS NULL OR length(owner_note) <= 4000),
  correction_state TEXT NOT NULL CHECK (correction_state IN ('open', 'resolved')),
  marked_at_ms INTEGER NOT NULL CHECK (marked_at_ms > 0),
  resolved_at_ms INTEGER CHECK (resolved_at_ms IS NULL OR resolved_at_ms >= marked_at_ms),
  FOREIGN KEY (candidate_id) REFERENCES platform_watchlist_recap_candidates(candidate_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (draft_revision_id) REFERENCES platform_watchlist_recap_draft_revisions(draft_revision_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CHECK ((correction_state = 'open' AND resolved_at_ms IS NULL)
    OR (correction_state = 'resolved' AND resolved_at_ms IS NOT NULL))
) STRICT, WITHOUT ROWID;

CREATE INDEX platform_watchlist_recap_corrections_open_idx
  ON platform_watchlist_recap_corrections(correction_state, marked_at_ms);

CREATE TABLE platform_watchlist_recap_compositions (
  composition_id TEXT PRIMARY KEY ${uuid("composition_id")},
  new_york_date TEXT NOT NULL CHECK (new_york_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  composition_state TEXT NOT NULL CHECK (composition_state IN ('draft', 'posted')),
  current_revision_id TEXT ${uuid("current_revision_id")},
  created_by_user_id TEXT NOT NULL ${uuid("created_by_user_id")},
  created_at_ms INTEGER NOT NULL CHECK (created_at_ms > 0),
  updated_at_ms INTEGER NOT NULL CHECK (updated_at_ms >= created_at_ms),
  FOREIGN KEY (created_by_user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT, WITHOUT ROWID;

CREATE INDEX platform_watchlist_recap_compositions_date_idx
  ON platform_watchlist_recap_compositions(new_york_date, created_at_ms);

CREATE TABLE platform_watchlist_recap_composition_items (
  composition_id TEXT NOT NULL ${uuid("composition_id")},
  candidate_id TEXT NOT NULL ${uuid("candidate_id")},
  draft_revision_id TEXT NOT NULL ${uuid("draft_revision_id")},
  display_position INTEGER NOT NULL CHECK (display_position >= 0),
  PRIMARY KEY (composition_id, candidate_id),
  FOREIGN KEY (composition_id) REFERENCES platform_watchlist_recap_compositions(composition_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (candidate_id) REFERENCES platform_watchlist_recap_candidates(candidate_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (draft_revision_id) REFERENCES platform_watchlist_recap_draft_revisions(draft_revision_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  UNIQUE(composition_id, display_position)
) STRICT, WITHOUT ROWID;

CREATE TABLE platform_watchlist_recap_composition_revisions (
  composition_revision_id TEXT PRIMARY KEY ${uuid("composition_revision_id")},
  composition_id TEXT NOT NULL ${uuid("composition_id")},
  parent_composition_revision_id TEXT ${uuid("parent_composition_revision_id")},
  authored_by TEXT NOT NULL CHECK (authored_by IN ('generator', 'owner', 'post_snapshot')),
  body_text TEXT NOT NULL CHECK (length(body_text) BETWEEN 1 AND 4000),
  body_sha256 TEXT NOT NULL CHECK (length(body_sha256) = 64 AND body_sha256 NOT GLOB '*[^0-9a-f]*'),
  created_at_ms INTEGER NOT NULL CHECK (created_at_ms > 0),
  FOREIGN KEY (composition_id) REFERENCES platform_watchlist_recap_compositions(composition_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (parent_composition_revision_id) REFERENCES platform_watchlist_recap_composition_revisions(composition_revision_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT, WITHOUT ROWID;

CREATE INDEX platform_watchlist_recap_composition_revisions_idx
  ON platform_watchlist_recap_composition_revisions(composition_id, created_at_ms, composition_revision_id);

CREATE TABLE platform_watchlist_recap_post_attempts (
  post_attempt_id TEXT PRIMARY KEY ${uuid("post_attempt_id")},
  composition_id TEXT NOT NULL ${uuid("composition_id")},
  composition_revision_id TEXT NOT NULL ${uuid("composition_revision_id")},
  idempotency_key TEXT NOT NULL ${uuid("idempotency_key")},
  attempt_state TEXT NOT NULL CHECK (attempt_state IN ('pending', 'posted', 'failed')),
  receipt_json TEXT ${json("receipt_json")},
  posted_at_ms INTEGER CHECK (posted_at_ms IS NULL OR posted_at_ms > 0),
  created_at_ms INTEGER NOT NULL CHECK (created_at_ms > 0),
  updated_at_ms INTEGER NOT NULL CHECK (updated_at_ms >= created_at_ms),
  FOREIGN KEY (composition_id) REFERENCES platform_watchlist_recap_compositions(composition_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (composition_revision_id) REFERENCES platform_watchlist_recap_composition_revisions(composition_revision_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  UNIQUE(idempotency_key),
  CHECK ((attempt_state = 'posted' AND posted_at_ms IS NOT NULL AND receipt_json IS NOT NULL)
    OR (attempt_state IN ('pending', 'failed') AND posted_at_ms IS NULL))
) STRICT, WITHOUT ROWID;

CREATE INDEX platform_watchlist_recap_post_attempts_composition_idx
  ON platform_watchlist_recap_post_attempts(composition_id, created_at_ms);`;

export const platformWatchlistDailyRecapsMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0133_platform_watchlist_daily_recaps",
  executionOrder: 133,
  statements: Object.freeze([sql]),
});
