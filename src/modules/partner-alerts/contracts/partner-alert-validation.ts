import {
  PartnerAlertValidationError,
  type PartnerAlertCadence,
  type PartnerAlertContentPolicy,
  type PartnerAlertCurrency,
  type PartnerAlertMappingDraft,
  type PartnerAlertOffer,
  type PartnerAlertPublishingTerms,
  type PartnerAlertWhopBinding,
} from "./partner-alert-contracts";

// Technical input bounds, not commercial price caps or package entitlements.
export const PARTNER_ALERT_MAX_SELECTION = 250;
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const CONTROL_TEXT = /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/u;

export function partnerAlertRecord(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)
    || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) {
    throw new PartnerAlertValidationError(field);
  }
  return value as Record<string, unknown>;
}

export function partnerAlertExactKeys(
  value: Record<string, unknown>, allowed: readonly string[], field: string,
): void {
  if (Object.keys(value).some(key => !allowed.includes(key))) throw new PartnerAlertValidationError(field);
}

export function partnerAlertText(value: unknown, field: string, maximum = 120): string {
  if (typeof value !== "string" || value.length > maximum || CONTROL_TEXT.test(value)) {
    throw new PartnerAlertValidationError(field);
  }
  const text = value.trim();
  if (!text) throw new PartnerAlertValidationError(field);
  return text;
}

export function partnerAlertId(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_V4.test(value)) throw new PartnerAlertValidationError(field);
  return value;
}

export function partnerAlertSnowflake(value: unknown, field: string): string {
  if (typeof value !== "string" || !/^[1-9][0-9]{0,19}$/u.test(value)
    || (value.length === 20 && value > "18446744073709551615")) {
    throw new PartnerAlertValidationError(field);
  }
  return value;
}

export function partnerAlertInteger(value: unknown, field: string, minimum = 0,
  maximum = Number.MAX_SAFE_INTEGER): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new PartnerAlertValidationError(field);
  }
  return value;
}

export function partnerAlertUtc(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length !== 24) throw new PartnerAlertValidationError(field);
  const epoch = Date.parse(value);
  if (!Number.isFinite(epoch) || new Date(epoch).toISOString() !== value) {
    throw new PartnerAlertValidationError(field);
  }
  return value;
}

export function parsePartnerAlertCurrency(value: unknown): PartnerAlertCurrency {
  const record = partnerAlertRecord(value, "currency");
  partnerAlertExactKeys(record, ["code", "minorUnitDigits"], "currency");
  if (typeof record.code !== "string" || !/^[A-Z]{3}$/u.test(record.code)) {
    throw new PartnerAlertValidationError("currency");
  }
  // The integration must resolve currency precision from the selected provider;
  // an arbitrary client value is never proof that a currency is supported.
  const digits = partnerAlertInteger(record.minorUnitDigits, "minorUnitDigits", 0, 3) as 0 | 1 | 2 | 3;
  return Object.freeze({ code: record.code, minorUnitDigits: digits });
}

export function parsePartnerAlertCadence(value: unknown): PartnerAlertCadence {
  const record = partnerAlertRecord(value, "cadence");
  partnerAlertExactKeys(record, ["unit", "count"], "cadence");
  if (record.unit !== "day" && record.unit !== "calendar_month") {
    throw new PartnerAlertValidationError("cadence");
  }
  return Object.freeze({ unit: record.unit,
    count: partnerAlertInteger(record.count, "cadence.count", 1, record.unit === "day" ? 3660 : 120) });
}

function providerId(value: unknown, prefix: string, field: string): string {
  if (typeof value !== "string" || value.length > 128 || !value.startsWith(prefix)
    || !/^[A-Za-z0-9_]+$/u.test(value) || value.length <= prefix.length) {
    throw new PartnerAlertValidationError(field);
  }
  return value;
}

export function parsePartnerAlertWhopBinding(value: unknown): PartnerAlertWhopBinding {
  const record = partnerAlertRecord(value, "whop");
  partnerAlertExactKeys(record, ["environment", "accountId", "productId", "planId"], "whop");
  if (record.environment !== "sandbox" && record.environment !== "live") {
    throw new PartnerAlertValidationError("whop.environment");
  }
  return Object.freeze({ environment: record.environment,
    accountId: providerId(record.accountId, "biz_", "whop.accountId"),
    productId: providerId(record.productId, "prod_", "whop.productId"),
    planId: providerId(record.planId, "plan_", "whop.planId") });
}

export function partnerAlertIds(value: unknown, field: string): readonly string[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > PARTNER_ALERT_MAX_SELECTION) {
    throw new PartnerAlertValidationError(field);
  }
  const ids = value.map(id => partnerAlertId(id, field));
  if (new Set(ids).size !== ids.length) throw new PartnerAlertValidationError(field);
  return Object.freeze([...ids].sort());
}

export function parsePartnerAlertMappingDraft(value: unknown): PartnerAlertMappingDraft {
  const record = partnerAlertRecord(value, "mapping");
  partnerAlertExactKeys(record, ["mappingId", "communityId", "sourceGuildId", "sourceChannelId",
    "destinationChannelId", "displayName"], "mapping");
  const sourceChannelId = partnerAlertSnowflake(record.sourceChannelId, "sourceChannelId");
  const destinationChannelId = partnerAlertSnowflake(record.destinationChannelId, "destinationChannelId");
  if (sourceChannelId === destinationChannelId) {
    throw new PartnerAlertValidationError("destinationChannelId", "Choose a separate destination channel.");
  }
  return Object.freeze({ mappingId: partnerAlertId(record.mappingId, "mappingId"),
    communityId: partnerAlertId(record.communityId, "communityId"),
    sourceGuildId: partnerAlertSnowflake(record.sourceGuildId, "sourceGuildId"),
    sourceChannelId, destinationChannelId, displayName: partnerAlertText(record.displayName, "displayName") });
}

export function parsePartnerAlertOffer(value: unknown): PartnerAlertOffer {
  const record = partnerAlertRecord(value, "offer");
  partnerAlertExactKeys(record, ["offerId", "communityId", "version", "kind", "title", "mappingIds",
    "currency", "amountMinor", "cadence", "whop"], "offer");
  if (record.kind !== "channel" && record.kind !== "package") throw new PartnerAlertValidationError("kind");
  const mappingIds = partnerAlertIds(record.mappingIds, "mappingIds");
  if ((record.kind === "channel" && mappingIds.length !== 1)
    || (record.kind === "package" && mappingIds.length < 2)) {
    throw new PartnerAlertValidationError("mappingIds", "Choose one channel or at least two channels for a package.");
  }
  return Object.freeze({ offerId: partnerAlertId(record.offerId, "offerId"),
    communityId: partnerAlertId(record.communityId, "communityId"),
    version: partnerAlertInteger(record.version, "version", 1), kind: record.kind,
    title: partnerAlertText(record.title, "title"), mappingIds,
    currency: parsePartnerAlertCurrency(record.currency),
    amountMinor: partnerAlertInteger(record.amountMinor, "amountMinor"),
    cadence: parsePartnerAlertCadence(record.cadence), whop: parsePartnerAlertWhopBinding(record.whop) });
}

/** A same-owner server is still a different community. Validate against server-owned mappings. */
export function validatePartnerAlertOfferMappings(
  offerValue: unknown, mappingValues: readonly unknown[],
): PartnerAlertOffer {
  const offer = parsePartnerAlertOffer(offerValue);
  if (!Array.isArray(mappingValues) || mappingValues.length > PARTNER_ALERT_MAX_SELECTION) {
    throw new PartnerAlertValidationError("mappings");
  }
  const mappings = mappingValues.map(parsePartnerAlertMappingDraft);
  if (new Set(mappings.map(mapping => mapping.mappingId)).size !== mappings.length) {
    throw new PartnerAlertValidationError("mappings");
  }
  for (const id of offer.mappingIds) {
    const mapping = mappings.find(candidate => candidate.mappingId === id);
    if (!mapping || mapping.communityId !== offer.communityId) {
      throw new PartnerAlertValidationError("mappingIds", "Packages can include only this community’s channels.");
    }
  }
  return offer;
}

export function parsePartnerAlertPublishingTerms(value: unknown): PartnerAlertPublishingTerms {
  const record = partnerAlertRecord(value, "terms");
  partnerAlertExactKeys(record, ["termsId", "communityId", "version", "pricingSource", "currency",
    "firstChannelAmountMinor", "additionalChannelAmountMinor", "includedChannels", "cadence"], "terms");
  if (record.pricingSource !== "standard" && record.pricingSource !== "private") {
    throw new PartnerAlertValidationError("pricingSource");
  }
  return Object.freeze({ termsId: partnerAlertId(record.termsId, "termsId"),
    communityId: partnerAlertId(record.communityId, "communityId"),
    version: partnerAlertInteger(record.version, "version", 1), pricingSource: record.pricingSource,
    currency: parsePartnerAlertCurrency(record.currency),
    firstChannelAmountMinor: partnerAlertInteger(record.firstChannelAmountMinor, "firstChannelAmountMinor"),
    additionalChannelAmountMinor: partnerAlertInteger(record.additionalChannelAmountMinor, "additionalChannelAmountMinor"),
    includedChannels: partnerAlertInteger(record.includedChannels, "includedChannels", 1, PARTNER_ALERT_MAX_SELECTION),
    cadence: parsePartnerAlertCadence(record.cadence) });
}

export function parsePartnerAlertContentPolicy(value: unknown): PartnerAlertContentPolicy {
  const record = partnerAlertRecord(value, "contentPolicy");
  partnerAlertExactKeys(record, ["blockedServerNames", "blockedPhrases", "authorMode",
    "allowedAuthorIds", "mirrorBotUserId"], "contentPolicy");
  const phrases = (items: unknown, field: string, minimum: number) => {
    if (!Array.isArray(items) || items.length < minimum || items.length > 50) {
      throw new PartnerAlertValidationError(field);
    }
    const result = items.map(item => partnerAlertText(item, field));
    if (result.some(item => (item.normalize("NFKC").match(/[\p{L}\p{N}]/gu)?.length ?? 0) < 3)) {
      throw new PartnerAlertValidationError(field);
    }
    return Object.freeze([...new Set(result)]);
  };
  if (record.authorMode !== "all_humans" && record.authorMode !== "allowlist") {
    throw new PartnerAlertValidationError("authorMode");
  }
  if (!Array.isArray(record.allowedAuthorIds) || record.allowedAuthorIds.length > PARTNER_ALERT_MAX_SELECTION) {
    throw new PartnerAlertValidationError("allowedAuthorIds");
  }
  const authors = record.allowedAuthorIds.map(id => partnerAlertSnowflake(id, "allowedAuthorIds"));
  if (record.authorMode === "allowlist" && !authors.length) throw new PartnerAlertValidationError("allowedAuthorIds");
  if (record.authorMode === "all_humans" && authors.length) throw new PartnerAlertValidationError("allowedAuthorIds");
  return Object.freeze({ blockedServerNames: phrases(record.blockedServerNames, "blockedServerNames", 1),
    blockedPhrases: phrases(record.blockedPhrases, "blockedPhrases", 0), authorMode: record.authorMode,
    allowedAuthorIds: Object.freeze([...new Set(authors)]),
    mirrorBotUserId: partnerAlertSnowflake(record.mirrorBotUserId, "mirrorBotUserId") });
}
