import type Database from "better-sqlite3";

import {
  type JournalRuleIdeaDisposition,
  type JournalRuleIdeaEvidence,
  type JournalRuleIdeaRecord,
} from "@/src/modules/journal/contracts/journal-rule-idea-contracts";
import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";

type Row = Readonly<{
  rule_idea_id: string;
  evidence_json: string;
  evidence_sha256: string;
  disposition: JournalRuleIdeaDisposition;
  revision: number;
  created_at_utc: string;
  updated_at_utc: string;
}>;

const SELECT = `SELECT idea.rule_idea_id, version.evidence_json,
  version.evidence_sha256, idea.disposition, idea.revision,
  idea.created_at_utc, idea.updated_at_utc
FROM journal_rule_ideas idea
JOIN journal_rule_idea_versions version
  ON version.workspace_id = idea.workspace_id AND version.account_id = idea.account_id
 AND version.rule_idea_id = idea.rule_idea_id
 AND version.rule_idea_version_id = idea.current_version_id`;

function map(row: Row): JournalRuleIdeaRecord {
  return Object.freeze({
    ideaId: row.rule_idea_id,
    evidence: Object.freeze(JSON.parse(row.evidence_json) as JournalRuleIdeaEvidence),
    evidenceSha256: row.evidence_sha256,
    disposition: row.disposition,
    revision: Number(row.revision),
    createdAtUtc: row.created_at_utc,
    updatedAtUtc: row.updated_at_utc,
  });
}

export class JournalRuleIdeaRepository {
  constructor(private readonly database: Database.Database) {}

  immediate<T>(operation: () => T): T {
    return this.database.inTransaction ? operation() : this.database.transaction(operation).immediate();
  }

  list(scope: AccountScope): readonly JournalRuleIdeaRecord[] {
    return Object.freeze((this.database.prepare(`${SELECT}
WHERE idea.workspace_id = ? AND idea.account_id = ?
ORDER BY idea.updated_at_utc DESC, idea.rule_idea_id`).all(scope.workspaceId, scope.accountId) as Row[]).map(map));
  }

  latestIssuedAt(scope: AccountScope): string | null {
    const row = this.database.prepare(`SELECT created_at_utc
FROM journal_rule_idea_versions
WHERE workspace_id = ? AND account_id = ? AND event_kind IN ('issued', 'reissued')
ORDER BY created_at_utc DESC, rule_idea_version_id DESC LIMIT 1`).get(scope.workspaceId, scope.accountId) as { created_at_utc: string } | undefined;
    return row?.created_at_utc ?? null;
  }

  insert(input: Readonly<{ scope: AccountScope; ideaId: string; versionId: string; evidenceJson: string; evidenceSha256: string; timestamp: string }>): void {
    const evidence = JSON.parse(input.evidenceJson) as JournalRuleIdeaEvidence;
    this.database.prepare(`INSERT INTO journal_rule_idea_versions (
 rule_idea_version_id, workspace_id, account_id, rule_idea_id, version_number,
 event_kind, disposition, evidence_version, evidence_json, evidence_sha256,
 authored_by_user_id, created_at_utc
) VALUES (?, ?, ?, ?, 1, 'issued', 'available', ?, ?, ?, ?, ?)`).run(
      input.versionId, input.scope.workspaceId, input.scope.accountId, input.ideaId,
      evidence.evidenceVersion, input.evidenceJson, input.evidenceSha256,
      input.scope.userId, input.timestamp,
    );
    this.database.prepare(`INSERT INTO journal_rule_ideas (
 rule_idea_id, workspace_id, account_id, template_id, current_version_id,
 disposition, revision, created_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, 'available', 1, ?, ?, ?)`).run(
      input.ideaId, input.scope.workspaceId, input.scope.accountId, evidence.templateId,
      input.versionId, input.scope.userId, input.timestamp, input.timestamp,
    );
  }

  append(input: Readonly<{
    scope: AccountScope;
    current: JournalRuleIdeaRecord;
    versionId: string;
    eventKind: "reissued" | "saved_for_later" | "not_for_me" | "added";
    disposition: JournalRuleIdeaDisposition;
    evidenceJson: string;
    evidenceSha256: string;
    timestamp: string;
  }>): boolean {
    const nextRevision = input.current.revision + 1;
    this.database.prepare(`INSERT INTO journal_rule_idea_versions (
 rule_idea_version_id, workspace_id, account_id, rule_idea_id, version_number,
 event_kind, disposition, evidence_version, evidence_json, evidence_sha256,
 authored_by_user_id, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      input.versionId, input.scope.workspaceId, input.scope.accountId, input.current.ideaId,
      nextRevision, input.eventKind, input.disposition, input.current.evidence.evidenceVersion,
      input.evidenceJson, input.evidenceSha256, input.scope.userId, input.timestamp,
    );
    return this.database.prepare(`UPDATE journal_rule_ideas
SET current_version_id = ?, disposition = ?, revision = ?, updated_at_utc = ?
WHERE workspace_id = ? AND account_id = ? AND rule_idea_id = ? AND revision = ?`).run(
      input.versionId, input.disposition, nextRevision, input.timestamp,
      input.scope.workspaceId, input.scope.accountId, input.current.ideaId,
      input.current.revision,
    ).changes === 1;
  }
}
