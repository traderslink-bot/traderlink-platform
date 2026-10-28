/** ID-free SQL descriptor ONLY. Import/construction executes no SQL. Coordinator
 * owns migration identity/order/manifest. Authority/payment producer tables are
 * deliberately not defined here. Erasure/retention qualification is still required:
 * role/event scope JSON includes a Platform UUID even without ownership FKs. */
const ref = (c: string) => `CHECK(length(${c}) BETWEEN 1 AND 160 AND ${c} NOT GLOB '*[^A-Za-z0-9_:-]*')`;
const snowflake = (c: string) => `CHECK(length(${c}) BETWEEN 1 AND 20 AND substr(${c},1,1) <> '0'
  AND ${c} NOT GLOB '*[^0-9]*' AND (length(${c}) < 20 OR ${c} <= '18446744073709551615'))`;
const utc = (c: string) => `length(${c})=24 AND ${c} GLOB
  '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'`;
const object = (c: string) => `CHECK(length(${c}) BETWEEN 2 AND 262144 AND json_valid(${c}) AND json_type(${c})='object')`;

export const PLATFORM_PREMIUM_ROLE_TABLES = Object.freeze([
  "platform_premium_role_jobs", "platform_premium_paid_events", "platform_premium_role_cooldowns",
  "platform_premium_discovery_epochs", "platform_premium_discovery_current", "platform_premium_discovery_candidates",
  "platform_premium_role_review", "platform_premium_discovery_cooldowns", "platform_premium_external_cleanup",
] as const);

export const PLATFORM_PREMIUM_ROLE_SCHEMA_SQL: readonly string[] = Object.freeze([
  `CREATE TABLE platform_premium_role_jobs (
    guild_id TEXT NOT NULL ${snowflake("guild_id")},
    discord_user_id TEXT NOT NULL ${snowflake("discord_user_id")},
    role_id TEXT NOT NULL ${snowflake("role_id")},
    authority_key TEXT NOT NULL ${ref("authority_key")},
    version INTEGER NOT NULL CHECK(version BETWEEN 1 AND 9007199254740991),
    state TEXT NOT NULL CHECK(state IN ('pending','retry','applying','uncertain','confirmed','held')),
    desired TEXT NOT NULL CHECK(desired IN ('present','absent','hold')),
    valid_until_utc TEXT CHECK(valid_until_utc IS NULL OR (${utc("valid_until_utc")})),
    next_attempt_at_utc TEXT NOT NULL CHECK(${utc("next_attempt_at_utc")}),
    attempts INTEGER NOT NULL CHECK(attempts BETWEEN 0 AND 8),
    lease_token TEXT ${ref("lease_token")},
    lease_until_utc TEXT CHECK(lease_until_utc IS NULL OR (${utc("lease_until_utc")})),
    actual_present INTEGER CHECK(actual_present IN (0,1)),
    job_json TEXT NOT NULL ${object("job_json")},
    PRIMARY KEY(guild_id,discord_user_id,role_id),
    CHECK(guild_id <> role_id),
    CHECK((lease_token IS NULL)=(lease_until_utc IS NULL)),
    CHECK((state IN ('applying','uncertain'))=(lease_token IS NOT NULL)),
    CHECK(state <> 'confirmed' OR actual_present IS NOT NULL),
    CHECK(json_extract(job_json,'$.intent.target.guildId')=guild_id),
    CHECK(json_extract(job_json,'$.intent.target.discordUserId')=discord_user_id),
    CHECK(json_extract(job_json,'$.intent.target.roleId')=role_id),
    CHECK(json_extract(job_json,'$.intent.target.authorityKey')=authority_key),
    CHECK(json_extract(job_json,'$.version')=version),
    CHECK(json_extract(job_json,'$.state')=state),
    CHECK(json_extract(job_json,'$.intent.desired')=desired),
    CHECK(json_type(job_json,'$.intent.ticket') IS 'object'),
    CHECK(json_type(job_json,'$.intent.ticket.scope') IS 'object'),
    CHECK(json_type(job_json,'$.intent.ticket.whopGeneration') IS 'integer'),
    CHECK(json_extract(job_json,'$.intent.ticket.whopGeneration')>0),
    CHECK(json_type(job_json,'$.intent.ticket.admissionRef') IS 'text'),
    CHECK(json_type(job_json,'$.intent.ticket.factsSha256') IS 'text'),
    CHECK(length(json_extract(job_json,'$.intent.ticket.factsSha256'))=64),
    CHECK(json_extract(job_json,'$.intent.ticket.scope.authorityKey')=authority_key),
    CHECK(json_extract(job_json,'$.intent.ticket.validUntilUtc')>json_extract(job_json,'$.intent.atUtc')),
    CHECK(state NOT IN ('applying','uncertain') OR json_type(job_json,'$.lease.intent.ticket') IS 'object')
  ) STRICT, WITHOUT ROWID`,
  `CREATE INDEX platform_premium_role_jobs_due ON platform_premium_role_jobs(guild_id,role_id,state,next_attempt_at_utc)`,
  `CREATE INDEX platform_premium_role_jobs_expiry ON platform_premium_role_jobs(guild_id,role_id,state,valid_until_utc)`,
  `CREATE INDEX platform_premium_role_jobs_leases ON platform_premium_role_jobs(guild_id,role_id,state,lease_until_utc)`,
  `CREATE TABLE platform_premium_paid_events (
    guild_id TEXT NOT NULL ${snowflake("guild_id")},
    paid_role_id TEXT NOT NULL ${snowflake("paid_role_id")},
    authority_key TEXT NOT NULL ${ref("authority_key")},
    authority_revision INTEGER NOT NULL CHECK(authority_revision BETWEEN 1 AND 9007199254740991),
    observed_at_utc TEXT NOT NULL CHECK(${utc("observed_at_utc")}),
    paid_eligible INTEGER NOT NULL CHECK(paid_eligible IN (0,1)),
    valid_until_utc TEXT CHECK(valid_until_utc IS NULL OR (${utc("valid_until_utc")})),
    applied INTEGER NOT NULL DEFAULT 0 CHECK(applied IN (0,1)),
    expiry_applied INTEGER NOT NULL DEFAULT 0 CHECK(expiry_applied IN (0,1)),
    event_json TEXT NOT NULL ${object("event_json")},
    PRIMARY KEY(guild_id,paid_role_id,authority_key,authority_revision,observed_at_utc),
    CHECK(guild_id <> paid_role_id),
    CHECK(paid_eligible=0 OR (valid_until_utc IS NOT NULL AND valid_until_utc>observed_at_utc)),
    CHECK(json_extract(event_json,'$.authorityKey')=authority_key),
    CHECK(json_extract(event_json,'$.authorityRevision')=authority_revision),
    CHECK(json_extract(event_json,'$.scope.guildId')=guild_id),
    CHECK(json_extract(event_json,'$.observedAtUtc')=observed_at_utc),
    CHECK(json_type(event_json,'$.ticket') IS 'object'),
    CHECK(json_type(event_json,'$.ticket.scope') IS 'object'),
    CHECK(json_type(event_json,'$.ticket.whopGeneration') IS 'integer'),
    CHECK(json_extract(event_json,'$.ticket.whopGeneration')>0),
    CHECK(json_type(event_json,'$.ticket.admissionRef') IS 'text'),
    CHECK(json_type(event_json,'$.ticket.factsSha256') IS 'text'),
    CHECK(length(json_extract(event_json,'$.ticket.factsSha256'))=64),
    CHECK(json_extract(event_json,'$.ticket.scope.authorityKey')=authority_key),
    CHECK(json_extract(event_json,'$.ticket.authorityRevision')=authority_revision),
    CHECK(json_extract(event_json,'$.ticket.validUntilUtc')>observed_at_utc),
    CHECK(paid_eligible=0 OR (json_type(event_json,'$.paidThroughUtc') IS 'text'
      AND json_extract(event_json,'$.paidThroughUtc')>observed_at_utc))
  ) STRICT, WITHOUT ROWID`,
  `CREATE INDEX platform_premium_paid_events_due ON platform_premium_paid_events(guild_id,paid_role_id,applied,observed_at_utc)`,
  `CREATE TABLE platform_premium_role_cooldowns (
    guild_id TEXT NOT NULL ${snowflake("guild_id")},
    paid_role_id TEXT NOT NULL ${snowflake("paid_role_id")},
    until_utc TEXT NOT NULL CHECK(${utc("until_utc")}),
    PRIMARY KEY(guild_id,paid_role_id)
  ) STRICT, WITHOUT ROWID`,
  `CREATE TABLE platform_premium_discovery_epochs (
    epoch_ref TEXT PRIMARY KEY ${ref("epoch_ref")},
    guild_id TEXT NOT NULL ${snowflake("guild_id")},
    paid_role_id TEXT NOT NULL ${snowflake("paid_role_id")},
    state TEXT NOT NULL CHECK(state IN ('active','traversed','held')),
    version INTEGER NOT NULL CHECK(version BETWEEN 1 AND 9007199254740991),
    epoch_json TEXT NOT NULL ${object("epoch_json")},
    UNIQUE(epoch_ref,guild_id,paid_role_id),
    CHECK(guild_id <> paid_role_id),
    CHECK(json_extract(epoch_json,'$.epochRef')=epoch_ref),
    CHECK(json_extract(epoch_json,'$.guildId')=guild_id),
    CHECK(json_extract(epoch_json,'$.paidRoleId')=paid_role_id),
    CHECK(json_extract(epoch_json,'$.state')=state),
    CHECK(json_extract(epoch_json,'$.version')=version)
  ) STRICT, WITHOUT ROWID`,
  `CREATE TABLE platform_premium_discovery_current (
    guild_id TEXT NOT NULL ${snowflake("guild_id")},
    paid_role_id TEXT NOT NULL ${snowflake("paid_role_id")},
    epoch_ref TEXT NOT NULL UNIQUE ${ref("epoch_ref")},
    PRIMARY KEY(guild_id,paid_role_id),
    FOREIGN KEY(epoch_ref,guild_id,paid_role_id)
      REFERENCES platform_premium_discovery_epochs(epoch_ref,guild_id,paid_role_id) ON DELETE RESTRICT
  ) STRICT, WITHOUT ROWID`,
  `CREATE TABLE platform_premium_discovery_candidates (
    epoch_ref TEXT NOT NULL ${ref("epoch_ref")},
    authority_key TEXT NOT NULL ${ref("authority_key")},
    observed_at_utc TEXT NOT NULL CHECK(${utc("observed_at_utc")}),
    state TEXT NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','applying','done','held')),
    attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 8),
    next_attempt_at_utc TEXT NOT NULL CHECK(${utc("next_attempt_at_utc")}),
    lease_token TEXT ${ref("lease_token")},
    lease_until_utc TEXT CHECK(lease_until_utc IS NULL OR (${utc("lease_until_utc")})),
    PRIMARY KEY(epoch_ref,authority_key),
    FOREIGN KEY(epoch_ref) REFERENCES platform_premium_discovery_epochs(epoch_ref) ON DELETE RESTRICT,
    CHECK((lease_token IS NULL)=(lease_until_utc IS NULL)),
    CHECK((state='applying')=(lease_token IS NOT NULL))
  ) STRICT, WITHOUT ROWID`,
  `CREATE INDEX platform_premium_discovery_candidates_due ON platform_premium_discovery_candidates(state,next_attempt_at_utc)`,
  `CREATE TABLE platform_premium_role_review (
    guild_id TEXT NOT NULL ${snowflake("guild_id")},
    paid_role_id TEXT NOT NULL ${snowflake("paid_role_id")},
    discord_user_id TEXT NOT NULL ${snowflake("discord_user_id")},
    first_seen_at_utc TEXT NOT NULL CHECK(${utc("first_seen_at_utc")}),
    last_seen_at_utc TEXT NOT NULL CHECK(${utc("last_seen_at_utc")}),
    last_epoch_ref TEXT NOT NULL ${ref("last_epoch_ref")},
    disposition TEXT NOT NULL DEFAULT 'unknown' CHECK(disposition IN ('unknown','reviewed')),
    resolution_ref TEXT ${ref("resolution_ref")},
    PRIMARY KEY(guild_id,paid_role_id,discord_user_id),
    CHECK((disposition='reviewed')=(resolution_ref IS NOT NULL))
  ) STRICT, WITHOUT ROWID`,
  `CREATE TABLE platform_premium_discovery_cooldowns (
    guild_id TEXT NOT NULL ${snowflake("guild_id")},
    paid_role_id TEXT NOT NULL ${snowflake("paid_role_id")},
    until_utc TEXT NOT NULL CHECK(${utc("until_utc")}),
    PRIMARY KEY(guild_id,paid_role_id)
  ) STRICT, WITHOUT ROWID`,
  /** No raw owner UUID/workspace root or dependency FK. This is a MINIMAL pending
   * external obligation, not an erasure exemption or proof a role was removed.
   * Current-target ownership/quiescence must be qualified before execution. */
  `CREATE TABLE platform_premium_external_cleanup (
    receipt_ref TEXT NOT NULL ${ref("receipt_ref")},
    authority_key TEXT NOT NULL ${ref("authority_key")},
    guild_id TEXT NOT NULL ${snowflake("guild_id")},
    discord_user_id TEXT NOT NULL ${snowflake("discord_user_id")},
    role_id TEXT NOT NULL ${snowflake("role_id")},
    role_kind TEXT NOT NULL CHECK(role_kind IN ('ordinary_paid','partner_channel')),
    source_ref TEXT NOT NULL ${ref("source_ref")},
    captured_at_utc TEXT NOT NULL CHECK(${utc("captured_at_utc")}),
    fence_revision INTEGER NOT NULL CHECK(fence_revision BETWEEN 1 AND 9007199254740991),
    state TEXT NOT NULL CHECK(state IN ('pending','blocked_in_flight','applying','uncertain','confirmed','held')),
    prior_write_token TEXT ${ref("prior_write_token")},
    prior_write_until_utc TEXT CHECK(prior_write_until_utc IS NULL OR (${utc("prior_write_until_utc")})),
    prior_present INTEGER CHECK(prior_present IN (0,1)),
    quiescence_ref TEXT ${ref("quiescence_ref")},
    cleanup_lease_token TEXT ${ref("cleanup_lease_token")},
    cleanup_lease_until_utc TEXT CHECK(cleanup_lease_until_utc IS NULL OR (${utc("cleanup_lease_until_utc")})),
    outcome_ref TEXT ${ref("outcome_ref")},
    confirmed_at_utc TEXT CHECK(confirmed_at_utc IS NULL OR (${utc("confirmed_at_utc")})),
    last_error_code TEXT ${ref("last_error_code")},
    PRIMARY KEY(receipt_ref,guild_id,discord_user_id,role_id),
    CHECK(guild_id <> role_id),
    CHECK((prior_write_token IS NULL)=(prior_write_until_utc IS NULL)),
    CHECK((prior_write_token IS NULL)=(prior_present IS NULL)),
    CHECK(state <> 'blocked_in_flight' OR prior_write_token IS NOT NULL),
    CHECK(state NOT IN ('pending','applying','confirmed') OR prior_write_token IS NULL OR quiescence_ref IS NOT NULL),
    CHECK((cleanup_lease_token IS NULL)=(cleanup_lease_until_utc IS NULL)),
    CHECK((state IN ('applying','uncertain'))=(cleanup_lease_token IS NOT NULL)),
    CHECK(state <> 'confirmed' OR (outcome_ref IS NOT NULL AND confirmed_at_utc IS NOT NULL))
  ) STRICT, WITHOUT ROWID`,
]);

export const PLATFORM_PREMIUM_ROLE_SCHEMA = Object.freeze({
  kind: "id_free_descriptor" as const,
  tables: PLATFORM_PREMIUM_ROLE_TABLES,
  statements: PLATFORM_PREMIUM_ROLE_SCHEMA_SQL,
  canRegister: false as const,
  requires: Object.freeze(["coordinator_migration_allocation", "membership_authority_contract",
    "original_ticket_and_inflight_outcome_payload_qualification", "same_admitted_immediate_writer",
    "explicit_erasure_root_and_uuid_json_disposition", "reviewed_cleanup_and_commercial_retention"]),
});
