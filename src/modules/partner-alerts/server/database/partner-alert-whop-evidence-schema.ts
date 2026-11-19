const scope = "community_id,user_id,offer_id,offer_version,environment,whop_account_id";
const scopeColumns = `
  community_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  offer_id TEXT NOT NULL,
  offer_version INTEGER NOT NULL CHECK(offer_version>0),
  environment TEXT NOT NULL CHECK(environment IN ('sandbox','live')),
  whop_account_id TEXT NOT NULL`;

/** Proposed append migration source. Existing memberships do not establish discovery or coverage. */
export const PARTNER_ALERT_WHOP_EVIDENCE_STATEMENTS = Object.freeze([
  `CREATE UNIQUE INDEX partner_alert_membership_exact_scope
    ON partner_alert_memberships(${scope},membership_id)`,
  `CREATE TABLE partner_alert_whop_discovery (
    ${scopeColumns},
    observed_at_utc TEXT NOT NULL CHECK(length(observed_at_utc)=24),
    valid_until_utc TEXT NOT NULL CHECK(length(valid_until_utc)=24 AND valid_until_utc>observed_at_utc),
    qualification_ref TEXT NOT NULL CHECK(length(qualification_ref) BETWEEN 1 AND 160),
    identity_generation INTEGER NOT NULL CHECK(identity_generation>0),
    connection_generation INTEGER NOT NULL CHECK(connection_generation>0),
    erasure_generation INTEGER NOT NULL CHECK(erasure_generation>0),
    PRIMARY KEY(${scope}),
    FOREIGN KEY(user_id,environment) REFERENCES partner_alert_whop_identities(user_id,environment) ON DELETE CASCADE,
    FOREIGN KEY(community_id,environment,whop_account_id)
      REFERENCES partner_alert_whop_connections(community_id,environment,whop_account_id) ON DELETE CASCADE,
    FOREIGN KEY(community_id,offer_id,offer_version,environment,whop_account_id)
      REFERENCES partner_alert_offers(community_id,offer_id,version,whop_environment,whop_account_id) ON DELETE CASCADE
  ) STRICT`,
  `CREATE INDEX partner_alert_whop_discovery_expiry ON partner_alert_whop_discovery(valid_until_utc)`,
  `CREATE INDEX partner_alert_whop_discovery_user ON partner_alert_whop_discovery(user_id,environment)`,
  `CREATE TABLE partner_alert_whop_paid_intervals (
    ${scopeColumns},
    membership_id TEXT NOT NULL,
    starts_at_utc TEXT NOT NULL CHECK(length(starts_at_utc)=24),
    ends_at_utc TEXT NOT NULL CHECK(length(ends_at_utc)=24 AND ends_at_utc>starts_at_utc),
    PRIMARY KEY(${scope},membership_id),
    FOREIGN KEY(${scope}) REFERENCES partner_alert_whop_discovery(${scope}) ON DELETE CASCADE,
    FOREIGN KEY(${scope},membership_id) REFERENCES partner_alert_memberships(${scope},membership_id) ON DELETE CASCADE
  ) STRICT`,
]);
