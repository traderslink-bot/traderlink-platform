import { PARTNER_ALERT_ERASURE_PRINCIPAL_STATEMENTS } from "../../../../partner-alerts/server/database/partner-alert-retention-schema";
export const seed = {moduleNamespace:"platform",migrationId:"0205_platform_paid_partner_retained_principal_seed",executionOrder:283,statements:[...PARTNER_ALERT_ERASURE_PRINCIPAL_STATEMENTS,`DELETE FROM platform_user_preferences
 WHERE user_id='00000000-0000-4000-8000-000000000195'
 AND EXISTS(SELECT 1 FROM platform_users WHERE user_id=platform_user_preferences.user_id
 AND auth_provider='erasure' AND auth_subject='paid-partner-retained-principal-v1' AND status='disabled')`]} as const;
