import {
  PartnerAlertValidationError,
  type PartnerAlertContentDecision,
  type PartnerAlertContentIssue,
  type PartnerAlertSourceMessage,
} from "./partner-alert-contracts";
import {
  parsePartnerAlertContentPolicy,
  parsePartnerAlertMappingDraft,
  partnerAlertInteger,
  partnerAlertSnowflake,
  partnerAlertUtc,
} from "./partner-alert-validation";

export const PARTNER_ALERT_MAX_TEXT_LENGTH = 32_000;
// Leave room for a later approved attribution/part marker inside Discord's limit.
const PART_LENGTH = 1_850;
const INVISIBLE_OR_CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/u;
const LONE_SURROGATE = /[\ud800-\udfff]/u;
const DETECTION_ENTITIES: Readonly<Record<string, string>> = Object.freeze({
  "&colon;": ":", "&period;": ".", "&sol;": "/",
});

/** Detection only. Never use this transformed text as the source or delivered alert. */
function detectionText(text: string): string {
  let result = text.normalize("NFKC").toLowerCase()
    .replace(/[\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/gu, "");
  for (let pass = 0; pass < 2; pass += 1) {
    result = result.replace(/(?:%[0-9a-f]{2})+/giu, encoded => {
      try { return decodeURIComponent(encoded); } catch { return encoded; }
    }).replace(/&#(?:x([0-9a-f]{1,6})|([0-9]{1,7}));/giu, (match, hex: string | undefined, decimal: string | undefined) => {
      const code = Number.parseInt(hex ?? decimal ?? "", hex ? 16 : 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
    }).replace(/&(?:colon|period|sol);/giu, entity => DETECTION_ENTITIES[entity.toLowerCase()] ?? entity);
  }
  return result.normalize("NFKC").toLowerCase()
    // Recognise Unicode domain separators. Spelled dots are detection
    // candidates only; ordinary colons, decimal points and ticker dots are not
    // converted into schemes. Keep whitespace for the existing domain matcher.
    .replace(/[\u3002\uff61]/gu, ".")
    .replace(/(?<=\s)dot(?=\s)/gu, ".")
    .replace(/\s*[\[(]\s*dot\s*[\])]\s*/gu, ".")
    .replace(/\s*[\[(]\s*slash\s*[\])]\s*/gu, "/");
}

function phraseText(text: string): string {
  return " " + detectionText(text).normalize("NFKD").replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/gu, " ") + " ";
}

/** Explicit scheme:// links include app/file schemes, not just web URLs. Each
 * backwards scan stops at the previous separator's slash, so candidate scans
 * do not overlap. No unbounded repeated scheme regex or TLD/network lookup. */
function containsExplicitUri(text: string): boolean {
  let separator = text.indexOf("://");
  while (separator !== -1) {
    let start = separator;
    while (start > 0 && /[a-z0-9+.-]/u.test(text[start - 1])) start -= 1;
    if (start < separator && /[a-z]/u.test(text[start])) return true;
    separator = text.indexOf("://", separator + 3);
  }
  return false;
}

function containsLink(text: string): boolean {
  const detected = detectionText(text);
  const compact = detected.replace(/\s+/gu, "");
  return containsExplicitUri(compact)
    || /(?:https?|hxxps?|ftp|mailto|tel|data|javascript):/iu.test(compact)
    || /(?:\bwww\.|discord(?:app)?\.(?:gg|com\/invite))/iu.test(compact)
    || /discord(?:app)?(?:\.|\s+dot\s+)com\s*\/\s*invite\b/iu.test(detected)
    || /discord\s*(?:\.|\s+dot\s+)\s*gg\b/iu.test(detected)
    || /\[[^\]\r\n]{0,500}\]\([^\)\r\n]{1,1000}\)/u.test(detected)
    || /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/u.test(detected)
    // Match an adjacent domain-label pair rather than a backtracking repetition
    // over an unbounded chain of labels. Subdomains still contain such a pair.
    || /[\p{L}\p{N}](?:[\p{L}\p{N}-]{0,61}[\p{L}\p{N}])?\s*\.\s*(?:\p{L}{2,63}|xn--[a-z0-9-]{2,59})(?=$|[^\p{L}\p{N}-])/iu.test(detected);
}

/** Text chunks join back to the exact source. Never split a surrogate pair. */
export function splitPartnerAlertText(text: string): readonly string[] {
  if (typeof text !== "string" || !text.trim() || text.length > PARTNER_ALERT_MAX_TEXT_LENGTH
    || LONE_SURROGATE.test(text)) throw new PartnerAlertValidationError("text");
  const parts: string[] = [];
  let offset = 0;
  while (offset < text.length) {
    let end = Math.min(offset + PART_LENGTH, text.length);
    if (end < text.length) {
      const newline = text.lastIndexOf("\n", end - 1);
      if (newline > offset + PART_LENGTH / 2) end = newline + 1;
      const last = text.charCodeAt(end - 1);
      if (last >= 0xd800 && last <= 0xdbff) end -= 1;
    }
    parts.push(text.slice(offset, end));
    offset = end;
  }
  return Object.freeze(parts);
}

/** Run only on a server-parsed complete message; partial UPDATE payloads need hydration first. */
export function evaluatePartnerAlertContent(input: Readonly<{
  message: PartnerAlertSourceMessage;
  mapping: unknown;
  policy: unknown;
  activatedAtUtc: string;
  nowUtc: string;
}>): PartnerAlertContentDecision {
  const mapping = parsePartnerAlertMappingDraft(input.mapping);
  const policy = parsePartnerAlertContentPolicy(input.policy);
  const message = input.message;
  const now = partnerAlertUtc(input.nowUtc, "nowUtc");
  const activatedAt = partnerAlertUtc(input.activatedAtUtc, "activatedAtUtc");
  partnerAlertSnowflake(message.messageId, "messageId");
  partnerAlertSnowflake(message.guildId, "guildId");
  partnerAlertSnowflake(message.channelId, "channelId");
  partnerAlertSnowflake(message.authorId, "authorId");
  if (message.guildId !== mapping.sourceGuildId || message.channelId !== mapping.sourceChannelId) {
    return Object.freeze({ action: "ignore", reason: "unmapped_source" });
  }
  if (message.authorId === policy.mirrorBotUserId) return Object.freeze({ action: "ignore", reason: "mirror_output" });
  if (typeof message.botAuthored !== "boolean" || typeof message.webhookAuthored !== "boolean") {
    throw new PartnerAlertValidationError("author");
  }
  const authorAllowed = policy.authorMode === "allowlist"
    ? policy.allowedAuthorIds.includes(message.authorId) : !message.botAuthored && !message.webhookAuthored;
  if (!authorAllowed) return Object.freeze({ action: "ignore", reason: "author_not_allowed" });
  partnerAlertInteger(message.messageType, "messageType", 0, 1000);
  // Ordinary posts only; no system messages, replies or thread starters in this slice.
  if (message.messageType !== 0) return Object.freeze({ action: "ignore", reason: "unsupported_message_type" });
  const issues = new Set<PartnerAlertContentIssue>();
  let createdAt: string;
  let editedAt: string | null;
  try {
    createdAt = partnerAlertUtc(message.createdAtUtc, "createdAtUtc");
    editedAt = message.editedAtUtc === null ? null : partnerAlertUtc(message.editedAtUtc, "editedAtUtc");
    if (createdAt > now || activatedAt > now || (editedAt !== null && (editedAt < createdAt || editedAt > now))) {
      issues.add("invalid_timestamp");
    }
    if (createdAt < activatedAt) return Object.freeze({ action: "ignore", reason: "before_activation" });
  } catch {
    issues.add("invalid_timestamp");
  }
  const counts = [message.attachmentCount, message.embedCount, message.stickerCount, message.componentCount];
  counts.forEach(count => partnerAlertInteger(count, "mediaCount", 0, 1000));
  if (typeof message.hasPoll !== "boolean") throw new PartnerAlertValidationError("hasPoll");
  if (counts.some(count => count > 0) || message.hasPoll) issues.add("unsupported_media");
  if (typeof message.text !== "string") throw new PartnerAlertValidationError("text");
  if (!message.text.trim()) issues.add("empty_text");
  if (message.text.length > PARTNER_ALERT_MAX_TEXT_LENGTH) issues.add("oversized_text");
  else {
    if (INVISIBLE_OR_CONTROL.test(message.text) || LONE_SURROGATE.test(message.text)) issues.add("unsupported_text");
    if (containsLink(message.text)) issues.add("link_or_invite");
    const phrases = phraseText(message.text);
    if ([...policy.blockedServerNames, ...policy.blockedPhrases]
      .some(phrase => phrases.includes(phraseText(phrase)))
      || /\b(?:join (?:our|my|the) (?:discord|server|community)|link in (?:my |our |the )?bio|dm (?:me|us) to join)\b/iu.test(phrases)) {
      issues.add("server_promotion");
    }
    if (/<(?:@!?[0-9]+|@&[0-9]+|#[0-9]+)>|@everyone\b|@here\b/iu.test(detectionText(message.text))) {
      issues.add("discord_mention");
    }
  }
  if (issues.size) return Object.freeze({ action: "hold", issues: Object.freeze([...issues]) });
  const parts = splitPartnerAlertText(message.text);
  if (parts.some(part => !part.trim())) {
    return Object.freeze({ action: "hold", issues: Object.freeze(["unsupported_text" as const]) });
  }
  return Object.freeze({ action: "allow", text: message.text,
    parts, suppressMentions: true });
}

export const PARTNER_ALERT_CONTENT_MESSAGES: Readonly<Record<PartnerAlertContentIssue, string>> = Object.freeze({
  empty_text: "This post has no text to publish.",
  unsupported_media: "Only text posts can be published. Remove media, attachments and embeds.",
  link_or_invite: "This post contains a link or invite.",
  server_promotion: "This post mentions a blocked server name or promotes a community.",
  discord_mention: "Remove Discord mentions before publishing.",
  invalid_timestamp: "The post’s date or revision could not be verified.",
  oversized_text: "This post is too long to publish safely.",
  unsupported_text: "This post contains unsupported or hidden characters.",
  delayed_post: "This post arrived too late to publish automatically.",
});
