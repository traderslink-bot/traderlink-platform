import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { coachAiChatRuntimeCapabilityRegistry } from "./coach-ai-chat-capability-registry";
import { coachAiChatFactualToolRegistry } from "./coach-ai-chat-factual-tool-registry";
import {
  COACH_AI_CHAT_LANGUAGE_INVENTORY_SOURCE_SHA256,
  coachAiChatLanguageInventory,
} from "./coach-ai-chat-language-inventory.generated";
import { verifyCoachAiChatFactualToolInventory } from "./coach-ai-chat-openai-adapter";

describe("Coach AI Chat language inventory", () => {
  it("stays synchronized with all locked category files and maps only real runtime capabilities", () => {
    const categoryDirectory = path.join(
      process.cwd(),
      "docs",
      "migration",
      "language-inventory",
      "categories",
    );
    const source = readdirSync(categoryDirectory)
      .filter((fileName) => /^\d{2}-.*\.md$/u.test(fileName))
      .sort((left, right) => left.localeCompare(right))
      .map((fileName) => `${fileName}\n${readFileSync(path.join(categoryDirectory, fileName), "utf8")
        .replace(/\r\n?/gu, "\n")}\n`)
      .join("");
    const digest = createHash("sha256").update(source, "utf8").digest("hex");
    const runtimeCapabilityIds = new Set<string>(
      coachAiChatRuntimeCapabilityRegistry.map((capability) => capability.id),
    );

    expect(coachAiChatLanguageInventory).toHaveLength(417);
    expect(digest).toBe(COACH_AI_CHAT_LANGUAGE_INVENTORY_SOURCE_SHA256);
    expect(coachAiChatLanguageInventory.filter((entry) => entry.runtimeCapabilityId !== null).length)
      .toBeGreaterThanOrEqual(30);
    for (const entry of coachAiChatLanguageInventory) {
      if (entry.runtimeCapabilityId !== null) {
        expect(runtimeCapabilityIds.has(entry.runtimeCapabilityId)).toBe(true);
      }
    }
  });

  it("fails closed when the Agents SDK tool inventory drifts from the deterministic registry", () => {
    const exactToolNames = coachAiChatFactualToolRegistry.map(({ name }) => name);

    expect(() => verifyCoachAiChatFactualToolInventory(exactToolNames)).not.toThrow();
    expect(() => verifyCoachAiChatFactualToolInventory(exactToolNames.slice(0, -1)))
      .toThrow("TRADERLINK_COACH_CAPABILITY_REGISTRY_MISMATCH");
    expect(() => verifyCoachAiChatFactualToolInventory([
      exactToolNames[1]!,
      exactToolNames[0]!,
      ...exactToolNames.slice(2),
    ])).toThrow("TRADERLINK_COACH_CAPABILITY_REGISTRY_MISMATCH");
  });
});
