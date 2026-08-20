import {
  buildCoachAiChatClaimCatalog,
  buildCoachAiChatProviderToolResult,
  validateCoachAiChatExactFactTokens,
} from "@/src/modules/coach/server/coach-ai-chat-claim-catalog";
import {
  COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
} from
  "@/src/modules/coach/contracts/coach-ai-chat-factual-tool-contracts";

function invariant(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const toolCalls = Object.freeze([Object.freeze({
  toolCallId: "factual-1",
  toolName: "summarize_closed_trades",
  request: Object.freeze({}),
  result: Object.freeze({
    contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
    toolName: "summarize_closed_trades" as const,
    result: Object.freeze({
      currency: "USD",
      tradingTimezone: "America/New_York",
      population: Object.freeze({ includedCount: 3 }),
      bestTradingDay: Object.freeze({ date: "2026-08-19", pnlDecimal: "800" }),
    }),
  }),
  serializedResultBytes: 160,
})]);

const catalog = buildCoachAiChatClaimCatalog(toolCalls);
const providerToolResult = buildCoachAiChatProviderToolResult(
  toolCalls[0]!.toolCallId,
  toolCalls[0]!.result,
);
invariant(providerToolResult.result === toolCalls[0]!.result.result,
  "The provider must receive one result wrapper, not a double-wrapped response.");
invariant(catalog.every((claim) => !claim.path.startsWith("/result/")),
  "Claim paths must be relative to the provider-visible factual payload.");
invariant(catalog.some((claim) => claim.exactValue === "800" &&
  claim.context.currency === "USD"),
"The claim catalog must retain exact values with currency context.");
const claimRef = (path: string): string => {
  const claim = catalog.find((item) => item.path === path);
  invariant(Boolean(claim), `Missing expected claim at ${path}.`);
  return claim!.claimRef;
};

validateCoachAiChatExactFactTokens({
  directAnswer: "Your strongest day was 2026-08-19 at $800 USD.",
  supportingObservations: Object.freeze(["That population included 3 trades."]),
  limitation: null,
  evidenceReferences: Object.freeze([Object.freeze({
    toolCallId: "factual-1",
    claimRefs: Object.freeze([
      claimRef("/bestTradingDay/date"),
      claimRef("/bestTradingDay/pnlDecimal"),
      claimRef("/population/includedCount"),
    ]),
    statement: "The saved result reports $800 USD on 2026-08-19 across 3 trades.",
  })]),
  toolCalls,
});

const scheduleToolCalls = Object.freeze([Object.freeze({
  toolCallId: "factual-2",
  toolName: "get_account_ai_plan",
  request: Object.freeze({}),
  result: Object.freeze({
    contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
    toolName: "get_account_ai_plan" as const,
    result: Object.freeze({
      renewalPeriodEndUtc: "2026-09-01T00:00:00.000Z",
      deliveryTimeEastern: "18:00",
    }),
  }),
  serializedResultBytes: 96,
})]);
const scheduleCatalog = buildCoachAiChatClaimCatalog(scheduleToolCalls);
const scheduleClaimRef = (path: string): string => {
  const claim = scheduleCatalog.find((item) => item.path === path);
  invariant(Boolean(claim), `Missing expected schedule claim at ${path}.`);
  return claim!.claimRef;
};
validateCoachAiChatExactFactTokens({
  directAnswer: "Your period ends September 1, 2026, and delivery is at 6:00 PM Eastern.",
  supportingObservations: Object.freeze([]),
  limitation: null,
  evidenceReferences: Object.freeze([Object.freeze({
    toolCallId: "factual-2",
    claimRefs: Object.freeze([
      scheduleClaimRef("/renewalPeriodEndUtc"),
      scheduleClaimRef("/deliveryTimeEastern"),
    ]),
    statement: "The period ends September 1, 2026, and delivery is at 6:00 PM Eastern.",
  })]),
  toolCalls: scheduleToolCalls,
});

let rejected = false;
try {
  validateCoachAiChatExactFactTokens({
    directAnswer: "Your strongest day made $900 USD.",
    supportingObservations: Object.freeze([]),
    limitation: null,
    evidenceReferences: Object.freeze([Object.freeze({
      toolCallId: "factual-1",
      claimRefs: Object.freeze([claimRef("/bestTradingDay/pnlDecimal")]),
      statement: "The saved result reports $800 USD.",
    })]),
    toolCalls,
  });
} catch {
  rejected = true;
}
invariant(rejected, "An exact value absent from cited deterministic evidence must be rejected.");

let unselectedRejected = false;
try {
  validateCoachAiChatExactFactTokens({
    directAnswer: "The population included 3 trades.",
    supportingObservations: Object.freeze([]),
    limitation: null,
    evidenceReferences: Object.freeze([Object.freeze({
      toolCallId: "factual-1",
      claimRefs: Object.freeze([claimRef("/bestTradingDay/pnlDecimal")]),
      statement: "The result reports $800 USD across 3 trades.",
    })]),
    toolCalls,
  });
} catch {
  unselectedRejected = true;
}
invariant(unselectedRejected,
  "A value from an unselected deterministic claim must be rejected.");

let crossCallRejected = false;
try {
  validateCoachAiChatExactFactTokens({
    directAnswer: "The result reports $800 USD.",
    supportingObservations: Object.freeze([]),
    limitation: null,
    evidenceReferences: Object.freeze([Object.freeze({
      toolCallId: "factual-2",
      claimRefs: Object.freeze([claimRef("/bestTradingDay/pnlDecimal")]),
      statement: "The result reports $800 USD.",
    })]),
    toolCalls,
  });
} catch {
  crossCallRejected = true;
}
invariant(crossCallRejected,
  "A claim selected under a different tool call must be rejected.");

let unusedClaimRejected = false;
try {
  validateCoachAiChatExactFactTokens({
    directAnswer: "The result reports $800 USD.",
    supportingObservations: Object.freeze([]),
    limitation: null,
    evidenceReferences: Object.freeze([Object.freeze({
      toolCallId: "factual-1",
      claimRefs: Object.freeze([
        claimRef("/bestTradingDay/pnlDecimal"),
        claimRef("/population/includedCount"),
      ]),
      statement: "The result reports $800 USD.",
    })]),
    toolCalls,
  });
} catch {
  unusedClaimRejected = true;
}
invariant(unusedClaimRejected,
  "An exact claim selected but unused by its evidence statement must be rejected.");

console.log(JSON.stringify({
  status: "verified",
  catalogClaims: catalog.length,
  unsupportedExactValueRejected: rejected,
  unselectedClaimValueRejected: unselectedRejected,
  crossToolClaimRejected: crossCallRejected,
  unusedSelectedClaimRejected: unusedClaimRejected,
  equivalentDateTimeFormattingAccepted: true,
  providerClaimPathRootAligned: true,
}));
