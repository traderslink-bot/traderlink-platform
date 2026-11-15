import type Database from "better-sqlite3";
import { COMMUNITY_LAUNCH_FEATURES } from "../contracts/community-launch-features";

export function independentCoachingStorageReady(database:Database.Database):boolean {
  return ['traderlink_coaching_contexts','traderlink_coaching_action_receipts','traderlink_coaching_commercial_enrollments','traderlink_coaching_commission_setup_checks','traderlink_coaching_review_images','traderlink_coaching_student_goals','traderlink_coaching_student_notes','traderlink_coaching_review_goals','traderlink_coaching_review_follow_up','traderlink_coaching_review_replies','traderlink_coaching_coach_commission_rates'].every(name=>Boolean(database.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name=?").get(name)));
}
export function coachingDirectPaymentStorageReady(database:Database.Database):boolean {
  return Boolean(database.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='traderlink_coaching_merchant_connections'").get());
}
export function coachingPaymentConfiguration(environment:Readonly<Record<string,string|undefined>>=process.env){
  const mode=environment.TRADERLINK_COACHING_WHOP_ENVIRONMENT;
  return Object.freeze({
    enabled:COMMUNITY_LAUNCH_FEATURES.coachingCommissionCollection,
    configured:(mode==='sandbox'||mode==='live')&&Boolean(environment.TRADERLINK_COACHING_WHOP_API_KEY&&environment.TRADERLINK_COACHING_WHOP_PLATFORM_ACCOUNT_ID&&environment.TRADERLINK_COACHING_WHOP_IDENTITY_HMAC_KEY&&environment.TRADERLINK_COACHING_APPLICATION_ORIGIN),
    environment:mode==='sandbox'||mode==='live'?mode:null,
    oauthConfigured:Boolean(environment.TRADERLINK_COACHING_WHOP_OAUTH_CLIENT_ID),
    webhookConfigured:Boolean(environment.TRADERLINK_COACHING_WHOP_WEBHOOK_SECRET),
  });
}
