import { expect, test, type Page, type TestInfo } from "@playwright/test";

interface SeededSavedImport {
  batchId: string;
  symbol: string;
  tradeId: string;
}

const BROKEN_PAGE_PHRASES = [
  "Application error",
  "Unhandled Runtime Error",
  "Internal Server Error",
  "Hydration failed",
  "ChunkLoadError",
];

function visualSymbol(testInfo: TestInfo): string {
  const project = testInfo.project.name.includes("mobile")
    ? "M"
    : testInfo.project.name.includes("tablet")
      ? "T"
      : "D";
  const seed = Date.now() + testInfo.workerIndex;
  const first = String.fromCharCode(65 + (seed % 26));
  const second = String.fromCharCode(65 + (Math.floor(seed / 26) % 26));
  const worker = String.fromCharCode(65 + (testInfo.workerIndex % 26));

  return `VS${first}${second}${project}${worker}`;
}

async function seedSavedImport(
  page: Page,
  testInfo: TestInfo,
): Promise<SeededSavedImport> {
  const symbol = visualSymbol(testInfo);
  const csvText = [
    "Date,Time,Symbol,Side,Quantity,Price",
    `2026-05-01,09:30:00,${symbol},Buy,100,10.00`,
    `2026-05-01,10:00:00,${symbol},Sell,100,10.55`,
  ].join("\n");
  const payload = {
    csvText,
    broker: "generic_execution_csv",
    accountTimezone: "America/New_York",
    acknowledgements: {
      mappingReview: true,
      pnlReview: true,
    },
  };
  const preview = await page.request.post("/api/import-batches/preview", {
    data: payload,
  });
  expect(preview.ok()).toBe(true);
  const previewBody = await preview.json();
  const batchId = previewBody.plan.batch.id as string;
  const commit = await page.request.post(
    `/api/import-batches/${encodeURIComponent(batchId)}/commit`,
    { data: payload },
  );
  expect(commit.ok()).toBe(true);

  const tradesResponse = await page.request.get("/api/trades");
  expect(tradesResponse.ok()).toBe(true);
  const tradesBody = await tradesResponse.json();
  const trade = tradesBody.trades.find(
    (candidate: { symbol: string }) => candidate.symbol === symbol,
  );
  expect(trade).toBeTruthy();

  return { batchId, symbol, tradeId: trade.id };
}

async function assertNoPageOverflow(page: Page, label: string): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(
    dimensions.scrollWidth,
    `Page-level horizontal overflow on ${label}: scrollWidth ${dimensions.scrollWidth}, clientWidth ${dimensions.clientWidth}`,
  ).toBeLessThanOrEqual(dimensions.clientWidth + 2);
}

async function assertHealthyPage(page: Page, label: string): Promise<void> {
  await page.waitForLoadState("networkidle");
  await expect(page.locator("body")).not.toHaveText("");
  const bodyText = await page.locator("body").innerText();

  for (const phrase of BROKEN_PAGE_PHRASES) {
    expect(
      bodyText,
      `Broken page phrase appeared on ${label}: ${phrase}`,
    ).not.toContain(phrase);
  }

  await assertNoPageOverflow(page, label);
}

async function visitAndCapture(
  page: Page,
  testInfo: TestInfo,
  args: {
    assert: () => Promise<void>;
    label: string;
    path: string;
  },
): Promise<void> {
  await page.goto(args.path);
  await assertHealthyPage(page, args.label);
  await args.assert();
  const screenshot = await page.screenshot({ fullPage: false });
  expect(screenshot.length).toBeGreaterThan(10_000);
  await testInfo.attach(`saved-import-${args.label}.png`, {
    body: screenshot,
    contentType: "image/png",
  });
}

test.describe("saved import visual and overflow pass", () => {
  test("keeps saved-import routes readable after a committed import", async ({
    page,
  }, testInfo) => {
    test.setTimeout(120_000);
    const seeded = await seedSavedImport(page, testInfo);

    const routes = [
      {
        label: "import-dry-run",
        path: "/import-dry-run",
        assert: async () => {
          await expect(
            page.getByRole("heading", { exact: true, name: "Import Trades" }),
          ).toBeVisible();
          await expect(page.getByTestId("import-dry-run-client")).toBeVisible();
        },
      },
      {
        label: "imports",
        path: "/imports",
        assert: async () => {
          await expect(
            page.getByRole("heading", {
              exact: true,
              name: "CSV Import Review",
            }),
          ).toBeVisible();
          await expect(page.getByTestId("import-recovery-queue")).toBeVisible();
          await expect(page.getByText("Saved import").first()).toBeVisible();
        },
      },
      {
        label: "import-batch",
        path: `/imports/${encodeURIComponent(seeded.batchId)}`,
        assert: async () => {
          await expect(
            page.getByRole("heading", { exact: true, name: "Saved Import" }),
          ).toBeVisible();
          await expect(
            page.getByTestId("import-batch-action-summary"),
          ).toContainText("Saved import");
          await expect(
            page.getByTestId("import-recovery-actions"),
          ).toBeVisible();
          await page
            .getByText("Advanced import and chart details", { exact: true })
            .click();
          await expect(
            page.getByTestId("decision-review-diagnostics"),
          ).toContainText("evidence limits");
          await expect(
            page.getByTestId("import-batch-saved-trades"),
          ).toContainText("Open trade review");
          await expect(page.getByText(seeded.symbol).first()).toBeVisible();
        },
      },
      {
        label: "trades",
        path: "/trades",
        assert: async () => {
          await expect(
            page.getByRole("heading", { exact: true, name: "Saved Trades" }),
          ).toBeVisible();
          await expect(page.getByText(seeded.symbol).first()).toBeVisible();
        },
      },
      {
        label: "trade-detail",
        path: `/trades/${encodeURIComponent(seeded.tradeId)}`,
        assert: async () => {
          await expect(page.getByTestId("trade-review-page")).toBeVisible();
          await expect(page.getByText(seeded.symbol).first()).toBeVisible();
          await expect(
            page.getByTestId("trade-execution-replay"),
          ).toBeVisible();
        },
      },
      {
        label: "analytics",
        path: "/analytics",
        assert: async () => {
          await expect(
            page.getByRole("heading", {
              exact: true,
              name: "Trading Performance Dashboard",
            }),
          ).toBeVisible();
          await expect(
            page.getByTestId("saved-review-summary-strip"),
          ).toBeVisible();
        },
      },
      {
        label: "coach-next-session",
        path: "/coach/next-session",
        assert: async () => {
          await expect(
            page.getByTestId("coach-next-session-plan"),
          ).toBeVisible();
          await expect(page.getByText("chart claims gated")).toBeVisible();
        },
      },
      {
        label: "coach-details",
        path: "/coach/details",
        assert: async () => {
          await expect(
            page.getByTestId("coach-supporting-details"),
          ).toContainText(
            "Supporting coach evidence, queue totals, and rule checks",
          );
          await expect(
            page.getByTestId("saved-review-summary-strip"),
          ).toBeVisible();
          await expect(page.getByText("chart claims gated")).toBeVisible();
        },
      },
      {
        label: "review",
        path: "/review?queue=highest_priority",
        assert: async () => {
          await expect(page.getByTestId("saved-review-queue")).toBeVisible();
          await expect(
            page.getByTestId("saved-review-queue-tabs"),
          ).toContainText("Highest Priority");
        },
      },
    ];

    for (const route of routes) {
      await visitAndCapture(page, testInfo, route);
    }
  });
});
