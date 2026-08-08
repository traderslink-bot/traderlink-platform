import Link from "next/link";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import {
  DashboardPage,
  DashboardPanel,
  DashboardUnavailableState,
} from "../../dashboard-template";
import {
  CoachAiReviewRepository,
  type CoachAiIssuedReviewRecordV2,
  type CoachMonthlyIssuedReviewRecord,
  type CoachWeeklyIssuedReviewRecord,
} from "@/src/modules/coach/server/coach-ai-review-repository";
import {
  CoachReviewDeliveryScheduleRepository,
  resolveCoachEffectiveAiReviewFrequencyV2,
  type CoachAiReviewAccountSettingsV2,
  type CoachAiReviewFrequencyV2,
} from "@/src/modules/coach/server/coach-weekly-review-schedule-repository";
import {
  CoachAiReviewAvailabilityService,
  type CoachMonthlyReviewAvailabilityV2,
  type CoachPeriodicReviewAvailabilityV2,
} from "@/src/modules/coach/server/coach-ai-review-availability-service";
import { CoachUsEquitiesReviewCalendarService } from "@/src/modules/coach/server/market-calendar/coach-us-equities-review-calendar-service";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import {
  MonthlyTradeTrackerReviewDrawer,
  WeeklyTradeTrackerReviewCoverage,
} from "./trade-tracker-review-coverage";
import { AiReviewRequestButton } from "./ai-review-request-button";

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

function v2ReviewTitle(review: CoachAiIssuedReviewRecordV2): string {
  if (review.reviewKind === "monthly") return formatMonth(review.periodStartDate);
  const cadence = review.reviewKind === "two_week" ? "Two-week review" : "Trading-week review";
  return `${cadence}: ${formatDate(review.periodStartDate)} to ${formatDate(review.periodEndDate)}`;
}

function legacyWeekTitle(review: CoachWeeklyIssuedReviewRecord): string {
  return `Trading-week review: ${formatDate(review.weekStartDate)} to ${formatDate(review.weekEndDate)}`;
}

function legacyMonthTitle(review: CoachMonthlyIssuedReviewRecord): string {
  return review.periodCoverage === "partial_month"
    ? `First month: ${formatDate(review.monthStartDate)} to ${formatDate(review.monthEndDate)}`
    : formatMonth(review.monthStartDate);
}

function ReviewCard({
  href,
  summary,
  title,
}: {
  href: string;
  summary: string;
  title: string;
}) {
  return (
    <Box
      component="article"
      sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, p: 2 }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ alignItems: { sm: "flex-start" }, justifyContent: "space-between" }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800 }} variant="h3">{title}</Typography>
          <Typography
            color="text.secondary"
            sx={{ mt: 0.75, whiteSpace: "pre-wrap" }}
            variant="body2"
          >
            {summary}
          </Typography>
        </Box>
        <Button component={Link} href={href} size="small" variant="outlined">
          Open review
        </Button>
      </Stack>
    </Box>
  );
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
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
        }}
      >
        <Box>
          <Typography color="text.secondary" variant="caption">Frequency</Typography>
          <Typography sx={{ fontWeight: 800 }}>
            {frequencyLabel(effectiveFrequency ?? settings.currentFrequency)}
          </Typography>
        </Box>
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
        Only daily Trade Tracker reviews marked complete when generation begins are included. Later edits do not change an issued review.
      </Typography>
    </Stack>
  );
}

function completedCoverageLabel(
  completed: number,
  created: number,
  context: "monthly" | "periodic",
): string {
  const completedLabel = context === "monthly"
    ? `${completed} daily review${completed === 1 ? "" : "s"} available for this monthly review`
    : `${completed} daily review${completed === 1 ? "" : "s"} marked complete`;
  const incomplete = Math.max(0, created - completed);
  return incomplete > 0
    ? `${completedLabel} · ${incomplete} not complete`
    : completedLabel;
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
  description: string;
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

function PeriodicAvailability({ availability }: {
  availability: CoachPeriodicReviewAvailabilityV2;
}) {
  const completed = availability.completedReviewCount;
  const created = completed + availability.incompleteReviewCount;
  const title = availability.period.cadence === "two_week"
    ? "Two-week review"
    : "Trading-week review";
  const period = `${formatDate(availability.period.startDate)} to ${formatDate(availability.period.endDate)}`;
  const details = <WeeklyTradeTrackerReviewCoverage days={availability.reviewDays} />;
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
        coverage={completedCoverageLabel(completed, created, "periodic")}
        description="Generate now using the completed reviews available at this moment. Later edits will not change the issued review."
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
        coverage={completedCoverageLabel(completed, created, "periodic")}
        description="Every Trade Tracker review you created is complete. This review is ready to start automatically."
        details={details}
        period={period}
        status="Ready"
        title={title}
      />
    );
  }
  if (availability.state === "no_completed_reflections") {
    return (
      <AvailabilityCard
        coverage={completedCoverageLabel(0, created, "periodic")}
        description="No AI review is generated without at least one completed Trade Tracker review. A completed review can make this period available later."
        details={details}
        period={period}
        status="Not ready"
        title={title}
      />
    );
  }
  if (availability.state === "already_requested") {
    return (
      <AvailabilityCard
        coverage={completedCoverageLabel(completed, created, "periodic")}
        description="This review has already been requested. It will appear in your saved reviews when it is issued."
        details={details}
        period={period}
        status="Requested"
        title={title}
      />
    );
  }
  if (availability.state === "waiting_for_period") {
    return (
      <AvailabilityCard
        description={`This review period begins ${formatDate(availability.period.startDate)}. Complete Trade Tracker reviews from that period will count.`}
        details={details}
        period={period}
        status="Upcoming"
        title={title}
      />
    );
  }
  return (
    <AvailabilityCard
      coverage={completedCoverageLabel(completed, created, "periodic")}
      description="Keep completing your Trade Tracker reviews. The factual period must end before an AI review can begin."
      details={details}
      period={period}
      status="In progress"
      title={title}
    />
  );
}

function MonthlyAvailability({ availability }: {
  availability: CoachMonthlyReviewAvailabilityV2;
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
        coverage={completedCoverageLabel(completed, created, "monthly")}
        description="Generate the calendar-month review using exact month facts and the completed monthly reflection coverage available now."
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
        coverage={completedCoverageLabel(completed, created, "monthly")}
        description="This calendar-month review is ready to start automatically."
        details={details}
        period={period}
        status="Ready"
        title="Monthly review"
      />
    );
  }
  if (availability.state === "no_completed_reflections") {
    return (
      <AvailabilityCard
        coverage={completedCoverageLabel(0, created, "monthly")}
        description="No monthly AI review is generated without at least one completed Trade Tracker review. Completing one later can make this month available."
        details={details}
        period={period}
        status="Not ready"
        title="Monthly review"
      />
    );
  }
  if (availability.state === "already_requested") {
    return (
      <AvailabilityCard
        coverage={completedCoverageLabel(completed, created, "monthly")}
        description="This monthly review has already been requested. It will appear below when it is issued."
        details={details}
        period={period}
        status="Requested"
        title="Monthly review"
      />
    );
  }
  return (
    <AvailabilityCard
      coverage={completedCoverageLabel(completed, created, "monthly")}
      description="This review uses exact calendar-month facts and becomes available at 8:00 AM on the day after month end."
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
}: {
  monthlyAvailability: CoachMonthlyReviewAvailabilityV2 | null;
  periodicAvailability: CoachPeriodicReviewAvailabilityV2 | null;
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
        ? <PeriodicAvailability availability={periodicAvailability} />
        : null}
      {monthlyAvailability
        ? <MonthlyAvailability availability={monthlyAvailability} />
        : null}
    </Box>
  );
}

export default async function AiReviewsPage() {
  const scope = await requireTraderLinkPlatformPageScope();
  const now = new Date();
  const calendar = new CoachUsEquitiesReviewCalendarService();
  const marketMonday = calendar.cohortForDate(calendar.marketDateAt(now)).mondayDate;
  const {
    monthlyReviews,
    availability,
    reviews,
    settings,
    v2Reviews,
  } = withReadonlyPlatformDatabase({}, (database) => {
    const repository = new CoachAiReviewRepository(database);
    const scheduleRepository = new CoachReviewDeliveryScheduleRepository(database);
    return Object.freeze({
      reviews: repository.listIssuedWeeklyReviews(scope),
      monthlyReviews: repository.listIssuedMonthlyReviews(scope),
      settings: scheduleRepository.readV2(scope),
      v2Reviews: repository.listIssuedReviewsV2(scope),
      availability: new CoachAiReviewAvailabilityService(database).read(scope, now),
    });
  });
  const effectiveFrequency = settings?.isEnabled
    ? resolveCoachEffectiveAiReviewFrequencyV2(settings, marketMonday).frequency
    : null;
  const periodicV2 = v2Reviews.filter((review) => review.reviewKind !== "monthly");
  const monthlyV2 = v2Reviews.filter((review) => review.reviewKind === "monthly");

  return (
    <DashboardPage>
      <Box>
        <Typography component="h1" variant="h1">AI Reviews</Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 760, mt: 1 }} variant="body2">
          Turn your completed daily Trade Tracker reviews into a clear view of what improved, what held you back and what to focus on next.
        </Typography>
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
          <ReviewAvailability
            monthlyAvailability={availability.monthly}
            periodicAvailability={availability.periodic}
          />
        </DashboardPanel>
      ) : null}

      <DashboardPanel title="Weekly and two-week reviews">
        {periodicV2.length === 0 && reviews.length === 0 ? (
          <Stack spacing={0.75}>
            <Typography sx={{ fontWeight: 800 }}>No weekly reviews yet</Typography>
            <Typography color="text.secondary" variant="body2">
              Saved weekly and two-week reviews will appear here for this Trade Tracker account.
            </Typography>
          </Stack>
        ) : (
          <Stack spacing={1.25}>
            {periodicV2.map((review) => (
              <ReviewCard
                href={`/ai-reviews/weekly/${review.issuedReviewId}`}
                key={review.issuedReviewId}
                summary={review.output.reviewSummary}
                title={v2ReviewTitle(review)}
              />
            ))}
            {reviews.map((review) => (
              <ReviewCard
                href={`/ai-reviews/weekly/${review.issuedReviewId}`}
                key={review.issuedReviewId}
                summary={review.output.weeklyReview}
                title={legacyWeekTitle(review)}
              />
            ))}
          </Stack>
        )}
      </DashboardPanel>

      <DashboardPanel title="Monthly reviews">
        {monthlyV2.length === 0 && monthlyReviews.length === 0 ? (
          <Stack spacing={0.75}>
            <Typography sx={{ fontWeight: 800 }}>No monthly reviews yet</Typography>
            <Typography color="text.secondary" variant="body2">
              Saved calendar-month reviews will appear here for this Trade Tracker account.
            </Typography>
          </Stack>
        ) : (
          <Stack spacing={1.25}>
            {monthlyV2.map((review) => (
              <ReviewCard
                href={`/ai-reviews/monthly/${review.issuedReviewId}`}
                key={review.issuedReviewId}
                summary={review.output.reviewSummary}
                title={v2ReviewTitle(review)}
              />
            ))}
            {monthlyReviews.map((review) => (
              <ReviewCard
                href={`/ai-reviews/monthly/${review.issuedReviewId}`}
                key={review.issuedReviewId}
                summary={review.output.monthlyReview}
                title={legacyMonthTitle(review)}
              />
            ))}
          </Stack>
        )}
      </DashboardPanel>
    </DashboardPage>
  );
}
