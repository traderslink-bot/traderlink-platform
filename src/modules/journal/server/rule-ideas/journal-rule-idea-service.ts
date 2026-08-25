import { createHash } from "node:crypto";

import {
  type JournalRuleIdeaDisposition,
  type JournalRuleIdeaEvidence,
  type JournalRuleIdeaRecord,
} from "@/src/modules/journal/contracts/journal-rule-idea-contracts";
import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  createCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

import { JournalRuleIdeaRepository } from "./journal-rule-idea-repository";

const DAY_MS = 86_400_000;

function canonicalEvidence(evidence: JournalRuleIdeaEvidence): Readonly<{ json: string; sha256: string }> {
  const json = JSON.stringify(evidence);
  return Object.freeze({ json, sha256: createHash("sha256").update(json, "utf8").digest("hex") });
}

function timestamp(value: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) platformFailure("TRADERLINK_RULE_IDEA_INVALID");
  return parsed;
}

export class JournalRuleIdeaService {
  constructor(private readonly repository: JournalRuleIdeaRepository) {}

  list(scope: AccountScope): readonly JournalRuleIdeaRecord[] {
    return this.repository.list(scope);
  }

  issueNext(
    scope: AccountScope,
    evidence: readonly JournalRuleIdeaEvidence[],
    asOfUtc: string,
    options: Readonly<{ allowFollowUpInCurrentCheck?: boolean }> = {},
  ): JournalRuleIdeaRecord | null {
    const now = timestamp(asOfUtc);
    return this.repository.immediate(() => {
      const current = this.repository.list(scope);
      const retained = current.find((idea) => idea.disposition === "available" || idea.disposition === "saved_for_later");
      if (retained) return retained;
      const latestIssued = this.repository.latestIssuedAt(scope);
      if (!options.allowFollowUpInCurrentCheck && latestIssued && now - timestamp(latestIssued) < 28 * DAY_MS) return null;
      const selected = evidence.find((candidate) => {
        const prior = current.find((idea) => idea.evidence.templateId === candidate.templateId);
        if (!prior) return true;
        if (prior.disposition === "added") return false;
        return prior.disposition !== "not_for_me" || now - timestamp(prior.updatedAtUtc) >= 90 * DAY_MS;
      });
      if (!selected) return null;
      const normalized = canonicalEvidence(selected);
      const prior = current.find((idea) => idea.evidence.templateId === selected.templateId);
      if (prior) {
        const updated = this.repository.append({
          scope,
          current: prior,
          versionId: createCanonicalUuidV4(),
          eventKind: "reissued",
          disposition: "available",
          evidenceJson: normalized.json,
          evidenceSha256: normalized.sha256,
          timestamp: asOfUtc,
        });
        if (!updated) platformFailure("TRADERLINK_RULE_IDEA_CONFLICT");
      } else {
        this.repository.insert({
          scope,
          ideaId: createCanonicalUuidV4(),
          versionId: createCanonicalUuidV4(),
          evidenceJson: normalized.json,
          evidenceSha256: normalized.sha256,
          timestamp: asOfUtc,
        });
      }
      return this.repository.list(scope).find((idea) => idea.evidence.templateId === selected.templateId) ?? null;
    });
  }

  setDisposition(scope: AccountScope, input: Readonly<{
    ideaId: string;
    expectedRevision: number;
    disposition: Exclude<JournalRuleIdeaDisposition, "available">;
    asOfUtc: string;
  }>): JournalRuleIdeaRecord {
    timestamp(input.asOfUtc);
    return this.repository.immediate(() => {
      const current = this.repository.list(scope).find((idea) => idea.ideaId === input.ideaId);
      if (!current || current.revision !== input.expectedRevision ||
          (current.disposition !== "available" && current.disposition !== "saved_for_later")) {
        return platformFailure("TRADERLINK_RULE_IDEA_CONFLICT");
      }
      const evidence = canonicalEvidence(current.evidence);
      const updated = this.repository.append({
        scope,
        current,
        versionId: createCanonicalUuidV4(),
        eventKind: input.disposition,
        disposition: input.disposition,
        evidenceJson: evidence.json,
        evidenceSha256: evidence.sha256,
        timestamp: input.asOfUtc,
      });
      if (!updated) return platformFailure("TRADERLINK_RULE_IDEA_CONFLICT");
      return this.repository.list(scope).find((idea) => idea.ideaId === input.ideaId)!;
    });
  }

  dismissAndIssueNext(scope: AccountScope, input: Readonly<{
    ideaId: string;
    expectedRevision: number;
    evidence: readonly JournalRuleIdeaEvidence[];
    asOfUtc: string;
  }>): JournalRuleIdeaRecord | null {
    return this.repository.immediate(() => {
      this.setDisposition(scope, {
        ideaId: input.ideaId,
        expectedRevision: input.expectedRevision,
        disposition: "not_for_me",
        asOfUtc: input.asOfUtc,
      });
      return this.issueNext(scope, input.evidence, input.asOfUtc, {
        allowFollowUpInCurrentCheck: true,
      });
    });
  }
}
