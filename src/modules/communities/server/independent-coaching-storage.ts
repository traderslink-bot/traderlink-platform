/** Additive independent human coaching context. No Discord/community foreign keys. */
export const independentCoachingStatements = Object.freeze([
  `CREATE TABLE traderlink_coaching_contexts (
    context_id TEXT PRIMARY KEY,coach_user_id TEXT NOT NULL UNIQUE REFERENCES platform_users(user_id),
    profile_json TEXT NOT NULL CHECK(json_valid(profile_json)),
    created_at_utc TEXT NOT NULL,updated_at_utc TEXT NOT NULL
  ) STRICT;`,
  `CREATE TABLE traderlink_coaching_plans (
    plan_id TEXT PRIMARY KEY,context_id TEXT NOT NULL REFERENCES traderlink_coaching_contexts(context_id),
    revision INTEGER NOT NULL CHECK(revision>0),status TEXT NOT NULL CHECK(status IN ('draft','active','paused','archived')),
    created_at_utc TEXT NOT NULL,updated_at_utc TEXT NOT NULL,UNIQUE(plan_id,context_id)
  ) STRICT;`,
  `CREATE TABLE traderlink_coaching_plan_versions (
    plan_id TEXT NOT NULL REFERENCES traderlink_coaching_plans(plan_id),revision INTEGER NOT NULL CHECK(revision>0),
    terms_json TEXT NOT NULL CHECK(json_valid(terms_json)),created_at_utc TEXT NOT NULL,PRIMARY KEY(plan_id,revision)
  ) STRICT;`,
  `CREATE TABLE traderlink_coaching_enrollments (
    enrollment_id TEXT PRIMARY KEY,context_id TEXT NOT NULL REFERENCES traderlink_coaching_contexts(context_id),
    plan_id TEXT NOT NULL,student_user_id TEXT NOT NULL REFERENCES platform_users(user_id),
    status TEXT NOT NULL CHECK(status IN ('pending','active','declined','ended')),
    requested_at_utc TEXT NOT NULL,updated_at_utc TEXT NOT NULL,
    UNIQUE(context_id,plan_id,student_user_id),FOREIGN KEY(plan_id,context_id) REFERENCES traderlink_coaching_plans(plan_id,context_id)
  ) STRICT;`,
  `CREATE TABLE traderlink_coaching_accepted_terms (
    agreement_id TEXT PRIMARY KEY,enrollment_id TEXT NOT NULL REFERENCES traderlink_coaching_enrollments(enrollment_id),
    revision INTEGER NOT NULL CHECK(revision>0),status TEXT NOT NULL CHECK(status IN ('proposed','accepted','superseded','withdrawn')),
    terms_json TEXT NOT NULL CHECK(json_valid(terms_json)),proposed_at_utc TEXT NOT NULL,accepted_at_utc TEXT,
    UNIQUE(enrollment_id,revision)
  ) STRICT;`,
  `CREATE UNIQUE INDEX traderlink_coaching_one_current_agreement ON traderlink_coaching_accepted_terms(enrollment_id) WHERE status='accepted';`,
  `CREATE UNIQUE INDEX traderlink_independent_coaching_one_proposed_agreement ON traderlink_coaching_accepted_terms(enrollment_id) WHERE status='proposed';`,
  `CREATE TABLE traderlink_coaching_journal_access (
    grant_id TEXT PRIMARY KEY,enrollment_id TEXT NOT NULL REFERENCES traderlink_coaching_enrollments(enrollment_id),
    student_user_id TEXT NOT NULL REFERENCES platform_users(user_id),journal_account_id TEXT NOT NULL REFERENCES journal_accounts(account_id),
    scopes_json TEXT NOT NULL CHECK(json_valid(scopes_json)),status TEXT NOT NULL CHECK(status IN ('active','revoked')),
    granted_at_utc TEXT NOT NULL,revoked_at_utc TEXT
  ) STRICT;`,
  `CREATE TABLE traderlink_coaching_reviews (
    review_id TEXT PRIMARY KEY,enrollment_id TEXT NOT NULL REFERENCES traderlink_coaching_enrollments(enrollment_id),
    agreement_id TEXT NOT NULL REFERENCES traderlink_coaching_accepted_terms(agreement_id),plan_item_id TEXT NOT NULL,
    occurrence_index INTEGER NOT NULL CHECK(occurrence_index>=0),kind TEXT NOT NULL,
    journal_account_id TEXT REFERENCES journal_accounts(account_id),period_start TEXT,period_end TEXT,due_at_utc TEXT,submitted_at_utc TEXT,
    status TEXT NOT NULL CHECK(status IN ('awaiting_submission','ready','draft','delivered','cancelled')),
    selected_days_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(selected_days_json)),
    draft_json TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(draft_json)),delivered_json TEXT CHECK(delivered_json IS NULL OR json_valid(delivered_json)),
    created_at_utc TEXT NOT NULL,updated_at_utc TEXT NOT NULL,delivered_at_utc TEXT,
    UNIQUE(agreement_id,plan_item_id,occurrence_index)
  ) STRICT;`,
  `CREATE TABLE traderlink_coaching_review_trades (
    review_id TEXT NOT NULL REFERENCES traderlink_coaching_reviews(review_id),round_trip_id TEXT NOT NULL,logical_trade_id TEXT NOT NULL,
    feedback_json TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(feedback_json)),completed INTEGER NOT NULL DEFAULT 0 CHECK(completed IN (0,1)),
    updated_at_utc TEXT NOT NULL,PRIMARY KEY(review_id,round_trip_id)
  ) STRICT;`,
  `CREATE TABLE traderlink_coaching_work (
    work_id TEXT PRIMARY KEY,enrollment_id TEXT NOT NULL REFERENCES traderlink_coaching_enrollments(enrollment_id),
    agreement_id TEXT REFERENCES traderlink_coaching_accepted_terms(agreement_id),
    kind TEXT NOT NULL CHECK(kind IN ('task','session','lesson','check_in','follow_up')),
    data_json TEXT NOT NULL CHECK(json_valid(data_json)),status TEXT NOT NULL CHECK(status IN ('open','scheduled','assigned','completed','cancelled')),
    due_at_utc TEXT,created_at_utc TEXT NOT NULL,updated_at_utc TEXT NOT NULL
  ) STRICT;`,
  `CREATE TABLE traderlink_coaching_messages (
    message_id TEXT PRIMARY KEY,enrollment_id TEXT NOT NULL REFERENCES traderlink_coaching_enrollments(enrollment_id),
    sender_user_id TEXT NOT NULL REFERENCES platform_users(user_id),body TEXT NOT NULL,
    created_at_utc TEXT NOT NULL
  ) STRICT;`,
  `CREATE TABLE traderlink_coaching_events (
    event_id TEXT PRIMARY KEY,enrollment_id TEXT NOT NULL REFERENCES traderlink_coaching_enrollments(enrollment_id),
    actor_user_id TEXT NOT NULL REFERENCES platform_users(user_id),kind TEXT NOT NULL,object_id TEXT NOT NULL,
    created_at_utc TEXT NOT NULL
  ) STRICT;`,
  `CREATE TABLE traderlink_coaching_fulfillment_batches (
    fulfillment_key TEXT PRIMARY KEY,agreement_id TEXT NOT NULL REFERENCES traderlink_coaching_accepted_terms(agreement_id),
    occurrences_json TEXT NOT NULL CHECK(json_valid(occurrences_json)),work_ids_json TEXT NOT NULL CHECK(json_valid(work_ids_json)),
    created_at_utc TEXT NOT NULL
  ) STRICT;`,
  `CREATE TABLE traderlink_coaching_commercial_policies (
    scope TEXT NOT NULL CHECK(scope IN ('community','platform')),scope_key TEXT NOT NULL,revision INTEGER NOT NULL CHECK(revision>0),
    policy_json TEXT NOT NULL CHECK(json_valid(policy_json)),updated_by_user_id TEXT NOT NULL REFERENCES platform_users(user_id),updated_at_utc TEXT NOT NULL,
    PRIMARY KEY(scope,scope_key,revision),CHECK(scope!='platform' OR scope_key='platform')
  ) STRICT;`,
  `CREATE TABLE traderlink_coaching_questions (
    question_id TEXT PRIMARY KEY,work_id TEXT NOT NULL REFERENCES traderlink_coaching_work(work_id),
    submission_key TEXT NOT NULL,body TEXT NOT NULL,created_at_utc TEXT NOT NULL,UNIQUE(work_id,submission_key)
  ) STRICT;`,
  `CREATE TABLE traderlink_coaching_question_answers (
    question_id TEXT NOT NULL REFERENCES traderlink_coaching_questions(question_id),revision INTEGER NOT NULL CHECK(revision>0),
    body TEXT NOT NULL,answered_at_utc TEXT NOT NULL,PRIMARY KEY(question_id,revision)
  ) STRICT;`,
  `CREATE TABLE traderlink_coaching_student_notes (
    enrollment_id TEXT NOT NULL REFERENCES traderlink_coaching_enrollments(enrollment_id),revision INTEGER NOT NULL CHECK(revision>0),
    body TEXT NOT NULL,created_at_utc TEXT NOT NULL,PRIMARY KEY(enrollment_id,revision)
  ) STRICT;`,
  `CREATE TABLE traderlink_coaching_student_goals (
    enrollment_id TEXT NOT NULL REFERENCES traderlink_coaching_enrollments(enrollment_id),revision INTEGER NOT NULL CHECK(revision>0),
    body TEXT NOT NULL,created_at_utc TEXT NOT NULL,PRIMARY KEY(enrollment_id,revision)
  ) STRICT;`,
  `CREATE TABLE traderlink_coaching_review_goals (
    review_id TEXT PRIMARY KEY REFERENCES traderlink_coaching_reviews(review_id),body TEXT NOT NULL,
    source_revision INTEGER NOT NULL CHECK(source_revision>=0),captured_at_utc TEXT NOT NULL
  ) STRICT;`,
  `CREATE TABLE traderlink_coaching_review_images (
    image_id TEXT PRIMARY KEY,review_id TEXT NOT NULL REFERENCES traderlink_coaching_reviews(review_id),round_trip_id TEXT NOT NULL DEFAULT '',
    filename TEXT NOT NULL,media_type TEXT NOT NULL CHECK(media_type IN ('image/png','image/jpeg','image/webp')),
    sha256 TEXT NOT NULL,content BLOB NOT NULL,created_at_utc TEXT NOT NULL,
    UNIQUE(review_id,round_trip_id,sha256)
  ) STRICT;`,
  `CREATE TABLE traderlink_coaching_commercial_enrollments (
    coach_user_id TEXT NOT NULL REFERENCES platform_users(user_id),environment TEXT NOT NULL CHECK(environment IN ('sandbox','live')),
    scope TEXT NOT NULL CHECK(scope IN ('community','platform')),scope_key TEXT NOT NULL,policy_version TEXT NOT NULL,
    consented_at_utc TEXT NOT NULL,PRIMARY KEY(coach_user_id,environment,scope,scope_key,policy_version)
  ) STRICT;`,
  `CREATE TABLE traderlink_coaching_commission_setup_checks (
    coach_user_id TEXT NOT NULL REFERENCES platform_users(user_id),environment TEXT NOT NULL CHECK(environment IN ('sandbox','live')),
    scope TEXT NOT NULL CHECK(scope IN ('community','platform')),scope_key TEXT NOT NULL,policy_version TEXT NOT NULL,
    merchant_account_id TEXT NOT NULL,commission_basis_points INTEGER NOT NULL CHECK(commission_basis_points BETWEEN 0 AND 10000),
    verified_at_utc TEXT NOT NULL,PRIMARY KEY(coach_user_id,environment,scope,scope_key,policy_version)
  ) STRICT;`,
  `CREATE TABLE traderlink_coaching_action_receipts (
    actor_user_id TEXT NOT NULL REFERENCES platform_users(user_id),request_id TEXT NOT NULL,payload_sha256 TEXT NOT NULL,
    result_json TEXT NOT NULL CHECK(json_valid(result_json)),created_at_utc TEXT NOT NULL,PRIMARY KEY(actor_user_id,request_id)
  ) STRICT;`,
  `CREATE TABLE traderlink_coaching_coach_commission_rates (
    coach_user_id TEXT NOT NULL REFERENCES platform_users(user_id),revision INTEGER NOT NULL CHECK(revision>0),
    commission_basis_points INTEGER CHECK(commission_basis_points BETWEEN 0 AND 10000),
    updated_by_user_id TEXT NOT NULL REFERENCES platform_users(user_id),updated_at_utc TEXT NOT NULL,
    PRIMARY KEY(coach_user_id,revision)
  ) STRICT;`,
  `CREATE TABLE traderlink_coaching_review_follow_up (
    review_id TEXT PRIMARY KEY REFERENCES traderlink_coaching_reviews(review_id),viewed_at_utc TEXT,follow_up_due_at_utc TEXT,completed_at_utc TEXT
  ) STRICT;`,
  `CREATE TABLE traderlink_coaching_review_replies (
    reply_id TEXT PRIMARY KEY,review_id TEXT NOT NULL REFERENCES traderlink_coaching_reviews(review_id),
    author_user_id TEXT NOT NULL REFERENCES platform_users(user_id),body TEXT NOT NULL,created_at_utc TEXT NOT NULL
  ) STRICT;`,
]);
