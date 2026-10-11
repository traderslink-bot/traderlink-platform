/** Additive migration statements. Register with the coordinator-assigned migration
 * identity before integration; runtime code must never create its own schema. */
export const membershipPlanEditorStatements = Object.freeze([
  `CREATE TABLE platform_notification_default_on (
    singleton INTEGER PRIMARY KEY CHECK(singleton=1)
  ) STRICT;`,
  `INSERT INTO platform_notification_default_on VALUES (1);`,
  `CREATE TABLE platform_membership_page_plans (
    share_link_id TEXT NOT NULL REFERENCES platform_membership_share_links(share_link_id),
    plan_id TEXT NOT NULL REFERENCES platform_membership_plans(plan_id),
    PRIMARY KEY(share_link_id,plan_id)
  ) STRICT, WITHOUT ROWID;`,
  `CREATE TABLE platform_membership_discord_retained_access (
    user_id TEXT NOT NULL REFERENCES platform_users(user_id),
    plan_id TEXT NOT NULL REFERENCES platform_membership_plans(plan_id),
    rule_id TEXT NOT NULL REFERENCES platform_membership_discord_offer_rules(discord_offer_rule_id),
    created_at_utc TEXT NOT NULL,
    PRIMARY KEY(user_id,plan_id,rule_id)
  ) STRICT, WITHOUT ROWID;`,
  `CREATE TABLE platform_membership_usage_carryovers (
    user_id TEXT NOT NULL REFERENCES platform_users(user_id),
    plan_version_id TEXT NOT NULL REFERENCES platform_membership_plan_versions(plan_version_id),
    feature_key TEXT NOT NULL REFERENCES platform_membership_feature_definitions(feature_key),
    from_at_utc TEXT NOT NULL,
    until_at_utc TEXT,
    PRIMARY KEY(user_id,plan_version_id,feature_key)
  ) STRICT, WITHOUT ROWID;`,
  `CREATE TABLE platform_membership_editor_drafts (
    draft_id TEXT PRIMARY KEY,
    plan_id TEXT REFERENCES platform_membership_plans(plan_id),
    document_json TEXT NOT NULL CHECK(json_valid(document_json)),
    revision INTEGER NOT NULL CHECK(revision>0),
    status TEXT NOT NULL CHECK(status IN ('editing','published','discarded')),
    created_by_user_id TEXT NOT NULL REFERENCES platform_users(user_id),
    created_at_utc TEXT NOT NULL,
    updated_at_utc TEXT NOT NULL
  ) STRICT;`,
  `CREATE UNIQUE INDEX platform_membership_editor_one_active_draft
    ON platform_membership_editor_drafts(plan_id) WHERE plan_id IS NOT NULL AND status='editing';`,
  `CREATE TABLE platform_membership_editor_receipts (
    actor_user_id TEXT NOT NULL REFERENCES platform_users(user_id),
    request_id TEXT NOT NULL,
    payload_sha256 TEXT NOT NULL,
    result_json TEXT NOT NULL CHECK(json_valid(result_json)),
    created_at_utc TEXT NOT NULL,
    PRIMARY KEY(actor_user_id,request_id)
  ) STRICT, WITHOUT ROWID;`,
  `CREATE TABLE platform_membership_plan_presentations (
    plan_version_id TEXT PRIMARY KEY REFERENCES platform_membership_plan_versions(plan_version_id),
    document_json TEXT NOT NULL CHECK(json_valid(document_json)),
    display_only INTEGER NOT NULL CHECK(display_only IN (0,1))
  ) STRICT;`,
  `CREATE TABLE platform_membership_feature_usage_anchors (
    plan_version_id TEXT NOT NULL REFERENCES platform_membership_plan_versions(plan_version_id),
    feature_key TEXT NOT NULL REFERENCES platform_membership_feature_definitions(feature_key),
    anchor_at_utc TEXT NOT NULL,
    PRIMARY KEY(plan_version_id,feature_key)
  ) STRICT, WITHOUT ROWID;`,
  `CREATE TABLE platform_membership_trial_lineage (
    trial_campaign_id TEXT PRIMARY KEY REFERENCES platform_membership_trial_campaigns(trial_campaign_id),
    family_id TEXT NOT NULL
  ) STRICT;`,
  `CREATE INDEX platform_membership_trial_lineage_family ON platform_membership_trial_lineage(family_id);`,
  `INSERT INTO platform_membership_trial_lineage(trial_campaign_id,family_id)
    SELECT trial_campaign_id,trial_campaign_id FROM platform_membership_trial_campaigns;`,
  `CREATE TABLE platform_membership_trial_terms (
    trial_campaign_id TEXT PRIMARY KEY REFERENCES platform_membership_trial_campaigns(trial_campaign_id),
    end_behavior TEXT NOT NULL CHECK(end_behavior IN ('end_access','renew'))
  ) STRICT;`,
]);
