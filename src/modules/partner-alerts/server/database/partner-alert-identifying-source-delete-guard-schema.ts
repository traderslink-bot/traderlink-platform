/** Additive migration candidate only. Historical Partner schema bytes remain immutable.
 * A future registered migration must apply all four statements in one transaction,
 * then qualify the exact composed final schema and reviewed catalog. */
export const PARTNER_ALERT_IDENTIFYING_SOURCE_DELETE_GUARD_REPLACEMENT_STATEMENTS:readonly string[]=Object.freeze([
  "DROP TRIGGER partner_alert_commands_no_delete",
  "DROP TRIGGER partner_alert_audit_events_no_delete",
  `CREATE TRIGGER partner_alert_commands_no_delete BEFORE DELETE ON partner_alert_commands
    WHEN traderlink_erasure_source_delete_guard('partner_command',OLD.request_id,OLD.actor_user_id,OLD.community_id)!=1
    BEGIN SELECT RAISE(ABORT,'partner_alert_append_only'); END`,
  `CREATE TRIGGER partner_alert_audit_events_no_delete BEFORE DELETE ON partner_alert_audit_events
    WHEN traderlink_erasure_source_delete_guard('partner_audit',OLD.audit_event_id,OLD.actor_user_id,OLD.community_id)!=1
    BEGIN SELECT RAISE(ABORT,'partner_alert_append_only'); END`,
]);
