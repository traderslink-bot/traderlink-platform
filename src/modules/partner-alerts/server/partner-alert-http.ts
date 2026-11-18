import { PartnerAlertValidationError } from "../contracts/partner-alert-contracts";
import { partnerAlertExactKeys, partnerAlertId, partnerAlertInteger, partnerAlertRecord, partnerAlertSnowflake } from "../contracts/partner-alert-validation";
import { isTraderLinkPlatformError } from "../../platform/server/database/platform-migration-contract";
import { requirePlatformMutationRequest } from "../../platform/server/authentication/platform-mutation-request-security";
import { partnerAlertPrivateResponseHeaders, readPartnerAlertMutation, type PartnerAlertRequestBindings } from "./partner-alert-request-boundary";
import { projectPartnerAlertPrivateRead, projectPartnerAlertReviewRequests } from "./partner-alert-read-model";
import { PartnerAlertRepositoryError } from "./partner-alert-repository";
import { PartnerAlertRequestWriter } from "./partner-alert-request-writer";
import { createPartnerAlertProviderFactSet,
  type PartnerAlertProviderVerificationResults } from "./partner-alert-provider-facts";
import type { PartnerAlertProviderVerificationPlan } from "./partner-alert-provider-verification";
import { partnerAlertWorkflowTarget,
  type PartnerAlertWorkflowResult, type PartnerAlertWorkflowTarget } from "./partner-alert-workflow";

function response(status: number, body: unknown, allowedMethod: "GET" | "POST" = "POST"): Response {
  const headers = partnerAlertPrivateResponseHeaders();
  headers.set("content-type", "application/json; charset=utf-8");
  if (status === 405) headers.set("allow", allowedMethod);
  return new Response(JSON.stringify(body), { status, headers });
}
function unavailable(): Response {
  return response(503, { ok: false, code: "unavailable", message: "Partner alert settings are temporarily unavailable." });
}

/** Run before the owner-evidence refresh, whose unavailable result must not
 * disguise a rejection from this exact browser-request security check.
 * This grants no identity or writer authority; later checks still run. */
export function partnerAlertOwnerMutationRequestDenied(request: Request): Response | null {
  try {
    requirePlatformMutationRequest(request);
    return null;
  } catch (error) {
    if (isTraderLinkPlatformError(error) && error.code === "TRADERLINK_WORKSPACE_ACCESS_DENIED") {
      return response(403, { ok: false, code: "forbidden", message: "This action could not be authorized." });
    }
    throw error;
  }
}

function outcome(result: PartnerAlertWorkflowResult): Response {
  switch (result.kind) {
    case "applied": return response(200, { ok: true, result: result.result });
    case "invalid": return response(400, { ok: false, code: "invalid_request", message: "Check the partner alert settings." });
    case "forbidden": return response(403, { ok: false, code: "forbidden", message: "This action could not be authorized." });
    case "conflict": return response(409, { ok: false, code: "conflict", message: "These settings changed. Reload before saving." });
    case "unavailable": return unavailable();
  }
}
const PROVIDER_ACTIONS = new Set(["saveOfferVersion", "submitRequest", "proposePublishingAgreement",
  "approveMapping", "approveOffer", "approvePartner", "activatePartner"]);

export type PartnerAlertPrivateReadTarget = Readonly<{ kind: "operator_partner"; communityId: string }>
  | Readonly<{ kind: "community_partner"; communityId: string }>
  | Readonly<{ kind: "operator_alert_activity" | "community_alert_activity"; communityId: string; messageId: string | null }>
  | Readonly<{ kind: "operator_review_requests" | "operator_role_review_events"; limit: number }>;

export type PartnerAlertProviderVerifier = (plan: PartnerAlertProviderVerificationPlan,
  signal: AbortSignal) => Promise<PartnerAlertProviderVerificationResults>;

function privateReadTarget(input: PartnerAlertPrivateReadTarget): PartnerAlertPrivateReadTarget {
  const value = partnerAlertRecord(input, "privateReadTarget");
  if (value.kind === "operator_partner" || value.kind === "community_partner") {
    partnerAlertExactKeys(value, ["kind", "communityId"], "privateReadTarget");
    return Object.freeze({ kind: value.kind, communityId: partnerAlertId(value.communityId, "communityId") });
  }
  if (value.kind === "operator_alert_activity" || value.kind === "community_alert_activity") {
    partnerAlertExactKeys(value, ["kind", "communityId", "messageId"], "privateReadTarget");
    return Object.freeze({ kind: value.kind, communityId: partnerAlertId(value.communityId, "communityId"),
      messageId: value.messageId === null ? null : partnerAlertSnowflake(value.messageId, "messageId") });
  }
  if (value.kind === "operator_review_requests" || value.kind === "operator_role_review_events") {
    partnerAlertExactKeys(value, ["kind", "limit"], "privateReadTarget");
    return Object.freeze({ kind: value.kind, limit: partnerAlertInteger(value.limit, "limit", 1, 100) });
  }
  throw new PartnerAlertValidationError("privateReadTarget");
}

export function partnerAlertPrivateReadFailure(error: unknown): Response {
  if (isTraderLinkPlatformError(error)) {
    switch (error.code) {
      case "TRADERLINK_WORKSPACE_ACCESS_DENIED":
      case "TRADERLINK_AUTH_SESSION_INVALID":
        return response(401, { ok: false, code: "sign_in_required", message: "Sign in again to view these settings." });
      case "TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED":
        return response(403, { ok: false, code: "forbidden", message: "These settings could not be authorized." });
      case "TRADERLINK_JOURNAL_ADMIN_RATE_LIMITED":
        return response(429, { ok: false, code: "rate_limited", message: "Too many requests. Try again later." });
      default: return unavailable();
    }
  }
  if (error instanceof PartnerAlertRepositoryError) {
    if (error.kind === "forbidden") return response(403, { ok: false, code: "forbidden", message: "These settings could not be authorized." });
    if (error.kind === "unavailable") return response(404, { ok: false, code: "not_found", message: "These partner alert settings were not found." });
    return unavailable();
  }
  if (error instanceof PartnerAlertValidationError
    && ["identity", "sessionId", "operator", "community", "communityOwner", "authority"].includes(error.field)) {
    return response(403, { ok: false, code: "forbidden", message: "These settings could not be authorized." });
  }
  // Unknown admission/configuration, stored-data, schema and audit faults are
  // unavailable, not a guessed client error or an accepted authorization result.
  return unavailable();
}

/** Unregistered private HTTP adapter; not an app/api route, listener or fetch
 * client. Reads and mutations require a concrete server-owned admitted writer.
 * Mutation preparation issues no authority. Targets never come from body/
 * query permissions. No OAuth/webhook/subscriber/checkout/grant endpoint. */
export class PartnerAlertHttpAdapter {
  private readonly enabled: boolean;
  private readonly providerVerificationTimeoutMs: number;
  constructor(configuration: Readonly<{ enabled?: boolean; providerVerificationTimeoutMs?: number }> = {},
    private readonly requests: PartnerAlertRequestBindings | null = null,
    private readonly writer: PartnerAlertRequestWriter | null = null,
    private readonly verifyProviders: PartnerAlertProviderVerifier | null = null,
    private readonly verifySourceName?: (request: Request, command: Awaited<ReturnType<typeof readPartnerAlertMutation>>["command"]) => Promise<void>) {
    this.enabled = configuration.enabled === true;
    this.providerVerificationTimeoutMs = configuration.providerVerificationTimeoutMs === undefined
      ? 10_000 : partnerAlertInteger(configuration.providerVerificationTimeoutMs,
        "providerVerificationTimeoutMs", 100, 30_000);
  }
  async handleMutation(request: Request, serverTarget: PartnerAlertWorkflowTarget,
    expectedCommunityId?: string): Promise<Response> {
    // Fail before body/auth work while bindings are unavailable; constructors do nothing.
    if (!this.enabled || !this.requests || !(this.writer instanceof PartnerAlertRequestWriter)) return unavailable();
    if (request.method !== "POST") return response(405, { ok: false, code: "method_not_allowed", message: "Use the form to save these settings." });
    try {
      const target = partnerAlertWorkflowTarget(serverTarget);
      const prepared = await readPartnerAlertMutation(request, target, this.requests);
      if (expectedCommunityId !== undefined
        && prepared.command.communityId !== partnerAlertId(expectedCommunityId, "communityId")) {
        return response(400, { ok: false, code: "invalid_request", message: "Check the partner alert settings." });
      }
      if (request.signal.aborted) return response(400, { ok: false, code: "invalid_request", message: "The request could not be completed." });
      if (this.verifySourceName && (prepared.command.action === "savePartnerDraft" || prepared.command.action === "saveMappingDraft")) {
        const replay = this.writer.tryMutationReplay(request, prepared);
        if (replay) return outcome(replay);
        await this.verifySourceName(request, prepared.command);
      }
      // Commands without provider reads retain the original admitted path. This
      // includes initial profile creation before a partner row exists.
      if (!PROVIDER_ACTIONS.has(prepared.command.action)) return outcome(this.writer.executeMutation(request, prepared));
      // Exact durable replays return before provider credentials or network are
      // touched. Changed payloads with the same actor/request key conflict.
      const replay = this.writer.tryMutationReplay(request, prepared);
      if (replay) return outcome(replay);
      // Authorization and the current partner revision are checked before any
      // provider adapter can resolve credentials or perform network I/O.
      const plan = this.writer.preauthorizeProviderVerification(request, prepared);
      const needsProvider = plan.resourceChecks.length > 0 || plan.offerChecks.length > 0
        || (plan.stripeOfferChecks?.length ?? 0) > 0 || plan.pricingCapabilitiesRequired;
      if (needsProvider && !this.verifyProviders) return unavailable();
      const controller = new AbortController();
      const abort = (): void => controller.abort(request.signal.reason);
      request.signal.addEventListener("abort", abort, { once: true });
      const timeout = setTimeout(() => controller.abort(new Error("Provider verification timed out.")),
        this.providerVerificationTimeoutMs);
      let results: PartnerAlertProviderVerificationResults;
      let rejectOnAbort: (() => void) | null = null;
      try {
        if (needsProvider) {
          const aborted = new Promise<never>((_resolve, reject) => {
            rejectOnAbort = () => reject(new Error("Provider verification was cancelled."));
            controller.signal.addEventListener("abort", rejectOnAbort, { once: true });
          });
          results = await Promise.race([this.verifyProviders!(plan, controller.signal), aborted]);
        } else {
          results = Object.freeze({ resources: Object.freeze([]), offers: Object.freeze([]), pricing: null });
        }
        if (controller.signal.aborted || request.signal.aborted) return unavailable();
      } finally {
        clearTimeout(timeout);
        if (rejectOnAbort) controller.signal.removeEventListener("abort", rejectOnAbort);
        request.signal.removeEventListener("abort", abort);
      }
      const facts = createPartnerAlertProviderFactSet(plan, results);
      // The writer consumes the exact preflight/fact capability once, rechecks
      // the unchanged request inside its Auth-owned transaction, and destroys
      // all provider callbacks on either success or failure.
      return outcome(this.writer.executeMutation(request, prepared, { plan, facts }));
    } catch (error) {
      if (isTraderLinkPlatformError(error)) return partnerAlertPrivateReadFailure(error);
      if (error instanceof PartnerAlertValidationError) {
        const forbidden = ["identity", "sessionId", "verifiedCommand", "communityOwner", "requestAuthority", "requestOrigin"].includes(error.field);
        return response(forbidden ? 403 : 400, { ok: false, code: forbidden ? "forbidden" : "invalid_request",
          message: forbidden ? "This action could not be authorized." : "Check the partner alert settings." });
      }
      // Never include provider bodies, tokens, DB paths, private agreements or raw errors.
      return unavailable();
    }
  }

  handlePrivateRead(request: Request, serverTarget: PartnerAlertPrivateReadTarget,
    writer: PartnerAlertRequestWriter): Response {
    if (!this.enabled || !(writer instanceof PartnerAlertRequestWriter)) return unavailable();
    if (request.method !== "GET") return response(405, { ok: false, code: "method_not_allowed",
      message: "Reload the page to view these settings." }, "GET");
    let target: PartnerAlertPrivateReadTarget;
    try { target = privateReadTarget(serverTarget); }
    catch (error) {
      if (error instanceof PartnerAlertValidationError) return response(400, { ok: false, code: "invalid_request",
        message: "Check the requested partner alert settings." });
      return unavailable();
    }
    try {
      const result = writer.run(request, scope => {
        switch (target.kind) {
          case "operator_partner": return projectPartnerAlertPrivateRead(scope.readPartner(target.communityId, "owner"));
          case "community_partner": return projectPartnerAlertPrivateRead(scope.readPartner(target.communityId, "partner"));
          case "operator_alert_activity": return scope.readDeliveryActivity(target.communityId, "owner", target.messageId);
          case "community_alert_activity": return scope.readDeliveryActivity(target.communityId, "partner", target.messageId);
          case "operator_role_review_events": return scope.listRoleReviewEvents(target.limit);
          case "operator_review_requests": return projectPartnerAlertReviewRequests(scope.listReviewRequests(target.limit));
        }
      });
      // Projection and validation completed inside admission; Response/JSON is
      // created only after the actual writer/Auth frame returns committed DTOs.
      return response(200, { ok: true, result });
    } catch (error) { return partnerAlertPrivateReadFailure(error); }
  }
}
