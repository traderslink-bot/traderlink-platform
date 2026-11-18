import "server-only";
import { randomUUID } from "node:crypto";
import { PlatformSessionRepository } from "../../platform/server/authentication/platform-session-repository";
import { hashPlatformSessionToken,TRADERLINK_PLATFORM_SESSION_COOKIE } from "../../platform/server/authentication/platform-session-service";
import { platformAuthCookieName } from "../../platform/server/authentication/platform-auth-cookies";
import { deriveAuthenticatedUserJournalScope } from "../../platform/server/authentication/authenticated-user-journal-scope";
import { deriveJournalAccountSelectionRef } from "../../platform/contracts/journal-account-selection";
import type Database from "better-sqlite3";
import { assertCommunityStagingQaTarget } from "../../communities/server/community-staging-qa-target";
import { requireCommunityOwnerReviewIdentity } from "../../communities/server/community-owner-review-request-identity";
import { requireTraderLinkPlatformAuthenticatedRequestIdentity } from "../../platform/server/authentication/require-platform-request-scope";
import { requirePlatformErasureWriter,type PlatformErasureAdmission } from "../../platform/server/privacy/platform-erasure-admission";
import { requirePartnerAlertAdmission } from "./partner-alert-admission";
import { bindPartnerAlertNativeSubscriber } from "./partner-alert-native-runtime";
import { createPartnerAlertPremiumWhopAccessProvider } from "./partner-alert-premium-whop-access-provider";
import { createPartnerAlertPremiumWhopRequestSubscriberBinding } from "./partner-alert-premium-whop-refresh";
import { readPartnerAlertRequestPremiumConfiguration } from "./partner-alert-request-premium-configuration";
import { PARTNER_ALERT_WHOP_API_VERSION,type PartnerAlertWhopTransport } from "./partner-alert-whop-client";
import type { PartnerAlertSubscriberOffer,PartnerAlertSubscriberRoleObserver } from "./partner-alert-subscriber-access";

/** Private lifetime of ONE normal HTTP request and its admitted connection.
 * No installed token registry, controller identity or request-selected payer. */
export function createPartnerAlertRequestPremiumBinder(input: Readonly<{
  database: Database.Database; admission: PlatformErasureAdmission; request: Request;
  environment: NodeJS.ProcessEnv; guildId: string; paidRoleId: string | null;
  observeDiscord?: PartnerAlertSubscriberRoleObserver; transport?: PartnerAlertWhopTransport;
}>) {
  let closed = false,configurationFingerprint: string | null = null;
  const active = new Map<string,Readonly<{ authority: ReturnType<typeof bindPartnerAlertNativeSubscriber>;
    clear: () => void; revalidate: () => void }>>();
  const fail = (): never => { throw new Error("Subscriber Premium verification is unavailable."); };
  return Object.freeze({
    clear: () => { closed = true;for (const binding of active.values()) binding.clear();active.clear(); },
    bind: (target: PartnerAlertSubscriberOffer): ReturnType<typeof bindPartnerAlertNativeSubscriber> => {
      if (closed || input.database.inTransaction || input.request.signal.aborted || !input.paidRoleId) return null;
      try {
        const identity = () => requireCommunityOwnerReviewIdentity(requireTraderLinkPlatformAuthenticatedRequestIdentity(
          input.request.headers,{ environment: input.environment,databasePath: input.database.name }));
        const actor = identity();
        if (actor.mode !== "platform_session" || !actor.sessionId || actor.scope.userId !== target.userId) return null;
        const configuration = readPartnerAlertRequestPremiumConfiguration(input.environment);
        if (!configuration || (configurationFingerprint && configurationFingerprint !== configuration.fingerprint)) return null;
        assertCommunityStagingQaTarget(input.database,configuration.pins);
        configurationFingerprint = configuration.fingerprint;
        const headersBinding = JSON.stringify([...input.request.headers]);
        const reviewSelector = input.environment.TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT;
        const cookieName = platformAuthCookieName(TRADERLINK_PLATFORM_SESSION_COOKIE);
        const cookies = (input.request.headers.get("cookie") ?? "").split(";").map(value => value.trim())
          .filter(value => value.startsWith(cookieName + "="));
        if (cookies.length !== 1) return null;
        const tokenDigest = hashPlatformSessionToken(decodeURIComponent(cookies[0]!.slice(cookieName.length + 1)));
        const originalSubjects = input.database.prepare("SELECT auth_subject FROM platform_auth_identities WHERE user_id=? AND auth_provider='discord' AND status='active'")
          .all(actor.scope.userId) as { auth_subject: string }[];
        if (originalSubjects.length !== 1 || !reviewSelector?.split(",").map(value => value.trim()).includes(originalSubjects[0]!.auth_subject)) return null;
        const originalDiscordSubject = originalSubjects[0]!.auth_subject;
        const selection = actor.scope.activeAccountId === null ? null
          : deriveJournalAccountSelectionRef(actor.scope.workspaceId,actor.scope.activeAccountId);
        const verifyNativePrincipal = () => {
          if (closed || input.request.signal.aborted || JSON.stringify([...input.request.headers]) !== headersBinding
            || readPartnerAlertRequestPremiumConfiguration(input.environment)?.fingerprint !== configuration.fingerprint
            || !writer.isCurrentWriter()) return fail();
          input.admission.assertLivePrincipal(target.userId);
          const session = new PlatformSessionRepository(input.database).findActiveByTokenDigest(tokenDigest,new Date().toISOString());
          const scope = deriveAuthenticatedUserJournalScope(input.database,actor.scope.userId,selection);
          const subjects = input.database.prepare("SELECT auth_subject FROM platform_auth_identities WHERE user_id=? AND auth_provider='discord' AND status='active'")
            .all(actor.scope.userId) as { auth_subject: string }[];
          if (!session || session.sessionId !== actor.sessionId || session.userId !== actor.scope.userId
            || JSON.stringify(scope) !== JSON.stringify(actor.scope) || subjects.length !== 1
            || subjects[0]!.auth_subject !== originalDiscordSubject
            || input.environment.TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT !== reviewSelector) return fail();
        };
        const revalidate = () => {
          if (closed || input.request.signal.aborted || JSON.stringify([...input.request.headers]) !== headersBinding) return fail();
          if (readPartnerAlertRequestPremiumConfiguration(input.environment)?.fingerprint !== configuration.fingerprint) return fail();
          // Complete normal Auth may touch its session using another connection.
          // Resolve it only outside SQL; inside use the ORIGINAL native principal
          // on the actual admitted handle, never another resolver or a cached grant.
          if (!input.database.inTransaction) {
            const current = identity();
            if (current.mode !== actor.mode || current.sessionId !== actor.sessionId
              || JSON.stringify(current.scope) !== JSON.stringify(actor.scope)) return fail();
          }
          assertCommunityStagingQaTarget(input.database,configuration.pins);
          if (input.database.inTransaction) {
            verifyNativePrincipal();
          } else writer.run(verifyNativePrincipal);
        };
        const key = JSON.stringify([target.communityId,target.userId]);
        const previous = active.get(key);
        if (previous) { previous.revalidate();return previous.authority; }
        const admitted = requirePartnerAlertAdmission(input.database);
        const producer = input.admission.memberRepository(target.userId);
        const writer = { run: <T>(operation: () => T): T => admitted.runCommunity(target.communityId,[target.userId],() => {
          verifyNativePrincipal();
          const result = operation();
          verifyNativePrincipal();
          return result;
        }),
          isCurrentWriter: () => {
            try { return requirePlatformErasureWriter(input.database,target.userId) === input.admission; } catch { return false; }
          } };
        const initial = writer.run(() => {
          verifyNativePrincipal();
          const linked = producer.resolveUserAuthority(target.userId,input.guildId);
          if (linked.kind !== "linked") return null;
          const read = producer.captureV2(linked.authorityKey);
          if (read.kind !== "snapshot" || read.ticket.scope.userId !== target.userId || read.ticket.scope.guildId !== input.guildId
            || read.policy.state !== "active" || read.policy.offerScopes.length !== 1 || !read.policy.nativeQualification
            || read.payer.kind !== "bound" || read.policy.offerScopes[0]?.environment !== "sandbox") return null;
          const offer = read.policy.offerScopes[0];
          if (read.policy.nativeQualification.apiVersion !== PARTNER_ALERT_WHOP_API_VERSION
            || producer.nativePurchaseV2(read.ticket,offer.scopeRef).kind !== "purchase") return null;
          return { offer,qualification: { ...read.policy.nativeQualification,accountId: offer.accountId,environment: "sandbox" as const } };
        });
        if (!initial) return null;
        revalidate();
        const provider = createPartnerAlertPremiumWhopAccessProvider({ environment: input.environment,
          client: { environment: "sandbox",accountId: initial.offer.accountId,apiVersionDate: PARTNER_ALERT_WHOP_API_VERSION,
            bearerToken: configuration.readToken },qualification: initial.qualification,offer: initial.offer,
          nowUtc: () => input.admission.now(),transport: input.transport ?? ((url,options) => fetch(url,options)) });
        if (!provider) return null;
        const binding = createPartnerAlertPremiumWhopRequestSubscriberBinding({ database: input.database,request: input.request,
          pins: configuration.pins,guildId: input.guildId,offer: initial.offer,producer,writer,
          provider: { ...provider,assertCurrent: () => { revalidate();provider.assertCurrent(); } },
          nowUtc: () => input.admission.now(),createObservationRef: randomUUID,
          readKnownMembershipIds: original => {
            if (original.scope.userId !== target.userId || !producer.isCurrentV2(original)) return fail();
            const read = producer.captureV2(original.scope.authorityKey);
            if (read.kind !== "snapshot") return fail();
            const item = read.coverage.find(value => value.offer.scopeRef === initial.offer.scopeRef);
            return item?.kind === "native_coverage" ? [...new Set(item.collection.members.map(member => member.membershipRef))] : [];
          } });
        try {
          const authority = bindPartnerAlertNativeSubscriber(input.database,input.admission,target,input.guildId,"sandbox",input.paidRoleId,
            { ...binding,observeDiscord: input.observeDiscord,whopTransport: input.transport });
          if (!authority) { binding.clear();return null; }
          active.set(key,{ authority,clear: binding.clear,revalidate });return authority;
        } catch (error) { binding.clear();throw error; }
      } catch { return null; }
    },
  });
}
