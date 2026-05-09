import { Buffer } from "node:buffer";
import { expect, test, type Page, type TestInfo } from "@playwright/test";
import {
  buildProductTraderAnalyticsViewModel,
  buildProductWorkflowShellViewModel,
  buildSampleSavedTraderAnalyticsData,
  getCsvDryRunSamplePresets,
} from "../../src/lib/trader-analytics";
import type { BrokerExecutionCsvFormat } from "../../src/lib/execution-sources/csv";

const sampleData = buildSampleSavedTraderAnalyticsData();
const productView = buildProductTraderAnalyticsViewModel({
  repository: sampleData.repository,
  userId: sampleData.userId,
  importRequests: sampleData.importRequests,
});
const shell = buildProductWorkflowShellViewModel();
const sampleTrades = sampleData.repository.listTrades(sampleData.userId);

const BROKEN_PAGE_PHRASES = [
  "Application error",
  "Unhandled Runtime Error",
  "This page could not be found",
  "Internal Server Error",
  "Hydration failed",
  "ChunkLoadError",
];

const UNSAFE_PRODUCT_CLAIMS = [
  "Download CSV",
  "Download report",
  "Export CSV",
  "Export button",
  "Debug Raw JSON",
  "Raw JSON panel",
  "Real customer trades are saved",
  "Billing is active",
  "Authenticated users are live",
  "Market-validated setup",
  "market structure used for scoring",
  "market structure used for grade",
  "support/resistance-backed import",
  "candle-confirmed rule",
];

function isDesktopProject(testInfo: TestInfo): boolean {
  return testInfo.project.name === "chromium-desktop";
}

function isMobileProject(testInfo: TestInfo): boolean {
  return testInfo.project.name === "chromium-mobile";
}

function collectPageProblems(page: Page): () => void {
  const problems: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      problems.push(`[console.error] ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => {
    problems.push(`[pageerror] ${error.message}`);
  });
  page.on("requestfailed", (request) => {
    const failure = request.failure();
    if (failure?.errorText === "net::ERR_ABORTED") {
      return;
    }
    problems.push(
      `[requestfailed] ${request.method()} ${request.url()} ${failure?.errorText ?? ""}`,
    );
  });
  page.on("response", (response) => {
    const url = response.url();
    if (response.status() >= 400 && !url.endsWith("/favicon.ico")) {
      problems.push(`[response:${response.status()}] ${url}`);
    }
  });

  return () => {
    expect(problems).toEqual([]);
  };
}

async function assertNoBrokenPageCopy(page: Page): Promise<void> {
  const bodyText = await page.locator("body").innerText();
  for (const phrase of BROKEN_PAGE_PHRASES) {
    expect(bodyText, `Broken page phrase appeared: ${phrase}`).not.toContain(
      phrase,
    );
  }
}

async function assertNoUnsafeProductClaims(page: Page): Promise<void> {
  const bodyText = await page.locator("body").innerText();
  const normalizedBody = bodyText.replace(/\s+/g, " ").toLowerCase();

  for (const phrase of UNSAFE_PRODUCT_CLAIMS) {
    expect(
      normalizedBody,
      `Unsafe product claim appeared: ${phrase}`,
    ).not.toContain(phrase.toLowerCase());
  }
}

async function assertNoPageOverflow(page: Page, path: string): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(
    dimensions.scrollWidth,
    `Page-level horizontal overflow on ${path}: scrollWidth ${dimensions.scrollWidth}, clientWidth ${dimensions.clientWidth}`,
  ).toBeLessThanOrEqual(dimensions.clientWidth + 2);
}

async function visit(page: Page, path: string, heading: string): Promise<void> {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  await expect(
    page.getByRole("heading", { exact: true, name: heading }),
    `Missing expected heading on ${path}: ${heading}`,
  ).toBeVisible();
  await assertNoBrokenPageCopy(page);
}

function presetCsv(presetId: string): string {
  const preset = getCsvDryRunSamplePresets().find(
    (candidate) => candidate.id === presetId,
  );

  if (!preset) {
    throw new Error(`Missing CSV dry-run preset: ${presetId}`);
  }

  return preset.csvText;
}

async function uploadCsv(
  page: Page,
  args: {
    broker: BrokerExecutionCsvFormat;
    csvText: string;
    fileName: string;
  },
): Promise<void> {
  await page.goto("/import-dry-run");
  await page.waitForLoadState("networkidle");
  await page.getByTestId("broker-select").selectOption(args.broker);
  await page.getByTestId("local-csv-input").setInputFiles({
    buffer: Buffer.from(args.csvText),
    mimeType: "text/csv",
    name: args.fileName,
  });
  await expect(page.getByTestId("csv-textarea")).toHaveValue(args.csvText);
}

test.describe("trader app acceptance", () => {
  test("opens every sample trade detail page with a usable autopsy", async ({
    page,
  }, testInfo) => {
    test.skip(!isDesktopProject(testInfo), "all-trade autopsy loop runs on desktop");
    test.setTimeout(90_000);
    const assertNoProblems = collectPageProblems(page);

    for (const trade of sampleTrades) {
      await visit(page, `/trades/${trade.id}`, `${trade.symbol} Trade Review`);
      await expect(page.getByTestId("trade-review-page")).toBeVisible();
      await expect(page.getByTestId("trade-session-time")).toBeVisible();
      await expect(page.getByTestId("trade-session-time")).toContainText(
        "Eastern Time",
      );
      await expect(page.getByTestId("trade-execution-replay")).toBeVisible();
      await expect(page.getByTestId(/^trade-replay-step-/)).not.toHaveCount(0);
      await expect(page.getByTestId("trade-review-points")).toContainText("Risks");
      await expect(page.getByTestId("trade-review-points")).toContainText(
        "Strengths",
      );
      await expect(page.getByTestId("trade-quality")).toBeVisible();
      await expect(page.getByTestId("trade-decision-autopsy")).toBeVisible();
      await assertNoUnsafeProductClaims(page);
    }

    assertNoProblems();
  });

  test("filters analytics, switches drill-downs, and opens filtered trade evidence", async ({
    page,
  }, testInfo) => {
    test.skip(!isDesktopProject(testInfo), "analytics interaction runs on desktop");
    const assertNoProblems = collectPageProblems(page);
    const filteredRows = productView.filteredView.rows.filter(
      (row) => row.symbol === "ABCD" && row.grossRealizedPnl < 0,
    );
    const excludedRow = productView.filteredView.rows.find(
      (row) => row.symbol !== "ABCD",
    );
    const selectedDrillDown =
      productView.drillDowns.find(
        (drillDown) =>
          drillDown.id !== productView.drillDowns[0]?.id &&
          drillDown.rows.length > 0,
      ) ?? productView.drillDowns[0];

    if (!selectedDrillDown || filteredRows.length === 0) {
      throw new Error("Sample analytics data is missing acceptance fixtures.");
    }

    await visit(page, "/analytics", "Analytics");
    await expect(page.getByText("Time Of Day")).toBeVisible();
    await expect(page.getByText("Session Timing")).toBeVisible();
    await page.getByTestId("analytics-filter-symbol").selectOption("ABCD");
    await page.getByTestId("analytics-filter-outcome").selectOption("loser");
    const firstHour = productView.filterOptions.entryHoursEt[0];
    if (firstHour) {
      await page
        .getByTestId("analytics-filter-entry-hour")
        .selectOption(String(firstHour.value));
      await expect(page.getByTestId("analytics-filtered-trade-review")).toContainText(
        firstHour.label,
      );
      await page.getByTestId("analytics-filter-entry-hour").selectOption("");
    }

    const filteredSection = page.getByTestId("analytics-filtered-trade-review");
    await expect(
      filteredSection.locator('[data-testid^="analytics-filtered-row-"]'),
    ).toHaveCount(filteredRows.length);
    for (const row of filteredRows) {
      await expect(
        page.getByTestId(`analytics-filtered-row-${row.tradeId}`),
      ).toBeVisible();
    }
    if (excludedRow) {
      await expect(
        page.getByTestId(`analytics-filtered-row-${excludedRow.tradeId}`),
      ).toHaveCount(0);
    }

    await page
      .getByTestId(`analytics-drilldown-${selectedDrillDown.id}`)
      .click();
    await expect(page.getByTestId("analytics-selected-drilldown-title")).toHaveText(
      selectedDrillDown.label,
    );
    await expect(
      page.locator('[data-testid^="analytics-drilldown-row-"]'),
    ).toHaveCount(selectedDrillDown.rows.length);

    const firstFilteredTrade = filteredRows[0];
    await page
      .getByTestId(`analytics-filtered-open-${firstFilteredTrade.tradeId}`)
      .click();
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("heading", {
        exact: true,
        name: `${firstFilteredTrade.symbol} Trade Review`,
      }),
    ).toBeVisible();

    assertNoProblems();
  });

  test("maps unknown CSV headers and repairs rejected import rows through the UI", async ({
    page,
  }, testInfo) => {
    test.skip(!isDesktopProject(testInfo), "import mapping and repair run on desktop");
    test.setTimeout(90_000);
    const assertNoProblems = collectPageProblems(page);

    await uploadCsv(page, {
      broker: "generic_execution_csv",
      csvText: presetCsv("preset:unknown-mapping"),
      fileName: "unknown-mapping-acceptance.csv",
    });
    await expect(page.locator("body")).toContainText("Broker mapping confidence is low");

    const mappings = {
      price: "Fill Price",
      quantity: "Filled Shares",
      side: "Instruction",
      symbol: "Trading Symbol",
      timestamp: "Executed At",
    };
    for (const [field, value] of Object.entries(mappings)) {
      await page.getByTestId(`mapping-field-${field}`).fill(value);
    }

    await expect(page.locator("body")).toContainText("PLTR");
    await expect(
      page.getByRole("heading", {
        exact: true,
        name: "Trade Grouping Review",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        exact: true,
        name: "Execution Feedback Preview",
      }),
    ).toBeVisible();

    await uploadCsv(page, {
      broker: "generic_execution_csv",
      csvText: presetCsv("preset:row-repair"),
      fileName: "row-repair-acceptance.csv",
    });
    await expect(page.getByTestId("row-repair-2-status")).toHaveText("rejected");
    await page.getByTestId("row-repair-2-symbol").fill("ABCD");
    await expect(page.getByTestId("row-repair-2-status")).toHaveText("accepted");
    await expect(page.locator("body")).toContainText(
      "The import is ready for dry-run feedback review.",
    );

    assertNoProblems();
  });

  test("keeps progress visuals connected to source trade reviews", async ({
    page,
  }, testInfo) => {
    test.skip(!isDesktopProject(testInfo), "progress link test runs on desktop");
    const assertNoProblems = collectPageProblems(page);
    const trendPoint =
      shell.progress.analytics.productPolish.executionQualityTrendline.points[0];
    const trade = sampleTrades.find((candidate) => candidate.id === trendPoint.tradeId);

    if (!trade) {
      throw new Error("Missing progress trendline sample trade.");
    }

    await visit(page, "/progress", "Trader Progress");
    for (const heading of [
      "Score Dimensions",
      "Rule Effectiveness",
      "Quality By Trade",
      "Mistake Reduction Targets",
      "Execution Quality Trendline",
      "Behavior Change Tracker",
      "Report History",
    ]) {
      await expect(
        page.getByRole("heading", { exact: true, name: heading }),
      ).toBeVisible();
    }

    await page.getByTestId(`progress-quality-link-${trade.id}`).click();
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("heading", {
        exact: true,
        name: `${trade.symbol} Trade Review`,
      }),
    ).toBeVisible();

    assertNoProblems();
  });

  test("opens review workflow source trades without persistence overclaims", async ({
    page,
  }, testInfo) => {
    test.skip(!isDesktopProject(testInfo), "review workflow test runs on desktop");
    const assertNoProblems = collectPageProblems(page);
    const stepIndex = shell.guidedReview.steps.findIndex(
      (step) => step.relatedTradeIds.length > 0,
    );
    const tradeId = shell.guidedReview.steps[stepIndex]?.relatedTradeIds[0];
    const trade = sampleTrades.find((candidate) => candidate.id === tradeId);

    if (stepIndex < 0 || !trade) {
      throw new Error("Missing guided review related trade fixture.");
    }

    await visit(page, "/review", shell.guidedReview.title);
    for (const heading of [
      "Playbook Drafts",
      "Coach Review Queue",
      "Session Coach Report",
      "Biggest Mistake",
      "Review Flow",
      "Lesson Draft",
    ]) {
      await expect(
        page.getByRole("heading", { exact: true, name: heading }),
      ).toBeVisible();
    }
    await assertNoUnsafeProductClaims(page);

    await page.getByTestId(`review-related-trade-${trade.id}-${stepIndex}`).click();
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("heading", {
        exact: true,
        name: `${trade.symbol} Trade Review`,
      }),
    ).toBeVisible();

    assertNoProblems();
  });

  test("keeps every sample trade autopsy usable on mobile", async ({
    page,
  }, testInfo) => {
    test.skip(!isMobileProject(testInfo), "mobile trade autopsy loop runs on mobile");
    test.setTimeout(90_000);
    const assertNoProblems = collectPageProblems(page);

    for (const trade of sampleTrades) {
      const path = `/trades/${trade.id}`;
      await visit(page, path, `${trade.symbol} Trade Review`);
      await expect(page.getByTestId("trade-execution-replay")).toBeVisible();
      await expect(page.getByTestId("trade-quality")).toBeVisible();
      await assertNoPageOverflow(page, path);
    }

    assertNoProblems();
  });

  test("preserves end-user product boundaries on core pages", async ({
    page,
  }, testInfo) => {
    test.skip(!isDesktopProject(testInfo), "product boundary scan runs on desktop");
    const assertNoProblems = collectPageProblems(page);
    const firstTrade = sampleTrades[0];

    for (const route of [
      { heading: "Analytics", path: "/analytics" },
      { heading: "Import Trades", path: "/import-dry-run" },
      { heading: shell.guidedReview.title, path: "/review" },
      { heading: "Trader Progress", path: "/progress" },
      {
        heading: `${firstTrade.symbol} Trade Review`,
        path: `/trades/${firstTrade.id}`,
      },
    ]) {
      await visit(page, route.path, route.heading);
      await assertNoUnsafeProductClaims(page);
    }

    assertNoProblems();
  });
});
