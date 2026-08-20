import {
  buildCoachAiChatClaimCatalog,
  validateCoachAiChatExactFactTokens,
} from "@/src/modules/coach/server/coach-ai-chat-claim-catalog";

function invariant(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const toolCalls = Object.freeze([Object.freeze({
  toolCallId: "factual-1",
  toolName: "summarize_closed_trades",
  request: Object.freeze({}),
  result: Object.freeze({
    currency: "USD",
    tradingTimezone: "America/New_York",
    population: Object.freeze({ includedCount: 3 }),
    bestTradingDay: Object.freeze({ date: "2026-08-19", pnlDecimal: "800" }),
  }),
  serializedResultBytes: 160,
})]);

const catalog = buildCoachAiChatClaimCatalog(toolCalls);
invariant(catalog.some((claim) => claim.exactValue === "800" &&
  claim.context.currency === "USD"),
"The claim catalog must retain exact values with currency context.");

validateCoachAiChatExactFactTokens({
  directAnswer: "Your strongest day was 2026-08-19 at $800 USD.",
  supportingObservations: Object.freeze(["That population included 3 trades."]),
  limitation: null,
  evidenceReferences: Object.freeze([Object.freeze({
    toolCallId: "factual-1",
    statement: "The saved result reports $800 USD on 2026-08-19 across 3 trades.",
  })]),
  toolCalls,
});

let rejected = false;
try {
  validateCoachAiChatExactFactTokens({
    directAnswer: "Your strongest day made $900 USD.",
    supportingObservations: Object.freeze([]),
    limitation: null,
    evidenceReferences: Object.freeze([Object.freeze({
      toolCallId: "factual-1",
      statement: "The saved result reports $800 USD.",
    })]),
    toolCalls,
  });
} catch {
  rejected = true;
}
invariant(rejected, "An exact value absent from cited deterministic evidence must be rejected.");

console.log(JSON.stringify({
  status: "verified",
  catalogClaims: catalog.length,
  unsupportedExactValueRejected: rejected,
}));
