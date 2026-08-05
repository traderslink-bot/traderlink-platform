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
  type CoachWeeklyIssuedReviewRecord,
} from "@/src/modules/coach/server/coach-ai-review-repository";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";

export const metadata: Metadata = {
  title: "Weekly AI Review | TraderLink Platform",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

function formatWeekDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00.000Z`));
}

function reviewWeekLabel(startDate: string, endDate: string): string {
  return `Week of ${formatWeekDate(startDate)} to ${formatWeekDate(endDate)}`;
}

export default async function WeeklyAiReviewPage({
  params,
}: {
  params: Promise<{ reviewId: string }>;
}) {
  const { reviewId } = await params;
  if (!UUID_V4_PATTERN.test(reviewId)) notFound();

  const scope = await requireTraderLinkPlatformPageScope();
  let review: CoachWeeklyIssuedReviewRecord;
  try {
    review = withReadonlyPlatformDatabase({}, (database) =>
      new CoachAiReviewRepository(database).readIssuedWeeklyReview(scope, reviewId));
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
        <Typography component="h1" sx={{ mt: 1 }} variant="h1">AI Review</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
          {reviewWeekLabel(review.weekStartDate, review.weekEndDate)}
        </Typography>
      </Box>

      <DashboardPanel title="Weekly review">
        <Typography sx={{ whiteSpace: "pre-wrap" }} variant="body1">{review.output.weeklyReview}</Typography>
      </DashboardPanel>

      <DashboardPanel title="What improved">
        <Typography sx={{ whiteSpace: "pre-wrap" }} variant="body1">{review.output.whatImproved}</Typography>
      </DashboardPanel>

      <DashboardPanel title="What held you back">
        <Typography sx={{ whiteSpace: "pre-wrap" }} variant="body1">{review.output.whatHeldYouBack}</Typography>
      </DashboardPanel>

      <DashboardPanel title="Focus follow-through">
        <Typography sx={{ whiteSpace: "pre-wrap" }} variant="body1">{review.output.focusFollowThrough}</Typography>
      </DashboardPanel>

      <DashboardPanel title="Next week's focuses">
        {review.output.nextWeekFocuses.length > 0 ? (
          <Stack component="ol" spacing={0.75} sx={{ m: 0, pl: 3 }}>
            {review.output.nextWeekFocuses.map((focus, index) => (
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
