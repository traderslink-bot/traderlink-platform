import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";

import {
  CoachAiChatAdministrationRepository,
  isCoachAiChatAdministrationSchemaAvailable,
} from "@/src/modules/coach/server/coach-ai-chat-administration-repository";
import {
  CoachAiReviewAdministrationRepository,
  isCoachAiReviewAdministrationSchemaAvailable,
} from "@/src/modules/coach/server/coach-ai-review-administration-repository";
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
import {
  AiChatAccountControl,
  AiChatPlatformControl,
  AiChatProviderSettings,
} from "./ai-chat-admin-controls";
import { AiReviewFeatureControl } from "./ai-review-feature-controls";

export const metadata: Metadata = { title: "AI Reviews | Journal Administration" };
export const dynamic = "force-dynamic";

function money(value: string | null): string {
  return value === null ? "N/A" : `$${Number(value).toFixed(2)}`;
}

export default async function JournalAdminAiReviewsPage() {
  const state = await withJournalAdminPageDatabase((database, scope) => {
    const repository = new CoachAiProviderSettingsRepository(database);
    const chatAvailable = isCoachAiChatAdministrationSchemaAvailable(database);
    const reviewsAvailable = isCoachAiReviewAdministrationSchemaAvailable(database);
    return Object.freeze({
      settings: repository.read(),
      costs: repository.readCostSummary(),
      chat: chatAvailable ? new CoachAiChatAdministrationRepository({ database, scope }).read() : null,
      reviews: reviewsAvailable ? new CoachAiReviewAdministrationRepository({ database, scope }).read() : null,
    });
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

      <JournalAdminPanel title="Automatic AI Reviews">
        {state.reviews ? (
          <Stack spacing={2.25}>
            <Typography color="text.secondary" variant="body2">
              Weekly and monthly reviews are controlled separately. Turning either one off pauses new reviews without changing anyone&apos;s saved delivery time.
            </Typography>
            <Stack direction={{ xs: "column", lg: "row" }} spacing={2.25}>
              <Stack flex={1} spacing={1.5}>
                <Typography sx={{ fontWeight: 800 }}>Weekly Reviews</Typography>
                <AiReviewFeatureControl initialControl={state.reviews.weekly.control} label="Weekly Reviews" />
              </Stack>
              <Stack flex={1} spacing={1.5}>
                <Typography sx={{ fontWeight: 800 }}>Monthly Reviews</Typography>
                <AiReviewFeatureControl initialControl={state.reviews.monthly.control} label="Monthly Reviews" />
              </Stack>
            </Stack>
          </Stack>
        ) : <Alert severity="info">Automatic review controls will be available after the accepted review-control migration is applied. Existing delivery preferences are unchanged.</Alert>}
      </JournalAdminPanel>

      {state.reviews ? (
        <>
          <JournalAdminMetricGrid>
            <JournalAdminMetricCard caption="All recorded weekly attempts" label="Weekly review requests" value={formatAdminInteger(state.reviews.weekly.metrics.requestCount)} />
            <JournalAdminMetricCard caption="Completed or issued weekly reviews" label="Weekly reviews delivered" value={formatAdminInteger(state.reviews.weekly.metrics.completedOrIssuedCount)} />
            <JournalAdminMetricCard caption="Weekly attempts stopped before provider work" label="Weekly reviews blocked" value={formatAdminInteger(state.reviews.weekly.metrics.blockedCount)} />
            <JournalAdminMetricCard caption="Weekly review receipts" label="Weekly tokens" value={formatAdminInteger(state.reviews.weekly.metrics.totalTokens)} />
            <JournalAdminMetricCard caption="Uses the price saved with each review" label="Weekly estimated cost" value={money(state.reviews.weekly.metrics.estimatedCostUsd)} />
          </JournalAdminMetricGrid>
          <JournalAdminMetricGrid>
            <JournalAdminMetricCard caption="All recorded monthly attempts" label="Monthly review requests" value={formatAdminInteger(state.reviews.monthly.metrics.requestCount)} />
            <JournalAdminMetricCard caption="Completed or issued monthly reviews" label="Monthly reviews delivered" value={formatAdminInteger(state.reviews.monthly.metrics.completedOrIssuedCount)} />
            <JournalAdminMetricCard caption="Monthly attempts stopped before provider work" label="Monthly reviews blocked" value={formatAdminInteger(state.reviews.monthly.metrics.blockedCount)} />
            <JournalAdminMetricCard caption="Monthly review receipts" label="Monthly tokens" value={formatAdminInteger(state.reviews.monthly.metrics.totalTokens)} />
            <JournalAdminMetricCard caption="Uses the price saved with each review" label="Monthly estimated cost" value={money(state.reviews.monthly.metrics.estimatedCostUsd)} />
          </JournalAdminMetricGrid>
          <JournalAdminPanel title="Review delivery health">
            <Stack spacing={0.75}>
              <Typography color="text.secondary" variant="body2">Saved delivery preferences: {formatAdminInteger(state.reviews.weekly.metrics.deliveryScheduleCount)} active account{state.reviews.weekly.metrics.deliveryScheduleCount === 1 ? "" : "s"}.</Typography>
              <Typography color="text.secondary" variant="body2">Failed review attempts: {formatAdminInteger(state.reviews.weekly.metrics.failedCount + state.reviews.monthly.metrics.failedCount)}. This count does not include private review text or account identities.</Typography>
              <Typography color="text.secondary" variant="body2">Control reservations: {formatAdminInteger(state.reviews.weekly.metrics.reservationCount + state.reviews.monthly.metrics.reservationCount)}.</Typography>
            </Stack>
          </JournalAdminPanel>
        </>
      ) : null}

      <JournalAdminPanel title="AI Chat">
        <Stack spacing={1.25}>
          <Stack direction="row" sx={{ justifyContent: "space-between" }}><Typography>Server credential</Typography><JournalAdminStatus state={credentialConfigured ? "active" : "unavailable"} /></Stack>
          <Typography color="text.secondary" variant="body2">Chat uses a separate model, verified pricing, enablement and caps. The server credential itself is never stored or shown.</Typography>
          {state.chat ? (
            <>
              <Stack direction="row" sx={{ justifyContent: "space-between" }}><Typography>Platform Chat</Typography><JournalAdminStatus state={state.chat.platformControl.enabled ? "active" : "disabled"} /></Stack>
              <AiChatProviderSettings
                initialInputRate={state.chat.settings.inputCostUsdPerMillionTokens}
                initialModelId={state.chat.settings.modelId}
                initialOutputRate={state.chat.settings.outputCostUsdPerMillionTokens}
              />
            </>
          ) : <Alert severity="info">AI Chat administration is unavailable until the accepted Chat schema migrations are applied. AI Review settings remain available above.</Alert>}
        </Stack>
      </JournalAdminPanel>

      {state.chat ? (
        <>
          <JournalAdminMetricGrid>
            <JournalAdminMetricCard caption="All Chat attempts" label="Chat requests" value={formatAdminInteger(state.chat.costs.requestCount)} />
            <JournalAdminMetricCard caption="Completed receipts only" label="Chat tokens" value={formatAdminInteger(state.chat.costs.totalTokens)} />
            <JournalAdminMetricCard caption="Recorded provider usage" label="Estimated Chat cost" value={money(state.chat.costs.estimatedCostUsd)} />
            <JournalAdminMetricCard caption="Provider failures" label="Failed Chat requests" value={formatAdminInteger(state.chat.costs.failedRequestCount)} />
            <JournalAdminMetricCard caption="Daily-cap denials" label="Blocked Chat requests" value={formatAdminInteger(state.chat.costs.blockedRequestCount)} />
          </JournalAdminMetricGrid>
          <JournalAdminPanel title="Platform Chat control">
            <AiChatPlatformControl initialControl={state.chat.platformControl} />
          </JournalAdminPanel>
          <JournalAdminPanel title="Account Chat controls">
            <AiChatAccountControl accounts={state.chat.accounts} />
          </JournalAdminPanel>
        </>
      ) : null}
    </JournalAdminPage>
  );
}
