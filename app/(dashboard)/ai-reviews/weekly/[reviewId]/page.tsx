import Link from "next/link";
import { notFound } from "next/navigation";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";

import { DashboardPage, DashboardPanel } from "../../../../dashboard-template";
import {
  CoachAiReviewRepository,
  type CoachAiIssuedReviewRecordV2,
  type CoachWeeklyIssuedReviewRecord,
} from "@/src/modules/coach/server/coach-ai-review-repository";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";

export const metadata: Metadata = {
  title: "AI Review | TraderLink Platform",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

type PeriodicReviewView = Readonly<{
  title: string;
  periodLabel: string;
  reviewSummary: string;
  whatImproved: string;
  whatHeldYouBack: string;
  focusFollowThrough: string;
  nextPeriodFocuses: readonly string[];
  incompleteRecord: string | null;
}>;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00.000Z`));
}

function v2View(review: CoachAiIssuedReviewRecordV2): PeriodicReviewView {
  if (review.reviewKind === "monthly") notFound();
  return Object.freeze({
    title: review.reviewKind === "two_week" ? "Two-week AI Review" : "Weekly AI Review",
    periodLabel: `${formatDate(review.periodStartDate)} to ${formatDate(review.periodEndDate)}`,
    reviewSummary: review.output.reviewSummary,
    whatImproved: review.output.whatImproved,
    whatHeldYouBack: review.output.whatHeldYouBack,
    focusFollowThrough: review.output.focusFollowThrough,
    nextPeriodFocuses: review.output.nextPeriodFocuses,
    incompleteRecord: review.output.incompleteRecord,
  });
}

function legacyView(review: CoachWeeklyIssuedReviewRecord): PeriodicReviewView {
  return Object.freeze({
    title: "Weekly AI Review",
    periodLabel: `${formatDate(review.weekStartDate)} to ${formatDate(review.weekEndDate)}`,
    reviewSummary: review.output.weeklyReview,
    whatImproved: review.output.whatImproved,
    whatHeldYouBack: review.output.whatHeldYouBack,
    focusFollowThrough: review.output.focusFollowThrough,
    nextPeriodFocuses: review.output.nextWeekFocuses,
    incompleteRecord: review.output.incompleteRecord,
  });
}

export default async function WeeklyAiReviewPage({
  params,
}: {
  params: Promise<{ reviewId: string }>;
}) {
  const { reviewId } = await params;
  if (!UUID_V4_PATTERN.test(reviewId)) notFound();

  const scope = await requireTraderLinkPlatformPageScope();
  const view = withReadonlyPlatformDatabase({}, (database): PeriodicReviewView => {
    const repository = new CoachAiReviewRepository(database);
    try {
      return v2View(repository.readIssuedReviewV2(scope, reviewId));
    } catch (error) {
      if (!(isTraderLinkPlatformError(error) && error.code === "TRADERLINK_ACCOUNT_ACCESS_DENIED")) {
        throw error;
      }
    }
    try {
      return legacyView(repository.readIssuedWeeklyReview(scope, reviewId));
    } catch (error) {
      if (isTraderLinkPlatformError(error) && error.code === "TRADERLINK_ACCOUNT_ACCESS_DENIED") {
        notFound();
      }
      throw error;
    }
  });

  return (
    <DashboardPage>
      <Box>
        <Button component={Link} href="/ai-reviews" size="small" variant="text">
          Back to AI Reviews
        </Button>
        <Typography component="h1" sx={{ mt: 1 }} variant="h1">{view.title}</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
          {view.periodLabel}
        </Typography>
      </Box>

      <DashboardPanel title="Review summary">
        <Typography sx={{ whiteSpace: "pre-wrap" }} variant="body1">{view.reviewSummary}</Typography>
      </DashboardPanel>

      <DashboardPanel title="What improved">
        <Typography sx={{ whiteSpace: "pre-wrap" }} variant="body1">{view.whatImproved}</Typography>
      </DashboardPanel>

      <DashboardPanel title="What held you back">
        <Typography sx={{ whiteSpace: "pre-wrap" }} variant="body1">{view.whatHeldYouBack}</Typography>
      </DashboardPanel>

      <DashboardPanel title="Focus follow-through">
        <Typography sx={{ whiteSpace: "pre-wrap" }} variant="body1">{view.focusFollowThrough}</Typography>
      </DashboardPanel>

      <DashboardPanel title="Focus until your next review">
        {view.nextPeriodFocuses.length > 0 ? (
          <Stack component="ol" spacing={0.75} sx={{ m: 0, pl: 3 }}>
            {view.nextPeriodFocuses.map((focus, index) => (
              <Typography component="li" key={`${focus}-${index}`} variant="body1">{focus}</Typography>
            ))}
          </Stack>
        ) : (
          <Typography color="text.secondary" variant="body2">No focuses were saved with this review.</Typography>
        )}
      </DashboardPanel>

      {view.incompleteRecord !== null ? (
        <DashboardPanel title="Coverage note">
          <Typography sx={{ whiteSpace: "pre-wrap" }} variant="body1">{view.incompleteRecord}</Typography>
        </DashboardPanel>
      ) : null}
    </DashboardPage>
  );
}
