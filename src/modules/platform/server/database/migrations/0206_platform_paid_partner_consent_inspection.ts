import type { PlatformMigration } from "../platform-migration-contract";

/** Reserved source. Register after schema and erasure review. */
export const platformPaidPartnerConsentInspectionMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0206_platform_paid_partner_consent_inspection",
  executionOrder: 284,
  statements: Object.freeze([
    `ALTER TABLE partner_alert_partners ADD COLUMN submitted_application_revision INTEGER
      CHECK(submitted_application_revision >= 1)`,
    `ALTER TABLE partner_alert_partners ADD COLUMN approved_application_revision INTEGER
      CHECK(approved_application_revision >= 1)`,
    `ALTER TABLE partner_alert_partners ADD COLUMN activated_application_revision INTEGER
      CHECK(activated_application_revision >= 1)`,
    `CREATE TABLE partner_alert_application_consents (
      community_id TEXT NOT NULL REFERENCES partner_alert_partners(community_id) ON DELETE CASCADE,
      application_revision INTEGER NOT NULL CHECK(application_revision >= 1),
      rules_version INTEGER NOT NULL CHECK(rules_version >= 1),
      accepted_at_utc TEXT NOT NULL CHECK(length(accepted_at_utc) = 24),
      PRIMARY KEY(community_id, application_revision)
    ) STRICT`,
    `CREATE TABLE partner_alert_application_inspections (
      community_id TEXT NOT NULL,
      application_revision INTEGER NOT NULL CHECK(application_revision >= 1),
      inspected_at_utc TEXT NOT NULL CHECK(length(inspected_at_utc) = 24),
      approved_at_utc TEXT CHECK(approved_at_utc IS NULL OR approved_at_utc >= inspected_at_utc),
      PRIMARY KEY(community_id, application_revision),
      FOREIGN KEY(community_id, application_revision)
        REFERENCES partner_alert_application_consents(community_id, application_revision) ON DELETE CASCADE
    ) STRICT`,
    `CREATE TRIGGER partner_alert_application_owner_changed
      AFTER UPDATE OF owner_user_id ON partner_alert_partners
      WHEN NEW.owner_user_id IS NOT OLD.owner_user_id
      BEGIN
        UPDATE partner_alert_partners SET activated_application_revision=NULL, approved_application_revision=NULL,
          submitted_application_revision=NULL, review_requested=0
          WHERE community_id=NEW.community_id;
        DELETE FROM partner_alert_application_consents WHERE community_id=NEW.community_id;
      END`,
  ]),
});
