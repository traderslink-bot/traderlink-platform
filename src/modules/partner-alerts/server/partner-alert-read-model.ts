import { PartnerAlertValidationError, type PartnerAlertCadence, type PartnerAlertContentPolicy,
  type PartnerAlertCurrency, type PartnerAlertOffer, type PartnerAlertPublishingQuote,
  type PartnerAlertPublishingTerms } from "../contracts/partner-alert-contracts";
import { PARTNER_ALERT_MAX_SELECTION, parsePartnerAlertCadence, parsePartnerAlertContentPolicy,
  parsePartnerAlertCurrency, parsePartnerAlertOffer, parsePartnerAlertPublishingTerms, partnerAlertExactKeys,
  partnerAlertId, partnerAlertInteger, partnerAlertRecord, partnerAlertSnowflake, partnerAlertText,
  partnerAlertUtc } from "../contracts/partner-alert-validation";
import type { PartnerAlertRepository } from "./partner-alert-repository";

type PrivateRead = ReturnType<PartnerAlertRepository["readPartner"]>;
type ReviewRead = ReturnType<PartnerAlertRepository["listReviewRequests"]>;
type PartnerState = "draft" | "awaiting_approval" | "setup_required" | "active" | "publishing_paused" | "suspended" | "ended";
type ReviewState = "draft" | "awaiting_approval" | "approved" | "withdrawn";
export type PartnerAlertPrivateMappingView = Readonly<{
  mappingId: string; displayName: string; sourceChannelId: string; revision: number; reviewState: ReviewState;
  destinationGuildId: string | null; destinationChannelId: string | null; destinationRoleId: string | null;
  approvedRevision: number | null; everApproved: boolean;
}>;
export type PartnerAlertPrivateView = Readonly<{
  communityId: string; displayName: string; sourceGuildId: string; status: PartnerState; revision: number;
  reviewRequested: boolean; currentAgreementId: string | null; approvedAtUtc: string | null;
  createdAtUtc: string; updatedAtUtc: string;
  /** Output-bot identity is server configuration, not a form field. */
  contentPolicy: Readonly<Omit<PartnerAlertContentPolicy, "mirrorBotUserId">>;
  mappings: readonly PartnerAlertPrivateMappingView[];
  offers: readonly Readonly<{ offer: PartnerAlertOffer; reviewState: ReviewState }>[];
  /** Latest stored proposal/version; this is not proof of acceptance or payment. */
  latestAgreement: Readonly<{ agreementId: string; version: number; terms: PartnerAlertPublishingTerms;
    contractedChannels: number; quote: PartnerAlertPublishingQuote }> | null;
}>;
export type PartnerAlertReviewRequestView = Readonly<{
  communityId: string; displayName: string; status: PartnerState; revision: number;
}>;
function invalid(): never { throw new PartnerAlertValidationError("privateRead"); }
function partnerState(value: unknown): PartnerState {
  if (typeof value !== "string" || !["draft", "awaiting_approval", "setup_required", "active", "publishing_paused", "suspended", "ended"].includes(value)) return invalid();
  return value as PartnerState;
}
function reviewState(value: unknown): ReviewState {
  if (typeof value !== "string" || !["draft", "awaiting_approval", "approved", "withdrawn"].includes(value)) return invalid();
  return value as ReviewState;
}
function flag(value: unknown): boolean { if (value !== 0 && value !== 1) return invalid(); return value === 1; }
function nullableId(value: unknown): string | null { return value === null ? null : partnerAlertId(value, "privateRead"); }
function nullableSnowflake(value: unknown): string | null { return value === null ? null : partnerAlertSnowflake(value, "privateRead"); }
function nullableUtc(value: unknown): string | null { return value === null ? null : partnerAlertUtc(value, "privateRead"); }
function json(value: unknown, maximum: number): unknown {
  if (typeof value !== "string" || value.length > maximum) return invalid();
  try { return JSON.parse(value) as unknown; } catch { return invalid(); }
}
function sameCurrency(a: PartnerAlertCurrency, b: PartnerAlertCurrency): boolean { return a.code === b.code && a.minorUnitDigits === b.minorUnitDigits; }
function sameCadence(a: PartnerAlertCadence, b: PartnerAlertCadence): boolean { return a.unit === b.unit && a.count === b.count; }

/** Validate a RECORDED quote against its stored terms. This does not fabricate
 * provider capabilities, recalculate a bill or qualify a charge/payment. */
function quoteView(value: unknown, terms: PartnerAlertPublishingTerms, channels: number): PartnerAlertPublishingQuote {
  const q = partnerAlertRecord(value, "quote");
  partnerAlertExactKeys(q, ["termsId", "communityId", "termsVersion", "pricingSource", "contractedChannels", "includedChannels",
    "additionalChannels", "firstChannelAmountMinor", "additionalChannelAmountMinor", "additionalTotalMinor", "totalMinor", "currency", "cadence"], "quote");
  const currency = parsePartnerAlertCurrency(q.currency); const cadence = parsePartnerAlertCadence(q.cadence);
  const additionalChannels = partnerAlertInteger(q.additionalChannels, "additionalChannels", 0, PARTNER_ALERT_MAX_SELECTION);
  const additionalTotalMinor = partnerAlertInteger(q.additionalTotalMinor, "additionalTotalMinor");
  const totalMinor = partnerAlertInteger(q.totalMinor, "totalMinor");
  if (q.termsId !== terms.termsId || q.communityId !== terms.communityId || q.termsVersion !== terms.version
    || q.pricingSource !== terms.pricingSource || q.contractedChannels !== channels || q.includedChannels !== terms.includedChannels
    || q.firstChannelAmountMinor !== terms.firstChannelAmountMinor || q.additionalChannelAmountMinor !== terms.additionalChannelAmountMinor
    || additionalChannels !== Math.max(0, channels - terms.includedChannels) || !sameCurrency(currency, terms.currency) || !sameCadence(cadence, terms.cadence)
    || !Number.isSafeInteger(additionalChannels * terms.additionalChannelAmountMinor)
    || additionalTotalMinor !== additionalChannels * terms.additionalChannelAmountMinor
    || !Number.isSafeInteger(terms.firstChannelAmountMinor + additionalTotalMinor)
    || totalMinor !== terms.firstChannelAmountMinor + additionalTotalMinor) return invalid();
  return Object.freeze({ termsId: terms.termsId, communityId: terms.communityId, termsVersion: terms.version,
    pricingSource: terms.pricingSource, contractedChannels: channels, includedChannels: terms.includedChannels,
    additionalChannels, firstChannelAmountMinor: terms.firstChannelAmountMinor, additionalChannelAmountMinor: terms.additionalChannelAmountMinor,
    additionalTotalMinor, totalMinor, currency, cadence });
}

/** Pure private projection ONLY. The caller must already have used the actual
 * authorized readPartner(owner|partner). This function invokes no repository,
 * auth, SQL, provider or injected port and cannot authorize any audience/action.
 * No raw row spreads/JSON/private identity or operation payloads are returned. */
export function projectPartnerAlertPrivateRead(input: PrivateRead): PartnerAlertPrivateView {
  const partner = partnerAlertRecord(input.partner, "partner");
  const communityId = partnerAlertId(partner.community_id, "communityId");
  const sourceGuildId = partnerAlertSnowflake(partner.source_guild_id, "sourceGuildId");
  const policy = parsePartnerAlertContentPolicy(json(partner.content_policy_json, 65536));
  if (!Array.isArray(input.mappings) || input.mappings.length > PARTNER_ALERT_MAX_SELECTION
    || !Array.isArray(input.offers) || input.offers.length > PARTNER_ALERT_MAX_SELECTION) return invalid();
  const mappingIds = new Set<string>();
  const mappings = input.mappings.map(value => {
    const row = partnerAlertRecord(value, "mapping"); const mappingId = partnerAlertId(row.mapping_id, "mappingId");
    if (row.community_id !== communityId || row.source_guild_id !== sourceGuildId || mappingIds.has(mappingId)) return invalid();
    mappingIds.add(mappingId);
    const revision = partnerAlertInteger(row.revision, "revision", 1); const state = reviewState(row.review_state);
    const approvedRevision = row.approved_revision === null ? null : partnerAlertInteger(row.approved_revision, "approvedRevision", 1);
    const destinationGuildId = nullableSnowflake(row.destination_guild_id);
    const destinationChannelId = nullableSnowflake(row.destination_channel_id); const destinationRoleId = nullableSnowflake(row.destination_role_id);
    const everApproved = flag(row.ever_approved);
    if ((approvedRevision !== null && approvedRevision !== revision)
      || (state === "approved" && (!everApproved || approvedRevision === null || !destinationGuildId || !destinationChannelId || !destinationRoleId))) return invalid();
    return Object.freeze({ mappingId, displayName: partnerAlertText(row.display_name, "displayName"),
      sourceChannelId: partnerAlertSnowflake(row.source_channel_id, "sourceChannelId"), revision, reviewState: state,
      destinationGuildId, destinationChannelId, destinationRoleId, approvedRevision, everApproved });
  });
  const offerIds = new Set<string>();
  const offers = input.offers.map(value => {
    const row = partnerAlertRecord(value, "offer"); const offer = parsePartnerAlertOffer(json(row.offer_json, 32000));
    if (row.community_id !== communityId || offer.communityId !== communityId || row.offer_id !== offer.offerId
      || row.version !== offer.version || offerIds.has(offer.offerId) || offer.mappingIds.some(id => !mappingIds.has(id))) return invalid();
    offerIds.add(offer.offerId);
    return Object.freeze({ offer, reviewState: reviewState(row.review_state) });
  });
  let latestAgreement: PartnerAlertPrivateView["latestAgreement"] = null;
  if (input.latestAgreement !== undefined) {
    const row = partnerAlertRecord(input.latestAgreement, "agreement");
    const terms = parsePartnerAlertPublishingTerms(json(row.terms_json, 32000));
    const channels = partnerAlertInteger(row.contracted_channels, "contractedChannels", 1, PARTNER_ALERT_MAX_SELECTION);
    if (row.community_id !== communityId || terms.communityId !== communityId || row.agreement_id !== terms.termsId || row.version !== terms.version) return invalid();
    latestAgreement = Object.freeze({ agreementId: terms.termsId, version: terms.version, terms,
      contractedChannels: channels, quote: quoteView(json(row.quote_json, 64000), terms, channels) });
  }
  const createdAtUtc = partnerAlertUtc(partner.created_at_utc, "createdAtUtc");
  const updatedAtUtc = partnerAlertUtc(partner.updated_at_utc, "updatedAtUtc");
  if (updatedAtUtc < createdAtUtc) return invalid();
  return Object.freeze({ communityId, displayName: partnerAlertText(partner.display_name, "displayName"), sourceGuildId,
    status: partnerState(partner.status), revision: partnerAlertInteger(partner.revision, "revision", 1),
    reviewRequested: flag(partner.review_requested), currentAgreementId: nullableId(partner.current_agreement_id),
    approvedAtUtc: nullableUtc(partner.approved_at_utc), createdAtUtc, updatedAtUtc,
    contentPolicy: Object.freeze({ blockedServerNames: policy.blockedServerNames, blockedPhrases: policy.blockedPhrases,
      authorMode: policy.authorMode, allowedAuthorIds: policy.allowedAuthorIds }),
    mappings: Object.freeze(mappings), offers: Object.freeze(offers), latestAgreement });
}

/** Existing operator review queue only. Preserves query order; no public list,
 * synthetic count/pagination, actor IDs or authorization assertion is added. */
export function projectPartnerAlertReviewRequests(input: ReviewRead): readonly PartnerAlertReviewRequestView[] {
  if (!Array.isArray(input) || input.length > 100) return invalid();
  const seen = new Set<string>();
  return Object.freeze(input.map(value => {
    const row = partnerAlertRecord(value, "reviewRequest"); const communityId = partnerAlertId(row.community_id, "communityId");
    if (seen.has(communityId)) return invalid(); seen.add(communityId);
    return Object.freeze({ communityId, displayName: partnerAlertText(row.display_name, "displayName"),
      status: partnerState(row.status), revision: partnerAlertInteger(row.revision, "revision", 1) });
  }));
}
