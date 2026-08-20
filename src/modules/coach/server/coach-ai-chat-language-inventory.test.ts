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
      coachAiChatRuntimeCapabilityRegistry.capabilities.map((capability) => capability.id),
    );
    const mappedEntries = coachAiChatLanguageInventory
      .filter((entry) => entry.runtimeCapabilityIds.length > 0);
    const dispositions = Object.groupBy(
      coachAiChatLanguageInventory,
      (entry) => entry.runtimeMappingDisposition,
    );

    expect(coachAiChatLanguageInventory).toHaveLength(417);
    expect(digest).toBe(COACH_AI_CHAT_LANGUAGE_INVENTORY_SOURCE_SHA256);
    expect(mappedEntries).toHaveLength(239);
    expect(new Set(mappedEntries.map((entry) => entry.canonicalName)).size).toBe(235);
    expect(mappedEntries.reduce((total, entry) => total + entry.runtimeCapabilityIds.length, 0))
      .toBe(774);
    expect(dispositions.mapped_live).toHaveLength(239);
    expect(dispositions.not_exposed_by_current_runtime).toHaveLength(136);
    expect(dispositions.source_status_unavailable).toHaveLength(32);
    expect(dispositions.evaluation_only).toHaveLength(10);
    for (const entry of coachAiChatLanguageInventory) {
      expect(entry.runtimeMappingReason.trim()).not.toBe("");
      expect(entry.runtimeMappingDisposition === "mapped_live")
        .toBe(entry.runtimeCapabilityIds.length > 0);
      for (const runtimeCapabilityId of entry.runtimeCapabilityIds) {
        expect(runtimeCapabilityIds.has(runtimeCapabilityId)).toBe(true);
      }
    }

    const globalPolicies = coachAiChatLanguageInventory
      .filter((entry) => entry.categoryFile === "19-language-policies.md");
    expect(globalPolicies).toHaveLength(11);
    for (const policy of globalPolicies) {
      expect(policy.runtimeCapabilityIds).toEqual([...runtimeCapabilityIds].sort());
    }

    const evaluationOnly = coachAiChatLanguageInventory
      .filter((entry) => entry.categoryFile === "20-evaluation-suite.md");
    expect(evaluationOnly).toHaveLength(10);
    expect(evaluationOnly.every((entry) =>
      entry.runtimeCapabilityIds.length === 0 &&
      entry.runtimeMappingDisposition === "evaluation_only")).toBe(true);
  });

  it("requires canonical mappings and contract-validated fixture metadata for every live capability family", () => {
    const capabilityById = new Map<
      string,
      (typeof coachAiChatRuntimeCapabilityRegistry.capabilities)[number]
    >(
      coachAiChatRuntimeCapabilityRegistry.capabilities.map((capability) => [capability.id, capability]),
    );
    const coverageById = new Map(
      coachAiChatRuntimeCapabilityCoverage.map((coverage) => [coverage.runtimeCapabilityId, coverage]),
    );
    const fixtureIds = new Set<string>();
    const fixtureToolNames = new Set<string>();
    const actionDraftKinds = new Set<string>();

    expect(coachAiChatRuntimeCapabilityRegistry.capabilities).toHaveLength(13);
    expect(coachAiChatRuntimeCapabilityCoverage)
      .toHaveLength(coachAiChatRuntimeCapabilityRegistry.capabilities.length);
    expect(new Set(coachAiChatRuntimeCapabilityCoverage
      .map((coverage) => coverage.runtimeCapabilityId)).size)
      .toBe(coachAiChatRuntimeCapabilityCoverage.length);
    expect(coverageById.size).toBe(coachAiChatRuntimeCapabilityRegistry.capabilities.length);

    for (const capability of coachAiChatRuntimeCapabilityRegistry.capabilities) {
      const coverage = coverageById.get(capability.id);
      expect(coverage).toBeDefined();
      expect(coverage!.canonicalNames.length).toBeGreaterThan(0);
      const compactRegistryNames = coachAiChatRuntimeCapabilityRegistry.canonicalLanguageGroups
        .filter((group) => group.runtimeCapabilityIds.includes(capability.id))
        .flatMap((group) => group.canonicalNames)
        .sort();
      expect(compactRegistryNames).toEqual([...coverage!.canonicalNames].sort());

      for (const canonicalName of coverage!.canonicalNames) {
        const entries = coachAiChatLanguageInventory
          .filter((candidate) => candidate.canonicalName === canonicalName);
        expect(entries.length).toBeGreaterThan(0);
        expect(entries.every((entry) => entry.runtimeCapabilityIds.includes(capability.id)))
          .toBe(true);
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
    expect(fixtureIds.size).toBe(24);

    const compactRoutes = new Map(
      coachAiChatRuntimeCapabilityRegistry.canonicalLanguageGroups.flatMap((group) =>
        group.canonicalNames.map((canonicalName) => [canonicalName, group.runtimeCapabilityIds] as const)),
    );
    expect(compactRoutes.size).toBe(235);
    for (const entry of coachAiChatLanguageInventory.filter((candidate) =>
      candidate.runtimeCapabilityIds.length > 0)) {
      expect(compactRoutes.get(entry.canonicalName)).toEqual(entry.runtimeCapabilityIds);
    }

    const registryToolNames = coachAiChatFactualToolRegistry.map(({ name }) => name).sort();
    expect(registryToolNames).toHaveLength(36);
    expect(fixtureToolNames.size).toBe(36);
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
    expect(new Set(contractActionKinds).size).toBe(12);
    expect(actionDraftKinds.size).toBe(12);
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
