import { notFound } from "next/navigation";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import type { Metadata } from "next";

import { DashboardPage } from "../../../../dashboard-template";
import {
  CoachAiReviewRepository,
  type CoachAiIssuedReviewRecordV2,
  type CoachWeeklyIssuedReviewRecord,
} from "@/src/modules/coach/server/coach-ai-review-repository";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";
import {
  AiReviewDocument,
  type AiReviewDocumentView,
} from "../../ai-review-document";
import { AiReviewChatButton } from "../../ai-review-chat-button";

export const metadata: Metadata = {
  title: "AI Review | TraderLink Platform",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00.000Z`));
}

function v2View(review: CoachAiIssuedReviewRecordV2): AiReviewDocumentView {
  if (review.reviewKind === "monthly") notFound();
  return Object.freeze({
    reviewTypeLabel: review.reviewKind === "two_week" ? "Two-week AI Review" : "Weekly AI Review",
    periodLabel: `${formatDate(review.periodStartDate)} to ${formatDate(review.periodEndDate)}`,
    reviewSummary: review.output.reviewSummary,
    whatImproved: review.output.whatImproved,
    whatHeldYouBack: review.output.whatHeldYouBack,
    focusFollowThrough: review.output.focusFollowThrough,
    nextPeriodFocuses: review.output.nextPeriodFocuses,
    incompleteRecord: review.output.incompleteRecord,
  });
}

function legacyView(review: CoachWeeklyIssuedReviewRecord): AiReviewDocumentView {
  return Object.freeze({
    reviewTypeLabel: "Weekly AI Review",
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
  const view = withReadonlyPlatformDatabase({}, (database): AiReviewDocumentView => {
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
      <Box sx={{ mb: -0.75 }}>
        <Box sx={{ alignItems: "center", display: "flex", gap: 1, justifyContent: "space-between" }}>
          <Button href="/ai-reviews" size="small" variant="text">
            Back to AI Reviews
          </Button>
          <AiReviewChatButton
            periodLabel={view.periodLabel}
            reviewTypeLabel={view.reviewTypeLabel}
          />
        </Box>
      </Box>
      <AiReviewDocument view={view} />
    </DashboardPage>
  );
}
