import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";
import { beforeEach, describe, expect, it, vi } from "vitest";

const ids = vi.hoisted(() => ({ first: "00000000-0000-4000-8000-000000000001", second: "00000000-0000-4000-8000-000000000002", group: "00000000-0000-4000-8000-000000000003", account: "00000000-0000-4000-8000-000000000004" }));
const data = vi.hoisted(() => ({ missing: false, transaction: false }));
vi.mock("@/src/modules/platform/server/authentication/require-platform-request-scope", () => ({ requireTraderLinkPlatformRequestScope: () => ({ workspaceId: "w", userId: "u", workspaceRole: "owner", activeAccountId: ids.account, allowedAccountIds: [ids.account] }) }));
vi.mock("@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime", () => ({ withJournalAnalyticsReportingDashboardRuntime: async (_scope: unknown, callback: (input: unknown) => unknown) => callback({ reportingCurrency: "USD", reportingContext: { sourceCurrencyByRoundTrip: new Map(), sourceDateByRoundTrip: new Map() } }) }));
vi.mock("@/src/modules/platform/server/database/open-readonly-platform-database", () => ({ withReadonlyPlatformDatabase: (_options: unknown, callback: (db: unknown) => unknown) => callback({
  transaction: (read: () => unknown) => () => { data.transaction = true; try { return read(); } finally { data.transaction = false; } },
  prepare: (sql: string) => ({ all: (_workspace: string, _account: string, ...selected: string[]) => {
    if (sql.includes("AS rule_title")) return [];
    if (sql.includes("AS tags_text")) return selected.filter((id) => !data.missing || id !== ids.second).map((id) => ({ round_trip_id: id, rule_review_count: 0, tags_text: "", technical_note: "", trade_note: "" }));
    return selected.flatMap((id) => [
      { round_trip_id: id, execution_id: "split", executed_at_utc: "2026-09-11T14:00:00Z", side: "buy", quantity_decimal: id === ids.first ? "20" : "30", price_decimal: "1" },
      { round_trip_id: id, execution_id: id + "exit", executed_at_utc: "2026-09-11T14:01:00Z", side: "sell", quantity_decimal: id === ids.first ? "20" : "30", price_decimal: "2" },
    ]);
  } }),
}) }));
vi.mock("@/src/modules/journal/server/trade-story/selected-trade-execution-members", async (importOriginal) => ({
  ...await importOriginal<object>(),
  selectedTradeExecutionMembers: (_db: unknown, _scope: unknown, selectionId: string) => {
    if (!data.transaction) throw new Error("Outside transaction");
    return { selectionId, memberIds: [ids.first, ids.second] };
  },
}));
import { GET } from "@/app/api/platform/journal/calendar/ticker-details/route";

const source = (path: string) => readFileSync(resolve(path), "utf8");
function callbackBody(path: string, start: string, end: string) {
  const value = source(path);
  const offset = value.indexOf(start);
  if (offset < 0) throw new Error("Callback not found");
  return value.slice(offset + start.length, value.indexOf(end, offset));
}
function compile(body: string) { return ts.transpile(body, { target: ts.ScriptTarget.ES2022 }); }

describe("selected trade execution endpoint", () => {
  beforeEach(() => { data.missing = false; });
  it("keeps the default endpoint per-member", async () => {
    const response = await GET(new Request(`https://test/api?roundTripIds=${ids.first}`));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.trades[0].executions).toHaveLength(2);
  });
  it.each(["first", "second", "group"] as const)("echoes %s and returns all allocations without dropping a shared execution", async (key) => {
    const response = await GET(new Request(`https://test/api?selection=trade&roundTripIds=${ids[key]}`));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.trades[0].roundTripId).toBe(ids[key]);
    expect(body.trades[0].executions.map((row: { quantity_decimal: string }) => row.quantity_decimal)).toEqual(["20", "30", "20", "30"]);
  });
  it("does not return a successful partial group", async () => {
    data.missing = true;
    const response = await GET(new Request(`https://test/api?selection=trade&roundTripIds=${ids.first}`));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ status: "error" });
  });
});

describe("execution display consumers", () => {
  it("opts all four per-member execution consumers into whole-trade selection", () => {
    for (const path of ["app/(dashboard)/analytics/trade-explorer/trade-explorer-client.tsx", "app/(dashboard)/calendar/calendar-client.tsx", "app/(dashboard)/analytics/trade-detail-drawer.tsx"]) {
      const urls = source(path).match(/\/api\/platform\/journal\/calendar\/ticker-details\?[^`]+/gu)!;
      expect(urls.length).toBeGreaterThan(0);
      expect(urls.every((url) => url.includes("selection=trade&roundTripIds="))).toBe(true);
    }
  });
  it("Calendar ignores an old selection and rejects a smaller lazy execution list", () => {
    const body = callbackBody("app/(dashboard)/calendar/calendar-client.tsx", ").then((result) => {", "}).catch");
    const state = vi.fn();
    const invoke = new Function("result", "controller", "expandedTickerRoundTripIds", "expandedTickerExecutionCounts", "expandedTickerRequestKey", "setTickerDetailState", compile(body));
    const result = { trades: [{ roundTripId: ids.first, executions: [{}, {}, {}, {}] }] };
    invoke(result, { signal: { aborted: true } }, ids.first, JSON.stringify([[ids.first, 4]]), "old", state);
    expect(state).not.toHaveBeenCalled();
    invoke(result, { signal: { aborted: false } }, ids.first, JSON.stringify([[ids.first, 4]]), "current", state);
    expect(state).toHaveBeenCalledOnce();
    expect(() => invoke({ trades: [{ roundTripId: ids.first, executions: [{}] }] }, { signal: { aborted: false } }, ids.first, JSON.stringify([[ids.first, 4]]), "current", state)).toThrow();
    expect(() => invoke(result, { signal: { aborted: false } }, ids.second, "[]", "current", state)).toThrow();
  });
  it("shared Details resolves the selected member into the whole logical trade", () => {
    const reader = source("src/modules/journal/server/trade-story/journal-trade-story-read-service.ts");
    expect(reader).toContain("findByRoundTripId(account, roundTripId)");
    expect(reader).toContain("members.flatMap((member) => member.executions)");
  });
  it("shared Details ignores completion from a selection already closed or changed", () => {
    const body = callbackBody("app/(dashboard)/trades/trade-details-drawer.tsx", ").then((details) => {", "}).catch");
    const setState = vi.fn();
    const invoke = new Function("details", "controller", "setState", compile(body));
    invoke({ symbol: "OLD" }, { signal: { aborted: true } }, setState);
    expect(setState).not.toHaveBeenCalled();
  });
});
