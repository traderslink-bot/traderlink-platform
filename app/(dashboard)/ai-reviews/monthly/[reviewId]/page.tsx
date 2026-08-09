import { notFound } from "next/navigation";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import type { Metadata } from "next";

import { DashboardPage } from "../../../../dashboard-template";
import {
  CoachAiReviewRepository,
  type CoachAiIssuedReviewRecordV2,
  type CoachMonthlyIssuedReviewRecord,
} from "@/src/modules/coach/server/coach-ai-review-repository";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";
import {
  AiReviewDocument,
  type AiReviewDocumentView,
} from "../../ai-review-document";

export const metadata: Metadata = {
  title: "Monthly AI Review | TraderLink Platform",
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

function formatMonth(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00.000Z`));
}

function v2View(review: CoachAiIssuedReviewRecordV2): AiReviewDocumentView {
  if (review.reviewKind !== "monthly") notFound();
  return Object.freeze({
    reviewTypeLabel: "Monthly AI Review",
    periodLabel: formatMonth(review.periodStartDate),
    reviewSummary: review.output.reviewSummary,
    whatImproved: review.output.whatImproved,
    whatHeldYouBack: review.output.whatHeldYouBack,
    focusFollowThrough: review.output.focusFollowThrough,
    nextPeriodFocuses: review.output.nextPeriodFocuses,
    incompleteRecord: review.output.incompleteRecord,
  });
}

function legacyView(review: CoachMonthlyIssuedReviewRecord): AiReviewDocumentView {
  return Object.freeze({
    reviewTypeLabel: "Monthly AI Review",
    periodLabel: review.periodCoverage === "partial_month"
      ? `First month: ${formatDate(review.monthStartDate)} to ${formatDate(review.monthEndDate)}`
      : formatMonth(review.monthStartDate),
    reviewSummary: review.output.monthlyReview,
    whatImproved: review.output.progressAcrossMonth,
    whatHeldYouBack: review.output.recurringFriction,
    focusFollowThrough: review.output.focusFollowThrough,
    nextPeriodFocuses: review.output.nextMonthFocuses,
    incompleteRecord: review.output.incompleteRecord,
  });
}

export default async function MonthlyAiReviewPage({
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
      return legacyView(repository.readIssuedMonthlyReview(scope, reviewId));
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
        <Button href="/ai-reviews" size="small" variant="text">
          Back to AI Reviews
        </Button>
      </Box>
      <AiReviewDocument view={view} />
    </DashboardPage>
  );
}
