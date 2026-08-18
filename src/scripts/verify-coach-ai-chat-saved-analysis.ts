import { createHash, randomUUID } from "node:crypto";
import { readFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import Database from "better-sqlite3";

import { COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION } from
  "@/src/modules/coach/contracts/coach-ai-chat-factual-tool-contracts";
import { CoachAiChatSavedAnalysisService } from
  "@/src/modules/coach/server/coach-ai-chat-saved-analysis-service";
import { TRADE_EXPLORER_COMPARISON_STUDY_VERSION } from
  "@/src/modules/journal-analytics/contracts/trade-explorer-comparison-study";
import { TradeExplorerComparisonStudyRepository } from
  "@/src/modules/journal-analytics/server/trade-explorer-comparison-study-repository";
import { TradeExplorerComparisonStudyService } from
  "@/src/modules/journal-analytics/server/trade-explorer-comparison-study-service";
import { deriveDevelopmentOwnerJournalScope } from
  "@/src/modules/journal/server/accounts/journal-development-owner-scope";
import { loadTraderLinkPlatformLocalDevelopmentConfiguration } from
  "@/src/modules/platform/server/authentication/local-development-configuration";
import { isTraderLinkPlatformError } from
  "@/src/modules/platform/server/database/platform-migration-contract";
import { narrowWorkspaceAccessToAccount } from
  "@/src/modules/platform/contracts/workspace-access-scope";

function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function rows(value: unknown): readonly unknown[] {
  if (!Array.isArray(value)) throw new Error("Saved-analysis result was not a list.");
  return value;
}

async function main(): Promise<void> {
  loadTraderLinkPlatformLocalDevelopmentConfiguration({ repositoryRoot: process.cwd() });
  const databasePath = process.env.TRADERLINK_PLATFORM_DB_PATH!;
  const before = sha256(databasePath);
  const database = new Database(databasePath, { readonly: true, fileMustExist: true });
  try {
    const scope = deriveDevelopmentOwnerJournalScope(database).scope;
    const selectedAccountId = scope.activeAccountId!;
    const service = new CoachAiChatSavedAnalysisService(database);
    const comparisons = service.listComparisons(scope, selectedAccountId, {
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: "list_saved_trade_comparisons",
      limit: 10,
    });
    const ideas = service.listRuleIdeas(scope, selectedAccountId, {
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: "list_rule_ideas",
      disposition: "all",
      limit: 10,
    });
    const serialized = JSON.stringify([comparisons, ideas]);
    if (/expectedAccountSelectionRef|studyId|ideaId|evidenceSha256|factSetRevisionSha256|roundTripId/u.test(serialized) ||
        /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/u.test(serialized)) {
      throw new Error("Saved-analysis tool exposed a protected identifier.");
    }
    let crossAccountRejected = false;
    try {
      service.listComparisons(scope, randomUUID(), {
        contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
        toolName: "list_saved_trade_comparisons",
        limit: 1,
      });
    } catch (error) {
      crossAccountRejected = isTraderLinkPlatformError(error) &&
        error.code === "TRADERLINK_ACCOUNT_ACCESS_DENIED";
    }
    if (!crossAccountRejected) throw new Error("Cross-account saved-analysis read was not rejected.");
    database.close();
    if (before !== sha256(databasePath)) throw new Error("Saved-analysis reads changed the protected database.");
    const privateSavedComparisonCount = rows(comparisons.result).length;
    const tempPath = join(tmpdir(), `traderlink-chat-saved-analysis-${randomUUID()}.sqlite`);
    const source = new Database(databasePath, { readonly: true, fileMustExist: true });
    await source.backup(tempPath);
    source.close();
    const temp = new Database(tempPath, { fileMustExist: true });
    let syntheticComparisonCount = 0;
    try {
      const normalizedStudyJson = JSON.stringify({
        comparisonVersion: "trade_explorer_comparison_v1",
        groups: [
          { name: "Earlier trades", query: { moneyBasis: "gross", startDate: "2026-01-01", endDate: "2026-01-31" } },
          { name: "Later trades", query: { moneyBasis: "gross", startDate: "2026-02-01", endDate: "2026-02-28" } },
        ],
      });
      new TradeExplorerComparisonStudyService(
        new TradeExplorerComparisonStudyRepository(temp),
        { createId: randomUUID, now: () => new Date("2026-08-18T18:00:00.000Z") },
      ).create(narrowWorkspaceAccessToAccount(scope, selectedAccountId), {
        name: "Verifier comparison",
        payload: {
          studyVersion: TRADE_EXPLORER_COMPARISON_STUDY_VERSION,
          normalizedStudyJson,
          studySha256: createHash("sha256").update(normalizedStudyJson, "utf8").digest("hex"),
        },
      });
      const synthetic = new CoachAiChatSavedAnalysisService(temp).listComparisons(
        scope,
        selectedAccountId,
        {
          contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
          toolName: "list_saved_trade_comparisons",
          limit: 10,
        },
      );
      syntheticComparisonCount = rows(synthetic.result).length;
      if (syntheticComparisonCount !== privateSavedComparisonCount + 1 ||
          JSON.stringify(synthetic).includes("studyId")) {
        throw new Error("Synthetic saved comparison was not returned safely.");
      }
    } finally {
      temp.close();
      unlinkSync(tempPath);
    }
    process.stdout.write(JSON.stringify({
      valid: true,
      savedComparisonCount: privateSavedComparisonCount,
      syntheticComparisonCount,
      savedRuleIdeaCount: rows(ideas.result).length,
      crossAccountRejected,
      protectedDatabaseUnchanged: true,
      protectedIdentifiersExcluded: true,
      providerRequestMade: false,
    }) + "\n");
  } finally {
    if (database.open) database.close();
  }
}

void main();
