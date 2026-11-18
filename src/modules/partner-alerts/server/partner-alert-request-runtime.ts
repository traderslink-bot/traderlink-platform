import { partnerAlertOwnerEvidenceTarget,refreshPartnerAlertOwnerEvidence } from "./partner-alert-owner-evidence-refresh";
import { isPartnerAlertReviewDiscordTarget } from "./partner-alert-review-discord";
import "server-only";

import { createPartnerAlertReviewDiscordRoleRest as createPartnerAlertDiscordRoleRest, createPartnerAlertReviewDiscordResourceVerifier as createPartnerAlertDiscordResourceVerifier, createPartnerAlertReviewDiscordChannelCatalog as createPartnerAlertDiscordChannelCatalog, createPartnerAlertReviewDiscordRoleObserver as createPartnerAlertDiscordRoleObserver } from "./partner-alert-review-discord";

import { createHash, randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";

import { resolvePlatformPublicOrigin } from "../../platform/server/authentication/platform-public-origin";
import { partnerAlertStripeSandboxOriginMatches } from "./partner-alert-stripe-request-origin";
import { resolveTraderLinkDiscordGuildId } from "../../platform/server/authentication/platform-discord-configuration";
import { requireJournalAdminMutationRequest } from "../../platform/server/administration/platform-admin-request-security";
import { readPartnerAlertRequestJson } from "./partner-alert-request-boundary";
import { requirePlatformMutationRequest } from "../../platform/server/authentication/platform-mutation-request-security";
import { openPlatformDatabase } from "../../platform/server/database/open-platform-database";
import { platformPaidStripeConnectBillingMigration } from "../../platform/server/database/migrations/0209_platform_paid_stripe_connect_billing";
import { calculatePlatformMigrationChecksum } from "../../platform/server/database/platform-migration-contract";
import { readAppliedPlatformMigrations } from "../../platform/server/database/platform-migration-registry";
import { PlatformErasureAdmission } from "../../platform/server/privacy/platform-erasure-admission";
import { PLATFORM_PREMIUM_ROLE_SCHEMA_SQL_CURRENT_ACCESS as PLATFORM_PREMIUM_ROLE_SCHEMA_SQL } from "../../platform/server/membership/platform-premium-role-current-access-schema";
import { readPartnerAlertRequestUserPremium, type PartnerAlertCatalogPremiumRead } from "./partner-alert-request-user-premium";
import { createPartnerAlertRequestPremiumBinder } from "./partner-alert-request-premium-binding";
import { readPartnerAlertIsolatedStaging } from "./partner-alert-isolated-staging";
import { checkPartnerAlertSubscriberAccess, verifyPartnerAlertSubscriberOffer, type PartnerAlertDiscordDestination,
  type PartnerAlertSubscriberOffer, type PartnerAlertSubscriberRoleObserver } from "./partner-alert-subscriber-access";
import type { PartnerAlertContextTicket } from "../contracts/partner-alert-contracts";
import { partnerAlertSnowflake, partnerAlertText } from "../contracts/partner-alert-validation";
import { parsePartnerAlertRoleReview, removeReviewedPartnerAlertRole } from "./partner-alert-manual-role-review";
import { createPartnerAlertManagedRoleTransport } from "./partner-alert-managed-role-transport";

import { resolvePartnerAlertWhopReadEnvironment } from "./partner-alert-catalog-runtime-configuration";
import { resolvePartnerAlertWhopVerificationContext } from "./partner-alert-catalog-checkout";
import { PartnerAlertWhopInbox } from "./partner-alert-whop-inbox";
import type { PartnerAlertWhopWebhookScope } from "./partner-alert-whop-webhook";
import { PartnerAlertAdmission } from "./partner-alert-admission";
import { PartnerAlertHttpAdapter } from "./partner-alert-http";
import { PartnerAlertRequestWriter, type PartnerAlertPrivateRequestScope } from "./partner-alert-request-writer";
import { createPartnerAlertProviderVerifier } from "./partner-alert-provider-adapter";

import type { PartnerAlertRoleAuthority } from "./partner-alert-role-worker";

import { partnerAlertOutputBindingMatches,
  readPartnerAlertDiscordOutputConfiguration, readPartnerAlertProviderRuntimeConfiguration,
  readPartnerAlertPublishingPricingCapabilities, type PartnerAlertDiscordOutputConfiguration } from "./partner-alert-provider-runtime-configuration";
import { createPartnerAlertWhopOfferVerifier } from "./partner-alert-whop-provider-verification";
import { bindPartnerAlertNativeSubscriber, resolvePartnerAlertRegisteredPremiumRole } from "./partner-alert-native-runtime";
import { evaluatePartnerAlertChannelAccess } from "../contracts/partner-alert-access-policy";
import { PARTNER_ALERT_SCHEMA_STATEMENTS } from "./database/partner-alert-schema";
import { PARTNER_ALERT_CONTEXT_SCHEMA_STATEMENTS } from "./partner-alert-current-context";
import { createPartnerAlertStripeConnect } from "./partner-alert-stripe-checkout";
import { createPartnerAlertStripeAccountClient, createPartnerAlertStripeHostedSeller, openPartnerAlertStripeOnboardingLink,
  partnerStripeSellerStatus, type PartnerStripeSellerStatus } from "./partner-alert-stripe-onboarding";
import { beginPartnerStripeSetup, claimPartnerStripeOAuth, findPartnerStripeOAuthScope,
  readPartnerStripeSetupSeller, requirePartnerStripeSetupAttempt } from "./database/partner-alert-stripe-onboarding-attempt";
import { PARTNER_ALERT_STRIPE_ONBOARDING_ATTEMPT_STATEMENTS } from "./database/partner-alert-stripe-onboarding-attempt-schema";
import { exchangePartnerStripeOAuth, partnerStripeOAuthAuthorizeUrl, validPartnerStripeOAuthCode } from "./partner-alert-stripe-oauth";
import { recordPartnerAlertStripeSeller } from "./database/partner-alert-stripe-seller-writer";
import { hasPartnerAlertStripeCheckoutClosure } from "./database/partner-alert-stripe-checkout-attempt";
import { createPartnerAlertStripeInvoiceWebhook } from "./partner-alert-stripe-invoice-webhook";
import { createPartnerAlertNativeStripeCheckout } from "./partner-alert-stripe-native-checkout";
import { preparePartnerAlertStripeCheckoutEligibility } from "./partner-alert-stripe-checkout-eligibility";
import { partnerStripeId } from "./partner-alert-stripe-paid-invoice";
import { readPartnerAlertStripeBillingConfiguration } from "./partner-alert-stripe-billing-runtime";

const ENABLED_ENV = "PARTNER_ALERT_REQUEST_RUNTIME_ENABLED";
const CATALOG_SHA_ENV = "PARTNER_ALERT_ERASURE_PROFILE_CATALOG_SHA256";
const OUTPUT_BOT_ENV = "PARTNER_ALERT_OUTPUT_BOT_USER_ID";
const OUTPUT_CONFIGURATION_REF_ENV = "PARTNER_ALERT_OUTPUT_CONFIGURATION_REF";
const SHA256 = /^[0-9a-f]{64}$/u;
const SNOWFLAKE = /^[1-9][0-9]{0,19}$/u;
const REF = /^[A-Za-z0-9_:-]{1,160}$/u;

export type PartnerAlertRequestRuntime = Readonly<{
  http: PartnerAlertHttpAdapter;
  readUserPremium: (userId:string) => Promise<PartnerAlertCatalogPremiumRead>;
  receiveWhopEvent: (scope: PartnerAlertWhopWebhookScope,
    input: Parameters<PartnerAlertWhopInbox["receiveSignedEvent"]>[0]) => void;
  reviewSubscriberRole: (request: Request) => Promise<Response>;
  reviewStripeAdjustment: (request: Request, communityId: string) => Promise<Response>;
  receiveStripeBillingEvent: (request: Request) => Promise<Response>;
  startStripeCheckout: (request: Request, communityId: string, offerKey: string) => Promise<Response>;
  readStripeSeller: (request: Request, communityId: string, ownerUserId: string) =>
    Promise<Readonly<{ accountId: string | null; status: PartnerStripeSellerStatus }> | null>;
  startStripeSellerSetup: (request: Request, communityId: string, ownerUserId: string, method: "hosted" | "oauth",
    country: string, returnUrl: string) => Promise<Readonly<{ kind: "connected" } | { kind: "link"; url: string | null }>>;
  completeStripeSellerSetup: (request: Request, ownerUserId: string, state: string, code: string | null) => Promise<string | null>;
  readStripeCatalogOffer: (target: PartnerAlertSubscriberOffer, signal: AbortSignal) =>
    Promise<Readonly<{ access: "available" | "attention" | "subscribed"; canCheckout: boolean;
      billingProvider?: "whop"; destinations?: readonly PartnerAlertDiscordDestination[];
      coveredMappingIds?: readonly string[] }> | null>;
  writer: PartnerAlertRequestWriter;
  readSourceChannels: (request: Request, communityId: string) => Promise<Response>;
  checkSubscriberAccess: (request: Request, communityId: string, offerKey: string) => Promise<Response>;
  readSubscriberOfferState: (expected: PartnerAlertSubscriberOffer, signal: AbortSignal) =>
    ReturnType<typeof verifyPartnerAlertSubscriberOffer>;
}>;

const privateHeaders = { "cache-control": "private, no-store, max-age=0", pragma: "no-cache",
  "x-content-type-options": "nosniff", vary: "Cookie" } as const;
function runtimeResponse(status: number, body: unknown): Response {
  return Response.json(body, { status, headers: privateHeaders });
}
function providerConfigurationFingerprint(value: PartnerAlertDiscordOutputConfiguration): string {
  return createHash("sha256").update(JSON.stringify({ ...value,
    discordBotToken: createHash("sha256").update(value.discordBotToken).digest("hex") })).digest("hex");
}

function unavailable(): Response {
  return Response.json({ ok: false, code: "unavailable",
    message: "Partner channel settings are temporarily unavailable." }, {
    status: 503,
    headers: { "cache-control": "private, no-store, max-age=0", pragma: "no-cache",
      "x-content-type-options": "nosniff", vary: "Cookie" },
  });
}

/** Request-scoped application composition. Missing configuration, catalog,
 * schema or admission returns a private 503 before any route can read or write.
 * Provider verification is separately disabled and binds only when every
 * credential, intent, output-registry and pricing input qualifies. */
type SubscriberBinder = (input: Readonly<{
  database: ReturnType<typeof openPlatformDatabase>;
  writer: PartnerAlertRequestWriter;
  admission: PlatformErasureAdmission;
}>) => PartnerAlertRoleAuthority | null;

export function withPartnerAlertRequestRuntime(
  request: NextRequest, operation: (runtime: PartnerAlertRequestRuntime) => Response | Promise<Response>,
  binder?: SubscriberBinder,
): Promise<Response>;
export function withPartnerAlertRequestRuntime<T>(
  request: NextRequest, operation: (runtime: PartnerAlertRequestRuntime) => T | Promise<T>,
  binder: SubscriberBinder | undefined, fallback: () => T,
): Promise<T>;
export async function withPartnerAlertRequestRuntime<T>(
  request: NextRequest,
  operation: (runtime: PartnerAlertRequestRuntime) => T | Promise<T>,
  bindSubscriberAuthority?: SubscriberBinder,
  fallback?: () => T,
): Promise<T | Response> {
  const unavailableResult = fallback ?? unavailable;
  const environment = process.env;
  const catalogSha256 = environment[CATALOG_SHA_ENV];
  const outputBotUserId = environment[OUTPUT_BOT_ENV];
  const outputConfigurationRef = environment[OUTPUT_CONFIGURATION_REF_ENV];
  if (environment[ENABLED_ENV] !== "true" || !catalogSha256 || !SHA256.test(catalogSha256)
    || !outputBotUserId || !SNOWFLAKE.test(outputBotUserId)
    || (outputBotUserId.length === 20 && outputBotUserId > "18446744073709551615")
    || !outputConfigurationRef || !REF.test(outputConfigurationRef)) return unavailableResult();
  let database: ReturnType<typeof openPlatformDatabase> | null = null;
  let premiumRequestBinder: ReturnType<typeof createPartnerAlertRequestPremiumBinder> | null = null;
  try {
    database = openPlatformDatabase({ mode: "runtime", environment });
    const admission = PlatformErasureAdmission.bind(database, {
      nowUtc: () => new Date().toISOString(),
      maximumAdmissionMs: 30_000,
      participantStatements: [...PARTNER_ALERT_SCHEMA_STATEMENTS, ...PLATFORM_PREMIUM_ROLE_SCHEMA_SQL,
        ...PARTNER_ALERT_CONTEXT_SCHEMA_STATEMENTS],
      profileCatalogSha256: catalogSha256,
    });
    const partnerAdmission = PartnerAlertAdmission.bind(database);
    const stripeMigrationInstalled = () => {
      const migration = platformPaidStripeConnectBillingMigration;
      const installed = readAppliedPlatformMigrations(database!).find(row => row.migration_id === migration.migrationId);
      return installed?.execution_order === migration.executionOrder && installed.checksum_sha256 === calculatePlatformMigrationChecksum(migration);
    };
    const destinationGuildId = resolveTraderLinkDiscordGuildId(environment);
    const billing = readPartnerAlertStripeBillingConfiguration();
    const stripeFundingEnvironment = billing
      && (billing.environment === "live" || environment.PARTNER_STRIPE_DISCORD_GUILD_ID === destinationGuildId)
      && stripeMigrationInstalled() ? billing.environment : undefined;
    const whopEnvironment = resolvePartnerAlertWhopReadEnvironment(stripeFundingEnvironment, environment);
    const stripePremiumRole = stripeFundingEnvironment ? resolvePartnerAlertRegisteredPremiumRole(database,
      destinationGuildId, environment.TRADERLINK_DISCORD_PREMIUM_MEMBER_ROLE_ID) : null;
    if (stripeFundingEnvironment) admission.qualifyAdditionalStatements(platformPaidStripeConnectBillingMigration.statements);
    const writer = new PartnerAlertRequestWriter(database, {
      environment,
      now: () => new Date(),
      createId: randomUUID,
      destinationGuildId: resolveTraderLinkDiscordGuildId(environment),
      maximumActorAgeMs: 30_000,
      maximumDiscordEvidenceAgeMs: 300_000,
      outputBotUserId,
      outputConfigurationRef, stripeEnvironment: stripeFundingEnvironment, whopEnvironment,
      subscriberAccessQualified: () => stripePremiumRole !== null,
    });
    const providerConfiguration = readPartnerAlertProviderRuntimeConfiguration(environment,
      outputBotUserId, outputConfigurationRef);
    const readDiscordConfiguration = () => stripeFundingEnvironment
      ? readPartnerAlertDiscordOutputConfiguration(environment, outputBotUserId, outputConfigurationRef)
      : readPartnerAlertProviderRuntimeConfiguration(environment, outputBotUserId, outputConfigurationRef);
    const discordConfiguration = readDiscordConfiguration();
    const ownerTarget = partnerAlertOwnerEvidenceTarget(request);
    if (ownerTarget && discordConfiguration) {
      const fingerprint = discordConfiguration ? providerConfigurationFingerprint(discordConfiguration) : null;
      const refreshed = await refreshPartnerAlertOwnerEvidence({ database,admission,request,environment,target: ownerTarget,
        botToken: discordConfiguration?.discordBotToken ?? "",configurationIsCurrent: () => {
          const current = readDiscordConfiguration();
          return fingerprint !== null && current !== null && providerConfigurationFingerprint(current) === fingerprint;
        } });
      if (refreshed === "unavailable") return unavailableResult();
    }
    const messageContentEnabled = environment.PARTNER_ALERT_DISCORD_MESSAGE_CONTENT_INTENT_ENABLED === "true";
    const pricingCapabilities = providerConfiguration?.pricingCapabilities
      ?? (stripeFundingEnvironment ? readPartnerAlertPublishingPricingCapabilities(environment) : null);
    const providerVerifier = createPartnerAlertProviderVerifier({
      verifyDiscordResources: discordConfiguration && messageContentEnabled ? createPartnerAlertDiscordResourceVerifier({
        botToken: discordConfiguration.discordBotToken,
        botUserId: discordConfiguration.discordBotUserId,
        messageContentIntentEnabled: true,
        maximumEvidenceAgeMs: discordConfiguration.discordMaximumEvidenceAgeMs,
        nowUtc: () => new Date().toISOString(),
        transport: (url, init) => fetch(url, init),
        isDestinationRoleExclusive: target => partnerAlertOutputBindingMatches(
          discordConfiguration.outputBindings, target),
      }) : async () => { throw new Error("Discord resource verification is unavailable."); },
      verifyWhopOffer: providerConfiguration ? createPartnerAlertWhopOfferVerifier({ database,
        credentialKeys: providerConfiguration.credentialKeys,
        maximumEvidenceAgeMs: providerConfiguration.maximumEvidenceAgeMs,
        nowUtc: () => new Date().toISOString(), transport: (url, init) => fetch(url, init) }) : async () => {
        throw new Error("Whop offer verification is unavailable.");
      },
      verifyStripeOffer: async (target, signal) => {
        const stripe = configuredStripeBilling();
        if (!stripe || !stripeFundingEnvironment || signal.aborted) throw new Error("Stripe offer verification is unavailable.");
        const seller = database!.prepare(`SELECT s.stripe_account_id,s.owner_user_id FROM partner_alert_stripe_sellers s
          JOIN traderlink_communities c ON c.community_id=s.community_id AND c.owner_user_id=s.owner_user_id
          WHERE s.community_id=? AND s.environment=? AND s.state!='disconnected' AND s.stripe_account_id IS NOT NULL AND c.status!='removed'`)
          .get(target.communityId, stripe.config.environment) as { stripe_account_id: string; owner_user_id: string } | undefined;
        if (!seller) throw new Error("The community’s Stripe seller is unavailable.");
        const status = partnerStripeSellerStatus(await stripe.connect.readSeller(seller.stripe_account_id), seller.stripe_account_id, stripe.config.environment);
        if (signal.aborted || status !== "ready") throw new Error("The community’s Stripe seller is unavailable.");
        const observed = Date.now();
        return { communityId: target.communityId, communityOwnerUserId: seller.owner_user_id,
          sellerAccountId: seller.stripe_account_id, environment: stripe.config.environment, offer: target.offer,
          observedAtUtc: new Date(observed).toISOString(), validUntilUtc: new Date(observed + 30_000).toISOString() };
      },
      readPricingCapabilities: async signal => {
        if (signal.aborted) throw new Error("Partner provider verification was cancelled.");
        if (!pricingCapabilities) throw new Error("Publishing pricing verification is unavailable.");
        return pricingCapabilities;
      },
    });
    const channelCatalog = discordConfiguration ? createPartnerAlertDiscordChannelCatalog({
      botToken: discordConfiguration.discordBotToken, botUserId: discordConfiguration.discordBotUserId,
      maximumDurationMs: 10_000,
      transport: (url, init) => fetch(url, init),
    }) : null;
    const readVerifiedSource = async (incoming: Request, communityId: string, expectedRevision?: number, refresh = false) => {
      if (!channelCatalog || !discordConfiguration) throw new Error("Discord source unavailable");
      const configurationFingerprint = providerConfigurationFingerprint(discordConfiguration);
      const target = writer.preauthorizeSourceChannelCatalog(incoming, communityId);
      if (expectedRevision !== undefined && target.partnerRevision !== expectedRevision) {
        throw new Error("Discord source revision changed");
      }
      const source = await channelCatalog(target.sourceGuildId, incoming.signal);
      const currentConfiguration = readDiscordConfiguration();
      if (!currentConfiguration || providerConfigurationFingerprint(currentConfiguration) !== configurationFingerprint) {
        throw new Error("Discord source configuration changed");
      }
      writer.revalidateSourceChannelCatalog(incoming, target, refresh ? source : undefined);
      return source;
    };
    const http = new PartnerAlertHttpAdapter({ enabled: true }, {
      configuredOrigin: resolvePlatformPublicOrigin(request),
    }, writer, providerVerifier, async (incoming, command) => {
      if (command.action !== "savePartnerDraft" && command.action !== "saveMappingDraft") return;
      const source = await readVerifiedSource(incoming, command.communityId, command.expectedRevision);
      const name = command.action === "savePartnerDraft" ? source.guildName
        : source.channels.find(channel => channel.channelId === command.sourceChannelId)?.name;
      if (!name || command.displayName !== name) throw new Error("Discord source name changed");
    });
    const readSourceChannels = async (incoming: Request, communityId: string): Promise<Response> => {
      if (incoming.method !== "GET" && incoming.method !== "POST") return runtimeResponse(405, { ok: false, code: "method_not_allowed" });
      try {
        const refresh = incoming.method === "POST";
        if (refresh) requirePlatformMutationRequest(incoming);
        const source = await readVerifiedSource(incoming, communityId, undefined, refresh);
        return runtimeResponse(200, { ok: true, result: { communityId, ...source } });
      } catch { return runtimeResponse(503, { ok: false, code: "unavailable" }); }
    };
    const bound = bindSubscriberAuthority?.({ database, writer, admission });
    const nowUtc = () => new Date().toISOString();
    const observer = discordConfiguration ? createPartnerAlertDiscordRoleObserver({
      botToken: discordConfiguration.discordBotToken, botUserId: discordConfiguration.discordBotUserId,
      maximumDurationMs: 5_000, transport: (url, init) => fetch(url, init),
    }, nowUtc) : null;
    let lastObservation: Readonly<{ guildId: string; discordUserId: string; value: ReturnType<PartnerAlertSubscriberRoleObserver> }> | null = null;
    const observable: PartnerAlertSubscriberRoleObserver | undefined = observer && discordConfiguration
      ? async (target, signal) => {
        if (!lastObservation || lastObservation.guildId !== target.guildId || lastObservation.discordUserId !== target.discordUserId) {
          lastObservation = { ...target, value: observer(target, signal) };
        }
        const observed = await lastObservation.value;
        const current = readDiscordConfiguration();
        return observed && current && providerConfigurationFingerprint(current) === providerConfigurationFingerprint(discordConfiguration)
          ? observed : null;
      } : undefined;
    if (!bindSubscriberAuthority && stripeFundingEnvironment === "sandbox" && readPartnerAlertIsolatedStaging(environment)) {
      premiumRequestBinder = createPartnerAlertRequestPremiumBinder({ database,admission,request,environment,
        guildId: destinationGuildId,paidRoleId: stripePremiumRole,observeDiscord: observable });
    }
    const readUserPremium: PartnerAlertRequestRuntime["readUserPremium"] = async userId => {
      if(stripeFundingEnvironment!=="sandbox"||!readPartnerAlertIsolatedStaging(environment))
        return {identity:"native_verification_needed",premium:"unknown",destination:"unknown",observedAtUtc:null,validUntilUtc:null,destinationObservedAtUtc:null,destinationValidUntilUtc:null};
      return readPartnerAlertRequestUserPremium({database:database!,admission,request,environment,
        guildId:destinationGuildId,paidRoleId:stripePremiumRole,userId,observeDiscord:observable});
    };
    const subscriberAuthority = (target: PartnerAlertSubscriberOffer) => bindSubscriberAuthority
      ? bound ?? null : premiumRequestBinder ? premiumRequestBinder.bind(target)
      : bindPartnerAlertNativeSubscriber(database!, admission, target, destinationGuildId, stripeFundingEnvironment,
        stripePremiumRole, stripeFundingEnvironment === "live" || whopEnvironment === "sandbox"
          ? { observeDiscord: observable } : undefined);
    const authorize = (incoming: Request, communityId: string, offerKey: string, includeExistingPurchase = false) =>
      writer.run(incoming, scope => scope.authorizeSubscriberOffer(communityId, offerKey, includeExistingPurchase));
    const readDestinations = (contexts: readonly PartnerAlertContextTicket[]): readonly PartnerAlertDiscordDestination[] => {
      const output = readDiscordConfiguration();
      if (!output || !database!.inTransaction) return [];
      const mapping = database!.prepare(`SELECT display_name,source_guild_id,source_channel_id,destination_channel_id
        FROM partner_alert_mappings WHERE community_id=? AND mapping_id=? AND destination_guild_id=?
          AND destination_role_id=? AND revision=? AND approved_revision=revision AND review_state='approved'`);
      const links: PartnerAlertDiscordDestination[] = [];
      for (const ticket of contexts) {
        const row = mapping.get(ticket.communityId, ticket.mappingId, ticket.guildId, ticket.roleId, ticket.mappingRevision) as
          { display_name: string; source_guild_id: string; source_channel_id: string; destination_channel_id: string } | undefined;
        if (!row || ticket.guildId !== destinationGuildId || !partnerAlertOutputBindingMatches(output.outputBindings, {
          communityId: ticket.communityId, sourceGuildId: row.source_guild_id, sourceChannelId: row.source_channel_id,
          destinationGuildId, destinationChannelId: row.destination_channel_id, destinationRoleId: ticket.roleId,
        })) return [];
        links.push({ name: partnerAlertText(row.display_name, "displayName"), guildId: destinationGuildId,
          channelId: partnerAlertSnowflake(row.destination_channel_id, "channelId") });
      }
      return links;
    };
    const checkSubscriberAccess = (incoming: Request, communityId: string, offerKey: string) =>
      checkPartnerAlertSubscriberAccess(incoming, () => authorize(incoming, communityId, offerKey, true),
        subscriberAuthority, nowUtc, observable, readDestinations);
    const readSubscriberOfferState: PartnerAlertRequestRuntime["readSubscriberOfferState"] = async (expected, signal) => {
      try {
        const offerKey = `${expected.offerId}:${expected.offerVersion}`;
        const current = () => authorize(request, expected.communityId, offerKey, true);
        const target = current();
        if (target.userId !== expected.userId || target.communityId !== expected.communityId
          || target.offerId !== expected.offerId || target.offerVersion !== expected.offerVersion
          || JSON.stringify(target.mappingIds) !== JSON.stringify(expected.mappingIds)) return "unavailable";
        const authority = subscriberAuthority(target);
        if (!authority || !observable) return "unavailable";
        const result = await verifyPartnerAlertSubscriberOffer(target, authority, nowUtc, observable, signal);
        return !signal.aborted && JSON.stringify(current()) === JSON.stringify(target) ? result : "unavailable";
      } catch { return "unavailable"; }
    };
    const readStripeCatalogOffer: PartnerAlertRequestRuntime["readStripeCatalogOffer"] = async (target, signal) => {
      if (!stripeFundingEnvironment || signal.aborted) return null;
      try {
        const key = `${target.offerId}:${target.offerVersion}`;
        const readTarget = () => authorize(request, target.communityId, key, true);
        const selected = readTarget();
        if (JSON.stringify(selected) !== JSON.stringify(target)) return null;
        const authority = subscriberAuthority(selected);
        if (!authority) return null;
        let destinations: readonly PartnerAlertDiscordDestination[] = [];
        const result = await verifyPartnerAlertSubscriberOffer(selected, authority, nowUtc, observable, signal,
          contexts => { destinations = readDestinations(contexts); });
        if (signal.aborted || JSON.stringify(readTarget()) !== JSON.stringify(selected)) return null;

        const openClaimFilter = hasPartnerAlertStripeCheckoutClosure(database!) ? "AND checkout_closed_at_ms IS NULL" : "";
        const existingSubscription = database!.prepare(`SELECT 1 FROM partner_alert_stripe_checkout_claims
          WHERE buyer_user_id=? AND community_id=? AND offer_id=? AND offer_version=? AND environment=?
            AND stripe_subscription_id IS NOT NULL ${openClaimFilter} LIMIT 1`)
          .get(selected.userId, selected.communityId, selected.offerId, selected.offerVersion, stripeFundingEnvironment);
        if (result === "subscribed" || result === "eligible" || existingSubscription) {
          const legacyOffer = !existingSubscription && database!.prepare(`SELECT 1 FROM partner_alert_offers
            WHERE community_id=? AND offer_id=? AND version=? AND whop_environment=?`)
            .get(selected.communityId, selected.offerId, selected.offerVersion, whopEnvironment);
          return { access: result === "subscribed" ? "subscribed" : "attention", canCheckout: false,
            ...(legacyOffer ? { billingProvider: "whop" } : {}),
            ...(destinations.length ? { destinations } : {}) };
        }

        const ready = database!.prepare(`SELECT 1 FROM partner_alert_stripe_sellers s
          JOIN traderlink_communities c ON c.community_id=s.community_id AND c.owner_user_id=s.owner_user_id
          LEFT JOIN partner_alert_stripe_prices p ON p.seller_id=s.seller_id AND p.offer_id=? AND p.offer_version=?
          WHERE s.community_id=? AND s.environment=? AND s.state='ready' AND c.status!='removed'
            AND p.withdrawn_at_ms IS NULL`).get(target.offerId, target.offerVersion, target.communityId, stripeFundingEnvironment);
        if (!ready || JSON.stringify(authorize(request, target.communityId, key)) !== JSON.stringify(selected)) return null;
        const recheck = await preparePartnerAlertStripeCheckoutEligibility(selected, authority, nowUtc);
        if (signal.aborted || JSON.stringify(authorize(request, target.communityId, key)) !== JSON.stringify(selected)) return null;
        const coveredMappingIds = authority.inCurrentWriter!(recheck);
        return { access: "available", canCheckout: true, ...(coveredMappingIds.length ? { coveredMappingIds } : {}) };
      } catch { return null; }
    };
    const reviewSubscriberRole = async (incoming: Request): Promise<Response> => {
      try {
        requireJournalAdminMutationRequest(incoming);
        if (incoming.headers.get("origin") !== resolvePlatformPublicOrigin(request)) throw new Error();
      } catch { return runtimeResponse(403, { ok: false, code: "forbidden" }); }
      let review: ReturnType<typeof parsePartnerAlertRoleReview>;
      try {
        review = parsePartnerAlertRoleReview(await readPartnerAlertRequestJson(incoming, 4096));
      } catch { return runtimeResponse(400, { ok: false, code: "invalid_review" }); }
      const operationId = randomUUID();
      try {
        const readAssignment = () => writer.run(incoming, scope => scope.readRoleReviewAssignment(review));
        const assignment = readAssignment();
        if (review.decision !== "remove") {
          writer.run(incoming, scope => scope.recordRoleReview(review, assignment, operationId, "decision"));
          return runtimeResponse(200, { ok: true, operationId });
        }
        if (!providerConfiguration || assignment.environment !== "live") return unavailable();
        const fingerprint = providerConfigurationFingerprint(providerConfiguration);
        const registryTarget = { communityId: assignment.communityId, sourceGuildId: assignment.sourceGuildId,
          sourceChannelId: assignment.sourceChannelId, destinationGuildId: assignment.guildId,
          destinationChannelId: assignment.channelId, destinationRoleId: assignment.roleId };
        if (!isPartnerAlertReviewDiscordTarget(registryTarget)
          || !partnerAlertOutputBindingMatches(providerConfiguration.outputBindings, registryTarget)) return unavailable();
        if (assignment.resourceKind === "payment") {
          const context = await resolvePartnerAlertWhopVerificationContext({ database: database!,
            credentialKeys: providerConfiguration.credentialKeys, maximumEvidenceAgeMs: providerConfiguration.maximumEvidenceAgeMs,
            nowUtc, transport: (url, init) => fetch(url, init) }, assignment.offer, incoming.signal);
          const payment = await context.client.retrievePayment(assignment.resourceId, incoming.signal);
          if (payment.membership_id !== review.membershipId || payment.product_id !== assignment.offer.whop.productId
            || payment.variant_id !== assignment.offer.whop.planId) return unavailable();
        }
        let whopLossIsCurrent = () => true;
        if (stripeFundingEnvironment === "live") {
          const authority = subscriberAuthority({ ...assignment, mappingIds: assignment.offer.mappingIds });
          if (!authority?.inCurrentWriter) return unavailable();
          const snapshot = await authority.refresh(assignment);
          whopLossIsCurrent = () => authority.inCurrentWriter!(() => {
            const now = nowUtc();
            return snapshot.ticket.context.roleId === assignment.roleId
              && snapshot.linkedDiscordUserId === assignment.discordUserId
              && snapshot.input.existingWhopAccess?.kind === "absent" && authority.isCurrent(snapshot.ticket)
              && evaluatePartnerAlertChannelAccess({ ...snapshot.input, nowUtc: now }).reason === "subscription_required";
          });
          if (!whopLossIsCurrent()) return unavailable();
        }
        writer.run(incoming, scope => scope.recordRoleReview(review, assignment, operationId, "decision"));
        const transport = createPartnerAlertManagedRoleTransport({
          botUserId: providerConfiguration.discordBotUserId,
          forbiddenRoleIds: [environment.TRADERLINK_DISCORD_PREMIUM_MEMBER_ROLE_ID?.trim() ?? "", assignment.guildId],
          readBinding: mapping => mapping === assignment.mappingId ? { mappingId: mapping, guildId: assignment.guildId,
            roleId: assignment.roleId, channelId: assignment.channelId, guildPermissions: "0", allowGrant: false } : null,
          createRest: scope => createPartnerAlertDiscordRoleRest({
            botToken: providerConfiguration.discordBotToken, botUserId: providerConfiguration.discordBotUserId,
            maximumDurationMs: 5000, transport: (url, init) => fetch(url, init),
          }, scope),
        });
        const confirmed = await removeReviewedPartnerAlertRole({ assignment, operationId, transport, stillCurrent: () => {
          try {
            const current = readPartnerAlertProviderRuntimeConfiguration(environment, outputBotUserId, outputConfigurationRef);
            return !incoming.signal.aborted && current !== null && providerConfigurationFingerprint(current) === fingerprint
              && JSON.stringify(readAssignment()) === JSON.stringify(assignment) && whopLossIsCurrent();
          } catch { return false; }
        } });
        writer.run(incoming, scope => scope.recordRoleReview(review, assignment, operationId, confirmed ? "removed" : "unconfirmed"));
        return runtimeResponse(confirmed ? 200 : 409, { ok: confirmed, operationId });
      } catch { return unavailable(); }
    };
    const configuredStripeBilling = () => {
      if (!billing || !stripeFundingEnvironment) return null;
      if (billing.environment === "sandbox") {
        if (!partnerAlertStripeSandboxOriginMatches(request, billing.origin)) return null;
      }
      return { config: billing, connect: createPartnerAlertStripeConnect(billing.key, billing.environment) };
    };
    const receiveStripeBillingEvent = async (incoming: Request): Promise<Response> => {
      const stripe = configuredStripeBilling();
      if (!stripe) return new Response(null, { status: 404 });
      return createPartnerAlertStripeInvoiceWebhook({
        database: database!, environment: stripe.config.environment, signingSecret: stripe.config.signingSecret, nowMs: Date.now,
        stripeForAccount: stripe.connect.stripeForAccount,
        runInWriter: (claim, apply) => partnerAdmission.runCommunity(claim.community_id, [claim.buyer_user_id], apply),
        connectClientId: stripe.config.clientId,
        readSeller: stripe.connect.readSeller,
        runSellerInWriter: (ownerUserId, apply) => admission.runForUsers([ownerUserId], apply),
      })(incoming);
    };
    const startStripeCheckout = async (incoming: Request, communityId: string, offerKey: string): Promise<Response> => {
      const stripe = configuredStripeBilling();
      if (!stripe) return new Response(null, { status: 404 });
      const readTarget = () => authorize(incoming, communityId, offerKey);
      let selected: PartnerAlertSubscriberOffer;
      let assertEligible: () => void;
      const checkout = createPartnerAlertNativeStripeCheckout({
        database: database!, environment: stripe.config.environment, origin: stripe.config.origin, nowMs: Date.now,
        stripeForAccount: stripe.connect.stripeForAccount, verifySeller: stripe.connect.readSeller,
        verifyPrice: (accountId, priceId) => stripe.connect.stripeForAccount(accountId)(`prices/${priceId}`),
        createPrice: (accountId, fields, idempotencyKey) => stripe.connect.stripeForAccount(accountId)("prices", fields, idempotencyKey),
        async authorizeCheckout() {
          selected = readTarget();
          const authority = subscriberAuthority(selected);
          if (!authority) throw new Error("Current Stripe checkout authority is unavailable.");
          assertEligible = await preparePartnerAlertStripeCheckoutEligibility(selected, authority, nowUtc);
          if (stripe.config.environment === "live") {
            const { startPartnerAlertStripeRoleRuntime } = await import("./partner-alert-stripe-role-runtime");
            if (!startPartnerAlertStripeRoleRuntime()) throw new Error("Current Stripe role worker is unavailable.");
          }
          return { userId: selected.userId, communityId: selected.communityId, offerId: selected.offerId, version: selected.offerVersion };
        },
        runInWriter(scope, operation) {
          if (incoming.signal.aborted || JSON.stringify(readTarget()) !== JSON.stringify(selected)) {
            throw new Error("Stripe buyer session or offer changed.");
          }
          return partnerAdmission.runCommunity(scope.communityId, [scope.userId], operation);
        },
        assertBuyer() { assertEligible(); },
      });
      return checkout(incoming, communityId, offerKey);
    };
    const authorizeStripeOwner = (scope: PartnerAlertPrivateRequestScope, communityId: string, ownerUserId: string) => {
      const owner = scope.authorizeCommunitySourceCatalog(communityId);
      if (owner.ownerUserId !== ownerUserId) throw new Error("Stripe seller owner changed.");
      return owner;
    };
    const readStripeOwner = (incoming: Request, communityId: string, ownerUserId: string, stripeMode: "sandbox" | "live") =>
      writer.run(incoming, scope => ({
        owner: authorizeStripeOwner(scope, communityId, ownerUserId),
        seller: readPartnerStripeSetupSeller(database!, { communityId, ownerUserId, environment: stripeMode }) ?? null,
      }));
    const readStripeSeller: PartnerAlertRequestRuntime["readStripeSeller"] = async (incoming, communityId, ownerUserId) => {
      const stripe = configuredStripeBilling();
      if (!stripe || incoming.signal.aborted) return null;
      const read = () => readStripeOwner(incoming, communityId, ownerUserId, stripe.config.environment);
      const current = read();
      const accountId = current.seller?.stripe_account_id ?? null;
      if (!accountId) return { accountId, status: "unconnected" };
      const status = partnerStripeSellerStatus(await stripe.connect.readSeller(accountId), accountId, stripe.config.environment);
      return !incoming.signal.aborted && JSON.stringify(read()) === JSON.stringify(current) ? { accountId, status } : null;
    };
    const bindStripeSetup = async (incoming: Request, stripe: NonNullable<ReturnType<typeof configuredStripeBilling>>,
      target: Parameters<typeof readPartnerStripeSetupSeller>[1], attempt: Parameters<typeof requirePartnerStripeSetupAttempt>[2],
      accountId: string) => {
      const status = partnerStripeSellerStatus(await stripe.connect.readSeller(accountId), accountId, target.environment);
      if (status === "unavailable" || status === "unconnected") throw new Error("Stripe seller account is unavailable.");
      writer.run(incoming, scope => {
        authorizeStripeOwner(scope, target.communityId, target.ownerUserId);
        requirePartnerStripeSetupAttempt(database!, target, attempt);
        recordPartnerAlertStripeSeller(database!, { ...target, accountId, atMs: Date.now(),
          state: status === "setup_required" ? "onboarding" : status },
        attempt.method === "oauth" && attempt.consumed_at_ms !== null
          ? { sellerId: attempt.seller_id, startedAtMs: attempt.created_at_ms } : undefined);
      });
    };
    const startStripeSellerSetup: PartnerAlertRequestRuntime["startStripeSellerSetup"] = async (
      incoming, communityId, ownerUserId, method, country, returnUrl,
    ) => {
      const stripe = configuredStripeBilling();
      if (!stripe || incoming.signal.aborted) throw new Error("Stripe seller setup is unavailable.");
      const { environment: stripeMode, origin, key, clientId } = stripe.config;
      if (new URL(returnUrl).origin !== origin) throw new Error("Invalid Stripe seller setup.");
      const target = { communityId, ownerUserId, environment: stripeMode };
      const read = () => readStripeOwner(incoming, communityId, ownerUserId, stripeMode);
      const stripeAccount = createPartnerAlertStripeAccountClient(key, fetch, stripeMode);
      let current = read();
      if (!current.seller?.stripe_account_id) {
        if (method === "oauth" && !clientId) throw new Error("Stripe Connect client required.");
        admission.qualifyAdditionalStatements(PARTNER_ALERT_STRIPE_ONBOARDING_ATTEMPT_STATEMENTS);
        const pending = writer.run(incoming, scope => {
          authorizeStripeOwner(scope, communityId, ownerUserId);
          return beginPartnerStripeSetup(database!, target, method, country, Date.now());
        });
        if (pending.oauthState && clientId) {
          return { kind: "link", url: partnerStripeOAuthAuthorizeUrl(clientId, origin, pending.oauthState, stripeMode) };
        }
        if (!pending.attempt.country) throw new Error("Missing Stripe seller country.");
        const accountId = await createPartnerAlertStripeHostedSeller(stripeAccount, pending.attempt.country, pending.attempt.seller_id, stripeMode);
        await bindStripeSetup(incoming, stripe, target, pending.attempt, accountId);
        current = read();
        if (current.seller?.stripe_account_id !== accountId) throw new Error("Stripe seller connection changed.");
      } else if (method === "oauth") {
        return { kind: "connected" };
      }
      const accountId = current.seller?.stripe_account_id;
      if (!accountId) throw new Error("Stripe seller is unavailable.");
      const stillOwner = () => !incoming.signal.aborted && JSON.stringify(read()) === JSON.stringify(current);
      const status = partnerStripeSellerStatus(await stripe.connect.readSeller(accountId), accountId, stripeMode);
      if (!stillOwner()) throw new Error("Stripe seller owner changed.");
      if (status === "ready" || status === "in_review") return { kind: "link", url: null };
      return { kind: "link", url: await openPartnerAlertStripeOnboardingLink(stripeAccount, accountId, returnUrl,
        `${returnUrl}?stripe=refresh`, stillOwner, stripeMode) };
    };
    const completeStripeSellerSetup: PartnerAlertRequestRuntime["completeStripeSellerSetup"] = async (incoming, ownerUserId, state, code) => {
      const stripe = configuredStripeBilling();
      if (!stripe?.config.clientId || incoming.signal.aborted || (code !== null && !validPartnerStripeOAuthCode(code))) return null;
      const { environment: stripeMode, key, origin } = stripe.config;
      admission.qualifyAdditionalStatements(PARTNER_ALERT_STRIPE_ONBOARDING_ATTEMPT_STATEMENTS);
      const claimed = writer.run(incoming, scope => {
        const now = Date.now();
        const selected = findPartnerStripeOAuthScope(database!, state, ownerUserId, stripeMode, now);
        if (!selected) return null;
        authorizeStripeOwner(scope, selected.community_id, ownerUserId);
        const attempt = claimPartnerStripeOAuth(database!, state, selected.seller_id, now);
        return attempt ? { selected, attempt } : null;
      });
      if (!claimed) return null;
      const { selected, attempt } = claimed;
      const page = new URL(`/communities/${encodeURIComponent(selected.slug)}/partner-channels`, origin);
      try {
        if (code === null || incoming.signal.aborted) throw new Error("Stripe seller connection cancelled.");
        const accountId = await exchangePartnerStripeOAuth(code, key, stripeMode);
        await bindStripeSetup(incoming, stripe, { communityId: selected.community_id, ownerUserId, environment: stripeMode }, attempt, accountId);
      } catch {
        page.searchParams.set("stripe", "link_failed");
      }
      return page.href;
    };
    const reviewStripeAdjustment = async (incoming: Request, communityId: string): Promise<Response> => {
      const stripe = configuredStripeBilling();
      if (!stripe) return new Response(null, { status: 404 });
      try {
        requireJournalAdminMutationRequest(incoming);
        if (incoming.headers.get("origin") !== stripe.config.origin) throw new Error();
      } catch { return runtimeResponse(403, { ok: false, code: "forbidden" }); }
      let eventId: string;
      let decision: "keep" | "remove";
      try {
        const body = await readPartnerAlertRequestJson(incoming, 4096);
        if (Object.keys(body).length !== 2 || (body.decision !== "keep" && body.decision !== "remove")) throw new Error();
        eventId = partnerStripeId(body.eventId, "evt_");
        decision = body.decision;
      } catch { return runtimeResponse(400, { ok: false, code: "invalid_review" }); }
      try {
        const changed = writer.run(incoming, scope => scope.reviewStripeAdjustment(communityId, eventId, decision));
        return runtimeResponse(200, { ok: true, changed });
      } catch { return unavailable(); }
    };
    const receiveWhopEvent: PartnerAlertRequestRuntime["receiveWhopEvent"] = (scope, input) => {
      new PartnerAlertWhopInbox(database!, { scope, nowUtc, createLeaseToken: randomUUID, manualRoleReview: true }).receiveSignedEvent(input);
    };
    return await operation(Object.freeze({ http, writer, readSourceChannels, checkSubscriberAccess,
      readSubscriberOfferState, receiveWhopEvent, reviewSubscriberRole, reviewStripeAdjustment,
      receiveStripeBillingEvent, startStripeCheckout, readStripeCatalogOffer, readUserPremium, readStripeSeller, startStripeSellerSetup, completeStripeSellerSetup }));
  } catch {
    return unavailableResult();
  } finally {
    premiumRequestBinder?.clear();
    database?.close();
  }
}
