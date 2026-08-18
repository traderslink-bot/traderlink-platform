import { createHash } from "node:crypto";
import { readFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import Database from "better-sqlite3";

import { JOURNAL_RULE_IDEA_EVIDENCE_VERSION, type JournalRuleIdeaEvidence } from "@/src/modules/journal/contracts/journal-rule-idea-contracts";
import { JournalAnalyticsFactSetRepository } from "@/src/modules/journal/server/analytics/journal-analytics-fact-set-repository";
import { JournalAnalyticsFactSetService } from "@/src/modules/journal/server/analytics/journal-analytics-fact-set-service";
import { JournalRuleRepository } from "@/src/modules/journal/server/annotations/journal-rule-repository";
import { detectJournalRuleIdeasInRepresentativeWindow } from "@/src/modules/journal/server/rule-ideas/journal-rule-idea-window";
import { JournalRuleIdeaRepository } from "@/src/modules/journal/server/rule-ideas/journal-rule-idea-repository";
import { JournalRuleIdeaService } from "@/src/modules/journal/server/rule-ideas/journal-rule-idea-service";
import { JournalDashboardReadModelService } from "@/src/modules/journal-analytics/server/journal-dashboard-read-model-service";
import { loadTraderLinkPlatformLocalDevelopmentConfiguration } from "@/src/modules/platform/server/authentication/local-development-configuration";
import { deriveDevelopmentOwnerJournalScope } from "@/src/modules/journal/server/accounts/journal-development-owner-scope";
import { narrowWorkspaceAccessToAccount } from "@/src/modules/platform/contracts/workspace-access-scope";
import { createCanonicalUuidV4, isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";

function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function evidence(templateId: JournalRuleIdeaEvidence["templateId"]): JournalRuleIdeaEvidence {
  const ids = Array.from({ length: 8 }, () => createCanonicalUuidV4());
  return Object.freeze({
    evidenceVersion: JOURNAL_RULE_IDEA_EVIDENCE_VERSION,
    templateId,
    configuration: Object.freeze({ maximumTrades: "3" }),
    currency: "USD",
    periodStart: "2026-08-01",
    periodEnd: "2026-08-14",
    eligibleTradingDays: 5,
    eligibleTrades: 24,
    eligibleExecutions: 60,
    triggerCount: 8,
    triggerDays: 4,
    affectedTradeCount: 8,
    comparisonTradeCount: 16,
    affectedPnlDecimal: "-240",
    comparisonPnlDecimal: "120",
    affectedAveragePnlDecimal: "-30",
    comparisonAveragePnlDecimal: "7.5",
    affectedPnlWithoutWorstTradeDecimal: "-120",
    dominantTicker: "ABC",
    dominantTickerShareDecimal: "0.5",
    recentAndEarlierConsistent: true,
    factSetRevisionSha256: "a".repeat(64),
    affectedRoundTripIds: Object.freeze(ids),
    comparisonRoundTripIds: Object.freeze(Array.from({ length: 16 }, () => createCanonicalUuidV4())),
    limitation: "Historical results do not prove what a rule would do in future trading.",
  });
}

async function main(): Promise<void> {
  loadTraderLinkPlatformLocalDevelopmentConfiguration({ repositoryRoot: process.cwd() });
  const databasePath = process.env.TRADERLINK_PLATFORM_DB_PATH!;
  const before = sha256(databasePath);
  const scopeDatabase = new Database(databasePath, { readonly: true, fileMustExist: true });
  const scope = deriveDevelopmentOwnerJournalScope(scopeDatabase).scope;
  const dashboard = new JournalDashboardReadModelService(
    new JournalAnalyticsFactSetService(new JournalAnalyticsFactSetRepository(scopeDatabase)),
  );
  const latest = dashboard.getTradingDay(scope, { requestedDate: null, currency: null });
  const account = narrowWorkspaceAccessToAccount(scope, scope.activeAccountId!);
  const swings = new Set((scopeDatabase.prepare(`SELECT round_trip_id FROM journal_trade_style_plans
WHERE workspace_id = ? AND account_id = ? AND lifecycle_state = 'active' AND trade_style = 'swing'`)
    .all(account.workspaceId, account.accountId) as Array<{ round_trip_id: string }>).map((row) => row.round_trip_id));
  const activeTemplates = new Set(new JournalRuleRepository(scopeDatabase).list(account)
    .filter((rule) => rule.lifecycleState === "active" && rule.templateKey).map((rule) => rule.templateKey!));
  const candidates = latest.availableCurrencies.flatMap((currency) => detectJournalRuleIdeasInRepresentativeWindow({
    models: latest.availableTradingDates.map((date) => dashboard.getTradingDay(scope, { requestedDate: date, currency })),
    swingRoundTripIds: swings,
    activeTemplateIds: activeTemplates,
    asOfUtc: "2026-08-18T16:30:00.000Z",
  }));
  scopeDatabase.close();
  const unchanged = before === sha256(databasePath);
  if (!unchanged) throw new Error("Rule-idea candidate read changed the protected database.");

  const tempPath = join(tmpdir(), `traderlink-rule-ideas-${createCanonicalUuidV4()}.sqlite`);
  const source = new Database(databasePath, { readonly: true, fileMustExist: true });
  await source.backup(tempPath);
  source.close();
  const temp = new Database(tempPath, { fileMustExist: true });
  try {
    temp.pragma("foreign_keys = ON");
    const service = new JournalRuleIdeaService(new JournalRuleIdeaRepository(temp));
    const first = service.issueNext(account, [evidence("maximum_trades_per_day")], "2026-01-01T00:00:00.000Z");
    if (!first || first.disposition !== "available") throw new Error("First idea was not issued.");
    const dismissed = service.setDisposition(account, {
      ideaId: first.ideaId,
      expectedRevision: first.revision,
      disposition: "not_for_me",
      asOfUtc: "2026-01-02T00:00:00.000Z",
    });
    if (dismissed.disposition !== "not_for_me") throw new Error("Idea dismissal was not saved.");
    if (service.issueNext(account, [evidence("maximum_trades_per_day")], "2026-03-01T00:00:00.000Z") !== null) {
      throw new Error("Dismissed idea ignored its 90-day suppression.");
    }
    const reissued = service.issueNext(account, [evidence("maximum_trades_per_day")], "2026-04-03T00:00:00.000Z");
    if (!reissued || reissued.disposition !== "available" || reissued.revision !== 3) throw new Error("Idea was not reissued after suppression.");
    const saved = service.setDisposition(account, {
      ideaId: reissued.ideaId,
      expectedRevision: reissued.revision,
      disposition: "saved_for_later",
      asOfUtc: "2026-04-04T00:00:00.000Z",
    });
    const retained = service.issueNext(account, [evidence("cooldown_after_loss")], "2027-01-01T00:00:00.000Z");
    if (!retained || retained.ideaId !== saved.ideaId || retained.disposition !== "saved_for_later") {
      throw new Error("Saved-for-later idea was replaced.");
    }
    let staleRejected = false;
    try {
      service.setDisposition(account, {
        ideaId: reissued.ideaId,
        expectedRevision: reissued.revision,
        disposition: "added",
        asOfUtc: "2026-04-05T00:00:00.000Z",
      });
    } catch (error) {
      staleRejected = isTraderLinkPlatformError(error) && error.code === "TRADERLINK_RULE_IDEA_CONFLICT";
    }
    if (!staleRejected) throw new Error("Stale Rule-idea change was not rejected.");
    const versionCount = Number((temp.prepare("SELECT COUNT(*) AS count FROM journal_rule_idea_versions").get() as { count: number }).count);
    process.stdout.write(JSON.stringify({
      valid: true,
      protectedDatabaseUnchanged: unchanged,
      realCandidateCount: candidates.length,
      realCandidateEvidenceRows: candidates.reduce((count, item) => count + item.affectedTradeCount + item.comparisonTradeCount, 0),
      verifiedLifecycleVersions: versionCount,
      suppressionDays: 90,
      issuanceIntervalDays: 28,
      identifiersRedacted: true,
    }) + "\n");
  } finally {
    temp.close();
    unlinkSync(tempPath);
  }
}

void main();
