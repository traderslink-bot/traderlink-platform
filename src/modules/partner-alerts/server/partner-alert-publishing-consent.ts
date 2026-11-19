/** Shared eligibility for new publishing work. The partner row is aliased as p.
 * The inspection must cover the exact application selected during activation. */
export const PARTNER_ALERT_PUBLISHING_CONSENT_SQL = `EXISTS (
  SELECT 1 FROM partner_alert_application_consents consent
  JOIN partner_alert_application_inspections inspection
    ON inspection.community_id=consent.community_id
    AND inspection.application_revision=consent.application_revision
  WHERE consent.community_id=p.community_id
    AND consent.application_revision=p.activated_application_revision
    AND consent.accepted_at_utc<=inspection.inspected_at_utc
    AND inspection.inspected_at_utc<=inspection.approved_at_utc
)`;
