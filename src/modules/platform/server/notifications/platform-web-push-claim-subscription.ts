import "server-only";

import type Database from "better-sqlite3";
import { decryptPlatformWebPushSubscription } from "./platform-web-push-subscription-crypto";

// Called inside the claim transaction. Persist the quarantine instead of rolling
// back the attempt and selecting the same unreadable subscription forever.
export function readClaimedWebPushSubscription(
  database: Database.Database,
  subscriptionRef: string,
  nowUtc: string,
  input: Parameters<typeof decryptPlatformWebPushSubscription>[0],
): ReturnType<typeof decryptPlatformWebPushSubscription> | null {
  try {
    return decryptPlatformWebPushSubscription(input);
  } catch {
    // Never log encrypted material, endpoint URLs, keys or the provider body.
  }
  database.prepare(`UPDATE platform_web_push_subscriptions SET
  state = 'expired', failure_count = failure_count + 1,
  last_failure_at_utc = ?, updated_at_utc = ?
WHERE subscription_id = ?`).run(nowUtc, nowUtc, subscriptionRef);
  for (const table of [
    "platform_web_push_deliveries",
    "news_market_halt_push_deliveries",
    "news_press_release_push_deliveries",
  ] as const) {
    database.prepare(`UPDATE ${table} SET
  state = 'failed', failure_code = 'subscription_unreadable', updated_at_utc = ?
WHERE subscription_id = ? AND state IN ('pending', 'sending')`).run(nowUtc, subscriptionRef);
  }
  return null;
}
