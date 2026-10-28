import type Database from "better-sqlite3";
import { PlatformAdminAuthorization } from "../../platform/server/administration/platform-admin-authorization";
import { PlatformAuthenticationRepository } from "../../platform/server/authentication/platform-authentication-repository";
import { resolveTraderLinkDiscordGuildId } from "../../platform/server/authentication/platform-discord-configuration";
import { PlatformDiscordMembershipRepository } from "../../platform/server/authentication/platform-discord-membership-repository";
import { PlatformSessionRepository } from "../../platform/server/authentication/platform-session-repository";
import { hashPlatformSessionToken, TRADERLINK_PLATFORM_SESSION_COOKIE } from "../../platform/server/authentication/platform-session-service";
import { requireTraderLinkPlatformAuthenticatedRequestIdentity,
  type TraderLinkPlatformRequestIdentity } from "../../platform/server/authentication/require-platform-request-scope";
import { PlatformWorkspaceRepository } from "../../platform/server/identity/platform-workspace-repository";
import { TraderLinkCommunityRepository } from "../../communities/server/traderlink-community-repository";
import { PartnerAlertValidationError } from "../contracts/partner-alert-contracts";
import { partnerAlertId, partnerAlertInteger, partnerAlertSnowflake, partnerAlertUtc } from "../contracts/partner-alert-validation";
import { PartnerAlertPlatformAuthority } from "./partner-alert-platform-authority";
import { PartnerAlertRepository } from "./partner-alert-repository";

export type PartnerAlertRequestWriterConfiguration = Readonly<{
  environment: NodeJS.ProcessEnv;
  now: () => Date;
  createId: () => string;
  destinationGuildId: string;
  maximumActorAgeMs: number;
  maximumDiscordEvidenceAgeMs: number;
}>;

/** Request-local support for the two EXISTING authorized private reads only.
 * No DB, identity, actor receipt, native/config proof or automation writer escapes.
 * Handles work only synchronously inside the owning run callback. */
export type PartnerAlertPrivateRequestScope = Readonly<Pick<PartnerAlertRepository, "readPartner" | "listReviewRequests">>;

type OperatorAuthorizationScope = ReturnType<PlatformAdminAuthorization["authorize"]>;

type OwnedRequest = {
  owner: PartnerAlertRequestWriter;
  request: Request;
  active: boolean;
  failed: boolean;
  scope: PartnerAlertPrivateRequestScope | null;
  verify: () => string;
};
const activeConnections = new WeakMap<Database.Database, OwnedRequest>();
const resolvingConnections = new WeakSet<Database.Database>();
const capabilities = new WeakSet<object>();

function rejected(): never {
  throw new PartnerAlertValidationError("requestAuthority", "This request could not be authorized.");
}
function headersKey(headers: Headers): string {
  const entries: [string, string][] = [];
  headers.forEach((value, name) => entries.push([name, value]));
  return JSON.stringify(entries);
}
function tokenDigest(headers: Headers): string {
  const cookie = headers.get("cookie");
  if (!cookie) return rejected();
  const values: string[] = [];
  for (const part of cookie.split(";").map(value => value.trim())) {
    const separator = part.indexOf("=");
    const name = separator < 0 ? part : part.slice(0, separator).trim();
    if (name !== TRADERLINK_PLATFORM_SESSION_COOKIE) continue;
    if (!part.startsWith(`${TRADERLINK_PLATFORM_SESSION_COOKIE}=`)) return rejected();
    values.push(part.slice(separator + 1));
  }
  if (values.length !== 1 || !values[0]) return rejected();
  try { return hashPlatformSessionToken(decodeURIComponent(values[0])); }
  catch { return rejected(); }
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
    const database = this.database;
    const nested = activeConnections.get(database);
    if (nested) {
      if (nested.owner !== this || nested.request !== request || !nested.active || !database.open || !database.inTransaction) {
        nested.failed = true; return rejected();
      }
      return withinScope(nested, operation);
    }
    // Never adopt somebody else's transaction or initial identity resolution.
    if (!database.open || database.readonly || database.inTransaction || resolvingConnections.has(database)
      || typeof operation !== "function" || request.signal.aborted) return rejected();
    resolvingConnections.add(database);
    try {
      const configuration = Object.freeze({ ...this.configuration,
        environment: Object.freeze({ ...this.configuration.environment }) });
      partnerAlertInteger(configuration.maximumActorAgeMs, "maximumActorAgeMs", 1, 300_000);
      partnerAlertInteger(configuration.maximumDiscordEvidenceAgeMs, "maximumDiscordEvidenceAgeMs", 1, 300_000);
      partnerAlertSnowflake(configuration.destinationGuildId, "destinationGuildId");
      if (typeof configuration.now !== "function" || typeof configuration.createId !== "function"
        || configuration.environment.NODE_ENV !== "production"
        || resolveTraderLinkDiscordGuildId(configuration.environment) !== configuration.destinationGuildId) return rejected();
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
      const workspaceId = partnerAlertId(initial.scope.workspaceId, "workspaceId");
      if (!["owner", "admin", "member"].includes(initial.scope.workspaceRole)) return rejected();
      const workspaceScope = Object.freeze({ ...initial.scope,
        allowedAccountIds: Object.freeze([...initial.scope.allowedAccountIds]) });
      // A caller/clock/resolver must not have started a transaction behind us.
      if (!database.open || database.inTransaction || request.signal.aborted
        || headersKey(request.headers) !== originalHeadersKey) return rejected();

      const admin = new PlatformAdminAuthorization(database, configuration.environment, () => new Date(clock()));
      return admin.withRequestAuditFrame(request, frame => {
        const sessions = new PlatformSessionRepository(database);
        const identities = new PlatformAuthenticationRepository(database);
        const workspaces = new PlatformWorkspaceRepository(database);
        const discord = new PlatformDiscordMembershipRepository(database);
        let baseline: string | null = null;
        let identity: TraderLinkPlatformRequestIdentity | null = null;
        const operatorScopes: OperatorAuthorizationScope[] = [];
        let revalidationScope: OperatorAuthorizationScope | null = null;
        const communityOwners = new Set<string>();
        const assertOwned = (): void => {
          if (!state.active || state.failed || activeConnections.get(database) !== state
            || !database.open || !database.inTransaction || request.signal.aborted
            || headersKey(request.headers) !== originalHeadersKey) return rejected();
        };
        const verify = (): string => {
          assertOwned();
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
        const state: OwnedRequest = { owner: this, request, active: true, failed: false, scope: null, verify };
        activeConnections.set(database, state);
        try {
          verify();
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
              // Each repository access issues one genuine attempt. Only final
              // validation may reuse its exact Auth-issued original scope.
              const scope = revalidationScope === null ? frame.authorize(currentIdentity, headers)
                : frame.revalidate(revalidationScope, currentIdentity, headers);
              verify();
              if (revalidationScope === null) operatorScopes.push(scope);
              return scope;
            } },
            communities: new TraderLinkCommunityRepository(database), discordMemberships: discord,
            nowUtc: verify, maximumActorAgeMs: configuration.maximumActorAgeMs,
            maximumDiscordEvidenceAgeMs: configuration.maximumDiscordEvidenceAgeMs,
            destinationGuildId: configuration.destinationGuildId,
          });
          const repository = new PartnerAlertRepository(database, authority, {
            destinationGuildId: configuration.destinationGuildId, nowUtc: verify, createId: configuration.createId,
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
            listReviewRequests: (limit?: number) => guarded(() => {
              return repository.listReviewRequests(limit);
            }),
          });
          capabilities.add(scope); state.scope = scope;
          const result = withinScope(state, operation);
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
        } finally {
          state.active = false; state.scope = null;
          if (activeConnections.get(database) === state) activeConnections.delete(database);
        }
      });
    } finally {
      resolvingConnections.delete(database);
    }
  }
}
