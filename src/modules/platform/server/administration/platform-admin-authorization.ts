import { createHash, randomUUID } from "node:crypto";
import type Database from "better-sqlite3";

import {
  JOURNAL_ADMIN_PERMISSIONS,
  type JournalAdminScope,
} from "../../contracts/journal-admin-scope";
import {
  requireTraderLinkPlatformAuthenticatedRequestIdentity,
  type TraderLinkPlatformRequestIdentity,
} from "../authentication/require-platform-request-scope";
import { PlatformDiscordMembershipRepository } from "../authentication/platform-discord-membership-repository";
import {
  readProtectedInitialOwnerDiscordSubject,
  resolveTraderLinkDiscordGuildId,
} from "../authentication/platform-discord-configuration";
import { validateDevelopmentDashboardRequest } from "../authentication/development-dashboard-network-boundary";
import { withPlatformDatabase } from "../database/open-platform-database";
import {
  createCanonicalUtcTimestamp,
  platformFailure,
} from "../database/platform-migration-contract";
import { PlatformAdminAuditRepository } from "./platform-admin-audit-repository";
import { consumeJournalAdminRateLimit } from "./platform-admin-request-security";
import { PlatformOperatorRepository } from "./platform-operator-repository";

function digest(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function requestCorrelationDigest(requestHeaders: Headers): string {
  const supplied = requestHeaders.get("x-request-id");
  const value = supplied && supplied.length <= 200 &&
    !/[\u0000-\u001f\u007f]/u.test(supplied)
    ? supplied
    : randomUUID();
  return digest(`traderlink-admin-request-v1\u001f${value}`);
}

function hasConfiguredDiscordOwnerIdentity(input: Readonly<{
  database: Database.Database;
  userId: string;
  ownerDiscordSubject: string | undefined;
}>): boolean {
  if (!input.ownerDiscordSubject) return false;
  return input.database.prepare<
    [string, string],
    Readonly<{ matches: 0 | 1 }>
  >(`SELECT EXISTS(
SELECT 1
FROM platform_auth_identities
WHERE user_id = ?
  AND auth_provider = 'discord'
  AND auth_subject = ?
) AS matches`).get(
    input.userId,
    input.ownerDiscordSubject,
  )?.matches === 1;
}

type AdminAccessAudit = Parameters<PlatformAdminAuditRepository["append"]>[0];
type AllowedAdminPolicy = Readonly<{
  kind: "allowed";
  role: JournalAdminScope["role"];
  mode: JournalAdminScope["mode"];
  discordOwnerVerifiedAtUtc: string | null;
  reasonCode: string;
  binding: string;
}>;
type AdminPolicy = AllowedAdminPolicy | Readonly<{ kind: "denied"; reasonCode: string }>;

function deniedAuditInput(input: Readonly<{
  identity: TraderLinkPlatformRequestIdentity;
  correlationRefSha256: string;
  nowUtc: string;
  reasonCode: string;
}>): AdminAccessAudit {
  return {
    actorKind: "platform_user",
    actorUserId: input.identity.scope.userId,
    actorRole: "authenticated_user",
    action: "admin_access_denied",
    targetKind: "authority",
    targetRefSha256: digest("journal_administration"),
    outcome: "denied",
    reasonCode: input.reasonCode,
    correlationRefSha256: input.correlationRefSha256,
    previewReceiptSha256: null,
    details: Object.freeze({ boundary: "journal_administration" }),
    createdAtUtc: input.nowUtc,
  };
}

function deny(input: Readonly<{
  audit: PlatformAdminAuditRepository;
  identity: TraderLinkPlatformRequestIdentity;
  correlationRefSha256: string;
  nowUtc: string;
  reasonCode: string;
}>): never {
  input.audit.append(deniedAuditInput(input));
  platformFailure("TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED");
}

function allowedAuditInput(input: Readonly<{
  identity: TraderLinkPlatformRequestIdentity;
  policy: AllowedAdminPolicy;
  correlationRefSha256: string;
  nowUtc: string;
}>): AdminAccessAudit {
  return {
    actorKind: "platform_user",
    actorUserId: input.identity.scope.userId,
    actorRole: input.policy.role,
    action: "admin_access_allowed",
    targetKind: "authority",
    targetRefSha256: digest("journal_administration"),
    outcome: "success",
    reasonCode: input.policy.reasonCode,
    correlationRefSha256: input.correlationRefSha256,
    previewReceiptSha256: null,
    details: Object.freeze({ mode: input.policy.mode }),
    createdAtUtc: input.nowUtc,
  };
}

function scopeForPolicy(identity: TraderLinkPlatformRequestIdentity,
  policy: AllowedAdminPolicy, nowUtc: string): JournalAdminScope {
  return Object.freeze({
    userId: identity.scope.userId,
    role: policy.role,
    mode: policy.mode,
    authorizedAtUtc: nowUtc,
    discordOwnerVerifiedAtUtc: policy.discordOwnerVerifiedAtUtc,
    permissions: JOURNAL_ADMIN_PERMISSIONS,
  });
}

/** One implementation of the EXISTING policy. No rate/audit effect here.
 * Keep query/branch order and the configured-owner helper unchanged. */
function readAdminPolicy(database: Database.Database, environment: NodeJS.ProcessEnv,
  identity: TraderLinkPlatformRequestIdentity, requestHeaders: Headers): AdminPolicy {
  if (identity.mode === "local_development") {
    if (!validateDevelopmentDashboardRequest(requestHeaders, environment).ok) {
      return { kind: "denied", reasonCode: "development_boundary_invalid" };
    }
    return { kind: "allowed", role: "development_journal_owner_admin", mode: "local_development_owner",
      discordOwnerVerifiedAtUtc: null, reasonCode: "development_loopback_authorized", binding: "local_development" };
  }
  const membership = new PlatformDiscordMembershipRepository(database).findCurrent(
    identity.scope.userId, resolveTraderLinkDiscordGuildId(environment));
  const activeGrant = new PlatformOperatorRepository(database).findActive();
  const ownerDiscordSubject = readProtectedInitialOwnerDiscordSubject(environment);
  const configuredOwnerMatched = hasConfiguredDiscordOwnerIdentity({ database,
    userId: identity.scope.userId, ownerDiscordSubject });
  const discordServerOwnerMatched = identity.discord?.guildOwner === true && membership?.guildOwner === true;
  if (!membership || !activeGrant || activeGrant.userId !== identity.scope.userId
    || (!configuredOwnerMatched && !discordServerOwnerMatched)) {
    return { kind: "denied", reasonCode: !activeGrant ? "active_operator_grant_missing" : "owner_admin_authorization_failed" };
  }
  return { kind: "allowed", role: "journal_owner_admin", mode: "production_discord_owner",
    discordOwnerVerifiedAtUtc: membership.lastVerifiedAtUtc, reasonCode: "discord_owner_and_grant_confirmed",
    binding: JSON.stringify([membership, activeGrant, ownerDiscordSubject ?? null,
      configuredOwnerMatched, discordServerOwnerMatched]) };
}

export type PlatformAdminRequestFrame = Readonly<{
  /** One real rate charge and actual policy decision per logical access attempt. */
  authorize: PlatformAdminAuthorization["authorize"];
  /** Only an original scope issued in THIS active frame is accepted. No renewal. */
  revalidate: (scope: JournalAdminScope, identity: TraderLinkPlatformRequestIdentity,
    requestHeaders: Headers) => JournalAdminScope;
}>;

type RequestFrameState = { active: boolean; failed: boolean; error: unknown };
const activeAuditFrames = new WeakMap<Database.Database, RequestFrameState>();
const frameCapabilities = new WeakSet<object>();

function frameFailure(): never {
  platformFailure("TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED");
}
function headersBinding(headers: Headers): string {
  const entries: [string, string][] = [];
  headers.forEach((value, name) => entries.push([name, value]));
  return JSON.stringify(entries);
}
function environmentBinding(environment: NodeJS.ProcessEnv): string {
  return JSON.stringify(Object.keys(environment).sort().map(key => [key, environment[key]]));
}
function snapshotIdentity(identity: TraderLinkPlatformRequestIdentity): TraderLinkPlatformRequestIdentity {
  return Object.freeze({ mode: identity.mode, sessionId: identity.sessionId,
    scope: Object.freeze({ ...identity.scope, allowedAccountIds: Object.freeze([...identity.scope.allowedAccountIds]) }),
    displayName: identity.displayName,
    discord: identity.discord ? Object.freeze({ guildOwner: identity.discord.guildOwner,
      roleIds: Object.freeze([...identity.discord.roleIds]) }) : null });
}
/** Plain DTOs only. No then/getter/toJSON invocation or capability serialization. */
function detachFrameResult<T>(value: T): T {
  const ancestors = new WeakSet<object>(); let nodes = 0;
  const copy = (item: unknown, depth: number): unknown => {
    if (++nodes > 100_000 || depth > 32) return frameFailure();
    if (item === null || item === undefined || typeof item === "string" || typeof item === "boolean") return item;
    if (typeof item === "number") return Number.isFinite(item) ? item : frameFailure();
    if (typeof item !== "object" || frameCapabilities.has(item) || ancestors.has(item)) return frameFailure();
    const array = Array.isArray(item); const prototype = Object.getPrototypeOf(item);
    if ((!array && prototype !== Object.prototype && prototype !== null)
      || (array && prototype !== Array.prototype) || "then" in item) return frameFailure();
    const descriptors = Object.getOwnPropertyDescriptors(item);
    if (Reflect.ownKeys(descriptors).some(key => typeof key !== "string")) return frameFailure();
    ancestors.add(item);
    try {
      if (array) {
        if (item.length > 100_000 || Object.keys(descriptors).length !== item.length + 1) return frameFailure();
        const output: unknown[] = [];
        for (let index = 0; index < item.length; index += 1) {
          const descriptor = descriptors[String(index)];
          if (!descriptor?.enumerable || !("value" in descriptor)) return frameFailure();
          output.push(copy(descriptor.value, depth + 1));
        }
        return Object.freeze(output);
      }
      const output: Record<string, unknown> = Object.create(null);
      for (const [key, descriptor] of Object.entries(descriptors)) {
        if (!descriptor.enumerable || !("value" in descriptor)) return frameFailure();
        Object.defineProperty(output, key, { value: copy(descriptor.value, depth + 1), enumerable: true });
      }
      return Object.freeze(output);
    } finally { ancestors.delete(item); }
  };
  return copy(value, 0) as T;
}

export class PlatformAdminAuthorization {
  constructor(
    private readonly database: Database.Database,
    private readonly environment: NodeJS.ProcessEnv = process.env,
    private readonly now: () => Date = () => new Date(),
  ) {}

  authorize(
    identity: TraderLinkPlatformRequestIdentity,
    requestHeaders: Headers,
  ): JournalAdminScope {
    const now = this.now();
    const nowUtc = createCanonicalUtcTimestamp(now);
    const correlationRefSha256 = requestCorrelationDigest(requestHeaders);
    const audit = new PlatformAdminAuditRepository(this.database);
    consumeJournalAdminRateLimit({
      category: "access",
      environment: this.environment,
      headers: requestHeaders,
      now: this.now,
      userId: identity.scope.userId,
    });
    const policy = readAdminPolicy(this.database, this.environment, identity, requestHeaders);
    if (policy.kind === "denied") {
      deny({ audit, identity, correlationRefSha256, nowUtc, reasonCode: policy.reasonCode });
    }
    audit.append(allowedAuditInput({ identity, policy, correlationRefSha256, nowUtc }));
    return scopeForPolicy(identity, policy, nowUtc);
  }

  /** Additive, synchronous outer frame on the SAME caller-owned connection.
   * Reject existing transactions. Protected work is isolated in a savepoint;
   * only real Auth decision audits survive its rollback. This is NOT session/
   * erasure/schema admission. The caller must supply its actual request checks.
   * No network I/O or manual transaction control is permitted in the callback. */
  withRequestAuditFrame<T>(request: Request, operation: (frame: PlatformAdminRequestFrame) => T): T {
    const database = this.database;
    if (!database.open || database.readonly || database.inTransaction || activeAuditFrames.has(database)
      || request.signal.aborted || typeof operation !== "function") return frameFailure();
    const originalHeaders = new Headers(request.headers);
    const requestBinding = headersBinding(originalHeaders);
    const originalEnvironment = environmentBinding(this.environment);
    type Attempt = { identity: TraderLinkPlatformRequestIdentity; identityBinding: string; policy: AllowedAdminPolicy;
      scope: JournalAdminScope; correlationRefSha256: string };
    type Outcome = { kind: "success"; value: T } | { kind: "failure"; error: unknown };
    const execute = database.transaction((): Outcome => {
      const state: RequestFrameState = { active: true, failed: false, error: undefined };
      const attempts = new Map<JournalAdminScope, Attempt>();
      const audits: AdminAccessAudit[] = [];
      let principalBinding: string | null = null;
      const assertActive = (): void => {
        if (!state.active || activeAuditFrames.get(database) !== state
          || !database.open || !database.inTransaction || request.signal.aborted
          || headersBinding(request.headers) !== requestBinding
          || environmentBinding(this.environment) !== originalEnvironment) return frameFailure();
        if (state.failed) throw state.error;
      };
      const guarded = <R>(action: () => R): R => {
        try { assertActive(); const result = action(); assertActive(); return result; }
        catch (error) {
          if (!state.failed) { state.failed = true; state.error = error; }
          throw error;
        }
      };
      const requireInput = (identity: TraderLinkPlatformRequestIdentity, headers: Headers) => {
        if (headersBinding(headers) !== requestBinding) return frameFailure();
        const snapshot = snapshotIdentity(identity); const binding = JSON.stringify(snapshot);
        if (principalBinding !== null && principalBinding !== binding) return frameFailure();
        principalBinding = binding;
        return { snapshot, binding };
      };
      activeAuditFrames.set(database, state);
      let outcome: Outcome;
      let workStarted = false;
      try {
        database.exec("SAVEPOINT platform_admin_request_work");
        workStarted = true;
        const revalidate = (scope: JournalAdminScope, identity: TraderLinkPlatformRequestIdentity,
          headers: Headers): JournalAdminScope => guarded(() => {
          const attempt = attempts.get(scope);
          const input = requireInput(identity, headers);
          if (!attempt || attempt.identityBinding !== input.binding) return frameFailure();
          const policy = readAdminPolicy(database, this.environment, input.snapshot, originalHeaders);
          if (policy.kind === "denied") {
            audits.push(deniedAuditInput({ identity: input.snapshot, reasonCode: policy.reasonCode,
              nowUtc: createCanonicalUtcTimestamp(this.now()), correlationRefSha256: attempt.correlationRefSha256 }));
            platformFailure("TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED");
          }
          if (policy.binding !== attempt.policy.binding || policy.role !== attempt.policy.role
            || policy.mode !== attempt.policy.mode) return frameFailure();
          // Same genuine original scope/time: no rate charge, allow event or renewal.
          return attempt.scope;
        });
        const frame: PlatformAdminRequestFrame = Object.freeze({
          authorize: (identity: TraderLinkPlatformRequestIdentity, headers: Headers): JournalAdminScope => guarded(() => {
            const input = requireInput(identity, headers);
            const nowUtc = createCanonicalUtcTimestamp(this.now());
            const correlationRefSha256 = requestCorrelationDigest(originalHeaders);
            consumeJournalAdminRateLimit({ category: "access", environment: this.environment,
              headers: originalHeaders, now: this.now, userId: input.snapshot.scope.userId });
            const policy = readAdminPolicy(database, this.environment, input.snapshot, originalHeaders);
            if (policy.kind === "denied") {
              audits.push(deniedAuditInput({ identity: input.snapshot, reasonCode: policy.reasonCode,
                nowUtc, correlationRefSha256 }));
              platformFailure("TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED");
            }
            const scope = scopeForPolicy(input.snapshot, policy, nowUtc);
            attempts.set(scope, { identity: input.snapshot, identityBinding: input.binding,
              policy, scope, correlationRefSha256 });
            frameCapabilities.add(scope);
            audits.push(allowedAuditInput({ identity: input.snapshot, policy, nowUtc, correlationRefSha256 }));
            return scope;
          }),
          revalidate,
        });
        frameCapabilities.add(frame);
        const value = detachFrameResult(operation(frame));
        assertActive();
        for (const attempt of attempts.values()) {
          revalidate(attempt.scope, attempt.identity, originalHeaders);
        }
        assertActive();
        database.exec("RELEASE SAVEPOINT platform_admin_request_work");
        workStarted = false;
        outcome = { kind: "success", value };
      } catch (error) {
        // This must succeed before any audit-only commit is possible.
        if (workStarted) {
          database.exec("ROLLBACK TO SAVEPOINT platform_admin_request_work");
          database.exec("RELEASE SAVEPOINT platform_admin_request_work");
          workStarted = false;
        } else {
          throw error;
        }
        outcome = { kind: "failure", error: state.failed ? state.error : error };
      } finally {
        state.active = false;
        attempts.clear();
        if (activeAuditFrames.get(database) === state) activeAuditFrames.delete(database);
      }
      // No caller callback or replay API can add/replace these private effects.
      // A failure here aborts the outer transaction, including successful work.
      const audit = new PlatformAdminAuditRepository(database);
      for (const input of audits) audit.append(input);
      return outcome;
    });
    const outcome = execute.immediate();
    if (outcome.kind === "failure") throw outcome.error;
    return outcome.value;
  }
}

export function requireJournalAdminScope(
  requestHeaders: Headers,
  options: Readonly<{
    environment?: NodeJS.ProcessEnv;
    databasePath?: string;
    forbiddenRepositoryRoots?: readonly string[];
    now?: () => Date;
  }> = {},
): JournalAdminScope {
  return withJournalAdminDatabase(
    requestHeaders,
    (_database, scope) => scope,
    options,
  );
}

export function withJournalAdminDatabase<T>(
  requestHeaders: Headers,
  operation: (
    database: Database.Database,
    scope: JournalAdminScope,
  ) => T,
  options: Readonly<{
    environment?: NodeJS.ProcessEnv;
    databasePath?: string;
    forbiddenRepositoryRoots?: readonly string[];
    now?: () => Date;
  }> = {},
): T {
  const environment = options.environment ?? process.env;
  const identity = requireTraderLinkPlatformAuthenticatedRequestIdentity(requestHeaders, {
    environment,
    databasePath: options.databasePath,
    forbiddenRepositoryRoots: options.forbiddenRepositoryRoots,
    now: options.now,
  });
  return withPlatformDatabase(
    {
      environment,
      databasePath: options.databasePath,
      forbiddenRepositoryRoots: options.forbiddenRepositoryRoots,
      mode: "runtime",
    },
    (database) => {
      const scope = new PlatformAdminAuthorization(
        database,
        environment,
        options.now,
      ).authorize(identity, requestHeaders);
      return operation(database, scope);
    },
  );
}
