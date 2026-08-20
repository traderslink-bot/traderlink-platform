import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  COACH_AI_CHAT_ACTION_DRAFT_KIND_INVENTORY_COMPLETE,
  COACH_AI_CHAT_ACTION_DRAFT_KINDS,
} from "@/src/modules/coach/contracts/ai-chat-action-draft-contracts";
import {
  COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  COACH_AI_CHAT_FACTUAL_TOOL_NAMES,
} from "@/src/modules/coach/contracts/coach-ai-chat-factual-tool-contracts";
import { coachAiChatRuntimeCapabilityRegistry } from
  "@/src/modules/coach/server/coach-ai-chat-capability-registry";
import { coachAiChatFactualToolRegistry } from
  "@/src/modules/coach/server/coach-ai-chat-factual-tool-registry";
import {
  coachAiChatLanguageInventory,
  coachAiChatRuntimeCapabilityCoverage,
} from
  "@/src/modules/coach/server/coach-ai-chat-language-inventory.generated";

function invariant(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function unique(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}

const registeredNames = coachAiChatFactualToolRegistry.map(({ name }) => name);
invariant(COACH_AI_CHAT_FACTUAL_TOOL_NAMES.length === 36,
  "Links AI Chat must expose the accepted 36-name factual-tool contract.");
invariant(unique(COACH_AI_CHAT_FACTUAL_TOOL_NAMES),
  "The factual-tool contract contains a duplicate name.");
invariant(registeredNames.length === COACH_AI_CHAT_FACTUAL_TOOL_NAMES.length &&
  registeredNames.every((name, index) => name === COACH_AI_CHAT_FACTUAL_TOOL_NAMES[index]),
"The factual-tool registry must exactly match the ordered contract inventory.");
invariant(coachAiChatFactualToolRegistry.every((definition) =>
  definition.contractVersion === COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION &&
  definition.description.trim().length > 0 && definition.limitations.length > 0),
"Every factual tool must retain its contract version, description, and limitations.");

invariant(COACH_AI_CHAT_ACTION_DRAFT_KIND_INVENTORY_COMPLETE === true &&
  COACH_AI_CHAT_ACTION_DRAFT_KINDS.length === 12 &&
  unique(COACH_AI_CHAT_ACTION_DRAFT_KINDS),
"Links AI Chat must retain exactly 12 unique, exhaustively typed action-draft kinds.");

const capabilityIds = coachAiChatRuntimeCapabilityRegistry.capabilities.map(({ id }) => id);
invariant(unique(capabilityIds), "The runtime capability registry contains duplicate IDs.");
const capabilityIdSet = new Set<string>(capabilityIds);
for (const entry of coachAiChatLanguageInventory) {
  invariant(entry.runtimeCapabilityIds.every((id) => capabilityIdSet.has(id)),
    `Language entry ${entry.canonicalName} references an unknown runtime capability.`);
}
const fixtureTools = new Set(coachAiChatRuntimeCapabilityCoverage.flatMap((coverage) =>
  coverage.representativeFixtures.flatMap((fixture) => fixture.expectedFactualToolNames)));
invariant(fixtureTools.size === COACH_AI_CHAT_FACTUAL_TOOL_NAMES.length &&
  COACH_AI_CHAT_FACTUAL_TOOL_NAMES.every((name) => fixtureTools.has(name)),
"Representative language fixtures must cover every factual tool exactly by union.");
const fixtureActionKinds = new Set(coachAiChatRuntimeCapabilityCoverage.flatMap((coverage) =>
  coverage.representativeFixtures.flatMap((fixture) =>
    fixture.expectedActionDraftKind ? [fixture.expectedActionDraftKind] : [])));
invariant(fixtureActionKinds.size === COACH_AI_CHAT_ACTION_DRAFT_KINDS.length &&
  COACH_AI_CHAT_ACTION_DRAFT_KINDS.every((kind) => fixtureActionKinds.has(kind)),
"Representative language fixtures must cover every confirmed action-draft kind.");

const currentDocuments = [
  "docs/migration/ai-chat-complete-qa-report.md",
  "docs/migration/ai-chat-current-dashboard-capability-matrix.md",
  "docs/migration/ai-chat-professional-agent-remediation-progress.md",
  "docs/migration/traderlink-ai-chat-language-reconciliation-progress.md",
];
for (const documentPath of currentDocuments) {
  const text = readFileSync(resolve(process.cwd(), documentPath), "utf8");
  invariant(!/\b34 factual tools\b|\b34-tool\b|\ball 34 names\b/iu.test(text),
    `${documentPath} still claims the retired 34-tool inventory.`);
}

console.log(JSON.stringify({
  status: "verified",
  factualTools: registeredNames.length,
  actionDraftKinds: COACH_AI_CHAT_ACTION_DRAFT_KINDS.length,
  runtimeCapabilities: capabilityIds.length,
  languageEntries: coachAiChatLanguageInventory.length,
  currentDocumentsChecked: currentDocuments.length,
}));
