import { loadTraderLinkPlatformLocalDevelopmentConfiguration } from
  "@/src/modules/platform/server/authentication/local-development-configuration";
import { openPlatformDatabase } from
  "@/src/modules/platform/server/database/open-platform-database";
import { CoachAiProviderSettingsRepository } from
  "@/src/modules/coach/server/coach-ai-provider-settings-repository";
import { CoachAiChatProviderControlsRepository } from
  "@/src/modules/coach/server/coach-ai-chat-provider-controls-repository";
import { createCanonicalUtcTimestamp } from
  "@/src/modules/platform/server/database/platform-migration-contract";

const CONFIRMATION = "--confirm-local-disabled-provider-configuration";
const CLEAR_UNAPPROVED_LIMITS = "--clear-unapproved-limits";

type ControlRow = Readonly<{
  feature_key: "weekly_reviews" | "monthly_reviews";
  enabled: number;
  daily_request_cap: number | null;
  daily_token_cap: number | null;
  daily_estimated_spend_cap_usd: string | null;
}>;

function main(): void {
  if (process.argv[2] !== CONFIRMATION) {
    throw new Error("ai_review_local_provider_configuration_confirmation_required");
  }
  loadTraderLinkPlatformLocalDevelopmentConfiguration({
    repositoryRoot: process.cwd(),
  });
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    const settings = new CoachAiProviderSettingsRepository(database).save({
      modelId: "gpt-5.6-luna",
      inputCostUsdPerMillionTokens: "1",
      cachedInputCostUsdPerMillionTokens: "0.1",
      cacheWriteInputCostUsdPerMillionTokens: "1.25",
      outputCostUsdPerMillionTokens: "6",
    });
    const budgetAvailable = Boolean(database.prepare<[], Readonly<{ found: number }>>(
      "SELECT 1 AS found FROM sqlite_schema WHERE type = 'table' AND name = 'coach_ai_review_budget_controls'",
    ).get());
    if (process.argv.includes(CLEAR_UNAPPROVED_LIMITS)) {
      const controlsRepository = new CoachAiChatProviderControlsRepository(database);
      for (const featureKey of ["weekly_reviews", "monthly_reviews"] as const) {
        controlsRepository.savePlatformFeatureControl({
          featureKey,
          enabled: false,
          dailyRequestCap: null,
          dailyTokenCap: null,
          dailyEstimatedSpendCapUsd: null,
        });
      }
      if (budgetAvailable) {
        database.prepare(`UPDATE coach_ai_review_budget_controls SET
  trailing_30_day_estimated_spend_cap_usd = NULL, updated_at_utc = ?
WHERE control_key = 'ai_reviews'`).run(createCanonicalUtcTimestamp());
      }
    }
    const controls = database.prepare<[], ControlRow>(`SELECT feature_key, enabled,
  daily_request_cap, daily_token_cap, daily_estimated_spend_cap_usd
FROM coach_ai_feature_controls
WHERE scope_kind = 'platform'
  AND feature_key IN ('weekly_reviews', 'monthly_reviews')
ORDER BY feature_key`).all();
    const budget = budgetAvailable
      ? database.prepare<[], Readonly<{ cap: string | null }>>(`SELECT
  trailing_30_day_estimated_spend_cap_usd AS cap
FROM coach_ai_review_budget_controls WHERE control_key = 'ai_reviews'`).get()
      : null;
    process.stdout.write(`${JSON.stringify({
      modelId: settings.modelId,
      inputRate: settings.inputCostUsdPerMillionTokens,
      cachedInputRate: settings.cachedInputCostUsdPerMillionTokens,
      cacheWriteInputRate: settings.cacheWriteInputCostUsdPerMillionTokens,
      outputRate: settings.outputCostUsdPerMillionTokens,
      controls: controls.map((control) => Object.freeze({
        featureKey: control.feature_key,
        enabled: control.enabled === 1,
        capsComplete: control.daily_request_cap !== null &&
          control.daily_token_cap !== null &&
          control.daily_estimated_spend_cap_usd !== null,
      })),
      rolling30DaySpendCapConfigured: budget?.cap !== null && budget !== undefined,
    })}\n`);
  } finally {
    database.close();
  }
}

main();
