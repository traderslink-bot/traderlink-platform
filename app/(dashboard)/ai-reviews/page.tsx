import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { OfflineSavedViewCapture } from "@/app/pwa/offline-saved-view-capture";
import {
  DashboardPage,
  DashboardPanel,
  DashboardUnavailableState,
} from "../../dashboard-template";
import {
  CoachAiReviewRepository,
  type CoachMonthlyIssuedReviewRecord,
  type CoachWeeklyIssuedReviewRecord,
} from "@/src/modules/coach/server/coach-ai-review-repository";
import {
  CoachAiReviewGenerationCompatibilityRepository,
  type CoachAiIssuedReviewPresentationRecord,
} from "@/src/modules/coach/server/coach-ai-review-generation-compatibility";
import {
  CoachReviewDeliveryScheduleRepository,
  resolveCoachEffectiveAiReviewFrequencyV2,
  type CoachAiReviewAccountSettingsV2,
  type CoachAiReviewFrequencyV2,
  type CoachAiReviewTimingModeV2,
} from "@/src/modules/coach/server/coach-weekly-review-schedule-repository";
import {
  CoachAiReviewAvailabilityService,
  type CoachMonthlyReviewAvailabilityV2,
  type CoachPeriodicReviewAvailabilityV2,
} from "@/src/modules/coach/server/coach-ai-review-availability-service";
import {
  CoachAiReviewGenerationCoordinatorV2,
  type CoachAiReviewGenerationGateV2,
} from "@/src/modules/coach/server/coach-ai-review-generation-coordinator-v2";
import { CoachAiReviewProviderControlsRepository } from
  "@/src/modules/coach/server/coach-ai-review-provider-controls-repository";
import {
  COACH_AI_REVIEW_OFFLINE_COVERAGE,
  COACH_AI_REVIEW_OFFLINE_LIST_VIEW_KEY,
  COACH_AI_REVIEW_OFFLINE_VIEW_VERSION,
  createCoachAiReviewOfflineListViewModel,
} from "@/src/modules/coach/contracts/coach-ai-review-offline-view-contracts";
import { CoachUsEquitiesCalendarRepository } from "@/src/modules/coach/server/market-calendar/coach-us-equities-calendar-repository";
import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import {
  MonthlyTradeTrackerReviewDrawer,
  WeeklyTradeTrackerReviewCoverage,
} from "./trade-tracker-review-coverage";
import { AiReviewRequestButton } from "./ai-review-request-button";
import { LocalReviewTime } from "./local-review-time";
import {
  CoachAiReviewAuthoredPersistenceRepository,
  type CoachAiReviewAuthoredIssuedRecord,
} from "@/src/modules/coach/server/coach-ai-review-authored-persistence-repository";
import { AiReviewsIssuedList, type AiReviewListItem } from "./ai-reviews-issued-list";

export const metadata: Metadata = {
  title: "AI Reviews | TraderLink Platform",
  description: "Read your saved weekly, two-week and monthly trading reviews.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00.000Z`));
}

function formatMonth(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00.000Z`));
}

function frequencyLabel(value: CoachAiReviewFrequencyV2): string {
  if (value === "weekly") return "Every trading week";
  if (value === "two_week") return "Every two trading weeks";
  return "Monthly only";
}

function timingLabel(value: CoachAiReviewTimingModeV2): string {
  return value === "automatic_after_12_hours"
    ? "Automatic after 12 hours"
    : "Extra time for Trade Tracker reviews";
}

function unavailableCopy(gate: CoachAiReviewGenerationGateV2): Readonly<{
  status: string;
  description: ReactNode;
}> | null {
  if (gate.state === "platform_unavailable") {
    return Object.freeze({
      status: "Platform unavailable",
      description: "Your saved evidence and issued reviews remain available. New AI Reviews will resume when the service is available.",
    });
  }
  if (gate.state === "paid_access_unavailable") {
    return Object.freeze({
      status: "Paid access unavailable",
      description: "Your saved evidence and issued reviews remain available. Connect or renew AI Review access from Account before a new review can start.",
    });
  }
  return null;
}

function currentReviewTitle(review: CoachAiIssuedReviewPresentationRecord): string {
  if (review.reviewKind === "monthly") return formatMonth(review.periodStartDate);
  const cadence = review.reviewKind === "two_week" ? "Two-week review" : "Trading-week review";
  return `${cadence}: ${formatDate(review.periodStartDate)} to ${formatDate(review.periodEndDate)}`;
}

function authoredReviewTitle(review: CoachAiReviewAuthoredIssuedRecord): string {
  if (review.reviewKind === "monthly") return formatMonth(review.periodStartDate);
  const cadence = review.reviewKind === "two_week" ? "Two-week review" : "Trading-week review";
  return `${cadence}: ${formatDate(review.periodStartDate)} to ${formatDate(review.periodEndDate)}`;
}

function authoredReviewSummary(review: CoachAiReviewAuthoredIssuedRecord): string {
  return review.output.contractVersion ===
    "traderlink_coach_monthly_ai_review_authored_output_v1"
    ? review.output.monthlyRecap
    : review.output.weeklyRecap;
}

function AiReviewUsageProgress({ percentageUsed }: { percentageUsed: number | null }) {
  if (percentageUsed === null) return null;
  return (
    <Stack spacing={0.5} sx={{ maxWidth: 360, mt: 1.5 }}>
      <Stack direction="row" sx={{ justifyContent: "space-between" }}>
        <Typography color="text.secondary" variant="body2">AI Review usage</Typography>
        <Typography sx={{ fontWeight: 800 }} variant="body2">{percentageUsed}% used</Typography>
      </Stack>
      <LinearProgress
        aria-label={`AI Review usage: ${percentageUsed}% used`}
        sx={{ borderRadius: 99, height: 8 }}
        value={percentageUsed}
        variant="determinate"
      />
    </Stack>
  );
}

function legacyWeekTitle(review: CoachWeeklyIssuedReviewRecord): string {
  return `Trading-week review: ${formatDate(review.weekStartDate)} to ${formatDate(review.weekEndDate)}`;
}

function legacyMonthTitle(review: CoachMonthlyIssuedReviewRecord): string {
  return review.periodCoverage === "partial_month"
    ? `First month: ${formatDate(review.monthStartDate)} to ${formatDate(review.monthEndDate)}`
    : formatMonth(review.monthStartDate);
}

function ReviewSchedule({
  effectiveFrequency,
  marketMonday,
  settings,
}: {
  effectiveFrequency: CoachAiReviewFrequencyV2 | null;
  marketMonday: string;
  settings: CoachAiReviewAccountSettingsV2 | null;
}) {
  if (!settings?.isEnabled) {
    return (
      <DashboardUnavailableState
        actionHref="/account"
        actionLabel="Choose review frequency"
        compact
        description="Choose weekly, every two weeks or monthly only. Nothing is generated until AI Reviews is enabled for this Trade Tracker account."
        title="AI Reviews are off"
      />
    );
  }

  return (
    <Stack spacing={2}>
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
        }}
      >
        <Box>
          <Typography color="text.secondary" variant="caption">Frequency</Typography>
          <Typography sx={{ fontWeight: 800 }}>
            {frequencyLabel(effectiveFrequency ?? settings.currentFrequency)}
          </Typography>
        </Box>
        {(effectiveFrequency ?? settings.currentFrequency) !== "monthly_only" ? (
          <Box>
            <Typography color="text.secondary" variant="caption">Weekly review timing</Typography>
            <Typography sx={{ fontWeight: 800 }}>
              {timingLabel(settings.timingMode)}
            </Typography>
          </Box>
        ) : null}
        <Box>
          <Typography color="text.secondary" variant="caption">Monthly review</Typography>
          <Typography sx={{ fontWeight: 800 }}>8:00 AM after month end</Typography>
        </Box>
      </Box>
      {settings.pendingFrequency && settings.pendingEffectiveMondayDate &&
      settings.pendingEffectiveMondayDate > marketMonday ? (
        <Alert severity="info">
          {frequencyLabel(settings.pendingFrequency)} begins with the trading week of {formatDate(settings.pendingEffectiveMondayDate)}. Your current review period will finish first.
        </Alert>
      ) : null}
      <Typography color="text.secondary" variant="body2">
        Verified execution facts, saved tags, recorded rule results and all non-empty notes available when generation begins can be used. Later edits do not change an issued review.
      </Typography>
      {(effectiveFrequency ?? settings.currentFrequency) !== "monthly_only" ? (
        <Typography color="text.secondary" variant="body2">
          {settings.timingMode === "automatic_after_12_hours"
            ? "Weekly reviews start automatically 12 hours after post-market ends on the final trading day. Trade Tracker reviews do not need to be completed."
            : "Weekly reviews can start sooner when you have marked your reviews complete or select Generate now. Otherwise they start automatically at the end of the following trading week."}
        </Typography>
      ) : null}
    </Stack>
  );
}

function evidenceCoverageLabel(
  availability: CoachPeriodicReviewAvailabilityV2 | CoachMonthlyReviewAvailabilityV2,
  completed: number,
  created: number,
): string {
  const evidence = availability.evidence;
  const incomplete = Math.max(0, created - completed);
  const parts = [
    `${evidence.readyClosedTradeCount} ready closed trade${evidence.readyClosedTradeCount === 1 ? "" : "s"}`,
    `${completed} review${completed === 1 ? "" : "s"} marked complete`,
  ];
  if (incomplete > 0) {
    parts.push(`${incomplete} review${incomplete === 1 ? "" : "s"} not complete`);
  }
  if (evidence.savedTagCount > 0) {
    parts.push(`${evidence.savedTagCount} saved tag${evidence.savedTagCount === 1 ? "" : "s"}`);
  }
  if (evidence.reviewedRuleOutcomeCount > 0) {
    parts.push(`${evidence.reviewedRuleOutcomeCount} followed or broken rule result${evidence.reviewedRuleOutcomeCount === 1 ? "" : "s"}`);
  }
  return parts.join(" · ");
}

function AvailabilityCard({
  action,
  coverage,
  description,
  details,
  period,
  status,
  title,
}: {
  action?: ReactNode;
  coverage?: string;
  description: ReactNode;
  details?: ReactNode;
  period: string;
  status: string;
  title: string;
}) {
  return (
    <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 2 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        sx={{ alignItems: { sm: "flex-start" }, justifyContent: "space-between" }}
      >
        <Box>
          <Typography sx={{ fontWeight: 850 }}>{title}</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
            {period}
          </Typography>
        </Box>
        <Chip color={status === "Ready" ? "success" : "default"} label={status} size="small" />
      </Stack>
      {coverage ? (
        <Typography color="primary.main" sx={{ fontWeight: 750, mt: 1.5 }} variant="body2">
          {coverage}
        </Typography>
      ) : null}
      <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
        {description}
      </Typography>
      {details}
      {action ? <Box sx={{ mt: 1.5 }}>{action}</Box> : null}
    </Box>
  );
}

function PeriodicAvailability({ availability, gate, timingMode }: {
  availability: CoachPeriodicReviewAvailabilityV2;
  gate: CoachAiReviewGenerationGateV2;
  timingMode: CoachAiReviewTimingModeV2;
}) {
  const completed = availability.completedReviewCount;
  const created = completed + availability.incompleteReviewCount;
  const title = availability.period.cadence === "two_week"
    ? "Two-week review"
    : "Trading-week review";
  const period = `${formatDate(availability.period.startDate)} to ${formatDate(availability.period.endDate)}`;
  const details = <WeeklyTradeTrackerReviewCoverage days={availability.reviewDays} />;
  const unavailable = unavailableCopy(gate);
  if (unavailable && ["manual_available", "automatic_ready", "already_requested"]
      .includes(availability.state)) {
    return (
      <AvailabilityCard
        coverage={evidenceCoverageLabel(availability, completed, created)}
        description={unavailable.description}
        details={details}
        period={period}
        status={unavailable.status}
        title={title}
      />
    );
  }
  if (availability.state === "manual_available") {
    return (
      <AvailabilityCard
        action={
          <AiReviewRequestButton
            label={availability.period.cadence === "two_week"
              ? "Generate two-week review"
              : "Generate weekly review"}
            periodEndDate={availability.period.endDate}
            periodStartDate={availability.period.startDate}
            reviewKind={availability.period.cadence}
          />
        }
        coverage={evidenceCoverageLabel(availability, completed, created)}
        description={timingMode === "automatic_after_12_hours"
          ? <>Generate now using verified execution facts and everything currently saved. Otherwise, it will start automatically{availability.automaticAtUtc ? <> at <LocalReviewTime value={availability.automaticAtUtc} /></> : " 12 hours after post-market ends on the final trading day"}.</>
          : <>Generate now using verified execution facts and everything currently saved. It can also start when you have marked your reviews complete; otherwise, it starts automatically{availability.automaticAtUtc ? <> at <LocalReviewTime value={availability.automaticAtUtc} /></> : " at the end of the following trading week"}.</>}
        details={details}
        period={period}
        status="Ready"
        title={title}
      />
    );
  }
  if (availability.state === "automatic_ready") {
    return (
      <AvailabilityCard
        coverage={evidenceCoverageLabel(availability, completed, created)}
        description={<>The verified evidence is meaningful enough for an AI review. It is ready to start automatically using the verified facts and everything saved in Trade Tracker when generation begins{availability.automaticAtUtc ? <> at <LocalReviewTime value={availability.automaticAtUtc} /></> : null}.</>}
        details={details}
        period={period}
        status="Ready"
        title={title}
      />
    );
  }
  if (availability.state === "insufficient_evidence") {
    const singleTradeOnly = availability.evidence.readyClosedTradeCount === 1 &&
      availability.evidence.substantiveReflectionCount === 0 &&
      availability.evidence.savedTagCount === 0 &&
      availability.evidence.reviewedRuleOutcomeCount === 0;
    return (
      <AvailabilityCard
        coverage={evidenceCoverageLabel(availability, completed, created)}
        description={singleTradeOnly
          ? "One closed trade without notes, tags or rule results is not enough to support useful AI feedback. It will be combined with the next trading week once; exact facts are not discarded."
          : "There is not enough verified trade activity or substantive saved-note evidence to support a useful AI review yet."}
        details={details}
        period={period}
        status={singleTradeOnly ? "Combines with next week" : "Not ready"}
        title={title}
      />
    );
  }
  if (availability.state === "already_requested") {
    const requestCopy = availability.requestState === "generating"
      ? Object.freeze({ status: "Generating", description: "Your AI Review is being written from the saved evidence for this period." })
      : availability.requestState === "retrying"
        ? Object.freeze({ status: "Retrying", description: "A temporary issue stopped the review. It will retry with the same saved evidence." })
        : Object.freeze({ status: "Pending", description: "Your review is saved and waiting to begin." });
    return (
      <AvailabilityCard
        coverage={evidenceCoverageLabel(availability, completed, created)}
        description={requestCopy.description}
        details={details}
        period={period}
        status={requestCopy.status}
        title={title}
      />
    );
  }
  if (availability.state === "waiting_for_period") {
    return (
      <AvailabilityCard
        description={`This review period begins ${formatDate(availability.period.startDate)}. Verified execution facts and everything saved in Trade Tracker can be used when generation begins.`}
        period={period}
        status="Upcoming"
        title={title}
      />
    );
  }
  return (
    <AvailabilityCard
      coverage={evidenceCoverageLabel(availability, completed, created)}
      description="Verified facts and saved Trade Tracker input are accumulating. The trading period must end before an AI review can begin."
      details={details}
      period={period}
      status="In progress"
      title={title}
    />
  );
}

function MonthlyAvailability({ availability, gate }: {
  availability: CoachMonthlyReviewAvailabilityV2;
  gate: CoachAiReviewGenerationGateV2;
}) {
  const completed = availability.completedReviewCount;
  const created = completed + availability.incompleteReviewCount;
  const period = availability.period.periodCoverage === "partial_month"
    ? `${formatDate(availability.period.coverageStartDate)} to ${formatDate(availability.period.coverageEndDate)}`
    : formatMonth(availability.period.calendarMonthStartDate);
  const details = (
    <MonthlyTradeTrackerReviewDrawer
      days={availability.reviewDays}
      periodLabel={period}
    />
  );
  const unavailable = unavailableCopy(gate);
  if (unavailable && ["manual_available", "automatic_ready", "already_requested"]
      .includes(availability.state)) {
    return (
      <AvailabilityCard
        coverage={evidenceCoverageLabel(availability, completed, created)}
        description={unavailable.description}
        details={details}
        period={period}
        status={unavailable.status}
        title="Monthly review"
      />
    );
  }
  if (availability.state === "manual_available") {
    return (
      <AvailabilityCard
        action={
          <AiReviewRequestButton
            label="Generate monthly review"
            periodEndDate={availability.period.calendarMonthEndDate}
            periodStartDate={availability.period.calendarMonthStartDate}
            reviewKind="monthly"
          />
        }
        coverage={evidenceCoverageLabel(availability, completed, created)}
        description="Generate the calendar-month review using exact month facts and everything saved in Trade Tracker by generation time."
        details={details}
        period={period}
        status="Ready"
        title="Monthly review"
      />
    );
  }
  if (availability.state === "automatic_ready") {
    return (
      <AvailabilityCard
        coverage={evidenceCoverageLabel(availability, completed, created)}
        description={<>This exact calendar-month evidence is meaningful enough for an AI review and remains automatically due until its request is frozen{availability.automaticAtUtc ? <>, starting <LocalReviewTime value={availability.automaticAtUtc} /></> : null}.</>}
        details={details}
        period={period}
        status="Ready"
        title="Monthly review"
      />
    );
  }
  if (availability.state === "insufficient_evidence") {
    return (
      <AvailabilityCard
        coverage={evidenceCoverageLabel(availability, completed, created)}
        description="This month does not yet contain enough verified trade activity or substantive saved-note evidence to support a useful AI review. The exact facts remain available."
        details={details}
        period={period}
        status="Not ready"
        title="Monthly review"
      />
    );
  }
  if (availability.state === "already_requested") {
    const requestCopy = availability.requestState === "generating"
      ? Object.freeze({ status: "Generating", description: "Your monthly AI Review is being written from the saved evidence for this calendar month." })
      : availability.requestState === "retrying"
        ? Object.freeze({ status: "Retrying", description: "A temporary issue stopped the review. It will retry with the same saved calendar-month evidence." })
        : Object.freeze({ status: "Pending", description: "Your monthly review is saved and waiting to begin." });
    return (
      <AvailabilityCard
        coverage={evidenceCoverageLabel(availability, completed, created)}
        description={requestCopy.description}
        details={details}
        period={period}
        status={requestCopy.status}
        title="Monthly review"
      />
    );
  }
  return (
    <AvailabilityCard
      coverage={evidenceCoverageLabel(availability, completed, created)}
      description="This review uses exact calendar-month facts and becomes available at 8:00 AM on the day after month end. Everything saved in Trade Tracker by generation time can be used."
      details={details}
      period={period}
      status="Scheduled"
      title="Monthly review"
    />
  );
}

function ReviewAvailability({
  monthlyAvailability,
  periodicAvailability,
  gate,
  timingMode,
}: {
  monthlyAvailability: CoachMonthlyReviewAvailabilityV2 | null;
  periodicAvailability: CoachPeriodicReviewAvailabilityV2 | null;
  gate: CoachAiReviewGenerationGateV2;
  timingMode: CoachAiReviewTimingModeV2;
}) {
  if (!monthlyAvailability && !periodicAvailability) return null;
  return (
    <Box
      sx={{
        display: "grid",
        gap: 1.5,
        gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" },
      }}
    >
      {periodicAvailability
        ? <PeriodicAvailability availability={periodicAvailability} gate={gate} timingMode={timingMode} />
        : null}
      {monthlyAvailability
        ? <MonthlyAvailability availability={monthlyAvailability} gate={gate} />
        : null}
    </Box>
  );
}

export default async function AiReviewsPage() {
  const identity = await requireTraderLinkPlatformPageIdentity();
  const scope = identity.scope;
  const now = new Date();
  const {
    monthlyReviews,
    availability,
    generationGate,
    marketMonday,
    reviews,
    settings,
    currentReviews,
    authoredReviews,
    reviewUsage,
  } = withReadonlyPlatformDatabase({}, (database) => {
    const repository = new CoachAiReviewRepository(database);
    const currentRepository = new CoachAiReviewGenerationCompatibilityRepository(database);
    const authoredRepository = new CoachAiReviewAuthoredPersistenceRepository(database);
    const scheduleRepository = new CoachReviewDeliveryScheduleRepository(database);
    const calendar = new CoachUsEquitiesCalendarRepository(database).calendar();
    return Object.freeze({
      reviews: repository.listIssuedWeeklyReviews(scope),
      monthlyReviews: repository.listIssuedMonthlyReviews(scope),
      settings: scheduleRepository.readV2(scope),
      currentReviews: currentRepository.listIssuedReviewOutputs(scope),
      authoredReviews: authoredRepository.tablesAvailable()
        ? authoredRepository.listIssued(scope)
        : Object.freeze([]),
      availability: new CoachAiReviewAvailabilityService(database).read(scope, now),
      generationGate: new CoachAiReviewGenerationCoordinatorV2(database).readGate(scope),
      reviewUsage: new CoachAiReviewProviderControlsRepository(database)
        .readSubscriberUsage(scope, now),
      marketMonday: calendar.cohortForDate(calendar.marketDateAt(now)).mondayDate,
    });
  });
  const effectiveFrequency = settings?.isEnabled
    ? resolveCoachEffectiveAiReviewFrequencyV2(settings, marketMonday).frequency
    : null;
  const periodicCurrent = currentReviews.filter((review) =>
    review.reviewKind !== "monthly");
  const monthlyCurrent = currentReviews.filter((review) =>
    review.reviewKind === "monthly");
  const periodicAuthored = authoredReviews.filter((review) => review.reviewKind !== "monthly");
  const monthlyAuthored = authoredReviews.filter((review) => review.reviewKind === "monthly");
  const periodicItems: readonly AiReviewListItem[] = Object.freeze([
    ...periodicAuthored.map((review) => Object.freeze({ href: `/ai-reviews/weekly/${review.issuedReviewId}`, summary: authoredReviewSummary(review), title: authoredReviewTitle(review) })),
    ...periodicCurrent.map((review) => Object.freeze({ href: `/ai-reviews/weekly/${review.issuedReviewId}`, summary: review.output.reviewSummary, title: currentReviewTitle(review) })),
    ...reviews.map((review) => Object.freeze({ href: `/ai-reviews/weekly/${review.issuedReviewId}`, summary: review.output.weeklyReview, title: legacyWeekTitle(review) })),
  ]);
  const monthlyItems: readonly AiReviewListItem[] = Object.freeze([
    ...monthlyAuthored.map((review) => Object.freeze({ href: `/ai-reviews/monthly/${review.issuedReviewId}`, summary: authoredReviewSummary(review), title: authoredReviewTitle(review) })),
    ...monthlyCurrent.map((review) => Object.freeze({ href: `/ai-reviews/monthly/${review.issuedReviewId}`, summary: review.output.reviewSummary, title: currentReviewTitle(review) })),
    ...monthlyReviews.map((review) => Object.freeze({ href: `/ai-reviews/monthly/${review.issuedReviewId}`, summary: review.output.monthlyReview, title: legacyMonthTitle(review) })),
  ]);
  const offlineModel = createCoachAiReviewOfflineListViewModel({ monthly: monthlyItems, periodic: periodicItems });

  return (
    <>
    <OfflineSavedViewCapture
      accountTimezone={null}
      calculationVersion="coach-issued-ai-reviews-v1"
      coverage={COACH_AI_REVIEW_OFFLINE_COVERAGE}
      generatedAtUtc={new Date().toISOString()}
      model={offlineModel}
      pathname="/ai-reviews"
      queryIdentity="issued-reviews"
      reportingCurrency={null}
      routeViewVersion={COACH_AI_REVIEW_OFFLINE_VIEW_VERSION}
      viewKey={COACH_AI_REVIEW_OFFLINE_LIST_VIEW_KEY}
    />
    <DashboardPage>
      <Box>
        <Typography component="h1" variant="h1">AI Reviews</Typography>
        <AiReviewUsageProgress percentageUsed={reviewUsage?.percentageUsed ?? null} />
        <Typography color="text.secondary" sx={{ maxWidth: 760, mt: 1 }} variant="body2">
          Turn verified trading results and anything you choose to save in Trade Tracker into a clear review of your week or month.
        </Typography>
        {identity.mode === "local_development" || identity.discord?.guildOwner ? (
          <Button
            href="/ai-reviews/benchmark-preview"
            size="small"
            sx={{ mt: 1.5 }}
            variant="outlined"
          >
            Preview power-user reviews
          </Button>
        ) : null}
      </Box>

      <DashboardPanel
        action={
          <Chip
            color={settings?.isEnabled ? "success" : "default"}
            label={settings?.isEnabled ? "On" : "Off"}
            size="small"
          />
        }
        title="Review schedule"
      >
        <ReviewSchedule
          effectiveFrequency={effectiveFrequency}
          marketMonday={marketMonday}
          settings={settings}
        />
      </DashboardPanel>

      {settings?.isEnabled ? (
        <DashboardPanel title="Review availability">
          <Stack spacing={1.5}>
            {generationGate.state !== "available" ? (
              <Alert severity="info">{unavailableCopy(generationGate)?.description}</Alert>
            ) : null}
            <ReviewAvailability
              gate={generationGate}
              monthlyAvailability={availability.monthly}
              periodicAvailability={availability.periodic}
              timingMode={settings.timingMode}
            />
          </Stack>
        </DashboardPanel>
      ) : null}

      <AiReviewsIssuedList monthly={monthlyItems} periodic={periodicItems} />
    </DashboardPage>
    </>
  );
}
