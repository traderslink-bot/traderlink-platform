import { COMMUNITY_LAUNCH_FEATURES } from "../contracts/community-launch-features";
import { CoachingWhopDirectClient } from "./coaching-whop-direct-client";

export function loadCoachingWhopRuntime(environment:Readonly<Record<string,string|undefined>>=process.env){
  if(!COMMUNITY_LAUNCH_FEATURES.coachingCommissionCollection)throw new Error('Coaching payments are not enabled yet.');
  const mode=environment.TRADERLINK_COACHING_WHOP_ENVIRONMENT;
  const apiKey=environment.TRADERLINK_COACHING_WHOP_API_KEY,platformAccountId=environment.TRADERLINK_COACHING_WHOP_PLATFORM_ACCOUNT_ID,
    identityKey=environment.TRADERLINK_COACHING_WHOP_IDENTITY_HMAC_KEY,applicationOrigin=environment.TRADERLINK_COACHING_APPLICATION_ORIGIN;
  if((mode!=='sandbox'&&mode!=='live')||!apiKey||!platformAccountId||!identityKey||identityKey.length<32||!applicationOrigin)throw new Error('Coaching payment setup is not available yet.');
  const rate=Number(environment.TRADERLINK_COACHING_COMMISSION_BASIS_POINTS??2000);
  if(!Number.isSafeInteger(rate)||rate<0||rate>10000)throw new Error('Coaching commission configuration needs review.');
  return {environment:mode,platformAccountId,identityKey,applicationOrigin,commissionBasisPoints:rate,
    commissionPolicyVersion:environment.TRADERLINK_COACHING_COMMISSION_POLICY_VERSION??`default-${rate}-basis-points-v1`,
    oauthClientId:environment.TRADERLINK_COACHING_WHOP_OAUTH_CLIENT_ID??null,
    webhookSecret:environment.TRADERLINK_COACHING_WHOP_WEBHOOK_SECRET??null,
    client:new CoachingWhopDirectClient({environment:mode,apiVersionDate:'2026-10-24',apiKey,applicationOrigin},fetch)} as const;
}
