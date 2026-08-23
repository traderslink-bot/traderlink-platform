import "server-only";

import type Database from "better-sqlite3";

import { narrowWorkspaceAccessToAccount, type WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { JournalDashboardReadModelService } from "@/src/modules/journal-analytics/server/journal-dashboard-read-model-service";
import type { JournalRuleIdeaDisposition, JournalRuleIdeaEvidence, JournalRuleIdeaRecord } from "@/src/modules/journal/contracts/journal-rule-idea-contracts";
import { JournalAnalyticsFactSetRepository } from "@/src/modules/journal/server/analytics/journal-analytics-fact-set-repository";
import { JournalAnalyticsFactSetService } from "@/src/modules/journal/server/analytics/journal-analytics-fact-set-service";
import { JournalRuleRepository } from "@/src/modules/journal/server/annotations/journal-rule-repository";
import { withWritableJournalIntegrityRuntime } from "@/src/modules/journal/server/journal-integrity-runtime";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

import { JournalRuleIdeaRepository } from "./journal-rule-idea-repository";
import { JournalRuleIdeaService } from "./journal-rule-idea-service";
import { compareJournalRuleIdeaSupport } from "./journal-rule-idea-detector";
import { detectJournalRuleIdeasInRepresentativeWindow } from "./journal-rule-idea-window";

function accountScope(scope: WorkspaceAccessScope) {
  if (!scope.activeAccountId || !scope.allowedAccountIds.includes(scope.activeAccountId)) {
    platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  }
  return narrowWorkspaceAccessToAccount(scope, scope.activeAccountId);
}

function swingIds(database: Database.Database, scope: WorkspaceAccessScope): ReadonlySet<string> {
  return new Set((database.prepare(`SELECT round_trip_id
FROM journal_trade_style_plans
WHERE workspace_id = ? AND account_id = ? AND lifecycle_state = 'active'
  AND trade_style = 'swing'`).all(scope.workspaceId, scope.activeAccountId) as Array<{ round_trip_id: string }>)
    .map((row) => row.round_trip_id));
}

export function readJournalRuleIdeaCandidates(scope: WorkspaceAccessScope, asOfUtc = new Date().toISOString()): readonly JournalRuleIdeaEvidence[] {
  return withReadonlyPlatformDatabase({}, (database) => {
    const account = accountScope(scope);
    const facts = new JournalAnalyticsFactSetService(new JournalAnalyticsFactSetRepository(database));
    const dashboard = new JournalDashboardReadModelService(facts);
    const latest = dashboard.getTradingDay(scope, { requestedDate: null, currency: null, asOfUtc });
    const swings = swingIds(database, scope);
    const activeTemplateIds = new Set(new JournalRuleRepository(database).list(account)
      .filter((rule) => rule.lifecycleState === "active" && rule.sourceKind === "template" && rule.templateKey)
      .map((rule) => rule.templateKey!));
    const results = latest.availableCurrencies.flatMap((currency) => {
      const models = latest.availableTradingDates.map((date) => dashboard.getTradingDay(scope, {
        requestedDate: date,
        currency,
        asOfUtc,
      }));
      return detectJournalRuleIdeasInRepresentativeWindow({ models, swingRoundTripIds: swings, activeTemplateIds, asOfUtc });
    });
    return Object.freeze(results.sort(compareJournalRuleIdeaSupport));
  });
}

export function issueNextJournalRuleIdea(scope: WorkspaceAccessScope, asOfUtc = new Date().toISOString()): JournalRuleIdeaRecord | null {
  const candidates = readJournalRuleIdeaCandidates(scope, asOfUtc);
  return withWritableJournalIntegrityRuntime(scope, (_runtime, database) =>
    new JournalRuleIdeaService(new JournalRuleIdeaRepository(database)).issueNext(accountScope(scope), candidates, asOfUtc));
}

export function listJournalRuleIdeas(scope: WorkspaceAccessScope): readonly JournalRuleIdeaRecord[] {
  return withReadonlyPlatformDatabase({}, (database) =>
    new JournalRuleIdeaService(new JournalRuleIdeaRepository(database)).list(accountScope(scope)));
}

export function setJournalRuleIdeaDisposition(scope: WorkspaceAccessScope, input: Readonly<{
  ideaId: string;
  expectedRevision: number;
  disposition: Exclude<JournalRuleIdeaDisposition, "available">;
  asOfUtc?: string;
}>): JournalRuleIdeaRecord {
  return withWritableJournalIntegrityRuntime(scope, (_runtime, database) => {
    const account = accountScope(scope);
    const ideas = new JournalRuleIdeaRepository(database);
    if (input.disposition === "added") {
      const idea = ideas.list(account).find((candidate) => candidate.ideaId === input.ideaId);
      const matchingActiveRule = idea && new JournalRuleRepository(database).list(account).some((rule) =>
        rule.lifecycleState === "active" && rule.sourceKind === "template" &&
        rule.templateKey === idea.evidence.templateId &&
        JSON.stringify(rule.configuration) === JSON.stringify(idea.evidence.configuration));
      if (!matchingActiveRule) platformFailure("TRADERLINK_RULE_IDEA_CONFLICT");
    }
    return new JournalRuleIdeaService(ideas).setDisposition(account, {
      ideaId: input.ideaId,
      expectedRevision: input.expectedRevision,
      disposition: input.disposition,
      asOfUtc: input.asOfUtc ?? new Date().toISOString(),
    });
  });
}

export function dismissAndIssueNextJournalRuleIdea(scope: WorkspaceAccessScope, input: Readonly<{
  ideaId: string;
  expectedRevision: number;
  asOfUtc?: string;
}>): JournalRuleIdeaRecord | null {
  const asOfUtc = input.asOfUtc ?? new Date().toISOString();
  const evidence = readJournalRuleIdeaCandidates(scope, asOfUtc);
  return withWritableJournalIntegrityRuntime(scope, (_runtime, database) =>
    new JournalRuleIdeaService(new JournalRuleIdeaRepository(database)).dismissAndIssueNext(
      accountScope(scope),
      {
        ideaId: input.ideaId,
        expectedRevision: input.expectedRevision,
        evidence,
        asOfUtc,
      },
    ));
}
