import type { PlatformMigration } from "../platform-migration-contract";

export const platformPaidPartnerGatewaySessionMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0210_platform_paid_partner_gateway_session",
  executionOrder: 264,
  statements: Object.freeze([
    "ALTER TABLE partner_alert_ingress_sessions ADD COLUMN resume_url TEXT",
    "ALTER TABLE partner_alert_ingress_sessions ADD COLUMN lease_token TEXT",
    "ALTER TABLE partner_alert_ingress_sessions ADD COLUMN lease_until_utc TEXT",
    "ALTER TABLE partner_alert_ingress_sessions ADD COLUMN identify_not_before_utc TEXT",
    "ALTER TABLE partner_alert_deliveries ADD COLUMN rehydrate_source INTEGER NOT NULL DEFAULT 0 CHECK(rehydrate_source IN (0,1))",
  ]),
});
