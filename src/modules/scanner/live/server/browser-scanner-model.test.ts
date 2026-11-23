import { expect, it } from "vitest";
import { browserScannerModel } from "./browser-scanner-model";
import type { ScannerReadModel, LiveScannerRow } from "../contracts";

it("keeps scanner rankings and facts while omitting supplier tags from every public row placement", () => {
  const row = { symbol: "SHFS", price: .0288, provider: "alpaca", activity: { oneMinuteVolume: 100 }, focusedAtUtc: "2026-11-19T14:30:00Z" } as unknown as LiveScannerRow & { focusedAtUtc: string };
  const screen = { rows: [row], focus: [row], total: 1,
    momentumSections: { confirmed: [row], early: [row], confirmedTotal: 1, earlyTotal: 1 } };
  const firstId = "alpaca:SHFS:2026-11-19T14:30:00Z";
  const model = { provider: "alpaca", gainers: screen, momentum: screen, dayGainers: screen,
    breakouts: [{ ...row, breakoutLevel: .0277 }], activeHalts: [
      { id: firstId, source: "alpaca", ticker: "SHFS", reasonCode: "LUDP", tradeTimeEt: "09:35:00" },
      { id: "alpaca:LSE:2026-11-19T14:30:00Z", source: "alpaca", ticker: "LSE", reasonCode: "LUDP" },
    ],
  } as unknown as ScannerReadModel;
  const publicModel = browserScannerModel(model);
  expect(JSON.stringify(publicModel)).not.toContain("alpaca");
  expect(publicModel.gainers.rows[0].price).toBe(.0288);
  expect(publicModel.momentum.momentumSections?.early).toHaveLength(1);
  expect(publicModel.activeHalts?.[0].tradeTimeEt).toBe("09:35:00");
  const ids = publicModel.activeHalts?.map(halt => halt.id);
  expect(ids?.every(id => /^[a-f0-9]{64}$/.test(id))).toBe(true);
  expect(new Set(ids).size).toBe(2);
  expect(browserScannerModel(model).activeHalts?.map(halt => halt.id)).toEqual(ids);
  expect(model.activeHalts?.[0].id).toBe(firstId);
  expect(model.gainers.rows[0].provider).toBe("alpaca");
});

it("normalizes supplier-specific or unexpected scanner failures without mutating the internal model",()=>{
  const model={gainers:{rows:[],focus:[],total:0},momentum:{rows:[],focus:[],total:0},issues:['alpaca_session_warming','snapshot_pass_unavailable','finnhub token=private-value']} as unknown as ScannerReadModel;
  expect(browserScannerModel(model).issues).toEqual(['session_warming','snapshot_pass_unavailable','market_data_unavailable']);
  expect(model.issues[0]).toBe('alpaca_session_warming');
});
