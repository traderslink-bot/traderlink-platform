import { describe, expect, it } from "vitest";
import { PATTERN_DEFINITIONS } from "../../pattern-detection/registry/pattern-definitions";
import { PATTERN_METADATA } from "../pattern-metadata";
import {
  getDominanceRulesForDominantPattern,
  getDominanceRulesForSuppressedPattern,
  getSuppressionGroupsForPattern,
  LEGACY_MANUAL_PATTERN_DOMINANCE_RULES,
  MANUAL_EXCEPTION_PATTERN_DOMINANCE_RULES,
  METADATA_INFERRED_DOMINANCE_RULE_SUMMARY_BY_CLASS,
  METADATA_INFERRED_PATTERN_DOMINANCE_RULES,
  PATTERN_DOMINANCE_RULES,
  PATTERN_DOMINANCE_RULES_BY_DOMINANT_ID,
  PATTERN_DOMINANCE_RULES_BY_SUPPRESSED_ID,
  PATTERN_SUPPRESSION_GROUPS,
} from "../pattern-suppression-rules";

function toRuleKey(args: {
  dominantPatternId: string;
  suppressedPatternId: string;
}): string {
  return `${args.dominantPatternId}=>${args.suppressedPatternId}`;
}

describe("pattern suppression integrity", () => {
  it("moves a non-trivial subset of dominance rules into metadata inference", () => {
    expect(METADATA_INFERRED_PATTERN_DOMINANCE_RULES.length).toBeGreaterThan(0);
    expect(MANUAL_EXCEPTION_PATTERN_DOMINANCE_RULES.length).toBeLessThan(
      PATTERN_DOMINANCE_RULES.length,
    );
  });

  it("supports truly metadata-driven inference beyond legacy manual pair matches", () => {
    const legacyManualKeys = new Set(
      LEGACY_MANUAL_PATTERN_DOMINANCE_RULES.map(
        (rule) => `${rule.dominantPatternId}=>${rule.suppressedPatternId}`,
      ),
    );
    const inferenceOnlyKeys = METADATA_INFERRED_PATTERN_DOMINANCE_RULES.map(
      (rule) => `${rule.dominantPatternId}=>${rule.suppressedPatternId}`,
    ).filter((key) => !legacyManualKeys.has(key));

    expect(inferenceOnlyKeys.length).toBeGreaterThan(0);
    expect(
      METADATA_INFERRED_DOMINANCE_RULE_SUMMARY_BY_CLASS.repeated_cycle_overlay,
    ).toContain(
      "repeated_balanced_management_with_premature_final_exit=>balanced_management_with_premature_final_exit",
    );
  });

  it("has no duplicate dominance pairs and no missing pattern references", () => {
    const pairKeys = PATTERN_DOMINANCE_RULES.map((rule) => toRuleKey(rule));
    const pairKeySet = new Set(pairKeys);
    const registeredPatternIds = new Set(
      PATTERN_DEFINITIONS.map((pattern) => pattern.id),
    );

    expect(pairKeySet.size).toBe(pairKeys.length);

    for (const rule of PATTERN_DOMINANCE_RULES) {
      expect(rule.dominantPatternId).not.toBe(rule.suppressedPatternId);
      expect(registeredPatternIds.has(rule.dominantPatternId)).toBe(true);
      expect(registeredPatternIds.has(rule.suppressedPatternId)).toBe(true);
    }
  });

  it("assembles the final rule graph deterministically from inferred and manual-exception rules", () => {
    const expectedOrderedKeys = [
      ...METADATA_INFERRED_PATTERN_DOMINANCE_RULES.map((rule) => toRuleKey(rule)),
      ...MANUAL_EXCEPTION_PATTERN_DOMINANCE_RULES.map((rule) => toRuleKey(rule)),
    ].filter((key, index, allKeys) => allKeys.indexOf(key) === index);

    const assembledKeys = PATTERN_DOMINANCE_RULES.map((rule) => toRuleKey(rule));

    expect(assembledKeys).toEqual(expectedOrderedKeys);
  });

  it("contains no circular dominance pairs or impossible mutual primary conflicts", () => {
    const pairKeySet = new Set(
      PATTERN_DOMINANCE_RULES.map((rule) => toRuleKey(rule)),
    );
    const metadataById = Object.fromEntries(
      PATTERN_METADATA.map((metadata) => [metadata.patternId, metadata]),
    );

    for (const rule of PATTERN_DOMINANCE_RULES) {
      expect(
        pairKeySet.has(`${rule.suppressedPatternId}=>${rule.dominantPatternId}`),
      ).toBe(false);

      const dominant = metadataById[rule.dominantPatternId];
      const suppressed = metadataById[rule.suppressedPatternId];

      if (dominant?.canBePrimary && suppressed?.canBePrimary) {
        expect(
          pairKeySet.has(
            `${rule.suppressedPatternId}=>${rule.dominantPatternId}`,
          ),
        ).toBe(false);
      }
    }
  });

  it("keeps dominant and suppressed lookup maps coherent with the assembled rules", () => {
    const assembledByDominant = new Map<string, string[]>();
    const assembledBySuppressed = new Map<string, string[]>();

    for (const rule of PATTERN_DOMINANCE_RULES) {
      assembledByDominant.set(rule.dominantPatternId, [
        ...(assembledByDominant.get(rule.dominantPatternId) ?? []),
        toRuleKey(rule),
      ]);
      assembledBySuppressed.set(rule.suppressedPatternId, [
        ...(assembledBySuppressed.get(rule.suppressedPatternId) ?? []),
        toRuleKey(rule),
      ]);
    }

    expect(Object.keys(PATTERN_DOMINANCE_RULES_BY_DOMINANT_ID).sort()).toEqual(
      [...assembledByDominant.keys()].sort(),
    );
    expect(Object.keys(PATTERN_DOMINANCE_RULES_BY_SUPPRESSED_ID).sort()).toEqual(
      [...assembledBySuppressed.keys()].sort(),
    );

    for (const [patternId, keys] of assembledByDominant.entries()) {
      expect(
        PATTERN_DOMINANCE_RULES_BY_DOMINANT_ID[patternId].map((rule) =>
          toRuleKey(rule),
        ),
      ).toEqual(keys);
      expect(
        getDominanceRulesForDominantPattern(patternId).map((rule) =>
          toRuleKey(rule),
        ),
      ).toEqual(keys);
    }

    for (const [patternId, keys] of assembledBySuppressed.entries()) {
      expect(
        PATTERN_DOMINANCE_RULES_BY_SUPPRESSED_ID[patternId].map((rule) =>
          toRuleKey(rule),
        ),
      ).toEqual(keys);
      expect(
        getDominanceRulesForSuppressedPattern(patternId).map((rule) =>
          toRuleKey(rule),
        ),
      ).toEqual(keys);
    }
  });

  it("assembles inferred dominance and manual exceptions without overlap", () => {
    const inferredKeys = new Set(
      METADATA_INFERRED_PATTERN_DOMINANCE_RULES.map((rule) => toRuleKey(rule)),
    );
    const manualExceptionKeys = MANUAL_EXCEPTION_PATTERN_DOMINANCE_RULES.map(
      (rule) => toRuleKey(rule),
    );

    for (const key of manualExceptionKeys) {
      expect(inferredKeys.has(key)).toBe(false);
    }

    for (const rule of METADATA_INFERRED_PATTERN_DOMINANCE_RULES) {
      expect(
        PATTERN_DOMINANCE_RULES.some(
          (assembledRule) => toRuleKey(assembledRule) === toRuleKey(rule),
        ),
      ).toBe(true);
    }
  });

  it("keeps suppression groups structurally valid and queryable", () => {
    expect(PATTERN_SUPPRESSION_GROUPS.length).toBeGreaterThan(0);

    const groupIds = PATTERN_SUPPRESSION_GROUPS.map((group) => group.groupId);
    const registeredPatternIds = new Set(
      PATTERN_DEFINITIONS.map((pattern) => pattern.id),
    );
    expect(new Set(groupIds).size).toBe(groupIds.length);

    const expectedGroups = [
      "entry_low_location_overlap",
      "position_build_vs_structure_overlap",
      "scaling_quality_internal_overlap",
      "exit_post_exit_outcome_overlap",
    ];

    for (const group of PATTERN_SUPPRESSION_GROUPS) {
      expect(group.description.trim().length).toBeGreaterThan(0);
      expect(group.patternIds.length).toBeGreaterThan(1);
      expect(new Set(group.patternIds).size).toBe(group.patternIds.length);

      for (const patternId of group.patternIds) {
        expect(registeredPatternIds.has(patternId)).toBe(true);
      }
    }

    for (const groupId of expectedGroups) {
      const group = PATTERN_SUPPRESSION_GROUPS.find(
        (candidate) => candidate.groupId === groupId,
      );
      expect(group).toBeDefined();
      expect(group?.patternIds.length).toBeGreaterThan(1);
    }

    expect(
      getSuppressionGroupsForPattern("advantaged_entry_structure").map(
        (group) => group.groupId,
      ),
    ).toContain("entry_low_location_overlap");
    expect(
      getSuppressionGroupsForPattern("scaled_into_position").map(
        (group) => group.groupId,
      ),
    ).toContain("position_build_vs_structure_overlap");
    expect(
      getSuppressionGroupsForPattern("balanced_position_management").map(
        (group) => group.groupId,
      ),
    ).toContain("scaling_quality_internal_overlap");
    expect(
      getSuppressionGroupsForPattern("exit_with_meaningful_giveback").map(
        (group) => group.groupId,
      ),
    ).toContain("exit_post_exit_outcome_overlap");
  });

  it("keeps broader-lineage chains acyclic", () => {
    const broaderById = Object.fromEntries(
      PATTERN_METADATA.map((metadata) => [
        metadata.patternId,
        metadata.broaderPatternIds,
      ]),
    );
    const visited = new Set<string>();
    const active = new Set<string>();

    const visit = (patternId: string): void => {
      if (visited.has(patternId)) {
        return;
      }

      expect(active.has(patternId)).toBe(false);
      active.add(patternId);

      for (const broaderPatternId of broaderById[patternId] ?? []) {
        visit(broaderPatternId);
      }

      active.delete(patternId);
      visited.add(patternId);
    };

    for (const metadata of PATTERN_METADATA) {
      visit(metadata.patternId);
      expect(metadata.lineageRoot.length).toBeGreaterThan(0);
    }
  });

  it("preserves high-value entry suppression behavior through the public lookup API", () => {
    expect(
      getDominanceRulesForDominantPattern("advantaged_entry_structure").some(
        (rule) =>
          rule.suppressedPatternId === "entry_near_trade_low" &&
          rule.outcome === "demote_to_supporting",
      ),
    ).toBe(true);
    expect(
      getDominanceRulesForSuppressedPattern("low_range_entry").some(
        (rule) =>
          rule.dominantPatternId === "entry_near_trade_low" &&
          rule.outcome === "demote_to_contextual",
      ),
    ).toBe(true);
  });

  it("preserves high-value position suppression behavior through the public lookup API", () => {
    expect(
      getDominanceRulesForDominantPattern("multi_build_full_exit").some(
        (rule) =>
          rule.suppressedPatternId === "scaled_into_position" &&
          rule.outcome === "demote_to_contextual",
      ),
    ).toBe(true);
  });

  it("preserves high-value scaling suppression behavior through the public lookup API", () => {
    expect(
      getDominanceRulesForDominantPattern("balanced_position_management").some(
        (rule) =>
          rule.suppressedPatternId === "structured_position_building" &&
          rule.outcome === "demote_to_supporting",
      ),
    ).toBe(true);
  });

  it("preserves high-value exit suppression behavior through the public lookup API", () => {
    expect(
      getDominanceRulesForDominantPattern("missed_post_exit_continuation").some(
        (rule) =>
          rule.suppressedPatternId === "exit_with_meaningful_giveback" &&
          rule.outcome === "demote_to_supporting",
      ),
    ).toBe(true);
  });
});
