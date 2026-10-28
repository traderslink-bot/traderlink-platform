import type { requirePlatformMutationRequest } from "../../platform/server/authentication/platform-mutation-request-security";
import type { requireJournalAdminMutationRequest, consumeJournalAdminRateLimit } from "../../platform/server/administration/platform-admin-request-security";
import { JOURNAL_ADMIN_IDEMPOTENCY_HEADER } from "../../platform/contracts/journal-admin-request";
import { PartnerAlertValidationError } from "../contracts/partner-alert-contracts";
import { partnerAlertId, partnerAlertRecord } from "../contracts/partner-alert-validation";
import { PartnerAlertPlatformAuthority, type PartnerAlertPlatformBindings } from "./partner-alert-platform-authority";

export const PARTNER_ALERT_IDEMPOTENCY_HEADER = "x-traderlink-partner-alert-idempotency-key" as const;
const MAX_BODY_BYTES = 65_536;
export type PartnerAlertRequestTarget = Readonly<{ kind: "operator" }>
  | Readonly<{ kind: "community_owner"; communityId: string }>
  | Readonly<{ kind: "subscriber"; communityId: string }>;
export type PartnerAlertRequestBindings = Readonly<{
  configuredOrigin: string;
  platform: PartnerAlertPlatformBindings;
  platformMutationGuard: typeof requirePlatformMutationRequest;
  operatorMutationGuard: typeof requireJournalAdminMutationRequest;
  operatorRateLimit: typeof consumeJournalAdminRateLimit;
  /** Required server-side admission hook. No permissive built-in or browser input.
   * Current runtime binding/limits must be assigned and reviewed before routing. */
  admitCommand: (input: Readonly<{ userId: string; target: PartnerAlertRequestTarget; requestId: string }>) => void;
}>;
const verified = new WeakSet<object>();
export type PartnerAlertVerifiedCommand<T> = Readonly<{
  requestId: string;
  userId: string;
  target: PartnerAlertRequestTarget;
  command: T;
  authority: PartnerAlertPlatformAuthority;
}>;

function requireConfiguredOrigin(request: Request, configured: string): void {
  const origin = new URL(configured);
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname);
  if (origin.origin !== configured || origin.username || origin.password
    || (origin.protocol !== "https:" && !(origin.protocol === "http:" && loopback))
    || request.headers.get("origin") !== configured) throw new PartnerAlertValidationError("requestOrigin", "The request could not be verified.");
}
async function readJson(request: Request): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type");
  if (!contentType || !/^application\/json(?:\s*;\s*charset=utf-8)?$/iu.test(contentType)
    || (request.headers.get("content-encoding") ?? "identity") !== "identity") throw new PartnerAlertValidationError("contentType");
  const length = request.headers.get("content-length");
  if (length !== null && (!/^[0-9]{1,8}$/u.test(length) || Number(length) > MAX_BODY_BYTES)) {
    throw new PartnerAlertValidationError("requestBody", "The request is too large.");
  }
  if (!request.body || request.signal.aborted) throw new PartnerAlertValidationError("requestBody");
  const reader = request.body.getReader(); const chunks: Uint8Array[] = []; let bytes = 0;
  try {
    for (;;) {
      if (request.signal.aborted) throw new PartnerAlertValidationError("requestBody");
      const item = await reader.read(); if (item.done) break;
      bytes += item.value.byteLength;
      if (bytes > MAX_BODY_BYTES) throw new PartnerAlertValidationError("requestBody", "The request is too large.");
      chunks.push(item.value);
    }
  } catch {
    try { await reader.cancel(); } catch { /* No raw body/error logging. */ }
    throw new PartnerAlertValidationError("requestBody", "The request body could not be read.");
  } finally { reader.releaseLock(); }
  const body = new Uint8Array(bytes); let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  try { return partnerAlertRecord(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body)), "requestBody"); }
  catch { throw new PartnerAlertValidationError("requestBody", "Enter a valid request."); }
}

/** Dormant command boundary, not a route. Webhooks/OAuth callbacks must use
 * separately reviewed signature/state boundaries, never this browser command. */
export async function readPartnerAlertMutation<T>(request: Request, target: PartnerAlertRequestTarget,
  parseCommand: (body: Readonly<Record<string, unknown>>, binding: Readonly<{ userId: string; communityId: string | null }>) => T,
  bindings: PartnerAlertRequestBindings): Promise<PartnerAlertVerifiedCommand<T>> {
  if (request.method !== "POST") throw new PartnerAlertValidationError("method");
  if (!["operator", "community_owner", "subscriber"].includes(target.kind)) throw new PartnerAlertValidationError("requestTarget");
  const selected: PartnerAlertRequestTarget = target.kind === "operator" ? Object.freeze({ kind: "operator" })
    : Object.freeze({ kind: target.kind, communityId: partnerAlertId(target.communityId, "communityId") });
  requireConfiguredOrigin(request, bindings.configuredOrigin);
  if (selected.kind === "operator") bindings.operatorMutationGuard(request);
  else bindings.platformMutationGuard(request);
  const requestId = partnerAlertId(request.headers.get(selected.kind === "operator"
    ? JOURNAL_ADMIN_IDEMPOTENCY_HEADER : PARTNER_ALERT_IDEMPOTENCY_HEADER), "requestId");
  const body = await readJson(request);
  // Identity comes from the current resolver AFTER body read, never JSON. Each
  // concrete command parser must still reject unknown keys and bind route IDs.
  for (const key of ["actor", "actorUserId", "sessionId", "scope", "premium", "membershipEvidence", "authority", "whopUserRef"]) {
    if (Object.hasOwn(body, key)) throw new PartnerAlertValidationError("requestAuthority");
  }
  const authority = PartnerAlertPlatformAuthority.forRequest(request, bindings.platform);
  const member = selected.kind === "operator" ? authority.requireOperator()
    : selected.kind === "community_owner" ? authority.requireCommunityOwner(selected.communityId)
    : authority.requireSignedInUser();
  if (selected.kind !== "operator" && body.communityId !== undefined && body.communityId !== selected.communityId) {
    throw new PartnerAlertValidationError("communityId");
  }
  bindings.admitCommand({ userId: member.userId, target: selected, requestId });
  if (selected.kind === "operator") bindings.operatorRateLimit({ category: "sensitive", userId: member.userId,
    headers: request.headers, environment: bindings.platform.identityOptions.environment,
    now: () => new Date(bindings.platform.nowUtc()) });
  const command = parseCommand(body, { userId: member.userId, communityId: selected.kind === "operator" ? null : selected.communityId });
  const receipt = Object.freeze({ requestId, userId: member.userId, target: selected, command, authority });
  verified.add(receipt); return receipt;
}

/** Checks server-issued provenance when a later route passes a receipt onward. */
export function requirePartnerAlertVerifiedCommand<T>(receipt: PartnerAlertVerifiedCommand<T>): void {
  if (!receipt || !verified.has(receipt)) throw new PartnerAlertValidationError("verifiedCommand");
  receipt.authority.requireSignedInUser();
}
export function partnerAlertPrivateResponseHeaders(): Headers {
  return new Headers({ "cache-control": "private, no-store, max-age=0", pragma: "no-cache",
    "x-content-type-options": "nosniff", vary: "Cookie" });
}
