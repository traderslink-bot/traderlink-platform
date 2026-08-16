import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { coachAiChatRuntimeCapabilityRegistry } from "./coach-ai-chat-capability-registry";
import { coachAiChatFactualToolRegistry } from "./coach-ai-chat-factual-tool-registry";
import {
  COACH_AI_CHAT_LANGUAGE_INVENTORY_SOURCE_SHA256,
  coachAiChatLanguageInventory,
  coachAiChatRuntimeCapabilityCoverage,
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
    expect(coachAiChatLanguageInventory.filter((entry) => entry.runtimeCapabilityIds.length > 0).length)
      .toBeGreaterThanOrEqual(30);
    for (const entry of coachAiChatLanguageInventory) {
      for (const runtimeCapabilityId of entry.runtimeCapabilityIds) {
        expect(runtimeCapabilityIds.has(runtimeCapabilityId)).toBe(true);
      }
    }
  });

  it("requires a canonical mapping and validated representative language fixture for every live capability family", () => {
    const capabilityById = new Map<string, (typeof coachAiChatRuntimeCapabilityRegistry)[number]>(
      coachAiChatRuntimeCapabilityRegistry.map((capability) => [capability.id, capability]),
    );
    const coverageById = new Map(
      coachAiChatRuntimeCapabilityCoverage.map((coverage) => [coverage.runtimeCapabilityId, coverage]),
    );
    const fixtureIds = new Set<string>();
    const fixtureToolNames = new Set<string>();
    const actionDraftKinds = new Set<string>();

    expect(coverageById.size).toBe(coachAiChatRuntimeCapabilityRegistry.length);

    for (const capability of coachAiChatRuntimeCapabilityRegistry) {
      const coverage = coverageById.get(capability.id);
      expect(coverage).toBeDefined();
      expect(coverage!.canonicalNames.length).toBeGreaterThan(0);
      expect(capability.canonicalNames).toEqual([...coverage!.canonicalNames].sort());

      for (const canonicalName of coverage!.canonicalNames) {
        const entry = coachAiChatLanguageInventory.find((candidate) => candidate.canonicalName === canonicalName);
        expect(entry).toBeDefined();
        expect(entry!.runtimeCapabilityIds).toContain(capability.id);
      }

      expect(coverage!.representativeFixtures.length).toBeGreaterThan(0);
      for (const fixture of coverage!.representativeFixtures) {
        expect(fixtureIds.has(fixture.id)).toBe(false);
        fixtureIds.add(fixture.id);
        expect(fixture.surface.trim()).not.toBe("");
        expect(fixture.input.trim()).not.toBe("");
        expect(fixture.expectedRoute.trim()).not.toBe("");
        expect(fixture.expectedKind).toBe(capability.kind);
        for (const toolName of fixture.expectedFactualToolNames) {
          fixtureToolNames.add(toolName);
        }
        if ("expectedActionDraftKind" in fixture && fixture.expectedActionDraftKind !== undefined) {
          expect(fixture.expectedKind).toBe("confirmed_draft");
          actionDraftKinds.add(fixture.expectedActionDraftKind);
        }
      }
    }

    expect([...coverageById.keys()].every((id) => capabilityById.has(id))).toBe(true);

    const registryToolNames = coachAiChatFactualToolRegistry.map(({ name }) => name).sort();
    expect([...fixtureToolNames].sort()).toEqual(registryToolNames);

    const actionContract = readFileSync(path.join(
      process.cwd(),
      "src",
      "modules",
      "coach",
      "contracts",
      "ai-chat-action-draft-contracts.ts",
    ), "utf8");
    const actionExtractionSection = actionContract.slice(
      0,
      actionContract.indexOf("export type CoachAiChatActionDraftPreview"),
    );
    const contractActionKinds = [...actionExtractionSection.matchAll(/^ {6}kind: "([^"]+)";$/gmu)]
      .map((match) => match[1]!);

    // The action contract intentionally exports a discriminated TypeScript
    // union rather than a runtime list. Parsing its top-level branches here
    // makes the fixture guard track the canonical contract without changing
    // the concurrent action service.
    expect([...actionDraftKinds].sort()).toEqual([...new Set(contractActionKinds)].sort());
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
