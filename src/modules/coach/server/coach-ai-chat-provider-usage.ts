import type { CoachAiChatGenerationUsage } from
  "@/src/modules/coach/contracts/ai-chat-contracts";

export type CoachAiChatProviderUsageInput = Readonly<{
  inputTokens?: number;
  inputTokenDetails?: Readonly<{
    cacheReadTokens?: number;
    cacheWriteTokens?: number;
  }>;
  inputTokensDetails?: readonly Readonly<Record<string, number>>[];
  outputTokens?: number;
  totalTokens?: number;
}>;

function unavailableUsage(): CoachAiChatGenerationUsage {
  return Object.freeze({
    inputTokens: null,
    cachedInputTokens: null,
    cacheWriteInputTokens: null,
    outputTokens: null,
    totalTokens: null,
  });
}

function detailValue(
  row: Readonly<Record<string, number>>,
  ...keys: string[]
): number | null {
  for (const key of keys) {
    if (Number.isSafeInteger(row[key]) && row[key]! >= 0) return row[key]!;
  }
  return null;
}

export function completeCoachAiChatProviderUsage(
  value: CoachAiChatProviderUsageInput,
): CoachAiChatGenerationUsage {
  const detailRows: readonly Readonly<Record<string, number>>[] =
    value.inputTokensDetails ?? (value.inputTokenDetails
      ? Object.freeze([Object.freeze({ ...value.inputTokenDetails })])
      : Object.freeze([]));
  const cachedValues = detailRows.map((row) =>
    detailValue(row, "cached_tokens", "cache_read_tokens", "cacheReadTokens"));
  const cacheWriteValues = detailRows.map((row) =>
    detailValue(row, "cache_write_tokens", "cacheWriteTokens"));
  const cachedInputTokens = cachedValues.length > 0 &&
      cachedValues.every((item) => item !== null)
    ? cachedValues.reduce((sum, item) => sum + item!, 0)
    : undefined;
  const cacheWriteInputTokens = cacheWriteValues.length > 0 &&
      cacheWriteValues.every((item) => item !== null)
    ? cacheWriteValues.reduce((sum, item) => sum + item!, 0)
    : undefined;
  if (![value.inputTokens, cachedInputTokens, cacheWriteInputTokens,
    value.outputTokens, value.totalTokens]
      .every((item) => Number.isSafeInteger(item) && (item as number) >= 0) ||
      (cachedInputTokens as number) + (cacheWriteInputTokens as number) >
        (value.inputTokens as number) ||
      value.totalTokens !== (value.inputTokens as number) + (value.outputTokens as number)) {
    return unavailableUsage();
  }
  return Object.freeze({
    inputTokens: value.inputTokens!,
    cachedInputTokens: cachedInputTokens!,
    cacheWriteInputTokens: cacheWriteInputTokens!,
    outputTokens: value.outputTokens!,
    totalTokens: value.totalTokens!,
  });
}
