import "server-only";
import type Database from "better-sqlite3";
import { observeCommunityDiscordAccess } from "../../communities/server/community-discord-access-sync";
import { requireCommunityOwnerReviewIdentity } from "../../communities/server/community-owner-review-request-identity";
import { PlatformAdminAuthorization } from "../../platform/server/administration/platform-admin-authorization";
import { PlatformOperatorRepository } from "../../platform/server/administration/platform-operator-repository";
import { requireJournalAdminMutationRequest } from "../../platform/server/administration/platform-admin-request-security";
import { deriveAuthenticatedUserJournalScope } from "../../platform/server/authentication/authenticated-user-journal-scope";
import { platformAuthCookieName } from "../../platform/server/authentication/platform-auth-cookies";
import { resolveTraderLinkDiscordGuildId } from "../../platform/server/authentication/platform-discord-configuration";
import { PlatformDiscordMembershipRepository } from "../../platform/server/authentication/platform-discord-membership-repository";
import { PlatformSessionRepository } from "../../platform/server/authentication/platform-session-repository";
import { hashPlatformSessionToken, TRADERLINK_PLATFORM_SESSION_COOKIE } from "../../platform/server/authentication/platform-session-service";
import { requireTraderLinkPlatformAuthenticatedRequestIdentity } from "../../platform/server/authentication/require-platform-request-scope";
import { deriveJournalAccountSelectionRef } from "../../platform/contracts/journal-account-selection";
import { requirePlatformErasureWriter, type PlatformErasureAdmission } from "../../platform/server/privacy/platform-erasure-admission";
import { isTraderLinkPlatformError } from "../../platform/server/database/platform-migration-contract";

/** Private operator routes only. Selection is never authorization. */
export function partnerAlertOperatorEvidenceTarget(request: Request): boolean {
  return ["GET", "POST"].includes(request.method)
    && /^\/api\/admin\/journal\/partner-channels(?:\/(?:role-review|[0-9a-f-]{36}(?:\/stripe-role-review)?))?\/?$/u
      .test(new URL(request.url).pathname);
}

/** Refresh the existing operator's native Discord observation. This returns no
 * authorization: every subsequent read/mutation still uses the unchanged Paid
 * writer and actual Platform admin policy, including its five-minute limit. */
export async function refreshPartnerAlertOperatorEvidence(input: Readonly<{
  database: Database.Database; admission: PlatformErasureAdmission; request: Request;
  environment: NodeJS.ProcessEnv; botToken: string; configurationIsCurrent: () => boolean;
  transport?: typeof fetch;
}>): Promise<"verified" | "not_operator" | "unavailable"> {
  const db = input.database, request = input.request, started = Date.now();
  try {
    if (!partnerAlertOperatorEvidenceTarget(request) || !db.open || db.readonly || db.inTransaction
      || request.signal.aborted) return "unavailable";
    if (request.method === "POST") requireJournalAdminMutationRequest(request);
    const identity = () => requireCommunityOwnerReviewIdentity(requireTraderLinkPlatformAuthenticatedRequestIdentity(
      request.headers, { environment: input.environment, databasePath: db.name },
    ));
    const original = identity();
    if (original.mode !== "platform_session" || !original.sessionId) return "not_operator";
    const grant = () => new PlatformOperatorRepository(db).findActive();
    const originalGrant = grant();
    if (!originalGrant || originalGrant.userId !== original.scope.userId) return "not_operator";
    const guildId = resolveTraderLinkDiscordGuildId(input.environment);
    const subjects = () => db.prepare(`SELECT auth_subject,created_at_utc,updated_at_utc FROM platform_auth_identities
      WHERE user_id=? AND auth_provider='discord' AND status='active' ORDER BY auth_subject`).all(original.scope.userId) as
      { auth_subject: string; created_at_utc: string; updated_at_utc: string }[];
    const originalSubjects = subjects();
    if (originalSubjects.length !== 1) return "not_operator";
    const headers = JSON.stringify([...request.headers]);
    // Bind configuration without returning its contents, including protected
    // configured-owner policy and the review account selector, across I/O.
    const policyEnvironment = () => JSON.stringify(Object.keys(input.environment).sort()
      .map(key => [key, input.environment[key]]));
    const originalEnvironment = policyEnvironment();
    const cookieName = platformAuthCookieName(TRADERLINK_PLATFORM_SESSION_COOKIE);
    const cookies = (request.headers.get("cookie") ?? "").split(";").map(value => value.trim())
      .filter(value => value.startsWith(cookieName + "="));
    if (cookies.length !== 1) return "unavailable";
    const digest = hashPlatformSessionToken(decodeURIComponent(cookies[0]!.slice(cookieName.length + 1)));
    const session = () => new PlatformSessionRepository(db).findActiveByTokenDigest(digest, new Date().toISOString());
    const originalSession = session();
    if (!originalSession || originalSession.userId !== original.scope.userId
      || originalSession.sessionId !== original.sessionId) return "unavailable";
    const selection = original.scope.activeAccountId === null ? null
      : deriveJournalAccountSelectionRef(original.scope.workspaceId, original.scope.activeAccountId);
    const memberships = new PlatformDiscordMembershipRepository(db);
    const life = input.admission.runForUsers([original.scope.userId], () => {
      input.admission.assertLivePrincipal(original.scope.userId);
      return JSON.stringify(input.admission.lifecycle(original.scope.userId));
    });
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(30_000)]);
    const verify = () => {
      const now = Date.now(), current = session();
      if (now < started || now - started >= 30_000 || signal.aborted
        || JSON.stringify([...request.headers]) !== headers || policyEnvironment() !== originalEnvironment
        || !input.configurationIsCurrent() || resolveTraderLinkDiscordGuildId(input.environment) !== guildId
        || requirePlatformErasureWriter(db, original.scope.userId) !== input.admission
        || !current || current.userId !== original.scope.userId || current.sessionId !== original.sessionId
        || current.authProvider !== originalSession.authProvider || current.expiresAtUtc !== originalSession.expiresAtUtc
        || JSON.stringify(subjects()) !== JSON.stringify(originalSubjects)
        || JSON.stringify(grant()) !== JSON.stringify(originalGrant)
        || JSON.stringify(deriveAuthenticatedUserJournalScope(db, original.scope.userId, selection)) !== JSON.stringify(original.scope)
        || JSON.stringify(input.admission.lifecycle(original.scope.userId)) !== life) {
        throw new Error("Operator observation changed.");
      }
      input.admission.assertLivePrincipal(original.scope.userId);
    };
    const authorize = () => {
      // Genuine native policy, rather than inferring admin from a guild role.
      // No scope leaves this synchronous admitted callback.
      const scope = new PlatformAdminAuthorization(db, input.environment).authorize(original, request.headers);
      if (scope.userId !== original.scope.userId || scope.role !== "journal_owner_admin"
        || scope.mode !== "production_discord_owner") throw new Error("Operator unavailable.");
    };
    input.admission.runForUsers([original.scope.userId], () => { verify(); authorize(); verify(); });
    const cached = memberships.findCurrent(original.scope.userId, guildId);
    const age = cached ? Date.now() - Date.parse(cached.lastVerifiedAtUtc) : NaN;
    if (Number.isFinite(age) && age >= 0 && age < 240_000) return "verified";
    const transport: typeof fetch = (url, init) => (input.transport ?? fetch)(url, {
      ...init, signal: AbortSignal.any([signal, ...(init?.signal ? [init.signal] : [])]),
    });
    const observation = await observeCommunityDiscordAccess({ guildIds: [guildId],
      authSubject: originalSubjects[0]!.auth_subject, botToken: input.botToken, request: transport });
    const latest = identity();
    if (latest.mode !== original.mode || latest.sessionId !== original.sessionId
      || JSON.stringify(latest.scope) !== JSON.stringify(original.scope)
      || observation.memberships.length !== 1 || observation.memberships[0]!.guildId !== guildId
      || Date.parse(observation.observedAtUtc) < started || Date.parse(observation.observedAtUtc) > Date.now()) return "unavailable";
    input.admission.runForUsers([original.scope.userId], () => {
      verify(); authorize(); verify();
      // Queue and role-review reads may refresh concurrently. Native policy
      // rechecks the current membership; never reject a legitimate parallel
      // refresh merely for changing its timestamp, or overwrite newer evidence.
      const current = memberships.findCurrent(original.scope.userId, guildId);
      const currentAt = current ? Date.parse(current.lastVerifiedAtUtc) : NaN;
      if (!Number.isFinite(currentAt) || currentAt > Date.now()) throw new Error("Operator observation unavailable.");
      if (currentAt < Date.parse(observation.observedAtUtc)) {
        memberships.upsertCurrent({ userId: original.scope.userId, ...observation.memberships[0]!,
          verifiedAtUtc: observation.observedAtUtc });
      }
      verify(); authorize(); verify();
    });
    return "verified";
  } catch (error) {
    if (isTraderLinkPlatformError(error) && ["TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED",
      "TRADERLINK_JOURNAL_ADMIN_RATE_LIMITED"].includes(error.code)) return "not_operator";
    return "unavailable";
  }
}
