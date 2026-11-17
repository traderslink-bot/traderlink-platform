import type { Metadata } from "next";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { partnerAlertStripeSandbox } from "@/src/modules/partner-alerts/server/partner-alert-stripe-sandbox-runtime";
import { withPartnerAlertRequestRuntime } from "@/src/modules/partner-alerts/server/partner-alert-request-runtime";
import { readPartnerAlertStripeBillingConfiguration } from "@/src/modules/partner-alerts/server/partner-alert-stripe-billing-runtime";

import { requireCommunityOwnerReviewPageIdentity } from "@/src/modules/communities/server/community-owner-review-request-identity";
import { openReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { createPartnerAlertCatalogCheckoutRuntime } from "@/src/modules/partner-alerts/server/partner-alert-catalog-checkout";
import { qualifyPartnerAlertCatalogCheckout,
  readPartnerAlertCatalogCandidates, readPartnerAlertStripeCatalogCandidates } from "@/src/modules/partner-alerts/server/partner-alert-catalog-read";
import { readPartnerAlertCatalogRuntimeConfiguration, resolvePartnerAlertWhopReadEnvironment } from "@/src/modules/partner-alerts/server/partner-alert-catalog-runtime-configuration";
import { PartnerChannelCatalog, type PartnerChannelCatalogItem } from "./partner-channel-catalog";

export const metadata: Metadata = { title: "Partner Channels | TraderLink Platform" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PartnerChannelsPage() {
  const { scope } = await requireCommunityOwnerReviewPageIdentity();
  const request = new NextRequest(new URL("/partner-channels",
    process.env.TRADERLINK_PLATFORM_PUBLIC_ORIGIN ?? "http://localhost"), { headers: new Headers([...await headers()]) });
  const stripeSandbox = partnerAlertStripeSandbox(request);
  const sandboxItems = await stripeSandbox?.readCatalog?.(scope.userId);
  if (sandboxItems) {
    return <PartnerChannelCatalog catalogStatus="ready" premiumStatus="active" items={sandboxItems.map(item => ({
      ...item, billingProvider: "stripe", stripeCheckout: stripeSandbox!.canOfferCheckout(scope.userId, item.communityId, item.offerKey),
    }))} />;
  }
  // Authentication always completes before runtime configuration, credential
  // lookup or provider work. The feature remains disabled unless every
  // server-only checkout variable is explicitly installed.
  const runtime = readPartnerAlertCatalogRuntimeConfiguration(process.env);
  const database = openReadonlyPlatformDatabase();
  type Catalog = Awaited<ReturnType<typeof qualifyPartnerAlertCatalogCheckout>>;
  type Card = PartnerChannelCatalogItem;
  let catalog: Catalog;
  const cards = new Map<string, Card>();
  const stripeCards = new Map<string, Card>();
  const cardKey = (item: Pick<Card, "communityId" | "offerKey">) => JSON.stringify([item.communityId, item.offerKey]);
  try {
    const billing = readPartnerAlertStripeBillingConfiguration();
    const buyer = { userId: scope.userId, environment: billing?.environment ?? "live" } as const;
    const candidates = readPartnerAlertCatalogCandidates(database, scope.userId, buyer.environment,
      resolvePartnerAlertWhopReadEnvironment(billing?.environment));
    const legacyOffers = candidates.kind === "available" ? candidates.candidates : [];
    const stripeOffers = readPartnerAlertStripeCatalogCandidates(database, buyer);
    for (const { item } of [...legacyOffers, ...stripeOffers]) {
      if (item.saleState) cards.set(cardKey(item), { ...item, checkoutHref: null });
    }
    const qualifier = runtime ? createPartnerAlertCatalogCheckoutRuntime({ database,
      credentialKeys: runtime.credentialKeys, maximumEvidenceAgeMs: runtime.maximumEvidenceAgeMs,
      nowUtc: () => new Date().toISOString(), transport: (url, options) => fetch(url, options) }) : null;
    const qualify = (verify?: Parameters<typeof qualifyPartnerAlertCatalogCheckout>[4]) =>
      qualifyPartnerAlertCatalogCheckout(candidates, qualifier, AbortSignal.timeout(10_000), new Date().toISOString(), verify);
    const projected = await withPartnerAlertRequestRuntime<Catalog | null>(request, async access => {
      if (billing) {
        const signal = AbortSignal.timeout(10_000);
        for (const { item, offer } of [...stripeOffers, ...legacyOffers]) {
          if (item.saleState === "closed") continue;
          const status = signal.aborted ? null : await access.readStripeCatalogOffer({ userId: scope.userId,
            communityId: offer.communityId, offerId: offer.offerId, offerVersion: offer.version,
            mappingIds: offer.mappingIds }, signal);
          if (status) {
            const covered = new Set(status.coveredMappingIds);
            stripeCards.set(cardKey(item), { ...item, access: status.access, checkoutHref: null,
              billingProvider: status.billingProvider ?? item.billingProvider ?? "stripe", destinations: status.destinations,
              coveredChannels: item.channels.filter((_, index) => covered.has(offer.mappingIds[index])),
              stripeCheckout: !item.saleState && status.canCheckout });
          }
          else if ("billingProvider" in offer) stripeCards.set(cardKey(item), { ...item, checkoutHref: null,
            billingProvider: "stripe" });
        }
      }
      return qualify({ userId: scope.userId, verify: access.readSubscriberOfferState });
    }, undefined, () => null);
    catalog = projected ?? await qualify();
  } finally { database.close(); }
  if (catalog.kind === "available") {
    for (const item of catalog.items) cards.set(cardKey(item), { ...item, checkoutHref: null,
      stripeCheckout: !item.saleState && stripeSandbox?.canOfferCheckout(scope.userId, item.communityId, item.offerKey) === true });
  }
  for (const [key, item] of stripeCards) cards.set(key, item);
  return <PartnerChannelCatalog
    catalogStatus={catalog.kind === "available" || cards.size > 0 ? "ready" : "unavailable"}
    items={[...cards.values()]}
    premiumStatus={[...cards.values()].some(item => item.access === "subscribed" || item.stripeCheckout)
      ? "active" : "unavailable"}
  />;
}
