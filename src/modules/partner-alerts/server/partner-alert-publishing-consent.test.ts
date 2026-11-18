// @vitest-environment node
import Database from "better-sqlite3";
import { expect, it } from "vitest";
import { platformPaidPartnerConsentInspectionMigration } from "../../platform/server/database/migrations/0206_platform_paid_partner_consent_inspection";
import { PARTNER_ALERT_PUBLISHING_CONSENT_SQL } from "./partner-alert-publishing-consent";

it("requires inspection of the activated application before approval without a payment row", () => {
  const db = new Database(":memory:");
  try {
    db.pragma("foreign_keys = ON");
    db.exec(`CREATE TABLE partner_alert_partners (community_id TEXT PRIMARY KEY, approved_at_utc TEXT, owner_user_id TEXT, review_requested INTEGER);
      INSERT INTO partner_alert_partners VALUES ('publisher','2026-11-13T10:00:02.000Z','owner',1);`);
    for (const sql of platformPaidPartnerConsentInspectionMigration.statements) db.exec(sql);
    const eligible = db.prepare(`SELECT ${PARTNER_ALERT_PUBLISHING_CONSENT_SQL}
      FROM partner_alert_partners p`).pluck();
    db.exec(`INSERT INTO partner_alert_application_consents VALUES ('publisher',3,1,'2026-11-13T10:00:00.000Z');
      INSERT INTO partner_alert_application_inspections VALUES ('publisher',3,'2026-11-13T10:00:01.000Z','2026-11-13T10:00:02.000Z');`);
    expect(eligible.get()).toBe(0);
    db.exec("UPDATE partner_alert_partners SET activated_application_revision=4");
    expect(eligible.get()).toBe(0);
    db.exec("UPDATE partner_alert_partners SET activated_application_revision=3");
    expect(eligible.get()).toBe(1);
    db.exec("UPDATE partner_alert_partners SET approved_at_utc='2026-11-13T10:00:03.000Z'");
    expect(eligible.get()).toBe(1);
    db.exec("UPDATE partner_alert_application_inspections SET approved_at_utc=NULL");
    expect(eligible.get()).toBe(0);
    db.transaction(() => db.exec("UPDATE partner_alert_partners SET owner_user_id='retained'")).immediate();
    expect(db.prepare("SELECT activated_application_revision, review_requested FROM partner_alert_partners").get())
      .toEqual({ activated_application_revision: null, review_requested: 0 });
    expect(db.prepare("SELECT * FROM partner_alert_application_consents").all()).toEqual([]);
    expect(db.prepare("SELECT * FROM partner_alert_application_inspections").all()).toEqual([]);
  } finally {
    db.close();
  }
});
