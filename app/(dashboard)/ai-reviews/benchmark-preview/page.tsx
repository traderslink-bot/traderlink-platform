import "server-only";

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { notFound } from "next/navigation";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import type { Metadata } from "next";

import { DashboardPage } from "../../../dashboard-template";
import { requireTraderLinkPlatformPageIdentity } from
  "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {
  AiReviewDocument,
  type AiReviewDocumentView,
} from "../ai-review-document";

export const metadata: Metadata = {
  title: "AI Review Presentation Preview | TraderLink Platform",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ARTIFACT_NAME = "ai-review-monthly-cost-benchmark-2026-08-09T14-32-17.746Z.json";
const LABELS = Object.freeze([
  "heavy_weekly_1",
  "heavy_weekly_2",
  "heavy_weekly_3",
  "heavy_weekly_4",
  "heavy_monthly",
] as const);
type PreviewLabel = typeof LABELS[number];

type BenchmarkOutput = Readonly<{
  reviewSummary: string;
  whatImproved: string;
  whatHeldYouBack: string;
  focusFollowThrough: string;
  nextPeriodFocuses: readonly string[];
  incompleteRecord: string | null;
}>;

type BenchmarkCall = Readonly<{
  label: PreviewLabel;
  kind: "weekly" | "monthly";
  output: BenchmarkOutput;
}>;

type BenchmarkPeriod = Readonly<{
  startDate: string;
  endDate: string;
}>;

type BenchmarkProfile = Readonly<{
  profile: string;
  weeklyInputs: readonly Readonly<{ period: BenchmarkPeriod }>[];
  monthlyInput: Readonly<{ period: BenchmarkPeriod }>;
  calls: readonly BenchmarkCall[];
}>;

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

function isPreviewLabel(value: string): value is PreviewLabel {
  return (LABELS as readonly string[]).includes(value);
}

function heavyProfile(): BenchmarkProfile {
  const path = join(process.cwd(), ".local-logs", ARTIFACT_NAME);
  if (!existsSync(path)) notFound();
  const parsed = JSON.parse(readFileSync(path, "utf8")) as Readonly<{
    profiles?: readonly BenchmarkProfile[];
  }>;
  const profile = parsed.profiles?.find((candidate) => candidate.profile === "heavy");
  if (!profile || profile.calls.length !== 5 || profile.weeklyInputs.length !== 4) {
    throw new Error("AI Review benchmark preview artifact is unavailable or incomplete");
  }
  return profile;
}

function reviewView(profile: BenchmarkProfile, label: PreviewLabel): AiReviewDocumentView {
  const call = profile.calls.find((candidate) => candidate.label === label);
  if (!call) notFound();
  const weeklyIndex = LABELS.indexOf(label);
  const period = call.kind === "monthly"
    ? profile.monthlyInput.period
    : profile.weeklyInputs[weeklyIndex]?.period;
  if (!period) notFound();
  return Object.freeze({
    reviewTypeLabel: call.kind === "monthly" ? "Monthly AI Review" : "Weekly AI Review",
    periodLabel: call.kind === "monthly"
      ? formatMonth(period.startDate)
      : `${formatDate(period.startDate)} to ${formatDate(period.endDate)}`,
    reviewSummary: call.output.reviewSummary,
    whatImproved: call.output.whatImproved,
    whatHeldYouBack: call.output.whatHeldYouBack,
    focusFollowThrough: call.output.focusFollowThrough,
    nextPeriodFocuses: call.output.nextPeriodFocuses,
    incompleteRecord: call.output.incompleteRecord,
  });
}

export default async function AiReviewBenchmarkPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ review?: string | string[] }>;
}) {
  const identity = await requireTraderLinkPlatformPageIdentity();
  if (identity.mode === "platform_session" && !identity.discord?.guildOwner) {
    notFound();
  }
  const requested = (await searchParams).review;
  const value = Array.isArray(requested) ? requested[0] : requested;
  const label = value && isPreviewLabel(value) ? value : "heavy_weekly_1";
  const profile = heavyProfile();

  return (
    <DashboardPage>
      <Stack spacing={1.5}>
        <Button href="/ai-reviews" size="small" sx={{ alignSelf: "flex-start" }} variant="text">
          Back to AI Reviews
        </Button>
        <Alert severity="info">
          Local presentation preview using the accepted synthetic power-user benchmark. This does not create a saved review or call OpenAI.
        </Alert>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
          {LABELS.map((candidate, index) => (
            <Button
              href={`/ai-reviews/benchmark-preview?review=${candidate}`}
              key={candidate}
              size="small"
              variant={candidate === label ? "contained" : "outlined"}
            >
              {candidate === "heavy_monthly" ? "Monthly" : `Week ${index + 1}`}
            </Button>
          ))}
        </Stack>
      </Stack>
      <AiReviewDocument view={reviewView(profile, label)} />
    </DashboardPage>
  );
}
