import {
  COACH_AI_CHAT_FACTUAL_RESULTS_CUMULATIVE_PROMPT_MAX_BYTES,
  COACH_AI_CHAT_FACTUAL_RESULTS_MAX_BYTES,
  COACH_AI_CHAT_FACTUAL_TOOL_CALL_MAX_COUNT,
  nextCoachAiChatCumulativeResultBytes,
} from "@/src/modules/coach/server/coach-ai-chat-factual-tool-dispatcher";
import {
  COACH_AI_CHAT_MAX_TOOL_CALLS,
  COACH_AI_CHAT_MAX_TURNS,
} from "@/src/modules/coach/contracts/ai-chat-orchestration-contracts";

function invariant(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

invariant(COACH_AI_CHAT_MAX_TURNS === 3,
  "The unevaluated runtime must retain two bounded lookup steps and one answer turn.");
invariant(COACH_AI_CHAT_MAX_TOOL_CALLS === 4 &&
  COACH_AI_CHAT_FACTUAL_TOOL_CALL_MAX_COUNT === 4,
"Structured evidence and dispatcher limits must agree on four factual calls.");

let cumulativeBytes = 0;
let totalBytes = 0;
for (let index = 0; index < COACH_AI_CHAT_FACTUAL_TOOL_CALL_MAX_COUNT; index += 1) {
  const nextResultBytes = 4 * 1024;
  const next = nextCoachAiChatCumulativeResultBytes({
    currentCumulativeBytes: cumulativeBytes,
    currentTotalBytes: totalBytes,
    nextResultBytes,
  });
  invariant(next !== null, "Four small deterministic results must fit the budget.");
  totalBytes += nextResultBytes;
  cumulativeBytes = next;
}

const oversized = nextCoachAiChatCumulativeResultBytes({
  currentCumulativeBytes: COACH_AI_CHAT_FACTUAL_RESULTS_CUMULATIVE_PROMPT_MAX_BYTES,
  currentTotalBytes: COACH_AI_CHAT_FACTUAL_RESULTS_MAX_BYTES,
  nextResultBytes: 1,
});
invariant(oversized === null,
  "A result beyond either total or cumulative provider budget must be rejected.");

console.log(JSON.stringify({
  status: "verified",
  maximumAgentTurns: COACH_AI_CHAT_MAX_TURNS,
  maximumSequentialLookupSteps: COACH_AI_CHAT_MAX_TURNS - 1,
  dispatcherSnapshotCap: COACH_AI_CHAT_FACTUAL_TOOL_CALL_MAX_COUNT,
  factualResultBytes: COACH_AI_CHAT_FACTUAL_RESULTS_MAX_BYTES,
  cumulativePromptResultBytes: COACH_AI_CHAT_FACTUAL_RESULTS_CUMULATIVE_PROMPT_MAX_BYTES,
  cumulativeBudgetSupportsFourSmallResults: true,
  oversizedSequenceRejected: true,
}));
