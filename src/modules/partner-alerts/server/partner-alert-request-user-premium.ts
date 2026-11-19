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
import { createPartnerAlertPremiumWhopAccessProvider } from "./partner-alert-premium-whop-access-provider";
import { createPartnerAlertPremiumWhopRequestSubscriberBinding } from "./partner-alert-premium-whop-refresh";
import { readPartnerAlertRequestPremiumConfiguration } from "./partner-alert-request-premium-configuration";
import { PARTNER_ALERT_WHOP_API_VERSION,type PartnerAlertWhopTransport } from "./partner-alert-whop-client";
import type { PartnerAlertSubscriberRoleObserver } from "./partner-alert-subscriber-access";

import { PlatformPremiumCurrentAuthority } from "../../platform/server/membership/platform-premium-current-authority";
import { SqlitePlatformPremiumRoleStore } from "../../platform/server/membership/platform-premium-role-store";
import { evaluatePlatformPremiumWithRuntimeAuthority } from "../../platform/server/membership/platform-premium-runtime-authority";
import { premiumFresh } from "../../platform/contracts/platform-premium-access";

export type PartnerAlertCatalogPremiumRead = Readonly<{
 identity:"not_linked"|"linked"|"conflict"|"native_verification_needed";
 premium:"paid"|"not_paid"|"unknown";
 destination:"joined"|"unknown";
 observedAtUtc:string|null;validUntilUtc:string|null;
 destinationObservedAtUtc:string|null;destinationValidUntilUtc:string|null;
}>;
const unknown=(identity:PartnerAlertCatalogPremiumRead["identity"]="native_verification_needed"):PartnerAlertCatalogPremiumRead=>
 Object.freeze({identity,premium:"unknown",destination:"unknown",observedAtUtc:null,validUntilUtc:null,destinationObservedAtUtc:null,destinationValidUntilUtc:null});

/** User/guild-only read intent, independent of public sale cards. This consumes
 * genuine native admission and request-bound sandbox evidence; it grants no role,
 * enrolls no authority and never manufactures a Partner community or offer. */
export async function readPartnerAlertRequestUserPremium(input:Readonly<{
 database:Database.Database;admission:PlatformErasureAdmission;request:Request;
 environment:NodeJS.ProcessEnv;guildId:string;paidRoleId:string|null;userId:string;
 observeDiscord?:PartnerAlertSubscriberRoleObserver;transport?:PartnerAlertWhopTransport;
}>):Promise<PartnerAlertCatalogPremiumRead>{
 let closed=false,configurationFingerprint:string|null=null;
 let clear:(()=>void)|null=null;
 const fail=():never=>{throw Error("Premium verification unavailable");};
 if(input.database.inTransaction||input.request.signal.aborted||!input.paidRoleId)return unknown();
 try{
        const identity = () => requireCommunityOwnerReviewIdentity(requireTraderLinkPlatformAuthenticatedRequestIdentity(
          input.request.headers,{ environment: input.environment,databasePath: input.database.name }));
        const actor = identity();
        if (actor.mode !== "platform_session" || !actor.sessionId || actor.scope.userId !== input.userId) return unknown();
        const configuration = readPartnerAlertRequestPremiumConfiguration(input.environment);
        if (!configuration || (configurationFingerprint && configurationFingerprint !== configuration.fingerprint)) return unknown();
        assertCommunityStagingQaTarget(input.database,configuration.pins);
        configurationFingerprint = configuration.fingerprint;
        const headersBinding = JSON.stringify([...input.request.headers]);
        const reviewSelector = input.environment.TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT;
        const cookieName = platformAuthCookieName(TRADERLINK_PLATFORM_SESSION_COOKIE);
        const cookies = (input.request.headers.get("cookie") ?? "").split(";").map(value => value.trim())
          .filter(value => value.startsWith(cookieName + "="));
        if (cookies.length !== 1) return unknown();
        const tokenDigest = hashPlatformSessionToken(decodeURIComponent(cookies[0]!.slice(cookieName.length + 1)));
        const originalSubjects = input.database.prepare("SELECT auth_subject FROM platform_auth_identities WHERE user_id=? AND auth_provider='discord' AND status='active'")
          .all(actor.scope.userId) as { auth_subject: string }[];
        if (originalSubjects.length !== 1 || !reviewSelector?.split(",").map(value => value.trim()).includes(originalSubjects[0]!.auth_subject)) return unknown();
        const originalDiscordSubject = originalSubjects[0]!.auth_subject;
        const selection = actor.scope.activeAccountId === null ? null
          : deriveJournalAccountSelectionRef(actor.scope.workspaceId,actor.scope.activeAccountId);
        const verifyNativePrincipal = () => {
          if (closed || input.request.signal.aborted || JSON.stringify([...input.request.headers]) !== headersBinding
            || readPartnerAlertRequestPremiumConfiguration(input.environment)?.fingerprint !== configuration.fingerprint
            || !writer.isCurrentWriter()) return fail();
          input.admission.assertLivePrincipal(input.userId);
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
        const producer = input.admission.memberRepository(input.userId);
        const writer = { run: <T>(operation: () => T): T => input.admission.runForUsers([input.userId],() => {
          verifyNativePrincipal();
          const result = operation();
          verifyNativePrincipal();
          return result;
        }),
          isCurrentWriter: () => {
            try { return requirePlatformErasureWriter(input.database,input.userId) === input.admission; } catch { return false; }
          } };
        const identityState=writer.run(()=>{
          const rows=input.database.prepare("SELECT link_state FROM platform_whop_user_links WHERE user_id=? LIMIT 1001").all(input.userId) as {link_state:string}[];
          if(rows.length>1000)return "native_verification_needed" as const;
          if(rows.some(row=>row.link_state==='conflict')||rows.filter(row=>row.link_state==='active').length>1)return "conflict" as const;
          if(rows.some(row=>!["active","revoked"].includes(row.link_state)))return "native_verification_needed" as const;
          return rows.some(row=>row.link_state==='active')?"linked" as const:"not_linked" as const;
        });
        if(identityState!=="linked")return unknown(identityState);
        const initial = writer.run(() => {
          verifyNativePrincipal();
          const linked = producer.resolveUserAuthority(input.userId,input.guildId);
          if (linked.kind !== "linked") return null;
          const read = producer.captureV2(linked.authorityKey);
          if (read.kind !== "snapshot" || read.ticket.scope.userId !== input.userId || read.ticket.scope.guildId !== input.guildId
            || read.policy.state !== "active" || read.policy.offerScopes.length !== 1 || !read.policy.nativeQualification
            || read.payer.kind !== "bound" || read.policy.offerScopes[0]?.environment !== "sandbox") return null;
          const offer = read.policy.offerScopes[0];
          if (read.policy.nativeQualification.apiVersion !== PARTNER_ALERT_WHOP_API_VERSION
            || producer.nativePurchaseV2(read.ticket,offer.scopeRef).kind !== "purchase") return null;
          return { authorityKey:linked.authorityKey,offer,qualification: { ...read.policy.nativeQualification,accountId: offer.accountId,environment: "sandbox" as const } };
        });
        if (!initial) return unknown(identityState);
        revalidate();
        const provider = createPartnerAlertPremiumWhopAccessProvider({ environment: input.environment,
          client: { environment: "sandbox",accountId: initial.offer.accountId,apiVersionDate: PARTNER_ALERT_WHOP_API_VERSION,
            bearerToken: configuration.readToken },qualification: initial.qualification,offer: initial.offer,
          nowUtc: () => input.admission.now(),transport: input.transport ?? ((url,options) => fetch(url,options)) });
        if (!provider) return unknown(identityState);
        const binding = createPartnerAlertPremiumWhopRequestSubscriberBinding({ database: input.database,request: input.request,
          pins: configuration.pins,guildId: input.guildId,offer: initial.offer,producer,writer,
          provider: { ...provider,assertCurrent: () => { revalidate();provider.assertCurrent(); } },
          nowUtc: () => input.admission.now(),createObservationRef: randomUUID,
          readKnownMembershipIds: original => {
            if (original.scope.userId !== input.userId || !producer.isCurrentV2(original)) return fail();
            const read = producer.captureV2(original.scope.authorityKey);
            if (read.kind !== "snapshot") return fail();
            const item = read.coverage.find(value => value.offer.scopeRef === initial.offer.scopeRef);
            return item?.kind === "native_coverage" ? [...new Set(item.collection.members.map(member => member.membershipRef))] : [];
          } });

        clear=binding.clear;
        // Refresh records only against its ORIGINAL pre-I/O ticket. The new
        // authority below is a separate consumption intent after that commit.
        await binding.refreshPremium(initial.authorityKey);
        revalidate();
        const authority=new PlatformPremiumCurrentAuthority({enabled:true,guildId:input.guildId,
          paidRoleId:input.paidRoleId,complimentaryRoleId:null,nowUtc:()=>input.admission.now()},
          producer,writer,new SqlitePlatformPremiumRoleStore(input.database,{enabled:true,guildId:input.guildId,
            paidRoleId:input.paidRoleId,runtimeAuthority:binding.runtimeAuthority}),null,binding.runtimeAuthority);
        const loaded=await authority.loadCurrent(initial.authorityKey);
        if(loaded.kind!=="snapshot")return unknown(identityState);
        const snapshot=loaded.snapshot;
        const destinationEvidence=input.observeDiscord&&snapshot.scope.discordUserId
          ?await input.observeDiscord({guildId:input.guildId,discordUserId:snapshot.scope.discordUserId},input.request.signal):null;
        revalidate();
        return writer.run(()=>{
          if(snapshot.scope.userId!==input.userId||snapshot.scope.guildId!==input.guildId||!authority.isCurrent(snapshot.ticket))return unknown(identityState);
          const at=input.admission.now();
          const decision=evaluatePlatformPremiumWithRuntimeAuthority(snapshot,at,binding.runtimeAuthority);
          if(!authority.isCurrent(snapshot.ticket))return unknown(identityState);
          const finalAt=input.admission.now();
          const joined=destinationEvidence!==null&&destinationEvidence.guildId===input.guildId
            &&destinationEvidence.discordUserId===snapshot.scope.discordUserId
            &&premiumFresh(destinationEvidence.observedAtUtc,destinationEvidence.validUntilUtc,finalAt);
          const paid=decision.partnerPaidEligible&&decision.reason==="paid";
          const unpaid=snapshot.payer.kind==="bound"&&snapshot.coverage.length>0&&snapshot.coverage.every(item=>item.kind==="evidence"
            &&item.offer.environment==="sandbox"&&item.evidence.kind==="not_paid"
            &&premiumFresh(item.evidence.observedAtUtc,item.evidence.validUntilUtc,at));
          const premium=paid?"paid" as const:unpaid?"not_paid" as const:"unknown" as const;
          const evidence=snapshot.coverage.flatMap(item=>item.kind==="evidence"&&item.evidence.kind!=="unknown"?[item.evidence]:[]);
          return Object.freeze({identity:identityState,premium,destination:joined?"joined" as const:"unknown" as const,
            destinationObservedAtUtc:joined?destinationEvidence!.observedAtUtc:null,
            destinationValidUntilUtc:joined?destinationEvidence!.validUntilUtc:null,
            observedAtUtc:premium==="unknown"?null:[snapshot.ticket.observedAtUtc,...evidence.map(item=>item.observedAtUtc)].sort().at(-1)!,
            validUntilUtc:premium==="unknown"?null:[snapshot.ticket.validUntilUtc,...evidence.map(item=>item.validUntilUtc),...(paid&&decision.validUntilUtc?[decision.validUntilUtc]:[])].sort()[0]!});
        });
 }catch{return unknown();}finally{closed=true;clear?.();}
}
