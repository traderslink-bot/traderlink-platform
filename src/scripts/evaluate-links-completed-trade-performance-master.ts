import {
  evaluateCoachAiChatCompletedTradeMasterInventory,
} from "@/src/modules/coach/server/coach-ai-chat-completed-trade-performance-master-evaluator";

const report = evaluateCoachAiChatCompletedTradeMasterInventory();
const wrongPlanCases = report.cases.filter((item) => item.wrongPlan);
const silentlyDroppedModifiers = report.cases.filter((item) =>
  item.silentlyDroppedModifiers.length > 0,
).map((item) => Object.freeze({
  caseId: item.caseId,
  question: item.question,
  modifiers: item.silentlyDroppedModifiers,
}));

const status = report.masterInventory.classified === report.masterInventory.total &&
  report.resolved.wrongPlan === 0 &&
  report.resolved.silentlyDroppedModifiers === 0 &&
  report.componentEvaluation.passed
  ? "passed" as const
  : "failed" as const;

process.stdout.write(`${JSON.stringify(Object.freeze({
  status,
  version: report.version,
  providerCalls: report.providerCalls,
  masterInventory: report.masterInventory,
  resolved: report.resolved,
  componentEvaluation: report.componentEvaluation,
  wrongPlanCases,
  silentlyDroppedModifiers,
}), null, 2)}\n`);

if (status === "failed") process.exitCode = 1;
