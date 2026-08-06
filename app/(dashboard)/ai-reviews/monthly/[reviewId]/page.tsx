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
  type CoachMonthlyIssuedReviewRecord,
} from "@/src/modules/coach/server/coach-ai-review-repository";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";

export const metadata: Metadata = {
  title: "Monthly AI Review | TraderLink Platform",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

function formatMonthDate(value: string): string {
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

function reviewMonthLabel(review: CoachMonthlyIssuedReviewRecord): string {
  return review.periodCoverage === "partial_month"
    ? `First month: ${formatMonthDate(review.monthStartDate)} to ${formatMonthDate(review.monthEndDate)}`
    : formatMonth(review.monthStartDate);
}

export default async function MonthlyAiReviewPage({
  params,
}: {
  params: Promise<{ reviewId: string }>;
}) {
  const { reviewId } = await params;
  if (!UUID_V4_PATTERN.test(reviewId)) notFound();

  const scope = await requireTraderLinkPlatformPageScope();
  let review: CoachMonthlyIssuedReviewRecord;
  try {
    review = withReadonlyPlatformDatabase({}, (database) =>
      new CoachAiReviewRepository(database).readIssuedMonthlyReview(scope, reviewId));
  } catch (error) {
    if (isTraderLinkPlatformError(error) && error.code === "TRADERLINK_ACCOUNT_ACCESS_DENIED") notFound();
    throw error;
  }

  return (
    <DashboardPage>
      <Box>
        <Button component={Link} href="/ai-reviews" size="small" variant="text">
          Back to AI Reviews
        </Button>
        <Typography component="h1" sx={{ mt: 1 }} variant="h1">Monthly AI Review</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
          {reviewMonthLabel(review)}
        </Typography>
      </Box>

      <DashboardPanel title="Monthly review">
        <Typography sx={{ whiteSpace: "pre-wrap" }} variant="body1">{review.output.monthlyReview}</Typography>
      </DashboardPanel>

      <DashboardPanel title="Progress across the month">
        <Typography sx={{ whiteSpace: "pre-wrap" }} variant="body1">{review.output.progressAcrossMonth}</Typography>
      </DashboardPanel>

      <DashboardPanel title="Recurring friction">
        <Typography sx={{ whiteSpace: "pre-wrap" }} variant="body1">{review.output.recurringFriction}</Typography>
      </DashboardPanel>

      <DashboardPanel title="Focus follow-through">
        <Typography sx={{ whiteSpace: "pre-wrap" }} variant="body1">{review.output.focusFollowThrough}</Typography>
      </DashboardPanel>

      <DashboardPanel title="Next month's focuses">
        {review.output.nextMonthFocuses.length > 0 ? (
          <Stack component="ol" spacing={0.75} sx={{ m: 0, pl: 3 }}>
            {review.output.nextMonthFocuses.map((focus, index) => (
              <Typography component="li" key={`${focus}-${index}`} variant="body1">{focus}</Typography>
            ))}
          </Stack>
        ) : (
          <Typography color="text.secondary" variant="body2">No focuses were saved with this review.</Typography>
        )}
      </DashboardPanel>

      {review.output.incompleteRecord !== null ? (
        <DashboardPanel title="Incomplete record">
          <Typography sx={{ whiteSpace: "pre-wrap" }} variant="body1">{review.output.incompleteRecord}</Typography>
        </DashboardPanel>
      ) : null}
    </DashboardPage>
  );
}
