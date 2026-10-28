import { PartnerAlertValidationError } from "../contracts/partner-alert-contracts";
import { PARTNER_ALERT_MAX_SELECTION, parsePartnerAlertContentPolicy, parsePartnerAlertOffer, parsePartnerAlertPublishingTerms,
  partnerAlertExactKeys, partnerAlertId, partnerAlertInteger, partnerAlertRecord, partnerAlertSnowflake,
  partnerAlertText } from "../contracts/partner-alert-validation";
import { PartnerAlertRepositoryError, type PartnerAlertRepository, type PartnerAlertWriteResult } from "./partner-alert-repository";
import { requirePartnerAlertVerifiedCommand, type PartnerAlertRequestTarget,
  type PartnerAlertVerifiedCommand } from "./partner-alert-request-boundary";

export type PartnerAlertWorkflowTarget = Exclude<PartnerAlertRequestTarget, { kind: "subscriber" }>;
type WithoutRequest<K extends keyof PartnerAlertWorkflowRepository> =
  Omit<Parameters<PartnerAlertWorkflowRepository[K]>[0], "requestId">;
export type PartnerAlertWorkflowCommand =
  | (Readonly<{ action: "savePartnerDraft" }> & WithoutRequest<"savePartnerDraft">)
  | (Readonly<{ action: "saveMappingDraft" }> & WithoutRequest<"saveMappingDraft">)
  | (Readonly<{ action: "saveOfferVersion" }> & WithoutRequest<"saveOfferVersion">)
  | (Readonly<{ action: "acceptPublishingAgreement" }> & WithoutRequest<"acceptPublishingAgreement">)
  | (Readonly<{ action: "submitRequest" }> & WithoutRequest<"submitRequest">)
  | (Readonly<{ action: "proposePublishingAgreement" }> & WithoutRequest<"proposePublishingAgreement">)
  | (Readonly<{ action: "approveMapping" }> & WithoutRequest<"approveMapping">)
  | (Readonly<{ action: "approveOffer" }> & WithoutRequest<"approveOffer">)
  | (Readonly<{ action: "approvePartner" }> & WithoutRequest<"approvePartner">)
  | (Readonly<{ action: "setPartnerState" }> & WithoutRequest<"setPartnerState">)
  | (Readonly<{ action: "requestChanges" }> & WithoutRequest<"requestChanges">)
  | (Readonly<{ action: "withdrawMapping" }> & WithoutRequest<"withdrawMapping">)
  | (Readonly<{ action: "withdrawOffer" }> & WithoutRequest<"withdrawOffer">);
export type PartnerAlertWorkflowRepository = Pick<PartnerAlertRepository,
  "savePartnerDraft" | "saveMappingDraft" | "saveOfferVersion" | "acceptPublishingAgreement" | "submitRequest"
  | "proposePublishingAgreement" | "approveMapping" | "approveOffer" | "approvePartner" | "setPartnerState"
  | "requestChanges" | "withdrawMapping" | "withdrawOffer">;
const COMMUNITY_ACTIONS = new Set(["savePartnerDraft", "saveMappingDraft", "saveOfferVersion", "acceptPublishingAgreement", "submitRequest"]);
const OPERATOR_ACTIONS = new Set(["proposePublishingAgreement", "approveMapping", "approveOffer", "approvePartner",
  "setPartnerState", "requestChanges", "withdrawMapping", "withdrawOffer"]);

/** Target is selected by trusted server routing, never from a JSON target/actor. */
export function partnerAlertWorkflowTarget(input: PartnerAlertRequestTarget): PartnerAlertWorkflowTarget {
  const value = partnerAlertRecord(input, "target");
  if (value.kind === "operator") {
    partnerAlertExactKeys(value, ["kind"], "target"); return Object.freeze({ kind: "operator" });
  }
  if (value.kind !== "community_owner") throw new PartnerAlertValidationError("target");
  partnerAlertExactKeys(value, ["kind", "communityId"], "target");
  return Object.freeze({ kind: "community_owner", communityId: partnerAlertId(value.communityId, "communityId") });
}

/** Canonical payloads for existing repository commands ONLY. No request ID,
 * user/permission/proof, checkout, native config or arbitrary method is accepted. */
export function parsePartnerAlertWorkflowCommand(value: unknown, selected: PartnerAlertRequestTarget): PartnerAlertWorkflowCommand {
  const target = partnerAlertWorkflowTarget(selected); const body = partnerAlertRecord(value, "command");
  const action = body.action;
  if (typeof action !== "string" || !(target.kind === "operator" ? OPERATOR_ACTIONS : COMMUNITY_ACTIONS).has(action)) {
    throw new PartnerAlertValidationError("action");
  }
  const communityId = target.kind === "community_owner" ? target.communityId : partnerAlertId(body.communityId, "communityId");
  if (body.communityId !== undefined && body.communityId !== communityId) throw new PartnerAlertValidationError("communityId");
  const expectedRevision = partnerAlertInteger(body.expectedRevision, "expectedRevision", action === "savePartnerDraft" ? 0 : 1);
  const base = { communityId, expectedRevision };
  const keys = (extra: readonly string[]) => partnerAlertExactKeys(body, ["action", "communityId", "expectedRevision", ...extra], "command");
  switch (action) {
    case "savePartnerDraft":
      keys(["displayName", "contentPolicy"]);
      return Object.freeze({ ...base, action, displayName: partnerAlertText(body.displayName, "displayName"),
        contentPolicy: parsePartnerAlertContentPolicy(body.contentPolicy) });
    case "saveMappingDraft":
      keys(["mappingId", "sourceChannelId", "displayName"]);
      return Object.freeze({ ...base, action, mappingId: partnerAlertId(body.mappingId, "mappingId"),
        sourceChannelId: partnerAlertSnowflake(body.sourceChannelId, "sourceChannelId"), displayName: partnerAlertText(body.displayName, "displayName") });
    case "saveOfferVersion": {
      keys(["offer"]); const offer = parsePartnerAlertOffer(body.offer);
      if (offer.communityId !== communityId) throw new PartnerAlertValidationError("communityId");
      return Object.freeze({ ...base, action, offer });
    }
    case "acceptPublishingAgreement":
      keys(["agreementId", "rulesVersion", "acceptsRedistribution"]);
      if (body.acceptsRedistribution !== true) throw new PartnerAlertValidationError("consent");
      return Object.freeze({ ...base, action, agreementId: partnerAlertId(body.agreementId, "agreementId"),
        rulesVersion: partnerAlertInteger(body.rulesVersion, "rulesVersion", 1), acceptsRedistribution: true });
    case "submitRequest": keys([]); return Object.freeze({ ...base, action });
    case "proposePublishingAgreement": {
      keys(["terms", "contractedChannels"]); const terms = parsePartnerAlertPublishingTerms(body.terms);
      if (terms.communityId !== communityId) throw new PartnerAlertValidationError("communityId");
      return Object.freeze({ ...base, action, terms, contractedChannels: partnerAlertInteger(body.contractedChannels, "contractedChannels", 1, PARTNER_ALERT_MAX_SELECTION) });
    }
    case "approveMapping":
      keys(["mappingId", "expectedMappingRevision", "destinationChannelId", "destinationRoleId"]);
      return Object.freeze({ ...base, action, mappingId: partnerAlertId(body.mappingId, "mappingId"),
        expectedMappingRevision: partnerAlertInteger(body.expectedMappingRevision, "expectedMappingRevision", 1),
        destinationChannelId: partnerAlertSnowflake(body.destinationChannelId, "destinationChannelId"),
        destinationRoleId: partnerAlertSnowflake(body.destinationRoleId, "destinationRoleId") });
    case "approveOffer":
      keys(["offerId", "offerVersion"]);
      return Object.freeze({ ...base, action, offerId: partnerAlertId(body.offerId, "offerId"),
        offerVersion: partnerAlertInteger(body.offerVersion, "offerVersion", 1) });
    case "approvePartner": keys([]); return Object.freeze({ ...base, action });
    case "setPartnerState":
      keys(["state", "reason"]);
      if (body.state !== "publishing_paused" && body.state !== "suspended" && body.state !== "ended" && body.state !== "setup_required") throw new PartnerAlertValidationError("state");
      return Object.freeze({ ...base, action, state: body.state, reason: partnerAlertText(body.reason, "reason", 500) });
    case "requestChanges":
      keys(["reason"]); return Object.freeze({ ...base, action, reason: partnerAlertText(body.reason, "reason", 500) });
    case "withdrawMapping":
      keys(["mappingId", "reason"]); return Object.freeze({ ...base, action, mappingId: partnerAlertId(body.mappingId, "mappingId"),
        reason: partnerAlertText(body.reason, "reason", 500) });
    case "withdrawOffer":
      keys(["offerId", "offerVersion", "reason"]); return Object.freeze({ ...base, action, offerId: partnerAlertId(body.offerId, "offerId"),
        offerVersion: partnerAlertInteger(body.offerVersion, "offerVersion", 1), reason: partnerAlertText(body.reason, "reason", 500) });
    default: throw new PartnerAlertValidationError("action");
  }
}

export type PartnerAlertWorkflowScope = Readonly<{
  receipt: PartnerAlertVerifiedCommand<unknown>; command: PartnerAlertWorkflowCommand;
}>;
export interface PartnerAlertWorkflowBindings {
  /** UNBOUND. Must provide actual current auth/erasure/schema/config admission and
   * SAME IMMEDIATE writer/DB as the repository, with rollback on callback error.
   * Hydrate native/config receipts BEFORE this call; no I/O in the writer. Verify
   * server-managed bot/source identity and configuration against proposals; a
   * browser content policy, currency precision or target ID is not that proof. The
   * repository must be bound to scope.receipt.authority, never another actor.
   * isCurrent qualifies authorization/admission, not a stale pre-command revision. */
  withinAdmittedWriter<T>(scope: PartnerAlertWorkflowScope, operation: (permit: Readonly<{
    scope: PartnerAlertWorkflowScope; authority: PartnerAlertVerifiedCommand<unknown>["authority"];
    repository: PartnerAlertWorkflowRepository; isCurrent: () => boolean;
  }>) => T): T;
}
export type PartnerAlertWorkflowResult = Readonly<{ kind: "applied"; result: PartnerAlertWriteResult }>
  | Readonly<{ kind: "invalid" | "forbidden" | "conflict" | "unavailable" }>;
class WorkflowUnavailable extends Error {}

function requireActor(scope: PartnerAlertWorkflowScope): void {
  const r = scope.receipt; requirePartnerAlertVerifiedCommand(r);
  const actor = r.target.kind === "operator" ? r.authority.requireOperator()
    : r.target.kind === "community_owner" ? r.authority.requireCommunityOwner(scope.command.communityId) : null;
  if (!actor || actor.userId !== r.userId || (r.target.kind === "community_owner" && r.target.communityId !== scope.command.communityId)) {
    throw new PartnerAlertValidationError("verifiedCommand");
  }
}
function projectResult(value: PartnerAlertWriteResult, communityId: string): PartnerAlertWriteResult {
  const result = partnerAlertRecord(value, "result");
  partnerAlertExactKeys(result, ["communityId", "partnerRevision", "resourceId", "resourceVersion", "state"], "result");
  if (result.communityId !== communityId || typeof result.state !== "string"
    || !["draft", "awaiting_approval", "setup_required", "active", "publishing_paused", "suspended", "ended", "approved", "withdrawn", "proposed", "accepted"].includes(result.state)) throw new WorkflowUnavailable();
  return Object.freeze({ communityId: partnerAlertId(result.communityId, "communityId"),
    partnerRevision: partnerAlertInteger(result.partnerRevision, "partnerRevision", 1),
    resourceId: partnerAlertId(result.resourceId, "resourceId"), resourceVersion: partnerAlertInteger(result.resourceVersion, "resourceVersion", 1), state: result.state });
}

/** No DB, SQL, native client, auth provider, timer or startup is constructed.
 * Default disabled/null. A feature flag or forged/cast receipt cannot bind it. */
export class PartnerAlertWorkflow {
  private readonly enabled: boolean;
  constructor(configuration: Readonly<{ enabled?: boolean }> = {}, private readonly bindings: PartnerAlertWorkflowBindings | null = null) {
    this.enabled = configuration.enabled === true;
  }
  execute(receipt: PartnerAlertVerifiedCommand<unknown>): PartnerAlertWorkflowResult {
    if (!this.enabled || !this.bindings) return Object.freeze({ kind: "unavailable" });
    try {
      requirePartnerAlertVerifiedCommand(receipt);
      const command = parsePartnerAlertWorkflowCommand(receipt.command, receipt.target);
      const scope: PartnerAlertWorkflowScope = Object.freeze({ receipt, command });
      requireActor(scope); let called = false; let projected: PartnerAlertWriteResult | null = null;
      const result = this.bindings.withinAdmittedWriter(scope, permit => {
        if (called || permit.scope !== scope || permit.authority !== receipt.authority || permit.isCurrent() !== true) throw new WorkflowUnavailable();
        called = true; requireActor(scope);
        const input = { ...command, requestId: partnerAlertId(receipt.requestId, "requestId") };
        const repository = permit.repository; let written: PartnerAlertWriteResult;
        // Explicit existing-command dispatch; no repository[clientMethod].
        switch (command.action) {
          case "savePartnerDraft": written = repository.savePartnerDraft({ ...command, requestId: input.requestId }); break;
          case "saveMappingDraft": written = repository.saveMappingDraft({ ...command, requestId: input.requestId }); break;
          case "saveOfferVersion": written = repository.saveOfferVersion({ ...command, requestId: input.requestId }); break;
          case "acceptPublishingAgreement": written = repository.acceptPublishingAgreement({ ...command, requestId: input.requestId }); break;
          case "submitRequest": written = repository.submitRequest({ ...command, requestId: input.requestId }); break;
          case "proposePublishingAgreement": written = repository.proposePublishingAgreement({ ...command, requestId: input.requestId }); break;
          case "approveMapping": written = repository.approveMapping({ ...command, requestId: input.requestId }); break;
          case "approveOffer": written = repository.approveOffer({ ...command, requestId: input.requestId }); break;
          case "approvePartner": written = repository.approvePartner({ ...command, requestId: input.requestId }); break;
          case "setPartnerState": written = repository.setPartnerState({ ...command, requestId: input.requestId }); break;
          case "requestChanges": written = repository.requestChanges({ ...command, requestId: input.requestId }); break;
          case "withdrawMapping": written = repository.withdrawMapping({ ...command, requestId: input.requestId }); break;
          case "withdrawOffer": written = repository.withdrawOffer({ ...command, requestId: input.requestId }); break;
          default: throw new WorkflowUnavailable();
        }
        if (permit.isCurrent() !== true) throw new WorkflowUnavailable();
        projected = projectResult(written, command.communityId); return projected;
      });
      if (!called || projected === null || result !== projected) throw new WorkflowUnavailable();
      return Object.freeze({ kind: "applied", result: projected });
    } catch (error) {
      if (error instanceof PartnerAlertRepositoryError) return Object.freeze({ kind: error.kind === "unavailable" ? "unavailable" : error.kind });
      if (error instanceof PartnerAlertValidationError) return Object.freeze({ kind: error.field === "verifiedCommand" ? "forbidden" : "invalid" });
      return Object.freeze({ kind: "unavailable" });
    }
  }
}
