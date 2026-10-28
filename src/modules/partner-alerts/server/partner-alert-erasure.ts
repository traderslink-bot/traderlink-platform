import { PartnerAlertValidationError } from "../contracts/partner-alert-contracts";

/** Dependency/obligation descriptor ONLY. No SQL, DB, external calls or actual
 * erasure. Canonical captureErasureClosure/executeErasureCommand do exist, but
 * are absent from this preserved checkout and MUST NOT be replaced or copied.
 * The older preserved erasure service is not a compatible integration target. */
export const PARTNER_ALERT_ERASURE_INTEGRATION_BLOCKERS = Object.freeze([
  "current_erasure_closure_and_command_absent_from_preserved_baseline",
  "no_reviewed_partner_erasure_hook_in_current_erasure_command",
  "external_cleanup_ledger_binding_and_retention_unqualified",
  "worker_and_webhook_erasure_fencing_not_integrated",
  "shared_community_disposition_and_commercial_audit_retention_require_explicit_policy",
  "source_payload_and_backup_retention_not_qualified",
  "full_original_ticket_refresh_claim_outcome_and_managed_receipt_disposition_unqualified",
  "real_admission_quiescence_and_cross_recipient_signer_plan_unbound",
] as const);

export type PartnerAlertErasureClassification = "journal_account_only" | "platform_account";
export type PartnerAlertErasureObligation =
  | "preserve_platform_level_partner_subscriptions_and_publishing"
  | "fence_new_grants_ingress_and_event_rehydration"
  | "retain_and_settle_in_flight_external_operation_receipts"
  | "fence_refresh_fanout_and_preserve_original_event_tickets"
  | "qualify_full_ticket_json_and_managed_receipt_disposition"
  | "record_minimal_dedicated_role_revocation_obligations"
  | "disable_local_whop_identity_and_credential_use"
  | "erase_subscription_identity_facts_with_reviewed_closure"
  | "apply_explicit_shared_community_disposition"
  | "apply_explicit_commercial_audit_and_signature_retention_policy"
  | "schedule_payload_credential_and_backup_purge_after_commit"
  | "report_local_erasure_separately_from_pending_external_cleanup";

export type PartnerAlertErasureOutline = Readonly<{
  /** Always false: no call site may mistake a planning descriptor for authority. */
  canExecute: false;
  classification: PartnerAlertErasureClassification;
  obligations: readonly PartnerAlertErasureObligation[];
  blockedBy: readonly string[];
  ownedTableGroups: Readonly<{
    subscriberIdentity: readonly string[];
    sharedCommunity: readonly string[];
    externalDelivery: readonly string[];
    commercialAudit: readonly string[];
    ordinaryPremium: readonly string[];
  }>;
  payloadLifecycle: typeof PARTNER_ALERT_PAYLOAD_LIFECYCLE;
  externalBilling: "community_managed_no_cancellation_or_refund_authority";
}>;

/** Catalog only, NOT SQL selectors, a closure exemption, retention policy or a
 * successful cleanup receipt. Original claim/outcome proof may still be needed
 * after the local user disappears. Lease expiry alone never permits redaction. */
export const PARTNER_ALERT_PAYLOAD_LIFECYCLE = Object.freeze({
  canExecute: false as const, qualification: "unqualified" as const,
  commandScope: "whole_platform_account_only" as const,
  journalAndDemoSelectThesePayloads: false as const,
  completeRootOrSignerGraphClaim: false as const,
  cleanupReceiptCompletesPayloadRedaction: false as const,
  retentionPeriodSelected: false as const,
  nodes: Object.freeze([
    Object.freeze({ table: "partner_alert_role_jobs", rootColumns: Object.freeze(["user_id"]),
      payloadPaths: Object.freeze(["desired_ticket_json.premium.scope.userId", "desired_ticket_json.context.userId",
        "in_flight_intent_json.userId", "in_flight_intent_json.ticket.premium.scope.userId", "in_flight_intent_json.ticket.context.userId",
        "outcome_json.intent.userId", "outcome_json.intent.ticket.premium.scope.userId", "outcome_json.intent.ticket.context.userId"]),
      operationProof: Object.freeze(["managed_assignment_ref", "lease_token", "in_flight_intent_json", "outcome_json",
        "original Premium authorityKey/epochs/admissionRef/factsSha256/observation/deadline",
        "original community/offer/provider/identity/erasure/policy receipts and fingerprints", "Discord target identities"]),
      disposition: "unqualified_preserve_pending_review" as const }),
    Object.freeze({ table: "partner_alert_premium_refresh_events", rootColumns: Object.freeze(["user_id"]),
      payloadPaths: Object.freeze(["event_json.scope.userId", "event_json.ticket.scope.userId"]),
      operationProof: Object.freeze(["authority_key", "event_json", "original observation/expiry event key",
        "original full ticket UUID/epochs/admissionRef/factsSha256/observation/deadline", "processed_at_utc"]),
      disposition: "unqualified_preserve_pending_review" as const }),
    Object.freeze({ table: "platform_premium_role_jobs", rootColumns: Object.freeze([] as string[]),
      payloadPaths: Object.freeze(["job_json.intent.scope.userId", "job_json.intent.ticket.scope.userId",
        "job_json.lease.intent.scope.userId", "job_json.lease.intent.ticket.scope.userId",
        "job_json.lastOutcome.intent.scope.userId", "job_json.lastOutcome.intent.ticket.scope.userId",
        "job_json.managedAssignment.ticket.scope.userId"]),
      operationProof: Object.freeze(["job_json.lease", "job_json.lastOutcome", "job_json.managedAssignment",
        "original full ticket UUID/epochs/admissionRef/factsSha256/observation/deadline", "physical role target"]),
      disposition: "unqualified_preserve_pending_review" as const }),
    Object.freeze({ table: "platform_premium_paid_events", rootColumns: Object.freeze([] as string[]),
      payloadPaths: Object.freeze(["event_json.scope.userId", "event_json.ticket.scope.userId"]),
      operationProof: Object.freeze(["event_json", "actual verified paidThroughUtc separate from freshness",
        "original full ticket UUID/epochs/admissionRef/factsSha256/observation/deadline"]),
      disposition: "unqualified_preserve_pending_review" as const }),
  ]),
  requiredGates: Object.freeze([
    "canonical_whole_platform_command_admission_same_immediate_writer_before_capture_and_guard_suspension",
    "fence_role_delivery_refresh_fanout_webhook_and_late_rehydration_for_actual_scopes",
    "capture_actual_original_claims_outcomes_managed_receipts_and_cleanup_targets_without_fabricated_provenance",
    "prove_writer_quiescence_and_qualify_late_native_receipts_not_lease_expiry",
    "review_FK_logical_UUID_JSON_signer_and_recipient_graph_including_actual_V3_referencePlan",
    "owner_selected_commercial_signer_and_operation_retention_with_explicit_payload_redaction_disposition",
    "qualify_source_credentials_deleted_content_backups_and_recovery_without_recreating_erased_principals",
    "separate_local_erasure_external_cleanup_and_full_payload_redaction_completion",
  ]),
});

/** Pure description, not an API command and not an erasure authorization.
 * Caller classification must come from the canonical server erasure command.
 * Journal-account deletion does not select Platform-level paid-channel data. */
export function describePartnerAlertErasure(classification: PartnerAlertErasureClassification): PartnerAlertErasureOutline {
  if (classification !== "journal_account_only" && classification !== "platform_account") {
    throw new PartnerAlertValidationError("erasureClassification");
  }
  const obligations: readonly PartnerAlertErasureObligation[] = classification === "journal_account_only"
    ? ["preserve_platform_level_partner_subscriptions_and_publishing"]
    : ["fence_new_grants_ingress_and_event_rehydration", "retain_and_settle_in_flight_external_operation_receipts",
      "fence_refresh_fanout_and_preserve_original_event_tickets", "qualify_full_ticket_json_and_managed_receipt_disposition",
      "record_minimal_dedicated_role_revocation_obligations", "disable_local_whop_identity_and_credential_use",
      "apply_explicit_shared_community_disposition", "apply_explicit_commercial_audit_and_signature_retention_policy",
      "erase_subscription_identity_facts_with_reviewed_closure", "schedule_payload_credential_and_backup_purge_after_commit",
      "report_local_erasure_separately_from_pending_external_cleanup"];
  return Object.freeze({ canExecute: false, classification, obligations: Object.freeze(obligations),
    blockedBy: PARTNER_ALERT_ERASURE_INTEGRATION_BLOCKERS,
    ownedTableGroups: Object.freeze({
      subscriberIdentity: Object.freeze(["partner_alert_whop_identities", "partner_alert_memberships"]),
      sharedCommunity: Object.freeze(["partner_alert_partners", "partner_alert_mappings", "partner_alert_offers",
        "partner_alert_offer_channels", "partner_alert_whop_connections", "partner_alert_whop_inbox"]),
      externalDelivery: Object.freeze(["partner_alert_role_jobs", "partner_alert_premium_refresh_events", "partner_alert_source_messages", "partner_alert_source_revisions",
        "partner_alert_mirrored_parts", "partner_alert_deliveries", "partner_alert_ingress_sessions"]),
      commercialAudit: Object.freeze(["partner_alert_publishing_agreements", "partner_alert_agreement_acceptances",
        "partner_alert_publishing_memberships", "partner_alert_commands", "partner_alert_audit_events"]),
      ordinaryPremium: Object.freeze(["platform_premium_role_jobs", "platform_premium_paid_events", "platform_premium_role_cooldowns",
        "platform_premium_discovery_epochs", "platform_premium_discovery_current", "platform_premium_discovery_candidates",
        "platform_premium_role_review", "platform_premium_discovery_cooldowns", "platform_premium_external_cleanup"]),
    }), payloadLifecycle: PARTNER_ALERT_PAYLOAD_LIFECYCLE,
    externalBilling: "community_managed_no_cancellation_or_refund_authority" });
}
