/** New owned counters record material community/provider changes. Native
 * identity/erasure epochs continue to come exclusively from Membership/Core. */
export const PARTNER_ALERT_CONTEXT_SCHEMA_STATEMENTS: readonly string[] = Object.freeze([
  `CREATE TABLE partner_alert_context_epochs (
    community_id TEXT PRIMARY KEY REFERENCES partner_alert_partners(community_id) ON DELETE RESTRICT,
    revision INTEGER NOT NULL CHECK(revision>0), provider_generation INTEGER NOT NULL CHECK(provider_generation>0),
    policy_generation INTEGER NOT NULL CHECK(policy_generation>0), configuration_ref TEXT NOT NULL
  ) STRICT`,
  ...["partner_alert_partners", "partner_alert_mappings", "partner_alert_offers", "partner_alert_offer_channels",
    "partner_alert_whop_connections", "partner_alert_memberships",
    "partner_alert_publishing_agreements", "partner_alert_agreement_acceptances", "partner_alert_publishing_memberships"]
    .flatMap(table => ["INSERT", "UPDATE", "DELETE"].map(event => {
      const selectors = event === "INSERT" ? "community_id=NEW.community_id"
        : event === "DELETE" ? "community_id=OLD.community_id" : "community_id IN (OLD.community_id,NEW.community_id)";
      return `CREATE TRIGGER ${table}_context_${event.toLowerCase()} AFTER ${event} ON ${table}
        BEGIN UPDATE partner_alert_context_epochs SET revision=revision+1,provider_generation=provider_generation+1
        WHERE ${selectors}; END`;
    })),
  ...["INSERT", "UPDATE", "DELETE"].map(event => {
    const users = event === "INSERT" ? "NEW.user_id" : event === "DELETE" ? "OLD.user_id" : "OLD.user_id,NEW.user_id";
    return `CREATE TRIGGER partner_alert_whop_identity_context_${event.toLowerCase()} AFTER ${event} ON partner_alert_whop_identities
      BEGIN UPDATE partner_alert_context_epochs SET revision=revision+1,provider_generation=provider_generation+1
      WHERE community_id IN (SELECT community_id FROM partner_alert_memberships WHERE user_id IN (${users})); END`;
  }),
  ...["partner_alert_whop_identities", "partner_alert_memberships", "partner_alert_role_jobs", "partner_alert_premium_refresh_events"]
    .flatMap(table => ["INSERT", "UPDATE"].map(event => `CREATE TRIGGER ${table}_live_subject_${event.toLowerCase()}
      BEFORE ${event} ON ${table} WHEN NOT EXISTS (
        SELECT 1 FROM platform_erasure_lifecycles l JOIN platform_erasure_profiles p USING(profile_ref)
        JOIN platform_users u ON u.user_id=l.user_id
        WHERE l.user_id=NEW.user_id AND l.phase='live' AND u.status='active'
          AND l.profile_generation=p.generation)
      BEGIN SELECT RAISE(ABORT,'partner_subject_erasure_fenced'); END`)),
]);
