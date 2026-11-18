import "server-only";
import { createHmac } from "node:crypto";
import type Database from "better-sqlite3";
import { NextRequest } from "next/server";
import { assertCanonicalUuidV4 } from "../database/platform-migration-contract";
import { resolvePlatformPublicOrigin } from "../authentication/platform-public-origin";
import { loadWhopOAuthRequestConfiguration, requireWhopOAuthRequestIdentity, createWhopOAuthFlowBinding } from "./whop-ai-review-staging-identity";

export type WhopAccountIdentityState = "not_linked" | "linked" | "conflict" | "unavailable";
export type WhopAccountConnectionNotice = "connected" | "conflict" | "invalid-state" | "unavailable";

/** Identity facts only. No provider I/O, entitlement projection or paid decision. */
export function readWhopAccountIdentity(database: Database.Database, userId: string): WhopAccountIdentityState {
  try {
    assertCanonicalUuidV4(userId,"userId");
    if (!database.open || !database.readonly && database.pragma("query_only",{simple:true}) !== 1) return "unavailable";
    const rows = database.prepare("SELECT link_state FROM platform_whop_user_links WHERE user_id=? LIMIT 1001")
      .all(userId) as {link_state:string}[];
    if (rows.length > 1000 || rows.some(row => !["active","conflict","revoked"].includes(row.link_state))) return "unavailable";
    if (rows.some(row => row.link_state === "conflict")) return "conflict";
    const active = rows.filter(row => row.link_state === "active").length;
    return active === 1 ? "linked" : active > 1 ? "conflict" : "not_linked";
  } catch { return "unavailable"; }
}

/** Invoke outside every database callback/frame. The actual native OAuth loader
 * still proves session, selected cohort, namespace and current configuration.
 * This proposed non-AI affordance is sandbox-only; production gates stay intact. */
export function canConnectWhopAccount(headers: Headers, userId: string): boolean {
  try {
    assertCanonicalUuidV4(userId,"userId");
    const provisional = new NextRequest("http://localhost/account/membership",{headers});
    const request = new NextRequest(new URL("/account/membership",resolvePlatformPublicOrigin(provisional)),{headers});
    const identity = requireWhopOAuthRequestIdentity(request);
    if (identity.mode !== "platform_session" || !identity.sessionId || identity.scope.userId !== userId) return false;
    return loadWhopOAuthRequestConfiguration(request,userId).realm === "sandbox";
  } catch { return false; }
}

export function readWhopAccountConnectionNotice(value: unknown): WhopAccountConnectionNotice | null {
  return typeof value === "string" && ["connected","conflict","invalid-state","unavailable"].includes(value)
    ? value as WhopAccountConnectionNotice : null;
}

/** Fixed Billing return intent. The state is included in a separate keyed binding
 * over the unchanged original user/config flow; this grants no identity/access. */
export function isBillingWhopOAuthState(state:string):boolean {
  return /^(?:sandbox\.)?billing\.[A-Za-z0-9_-]{32,128}$/u.test(state);
}
export function isLegacyWhopOAuthState(state:string):boolean {
  return /^(?:sandbox\.)?[A-Za-z0-9_-]{32,128}$/u.test(state);
}
export function createBillingWhopOAuthFlowBinding(configuration:Parameters<typeof createWhopOAuthFlowBinding>[0],userId:string,state:string):string {
  if(!isBillingWhopOAuthState(state))throw Error("Invalid Billing OAuth state");
  return createHmac("sha256",configuration.identityHmacKey).update(JSON.stringify({
    protocol:"whop_billing_return_v1",state,originalFlow:createWhopOAuthFlowBinding(configuration,userId),
  })).digest("hex");
}
