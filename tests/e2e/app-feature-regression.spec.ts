import { Buffer } from "node:buffer";
import { expect, test, type Page, type TestInfo } from "@playwright/test";
import {
  buildImportFacingRouteContract,
  buildProductWorkflowShellViewModel,
  getCsvDryRunSamplePresets,
} from "../../src/lib/trader-analytics";
import type { BrokerExecutionCsvFormat } from "../../src/lib/execution-sources/csv";

const shell = buildProductWorkflowShellViewModel();
const analytics = shell.analytics;

const UNSAFE_SURFACE_PHRASES = [
  "Raw JSON",
  "Debug JSON",
  "Export button",
  "Download report",
  "Download CSV",
  "Export CSV",
  "Guaranteed broker support",
  "Certified broker support",
  "Market-validated setup",
];

const BROKEN_PAGE_PHRASES = [
  "Application error",
  "Unhandled Runtime Error",
  "This page could not be found",
  "Internal Server Error",
  "Hydration failed",
  "ChunkLoadError",
];

const MARKET_CONTEXT_OVERCLAIMS = [
  "market structure used for scoring",
  "market structure used for grade",
  "market structure used for final coaching",
  "market-validated setup",
  "candle-confirmed rule",
  "support/resistance-backed import",
  "final market-structure setup scoring",
];

const BANNED_PRODUCT_PHRASES = [
  "financial advice",
  "trade calls",
  "guaranteed profits",
  "short-seller coaching",
];

const CONFUSING_PRIMARY_UI_PHRASES = [
  "chart-context",
  "chart context",
  "chart context waiting",
  "post-exit check",
  "post-exit checks",
  "risk-backed",
  "strength-backed",
  "volume note",
  "ready_to_save",
  "ready_to_commit",
  "analysis_failed",
  "market_context_unavailable",
  "saved_sqlite",
  "local sqlite",
  "commit readiness",
  "review job",
];

const ROUTE_SMOKE_TARGETS = [
  { path: "/", heading: "TradersLink Trading Tools" },
  { path: "/trader-intelligence", heading: "Trader Intelligence Trade Review" },
  { path: "/workspace", heading: "Trader Workspace" },
  { path: "/upload-csv", heading: "Upload CSV" },
  { path: "/analytics", heading: "Trading Performance Dashboard" },
  { path: "/imports", heading: shell.importReview.title },
  { path: "/import-dry-run", heading: "Import Trades" },
  { path: "/review", heading: shell.guidedReview.title },
  { path: "/progress", heading: "Trader Progress" },
  { path: "/trades", heading: "Saved Trades" },
  { path: "/coach", heading: "Your Trading Coach" },
  {
    path: "/session-recap",
    heading: analytics.productPolish.sessionRecap.headline,
  },
  { path: "/import-health", heading: "Import Health Center" },
  { path: "/import-trials", heading: "Import Trials" },
  { path: "/repair-wizard", heading: "Repair Wizard" },
  {
    path: "/review-cockpit",
    heading: analytics.importTrialExperience.reviewCockpit.title,
  },
  { path: "/calibration", heading: "Calibration" },
  {
    path: "/compare-trades",
    heading:
      analytics.reviewHabitLoop.tradeComparison?.title ?? "More trades needed",
  },
  {
    path: "/onboarding",
    heading: analytics.reviewHabitLoop.onboardingPath.headline,
  },
  { path: "/account", heading: "Account And Plan" },
  { path: "/platform-readiness", heading: "Trader Intelligence Readiness" },
] as const;

const CORE_PRODUCT_ROUTES = [
  { path: "/workspace", heading: "Trader Workspace" },
  { path: "/analytics", heading: "Trading Performance Dashboard" },
  { path: "/coach", heading: "Your Trading Coach" },
  { path: "/trades", heading: "Saved Trades" },
  { path: "/review", heading: shell.guidedReview.title },
  { path: "/progress", heading: "Trader Progress" },
  { path: "/upload-csv", heading: "Upload CSV" },
  { path: "/import-dry-run", heading: "Import Trades" },
  { path: "/imports", heading: shell.importReview.title },
  { path: "/trader-intelligence", heading: "Trader Intelligence Trade Review" },
] as const;

const BROKER_IMPORT_CASES: Array<{
  presetId: string;
  broker: BrokerExecutionCsvFormat;
  expectedSymbol: string;
  expectedCopy?: string;
}> = [
  {
    presetId: "preset:ibkr",
    broker: "ibkr_activity_statement",
    expectedSymbol: "AAPL",
  },
  {
    presetId: "preset:webull",
    broker: "webull_order_history",
    expectedSymbol: "TSLA",
    expectedCopy: "Non-filled order skipped",
  },
  {
    presetId: "preset:robinhood",
    broker: "robinhood_transaction_history",
    expectedSymbol: "NVDA",
  },
  {
    presetId: "preset:moomoo",
    broker: "moomoo_trade_history",
    expectedSymbol: "META",
  },
  {
    presetId: "preset:schwab",
    broker: "schwab_transactions",
    expectedSymbol: "AMD",
    expectedCopy: "Non-execution row skipped",
  },
  {
    presetId: "preset:generic-short",
    broker: "generic_execution_csv",
    expectedSymbol: "SPY",
  },
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

async function assertNoUnsafeSurfaceCopy(page: Page): Promise<void> {
  const bodyText = await page.locator("body").innerText();
  for (const phrase of UNSAFE_SURFACE_PHRASES) {
    expect(
      bodyText,
      `Unsafe product surface appeared: ${phrase}`,
    ).not.toContain(phrase);
  }
  for (const phrase of BROKEN_PAGE_PHRASES) {
    expect(bodyText, `Broken page phrase appeared: ${phrase}`).not.toContain(
      phrase,
    );
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

async function assertNoLargeOldDarkCards(
  page: Page,
  path: string,
): Promise<void> {
  const darkCards = await page
    .locator("main section, main div, main aside, main a")
    .evaluateAll((elements) =>
      elements
        .map((element) => {
          const style = window.getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return {
            area: Math.round(rect.width * rect.height),
            background: style.backgroundColor,
            text: (element.textContent ?? "")
              .replace(/\s+/g, " ")
              .trim()
              .slice(0, 80),
          };
        })
        .filter(
          (item) =>
            item.area > 12000 &&
            item.text.length > 35 &&
            [
              "rgb(2, 6, 23)",
              "rgb(9, 9, 11)",
              "rgb(10, 10, 10)",
              "rgb(24, 24, 27)",
            ].includes(item.background),
        ),
    );

  expect(darkCards, `Old near-black dashboard cards on ${path}`).toEqual([]);
}

async function visitAndAssertRoute(
  page: Page,
  path: string,
  heading: string | RegExp,
): Promise<void> {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  const headingLocator =
    typeof heading === "string"
      ? page.getByRole("heading", { exact: true, name: heading })
      : page.getByRole("heading", { name: heading }).first();
  await expect(
    headingLocator,
    `Missing expected heading on ${path}: ${heading}`,
  ).toBeVisible();
  await expect(page.locator("body")).not.toHaveText("");
  await assertNoUnsafeSurfaceCopy(page);
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
  await openAdvancedUploadSettings(page);
  await page.getByTestId("broker-select").selectOption(args.broker);
  await page.getByTestId("local-csv-input").setInputFiles({
    buffer: Buffer.from(args.csvText),
    mimeType: "text/csv",
    name: args.fileName,
  });
  await expect(page.getByTestId("csv-textarea")).toHaveValue(args.csvText);
}

async function openAdvancedUploadSettings(page: Page): Promise<void> {
  const details = page.getByTestId("import-dry-run-advanced-upload-settings");

  if ((await details.count()) === 0) {
    return;
  }

  const trigger = details.getByText("Show advanced import settings", {
    exact: true,
  });
  const isOpen = (await details.getAttribute("open")) !== null;

  if (!isOpen && (await trigger.isVisible())) {
    await trigger.click();
  }
}

async function openImportReviewDetails(page: Page): Promise<void> {
  const details = page.getByTestId("import-dry-run-review-details");

  if ((await details.count()) === 0) {
    return;
  }

  const trigger = details.getByText("Show import review details", {
    exact: true,
  });
  const isOpen = (await details.getAttribute("open")) !== null;

  if (!isOpen && (await trigger.isVisible())) {
    await trigger.click();
  }
}

function lowerBodyText(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

test.describe("app feature regression", () => {
  test("loads the main end-user routes without unsafe surfaces or browser errors", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const assertNoProblems = collectPageProblems(page);

    for (const route of ROUTE_SMOKE_TARGETS) {
      await visitAndAssertRoute(page, route.path, route.heading);
    }

    assertNoProblems();
  });

  test("walks the guided end-user path from workspace to review outputs", async ({
    page,
  }, testInfo) => {
    test.skip(
      !isDesktopProject(testInfo),
      "guided route crawl runs on desktop",
    );
    test.setTimeout(90_000);
    const assertNoProblems = collectPageProblems(page);
    const routeSteps = [
      {
        path: "/workspace",
        heading: "Trader Workspace",
        testId: "workspace-primary-actions",
        text: "Import trades",
      },
      {
        path: "/upload-csv",
        heading: "Upload CSV",
        testId: "upload-csv-card",
        text: "CSV file",
      },
      {
        path: "/imports",
        heading: shell.importReview.title,
        testId: "import-workflow-step-recover",
        text: "Current",
      },
      {
        path: "/trades",
        heading: "Saved Trades",
        testId: "saved-trades-triage-panel",
        text: "Review priority trade",
      },
      {
        path: "/review?queue=highest_priority",
        heading: shell.guidedReview.title,
        testId: "review-continuation-panel",
        text: "Review This First",
      },
      {
        path: "/coach",
        heading: "Your Trading Coach",
        testId: "saved-review-summary-strip",
        text: /Saved Review Work|Save one broker CSV/,
      },
      {
        path: "/analytics",
        heading: "Trading Performance Dashboard",
        testId: "saved-review-summary-strip",
        text: /Saved Review Work|Save one broker CSV/,
      },
    ] as const;

    for (const step of routeSteps) {
      await visitAndAssertRoute(page, step.path, step.heading);
      await expect(page.getByTestId(step.testId)).toContainText(step.text);
      await assertNoPageOverflow(page, step.path);
    }

    assertNoProblems();
  });

  test("keeps workspace and coach on the updated dashboard surface", async ({
    page,
  }, testInfo) => {
    test.skip(
      !isDesktopProject(testInfo),
      "visual surface scan runs on desktop",
    );
    const assertNoProblems = collectPageProblems(page);

    for (const route of [
      { path: "/workspace", heading: "Trader Workspace" },
      { path: "/coach", heading: "Your Trading Coach" },
    ]) {
      await visitAndAssertRoute(page, route.path, route.heading);
      await expect(page.locator("main")).toHaveClass(/ti-dashboard-bg/);
      await assertNoLargeOldDarkCards(page, route.path);
      await expect(page.locator("body")).not.toContainText("Local SQLite");
      await expect(page.locator("body")).not.toContainText("committed");

      if (route.path === "/workspace") {
        const reviewTile = page
          .getByTestId("workspace-primary-actions")
          .getByRole("link", { name: /Review next trade/ });
        await expect(reviewTile).toHaveAttribute(
          "href",
          /#writing-flow|\/review\?queue=highest_priority/,
        );
        await expect(
          page.getByRole("link", { exact: true, name: "Session Recap" }),
        ).toHaveCount(0);
        await expect(
          page.getByRole("link", { exact: true, name: "Compare Trades" }),
        ).toHaveCount(0);
        await expect(
          page.getByRole("link", { exact: true, name: "Onboarding" }),
        ).toHaveCount(0);
        await expect(
          page.getByText("Trade review workflow", { exact: true }),
        ).toBeVisible();
        await expect(
          page.getByText("Your next step", { exact: true }),
        ).toBeVisible();
        await expect(
          page.getByText("Chart data still missing", { exact: true }).first(),
        ).toBeVisible();
        await expect(
          page.getByText("More review tools", { exact: true }),
        ).toBeVisible();
        await expect(
          page.getByText("Beta storage and admin notes", { exact: true }),
        ).toBeVisible();
        await expect(
          page.getByText("Current Beta Boundary", { exact: true }),
        ).toHaveCount(0);
        await expect(
          page.getByText("Internal tools", { exact: true }),
        ).toHaveCount(0);
      }
    }

    assertNoProblems();
  });

  test("keeps import reporting surfaces explicit about write safety and cost policy", async ({
    page,
  }) => {
    const contract = buildImportFacingRouteContract();

    for (const route of contract.routes) {
      await page.goto(route.path);
      if (route.path === "/imports") {
        await page
          .getByText("Advanced import details", { exact: true })
          .click();
      }
      const policy = page.getByTestId(route.policyTestId);

      await expect(
        policy,
        `Missing import policy band for ${route.path}`,
      ).toBeVisible();
      for (const text of route.requiredText) {
        await expect(
          policy,
          `Missing import policy text on ${route.path}: ${text}`,
        ).toContainText(text);
      }
    }
  });

  test("parses representative broker CSV files through the actual import UI", async ({
    page,
  }, testInfo) => {
    test.skip(!isDesktopProject(testInfo), "broker matrix runs on desktop");
    test.setTimeout(90_000);
    const assertNoProblems = collectPageProblems(page);

    for (const brokerCase of BROKER_IMPORT_CASES) {
      await uploadCsv(page, {
        broker: brokerCase.broker,
        csvText: presetCsv(brokerCase.presetId),
        fileName: `${brokerCase.presetId.replace(/[^a-z0-9]+/gi, "-")}.csv`,
      });
      await openImportReviewDetails(page);
      await expect(
        page.getByRole("heading", {
          exact: true,
          name: "Import Session Summary",
        }),
      ).toBeVisible();
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
      await expect(page.locator("body")).toContainText(
        brokerCase.expectedSymbol,
      );
      if (brokerCase.expectedCopy) {
        await expect(page.locator("body")).toContainText(
          brokerCase.expectedCopy,
        );
      }
      await assertNoUnsafeSurfaceCopy(page);
    }

    assertNoProblems();
  });

  test("shows the expected import repair states and lets a user repair a row", async ({
    page,
  }, testInfo) => {
    test.skip(!isDesktopProject(testInfo), "repair matrix runs on desktop");
    test.setTimeout(90_000);
    const assertNoProblems = collectPageProblems(page);
    const missingQuantityCsv = [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2026-05-01,09:30:00,ABCD,Buy,,10.00",
      "2026-05-01,09:35:00,ABCD,Sell,100,11.00",
    ].join("\n");
    const badTimestampCsv = [
      "Date,Time,Symbol,Side,Quantity,Price",
      "BAD,09:30:00,ABCD,Buy,100,10.00",
      "2026-05-01,09:35:00,ABCD,Sell,100,11.00",
    ].join("\n");
    const duplicateFillCsv = [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2026-05-01,09:30:00,ABCD,Buy,100,10.00",
      "2026-05-01,09:30:00,ABCD,Buy,100,10.00",
      "2026-05-01,09:35:00,ABCD,Sell,200,11.00",
    ].join("\n");
    const oddHeaderAliasCsv = [
      "Ticker,Executed At,Action,Qty,Fill Price,Status,Commission,Fees,Net Amount",
      "ALTX,05/01/2026 09:30:00 AM,BOT,50,$10.00,Filled,$0.50,$0.02,-500.52",
      "ALTX,2026-05-01 09:32:00,BOT,50,10.10,Filled,0.50,0.02,-505.52",
      "ALTX,2026-05-01 09:50:00,SLD,40,10.40,Filled,0.50,0.02,415.48",
      "ALTX,2026-05-01 10:05:00,SLD,60,10.70,Filled,0.50,0.02,641.48",
    ].join("\n");
    const zeroAndBlankQuantityCsv = [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2026-05-01,09:30:00,ZBQT,Buy,0,10.00",
      "2026-05-01,09:32:00,ZBQT,Buy,,10.10",
      "2026-05-01,10:00:00,ZBQT,Sell,200,10.50",
    ].join("\n");
    const shortAliasCsv = [
      "Date,Time,Ticker,Action,Shares,Average Fill Price",
      "2026-05-01,09:30:00,CVRS,SELL SHORT,100,20.00",
      "2026-05-01,09:45:00,CVRS,BUY TO COVER,40,19.40",
      "2026-05-01,10:15:00,CVRS,BUY TO COVER,60,19.10",
    ].join("\n");
    const badMappingCsv = [
      "When,Ticker,Action,Shares,Fill",
      "2026-05-01 09:30:00,ABCD,Buy,100,10.00",
      "2026-05-01 09:35:00,ABCD,Sell,100,11.00",
    ].join("\n");

    await uploadCsv(page, {
      broker: "generic_execution_csv",
      csvText: missingQuantityCsv,
      fileName: "missing-quantity.csv",
    });
    await expect(page.getByTestId("row-repair-2-status")).toHaveText(
      "rejected",
    );
    await page.getByTestId("row-repair-2-quantity").fill("100");
    await expect(page.getByTestId("row-repair-2-status")).toHaveText(
      "accepted",
    );
    await expect(page.locator("body")).toContainText(
      "The import is ready for dry-run feedback review.",
    );

    await uploadCsv(page, {
      broker: "generic_execution_csv",
      csvText: badTimestampCsv,
      fileName: "bad-timestamp.csv",
    });
    await expect(page.getByTestId("row-repair-2-status")).toHaveText(
      "rejected",
    );
    await expect(page.locator("body")).toContainText("Timestamp needs review");

    await uploadCsv(page, {
      broker: "generic_execution_csv",
      csvText: presetCsv("preset:unknown-mapping"),
      fileName: "unknown-headers.csv",
    });
    await expect(page.locator("body")).toContainText("Required column missing");
    await expect(page.locator("body")).toContainText(
      "Broker mapping confidence is low",
    );

    await uploadCsv(page, {
      broker: "webull_order_history",
      csvText: presetCsv("preset:webull"),
      fileName: "webull-cancelled.csv",
    });
    await expect(page.locator("body")).toContainText(
      "Non-filled order skipped",
    );

    await uploadCsv(page, {
      broker: "generic_execution_csv",
      csvText: presetCsv("preset:open-position"),
      fileName: "open-position.csv",
    });
    await expect(page.locator("body")).toContainText("Open Position Leftover");

    await uploadCsv(page, {
      broker: "generic_execution_csv",
      csvText: duplicateFillCsv,
      fileName: "duplicate-fill.csv",
    });
    await expect(page.locator("body")).toContainText(
      "Duplicate-like fill cluster",
    );

    await uploadCsv(page, {
      broker: "generic_execution_csv",
      csvText: oddHeaderAliasCsv,
      fileName: "odd-header-aliases.csv",
    });
    await expect(page.locator("body")).toContainText("ALTX");
    await expect(page.locator("body")).toContainText("Partial Exit");
    await expect(page.getByTestId("cost-visibility-panel")).toContainText(
      "present",
    );

    await uploadCsv(page, {
      broker: "generic_execution_csv",
      csvText: shortAliasCsv,
      fileName: "short-side-aliases.csv",
    });
    await expect(page.locator("body")).toContainText("CVRS");
    await expect(page.locator("body")).toContainText("short");

    await uploadCsv(page, {
      broker: "generic_execution_csv",
      csvText: zeroAndBlankQuantityCsv,
      fileName: "zero-blank-quantity.csv",
    });
    await expect(page.locator("body")).toContainText("Invalid quantity");
    await expect(page.getByTestId("row-repair-2-status")).toHaveText(
      "rejected",
    );
    await expect(page.getByTestId("row-repair-3-status")).toHaveText(
      "rejected",
    );

    await uploadCsv(page, {
      broker: "generic_execution_csv",
      csvText: badMappingCsv,
      fileName: "bad-mapping.csv",
    });
    await expect(page.locator("body")).toContainText(
      "Broker mapping confidence is low",
    );

    assertNoProblems();
  });

  test("shows the analytics product intelligence surfaces", async ({
    page,
  }, testInfo) => {
    test.skip(
      !isDesktopProject(testInfo),
      "deep product assertions run on desktop",
    );
    test.setTimeout(120_000);
    const assertNoProblems = collectPageProblems(page);

    await visitAndAssertRoute(
      page,
      "/analytics",
      "Trading Performance Dashboard",
    );
    const analyticsMenu = page.getByRole("navigation", {
      name: "Analytics Menu",
    });
    await expect(
      analyticsMenu.getByRole("link", { name: "Overview" }),
    ).toHaveAttribute("aria-current", "page");
    for (const route of [
      { href: "/analytics/results", label: "Results" },
      { href: "/analytics/timing", label: "Timing" },
      { href: "/analytics/behavior", label: "Behavior" },
      { href: "/analytics/ticker-stories", label: "Ticker Stories" },
      { href: "/analytics/session-stories", label: "Session Stories" },
      { href: "/analytics/chart-evidence", label: "Chart Evidence" },
      { href: "/analytics/review-plan", label: "Behavior Review Plan" },
      { href: "/analytics/trade-explorer", label: "Trade Explorer" },
      { href: "/analytics/details", label: "More Details" },
    ]) {
      await expect(
        analyticsMenu.locator(`a[href="${route.href}"]`),
      ).toContainText(route.label);
    }
    await expect(page.getByTestId("analytics-category-access")).toContainText(
      "Results",
    );
    await expect(page.getByTestId("analytics-category-access")).toContainText(
      "Timing",
    );
    await expect(page.getByTestId("analytics-category-access")).toContainText(
      "Behavior",
    );
    await expect(page.getByTestId("analytics-category-access")).toContainText(
      "Ticker Stories",
    );
    await expect(page.getByTestId("analytics-category-access")).toContainText(
      "Session Stories",
    );
    await expect(page.getByTestId("analytics-category-access")).toContainText(
      "Chart Evidence",
    );
    await expect(page.getByTestId("analytics-story-panel")).toContainText(
      "What happened in this trade set",
    );

    await page.goto("/analytics/behavior");
    await expect(page.getByTestId("analytics-behavior-report")).toContainText(
      "Behavior Report",
    );
    await expect(page.getByTestId("analytics-behavior-report")).toContainText(
      "Entries Under Resistance",
    );
    await expect(page.getByTestId("analytics-behavior-report")).toContainText(
      "Support-Based Entries",
    );
    await expect(page.getByTestId("analytics-behavior-report")).toContainText(
      "Chase And Extension Review",
    );
    await expect(page.getByTestId("analytics-behavior-report")).toContainText(
      "Dip-Buy And Add Review",
    );
    await expect(page.getByTestId("analytics-behavior-report")).toContainText(
      "Profit Protection",
    );

    await page.goto("/analytics/ticker-stories");
    await expect(
      page.getByTestId("analytics-ticker-story-panel"),
    ).toContainText("Ticker Story Analytics");
    await expect(
      page.getByTestId("analytics-ticker-story-panel"),
    ).toContainText("Same-symbol re-entries");
    await expect(
      page.getByTestId("analytics-ticker-story-panel"),
    ).toContainText("Repeated Losses");
    await expect(
      page.getByTestId("analytics-ticker-story-panel"),
    ).toContainText("Support/Resistance Exits");
    await expect(
      page.getByTestId("analytics-ticker-story-panel"),
    ).toContainText("Support/Resistance Exits");

    await page.goto("/analytics/session-stories");
    await expect(
      page.getByTestId("analytics-session-story-panel"),
    ).toContainText("Session Story Analytics");
    await expect(
      page.getByTestId("analytics-session-story-panel"),
    ).toContainText("Green To Red");
    await expect(
      page.getByTestId("analytics-session-story-panel"),
    ).toContainText("High Trade Count");

    await page.goto("/analytics/chart-evidence");
    await expect(
      page.getByTestId("analytics-chart-evidence-panel"),
    ).toContainText("Support/Resistance Exits");
    await expect(
      page.getByTestId("analytics-chart-evidence-panel"),
    ).toContainText("Volume Evidence");

    await page.goto("/analytics/results");
    await expect(page.getByText("Daily P/L Calendar")).toBeVisible();
    await expect(page.getByTestId("analytics-chart-gross_pnl_by_trade")).toBeVisible();

    await page.goto("/analytics/timing");
    for (const chartId of [
      "analytics-chart-entry_session_performance",
      "analytics-chart-entry_hour_performance",
    ]) {
      await expect(page.getByTestId(chartId)).toBeVisible();
    }
    await expect(page.getByText("Daily P/L Calendar")).toHaveCount(0);
    await expect(page.getByTestId("analytics-chart-gross_pnl_by_trade")).toHaveCount(0);
    await expect(page.getByTestId("analytics-chart-behavior_risk_rates")).toHaveCount(0);

    await page.goto("/analytics/review-plan");
    for (const heading of [
      "Daily Coach Report",
      "Best / Worst Finder",
      "Unified Review Queue",
      "Mistake Cost Estimate",
      "Rule Builder",
      "Coach Review Queue",
      "Behavior Trends",
    ]) {
      await expect(
        page.getByRole("heading", { exact: true, name: heading }),
      ).toBeVisible();
    }

    await page.goto("/analytics/details");
    for (const heading of ["Rule Tracker"]) {
      await expect(
        page.getByRole("heading", { exact: true, name: heading }),
      ).toBeVisible();
    }

    assertNoProblems();
  });

  test("shows the coach product loop with calibrated coaching surfaces", async ({
    page,
  }, testInfo) => {
    test.skip(
      !isDesktopProject(testInfo),
      "deep coach assertions run on desktop",
    );
    const assertNoProblems = collectPageProblems(page);

    await visitAndAssertRoute(page, "/coach?demo=sample", "Your Trading Coach");
    const coachMenu = page.getByRole("navigation", { name: "Coach Menu" });
    await expect(
      coachMenu.getByRole("link", { name: "Overview" }),
    ).toHaveAttribute("aria-current", "page");
    for (const route of [
      { href: "/coach/review-session", label: "Review Session" },
      { href: "/coach/behavior-sequence", label: "Behavior Sequence" },
      { href: "/coach/review-backlog", label: "Review Backlog" },
      { href: "/coach/ticker-stories", label: "Ticker Stories" },
      { href: "/coach/session-stories", label: "Session Stories" },
      { href: "/coach/next-session", label: "Next Session" },
      { href: "/coach/progress", label: "Progress" },
      { href: "/coach/details", label: "More Details" },
    ]) {
      await expect(
        coachMenu.getByRole("link", { name: route.label }),
      ).toHaveAttribute("href", route.href);
      await expect(page.getByTestId("coach-feature-routes")).toContainText(
        route.label,
      );
    }
    await expect(page.getByTestId("coach-guided-session")).toHaveCount(0);
    await expect(page.getByTestId("coach-primary-action")).toContainText(
      "Current Coaching Focus",
    );
    await expect(page.getByTestId("coach-primary-action")).toContainText(
      "Pattern Across Trades",
    );
    await expect(page.getByTestId("coach-primary-action")).toContainText(
      "Evidence Trades",
    );

    await page.goto("/coach/review-session?demo=sample");
    await expect(
      page
        .getByRole("navigation", { name: "Coach Menu" })
        .getByRole("link", { name: "Review Session" }),
    ).toHaveAttribute("aria-current", "page");
    await expect(
      page.getByRole("heading", {
        exact: true,
        name: "Work the focus, then prove it with trades.",
      }),
    ).toBeVisible();
    await expect(
      page.getByTestId("coach-featured-trade-session"),
    ).toContainText("Featured Evidence Trade");
    await expect(
      page.getByTestId("coach-featured-trade-session"),
    ).toContainText(/Main behavior|Import a broker CSV/);
    await expect(
      page.getByTestId("coach-featured-trade-session"),
    ).toContainText("What this means");
    await expect(
      page.getByTestId("coach-featured-trade-session"),
    ).toContainText("Why this matters");
    await expect(
      page.getByTestId("coach-featured-trade-session"),
    ).toContainText("Fix first");
    await expect(
      page.getByTestId("coach-featured-trade-session"),
    ).toContainText("What happened");
    await expect(
      page.getByTestId("coach-featured-trade-session"),
    ).toContainText("What to do next");
    await expect(page.getByTestId("coach-guided-session")).toContainText(
      "Work the focus, then prove it with trades.",
    );
    const coachReplayHref = await page
      .getByTestId("coach-session-workflow")
      .getByRole("link", { name: /Replay trade|Import trades/ })
      .first()
      .getAttribute("href");
    expect(coachReplayHref).toBeTruthy();
    if (coachReplayHref?.startsWith("/trades/")) {
      expect(coachReplayHref).toContain("#execution");
    }

    await page.goto("/coach/review-backlog?demo=sample");
    await expect(
      page.getByTestId("coach-review-backlog-preview"),
    ).toContainText("Trades To Review Next");

    await page.goto("/coach/behavior-sequence?demo=sample");
    await expect(page.getByTestId("coach-behavior-sequence")).toContainText(
      "Behavior Coaching Sequence",
    );
    await expect(page.getByTestId("coach-behavior-sequence")).toContainText(
      "Top risk to reduce",
    );
    await expect(page.getByTestId("coach-behavior-sequence")).toContainText(
      "Top strength to repeat",
    );
    await expect(page.getByTestId("coach-behavior-sequence")).toContainText(
      "Trades that prove it",
    );
    await expect(page.getByTestId("coach-behavior-report")).toHaveCount(0);

    await page.goto("/coach/ticker-stories?demo=sample");
    await expect(page.getByTestId("coach-ticker-story-panel")).toContainText(
      "Ticker Story Coach",
    );
    await expect(page.getByTestId("coach-ticker-story-panel")).toContainText(
      "Round trips stay separate for accounting",
    );
    await expect(page.getByTestId("coach-ticker-story-panel")).toContainText(
      "Support/Resistance Exits",
    );
    await expect(
      page.getByTestId("coach-ticker-story-panel"),
    ).not.toContainText("revenge");

    await page.goto("/coach/session-stories?demo=sample");
    await expect(page.getByTestId("coach-session-story-panel")).toContainText(
      "Session Story Coach",
    );
    await expect(page.getByTestId("coach-session-story-panel")).toContainText(
      "green-to-red",
    );
    await expect(
      page.getByTestId("coach-session-story-panel"),
    ).not.toContainText("revenge");
    await expect(page.locator("body")).not.toContainText("Today's review card");
    await expect(page.locator("body")).not.toContainText(
      "What to work on today",
    );

    await page.goto("/coach/next-session?demo=sample");
    await expect(page.getByTestId("coach-next-session-plan")).toContainText(
      "Rule To Use",
    );
    await expect(page.getByTestId("coach-next-session-plan")).toContainText(
      "Quick Checklist",
    );

    await page.goto("/coach/details?demo=sample");
    await expect(page.getByTestId("coach-supporting-details")).toContainText(
      "Supporting coach evidence, queue totals, and rule checks",
    );
    await expect(page.getByTestId("coach-behavior-report")).toBeVisible();

    await visitAndAssertRoute(page, "/coach?demo=sample", "Your Trading Coach");
    const coachPrimaryLinks = page
      .getByTestId("coach-primary-action")
      .getByRole("link", { name: /Open evidence trade|Import trades/ });
    expect(await coachPrimaryLinks.count()).toBeGreaterThan(0);
    const coachPrimaryHref = await coachPrimaryLinks.first().getAttribute("href");
    expect(coachPrimaryHref).toBeTruthy();
    if (coachPrimaryHref?.startsWith("/trades/")) {
      expect(coachPrimaryHref).toContain("#writing-flow");
      await page.goto(coachPrimaryHref);
      await page.waitForLoadState("networkidle");
      await expect(page.getByTestId("trade-coach-handoff")).toContainText(
        "Coach Handoff",
      );
      await expect(page.getByTestId("trade-coach-handoff")).toContainText(
        "Current coaching focus",
      );
      await expect(page.getByTestId("trade-review-workspace")).toContainText(
        "Prove or reject the coaching focus",
      );
      await expect(
        page.getByRole("link", { exact: true, name: "Back to coach" }),
      ).toBeVisible();
      await visitAndAssertRoute(page, "/coach", "Your Trading Coach");
    }
    await page.goto("/coach/details?demo=sample");
    await expect(page.locator("body")).toContainText("review prompt");
    await expect(page.locator("body")).toContainText("Open coaching evidence");
    await expect(page.locator("body")).toContainText("Execution-only");

    assertNoProblems();
  });

  test("shows beginner-safe Trader Intelligence mock trade reviews", async ({
    page,
  }, testInfo) => {
    test.skip(
      !isDesktopProject(testInfo),
      "mock review assertions run on desktop",
    );
    const assertNoProblems = collectPageProblems(page);

    await visitAndAssertRoute(
      page,
      "/trader-intelligence?case=chase-entry",
      "Trader Intelligence Trade Review",
    );
    await expect(
      page.getByTestId("trader-intelligence-primary-review"),
    ).toContainText("Main issue: You chased the entry.");
    await expect(
      page.getByRole("heading", { exact: true, name: "Evidence" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { exact: true, name: "Quick explanations" }),
    ).toBeVisible();
    await expect(
      page.getByText("Advanced analysis details", { exact: true }),
    ).toBeVisible();

    const defaultCopy = await page.locator("body").innerText();
    for (const internalTerm of [
      "patternId",
      "suppressedBehaviorIds",
      "normalizedPatterns",
      "dominantFamily",
      "behaviorPriorityScore",
      "structural_composite",
      "scoreBand",
      "conflictResolutionReason",
      "overextended_chase_entry_structure",
    ]) {
      expect(
        defaultCopy,
        `Internal term leaked by default: ${internalTerm}`,
      ).not.toContain(internalTerm);
    }

    for (const caseLabel of [
      "Poor profit protection",
      "Premature exit",
      "Adding into weakness",
      "Strong profit protection",
      "Structured execution",
      "Mixed evidence",
      "Needs more data",
    ]) {
      await expect(
        page.getByRole("link", { exact: true, name: caseLabel }),
      ).toBeVisible();
    }

    await page
      .getByRole("link", { exact: true, name: "Needs more data" })
      .click();
    await expect(
      page.getByTestId("trader-intelligence-primary-review"),
    ).toContainText("Review status: Needs more data.");
    await expect(
      page.getByTestId("trader-intelligence-review-metrics"),
    ).toContainText("Needs more data");

    assertNoProblems();
  });

  test("shows saved trade routing and review entry points", async ({
    page,
  }, testInfo) => {
    test.skip(
      !isDesktopProject(testInfo),
      "deep product assertions run on desktop",
    );
    test.setTimeout(120_000);
    const assertNoProblems = collectPageProblems(page);

    await visitAndAssertRoute(page, "/trades", "Saved Trades");
    const tradesMenu = page.getByRole("navigation", { name: "Trades Menu" });
    await expect(
      tradesMenu.getByRole("link", { name: "Overview" }),
    ).toHaveAttribute("aria-current", "page");
    await expect(
      tradesMenu.getByRole("link", { name: "Calendar" }),
    ).toHaveAttribute("href", /\/trades\/calendar/);
    await expect(
      tradesMenu.getByRole("link", { name: "Day Sessions" }),
    ).toHaveAttribute("href", "/trades/day-sessions#session-stories");
    await expect(
      tradesMenu.getByRole("link", { name: "Ticker Stories" }),
    ).toHaveAttribute("href", "/trades/ticker-stories#ticker-stories");
    await expect(
      tradesMenu.getByRole("link", { name: "Round Trips" }),
    ).toHaveAttribute("href", "/trades/round-trips#trade-list");
    await expect(
      tradesMenu.getByRole("link", { name: "Needs Review" }),
    ).toHaveAttribute("href", "/trades/review-needed#trade-list");
    await expect(
      tradesMenu.getByRole("link", { name: "Open/Swing" }),
    ).toHaveAttribute("href", "/trades/open-swing#trade-list");
    await expect(
      page.getByRole("heading", { exact: true, name: "Browse Saved Trades" }),
    ).toBeVisible();
    await expect(page.getByTestId("saved-trade-browse-modes")).toContainText(
      "Round Trips",
    );
    await expect(page.getByTestId("saved-trade-browse-modes")).toContainText(
      "Ticker Stories",
    );
    await expect(page.getByTestId("saved-trade-browse-modes")).toContainText(
      "Day Sessions",
    );
    await expect(page.getByTestId("saved-trade-browse-modes")).toContainText(
      "Calendar",
    );
    await expect(page.getByTestId("saved-trade-browse-modes")).toContainText(
      "Open/Swing",
    );
    await expect(page.getByTestId("saved-trade-browse-modes")).toContainText(
      "Needs Review",
    );
    await expect(page.getByTestId("saved-trade-browse-modes")).toContainText(
      "flat-to-flat trade",
    );
    await expect(page.getByTestId("saved-trades-workflow")).toContainText(
      "Browse saved trades without losing the review path",
    );
    await expect(page.getByTestId("saved-trades-workflow")).toContainText(
      "Open workspace",
    );
    await expect(page.locator("body")).toContainText("Open review queue");
    await expect(page.locator("body")).toContainText("All Saved Trades");
    await expect(page.getByTestId("saved-trade-browse-modes")).toContainText(
      "Current view: Day sessions",
    );
    await expect(page.getByTestId("saved-trade-month-calendar")).toHaveCount(0);
    await expect(page.locator("#trade-list")).toHaveCount(0);
    await page.goto("/trades/calendar?month=2026-04#calendar");
    await expect(
      page
        .getByRole("navigation", { name: "Trades Menu" })
        .getByRole("link", { name: "Calendar" }),
    ).toHaveAttribute("aria-current", "page");
    await expect(page.getByTestId("saved-trade-month-calendar")).toContainText(
      "April 2026",
    );
    await expect(page.getByTestId("saved-trade-month-calendar")).toContainText(
      "Month P/L",
    );
    await expect(page.getByTestId("saved-trade-month-calendar")).toContainText(
      "Green days",
    );
    await expect(page.getByTestId("saved-trade-month-calendar")).toContainText(
      "Red days",
    );
    await expect(page.getByTestId("saved-trade-month-calendar")).not.toContainText(
      "Sat",
    );
    await expect(page.getByTestId("calendar-day-2026-04-01")).toContainText(
      "CYCN",
    );
    await page.getByTestId("calendar-day-2026-04-01").click();
    await expect(page).toHaveURL(/\/trades\/day-session\/2026-04-01/, {
      timeout: 30_000,
    });
    await expect(page.getByTestId("saved-trade-day-session-detail")).toContainText(
      "Ticker Story",
      { timeout: 30_000 },
    );
    await page.goto("/trades/day-sessions#session-stories");
    await expect(
      page.getByTestId("saved-trade-session-stories"),
    ).toContainText("Open day session");
    const daySessionLink = page
      .getByTestId("saved-trade-session-stories")
      .getByRole("link", { name: "Open day session" })
      .first();
    await daySessionLink.click();
    await expect(page).toHaveURL(/\/trades\/day-session\//, { timeout: 30_000 });
    await expect(page.getByTestId("saved-trade-day-session-detail")).toContainText(
      "Ticker Story",
      { timeout: 30_000 },
    );

    await page.goto("/trades/ticker-stories#ticker-stories");
    await expect(page.getByTestId("saved-trade-thread-stories")).toContainText(
      "Ticker Stories",
    );
    await expect(page.getByTestId("saved-trade-thread-stories")).toContainText(
      "Support/resistance exits",
    );
    await expect(page.getByTestId("saved-trade-thread-stories")).toContainText(
      "Open ticker story",
    );
    await expect(page.locator("body")).toContainText("Round Trip");
    await expect(page.locator("body")).toContainText("re-entry");
    await page
      .getByTestId("saved-trade-thread-stories")
      .getByRole("link", { name: "Open ticker story" })
      .first()
      .click();
    await expect(page).toHaveURL(/\/trades\/ticker-story\//, {
      timeout: 60_000,
    });
    await expect(page.getByTestId("ticker-story-detail-page")).toContainText(
      "Ticker Story",
    );
    await expect(page.getByTestId("ticker-story-round-trips")).toContainText(
      "Round Trip",
    );
    await page.goto("/trades/ticker-story/CYCN%3A2026-04-01", {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByTestId("ticker-story-hold-continuation")).toContainText(
      "Hold Continuation",
      { timeout: 30_000 },
    );
    await expect(page.getByTestId("ticker-story-hold-continuation")).toContainText(
      "Extended same-day hold",
    );
    await expect(page.getByTestId("ticker-story-hold-continuation")).toContainText(
      "Open continuation replay",
    );
    await page.goto("/trades/day-sessions#session-stories");
    await expect(page.getByTestId("saved-trade-session-stories")).toContainText(
      "Day Sessions",
    );
    await expect(page.getByTestId("saved-trade-session-stories")).toContainText(
      "Green-to-red",
    );

    assertNoProblems();
  });

  test("shows the guided review workflow", async ({ page }, testInfo) => {
    test.skip(
      !isDesktopProject(testInfo),
      "deep product assertions run on desktop",
    );
    test.setTimeout(90_000);
    const assertNoProblems = collectPageProblems(page);

    await visitAndAssertRoute(page, "/review", shell.guidedReview.title);
    await expect(page.getByTestId("review-work-order")).toContainText(
      "Open Trade Review",
    );
    await expect(page.getByTestId("review-work-order")).toContainText(
      "Replay executions",
    );
    await expect(page.getByTestId("review-work-order")).toContainText(
      "before using chart or level findings",
    );
    await expect(page.getByTestId("review-work-order")).toContainText(
      "Check progress",
    );
    await expect(
      page.getByTestId("review-session-story-handoff"),
    ).toContainText("Session Review Handoff");
    await expect(
      page.getByTestId("review-session-story-handoff"),
    ).toContainText("strengths worth repeating");
    await expect(page.getByTestId("saved-review-queue")).toContainText(
      "Why it is here",
    );
    await expect(page.getByTestId("saved-review-queue")).toContainText(
      "Do this now",
    );
    await expect(page.getByTestId("saved-review-queue")).toContainText(
      "Evidence status",
    );
    await expect(page.getByTestId("saved-review-queue")).toContainText(
      "Evidence counts and technical limits",
    );
    const reviewHref = await page
      .getByTestId("review-continuation-panel")
      .getByRole("link", { name: "Open Trade Review" })
      .getAttribute("href");
    expect(reviewHref).toBeTruthy();
    expect(reviewHref).toContain("#writing-flow");
    const replayHref = await page
      .getByTestId("review-work-order")
      .getByRole("link", { name: "Replay executions" })
      .getAttribute("href");
    expect(replayHref).toBeTruthy();
    expect(replayHref).toContain("#execution");
    await page.goto(reviewHref!);
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByTestId("trade-detail-workflow-handoff"),
    ).toContainText("Replay, decide, write, then continue");
    await expect(
      page.getByTestId("trade-detail-workflow-handoff"),
    ).toContainText("Replay executions");
    await expect(page.getByTestId("trade-review-writing-flow")).toContainText(
      "Behavior to name",
    );
    await expect(page.getByTestId("trade-review-writing-flow")).toContainText(
      "Fix first",
    );
    await expect(page.getByTestId("trade-session-story-handoff")).toContainText(
      "Session Story",
    );
    await expect(page.getByTestId("trade-session-story-handoff")).toContainText(
      "Open day session",
    );
    await expect(page.getByTestId("trade-detail-context-trail")).toContainText(
      "Day Session",
    );
    await expect(page.getByTestId("trade-visual-replay")).toBeVisible();
    await expect(
      page.getByTestId("trade-execution-replay-chart"),
    ).toBeVisible();
    await expect(
      page.getByTestId("trade-execution-replay-chart"),
    ).toContainText("Execution Price Path");
    await expect(page.getByTestId("trade-execution-strip")).toContainText(
      "Position",
    );
    await expect(page.getByTestId("trade-position-progression")).toContainText(
      "Realized P/L path",
    );
    await expect(page.getByTestId("trade-supporting-details")).toContainText(
      "More evidence, comparisons, and writing prompts",
    );
    await expect(page.getByTestId("persisted-review-actions")).toContainText(
      "Write The Review Note",
    );
    await expect(page.getByTestId("review-completion-handoff")).toContainText(
      "After Saving This Review",
    );
    await expect(page.getByTestId("review-completion-handoff")).toContainText(
      "Check Progress",
    );
    await visitAndAssertRoute(page, "/review", shell.guidedReview.title);
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

    assertNoProblems();
  });

  test("shows the progress and behavior visual surfaces", async ({
    page,
  }, testInfo) => {
    test.skip(
      !isDesktopProject(testInfo),
      "deep product assertions run on desktop",
    );
    const assertNoProblems = collectPageProblems(page);

    await visitAndAssertRoute(page, "/progress", "Trader Progress");
    await expect(page.getByTestId("progress-saved-source")).toContainText(
      /Saved import data|Progress unlocks/,
    );
    await expect(page.getByTestId("progress-saved-data-strip")).toContainText(
      "Saved Trades",
    );
    await expect(page.getByTestId("progress-saved-data-strip")).toContainText(
      "Completed Round Trips",
    );
    await expect(page.getByTestId("progress-review-completion")).toContainText(
      "Review Completion",
    );
    await expect(page.getByTestId("progress-ticker-stories")).toContainText(
      "Ticker Story Progress",
    );
    await expect(page.getByTestId("progress-ticker-stories")).toContainText(
      "Track whether re-entries are improving.",
    );
    await expect(page.getByTestId("progress-ticker-stories")).toContainText(
      "Repeated Losses",
    );
    await expect(page.getByTestId("progress-ticker-stories")).toContainText(
      "Support/Resistance Exits",
    );
    await expect(page.getByTestId("progress-session-stories")).toContainText(
      "Session Story Progress",
    );
    await expect(page.getByTestId("progress-session-stories")).toContainText(
      "Green To Red",
    );
    await expect(page.getByTestId("progress-coach-focus")).toContainText(
      "Active Coaching Focus",
    );
    await expect(page.getByTestId("progress-coach-focus")).toContainText(
      "Open coaching focus",
    );
    const progressTradeLinks = page.locator(
      '[data-testid^="progress-quality-link-"]',
    );
    if ((await progressTradeLinks.count()) > 0) {
      const href = await progressTradeLinks.first().getAttribute("href");
      expect(href).toBeTruthy();
      expect(href).toContain("#writing-flow");
    }
    for (const heading of [
      "Score Dimensions",
      "Rule Effectiveness",
      "Quality By Trade",
      "Mistake Reduction Targets",
      "Execution Quality Trendline",
      "Behavior Change Tracker",
      "Review Habits",
      "Report History",
    ]) {
      await expect(
        page.getByRole("heading", { exact: true, name: heading }),
      ).toBeVisible();
    }

    assertNoProblems();
  });

  test("keeps core mobile routes usable without page-level horizontal overflow", async ({
    page,
  }, testInfo) => {
    test.skip(!isMobileProject(testInfo), "mobile-only regression");
    test.setTimeout(120_000);
    const assertNoProblems = collectPageProblems(page);

    for (const route of CORE_PRODUCT_ROUTES) {
      await visitAndAssertRoute(page, route.path, route.heading);
      await assertNoPageOverflow(page, route.path);
    }

    assertNoProblems();
  });

  test("captures visual smoke screenshots for core product routes", async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    const assertNoProblems = collectPageProblems(page);

    for (const route of CORE_PRODUCT_ROUTES) {
      await visitAndAssertRoute(page, route.path, route.heading);
      const screenshot = await page.screenshot({ fullPage: false });
      expect(screenshot.length).toBeGreaterThan(10_000);
      await testInfo.attach(
        `feature-${route.path.replace(/[^a-z0-9]+/gi, "-")}-${testInfo.project.name}.png`,
        {
          body: screenshot,
          contentType: "image/png",
        },
      );
    }

    assertNoProblems();
  });

  test("keeps market context observational and out of execution-only conclusions", async ({
    page,
  }, testInfo) => {
    test.skip(
      !isDesktopProject(testInfo),
      "market-context text scan runs on desktop",
    );
    test.setTimeout(90_000);
    const assertNoProblems = collectPageProblems(page);

    for (const route of CORE_PRODUCT_ROUTES) {
      await visitAndAssertRoute(page, route.path, route.heading);
      const body = lowerBodyText(await page.locator("body").innerText());
      for (const phrase of MARKET_CONTEXT_OVERCLAIMS) {
        expect(
          body,
          `Market context overclaim appeared on ${route.path}: ${phrase}`,
        ).not.toContain(phrase);
      }
      if (route.path === "/analytics") {
        await page.goto("/analytics/review-plan");
        await expect(
          page.getByRole("heading", {
            exact: true,
            name: "Chart Data Status",
          }),
        ).toBeVisible();
        const analyticsBody = lowerBodyText(
          await page.locator("body").innerText(),
        );
        expect(analyticsBody).toContain("separate");
      }
      if (route.path === "/import-dry-run") {
        await page
          .getByTestId("import-dry-run-technical-diagnostics")
          .getByText("Show technical import diagnostics", { exact: true })
          .click();
        const diagnosticsBody = lowerBodyText(
          await page.locator("body").innerText(),
        );
        expect(diagnosticsBody).toContain("market context used: false");
        expect(diagnosticsBody).toContain(
          "daily/4h chart data facts can attach after server-side chart data review runs with levels-system data",
        );
        expect(diagnosticsBody).toContain(
          "lower-timeframe support/resistance coaching is intentionally deferred",
        );
      }
    }

    assertNoProblems();
  });

  test("keeps banned product claims out of core product routes", async ({
    page,
  }, testInfo) => {
    test.skip(!isDesktopProject(testInfo), "copy safety scan runs on desktop");
    test.setTimeout(90_000);
    const assertNoProblems = collectPageProblems(page);

    for (const route of CORE_PRODUCT_ROUTES) {
      await visitAndAssertRoute(page, route.path, route.heading);
      const rawBody = await page.locator("body").innerText();
      const body = lowerBodyText(rawBody);
      expect(
        rawBody,
        `Import-id-like trade label appeared on ${route.path}`,
      ).not.toMatch(/\b[A-Z]\d{5,}[A-Z]+\b/);
      for (const phrase of BANNED_PRODUCT_PHRASES) {
        expect(
          body,
          `Banned phrase appeared on ${route.path}: ${phrase}`,
        ).not.toContain(phrase);
      }
      for (const phrase of CONFUSING_PRIMARY_UI_PHRASES) {
        expect(
          body,
          `Confusing product phrase appeared on ${route.path}: ${phrase}`,
        ).not.toContain(phrase);
      }
    }

    assertNoProblems();
  });

  test("completes the demo user path across import, analytics, trade review, review, and progress", async ({
    page,
  }, testInfo) => {
    test.skip(!isDesktopProject(testInfo), "demo path runs on desktop");
    test.setTimeout(90_000);
    const assertNoProblems = collectPageProblems(page);
    const missingQuantityCsv = [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2026-05-01,09:30:00,ABCD,Buy,,10.00",
      "2026-05-01,09:35:00,ABCD,Sell,100,11.00",
    ].join("\n");

    await visitAndAssertRoute(page, "/workspace", "Trader Workspace");
    await page
      .getByRole("link", { exact: true, name: /Import Trades/i })
      .click();
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("heading", { exact: true, name: "Upload CSV" }),
    ).toBeVisible();
    await expect(page.getByTestId("upload-csv-card")).toBeVisible();
    await page.getByTestId("upload-csv-input").setInputFiles({
      buffer: Buffer.from(missingQuantityCsv),
      mimeType: "text/csv",
      name: "demo-path-missing-quantity.csv",
    });
    await page.getByTestId("upload-csv-submit").click();
    await expect(page.getByTestId("upload-csv-result")).toContainText(
      /quick check|needs/i,
      { timeout: 30000 },
    );
    await page.getByTestId("upload-csv-result-link").click();
    await page.waitForURL(/\/imports\/.+/, { timeout: 30000 });
    await expect(page.getByTestId("import-batch-action-summary")).toContainText(
      /repair|fix/i,
    );

    await page.goto("/import-dry-run");
    await page.waitForLoadState("networkidle");
    await openAdvancedUploadSettings(page);
    await page
      .getByTestId("broker-select")
      .selectOption("generic_execution_csv");
    await page.getByTestId("local-csv-input").setInputFiles({
      buffer: Buffer.from(missingQuantityCsv),
      mimeType: "text/csv",
      name: "demo-path-missing-quantity.csv",
    });
    await expect(page.getByTestId("row-repair-2-status")).toHaveText(
      "rejected",
    );
    await page.getByTestId("row-repair-2-quantity").fill("100");
    await expect(page.getByTestId("row-repair-2-status")).toHaveText(
      "accepted",
    );
    await openImportReviewDetails(page);
    await expect(
      page.getByRole("heading", {
        exact: true,
        name: "Execution Feedback Preview",
      }),
    ).toBeVisible();

    await visitAndAssertRoute(
      page,
      "/analytics",
      "Trading Performance Dashboard",
    );
    await visitAndAssertRoute(page, "/coach", "Your Trading Coach");
    await visitAndAssertRoute(page, "/trades", "Saved Trades");

    await visitAndAssertRoute(page, "/review", shell.guidedReview.title);
    await visitAndAssertRoute(page, "/progress", "Trader Progress");

    assertNoProblems();
  });
});
