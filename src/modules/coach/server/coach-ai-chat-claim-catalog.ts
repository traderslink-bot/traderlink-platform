import { createHash } from "node:crypto";

import type { CoachAiChatFactualToolCallSnapshot } from
  "@/src/modules/coach/contracts/ai-chat-contracts";

export type CoachAiChatClaim = Readonly<{
  claimRef: string;
  toolCallId: string;
  path: string;
  valueType: "string" | "number" | "boolean" | "null" | "empty_array" | "empty_object";
  exactValue: string | number | boolean | null;
  context: Readonly<Record<string, string | number | boolean | null>>;
}>;

export type CoachAiChatProviderToolResult<TResult = unknown> = Readonly<{
  toolCallId: string;
  result: TResult;
}>;

const MAX_CLAIMS = 2_048;
const MAX_STRING_CLAIM_LENGTH = 256;
const CONTEXT_KEY = /(?:currency|timezone|time_zone|population|coverage|unit|scope|as_of|asof)/iu;
const ISO_DATE_TIME = /\b(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?Z?)?\b/gu;
const MONTH_DATE = /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,\s*|\s+)(\d{4})\b/giu;
const CLOCK_TIME = /\b(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*(a\.?m\.?|p\.?m\.?)\b|\b([01]?\d|2[0-3]):([0-5]\d)\b/giu;
const SIMPLE_FACT_TOKEN = /(?:[-+]?\$?\d[\d,]*(?:\.\d+)?%?|\b(?:USD|CAD|EUR|GBP|JPY|AUD|NZD|CHF|CNY|HKD)\b)/gu;
const MONTH_NUMBERS: Readonly<Record<string, string>> = Object.freeze({
  jan: "01", january: "01", feb: "02", february: "02", mar: "03", march: "03",
  apr: "04", april: "04", may: "05", jun: "06", june: "06", jul: "07", july: "07",
  aug: "08", august: "08", sep: "09", sept: "09", september: "09", oct: "10",
  october: "10", nov: "11", november: "11", dec: "12", december: "12",
});

function pointerPart(value: string): string {
  return value.replace(/~/gu, "~0").replace(/\//gu, "~1");
}

function claimRef(toolCallId: string, path: string, exactValue: unknown): string {
  return `claim_${createHash("sha256").update(JSON.stringify({ toolCallId, path, exactValue }), "utf8").digest("hex").slice(0, 24)}`;
}

function walk(
  toolCallId: string,
  value: unknown,
  path: string,
  inheritedContext: Readonly<Record<string, string | number | boolean | null>>,
  output: CoachAiChatClaim[],
): void {
  if (output.length >= MAX_CLAIMS) return;
  if (value === null || typeof value === "string" || typeof value === "number" ||
      typeof value === "boolean") {
    if (typeof value === "string" && value.length > MAX_STRING_CLAIM_LENGTH) return;
    output.push(Object.freeze({
      claimRef: claimRef(toolCallId, path, value),
      toolCallId,
      path,
      valueType: value === null ? "null" : typeof value,
      exactValue: value,
      context: Object.freeze({ ...inheritedContext }),
    }) as CoachAiChatClaim);
    return;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      output.push(Object.freeze({
        claimRef: claimRef(toolCallId, path, []),
        toolCallId,
        path,
        valueType: "empty_array",
        exactValue: null,
        context: Object.freeze({ ...inheritedContext }),
      }));
      return;
    }
    value.forEach((item, index) => walk(
      toolCallId,
      item,
      `${path}/${index}`,
      inheritedContext,
      output,
    ));
    return;
  }
  if (typeof value !== "object") return;
  const record = value as Record<string, unknown>;
  if (Object.keys(record).length === 0) {
    output.push(Object.freeze({
      claimRef: claimRef(toolCallId, path, {}),
      toolCallId,
      path,
      valueType: "empty_object",
      exactValue: null,
      context: Object.freeze({ ...inheritedContext }),
    }));
    return;
  }
  const localContext: Record<string, string | number | boolean | null> = {
    ...inheritedContext,
  };
  for (const [key, item] of Object.entries(record)) {
    if (CONTEXT_KEY.test(key) &&
        (item === null || typeof item === "string" || typeof item === "number" ||
          typeof item === "boolean")) {
      localContext[key] = item;
    }
  }
  for (const key of Object.keys(record).sort()) {
    walk(toolCallId, record[key], `${path}/${pointerPart(key)}`, localContext, output);
  }
}

export function buildCoachAiChatClaimCatalog(
  toolCalls: readonly CoachAiChatFactualToolCallSnapshot[],
): readonly CoachAiChatClaim[] {
  const claims: CoachAiChatClaim[] = [];
  for (const call of toolCalls) {
    const wrapper = call.result && typeof call.result === "object" &&
        !Array.isArray(call.result)
      ? call.result as Record<string, unknown>
      : null;
    const claimRoot = wrapper && Object.hasOwn(wrapper, "contractVersion") &&
        Object.hasOwn(wrapper, "toolName") && Object.hasOwn(wrapper, "result")
      ? wrapper.result
      : call.result;
    walk(call.toolCallId, claimRoot, "", Object.freeze({}), claims);
  }
  return Object.freeze(claims);
}

/**
 * Gives the provider the exact payload used as the claim-path root. Contract
 * metadata stays server-authored and does not need to be echoed inside every
 * tool result.
 */
export function buildCoachAiChatProviderToolResult<TResult>(
  toolCallId: string,
  response: Readonly<{ result: TResult }>,
): CoachAiChatProviderToolResult<TResult> {
  return Object.freeze({ toolCallId, result: response.result });
}

function normalizedSimpleToken(value: string): string {
  const upper = value.toUpperCase();
  if (/^[A-Z]{3}$/u.test(upper)) return upper;
  const numeric = value.replace(/[$,%]/gu, "").replace(/,/gu, "");
  const parsed = Number(numeric);
  return Number.isFinite(parsed) ? String(parsed) : value;
}

function tokens(value: string): readonly string[] {
  const output: string[] = [];
  const masked = [...value];
  const consume = (match: RegExpExecArray): void => {
    for (let index = match.index; index < match.index + match[0].length; index += 1) {
      masked[index] = " ";
    }
  };
  for (const match of value.matchAll(ISO_DATE_TIME)) {
    output.push(`date:${match[1]}-${match[2]}-${match[3]}`);
    if (match[4] && match[5]) output.push(`time:${match[4]}:${match[5]}`);
    consume(match);
  }
  for (const match of value.matchAll(MONTH_DATE)) {
    const month = MONTH_NUMBERS[match[1]!.replace(".", "").toLowerCase()];
    if (month) output.push(`date:${match[3]}-${month}-${match[2]!.padStart(2, "0")}`);
    consume(match);
  }
  for (const match of masked.join("").matchAll(CLOCK_TIME)) {
    if (match[1]) {
      const meridiem = match[3]!.replaceAll(".", "").toLowerCase();
      let hour = Number(match[1]) % 12;
      if (meridiem === "pm") hour += 12;
      output.push(`time:${String(hour).padStart(2, "0")}:${match[2] ?? "00"}`);
    } else {
      output.push(`time:${match[4]!.padStart(2, "0")}:${match[5]}`);
    }
    consume(match);
  }
  output.push(...(masked.join("").match(SIMPLE_FACT_TOKEN) ?? [])
    .map(normalizedSimpleToken));
  return Object.freeze(output);
}

function serializedEvidenceTokens(value: unknown): ReadonlySet<string> {
  return new Set(tokens(JSON.stringify(value)));
}

function claimEvidenceTokens(claim: CoachAiChatClaim): ReadonlySet<string> {
  return new Set([
    ...tokens(String(claim.exactValue ?? "")),
    ...tokens(JSON.stringify(claim.context)),
  ]);
}

/**
 * Provider pointer syntax is attribution, not the evidence authority. Select
 * scalar claims from the server-saved tool result that support the text Links
 * will actually return, so an equivalent wrapper path cannot discard a normal
 * grounded answer.
 */
export function selectCoachAiChatClaimsForText(
  claims: readonly CoachAiChatClaim[],
  text: string,
): readonly CoachAiChatClaim[] {
  const textTokens = new Set(tokens(text));
  return Object.freeze(claims.filter((claim) => {
    const evidenceTokens = claimEvidenceTokens(claim);
    if ([...evidenceTokens].some((token) => textTokens.has(token))) return true;
    return typeof claim.exactValue === "string" &&
      /^[\p{L}][\p{L} .'-]{0,79}$/u.test(claim.exactValue) &&
      text.toLocaleLowerCase().includes(claim.exactValue.toLocaleLowerCase());
  }));
}

/**
 * Returns whether one selected scalar claim is actually used by an evidence
 * statement. This lets the server drop harmless over-citation while the final
 * validator still rejects every unsupported exact token in the answer.
 */
export function coachAiChatClaimSupportsStatement(
  claim: CoachAiChatClaim,
  statement: string,
): boolean {
  const statementTokens = new Set(tokens(statement));
  const exactTokens = tokens(String(claim.exactValue ?? ""));
  if (exactTokens.length > 0) {
    return exactTokens.some((token) => statementTokens.has(token));
  }
  if (typeof claim.exactValue === "string" &&
      /^[\p{L}][\p{L} .'-]{0,79}$/u.test(claim.exactValue)) {
    return statement.toLocaleLowerCase().includes(
      claim.exactValue.toLocaleLowerCase(),
    );
  }
  return true;
}

/**
 * Rejects exact-value prose that is absent from the deterministic tool result
 * it cites. This is intentionally stricter than tool-call identity checking.
 */
export function validateCoachAiChatExactFactTokens(input: Readonly<{
  directAnswer: string;
  supportingObservations: readonly string[];
  limitation: string | null;
  evidenceReferences: readonly Readonly<{
    toolCallId: string;
    claimRefs: readonly string[];
    statement: string;
  }>[];
  toolCalls: readonly CoachAiChatFactualToolCallSnapshot[];
  additionalEvidence?: readonly unknown[];
}>): void {
  const catalog = buildCoachAiChatClaimCatalog(input.toolCalls);
  const claimsByRef = new Map(catalog.map((claim) => [claim.claimRef, claim]));
  for (const reference of input.evidenceReferences) {
    if (reference.claimRefs.length < 1 ||
        new Set(reference.claimRefs).size !== reference.claimRefs.length) {
      throw new Error("TRADERLINK_COACH_UNGROUNDED_EXACT_FACT");
    }
    const selectedClaims = reference.claimRefs.map((claimReference) =>
      claimsByRef.get(claimReference));
    if (selectedClaims.some((claim) => !claim || claim.toolCallId !== reference.toolCallId)) {
      throw new Error("TRADERLINK_COACH_UNGROUNDED_EXACT_FACT");
    }
    // Cited tool-call identity and server-selected scalar claims are still
    // mandatory. The final complete answer is checked below against their
    // union; do not reject it merely because the model's short citation
    // sentence omits a second scalar used in the direct answer.
  }
  const selected = new Set<string>();
  for (const reference of input.evidenceReferences) {
    for (const claimRef of reference.claimRefs) {
      const claim = claimsByRef.get(claimRef)!;
      for (const token of claimEvidenceTokens(claim)) selected.add(token);
    }
  }
  for (const item of input.additionalEvidence ?? []) {
    for (const token of serializedEvidenceTokens(item)) selected.add(token);
  }
  const answerTokens = tokens([
    input.directAnswer,
    ...input.supportingObservations,
    input.limitation ?? "",
  ].join("\n"));
  if (answerTokens.some((token) => !selected.has(token))) {
    throw new Error("TRADERLINK_COACH_UNGROUNDED_EXACT_FACT");
  }
}
