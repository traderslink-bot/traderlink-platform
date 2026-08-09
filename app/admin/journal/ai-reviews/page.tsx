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
import { CoachUsEquitiesCalendarRepository } from
  "@/src/modules/coach/server/market-calendar/coach-us-equities-calendar-repository";
import { readWhopAiReviewConfigurationHealth } from
  "@/src/modules/platform/server/billing/whop-ai-review-configuration";
import {
  isWhopAiReviewEntitlementSchemaAvailable,
  WhopAiReviewEntitlementRepository,
} from "@/src/modules/platform/server/billing/whop-ai-review-entitlement-repository";
import {
  isWhopAiReviewReconciliationSchemaAvailable,
  WhopAiReviewReconciliationRepository,
} from "@/src/modules/platform/server/billing/whop-ai-review-reconciliation-repository";
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
import { AiReviewMasterControl } from "./ai-review-master-control";
import { AiReviewCalendarControl } from "./ai-review-calendar-control";
import { AiReviewBudgetControl } from "./ai-review-budget-control";
import { AiReviewWhopReconciliation } from "./ai-review-whop-reconciliation";

export const metadata: Metadata = { title: "AI Reviews | Journal Administration" };
export const dynamic = "force-dynamic";

function money(value: string | null): string {
  return value === null ? "N/A" : `$${Number(value).toFixed(2)}`;
}

function easternYear(now = new Date()): number {
  return Number(new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
  }).format(now));
}

function timestamp(value: string | null): string {
  return value ? new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value)) : "Not recorded";
}

export default async function JournalAdminAiReviewsPage() {
  const state = await withJournalAdminPageDatabase((database, scope) => {
    const repository = new CoachAiProviderSettingsRepository(database);
    const chatAvailable = isCoachAiChatAdministrationSchemaAvailable(database);
    const reviewsAvailable = isCoachAiReviewAdministrationSchemaAvailable(database);
    const year = easternYear();
    const calendar = new CoachUsEquitiesCalendarRepository(database);
    const whopReconciliationAvailable =
      isWhopAiReviewReconciliationSchemaAvailable(database);
    return Object.freeze({
      settings: repository.read(),
      costs: repository.readCostSummary(),
      chat: chatAvailable ? new CoachAiChatAdministrationRepository({ database, scope }).read() : null,
      reviews: reviewsAvailable ? new CoachAiReviewAdministrationRepository({ database, scope }).read() : null,
      whop: isWhopAiReviewEntitlementSchemaAvailable(database)
        ? new WhopAiReviewEntitlementRepository(database).readAdminSummary()
        : null,
      whopReconciliationAvailable,
      whopReconciliation: whopReconciliationAvailable
        ? new WhopAiReviewReconciliationRepository(database).readLatest()
        : null,
      calendarYears: Object.freeze([
        calendar.readYearStatus(year),
        calendar.readYearStatus(year + 1),
      ]),
    });
  });
  const credentialConfigured = Boolean(process.env.OPENAI_API_KEY?.trim());
  const pricingConfigured = state.settings.inputCostUsdPerMillionTokens !== null &&
    state.settings.cachedInputCostUsdPerMillionTokens !== null &&
    state.settings.cacheWriteInputCostUsdPerMillionTokens !== null &&
    state.settings.outputCostUsdPerMillionTokens !== null;
  const whopHealth = readWhopAiReviewConfigurationHealth();
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
          initialCachedInputRate={state.settings.cachedInputCostUsdPerMillionTokens}
          initialCacheWriteInputRate={state.settings.cacheWriteInputCostUsdPerMillionTokens}
          initialInputRate={state.settings.inputCostUsdPerMillionTokens}
          initialModelId={state.settings.modelId}
          initialOutputRate={state.settings.outputCostUsdPerMillionTokens}
        />
      </JournalAdminPanel>

      <JournalAdminPanel title="Automatic AI Reviews">
        {state.reviews ? (
          <Stack spacing={2.25}>
            <Typography color="text.secondary" variant="body2">
              Platform availability is separate from each trader&apos;s personal Account setting. Both must be on, and paid access must be connected, before a provider attempt can begin.
            </Typography>
            <AiReviewMasterControl initialState={state.reviews.masterState} />
            <Stack spacing={1.5}>
              <Typography sx={{ fontWeight: 800 }}>AI Review usage safeguards</Typography>
              <AiReviewBudgetControl initialControl={state.reviews.budget} />
            </Stack>
            <Stack direction={{ xs: "column", lg: "row" }} spacing={2.25}>
              <Stack spacing={1.5} sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 800 }}>Weekly Reviews</Typography>
                <AiReviewFeatureControl initialControl={state.reviews.weekly.control} label="Weekly Reviews" />
              </Stack>
              <Stack spacing={1.5} sx={{ flex: 1 }}>
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
            <JournalAdminMetricCard caption="Frozen immutable requests awaiting work" label="Pending reviews" value={formatAdminInteger(state.reviews.operations.pendingRequestCount)} />
            <JournalAdminMetricCard caption="Provider attempt already started" label="Generating" value={formatAdminInteger(state.reviews.operations.generatingCount)} />
            <JournalAdminMetricCard caption="Same frozen evidence will be reused" label="Retrying" value={formatAdminInteger(state.reviews.operations.retryingCount)} />
            <JournalAdminMetricCard caption="All v2 failed attempts, including retries" label="Failed attempts" value={formatAdminInteger(state.reviews.operations.failedAttemptCount)} />
            <JournalAdminMetricCard caption="Saved v2 review outputs" label="Issued reviews" value={formatAdminInteger(state.reviews.operations.issuedReviewCount)} />
          </JournalAdminMetricGrid>
          <JournalAdminPanel title="Automatic review status">
            <Stack spacing={1}>
              <Stack direction="row" sx={{ justifyContent: "space-between" }}><Typography>Platform availability</Typography><JournalAdminStatus state={state.reviews.masterState === "enabled" ? "active" : "disabled"} /></Stack>
              <Stack direction="row" sx={{ justifyContent: "space-between" }}><Typography>Paid access</Typography><JournalAdminStatus state={whopHealth.readyForEntitlement && state.whop ? "active" : "unavailable"} /></Stack>
              <Typography color="text.secondary" variant="body2">Provider attempts require both an authenticated Whop link and an active accepted-product membership. Missing or conflicting access stays fail-closed.</Typography>
              <Stack direction="row" sx={{ justifyContent: "space-between" }}><Typography>Hosted scheduler</Typography><JournalAdminStatus state="disabled" /></Stack>
              <Typography color="text.secondary" variant="body2">Last coordinator run: {state.reviews.operations.lastRun ? `${state.reviews.operations.lastRun.state} at ${timestamp(state.reviews.operations.lastRun.startedAtUtc)}` : "No run recorded"}.</Typography>
            </Stack>
          </JournalAdminPanel>
          <JournalAdminPanel title="Market calendar verification">
            <Stack spacing={1.5}>
              {state.calendarYears.map((year) => (
                <Stack key={year.targetYear} spacing={0.5}>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography sx={{ fontWeight: 800 }}>{year.targetYear} U.S. equities calendar</Typography>
                    <JournalAdminStatus state={year.coverageAvailable ? "active" : "unavailable"} />
                  </Stack>
                  <Typography color="text.secondary" variant="body2">
                    {year.coverageAvailable ? "Verified stored coverage is available." : "No verified stored coverage is available."} Last source check: {timestamp(year.lastCheckedAtUtc)}. Next scheduled check: {timestamp(year.nextCheckAfterUtc)}.
                  </Typography>
                </Stack>
              ))}
              <AiReviewCalendarControl />
            </Stack>
          </JournalAdminPanel>
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

      <JournalAdminPanel title="Whop subscription access">
        <Stack spacing={1.25}>
          <Stack direction="row" sx={{ justifyContent: "space-between" }}><Typography>Entitlement connection</Typography><JournalAdminStatus state={whopHealth.readyForEntitlement && state.whop ? "active" : "unavailable"} /></Stack>
          <Stack direction="row" sx={{ justifyContent: "space-between" }}><Typography>Launch configuration</Typography><JournalAdminStatus state={whopHealth.readyForLaunch ? "active" : "unavailable"} /></Stack>
          <Stack direction="row" sx={{ justifyContent: "space-between" }}><Typography>Signed access updates</Typography><JournalAdminStatus state={whopHealth.webhookConfigured && whopHealth.apiVersionDate ? "active" : "unavailable"} /></Stack>
          <Stack direction="row" sx={{ justifyContent: "space-between" }}><Typography>Whop account connection</Typography><JournalAdminStatus state={whopHealth.oauthConfigured && whopHealth.identityProtectionConfigured ? "active" : "unavailable"} /></Stack>
          <Stack direction="row" sx={{ justifyContent: "space-between" }}><Typography>Accepted company and product</Typography><JournalAdminStatus state={whopHealth.companyConfigured && whopHealth.productConfigured ? "active" : "unavailable"} /></Stack>
          <Stack direction="row" sx={{ justifyContent: "space-between" }}><Typography>Membership backup check</Typography><JournalAdminStatus state={whopHealth.readyForReconciliation ? "active" : "unavailable"} /></Stack>
          <Stack direction="row" sx={{ justifyContent: "space-between" }}><Typography>Subscription and management links</Typography><JournalAdminStatus state={whopHealth.checkoutConfigured && whopHealth.billingPortalConfigured ? "active" : "unavailable"} /></Stack>
          <Typography color="text.secondary" variant="body2">Configuration values are never displayed. Launch readiness requires the API key, signed webhook, OAuth, identity protection, accepted company/product, checkout, billing portal and pinned API version.</Typography>
          {state.whop ? (
            <JournalAdminMetricGrid>
              <JournalAdminMetricCard caption="Accepted memberships with current access" label="Active memberships" value={formatAdminInteger(state.whop.activeMembershipCount)} />
              <JournalAdminMetricCard caption="No current generation access" label="Deactivated memberships" value={formatAdminInteger(state.whop.deactivatedMembershipCount)} />
              <JournalAdminMetricCard caption="Active Whop membership awaiting OAuth link" label="Unmatched memberships" value={formatAdminInteger(state.whop.unmatchedActiveMembershipCount)} />
              <JournalAdminMetricCard caption="Fail-closed identity or event conflicts" label="Conflicts" value={formatAdminInteger(state.whop.conflictCount)} />
              <JournalAdminMetricCard caption="Operational only; does not revoke access" label="Payment failures" value={formatAdminInteger(state.whop.paymentFailureCount)} />
              <JournalAdminMetricCard caption={state.whop.lastWebhookAtUtc ? `Last accepted ${timestamp(state.whop.lastWebhookAtUtc)}` : "No signed event received"} label="Webhook receipts" value={formatAdminInteger(state.whop.receiptCount)} />
            </JournalAdminMetricGrid>
          ) : <Alert severity="info">Whop access storage will be available after migration 0045 is applied.</Alert>}
          {state.whopReconciliationAvailable ? (
            <>
              <Typography color="text.secondary" variant="body2">
                Latest access check: {state.whopReconciliation
                  ? `${state.whopReconciliation.state} at ${timestamp(state.whopReconciliation.finalizedAtUtc ?? state.whopReconciliation.startedAtUtc)}; ${formatAdminInteger(state.whopReconciliation.fetchedCount)} memberships returned, ${formatAdminInteger(state.whopReconciliation.appliedCount)} updates applied and ${formatAdminInteger(state.whopReconciliation.conflictCount)} conflicts found.`
                  : "No Whop API access check has run yet."}
              </Typography>
              <AiReviewWhopReconciliation enabled={whopHealth.readyForReconciliation} />
            </>
          ) : (
            <Alert severity="info">
              Admin Whop access checks will be available after migration 0048 is applied.
            </Alert>
          )}
        </Stack>
      </JournalAdminPanel>

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
