// @vitest-environment node
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it, vi } from "vitest";

import {
  GET,
  POST as runCustomScan,
  PUT,
} from "@/app/api/scanners/custom/route";
import { build } from "esbuild";

import type { SavedScan, ScanDefinition, ScanResult } from "../definition";
import { CustomScanMarket } from "../market";

const state = vi.hoisted(() => ({
  directory: "",
  admitted: new Set(["alice", "bob"]),
  workspace: new Set<string>(),
  open: vi.fn(),
  news: vi.fn(),
}));
vi.mock(
  "@/src/modules/platform/server/authentication/require-platform-request-scope",
  () => ({
    requireTraderLinkPlatformRequestIdentity: (headers: Headers) => {
      const userId = headers.get("x-actor");
      if (!userId) throw Error("unauthenticated");
      return { scope: { userId } };
    },
  }),
);
vi.mock(
  "@/src/modules/market-data/server/market-tools-dashboard-access",
  () => ({
    hasScannerDashboardAccess: (identity: { scope: { userId: string } }) =>
      state.admitted.has(identity.scope.userId),
    hasMarketToolsDashboardReadAccess: (identity: {
      scope: { userId: string };
    }) =>
      state.admitted.has(identity.scope.userId) ||
      state.workspace.has(identity.scope.userId),
  }),
);
vi.mock("@/src/modules/scanner/live/server/runtime", () => ({
  openLiveCustomScans: state.open,
}));
vi.mock("@/src/modules/stock-screeners/press-releases", () => ({
  memberScannerPressReleaseRecords: state.news,
  memberScannerArticleHistory: state.news,
}));
vi.mock(
  "@/src/modules/platform/server/database/platform-database-config",
  () => ({
    resolvePlatformDatabaseConfig: () => ({
      databasePath: join(state.directory, "test.sqlite"),
    }),
  }),
);

import { chromium } from "playwright";
import { otherAuditFilters, companyFilterLabels } from "../audited-filters";
import {
  SCAN_METRICS,
  isSignedScanMetric,
  type ScanMetric,
} from "../definition";
import { candleStudyValue } from "../candle-study-values";
vi.mock("./refresh-accepted-level-breaks", () => ({
  refreshAcceptedScannerLevelBreaks: async () => () => ({
    reference: "zone",
    at: now - 60_000,
    setup: {
      direction: "up",
      lower: 0.4,
      upper: 0.5,
      targets: [
        {
          lower: 0.9,
          upper: 1,
          zoneId: "z",
          frame: "4h",
          side: "resistance",
          distance: 0.4,
        },
      ],
    },
  }),
}));
const shells: Record<string, string> = {
  "../screeners/live-screeners-client":
    "export const LiveScreenersClient=()=>null",
  "../press-releases/press-release-article-drawer":
    "export const PressReleaseArticleDrawer=()=>null",
  "next/dynamic": "export default ()=>()=>null",
  "@/app/dashboard-template":
    'import React from "react"; export function DashboardPanel({title,action,children}){return <section><h2>{title}</h2>{action}{children}</section>}',
  "../charts/market-chart": "export const MarketChart=()=>null",
  "../screeners/scanner-news-drawer-context":
    "export const ScannerNewsDrawerProvider=({children})=>children, ScannerRowNews=()=>null",
  "./share-saved-scan": "export const ShareSavedScan=()=>null",
  "./scanner-match-chart":
    "export const ScannerInlineMatch=()=>null, ScannerStudyReadings=()=>null",
};
async function editorBundle() {
  const output = await build({
    stdin: {
      contents:
        'import React from "react";import {createRoot} from "react-dom/client";import {CustomScannersClient} from "./app/(dashboard)/scanners/custom-scanners-client";createRoot(document.querySelector("#app")).render(<CustomScannersClient returnScope="regression"/>);',
      loader: "jsx",
      resolveDir: process.cwd(),
    },
    bundle: true,
    write: false,
    loader: { ".css": "empty" },
    jsx: "automatic",
    define: { "process.env.NODE_ENV": JSON.stringify("production") },
    plugins: [
      {
        name: "scanner-test-shell",
        setup(builder) {
          builder.onResolve({ filter: /.*/ }, (args) =>
            Object.hasOwn(shells, args.path)
              ? { path: args.path, namespace: "shell" }
              : undefined,
          );
          builder.onLoad({ filter: /.*/, namespace: "shell" }, (args) => ({
            contents: shells[args.path],
            loader: "jsx",
            resolveDir: process.cwd(),
          }));
        },
      },
    ],
  });
  return output.outputFiles[0].text;
}
const now = Date.parse("2026-11-19T15:01:05Z"),
  close = now - 5000;
it.skipIf(process.env.TRADERLINK_SCANNER_BROWSER_TEST !== "1")(
  "round trips every new filter together in Chromium",
  async () => {
    state.directory = mkdtempSync(join(tmpdir(), "audit-batch-"));
    const browser = await chromium.launch({
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
      args: ["--disable-dev-shm-usage", "--disable-gpu"],
    });
    const errors: string[] = [];
    const ids = Object.keys({
      ...otherAuditFilters,
      ...companyFilterLabels,
    }) as ScanMetric[];
    try {
      const wave = [
        6, 6.1, 6.2, 6, 5, 4.5, 4.7, 5, 6, 7, 6.5, 5.6, 5.1, 4.55, 4.8, 5, 6,
        6.4, 6.7, 7.5,
      ];
      const bars = Array.from({ length: 100 }, (_, i) => {
        const c = (i < 80 ? 4 + i / 100 : wave[i - 80]) / 10;
        return {
          open: c,
          close: c,
          high: c + 0.001,
          low: c - 0.001,
          vwap: c,
          volume: i + 1,
          time: i * 60,
        };
      });
      const market = new CustomScanMarket({
        attach: () => () => {},
        observe: () => {},
        pressRelease: () => undefined,
        indicator: () => undefined,
        candleStudy: (_s, _at, _frame, metric, period, fast, signal, pattern) =>
          candleStudyValue(metric, bars, period, bars, fast, signal, pattern),
        lastMinute: () => ({
          start: close - 60_000,
          close: 0.8,
          previous: 0.39,
          previousAt: close - 120000,
          lowPivot: { at: close - 180000, price: 0.38 },
          relativeVolume: 3,
          vwapCross: close,
        }),
        companyReadings: () => ({
          forms: ["8-K"],
          values: Object.fromEntries(
            Object.keys(companyFilterLabels).map((k) => [k, 10]),
          ),
        }),
      });
      const sample = {
        symbol: "FAST",
        exchange: "NASDAQ" as const,
        session: "regular" as const,
        volume: 0,
        observedAt: now - 300000,
        price: 0.45,
        sector: "Technology" as const,
        marketCap: 20e6,
        float: 2e6,
        dollarVolume: 100,
        dayChange: 30,
        belowHigh: 0,
      };
      market.set("open", now - 300000, "regular", [sample]);
      market.set("open", now, "regular", [
        {
          ...sample,
          volume: 50000,
          observedAt: now,
          priceSourceAt: now,
          halted: false,
          tradeResumedAt: close - 300000,
          openingRanges: { 5: { high: 0.5, low: 0.4 } },
          facts: {
            previousDayHigh: 0.5,
            premarketHigh: 0.6,
            largestTradeShares: 300,
            largestTradeDollars: 150,
            ipoAgeDays: 100,
            averageDailyDollars20: 300000,
          },
        },
        {
          ...sample,
          symbol: "HALT",
          halted: true,
          haltCode: "LUDP",
          float: null,
          observedAt: now,
        },
      ]);
      state.open.mockReturnValue({ market, close: () => {} });
      state.news.mockReturnValue([
        {
          symbol: "FAST",
          id: "later",
          publishedAt: close + 1,
          headline: "Later release",
          url: "https://example.test/2",
        },
        {
          symbol: "FAST",
          id: "first",
          publishedAt: close - 300000,
          headline: "FDA clearance",
          url: "https://example.test/1",
        },
      ]);
      const ctx = await browser.newContext({
        viewport: { width: 1440, height: 940 },
      });
      const page = await ctx.newPage();
      page.setDefaultTimeout(6000);
      page.on("pageerror", (e) => errors.push(e.message));
      const url = "http://127.0.0.1:31234/scanner";
      const script = await editorBundle();
      const frames: { def: ScanDefinition; result: ScanResult }[] = [];
      await ctx.route("**/*", async (route) => {
        const r = route.request(),
          path = new URL(r.url()).pathname;
        if (path === "/scanner")
          return route.fulfill({
            contentType: "text/html",
            body: '<!doctype html><html><body><div id="app"></div><script src="/editor.js"></script></body></html>',
          });
        if (path === "/editor.js")
          return route.fulfill({
            contentType: "text/javascript",
            body: script,
          });
        if (path !== "/api/scanners/custom") return route.abort();
        const method = r.method();
        const req = new Request(r.url(), {
          method,
          headers: {
            ...(await r.allHeaders()),
            "sec-fetch-site": "same-origin",
            "x-actor": "alice",
            origin: new URL(url).origin,
            host: new URL(url).host,
          },
          body: r.postData() ?? undefined,
        });
        const res =
          method === "POST"
            ? await runCustomScan(req)
            : method === "PUT"
              ? await PUT(req)
              : GET(req);
        let body = "";

        if (method === "POST" && res.ok) {
          const reader = res.body!.getReader();
          try {
            body = new TextDecoder().decode((await reader.read()).value);
            if (
              r
                .postDataJSON()[0]
                .definition.rules.some(
                  (rule: { metric: string }) => rule.metric === "zoneState",
                )
            )
              body = new TextDecoder().decode((await reader.read()).value);
          } finally {
            await reader.cancel();
          }
          const q = r.postDataJSON()[0];
          frames.push({ def: q.definition, result: JSON.parse(body)[q.key] });
        } else body = await res.text();
        return route
          .fulfill({
            status: res.status,
            contentType: res.headers.get("Content-Type")!,
            body,
          })
          .catch(() => {});
      });
      const name = "Nano filter audit batch";
      const click = (label: string) =>
        page.getByRole("button", { name: label, exact: true }).click();
      const select = async (label: string, choice: string) => {
        await page.getByRole("combobox", { name: label, exact: true }).click();
        await page.getByRole("option", { name: choice, exact: true }).click();
      };
      const ready = () =>
        page.waitForResponse(
          (r) =>
            r.request().method() === "GET" &&
            r.url().endsWith("/api/scanners/custom"),
        );
      const run = async () => {
        const n = frames.length;
        await click("Apply");
        await expect
          .poll(
            () =>
              frames.slice(n).find((f) => f.def.rules.length === ids.length)
                ?.result?.total,
            { timeout: 10000 },
          )
          .toBe(2);
        const f = frames
          .slice(n)
          .find((f) => f.def.rules.length === ids.length)!;
        expect(f.def.rules.map((r) => r.metric).sort()).toEqual(
          [...ids].sort(),
        );
        const matched = new Set(
          f.result.rows.flatMap((r) =>
            (r.matchedRuleIndexes ?? []).map(
              (i: number) => f.def.rules[i].metric,
            ),
          ),
        );
        expect(ids.filter((id) => !matched.has(id))).toEqual([]);
        await page
          .getByRole("button", {
            name: "Load FAST in the Scanner chart",
            exact: true,
          })
          .waitFor();
        return f.def;
      };
      const save = async (
        first: boolean,
        definition: unknown,
        scanName = name,
      ) => {
        await click(first ? "Save scan" : "Save changes");
        if (first) await page.getByLabel("Scan name").fill(scanName);
        const write = page.waitForResponse(
          (r) => r.request().method() === "PUT",
        );
        await page
          .getByRole("dialog")
          .getByRole("button", { name: "Save", exact: true })
          .click();
        const response = await write;
        expect(response.status()).toBe(200);
        expect(
          (await response.json()).scans.find(
            (s: SavedScan) => s.name === scanName,
          ).definition,
        ).toEqual(definition);
        await page.getByRole("dialog").waitFor({ state: "hidden" });
      };
      const got = ready();
      await page.goto(url);
      await got;
      await select("Match filters", "Any");
      await click("Add filter");
      const picker = page.getByRole("dialog", { name: "Add filter" });
      for (const id of ids)
        await picker
          .getByRole("checkbox", { name: SCAN_METRICS[id].label, exact: true })
          .check();
      await picker.getByRole("button", { name: /Add selected/ }).click();
      for (const id of ids) {
        const label = SCAN_METRICS[id].label;
        const group = page.getByRole("group", {
          name: label + " filter",
          exact: true,
        });
        const field = group.getByLabel(label + " minimum", { exact: true });
        if (await field.count())
          await field.fill(isSignedScanMetric(id) ? "-100000" : "0");
        if (id === "prHeadline")
          await group
            .getByLabel("Headline words or phrases")
            .fill("FDA; clinical trial");
        if (id === "haltCode")
          await group.getByLabel("Halt codes").fill("LUDP");
        if (id === "recentFiling")
          await group.getByLabel("SEC form types").fill("8-K; 10-Q");
      }
      const original = await run();
      await save(true, original);
      const read = ready();
      await page.reload();
      expect(
        (await (await read).json()).scans.find(
          (s: SavedScan) => s.name === name,
        ).definition,
      ).toEqual(original);
      await select("Scan", name);
      expect(await run()).toEqual(original);
      await save(false, original);
      const orderedName = "PR and halt follow-through";
      await select("Scan", "Blank scan");
      await click("Add filter");
      for (const id of ["prThenVwap", "resumeThenVolume"] as const) {
        await picker
          .getByRole("checkbox", { name: SCAN_METRICS[id].label, exact: true })
          .check();
      }
      await picker.getByRole("button", { name: /Add selected/ }).click();
      const applyOrdered = async () => {
        const start = frames.length;
        await click("Apply");
        const applied = () =>
          frames
            .slice(start)
            .find(
              (frame) =>
                frame.def.rules.length === 2 &&
                (frame.def.match ?? "all") === "all",
            );
        await expect
          .poll(() => applied()?.result.rows.map((row) => row.symbol))
          .toEqual(["FAST"]);
        expect(applied()!.result.rows[0].pressRelease?.id).toBe("first");
        return applied()!.def;
      };
      const ordered = await applyOrdered();
      await save(true, ordered, orderedName);
      const reload = ready();
      await page.reload();
      await reload;
      await select("Scan", orderedName);
      expect(await applyOrdered()).toEqual(ordered);
      expect(errors).toEqual([]);
      await ctx.close();
    } finally {
      await browser.close();
      rmSync(state.directory, { recursive: true, force: true });
    }
  },
  240000,
);
