import type Database from "better-sqlite3";
import { premiumInteger, premiumSnowflake } from "../../platform/contracts/platform-premium-access";
import { PlatformPremiumDiscoveryRepository, PlatformPremiumRoleRepository } from "../../platform/server/membership/platform-premium-role-repository";
import { PlatformPremiumRoleReconciliation } from "../../platform/server/membership/platform-premium-role-reconciliation";
import { SqlitePlatformPremiumDiscoveryStore, SqlitePlatformPremiumRoleStore } from "../../platform/server/membership/platform-premium-role-store";
import { PLATFORM_PREMIUM_ROLE_TABLES } from "../../platform/server/membership/platform-premium-role-schema";
import { partnerAlertId, partnerAlertUtc } from "../contracts/partner-alert-validation";
import { PartnerAlertDeliveryWorker, type PartnerAlertDiscordDeliveryTransport } from "./partner-alert-delivery-worker";
import { PartnerAlertRoleWorker, type PartnerAlertRoleAuthority, type PartnerAlertRoleTransport } from "./partner-alert-role-worker";

export const PARTNER_ALERT_RUNTIME_BINDING_GAPS = Object.freeze([
  "membership_current_subject_generation_paid_term_and_erasure_contract",
  "registered_qualified_premium_and_partner_schema",
  "native_provider_and_discord_transport_scopes",
  "current_request_owner_community_and_subscriber_authority",
  "transactional_paid_event_partner_fanout_and_discovery_readers",
  "explicit_shared_community_signer_payload_backup_and_cleanup_retention",
  "surviving_inflight_claims_late_receipts_and_postcommit_cleanup",
  "dedicated_gateway_receiver_and_coordinator_worker_registration",
] as const);

export class PartnerAlertRuntimeUnboundError extends Error {
  readonly code = "PARTNER_ALERT_RUNTIME_UNBOUND";
  constructor() { super("Partner alert integration requires qualification."); }
}

export type PartnerAlertPlatformErasureInput = Readonly<{
  action: "traderlink_account";
  userId: string;
  workspaceId: string;
  receiptRef: string;
  atUtc: string;
}>;

export const PARTNER_ALERT_PLATFORM_ERASURE_PARTICIPANT_CONTRACT = Object.freeze({
  version: "paid-platform-erasure/v1-proposal",
  export: "preparePartnerAlertPlatformErasure",
  inputFields: Object.freeze(["action", "userId", "workspaceId", "receiptRef", "atUtc"]),
  synchronous: true,
  sameAdmittedImmediateTransaction: true,
  beforeClosureAndDeleteGuardSuspension: true,
  externalIo: false,
  standaloneCommit: false,
  journalOrDemoInvocation: false,
  mustThrowWhenUnbound: true,
  positiveImplementationBound: false,
  minimalCleanupTable: "platform_premium_external_cleanup",
  ownedPremiumTables: PLATFORM_PREMIUM_ROLE_TABLES,
  requiredBindings: PARTNER_ALERT_RUNTIME_BINDING_GAPS,
});

/** Exact synchronous participant export for the privacy producer's COMMAND-ONLY
 * proposal. Import has no effects. A missing real generation fence, schema or
 * retention disposition MUST abort the caller's admitted immediate transaction;
 * returning canExecute:false would be unsafe because the command could ignore it.
 * No local erasure, capture, external action or successful removal is simulated.
 * The actual positive implementation remains HELD for the producer contracts. */
export function preparePartnerAlertPlatformErasure(database: Database.Database,
  input: PartnerAlertPlatformErasureInput): void {
  if (!database.inTransaction || input.action !== "traderlink_account") throw new PartnerAlertRuntimeUnboundError();
  partnerAlertId(input.userId, "userId"); partnerAlertId(input.workspaceId, "workspaceId");
  partnerAlertId(input.receiptRef, "receiptRef"); partnerAlertUtc(input.atUtc, "atUtc");
  throw new PartnerAlertRuntimeUnboundError();
}

/** Composition source ONLY. This deliberately has NO enabled variant until the
 * current Membership/erasure contracts arrive. It opens no database, constructs
 * no credential-bearing transport and starts no receiver, timer or drain.
 * The returned disabled services cannot make a partial binding appear live. */
export function createDormantPartnerAlertRuntime(input: Readonly<{
  database: Database.Database;
  destinationGuildId: string;
  paidPremiumRoleId: string;
  complimentaryRoleId: string | null;
  maximumFeeEvidenceAgeMs: number;
  nowUtc: () => string;
  createId: () => string;
  attention: (reason: string) => void;
}>) {
  premiumSnowflake(input.destinationGuildId); premiumSnowflake(input.paidPremiumRoleId);
  if (input.complimentaryRoleId !== null) premiumSnowflake(input.complimentaryRoleId);
  if (input.paidPremiumRoleId === input.destinationGuildId || input.complimentaryRoleId === input.paidPremiumRoleId
    || input.complimentaryRoleId === input.destinationGuildId || typeof input.nowUtc !== "function"
    || typeof input.createId !== "function" || typeof input.attention !== "function") throw new PartnerAlertRuntimeUnboundError();
  premiumInteger(input.maximumFeeEvidenceAgeMs, 1, 86_400_000);
  const config = Object.freeze({ enabled: false, guildId: input.destinationGuildId, paidRoleId: input.paidPremiumRoleId });
  const roleStore = new SqlitePlatformPremiumRoleStore(input.database, config);
  const discoveryStore = new SqlitePlatformPremiumDiscoveryStore(input.database, config);
  const roleRepository = new PlatformPremiumRoleRepository(roleStore, () => false);
  const discoveryRepository = new PlatformPremiumDiscoveryRepository(discoveryStore,
    { pageSize: 100, pages: 100, scanned: 10_000, lifetimeMs: 300_000 });
  const ordinary = new PlatformPremiumRoleReconciliation({ loadCurrent: async () => ({ kind: "unbound" }), isCurrent: () => false },
    roleRepository, { setRole: async () => ({ kind: "not_written", reason: "disabled" }) },
    { enabled: false, discoveryEnabled: false, guildId: input.destinationGuildId, paidRoleId: input.paidPremiumRoleId,
      complimentaryRoleId: input.complimentaryRoleId, nowUtc: input.nowUtc, createOperationRef: input.createId,
      attention: input.attention });
  const roleAuthority: PartnerAlertRoleAuthority = Object.freeze({
    refresh: async () => { throw new PartnerAlertRuntimeUnboundError(); }, isCurrent: () => false,
  });
  const roleTransport: PartnerAlertRoleTransport = Object.freeze({
    verifyManagedRole: async () => false,
    setRole: async () => ({ kind: "rejected" as const, reason: "permission_required" as const }),
  });
  const deliveryTransport: PartnerAlertDiscordDeliveryTransport = Object.freeze({
    verifyDestination: async () => false,
    create: async () => ({ kind: "rejected" as const, reason: "permission_required" as const }),
    edit: async () => ({ kind: "rejected" as const, reason: "permission_required" as const }),
    delete: async () => ({ kind: "rejected" as const, reason: "permission_required" as const }),
  });
  const roles = new PartnerAlertRoleWorker(input.database, roleAuthority, roleTransport,
    { enabled: false, nowUtc: input.nowUtc, createId: input.createId,
      attention: (_mappingId, reason) => input.attention(reason) });
  const delivery = new PartnerAlertDeliveryWorker(input.database, deliveryTransport,
    { enabled: false, nowUtc: input.nowUtc, createId: input.createId, maximumFeeEvidenceAgeMs: input.maximumFeeEvidenceAgeMs,
      attention: (_deliveryId, reason) => input.attention(reason) });
  return Object.freeze({
    mode: "dormant" as const, canActivate: false as const, gaps: PARTNER_ALERT_RUNTIME_BINDING_GAPS,
    ordinary: Object.freeze({ roleStore, discoveryStore, roleRepository, discoveryRepository, reconciliation: ordinary }),
    partner: Object.freeze({ roles, delivery }),
    // Request repository, inbox, ingress and Gateway need actual current authority,
    // signed-event provenance and reviewed payload policy; no placeholder enables them.
    currentRequestRepository: null,
    providerInbox: null,
    ingress: null,
    gateway: null,
  });
}
