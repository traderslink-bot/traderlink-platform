import { describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { qualifyPartnerAlertCatalogCheckout, readPartnerAlertCatalog,
  readPartnerAlertCatalogCandidates, readPartnerAlertStripeCatalogCandidates, type PartnerAlertCatalogCandidate } from "./partner-alert-catalog-read";

const userId = "10000000-0000-4000-8000-000000000001";
const communityId = "20000000-0000-4000-8000-000000000002";
const offerId = "30000000-0000-4000-8000-000000000003";
const mappingId = "40000000-0000-4000-8000-000000000004";

function database(input: Readonly<{ membershipCount?: number; tables?: readonly string[]; empty?: boolean }> = {}): Database.Database {
  const tables = input.tables ?? [
    "partner_alert_partners",
    "partner_alert_mappings",
    "partner_alert_offers",
    "partner_alert_offer_channels",
    "partner_alert_memberships",
  ];
  const offer = {
    offerId,
    communityId,
    version: 1,
    kind: "channel",
    title: "Morning alerts",
    mappingIds: [mappingId],
    currency: { code: "USD", minorUnitDigits: 2 },
    amountMinor: 2500,
    cadence: { unit: "calendar_month", count: 1 },
    whop: { environment: "live", accountId: "biz_partner", productId: "prod_alerts", planId: "plan_monthly" },
  };
  return {
    readonly: true,
    prepare(sql: string) {
      if (sql.includes("sqlite_master")) return { all: () => tables.map((name) => ({ name })) };
      if (sql.includes("FROM partner_alert_partners")) return { all: (binding: { buyerUserId: string }) => {
        expect(binding.buyerUserId).toBe(userId);
        if (input.empty) return [];
        return [{ community_id: communityId, display_name: "Market Desk", offer_json: JSON.stringify(offer),
          sale_state: "open", has_purchase: input.membershipCount ?? 0 }];
      } };
      if (sql.includes("FROM partner_alert_mappings")) return { all: (actualCommunityId: string, actualMappingId: string) => {
        expect([actualCommunityId, actualMappingId]).toEqual([communityId, mappingId]);
        return [{ mapping_id: mappingId, display_name: "Morning alerts" }];
      } };
      throw new Error("Unexpected catalog query.");
    },
  } as unknown as Database.Database;
}

describe("Partner Channel subscriber catalog projection", () => {
  it("returns buyer-safe display data and a stored approved price", () => {
    expect(readPartnerAlertCatalog(database(), userId, () => true)).toEqual({
      kind: "available",
      items: [{
        communityId,
        offerKey: `${offerId}:1`,
        communityName: "Market Desk",
        channels: ["Morning alerts"],
        price: "$25.00",
        cadence: "month",
        access: "available",
        checkoutHref: null,
      }],
    });
  });

  it("does not turn an unqualified stored membership into subscribed access", () => {
    const result = readPartnerAlertCatalog(database({ membershipCount: 1 }), userId, () => true);
    expect(result.kind).toBe("available");
    if (result.kind === "available") expect(result.items[0]?.access).toBe("attention");
  });

  it("fails closed when the registered Partner schema is unavailable", () => {
    expect(readPartnerAlertCatalog(database({ tables: [] }), userId, () => true)).toEqual({ kind: "unavailable" });
  });

  it("fails closed without a current native offer qualification", () => {
    expect(readPartnerAlertCatalog(database(), userId)).toEqual({ kind: "unavailable" });
  });

  it("keeps a true empty catalog distinct from unavailable provider verification", async () => {
    const read = readPartnerAlertCatalogCandidates(database({ empty: true }), userId);
    expect(await qualifyPartnerAlertCatalogCheckout(read, null, new AbortController().signal,
      "2026-11-02T12:00:30.000Z")).toEqual({ kind: "available", items: [] });
  });

  it("projects only a current exact provider checkout proof after the private snapshot closes", async () => {
    const read = readPartnerAlertCatalogCandidates(database(), userId);
    const result = await qualifyPartnerAlertCatalogCheckout(read, async ({ offer }) => Object.freeze({
      checkoutHref: "https://whop.com/market-desk/checkout/plan_monthly",
      receipt: Object.freeze({ communityId: offer.communityId, communityOwnerUserId: userId,
        binding: offer.whop, offer, membershipVerificationAuthorised: true as const,
        observedAtUtc: "2026-11-02T12:00:00.000Z", validUntilUtc: "2026-11-02T12:01:00.000Z" }),
    }), new AbortController().signal, "2026-11-02T12:00:30.000Z");
    expect(result.kind).toBe("available");
    if (result.kind === "available") {
      expect(result.items[0]?.checkoutHref).toBe("https://whop.com/market-desk/checkout/plan_monthly");
      expect(JSON.stringify(result.items)).not.toContain("accountId");
      expect(JSON.stringify(result.items)).not.toContain("productId");
      expect(JSON.stringify(result.items)).not.toContain("planId");
    }
  });

  it("fails the whole catalog closed for foreign, expired or aborted checkout evidence", async () => {
    const read = readPartnerAlertCatalogCandidates(database(), userId);
    const proof = async ({ offer }: PartnerAlertCatalogCandidate) => ({
      checkoutHref: "https://evil.invalid/market-desk/checkout/plan_monthly",
      receipt: { communityId: offer.communityId, communityOwnerUserId: userId, binding: offer.whop, offer,
        membershipVerificationAuthorised: true as const, observedAtUtc: "2026-11-02T12:00:00.000Z",
        validUntilUtc: "2026-11-02T12:00:20.000Z" },
    });
    expect(await qualifyPartnerAlertCatalogCheckout(read, proof, new AbortController().signal,
      "2026-11-02T12:00:30.000Z")).toEqual({ kind: "unavailable" });
    const controller = new AbortController(); controller.abort();
    expect(await qualifyPartnerAlertCatalogCheckout(read, proof, controller.signal,
      "2026-11-02T12:00:10.000Z")).toEqual({ kind: "unavailable" });
  });

  it("keeps private Whop and Stripe purchase details when an offer can no longer be bought", async () => {
    const directory = mkdtempSync(join(tmpdir(), "partner-catalog-purchases-"));
    const location = join(directory, "catalog.sqlite");
    const writer = new Database(location);
    const reader = new Database(location, { readonly: true });
    const otherBuyer = "10000000-0000-4000-8000-000000000009";
    const stripeOfferId = "30000000-0000-4000-8000-000000000009";
    const secondMappingId = "40000000-0000-4000-8000-000000000005";
    try {
      writer.exec(`CREATE TABLE partner_alert_partners (community_id TEXT, display_name TEXT, status TEXT);
        CREATE TABLE partner_alert_mappings (community_id TEXT, mapping_id TEXT, display_name TEXT, review_state TEXT,
          approved_revision INTEGER, revision INTEGER, ever_approved INTEGER, delivery_state TEXT);
        CREATE TABLE partner_alert_offers (community_id TEXT, offer_id TEXT, version INTEGER, review_state TEXT,
          offer_json TEXT, whop_environment TEXT, whop_account_id TEXT);
        CREATE TABLE partner_alert_offer_channels (community_id TEXT, offer_id TEXT, offer_version INTEGER, mapping_id TEXT);
        CREATE TABLE partner_alert_memberships (user_id TEXT, community_id TEXT, offer_id TEXT, offer_version INTEGER,
          environment TEXT, whop_account_id TEXT);
        CREATE TABLE partner_alert_stripe_checkout_claims (buyer_user_id TEXT, community_id TEXT, offer_id TEXT,
          offer_version INTEGER, environment TEXT, stripe_subscription_id TEXT);`);
      writer.prepare("INSERT INTO partner_alert_partners VALUES (?, 'Market Desk', 'active')").run(communityId);
      writer.prepare("INSERT INTO partner_alert_mappings VALUES (?,?, 'Morning alerts','approved',1,1,1,'ready')").run(communityId, mappingId);
      writer.prepare("INSERT INTO partner_alert_mappings VALUES (?,?, 'News alerts','approved',1,1,1,'paused')").run(communityId, secondMappingId);
      const base = { communityId, kind: "channel", title: "Morning alerts", mappingIds: [mappingId],
        currency: { code: "USD", minorUnitDigits: 2 }, amountMinor: 2500, cadence: { unit: "calendar_month", count: 1 } };
      const legacy = { ...base, offerId, whop: { environment: "live", accountId: "biz_partner", productId: "prod_alerts", planId: "plan_monthly" } };
      const stripe = { ...base, offerId: stripeOfferId, billingProvider: "stripe" };
      const offer = writer.prepare("INSERT INTO partner_alert_offers VALUES (?,?,?, 'approved', ?,?,?)");
      const mapping = writer.prepare("INSERT INTO partner_alert_offer_channels VALUES (?,?,?,?)");
      for (const version of [1, 2]) {
        offer.run(communityId, offerId, version, JSON.stringify({ ...legacy, version }), "live", "biz_partner");
        mapping.run(communityId, offerId, version, mappingId);
      }
      offer.run(communityId, stripeOfferId, 1, JSON.stringify({ ...stripe, version: 1 }), null, null);
      mapping.run(communityId, stripeOfferId, 1, mappingId);
      writer.prepare("INSERT INTO partner_alert_memberships VALUES (?,?,?,1,'live','biz_partner')").run(userId, communityId, offerId);
      const claim = writer.prepare("INSERT INTO partner_alert_stripe_checkout_claims VALUES (?,?,?,1,'sandbox',?)");
      claim.run(userId, communityId, stripeOfferId, "sub_package");
      claim.run(otherBuyer, communityId, offerId, "sub_converted_whop");

      const legacyCards = (buyer: string, environment: "sandbox" | "live" = "sandbox") => {
        const read = readPartnerAlertCatalogCandidates(reader, buyer, environment);
        if (read.kind !== "available") throw new Error("Catalog fixture unavailable");
        return read.candidates.map(candidate => candidate.item);
      };
      expect(legacyCards(userId)).toMatchObject([
        { offerKey: `${offerId}:2`, access: "available" },
        { offerKey: `${offerId}:1`, saleState: "previous", billingProvider: "whop" },
      ]);
      writer.prepare("INSERT INTO partner_alert_offers VALUES (?,?,2,'draft',?,NULL,NULL)")
        .run(communityId, stripeOfferId, JSON.stringify({ ...stripe, version: 2, amountMinor: 3500,
          kind: "package", mappingIds: [mappingId, secondMappingId] }));
      mapping.run(communityId, stripeOfferId, 2, mappingId);
      mapping.run(communityId, stripeOfferId, 2, secondMappingId);
      const forBuyer = () => readPartnerAlertStripeCatalogCandidates(reader, { userId, environment: "sandbox" });
      expect(forBuyer().map(candidate => candidate.item)).toMatchObject([{ offerKey: `${stripeOfferId}:1`, price: "$25.00" }]);
      expect(forBuyer()[0]?.item.saleState).toBeUndefined();
      writer.prepare("UPDATE partner_alert_offers SET review_state='awaiting_approval' WHERE offer_id=? AND version=2").run(stripeOfferId);
      expect(forBuyer()[0]?.item.saleState).toBeUndefined();
      writer.prepare("UPDATE partner_alert_offers SET review_state='approved' WHERE offer_id=? AND version=2").run(stripeOfferId);
      expect(forBuyer().map(candidate => candidate.item)).toMatchObject([{ offerKey: `${stripeOfferId}:1`, saleState: "previous" }]);
      expect(readPartnerAlertStripeCatalogCandidates(reader, { userId: otherBuyer, environment: "sandbox" })).toEqual([]);
      expect(legacyCards(userId)[0]).toMatchObject({ offerKey: `${offerId}:2`, access: "available" });
      writer.prepare("UPDATE partner_alert_mappings SET delivery_state='ready' WHERE mapping_id=?").run(secondMappingId);
      expect(forBuyer().map(candidate => candidate.item)).toMatchObject([
        { offerKey: `${stripeOfferId}:2`, price: "$35.00", channels: ["Morning alerts", "News alerts"] },
        { offerKey: `${stripeOfferId}:1`, price: "$25.00", saleState: "previous" },
      ]);
      writer.prepare("UPDATE partner_alert_mappings SET delivery_state='paused' WHERE mapping_id=?").run(mappingId);
      expect(forBuyer().map(candidate => candidate.item)).toMatchObject([{ offerKey: `${stripeOfferId}:1`, saleState: "paused" }]);
      expect(legacyCards(userId)).toMatchObject([{ offerKey: `${offerId}:1`, saleState: "paused" }]);
      writer.prepare("UPDATE partner_alert_mappings SET delivery_state='ready' WHERE mapping_id=?").run(mappingId);
      writer.prepare("UPDATE partner_alert_offers SET review_state='withdrawn' WHERE offer_id=? AND version=2").run(stripeOfferId);
      expect(forBuyer().map(candidate => candidate.item)).toMatchObject([{ offerKey: `${stripeOfferId}:1`, saleState: "previous" }]);
      writer.exec("UPDATE partner_alert_partners SET status='publishing_paused'");
      expect(legacyCards(userId)).toMatchObject([{ offerKey: `${offerId}:1`, saleState: "paused", billingProvider: "whop" }]);
      expect(legacyCards(otherBuyer)).toMatchObject([{ offerKey: `${offerId}:1`, saleState: "paused", billingProvider: "stripe" }]);
      expect(legacyCards(otherBuyer, "live")).toEqual([]);
      expect(readPartnerAlertStripeCatalogCandidates(reader, { userId, environment: "sandbox" })).toMatchObject([
        { item: { offerKey: `${stripeOfferId}:1`, saleState: "paused", billingProvider: "stripe" } },
      ]);
      expect(readPartnerAlertStripeCatalogCandidates(reader, { userId: otherBuyer, environment: "sandbox" })).toEqual([]);
      const pausedRead = readPartnerAlertCatalogCandidates(reader, userId, "sandbox");
      expect(await qualifyPartnerAlertCatalogCheckout(pausedRead, null, new AbortController().signal, "2026-11-02T12:00:30.000Z", {
        userId, verify: async () => "subscribed",
      })).toMatchObject({ kind: "available", items: [{ saleState: "paused", checkoutHref: null, access: "subscribed" }] });

      writer.exec("UPDATE partner_alert_partners SET status='ended'");
      writer.exec("UPDATE partner_alert_mappings SET review_state='withdrawn', approved_revision=NULL");
      expect(legacyCards(userId)).toMatchObject([{ saleState: "closed", access: "attention", channels: ["Morning alerts"] }]);
      expect(readPartnerAlertStripeCatalogCandidates(reader, { userId, environment: "sandbox" })).toMatchObject([
        { item: { saleState: "closed", access: "attention", channels: ["Morning alerts"] } },
      ]);
    } finally {
      reader.close(); writer.close();
      rmSync(directory, { recursive: true });
    }
  });
});
