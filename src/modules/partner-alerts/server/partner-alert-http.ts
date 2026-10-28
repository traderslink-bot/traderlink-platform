import { PartnerAlertValidationError } from "../contracts/partner-alert-contracts";
import { partnerAlertPrivateResponseHeaders, readPartnerAlertMutation, type PartnerAlertRequestBindings } from "./partner-alert-request-boundary";
import { parsePartnerAlertWorkflowCommand, partnerAlertWorkflowTarget,
  type PartnerAlertWorkflow, type PartnerAlertWorkflowResult, type PartnerAlertWorkflowTarget } from "./partner-alert-workflow";

function response(status: number, body: unknown): Response {
  const headers = partnerAlertPrivateResponseHeaders();
  headers.set("content-type", "application/json; charset=utf-8");
  if (status === 405) headers.set("allow", "POST");
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

/** Dormant incoming-command adapter, NOT an app/api route, listener or fetch
 * client. No request target comes from body/query permissions. Actual auth,
 * configured origin, admission, native/config receipts and repository writer
 * bindings are absent. No OAuth/webhook/subscriber/checkout/grant endpoint. */
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
}
