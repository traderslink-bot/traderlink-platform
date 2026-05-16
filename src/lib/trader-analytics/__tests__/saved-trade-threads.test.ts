import { describe, expect, it } from "vitest";
import { buildSavedTradeThreadReadModel } from "../server/saved-trade-threads";
import type { SavedTradeThreadDecisionReviewSnapshot } from "../server/saved-trade-threads";
import type {
  SavedExecutionTrade,
  SavedTraderAnalyticsReport,
} from "../product/types";

function trade(args: {
  id: string;
  isOpen?: boolean;
  pnl: number;
  sessionDate?: string;
  symbol?: string;
  timestamps?: [string, string];
}): SavedExecutionTrade {
  const timestamps = args.timestamps ?? [
    `${args.sessionDate ?? "2026-04-01"}T13:30:00.000Z`,
    `${args.sessionDate ?? "2026-04-01"}T13:45:00.000Z`,
  ];

  const executions = args.isOpen
    ? [
        {
          id: `${args.id}-entry`,
          timestamp: timestamps[0],
          side: "buy",
          shares: 100,
          price: 1,
        },
      ]
    : [
        {
          id: `${args.id}-entry`,
          timestamp: timestamps[0],
          side: "buy",
          shares: 100,
          price: 1,
        },
        {
          id: `${args.id}-exit`,
          timestamp: timestamps[1],
          side: "sell",
          shares: 100,
          price: 1 + args.pnl / 100,
        },
      ];

  return {
    id: args.id,
    userId: "demo-user",
    accountId: "demo-account",
    importedAt: "2026-05-09T12:00:00.000Z",
    sourceLabel: "test",
    sampleData: false,
    symbol: args.symbol ?? "CYCN",
    tradeDirection: "long",
    sessionDate: args.sessionDate ?? "2026-04-01",
    sessionBucket: "market_open",
    entryHourLabelEt: "09:00-09:59 ET",
    request: {
      executions,
      sessionContext: {
        entryTimeEt: timestamps[0],
      },
    },
    reviewStatus: "new",
    notes: [],
  } as unknown as SavedExecutionTrade;
}

function report(args: {
  rows: Array<{
    heldOvernight?: boolean;
    id: string;
    isOpen?: boolean;
    pnl: number;
    sessionDate?: string;
    symbol?: string;
  }>;
}): SavedTraderAnalyticsReport {
  return {
    id: "report-1",
    userId: "demo-user",
    accountId: "demo-account",
    generatedAt: "2026-05-09T12:00:00.000Z",
    reportPeriod: {
      startDate: "2026-04-01",
      endDate: "2026-04-30",
      label: "April 2026",
    },
    sourceTradeIds: args.rows.map((row) => row.id),
    sourceSummaries: [],
    report: {
      trades: args.rows.map((row, index) => ({
        tradeIndex: index + 1,
        requestIndex: index,
        symbol: row.symbol ?? "CYCN",
        tradeDirection: "long",
        sessionDate: row.sessionDate ?? "2026-04-01",
        sessionBucket: "market_open",
        entrySessionBucket: "market_open",
        entrySessionDateEt: row.sessionDate ?? "2026-04-01",
        entryTimeEt: `${row.sessionDate ?? "2026-04-01"}T13:30:00.000Z`,
        entryHourEt: 9,
        entryHourLabelEt: "09:00-09:59 ET",
        sessionExposure: [],
        heldSessionBuckets: row.heldOvernight
          ? ["market_open", "overnight"]
          : ["market_open"],
        heldHourBucketsEt: ["09:00-09:59 ET"],
        heldPremarketIntoOpen: false,
        heldOpenIntoMidday: false,
        heldMiddayIntoPostmarket: false,
        heldPostmarketIntoOvernight: Boolean(row.heldOvernight),
        heldOvernight: Boolean(row.heldOvernight),
        executionCount: 2,
        grossRealizedPnl: row.pnl,
        grossRealizedPnlPctOfEntryNotional: null,
        closedToFlat: !row.isOpen,
        isOpenPosition: Boolean(row.isOpen),
        maxPositionSize: 100,
        finalPositionSize: 0,
        addCountAfterInitialEntry: 0,
        reductionCount: 1,
        durationSeconds: 900,
        adversePriceAddCount: 0,
        primaryFocus: null,
        topRisk: null,
        topStrength: null,
        warnings: [],
      })),
    },
    reviewStatus: "new",
    notes: [],
    sampleData: false,
  } as unknown as SavedTraderAnalyticsReport;
}

function decisionReviewSnapshot(args: {
  category?: string;
  evidence?: string[];
  id?: string;
  savedTradeId: string;
  title?: string;
  tone?: string;
}): SavedTradeThreadDecisionReviewSnapshot {
  return {
    savedTradeId: args.savedTradeId,
    review: {
      candleQualityNotes: [
        "Trade-window candle basis status: basis is proven aligned.",
      ],
      insights: [
        {
          category: args.category ?? "market_context",
          evidence: args.evidence ?? [
            "Saved chart evidence for this test trade.",
          ],
          id: args.id ?? "entry_near_level",
          summary: "Entry was reviewed against saved chart evidence.",
          title: args.title ?? "Entry location had saved chart evidence",
          tone: args.tone ?? "risk",
        },
      ],
      marketContextSource: "levels_system_daily_4h",
      tradeWindowEvidenceSource: "levels_system_trade_window",
    },
  };
}

describe("saved trade thread read model", () => {
  it("groups same-symbol same-day round trips into a re-entry story", () => {
    const trades = [
      trade({ id: "cycn-1", pnl: 100 }),
      trade({
        id: "cycn-2",
        pnl: -40,
        timestamps: ["2026-04-01T14:30:00.000Z", "2026-04-01T14:50:00.000Z"],
      }),
    ];
    const model = buildSavedTradeThreadReadModel({
      report: report({
        rows: [
          { id: "cycn-1", pnl: 100 },
          { id: "cycn-2", pnl: -40 },
        ],
      }),
      trades,
    });

    expect(model.threadCount).toBe(1);
    expect(model.multiRoundTripThreadCount).toBe(1);
    expect(model.threads[0]?.lifecycleClassification).toBe(
      "closed_day_trade_reentry",
    );
    expect(model.threads[0]?.lifecycleLabel).toBe("Closed day-trade re-entry");
    expect(model.threads[0]?.storyKind).toBe("profit_giveback");
    expect(model.threads[0]?.storyLabel).toBe("Re-entry gave back profit");
    expect(model.threads[0]?.totalGrossRealizedPnl).toBe(60);
    expect(model.threads[0]?.peakCumulativePnl).toBe(100);
    expect(model.threads[0]?.givebackFromPeak).toBe(40);
    expect(model.threads[0]?.roundTrips).toHaveLength(2);
    expect(model.threads[0]?.href).toContain("/trades/ticker-story/");
    expect(decodeURIComponent(model.threads[0]?.href ?? "")).toContain(
      "CYCN:2026-04-01",
    );
    expect(model.threads[0]?.primaryReviewQuestion).toContain(
      "later re-entry give back profit",
    );
    expect(model.threads[0]?.reviewEvidence.map((item) => item.id)).toContain(
      "profit-giveback",
    );
    expect(model.threads[0]?.reviewEvidence.map((item) => item.id)).toContain(
      "reentry-time-gap",
    );
  });

  it("detects a same-day re-entry that is still open", () => {
    const trades = [
      trade({ id: "cycn-1", pnl: 80 }),
      trade({
        id: "cycn-2",
        isOpen: true,
        pnl: 0,
        timestamps: ["2026-04-01T15:15:00.000Z", "2026-04-01T15:15:00.000Z"],
      }),
    ];
    const model = buildSavedTradeThreadReadModel({
      report: report({
        rows: [
          { id: "cycn-1", pnl: 80 },
          { id: "cycn-2", isOpen: true, pnl: 0 },
        ],
      }),
      trades,
    });

    expect(model.threads[0]?.lifecycleClassification).toBe(
      "open_intraday_reentry",
    );
    expect(model.threads[0]?.storyKind).toBe("open_reentry");
    expect(model.threads[0]?.storyLabel).toBe("Re-entry is still open");
    expect(model.threads[0]?.openRoundTripCount).toBe(1);
    expect(model.threads[0]?.reviewPrompt).toContain(
      "Wait for the position to close",
    );
    expect(model.threads[0]?.fixFirstAction).toContain(
      "wait for a closing execution",
    );
    expect(model.threads[0]?.reviewEvidence.map((item) => item.id)).toContain(
      "open-reentry",
    );
  });

  it("does not call repeated losing attempts profit giveback", () => {
    const trades = [
      trade({ id: "cycn-1", pnl: -30 }),
      trade({
        id: "cycn-2",
        pnl: -40,
        timestamps: ["2026-04-01T14:30:00.000Z", "2026-04-01T14:50:00.000Z"],
      }),
    ];
    const model = buildSavedTradeThreadReadModel({
      report: report({
        rows: [
          { id: "cycn-1", pnl: -30 },
          { id: "cycn-2", pnl: -40 },
        ],
      }),
      trades,
    });
    const thread = model.threads[0];
    const evidenceIds = thread?.reviewEvidence.map((item) => item.id) ?? [];
    const copy = [
      thread?.storyLabel,
      thread?.storyDetail,
      thread?.reviewPrompt,
      thread?.primaryReviewQuestion,
      ...(thread?.reviewEvidence ?? []).flatMap((item) => [
        item.title,
        item.detail,
        item.reviewAction,
      ]),
    ].join(" ");

    expect(thread?.storyLabel).toBe("Repeated attempts lost money");
    expect(thread?.storyKind).toBe("repeated_losing_attempts");
    expect(thread?.peakCumulativePnl).toBe(0);
    expect(thread?.givebackFromPeak).toBe(0);
    expect(thread?.primaryReviewQuestion).toContain(
      "setup or volume had faded",
    );
    expect(evidenceIds).not.toContain("profit-giveback");
    expect(copy.toLowerCase()).not.toContain("gave back profit");
    expect(copy.toLowerCase()).not.toContain("earlier profit");
  });

  it("detects a re-entry that turns into overnight exposure", () => {
    const trades = [
      trade({ id: "cycn-1", pnl: 80 }),
      trade({
        id: "cycn-2",
        pnl: -20,
        timestamps: ["2026-04-01T19:30:00.000Z", "2026-04-02T14:00:00.000Z"],
      }),
    ];
    const model = buildSavedTradeThreadReadModel({
      report: report({
        rows: [
          { id: "cycn-1", pnl: 80 },
          { heldOvernight: true, id: "cycn-2", pnl: -20 },
        ],
      }),
      trades,
    });

    expect(model.threads[0]?.lifecycleClassification).toBe(
      "day_trade_turned_swing",
    );
    expect(model.threads[0]?.lifecycleLabel).toBe("Day trade turned swing");
    expect(model.threads[0]?.storyKind).toBe("swing_transition");
    expect(model.threads[0]?.storyLabel).toBe(
      "Re-entry changed the trade type",
    );
    expect(model.threads[0]?.roundTrips[1]?.crossedSessionDate).toBe(true);
    expect(model.threads[0]?.roundTrips[1]?.heldOvernight).toBe(true);
    expect(model.threads[0]?.primaryReviewQuestion).toContain(
      "different trade",
    );
    expect(model.threads[0]?.reviewEvidence.map((item) => item.id)).toContain(
      "swing-transition",
    );
  });

  it("treats same-date overnight-session trades as extended holds, not swings", () => {
    const trades = [
      trade({ id: "cycn-1", pnl: 80 }),
      trade({
        id: "cycn-2",
        pnl: -20,
        timestamps: ["2026-04-01T23:58:00.000Z", "2026-04-02T02:03:00.000Z"],
      }),
    ];
    const model = buildSavedTradeThreadReadModel({
      report: report({
        rows: [
          { id: "cycn-1", pnl: 80 },
          { heldOvernight: true, id: "cycn-2", pnl: -20 },
        ],
      }),
      trades,
    });
    const thread = model.threads[0];

    expect(thread?.roundTrips[1]?.crossedSessionDate).toBe(false);
    expect(thread?.roundTrips[1]?.heldOvernight).toBe(true);
    expect(thread?.lifecycleClassification).toBe("extended_same_day_hold");
    expect(thread?.lifecycleLabel).toBe("Extended same-day hold");
    expect(thread?.storyKind).toBe("extended_same_day_hold");
    expect(thread?.storyLabel).toBe("Extended same-day hold");
    expect(thread?.reviewEvidence.map((item) => item.id)).toContain(
      "extended-same-day-hold",
    );
    expect(thread?.reviewEvidence.map((item) => item.id)).not.toContain(
      "swing-transition",
    );
    const copy = [
      thread?.lifecycleDetail,
      thread?.storyDetail,
      thread?.reviewPrompt,
      thread?.primaryReviewQuestion,
      ...((thread?.reviewEvidence ?? []).flatMap((item) => [
        item.detail,
        item.reviewAction,
      ])),
    ]
      .join(" ")
      .toLowerCase();

    expect(copy).toContain("whether the hold was intended");
    expect(copy).toContain("planned");
    expect(copy).not.toContain("quick intraday idea");
    expect(copy).not.toContain("instead of ending");
  });

  it("keeps the same symbol on different dates as separate stories", () => {
    const trades = [
      trade({ id: "cycn-1", pnl: 25, sessionDate: "2026-04-01" }),
      trade({ id: "cycn-2", pnl: 50, sessionDate: "2026-04-02" }),
    ];
    const model = buildSavedTradeThreadReadModel({
      report: report({
        rows: [
          { id: "cycn-1", pnl: 25, sessionDate: "2026-04-01" },
          { id: "cycn-2", pnl: 50, sessionDate: "2026-04-02" },
        ],
      }),
      trades,
    });

    expect(model.threadCount).toBe(2);
    expect(model.multiRoundTripThreadCount).toBe(0);
    expect(model.threads.map((thread) => thread.sessionDate).sort()).toEqual([
      "2026-04-01",
      "2026-04-02",
    ]);
  });

  it("keeps user-facing story copy away from product-banned language", () => {
    const trades = [
      trade({ id: "cycn-1", pnl: 80 }),
      trade({
        id: "cycn-2",
        pnl: -20,
        timestamps: ["2026-04-01T19:30:00.000Z", "2026-04-02T14:00:00.000Z"],
      }),
    ];
    const model = buildSavedTradeThreadReadModel({
      report: report({
        rows: [
          { id: "cycn-1", pnl: 80 },
          { heldOvernight: true, id: "cycn-2", pnl: -20 },
        ],
      }),
      trades,
    });
    const copy = model.threads
      .flatMap((thread) => [
        thread.fixFirstAction,
        thread.lifecycleDetail,
        thread.lifecycleLabel,
        thread.primaryReviewQuestion,
        ...thread.reviewEvidence.flatMap((item) => [
          item.detail,
          item.reviewAction,
          item.title,
        ]),
        thread.reviewPrompt,
        thread.storyDetail,
        thread.storyLabel,
      ])
      .join(" ")
      .toLowerCase();

    expect(copy).not.toContain("financial advice");
    expect(copy).not.toContain("signals");
    expect(copy).not.toContain("trade calls");
    expect(copy).not.toContain("short-seller coaching");
  });

  it("attaches saved chart evidence without making unsupported volume claims", () => {
    const trades = [
      trade({ id: "cycn-1", pnl: 100 }),
      trade({
        id: "cycn-2",
        pnl: -40,
        timestamps: ["2026-04-01T14:30:00.000Z", "2026-04-01T14:50:00.000Z"],
      }),
    ];
    const model = buildSavedTradeThreadReadModel({
      decisionReviewSnapshots: [
        decisionReviewSnapshot({
          id: "entry_limited_clean_room_to_resistance",
          savedTradeId: "cycn-1",
          title: "Entry had limited clean room",
        }),
        decisionReviewSnapshot({
          category: "trade_window",
          id: "adds_increased_risk_into_weakness",
          savedTradeId: "cycn-2",
          title: "Trade-window movement was reviewed",
        }),
      ],
      report: report({
        rows: [
          { id: "cycn-1", pnl: 100 },
          { id: "cycn-2", pnl: -40 },
        ],
      }),
      trades,
    });
    const thread = model.threads[0];

    expect(
      thread?.roundTrips.every(
        (item) => item.chartContextStatus === "available",
      ),
    ).toBe(true);
    expect(thread?.reviewEvidence.map((item) => item.id)).toContain(
      "chart-context-available",
    );
    expect(thread?.reviewEvidence.map((item) => item.id)).toContain(
      "market-context-insights-available",
    );
    expect(thread?.reviewEvidence.map((item) => item.id)).toContain(
      "volume-context-to-compare",
    );
    expect(
      thread?.reviewEvidence
        .map((item) => `${item.title} ${item.detail} ${item.reviewAction}`)
        .join(" ")
        .toLowerCase(),
    ).not.toContain("volume faded");
    expect(
      thread?.reviewEvidence.find(
        (item) => item.id === "market-context-insights-available",
      )?.detail,
    ).toContain("Entry had limited room before overhead resistance");
    expect(thread?.marketContextFindingCount).toBe(2);
    expect(thread?.marketContextRiskCount).toBe(2);
    expect(thread?.marketContextStrengthCount).toBe(0);
    expect(thread?.addQualityFindingCount).toBe(1);
    expect(thread?.addQualityRiskCount).toBe(1);
    expect(thread?.addQualityStrengthCount).toBe(0);
    expect(thread?.levelFindingCount).toBe(1);
    expect(thread?.volumeFindingCount).toBe(0);
    expect(thread?.volumeRiskCount).toBe(0);
    expect(thread?.volumeStrengthCount).toBe(0);
    expect(model.marketContextFindingCount).toBe(2);
    expect(model.addQualityFindingCount).toBe(1);
    expect(model.addQualityRiskCount).toBe(1);
    expect(model.postExitFindingCount).toBe(0);
    expect(model.postExitRiskCount).toBe(0);
    expect(model.postExitStrengthCount).toBe(0);
    expect(model.levelFindingCount).toBe(1);
    expect(model.volumeFindingCount).toBe(0);
    expect(model.volumeRiskCount).toBe(0);
    expect(model.volumeStrengthCount).toBe(0);
    expect(model.threadWithAddQualityFindingCount).toBe(1);
    expect(model.threadWithMarketContextFindingCount).toBe(1);
    expect(model.threadWithVolumeFindingCount).toBe(0);
    expect(
      thread?.reviewEvidence
        .find((item) => item.id === "market-context-insights-available")
        ?.detail.toLowerCase(),
    ).not.toContain("clean room");
  });

  it("separates constructive add-quality findings from weak-add risks", () => {
    const trades = [
      trade({ id: "cycn-1", pnl: 100 }),
      trade({
        id: "cycn-2",
        pnl: 80,
        timestamps: ["2026-04-01T14:30:00.000Z", "2026-04-01T14:50:00.000Z"],
      }),
    ];
    const model = buildSavedTradeThreadReadModel({
      decisionReviewSnapshots: [
        decisionReviewSnapshot({
          category: "scaling",
          id: "adds_aligned_with_strength",
          savedTradeId: "cycn-2",
          title: "Adds aligned with strength",
          tone: "strength",
        }),
      ],
      report: report({
        rows: [
          { id: "cycn-1", pnl: 100 },
          { id: "cycn-2", pnl: 80 },
        ],
      }),
      trades,
    });
    const thread = model.threads[0];

    expect(thread?.addQualityFindingCount).toBe(1);
    expect(thread?.addQualityRiskCount).toBe(0);
    expect(thread?.addQualityStrengthCount).toBe(1);
    expect(thread?.marketContextStrengthCount).toBe(1);
    expect(model.addQualityStrengthCount).toBe(1);
    expect(thread?.marketContextFindings[0]?.label).toBe(
      "Adds followed strength",
    );
    expect(thread?.marketContextFindings[0]?.reviewAction).toContain("proof");
  });

  it("counts volume evidence only when saved chart evidence explicitly mentions volume", () => {
    const trades = [
      trade({ id: "cycn-1", pnl: 100 }),
      trade({
        id: "cycn-2",
        pnl: -40,
        timestamps: ["2026-04-01T14:30:00.000Z", "2026-04-01T14:50:00.000Z"],
      }),
    ];
    const model = buildSavedTradeThreadReadModel({
      decisionReviewSnapshots: [
        decisionReviewSnapshot({
          category: "scaling",
          evidence: [
            "Add happened after the recent move was extended.",
            "Volume evidence was attached for this saved chart evidence review.",
          ],
          id: "adds_after_trade_already_used_range",
          savedTradeId: "cycn-2",
          title: "Adds came after much of the move was already used",
          tone: "risk",
        }),
      ],
      report: report({
        rows: [
          { id: "cycn-1", pnl: 100 },
          { id: "cycn-2", pnl: -40 },
        ],
      }),
      trades,
    });
    const thread = model.threads[0];
    const volumeCard = thread?.reviewEvidence.find(
      (item) => item.id === "volume-context-reviewed",
    );

    expect(thread?.volumeFindingCount).toBe(1);
    expect(thread?.volumeRiskCount).toBe(1);
    expect(thread?.volumeStrengthCount).toBe(0);
    expect(thread?.volumeReviewPromptCount).toBe(0);
    expect(model.volumeFindingCount).toBe(1);
    expect(model.volumeRiskCount).toBe(1);
    expect(model.volumeStrengthCount).toBe(0);
    expect(model.volumeReviewPromptCount).toBe(0);
    expect(model.threadWithVolumeFindingCount).toBe(1);
    expect(model.threadWithVolumeRiskCount).toBe(1);
    expect(model.threadWithVolumeStrengthCount).toBe(0);
    expect(thread?.marketContextFindings[0]?.label).toBe(
      "Added after much of the move was used",
    );
    expect(volumeCard?.title).toBe("Volume comparison shows risk");
    expect(volumeCard?.detail).toBe("Added after much of the move was used");
    expect(volumeCard?.reviewAction).toContain("fresh proof");
    expect(volumeCard?.tone).toBe("danger");
    expect(
      thread?.marketContextFindings[0]?.detail.toLowerCase(),
    ).not.toContain("volume faded");
  });

  it("counts volume-backed strengths separately from volume risks", () => {
    const trades = [
      trade({ id: "cycn-1", pnl: 100 }),
      trade({
        id: "cycn-2",
        pnl: 80,
        timestamps: ["2026-04-01T14:30:00.000Z", "2026-04-01T14:50:00.000Z"],
      }),
    ];
    const model = buildSavedTradeThreadReadModel({
      decisionReviewSnapshots: [
        decisionReviewSnapshot({
          category: "scaling",
          evidence: [
            "Adds happened after constructive movement.",
            "Volume context supported the continuation review.",
          ],
          id: "adds_aligned_with_strength",
          savedTradeId: "cycn-2",
          title: "Adds aligned with strength",
          tone: "strength",
        }),
      ],
      report: report({
        rows: [
          { id: "cycn-1", pnl: 100 },
          { id: "cycn-2", pnl: 80 },
        ],
      }),
      trades,
    });
    const thread = model.threads[0];
    const volumeCard = thread?.reviewEvidence.find(
      (item) => item.id === "volume-context-reviewed",
    );

    expect(thread?.volumeFindingCount).toBe(1);
    expect(thread?.volumeRiskCount).toBe(0);
    expect(thread?.volumeStrengthCount).toBe(1);
    expect(model.volumeStrengthCount).toBe(1);
    expect(model.threadWithVolumeStrengthCount).toBe(1);
    expect(volumeCard?.title).toBe("Volume comparison shows strength");
    expect(volumeCard?.detail).toBe("Adds followed strength");
    expect(volumeCard?.reviewAction).toContain("proof");
    expect(volumeCard?.tone).toBe("success");
  });

  it("compares first-push and re-entry volume when both saved chart snapshots expose entry volume", () => {
    const trades = [
      trade({ id: "cycn-1", pnl: 100 }),
      trade({
        id: "cycn-2",
        pnl: -40,
        timestamps: ["2026-04-01T14:30:00.000Z", "2026-04-01T14:50:00.000Z"],
      }),
    ];
    const model = buildSavedTradeThreadReadModel({
      decisionReviewSnapshots: [
        decisionReviewSnapshot({
          evidence: ["entryVolume=100000"],
          id: "raw_volume_measurement",
          savedTradeId: "cycn-1",
          title: "Builder volume record",
        }),
        decisionReviewSnapshot({
          evidence: ["entryVolume=45000"],
          id: "raw_volume_measurement",
          savedTradeId: "cycn-2",
          title: "Builder volume record",
        }),
      ],
      report: report({
        rows: [
          { id: "cycn-1", pnl: 100 },
          { id: "cycn-2", pnl: -40 },
        ],
      }),
      trades,
    });
    const thread = model.threads[0];
    const volumeFinding = thread?.marketContextFindings.find(
      (finding) => finding.sourceInsightId === "reentry_volume_faded",
    );
    const volumeCard = thread?.reviewEvidence.find(
      (item) => item.id === "volume-context-reviewed",
    );

    expect(volumeFinding?.label).toBe("Re-entry had lower volume");
    expect(volumeFinding?.canDrivePrimaryConclusion).toBe(true);
    expect(volumeFinding?.opportunityType).toBe("risk_to_reduce");
    expect(volumeFinding?.evidence).toContain(
      "reentryVolumeVsFirstEntryPct=45",
    );
    expect(thread?.volumeFindingCount).toBe(1);
    expect(thread?.volumeRiskCount).toBe(1);
    expect(model.volumeRiskCount).toBe(1);
    expect(thread?.priorityMarketContextFindings[0]?.sourceInsightId).toBe(
      "reentry_volume_faded",
    );
    expect(volumeCard?.detail).toBe("Re-entry had lower volume");
    expect(volumeCard?.reviewAction).toContain("compare volume");
  });

  it("surfaces strong re-entry volume as a repeatable strength when outcome is constructive", () => {
    const trades = [
      trade({ id: "cycn-1", pnl: 100 }),
      trade({
        id: "cycn-2",
        pnl: 80,
        timestamps: ["2026-04-01T14:30:00.000Z", "2026-04-01T14:50:00.000Z"],
      }),
    ];
    const model = buildSavedTradeThreadReadModel({
      decisionReviewSnapshots: [
        decisionReviewSnapshot({
          evidence: ["entryVolume=100000"],
          id: "raw_volume_measurement",
          savedTradeId: "cycn-1",
          title: "Builder volume record",
        }),
        decisionReviewSnapshot({
          evidence: ["entryVolume=125000"],
          id: "raw_volume_measurement",
          savedTradeId: "cycn-2",
          title: "Builder volume record",
        }),
      ],
      report: report({
        rows: [
          { id: "cycn-1", pnl: 100 },
          { id: "cycn-2", pnl: 80 },
        ],
      }),
      trades,
    });
    const thread = model.threads[0];
    const volumeFinding = thread?.marketContextFindings.find(
      (finding) => finding.sourceInsightId === "reentry_volume_confirmed",
    );

    expect(volumeFinding?.label).toBe("Re-entry kept strong volume");
    expect(volumeFinding?.opportunityType).toBe("strength_to_repeat");
    expect(thread?.volumeFindingCount).toBe(1);
    expect(thread?.volumeStrengthCount).toBe(1);
    expect(model.volumeStrengthCount).toBe(1);
    expect(thread?.priorityMarketContextFindings[0]?.sourceInsightId).toBe(
      "reentry_volume_confirmed",
    );
  });

  it("surfaces certified post-exit chart findings as product-ready evidence", () => {
    const trades = [
      trade({ id: "cycn-1", pnl: 100 }),
      trade({
        id: "cycn-2",
        pnl: -40,
        timestamps: ["2026-04-01T14:30:00.000Z", "2026-04-01T14:50:00.000Z"],
      }),
    ];
    const model = buildSavedTradeThreadReadModel({
      decisionReviewSnapshots: [
        decisionReviewSnapshot({
          category: "exit",
          id: "exit_left_continuation",
          savedTradeId: "cycn-2",
          title: "Exit came before more continuation",
          tone: "risk",
        }),
      ],
      report: report({
        rows: [
          { id: "cycn-1", pnl: 100 },
          { id: "cycn-2", pnl: -40 },
        ],
      }),
      trades,
    });
    const thread = model.threads[0];

    expect(thread?.marketContextFindings[0]?.label).toBe(
      "Exit came before more continuation",
    );
    expect(thread?.marketContextFindings[0]?.canDrivePrimaryConclusion).toBe(
      true,
    );
    expect(thread?.postExitFindingCount).toBe(1);
    expect(thread?.postExitRiskCount).toBe(1);
    expect(thread?.postExitStrengthCount).toBe(0);
    expect(thread?.postExitReviewPromptCount).toBe(0);
    expect(model.postExitFindingCount).toBe(1);
    expect(model.postExitRiskCount).toBe(1);
    expect(model.postExitStrengthCount).toBe(0);
    expect(model.threadWithPostExitFindingCount).toBe(1);
    expect(model.threadWithPostExitRiskCount).toBe(1);
    expect(model.threadWithPostExitStrengthCount).toBe(0);
    expect(thread?.reviewEvidence.map((item) => item.id)).toContain(
      "post-exit-context-finding",
    );
    expect(
      thread?.reviewEvidence.find(
        (item) => item.id === "post-exit-context-finding",
      )?.reviewAction,
    ).toContain("runner rule");
  });

  it("surfaces post-exit chart prompts without counting them as risk or strength", () => {
    const trades = [
      trade({ id: "cycn-1", pnl: 100 }),
      trade({
        id: "cycn-2",
        pnl: -40,
        timestamps: ["2026-04-01T14:30:00.000Z", "2026-04-01T14:50:00.000Z"],
      }),
    ];
    const model = buildSavedTradeThreadReadModel({
      decisionReviewSnapshots: [
        decisionReviewSnapshot({
          category: "exit",
          id: "exit_needs_post_exit_context",
          savedTradeId: "cycn-2",
          title: "Exit needs after-exit chart check",
          tone: "neutral",
        }),
      ],
      report: report({
        rows: [
          { id: "cycn-1", pnl: 100 },
          { id: "cycn-2", pnl: -40 },
        ],
      }),
      trades,
    });
    const thread = model.threads[0];
    const postExitCard = thread?.reviewEvidence.find(
      (item) => item.id === "post-exit-context-finding",
    );

    expect(thread?.postExitFindingCount).toBe(1);
    expect(thread?.postExitRiskCount).toBe(0);
    expect(thread?.postExitStrengthCount).toBe(0);
    expect(thread?.postExitReviewPromptCount).toBe(1);
    expect(model.postExitReviewPromptCount).toBe(1);
    expect(postExitCard?.title).toBe("After-exit chart check is needed");
    expect(postExitCard?.detail).toBe("Exit needs after-exit chart check");
    expect(postExitCard?.reviewAction.toLowerCase()).toContain(
      "after-exit chart evidence",
    );
  });

  it("counts post-exit strengths separately from continuation risks", () => {
    const trades = [
      trade({ id: "cycn-1", pnl: 100 }),
      trade({
        id: "cycn-2",
        pnl: 80,
        timestamps: ["2026-04-01T14:30:00.000Z", "2026-04-01T14:50:00.000Z"],
      }),
    ];
    const model = buildSavedTradeThreadReadModel({
      decisionReviewSnapshots: [
        decisionReviewSnapshot({
          category: "exit",
          id: "exit_captured_trade_well",
          savedTradeId: "cycn-2",
          title: "Exit captured the trade well",
          tone: "strength",
        }),
      ],
      report: report({
        rows: [
          { id: "cycn-1", pnl: 100 },
          { id: "cycn-2", pnl: 80 },
        ],
      }),
      trades,
    });
    const thread = model.threads[0];

    expect(thread?.postExitFindingCount).toBe(1);
    expect(thread?.postExitRiskCount).toBe(0);
    expect(thread?.postExitStrengthCount).toBe(1);
    expect(model.postExitStrengthCount).toBe(1);
    expect(model.threadWithPostExitStrengthCount).toBe(1);
    expect(
      thread?.reviewEvidence.find(
        (item) => item.id === "post-exit-context-finding",
      )?.title,
    ).toBe("Exit capture was measured");
  });

  it("surfaces protected-profit fade findings as repeatable post-exit strengths", () => {
    const trades = [
      trade({ id: "cycn-1", pnl: 100 }),
      trade({
        id: "cycn-2",
        pnl: 80,
        timestamps: ["2026-04-01T14:30:00.000Z", "2026-04-01T14:50:00.000Z"],
      }),
    ];
    const model = buildSavedTradeThreadReadModel({
      decisionReviewSnapshots: [
        decisionReviewSnapshot({
          category: "exit",
          evidence: [
            "realizedCapturePercentOfTradeMfe=74.0%",
            "postExitCandleCount=4",
            "netMovePctAtEndOfPostExitWindow=-2.5%",
          ],
          id: "protected_profit_before_fade",
          savedTradeId: "cycn-2",
          title: "Protected profit before the fade",
          tone: "strength",
        }),
      ],
      report: report({
        rows: [
          { id: "cycn-1", pnl: 100 },
          { id: "cycn-2", pnl: 80 },
        ],
      }),
      trades,
    });
    const thread = model.threads[0];
    const postExitCard = thread?.reviewEvidence.find(
      (item) => item.id === "post-exit-context-finding",
    );

    expect(thread?.marketContextFindings[0]?.label).toBe(
      "Protected profit before the fade",
    );
    expect(thread?.postExitFindingCount).toBe(1);
    expect(thread?.postExitRiskCount).toBe(0);
    expect(thread?.postExitStrengthCount).toBe(1);
    expect(thread?.protectedProfitBeforeFadeFindingCount).toBe(1);
    expect(model.postExitStrengthCount).toBe(1);
    expect(model.protectedProfitBeforeFadeFindingCount).toBe(1);
    expect(model.threadWithProtectedProfitBeforeFadeFindingCount).toBe(1);
    expect(thread?.priorityMarketContextFindings[0]?.sourceInsightId).toBe(
      "protected_profit_before_fade",
    );
    expect(postExitCard?.title).toBe(
      "Profit was protected before a later fade",
    );
    expect(postExitCard?.reviewAction).toContain("exit cue");
  });

  it("surfaces balanced full-trade management as a repeatable chart-backed strength", () => {
    const trades = [
      trade({ id: "cycn-1", pnl: 100 }),
      trade({
        id: "cycn-2",
        pnl: 80,
        timestamps: ["2026-04-01T14:30:00.000Z", "2026-04-01T14:50:00.000Z"],
      }),
    ];
    const model = buildSavedTradeThreadReadModel({
      decisionReviewSnapshots: [
        decisionReviewSnapshot({
          category: "management",
          evidence: [
            "addCountAfterInitialEntry=1",
            "totalPositionDecreaseCount=1",
            "postExitCandleCount=4",
          ],
          id: "balanced_management_with_constructive_exit",
          savedTradeId: "cycn-2",
          title: "Managed the full trade constructively",
          tone: "strength",
        }),
      ],
      report: report({
        rows: [
          { id: "cycn-1", pnl: 100 },
          { id: "cycn-2", pnl: 80 },
        ],
      }),
      trades,
    });
    const thread = model.threads[0];
    const postExitCard = thread?.reviewEvidence.find(
      (item) => item.id === "post-exit-context-finding",
    );
    const copy = [
      thread?.marketContextFindings[0]?.label,
      thread?.marketContextFindings[0]?.detail,
      thread?.marketContextFindings[0]?.reviewAction,
    ]
      .join(" ")
      .toLowerCase();

    expect(thread?.marketContextFindings[0]?.label).toBe(
      "Managed the full trade constructively",
    );
    expect(thread?.marketContextFindings[0]?.evidenceChannel).toBe("combined");
    expect(thread?.marketContextStrengthCount).toBe(1);
    expect(thread?.postExitFindingCount).toBe(1);
    expect(thread?.postExitStrengthCount).toBe(1);
    expect(model.postExitStrengthCount).toBe(1);
    expect(thread?.priorityMarketContextFindings[0]?.sourceInsightId).toBe(
      "balanced_management_with_constructive_exit",
    );
    expect(postExitCard?.title).toBe("Full-trade management was constructive");
    expect(postExitCard?.reviewAction).toContain("management sequence");
    expect(copy).not.toContain("perfect");
    expect(copy).not.toContain("top tick");
    expect(copy).not.toContain("signal");
  });

  it("surfaces add-into-strength constructive exits as repeatable chart-backed strengths", () => {
    const trades = [
      trade({ id: "cycn-1", pnl: 100 }),
      trade({
        id: "cycn-2",
        pnl: 80,
        timestamps: ["2026-04-01T14:30:00.000Z", "2026-04-01T14:50:00.000Z"],
      }),
    ];
    const model = buildSavedTradeThreadReadModel({
      decisionReviewSnapshots: [
        decisionReviewSnapshot({
          category: "exit",
          evidence: [
            "addCountAfterInitialEntry=1",
            "averageAddPriceVsPreviousAverageEntryPct=4.0%",
            "postExitCandleCount=4",
          ],
          id: "add_into_strength_with_constructive_final_exit",
          savedTradeId: "cycn-2",
          title: "Added into strength and exited constructively",
          tone: "strength",
        }),
      ],
      report: report({
        rows: [
          { id: "cycn-1", pnl: 100 },
          { id: "cycn-2", pnl: 80 },
        ],
      }),
      trades,
    });
    const thread = model.threads[0];
    const postExitCard = thread?.reviewEvidence.find(
      (item) => item.id === "post-exit-context-finding",
    );
    const copy = [
      thread?.marketContextFindings[0]?.label,
      thread?.marketContextFindings[0]?.detail,
      thread?.marketContextFindings[0]?.reviewAction,
    ]
      .join(" ")
      .toLowerCase();

    expect(thread?.marketContextFindings[0]?.label).toBe(
      "Added into strength and exited constructively",
    );
    expect(thread?.marketContextFindings[0]?.evidenceChannel).toBe("combined");
    expect(thread?.marketContextStrengthCount).toBe(1);
    expect(thread?.postExitStrengthCount).toBe(1);
    expect(postExitCard?.title).toBe(
      "Strength add and final exit were constructive",
    );
    expect(postExitCard?.reviewAction.toLowerCase()).toContain(
      "confirmed strength",
    );
    expect(copy).not.toContain("buy signal");
    expect(copy).not.toContain("perfect");
    expect(copy).not.toContain("top tick");
  });

  it("surfaces support and resistance exit-quality findings as post-exit evidence", () => {
    const trades = [
      trade({ id: "cycn-1", pnl: 100 }),
      trade({
        id: "cycn-2",
        pnl: 80,
        timestamps: ["2026-04-01T14:30:00.000Z", "2026-04-01T14:50:00.000Z"],
      }),
    ];
    const model = buildSavedTradeThreadReadModel({
      decisionReviewSnapshots: [
        decisionReviewSnapshot({
          category: "exit",
          id: "exit_into_resistance_with_reversal_after_exit",
          savedTradeId: "cycn-2",
          title: "Exit protected profit near resistance",
          tone: "strength",
        }),
      ],
      report: report({
        rows: [
          { id: "cycn-1", pnl: 100 },
          { id: "cycn-2", pnl: 80 },
        ],
      }),
      trades,
    });
    const thread = model.threads[0];
    const postExitCard = thread?.reviewEvidence.find(
      (item) => item.id === "post-exit-context-finding",
    );

    expect(thread?.postExitFindingCount).toBe(1);
    expect(thread?.postExitStrengthCount).toBe(1);
    expect(thread?.exitLevelFindingCount).toBe(1);
    expect(thread?.exitLevelRiskCount).toBe(0);
    expect(thread?.exitLevelStrengthCount).toBe(1);
    expect(thread?.exitLevelReviewPromptCount).toBe(0);
    expect(thread?.levelFindingCount).toBe(1);
    expect(model.exitLevelFindingCount).toBe(1);
    expect(model.exitLevelStrengthCount).toBe(1);
    expect(model.threadWithExitLevelFindingCount).toBe(1);
    expect(model.threadWithExitLevelStrengthCount).toBe(1);
    expect(thread?.priorityMarketContextFindings[0]?.sourceInsightId).toBe(
      "exit_into_resistance_with_reversal_after_exit",
    );
    expect(postExitCard?.title).toBe("Exit protected profit near resistance");
    expect(postExitCard?.detail).toBe("Exit protected profit near resistance");
    expect(postExitCard?.reviewAction).toContain("resistance");
  });

  it("surfaces profit-protection findings as post-exit evidence", () => {
    const trades = [
      trade({ id: "cycn-1", pnl: 100 }),
      trade({
        id: "cycn-2",
        pnl: -20,
        timestamps: ["2026-04-01T14:30:00.000Z", "2026-04-01T14:50:00.000Z"],
      }),
    ];
    const model = buildSavedTradeThreadReadModel({
      decisionReviewSnapshots: [
        decisionReviewSnapshot({
          category: "exit",
          id: "profit_protection_failed",
          savedTradeId: "cycn-2",
          title: "Open profit was not protected",
          tone: "risk",
        }),
      ],
      report: report({
        rows: [
          { id: "cycn-1", pnl: 100 },
          { id: "cycn-2", pnl: -20 },
        ],
      }),
      trades,
    });
    const thread = model.threads[0];
    const postExitCard = thread?.reviewEvidence.find(
      (item) => item.id === "post-exit-context-finding",
    );

    expect(thread?.postExitFindingCount).toBe(1);
    expect(thread?.postExitRiskCount).toBe(1);
    expect(postExitCard?.title).toBe("Profit protection was measured");
    expect(postExitCard?.detail).toBe("Open profit was not protected");
    expect(postExitCard?.reviewAction).toContain("profit");
  });

  it("keeps during-trade measurements as review prompts, not risk or strength counts", () => {
    const trades = [trade({ id: "cycn-1", pnl: 25 })];
    const model = buildSavedTradeThreadReadModel({
      decisionReviewSnapshots: [
        decisionReviewSnapshot({
          category: "trade_window",
          id: "trade_window_excursion_measured",
          savedTradeId: "cycn-1",
          title: "Trade-window movement was measured",
          tone: "neutral",
        }),
      ],
      report: report({
        rows: [{ id: "cycn-1", pnl: 25 }],
      }),
      trades,
    });
    const thread = model.threads[0];

    expect(thread?.marketContextFindingCount).toBe(1);
    expect(thread?.marketContextRiskCount).toBe(0);
    expect(thread?.marketContextStrengthCount).toBe(0);
    expect(thread?.marketContextReviewPromptCount).toBe(1);
    expect(model.marketContextReviewPromptCount).toBe(1);
    expect(thread?.marketContextFindings[0]?.label).toBe(
      "During-trade movement was measured",
    );
    expect(thread?.marketContextFindings[0]?.canDrivePrimaryConclusion).toBe(
      false,
    );
  });

  it("does not expose short-specific chart findings in normal thread evidence", () => {
    const trades = [trade({ id: "cycn-1", pnl: -20 })];
    const model = buildSavedTradeThreadReadModel({
      decisionReviewSnapshots: [
        decisionReviewSnapshot({
          id: "short_entry_near_daily_4h_support",
          savedTradeId: "cycn-1",
          title: "Short entry was close to support",
          tone: "risk",
        }),
      ],
      report: report({
        rows: [{ id: "cycn-1", pnl: -20 }],
      }),
      trades,
    });
    const thread = model.threads[0];
    const evidenceCopy = (thread?.reviewEvidence ?? [])
      .flatMap((item) => [item.title, item.detail, item.reviewAction])
      .join(" ")
      .toLowerCase();

    expect(thread?.marketContextFindingCount).toBe(0);
    expect(model.marketContextFindingCount).toBe(0);
    expect(evidenceCopy).not.toContain("short entry");
    expect(evidenceCopy).not.toContain("short-seller");
  });

  it("builds a green-to-red session story from saved trade order", () => {
    const trades = [
      trade({
        id: "avex-1",
        pnl: 120,
        symbol: "AVEX",
        timestamps: ["2026-04-03T13:30:00.000Z", "2026-04-03T13:45:00.000Z"],
      }),
      trade({
        id: "bbgi-1",
        pnl: -180,
        symbol: "BBGI",
        timestamps: ["2026-04-03T14:15:00.000Z", "2026-04-03T14:35:00.000Z"],
      }),
    ];
    const model = buildSavedTradeThreadReadModel({
      report: report({
        rows: [
          { id: "avex-1", pnl: 120, symbol: "AVEX" },
          { id: "bbgi-1", pnl: -180, symbol: "BBGI" },
        ],
      }),
      trades,
    });
    const story = model.sessionStories[0];

    expect(model.sessionStoryCount).toBe(1);
    expect(model.greenToRedSessionCount).toBe(1);
    expect(story?.storyKind).toBe("green_to_red_session");
    expect(story?.storyLabel).toBe("Green-to-red session");
    expect(story?.peakCumulativePnl).toBe(120);
    expect(story?.totalGrossRealizedPnl).toBe(-60);
    expect(story?.givebackFromPeak).toBe(180);
    expect(story?.reviewEvidence.map((item) => item.id)).toContain(
      "session-green-to-red",
    );
    expect(story?.daySessionHref).toBe("/trades/day-session/2026-04-01");
    expect(story?.tickerSummaries.map((item) => item.symbol)).toEqual([
      "BBGI",
      "AVEX",
    ]);
    expect(story?.tickerSummaries[0]?.href).toContain(
      "/trades/ticker-story/",
    );
    expect(story?.tickerSummaries[0]?.roundTripCount).toBe(1);
    expect(story?.fixFirstAction).toContain("changed the day");
  });

  it("flags many same-symbol attempts without calling them revenge trading", () => {
    const trades = [
      trade({ id: "cycn-1", pnl: -20 }),
      trade({
        id: "cycn-2",
        pnl: -30,
        timestamps: ["2026-04-01T14:30:00.000Z", "2026-04-01T14:45:00.000Z"],
      }),
      trade({
        id: "cycn-3",
        pnl: -40,
        timestamps: ["2026-04-01T15:15:00.000Z", "2026-04-01T15:30:00.000Z"],
      }),
    ];
    const model = buildSavedTradeThreadReadModel({
      report: report({
        rows: [
          { id: "cycn-1", pnl: -20 },
          { id: "cycn-2", pnl: -30 },
          { id: "cycn-3", pnl: -40 },
        ],
      }),
      trades,
    });
    const story = model.sessionStories[0];
    const copy = [
      story?.storyLabel,
      story?.storyDetail,
      story?.reviewPrompt,
      story?.fixFirstAction,
      ...(story?.reviewEvidence ?? []).flatMap((item) => [
        item.title,
        item.detail,
        item.reviewAction,
      ]),
    ].join(" ");

    expect(model.sameSymbolManyAttemptsSessionCount).toBe(1);
    expect(story?.storyKind).toBe("same_symbol_many_attempts");
    expect(story?.storyLabel).toBe("Many attempts on one ticker");
    expect(story?.reviewEvidence.map((item) => item.id)).toContain(
      "session-same-symbol-many-attempts",
    );
    expect(story?.tickerSummaries).toHaveLength(1);
    expect(story?.tickerSummaries[0]).toMatchObject({
      symbol: "CYCN",
      roundTripCount: 3,
      closedRoundTripCount: 3,
      openRoundTripCount: 0,
      totalGrossRealizedPnl: -90,
    });
    expect(copy.toLowerCase()).not.toContain("revenge");
  });

  it("flags high trade-count sessions with explicit counts", () => {
    const rows = Array.from({ length: 8 }, (_, index) => ({
      id: `ticker-${index + 1}`,
      pnl: 5,
      symbol: `T${index + 1}`,
    }));
    const trades = rows.map((row, index) =>
      trade({
        id: row.id,
        pnl: row.pnl,
        symbol: row.symbol,
        timestamps: [
          `2026-04-04T${String(13 + Math.floor(index / 2)).padStart(2, "0")}:${
            index % 2 === 0 ? "10" : "35"
          }:00.000Z`,
          `2026-04-04T${String(13 + Math.floor(index / 2)).padStart(2, "0")}:${
            index % 2 === 0 ? "20" : "45"
          }:00.000Z`,
        ],
      }),
    );
    const model = buildSavedTradeThreadReadModel({
      report: report({ rows }),
      trades,
    });
    const story = model.sessionStories[0];

    expect(model.highTradeCountSessionCount).toBe(1);
    expect(story?.storyKind).toBe("session_high_trade_count");
    expect(story?.tradeCount).toBe(8);
    expect(story?.symbolCount).toBe(8);
    expect(story?.storyDetail).toContain("8 round trips across 8 symbols");
    expect(story?.reviewEvidence.map((item) => item.id)).toContain(
      "session-high-trade-count",
    );
  });

  it("keeps open or overnight exposure as a separate session review story", () => {
    const trades = [
      trade({
        id: "cycn-1",
        pnl: 40,
        timestamps: ["2026-04-05T19:30:00.000Z", "2026-04-06T14:00:00.000Z"],
      }),
    ];
    const model = buildSavedTradeThreadReadModel({
      report: report({
        rows: [{ heldOvernight: true, id: "cycn-1", pnl: 40 }],
      }),
      trades,
    });
    const story = model.sessionStories[0];

    expect(story?.storyKind).toBe("open_or_swing_review");
    expect(story?.storyLabel).toBe("Open or swing exposure to review");
    expect(story?.openOrSwingThreadCount).toBe(1);
    expect(story?.reviewEvidence.map((item) => item.id)).toContain(
      "session-open-or-swing",
    );
    expect(story?.reviewPrompt).toContain("hold decision");
  });

  it("builds a strength-to-repeat session story from certified chart strengths", () => {
    const trades = [
      trade({
        id: "avex-1",
        pnl: 140,
        sessionDate: "2026-04-07",
        symbol: "AVEX",
        timestamps: ["2026-04-07T13:30:00.000Z", "2026-04-07T13:50:00.000Z"],
      }),
    ];
    const model = buildSavedTradeThreadReadModel({
      decisionReviewSnapshots: [
        decisionReviewSnapshot({
          category: "exit",
          evidence: [
            "realizedCapturePercentOfTradeMfe=74.0%",
            "postExitCandleCount=4",
          ],
          id: "protected_profit_before_fade",
          savedTradeId: "avex-1",
          title: "Protected profit before the fade",
          tone: "strength",
        }),
      ],
      report: report({
        rows: [
          { id: "avex-1", pnl: 140, sessionDate: "2026-04-07", symbol: "AVEX" },
        ],
      }),
      trades,
    });
    const story = model.sessionStories[0];
    const evidenceIds = story?.reviewEvidence.map((item) => item.id) ?? [];
    const copy = [
      story?.storyLabel,
      story?.storyDetail,
      story?.reviewPrompt,
      story?.fixFirstAction,
      ...(story?.reviewEvidence ?? []).flatMap((item) => [
        item.title,
        item.detail,
        item.reviewAction,
      ]),
    ].join(" ");

    expect(model.strengthsToRepeatSessionCount).toBe(1);
    expect(story?.storyKind).toBe("strengths_to_repeat_session");
    expect(story?.storyLabel).toBe("Strengths to repeat session");
    expect(story?.marketContextStrengthCount).toBe(1);
    expect(story?.protectedProfitBeforeFadeFindingCount).toBe(1);
    expect(evidenceIds).toContain("session-strengths-to-repeat");
    expect(evidenceIds).toContain("session-protected-before-fade");
    expect(copy).toContain("repeatable");
    expect(copy.toLowerCase()).not.toContain("perfect");
    expect(copy.toLowerCase()).not.toContain("signal");
  });
});
