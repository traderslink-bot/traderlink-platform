import { completeCoachAiChatProviderUsage } from
  "@/src/modules/coach/server/coach-ai-chat-provider-usage";

function invariant(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const currentSdk = completeCoachAiChatProviderUsage(Object.freeze({
  inputTokens: 1_200,
  inputTokensDetails: Object.freeze([
    Object.freeze({ cached_tokens: 300, cache_write_tokens: 100 }),
    Object.freeze({ cached_tokens: 200, cache_write_tokens: 0 }),
  ]),
  outputTokens: 80,
  totalTokens: 1_280,
}));
invariant(currentSdk.cachedInputTokens === 500 &&
  currentSdk.cacheWriteInputTokens === 100 && currentSdk.totalTokens === 1_280,
"Current Agents SDK usage arrays must retain complete cache accounting.");

const legacySdk = completeCoachAiChatProviderUsage(Object.freeze({
  inputTokens: 400,
  inputTokenDetails: Object.freeze({ cacheReadTokens: 120, cacheWriteTokens: 20 }),
  outputTokens: 40,
  totalTokens: 440,
}));
invariant(legacySdk.cachedInputTokens === 120 && legacySdk.cacheWriteInputTokens === 20,
  "The accepted legacy Agents SDK usage shape must remain readable.");

const incomplete = completeCoachAiChatProviderUsage(Object.freeze({
  inputTokens: 400,
  inputTokensDetails: Object.freeze([Object.freeze({ cached_tokens: 120 })]),
  outputTokens: 40,
  totalTokens: 440,
}));
invariant(incomplete.totalTokens === null,
  "Incomplete cache-write accounting must continue to fail closed.");

console.log(JSON.stringify({
  status: "verified",
  currentSdkUsageArraysAccepted: true,
  legacySdkUsageAccepted: true,
  incompleteUsageRejected: true,
}));
