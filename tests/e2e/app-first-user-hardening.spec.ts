import { Buffer } from "node:buffer";
import { expect, test, type Page, type TestInfo } from "@playwright/test";

import { buildProductWorkflowShellViewModel } from "../../src/lib/trader-analytics";

const shell = buildProductWorkflowShellViewModel();

const FIRST_RUN_ROUTES = [
  { heading: "TradersLink Trading Tools", path: "/" },
  { heading: "First Run Setup", path: "/first-run" },
  { heading: "Upload CSV", path: "/upload-csv" },
  { heading: "Import Trades", path: "/import-dry-run" },
  { heading: "Trading Performance Dashboard", path: "/analytics" },
  { heading: "Saved Trades", path: "/trades" },
] as const;

const PRODUCT_TRUTHFULNESS_ROUTES = [
  { heading: "TradersLink Trading Tools", path: "/" },
  { heading: "First Run Setup", path: "/first-run" },
  { heading: "Upload CSV", path: "/upload-csv" },
  { heading: "Import Trades", path: "/import-dry-run" },
  { heading: "Trading Performance Dashboard", path: "/analytics" },
  { heading: shell.guidedReview.title, path: "/review" },
  { heading: "Trader Progress", path: "/progress" },
  { heading: "Saved Trades", path: "/trades" },
] as const;

const BROKEN_PAGE_PHRASES = [
  "Application error",
  "Unhandled Runtime Error",
  "Internal Server Error",
  "Hydration failed",
  "ChunkLoadError",
];

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
  "support/resistance-backed import",
  "candle-confirmed rule",
];

const CSV_ABUSE_CASES = [
  {
    name: "blank",
    broker: "generic_execution_csv",
    csvText: "",
    expected: "CSV text is empty",
  },
  {
    name: "header-only",
    broker: "generic_execution_csv",
    csvText: "Date,Time,Symbol,Side,Quantity,Price",
    expected: "0 grouped trade(s)",
  },
  {
    name: "semicolon-delimiter",
    broker: "generic_execution_csv",
    csvText: [
      "Date;Time;Symbol;Side;Quantity;Price",
      "2026-05-01;09:30:00;ABCD;Buy;100;10.00",
      "2026-05-01;09:45:00;ABCD;Sell;100;10.50",
    ].join("\n"),
    expected: "Execution Feedback Preview",
  },
  {
    name: "duplicated-headers",
    broker: "generic_execution_csv",
    csvText: [
      "Date,Date,Symbol,Side,Quantity,Price",
      "2026-05-01,09:30:00,ABCD,Buy,100,10.00",
      "2026-05-01,09:45:00,ABCD,Sell,100,10.50",
    ].join("\n"),
    expected: "Import Session Summary",
  },
  {
    name: "bad-numeric-format",
    broker: "generic_execution_csv",
    csvText: [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2026-05-01,09:30:00,ABCD,Buy,abc,10.00",
      "2026-05-01,09:45:00,ABCD,Sell,100,bad-price",
    ].join("\n"),
    expected: "Invalid price or share size",
  },
  {
    name: "mixed-options-like-row",
    broker: "generic_execution_csv",
    csvText: [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2026-05-01,09:30:00,AAPL250101C00100000,Buy,1,2.50",
      "2026-05-01,09:35:00,AAPL250101C00100000,Sell,1,2.90",
      "2026-05-01,09:45:00,AAPL,Buy,100,180.00",
      "2026-05-01,10:15:00,AAPL,Sell,100,181.00",
    ].join("\n"),
    expected: "Execution Feedback Preview",
  },
] as const;

function isDesktopProject(testInfo: TestInfo): boolean {
  return testInfo.project.name === "chromium-desktop";
}

function isFirefoxSmokeProject(testInfo: TestInfo): boolean {
  return testInfo.project.name === "firefox-smoke";
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
    broker: string;
    csvText: string;
    fileName: string;
  },
): Promise<void> {
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

async function openAdminSampleFiles(page: Page): Promise<void> {
  const details = page.getByTestId("import-dry-run-admin-sample-details");

  if ((await details.count()) === 0) {
    return;
  }

  const trigger = details.getByText("Show demo/admin sample files", {
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

function buildLargeCsv(pairCount = 80): string {
  const rows = ["Date,Time,Symbol,Side,Quantity,Price"];
  for (let index = 0; index < pairCount; index += 1) {
    const minute = String(index % 60).padStart(2, "0");
    const exitMinute = String((index + 1) % 60).padStart(2, "0");
    rows.push(`2026-05-01,09:${minute}:00,BIG${index},Buy,100,10.00`);
    rows.push(`2026-05-01,10:${exitMinute}:00,BIG${index},Sell,100,10.25`);
  }

  return rows.join("\n");
}

test.describe("first-user and hardening", () => {
  test("guides a first user from empty state into CSV upload and import feedback", async ({
    page,
  }, testInfo) => {
    test.skip(!isDesktopProject(testInfo), "first-user journey runs on desktop");
    const assertNoProblems = collectPageProblems(page);

    await visitAndAssert(page, "/first-run", "First Run Setup");
    await expect(page.getByTestId("first-run-status-grid")).toContainText(
      "No execution imports have been saved",
    );
    await expect(page.locator("body")).toContainText("No broker account is connected");
    await expect(page.locator("body")).toContainText(
      "No market-structure scoring is used",
    );
    await assertNoProductOverclaims(page);

    await page.getByTestId("first-run-action-upload-csv").click();
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("heading", { exact: true, name: "Upload CSV" }),
    ).toBeVisible();
    await expect(page.getByTestId("upload-csv-card")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Broker detection");
    await expect(page.locator("body")).not.toContainText("Automatic after upload");

    await page.goto("/import-dry-run");
    await page.waitForLoadState("networkidle");

    await uploadCsv(page, {
      broker: "generic_execution_csv",
      csvText: [
        "Date,Time,Symbol,Side,Quantity,Price",
        "2026-05-01,09:30:00,FIRST,Buy,,10.00",
        "2026-05-01,09:45:00,FIRST,Sell,100,10.50",
      ].join("\n"),
      fileName: "first-user-missing-quantity.csv",
    });
    await expect(page.getByTestId("row-repair-2-status")).toHaveText("rejected");
    await page.getByTestId("row-repair-2-quantity").fill("100");
    await expect(page.getByTestId("row-repair-2-status")).toHaveText("accepted");
    await openImportReviewDetails(page);
    await expect(page.getByTestId("execution-readiness-summary")).toContainText(
      "Execution ready",
    );
    await expect(page.getByTestId("execution-readiness-summary")).toContainText(
      "write safety: dry-run only",
    );
    await expect(page.getByTestId("execution-readiness-summary")).toContainText(
      "gross-only",
    );
    await expect(
      page.getByRole("heading", {
        exact: true,
        name: "Execution Feedback Preview",
      }),
    ).toBeVisible();
    await expect(
      page.getByText("Show privacy, decision, and QA notes", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText(
      "No saved import is created here.",
      { exact: true },
    )).toBeHidden();

    assertNoProblems();
  });

  test("keeps no-trades empty state honest and missing trades safe", async ({
    page,
  }, testInfo) => {
    test.skip(!isDesktopProject(testInfo), "empty-state boundary runs on desktop");

    await visitAndAssert(page, "/first-run", "First Run Setup");
    await expect(page.locator("body")).toContainText("no saved trades yet");
    await expect(page.locator("body")).not.toContainText(
      "Your latest analytics are ready",
    );
    await expect(page.getByTestId("first-run-action-upload-csv")).toBeVisible();

    const missingResponse = await page.goto("/trades/not-a-real-trade-id");
    expect(missingResponse?.status()).toBe(404);
    await expect(page.locator("body")).toContainText(
      "This page could not be found",
    );
  });

  test("crawls workspace internal links without route failures", async ({
    page,
  }, testInfo) => {
    test.skip(!isDesktopProject(testInfo), "link crawler runs on desktop");
    test.setTimeout(120_000);
    const assertNoProblems = collectPageProblems(page);

    await visitAndAssert(page, "/workspace", "Trader Workspace");
    const links = await page.locator('a[href^="/"]').evaluateAll((anchors) => {
      const hrefs = new Set<string>();
      for (const anchor of anchors) {
        const href = anchor.getAttribute("href");
        if (!href || href.startsWith("/api/") || href.includes("#")) {
          continue;
        }
        hrefs.add(href);
      }

      return Array.from(hrefs).sort();
    });

    expect(links).toContain("/first-run");
    for (const href of links) {
      const response = await page.goto(href);
      await page.waitForLoadState("networkidle");
      expect(response?.status(), `Unexpected HTTP status for ${href}`).toBeLessThan(
        400,
      );
      await expect(
        page.locator("body"),
        `Route unexpectedly rendered 404 copy: ${href}`,
      ).not.toContainText("This page could not be found");
      await assertNoBrokenPageCopy(page);
    }

    assertNoProblems();
  });

  test("keeps core controls accessible and keyboard reachable", async ({
    page,
  }, testInfo) => {
    test.skip(!isDesktopProject(testInfo), "accessibility smoke runs on desktop");
    const assertNoProblems = collectPageProblems(page);

    await visitAndAssert(page, "/import-dry-run", "Import Trades");
    await expect(page.locator("body")).not.toContainText("Broker detection");
    await expect(page.locator("body")).not.toContainText("Automatic after upload");
    await expect(page.getByTestId("sample-select")).toBeHidden();
    await expect(page.getByTestId("broker-select")).toBeHidden();
    await expect(page.getByLabel("Account Timezone", { exact: true })).toBeHidden();
    await expect(page.getByTestId("local-csv-input")).toBeAttached();
    await expect(page.getByTestId("csv-textarea")).toBeHidden();
    await page.getByTestId("local-csv-input").focus();
    await expect(page.getByTestId("local-csv-input")).toBeFocused();

    await openAdvancedUploadSettings(page);
    await expect(page.getByTestId("broker-select")).toBeVisible();
    await expect(page.getByLabel("Account Timezone", { exact: true })).toBeVisible();
    await openAdminSampleFiles(page);
    await expect(page.getByTestId("sample-select")).toBeVisible();

    await uploadCsv(page, {
      broker: "generic_execution_csv",
      csvText: [
        "Trading Symbol,Executed At,Instruction,Filled Shares,Fill Price",
        "PLTR,2026-05-01 09:30:00,Buy,100,20.00",
        "PLTR,2026-05-01 10:00:00,Sell,100,21.00",
      ].join("\n"),
      fileName: "accessibility-mapping.csv",
    });
    await openImportReviewDetails(page);
    for (const field of ["symbol", "timestamp", "side", "quantity", "price"]) {
      await expect(page.getByTestId(`mapping-field-${field}`)).toBeEnabled();
    }

    await visitAndAssert(
      page,
      "/analytics/trade-explorer",
      "Trading Performance Dashboard",
    );
    for (const testId of [
      "analytics-filter-symbol",
      "analytics-filter-direction",
      "analytics-filter-session",
      "analytics-filter-outcome",
      "analytics-filter-lifecycle",
    ]) {
      await expect(page.getByTestId(testId)).toBeEnabled();
    }

    assertNoProblems();
  });

  test("smoke-tests first-run routes in Firefox", async ({ page }, testInfo) => {
    test.skip(!isFirefoxSmokeProject(testInfo), "Firefox smoke runs only in Firefox");
    test.setTimeout(90_000);
    const assertNoProblems = collectPageProblems(page);

    for (const route of FIRST_RUN_ROUTES) {
      await visitAndAssert(page, route.path, route.heading);
    }

    assertNoProblems();
  });

  test("keeps key rough-product routes within local performance smoke limits", async ({
    page,
  }, testInfo) => {
    test.skip(!isDesktopProject(testInfo), "performance smoke runs on desktop");
    test.setTimeout(120_000);
    const assertNoProblems = collectPageProblems(page);
    const thresholdMs = 12_000;

    for (const route of FIRST_RUN_ROUTES) {
      const startedAt = Date.now();
      await visitAndAssert(page, route.path, route.heading);
      const elapsedMs = Date.now() - startedAt;
      expect(
        elapsedMs,
        `Local route load exceeded ${thresholdMs}ms for ${route.path}`,
      ).toBeLessThan(thresholdMs);
    }

    assertNoProblems();
  });

  test("handles abusive CSV dry-run inputs without crashing", async ({
    page,
  }, testInfo) => {
    test.skip(!isDesktopProject(testInfo), "CSV abuse matrix runs on desktop");
    test.setTimeout(120_000);
    const assertNoProblems = collectPageProblems(page);

    await visitAndAssert(page, "/import-dry-run", "Import Trades");
    for (const csvCase of CSV_ABUSE_CASES) {
      await uploadCsv(page, {
        broker: csvCase.broker,
        csvText: csvCase.csvText,
        fileName: `abuse-${csvCase.name}.csv`,
      });
      await openImportReviewDetails(page);
      await expect(page.locator("body")).toContainText(csvCase.expected);
      await assertNoBrokenPageCopy(page);
      await assertNoProductOverclaims(page);
    }

    await uploadCsv(page, {
      broker: "generic_execution_csv",
      csvText: buildLargeCsv(),
      fileName: "abuse-large.csv",
    });
    await openImportReviewDetails(page);
    await expect(page.locator("body")).toContainText("Execution Feedback Preview");
    await expect(page.locator("body")).toContainText("BIG0");
    await assertNoProductOverclaims(page);

    assertNoProblems();
  });

  test("keeps product truthfulness boundaries across core routes", async ({
    page,
  }, testInfo) => {
    test.skip(!isDesktopProject(testInfo), "truthfulness scan runs on desktop");
    const assertNoProblems = collectPageProblems(page);

    for (const route of PRODUCT_TRUTHFULNESS_ROUTES) {
      await visitAndAssert(page, route.path, route.heading);
      await assertNoProductOverclaims(page);
    }

    assertNoProblems();
  });
});
