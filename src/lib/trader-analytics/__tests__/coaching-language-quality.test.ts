import { describe, expect, it } from "vitest";
import {
  buildCoachingLanguageQualityAudit,
  buildProductTraderAnalyticsViewModel,
  buildSampleSavedTraderAnalyticsData,
} from "../index";

function coachTexts() {
  const sample = buildSampleSavedTraderAnalyticsData();
  const analytics = buildProductTraderAnalyticsViewModel({
    repository: sample.repository,
    userId: sample.userId,
    importRequests: sample.importRequests,
  });
  const coach = analytics.coachActionLoop;
  const polish = analytics.productPolish;
  const improvement = analytics.improvementIntelligence.dailyCoachReport;

  return [
    {
      sourceId: "coach-home:headline",
      text: coach.coachHome.headline,
      requiresEvidenceBasis: false,
    },
    {
      sourceId: "coach-home:subhead",
      text: coach.coachHome.subhead,
      requiresEvidenceBasis: true,
    },
    {
      sourceId: "coach-empty:message",
      text: `${coach.emptyState.message} ${coach.emptyState.nextAction}`,
      requiresEvidenceBasis: true,
    },
    {
      sourceId: "coach-session:avoid",
      text: coach.sessionPrepCard.avoidBehavior,
      requiresEvidenceBasis: true,
    },
    {
      sourceId: "coach-session:repeat",
      text: coach.sessionPrepCard.repeatBehavior,
      requiresEvidenceBasis: true,
    },
    {
      sourceId: "coach-archetype:summary",
      text: coach.archetypeProfile.summary,
      requiresEvidenceBasis: true,
    },
    {
      sourceId: "daily-coach:fix",
      text: improvement.fixNextSession,
      requiresEvidenceBasis: true,
    },
    {
      sourceId: "daily-coach:preserve",
      text: improvement.preserveNextSession,
      requiresEvidenceBasis: true,
    },
    ...coach.confidenceLanguage.items.map((item) => ({
      sourceId: item.sourceId,
      text: item.copy,
      requiresEvidenceBasis: true,
    })),
    ...coach.mistakeSeverityLadder.items.slice(0, 5).map((item) => ({
      sourceId: item.id,
      text: item.nextAction,
      requiresEvidenceBasis: true,
    })),
    ...polish.evidenceCards.slice(0, 8).flatMap((card) => [
      {
        sourceId: `${card.id}:confidence`,
        text: card.confidenceCopy,
        requiresEvidenceBasis: true,
      },
      {
        sourceId: `${card.id}:why`,
        text: card.whyItMatters,
        requiresEvidenceBasis: true,
      },
      {
        sourceId: `${card.id}:review`,
        text: card.reviewAction,
        requiresEvidenceBasis: false,
      },
    ]),
  ];
}

describe("coaching language quality", () => {
  it("keeps saved-trade coaching cautious, evidence-backed, and execution-only", () => {
    const audit = buildCoachingLanguageQualityAudit({ texts: coachTexts() });

    expect(audit.checkedTextCount).toBeGreaterThan(10);
    expect(audit.violations).toEqual([]);
    expect(audit.passed).toBe(true);
  });

  it("flags overclaiming and missing evidence basis", () => {
    const audit = buildCoachingLanguageQualityAudit({
      texts: [
        {
          sourceId: "bad-overclaim",
          text: "This rule definitely proves you would have made money.",
          requiresEvidenceBasis: true,
        },
        {
          sourceId: "bad-vague",
          text: "Fix this problem now.",
          requiresEvidenceBasis: true,
        },
      ],
    });

    expect(audit.passed).toBe(false);
    expect(audit.violations.map((violation) => violation.kind)).toEqual(
      expect.arrayContaining(["forbidden_phrase", "missing_evidence_basis"]),
    );
  });
});
