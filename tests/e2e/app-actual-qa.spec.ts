import { Buffer } from "node:buffer";
import { expect, test, type Page, type TestInfo } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

import {
  buildProductTraderAnalyticsViewModel,
  buildProductWorkflowShellViewModel,
  buildSampleSavedTraderAnalyticsData,
  getCsvDryRunSamplePresets,
} from "../../src/lib/trader-analytics";
import type { BrokerExecutionCsvFormat } from "../../src/lib/execution-sources/csv";

const sampleData = buildSampleSavedTraderAnalyticsData();
const productView = buildProductTraderAnalyticsViewModel({
  importRequests: sampleData.importRequests,
  repository: sampleData.repository,
  userId: sampleData.userId,
});
const shell = buildProductWorkflowShellViewModel();
const sampleTrades = sampleData.repository.listTrades(sampleData.userId);

const CORE_VISUAL_ROUTES = [
  { heading: "TradersLink Trading Tools", path: "/" },
  { heading: "First Run Setup", path: "/first-run" },
  { heading: "Import Trades", path: "/import-dry-run" },
  { heading: "Analytics", path: "/analytics" },
  { heading: shell.guidedReview.title, path: "/review" },
  { heading: "Trader Progress", path: "/progress" },
  { heading: "Saved Trades", path: "/trades" },
] as const;

const PRODUCT_OVERCLAIMS = [
  "Download CSV",
  "Download report",
  "Export CSV",
  "Export button",
  "Debug Raw JSON",
  "Raw JSON panel",
  "Real customer trades are saved",
  "Production persistence is live",
  "Billing is active",
  "Authenticated users are live",
  "Broker account connected",
  "IBKR account connected",
  "Market-validated setup",
  "market structure used for scoring",
  "market structure used for grade",
  "market structure used for final coaching",
  "support/resistance-backed import",
  "candle-confirmed rule",
  "candle-confirmed setup",
  "chart-validated setup",
];

const BROKEN_PAGE_PHRASES = [
  "Application error",
  "Unhandled Runtime Error",
  "Internal Server Error",
  "Hydration failed",
  "ChunkLoadError",
];

const CSV_TORTURE_CASES: Array<{
  broker: BrokerExecutionCsvFormat;
  csvText: string;
  expected: string[];
  name: string;
}> = [
  {
    broker: "generic_execution_csv",
    csvText: [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2026-05-01,09:30:00,DUPL,Buy,100,10.00",
      "2026-05-01,09:30:00,DUPL,Buy,100,10.00",
      "2026-05-01,09:40:00,DUPL,Sell,200,10.40",
    ].join("\n"),
    expected: ["Duplicate-like fill cluster"],
    name: "duplicate-executions",
  },
  {
    broker: "generic_execution_csv",
    csvText: [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2026-05-01,10:15:00,REV,Buy,50,20.00",
      "2026-05-01,09:45:00,REV,Sell,50,20.20",
    ].join("\n"),
    expected: ["Execution Feedback Preview", "Trade Grouping Review"],
    name: "reversed-timestamps",
  },
  {
    broker: "generic_execution_csv",
    csvText: [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2026-05-01,09:30:00,PART,Buy,25,30.00",
      "2026-05-01,09:32:00,PART,Buy,25,30.05",
      "2026-05-01,09:40:00,PART,Sell,30,30.40",
      "2026-05-01,09:50:00,PART,Sell,20,30.70",
    ].join("\n"),
    expected: ["Execution Feedback Preview", "Partial Exit"],
    name: "partial-fills",
  },
  {
    broker: "generic_execution_csv",
    csvText: presetCsv("preset:generic-short"),
    expected: ["SPY", "Execution Feedback Preview"],
    name: "short-trade",
  },
  {
    broker: "generic_execution_csv",
    csvText: presetCsv("preset:open-position"),
    expected: ["Open Position Leftover"],
    name: "open-position",
  },
  {
    broker: "generic_execution_csv",
    csvText: [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2026-05-01,09:30:00,MIXA,Buy,100,11.00",
      "2026-05-01,09:36:00,MIXB,Buy,50,22.00",
      "2026-05-01,09:48:00,MIXA,Sell,100,11.30",
      "2026-05-01,09:55:00,MIXB,Sell,50,21.70",
    ].join("\n"),
    expected: ["MIXA", "MIXB", "Execution Feedback Preview"],
    name: "mixed-symbols",
  },
  {
    broker: "generic_execution_csv",
    csvText: [
      "Date,Time,Symbol,Side,Quantity,Price,Commission,Fees,Net Amount",
      "2026-05-01,09:30:00,FEE,Buy,100,15.00,1.00,0.20,-1501.20",
      "2026-05-01,10:10:00,FEE,Sell,100,15.45,1.00,0.20,1543.80",
    ].join("\n"),
    expected: ["Execution Feedback Preview", "FEE"],
    name: "fees-and-commissions",
  },
  {
    broker: "generic_execution_csv",
    csvText: [
      "Date,Time,Symbol,Side,Quantity,Price",
      "05/01/2026,9:30 AM,DATE,Buy,100,40.00",
      "05/01/2026,10:05 AM,DATE,Sell,100,40.25",
    ].join("\n"),
    expected: ["Import Session Summary", "DATE"],
    name: "weird-date-format",
  },
  {
    broker: "generic_execution_csv",
    csvText: [
      "Date,Time,Symbol,Side,Quantity,Price,Venue,Route,Notes",
      "2026-05-01,09:30:00,EXTRA,Buy,100,10.00,NASDAQ,SMART,starter",
      "2026-05-01,09:45:00,EXTRA,Sell,100,10.45,NASDAQ,SMART,exit",
    ].join("\n"),
    expected: ["Execution Feedback Preview", "EXTRA"],
    name: "extra-unknown-columns",
  },
  {
    broker: "generic_execution_csv",
    csvText: [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2026-05-01,09:30:00,TINY,Buy,0.5,100.00",
      "2026-05-01,09:45:00,TINY,Sell,0.5,101.00",
    ].join("\n"),
    expected: ["Import Session Summary", "TINY"],
    name: "small-share-size",
  },
];

function isDesktopProject(testInfo: TestInfo): boolean {
  return testInfo.project.name === "chromium-desktop";
}

function isMobileProject(testInfo: TestInfo): boolean {
  return testInfo.project.name === "chromium-mobile";
}

function isVisualProject(testInfo: TestInfo): boolean {
  return isDesktopProject(testInfo) || isMobileProject(testInfo);
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
    if (
      request.url().includes("/favicon.ico") ||
      failure?.errorText === "net::ERR_ABORTED" ||
      failure?.errorText === "NS_BINDING_ABORTED"
    ) {
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

function presetCsv(presetId: string): string {
  const preset = getCsvDryRunSamplePresets().find(
    (candidate) => candidate.id === presetId,
  );

  if (!preset) {
    throw new Error(`Missing CSV dry-run preset: ${presetId}`);
  }

  return preset.csvText;
}

function toArtifactName(routePath: string, projectName: string): string {
  const routeSegment = routePath.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
  return `actual-qa-${routeSegment || "home"}-${projectName}.png`;
}

async function visitAndAssert(
  page: Page,
  path: string,
  heading: string,
): Promise<void> {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  await expect(
    page.getByRole("heading", { exact: true, name: heading }),
    `Missing expected heading on ${path}: ${heading}`,
  ).toBeVisible();
  await assertNoBrokenPageCopy(page);
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

async function assertNoBrokenPageCopy(page: Page): Promise<void> {
  const bodyText = await page.locator("body").innerText();
  for (const phrase of BROKEN_PAGE_PHRASES) {
    expect(bodyText, `Broken page phrase appeared: ${phrase}`).not.toContain(
      phrase,
    );
  }
}

async function assertNoProductOverclaims(page: Page): Promise<void> {
  const bodyText = await page.locator("body").innerText();
  const normalizedBody = bodyText.replace(/\s+/g, " ").toLowerCase();

  for (const phrase of PRODUCT_OVERCLAIMS) {
    expect(
      normalizedBody,
      `Product overclaim appeared: ${phrase}`,
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

async function assertVisualHealth(
  page: Page,
  route: (typeof CORE_VISUAL_ROUTES)[number],
  testInfo: TestInfo,
): Promise<void> {
  await visitAndAssert(page, route.path, route.heading);
  const visibleText = await page.locator("body").innerText();
  expect(
    visibleText.replace(/\s+/g, " ").trim().length,
    `Route has too little visible text: ${route.path}`,
  ).toBeGreaterThan(240);
  await assertNoPageOverflow(page, route.path);
  await assertNoProductOverclaims(page);

  const screenshot = await page.screenshot({ fullPage: false });
  expect(
    screenshot.length,
    `Screenshot artifact is unexpectedly tiny for ${route.path}`,
  ).toBeGreaterThan(8_000);
  await testInfo.attach(toArtifactName(route.path, testInfo.project.name), {
    body: screenshot,
    contentType: "image/png",
  });
}

async function assertAxeCriticalAndSeriousClean(
  page: Page,
  path: string,
  testInfo: TestInfo,
): Promise<void> {
  const results = await new AxeBuilder({ page }).include("main").analyze();
  const failures = results.violations.filter(
    (violation) =>
      violation.impact === "critical" || violation.impact === "serious",
  );
  if (failures.length > 0) {
    await testInfo.attach(`axe-${path.replace(/[^a-z0-9]+/gi, "-")}.json`, {
      body: JSON.stringify(failures, null, 2),
      contentType: "application/json",
    });
  }
  expect(
    failures.map((violation) => ({
      description: violation.description,
      id: violation.id,
      impact: violation.impact,
      nodes: violation.nodes.length,
    })),
    `Critical/serious accessibility violations on ${path}`,
  ).toEqual([]);
}

async function expectAnyBodyText(
  page: Page,
  expectedTexts: readonly string[],
): Promise<void> {
  const bodyText = await page.locator("body").innerText();
  const missing = expectedTexts.filter((expected) => !bodyText.includes(expected));
  expect(
    missing,
    `Missing expected text(s): ${expectedTexts.join(" / ")}`,
  ).toEqual([]);
}

async function assertTradeDetailEvidence(page: Page, symbol: string): Promise<void> {
  await expect(
    page.getByRole("heading", { exact: true, name: `${symbol} Trade Review` }),
  ).toBeVisible();
  await expect(page.getByTestId("trade-execution-replay")).toBeVisible();
  await expect(page.locator('[data-testid^="trade-replay-step-"]')).not.toHaveCount(
    0,
  );
  await expect(page.getByTestId("trade-quality")).toBeVisible();
  await expect(page.getByTestId("trade-decision-autopsy")).toBeVisible();
}

test.describe("actual app QA", () => {
  test("captures visual smoke artifacts for core routes", async ({
    page,
  }, testInfo) => {
    test.skip(!isVisualProject(testInfo), "visual smoke runs on desktop and mobile");
    test.setTimeout(120_000);
    const assertNoProblems = collectPageProblems(page);

    for (const route of CORE_VISUAL_ROUTES) {
      await assertVisualHealth(page, route, testInfo);
    }

    assertNoProblems();
  });

  test("passes critical and serious accessibility smoke on core routes", async ({
    page,
  }, testInfo) => {
    test.skip(!isDesktopProject(testInfo), "axe scan runs on desktop");
    test.setTimeout(120_000);
    const assertNoProblems = collectPageProblems(page);

    for (const route of CORE_VISUAL_ROUTES) {
      await visitAndAssert(page, route.path, route.heading);
      await assertAxeCriticalAndSeriousClean(page, route.path, testInfo);
    }

    assertNoProblems();
  });

  test("stress-tests import workflow edits without impossible states", async ({
    page,
  }, testInfo) => {
    test.skip(!isDesktopProject(testInfo), "import stress runs on desktop");
    test.setTimeout(120_000);
    const assertNoProblems = collectPageProblems(page);

    await uploadCsv(page, {
      broker: "generic_execution_csv",
      csvText: presetCsv("preset:unknown-mapping"),
      fileName: "actual-qa-unknown-mapping.csv",
    });
    await expect(page.locator("body")).toContainText(
      "Broker mapping confidence is low",
    );

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
      page.getByRole("heading", { exact: true, name: "Trade Grouping Review" }),
    ).toBeVisible();

    if ((await page.getByTestId("setup-tag-0").count()) === 1) {
      await page.getByTestId("setup-tag-0").selectOption("momentum");
      await expect(page.locator("body")).toContainText("User selected momentum");
    }
    if ((await page.getByTestId("grouping-decision-0").count()) === 1) {
      await page.getByTestId("grouping-decision-0").selectOption("split_later");
      await expect(page.locator("body")).toContainText(
        "1 grouping decision(s) changed",
      );
    }
    if ((await page.getByTestId("feedback-reviewed-checkbox").count()) === 1) {
      await page.getByTestId("feedback-reviewed-checkbox").check();
      await expect(page.locator("body")).toContainText(
        "Feedback preview marked reviewed.",
      );
    }

    await uploadCsv(page, {
      broker: "schwab_transactions",
      csvText: presetCsv("preset:schwab"),
      fileName: "actual-qa-schwab-review.csv",
    });
    await expect(page.locator("body")).toContainText("AMD");
    await expect(page.locator("body")).toContainText("Import row needs review");
    await assertNoProductOverclaims(page);

    assertNoProblems();
  });

  test("keeps metric claims connected to source trade evidence", async ({
    page,
  }, testInfo) => {
    test.skip(!isDesktopProject(testInfo), "evidence links run on desktop");
    const assertNoProblems = collectPageProblems(page);
    const filteredRows = productView.filteredView.rows.filter(
      (row) => row.symbol === "ABCD" && row.grossRealizedPnl < 0,
    );
    const firstFilteredTrade = filteredRows[0];
    const trendPoint =
      shell.progress.analytics.productPolish.executionQualityTrendline.points[0];
    const progressTrade = sampleTrades.find(
      (candidate) => candidate.id === trendPoint.tradeId,
    );
    const reviewStepIndex = shell.guidedReview.steps.findIndex(
      (step) => step.relatedTradeIds.length > 0,
    );
    const reviewTradeId =
      reviewStepIndex >= 0
        ? shell.guidedReview.steps[reviewStepIndex]?.relatedTradeIds[0]
        : undefined;
    const reviewTrade = sampleTrades.find(
      (candidate) => candidate.id === reviewTradeId,
    );

    if (!firstFilteredTrade || !progressTrade || !reviewTrade) {
      throw new Error("Sample data is missing metric-to-evidence fixtures.");
    }

    await visitAndAssert(page, "/analytics", "Analytics");
    await page.getByTestId("analytics-filter-symbol").selectOption("ABCD");
    await page.getByTestId("analytics-filter-outcome").selectOption("loser");
    await page
      .getByTestId(`analytics-filtered-open-${firstFilteredTrade.tradeId}`)
      .click();
    await page.waitForLoadState("networkidle");
    await assertTradeDetailEvidence(page, firstFilteredTrade.symbol);

    await visitAndAssert(page, "/progress", "Trader Progress");
    await page.getByTestId(`progress-quality-link-${progressTrade.id}`).click();
    await page.waitForLoadState("networkidle");
    await assertTradeDetailEvidence(page, progressTrade.symbol);

    await visitAndAssert(page, "/review", shell.guidedReview.title);
    await page
      .getByTestId(`review-related-trade-${reviewTrade.id}-${reviewStepIndex}`)
      .click();
    await page.waitForLoadState("networkidle");
    await assertTradeDetailEvidence(page, reviewTrade.symbol);

    assertNoProblems();
  });

  test("keeps mobile import repair and trade autopsy interaction usable", async ({
    page,
  }, testInfo) => {
    test.skip(!isMobileProject(testInfo), "mobile interaction runs on mobile");
    test.setTimeout(90_000);
    const assertNoProblems = collectPageProblems(page);
    const missingQuantityCsv = [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2026-05-01,09:30:00,MOB,Buy,,10.00",
      "2026-05-01,09:45:00,MOB,Sell,100,10.50",
    ].join("\n");

    await uploadCsv(page, {
      broker: "generic_execution_csv",
      csvText: missingQuantityCsv,
      fileName: "actual-qa-mobile-repair.csv",
    });
    await expect(page.getByTestId("row-repair-2-status")).toHaveText("rejected");
    await page.getByTestId("row-repair-2-quantity").fill("100");
    await expect(page.getByTestId("row-repair-2-status")).toHaveText("accepted");
    await expect(
      page.getByRole("heading", {
        exact: true,
        name: "Execution Feedback Preview",
      }),
    ).toBeVisible();
    await assertNoPageOverflow(page, "/import-dry-run");

    await visitAndAssert(page, "/trades", "Saved Trades");
    await expect(page.locator("body")).toContainText("Review Queue");
    await assertNoPageOverflow(page, "/trades");

    assertNoProblems();
  });

  test("keeps product truthfulness boundaries during real route visits", async ({
    page,
  }, testInfo) => {
    test.skip(!isDesktopProject(testInfo), "truthfulness audit runs on desktop");
    const assertNoProblems = collectPageProblems(page);

    for (const route of CORE_VISUAL_ROUTES) {
      await visitAndAssert(page, route.path, route.heading);
      await assertNoProductOverclaims(page);
    }

    await uploadCsv(page, {
      broker: "generic_execution_csv",
      csvText: presetCsv("preset:open-position"),
      fileName: "actual-qa-truth-open-position.csv",
    });
    await expect(page.locator("body")).toContainText("Market context used: false");
    await assertNoProductOverclaims(page);

    assertNoProblems();
  });

  test("runs CSV torture inputs through the actual dry-run upload control", async ({
    page,
  }, testInfo) => {
    test.skip(!isDesktopProject(testInfo), "CSV torture runs on desktop");
    test.setTimeout(120_000);
    const assertNoProblems = collectPageProblems(page);

    for (const csvCase of CSV_TORTURE_CASES) {
      await uploadCsv(page, {
        broker: csvCase.broker,
        csvText: csvCase.csvText,
        fileName: `actual-qa-${csvCase.name}.csv`,
      });
      await expect(
        page.getByRole("heading", {
          exact: true,
          name: "Import Session Summary",
        }),
      ).toBeVisible();
      await expectAnyBodyText(page, csvCase.expected);
      await assertNoProductOverclaims(page);
    }

    assertNoProblems();
  });

  test("walks the rough product loop like a user", async ({ page }, testInfo) => {
    test.skip(!isDesktopProject(testInfo), "actual app walkthrough runs on desktop");
    test.setTimeout(120_000);
    const assertNoProblems = collectPageProblems(page);
    const missingQuantityCsv = [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2026-05-01,09:30:00,WALK,Buy,,12.00",
      "2026-05-01,10:05:00,WALK,Sell,100,12.75",
    ].join("\n");

    await visitAndAssert(page, "/", "TradersLink Trading Tools");
    await page.locator('a[href="/first-run"]').click();
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("heading", { exact: true, name: "First Run Setup" }),
    ).toBeVisible();

    await page.getByTestId("first-run-action-import-dry-run").click();
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("heading", { exact: true, name: "Import Trades" }),
    ).toBeVisible();
    await page.getByTestId("broker-select").selectOption("generic_execution_csv");
    await page.getByTestId("local-csv-input").setInputFiles({
      buffer: Buffer.from(missingQuantityCsv),
      mimeType: "text/csv",
      name: "actual-qa-walkthrough.csv",
    });
    await expect(page.getByTestId("row-repair-2-status")).toHaveText("rejected");
    await page.getByTestId("row-repair-2-quantity").fill("100");
    await expect(page.getByTestId("row-repair-2-status")).toHaveText("accepted");
    await expect(
      page.getByRole("heading", {
        exact: true,
        name: "Execution Feedback Preview",
      }),
    ).toBeVisible();

    await visitAndAssert(page, "/analytics", "Analytics");
    await visitAndAssert(page, "/trades", "Saved Trades");
    await visitAndAssert(page, "/review", shell.guidedReview.title);
    await visitAndAssert(page, "/progress", "Trader Progress");

    assertNoProblems();
  });
});
