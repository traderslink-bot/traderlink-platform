import type Database from "better-sqlite3";
import { requirePlatformMutationRequest } from "../../platform/server/authentication/platform-mutation-request-security";
import { requireJournalAdminMutationRequest, consumeJournalAdminRateLimit } from "../../platform/server/administration/platform-admin-request-security";
import { requirePlatformErasureWriter } from "../../platform/server/privacy/platform-erasure-admission";
import { JOURNAL_ADMIN_IDEMPOTENCY_HEADER } from "../../platform/contracts/journal-admin-request";
import { PartnerAlertValidationError } from "../contracts/partner-alert-contracts";
import { PARTNER_ALERT_IDEMPOTENCY_HEADER } from "../contracts/partner-alert-request";
import { partnerAlertId, partnerAlertRecord } from "../contracts/partner-alert-validation";
import type { PartnerAlertPlatformAuthority } from "./partner-alert-platform-authority";
import { parsePartnerAlertWorkflowCommand, partnerAlertWorkflowTarget,
  type PartnerAlertWorkflowCommand, type PartnerAlertWorkflowTarget } from "./partner-alert-workflow";

export { PARTNER_ALERT_IDEMPOTENCY_HEADER };
const MAX_BODY_BYTES = 65_536;
export type PartnerAlertRequestTarget = Readonly<{ kind: "operator" }>
  | Readonly<{ kind: "community_owner"; communityId: string }>
  | Readonly<{ kind: "subscriber"; communityId: string }>;
export type PartnerAlertRequestBindings = Readonly<{
  configuredOrigin: string;
}>;
export type PartnerAlertPreparedCommand = Readonly<{
  requestId: string; target: PartnerAlertWorkflowTarget; command: PartnerAlertWorkflowCommand;
}>;
const prepared = new WeakMap<object, { request: Request; headers: string; origin: string; consumed: boolean }>();
const verified = new WeakMap<object, () => void>();
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
export async function readPartnerAlertRequestText(request: Request, maximumBytes = MAX_BODY_BYTES): Promise<string> {
  const contentType = request.headers.get("content-type");
  if (!contentType || !/^application\/json(?:\s*;\s*charset=utf-8)?$/iu.test(contentType)
    || (request.headers.get("content-encoding") ?? "identity") !== "identity") throw new PartnerAlertValidationError("contentType");
  const length = request.headers.get("content-length");
  if (length !== null && (!/^[0-9]{1,8}$/u.test(length) || Number(length) > maximumBytes)) {
    throw new PartnerAlertValidationError("requestBody", "The request is too large.");
  }
  if (!request.body || request.signal.aborted) throw new PartnerAlertValidationError("requestBody");
  const reader = request.body.getReader(); const chunks: Uint8Array[] = []; let bytes = 0;
  try {
    for (;;) {
      if (request.signal.aborted) throw new PartnerAlertValidationError("requestBody");
      const item = await reader.read(); if (item.done) break;
      bytes += item.value.byteLength;
      if (bytes > maximumBytes) throw new PartnerAlertValidationError("requestBody", "The request is too large.");
      chunks.push(item.value);
    }
  } catch {
    try { await reader.cancel(); } catch { /* No raw body/error logging. */ }
    throw new PartnerAlertValidationError("requestBody", "The request body could not be read.");
  } finally { reader.releaseLock(); }
  const body = new Uint8Array(bytes); let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  try { return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(body); }
  catch { throw new PartnerAlertValidationError("requestBody", "Enter a valid request."); }
}

export async function readPartnerAlertRequestJson(request: Request, maximumBytes = MAX_BODY_BYTES): Promise<Record<string, unknown>> {
  const raw = await readPartnerAlertRequestText(request, maximumBytes);
  try { return partnerAlertRecord(JSON.parse(raw.replace(/^\uFEFF/u, "")), "requestBody"); }
  catch { throw new PartnerAlertValidationError("requestBody", "Enter a valid request."); }
}

/** Bounded asynchronous preparation ONLY: no identity, actor or admission is
 * issued here. The genuine receipt exists only during synchronous consumption
 * inside the actual Core/Auth writer. Not a route or webhook boundary. */
export async function readPartnerAlertMutation(request: Request, target: PartnerAlertWorkflowTarget,
  bindings: PartnerAlertRequestBindings): Promise<PartnerAlertPreparedCommand> {
  if (request.method !== "POST") throw new PartnerAlertValidationError("method");
  const selected = partnerAlertWorkflowTarget(target);
  const origin = bindings.configuredOrigin;
  requireConfiguredOrigin(request, origin);
  // Reject malformed browser requests before reading a body; repeat the same
  // actual guard inside admission. Neither check grants actor authority.
  if (selected.kind === "operator") requireJournalAdminMutationRequest(request);
  else requirePlatformMutationRequest(request);
  const headers = JSON.stringify([...request.headers.entries()]);
  const requestId = partnerAlertId(request.headers.get(selected.kind === "operator"
    ? JOURNAL_ADMIN_IDEMPOTENCY_HEADER : PARTNER_ALERT_IDEMPOTENCY_HEADER), "requestId");
  const body = await readPartnerAlertRequestJson(request);
  // Identity never comes from JSON; the canonical parser also rejects unknown keys.
  for (const key of ["actor", "actorUserId", "sessionId", "scope", "premium", "membershipEvidence", "authority", "whopUserRef"]) {
    if (Object.hasOwn(body, key)) throw new PartnerAlertValidationError("requestAuthority");
  }
  const command = parsePartnerAlertWorkflowCommand(body, selected);
  if (request.signal.aborted || JSON.stringify([...request.headers.entries()]) !== headers) {
    throw new PartnerAlertValidationError("requestAuthority");
  }
  const value = Object.freeze({ requestId, target: selected, command });
  prepared.set(value, { request, headers, origin, consumed: false });
  return value;
}

/** Recheck an unconsumed prepared command before an authenticated server-only
 * provider preflight. This does not consume it, identify an actor, issue a
 * receipt or authorize I/O; the admitted writer must perform those steps. */
export function inspectPartnerAlertPreparedCommand(
  value: PartnerAlertPreparedCommand,
  request: Request,
): PartnerAlertPreparedCommand {
  const binding = prepared.get(value);
  if (!binding || binding.consumed || binding.request !== request || request.signal.aborted
    || binding.headers !== JSON.stringify([...request.headers.entries()])) {
    throw new PartnerAlertValidationError("verifiedCommand");
  }
  requireConfiguredOrigin(request, binding.origin);
  if (value.target.kind === "operator") requireJournalAdminMutationRequest(request);
  else requirePlatformMutationRequest(request);
  return value;
}

/** Consume once, with a receipt scoped to this exact live Core frame/request
 * and authority instance. No caller-supplied guard, limiter or admission hook. */
export function withPartnerAlertVerifiedCommand<T>(value: PartnerAlertPreparedCommand, request: Request,
  database: Database.Database, authority: PartnerAlertPlatformAuthority,
  environment: NodeJS.ProcessEnv, now: () => Date,
  operation: (receipt: PartnerAlertVerifiedCommand<PartnerAlertWorkflowCommand>) => T): T {
  const binding = prepared.get(value);
  if (!binding || binding.consumed || binding.request !== request
    || binding.headers !== JSON.stringify([...request.headers.entries()]) || request.signal.aborted) {
    throw new PartnerAlertValidationError("verifiedCommand");
  }
  binding.consumed = true;
  const admission = requirePlatformErasureWriter(database);
  const principal = admission.requestPrincipal();
  requireConfiguredOrigin(request, binding.origin);
  if (value.target.kind === "operator") requireJournalAdminMutationRequest(request);
  else requirePlatformMutationRequest(request);
  const actor = value.target.kind === "operator" ? authority.requireOperator()
    : authority.requireCommunityOwner(value.target.communityId);
  if (actor.userId !== principal.userId) throw new PartnerAlertValidationError("verifiedCommand");
  admission.assertCurrent(actor.userId);
  if (value.target.kind === "operator") consumeJournalAdminRateLimit({ category: "sensitive", userId: actor.userId,
    headers: request.headers, environment, now });
  const receipt = Object.freeze({ requestId: value.requestId, userId: actor.userId,
    target: value.target, command: value.command, authority });
  let active = true;
  const verify = (): void => {
    const current = admission.requestPrincipal();
    if (!active || request.signal.aborted || binding.headers !== JSON.stringify([...request.headers.entries()])
      || requirePlatformErasureWriter(database, actor.userId) !== admission
      || current.userId !== principal.userId || current.workspaceId !== principal.workspaceId
      || authority.requireSignedInUser().userId !== actor.userId) {
      throw new PartnerAlertValidationError("verifiedCommand");
    }
  };
  verified.set(receipt, verify);
  try { verify(); const result = operation(receipt); verify(); return result; }
  finally { active = false; verified.delete(receipt); }
}

/** Checks server-issued provenance when a later route passes a receipt onward. */
export function requirePartnerAlertVerifiedCommand<T>(receipt: PartnerAlertVerifiedCommand<T>): void {
  const verify = receipt && verified.get(receipt);
  if (!verify) throw new PartnerAlertValidationError("verifiedCommand");
  verify();
}
export function partnerAlertPrivateResponseHeaders(): Headers {
  return new Headers({ "cache-control": "private, no-store, max-age=0", pragma: "no-cache",
    "x-content-type-options": "nosniff", vary: "Cookie" });
}
