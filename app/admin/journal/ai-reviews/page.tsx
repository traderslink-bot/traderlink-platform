import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";

import { CoachAiProviderSettingsRepository } from "@/src/modules/coach/server/coach-ai-provider-settings-repository";
import { withJournalAdminPageDatabase } from "@/src/modules/platform/server/administration/require-journal-admin-page";
import {
  JournalAdminMetricCard,
  JournalAdminMetricGrid,
  JournalAdminPage,
  JournalAdminPageHeader,
  JournalAdminPanel,
  JournalAdminStatus,
  formatAdminInteger,
} from "../journal-admin-ui";
import { AiReviewProviderSettings } from "./ai-review-provider-settings";

export const metadata: Metadata = { title: "AI Reviews | Journal Administration" };
export const dynamic = "force-dynamic";

function money(value: string | null): string {
  return value === null ? "N/A" : `$${Number(value).toFixed(2)}`;
}

export default async function JournalAdminAiReviewsPage() {
  const state = await withJournalAdminPageDatabase((database) => {
    const repository = new CoachAiProviderSettingsRepository(database);
    return Object.freeze({ settings: repository.read(), costs: repository.readCostSummary() });
  });
  const credentialConfigured = Boolean(process.env.OPENAI_API_KEY?.trim());
  const pricingConfigured = state.settings.inputCostUsdPerMillionTokens !== null;
  return (
    <JournalAdminPage>
      <JournalAdminPageHeader
        description="Manage the private AI Review connection and keep an account-wide record of token use and estimated API cost. The API credential is never shown here."
        eyebrow="AI Reviews"
        title="AI Review settings"
      />
      <Stack spacing={1}>
        <Alert severity={credentialConfigured ? "success" : "warning"}>
          {credentialConfigured ? "An OpenAI credential is available to the server." : "No OpenAI credential is available to the server yet."}
        </Alert>
        {!pricingConfigured ? <Alert severity="info">Token prices are not configured yet, so future reviews will retain token counts but not a cost estimate.</Alert> : null}
      </Stack>
      <JournalAdminMetricGrid>
        <JournalAdminMetricCard caption="Saved model selection" label="Current model" value={state.settings.modelId} />
        <JournalAdminMetricCard caption="Issued reviews with a recorded receipt" label="Tracked reviews" value={formatAdminInteger(state.costs.generationCount)} />
        <JournalAdminMetricCard caption="Across tracked reviews" label="Tokens used" value={formatAdminInteger(state.costs.totalTokens)} />
        <JournalAdminMetricCard caption="Uses the price saved with each review" label="Estimated API cost" value={money(state.costs.estimatedCostUsd)} />
      </JournalAdminMetricGrid>
      <JournalAdminPanel title="Connection">
        <Stack spacing={1.25}>
          <Stack direction="row" sx={{ justifyContent: "space-between" }}><Typography>Provider</Typography><Typography sx={{ fontWeight: 800 }}>OpenAI</Typography></Stack>
          <Stack direction="row" sx={{ justifyContent: "space-between" }}><Typography>Server credential</Typography><JournalAdminStatus state={credentialConfigured ? "active" : "unavailable"} /></Stack>
          <Typography color="text.secondary" variant="body2">Add or replace the private credential in the server environment. It is intentionally not stored in the Journal database or displayed in this administration area.</Typography>
        </Stack>
      </JournalAdminPanel>
      <JournalAdminPanel title="Model and cost tracking">
        <AiReviewProviderSettings
          initialInputRate={state.settings.inputCostUsdPerMillionTokens}
          initialModelId={state.settings.modelId}
          initialOutputRate={state.settings.outputCostUsdPerMillionTokens}
        />
      </JournalAdminPanel>
    </JournalAdminPage>
  );
}
