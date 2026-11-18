import "server-only";
import type { NextRequest } from "next/server";
import { resolvePlatformPublicOrigin } from "../authentication/platform-public-origin";
import { createHmac } from "node:crypto";
import { assertCommunityStagingQaTarget, type CommunityStagingQaTargetPins } from "../../../communities/server/community-staging-qa-target";
import { requireTraderLinkPlatformAuthenticatedRequestIdentity, requireTraderLinkPlatformRequestIdentity } from "../authentication/require-platform-request-scope";
import { resolveTraderLinkDiscordGuildId } from "../authentication/platform-discord-configuration";
import { withPlatformDatabase } from "../database/open-platform-database";
import { loadWhopAiReviewOAuthConfiguration, loadWhopAiReviewStagingOAuthConfiguration, type WhopAiReviewOAuthConfiguration } from "./whop-ai-review-configuration";

/** Stage identity linking precedes purchase. Commercial dashboard access is not
 * identity proof; the strict request configuration below still qualifies every
 * selected sandbox flow before a redirect, exchange or link. Live policy stays exact. */
export function requireWhopOAuthRequestIdentity(request: NextRequest) {
  return process.env.TRADERLINK_PLATFORM_BACKGROUND_WORKERS_MODE === "disabled_isolated_staging"
    ? requireTraderLinkPlatformAuthenticatedRequestIdentity(request.headers)
    : requireTraderLinkPlatformRequestIdentity(request.headers);
}

/** No provider or identity writes. Uses the installed image/native namespace and
 * the normal authenticated session; neither mode strings nor supplied pins grant access. */
export function loadWhopOAuthRequestConfiguration(request: NextRequest, userId: string): WhopAiReviewOAuthConfiguration {
  if (process.env.TRADERLINK_PLATFORM_BACKGROUND_WORKERS_MODE !== "disabled_isolated_staging") {
    return loadWhopAiReviewOAuthConfiguration();
  }
  const configuration=loadWhopAiReviewStagingOAuthConfiguration();
  const origin="https://traderlink-platform-staging-staging.up.railway.app";
  if(resolvePlatformPublicOrigin(request)!==origin || request.signal.aborted
    || resolveTraderLinkDiscordGuildId(process.env)!=="1559172784813514803") throw new Error("TRADERLINK_WHOP_STAGING_IDENTITY_REFUSED");
  const pins:CommunityStagingQaTargetPins={origin,
    sourceCommit:process.env.TRADERLINK_PLATFORM_ISOLATED_STAGING_SOURCE_COMMIT??"",
    sourceVectorSha256:process.env.TRADERLINK_PLATFORM_ISOLATED_STAGING_SOURCE_VECTOR_SHA256??"",
    schemaSha256:process.env.TRADERLINK_PLATFORM_ISOLATED_STAGING_SCHEMA_SHA256??"",
    buildId:process.env.TRADERLINK_PLATFORM_ISOLATED_STAGING_BUILD_ID??"",
    artifactSha256:process.env.TRADERLINK_PLATFORM_ISOLATED_STAGING_ARTIFACT_SHA256??""};
  const principalBinding=withPlatformDatabase({mode:"runtime"},database=>{
    assertCommunityStagingQaTarget(database,pins);
    const identity=requireTraderLinkPlatformAuthenticatedRequestIdentity(request.headers,{environment:process.env,databasePath:database.name});
    const selected=(process.env.TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT??"").split(",").map(value=>value.trim());
    const subjects=database.prepare("SELECT auth_subject FROM platform_auth_identities WHERE user_id=? AND auth_provider='discord' AND status='active'").all(userId) as {auth_subject:string}[];
    if(identity.mode!=="platform_session" || !identity.sessionId || identity.scope.userId!==userId
      || selected.length!==2 || selected.some(value=>!/^\d{5,22}$/.test(value)) || new Set(selected).size!==2
      || subjects.length!==1 || !selected.includes(subjects[0]!.auth_subject)) throw new Error("TRADERLINK_WHOP_STAGING_IDENTITY_REFUSED");
    return {userId,sessionId:identity.sessionId,discordSubject:subjects[0]!.auth_subject};
  });
  return Object.freeze({...configuration,stagingBinding:JSON.stringify({pins,principalBinding})});
}
/** A state companion binds the issued realm, exact client/config, installed image
 * and logged-in Platform user. Never contains the HMAC key or provider subject. */
export function createWhopOAuthFlowBinding(configuration:WhopAiReviewOAuthConfiguration,userId:string):string{
  return createHmac("sha256",configuration.identityHmacKey).update(JSON.stringify({
    protocol:"whop_oauth_flow_v1",realm:configuration.realm??"live",userId,
    clientId:configuration.clientId,redirectUri:configuration.redirectUri,companyId:configuration.companyId,
    stagingBinding:configuration.stagingBinding??null})).digest("hex");
}
