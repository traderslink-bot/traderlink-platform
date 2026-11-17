// @vitest-environment node
import Database from "better-sqlite3";
import { afterEach, expect, it, vi } from "vitest";
import { nowUtc, qualifiedPaidInput } from "../contracts/partner-alert-access-policy.test-fixture";
import { encryptPartnerAlertCredentials } from "./partner-alert-credentials";
import { readPartnerAlertExistingWhopRolePage, readPartnerAlertExistingWhopTarget,
  verifyPartnerAlertExistingWhopAccess } from "./partner-alert-existing-whop-access";
import { startPartnerAlertStripeRoleReconciliation } from "./partner-alert-stripe-role-reconciliation";
import type { PartnerAlertWhopTransport } from "./partner-alert-whop-client";

const databases: Database.Database[] = [];
afterEach(() => databases.splice(0).forEach(db => db.close()));

function fixture() {
  const db = new Database(":memory:");
  databases.push(db);
  const { ticket, offers: [first] } = qualifiedPaidInput();
  const { communityId, mappingId, userId, guildId } = ticket.context;
  const offer = first!.offer;
  const second = { ...offer, version: 2, whop: { ...offer.whop, planId: "plan_second", productId: "prod_second" } };
  const expires = "2026-11-02T12:01:00.000Z";
  const credentialKeys = { activeKeyVersion: "fixture", keysBase64: { fixture: Buffer.alloc(32, 1).toString("base64") } };
  const whopUserId = "user_fixture";
  db.exec(`CREATE TABLE platform_premium_native_bindings(authority_key,link_id,whop_user_ref_hmac,whop_user_id);
    CREATE TABLE platform_premium_authorities(authority_key,user_id,phase,policy_ref);
    CREATE TABLE platform_premium_authority_policies(policy_ref,guild_id,state);
    CREATE TABLE platform_whop_user_links(user_id,link_id,whop_user_ref_hmac,link_state);
    CREATE TABLE partner_alert_whop_identities(user_id,environment,whop_user_ref,status);
    CREATE TABLE partner_alert_partners(community_id,owner_user_id);
    CREATE TABLE partner_alert_offers(community_id,offer_id,version,whop_environment,review_state,offer_json);
    CREATE TABLE partner_alert_offer_channels(community_id,offer_id,offer_version,mapping_id);
    CREATE TABLE partner_alert_whop_connections(community_id,environment,whop_account_id,encrypted_authorisation_json,
      status,verified_at_utc,valid_until_utc,owner_user_ref);
    CREATE TABLE partner_alert_memberships(community_id,user_id,environment,whop_user_ref,membership_id,
      whop_account_id,offer_id,offer_version,basis);
    CREATE TABLE partner_alert_role_jobs(community_id,mapping_id,user_id,applied_present,managed_assignment_ref,next_attempt_at_utc,
      discord_user_id,desired_ticket_json);`);
  const insert = (table: string, ...values: (string | number | null)[]) =>
    db.prepare(`INSERT INTO ${table} VALUES (${values.map(() => "?").join(",")})`).run(...values);
  const { authorityKey } = ticket.premium.scope;
  insert("platform_premium_native_bindings", authorityKey, "link", "hash", whopUserId);
  insert("platform_premium_authorities", authorityKey, userId, "live", "policy");
  insert("platform_premium_authority_policies", "policy", guildId, "active");
  insert("platform_whop_user_links", userId, "link", "hash", "active");
  insert("partner_alert_whop_identities", userId, "live", "e".repeat(64), "verified");
  insert("partner_alert_partners", communityId, userId);
  for (const item of [offer, second]) {
    insert("partner_alert_offers", communityId, item.offerId, item.version, "live", "approved", JSON.stringify(item));
    insert("partner_alert_offer_channels", communityId, item.offerId, item.version, mappingId);
  }
  const encrypted = encryptPartnerAlertCredentials({ configuration: credentialKeys,
    context: { communityId, accountId: offer.whop.accountId, environment: "live", purpose: "community_verification" },
    credentials: { accessToken: "synthetic-credential", refreshToken: null, expiresAtUtc: expires } });
  insert("partner_alert_whop_connections", communityId, "live", offer.whop.accountId, JSON.stringify(encrypted), "verified",
    nowUtc, expires, "c".repeat(64));
  insert("partner_alert_memberships", communityId, userId, "live", "e".repeat(64), "mem_paid",
    offer.whop.accountId, offer.offerId, offer.version, "paid");
  insert("partner_alert_role_jobs", communityId, mappingId, userId, 1, "managed", nowUtc,
    ticket.context.linkedDiscordUserId, JSON.stringify(ticket));
  const read = () => db.transaction(() => readPartnerAlertExistingWhopTarget(db, ticket)).immediate();
  const membership = { account: { id: offer.whop.accountId }, id: "mem_paid", user_id: whopUserId,
    product_id: offer.whop.productId, variant_id: offer.whop.planId, status: "canceled" };
  const discovered: unknown[] = [membership];
  const transport = vi.fn<PartnerAlertWhopTransport>(async (rawUrl, init) => {
    expect(db.inTransaction).toBe(false);
    expect(init.method).toBe("GET");
    const url = new URL(rawUrl);
    if (url.pathname === "/api/v1/memberships") {
      expect(url.searchParams.get("user_id")).toBe(whopUserId);
      expect(url.searchParams.get("account_id")).toBe(offer.whop.accountId);
      expect(url.searchParams.getAll("product_ids").sort()).toEqual([offer.whop.productId, second.whop.productId].sort());
      return Response.json({ data: discovered, page_info: { has_next_page: false, end_cursor: null } });
    }
    if (url.pathname === "/api/v1/memberships/mem_paid") {
      expect(url.searchParams.get("account_id")).toBe(offer.whop.accountId);
      expect(init.signal).toBeInstanceOf(AbortSignal);
      return Response.json(membership);
    }
    const item = [offer, second].find(item => url.pathname === `/api/v1/variants/${item.whop.planId}`);
    if (item) return Response.json({ id: item.whop.planId, account: { id: item.whop.accountId }, product: { id: item.whop.productId } });
    expect(url.pathname.startsWith(`/api/v1/users/${whopUserId}/access/`)).toBe(true);
    return Response.json({ has_access: false, access_level: "no_access" });
  });
  return { db, ticket, read, membership, discovered, transport, prove: () => verifyPartnerAlertExistingWhopAccess({ database: db,
    credentialKeys, maximumEvidenceAgeMs: 300_000, nowUtc: () => nowUtc, transport }, read()!) };
}

it("reads every affected product for an exact existing buyer and excludes unmanaged assignments", async () => {
  const { db, ticket, read, transport, prove } = fixture();
  expect(read()?.memberships).toHaveLength(1);
  const assignments = readPartnerAlertExistingWhopRolePage(db, null, nowUtc);
  expect(assignments).toHaveLength(1);
  expect(readPartnerAlertExistingWhopRolePage(db, assignments[0]!.scope, nowUtc)).toHaveLength(0);
  await expect(prove()).resolves.toEqual({ observedAtUtc: nowUtc, validUntilUtc: "2026-11-02T12:00:30.000Z", kind: "absent", retainedOffers: [] });
  expect(transport).toHaveBeenCalledTimes(5);
  db.exec("UPDATE partner_alert_role_jobs SET managed_assignment_ref=NULL");
  expect(readPartnerAlertExistingWhopRolePage(db, null, nowUtc)).toHaveLength(0);
  db.exec("UPDATE platform_whop_user_links SET link_state='revoked'");
  expect(read()).toBeNull();
  expect(readPartnerAlertExistingWhopTarget(db, ticket)).toBeNull();
});

it.each([
  { state: "confirmed Premium loss while Whop grants access", premium: "inactive", whop: "retained", current: true, removes: true },
  { state: "confirmed Premium loss with Whop unavailable", premium: "inactive", whop: "unavailable", current: true, removes: true },
  { state: "unverified Premium", premium: "unknown", whop: "retained", current: true, removes: false },
  { state: "a stale Premium observation", premium: "inactive", whop: "retained", current: false, removes: false },
  { state: "Whop grace while Premium is paid", premium: "active", whop: "retained", current: true, removes: false },
  { state: "confirmed loss of both sources of channel coverage", premium: "active", whop: "absent", current: true, removes: true },
  { state: "an independent paid Stripe purchase", premium: "active", whop: "overlap", current: true, removes: false },
] as const)("rechecks owned Whop role removal for $state", async ({ premium, whop, current, removes }) => {
  const { db, ticket } = fixture();
  db.exec(`ALTER TABLE partner_alert_role_jobs ADD COLUMN decision_valid_until_utc;
    CREATE TABLE partner_alert_stripe_events(environment,stripe_account_id,kind,status,claim_id,received_at_ms);
    CREATE TABLE partner_alert_stripe_checkout_claims(claim_id,offer_id,offer_version,community_id,buyer_user_id,environment,stripe_account_id);
    CREATE TABLE partner_alert_stripe_role_reconciliations(operation_id,claim_id,environment,status,community_id,mapping_id,
      buyer_user_id,desired_present,created_at_ms);`);
  const base = qualifiedPaidInput();
  const offer = { offerId: base.offers[0]!.offer.offerId, offerVersion: 1 };
  const { communityId, mappingId, userId, linkedDiscordUserId } = ticket.context;
  const scope = { communityId, mappingId, userId };
  const refreshUserMapping = vi.fn(async () => true);
  const runOnce = vi.fn(async () => true);
  const reportFailure = vi.fn();
  const stop = startPartnerAlertStripeRoleReconciliation(db, {
    environment: "live", nowUtc: () => nowUtc, reportFailure, checkExistingWhopRoles: () => true,
    bind: () => ({ worker: { refreshUserMapping, runOnce }, authority: {
      inCurrentWriter: operation => operation(), isCurrent: () => current,
      refresh: async () => ({ ticket, authorityRevision: ticket.context.authorityRevision,
        linkedDiscordUserId, previousDiscordUserIds: [], input: { ...base,
          premium: premium === "active" ? base.premium : { ...base.premium!, state: premium,
            basis: premium === "inactive" ? "none" : "unknown", paidThroughUtc: null },
          existingWhopAccess: whop === "unavailable" ? undefined : {
            observedAtUtc: nowUtc, validUntilUtc: "2026-11-02T12:00:30.000Z",
            kind: whop === "retained" ? "retained" : "absent", retainedOffers: whop === "retained" ? [offer] : [],
          }, stripeFunding: { holdRemoval: false, paidOffers: whop === "overlap"
            ? [{ ...offer, paidThroughUtc: "2026-11-02T12:04:00.000Z" }] : [] },
        } }),
    } }),
  });
  await stop();
  expect(reportFailure).not.toHaveBeenCalled();
  if (removes) {
    expect(refreshUserMapping).toHaveBeenCalledExactlyOnceWith(scope);
    expect(runOnce).toHaveBeenCalledExactlyOnceWith(scope);
  } else {
    expect(refreshUserMapping).not.toHaveBeenCalled();
    expect(runOnce).not.toHaveBeenCalled();
  }
});

it.each(["active", "trialing", "completed", "unknown"])("keeps access unresolved when the membership is %s", async status => {
  const { membership, prove } = fixture();
  membership.status = status;
  await expect(prove()).resolves.toMatchObject({ kind: "unknown", retainedOffers: [] });
});

it.each(["canceled", "past_due"])("requires confirmed loss across all mapped products when the membership is %s", async status => {
  const { membership, transport, prove } = fixture();
  membership.status = status;
  const respond = transport.getMockImplementation()!;
  transport.mockImplementation((url, options) => url.endsWith("/access/prod_second")
    ? Promise.resolve(Response.json({ has_access: true, access_level: "customer" })) : respond(url, options));
  await expect(prove()).resolves.toMatchObject({ kind: "unknown" });
  transport.mockImplementation((url, options) => url.endsWith("/access/prod_second")
    ? Promise.resolve(new Response(null, { status: 403 })) : respond(url, options));
  await expect(prove()).resolves.toMatchObject({ kind: "unknown" });
  transport.mockImplementation(respond);
  await expect(prove()).resolves.toMatchObject({ kind: "absent", retainedOffers: [] });
});

it("does not use a membership for a different linked buyer", async () => {
  const { membership, prove } = fixture();
  membership.user_id = "user_other";
  await expect(prove()).resolves.toMatchObject({ kind: "unknown" });
});

it("rechecks an omitted paid membership by ID and excludes an unrelated product from the decision", async () => {
  const { membership, discovered, transport, prove } = fixture();
  discovered.splice(0, 1, { ...membership, id: "mem_other_product", product_id: "prod_unrelated",
    variant_id: null, status: "active" });
  await expect(prove()).resolves.toMatchObject({ kind: "absent", retainedOffers: [] });
  expect(transport.mock.calls.map(([url]) => new URL(url).pathname)).toContain("/api/v1/memberships/mem_paid");

  membership.status = "past_due";
  const respond = transport.getMockImplementation()!;
  transport.mockImplementation((url, options) => url.endsWith("/access/prod_channel")
    ? Promise.resolve(Response.json({ has_access: true, access_level: "customer" })) : respond(url, options));
  await expect(prove()).resolves.toMatchObject({ kind: "retained", retainedOffers: [
    { offerId: qualifiedPaidInput().offers[0]!.offer.offerId, offerVersion: 1 },
  ] });
  transport.mockImplementation(respond);
  await expect(prove()).resolves.toMatchObject({ kind: "absent", retainedOffers: [] });
});

it.each([404, 503])("holds the role when an omitted membership lookup returns HTTP %s", async status => {
  const { discovered, transport, prove } = fixture();
  discovered.length = 0;
  const respond = transport.getMockImplementation()!;
  transport.mockImplementation((url, options) => new URL(url).pathname === "/api/v1/memberships/mem_paid"
    ? Promise.resolve(new Response(null, { status })) : respond(url, options));
  await expect(prove()).resolves.toMatchObject({ kind: "unknown", retainedOffers: [] });
  expect(transport.mock.calls.some(([url]) => url.includes("/access/"))).toBe(false);
});

it.each(["account", "id", "user_id", "product_id", "variant_id"] as const)(
  "holds the role when an omitted membership has the wrong %s", async field => {
    const { membership, discovered, transport, prove } = fixture();
    discovered.length = 0;
    const respond = transport.getMockImplementation()!;
    transport.mockImplementation((url, options) => new URL(url).pathname === "/api/v1/memberships/mem_paid"
      ? Promise.resolve(Response.json({ ...membership, [field]: field === "account" ? { id: "biz_other" } : "wrong" }))
      : respond(url, options));
    await expect(prove()).resolves.toMatchObject({ kind: "unknown", retainedOffers: [] });
  });

it.each(["active", "past_due"])("recognizes a previously paid and assigned buyer when Whop still grants %s access", async status => {
  const { db, ticket, membership, transport, prove } = fixture();
  membership.status = status;
  const respond = transport.getMockImplementation()!;
  transport.mockImplementation((url, options) => url.endsWith("/access/prod_channel")
    ? Promise.resolve(Response.json({ has_access: true, access_level: "customer" })) : respond(url, options));
  await expect(prove()).resolves.toMatchObject({ kind: "retained", retainedOffers: [
    { offerId: qualifiedPaidInput().offers[0]!.offer.offerId, offerVersion: 1 },
  ] });
  db.prepare("UPDATE partner_alert_role_jobs SET discord_user_id=?").run(`${ticket.context.linkedDiscordUserId}9`);
  await expect(prove()).resolves.toMatchObject({ kind: "unknown", retainedOffers: [] });
});
