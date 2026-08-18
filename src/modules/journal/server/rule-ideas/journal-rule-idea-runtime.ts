import "server-only";

import type Database from "better-sqlite3";

import { narrowWorkspaceAccessToAccount, type WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import type { JournalTradingDayReadModel } from "@/src/modules/journal-analytics/contracts/journal-dashboard-read-models";
import { JournalDashboardReadModelService } from "@/src/modules/journal-analytics/server/journal-dashboard-read-model-service";
import type { JournalRuleIdeaDisposition, JournalRuleIdeaEvidence, JournalRuleIdeaRecord } from "@/src/modules/journal/contracts/journal-rule-idea-contracts";
import { JournalAnalyticsFactSetRepository } from "@/src/modules/journal/server/analytics/journal-analytics-fact-set-repository";
import { JournalAnalyticsFactSetService } from "@/src/modules/journal/server/analytics/journal-analytics-fact-set-service";
import { JournalRuleRepository } from "@/src/modules/journal/server/annotations/journal-rule-repository";
import { withWritableJournalIntegrityRuntime } from "@/src/modules/journal/server/journal-integrity-runtime";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

import { detectJournalRuleIdeas } from "./journal-rule-idea-detector";
import { JournalRuleIdeaRepository } from "./journal-rule-idea-repository";
import { JournalRuleIdeaService } from "./journal-rule-idea-service";

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

function dayTradeCount(model: JournalTradingDayReadModel, swings: ReadonlySet<string>): number {
  return model.tickers.flatMap((ticker) => ticker.roundTrips).filter((trade) =>
    !swings.has(trade.roundTripId) && trade.entryAtUtc.slice(0, 10) <= model.date && trade.exitAtUtc.slice(0, 10) >= model.date,
  ).length;
}

function representativeWindow(models: readonly JournalTradingDayReadModel[], swings: ReadonlySet<string>): readonly JournalTradingDayReadModel[] {
  if (models.length === 0) return Object.freeze([]);
  const sorted = [...models].sort((left, right) => left.date.localeCompare(right.date));
  const latest = Date.parse(`${sorted.at(-1)!.date}T00:00:00.000Z`);
  let first = sorted.findIndex((model) => latest - Date.parse(`${model.date}T00:00:00.000Z`) <= 13 * 86_400_000);
  if (first < 0) first = sorted.length - 1;
  while (first > 0) {
    const selected = sorted.slice(first);
    const days = selected.filter((model) => dayTradeCount(model, swings) > 0).length;
    const trades = selected.reduce((count, model) => count + dayTradeCount(model, swings), 0);
    const executions = new Set(selected.flatMap((model) => model.executionActivity
      .filter((execution) => !execution.needsDecision && execution.projectionStates.includes("ready_closed"))
      .map((execution) => execution.executionVersionId))).size;
    if (days >= 3 && trades >= 20 && executions >= 50) break;
    first -= 1;
  }
  return Object.freeze(sorted.slice(first));
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
      const models = representativeWindow(latest.availableTradingDates.map((date) => dashboard.getTradingDay(scope, {
        requestedDate: date,
        currency,
        asOfUtc,
      })), swings);
      return detectJournalRuleIdeas({ models, swingRoundTripIds: swings, activeTemplateIds, asOfUtc });
    });
    return Object.freeze(results.sort((left, right) =>
      right.triggerDays - left.triggerDays || right.affectedTradeCount - left.affectedTradeCount ||
      left.templateId.localeCompare(right.templateId) || left.currency.localeCompare(right.currency)));
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
