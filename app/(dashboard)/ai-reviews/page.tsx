import Link from "next/link";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";

import { DashboardPage, DashboardPanel } from "../../dashboard-template";
import { CoachAiReviewRepository } from "@/src/modules/coach/server/coach-ai-review-repository";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";

export const metadata: Metadata = {
  title: "AI Reviews | TraderLink Platform",
  description: "Read your saved weekly trading reviews.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

export default async function AiReviewsPage() {
  const scope = await requireTraderLinkPlatformPageScope();
  const reviews = withReadonlyPlatformDatabase({}, (database) =>
    new CoachAiReviewRepository(database).listIssuedWeeklyReviews(scope));

  return (
    <DashboardPage>
      <Box>
        <Typography component="h1" variant="h1">AI Reviews</Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 720, mt: 1 }} variant="body2">
          Get a clear weekly breakdown of what worked, what held you back, and where to focus next—built around the trades, notes and rules you recorded.
        </Typography>
      </Box>

      <DashboardPanel title="Weekly reviews">
        {reviews.length === 0 ? (
          <Stack spacing={0.75}>
            <Typography sx={{ fontWeight: 800 }}>No weekly reviews yet</Typography>
            <Typography color="text.secondary" variant="body2">
              Your weekly reviews will appear here after one has been issued for this Journal account.
            </Typography>
          </Stack>
        ) : (
          <Stack spacing={1.25}>
            {reviews.map((review) => (
              <Box
                component="article"
                key={review.issuedReviewId}
                sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, p: 2 }}
              >
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "flex-start" }, justifyContent: "space-between" }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800 }} variant="h3">
                      {reviewWeekLabel(review.weekStartDate, review.weekEndDate)}
                    </Typography>
                    <Typography color="text.secondary" sx={{ mt: 0.75, whiteSpace: "pre-wrap" }} variant="body2">
                      {review.output.weeklyReview}
                    </Typography>
                  </Box>
                  <Button component={Link} href={`/ai-reviews/weekly/${review.issuedReviewId}`} size="small" variant="outlined">
                    Open review
                  </Button>
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </DashboardPanel>

      <DashboardPanel title="Monthly reviews">
        <Stack spacing={0.75}>
          <Typography sx={{ fontWeight: 800 }}>No monthly reviews yet</Typography>
          <Typography color="text.secondary" variant="body2">
            Monthly reviews have not been issued yet. Delivery settings are in Account.
          </Typography>
        </Stack>
      </DashboardPanel>
    </DashboardPage>
  );
}
