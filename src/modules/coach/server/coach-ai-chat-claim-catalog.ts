import { createHash } from "node:crypto";

import type { CoachAiChatFactualToolCallSnapshot } from
  "@/src/modules/coach/contracts/ai-chat-contracts";

export type CoachAiChatClaim = Readonly<{
  claimRef: string;
  toolCallId: string;
  path: string;
  valueType: "string" | "number" | "boolean" | "null";
  exactValue: string | number | boolean | null;
  context: Readonly<Record<string, string | number | boolean | null>>;
}>;

const MAX_CLAIMS = 2_048;
const MAX_STRING_CLAIM_LENGTH = 256;
const CONTEXT_KEY = /(?:currency|timezone|time_zone|population|coverage|unit|scope|as_of|asof)/iu;
const FACT_TOKEN = /(?:[-+]?\$?\d[\d,]*(?:\.\d+)?%?|\b\d{4}-\d{2}-\d{2}\b|\b(?:USD|CAD|EUR|GBP|JPY|AUD|NZD|CHF|CNY|HKD)\b)/gu;

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
  for (const call of toolCalls) walk(call.toolCallId, call.result, "", Object.freeze({}), claims);
  return Object.freeze(claims);
}

function normalizedToken(value: string): string {
  const upper = value.toUpperCase();
  if (/^[A-Z]{3}$/u.test(upper)) return upper;
  if (/^\d{4}-\d{2}-\d{2}$/u.test(value)) return value;
  const numeric = value.replace(/[$,%]/gu, "").replace(/,/gu, "");
  const parsed = Number(numeric);
  return Number.isFinite(parsed) ? String(parsed) : value;
}

function tokens(value: string): readonly string[] {
  return Object.freeze((value.match(FACT_TOKEN) ?? []).map(normalizedToken));
}

function serializedEvidenceTokens(value: unknown): ReadonlySet<string> {
  return new Set(tokens(JSON.stringify(value)));
}

/**
 * Rejects exact-value prose that is absent from the deterministic tool result
 * it cites. This is intentionally stricter than tool-call identity checking.
 */
export function validateCoachAiChatExactFactTokens(input: Readonly<{
  directAnswer: string;
  supportingObservations: readonly string[];
  limitation: string | null;
  evidenceReferences: readonly Readonly<{ toolCallId: string; statement: string }>[];
  toolCalls: readonly CoachAiChatFactualToolCallSnapshot[];
  additionalEvidence?: readonly unknown[];
}>): void {
  const evidenceByCall = new Map(input.toolCalls.map((call) => [
    call.toolCallId,
    serializedEvidenceTokens(call.result),
  ]));
  for (const reference of input.evidenceReferences) {
    const available = evidenceByCall.get(reference.toolCallId);
    if (!available || tokens(reference.statement).some((token) => !available.has(token))) {
      throw new Error("TRADERLINK_COACH_UNGROUNDED_EXACT_FACT");
    }
  }
  const selected = new Set<string>();
  for (const reference of input.evidenceReferences) {
    for (const token of evidenceByCall.get(reference.toolCallId) ?? []) selected.add(token);
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
