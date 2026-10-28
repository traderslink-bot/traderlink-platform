/**
 * ID-free, UNREGISTERED schema descriptor. Importing this file only creates
 * strings. Do not execute it or attach it to a migration without coordinator
 * allocation/current-baseline schema review. No database is opened here.
 */
const uuid = (column: string) => `CHECK(length(${column})=36 AND ${column}=lower(${column})
 AND substr(${column},15,1)='4' AND substr(${column},20,1) GLOB '[89ab]'
 AND substr(${column},9,1)='-' AND substr(${column},14,1)='-'
 AND substr(${column},19,1)='-' AND substr(${column},24,1)='-'
 AND length(replace(${column},'-',''))=32 AND replace(${column},'-','') NOT GLOB '*[^0-9a-f]*')`;
const utc = (column: string) => `CHECK(length(${column})=24 AND ${column}
 GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z')`;
const snowflake = (column: string) => `CHECK(length(${column}) BETWEEN 1 AND 20
 AND ${column} NOT GLOB '*[^0-9]*' AND substr(${column},1,1)!='0'
 AND (length(${column})<20 OR ${column}<='18446744073709551615'))`;

export const PARTNER_ALERT_SCHEMA_STATEMENTS: readonly string[] = Object.freeze([
  `CREATE TABLE partner_alert_partners (
    community_id TEXT PRIMARY KEY ${uuid("community_id")},
    owner_user_id TEXT NOT NULL ${uuid("owner_user_id")},
    source_guild_id TEXT NOT NULL UNIQUE ${snowflake("source_guild_id")},
    display_name TEXT NOT NULL CHECK(length(trim(display_name)) BETWEEN 1 AND 120),
    content_policy_json TEXT NOT NULL CHECK(json_valid(content_policy_json) AND length(content_policy_json)<=32000),
    status TEXT NOT NULL CHECK(status IN ('draft','awaiting_approval','setup_required','active','publishing_paused','suspended','ended')),
    review_requested INTEGER NOT NULL DEFAULT 0 CHECK(review_requested IN (0,1)),
    approved_at_utc TEXT ${utc("approved_at_utc")},
    approved_by_user_id TEXT,
    revision INTEGER NOT NULL CHECK(revision>=1),
    current_agreement_id TEXT,
    created_at_utc TEXT NOT NULL ${utc("created_at_utc")},
    updated_at_utc TEXT NOT NULL ${utc("updated_at_utc")},
    CHECK(updated_at_utc>=created_at_utc),
    UNIQUE(community_id,source_guild_id),
    FOREIGN KEY(community_id,source_guild_id) REFERENCES traderlink_communities(community_id,discord_guild_id) ON DELETE RESTRICT,
    FOREIGN KEY(owner_user_id) REFERENCES platform_users(user_id) ON DELETE RESTRICT,
    FOREIGN KEY(approved_by_user_id) REFERENCES platform_users(user_id) ON DELETE RESTRICT,
    FOREIGN KEY(community_id,current_agreement_id) REFERENCES partner_alert_publishing_agreements(community_id,agreement_id) ON DELETE RESTRICT
  ) STRICT`,
  `CREATE TABLE partner_alert_publishing_agreements (
    agreement_id TEXT PRIMARY KEY ${uuid("agreement_id")},
    community_id TEXT NOT NULL,
    version INTEGER NOT NULL CHECK(version>=1),
    terms_json TEXT NOT NULL CHECK(json_valid(terms_json) AND length(terms_json)<=16000),
    quote_json TEXT NOT NULL CHECK(json_valid(quote_json) AND length(quote_json)<=16000),
    contracted_channels INTEGER NOT NULL CHECK(contracted_channels BETWEEN 1 AND 250),
    proposed_by_user_id TEXT NOT NULL,
    proposed_at_utc TEXT NOT NULL ${utc("proposed_at_utc")},
    UNIQUE(community_id,version), UNIQUE(community_id,agreement_id),
    FOREIGN KEY(community_id) REFERENCES partner_alert_partners(community_id) ON DELETE RESTRICT,
    FOREIGN KEY(proposed_by_user_id) REFERENCES platform_users(user_id) ON DELETE RESTRICT
  ) STRICT`,
  `CREATE TABLE partner_alert_agreement_acceptances (
    agreement_id TEXT PRIMARY KEY,
    community_id TEXT NOT NULL,
    accepted_by_user_id TEXT NOT NULL,
    rules_version INTEGER NOT NULL CHECK(rules_version>=1),
    accepted_at_utc TEXT NOT NULL ${utc("accepted_at_utc")},
    FOREIGN KEY(community_id,agreement_id) REFERENCES partner_alert_publishing_agreements(community_id,agreement_id) ON DELETE RESTRICT,
    FOREIGN KEY(accepted_by_user_id) REFERENCES platform_users(user_id) ON DELETE RESTRICT
  ) STRICT`,
  `CREATE TABLE partner_alert_mappings (
    mapping_id TEXT PRIMARY KEY ${uuid("mapping_id")},
    community_id TEXT NOT NULL,
    source_guild_id TEXT NOT NULL,
    source_channel_id TEXT NOT NULL ${snowflake("source_channel_id")},
    display_name TEXT NOT NULL CHECK(length(trim(display_name)) BETWEEN 1 AND 120),
    destination_guild_id TEXT ${snowflake("destination_guild_id")},
    destination_channel_id TEXT UNIQUE ${snowflake("destination_channel_id")},
    destination_role_id TEXT UNIQUE ${snowflake("destination_role_id")},
    revision INTEGER NOT NULL CHECK(revision>=1),
    review_state TEXT NOT NULL CHECK(review_state IN ('draft','awaiting_approval','approved','withdrawn')),
    approved_revision INTEGER,
    ever_approved INTEGER NOT NULL DEFAULT 0 CHECK(ever_approved IN (0,1)),
    delivery_state TEXT NOT NULL DEFAULT 'paused' CHECK(delivery_state IN ('ready','paused')),
    activated_at_utc TEXT ${utc("activated_at_utc")},
    created_at_utc TEXT NOT NULL ${utc("created_at_utc")},
    updated_at_utc TEXT NOT NULL ${utc("updated_at_utc")},
    CHECK(updated_at_utc>=created_at_utc),
    CHECK(approved_revision IS NULL OR approved_revision=revision),
    CHECK(review_state!='approved' OR (approved_revision IS NOT NULL AND approved_revision=revision AND destination_guild_id IS NOT NULL
      AND destination_channel_id IS NOT NULL AND destination_role_id IS NOT NULL AND ever_approved=1)),
    CHECK(source_channel_id IS NOT destination_channel_id),
    UNIQUE(community_id,mapping_id), UNIQUE(community_id,source_channel_id),
    FOREIGN KEY(community_id,source_guild_id) REFERENCES partner_alert_partners(community_id,source_guild_id) ON DELETE RESTRICT
  ) STRICT`,
  `CREATE TRIGGER partner_alert_mapping_binding_immutable BEFORE UPDATE ON partner_alert_mappings
    WHEN OLD.ever_approved=1 AND (NEW.ever_approved!=1 OR NEW.source_guild_id IS NOT OLD.source_guild_id
      OR NEW.source_channel_id IS NOT OLD.source_channel_id OR NEW.destination_guild_id IS NOT OLD.destination_guild_id
      OR NEW.destination_channel_id IS NOT OLD.destination_channel_id OR NEW.destination_role_id IS NOT OLD.destination_role_id
      OR NEW.community_id IS NOT OLD.community_id)
    BEGIN SELECT RAISE(ABORT,'partner_alert_approved_binding_immutable'); END`,
  `CREATE TABLE partner_alert_offers (
    offer_id TEXT NOT NULL ${uuid("offer_id")},
    community_id TEXT NOT NULL,
    version INTEGER NOT NULL CHECK(version>=1),
    kind TEXT NOT NULL CHECK(kind IN ('channel','package')),
    offer_json TEXT NOT NULL CHECK(json_valid(offer_json) AND length(offer_json)<=32000),
    whop_environment TEXT NOT NULL CHECK(whop_environment IN ('sandbox','live')),
    whop_account_id TEXT NOT NULL,
    whop_product_id TEXT NOT NULL,
    whop_plan_id TEXT NOT NULL,
    review_state TEXT NOT NULL CHECK(review_state IN ('draft','awaiting_approval','approved','withdrawn')),
    created_at_utc TEXT NOT NULL ${utc("created_at_utc")},
    PRIMARY KEY(offer_id,version), UNIQUE(community_id,offer_id,version),
    UNIQUE(community_id,offer_id,version,whop_environment,whop_account_id),
    FOREIGN KEY(community_id) REFERENCES partner_alert_partners(community_id) ON DELETE RESTRICT
  ) STRICT`,
  `CREATE TRIGGER partner_alert_offer_version_immutable BEFORE UPDATE ON partner_alert_offers
    WHEN NEW.offer_id IS NOT OLD.offer_id OR NEW.community_id IS NOT OLD.community_id OR NEW.version IS NOT OLD.version
      OR NEW.kind IS NOT OLD.kind OR NEW.offer_json IS NOT OLD.offer_json OR NEW.whop_environment IS NOT OLD.whop_environment
      OR NEW.whop_account_id IS NOT OLD.whop_account_id OR NEW.whop_product_id IS NOT OLD.whop_product_id
      OR NEW.whop_plan_id IS NOT OLD.whop_plan_id OR NEW.created_at_utc IS NOT OLD.created_at_utc
    BEGIN SELECT RAISE(ABORT,'partner_alert_offer_version_immutable'); END`,
  `CREATE TABLE partner_alert_offer_channels (
    community_id TEXT NOT NULL,
    offer_id TEXT NOT NULL,
    offer_version INTEGER NOT NULL,
    mapping_id TEXT NOT NULL,
    PRIMARY KEY(offer_id,offer_version,mapping_id),
    FOREIGN KEY(community_id,offer_id,offer_version) REFERENCES partner_alert_offers(community_id,offer_id,version) ON DELETE RESTRICT,
    FOREIGN KEY(community_id,mapping_id) REFERENCES partner_alert_mappings(community_id,mapping_id) ON DELETE RESTRICT
  ) STRICT`,
  `CREATE TRIGGER partner_alert_offer_review_monotonic BEFORE UPDATE ON partner_alert_offers
    WHEN (OLD.review_state='approved' AND NEW.review_state NOT IN ('approved','withdrawn'))
      OR (OLD.review_state='withdrawn' AND NEW.review_state!='withdrawn')
    BEGIN SELECT RAISE(ABORT,'partner_alert_offer_review_closed'); END`,
  `CREATE TRIGGER partner_alert_offer_channel_insert BEFORE INSERT ON partner_alert_offer_channels
    WHEN NOT EXISTS(SELECT 1 FROM partner_alert_offers WHERE community_id=NEW.community_id
      AND offer_id=NEW.offer_id AND version=NEW.offer_version AND review_state='draft')
    BEGIN SELECT RAISE(ABORT,'partner_alert_offer_version_closed'); END`,
  `CREATE TABLE partner_alert_commands (
    actor_user_id TEXT NOT NULL,
    request_id TEXT NOT NULL ${uuid("request_id")},
    community_id TEXT NOT NULL,
    fingerprint_json TEXT NOT NULL CHECK(json_valid(fingerprint_json) AND length(fingerprint_json)<=64000),
    result_json TEXT NOT NULL CHECK(json_valid(result_json) AND length(result_json)<=16000),
    created_at_utc TEXT NOT NULL ${utc("created_at_utc")},
    PRIMARY KEY(actor_user_id,request_id),
    FOREIGN KEY(actor_user_id) REFERENCES platform_users(user_id) ON DELETE RESTRICT,
    FOREIGN KEY(community_id) REFERENCES partner_alert_partners(community_id) ON DELETE RESTRICT
  ) STRICT`,
  `CREATE TABLE partner_alert_audit_events (
    audit_event_id TEXT PRIMARY KEY ${uuid("audit_event_id")},
    community_id TEXT NOT NULL,
    actor_user_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK(length(action) BETWEEN 1 AND 100),
    resource_id TEXT NOT NULL CHECK(length(resource_id) BETWEEN 1 AND 128),
    detail_json TEXT NOT NULL CHECK(json_valid(detail_json) AND length(detail_json)<=16000),
    created_at_utc TEXT NOT NULL ${utc("created_at_utc")},
    FOREIGN KEY(community_id) REFERENCES partner_alert_partners(community_id) ON DELETE RESTRICT,
    FOREIGN KEY(actor_user_id) REFERENCES platform_users(user_id) ON DELETE RESTRICT
  ) STRICT`,
  `CREATE INDEX partner_alert_partner_queue ON partner_alert_partners(status,updated_at_utc,community_id)`,
  `CREATE INDEX partner_alert_mapping_review ON partner_alert_mappings(community_id,review_state,mapping_id)`,
  `CREATE INDEX partner_alert_offer_review ON partner_alert_offers(community_id,review_state,offer_id,version)`,
  `CREATE INDEX partner_alert_audit_recent ON partner_alert_audit_events(community_id,created_at_utc,audit_event_id)`,
  `CREATE TABLE partner_alert_whop_connections (
    connection_id TEXT PRIMARY KEY ${uuid("connection_id")},
    community_id TEXT NOT NULL,
    environment TEXT NOT NULL CHECK(environment IN ('sandbox','live')),
    whop_account_id TEXT NOT NULL,
    owner_user_ref TEXT NOT NULL CHECK(length(owner_user_ref)=64),
    encrypted_authorisation_json TEXT NOT NULL CHECK(json_valid(encrypted_authorisation_json)),
    status TEXT NOT NULL CHECK(status IN ('verified','disconnected','unverified')),
    verified_at_utc TEXT NOT NULL ${utc("verified_at_utc")},
    valid_until_utc TEXT NOT NULL ${utc("valid_until_utc")},
    UNIQUE(community_id,environment,whop_account_id), UNIQUE(community_id,connection_id),
    FOREIGN KEY(community_id) REFERENCES partner_alert_partners(community_id) ON DELETE RESTRICT
  ) STRICT`,
  `CREATE TABLE partner_alert_whop_identities (
    user_id TEXT NOT NULL,
    environment TEXT NOT NULL CHECK(environment IN ('sandbox','live')),
    whop_user_ref TEXT NOT NULL CHECK(length(whop_user_ref)=64),
    status TEXT NOT NULL CHECK(status IN ('verified','disconnected')),
    verified_at_utc TEXT NOT NULL ${utc("verified_at_utc")},
    PRIMARY KEY(user_id,environment), UNIQUE(environment,whop_user_ref),
    FOREIGN KEY(user_id) REFERENCES platform_users(user_id) ON DELETE RESTRICT
  ) STRICT`,
  `CREATE TABLE partner_alert_memberships (
    community_id TEXT NOT NULL,
    environment TEXT NOT NULL CHECK(environment IN ('sandbox','live')),
    membership_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    whop_user_ref TEXT NOT NULL CHECK(length(whop_user_ref)=64),
    whop_account_id TEXT NOT NULL,
    offer_id TEXT NOT NULL,
    offer_version INTEGER NOT NULL,
    state TEXT NOT NULL CHECK(state IN ('active','inactive','unknown')),
    basis TEXT NOT NULL CHECK(basis IN ('paid','trial','complimentary','unknown')),
    starts_at_utc TEXT NOT NULL ${utc("starts_at_utc")},
    valid_until_utc TEXT NOT NULL ${utc("valid_until_utc")},
    observed_at_utc TEXT NOT NULL ${utc("observed_at_utc")},
    PRIMARY KEY(environment,whop_account_id,membership_id),
    FOREIGN KEY(user_id) REFERENCES platform_users(user_id) ON DELETE RESTRICT,
    FOREIGN KEY(community_id,environment,whop_account_id) REFERENCES partner_alert_whop_connections(community_id,environment,whop_account_id) ON DELETE RESTRICT,
    FOREIGN KEY(community_id,offer_id,offer_version,environment,whop_account_id) REFERENCES partner_alert_offers(community_id,offer_id,version,whop_environment,whop_account_id) ON DELETE RESTRICT
  ) STRICT`,
  `CREATE INDEX partner_alert_member_access ON partner_alert_memberships(user_id,community_id,state,valid_until_utc)`,
  `CREATE TABLE partner_alert_whop_inbox (
    environment TEXT NOT NULL CHECK(environment IN ('sandbox','live')),
    whop_account_id TEXT NOT NULL,
    event_id TEXT NOT NULL,
    community_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    api_version_date TEXT NOT NULL,
    resource_kind TEXT NOT NULL CHECK(resource_kind IN ('membership','payment','account')),
    resource_id TEXT NOT NULL,
    payload_sha256 TEXT NOT NULL CHECK(length(payload_sha256)=64),
    status TEXT NOT NULL CHECK(status IN ('pending','processing','completed','failed')),
    attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts>=0),
    available_at_utc TEXT NOT NULL ${utc("available_at_utc")},
    lease_token TEXT,
    lease_until_utc TEXT,
    last_error_code TEXT,
    occurred_at_utc TEXT NOT NULL ${utc("occurred_at_utc")},
    received_at_utc TEXT NOT NULL ${utc("received_at_utc")},
    PRIMARY KEY(community_id,environment,whop_account_id,event_id),
    FOREIGN KEY(community_id) REFERENCES partner_alert_partners(community_id) ON DELETE RESTRICT
  ) STRICT`,
  `CREATE INDEX partner_alert_whop_inbox_ready ON partner_alert_whop_inbox(community_id,environment,whop_account_id,status,available_at_utc,event_id)`,
  `CREATE TABLE partner_alert_publishing_memberships (
    agreement_id TEXT PRIMARY KEY,
    community_id TEXT NOT NULL,
    environment TEXT NOT NULL CHECK(environment IN ('sandbox','live')),
    owner_account_id TEXT NOT NULL,
    publishing_membership_id TEXT NOT NULL,
    payer_user_ref TEXT NOT NULL CHECK(length(payer_user_ref)=64),
    state TEXT NOT NULL CHECK(state IN ('active','inactive','unknown')),
    observed_at_utc TEXT NOT NULL ${utc("observed_at_utc")},
    valid_until_utc TEXT NOT NULL ${utc("valid_until_utc")},
    UNIQUE(environment,owner_account_id,publishing_membership_id),
    FOREIGN KEY(community_id,agreement_id) REFERENCES partner_alert_publishing_agreements(community_id,agreement_id) ON DELETE RESTRICT
  ) STRICT`,
  `CREATE TABLE partner_alert_source_messages (
    community_id TEXT NOT NULL,
    source_guild_id TEXT NOT NULL,
    source_channel_id TEXT NOT NULL,
    message_id TEXT NOT NULL,
    revision INTEGER NOT NULL CHECK(revision>=1),
    state TEXT NOT NULL CHECK(state IN ('received','allowed','held','deleted','expired')),
    text_content TEXT CHECK(text_content IS NULL OR length(text_content)<=32000),
    source_created_at_utc TEXT ${utc("source_created_at_utc")},
    source_edited_at_utc TEXT,
    hold_issues_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(hold_issues_json)),
    retain_until_utc TEXT NOT NULL ${utc("retain_until_utc")},
    PRIMARY KEY(community_id,source_channel_id,message_id),
    UNIQUE(community_id,source_channel_id,message_id,revision),
    FOREIGN KEY(community_id,source_guild_id) REFERENCES partner_alert_partners(community_id,source_guild_id) ON DELETE RESTRICT
  ) STRICT`,
  `CREATE TABLE partner_alert_source_revisions (
    community_id TEXT NOT NULL,
    source_channel_id TEXT NOT NULL,
    message_id TEXT NOT NULL,
    revision INTEGER NOT NULL CHECK(revision>=1),
    state TEXT NOT NULL CHECK(state IN ('allowed','held','deleted')),
    hold_issues_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(hold_issues_json)),
    text_content TEXT CHECK(text_content IS NULL OR length(text_content)<=32000),
    observed_at_utc TEXT NOT NULL ${utc("observed_at_utc")},
    PRIMARY KEY(community_id,source_channel_id,message_id,revision),
    FOREIGN KEY(community_id,source_channel_id,message_id) REFERENCES partner_alert_source_messages(community_id,source_channel_id,message_id) ON DELETE RESTRICT
  ) STRICT`,
  `CREATE TRIGGER partner_alert_source_tombstone BEFORE UPDATE ON partner_alert_source_messages
    WHEN OLD.state='deleted' AND NEW.state NOT IN ('deleted','expired')
    BEGIN SELECT RAISE(ABORT,'partner_alert_source_deleted'); END`,
  `CREATE TABLE partner_alert_mirrored_parts (
    community_id TEXT NOT NULL,
    mapping_id TEXT NOT NULL,
    source_channel_id TEXT NOT NULL,
    message_id TEXT NOT NULL,
    part_index INTEGER NOT NULL CHECK(part_index>=0),
    destination_message_id TEXT,
    state TEXT NOT NULL CHECK(state IN ('active','uncertain','deleted')),
    source_revision INTEGER NOT NULL CHECK(source_revision>=1),
    PRIMARY KEY(mapping_id,message_id,part_index),
    FOREIGN KEY(community_id,mapping_id) REFERENCES partner_alert_mappings(community_id,mapping_id) ON DELETE RESTRICT,
    FOREIGN KEY(community_id,source_channel_id,message_id) REFERENCES partner_alert_source_messages(community_id,source_channel_id,message_id) ON DELETE RESTRICT
  ) STRICT`,
  `CREATE TABLE partner_alert_deliveries (
    delivery_id TEXT PRIMARY KEY ${uuid("delivery_id")},
    community_id TEXT NOT NULL,
    mapping_id TEXT NOT NULL,
    source_channel_id TEXT NOT NULL,
    message_id TEXT NOT NULL,
    source_revision INTEGER NOT NULL CHECK(source_revision>=1),
    part_index INTEGER NOT NULL CHECK(part_index>=0),
    action TEXT NOT NULL CHECK(action IN ('create','edit','delete')),
    status TEXT NOT NULL CHECK(status IN ('pending','sending','delivered','failed','uncertain','cancelled')),
    destination_message_id TEXT,
    text_content TEXT CHECK(text_content IS NULL OR length(text_content)<=2000),
    last_error_code TEXT,
    attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts>=0),
    next_attempt_at_utc TEXT NOT NULL ${utc("next_attempt_at_utc")},
    lease_token TEXT,
    lease_until_utc TEXT,
    UNIQUE(mapping_id,message_id,source_revision,part_index,action),
    FOREIGN KEY(community_id,mapping_id) REFERENCES partner_alert_mappings(community_id,mapping_id) ON DELETE RESTRICT,
    FOREIGN KEY(community_id,source_channel_id,message_id,source_revision) REFERENCES partner_alert_source_revisions(community_id,source_channel_id,message_id,revision) ON DELETE RESTRICT
  ) STRICT`,
  `CREATE INDEX partner_alert_delivery_ready ON partner_alert_deliveries(status,next_attempt_at_utc,delivery_id)`,
  `CREATE TABLE partner_alert_role_jobs (
    community_id TEXT NOT NULL,
    mapping_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    discord_user_id TEXT NOT NULL ${snowflake("discord_user_id")},
    desired_present INTEGER NOT NULL CHECK(desired_present IN (0,1)),
    applied_present INTEGER CHECK(applied_present IS NULL OR applied_present IN (0,1)),
    authority_revision INTEGER NOT NULL CHECK(authority_revision>=1),
    decision_revision INTEGER NOT NULL CHECK(decision_revision>=1),
    decision_valid_until_utc TEXT,
    desired_ticket_json TEXT NOT NULL CHECK(json_valid(desired_ticket_json) AND json_type(desired_ticket_json)='object'
      AND json_type(desired_ticket_json,'$.premium') IS 'object' AND json_type(desired_ticket_json,'$.context') IS 'object'),
    refresh_required INTEGER NOT NULL DEFAULT 1 CHECK(refresh_required IN (0,1)),
    rate_limit_until_utc TEXT,
    managed_assignment_ref TEXT,
    outcome_json TEXT CHECK(outcome_json IS NULL OR (json_valid(outcome_json) AND json_type(outcome_json)='object')),
    status TEXT NOT NULL CHECK(status IN ('pending','applying','applied','failed','uncertain','held')),
    next_attempt_at_utc TEXT NOT NULL ${utc("next_attempt_at_utc")},
    attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts>=0),
    lease_token TEXT,
    lease_until_utc TEXT,
    in_flight_present INTEGER CHECK(in_flight_present IS NULL OR in_flight_present IN (0,1)),
    in_flight_revision INTEGER,
    in_flight_intent_json TEXT CHECK(in_flight_intent_json IS NULL OR (json_valid(in_flight_intent_json)
      AND json_type(in_flight_intent_json,'$.ticket.premium') IS 'object'
      AND json_type(in_flight_intent_json,'$.ticket.context') IS 'object')),
    last_error_code TEXT,
    PRIMARY KEY(mapping_id,user_id,discord_user_id),
    CHECK((status IN ('applying','uncertain'))=(lease_token IS NOT NULL)),
    CHECK((lease_token IS NULL)=(lease_until_utc IS NULL)),
    CHECK((lease_token IS NULL)=(in_flight_intent_json IS NULL)),
    CHECK(json_extract(desired_ticket_json,'$.context.communityId')=community_id),
    CHECK(json_extract(desired_ticket_json,'$.context.mappingId')=mapping_id),
    CHECK(json_extract(desired_ticket_json,'$.context.userId')=user_id),
    FOREIGN KEY(community_id,mapping_id) REFERENCES partner_alert_mappings(community_id,mapping_id) ON DELETE RESTRICT,
    FOREIGN KEY(user_id) REFERENCES platform_users(user_id) ON DELETE RESTRICT
  ) STRICT`,
  `CREATE INDEX partner_alert_role_job_ready ON partner_alert_role_jobs(status,next_attempt_at_utc,desired_present)`,
  /** Diagnostic refresh outbox only: expiry/false eligibility never means unpaid.
   * Full ORIGINAL Premium event/ticket retained; lifecycle is UNQUALIFIED. */
  `CREATE TABLE partner_alert_premium_refresh_events (
    authority_key TEXT NOT NULL,user_id TEXT NOT NULL REFERENCES platform_users(user_id) ON DELETE RESTRICT,
    authority_revision INTEGER NOT NULL CHECK(authority_revision>0),observed_at_utc TEXT NOT NULL ${utc("observed_at_utc")},
    reason TEXT NOT NULL CHECK(reason IN ('observation','expiry')),
    event_json TEXT NOT NULL CHECK(json_valid(event_json) AND json_type(event_json)='object'
      AND json_type(event_json,'$.ticket') IS 'object'),
    processed_at_utc TEXT,
    PRIMARY KEY(authority_key,authority_revision,observed_at_utc,reason),
    CHECK(json_extract(event_json,'$.ticket.scope.authorityKey')=authority_key),
    CHECK(json_extract(event_json,'$.ticket.scope.userId')=user_id)
  ) STRICT, WITHOUT ROWID`,
  `CREATE TRIGGER partner_alert_premium_refresh_event_immutable BEFORE UPDATE OF authority_key,user_id,
    authority_revision,observed_at_utc,reason,event_json ON partner_alert_premium_refresh_events
    BEGIN SELECT RAISE(ABORT,'partner_alert_event_immutable'); END`,
  `CREATE TABLE partner_alert_ingress_sessions (
    receiver_key TEXT PRIMARY KEY,
    destination_guild_id TEXT NOT NULL ${snowflake("destination_guild_id")},
    session_id TEXT,
    resume_sequence INTEGER CHECK(resume_sequence IS NULL OR resume_sequence>=0),
    gap_state TEXT NOT NULL CHECK(gap_state IN ('clear','detected','recovering','unrecoverable')),
    updated_at_utc TEXT NOT NULL ${utc("updated_at_utc")}
  ) STRICT`,
  ...["partner_alert_publishing_agreements", "partner_alert_agreement_acceptances",
    "partner_alert_offer_channels", "partner_alert_commands", "partner_alert_audit_events"]
    .flatMap(table => [
      `CREATE TRIGGER ${table}_no_update BEFORE UPDATE ON ${table}
       BEGIN SELECT RAISE(ABORT,'partner_alert_append_only'); END`,
      `CREATE TRIGGER ${table}_no_delete BEFORE DELETE ON ${table}
       BEGIN SELECT RAISE(ABORT,'partner_alert_append_only'); END`,
    ]),
  `CREATE TRIGGER partner_alert_offer_no_delete BEFORE DELETE ON partner_alert_offers
    BEGIN SELECT RAISE(ABORT,'partner_alert_append_only'); END`,
]);

export const PARTNER_ALERT_SCHEMA = Object.freeze({ kind: "id_free_descriptor" as const,
  statements: PARTNER_ALERT_SCHEMA_STATEMENTS, canRegister: false as const, payloadRetentionQualified: false as const,
  requires: Object.freeze(["current_native_and_admitted_writer_bindings", "full_original_ticket_lifecycle",
    "community_provider_identity_and_erasure_fences", "cross_owner_json_root_outbox_claim_outcome_retention"]) });
