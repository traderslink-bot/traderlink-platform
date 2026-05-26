import { expect, test, type Page } from "@playwright/test";
import {
  buildCsvDryRunRouteSmokeContract,
  buildCsvDryRunVisualRegressionContract,
} from "../../src/lib/trader-analytics";

async function openImportDryRunDetails(page: Page) {
  for (const { label, testId } of [
    {
      label: "Show import review details",
      testId: "import-dry-run-review-details",
    },
    {
      label: "Show advanced P/L and cost details",
      testId: "import-dry-run-advanced-cost-details",
    },
    {
      label: "Show technical import diagnostics",
      testId: "import-dry-run-technical-diagnostics",
    },
    {
      label: "Show technical import setup details",
      testId: "import-dry-run-advanced-mapping-details",
    },
    {
      label: "Show privacy, decision, and QA notes",
      testId: "import-dry-run-operator-details",
    },
  ]) {
    const details = page.getByTestId(testId);

    if ((await details.count()) === 0) {
      continue;
    }

    const trigger = details.getByText(label, { exact: true });
    const isOpen = (await details.getAttribute("open")) !== null;

    if (!isOpen && (await trigger.isVisible())) {
      await trigger.click();
    }
  }
}

async function openDisclosure(page: Page, testId: string, label: string) {
  const details = page.getByTestId(testId);

  if ((await details.count()) === 0) {
    return;
  }

  const trigger = details.getByText(label, { exact: true });
  const isOpen = (await details.getAttribute("open")) !== null;

  if (!isOpen && (await trigger.isVisible())) {
    await trigger.click();
  }
}

async function selectBroker(page: Page, broker: string) {
  await openDisclosure(
    page,
    "import-dry-run-advanced-upload-settings",
    "Show advanced import settings",
  );
  await page.getByTestId("broker-select").selectOption(broker);
}

async function selectSample(page: Page, sampleId: string) {
  await openDisclosure(
    page,
    "import-dry-run-admin-sample-details",
    "Show demo/admin sample files",
  );
  await page.getByTestId("sample-select").selectOption(sampleId);
}

async function prepareDecisionReviewDryRun(page: Page) {
  await page.goto("/import-dry-run");
  await page.waitForLoadState("networkidle");
  await selectSample(page, "preset:ibkr");
  await openImportDryRunDetails(page);
}

test.describe("CSV dry-run import route", () => {
  test("renders the required product panels without unsafe surfaces", async ({
    page,
  }) => {
    const contract = buildCsvDryRunRouteSmokeContract();

    await page.goto(contract.routePath);
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("heading", { exact: true, name: "Import Trades" }),
    ).toBeVisible();
    await expect(page.getByTestId("import-workflow-strip")).toContainText(
      "Upload CSV",
    );
    await expect(page.getByTestId("import-workflow-step-upload")).toContainText(
      "Current",
    );
    await expect(page.getByText("Rows To Fix", { exact: true })).toBeVisible();
    await expect(page.getByText("Import Check", { exact: true })).toBeVisible();
    await expect(
      page.getByText("Mapping Confidence", { exact: true }).first(),
    ).toBeHidden();
    await expect(
      page.getByText("Copy Audit", { exact: true }).first(),
    ).toBeHidden();
    await expect(
      page.getByRole("heading", {
        exact: true,
        name: "Import Session Summary",
      }),
    ).toBeHidden();
    await selectSample(page, "preset:ibkr");
    await openImportDryRunDetails(page);
    await expect(
      page.getByText("Mapping Confidence", { exact: true }),
    ).toBeVisible();

    for (const label of contract.requiredPanelLabels) {
      await expect(
        page.getByRole("heading", { exact: true, name: label }),
        `Missing required panel heading: ${label}`,
      ).toBeVisible();
    }

    await expect(page.getByTestId("prototype-analysis-panel")).toContainText(
      "production write: false",
    );
    await expect(page.getByTestId("execution-readiness-summary")).toContainText(
      "Execution ready",
    );
    await expect(page.getByTestId("execution-readiness-summary")).toContainText(
      "write safety: dry-run only",
    );
    await expect(page.getByTestId("execution-readiness-summary")).toContainText(
      "gross-only",
    );
    await expect(page.getByText("market_open")).toBeVisible();
    await expect(page.getByText("09:00-09:59 ET")).toBeVisible();
    await expect(page.getByTestId("prototype-analysis-panel")).toContainText(
      "daily/4h",
    );
    await expect(page.getByTestId("prototype-analysis-state")).toBeVisible();
    await expect(page.getByTestId("decision-review-status")).toContainText(
      "Run daily/4h chart data review",
    );
    await expect(
      page.getByTestId("decision-review-request-button"),
    ).toBeEnabled();
    await expect(
      page.getByTestId("cost-visibility-scoring-policy"),
    ).toContainText("gross-only");

    const bodyText = await page.locator("body").innerText();
    for (const phrase of contract.bannedSurfacePhrases) {
      expect(
        bodyText,
        `Banned product phrase surfaced: ${phrase}`,
      ).not.toContain(phrase);
    }
  });

  test("discloses imported fees without changing gross-only feedback policy", async ({
    page,
  }) => {
    await page.goto("/import-dry-run");
    await page.waitForLoadState("networkidle");
    await selectBroker(page, "generic_execution_csv");
    const feeCsv = [
      "Date,Time,Symbol,Side,Quantity,Price,Commission,Fees,Amount,Currency",
      "2026-05-01,09:30:00,ABCD,Buy,100,10.00,1.25,0.08,-1001.33,USD",
      "2026-05-01,10:00:00,ABCD,Sell,100,10.50,1.25,0.10,1048.65,USD",
    ].join("\n");

    await page.getByTestId("local-csv-input").setInputFiles({
      buffer: Buffer.from(feeCsv),
      mimeType: "text/csv",
      name: "fees-and-commission.csv",
    });
    await page
      .getByText("Show advanced P/L and cost details", { exact: true })
      .click();

    const costPanel = page.getByTestId("cost-visibility-panel");

    await expect(costPanel).toContainText("$2.50");
    await expect(costPanel).toContainText("$0.18");
    await expect(costPanel).toContainText("present");
    await expect(
      page.getByTestId("cost-visibility-scoring-policy"),
    ).toContainText("Execution feedback scoring remains gross-only");
  });

  test("saves a generic CSV import and exposes it to saved app routes", async ({
    page,
  }) => {
    test.setTimeout(150_000);
    const symbol = `E2E${Date.now().toString().slice(-8)}`;
    const csv = [
      "Ticker,Executed At,Action,Qty,Fill Price,Status,Commission,Fees,Net Amount",
      `${symbol},05/01/2026 09:30:00 AM,BOT,60,$10.00,Filled,$0.50,$0.02,-600.52`,
      `${symbol},2026-05-01 09:34:00,BOT,40,10.10,Filled,0.50,0.02,-404.52`,
      `${symbol},2026-05-01 09:56:00,SLD,50,10.45,Filled,0.50,0.02,521.98`,
      `${symbol},2026-05-01 10:15:00,SLD,50,10.80,Filled,0.50,0.02,539.48`,
    ].join("\n");

    await page.goto("/import-dry-run");
    await page.waitForLoadState("networkidle");
    await selectBroker(page, "generic_execution_csv");
    await page.getByTestId("local-csv-input").setInputFiles({
      buffer: Buffer.from(csv),
      mimeType: "text/csv",
      name: `${symbol}.csv`,
    });
    await page
      .getByText("Show advanced P/L and cost details", { exact: true })
      .click();

    await expect(page.getByTestId("cost-visibility-panel")).toContainText(
      "present",
    );
    await expect(
      page.getByTestId("cost-visibility-scoring-policy"),
    ).toContainText("gross-only");
    await expect(page.getByTestId("save-import-button")).toBeEnabled();
    await page.getByTestId("save-import-button").click();
    await page.waitForURL(/\/imports\/.+/, { timeout: 30000 });
    await expect(page.getByTestId("import-workflow-step-review")).toContainText(
      "Current",
    );
    await expect(
      page.getByTestId("import-batch-primary-review-action"),
    ).toContainText(/Review first saved trade|Open highest-priority queue/);
    await expect(page.getByTestId("import-batch-saved-trades")).toContainText(
      symbol,
    );
    await expect(page.getByTestId("import-batch-saved-trades")).toContainText(
      "Open trade review",
    );

    await page.goto("/trades");
    await expect(page.getByTestId("import-workflow-strip")).toContainText(
      "The import has reached the end-user review loop",
    );
    await expect(page.getByTestId("saved-trades-triage-panel")).toContainText(
      /Start Here|Review priority trade/,
    );
    await expect(page.getByText(symbol).first()).toBeVisible();
    const savedTrades = await (await page.request.get("/api/trades")).json();
    const savedTrade = savedTrades.trades.find(
      (trade: { symbol: string }) => trade.symbol === symbol,
    );
    expect(savedTrade).toBeTruthy();
    await page.goto(`/trades/${encodeURIComponent(savedTrade.id)}`);
    await expect(page.getByTestId("trade-review-page")).toBeVisible();
    await page
      .getByTestId("trade-note-input")
      .fill("E2E saved review note survives reload.");
    await page.getByTestId("save-trade-note-button").click();
    await expect(
      page
        .getByTestId("persisted-review-actions")
        .getByText("E2E saved review note survives reload.")
        .first(),
    ).toBeVisible();
    await page.reload();
    await expect(
      page
        .getByTestId("persisted-review-actions")
        .getByText("E2E saved review note survives reload.")
        .first(),
    ).toBeVisible();

    const analytics = await (
      await page.request.get("/api/analytics/latest")
    ).json();
    expect(analytics.source).toBe("saved_sqlite");
    expect(analytics.latestReport.sampleData).toBe(false);

    const coach = await (await page.request.get("/api/coach/latest")).json();
    expect(coach.source).toBe("saved_sqlite");
    expect(coach.emptyState.kind).not.toBe("sample_data");

    await page.goto("/analytics");
    await expect(page.getByTestId("saved-review-summary-strip")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Open highest-priority queue" }),
    ).toBeVisible();

    await page.goto("/coach");
    await page
      .getByText("More coach evidence, queue totals, and rule checks", {
        exact: true,
      })
      .click();
    await expect(page.getByTestId("saved-review-summary-strip")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Open highest-priority queue" }),
    ).toBeVisible();

    const review = await (await page.request.get("/api/review/latest")).json();
    expect(review.source).toBe("saved_sqlite");
    expect(review.savedReviewQueue.allItems.length).toBeGreaterThan(0);
    expect(JSON.stringify(review.savedReviewQueue).toLowerCase()).not.toContain(
      "sample fallback",
    );

    await page.goto("/review?queue=highest_priority");
    await expect(page.getByTestId("review-continuation-panel")).toContainText(
      /Review This First|Execution review is available/,
    );
    await expect(page.getByTestId("saved-review-queue")).toBeVisible();
    await expect(page.getByTestId("saved-review-queue-tabs")).toContainText(
      "Highest Priority",
    );
    const queueItem = page
      .locator('[data-testid^="saved-review-queue-item-"]')
      .first();
    await expect(queueItem).toBeVisible();
    await expect(
      queueItem.getByRole("button", { name: "Mark reviewed" }),
    ).toBeVisible();
    await queueItem.getByRole("link").first().click();
    await page.waitForURL(/\/trades\/.+from=review-queue/);
    await expect(page.getByText("Back to review queue")).toBeVisible();

    await page.goto("/import-dry-run");
    await page.waitForLoadState("networkidle");
    await selectBroker(page, "generic_execution_csv");
    await page.getByTestId("local-csv-input").setInputFiles({
      buffer: Buffer.from(csv),
      mimeType: "text/csv",
      name: `${symbol}-duplicate.csv`,
    });
    await page.getByTestId("save-import-button").click();
    await expect(page.getByTestId("save-import-message")).toContainText(
      /duplicate|already exists/i,
    );

    await page.goto("/imports");
    await expect(
      page.getByTestId("import-workflow-step-recover"),
    ).toContainText("Current");
    await expect(
      page.getByText(/duplicate saved import/i).first(),
    ).toBeVisible();
    await expect(page.getByText("Saved import").first()).toBeVisible();
    await expect(page.getByText("Review saved trades").first()).toBeVisible();
    await expect(page.getByText("Duplicate review").first()).toBeVisible();
    await expect(page.getByText("Open original import").first()).toBeVisible();
    await expect(page.getByTestId("import-recovery-queue")).toContainText(
      "Import looks like a duplicate",
    );
    await expect(page.getByTestId("import-recovery-queue")).toContainText(
      "Looks like a duplicate saved import",
    );

    const duplicateHistory = await (
      await page.request.get("/api/import-batches")
    ).json();
    const duplicateRecovery = duplicateHistory.recoveryQueue.find(
      (item: { status: string }) => item.status === "duplicate_review",
    );
    expect(duplicateRecovery).toBeTruthy();

    await page.goto(
      `/imports/${encodeURIComponent(duplicateRecovery.batchId)}`,
    );
    await expect(page.getByTestId("import-batch-action-summary")).toContainText(
      "Import looks like a duplicate",
    );
    await expect(page.getByTestId("duplicate-details")).toContainText(
      "Advanced duplicate details",
    );
    await page.getByText("Advanced duplicate details", { exact: true }).click();
    await expect(page.getByTestId("duplicate-details")).toContainText(
      "Use the original saved import",
    );
  });

  test("keeps blocked imports from implying prototype analysis is available", async ({
    page,
  }) => {
    await page.goto("/import-dry-run");
    await page.waitForLoadState("networkidle");
    await selectSample(page, "preset:row-repair");
    await openImportDryRunDetails(page);

    await expect(page.getByTestId("import-session-summary-status")).toHaveText(
      "Needs repair",
    );
    await expect(page.getByTestId("prototype-analysis-state")).toHaveText(
      "Prototype analysis blocked",
    );
    await expect(page.getByTestId("prototype-analysis-panel")).toContainText(
      "Repair rejected rows or mapping issues before analysis.",
    );
    await expect(page.getByTestId("execution-readiness-status")).toHaveText(
      "Execution blocked",
    );
    await expect(page.getByTestId("execution-readiness-summary")).toContainText(
      "1 rejected row(s)",
    );
    await expect(page.getByTestId("prototype-analysis-panel")).toContainText(
      "production write: false",
    );
    await expect(
      page.getByTestId("decision-review-request-button"),
    ).toBeDisabled();
    await page
      .getByText("Show advanced P/L and cost details", { exact: true })
      .click();
    await expect(page.getByTestId("cost-visibility-panel")).toBeVisible();

    await page.getByTestId("save-import-button").click();
    await expect(page.getByTestId("save-import-message")).toContainText(
      /rejected row|repair/i,
    );
    await page.goto("/imports");
    await expect(page.getByTestId("unresolved-repair-inbox")).toContainText(
      /fix required|repair/i,
    );
    await expect(page.getByTestId("import-recovery-queue")).toContainText(
      "Import is blocked by repair work",
    );
    await expect(page.getByTestId("import-recovery-queue")).toContainText(
      "Resolve repair rows",
    );
    await expect(page.getByText("Repair required").first()).toBeVisible();

    const repairHistory = await (
      await page.request.get("/api/import-batches")
    ).json();
    const blockedRecovery = repairHistory.recoveryQueue.find(
      (item: { status: string }) => item.status === "blocked_by_repairs",
    );
    expect(blockedRecovery).toBeTruthy();

    await page.goto(`/imports/${encodeURIComponent(blockedRecovery.batchId)}`);
    await expect(page.getByTestId("import-batch-action-summary")).toContainText(
      "Import is blocked by repair work",
    );
    await expect(page.getByTestId("import-repair-actions")).toContainText(
      "corrected row values",
    );
    await expect(page.getByTestId("import-recovery-actions")).toContainText(
      "Review repair items",
    );
  });

  test("shows review-warning language for open-position imports", async ({
    page,
  }) => {
    await page.goto("/import-dry-run");
    await page.waitForLoadState("networkidle");
    await selectSample(page, "preset:open-position");
    await openImportDryRunDetails(page);

    await expect(page.getByTestId("import-session-summary-status")).toHaveText(
      "Needs review",
    );
    await expect(page.getByTestId("prototype-analysis-panel")).toContainText(
      /open position|open-position|review/i,
    );
    await expect(page.getByTestId("execution-readiness-status")).toHaveText(
      "Execution review needed",
    );
    await expect(page.getByTestId("execution-readiness-summary")).toContainText(
      "1 open",
    );
    await expect(
      page.getByText("Final position is 75 share(s).").first(),
    ).toBeVisible();
    await expect(page.getByTestId("prototype-analysis-panel")).toContainText(
      "production write: false",
    );
    await page
      .getByText("Show advanced P/L and cost details", { exact: true })
      .click();
    await expect(
      page.getByTestId("cost-visibility-scoring-policy"),
    ).toContainText("gross-only");
  });

  test("attaches server decision-review snapshots to prototype analysis", async ({
    page,
  }) => {
    await page.route("**/api/import-dry-run/decision-review", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        status: 200,
        body: JSON.stringify({
          contractVersion: "csv_dry_run_decision_review_bridge_v1",
          source: "server_dry_run_decision_review",
          importStatus: "ready",
          requestedTradeCount: 1,
          analyzableTradeCount: 1,
          completedReviewCount: 1,
          decisionReviews: [
            {
              tradeId: "dry-run-trade-1-abcd",
              coachingHeadline:
                "Your first entry started just below major 4h resistance.",
              fixFirstBehaviorId: "chasing",
              marketContextSource: "levels_system_daily_4h",
              tradeWindowEvidenceSource: "execution_only_fallback",
              candleQualityNotes: [
                "levels-system trade-window warning: Trade-window candles were ignored because their prices were disconnected from execution prices by more than 60%.",
              ],
              insights: [
                {
                  id: "entry_near_daily_4h_resistance",
                  tone: "risk",
                  category: "market_context",
                  title: "Entry started just below daily/4h resistance",
                  summary:
                    "The first entry started just below a higher-timeframe resistance area.",
                  evidence: [
                    "nearestResistanceStrength=major",
                    "distanceToResistance=1.2%",
                  ],
                },
                {
                  id: "adds_after_trade_already_used_range",
                  tone: "risk",
                  category: "scaling",
                  title: "Adds came after much of the move was already used",
                  summary:
                    "Later size was added after the trade had already consumed much of its move.",
                  evidence: ["averageAddPricePositionInRecentRangePct=84.0%"],
                },
                {
                  id: "trade_window_excursion_measured",
                  tone: "neutral",
                  category: "trade_window",
                  title: "During-trade movement was measured",
                  summary:
                    "The review has bounded trade-window evidence for favorable and adverse movement.",
                  evidence: ["tradeMfePct=6.2%", "tradeMaePct=1.3%"],
                },
              ],
            },
          ],
          diagnostics: [
            {
              requestIndex: 0,
              symbol: "ABCD",
              code: "limit_reached",
              message: "Analyzed 1 of 2 eligible trade(s).",
            },
          ],
          marketContextSourceCounts: {
            levels_system_daily_4h: 1,
          },
        }),
      });
    });

    await prepareDecisionReviewDryRun(page);
    await page.getByTestId("decision-review-request-button").click();

    await expect(page.getByTestId("decision-review-status")).toContainText(
      "1 chart evidence snapshot(s) attached.",
    );
    await expect(page.getByTestId("prototype-analysis-panel")).toContainText(
      "attached",
    );
    await expect(page.getByTestId("prototype-analysis-coaching")).toContainText(
      "Your first entry started just below major 4h resistance.",
    );
    await expect(page.getByTestId("prototype-analysis-panel")).toContainText(
      "Entry started just below daily/4h resistance",
    );
    await expect(
      page.getByTestId("decision-review-evidence-alignment"),
    ).toContainText("Evidence aligned");
    await expect(
      page.getByTestId("decision-review-evidence-gates"),
    ).toContainText("Evidence-gated review");
    await expect(
      page.getByTestId("decision-review-evidence-gates"),
    ).toContainText("Daily/4h Chart Data");
    await expect(
      page.getByTestId("decision-review-evidence-gates"),
    ).toContainText("Trade Window");
    await expect(
      page.getByTestId("decision-review-evidence-gates"),
    ).toContainText("Execution Only");
    await expect(
      page.getByTestId("decision-review-evidence-alignment"),
    ).toContainText("0/1 flagged");
    await expect(page.getByTestId("decision-review-details")).toContainText(
      "Chart Evidence",
    );
    await expect(page.getByTestId("decision-review-details")).toContainText(
      "movement: executions only",
    );
    await expect(page.getByTestId("decision-review-details")).toContainText(
      "Trade-window candles were ignored",
    );
    await expect(
      page.getByText("Resistance strength: major").first(),
    ).toBeVisible();
    await expect(
      page.getByText("Later add location in recent range: 84.0%").first(),
    ).toBeVisible();
    await expect(
      page.getByText("nearestResistanceStrength=major").first(),
    ).toBeHidden();
    await expect(page.getByTestId("decision-review-details")).toContainText(
      "nearestResistanceStrength=major",
    );
    await expect(page.getByTestId("decision-review-details")).toContainText(
      "Adds / Scaling",
    );
    await expect(page.getByTestId("decision-review-details")).toContainText(
      "averageAddPricePositionInRecentRangePct=84.0%",
    );
    await expect(page.getByTestId("decision-review-diagnostics")).toContainText(
      "Analyzed 1 of 2 eligible trade(s).",
    );
  });

  test("shows unavailable daily/4h market context as a data limitation", async ({
    page,
  }) => {
    await page.route("**/api/import-dry-run/decision-review", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        status: 200,
        body: JSON.stringify({
          contractVersion: "csv_dry_run_decision_review_bridge_v1",
          source: "server_dry_run_decision_review",
          importStatus: "needs_review",
          requestedTradeCount: 1,
          analyzableTradeCount: 1,
          completedReviewCount: 0,
          decisionReviews: [],
          diagnostics: [
            {
              requestIndex: 0,
              symbol: "AVEX",
              code: "market_context_unavailable",
              message:
                "Cannot build full support/resistance context for AVEX: daily and 4h candles are required. Higher-timeframe diagnostics: daily: Durable candle warehouse miss for AVEX daily; found 0/520 candles.",
            },
          ],
          marketContextSourceCounts: {},
        }),
      });
    });

    await prepareDecisionReviewDryRun(page);
    await page.getByTestId("decision-review-request-button").click();

    await expect(page.getByTestId("decision-review-status")).toContainText(
      "Daily/4h market data was unavailable or insufficient",
    );
    await expect(page.getByTestId("decision-review-diagnostics")).toContainText(
      "Chart data still missing / AVEX",
    );
    await expect(page.getByTestId("decision-review-diagnostics")).toContainText(
      "market-data limitation, not a trade error",
    );
    await expect(page.getByTestId("decision-review-diagnostics")).toContainText(
      "use executions and P&L",
    );
    await expect(
      page.getByTestId("decision-review-evidence-gates"),
    ).toContainText("Evidence blocked");
    await expect(
      page.getByTestId("decision-review-evidence-gates"),
    ).toContainText("chart data still missing: 1");
  });

  test("keeps aligned candle basis as quiet verification detail", async ({
    page,
  }) => {
    await page.route("**/api/import-dry-run/decision-review", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        status: 200,
        body: JSON.stringify({
          contractVersion: "csv_dry_run_decision_review_bridge_v1",
          source: "server_dry_run_decision_review",
          importStatus: "ready",
          requestedTradeCount: 1,
          analyzableTradeCount: 1,
          completedReviewCount: 1,
          decisionReviews: [
            {
              tradeId: "dry-run-trade-1-abcd",
              coachingHeadline: "Execution was structured and disciplined.",
              fixFirstBehaviorId: null,
              marketContextSource: "levels_system_daily_4h",
              tradeWindowEvidenceSource: "levels_system_trade_window",
              candleQualityNotes: [
                "levels-system trade-window info: Trade-window candle basis status: basis_aligned. Nearby candle OHLC is compatible with broker execution prices for this review.",
              ],
              insights: [
                {
                  id: "trade_window_excursion_measured",
                  tone: "neutral",
                  category: "trade_window",
                  title: "During-trade movement was measured",
                  summary: "The review has bounded trade-window evidence.",
                  evidence: ["tradeMfePct=2.0%"],
                },
              ],
            },
          ],
          diagnostics: [],
          marketContextSourceCounts: {
            levels_system_daily_4h: 1,
          },
        }),
      });
    });

    await prepareDecisionReviewDryRun(page);
    await page.getByTestId("decision-review-request-button").click();

    await expect(
      page.getByTestId("decision-review-candle-warning-notes"),
    ).toHaveCount(0);
    await expect(
      page.getByTestId("decision-review-candle-info-notes"),
    ).toContainText("Verified candle basis");
    await expect(
      page.getByTestId("decision-review-candle-info-notes"),
    ).toContainText("Nearby candle prices were compatible");
    await expect(
      page.getByTestId("decision-review-status-badges"),
    ).toContainText("Verified candle basis");
    await expect(
      page.getByTestId("decision-review-status-badges"),
    ).toContainText("Full chart data");
    await expect(
      page.getByTestId("decision-review-status-badges"),
    ).toContainText("During-trade candle evidence");
    await expect(
      page.getByTestId("decision-review-evidence-gates"),
    ).toContainText("Evidence gates clear");
    await expect(
      page.getByTestId("decision-review-evidence-gates"),
    ).toContainText("1/1");
    await expect(page.getByTestId("decision-review-details")).not.toContainText(
      "Movement review unavailable",
    );
  });

  test("shows adjustment-multiple candle basis as movement warning", async ({
    page,
  }) => {
    await page.route("**/api/import-dry-run/decision-review", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        status: 200,
        body: JSON.stringify({
          contractVersion: "csv_dry_run_decision_review_bridge_v1",
          source: "server_dry_run_decision_review",
          importStatus: "ready",
          requestedTradeCount: 1,
          analyzableTradeCount: 1,
          completedReviewCount: 1,
          decisionReviews: [
            {
              tradeId: "dry-run-trade-1-veee",
              coachingHeadline: "Entry was not close to daily/4h support.",
              fixFirstBehaviorId: null,
              marketContextSource: "levels_system_daily_4h",
              tradeWindowEvidenceSource: "execution_only_fallback",
              candleQualityNotes: [
                "levels-system trade-window warning: Trade-window candle basis status: basis_adjustment_multiple_likely near 38:1. Keep these candles unavailable for Trader Intelligence movement review unless raw IBKR candle basis is proven aligned to broker execution prices.",
              ],
              insights: [
                {
                  id: "trade_window_excursion_measured",
                  tone: "neutral",
                  category: "trade_window",
                  title: "During-trade movement was measured",
                  summary: "The review uses execution-only movement evidence.",
                  evidence: ["tradeMfePct=0.0%"],
                },
              ],
            },
          ],
          diagnostics: [],
          marketContextSourceCounts: {
            levels_system_daily_4h: 1,
          },
        }),
      });
    });

    await prepareDecisionReviewDryRun(page);
    await page.getByTestId("decision-review-request-button").click();

    await expect(page.getByTestId("decision-review-details")).toContainText(
      "movement: executions only",
    );
    await expect(
      page.getByTestId("decision-review-status-badges"),
    ).toContainText("Execution/P&L only");
    await expect(
      page.getByTestId("decision-review-candle-warning-notes"),
    ).toContainText("Movement review unavailable");
    await expect(
      page.getByTestId("decision-review-candle-warning-notes"),
    ).toContainText("different split-adjusted basis");
    await expect(
      page.getByTestId("decision-review-candle-info-notes"),
    ).toHaveCount(0);
  });

  test("shows 5m fallback as lower-resolution notice", async ({ page }) => {
    await page.route("**/api/import-dry-run/decision-review", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        status: 200,
        body: JSON.stringify({
          contractVersion: "csv_dry_run_decision_review_bridge_v1",
          source: "server_dry_run_decision_review",
          importStatus: "ready",
          requestedTradeCount: 1,
          analyzableTradeCount: 1,
          completedReviewCount: 1,
          decisionReviews: [
            {
              tradeId: "dry-run-trade-1-xtlb",
              coachingHeadline: "Execution was structured and disciplined.",
              fixFirstBehaviorId: null,
              marketContextSource: "levels_system_daily_4h",
              tradeWindowEvidenceSource: "levels_system_trade_window",
              candleQualityNotes: [
                "levels-system trade-window warning: 1m trade-window candles were unavailable, so levels-system requested 5m fallback candles.",
                "levels-system trade-window info: 5m fallback candles were used for trade-window analysis.",
                "levels-system trade-window info: Trade-window candle basis status: basis_aligned. Nearby candle OHLC is compatible with broker execution prices for this review.",
              ],
              insights: [
                {
                  id: "trade_window_excursion_measured",
                  tone: "neutral",
                  category: "trade_window",
                  title: "During-trade movement was measured",
                  summary: "The review has bounded trade-window evidence.",
                  evidence: ["tradeMfePct=2.0%"],
                },
              ],
            },
          ],
          diagnostics: [],
          marketContextSourceCounts: {
            levels_system_daily_4h: 1,
          },
        }),
      });
    });

    await prepareDecisionReviewDryRun(page);
    await page.getByTestId("decision-review-request-button").click();

    await expect(
      page.getByTestId("decision-review-candle-warning-notes"),
    ).toHaveCount(0);
    await expect(
      page.getByTestId("decision-review-candle-notice-notes"),
    ).toContainText("Lower-resolution candle window");
    await expect(
      page.getByTestId("decision-review-candle-notice-notes"),
    ).toContainText("complete 1m during-trade candles were unavailable");
    await expect(
      page.getByTestId("decision-review-candle-info-notes"),
    ).toContainText("Verified candle basis");
    await expect(
      page.getByTestId("decision-review-status-badges"),
    ).toContainText("Lower-resolution candle window");
  });

  test("labels verified extreme moves without hiding the review", async ({
    page,
  }) => {
    await page.route("**/api/import-dry-run/decision-review", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        status: 200,
        body: JSON.stringify({
          contractVersion: "csv_dry_run_decision_review_bridge_v1",
          source: "server_dry_run_decision_review",
          importStatus: "ready",
          requestedTradeCount: 1,
          analyzableTradeCount: 1,
          completedReviewCount: 1,
          decisionReviews: [
            {
              tradeId: "dry-run-trade-1-sklz",
              coachingHeadline: "The trade exited winner potential too early.",
              fixFirstBehaviorId: "premature_exit",
              marketContextSource: "levels_system_daily_4h",
              tradeWindowEvidenceSource: "levels_system_trade_window",
              candleQualityNotes: [
                "levels-system trade-window info: Trade-window candle basis status: basis_aligned. Nearby candle OHLC is compatible with broker execution prices for this review.",
              ],
              insights: [
                {
                  id: "entry_had_constructive_location",
                  tone: "strength",
                  category: "entry",
                  title: "Entry had constructive location evidence",
                  summary:
                    "The entry left meaningful room for the trade to work.",
                  evidence: ["firstEntryToPeakMovePct=226.8%"],
                },
                {
                  id: "exit_left_continuation",
                  tone: "risk",
                  category: "exit",
                  title: "Exit came before more continuation",
                  summary:
                    "The trade continued meaningfully after the exit while risk stayed bounded.",
                  evidence: ["maxFavorableMovePctAfterExit=226.8%"],
                },
                {
                  id: "trade_window_excursion_measured",
                  tone: "neutral",
                  category: "trade_window",
                  title: "During-trade movement was measured",
                  summary: "The review has bounded trade-window evidence.",
                  evidence: ["tradeMfePct=226.8%", "tradeMaePct=0.0%"],
                },
              ],
            },
          ],
          diagnostics: [],
          marketContextSourceCounts: {
            levels_system_daily_4h: 1,
          },
        }),
      });
    });

    await prepareDecisionReviewDryRun(page);
    await page.getByTestId("decision-review-request-button").click();

    await expect(
      page.getByTestId("decision-review-status-badges"),
    ).toContainText("Verified extreme move");
    await expect(
      page.getByTestId("decision-review-status-badges"),
    ).toContainText("Verified candle basis");
    await expect(
      page.getByTestId("decision-review-evidence-alignment"),
    ).toContainText("Evidence aligned");
    await expect(page.getByTestId("decision-review-details")).toContainText(
      "tradeMfePct=226.8%",
    );
    await expect(page.getByTestId("decision-review-details")).toContainText(
      "maxFavorableMovePctAfterExit=226.8%",
    );
  });

  test("labels weak context as present but not supportive", async ({
    page,
  }) => {
    await page.route("**/api/import-dry-run/decision-review", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        status: 200,
        body: JSON.stringify({
          contractVersion: "csv_dry_run_decision_review_bridge_v1",
          source: "server_dry_run_decision_review",
          importStatus: "ready",
          requestedTradeCount: 1,
          analyzableTradeCount: 1,
          completedReviewCount: 1,
          decisionReviews: [
            {
              tradeId: "dry-run-trade-1-btog",
              coachingHeadline: "Entry was not close to daily/4h support.",
              fixFirstBehaviorId: null,
              marketContextSource: "levels_system_daily_4h",
              tradeWindowEvidenceSource: "levels_system_trade_window",
              candleQualityNotes: [
                "levels-system trade-window info: Trade-window candle basis status: basis_aligned. Nearby candle OHLC is compatible with broker execution prices for this review.",
              ],
              insights: [
                {
                  id: "entry_far_from_daily_4h_support",
                  tone: "risk",
                  category: "market_context",
                  title: "Entry had little support underneath",
                  summary:
                    "Daily/4h context was present, but the first fill was not sitting near support below.",
                  evidence: ["nearestSupport=n/a", "distanceToSupport=n/a"],
                },
                {
                  id: "trade_window_excursion_measured",
                  tone: "neutral",
                  category: "trade_window",
                  title: "During-trade movement was measured",
                  summary: "The review has bounded trade-window evidence.",
                  evidence: ["tradeMfePct=3.0%"],
                },
              ],
            },
          ],
          diagnostics: [],
          marketContextSourceCounts: {
            levels_system_daily_4h: 1,
          },
        }),
      });
    });

    await prepareDecisionReviewDryRun(page);
    await page.getByTestId("decision-review-request-button").click();

    await expect(
      page.getByTestId("decision-review-status-badges"),
    ).toContainText("Context present, not supportive");
    await expect(page.getByTestId("decision-review-details")).toContainText(
      "Daily/4h context was present",
    );
  });

  test("repairs a missing-quantity row and captures dry-run decisions", async ({
    page,
  }, testInfo) => {
    await page.goto("/import-dry-run");
    await page.waitForLoadState("networkidle");
    await selectBroker(page, "generic_execution_csv");
    const projectSuffix = testInfo.project.name.includes("mobile")
      ? "M"
      : testInfo.project.name.includes("tablet")
        ? "T"
        : "D";
    const symbol = `RP${Date.now().toString().slice(-6)}${projectSuffix}`;
    const customCsv = [
      "Date,Time,Symbol,Side,Quantity,Price",
      `2026-05-01,09:30:00,${symbol},Buy,,10.00`,
      `2026-05-01,09:35:00,${symbol},Sell,100,11.00`,
    ].join("\n");

    await page.getByTestId("local-csv-input").setInputFiles({
      buffer: Buffer.from(customCsv),
      mimeType: "text/csv",
      name: "missing-quantity.csv",
    });

    await expect(page.getByTestId("csv-textarea")).toHaveValue(customCsv);

    await expect(page.getByTestId("row-repair-2-status")).toHaveText(
      "rejected",
    );
    await expect(page.getByTestId("row-repair-2-quantity")).toHaveValue("");

    await page.getByTestId("row-repair-2-quantity").fill("100");

    await expect(page.getByTestId("row-repair-2-quantity")).toHaveValue("100");
    await expect(page.getByTestId("row-repair-2-status")).toHaveText(
      "accepted",
    );
    await expect(page.getByTestId("repair-carry-forward-panel")).toContainText(
      "Repaired CSV",
    );
    await expect(page.getByTestId("repair-carry-forward-status")).toHaveText(
      "repaired save source",
    );
    await expect(page.getByTestId("import-session-summary-status")).toHaveText(
      "Ready",
    );
    await expect(page.getByTestId("confidence-gate-title")).toContainText(
      /ready/i,
    );

    await page.getByTestId("setup-tag-0").selectOption("momentum");
    await expect(
      page.getByText("User selected momentum. This is not chart-validated."),
    ).toBeVisible();

    await page.getByTestId("feedback-reviewed-checkbox").check();
    await expect(page.getByTestId("feedback-reviewed-checkbox")).toBeChecked();
    await expect(
      page.getByText("Feedback preview marked reviewed."),
    ).toBeVisible();

    await expect(page.getByTestId("save-import-button")).toBeEnabled();
    await page.getByTestId("save-import-button").click();
    await page.waitForURL(/\/imports\/.+/, { timeout: 30000 });
    await expect(page.getByTestId("import-batch-saved-trades")).toContainText(
      symbol,
    );
    await expect(page.getByTestId("import-batch-saved-trades")).toContainText(
      "Open trade review",
    );

    await page.goto("/trades");
    await expect(page.getByText(symbol).first()).toBeVisible();

    const analytics = await (
      await page.request.get("/api/analytics/latest")
    ).json();
    expect(analytics.source).toBe("saved_sqlite");
    expect(analytics.latestReport.sampleData).toBe(false);
    expect(analytics.savedImportSourceCaution).toMatchObject({
      repairedImport: true,
      title: "Repaired CSV source",
    });

    const coach = await (await page.request.get("/api/coach/latest")).json();
    expect(coach.source).toBe("saved_sqlite");
    expect(coach.emptyState.kind).not.toBe("sample_data");
    expect(coach.savedImportSourceCaution).toMatchObject({
      repairedImport: true,
    });

    const review = await (await page.request.get("/api/review/latest")).json();
    expect(review.source).toBe("saved_sqlite");
    expect(review.savedImportSourceCaution).toMatchObject({
      repairedImport: true,
    });
    expect(review.savedReviewQueue.allItems.length).toBeGreaterThan(0);
    expect(JSON.stringify(review.savedReviewQueue).toLowerCase()).not.toContain(
      "sample fallback",
    );

    await page.goto("/analytics");
    await expect(page.getByTestId("saved-review-summary-strip")).toBeVisible();
    await expect(
      page.getByTestId("analytics-repaired-import-caution"),
    ).toContainText("Review repaired row values");

    await page.goto("/coach");
    await page
      .getByText("More coach evidence, queue totals, and rule checks", {
        exact: true,
      })
      .click();
    await expect(page.getByTestId("saved-review-summary-strip")).toBeVisible();
    await expect(
      page.getByTestId("coach-repaired-import-caution"),
    ).toContainText("Review repaired row values");

    await page.goto("/review?queue=highest_priority");
    await expect(
      page.getByTestId("review-repaired-import-caution"),
    ).toContainText("Review repaired row values");
    await expect(page.getByTestId("saved-review-queue")).toBeVisible();
    await expect(page.getByTestId("saved-review-queue-tabs")).toContainText(
      "Highest Priority",
    );
    await expect(page.getByTestId("saved-review-queue")).toContainText(
      "Chart data still missing",
    );
    await expect(page.getByTestId("saved-review-queue")).toContainText(
      "execution-only",
    );
    await expect(page.getByTestId("saved-review-queue")).toContainText(
      "Execution review is available",
    );

    const savedTrades = await (await page.request.get("/api/trades")).json();
    const savedTrade = savedTrades.trades.find(
      (trade: { symbol: string }) => trade.symbol === symbol,
    );
    expect(savedTrade).toMatchObject({
      repairSource: "repaired_csv",
    });
    await page.goto(`/trades/${encodeURIComponent(savedTrade.id)}`);
    await expect(
      page.getByTestId("trade-repaired-import-caution"),
    ).toContainText("repaired CSV rows");
    await expect(page.getByTestId("trade-feedback-scope")).toContainText(
      /Chart review needs technical follow-up|Chart data still missing/,
    );
    await expect(page.getByTestId("trade-feedback-scope")).toContainText(
      "Execution-only fallback",
    );
    await expect(page.getByTestId("trade-feedback-scope")).toContainText(
      "Do not treat chart conclusions as available",
    );

    await page.goto("/imports");
    await expect(page.getByText("Saved import").first()).toBeVisible();
    await expect(page.getByText("Review saved trades").first()).toBeVisible();

    const savedHistory = await (
      await page.request.get("/api/import-batches")
    ).json();
    const committed = savedHistory.history.find(
      (item: { summaryStatus: string; batch: { brokerLabel: string } }) =>
        item.summaryStatus === "committed" &&
        item.batch.brokerLabel === "Generic Execution CSV",
    );
    expect(committed).toBeTruthy();

    await page.goto(`/imports/${encodeURIComponent(committed.batch.id)}`);
    await expect(page.getByTestId("import-batch-action-summary")).toContainText(
      "Saved import",
    );
    await expect(page.getByTestId("decision-review-diagnostics")).toContainText(
      "evidence limits",
    );
    await expect(page.getByTestId("import-batch-saved-trades")).toContainText(
      "Open trade review",
    );
  });

  test("captures screenshot-ready visual smoke across configured viewports", async ({
    page,
  }, testInfo) => {
    const visual = buildCsvDryRunVisualRegressionContract();
    const viewport = testInfo.project.name.includes("mobile")
      ? "mobile"
      : testInfo.project.name.includes("tablet")
        ? "tablet"
        : "desktop";
    const target = visual.targets.find(
      (candidate) => candidate.viewport === viewport,
    );

    expect(visual.screenshotDependency).toBe("playwright_chromium");
    expect(target).toBeDefined();
    await page.goto(visual.routePath);
    await page.waitForLoadState("networkidle");

    const viewportSize = page.viewportSize();
    expect(viewportSize?.width).toBe(target?.width);
    expect(viewportSize?.height).toBe(target?.height);

    await expect(
      page.getByRole("heading", {
        exact: true,
        name: "What happens after upload",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { exact: true, name: "User Decision Capture" }),
    ).toBeHidden();

    const hasPageOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth + 2,
    );
    expect(hasPageOverflow).toBe(false);

    const screenshot = await page.screenshot({ fullPage: false });
    expect(screenshot.length).toBeGreaterThan(10_000);
    await testInfo.attach(`import-dry-run-${viewport}.png`, {
      body: screenshot,
      contentType: "image/png",
    });
  });
});
