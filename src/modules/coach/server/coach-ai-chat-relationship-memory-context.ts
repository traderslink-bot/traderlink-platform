import { Buffer } from "node:buffer";

import type { CoachAiRelationshipMemory } from
  "../contracts/ai-relationship-memory-contracts";

export const COACH_AI_CHAT_MAX_RELATIONSHIP_MEMORY_BYTES = 8 * 1024;

export type CoachAiChatRelationshipMemoryContext = Readonly<{
  category: CoachAiRelationshipMemory["category"];
  text: string;
  scope: string;
  status: "current" | "previously_shared_needs_review";
}>;

export function selectCoachAiChatRelationshipMemories(
  enabled: boolean,
  memories: readonly CoachAiRelationshipMemory[],
): readonly CoachAiRelationshipMemory[] {
  if (!enabled) return Object.freeze([]);
  let bytes = 0;
  const accepted: CoachAiRelationshipMemory[] = [];
  for (const memory of memories) {
    const size = Buffer.byteLength(JSON.stringify({
      category: memory.category,
      text: memory.text,
      scope: memory.scopeLabel,
      needsReview: memory.needsReview,
    }), "utf8");
    if (bytes + size > COACH_AI_CHAT_MAX_RELATIONSHIP_MEMORY_BYTES) continue;
    bytes += size;
    accepted.push(memory);
  }
  return Object.freeze(accepted);
}

export function projectCoachAiChatRelationshipMemoryContext(
  memories: readonly CoachAiRelationshipMemory[],
): readonly CoachAiChatRelationshipMemoryContext[] {
  return Object.freeze(memories.map((memory) => Object.freeze({
    category: memory.category,
    text: memory.text,
    scope: memory.scopeLabel,
    status: memory.needsReview
      ? "previously_shared_needs_review" as const
      : "current" as const,
  })));
}
