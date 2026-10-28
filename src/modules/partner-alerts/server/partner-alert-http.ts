import { PartnerAlertValidationError } from "../contracts/partner-alert-contracts";
import { partnerAlertExactKeys, partnerAlertId, partnerAlertInteger, partnerAlertRecord } from "../contracts/partner-alert-validation";
import { isTraderLinkPlatformError } from "../../platform/server/database/platform-migration-contract";
import { partnerAlertPrivateResponseHeaders, readPartnerAlertMutation, type PartnerAlertRequestBindings } from "./partner-alert-request-boundary";
import { projectPartnerAlertPrivateRead, projectPartnerAlertReviewRequests } from "./partner-alert-read-model";
import { PartnerAlertRepositoryError } from "./partner-alert-repository";
import { PartnerAlertRequestWriter } from "./partner-alert-request-writer";
import { parsePartnerAlertWorkflowCommand, partnerAlertWorkflowTarget,
  type PartnerAlertWorkflow, type PartnerAlertWorkflowResult, type PartnerAlertWorkflowTarget } from "./partner-alert-workflow";

function response(status: number, body: unknown, allowedMethod: "GET" | "POST" = "POST"): Response {
  const headers = partnerAlertPrivateResponseHeaders();
  headers.set("content-type", "application/json; charset=utf-8");
  if (status === 405) headers.set("allow", allowedMethod);
  return new Response(JSON.stringify(body), { status, headers });
}
function unavailable(): Response {
  return response(503, { ok: false, code: "unavailable", message: "Partner alert settings are temporarily unavailable." });
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

export type PartnerAlertPrivateReadTarget = Readonly<{ kind: "operator_partner"; communityId: string }>
  | Readonly<{ kind: "community_partner"; communityId: string }>
  | Readonly<{ kind: "operator_review_requests"; limit: number }>;

function privateReadTarget(input: PartnerAlertPrivateReadTarget): PartnerAlertPrivateReadTarget {
  const value = partnerAlertRecord(input, "privateReadTarget");
  if (value.kind === "operator_partner" || value.kind === "community_partner") {
    partnerAlertExactKeys(value, ["kind", "communityId"], "privateReadTarget");
    return Object.freeze({ kind: value.kind, communityId: partnerAlertId(value.communityId, "communityId") });
  }
  if (value.kind === "operator_review_requests") {
    partnerAlertExactKeys(value, ["kind", "limit"], "privateReadTarget");
    return Object.freeze({ kind: "operator_review_requests", limit: partnerAlertInteger(value.limit, "limit", 1, 100) });
  }
  throw new PartnerAlertValidationError("privateReadTarget");
}

function privateReadFailure(error: unknown): Response {
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
 * client. Reads require a concrete server-owned writer; mutations retain their
 * separate unbound request/workflow dependencies. Targets never come from body/
 * query permissions. No OAuth/webhook/subscriber/checkout/grant endpoint. */
export class PartnerAlertHttpAdapter {
  private readonly enabled: boolean;
  constructor(configuration: Readonly<{ enabled?: boolean }> = {},
    private readonly requests: PartnerAlertRequestBindings | null = null,
    private readonly workflow: PartnerAlertWorkflow | null = null) {
    this.enabled = configuration.enabled === true;
  }
  async handleMutation(request: Request, serverTarget: PartnerAlertWorkflowTarget): Promise<Response> {
    // Fail before body/auth work while bindings are unavailable; constructors do nothing.
    if (!this.enabled || !this.requests || !this.workflow) return unavailable();
    if (request.method !== "POST") return response(405, { ok: false, code: "method_not_allowed", message: "Use the form to save these settings." });
    try {
      const target = partnerAlertWorkflowTarget(serverTarget);
      const receipt = await readPartnerAlertMutation(request, target, body => parsePartnerAlertWorkflowCommand(body, target), this.requests);
      if (request.signal.aborted) return response(400, { ok: false, code: "invalid_request", message: "The request could not be completed." });
      return outcome(this.workflow.execute(receipt));
    } catch (error) {
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
          case "operator_review_requests": return projectPartnerAlertReviewRequests(scope.listReviewRequests(target.limit));
        }
      });
      // Projection and validation completed inside admission; Response/JSON is
      // created only after the actual writer/Auth frame returns committed DTOs.
      return response(200, { ok: true, result });
    } catch (error) { return privateReadFailure(error); }
  }
}
