import type { PartnerAlertSubscriberOffer } from "./partner-alert-subscriber-access";
import { readPartnerAlertIsolatedStaging } from "./partner-alert-isolated-staging";
import { createHash } from "node:crypto";
import type Database from "better-sqlite3";
import { requirePlatformMutationRequest } from "../../platform/server/authentication/platform-mutation-request-security";
import { refreshPartnerAlertDiscordNames } from "./partner-alert-discord-name-refresh";
import type { PartnerAlertDiscordSourceCatalog } from "./partner-alert-discord-channel-catalog";
import { PlatformAdminAuthorization } from "../../platform/server/administration/platform-admin-authorization";
import { consumeJournalAdminRateLimit, requireJournalAdminMutationRequest } from "../../platform/server/administration/platform-admin-request-security";
import { PlatformAuthenticationRepository } from "../../platform/server/authentication/platform-authentication-repository";
import { resolveTraderLinkDiscordGuildId } from "../../platform/server/authentication/platform-discord-configuration";
import { PlatformDiscordMembershipRepository } from "../../platform/server/authentication/platform-discord-membership-repository";
import { PlatformSessionRepository } from "../../platform/server/authentication/platform-session-repository";
import { hashPlatformSessionToken, TRADERLINK_PLATFORM_SESSION_COOKIE } from "../../platform/server/authentication/platform-session-service";
import { platformAuthCookieName } from "../../platform/server/authentication/platform-auth-cookies";
import { requireTraderLinkPlatformAuthenticatedRequestIdentity,
  type TraderLinkPlatformRequestIdentity } from "../../platform/server/authentication/require-platform-request-scope";
import { PlatformWorkspaceRepository } from "../../platform/server/identity/platform-workspace-repository";
import { TraderLinkCommunityRepository } from "../../communities/server/traderlink-community-repository";
import { PartnerAlertValidationError } from "../contracts/partner-alert-contracts";
import { quotePartnerAlertPublishing } from "../contracts/partner-alert-publishing-pricing";
import { parsePartnerAlertCheckoutOffer, partnerAlertExactKeys, partnerAlertId, partnerAlertInteger, partnerAlertRecord,
  parsePartnerAlertPublishingTerms, partnerAlertRef, partnerAlertSnowflake, partnerAlertUtc } from "../contracts/partner-alert-validation";
import { PartnerAlertPlatformAuthority } from "./partner-alert-platform-authority";
import type { PartnerAlertAuthority } from "./partner-alert-authority";
import { PartnerAlertRepository, PartnerAlertRepositoryError } from "./partner-alert-repository";
import { requirePartnerAlertAdmission } from "./partner-alert-admission";
import { currentPlatformErasureAdmission, hasPlatformErasureModules, requirePlatformErasureWriter } from "../../platform/server/privacy/platform-erasure-admission";
import { inspectPartnerAlertPreparedCommand, withPartnerAlertVerifiedCommand, requirePartnerAlertVerifiedCommand,
  type PartnerAlertPreparedCommand } from "./partner-alert-request-boundary";
import { projectPartnerAlertPrivateRead } from "./partner-alert-read-model";
import { planPartnerAlertProviderVerification,
  type PartnerAlertProviderVerificationPlan } from "./partner-alert-provider-verification";
import { requirePartnerAlertProviderFactSet,
  type PartnerAlertProviderFactSet } from "./partner-alert-provider-facts";
import { PartnerAlertWorkflow, type PartnerAlertWorkflowRepository, type PartnerAlertWorkflowResult } from "./partner-alert-workflow";
import { partnerAlertCommandFingerprint, partnerAlertDraftCommandPayload } from "./partner-alert-command-fingerprint";
import { recordPartnerAlertStripeAdjustmentReview } from "./database/partner-alert-stripe-adjustment-review";
import { partnerAlertOfferSaleStateSql, partnerAlertStripePurchaseSql, partnerAlertWhopPurchaseSql,
  type PartnerAlertCatalogSaleState } from "./partner-alert-catalog-read";

export type PartnerAlertRequestWriterConfiguration = Readonly<{
  environment: NodeJS.ProcessEnv;
  now: () => Date;
  createId: () => string;
  destinationGuildId: string;
  maximumActorAgeMs: number;
  maximumDiscordEvidenceAgeMs: number;
  outputBotUserId: string;
  outputConfigurationRef: string;
  verifiedResources?: PartnerAlertAuthority["requireResources"];
  verifiedWhopOffer?: PartnerAlertAuthority["requireWhopOffer"];
  verifiedStripeOffer?: PartnerAlertAuthority["requireStripeOffer"];
  subscriberAccessQualified?: () => boolean;
  stripeEnvironment?: "sandbox" | "live";
  whopEnvironment?: "sandbox" | "live";
  qualifiedPricing?: PartnerAlertAuthority["pricingCapabilities"];
}>;

/** Request-local support for the two EXISTING authorized private reads only.
 * No DB, identity, actor receipt, native/config proof or automation writer escapes.
 * Handles work only synchronously inside the owning run callback. */
export type PartnerAlertPrivateRequestScope = Readonly<Pick<PartnerAlertRepository, "readPartner" | "readDeliveryActivity" | "listReviewRequests" | "listRoleReviewEvents" | "readRoleReviewAssignment" | "recordRoleReview"> & {
  authorizeCommunitySourceCatalog: (communityId: string) => Readonly<{
    communityId: string; sourceGuildId: string; partnerRevision: number; ownerUserId: string;
  }>;
  authorizeSubscriberOffer: (communityId: string, offerKey: string, includeExistingPurchase?: boolean) => PartnerAlertSubscriberOffer;
  reviewStripeAdjustment: (communityId: string, eventId: string, decision: "keep" | "remove") => boolean;
}>;

type OperatorAuthorizationScope = ReturnType<PlatformAdminAuthorization["authorize"]>;

type OwnedRequest = {
  owner: PartnerAlertRequestWriter;
  request: Request;
  active: boolean;
  failed: boolean;
  mutation: boolean;
  scope: PartnerAlertPrivateRequestScope | null;
  principal: RequestPrincipalBinding;
  verify: () => string;
};
const activeConnections = new WeakMap<Database.Database, OwnedRequest>();
const resolvingConnections = new WeakSet<Database.Database>();
const capabilities = new WeakSet<object>();
type ProviderPlanBinding = { writer: PartnerAlertRequestWriter; request: Request;
  command: PartnerAlertPreparedCommand; consumed: boolean };
const providerPlanBindings = new WeakMap<PartnerAlertProviderVerificationPlan, ProviderPlanBinding>();
export type PartnerAlertSourceChannelCatalogPermit = Readonly<{
  communityId: string; sourceGuildId: string; partnerRevision: number;
}>;
type RequestPrincipalBinding = Readonly<{ userId: string; sessionId: string;
  headersFingerprint: string; sessionTokenDigest: string }>;
type SourceChannelCatalogBinding = { writer: PartnerAlertRequestWriter; request: Request;
  principal: RequestPrincipalBinding; consumed: boolean };
const sourceChannelCatalogBindings = new WeakMap<PartnerAlertSourceChannelCatalogPermit, SourceChannelCatalogBinding>();
const MUTATION_ACTIONS = new Set(["savePartnerDraft", "saveMappingDraft", "removeDraftMapping", "saveOfferVersion",
  "acceptPublishingAgreement", "submitRequest", "proposePublishingAgreement", "confirmInspection", "approveMapping",
  "approveOffer", "approvePartner", "activatePartner", "setPartnerState", "requestChanges", "declinePartner", "withdrawMapping", "withdrawOffer"]);
const RESULT_STATES = new Set(["draft", "awaiting_approval", "setup_required", "active", "publishing_paused",
  "suspended", "ended", "approved", "withdrawn", "proposed", "accepted"]);
class MutationRollback extends Error {
  constructor(readonly result: PartnerAlertWorkflowResult) { super("Partner command rolled back."); }
}

function rejected(): never {
  throw new PartnerAlertValidationError("requestAuthority", "This request could not be authorized.");
}
function headersKey(headers: Headers): string {
  const entries: [string, string][] = [];
  headers.forEach((value, name) => entries.push([name, value]));
  return JSON.stringify(entries);
}
function headersFingerprint(headers: Headers): string {
  return createHash("sha256").update(headersKey(headers)).digest("hex");
}
function tokenDigest(headers: Headers): string {
  const cookie = headers.get("cookie");
  if (!cookie) return rejected();
  const sessionCookieName = platformAuthCookieName(TRADERLINK_PLATFORM_SESSION_COOKIE);
  const values: string[] = [];
  for (const part of cookie.split(";").map(value => value.trim())) {
    const separator = part.indexOf("=");
    const name = separator < 0 ? part : part.slice(0, separator).trim();
    if (name !== sessionCookieName) continue;
    if (!part.startsWith(`${sessionCookieName}=`)) return rejected();
    values.push(part.slice(separator + 1));
  }
  if (values.length !== 1 || !values[0]) return rejected();
  try { return hashPlatformSessionToken(decodeURIComponent(values[0])); }
  catch { return rejected(); }
}

function commandFingerprint(command: PartnerAlertPreparedCommand["command"], configuration: Readonly<{
  outputBotUserId: string; outputConfigurationRef: string;
}>): string {
  const expected = command.expectedRevision;
  let action: string; let payload: unknown;
  switch (command.action) {
    case "savePartnerDraft": action = "partner.draft_saved";
      payload = partnerAlertDraftCommandPayload({ expectedRevision: expected, displayName: command.displayName,
        contentPolicy: command.contentPolicy, outputBotUserId: configuration.outputBotUserId,
        outputConfigurationRef: configuration.outputConfigurationRef }); break;
    case "saveMappingDraft": action = "mapping.draft_saved";
      payload = { expected, mappingId: command.mappingId, sourceChannelId: command.sourceChannelId,
        displayName: command.displayName }; break;
    case "removeDraftMapping": action = "mapping.draft_removed";
      payload = { expected, mappingId: command.mappingId }; break;
    case "saveOfferVersion": action = "offer.version_saved"; payload = { expected, offer: command.offer }; break;
    case "acceptPublishingAgreement": action = "agreement.accepted";
      payload = { expected, agreementId: command.agreementId, rulesVersion: command.rulesVersion,
        acceptsRedistribution: command.acceptsRedistribution }; break;
    case "submitRequest": action = "partner.submitted"; payload = { expected, rulesVersion: command.rulesVersion }; break;
    case "confirmInspection": action = "partner.inspection_confirmed"; payload = { expected }; break;
    case "proposePublishingAgreement": {
      action = "agreement.proposed";
      const terms = parsePartnerAlertPublishingTerms(command.terms);
      const quote = quotePartnerAlertPublishing({ terms,
        contractedChannels: command.contractedChannels,
        capabilities: { currencies: [terms.currency], calendarMonthCadence: true } });
      payload = { expected, terms: command.terms, quote }; break;
    }
    case "approveMapping": action = "mapping.approved";
      payload = { expected, mappingId: command.mappingId, version: command.expectedMappingRevision,
        channelId: command.destinationChannelId, roleId: command.destinationRoleId }; break;
    case "approveOffer": action = "offer.approved";
      payload = { expected, offerId: command.offerId, version: command.offerVersion }; break;
    case "activatePartner": action = "partner.activated"; payload = { expected }; break;
    case "approvePartner": action = "partner.approved"; payload = { expected }; break;
    case "setPartnerState": action = "partner.state_changed";
      payload = { expected, state: command.state, reason: command.reason }; break;
    case "requestChanges": action = "partner.changes_requested"; payload = { expected, reason: command.reason }; break;
    case "declinePartner": action = "partner.declined"; payload = { expected, reason: command.reason }; break;
    case "withdrawMapping": action = "mapping.withdrawn";
      payload = { expected, mappingId: command.mappingId, reason: command.reason }; break;
    case "withdrawOffer": action = "offer.withdrawn";
      payload = { expected, offerId: command.offerId, version: command.offerVersion, reason: command.reason }; break;
  }
  return partnerAlertCommandFingerprint(action, command.communityId, payload);
}

function storedResult(value: string, communityId: string): PartnerAlertWorkflowResult {
  const result = partnerAlertRecord(JSON.parse(value), "storedCommandResult");
  partnerAlertExactKeys(result, ["communityId", "partnerRevision", "resourceId", "resourceVersion", "state"], "storedCommandResult");
  if (result.communityId !== communityId || typeof result.state !== "string" || !RESULT_STATES.has(result.state)) return rejected();
  return Object.freeze({ kind: "applied", result: Object.freeze({
    communityId: partnerAlertId(result.communityId, "communityId"),
    partnerRevision: partnerAlertInteger(result.partnerRevision, "partnerRevision", 1),
    resourceId: partnerAlertId(result.resourceId, "resourceId"),
    resourceVersion: partnerAlertInteger(result.resourceVersion, "resourceVersion", 1),
    state: result.state,
  }) });
}

/** Detach plain synchronous result data before final validation/commit. Never
 * call then(), getters or toJSON(), or serialize an in-process capability. */
function detachedResult<T>(value: T): T {
  const ancestors = new WeakSet<object>(); let nodes = 0;
  const copy = (item: unknown, depth: number): unknown => {
    if (++nodes > 100_000 || depth > 32) return rejected();
    if (item === null || item === undefined || typeof item === "string" || typeof item === "boolean") return item;
    if (typeof item === "number") return Number.isFinite(item) ? item : rejected();
    if (typeof item !== "object" || capabilities.has(item) || ancestors.has(item)) return rejected();
    const array = Array.isArray(item); const prototype = Object.getPrototypeOf(item);
    if ((!array && prototype !== Object.prototype && prototype !== null) || (array && prototype !== Array.prototype)
      || "then" in item) return rejected();
    const descriptors = Object.getOwnPropertyDescriptors(item);
    if (Reflect.ownKeys(descriptors).some(key => typeof key !== "string")) return rejected();
    ancestors.add(item);
    try {
      if (array) {
        if (item.length > 100_000 || Object.keys(descriptors).length !== item.length + 1) return rejected();
        const result: unknown[] = [];
        for (let index = 0; index < item.length; index += 1) {
          const descriptor = descriptors[String(index)];
          if (!descriptor?.enumerable || !("value" in descriptor)) return rejected();
          result.push(copy(descriptor.value, depth + 1));
        }
        return Object.freeze(result);
      }
      const result: Record<string, unknown> = Object.create(null);
      for (const [key, descriptor] of Object.entries(descriptors)) {
        if (!descriptor.enumerable || !("value" in descriptor)) return rejected();
        Object.defineProperty(result, key, { value: copy(descriptor.value, depth + 1), enumerable: true });
      }
      return Object.freeze(result);
    } finally { ancestors.delete(item); }
  };
  return copy(value, 0) as T;
}

function withinScope<T>(state: OwnedRequest, operation: (scope: PartnerAlertPrivateRequestScope) => T): T {
  try {
    state.verify();
    if (!state.scope) return rejected();
    const result = detachedResult(operation(state.scope));
    state.verify();
    return result;
  } catch (error) {
    // Catching a nested/guarded failure cannot turn partial work into a commit.
    state.failed = true;
    throw error;
  }
}

/** Request admission inside the actual Auth-owned transaction/audit frame.
 * Not a runtime binding or Premium/erasure admission issuer. Imports and
 * construction open/query/start nothing.
 * The server supplies its selected application connection/configuration. The
 * callback must not perform network I/O or manually end the owned transaction.
 * HTTP/runtime wiring and schema/config/whole-erasure qualification are separate. */
export class PartnerAlertRequestWriter {
  constructor(private readonly database: Database.Database,
    private readonly configuration: PartnerAlertRequestWriterConfiguration) {}

  run<T>(request: Request, operation: (scope: PartnerAlertPrivateRequestScope) => T): T {
    if (typeof operation !== "function") return rejected();
    return this.withRequest(request, scope => operation(scope), false);
  }

  preauthorizeSourceChannelCatalog(request: Request, communityId: string): PartnerAlertSourceChannelCatalogPermit {
    let principal: RequestPrincipalBinding | null = null;
    const permit = this.withRequest(request, (scope, _execute, _replay, currentPrincipal) => {
      principal = currentPrincipal;
      return scope.authorizeCommunitySourceCatalog(communityId);
    }, false);
    if (!principal) return rejected();
    sourceChannelCatalogBindings.set(permit, { writer: this, request, principal, consumed: false });
    return permit;
  }

  revalidateSourceChannelCatalog(request: Request, permit: PartnerAlertSourceChannelCatalogPermit,
    source?: PartnerAlertDiscordSourceCatalog): void {
    if (source) requirePlatformMutationRequest(request);
    const binding = sourceChannelCatalogBindings.get(permit);
    if (!binding || binding.writer !== this || binding.request !== request || binding.consumed) return rejected();
    binding.consumed = true;
    this.withRequest(request, (scope, _execute, _replay, currentPrincipal) => {
      if (currentPrincipal.userId !== binding.principal.userId
        || currentPrincipal.sessionId !== binding.principal.sessionId
        || currentPrincipal.headersFingerprint !== binding.principal.headersFingerprint
        || currentPrincipal.sessionTokenDigest !== binding.principal.sessionTokenDigest) return rejected();
      const current = scope.authorizeCommunitySourceCatalog(permit.communityId);
      if (current.communityId !== permit.communityId || current.sourceGuildId !== permit.sourceGuildId
        || current.partnerRevision !== permit.partnerRevision) return rejected();
      if (source && current.partnerRevision > 0) {
        requirePlatformErasureWriter(this.database, currentPrincipal.userId);
        refreshPartnerAlertDiscordNames(this.database, current, source);
      }
    }, false);
  }

  /** Authenticated durable idempotency check before any provider work. Exact
   * replays return the original stored outcome; a changed payload conflicts.
   * Missing receipts return null and grant no provider or mutation authority. */
  tryMutationReplay(request: Request, command: PartnerAlertPreparedCommand): PartnerAlertWorkflowResult | null {
    inspectPartnerAlertPreparedCommand(command, request);
    if (!currentPlatformErasureAdmission(this.database)) return rejected();
    return this.withRequest(request, (_scope, _execute, replay) => {
      const result = replay(command);
      if (result && command.target.kind === "operator") {
        consumeJournalAdminRateLimit({ category: "sensitive", environment: this.configuration.environment,
          headers: request.headers, now: this.configuration.now, userId: command.command.communityId });
      }
      return result;
    }, false);
  }

  /** Authenticate and authorize the exact command before any server caller may
   * resolve credentials or perform provider I/O. The returned plain plan grants
   * no mutation authority. It is rate-limited per community/address, bound to
   * the unchanged prepared command, and becomes stale with the partner revision.
   * Actual provider receipts must still be supplied to this writer's synchronous
   * callbacks and rechecked inside executeMutation's admitted transaction. */
  preauthorizeProviderVerification(
    request: Request,
    command: PartnerAlertPreparedCommand,
  ): PartnerAlertProviderVerificationPlan {
    inspectPartnerAlertPreparedCommand(command, request);
    if (!currentPlatformErasureAdmission(this.database)) return rejected();
    const plan = this.run(request, (scope) => {
      const audience = command.target.kind === "operator" ? "owner" : "partner";
      const view = projectPartnerAlertPrivateRead(scope.readPartner(command.command.communityId, audience));
      consumeJournalAdminRateLimit({
        category: "sensitive",
        environment: this.configuration.environment,
        headers: request.headers,
        now: this.configuration.now,
        // The limiter accepts an opaque stable subject. Using the authorized
        // community ID bounds both owner and operator preflights without exposing
        // a session/user identity outside the request frame.
        userId: view.communityId,
      });
      inspectPartnerAlertPreparedCommand(command, request);
      return planPartnerAlertProviderVerification(command, view, this.configuration.destinationGuildId);
    });
    providerPlanBindings.set(plan, { writer: this, request, command, consumed: false });
    return plan;
  }

  /** First approval is the explicit owner configuration event. Draft reads and
   * community-owner saves never initialize a fence or acquire owner authority. */
  private approvePartnerWithContext(repository: PartnerAlertRepository,
    input: Parameters<PartnerAlertRepository["approvePartner"]>[0], configurationRef: string) {
    const database = this.database;
    const context = database.prepare<[string], { configuration_ref: string }>(
      "SELECT configuration_ref FROM partner_alert_context_epochs WHERE community_id=?",
    ).get(input.communityId);
    const hold = (): never => {
      throw new PartnerAlertRepositoryError("unavailable", "Publishing approval is temporarily unavailable.");
    };
    if (context && context.configuration_ref !== configurationRef) return hold();
    if (!context) {
      const partner = database.prepare<[string], {
        status: string; approved_at_utc: string | null; approved_application_revision: number | null;
      }>("SELECT status,approved_at_utc,approved_application_revision FROM partner_alert_partners WHERE community_id=?")
        .get(input.communityId);
      // Absence is not permission to reconstruct a lost generation for a
      // publisher that has already been approved, activated, sold or delivered.
      if (!partner || !["draft", "awaiting_approval"].includes(partner.status)
        || partner.approved_at_utc !== null || partner.approved_application_revision !== null
        || database.prepare(`SELECT 1 FROM partner_alert_audit_events
          WHERE community_id=? AND action IN ('partner.approved','partner.activated') LIMIT 1`).get(input.communityId)
        || database.prepare(`SELECT 1 FROM partner_alert_mappings
          WHERE community_id=? AND (activated_at_utc IS NOT NULL OR delivery_state='ready') LIMIT 1`).get(input.communityId)
        || ["partner_alert_stripe_checkout_claims", "partner_alert_memberships", "partner_alert_role_jobs",
          "partner_alert_source_messages", "partner_alert_deliveries", "partner_alert_mirrored_parts"]
          .some(table => database.prepare(`SELECT 1 FROM ${table} WHERE community_id=? LIMIT 1`).get(input.communityId))) {
        return hold();
      }
    }
    // Existing inspection, revision, resource and offer checks happen BEFORE
    // enrollment. A later failure propagates through the owning Auth/Core frame,
    // rolling back this approval, its command/audit and the context together.
    const result = repository.approvePartner(input);
    if (!context) requirePartnerAlertAdmission(database).onboardCommunity(input.communityId, configurationRef);
    return result;
  }

  /** Existing commands only. A non-applied workflow outcome is
   * thrown THROUGH the real frame first, so no caught failure commits work. */
  executeMutation(request: Request, command: PartnerAlertPreparedCommand, verification?: Readonly<{
    plan: PartnerAlertProviderVerificationPlan;
    facts: PartnerAlertProviderFactSet;
  }>): PartnerAlertWorkflowResult {
    const suppliedFacts = verification?.facts ?? null;
    try {
      let providerCallbacks: Pick<PartnerAlertRequestWriterConfiguration,
        "verifiedResources" | "verifiedWhopOffer" | "verifiedStripeOffer" | "qualifiedPricing"> | undefined;
      if (verification) {
        inspectPartnerAlertPreparedCommand(command, request);
        const binding = providerPlanBindings.get(verification.plan);
        if (!binding || binding.writer !== this || binding.request !== request || binding.command !== command || binding.consumed) return rejected();
        binding.consumed = true;
        const facts = requirePartnerAlertProviderFactSet(verification.facts, verification.plan);
        providerCallbacks = Object.freeze({ verifiedResources: facts.requireResources,
          verifiedWhopOffer: facts.requireWhopOffer, verifiedStripeOffer: facts.requireStripeOffer, qualifiedPricing: facts.pricingCapabilities });
      }
      return this.withRequest(request, (_scope, execute) => execute(command), true, providerCallbacks);
    }
    catch (error) {
      if (error instanceof MutationRollback) return error.result;
      throw error;
    } finally { suppliedFacts?.destroy(); }
  }

  private withRequest<T>(request: Request,
    operation: (scope: PartnerAlertPrivateRequestScope,
      execute: (command: PartnerAlertPreparedCommand) => PartnerAlertWorkflowResult,
      replay: (command: PartnerAlertPreparedCommand) => PartnerAlertWorkflowResult | null,
      principal: RequestPrincipalBinding) => T,
    mutation: boolean,
    providerCallbacks?: Pick<PartnerAlertRequestWriterConfiguration,
      "verifiedResources" | "verifiedWhopOffer" | "verifiedStripeOffer" | "qualifiedPricing">): T {
    const database = this.database;
    const nested = activeConnections.get(database);
    if (nested) {
      if (mutation || nested.mutation || nested.owner !== this || nested.request !== request || !nested.active || !database.open || !database.inTransaction) {
        nested.failed = true; return rejected();
      }
      return withinScope(nested, scope => operation(scope, () => rejected(), () => rejected(), nested.principal));
    }
    // Never adopt somebody else's transaction or initial identity resolution.
    if (!database.open || database.readonly || database.inTransaction || resolvingConnections.has(database)
      || typeof operation !== "function" || request.signal.aborted) return rejected();
    resolvingConnections.add(database);
    const ownership: { current: OwnedRequest | null } = { current: null };
    try {
      const configuration = Object.freeze({ ...this.configuration, ...providerCallbacks,
        environment: Object.freeze({ ...this.configuration.environment }) });
      partnerAlertInteger(configuration.maximumActorAgeMs, "maximumActorAgeMs", 1, 300_000);
      partnerAlertInteger(configuration.maximumDiscordEvidenceAgeMs, "maximumDiscordEvidenceAgeMs", 1, 300_000);
      partnerAlertSnowflake(configuration.destinationGuildId, "destinationGuildId");
      partnerAlertSnowflake(configuration.outputBotUserId, "outputBotUserId");
      partnerAlertRef(configuration.outputConfigurationRef, "outputConfigurationRef");
      const environment = configuration.environment;
      const staging = readPartnerAlertIsolatedStaging(environment);
      if (staging && (configuration.stripeEnvironment !== "sandbox" || configuration.whopEnvironment !== "sandbox")) return rejected();
      const sandboxOrigin = "http://127.0.0.1:3039";
      const requestOrigin = new URL(request.url).origin;
      const sandboxSession = configuration.stripeEnvironment === "sandbox"
        && environment.NODE_ENV === "development" && environment.TRADERLINK_PAID_OWNER_PREVIEW === "1"
        && environment.TRADERLINK_PLATFORM_ALLOW_DEVELOPMENT_SESSIONS === "true"
        && environment.TRADERLINK_PLATFORM_PUBLIC_ORIGIN === sandboxOrigin
        && environment.PARTNER_STRIPE_DISCORD_GUILD_ID === configuration.destinationGuildId
        && request.headers.get("host") === "127.0.0.1:3039"
        && (requestOrigin === sandboxOrigin || requestOrigin === "http://localhost:3039");
      if (typeof configuration.now !== "function" || typeof configuration.createId !== "function"
        || (environment.NODE_ENV !== "production" && !sandboxSession)
        || resolveTraderLinkDiscordGuildId(environment) !== configuration.destinationGuildId) return rejected();
      const originalHeaders = new Headers(request.headers); const originalHeadersKey = headersKey(originalHeaders);
      const digest = tokenDigest(originalHeaders);
      let lastClock = Number.NEGATIVE_INFINITY;
      const clock = (): string => {
        const value = configuration.now(); const epoch = value.getTime();
        if (!Number.isFinite(epoch) || epoch < lastClock) return rejected();
        lastClock = epoch;
        return partnerAlertUtc(value.toISOString(), "nowUtc");
      };
      const startedAtUtc = clock();
      // Preserve the existing authenticated resolver's policy, including optional
      // Discord linking and its selected Journal scope; never trust its result alone.
      const initial = requireTraderLinkPlatformAuthenticatedRequestIdentity(originalHeaders, {
        databasePath: database.name, environment: configuration.environment,
        now: () => new Date(clock()),
      });
      if (initial.mode !== "platform_session" || !initial.sessionId) return rejected();
      const userId = partnerAlertId(initial.scope.userId, "userId");
      const sessionId = partnerAlertId(initial.sessionId, "sessionId");
      const principal = Object.freeze({ userId, sessionId,
        headersFingerprint: headersFingerprint(originalHeaders), sessionTokenDigest: digest });
      const workspaceId = partnerAlertId(initial.scope.workspaceId, "workspaceId");
      if (!["owner", "admin", "member"].includes(initial.scope.workspaceRole)) return rejected();
      const workspaceScope = Object.freeze({ ...initial.scope,
        allowedAccountIds: Object.freeze([...initial.scope.allowedAccountIds]) });
      // A caller/clock/resolver must not have started a transaction behind us.
      if (!database.open || database.inTransaction || request.signal.aborted
        || headersKey(request.headers) !== originalHeadersKey) return rejected();

      const admin = new PlatformAdminAuthorization(database, configuration.environment, () => new Date(clock()));
      const admission = currentPlatformErasureAdmission(database);
      if ((mutation || hasPlatformErasureModules(database)) && !admission) return rejected();
      const withFrame: typeof admin.withRequestAuditFrame = admission
        ? (currentRequest, callback) => admission.withRequestAuditFrame(currentRequest, configuration.environment, callback)
        : (currentRequest, callback) => admin.withRequestAuditFrame(currentRequest, callback);
      return withFrame(request, frame => {
        const sessions = new PlatformSessionRepository(database);
        const identities = new PlatformAuthenticationRepository(database);
        const workspaces = new PlatformWorkspaceRepository(database);
        const discord = new PlatformDiscordMembershipRepository(database);
        let baseline: string | null = null;
        let identity: TraderLinkPlatformRequestIdentity | null = null;
        const operatorScopes: OperatorAuthorizationScope[] = [];
        let mutationOperatorScope: OperatorAuthorizationScope | null = null;
        let revalidationScope: OperatorAuthorizationScope | null = null;
        const communityOwners = new Set<string>();
        const assertOwned = (): void => {
          if (!state.active || state.failed || activeConnections.get(database) !== state
            || !database.open || !database.inTransaction || request.signal.aborted
            || headersKey(request.headers) !== originalHeadersKey) return rejected();
        };
        const verify = (): string => {
          assertOwned();
          if (staging && readPartnerAlertIsolatedStaging(environment)?.fingerprint !== staging.fingerprint) return rejected();
          const at = clock();
          if (Date.parse(at) - Date.parse(startedAtUtc) >= configuration.maximumActorAgeMs
            || tokenDigest(request.headers) !== digest) return rejected();
          // Actual repository joins the session's login identity AND active user.
          const session = sessions.findActiveByTokenDigest(digest, at);
          // Provider parity with selected canonical resolver e845c229..., not the
          // older preserved Discord-only resolver. No new login policy is inferred.
          if (!session || session.userId !== userId || session.sessionId !== sessionId
            || !["discord", "google", "email"].includes(session.authProvider)
            || session.revokedAtUtc !== null || partnerAlertUtc(session.createdAtUtc, "sessionCreatedAtUtc") > at
            || partnerAlertUtc(session.lastSeenAtUtc, "sessionLastSeenAtUtc") > at
            || partnerAlertUtc(session.expiresAtUtc, "sessionExpiresAtUtc") <= at) return rejected();
          const login = database.prepare<[string, string], { auth_subject: string }>(
            "SELECT auth_subject FROM platform_auth_sessions WHERE session_id=? AND user_id=?").get(sessionId, userId);
          const activeIdentity = login ? identities.findActiveIdentity(session.authProvider, login.auth_subject) : null;
          if (!activeIdentity || activeIdentity.userId !== userId || activeIdentity.status !== "active") return rejected();
          const memberships = workspaces.listActiveMembershipsForUser(userId);
          const membership = workspaces.findActiveMembership(workspaceId, userId);
          if (memberships.length !== 1 || !membership || membership.status !== "active"
            || membership.role !== workspaceScope.workspaceRole || memberships[0]?.workspaceId !== workspaceId
            || memberships[0]?.role !== membership.role) return rejected();
          const workspace = database.prepare<[string], { status: string; created_at_utc: string; updated_at_utc: string }>(
            "SELECT status,created_at_utc,updated_at_utc FROM platform_workspaces WHERE workspace_id=?").get(workspaceId);
          if (workspace?.status !== "active") return rejected();
          // The authenticated resolver allows a Google/email login with no Discord
          // link. Rehydrate its optional Discord component on THIS connection.
          const links = database.prepare<[string], { auth_subject: string; created_at_utc: string; updated_at_utc: string }>(
            `SELECT auth_subject,created_at_utc,updated_at_utc FROM platform_auth_identities
             WHERE user_id=? AND auth_provider='discord' AND status='active' ORDER BY auth_subject`).all(userId);
          const discordMembership = links.length ? discord.findCurrent(userId, configuration.destinationGuildId) : null;
          const facts = JSON.stringify([session, login!.auth_subject, activeIdentity, membership, workspace, links, discordMembership]);
          if (baseline !== null && baseline !== facts) return rejected();
          baseline = facts;
          if (!identity) identity = Object.freeze({ mode: "platform_session", sessionId,
            scope: workspaceScope, displayName: session.displayName,
            discord: discordMembership ? Object.freeze({ guildOwner: discordMembership.guildOwner,
              roleIds: Object.freeze([...discordMembership.roleIds]) }) : null });
          const finished = clock();
          if (finished >= session.expiresAtUtc
            || Date.parse(finished) - Date.parse(startedAtUtc) >= configuration.maximumActorAgeMs) return rejected();
          assertOwned(); return finished;
        };
        const state: OwnedRequest = { owner: this, request, active: true, failed: false, mutation,
          scope: null, principal, verify };
        ownership.current = state;
        activeConnections.set(database, state);
        try {
          verify();
          if (admission) {
            admission.attachRequestPrincipal(identity!, verify);
            admission.assertCurrent(userId);
          }
          const identityOptions = Object.freeze({ environment: configuration.environment, databasePath: database.name,
            now: () => new Date(verify()) });
          const authority = PartnerAlertPlatformAuthority.forRequest(request, {
            // This resolver is bound to the actual live in-process admission above,
            // not an injected caller-supplied identity or a new permission issuer.
            resolveIdentity: headers => {
              verify();
              if (headersKey(headers) !== originalHeadersKey || !identity) return rejected();
              return identity;
            },
            identityOptions,
            admin: { authorize: (currentIdentity: TraderLinkPlatformRequestIdentity, headers: Headers) => {
              verify();
              if (currentIdentity !== identity || headersKey(headers) !== originalHeadersKey) return rejected();
              // One authorization for the logical mutation; every later check
              // reuses that genuine original scope without renewing time/rate.
              // Reads preserve their existing separate-attempt behavior.
              const original = revalidationScope ?? (mutation ? mutationOperatorScope : null);
              const scope = original === null ? frame.authorize(currentIdentity, headers)
                : frame.revalidate(original, currentIdentity, headers);
              verify();
              if (original === null) {
                operatorScopes.push(scope);
                if (mutation) mutationOperatorScope = scope;
              }
              if (admission) admission.retainOwnerScope(scope);
              return scope;
            } },
            communities: new TraderLinkCommunityRepository(database), discordMemberships: discord,
            nowUtc: verify, maximumActorAgeMs: configuration.maximumActorAgeMs,
            maximumDiscordEvidenceAgeMs: configuration.maximumDiscordEvidenceAgeMs,
            destinationGuildId: configuration.destinationGuildId,
            verifiedResources: configuration.verifiedResources,
            verifiedWhopOffer: configuration.verifiedWhopOffer,
            verifiedStripeOffer: configuration.verifiedStripeOffer,
            qualifiedPricing: configuration.qualifiedPricing,
          });
          const repository = new PartnerAlertRepository(database, authority, {
            destinationGuildId: configuration.destinationGuildId, nowUtc: verify, createId: configuration.createId,
            subscriberAccessQualified: configuration.subscriberAccessQualified,
            stripeEnvironment: configuration.stripeEnvironment,
          });
          const guarded = <R>(read: () => R): R => {
            try {
              verify();
              if (!state.scope) return rejected();
              const result = read(); verify(); return result;
            }
            catch (error) { state.failed = true; throw error; }
          };
          const scope: PartnerAlertPrivateRequestScope = Object.freeze({
            readPartner: (communityId: string, audience: "owner" | "partner") => guarded(() => {
              const result = repository.readPartner(communityId, audience);
              if (audience === "partner") communityOwners.add(communityId);
              return result;
            }),
            readDeliveryActivity: (communityId, audience, messageId) => guarded(() => {
              const result = repository.readDeliveryActivity(communityId, audience, messageId);
              if (audience === "partner") communityOwners.add(communityId);
              return result;
            }),
            readRoleReviewAssignment: review => guarded(() => repository.readRoleReviewAssignment(review)),
            recordRoleReview: (review, assignment, operationId, phase) => guarded(() => {
              requireJournalAdminMutationRequest(request);
              repository.recordRoleReview(review, assignment, operationId, phase);
            }),
            reviewStripeAdjustment: (communityId, eventId, decision) => guarded(() => {
              requireJournalAdminMutationRequest(request);
              const actor = authority.requireOperator();
              const core = requirePlatformErasureWriter(database, actor.userId);
              core.requirePlatformOwner();
              partnerAlertId(communityId, "communityId");
              const stripeEnvironment = configuration.stripeEnvironment;
              if (!stripeEnvironment) return rejected();
              const matches = database.prepare(`SELECT e.stripe_account_id,c.buyer_user_id,p.owner_user_id
                FROM partner_alert_stripe_events e JOIN partner_alert_stripe_checkout_claims c ON c.claim_id=e.claim_id
                JOIN partner_alert_partners p ON p.community_id=e.community_id
                WHERE e.environment=? AND e.community_id=? AND e.event_id=? LIMIT 2`)
                .all(stripeEnvironment, communityId, eventId) as { stripe_account_id: string; buyer_user_id: string; owner_user_id: string }[];
              const event = matches[0];
              if (!event || matches.length !== 1) return rejected();
              core.assertLivePrincipal(event.buyer_user_id);
              core.assertLivePrincipal(event.owner_user_id);
              return recordPartnerAlertStripeAdjustmentReview(database, { environment: stripeEnvironment, accountId: event.stripe_account_id,
                eventId, decision, reviewerUserId: actor.userId, atMs: Date.parse(verify()) });
            }),
            listRoleReviewEvents: (limit?: number) => guarded(() => repository.listRoleReviewEvents(limit)),
            listReviewRequests: (limit?: number) => guarded(() => {
              return repository.listReviewRequests(limit);
            }),
            authorizeCommunitySourceCatalog: (communityId: string) => guarded(() => {
              const actor = authority.requireCommunityOwner(communityId);
              const partner = database.prepare<[string], { source_guild_id: string; revision: number }>(
                "SELECT source_guild_id, revision FROM partner_alert_partners WHERE community_id=?",
              ).get(actor.communityId);
              communityOwners.add(actor.communityId);
              if (partner && partner.source_guild_id !== actor.guildId) return rejected();
              return Object.freeze({ communityId: actor.communityId, sourceGuildId: actor.guildId, ownerUserId: actor.userId,
                partnerRevision: partner?.revision ?? 0 });
            }),
            authorizeSubscriberOffer: (communityId: string, offerKey: string, includeExistingPurchase = false) => guarded(() => {
              const member = authority.requireSignedInUser();
              const selectedCommunityId = partnerAlertId(communityId, "communityId");
              const [offerId, versionText, extra] = offerKey.split(":");
              const offerVersion = Number(versionText);
              if (extra !== undefined || !offerId || !Number.isSafeInteger(offerVersion) || offerVersion < 1) return rejected();
              partnerAlertId(offerId, "offerId");
              const stripeEnvironment = configuration.stripeEnvironment;
              const whopEnvironment = configuration.whopEnvironment ?? "live";
              const ownedPurchase = includeExistingPurchase
                ? `((o.whop_environment=@whopEnvironment AND ${partnerAlertWhopPurchaseSql}) OR ${stripeEnvironment ? partnerAlertStripePurchaseSql : "0"})`
                : "0";
              const row = database.prepare(`SELECT o.offer_json, ${partnerAlertOfferSaleStateSql} AS sale_state, ${ownedPurchase} AS has_purchase
                FROM partner_alert_partners p JOIN partner_alert_offers o ON o.community_id=p.community_id
                WHERE p.community_id=@communityId AND o.offer_id=@offerId AND o.version=@offerVersion
                  AND o.review_state='approved' AND (o.whop_environment=@whopEnvironment OR o.whop_environment IS NULL)`)
                .get({ communityId: selectedCommunityId, offerId, offerVersion, buyerUserId: member.userId,
                  environment: stripeEnvironment ?? null, whopEnvironment }) as
                  { offer_json: string; sale_state: "open" | PartnerAlertCatalogSaleState; has_purchase: number } | undefined;
              if (!row || (row.sale_state !== "open" && !(row.has_purchase === 1
                && (row.sale_state === "paused" || row.sale_state === "previous")))) return rejected();
              const offer = parsePartnerAlertCheckoutOffer(JSON.parse(row.offer_json));
              if (offer.communityId !== selectedCommunityId || offer.offerId !== offerId
                || offer.version !== offerVersion || ("whop" in offer && offer.whop.environment !== whopEnvironment)) return rejected();
              return Object.freeze({ userId: member.userId, communityId: selectedCommunityId, offerId, offerVersion,
                mappingIds: offer.mappingIds });
            }),
          });
          capabilities.add(scope); state.scope = scope;
          const replay = (command: PartnerAlertPreparedCommand): PartnerAlertWorkflowResult | null => guarded(() => {
            inspectPartnerAlertPreparedCommand(command, request);
            const actor = command.target.kind === "operator" ? authority.requireOperator()
              : authority.requireCommunityOwner(command.target.communityId);
            if (command.target.kind === "community_owner") communityOwners.add(command.target.communityId);
            if (actor.userId !== userId || command.command.communityId !== (command.target.kind === "community_owner"
              ? command.target.communityId : command.command.communityId)) return rejected();
            const row = database.prepare<[string, string], { community_id: string; fingerprint_json: string; result_json: string }>(
              `SELECT community_id,fingerprint_json,result_json FROM partner_alert_commands
               WHERE actor_user_id=? AND request_id=?`).get(actor.userId, command.requestId);
            if (!row) return null;
            if (row.community_id !== command.command.communityId
              || row.fingerprint_json !== commandFingerprint(command.command, configuration)) return Object.freeze({ kind: "conflict" as const });
            return storedResult(row.result_json, command.command.communityId);
          });
          let mutationCalled = false;
          const execute = (command: PartnerAlertPreparedCommand): PartnerAlertWorkflowResult => guarded(() => {
            if (!mutation || mutationCalled || !admission) return rejected();
            mutationCalled = true;
            return withPartnerAlertVerifiedCommand(command, request, database, authority,
              configuration.environment, () => new Date(verify()), receipt => {
                if (!MUTATION_ACTIONS.has(receipt.command.action)) {
                  throw new MutationRollback(Object.freeze({ kind: "unavailable" }));
                }
                if (receipt.target.kind === "community_owner") communityOwners.add(receipt.target.communityId);
                let entered = false;
                // Explicit repository surface: no browser-selected method, native
                // callback or repository/authority capability leaves this frame.
                const commands = Object.freeze<PartnerAlertWorkflowRepository>({
                  savePartnerDraft: input => guarded(() => repository.savePartnerDraft({ ...input,
                    outputBotUserId: configuration.outputBotUserId,
                    outputConfigurationRef: configuration.outputConfigurationRef })),
                  saveMappingDraft: input => guarded(() => repository.saveMappingDraft(input)),
                  removeDraftMapping: input => guarded(() => repository.removeDraftMapping(input)),
                  saveOfferVersion: input => guarded(() => repository.saveOfferVersion(input)),
                  acceptPublishingAgreement: input => guarded(() => repository.acceptPublishingAgreement(input)),
                  submitRequest: input => guarded(() => repository.submitRequest(input)),
                  proposePublishingAgreement: input => guarded(() => repository.proposePublishingAgreement(input)),
                  confirmInspection: input => guarded(() => repository.confirmInspection(input)),
                  approveMapping: input => guarded(() => repository.approveMapping(input)),
                  approveOffer: input => guarded(() => repository.approveOffer(input)),
                  activatePartner: input => guarded(() => repository.activatePartner(input)),
                  approvePartner: input => guarded(() => this.approvePartnerWithContext(repository, input,
                    configuration.outputConfigurationRef)),
                  setPartnerState: input => guarded(() => repository.setPartnerState(input)),
                  requestChanges: input => guarded(() => repository.requestChanges(input)),
                  declinePartner: input => guarded(() => repository.declinePartner(input)),
                  withdrawMapping: input => guarded(() => repository.withdrawMapping(input)),
                  withdrawOffer: input => guarded(() => repository.withdrawOffer(input)),
                });
                capabilities.add(commands);
                const workflow = new PartnerAlertWorkflow({ enabled: true }, {
                  withinAdmittedWriter: (workflowScope, apply) => {
                    try {
                      verify(); admission.assertCurrent(userId); requirePartnerAlertVerifiedCommand(receipt);
                      if (entered || workflowScope.receipt !== receipt || workflowScope.receipt.authority !== authority
                        || workflowScope.command.action !== receipt.command.action
                        || workflowScope.command.communityId !== receipt.command.communityId) return rejected();
                      entered = true;
                      let current = true;
                      const isCurrent = (): boolean => {
                        if (!current) return rejected();
                        verify(); admission.assertCurrent(userId); requirePartnerAlertVerifiedCommand(receipt);
                        return true;
                      };
                      try {
                        const permit = Object.freeze({ scope: workflowScope, authority, repository: commands, isCurrent });
                        capabilities.add(permit);
                        // Preserve workflow's exact projected-result identity.
                        const written = apply(permit); isCurrent(); return written;
                      } finally { current = false; }
                    } catch (error) { state.failed = true; throw error; }
                  },
                });
                const written = workflow.execute(receipt);
                if (written.kind !== "applied") throw new MutationRollback(written);
                if (!entered) return rejected();
                verify(); admission.assertCurrent(userId);
                return written;
              });
          });
          const result = withinScope(state, current => operation(current, execute, replay, principal));
          if (mutation && !mutationCalled) return rejected();
          // Close read handles before final validation. Keep the ORIGINAL Partner
          // authority and Auth scopes so none of their timestamps are renewed.
          state.scope = null;
          for (const originalScope of operatorScopes) {
            revalidationScope = originalScope;
            const actor = authority.requireOperator();
            if (actor.validUntilUtc <= verify()) return rejected();
          }
          revalidationScope = null;
          for (const communityId of communityOwners) {
            const actor = authority.requireCommunityOwner(communityId);
            if (actor.validUntilUtc <= verify()) return rejected();
          }
          verify();
          return result;
        } finally { state.scope = null; }
      });
    } finally {
      // Core and Auth still invoke retained verification after our callback;
      // close ownership only AFTER their final validation/audit/commit completes.
      const owned = ownership.current;
      if (owned) {
        owned.active = false; owned.scope = null;
        if (activeConnections.get(database) === owned) activeConnections.delete(database);
      }
      resolvingConnections.delete(database);
    }
  }
}
