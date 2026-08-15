import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { coachAiChatRuntimeCapabilityRegistry } from "./coach-ai-chat-capability-registry";
import {
  COACH_AI_CHAT_LANGUAGE_INVENTORY_SOURCE_SHA256,
  coachAiChatLanguageInventory,
} from "./coach-ai-chat-language-inventory.generated";

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
});
